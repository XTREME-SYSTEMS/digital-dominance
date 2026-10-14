/**
 * Visual Template Engine
 * Generates full, styled, professional HTML for each industry niche.
 * Adapted from the donor VISUAL_TEMPLATE_ENGINE system.
 * Each template gets a complete HTML document with embedded CSS,
 * rendered inside an iframe via srcDoc in StockTemplatePreview.
 */

interface NicheConfig {
  hero: string;
  sub: string;
  cta: string;
  services: { title: string; desc: string }[];
  proof: string[];
  primary: string;
  accent: string;
  features: { title: string; desc: string }[];
}

const NICHE_CONFIGS: Record<string, NicheConfig> = {
  water_damage: {
    hero: "24/7 Water Damage Restoration",
    sub: "Fast response. Certified technicians. Insurance approved. We extract water, dry structures, and prevent mold before it spreads.",
    cta: "Call Now — Free Assessment",
    primary: "#0c4a6e",
    accent: "#0284c7",
    services: [
      { title: "Water Extraction", desc: "Industrial pumps remove standing water in minutes, not hours." },
      { title: "Structural Drying", desc: "Thermal imaging ensures every wall, floor, and cavity is bone dry." },
      { title: "Mold Prevention", desc: "Antimicrobial treatment stops mold before it can colonize." },
      { title: "Insurance Claims", desc: "We document everything and work directly with your adjuster." },
    ],
    proof: ["Insurance Approved", "IICRC Certified", "30-Min Response", "5-Star Rated"],
    features: [
      { title: "Emergency Response", desc: "Crews dispatched within 30 minutes, 24 hours a day, 365 days a year." },
      { title: "Thermal Imaging", desc: "FLIR cameras detect hidden moisture behind walls and under floors." },
      { title: "Direct Insurance Billing", desc: "We handle the paperwork so you can focus on your family, not the claim." },
    ],
  },
  roofing: {
    hero: "Professional Roofing Services",
    sub: "Licensed roofers. Free inspections. Storm damage specialists. From minor repairs to full replacements, we protect what matters most.",
    cta: "Schedule Free Inspection",
    primary: "#7c2d12",
    accent: "#ea580c",
    services: [
      { title: "Roof Repair", desc: "Leak detection and repair for shingle, tile, metal, and flat roofs." },
      { title: "Roof Replacement", desc: "Full tear-off and installation with manufacturer warranties." },
      { title: "Storm Damage", desc: "Hail and wind damage assessment with insurance documentation." },
      { title: "Roof Inspection", desc: "Free 27-point inspection with photo report and cost estimate." },
    ],
    proof: ["Licensed & Insured", "GAF Certified", "20-Year Warranty", "Free Inspections"],
    features: [
      { title: "Storm Specialists", desc: "We work with all insurance companies and document every square inch." },
      { title: "Premium Materials", desc: "Architectural shingles, standing seam metal, and Class A tile systems." },
      { title: "Lifetime Workmanship", desc: "Our installation warranty covers labor for as long as you own the home." },
    ],
  },
  hvac: {
    hero: "HVAC Services — Heating & Cooling",
    sub: "NATE-certified technicians. Same-day AC repair. Free system estimates. We keep your home comfortable in every season.",
    cta: "Book Service Today",
    primary: "#1e3a5f",
    accent: "#0ea5e9",
    services: [
      { title: "AC Repair", desc: "Same-day diagnostics and repair for all brands and models." },
      { title: "Heating Service", desc: "Furnace and heat pump repair, installation, and maintenance." },
      { title: "System Installation", desc: "High-efficiency systems sized right for your home and budget." },
      { title: "Maintenance Plans", desc: "Annual tune-ups that extend system life and lower energy bills." },
    ],
    proof: ["NATE Certified", "Same-Day Service", "All Brands", "Financing Available"],
    features: [
      { title: "24/7 Emergency", desc: "When your AC dies at midnight, our technicians answer the phone." },
      { title: "Transparent Pricing", desc: "Upfront flat-rate quotes before any work begins. No surprises." },
      { title: "Smart Thermostats", desc: "Free smart thermostat with every system installation." },
    ],
  },
  plumbing: {
    hero: "Plumbing Services — Licensed Plumbers",
    sub: "Licensed master plumbers. Upfront pricing. No mess left behind. From drips to disasters, we fix it right the first time.",
    cta: "Call for Fast Service",
    primary: "#1e3a5f",
    accent: "#0ea5e9",
    services: [
      { title: "Leak Repair", desc: "Slab leak detection, pipe repair, and whole-house repiping." },
      { title: "Drain Cleaning", desc: "Hydro-jetting and camera inspection for stubborn clogs." },
      { title: "Water Heaters", desc: "Tank and tankless water heater repair, installation, and flush." },
      { title: "Emergency Plumbing", desc: "Burst pipes, backups, and overflows — we respond 24/7." },
    ],
    proof: ["Licensed Master Plumbers", "Upfront Pricing", "24/7 Emergency", "Background Checked"],
    features: [
      { title: "Camera Inspection", desc: "We find the exact problem before we start digging or cutting." },
      { title: "Trenchless Repair", desc: "Fix underground pipes without tearing up your yard or driveway." },
      { title: "Lifetime Warranty", desc: "On all parts and labor for installed water heaters and repipes." },
    ],
  },
  epoxy: {
    hero: "Epoxy Flooring — Garage & Commercial",
    sub: "Industrial-grade epoxy. Metallic, flake, and solid finishes. 15-year warranty. Transform your garage into a showroom.",
    cta: "Get Free Quote",
    primary: "#334155",
    accent: "#0ea5e9",
    services: [
      { title: "Garage Floor Epoxy", desc: "3-layer system with polyaspartic topcoat that resists UV and hot tires." },
      { title: "Metallic Epoxy", desc: "Luxury metallic finishes that mimic polished concrete and marble." },
      { title: "Commercial Floors", desc: "Warehouse, retail, and restaurant epoxy built for heavy traffic." },
      { title: "Concrete Polishing", desc: "Grind-and-polish system for a durable, low-maintenance finish." },
    ],
    proof: ["15-Year Warranty", "Industrial Grade", "1-Day Install", "UV Resistant"],
    features: [
      { title: "Polyaspartic Topcoat", desc: "Won't yellow, peel, or lift under hot tires — guaranteed for 15 years." },
      { title: "Same-Day Use", desc: "Walk on it in 12 hours, drive in 24. No week-long cure time." },
      { title: "Custom Flake Colors", desc: "50+ color combinations to match your home, garage, or brand." },
    ],
  },
  electrician: {
    hero: "Electrical Services — Licensed Electricians",
    sub: "Licensed. Bonded. Insured. Panel upgrades, EV chargers, lighting, and rewiring. Safety is our first priority.",
    cta: "Schedule Service",
    primary: "#451a03",
    accent: "#facc15",
    services: [
      { title: "Panel Upgrades", desc: "200A service upgrades and sub-panel installation for modern homes." },
      { title: "EV Charger Install", desc: "Level 2 charger installation for Tesla, Ford, GM, and all EVs." },
      { title: "Lighting Design", desc: "Recessed lighting, under-cabinet, and exterior lighting solutions." },
      { title: "Whole-Home Rewiring", desc: "Knob-and-tube and aluminum wiring replacement for safety." },
    ],
    proof: ["Licensed & Insured", "Upfront Pricing", "Same-Day Service", "Code Compliant"],
    features: [
      { title: "Safety First", desc: "Every job inspected to NEC code. We don't cut corners on safety." },
      { title: "EV Ready", desc: "Certified installer for Tesla, ChargePoint, and JuiceBox chargers." },
      { title: "Generator Hookup", desc: "Whole-home standby generator installation and transfer switches." },
    ],
  },
  pest_control: {
    hero: "Pest Control — Extermination & Prevention",
    sub: "Family-safe treatments. Quarterly protection plans. Same-day service. We eliminate pests and keep them out.",
    cta: "Get Pest-Free Today",
    primary: "#14532d",
    accent: "#22c55e",
    services: [
      { title: "General Pest Control", desc: "Ants, roaches, spiders, and silverfish — gone and staying gone." },
      { title: "Termite Treatment", desc: "Bait systems and liquid barriers with annual warranty." },
      { title: "Rodent Removal", desc: "Trapping, exclusion, and sanitization for mice and rats." },
      { title: "Mosquito Control", desc: "Monthly misting systems for yards, patios, and event spaces." },
    ],
    proof: ["Pet & Child Safe", "Licensed Technicians", "Quarterly Plans", "Free Re-treatments"],
    features: [
      { title: "Eco-Friendly Options", desc: "Botanical and low-toxicity treatments safe for kids and pets." },
      { title: "Year-Round Protection", desc: "Quarterly service adapts to seasonal pest pressure in your area." },
      { title: "Free Re-treatments", desc: "If pests return between visits, we come back at no charge." },
    ],
  },
  landscaping: {
    hero: "Landscaping & Hardscaping Services",
    sub: "Award-winning design. Full-service installation. From patios to planting, we build outdoor spaces that last.",
    cta: "Free Design Consultation",
    primary: "#14532d",
    accent: "#84cc16",
    services: [
      { title: "Landscape Design", desc: "3D-rendered design plans tailored to your property and style." },
      { title: "Hardscaping", desc: "Patios, walkways, retaining walls, and fire pits in stone and paver." },
      { title: "Lawn Care", desc: "Weekly mowing, edging, fertilization, and weed control programs." },
      { title: "Irrigation Systems", desc: "Smart sprinkler installation, repair, and seasonal maintenance." },
    ],
    proof: ["Award-Winning Design", "Licensed & Insured", "5-Year Warranty", "Free Estimates"],
    features: [
      { title: "3D Design Preview", desc: "See your finished landscape in 3D before we break ground." },
      { title: "Full-Service Crews", desc: "Design, install, and maintain — one team, one accountable point of contact." },
      { title: "Native Plant Experts", desc: "Drought-tolerant and native species that thrive in your climate zone." },
    ],
  },
  mold_remediation: {
    hero: "Certified Mold Remediation",
    sub: "Protect your family from toxic mold. Certified, thorough, guaranteed. We find the source, remove the mold, and prevent it from coming back.",
    cta: "Free Mold Inspection",
    primary: "#14532d",
    accent: "#10b981",
    services: [
      { title: "Mold Inspection", desc: "Air quality testing and moisture mapping to find hidden colonies." },
      { title: "Mold Removal", desc: "Containment, HEPA filtration, and antimicrobial treatment." },
      { title: "Prevention", desc: "Moisture control solutions that stop mold at its source." },
      { title: "Air Quality Testing", desc: "Post-remediation clearance testing with lab-certified results." },
    ],
    proof: ["IICRC Certified", "Lab-Tested Results", "Insurance Approved", "Lifetime Warranty"],
    features: [
      { title: "Health-First Approach", desc: "We treat your home like a hospital — containment, HEPA, and antimicrobial." },
      { title: "Moisture Source Repair", desc: "We don't just clean mold — we fix the moisture problem causing it." },
      { title: "Clearance Testing", desc: "Independent lab verification that your air is safe before we leave." },
    ],
  },
  fire_damage: {
    hero: "Fire Damage Restoration Experts",
    sub: "Rebuilding after fire damage. Soot, smoke, odor removal, and full reconstruction. We bring your home back to life.",
    cta: "24/7 Emergency Line",
    primary: "#7f1d1d",
    accent: "#ef4444",
    services: [
      { title: "Soot & Smoke Cleanup", desc: "Dry cleaning and chemical sponging for walls, ceilings, and contents." },
      { title: "Odor Removal", desc: "Thermal fogging and ozone treatment that destroys smoke molecules." },
      { title: "Content Cleaning", desc: "Pack-out, ultrasonic cleaning, and secure storage of your belongings." },
      { title: "Reconstruction", desc: "Full build-back from framing to finish — one contractor, one call." },
    ],
    proof: ["IICRC Certified", "Insurance Direct", "24/7 Response", "Full Rebuild"],
    features: [
      { title: "One-Stop Recovery", desc: "From emergency board-up to final paint — we handle every step." },
      { title: "Insurance Liaison", desc: "We document, estimate, and bill directly so you don't have to." },
      { title: "Odor Guarantee", desc: "If you can still smell smoke after our treatment, we come back free." },
    ],
  },
  garage_door: {
    hero: "Garage Door Repair & Installation",
    sub: "Same-day repair. All brands serviced. New installation with warranty. Springs, openers, panels — we fix it all.",
    cta: "Call for Same-Day Repair",
    primary: "#334155",
    accent: "#3b82f6",
    services: [
      { title: "Spring Replacement", desc: "Torsion and extension spring repair — same-day, every day." },
      { title: "Opener Repair", desc: "Chain, belt, and screw drive opener repair and installation." },
      { title: "New Door Installation", desc: "Steel, wood, and carriage-house doors with lifetime warranty." },
      { title: "Panel Replacement", desc: "Match existing panels or upgrade your door without full replacement." },
    ],
    proof: ["Same-Day Service", "All Brands", "Licensed & Insured", "Lifetime Warranty"],
    features: [
      { title: "Same-Day Springs", desc: "Broken spring? We're at your door within hours, not days." },
      { title: "Smart Openers", desc: "MyQ and Aladdin Connect smart opener installation for phone control." },
      { title: "All Major Brands", desc: "Chamberlain, LiftMaster, Genie, Amarr, Clopay, and more." },
    ],
  },
  legal: {
    hero: "Trusted Legal Representation",
    sub: "Experienced attorneys. Aggressive advocacy. Proven results. We fight for your rights and protect your interests.",
    cta: "Schedule Free Consultation",
    primary: "#1e293b",
    accent: "#c9a227",
    services: [
      { title: "Personal Injury", desc: "Maximizing compensation for accident victims and their families." },
      { title: "Business Law", desc: "Contract review, entity formation, and commercial litigation." },
      { title: "Estate Planning", desc: "Wills, trusts, and probate to protect your legacy and loved ones." },
      { title: "Family Law", desc: "Divorce, custody, and support with compassionate, strong counsel." },
    ],
    proof: ["20+ Years Experience", "Free Consultation", "No Fee Unless We Win", "5-Star Reviews"],
    features: [
      { title: "Proven Track Record", desc: "Millions recovered for clients. Case results available on request." },
      { title: "Contingency Fee", desc: "Personal injury cases handled on a no-win, no-fee basis." },
      { title: "Direct Attorney Access", desc: "You talk to your lawyer, not a paralegal or call center." },
    ],
  },
  real_estate: {
    hero: "Your Trusted Real Estate Partner",
    sub: "Top-producing agents. Local market experts. Buying, selling, and property management. We make your move seamless.",
    cta: "Start Your Search",
    primary: "#1e3a5f",
    accent: "#3b82f6",
    services: [
      { title: "Home Buying", desc: "Buyer representation with local market expertise and negotiation skill." },
      { title: "Home Selling", desc: "Professional photography, staging, and MLS listing with marketing." },
      { title: "Property Management", desc: "Tenant screening, rent collection, and maintenance for investors." },
      { title: "Market Analysis", desc: "Free comparative market analysis to price your home right." },
    ],
    proof: ["Top 1% Agents", "500+ Homes Sold", "Free Market Analysis", "5-Star Rated"],
    features: [
      { title: "Local Experts", desc: "Born and raised in the area — we know every neighborhood and trend." },
      { title: "Professional Marketing", desc: "Drone photography, 3D tours, and social media campaigns included." },
      { title: "Full-Service Team", desc: "Agents, lenders, inspectors, and title — all under one roof." },
    ],
  },
  remodeling: {
    hero: "Home Remodeling & Renovation",
    sub: "Design-build remodeling. Kitchen, bath, and whole-home renovations. Licensed, insured, and on schedule.",
    cta: "Get Free Estimate",
    primary: "#78350f",
    accent: "#f59e0b",
    services: [
      { title: "Kitchen Remodeling", desc: "Custom cabinets, countertops, and smart appliance integration." },
      { title: "Bathroom Remodeling", desc: "Walk-in showers, freestanding tubs, and luxury finishes." },
      { title: "Home Additions", desc: "Second stories, master suites, and room additions designed to match." },
      { title: "Whole-Home Renovation", desc: "Complete gut and rebuild with modern layout and finishes." },
    ],
    proof: ["Licensed & Insured", "Design-Build", "Fixed-Price Contracts", "5-Year Warranty"],
    features: [
      { title: "3D Design", desc: "Walk through your new kitchen or bath in 3D before construction starts." },
      { title: "Fixed-Price Bids", desc: "No surprise costs. Your contract price is your final price." },
      { title: "Project Manager", desc: "One dedicated PM from demo to punch list — you always know who to call." },
    ],
  },
  med_spa: {
    hero: "Luxury Med Spa & Aesthetics",
    sub: "Board-certified providers. Advanced aesthetic treatments. Personalized care plans. Reveal your best self.",
    cta: "Book Free Consultation",
    primary: "#581c87",
    accent: "#c084fc",
    services: [
      { title: "Botox & Fillers", desc: "Wrinkle reduction and volume restoration by certified injectors." },
      { title: "Laser Treatments", desc: "Hair removal, skin resurfacing, and pigmentation correction." },
      { title: "Medical Facials", desc: "HydraFacial, microneedling, and chemical peels for all skin types." },
      { title: "Body Contouring", desc: "Non-invasive fat reduction and skin tightening technology." },
    ],
    proof: ["Board-Certified", "FDA-Approved Treatments", "Free Consultation", "5-Star Reviews"],
    features: [
      { title: "Expert Providers", desc: "Every treatment performed by a licensed nurse practitioner or PA." },
      { title: "Personalized Plans", desc: "Your treatment plan is built around your goals, not a sales quota." },
      { title: "Membership Pricing", desc: "Save up to 20% with monthly membership on all treatments." },
    ],
  },
  dental: {
    hero: "Modern Dental Care for the Whole Family",
    sub: "Gentle dentistry. Same-day emergencies. Cosmetic and implant specialists. Your healthiest smile starts here.",
    cta: "Book Appointment",
    primary: "#134e4a",
    accent: "#14b8a6",
    services: [
      { title: "General Dentistry", desc: "Cleanings, exams, fillings, and preventive care for all ages." },
      { title: "Cosmetic Dentistry", desc: "Veneers, whitening, and smile makeovers with digital preview." },
      { title: "Dental Implants", desc: "Single tooth, multiple teeth, and All-on-4 implant restoration." },
      { title: "Emergency Care", desc: "Same-day appointments for toothaches, broken teeth, and trauma." },
    ],
    proof: ["Accepting New Patients", "Most Insurance Accepted", "Same-Day Emergencies", "5-Star Reviews"],
    features: [
      { title: "Gentle Approach", desc: "Sedation options and a comfort-first philosophy for anxious patients." },
      { title: "Digital Technology", desc: "3D scanning, digital impressions, and same-visit crowns with CEREC." },
      { title: "Family Friendly", desc: "One office for everyone — from toddler cleanings to grandpa's implants." },
    ],
  },
  chiropractic: {
    hero: "Chiropractic Care & Wellness",
    sub: "Natural pain relief. Corrective care. Wellness programs. We help your body heal without drugs or surgery.",
    cta: "New Patient Special",
    primary: "#134e4a",
    accent: "#2dd4bf",
    services: [
      { title: "Spinal Adjustment", desc: "Gentle, precise corrections for neck, back, and joint pain." },
      { title: "Corrective Care", desc: "Posture correction and spinal rehabilitation programs." },
      { title: "Massage Therapy", desc: "Therapeutic massage integrated with your chiropractic treatment." },
      { title: "Wellness Programs", desc: "Ongoing maintenance care to keep you pain-free and active." },
    ],
    proof: ["New Patient Special", "Most Insurance Accepted", "20+ Years Experience", "5-Star Reviews"],
    features: [
      { title: "Drug-Free Relief", desc: "We address the cause, not the symptom — no prescriptions, no surgery." },
      { title: "Digital X-Ray", desc: "On-site digital X-ray so we see exactly what's happening before we adjust." },
      { title: "Family Care", desc: "From kids to seniors, we adjust every age safely and gently." },
    ],
  },
  solar: {
    hero: "Solar Panel Installation — Go Solar",
    sub: "Save on energy bills. Federal tax credits. 25-year warranty. We design, install, and maintain your solar system.",
    cta: "Get Free Solar Quote",
    primary: "#1e3a5f",
    accent: "#f59e0b",
    services: [
      { title: "Solar Panel Installation", desc: "Premium panels with 25-year performance warranty." },
      { title: "Battery Storage", desc: "Tesla Powerwall and Enphase battery systems for energy independence." },
      { title: "System Design", desc: "Custom system sizing based on your usage, roof, and goals." },
      { title: "Maintenance & Monitoring", desc: "Remote monitoring and annual cleaning for peak output." },
    ],
    proof: ["26% Federal Tax Credit", "25-Year Warranty", "Licensed & Insured", "Free Quote"],
    features: [
      { title: "$0 Down Financing", desc: "Go solar for nothing out of pocket — pay less than your current bill." },
      { title: "Production Guarantee", desc: "If your panels underperform, we pay you the difference. Period." },
      { title: "Battery Ready", desc: "Every system is battery-ready for future backup power addition." },
    ],
  },
  automotive: {
    hero: "Auto Repair You Can Trust",
    sub: "ASE-certified mechanics. Honest diagnostics. 12-month warranty. From oil changes to engine rebuilds, we do it right.",
    cta: "Schedule Service",
    primary: "#450a0a",
    accent: "#dc2626",
    services: [
      { title: "Engine Repair", desc: "Diagnostics, timing belts, and full engine rebuilds." },
      { title: "Brake Service", desc: "Pads, rotors, calipers, and ABS diagnostics for all makes." },
      { title: "Transmission", desc: "Fluid service, repair, and replacement for automatic and manual." },
      { title: "Oil & Maintenance", desc: "Synthetic oil changes, tire rotation, and 30/60/90K services." },
    ],
    proof: ["ASE Certified", "12-Month Warranty", "Free Diagnostics", "All Makes & Models"],
    features: [
      { title: "Digital Inspections", desc: "Photos and videos of your car's issues sent to your phone." },
      { title: "Shuttle Service", desc: "Free local shuttle and loaner cars for major repairs." },
      { title: "Honest Pricing", desc: "We show you the parts, the labor, and the why before we start." },
    ],
  },
  cleaning: {
    hero: "Professional Cleaning Services",
    sub: "Bonded and insured. Eco-friendly products. Satisfaction guaranteed. We make your space spotless, every time.",
    cta: "Get Free Quote",
    primary: "#1e3a5f",
    accent: "#06b6d4",
    services: [
      { title: "Residential Cleaning", desc: "Weekly, bi-weekly, and monthly cleaning for homes of any size." },
      { title: "Commercial Cleaning", desc: "Office, retail, and medical facility cleaning after hours." },
      { title: "Deep Cleaning", desc: "Move-in, move-out, and spring deep cleans with detail checklist." },
      { title: "Post-Construction", desc: "Dust removal, window cleaning, and final cleanup for new builds." },
    ],
    proof: ["Bonded & Insured", "Eco-Friendly", "Satisfaction Guaranteed", "Free Estimates"],
    features: [
      { title: "Trusted Teams", desc: "Background-checked, trained, and uniformed — same team every visit." },
      { title: "Green Cleaning", desc: "Non-toxic, biodegradable products safe for kids, pets, and allergies." },
      { title: "Guaranteed Clean", desc: "If it's not right, we come back and re-clean — no charge." },
    ],
  },
};

// Display-name niches map to the same configs
const DISPLAY_MAP: Record<string, string> = {
  "Legal": "legal",
  "Real Estate": "real_estate",
  "Epoxy Flooring": "epoxy",
  "Roofing": "roofing",
  "HVAC": "hvac",
  "Plumbing": "plumbing",
  "Electrical": "electrician",
  "Med Spa": "med_spa",
  "Dental": "dental",
  "Chiropractic": "chiropractic",
  "Remodeling": "remodeling",
  "Landscaping": "landscaping",
  "Solar": "solar",
  "Pest Control": "pest_control",
};

function getConfig(niche: string): NicheConfig {
  const key = (niche || "").toLowerCase().replace(/ /g, "_");
  return NICHE_CONFIGS[key] || NICHE_CONFIGS[DISPLAY_MAP[niche]] || NICHE_CONFIGS.epoxy;
}

function esc(s: string): string {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/**
 * Generate a complete, styled HTML document for a template niche.
 * This is rendered inside an iframe via srcDoc.
 */
export function generateTemplateHtml(niche: string, brandName?: string): string {
  const cfg = getConfig(niche);
  const brand = brandName || cfg.hero.split(" — ")[0].split(" — ")[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(brand)} — ${esc(cfg.hero)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1a1a2e;line-height:1.6;background:#fff}
a{text-decoration:none;color:inherit}
.container{max-width:1140px;margin:0 auto;padding:0 24px}

/* Header */
.header{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.95);backdrop-filter:blur(12px);border-bottom:1px solid #e8e8e8}
.header .container{display:flex;align-items:center;justify-content:space-between;height:72px}
.brand{font-size:20px;font-weight:800;color:${cfg.primary};letter-spacing:-.02em}
.nav{display:flex;gap:28px}
.nav a{font-size:14px;font-weight:600;color:#555;transition:color .2s}
.nav a:hover{color:${cfg.primary}}
.cta-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:700;color:#fff;background:linear-gradient(135deg,${cfg.primary},${cfg.accent});box-shadow:0 4px 14px ${cfg.accent}33;transition:transform .15s,box-shadow .15s;cursor:pointer;border:none}
.cta-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px ${cfg.accent}44}

/* Hero */
.hero{position:relative;overflow:hidden;background:linear-gradient(135deg,${cfg.primary} 0%,${cfg.primary}dd 60%,${cfg.accent}88 100%);color:#fff;padding:80px 0 100px}
.hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:60px;background:linear-gradient(to top,rgba(255,255,255,1),transparent)}
.hero .container{position:relative;z-index:1;max-width:760px;text-align:center}
.hero h1{font-size:42px;font-weight:800;line-height:1.1;letter-spacing:-.02em;margin-bottom:16px}
.hero p{font-size:18px;opacity:.92;margin-bottom:32px;max-width:620px;margin-left:auto;margin-right:auto}
.hero .cta-btn{font-size:16px;padding:16px 36px}
.hero .cta-btn.light{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);box-shadow:none}
.hero .cta-btn.light:hover{background:rgba(255,255,255,.25)}

/* Proof bar */
.proof{display:flex;justify-content:center;gap:40px;padding:28px 0;flex-wrap:wrap}
.proof span{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:#333}
.proof span::before{content:'✓';color:${cfg.accent};font-size:18px}

/* Services */
.section{padding:64px 0}
.section.alt{background:#f8f9fb}
.section-head{text-align:center;margin-bottom:48px}
.section-head h2{font-size:30px;font-weight:800;color:${cfg.primary};letter-spacing:-.02em;margin-bottom:8px}
.section-head p{font-size:16px;color:#666}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}
.card{background:#fff;border:1px solid #e8e8e8;border-radius:16px;padding:28px;transition:border-color .2s,box-shadow .2s,transform .15s}
.card:hover{border-color:${cfg.accent};box-shadow:0 8px 30px ${cfg.accent}1a;transform:translateY(-2px)}
.card h3{font-size:18px;font-weight:700;color:${cfg.primary};margin-bottom:10px}
.card p{font-size:14px;color:#555;line-height:1.5}
.card .icon{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,${cfg.primary}15,${cfg.accent}15);display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:20px}

/* Features */
.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:32px}
.feature{display:flex;gap:16px;align-items:flex-start}
.feature .num{flex-shrink:0;width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,${cfg.primary},${cfg.accent});color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px}
.feature h3{font-size:17px;font-weight:700;color:${cfg.primary};margin-bottom:6px}
.feature p{font-size:14px;color:#555;line-height:1.5}

/* CTA */
.cta-section{background:linear-gradient(135deg,${cfg.primary},${cfg.accent});color:#fff;text-align:center;padding:64px 0}
.cta-section h2{font-size:30px;font-weight:800;margin-bottom:12px}
.cta-section p{font-size:17px;opacity:.92;margin-bottom:28px}
.cta-section .cta-btn{background:#fff;color:${cfg.primary}}

/* Footer */
.footer{background:#1a1a2e;color:#999;padding:40px 0;text-align:center;font-size:14px}
.footer .brand{color:#fff;margin-bottom:8px;font-size:18px}

@media(max-width:768px){
  .nav{display:none}
  .hero h1{font-size:30px}
  .hero p{font-size:16px}
  .proof{gap:20px}
}
</style>
</head>
<body>

<header class="header">
  <div class="container">
    <div class="brand">${esc(brand)}</div>
    <nav class="nav">
      <a href="#">Services</a>
      <a href="#">About</a>
      <a href="#">Reviews</a>
      <a href="#">Contact</a>
    </nav>
    <button class="cta-btn">${esc(cfg.cta)}</button>
  </div>
</header>

<section class="hero">
  <div class="container">
    <h1>${esc(cfg.hero)}</h1>
    <p>${esc(cfg.sub)}</p>
    <button class="cta-btn">${esc(cfg.cta)}</button>
  </div>
</section>

<div class="container">
  <div class="proof">
    ${cfg.proof.map((p) => `<span>${esc(p)}</span>`).join("\n    ")}
  </div>
</div>

<section class="section alt">
  <div class="container">
    <div class="section-head">
      <h2>Our Services</h2>
      <p>Professional, reliable, and backed by our satisfaction guarantee.</p>
    </div>
    <div class="grid">
      ${cfg.services.map((s) => `<div class="card">
        <div class="icon">★</div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.desc)}</p>
      </div>`).join("\n      ")}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <h2>Why Choose Us</h2>
      <p>The difference is in the details.</p>
    </div>
    <div class="features">
      ${cfg.features.map((f, i) => `<div class="feature">
        <div class="num">${i + 1}</div>
        <div>
          <h3>${esc(f.title)}</h3>
          <p>${esc(f.desc)}</p>
        </div>
      </div>`).join("\n      ")}
    </div>
  </div>
</section>

<section class="cta-section">
  <div class="container">
    <h2>Ready to Get Started?</h2>
    <p>Contact us today for a free consultation and quote.</p>
    <button class="cta-btn">${esc(cfg.cta)}</button>
  </div>
</section>

<footer class="footer">
  <div class="brand">${esc(brand)}</div>
  <p>&copy; 2026 ${esc(brand)}. All rights reserved. Licensed & Insured.</p>
</footer>

</body>
</html>`;
}

/**
 * Get all supported niches
 */
export function getSupportedNiches(): string[] {
  return Object.keys(NICHE_CONFIGS);
}