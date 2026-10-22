/**
 * The site optimization menu: every technology in this app that fits, edits,
 * enhances, generates, validates or upgrades a website.
 *
 * Each entry does one of two things — applies a change to the live page
 * (kind: fix | layout | images | scan | copy | status), or opens the dedicated
 * tool that owns that technology (kind: link).
 *
 * `fix` ids are the same vocabulary the QA agents return, so a suggestion from
 * the agents and a menu entry are the same action.
 */

export const OPTIMIZER_GROUPS = [
  { id: 'flow', label: 'Work top down' },
  { id: 'fit', label: 'Fit it to you' },
  { id: 'edit', label: 'Edit the page' },
  { id: 'enhance', label: 'Enhance it' },
  { id: 'generate', label: 'Generate' },
  { id: 'validate', label: 'Validate & verify' },
  { id: 'upgrade', label: 'Upgrade & launch' },
];

export const OPTIMIZER_TOOLS = [
  // ── Work top down: one step, then the next ───────────────
  { id: 'transform', group: 'flow', kind: 'link', route: '/admin/prompt-chain', label: 'Prompt transformer', blurb: 'Step 1. One sentence in, the executable brief out — every step below works from it.' },
  { id: 'create-tool', group: 'flow', kind: 'link', route: '/admin/tool-hub', label: 'Create a tool', blurb: 'Step 2. Build the tool this page needs: a scraper, a generator, a checker.' },
  { id: 'generator', group: 'flow', kind: 'link', route: '/admin/one-click-factory', label: 'Generator', blurb: 'Step 3. Run the generator: profile, discovery, logos, build and validation in one pass.' },
  { id: 'apply', group: 'flow', kind: 'apply', label: 'Apply to my page', blurb: 'Step 4. Apply every waiting change at once — the page redraws and the scores at the top re-read the result.' },

  // ── Fit it to you ────────────────────────────────────────
  { id: 'install', group: 'fit', kind: 'status', label: 'Install my details', blurb: 'Your business name, phone, address, email, services and rating written into every block, and the template’s demonstration content removed. Always on.' },
  { id: 'layout', group: 'fit', kind: 'layout', label: 'Swap the layout style', blurb: 'Ten universal layout styles. Changing one re-draws the whole page with the same content.' },
  { id: 'editor', group: 'fit', kind: 'link', route: '/admin/visual-editor', label: 'Point, click & edit', blurb: 'Click any element on the live page and change its text, image or section.' },
  { id: 'studio', group: 'fit', kind: 'link', route: '/admin/template-studio', label: 'Template Studio', blurb: 'The full studio: sections, imagery, logo concepts, the page pack and publishing.' },

  // ── Edit the page ────────────────────────────────────────
  { id: 'seo-meta', group: 'edit', kind: 'fix', fix: 'seo_meta', label: 'Search title & description', blurb: 'The title and meta description search engines read, built from your business, trade and area.' },
  { id: 'faq', group: 'edit', kind: 'fix', fix: 'faq', label: 'Answer customer FAQs', blurb: 'Questions written from your own services — no invented facts.' },
  { id: 'services', group: 'edit', kind: 'fix', fix: 'expand_services', label: 'List every service I offer', blurb: 'One card per service, straight from your list.' },
  { id: 'area', group: 'edit', kind: 'fix', fix: 'service_area', label: 'Add my service area', blurb: 'A “Serving …” line on the page and in the footer.' },
  { id: 'why', group: 'edit', kind: 'fix', fix: 'differentiators', label: 'Show why customers pick me', blurb: 'Three reasons written from how the work is done.' },
  { id: 'headline', group: 'edit', kind: 'fix', fix: 'tighten_hero', label: 'Headline: trade + area', blurb: 'Leads the page with your trade and the area you serve.' },
  { id: 'phone-cta', group: 'edit', kind: 'fix', fix: 'cta_phone', label: 'Make my phone the main button', blurb: 'Every main button becomes a tap-to-call on mobile.' },
  { id: 'rating-band', group: 'edit', kind: 'status', label: 'Star rating block', blurb: 'Shown only when you told the wizard you have reviews, and removed when you have none. Contradicting ratings are dropped.' },
  { id: 'contents', group: 'edit', kind: 'link', route: '/admin/contents', label: 'Page content & menus', blurb: 'The content library, menus and categories behind the pages.' },
  { id: 'templates', group: 'edit', kind: 'link', route: '/admin/templates', label: 'Template Manager', blurb: 'Every template in the library, by industry and category.' },

  // ── Enhance it ───────────────────────────────────────────
  { id: 'copy', group: 'enhance', kind: 'copy', label: 'Rewrite the copy with AI', blurb: 'The copy agent writes a headline, one-line description and three reasons — from your own services only.' },
  { id: 'hero', group: 'enhance', kind: 'link', route: '/admin/hero-enhancer', label: 'Hero enhancer', blurb: 'Rebuild the hero section from a reference screenshot.' },
  { id: 'visuals', group: 'enhance', kind: 'link', route: '/admin/visual-library', label: 'Visual render library', blurb: 'Every rendered layout side by side, so a style can be judged before it ships.' },
  { id: 'social', group: 'enhance', kind: 'link', route: '/admin/social-studio', label: 'Social studio', blurb: 'Generate the social posts that point back at the page.' },
  { id: 'ab', group: 'enhance', kind: 'link', route: '/admin/ab-testing', label: 'A/B testing', blurb: 'Run two versions of a page against each other and keep the winner.' },

  // ── Generate ─────────────────────────────────────────────
  { id: 'photography', group: 'generate', kind: 'images', label: 'Generate 10 images', blurb: 'Ten photographs built from your trade and services. Pick the ones that fit; the first becomes the hero.' },
  { id: 'logos', group: 'generate', kind: 'link', route: '/admin/template-studio', label: 'Logo concepts', blurb: 'Ten transparent-background logos from your business name, exportable at print sizes.' },
  { id: 'industry-content', group: 'generate', kind: 'link', route: '/admin/website-factory', label: 'Industry content pack', blurb: 'Services, hooks, FAQs, phrases and trust signals for this trade.' },
  { id: 'one-click', group: 'generate', kind: 'link', route: '/admin/one-click-factory', label: 'One-click factory', blurb: 'Profile, discovery, logos, build and validation in a single run.' },
  { id: 'pack', group: 'generate', kind: 'link', route: '/admin/pack-sync', label: 'Page pack sync', blurb: 'Push the built page pack out to the sites that use it.' },
  { id: 'prompts', group: 'generate', kind: 'link', route: '/admin/prompt-testing', label: 'Prompt testing lab', blurb: 'Test and score the image prompts before they generate a site.' },

  // ── Validate & verify ────────────────────────────────────
  { id: 'agents', group: 'validate', kind: 'scan', label: 'QA + validation agents', blurb: 'Two independent agents re-read the finished page, quote what they found and score it. A disputed criterion cannot pass.' },
  { id: 'image-validation', group: 'validate', kind: 'link', route: '/admin/image-validator', label: 'Image validation', blurb: 'Checks every image slot against the approved registry for the industry.' },
  { id: 'fault-line', group: 'validate', kind: 'link', route: '/admin/fault-line', label: 'Fault line scanner', blurb: 'Scans a live site for breakages, speed, security and search faults, with a revenue estimate.' },
  { id: 'site-health', group: 'validate', kind: 'link', route: '/admin/site-health', label: 'Site health monitor', blurb: 'Uptime, load and search status tracked over time.' },
  { id: 'chain', group: 'validate', kind: 'link', route: '/admin/prompt-chain', label: 'Prompt chain console', blurb: 'The deterministic brief → build → independent verification chain, with its receipts.' },

  // ── Upgrade & launch ─────────────────────────────────────
  { id: 'seo', group: 'upgrade', kind: 'link', route: '/admin/factory', label: 'SEO factory', blurb: 'Build the search pages, clusters and schema around the site.' },
  { id: 'seo-generator', group: 'upgrade', kind: 'link', route: '/admin/seo-generator', label: 'SEO generator', blurb: 'Generate optimised pages from a keyword and location.' },
  { id: 'google', group: 'upgrade', kind: 'link', route: '/admin/google', label: 'Google readiness', blurb: 'Search Console properties, indexing status and readiness checks.' },
  { id: 'google-batch', group: 'upgrade', kind: 'link', route: '/admin/google-batch', label: 'Google batch submission', blurb: 'Submit the whole site to the indexers in one batch.' },
  { id: 'urls', group: 'upgrade', kind: 'link', route: '/admin/url-strategy', label: 'URL & slug strategy', blurb: 'The URL patterns the site is built on.' },
  { id: 'domains', group: 'upgrade', kind: 'link', route: '/admin/domain-rush', label: 'Domain gold rush', blurb: 'Find and check the domains the site can launch on.' },
  { id: 'multi-launch', group: 'upgrade', kind: 'link', route: '/admin/multi-launch', label: 'Multi-template launcher', blurb: 'Launch this design across many towns and trades.' },
  { id: 'command', group: 'upgrade', kind: 'link', route: '/admin/site-command', label: 'Site command center', blurb: 'Every built site, its status and its next action in one board.' },
  { id: 'analytics', group: 'upgrade', kind: 'link', route: '/admin/analytics', label: 'Analytics', blurb: 'Traffic and lead performance for the site.' },
];

/** The repairs the validator flags — what the Auto Fix button applies. */
export const AUTO_FIX_IDS = ['brand_name', 'contact_block', 'expand_services', 'service_area'];

/** The search, answer and local layers — what the Auto Optimize button applies. */
export const AUTO_OPTIMIZE_IDS = ['seo_meta', 'faq', 'differentiators', 'cta_phone', 'tighten_hero', 'ai_copy'];

export const toolsForGroup = groupId => OPTIMIZER_TOOLS.filter(tool => tool.group === groupId);
export const findTool = id => OPTIMIZER_TOOLS.find(tool => tool.id === id) || null;