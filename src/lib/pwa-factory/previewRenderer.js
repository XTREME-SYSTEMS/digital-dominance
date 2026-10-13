// Maps each factory template to a live HTML screen rendered from the brand
// mini-UI kit. All visible copy is driven by the studio config (ctx) so the
// Template Studio can rebrand/recontent every preview live. All font-sizes
// scale with --vg-font-scale.
import desktopPatterns from "@/lib/factory/registry/patterns/desktop_patterns.json";
import mobilePatterns from "@/lib/factory/registry/patterns/mobile_patterns.json";
import experienceRecipes from "@/lib/factory/registry/patterns/experience_recipes.json";
import { DEFAULT_CONFIG } from "./studioConfig.js";

export const GALLERY_FAMILIES = [
  { key: "desktop", label: "Desktop Archetypes", platform: "desktop", items: desktopPatterns },
  { key: "mobile", label: "Mobile Archetypes", platform: "mobile", items: mobilePatterns },
  { key: "recipes", label: "Experience Recipes", platform: "recipe", items: experienceRecipes },
];

const PHONE = { w: 300, h: 600 };
const BROWSER = { w: 760, h: 460 };
const FS = (n) => `font-size:calc(${n}px * var(--vg-font-scale,1))`;

const ctxd = (config) => ({ ...DEFAULT_CONFIG, ...config });

const logo = (ctx) => {
  if (ctx.logoImage) return `<span class="logo"><img src="${ctx.logoImage}" alt="" style="height:16px;width:auto;border-radius:4px;vertical-align:middle" /></span>`;
  const parts = String(ctx.logoText || "Strategic Minds").trim().split(/\s+/);
  if (parts.length < 2) return `<span class="logo">${parts[0] || ""}</span>`;
  const last = parts.pop();
  return `<span class="logo">${parts.join(" ")} <b>${last}</b></span>`;
};

const nav = (ctx, active, tabs = ["Dashboard", "Projects", "Reports"]) =>
  `<div class="vg-nav">${logo(ctx)}${tabs.map((t) => `<span class="vg-tab ${t === active ? "on" : ""}">${t}</span>`).join("")}<div style="flex:1"></div><span class="vg-avatar"></span></div>`;

const phoneNav = (ctx) =>
  `<div class="vg-nav" style="justify-content:space-between">${logo(ctx)}<span class="vg-avatar"></span></div>`;

const tabbar = (tabs, active = 0) =>
  `<div class="vg-tabbar">${tabs.map((t, i) => `<div class="t ${i === active ? "on" : ""}"><div class="d"></div><span>${t}</span></div>`).join("")}</div>`;

const feedItem = (ttl, meta, w = 80) =>
  `<div class="item"><div class="thumb"></div><div class="body"><div class="ttl">${ttl}</div><div class="meta">${meta}</div><div class="ln" style="width:${w}%"></div></div></div>`;

/* ---------- DESKTOP layouts ---------- */
function sidebarWorkspace(ctx) {
  return (
    nav(ctx, "Dashboard") +
    `<div style="flex:1;display:flex;min-height:0">
      <div class="vg-side"><div class="i on">▦</div><div class="i">▤</div><div class="i">◍</div><div class="i">◷</div><div class="i">⚙</div></div>
      <div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
        <div class="vg-row vg-between" style="margin-bottom:10px"><div class="vg-col"><div style="${FS(14)};font-weight:900">${ctx.heading}</div><div class="vg-muted" style="${FS(9)}">${ctx.subtitle}</div></div><button class="vg-btn pri">+ New</button></div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
          <div class="vg-kpi"><div class="v">1,284</div><div class="l">Active</div></div>
          <div class="vg-kpi"><div class="v">$48.2k</div><div class="l">Revenue</div></div>
          <div class="vg-kpi"><div class="v">96%</div><div class="l">Uptime</div></div>
        </div>
        <div class="vg-card"><div style="${FS(10)};font-weight:700;margin-bottom:6px">Recent activity</div><div class="vg-feed">${feedItem(ctx.brandName + " updated", "2h ago · Sarah")}${feedItem("New lead captured", "5h ago · Auto", 60)}</div></div>
      </div>
    </div>`
  );
}

function topnavWorkspace(ctx) {
  const cards = [
    ["Sprint 14", "12 tasks · 3 done", 40],
    ["Onboarding", "8 tasks · 6 done", 75],
    ["Q4 Campaign", "5 tasks · 1 done", 20],
    [ctx.brandName, "6 tasks · 4 done", 66],
  ];
  return (
    nav(ctx, "Overview", ["Overview", "Objects", "Reports", "Settings"]) +
    `<div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
      <div class="vg-row vg-between" style="margin-bottom:10px"><div class="vg-col"><div style="${FS(14)};font-weight:900">${ctx.heading}</div><div class="vg-muted" style="${FS(9)}">${ctx.subtitle}</div></div><button class="vg-btn pri">+ Create</button></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${cards.map((c) => `<div class="vg-card"><div style="${FS(10)};font-weight:700">${c[0]}</div><div class="vg-muted" style="${FS(9)};margin-top:3px">${c[1]}</div><div class="vg-bar" style="margin-top:9px"><i style="width:${c[2]}%"></i></div></div>`).join("")}
      </div>
    </div>`
  );
}

function dataTable(ctx) {
  const rows = [
    [ctx.brandName, "Sarah K.", "Active", "$12,400"],
    ["Northwind Co.", "Daniel R.", "Pending", "$3,200"],
    ["Blue Ocean LLC", "Maya P.", "Active", "$8,750"],
    ["Vertex Labs", "Sarah K.", "Won", "$21,000"],
    ["Harbor Group", "Daniel R.", "Pending", "$5,600"],
    ["Lumen Studio", "Maya P.", "Active", "$9,300"],
  ];
  const pill = (s) => `<span class="pill ${s === "Won" || s === "Active" ? "" : "soft"}">${s}</span>`;
  return (
    nav(ctx, "Records", ["Records", "People", "Settings"]) +
    `<div style="flex:1;display:flex;flex-direction:column;min-height:0">
      <div class="vg-row vg-gap2" style="padding:8px 12px;border-bottom:1px solid var(--brand-border);flex:none">
        <span class="vg-chip">Filter: Active</span><span class="vg-chip soft">Type</span><div style="flex:1"></div><button class="vg-btn out">Export</button>
      </div>
      <div class="vg-table vg-scroll" style="flex:1;overflow:auto">
        <div class="h"><span>Name</span><span>Owner</span><span>Status</span><span>Value</span></div>
        ${rows.map((r) => `<div class="r"><span>${r[0]}</span><span class="vg-muted">${r[1]}</span><span>${pill(r[2])}</span><span>${r[3]}</span></div>`).join("")}
      </div>
    </div>`
  );
}

function analytics(ctx) {
  const bars = [38, 52, 44, 61, 55, 72, 68, 80, 74, 88, 82, 95].map((h) => `<i style="height:${h}%"></i>`).join("");
  return (
    nav(ctx, "Analytics", ["Overview", "Drilldown", "Export"]) +
    `<div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:12px">
        <div class="vg-kpi"><div class="v">$48.2k</div><div class="l">Revenue</div></div>
        <div class="vg-kpi"><div class="v">1,284</div><div class="l">Visitors</div></div>
        <div class="vg-kpi"><div class="v">3.9%</div><div class="l">Convert</div></div>
        <div class="vg-kpi"><div class="v">62</div><div class="l">Leads</div></div>
      </div>
      <div class="vg-card"><div style="${FS(10)};font-weight:700;margin-bottom:8px">${ctx.heading}</div><div class="vg-chart">${bars}</div></div>
    </div>`
  );
}

function kanban(ctx) {
  const cols = [
    ["Backlog", 5, ["Design review", "API spec", "Q4 plan"]],
    ["In Progress", 3, ["Auth flow", "Dashboard"]],
    ["Review", 2, ["Onboarding"]],
    ["Done", 8, ["Launch", "SEO audit"]],
  ];
  return (
    nav(ctx, "Board", ["Board", "List", "Reports"]) +
    `<div style="flex:1;min-height:0"><div class="vg-kanban">${cols.map((c) => `<div class="col"><div class="head"><span>${c[0]}</span><span>${c[1]}</span></div>${c[2].map((t) => `<div class="card"><div class="t">${t}</div><div class="m">Due Fri</div><span class="tag">P1</span></div>`).join("")}</div>`).join("")}</div></div>`
  );
}

/* ---------- MORE DESKTOP layouts (D21–D32) ---------- */
const ln = (w) => `<div style="height:6px;border-radius:9999px;background:var(--brand-muted);width:${w}%"></div>`;
const lines = (n) => Array.from({ length: n }, (_, i) => ln(58 + ((i * 23) % 38))).join("");

function emailHub(ctx) {
  const folders = ["Inbox", "Sent", "Drafts", "Archive", "Spam"];
  const msgs = [["Sarah K.", "Re: Q4 plan", "10:24"], ["Daniel R.", "Invoice #441", "9:02"], ["Maya P.", "Design review", "Yest."], ["System", "Weekly digest", "Mon"]];
  return (
    nav(ctx, "Inbox", ["Mail", "Calendar", "Contacts"]) +
    `<div style="flex:1;display:flex;min-height:0">
      <div class="vg-side" style="width:46px;padding:8px 0;gap:6px">${folders.map((f, i) => `<div class="i ${i === 0 ? "on" : ""}" title="${f}">${f[0]}</div>`).join("")}</div>
      <div style="flex:1;min-width:0;border-right:1px solid var(--brand-border)" class="vg-scroll">
        ${msgs.map((m, i) => `<div style="display:flex;flex-direction:column;gap:2px;padding:8px 10px;border-bottom:1px solid var(--brand-border);${i === 0 ? "background:var(--brand-muted)" : ""}"><span style="${FS(10)};font-weight:700">${m[0]}</span><span style="${FS(9)}">${m[1]}</span><span class="vg-muted" style="${FS(8)}">${m[2]}</span></div>`).join("")}
      </div>
      <div style="flex:1.5;min-width:0;padding:12px" class="vg-scroll">
        <div style="${FS(12)};font-weight:900">Re: Q4 plan</div>
        <div class="vg-muted" style="${FS(9)};margin-top:2px">Sarah K. · 10:24</div>
        <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">${lines(3)}</div>
        <button class="vg-btn pri" style="margin-top:12px">Reply</button>
      </div>
    </div>`
  );
}

function fileManager(ctx) {
  const folders = ["All", "Images", "Docs", "Videos", "Shared"];
  const files = [["Report-Q4.pdf", "pdf"], ["logo-final.png", "img"], ["roadmap.docx", "doc"], ["demo.mp4", "vid"], ["invoice-441.pdf", "pdf"], ["team.jpg", "img"], ["spec.xlsx", "xls"], ["notes.md", "doc"]];
  const ic = (k) => ({ pdf: "▤", img: "◳", doc: "▤", vid: "▶", xls: "▦" }[k] || "▤");
  return (
    nav(ctx, "Files", ["Files", "Recent", "Shared"]) +
    `<div style="flex:1;display:flex;min-height:0">
      <div class="vg-side" style="width:46px;padding:8px 0;gap:6px">${folders.map((f, i) => `<div class="i ${i === 0 ? "on" : ""}" title="${f}">${f[0]}</div>`).join("")}</div>
      <div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
        <div class="vg-row vg-between" style="margin-bottom:10px"><div style="${FS(13)};font-weight:900">${ctx.heading}</div><button class="vg-btn pri">Upload</button></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
          ${files.map((f) => `<div class="vg-card" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px"><div style="width:34px;height:34px;border-radius:8px;background:rgba(0,89,255,.12);color:var(--brand-gold-deep);display:flex;align-items:center;justify-content:center"><span style="${FS(15)}">${ic(f[1])}</span></div><div style="${FS(9)};font-weight:700;text-align:center;word-break:break-all">${f[0]}</div><div class="vg-muted" style="${FS(8)}">${f[1].toUpperCase()}</div></div>`).join("")}
        </div>
      </div>
    </div>`
  );
}

function calendarWeek(ctx) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const evts = [[0, "Standup"], [1, "Demo"], [2, "1:1"], [3, "Review"], [1, "Launch"], [4, "Sync"]];
  return (
    nav(ctx, "Week", ["Day", "Week", "Month"]) +
    `<div style="flex:1;display:flex;min-height:0;flex-direction:column">
      <div class="vg-row" style="border-bottom:1px solid var(--brand-border);flex:none">${days.map((d) => `<div style="flex:1;padding:7px;text-align:center;${FS(9)};font-weight:700;border-right:1px solid var(--brand-border)">${d}</div>`).join("")}</div>
      <div style="flex:1;display:flex;min-height:0">
        ${days.map((_, di) => `<div style="flex:1;border-right:1px solid var(--brand-border);position:relative;padding:6px;overflow:hidden">${evts.filter((e) => e[0] === di).map((e, i) => `<div style="background:${i % 2 ? "var(--brand-gold-deep)" : "var(--brand-primary)"};color:#fff;border-radius:6px;padding:4px 6px;margin-bottom:4px;${FS(8)};font-weight:700">${e[1]}</div>`).join("")}<div style="position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(var(--brand-border) 1px,transparent 1px);background-size:100% 22px;opacity:.4"></div></div>`).join("")}
      </div>
    </div>`
  );
}

function gantt(ctx) {
  const tasks = [["Discovery", 0, 2], ["Design", 1, 3], ["Backend", 2, 5], ["Frontend", 3, 4], ["QA", 5, 2], ["Launch", 6, 1]];
  const cols = 8;
  return (
    nav(ctx, "Roadmap", ["Board", "Timeline", "Reports"]) +
    `<div class="vg-scroll" style="flex:1;overflow:auto;padding:10px">
      <div class="vg-row" style="margin-bottom:8px;padding-left:76px">${Array.from({ length: cols }, (_, i) => `<div style="flex:1;text-align:center;${FS(8)};font-weight:700;color:var(--brand-muted-foreground)">W${i + 1}</div>`).join("")}</div>
      ${tasks.map((t) => `<div class="vg-row" style="margin-bottom:6px;align-items:center"><div style="width:70px;${FS(9)};font-weight:700;padding-right:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t[0]}</div><div style="flex:1;position:relative;height:14px;background:var(--brand-muted);border-radius:5px;overflow:hidden"><div style="position:absolute;left:${(t[1] / cols) * 100}%;width:${(t[2] / cols) * 100}%;top:0;bottom:0;background:linear-gradient(90deg,var(--brand-primary),var(--brand-gold-bright));border-radius:5px"></div></div></div>`).join("")}
    </div>`
  );
}

function formBuilder(ctx) {
  const fields = [["Project name", "text"], ["Description", "area"], ["Priority", "select"], ["Due date", "date"], ["Assignee", "text"]];
  return (
    nav(ctx, "Form", ["Build", "Preview", "Responses"]) +
    `<div style="flex:1;display:flex;min-height:0">
      <div class="vg-side" style="width:46px;padding:8px 0;gap:6px"><div class="i on">▤</div><div class="i">◍</div><div class="i">◷</div><div class="i">⚙</div></div>
      <div class="vg-scroll" style="flex:1;padding:12px;overflow:auto">
        <div style="${FS(13)};font-weight:900;margin-bottom:10px">${ctx.heading}</div>
        ${fields.map((f, i) => `<div style="margin-bottom:10px"><label style="${FS(9)};font-weight:700">${f[0]}</label>${f[1] === "area" ? `<div style="margin-top:4px;height:44px;border:1px solid var(--brand-border);border-radius:8px;background:var(--brand-muted)"></div>` : `<div style="margin-top:4px;height:30px;border:1px solid var(--brand-border);border-radius:8px;background:var(--brand-muted);display:flex;align-items:center;padding:0 10px;${FS(9)};color:var(--brand-muted-foreground)">${i === 0 ? ctx.brandName : f[0] + "…"}</div>`}</div>`).join("")}
        <button class="vg-btn pri">Save</button>
      </div>
    </div>`
  );
}

function teamChat(ctx) {
  const chans = ["#general", "#design", "#eng", "#sales", "#random"];
  const msgs = [["Sarah K.", "Shipped the new dashboard 🎉", true], ["Daniel R.", "Nice — metrics look great", false], ["Maya P.", "Pushing the style pass now", false], ["Sarah K.", "Reviewing after lunch", true]];
  return (
    nav(ctx, "Chat", ["Threads", "DMs", "Calls"]) +
    `<div style="flex:1;display:flex;min-height:0">
      <div class="vg-side" style="width:46px;padding:8px 0;gap:6px">${chans.map((c, i) => `<div class="i ${i === 0 ? "on" : ""}" title="${c}">${c[1]}</div>`).join("")}</div>
      <div class="vg-scroll" style="flex:1;overflow:auto;padding:10px">
        <div style="${FS(11)};font-weight:900;margin-bottom:8px">#general</div>
        ${msgs.map((m) => `<div style="display:flex;gap:7px;margin-bottom:9px"><div class="vg-avatar" style="align-self:flex-end"></div><div><div class="vg-row vg-gap2" style="align-items:baseline"><span style="${FS(9)};font-weight:700">${m[0]}</span><span class="vg-muted" style="${FS(8)}">10:2${m[2] ? "4" : "7"}</span></div><div style="${FS(10)};background:${m[2] ? "var(--brand-primary)" : "var(--brand-surface)"};color:${m[2] ? "var(--brand-on-primary)" : "var(--brand-text)"};border:1px solid var(--brand-border);border-radius:10px;padding:6px 9px;display:inline-block;margin-top:2px">${m[1]}</div></div></div>`).join("")}
        <div style="margin-top:8px;display:flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid var(--brand-border);border-radius:9999px;background:var(--brand-muted)"><span class="vg-muted" style="${FS(9)}">Message #general</span><div style="flex:1"></div><span style="${FS(11)}">➤</span></div>
      </div>
    </div>`
  );
}

function funnel(ctx) {
  const stages = [["Visitors", 12480, 100], ["Sign-ups", 4920, 39], ["Activated", 2100, 17], ["Paid", 620, 5]];
  return (
    nav(ctx, "Funnel", ["Overview", "Breakdown", "Export"]) +
    `<div class="vg-scroll" style="flex:1;overflow:auto;padding:12px">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">${[["$48.2k", "Revenue"], ["3.9%", "Convert"], ["62", "Leads"]].map((k) => `<div class="vg-kpi"><div class="v">${k[0]}</div><div class="l">${k[1]}</div></div>`).join("")}</div>
      <div class="vg-card"><div style="${FS(10)};font-weight:700;margin-bottom:8px">Conversion funnel</div>
        ${stages.map((s, i) => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="width:64px;${FS(9)};font-weight:700">${s[0]}</div><div style="flex:1;height:22px;background:var(--brand-muted);border-radius:6px;overflow:hidden"><div style="height:100%;width:${s[2]}%;background:linear-gradient(90deg,var(--brand-gold-light),var(--brand-primary) ${30 + i * 20}%,var(--brand-gold-deep))"></div></div><div style="width:50px;text-align:right;${FS(9)};font-weight:700">${s[1].toLocaleString()}</div></div>`).join("")}
      </div>
    </div>`
  );
}

function inventory(ctx) {
  const items = [["Widget A", 124, "In stock"], ["Widget B", 8, "Low"], ["Widget C", 0, "Out"], ["Gadget X", 320, "In stock"], ["Gadget Y", 42, "Low"], ["Part 7", 210, "In stock"]];
  const pill = (s) => `<span class="vg-chip ${s === "In stock" ? "" : "soft"}" style="font-size:calc(7px*var(--vg-font-scale,1));${s === "Out" ? "background:#fee2e2;color:#b91c1c" : ""}">${s}</span>`;
  return (
    nav(ctx, "Inventory", ["Stock", "Orders", "Suppliers"]) +
    `<div class="vg-scroll" style="flex:1;overflow:auto">
      <div class="vg-row vg-gap2" style="padding:8px 12px;border-bottom:1px solid var(--brand-border)"><span class="vg-chip">All locations</span><span class="vg-chip soft">Low stock</span><div style="flex:1"></div><button class="vg-btn out">Export</button></div>
      <div class="vg-table"><div class="h"><span>Item</span><span>On hand</span><span>Status</span><span>Reorder</span></div>
        ${items.map((it) => `<div class="r"><span>${it[0]}</span><span class="vg-muted">${it[1]}</span><span>${pill(it[2])}</span><span>${it[2] === "Out" ? "<button class='vg-btn pri' style='padding:3px 8px'>Order</button>" : "—"}</span></div>`).join("")}
      </div>
    </div>`
  );
}

function helpdesk(ctx) {
  const tickets = [["#441", "Login broken", "Sarah K.", "Urgent"], ["#440", "Billing question", "Daniel R.", "Open"], ["#439", "Feature request", "Maya P.", "Pending"], ["#438", "Bug: export", "Sarah K.", "Resolved"]];
  const sev = (s) => `<span class="vg-chip ${s === "Urgent" ? "" : "soft"}" style="font-size:calc(7px*var(--vg-font-scale,1));${s === "Urgent" ? "background:#fee2e2;color:#b91c1c" : ""}">${s}</span>`;
  return (
    nav(ctx, "Tickets", ["Queue", "Mine", "Closed"]) +
    `<div style="flex:1;display:flex;min-height:0">
      <div class="vg-scroll" style="flex:1;overflow:auto">${tickets.map((t, i) => `<div style="display:flex;flex-direction:column;gap:3px;padding:9px 12px;border-bottom:1px solid var(--brand-border);${i === 0 ? "background:var(--brand-muted)" : ""}"><div class="vg-row vg-between"><span style="${FS(10)};font-weight:700">${t[0]} · ${t[1]}</span>${sev(t[3])}</div><div class="vg-muted" style="${FS(8)}">${t[2]} · 2h ago</div></div>`).join("")}</div>
      <div style="flex:1.2;min-width:0;border-left:1px solid var(--brand-border);padding:12px" class="vg-scroll">
        <div style="${FS(12)};font-weight:900">#441 · Login broken</div><div class="vg-muted" style="${FS(9)};margin-top:2px">Sarah K. · Urgent</div>
        <div class="vg-card" style="margin-top:10px">${lines(3)}</div>
        <div class="vg-row vg-gap2" style="margin-top:10px"><button class="vg-btn pri">Resolve</button><button class="vg-btn out">Assign</button></div>
      </div>
    </div>`
  );
}

function pivot(ctx) {
  const cols = ["Region", "Q1", "Q2", "Q3", "Q4", "Total"];
  const rows = [["North", "12.4", "18.2", "21.0", "24.6", "76.2"], ["South", "9.1", "11.4", "14.8", "17.2", "52.5"], ["East", "15.0", "16.6", "19.4", "22.1", "73.1"], ["West", "7.8", "10.2", "12.9", "15.0", "45.9"]];
  return (
    nav(ctx, "Pivot", ["Table", "Chart", "Export"]) +
    `<div class="vg-scroll" style="flex:1;overflow:auto;padding:12px">
      <div class="vg-row vg-gap2" style="margin-bottom:10px"><span class="vg-chip">Rows: Region</span><span class="vg-chip soft">Cols: Quarter</span><span class="vg-chip soft">Val: Revenue</span></div>
      <div class="vg-card" style="padding:0;overflow:hidden"><div style="display:grid;grid-template-columns:1.3fr repeat(4,1fr) 1fr;${FS(9)}">
        ${cols.map((c) => `<div style="padding:7px 9px;font-weight:700;background:var(--brand-muted);border-bottom:1px solid var(--brand-border)">${c}</div>`).join("")}
        ${rows.flatMap((r) => r.map((cell, ci) => `<div style="padding:7px 9px;border-bottom:1px solid var(--brand-border);${ci === 0 ? "font-weight:700" : ""};${ci === 5 ? "font-weight:800;color:var(--brand-primary)" : ""}">${cell}</div>`)).join("")}
      </div></div>
    </div>`
  );
}

function onboardingWizard(ctx) {
  const steps = ["Workspace", "Team", "Integrations", "Review"];
  return (
    nav(ctx, "Setup", ["Setup", "Skip"]) +
    `<div style="flex:1;display:flex;min-height:0">
      <div style="width:120px;border-right:1px solid var(--brand-border);padding:12px;flex:none">
        <div class="vg-flow">${steps.map((s, i) => `<div class="step ${i === 1 ? "on" : ""}"><div class="n">${i + 1}</div><div class="t" style="${FS(10)}">${s}</div></div>`).join("")}</div>
      </div>
      <div class="vg-scroll" style="flex:1;overflow:auto;padding:14px">
        <div style="${FS(14)};font-weight:900">Invite your team</div><div class="vg-muted" style="${FS(10)};margin-top:2px">Step 2 of 4</div>
        <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
          ${["sarah@atlas.co", "daniel@atlas.co"].map((e) => `<div style="display:flex;align-items:center;gap:7px;padding:8px 10px;border:1px solid var(--brand-border);border-radius:8px;background:var(--brand-muted)"><div class="vg-avatar"></div><span style="${FS(10)}">${e}</span><div style="flex:1"></div><span class="vg-chip">Admin</span></div>`).join("")}
          <div style="display:flex;align-items:center;gap:7px;padding:8px 10px;border:1px dashed var(--brand-border);border-radius:8px"><span class="vg-muted" style="${FS(10)}">+ Add email…</span></div>
        </div>
        <div class="vg-row vg-gap2" style="margin-top:14px"><button class="vg-btn out">Back</button><button class="vg-btn pri">Continue</button></div>
      </div>
    </div>`
  );
}

function agentConsole(ctx) {
  const agents = [["Orchestrator", "Running", "12 runs"], ["Lead Scraper", "Idle", "—"], ["Validator", "Running", "3 checks"], ["Provisioner", "Paused", "—"]];
  const log = ["[10:24:01] orchestrator: dispatched generatePlan", "[10:24:03] validator: schema PASS", "[10:24:05] provisioner: dry-run queued", "[10:24:08] orchestrator: run #441 complete"];
  return (
    nav(ctx, "Agents", ["Agents", "Runs", "Logs"]) +
    `<div style="flex:1;display:flex;min-height:0">
      <div class="vg-scroll" style="flex:1;overflow:auto;padding:10px">
        ${agents.map((a) => `<div class="vg-card" style="margin-bottom:7px;display:flex;align-items:center;gap:8px"><div style="width:30px;height:30px;border-radius:8px;background:rgba(0,89,255,.12);color:var(--brand-gold-deep);display:flex;align-items:center;justify-content:center"><span style="${FS(12)}">◍</span></div><div style="flex:1;min-width:0"><div style="${FS(10)};font-weight:700">${a[0]}</div><div class="vg-muted" style="${FS(8)}">${a[2]}</div></div><span class="vg-chip ${a[1] === "Running" ? "" : "soft"}" style="${a[1] === "Paused" ? "background:#fef3c7;color:#92400e" : ""}">${a[1]}</span></div>`).join("")}
      </div>
      <div style="flex:1.1;min-width:0;border-left:1px solid var(--brand-border);padding:10px" class="vg-scroll">
        <div style="${FS(10)};font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--brand-muted-foreground);margin-bottom:6px">Live log</div>
        <div style="font-family:var(--font-mono);${FS(9)};line-height:1.6">${log.map((l) => `<div style="color:var(--brand-muted-foreground)">${l.replace(/([a-z]+):/, '<span style="color:var(--brand-primary);font-weight:700">$1:</span>')}</div>`).join("")}</div>
      </div>
    </div>`
  );
}

const DESKTOP_EXTRA = { D21: emailHub, D22: fileManager, D23: calendarWeek, D24: gantt, D25: formBuilder, D26: teamChat, D27: funnel, D28: inventory, D29: helpdesk, D30: pivot, D31: onboardingWizard, D32: agentConsole };

function renderDesktop(t, config) {
  const ctx = ctxd(config);
  let inner;
  if (t.id === "D01") inner = sidebarWorkspace(ctx);
  else if (t.id === "D02") inner = topnavWorkspace(ctx);
  else if (t.id === "D03") inner = dataTable(ctx);
  else if (t.id === "D04") inner = analytics(ctx);
  else if (t.id === "D05" || t.id === "D06") inner = kanban(ctx);
  else if (DESKTOP_EXTRA[t.id]) inner = DESKTOP_EXTRA[t.id](ctx);
  else inner = sidebarWorkspace(ctx);
  return { frame: "browser", designW: BROWSER.w, designH: BROWSER.h, html: `<div class="vg-screen">${inner}</div>` };
}

/* ---------- MOBILE layouts ---------- */
function feed(ctx) {
  return (
    phoneNav(ctx) +
    `<div class="vg-scroll" style="flex:1;overflow:auto"><div class="vg-feed">${feedItem(ctx.brandName + " live", "Sarah · 2h", 90)}${feedItem("New lead from website", "Auto · 5h", 60)}${feedItem("Quarterly report ready", "Daniel · 1d", 75)}</div></div><div class="vg-fab">+</div>` +
    tabbar(["Home", "Search", "Inbox", "Me"], 0)
  );
}

function swipe(ctx) {
  return (
    `<div class="vg-media">
      <div class="progress"><i></i></div>
      <div style="flex:1"></div>
      <div class="overlay">
        <div class="vg-col" style="gap:4px"><div style="font-weight:900;${FS(13)}">@${(ctx.logoText || "").toLowerCase().replace(/\s+/g, "")}</div><div style="${FS(9)};opacity:.85;max-width:180px">${ctx.subtitle}</div></div>
        <div class="actions"><div class="a">♥</div><div class="a">💬</div><div class="a">↗</div></div>
      </div>
    </div>` + tabbar(["For You", "Following", "Live"], 0)
  );
}

function tiles(ctx) {
  return (
    phoneNav(ctx) +
    `<div class="vg-scroll" style="flex:1;overflow:auto">
      <div style="padding:12px 12px 10px"><div style="font-weight:900;${FS(15)}">${ctx.heading}</div><div class="vg-muted" style="${FS(9)}">${ctx.subtitle}</div></div>
      <div class="vg-tiles">
        <div class="tile"><div class="ic">$</div><div class="v">$48.2k</div><div class="l">Revenue</div></div>
        <div class="tile"><div class="ic">↑</div><div class="v">62</div><div class="l">Leads</div></div>
        <div class="tile"><div class="ic">◷</div><div class="v">12</div><div class="l">Tasks</div></div>
        <div class="tile"><div class="ic">★</div><div class="v">4.9</div><div class="l">Rating</div></div>
      </div>
      <div style="padding:0 12px 10px"><div class="vg-card"><div style="${FS(10)};font-weight:700;margin-bottom:6px">Recent</div><div class="vg-feed">${feedItem(ctx.brandName + " booked", "Today", 70)}</div></div></div>
    </div>` +
    tabbar(["Home", "Activity", "Inbox", "Me"], 0)
  );
}

function search(ctx) {
  return (
    `<div class="vg-search">
      <div class="f"><span style="${FS(11)}">🔍</span><span style="${FS(10)};color:var(--brand-muted-foreground)">Search places…</span><div style="flex:1"></div><span class="vg-chip">Nearby</span></div>
      <div class="vg-row vg-gap2" style="margin-top:8px"><span class="vg-chip">Cafés</span><span class="vg-chip soft">Shops</span><span class="vg-chip soft">Services</span></div>
    </div>
    <div class="vg-scroll" style="flex:1;overflow:auto">
      <div class="vg-feed">
        <div class="item"><div class="thumb"></div><div class="body"><div class="ttl">${ctx.brandName}</div><div class="meta">★ 4.8 · 0.4 mi · Café</div><div class="ln" style="width:70%"></div></div></div>
        <div class="item"><div class="thumb"></div><div class="body"><div class="ttl">Atlas Studio</div><div class="meta">★ 4.9 · 0.8 mi · Design</div><div class="ln" style="width:55%"></div></div></div>
        <div class="item"><div class="thumb"></div><div class="body"><div class="ttl">Northwind Bakery</div><div class="meta">★ 4.7 · 1.2 mi · Bakery</div><div class="ln" style="width:65%"></div></div></div>
      </div>
    </div>` +
    tabbar(["Explore", "Saved", "Profile"], 0)
  );
}

function genericMobile(ctx) {
  return (
    phoneNav(ctx) +
    `<div class="vg-scroll" style="flex:1;overflow:auto">
      <div style="padding:12px"><div style="font-weight:900;${FS(14)}">Inbox</div><div class="vg-muted" style="${FS(9)};margin-bottom:8px">3 new messages</div></div>
      <div class="vg-feed">${feedItem("Sarah K. — " + ctx.brandName, "2h ago", 85)}${feedItem("Daniel R. — Quote ready", "5h ago", 60)}${feedItem("System — Weekly digest", "1d ago", 70)}</div>
    </div>` +
    tabbar(["Home", "Inbox", "Me"], 0)
  );
}

/* ---------- MORE MOBILE layouts (M21–M32) ---------- */
function onboardingCarousel(ctx) {
  return (
    `<div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:24px;background:linear-gradient(160deg,var(--brand-muted),var(--brand-surface))">
      <div style="width:64px;height:64px;border-radius:14px;background:rgba(0,89,255,.12);color:var(--brand-gold-deep);display:flex;align-items:center;justify-content:center;margin-bottom:16px"><span style="${FS(30)}">✦</span></div>
      <div style="${FS(18)};font-weight:900">${ctx.heading}</div><div class="vg-muted" style="${FS(11)};margin-top:6px;max-width:220px">${ctx.subtitle}</div>
      <div class="vg-row vg-gap2" style="margin-top:18px">${[0, 1, 2].map((i) => `<div style="width:7px;height:7px;border-radius:9999px;background:${i === 0 ? "var(--brand-primary)" : "var(--brand-muted)"}"></div>`).join("")}</div>
    </div>` +
    `<div class="vg-row vg-between" style="padding:14px 18px;border-top:1px solid var(--brand-border)"><button class="vg-btn out">Skip</button><button class="vg-btn pri">Next</button></div>`
  );
}

function scanner(ctx) {
  return (
    `<div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#0b1020;color:#fff;padding:20px">
      <div style="width:200px;height:200px;border:2px solid #ffffff44;border-radius:16px;position:relative">
        <div style="position:absolute;left:14px;right:14px;top:50%;height:2px;background:linear-gradient(90deg,transparent,var(--brand-gold-bright),transparent);box-shadow:0 0 12px var(--brand-gold-bright)"></div>
        <div style="position:absolute;top:14px;left:14px;width:24px;height:24px;border-top:3px solid var(--brand-primary);border-left:3px solid var(--brand-primary);border-radius:6px 0 0 0"></div>
        <div style="position:absolute;top:14px;right:14px;width:24px;height:24px;border-top:3px solid var(--brand-primary);border-right:3px solid var(--brand-primary);border-radius:0 6px 0 0"></div>
        <div style="position:absolute;bottom:14px;left:14px;width:24px;height:24px;border-bottom:3px solid var(--brand-primary);border-left:3px solid var(--brand-primary);border-radius:0 0 0 6px"></div>
        <div style="position:absolute;bottom:14px;right:14px;width:24px;height:24px;border-bottom:3px solid var(--brand-primary);border-right:3px solid var(--brand-primary);border-radius:0 0 6px 0"></div>
      </div>
      <div style="${FS(11)};margin-top:18px;opacity:.85">Align QR within frame</div>
    </div>` +
    tabbar(["Scan", "History", "Profile"], 0)
  );
}

function checkout(ctx) {
  const items = [["Pro plan", "$49.00"], ["Add-on seats (3)", "$18.00"], ["Tax", "$5.34"]];
  return (
    phoneNav(ctx) +
    `<div class="vg-scroll" style="flex:1;overflow:auto;padding:12px">
      <div style="${FS(15)};font-weight:900">Checkout</div><div class="vg-muted" style="${FS(9)};margin-top:2px">Order summary</div>
      <div class="vg-card" style="margin-top:10px">${items.map((it) => `<div class="vg-row vg-between" style="margin-bottom:6px"><span style="${FS(10)}">${it[0]}</span><span style="${FS(10)};font-weight:700">${it[1]}</span></div>`).join("")}<div style="border-top:1px solid var(--brand-border);margin-top:6px;padding-top:6px" class="vg-row vg-between"><span style="${FS(10)};font-weight:700">Total</span><span style="${FS(12)};font-weight:900;color:var(--brand-primary)">$72.34</span></div></div>
      <div style="${FS(10)};font-weight:700;margin-top:12px;margin-bottom:6px">Payment</div>
      <div style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--brand-border);border-radius:10px;background:var(--brand-muted)"><div style="width:28px;height:18px;border-radius:4px;background:linear-gradient(135deg,var(--brand-gold-light),var(--brand-primary))"></div><span style="${FS(10)};font-weight:700">•••• 4242</span></div>
    </div>` +
    `<div style="padding:12px;border-top:1px solid var(--brand-border)"><button class="vg-btn pri" style="width:100%;padding:11px">Pay $72.34</button></div>`
  );
}

function fitnessRings(ctx) {
  const ring = (p, color) => `conic-gradient(${color} ${p * 360}deg, transparent 0)`;
  return (
    phoneNav(ctx) +
    `<div class="vg-scroll" style="flex:1;overflow:auto;padding:12px">
      <div style="${FS(15)};font-weight:900">Today</div><div class="vg-muted" style="${FS(9)}">Activity</div>
      <div style="display:flex;justify-content:center;margin:14px 0"><div style="position:relative;width:130px;height:130px"><div style="position:absolute;inset:0;border-radius:9999px;background:${ring(0.82, "var(--brand-primary)")}"></div><div style="position:absolute;inset:14px;border-radius:9999px;background:${ring(0.6, "var(--brand-gold-bright)")}"></div><div style="position:absolute;inset:28px;border-radius:9999px;background:${ring(0.45, "var(--brand-gold-deep)")}"></div><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><div style="${FS(18)};font-weight:900">82%</div><div class="vg-muted" style="${FS(8)}">of goals</div></div></div></div>
      <div class="vg-tiles"><div class="tile"><div class="ic">↑</div><div class="v">8,420</div><div class="l">Steps</div></div><div class="tile"><div class="ic">♥</div><div class="v">142</div><div class="l">BPM</div></div><div class="tile"><div class="ic">◷</div><div class="v">48m</div><div class="l">Active</div></div><div class="tile"><div class="ic">★</div><div class="v">4.9</div><div class="l">Streak</div></div></div>
    </div>` + tabbar(["Today", "History", "Me"], 0)
  );
}

function foodMenu(ctx) {
  const cats = ["Pizza", "Burgers", "Sides", "Drinks"];
  const items = [["Margherita", "$12"], ["Pepperoni", "$14"], ["Veggie Supreme", "$15"], ["BBQ Chicken", "$16"]];
  return (
    phoneNav(ctx) +
    `<div style="display:flex;gap:6px;padding:8px 12px;overflow:auto;border-bottom:1px solid var(--brand-border);flex:none">${cats.map((c, i) => `<span class="vg-chip ${i === 0 ? "" : "soft"}">${c}</span>`).join("")}</div>
    <div class="vg-scroll" style="flex:1;overflow:auto;padding:10px">
      ${items.map((it) => `<div class="vg-card" style="display:flex;align-items:center;gap:9px;margin-bottom:8px"><div style="width:42px;height:42px;border-radius:9px;background:linear-gradient(135deg,var(--brand-gold-light),var(--brand-primary),var(--brand-gold-deep));flex:none"></div><div style="flex:1"><div style="${FS(11)};font-weight:700">${it[0]}</div><div class="vg-muted" style="${FS(9)}">Cheesy · 12"</div></div><div style="${FS(11)};font-weight:900;color:var(--brand-primary)">${it[1]}</div><button class="vg-btn pri" style="padding:5px 9px">+</button></div>`).join("")}
    </div>` +
    `<div class="vg-row vg-between" style="padding:12px;border-top:1px solid var(--brand-border)"><div><span style="${FS(10)};font-weight:700">2 items</span><div style="${FS(13)};font-weight:900">$26.00</div></div><button class="vg-btn pri">View cart</button></div>`
  );
}

function rideTrack(ctx) {
  return (
    `<div style="flex:1;position:relative;background:linear-gradient(135deg,#e6f0ff,#cfe0ff);overflow:hidden">
      <div style="position:absolute;inset:0;background-image:linear-gradient(var(--brand-border) 1px,transparent 1px),linear-gradient(90deg,var(--brand-border) 1px,transparent 1px);background-size:28px 28px;opacity:.6"></div>
      <div style="position:absolute;left:30%;top:30%;width:12px;height:12px;border-radius:9999px;background:var(--brand-primary);box-shadow:0 0 0 6px rgba(0,89,255,.2)"></div>
      <div style="position:absolute;right:25%;bottom:35%;width:12px;height:12px;border-radius:9999px;background:var(--brand-gold-deep)"></div>
      <svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M30,30 Q50,20 75,65" stroke="var(--brand-primary)" stroke-width="1.5" fill="none" stroke-dasharray="3,2"/></svg>
    </div>` +
    `<div style="padding:14px;border-top:1px solid var(--brand-border);background:var(--brand-surface)">
      <div style="width:40px;height:4px;background:var(--brand-border);border-radius:9999px;margin:0 auto 10px"></div>
      <div class="vg-row vg-between"><div><div style="${FS(13)};font-weight:900">3 min away</div><div class="vg-muted" style="${FS(9)}">Sarah · Toyota Camry · 4XK 921</div></div><div style="${FS(16)};font-weight:900;color:var(--brand-primary)">$8.40</div></div>
      <button class="vg-btn pri" style="width:100%;margin-top:10px;padding:11px">Cancel ride</button>
    </div>`
  );
}

function notesApp(ctx) {
  const notes = [["Q4 strategy", "Bullet points and OKRs…", "2h"], ["Meeting notes", "Action items from sync…", "Yest."], ["Ideas", "New onboarding flow…", "Mon"], ["Reading list", "Books and articles…", "Last wk"]];
  return (
    phoneNav(ctx) +
    `<div class="vg-scroll" style="flex:1;overflow:auto;padding:10px">
      <div style="display:flex;align-items:center;gap:6px;padding:7px 11px;border:1px solid var(--brand-border);border-radius:9999px;background:var(--brand-muted);margin-bottom:10px"><span style="${FS(11)}">🔍</span><span class="vg-muted" style="${FS(10)}">Search notes…</span></div>
      ${notes.map((n) => `<div class="vg-card" style="margin-bottom:8px"><div style="${FS(11)};font-weight:700">${n[0]}</div><div class="vg-muted" style="${FS(9)};margin-top:3px">${n[1]}</div><div class="vg-muted" style="${FS(8)};margin-top:6px">${n[2]}</div></div>`).join("")}
    </div>` +
    `<div class="vg-fab">+</div>` + tabbar(["Notes", "Shared", "Me"], 0)
  );
}

function habitStreak(ctx) {
  const habits = [["Morning run", "12 day streak"], ["Read 20 min", "5 day streak"], ["No sugar", "3 day streak"], ["Meditate", "21 day streak"]];
  const cells = Array.from({ length: 28 }, (_, i) => (i % 7 < 3 ? 1 : 0));
  return (
    phoneNav(ctx) +
    `<div class="vg-scroll" style="flex:1;overflow:auto;padding:12px">
      <div style="${FS(15)};font-weight:900">Habits</div><div class="vg-muted" style="${FS(9)}">4 active · 12 day best streak</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin:12px 0">${cells.map((c) => `<div style="aspect-ratio:1;border-radius:5px;background:${c ? "var(--brand-primary)" : "var(--brand-muted)"};opacity:${c ? 0.9 : 0.5}"></div>`).join("")}</div>
      ${habits.map((h) => `<div class="vg-card" style="display:flex;align-items:center;gap:9px;margin-bottom:7px"><div style="width:32px;height:32px;border-radius:8px;background:rgba(0,89,255,.12);color:var(--brand-gold-deep);display:flex;align-items:center;justify-content:center"><span style="${FS(13)}">🔥</span></div><div style="flex:1"><div style="${FS(11)};font-weight:700">${h[0]}</div><div class="vg-muted" style="${FS(9)}">${h[1]}</div></div><div style="width:22px;height:22px;border-radius:9999px;background:var(--brand-primary);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;${FS(11)}">✓</div></div>`).join("")}
    </div>` + tabbar(["Today", "Habits", "Stats"], 0)
  );
}

function eventTicket(ctx) {
  return (
    phoneNav(ctx) +
    `<div class="vg-scroll" style="flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;align-items:center">
      <div style="width:100%;max-width:260px;border-radius:14px;overflow:hidden;background:linear-gradient(160deg,var(--brand-secondary),var(--brand-primary))">
        <div style="padding:14px;color:#fff"><div style="${FS(9)};opacity:.8;text-transform:uppercase;letter-spacing:.05em">Admit one</div><div style="${FS(16)};font-weight:900;margin-top:4px">Atlas Summit 2026</div><div style="${FS(10)};opacity:.85;margin-top:4px">Fri, Oct 16 · 7:00 PM</div><div style="${FS(10)};opacity:.85">Grand Hall · NYC</div></div>
        <div style="height:1px;border-top:2px dashed #ffffff55;margin:0 10px"></div>
        <div style="padding:14px;display:flex;flex-direction:column;align-items:center;background:#ffffff11"><div style="width:90px;height:90px;background:#fff;border-radius:8px;display:grid;grid-template-columns:repeat(8,1fr);gap:1px;padding:6px">${Array.from({ length: 64 }, (_, i) => `<div style="background:${(i * 7) % 3 === 0 ? "#000" : "transparent"}"></div>`).join("")}</div><div style="${FS(8)};color:#fff;margin-top:6px;opacity:.85">TX-441-2026</div></div>
      </div>
      <button class="vg-btn pri" style="width:100%;max-width:260px;margin-top:12px">Add to wallet</button>
    </div>` + tabbar(["Tickets", "Events", "Me"], 0)
  );
}

function forum(ctx) {
  const threads = [["Best onboarding flow?", "42 replies · 1.2k views", "discuss"], ["Show & tell: new dashboard", "18 replies · 830 views", "showcase"], ["How do you handle churn?", "27 replies · 640 views", "discuss"], ["Hiring: design lead", "9 replies · 210 views", "jobs"]];
  const tag = (t) => `<span class="vg-chip soft" style="font-size:calc(7px*var(--vg-font-scale,1))">${t}</span>`;
  return (
    phoneNav(ctx) +
    `<div class="vg-scroll" style="flex:1;overflow:auto;padding:10px">
      ${threads.map((th, i) => `<div class="vg-card" style="margin-bottom:8px"><div class="vg-row vg-gap2" style="margin-bottom:5px">${tag(th[2])}<div style="flex:1"></div><span class="vg-muted" style="${FS(8)}">${i + 1}d</span></div><div style="${FS(11)};font-weight:700">${th[0]}</div><div class="vg-muted" style="${FS(9)};margin-top:4px">${th[1]}</div><div class="vg-row vg-gap2" style="margin-top:8px"><span style="${FS(9)};font-weight:700;color:var(--brand-primary)">▲ 24</span><span class="vg-muted" style="${FS(9)}">💬 12</span><span class="vg-muted" style="${FS(9)}">↗</span></div></div>`).join("")}
    </div>` + `<div class="vg-fab">+</div>` + tabbar(["Feed", "Tags", "Me"], 0)
  );
}

function coursePlayer(ctx) {
  const lessons = [["Intro to the platform", "8:24", "done"], ["Setting up your workspace", "12:10", "done"], ["Building your first app", "18:42", "current"], ["Publishing & sharing", "9:15", "todo"], ["Analytics basics", "14:30", "todo"]];
  const ic = (s) => (s === "done" ? "✓" : s === "current" ? "▶" : "○");
  return (
    phoneNav(ctx) +
    `<div style="background:linear-gradient(135deg,var(--brand-secondary),var(--brand-primary));padding:14px;color:#fff;flex:none"><div style="${FS(9)};opacity:.8;text-transform:uppercase;letter-spacing:.05em">Course · 5 lessons</div><div style="${FS(14)};font-weight:900;margin-top:3px">Platform Fundamentals</div><div class="vg-bar" style="margin-top:8px;background:#ffffff33"><i style="width:40%"></i></div><div style="${FS(9)};opacity:.85;margin-top:5px">2 of 5 complete</div></div>
    <div class="vg-scroll" style="flex:1;overflow:auto;padding:10px">
      ${lessons.map((l) => `<div class="vg-row vg-gap2" style="align-items:center;padding:9px;border-radius:9px;margin-bottom:5px;${l[2] === "current" ? "background:var(--brand-muted)" : ""}"><div style="width:24px;height:24px;border-radius:9999px;display:flex;align-items:center;justify-content:center;${FS(10)};font-weight:800;${l[2] === "done" || l[2] === "current" ? "background:var(--brand-primary);color:#fff" : "border:1px solid var(--brand-border);color:var(--brand-muted-foreground)"}">${ic(l[2])}</div><div style="flex:1"><div style="${FS(10)};font-weight:700">${l[0]}</div><div class="vg-muted" style="${FS(8)}">${l[1]}</div></div></div>`).join("")}
    </div>` + tabbar(["Learn", "Library", "Me"], 0)
  );
}

function healthVitals(ctx) {
  const bars = [62, 70, 68, 75, 72, 80, 76, 84, 78, 88, 82, 90].map((h) => `<i style="height:${h}%"></i>`).join("");
  const readings = [["♥", "72", "Heart rate"], ["⊕", "118", "Blood pressure"], ["◐", "94", "Blood glucose"], ["◷", "7h", "Sleep"]];
  return (
    phoneNav(ctx) +
    `<div class="vg-scroll" style="flex:1;overflow:auto;padding:12px">
      <div style="${FS(15)};font-weight:900">Health</div><div class="vg-muted" style="${FS(9)}">Today · updated 2m ago</div>
      <div class="vg-card" style="margin-top:10px"><div style="${FS(10)};font-weight:700;margin-bottom:8px">Heart rate · 7d</div><div class="vg-chart">${bars}</div></div>
      <div class="vg-tiles" style="margin-top:10px">${readings.map((r) => `<div class="tile"><div class="ic">${r[0]}</div><div class="v" style="${FS(13)}">${r[1]}</div><div class="l">${r[2]}</div></div>`).join("")}</div>
    </div>` + tabbar(["Today", "Trends", "Me"], 0)
  );
}

const MOBILE_EXTRA = { M21: onboardingCarousel, M22: scanner, M23: checkout, M24: fitnessRings, M25: foodMenu, M26: rideTrack, M27: notesApp, M28: habitStreak, M29: eventTicket, M30: forum, M31: coursePlayer, M32: healthVitals };

function renderMobile(t, config) {
  const ctx = ctxd(config);
  let inner;
  if (t.id === "M01") inner = feed(ctx);
  else if (t.id === "M02") inner = swipe(ctx);
  else if (t.id === "M03") inner = tiles(ctx);
  else if (t.id === "M04") inner = search(ctx);
  else if (MOBILE_EXTRA[t.id]) inner = MOBILE_EXTRA[t.id](ctx);
  else inner = genericMobile(ctx);
  return { frame: "phone", designW: PHONE.w, designH: PHONE.h, html: `<div class="vg-screen">${inner}</div>` };
}

/* ---------- RECIPE layouts ---------- */
function renderRecipe(r, config) {
  const ctx = ctxd(config);
  const steps = String(r.canonical_flow || "").split(">").map((s) => s.trim()).filter(Boolean);
  const flow = steps.map((s, i) => `<div class="step ${i === 0 ? "on" : ""}"><div class="n">${i + 1}</div><div class="t">${s}</div></div>`).join("");
  const contract = r.composition_contract || {};
  const chips = Object.entries(contract).filter(([, v]) => v).map(([k]) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())).map((c) => `<span class="vg-chip">${c}</span>`).join("");
  return {
    frame: "browser",
    designW: BROWSER.w,
    designH: BROWSER.h,
    html:
      `<div class="vg-screen">${nav(ctx, "Flow", ["Flow", "Steps"])}` +
      `<div class="vg-scroll" style="flex:1;padding:14px;overflow:auto">
        <div style="font-weight:900;${FS(15)}">${r.name}</div>
        <div class="vg-muted" style="${FS(10)};margin-top:2px">${r.domain || ""}</div>
        <div style="${FS(9)};font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--brand-muted-foreground);margin:16px 0 8px">Canonical flow</div>
        <div class="vg-flow">${flow}</div>
        <div class="vg-card" style="margin-top:14px"><div style="${FS(10)};font-weight:700;margin-bottom:7px">Composition contract</div><div class="vg-row vg-gap2" style="flex-wrap:wrap">${chips}</div></div>
      </div></div>`,
  };
}

export function renderPreview(template, platform, config) {
  if (platform === "mobile") return renderMobile(template, config);
  if (platform === "recipe") return renderRecipe(template, config);
  return renderDesktop(template, config);
}

export function familyFor(item) {
  if (item.family === "mobile") return "mobile";
  if (item.canonical_flow) return "recipe";
  return "desktop";
}