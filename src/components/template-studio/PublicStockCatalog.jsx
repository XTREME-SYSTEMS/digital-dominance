import React, { useMemo, useState } from "react";
import { STOCK_INDUSTRIES, STOCK_VERSION } from "../../../base44/shared/stockIndustries.js";
import { STOCK_DESIGNS } from "../../../base44/shared/stockDesigns.js";
import { stockTemplateRecord } from "../../../base44/shared/stockTemplateCompiler.js";
import StockTemplateCard from "@/components/template-studio/StockTemplateCard";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 24;
export const SOURCE_TEMPLATE_COUNT = STOCK_INDUSTRIES.length * STOCK_DESIGNS.length;

/**
 * Public read-only stock gallery compiled from the SAME versioned source used
 * by stockTemplateFactory. No Base44 credentials, entity API or outbound writes.
 * A record is created on selection, so 200 HTML pages are not generated up front.
 */
export default function PublicStockCatalog({ onSelect }) {
  const [industry, setIndustry] = useState("");
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const cards = useMemo(() => STOCK_INDUSTRIES.flatMap(ind => STOCK_DESIGNS.map((design, index) => ({
    id: "source-" + ind.key + "-" + design.key,
    name: ind.label + " / " + design.name,
    niche: ind.label,
    industry_key: ind.key,
    design_key: design.key,
    design_index: index,
    description: design.detail,
    preview_image_url: ind.image,
    slug: "stock-" + ind.key + "-" + design.key,
    is_default: index === 0,
    sort_order: index,
    source_version: STOCK_VERSION,
    preview_only: true,
  }))), []);
  const matches = useMemo(() => cards.filter(c => {
    const selectedIndustry = !industry || c.industry_key === industry;
    const t = search.trim().toLowerCase();
    return selectedIndustry && (!t || [c.name,c.description,c.industry_key].join(" ").toLowerCase().includes(t));
  }), [cards, industry, search]);
  const page = matches.slice(0, visible);
  const open = card => {
    const ind = STOCK_INDUSTRIES.find(x => x.key === card.industry_key);
    const design = STOCK_DESIGNS.find(x => x.key === card.design_key);
    if (!ind || !design) return;
    const data = stockTemplateRecord(ind, design, card.design_index, STOCK_VERSION);
    onSelect?.({
      ...data,
      id: card.id,
      source_version: STOCK_VERSION,
      catalog_source: "canonical_public_stock_compiler",
      preview_only: true,
    });
  };
  return <section aria-label="Public stock template catalogue" className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-bold">Industry
        <select value={industry} onChange={e => {setIndustry(e.target.value);setVisible(PAGE_SIZE);}}
          className="mt-2 block min-h-11 w-full rounded-lg border border-input bg-background px-3">
          <option value="">All industries</option>
          {STOCK_INDUSTRIES.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold">Search templates
        <input value={search} onChange={e=>{setSearch(e.target.value);setVisible(PAGE_SIZE);}}
          placeholder="Industry or design style"
          className="mt-2 block min-h-11 w-full rounded-lg border border-input bg-background px-3" />
      </label>
    </div>
    <div aria-live="polite" className="text-sm text-muted-foreground">
      {matches.length} matching original source-defined templates ·
      {" "}{STOCK_INDUSTRIES.length} industries · {STOCK_DESIGNS.length} designs each.
      <span className="block mt-1 text-xs">
        Compiled from the canonical stock design library, not a live database.
        Previews are illustrative and noindex. Business credentials, imagery and availability
        require review before any public launch.
      </span>
    </div>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {page.map(card => <StockTemplateCard key={card.id} template={card} onSelect={open} />)}
    </div>
    {page.length === 0 && <p className="rounded-lg border p-5 text-sm text-muted-foreground">
      No templates match that search. Try a broader industry or design style.
    </p>}
    {page.length < matches.length &&
      <Button variant="outline" onClick={()=>setVisible(v=>Math.min(matches.length,v+PAGE_SIZE))}>
        Show more designs ({page.length}/{matches.length})
      </Button>}
  </section>;
}
