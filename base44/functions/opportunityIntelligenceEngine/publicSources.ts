// Public, no-key evidence sources. These do not supply private social posts or paid search results.
const NEWS = 'https://www.bing.com/news/search?q=';
const NEWS_SUFFIX = '&format=rss';
const topics = {
  scan_social_media_trends: ['site:news.ycombinator.com Ask HN problems software', 'social media consumer complaints businesses'],
  scan_construction_trends: ['construction industry labor estimating scheduling problems', 'construction contractors software challenges'],
  scan_real_estate_trends: ['real estate agents investors homeowners problems technology', 'housing transactions property management challenges'],
  scan_ai_demand: ['business industry AI adoption survey demand', 'companies seeking AI automation industry'],
  scan_ai_problems: ['AI developer problems hallucination cost monitoring', 'AI software integration reliability complaints'],
  scan_ai_saturation: ['AI software market competitors niches category', 'AI startups crowded market underserved industries'],
  scan_south_florida_competitors: ['South Florida Miami Fort Lauderdale AI software development agency', 'Boca Raton West Palm Beach AI marketing technology agency'],
  scan_social_groups: ['South Florida business technology meetup entrepreneur networking', 'South Florida business groups AI websites digital services'],
  scan_construction_demand: ['contractors seeking estimating software automation app', 'construction companies seeking AI tools scheduling'],
  scan_networking_events: ['South Florida upcoming AI tech business conference September October 2026', 'Miami Fort Lauderdale construction real estate networking event 2026'],
  restaurant_ai_growth: ['restaurant AI inventory scheduling reservations case study', 'restaurant owners technology problems AI growth'],
};

function decode(text = '') {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, ' ').replace(/&(?:amp|lt|gt|quot|apos|#39|nbsp);/g, match => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#39;': "'", '&nbsp;': ' ' })[match] || match).replace(/\s+/g, ' ').trim();
}
function tag(item, name) {
  return decode(item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] || '');
}
async function request(url, accept = 'application/json') {
  const response = await fetch(url, { headers: { Accept: accept, 'User-Agent': 'OpportunityIntelligence/1.0 (public research)' }, signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return accept === 'application/json' ? response.json() : response.text();
}
async function rss(url, label) {
  const xml = await request(url, 'application/rss+xml, application/xml');
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0, 20).map(([, item]) => ({ title: tag(item, 'title'), url: tag(item, 'link'), description: tag(item, 'description'), date: tag(item, 'pubDate'), label })).filter(x => x.title && /^https?:\/\//.test(x.url));
}
async function github() {
  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const data = await request(`https://api.github.com/search/repositories?q=${encodeURIComponent(`created:>=${since}`)}&sort=stars&order=desc&per_page=20`);
  return (data.items || []).map(r => ({ title: r.full_name, url: r.html_url, description: `${r.description || 'No description'}; ${r.stargazers_count} stars; language: ${r.language || 'unknown'}`, date: r.created_at, label: 'GitHub public repositories' }));
}
async function hackerNews(query) {
  const data = await request(`https://hn.algolia.com/api/v1/search_by_date?${new URLSearchParams({ query, tags: 'story', hitsPerPage: '20' })}`);
  return (data.hits || []).filter(h => h.title && h.objectID).map(h => ({ title: h.title, url: `https://news.ycombinator.com/item?id=${encodeURIComponent(h.objectID)}`, description: decode(h.story_text || '').slice(0, 350), date: h.created_at, label: 'Hacker News public discussion' }));
}

export async function searchPublicSources(key) {
  const feeds = key === 'scan_google_trends'
    ? [() => rss('https://trends.google.com/trending/rss?geo=US', 'Google Trends US RSS')]
    : key === 'scan_github_trending'
      ? [github]
      : (topics[key] || []).map(q => () => rss(`${NEWS}${encodeURIComponent(q)}${NEWS_SUFFIX}`, 'Bing News public RSS feed'));
  if (['scan_social_media_trends', 'scan_ai_demand', 'scan_ai_problems', 'scan_ai_saturation', 'scan_construction_demand'].includes(key)) {
    const q = ({ scan_social_media_trends: 'Ask HN problem', scan_ai_demand: 'AI business', scan_ai_problems: 'AI problem', scan_ai_saturation: 'AI startups', scan_construction_demand: 'construction software' })[key];
    feeds.push(() => hackerNews(q));
  }
  if (key === 'scan_craigslist') {
    return { sources: [], claims: [], text: '', provider: 'Public sources', coverage: 'Craigslist blocks automated access to its public listings. No listings were retrieved; no leads were inferred from unrelated news.' };
  }
  const settled = await Promise.allSettled(feeds.map(fn => fn()));
  const failed = settled.filter(s => s.status === 'rejected').map(s => s.reason?.message || 'source unavailable');
  const items = settled.flatMap(s => s.status === 'fulfilled' ? s.value : []);
  const seen = new Set();
  const cutoff = Date.now() - 90 * 86400000;
  const unique = items.filter(x => {
    const published = Date.parse(x.date);
    if (!Number.isFinite(published) || published < cutoff || published > Date.now() + 86400000 || seen.has(x.url)) return false;
    seen.add(x.url);
    return true;
  }).slice(0, 35).map(x => {
    try {
      const link = new URL(x.url);
      if (link.hostname === 'www.bing.com' && link.pathname === '/news/apiclick.aspx') {
        const target = new URL(link.searchParams.get('url'));
        if (target.protocol === 'https:') return { ...x, url: target.href };
      }
    } catch { /* preserve the RSS link */ }
    return x;
  });
  const sources = unique.map((x, id) => ({ id, url: x.url, title: x.title, published_at: x.date || null, origin: x.label }));
  const claims = unique.map((x, id) => ({ text: `${x.title}. ${x.description}${x.date ? ` (published ${x.date})` : ''}`.slice(0, 550), source_ids: [id] }));
  const limits = {
    scan_google_trends: 'US trending-search feed; breakout growth and commercial demand are not independently measured here.',
    scan_github_trending: 'Recently created, most-starred public repositories; star growth over time is not measured.',
    scan_social_media_trends: 'Only publicly indexed news and Hacker News; no private Facebook, Instagram, TikTok, LinkedIn, X or Reddit posts.',
    scan_social_groups: 'Public news mentions only; group posts, memberships and member counts are not accessible.',
    scan_south_florida_competitors: 'Public news mentions only; not a complete local-business directory or pricing audit.',
    scan_networking_events: 'News mentions only; event dates and registration must be stated in a cited source to be included.',
    scan_ai_saturation: 'News and public discussions only; not a quantitative market-share or saturation study.',
  };
  const coverage = `${limits[key] || 'Public news and discussion excerpts only; not a comprehensive survey.'}${failed.length ? ` ${failed.length} source feed(s) unavailable: ${failed.join(', ')}.` : ''}`;
  return { sources, claims, text: claims.map((c, id) => `[${id}] ${c.text}`).join('\n'), provider: key === 'scan_google_trends' ? 'Google Trends public RSS' : key === 'scan_github_trending' ? 'GitHub public API' : 'Public news / Hacker News feeds', coverage };
}