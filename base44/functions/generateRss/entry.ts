import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { logStep } from "../../shared/sopLog.ts";

const SITE = "https://epoxyquotenearme.com";

function esc(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

// Generates an RSS 2.0 feed of published AI-generated guides. RSS helps search
// engines and AI aggregators discover new content faster than crawling. The
// feed is public (no auth) so crawlers can fetch it directly.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    const pages = await base44.asServiceRole.entities.GeneratedPage.list(50);
    const published = pages
      .filter((g) =>
        g.status === "published" &&
        g.index_eligible !== false &&
        g.sitemap_eligible !== false &&
        g.release_authorized !== false
      )
      .sort((a, b) => new Date(b.updated_date || b.created_date).getTime() - new Date(a.updated_date || a.created_date).getTime());

    const items = published.map((g) => {
      const link = `${SITE}/${g.slug}`;
      const pubDate = new Date(g.updated_date || g.created_date).toUTCString();
      const desc = esc(g.meta_description || g.intro || "");
      return `    <item>
      <title>${esc(g.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <description>${desc}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Epoxy Garage Floor Estimate — Guides</title>
    <link>${SITE}/guides</link>
    <description>Expert guides on epoxy garage floor costs, colors, installation, and maintenance.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      status: 200,
      headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}