const ReferenceAdminViews = [
  {
    name: "Overview", title: "Command dashboard", toolPath: "/admin",
    description: "Review the factory's operational readiness and open the public catalog.",
    stats: [["Public industries", "20 verified categories"], ["Connected client accounts", "Not connected"], ["Live jobs", "No verified job data"], ["Release authority", "Approval required"]],
  },
  {
    name: "Website Catalog", title: "Template library", toolPath: "/admin/templates",
    description: "Public design variants are available; final asset versions and approvals still require durable records.",
    stats: [["Featured designs", "6"], ["Available industries", "20"], ["Template ingestion", "Pending backend integration"], ["Versioned packs", "Not connected"]],
  },
  {
    name: "Launch Queue", title: "Launch operations", toolPath: "/admin/mass-launch",
    description: "No queue records are loaded in this bootstrap. Production provisioning is unavailable.",
    stats: [["Queued jobs", "Not connected"], ["Retry state", "Unknown"], ["Worker heartbeat", "Unverified"], ["Receipt store", "Not connected"]],
  },
  {
    name: "Approval Desk", title: "Review before release", toolPath: "/admin/site-command",
    description: "Design revisions, launch packets and public releases require signed operator approvals.",
    stats: [["Pending review", "No live connection"], ["Approval audit trail", "Not connected"], ["Rollback manifest", "Not connected"], ["Public publishing", "Disabled"]],
  },
  {
    name: "AI Operations", title: "Agent readiness", toolPath: "/admin/assistant",
    description: "Connect existing agent runtime and the single authoritative reconciliation heartbeat.",
    stats: [["Gateway status", "Unverified"], ["Agent orchestration", "Not connected"], ["Five-minute reconcile", "Not verified"], ["Autonomous launches", "Disabled"]],
  },
  {
    name: "GPT Sync", title: "Bi-directional sync", toolPath: "/admin/sync",
    description: "Admin state syncs to GPT for live context. GPT commands sync back to the admin. Full takeover mode.",
    stats: [["Pending events", "Awaiting sync"], ["Synced events", "Ready"], ["Takeover mode", "Available"], ["Operator loop", "Connected"]],
  },
  {
    name: "Analytics", title: "Measure outcomes", toolPath: "/admin/analytics",
    description: "Connect GA4, Search Console and attributed lead events before showing commercial metrics.",
    stats: [["Website visits", "Not connected"], ["Qualified leads", "Not connected"], ["Conversion rate", "Not connected"], ["Revenue attribution", "Not connected"]],
  },
  {
    name: "Integrations", title: "Connection checklist", toolPath: "/admin/tools",
    description: "Integrate existing GitHub, Vercel, Supabase and approved agents without duplicating services.",
    stats: [["Vercel web preview", "Connected"], ["GitHub donor", "Discovered"], ["Supabase Auth and RLS", "Not bound"], ["Transactional email", "Not configured"]],
  },
];

export function getReferenceAdminView(hash) {
  return ReferenceAdminViews.find(view => hash === `#${encodeURIComponent(view.name)}` || hash === `#${view.name}`) || ReferenceAdminViews[0];
}

export default ReferenceAdminViews;