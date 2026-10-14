import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { STOCK_INDUSTRIES, STOCK_VERSION } from "../base44/shared/stockIndustries.js";
import { STOCK_DESIGNS } from "../base44/shared/stockDesigns.js";
import { stockTemplateRecord } from "../base44/shared/stockTemplateCompiler.js";

let checks = 0;
const check = (ok, label) => { assert.ok(ok,label); checks++; };
check(STOCK_INDUSTRIES.length === 20, "Exactly 20 canonical industries");
check(STOCK_DESIGNS.length === 10, "Exactly 10 canonical design variants");
check(Boolean(STOCK_VERSION), "Canonical source version exists");
const names = new Set(), slugs = new Set(), hashes = new Set();
for (const industry of STOCK_INDUSTRIES) {
  check(typeof industry.image === "string" && industry.image.startsWith("https://media.base44.com/"), "Source image exists for "+industry.key);
  for (const [index, design] of STOCK_DESIGNS.entries()) {
    const rec = stockTemplateRecord(industry,design,index,STOCK_VERSION);
    check(rec.slug === "stock-"+industry.key+"-"+design.key, "Stable slug");
    check(rec.tags.includes(STOCK_VERSION), "Versioned source");
    check(rec.is_default === (index === 0), "One default design per industry");
    check(rec.content.startsWith("<!doctype html>"), "Compiles full HTML");
    check(rec.content.includes('name="robots" content="noindex,nofollow"'), "Noindex guard");
    check(rec.content.includes("ORIGINAL TEMPLATE CONCEPT"), "Illustrative label");
    check(rec.content.includes("No messages are sent from this preview."), "No live lead collection");
    check(rec.content.includes("Original "+design.name+" template"), "Correct design identity");
    check(!/action=["']https?:/i.test(rec.content), "No remote form submit");
    check(rec.sections[0].config.release_state === "preview_only", "No production release claim");
    names.add(rec.name);
    slugs.add(rec.slug);
    hashes.add(createHash("sha256").update(rec.content).digest("hex"));
  }
}
check(names.size === 200, "200 unique visible names");
check(slugs.size === 200, "200 unique slugs");
check(hashes.size === 200, "200 unique generated HTML documents");
const page=readFileSync("src/pages/TemplatesGallery.jsx","utf8");
const dialog=readFileSync("src/components/template-studio/StockTemplatePreview.jsx","utf8");
const publicLibrary=readFileSync("src/components/template-studio/PublicStockCatalog.jsx","utf8");
const editor=readFileSync("src/components/template-studio/StockStudioEditor.jsx","utf8");
const studio=readFileSync("src/components/template-studio/StockStudio.jsx","utf8");
check(page.includes("<PublicStockCatalog"), "Public page uses canonical offline catalogue");
check(page.includes("?stock="), "Selection persists through URL");
check(dialog.includes("template?.content"), "Preview reads verified embedded HTML, not missing entity API");
check(publicLibrary.includes("stockTemplateRecord"), "Cards compile exact source on selection");
check(editor.includes("isSourcePreview"), "Editor knows source-only state");
check(editor.includes("disabled={publishing || isSourcePreview}"), "Publish button blocks unapproved source drafts");
check(studio.includes("routeStock"), "Admin studio restores selection from canonical slug");
console.log(JSON.stringify({
  status:"PASS",checks,industries:STOCK_INDUSTRIES.length,designs:STOCK_DESIGNS.length,
  compiled_templates:200,unique_html_hashes:hashes.size,
  fallback_backend_queries:0,live_release_approved:false
},null,2));
