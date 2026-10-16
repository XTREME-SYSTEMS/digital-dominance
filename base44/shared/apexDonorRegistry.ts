/**
 * APEX Universal Donor Pattern Registry
 * Integrated from 13_VISUAL_TEMPLATE_ENGINE/DONOR_PATTERN_REGISTRY.json
 *
 * 32 desktop patterns, 32 mobile patterns, 30 experience recipes.
 * Each template category maps to a desktop + mobile + recipe combination,
 * giving every niche a visually distinct structural identity.
 */

export interface PatternDef { id: string; name: string; }

export const DESKTOP_PATTERNS: PatternDef[] = [
  { id: "D01", name: "SaaS Sidebar Workspace" },
  { id: "D02", name: "Top-Nav Workspace" },
  { id: "D03", name: "Dense Admin Data Table" },
  { id: "D04", name: "Analytics / BI Dashboard" },
  { id: "D05", name: "CRM Pipeline Board" },
  { id: "D06", name: "Project Kanban Workspace" },
  { id: "D07", name: "Docs / Knowledge Base" },
  { id: "D08", name: "Marketplace Catalog" },
  { id: "D09", name: "Ecommerce Product Page" },
  { id: "D10", name: "Marketing Landing Page" },
  { id: "D11", name: "Pricing / Plan Comparison" },
  { id: "D12", name: "Search / Directory" },
  { id: "D13", name: "Social / Creator Studio" },
  { id: "D14", name: "AI Copilot Workspace" },
  { id: "D15", name: "Multi-pane Workbench" },
  { id: "D16", name: "Customer Account Portal" },
  { id: "D17", name: "Scheduler / Resource Planner" },
  { id: "D18", name: "Map Operations Console" },
  { id: "D19", name: "Command Center / NOC" },
  { id: "D20", name: "Settings / Configuration Console" },
  { id: "D21", name: "Email / Communication Hub" },
  { id: "D22", name: "File / Media Manager" },
  { id: "D23", name: "Calendar / Week Planner" },
  { id: "D24", name: "Gantt / Roadmap" },
  { id: "D25", name: "Form / Survey Builder" },
  { id: "D26", name: "Team Chat" },
  { id: "D27", name: "Funnel / Conversion Analytics" },
  { id: "D28", name: "Inventory / Warehouse" },
  { id: "D29", name: "Helpdesk Ticket Queue" },
  { id: "D30", name: "Pivot / Reporting Table" },
  { id: "D31", name: "Onboarding / Setup Wizard" },
  { id: "D32", name: "AI Agent Operations Console" },
];

export const MOBILE_PATTERNS: PatternDef[] = [
  { id: "M01", name: "Bottom-Tab Feed" },
  { id: "M02", name: "Full-Screen Swipe Feed" },
  { id: "M03", name: "Dashboard Tiles" },
  { id: "M04", name: "Search-First Discovery" },
  { id: "M05", name: "Map + Bottom Sheet" },
  { id: "M06", name: "Inbox + Conversation" },
  { id: "M07", name: "Marketplace Storefront" },
  { id: "M08", name: "Product Detail Commerce" },
  { id: "M09", name: "Wizard / Stepper" },
  { id: "M10", name: "Calendar / Schedule" },
  { id: "M11", name: "List + Detail" },
  { id: "M12", name: "Card Stack / Swipe" },
  { id: "M13", name: "Profile Hub" },
  { id: "M14", name: "Creator / Capture First" },
  { id: "M15", name: "AI Chat Copilot" },
  { id: "M16", name: "Wallet / Finance" },
  { id: "M17", name: "Media Library" },
  { id: "M18", name: "Super-App Hub" },
  { id: "M19", name: "Timeline / Activity" },
  { id: "M20", name: "Adaptive Master-Detail" },
  { id: "M21", name: "Onboarding Carousel" },
  { id: "M22", name: "Scanner / QR Capture" },
  { id: "M23", name: "Checkout / Payment" },
  { id: "M24", name: "Fitness / Activity Rings" },
  { id: "M25", name: "Food / Order Menu" },
  { id: "M26", name: "Ride / Trip Track" },
  { id: "M27", name: "Notes / Capture" },
  { id: "M28", name: "Habit / Streak Tracker" },
  { id: "M29", name: "Event Ticket / Pass" },
  { id: "M30", name: "Community / Forum Feed" },
  { id: "M31", name: "Course / Lesson Player" },
  { id: "M32", name: "Health Vitals Dashboard" },
];

export const EXPERIENCE_RECIPES: PatternDef[] = [
  { id: "R01", name: "Mobile Social Feed" },
  { id: "R02", name: "Short Video / Reels" },
  { id: "R03", name: "Local Discovery" },
  { id: "R04", name: "Marketplace" },
  { id: "R05", name: "Ecommerce Store" },
  { id: "R06", name: "SaaS Workspace" },
  { id: "R07", name: "CRM" },
  { id: "R08", name: "Analytics Dashboard" },
  { id: "R09", name: "AI Chat + Artifacts" },
  { id: "R10", name: "AI Agent Control Plane" },
  { id: "R11", name: "Booking / Scheduling" },
  { id: "R12", name: "Field Service" },
  { id: "R13", name: "Project Management" },
  { id: "R14", name: "Messaging" },
  { id: "R15", name: "Learning Platform" },
  { id: "R16", name: "Membership Community" },
  { id: "R17", name: "Content Publisher" },
  { id: "R18", name: "Real Estate Search" },
  { id: "R19", name: "Lead Generation Funnel" },
  { id: "R20", name: "Service Business Site" },
  { id: "R21", name: "Corporate / Consulting" },
  { id: "R22", name: "Product Launch" },
  { id: "R23", name: "Pricing / Subscription" },
  { id: "R24", name: "Admin Console" },
  { id: "R25", name: "Knowledge Base" },
  { id: "R26", name: "Document Workspace" },
  { id: "R27", name: "Inventory / POS" },
  { id: "R28", name: "Finance Dashboard" },
  { id: "R29", name: "Event Experience" },
  { id: "R30", name: "Multi-step Intake" },
];

export interface VisualTemplateProfile {
  engine: string;
  version: string;
  donor_lineage: string;
  desktop: PatternDef;
  mobile: PatternDef;
  experience_recipe: PatternDef;
  render_family: string;
  device_profiles: string[];
  studio_controls: string[];
  approval_contract: string;
  data_policy: string;
}

// Category → [desktopId, mobileId, recipeId, renderFamily]
const CATEGORY_MAP: Record<string, [string, string, string, string]> = {
  C001: ["D04", "M03", "R08", "analytics"],
  C002: ["D11", "M03", "R23", "pricing"],
  C003: ["D14", "M15", "R21", "copilot"],
  C004: ["D05", "M11", "R07", "crm"],
  C005: ["D27", "M03", "R19", "analytics"],
  C006: ["D04", "M04", "R19", "analytics"],
  C007: ["D13", "M17", "R17", "creator"],
  C008: ["D13", "M02", "R01", "creator"],
  C009: ["D10", "M13", "R21", "landing"],
  C010: ["D15", "M20", "R24", "workbench"],
  C011: ["D10", "M21", "R20", "landing"],
  C012: ["D24", "M11", "R13", "board"],
  C013: ["D01", "M03", "R06", "workspace"],
  C014: ["D32", "M15", "R10", "agent"],
  C015: ["D07", "M27", "R25", "knowledge"],
  C016: ["D06", "M19", "R13", "board"],
  C017: ["D20", "M20", "R24", "settings"],
  C018: ["D04", "M03", "R08", "analytics"],
  C019: ["D03", "M11", "R24", "data"],
  C020: ["D15", "M20", "R09", "workbench"],
  C021: ["D19", "M03", "R24", "command"],
  C022: ["D19", "M03", "R24", "command"],
  C023: ["D19", "M19", "R24", "command"],
  C024: ["D16", "M13", "R16", "portal"],
  C025: ["D29", "M06", "R14", "support"],
  C026: ["D19", "M18", "R24", "command"],
  C027: ["D06", "M11", "R13", "board"],
  C028: ["D04", "M16", "R28", "finance"],
  C029: ["D09", "M08", "R05", "commerce"],
  C030: ["D08", "M07", "R04", "commerce"],
  C031: ["D12", "M05", "R03", "directory"],
  C032: ["D18", "M05", "R12", "field"],
  C033: ["D12", "M05", "R18", "property"],
  C034: ["D31", "M09", "R30", "wizard"],
  C035: ["D11", "M23", "R23", "pricing"],
  C036: ["D14", "M15", "R09", "copilot"],
  C037: ["D04", "M03", "R08", "analytics"],
  C038: ["D21", "M06", "R14", "communications"],
  C039: ["D23", "M10", "R11", "scheduler"],
  C040: ["D17", "M11", "R24", "operations"],
  C041: ["D07", "M27", "R26", "knowledge"],
  C042: ["D20", "M13", "R24", "settings"],
  C043: ["D02", "M18", "R06", "mobile"],
  C044: ["D12", "M04", "R03", "directory"],
  C045: ["D21", "M06", "R14", "communications"],
  C046: ["D19", "M03", "R08", "command"],
  C047: ["D19", "M19", "R24", "command"],
  C048: ["D24", "M09", "R30", "wizard"],
  C049: ["D16", "M13", "R21", "portal"],
  C050: ["D20", "M13", "R24", "settings"],
  C051: ["D14", "M15", "R09", "copilot"],
  C052: ["D23", "M18", "R09", "assistant"],
  SMI: ["D19", "M18", "R10", "command"],
};

// Niche → category mapping (extends the ZIP's category system to our niches)
const NICHE_CATEGORY_MAP: Record<string, string> = {
  // Contractor service businesses → R20 Service Business Site
  epoxy: "C011", epoxy_flooring: "C011", roofing: "C011", hvac: "C011",
  plumbing: "C011", electrician: "C011", electrical: "C011",
  water_damage: "C011", mold_remediation: "C011", fire_damage: "C011",
  pest_control: "C011", landscaping: "C011", garage_door: "C011",
  solar: "C011", automotive: "C011", cleaning: "C011",
  // Professional services → R21 Corporate / Consulting
  legal: "C009", real_estate: "C033", remodeling: "C011",
  med_spa: "C009", dental: "C011", chiropractic: "C011",
  identity: "C009", generic: "C009",
  // Digital / SaaS products → distinct patterns
  ai_tool: "C003", ai_chat: "C003", saas: "C013",
  marketplace: "C030", ecommerce: "C029", dropshipping: "C029",
  booking: "C039", appointment: "C039", scheduler: "C039",
  calendar: "C039", social: "C007", community: "C024",
  content_gen: "C017", seo_content: "C017", funnel: "C005",
  lead_gen: "C005", pwa: "C043", app_pack: "C043",
  branding: "C009", brand_gen: "C009", logo: "C009",
  logo_gen: "C009", brand_mark: "C009", design: "C009",
  art: "C007", photography: "C007", creative: "C007",
  image_gen: "C007", visual_gen: "C007", prompt_lab: "C015",
  prompt_showcase: "C015", web_pack: "C013", reservation: "C039",
};

function findById(list: PatternDef[], id: string): PatternDef {
  return list.find((p) => p.id === id) || list[0];
}

/**
 * Resolve the visual template profile for a given niche.
 * Returns the desktop pattern, mobile pattern, experience recipe, and render family.
 */
export function getVisualTemplateProfile(niche: string): VisualTemplateProfile {
  const key = (niche || "").toLowerCase().replace(/ /g, "_");
  const catId = NICHE_CATEGORY_MAP[key] || NICHE_CATEGORY_MAP[niche] || "C013";
  const [deskId, mobId, recipeId, family] = CATEGORY_MAP[catId] || ["D01", "M03", "R06", "workspace"];

  return {
    engine: "13_VISUAL_TEMPLATE_ENGINE",
    version: "1.0.0",
    donor_lineage: "Base44 universal-template-system visual gallery",
    desktop: findById(DESKTOP_PATTERNS, deskId),
    mobile: findById(MOBILE_PATTERNS, mobId),
    experience_recipe: findById(EXPERIENCE_RECIPES, recipeId),
    render_family: family,
    device_profiles: ["desktop", "mobile"],
    studio_controls: [
      "primary_color", "accent_color", "font_family", "font_scale",
      "theme_mode", "logo_text", "brand_name", "heading", "subtitle",
    ],
    approval_contract: "approved visual becomes visual lock for BuildPacket and visual-regression validation",
    data_policy: "synthetic preview content only; never represent sample values as real business data",
  };
}

/**
 * Get all supported niches with their visual template profiles.
 */
export function getNicheProfileMap(): Record<string, VisualTemplateProfile> {
  const result: Record<string, VisualTemplateProfile> = {};
  for (const niche of Object.keys(NICHE_CATEGORY_MAP)) {
    result[niche] = getVisualTemplateProfile(niche);
  }
  return result;
}