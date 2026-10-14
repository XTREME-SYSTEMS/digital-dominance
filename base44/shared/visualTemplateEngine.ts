/**
 * Visual Template Engine v2 — Professional Contractor Websites
 * Based on research of top-converting contractor websites (Revolution Contractors,
 * Hook Agency examples, Webflow construction designs).
 *
 * Key design principles from research:
 * 1. Hero with REAL background image + dark overlay (not flat gradients)
 * 2. Trust bar: star ratings, license #, years in business, certifications
 * 3. Services with real images, not just text cards
 * 4. Project gallery with real photos
 * 5. Testimonials with star ratings, names, and avatars
 * 6. Stats section (projects completed, years, reviews)
 * 7. Sticky header with phone number always visible
 * 8. Contact form section
 * 9. Depth through shadows, borders, rounded corners, layering
 * 10. Each niche gets unique images, colors, and copy
 */

interface NicheProfile {
  hero: string;
  sub: string;
  cta: string;
  phone: string;
  primary: string;
  primaryDark: string;
  accent: string;
  bgImage: string;
  services: { title: string; desc: string; img: string }[];
  gallery: string[];
  testimonials: { name: string; text: string; avatar: string; rating: number }[];
  stats: { value: string; label: string }[];
  trustBadges: string[];
  serviceName: string;
}

// Curated Unsplash images per niche — real project photos
const IMG = {
  // Water damage — AI-generated, niche-accurate
  water_hero: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/87b7fddba_generated_image.png",
  water_flood: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/625091ac6_generated_image.png",
  water_dry: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/e82d55fac_generated_image.png",
  water_mold: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/08601ffcf_generated_image.png",
  water_insurance: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/2114d8c16_generated_image.png",
  // Roofing — AI-generated, niche-accurate
  roof_hero: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/bfb095775_generated_image.png",
  roof_repair: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/c04efeee7_generated_image.png",
  roof_install: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/c2fc1ae62_generated_image.png",
  roof_storm: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/ea29f8fd1_generated_image.png",
  roof_inspect: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/1ab3de3ce_generated_image.png",
  // HVAC — AI-generated, niche-accurate
  hvac_hero: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/74289ef54_generated_image.png",
  hvac_ac: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/2c8edf284_generated_image.png",
  hvac_heat: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/6d6b637c5_generated_image.png",
  hvac_install: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/6d6b637c5_generated_image.png",
  hvac_maint: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/c2c0032fc_generated_image.png",
  // Plumbing — AI-generated, niche-accurate
  plumb_hero: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/f02fc3854_generated_image.png",
  plumb_leak: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/375345d65_generated_image.png",
  plumb_drain: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/21711fbff_generated_image.png",
  plumb_heater: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/381282a69_generated_image.png",
  plumb_emerg: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/2192a4641_generated_image.png",
  // Epoxy — AI-generated, niche-accurate images
  epoxy_hero: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/c3960f3b6_generated_image.png",
  epoxy_garage: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/ac7e135ea_generated_image.png",
  epoxy_metallic: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/f1c5d468a_generated_image.png",
  epoxy_commercial: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/2f146ecff_generated_image.png",
  epoxy_polish: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/4f75aa368_generated_image.png",
  // Electrician — AI-generated, niche-accurate
  elec_hero: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/60117973e_generated_image.png",
  elec_panel: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/4259ad94c_generated_image.png",
  elec_ev: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/93790c590_generated_image.png",
  elec_light: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/75c5ea984_generated_image.png",
  elec_rewire: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/f8d1f7b0e_generated_image.png",
  // Generic fallbacks
  generic_hero: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80",
  avatar1: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  avatar2: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  avatar3: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
  avatar4: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  avatar5: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
  avatar6: "https://images.unsplash.com/photo-1539571696357-5a69c7e5b9e5?w=200&q=80",
  // Gallery fallbacks
  // Verified stable Unsplash fallbacks (from SafeImage component)
  gallery1: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
  gallery2: "https://images.unsplash.com/photo-1581578731548-c64695cccae9?w=800&q=80",
  gallery3: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
  gallery4: "https://images.unsplash.com/photo-1581578731548-c64695cccae9?w=800&q=80",
};

const NICHES: Record<string, NicheProfile> = {
  water_damage: {
    hero: "24/7 Emergency Water Damage Restoration",
    sub: "We respond in 30 minutes to extract water, dry your property, and stop mold before it spreads. Insurance approved, IICRC certified.",
    cta: "Call Now — Free Assessment",
    phone: "(555) 100-2477",
    primary: "#0c4a6e",
    primaryDark: "#082f49",
    accent: "#0284c7",
    bgImage: IMG.water_hero,
    serviceName: "Water Damage Restoration",
    services: [
      { title: "Emergency Water Extraction", desc: "Industrial pumps remove standing water in minutes. We work fast to minimize damage.", img: IMG.water_flood },
      { title: "Structural Drying & Dehumidification", desc: "Thermal imaging finds hidden moisture. We dry every wall, floor, and cavity completely.", img: IMG.water_dry },
      { title: "Mold Prevention & Treatment", desc: "Antimicrobial application stops mold colonies before they can form and spread.", img: IMG.water_mold },
      { title: "Direct Insurance Billing", desc: "We document everything and bill your insurance directly. You focus on your family.", img: IMG.water_insurance },
    ],
    gallery: [IMG.water_flood, IMG.water_dry, IMG.water_mold, IMG.gallery1],
    testimonials: [
      { name: "Sarah M.", text: "They arrived in 20 minutes at 2am. Saved our hardwood floors from total ruin. True professionals.", avatar: IMG.avatar2, rating: 5 },
      { name: "James T.", text: "After our pipe burst, they handled everything including the insurance claim. Couldn't have asked for better service.", avatar: IMG.avatar1, rating: 5 },
      { name: "Patricia L.", text: "The thermal imaging found water we never knew was there. So thorough and professional from start to finish.", avatar: IMG.avatar3, rating: 5 },
    ],
    stats: [
      { value: "30 min", label: "Average response time" },
      { value: "2,500+", label: "Properties restored" },
      { value: "4.9★", label: "Average rating" },
      { value: "24/7", label: "Always available" },
    ],
    trustBadges: ["IICRC Certified", "Insurance Approved", "Licensed & Insured", "BBB A+"],
  },
  roofing: {
    hero: "Professional Roofing — Repairs, Replacement & Storm Damage",
    sub: "Licensed roofers serving your area since 2008. Free 27-point inspections, storm damage specialists, and manufacturer warranties on every install.",
    cta: "Schedule Free Inspection",
    phone: "(555) 200-7663",
    primary: "#7c2d12",
    primaryDark: "#431407",
    accent: "#ea580c",
    bgImage: IMG.roof_hero,
    serviceName: "Roofing Services",
    services: [
      { title: "Roof Repair & Leak Detection", desc: "Fast, lasting repairs for shingle, tile, metal, and flat roofs. We find and fix leaks right.", img: IMG.roof_repair },
      { title: "Complete Roof Replacement", desc: "Full tear-off and installation with GAF and Owens Corning manufacturer warranties.", img: IMG.roof_install },
      { title: "Storm Damage & Insurance", desc: "Hail and wind damage assessment with full documentation for your insurance claim.", img: IMG.roof_storm },
      { title: "Free Roof Inspection", desc: "27-point inspection with photo report and honest assessment. No pressure, no upselling.", img: IMG.roof_inspect },
    ],
    gallery: [IMG.roof_repair, IMG.roof_install, IMG.roof_storm, IMG.gallery4],
    testimonials: [
      { name: "Michael R.", text: "After the hail storm, they documented everything and got our full roof replacement approved by insurance. Amazing work.", avatar: IMG.avatar1, rating: 5 },
      { name: "Diane K.", text: "They found a leak three other roofers missed. Fixed it in one visit. Honest and knowledgeable.", avatar: IMG.avatar2, rating: 5 },
      { name: "Robert H.", text: "New roof looks incredible. Crew was professional, cleaned up perfectly, finished ahead of schedule.", avatar: IMG.avatar4, rating: 5 },
    ],
    stats: [
      { value: "15+ yrs", label: "In business" },
      { value: "8,000+", label: "Roofs completed" },
      { value: "4.9★", label: "Average rating" },
      { value: "20-yr", label: "Warranty" },
    ],
    trustBadges: ["GAF Certified", "Licensed & Insured", "BBB A+", "Free Inspections"],
  },
  hvac: {
    hero: "HVAC Services — Same-Day AC Repair & Installation",
    sub: "NATE-certified technicians available 24/7. Same-day AC repair, high-efficiency system installation, and maintenance plans that extend system life.",
    cta: "Book Service Today",
    phone: "(555) 300-4822",
    primary: "#1e3a5f",
    primaryDark: "#0f1e3a",
    accent: "#0ea5e9",
    bgImage: IMG.hvac_hero,
    serviceName: "HVAC Services",
    services: [
      { title: "AC Repair & Diagnostics", desc: "Same-day service for all brands. We diagnose accurately and fix it right the first time.", img: IMG.hvac_ac },
      { title: "Heating & Furnace Service", desc: "Furnace and heat pump repair, installation, and annual tune-ups for peak efficiency.", img: IMG.hvac_heat },
      { title: "System Installation", desc: "High-efficiency systems sized correctly for your home. Free estimates and financing available.", img: IMG.hvac_install },
      { title: "Preventive Maintenance", desc: "Annual maintenance plans that extend system life, improve efficiency, and prevent breakdowns.", img: IMG.hvac_maint },
    ],
    gallery: [IMG.hvac_ac, IMG.hvac_heat, IMG.hvac_install, IMG.gallery2],
    testimonials: [
      { name: "Jennifer S.", text: "AC died at midnight in July. They had a tech here in 45 minutes and fixed it by 2am. Lifesavers.", avatar: IMG.avatar2, rating: 5 },
      { name: "David W.", text: "Installed our new system in one day. The difference in comfort and energy bills is incredible.", avatar: IMG.avatar1, rating: 5 },
      { name: "Linda P.", text: "Maintenance plan is worth every penny. They catch problems before they become emergencies.", avatar: IMG.avatar3, rating: 5 },
    ],
    stats: [
      { value: "24/7", label: "Emergency service" },
      { value: "5,000+", label: "Systems serviced" },
      { value: "4.8★", label: "Average rating" },
      { value: "Same-day", label: "AC repair" },
    ],
    trustBadges: ["NATE Certified", "Licensed & Insured", "All Brands", "Financing Available"],
  },
  plumbing: {
    hero: "Licensed Plumbers — Repairs, Drains & Water Heaters",
    sub: "Licensed master plumbers with upfront pricing and no mess left behind. From minor leaks to full repipes, we fix it right the first time.",
    cta: "Call for Fast Service",
    phone: "(555) 400-7586",
    primary: "#1e3a5f",
    primaryDark: "#0f1e3a",
    accent: "#0ea5e9",
    bgImage: IMG.plumb_hero,
    serviceName: "Plumbing Services",
    services: [
      { title: "Leak Repair & Detection", desc: "Slab leak detection, pipe repair, and whole-house repiping with minimal disruption.", img: IMG.plumb_leak },
      { title: "Drain Cleaning & Hydro-Jetting", desc: "Camera inspection and high-pressure hydro-jetting for stubborn clogs and tree roots.", img: IMG.plumb_drain },
      { title: "Water Heater Service", desc: "Tank and tankless water heater repair, installation, and annual flushing.", img: IMG.plumb_heater },
      { title: "Emergency Plumbing", desc: "Burst pipes, sewage backups, and overflows — we respond 24/7 with fast solutions.", img: IMG.plumb_emerg },
    ],
    gallery: [IMG.plumb_leak, IMG.plumb_drain, IMG.plumb_heater, IMG.gallery1],
    testimonials: [
      { name: "Thomas B.", text: "Found our slab leak without tearing up the whole floor. Saved us thousands. True professionals.", avatar: IMG.avatar1, rating: 5 },
      { name: "Maria G.", text: "Upfront pricing with no surprises. They showed me exactly what needed fixing and why.", avatar: IMG.avatar2, rating: 5 },
      { name: "Kevin F.", text: "Replaced our old water heater same day. Clean work, fair price, no mess left behind.", avatar: IMG.avatar4, rating: 5 },
    ],
    stats: [
      { value: "24/7", label: "Emergency service" },
      { value: "6,000+", label: "Jobs completed" },
      { value: "4.9★", label: "Average rating" },
      { value: "Upfront", label: "Pricing" },
    ],
    trustBadges: ["Licensed Master Plumbers", "Bonded & Insured", "BBB A+", "Background Checked"],
  },
  epoxy: {
    hero: "Epoxy Flooring — Transform Your Garage into a Showroom",
    sub: "Industrial-grade epoxy with polyaspartic topcoat. 15-year warranty, UV-resistant, 1-day installation. Walk on it in 12 hours, drive in 24.",
    cta: "Get Free Quote",
    phone: "(555) 500-3769",
    primary: "#334155",
    primaryDark: "#1e293b",
    accent: "#0ea5e9",
    bgImage: IMG.epoxy_hero,
    serviceName: "Epoxy Flooring",
    services: [
      { title: "Garage Floor Epoxy", desc: "3-layer system with polyaspartic topcoat that resists UV, hot tires, and chemicals. 15-year warranty.", img: IMG.epoxy_garage },
      { title: "Metallic Epoxy Finishes", desc: "Luxury metallic floors that mimic polished concrete and marble for homes and showrooms.", img: IMG.epoxy_metallic },
      { title: "Commercial Epoxy Floors", desc: "Warehouse, retail, and restaurant epoxy systems built for heavy traffic and easy cleaning.", img: IMG.epoxy_commercial },
      { title: "Concrete Polishing", desc: "Grind-and-polish system for a durable, low-maintenance, professional finish.", img: IMG.epoxy_polish },
    ],
    gallery: [IMG.epoxy_garage, IMG.epoxy_metallic, IMG.epoxy_commercial, IMG.epoxy_polish],
    testimonials: [
      { name: "Amanda J.", text: "My garage looks like a showroom now. The metallic finish is absolutely stunning. Worth every penny.", avatar: IMG.avatar2, rating: 5 },
      { name: "Chris D.", text: "Done in one day, walked on it the next morning. No smell, no mess. Professional crew start to finish.", avatar: IMG.avatar1, rating: 5 },
      { name: "Sandra V.", text: "Three years later and it still looks brand new. The UV resistance is real — no yellowing at all.", avatar: IMG.avatar3, rating: 5 },
    ],
    stats: [
      { value: "1-day", label: "Installation" },
      { value: "3,000+", label: "Floors completed" },
      { value: "4.9★", label: "Average rating" },
      { value: "15-yr", label: "Warranty" },
    ],
    trustBadges: ["Industrial Grade", "UV Resistant", "Licensed & Insured", "15-Year Warranty"],
  },
  electrician: {
    hero: "Licensed Electricians — Panel Upgrades, EV Chargers & More",
    sub: "Licensed, bonded, and insured. From panel upgrades to EV charger installation, we deliver safe, code-compliant electrical work.",
    cta: "Schedule Service",
    phone: "(555) 600-3528",
    primary: "#451a03",
    primaryDark: "#1c0a00",
    accent: "#facc15",
    bgImage: IMG.elec_hero,
    serviceName: "Electrical Services",
    services: [
      { title: "Panel Upgrades & Service Changes", desc: "200A service upgrades and sub-panel installation for modern homes and EV charging.", img: IMG.elec_panel },
      { title: "EV Charger Installation", desc: "Level 2 charger installation for Tesla, Ford, GM, and all EVs. Certified installer.", img: IMG.elec_ev },
      { title: "Lighting Design & Installation", desc: "Recessed lighting, under-cabinet, exterior, and smart lighting solutions.", img: IMG.elec_light },
      { title: "Whole-Home Rewiring", desc: "Knob-and-tube and aluminum wiring replacement for safety and insurance compliance.", img: IMG.elec_rewire },
    ],
    gallery: [IMG.elec_panel, IMG.elec_ev, IMG.elec_light, IMG.elec_rewire],
    testimonials: [
      { name: "Steven W.", text: "Upgraded our panel and installed a Tesla charger in one day. Clean work, passed inspection first try.", avatar: IMG.avatar1, rating: 5 },
      { name: "Rachel M.", text: "They rewired our 1950s home safely and cleanly. The peace of mind is worth every penny.", avatar: IMG.avatar2, rating: 5 },
      { name: "Mark T.", text: "Recessed lighting throughout the house. They patched every hole perfectly — you'd never know they were here.", avatar: IMG.avatar4, rating: 5 },
    ],
    stats: [
      { value: "10+ yrs", label: "In business" },
      { value: "4,000+", label: "Projects completed" },
      { value: "4.9★", label: "Average rating" },
      { value: "100%", label: "Code compliant" },
    ],
    trustBadges: ["Licensed & Insured", "EV Certified", "NEC Compliant", "Same-Day Service"],
  },
  pest_control: {
    hero: "Pest Control — Family-Safe Extermination & Prevention",
    sub: "Eco-friendly treatments safe for kids and pets. Quarterly protection plans with free re-treatments. Same-day service available.",
    cta: "Get Pest-Free Today",
    phone: "(555) 700-7378",
    primary: "#14532d",
    primaryDark: "#052e16",
    accent: "#22c55e",
    bgImage: IMG.generic_hero,
    serviceName: "Pest Control",
    services: [
      { title: "General Pest Control", desc: "Ants, roaches, spiders, and silverfish — eliminated and kept out with quarterly service.", img: IMG.gallery1 },
      { title: "Termite Treatment & Prevention", desc: "Bait systems and liquid barriers with annual warranty and monitoring.", img: IMG.gallery2 },
      { title: "Rodent Removal & Exclusion", desc: "Trapping, exclusion repairs, and sanitization for mice and rats.", img: IMG.gallery3 },
      { title: "Mosquito & Tick Control", desc: "Monthly misting systems for yards, patios, and outdoor event spaces.", img: IMG.gallery4 },
    ],
    gallery: [IMG.gallery1, IMG.gallery2, IMG.gallery3, IMG.gallery4],
    testimonials: [
      { name: "Lisa H.", text: "No more ants in the kitchen. The quarterly plan keeps our home pest-free without harsh chemicals.", avatar: IMG.avatar2, rating: 5 },
      { name: "Paul R.", text: "Termite treatment was thorough and the warranty gives us peace of mind. Professional team.", avatar: IMG.avatar1, rating: 5 },
      { name: "Nancy D.", text: "They sealed every entry point the mice were using. Haven't seen one in months.", avatar: IMG.avatar3, rating: 5 },
    ],
    stats: [
      { value: "Same-day", label: "Service available" },
      { value: "3,500+", label: "Homes protected" },
      { value: "4.8★", label: "Average rating" },
      { value: "Pet &", label: "Child safe" },
    ],
    trustBadges: ["Licensed Technicians", "Eco-Friendly", "Quarterly Plans", "Free Re-treatments"],
  },
  landscaping: {
    hero: "Landscaping & Hardscaping — Award-Winning Design",
    sub: "3D design previews, full-service installation, and 5-year warranty. From custom patios to complete landscape transformations.",
    cta: "Free Design Consultation",
    phone: "(555) 800-5263",
    primary: "#14532d",
    primaryDark: "#052e16",
    accent: "#84cc16",
    bgImage: IMG.gallery1,
    serviceName: "Landscaping Services",
    services: [
      { title: "Landscape Design", desc: "3D-rendered design plans tailored to your property, style, and budget.", img: IMG.gallery1 },
      { title: "Hardscaping & Patios", desc: "Patios, walkways, retaining walls, fire pits, and outdoor kitchens in stone and paver.", img: IMG.gallery2 },
      { title: "Lawn Care & Maintenance", desc: "Weekly mowing, edging, fertilization, and weed control programs.", img: IMG.gallery1 },
      { title: "Irrigation Systems", desc: "Smart sprinkler installation, repair, and seasonal maintenance.", img: IMG.gallery2 },
    ],
    gallery: [IMG.gallery1, IMG.gallery2, IMG.gallery1, IMG.gallery2],
    testimonials: [
      { name: "Greg W.", text: "The 3D design preview sold us immediately. The finished patio looks exactly like the render. Incredible.", avatar: IMG.avatar1, rating: 5 },
      { name: "Bonnie L.", text: "Our backyard went from dirt to a beautiful outdoor living space. The crew was professional and clean.", avatar: IMG.avatar2, rating: 5 },
      { name: "Frank S.", text: "Weekly maintenance keeps our lawn looking like a golf course. Reliable, thorough, and fairly priced.", avatar: IMG.avatar4, rating: 5 },
    ],
    stats: [
      { value: "12+ yrs", label: "In business" },
      { value: "1,200+", label: "Projects completed" },
      { value: "4.9★", label: "Average rating" },
      { value: "5-yr", label: "Warranty" },
    ],
    trustBadges: ["Award-Winning Design", "Licensed & Insured", "5-Year Warranty", "Free Estimates"],
  },
  mold_remediation: {
    hero: "Certified Mold Remediation — Protect Your Family",
    sub: "IICRC certified mold inspection, removal, and prevention. Air quality testing with lab-certified results. We fix the moisture source, not just the symptoms.",
    cta: "Free Mold Inspection",
    phone: "(555) 900-6653",
    primary: "#14532d",
    primaryDark: "#052e16",
    accent: "#10b981",
    bgImage: IMG.water_mold,
    serviceName: "Mold Remediation",
    services: [
      { title: "Mold Inspection & Air Quality Testing", desc: "Moisture mapping and air sampling with independent lab-certified results.", img: IMG.water_mold },
      { title: "Mold Removal & Remediation", desc: "Containment, HEPA filtration, and antimicrobial treatment following IICRC standards.", img: IMG.water_dry },
      { title: "Moisture Source Repair", desc: "We fix the underlying moisture problem causing the mold — permanently.", img: IMG.water_flood },
      { title: "Post-Remediation Clearance Testing", desc: "Independent lab verification that your air is safe before we leave.", img: IMG.water_insurance },
    ],
    gallery: [IMG.water_mold, IMG.water_dry, IMG.water_flood, IMG.gallery1],
    testimonials: [
      { name: "Carol M.", text: "They found mold behind our walls we didn't know about. Removed it safely and fixed the leak causing it.", avatar: IMG.avatar2, rating: 5 },
      { name: "Steve D.", text: "Air quality testing gave us proof our home was safe. The clearance report was thorough and professional.", avatar: IMG.avatar1, rating: 5 },
      { name: "Anna P.", text: "They treated our home like a hospital — containment, HEPA, the works. Our kids' allergies cleared up completely.", avatar: IMG.avatar3, rating: 5 },
    ],
    stats: [
      { value: "IICRC", label: "Certified" },
      { value: "1,800+", label: "Remediations done" },
      { value: "4.9★", label: "Average rating" },
      { value: "Lab", label: "Verified results" },
    ],
    trustBadges: ["IICRC Certified", "Lab-Tested Results", "Insurance Approved", "Lifetime Warranty"],
  },
  fire_damage: {
    hero: "Fire Damage Restoration — Rebuilding Your Home & Life",
    sub: "IICRC certified restoration. From emergency board-up to final paint, we handle every step. Direct insurance billing and full reconstruction.",
    cta: "24/7 Emergency Line",
    phone: "(555) 110-3473",
    primary: "#7f1d1d",
    primaryDark: "#450a0a",
    accent: "#ef4444",
    bgImage: IMG.generic_hero,
    serviceName: "Fire Damage Restoration",
    services: [
      { title: "Soot & Smoke Cleanup", desc: "Dry cleaning and chemical sponging for walls, ceilings, and all contents.", img: IMG.gallery1 },
      { title: "Odor Removal & Deodorization", desc: "Thermal fogging and ozone treatment that destroys smoke molecules at the source.", img: IMG.gallery2 },
      { title: "Content Cleaning & Pack-Out", desc: "Pack-out, ultrasonic cleaning, and secure climate-controlled storage.", img: IMG.gallery3 },
      { title: "Full Reconstruction", desc: "Complete build-back from framing to finish — one contractor, one call.", img: IMG.gallery4 },
    ],
    gallery: [IMG.gallery1, IMG.gallery2, IMG.gallery3, IMG.gallery4],
    testimonials: [
      { name: "Henry W.", text: "After the fire, they boarded up our home that night and handled everything. We got our life back.", avatar: IMG.avatar1, rating: 5 },
      { name: "Susan B.", text: "You'd never know there was a fire. The odor removal was incredible — not a trace of smoke left.", avatar: IMG.avatar2, rating: 5 },
      { name: "Joe M.", text: "They dealt with our insurance directly and rebuilt our kitchen better than before. True professionals.", avatar: IMG.avatar4, rating: 5 },
    ],
    stats: [
      { value: "24/7", label: "Emergency response" },
      { value: "1,200+", label: "Homes restored" },
      { value: "4.9★", label: "Average rating" },
      { value: "One", label: "Stop recovery" },
    ],
    trustBadges: ["IICRC Certified", "Insurance Direct", "24/7 Response", "Full Rebuild"],
  },
  garage_door: {
    hero: "Garage Door Repair & Installation — Same-Day Service",
    sub: "All brands serviced. Broken springs replaced same-day. New door installation with lifetime warranty. Openers, panels, and smart systems.",
    cta: "Call for Same-Day Repair",
    phone: "(555) 120-4273",
    primary: "#334155",
    primaryDark: "#1e293b",
    accent: "#3b82f6",
    bgImage: IMG.generic_hero,
    serviceName: "Garage Door Services",
    services: [
      { title: "Spring Replacement", desc: "Torsion and extension spring repair — same-day, every day. Most common fix.", img: IMG.gallery1 },
      { title: "Opener Repair & Installation", desc: "Chain, belt, and screw drive opener service. Smart opener upgrades available.", img: IMG.gallery2 },
      { title: "New Door Installation", desc: "Steel, wood, carriage-house, and modern aluminum doors with lifetime warranty.", img: IMG.gallery3 },
      { title: "Panel Replacement", desc: "Match existing panels or upgrade your door without full replacement.", img: IMG.gallery4 },
    ],
    gallery: [IMG.gallery1, IMG.gallery2, IMG.gallery3, IMG.gallery4],
    testimonials: [
      { name: "Mike B.", text: "Spring broke at 6am. They were at my house by 9am and fixed it in 30 minutes. Fast and professional.", avatar: IMG.avatar1, rating: 5 },
      { name: "Diane F.", text: "New carriage-house doors look amazing. The smart opener lets me control from my phone. Love it.", avatar: IMG.avatar2, rating: 5 },
      { name: "Tony R.", text: "They fixed my opener that two other companies couldn't diagnose. Finally works perfectly.", avatar: IMG.avatar4, rating: 5 },
    ],
    stats: [
      { value: "Same-day", label: "Spring repair" },
      { value: "5,000+", label: "Doors serviced" },
      { value: "4.9★", label: "Average rating" },
      { value: "Lifetime", label: "Warranty" },
    ],
    trustBadges: ["Same-Day Service", "All Brands", "Licensed & Insured", "Lifetime Warranty"],
  },
  legal: {
    hero: "Trusted Legal Representation — Proven Results",
    sub: "20+ years of aggressive advocacy. Free consultation. Personal injury cases handled on a contingency basis — no fee unless we win.",
    cta: "Schedule Free Consultation",
    phone: "(555) 130-5348",
    primary: "#1e293b",
    primaryDark: "#0f172a",
    accent: "#c9a227",
    bgImage: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&q=80",
    serviceName: "Legal Services",
    services: [
      { title: "Personal Injury", desc: "Maximizing compensation for accident victims. No fee unless we win your case.", img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80" },
      { title: "Business Law", desc: "Contract review, entity formation, commercial litigation, and general counsel.", img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3a?w=800&q=80" },
      { title: "Estate Planning", desc: "Wills, trusts, and probate to protect your legacy and your loved ones.", img: IMG.gallery2 },
      { title: "Family Law", desc: "Divorce, custody, and support with compassionate, strong, effective counsel.", img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80" },
    ],
    gallery: ["https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80", "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3a?w=800&q=80", IMG.gallery2, IMG.gallery1],
    testimonials: [
      { name: "Robert J.", text: "They fought for every dollar I deserved. The settlement was triple what the insurance company initially offered.", avatar: IMG.avatar1, rating: 5 },
      { name: "Maria S.", text: "Guided me through a difficult divorce with compassion and strength. Always available when I needed answers.", avatar: IMG.avatar2, rating: 5 },
      { name: "James W.", text: "Set up our family trust efficiently and explained everything clearly. Peace of mind for our family.", avatar: IMG.avatar4, rating: 5 },
    ],
    stats: [
      { value: "20+ yrs", label: "Experience" },
      { value: "$50M+", label: "Recovered" },
      { value: "4.9★", label: "Client rating" },
      { value: "No fee", label: "Unless we win" },
    ],
    trustBadges: ["20+ Years Experience", "Free Consultation", "Contingency Fee", "5-Star Reviews"],
  },
  real_estate: {
    hero: "Your Trusted Real Estate Partner — Top 1% Agents",
    sub: "Top-producing local agents with 500+ homes sold. Professional marketing, expert negotiation, and full-service support for buyers and sellers.",
    cta: "Start Your Search",
    phone: "(555) 140-7325",
    primary: "#1e3a5f",
    primaryDark: "#0f1e3a",
    accent: "#3b82f6",
    bgImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80",
    serviceName: "Real Estate Services",
    services: [
      { title: "Home Buying", desc: "Buyer representation with deep local market expertise and skilled negotiation.", img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80" },
      { title: "Home Selling", desc: "Professional photography, 3D tours, MLS listing, and full digital marketing.", img: IMG.gallery2 },
      { title: "Property Management", desc: "Tenant screening, rent collection, and maintenance for investment properties.", img: IMG.gallery1 },
      { title: "Free Market Analysis", desc: "Comparative market analysis to price your home right and sell fast.", img: IMG.gallery2 },
    ],
    gallery: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80", IMG.gallery2, IMG.gallery1, IMG.gallery2],
    testimonials: [
      { name: "Patricia L.", text: "Sold our home in 5 days above asking. The marketing was incredible — drone photos and 3D tour made all the difference.", avatar: IMG.avatar2, rating: 5 },
      { name: "David K.", text: "As first-time buyers, they guided us through every step. Found us the perfect home and negotiated a great price.", avatar: IMG.avatar1, rating: 5 },
      { name: "Linda M.", text: "They manage our rental properties flawlessly. Great tenants, no headaches, always on top of everything.", avatar: IMG.avatar3, rating: 5 },
    ],
    stats: [
      { value: "Top 1%", label: "Producing agent" },
      { value: "500+", label: "Homes sold" },
      { value: "4.9★", label: "Client rating" },
      { value: "5 days", label: "Avg. sale time" },
    ],
    trustBadges: ["Top 1% Agents", "500+ Homes Sold", "Free Market Analysis", "5-Star Rated"],
  },
  remodeling: {
    hero: "Home Remodeling — Design-Build, On Schedule, On Budget",
    sub: "3D design previews, fixed-price contracts, and a dedicated project manager. Kitchen, bath, additions, and whole-home renovations.",
    cta: "Get Free Estimate",
    phone: "(555) 150-7363",
    primary: "#78350f",
    primaryDark: "#451a03",
    accent: "#f59e0b",
    bgImage: IMG.gallery2,
    serviceName: "Home Remodeling",
    services: [
      { title: "Kitchen Remodeling", desc: "Custom cabinets, stone countertops, smart appliances, and beautiful finishes.", img: IMG.gallery2 },
      { title: "Bathroom Remodeling", desc: "Walk-in showers, freestanding tubs, and luxury finishes with expert waterproofing.", img: IMG.gallery1 },
      { title: "Home Additions", desc: "Second stories, master suites, and room additions designed to match your home.", img: IMG.gallery2 },
      { title: "Whole-Home Renovation", desc: "Complete gut and rebuild with modern layout, finishes, and smart home features.", img: IMG.gallery1 },
    ],
    gallery: [IMG.gallery2, IMG.gallery1, IMG.gallery2, IMG.gallery1],
    testimonials: [
      { name: "Karen M.", text: "The 3D design let us see our new kitchen before they started. The finished result matched perfectly. Stunning.", avatar: IMG.avatar2, rating: 5 },
      { name: "Bill T.", text: "Fixed-price contract meant no surprises. They finished on time and on budget. Our bathroom is gorgeous.", avatar: IMG.avatar1, rating: 5 },
      { name: "Sandra H.", text: "Our project manager was always available. They handled everything — permits, inspections, the works.", avatar: IMG.avatar3, rating: 5 },
    ],
    stats: [
      { value: "15+ yrs", label: "In business" },
      { value: "800+", label: "Renovations" },
      { value: "4.9★", label: "Client rating" },
      { value: "5-yr", label: "Warranty" },
    ],
    trustBadges: ["Licensed & Insured", "Design-Build", "Fixed-Price Contracts", "5-Year Warranty"],
  },
  med_spa: {
    hero: "Luxury Med Spa — Reveal Your Best Self",
    sub: "Board-certified providers. FDA-approved treatments. Personalized care plans. From Botox to body contouring, we help you look and feel your best.",
    cta: "Book Free Consultation",
    phone: "(555) 160-6337",
    primary: "#581c87",
    primaryDark: "#3b0764",
    accent: "#c084fc",
    bgImage: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&q=80",
    serviceName: "Med Spa Services",
    services: [
      { title: "Botox & Dermal Fillers", desc: "Wrinkle reduction and volume restoration by board-certified injectors.", img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80" },
      { title: "Laser Treatments", desc: "Hair removal, skin resurfacing, and pigmentation correction.", img: IMG.gallery2 },
      { title: "Medical Facials", desc: "HydraFacial, microneedling, and chemical peels for all skin types.", img: IMG.gallery1 },
      { title: "Body Contouring", desc: "Non-invasive fat reduction and skin tightening technology.", img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80" },
    ],
    gallery: ["https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80", IMG.gallery2, IMG.gallery1, IMG.gallery2],
    testimonials: [
      { name: "Emily R.", text: "The results are natural and beautiful. They listen to what you want and never overdo it. My go-to med spa.", avatar: IMG.avatar2, rating: 5 },
      { name: "Jessica L.", text: "The HydraFacial transformed my skin. Three sessions and my acne scars are barely visible.", avatar: IMG.avatar3, rating: 5 },
      { name: "Amanda K.", text: "Professional, clean, and luxurious. The providers are experts who actually listen to your goals.", avatar: IMG.avatar5, rating: 5 },
    ],
    stats: [
      { value: "Board", label: "Certified" },
      { value: "10,000+", label: "Treatments" },
      { value: "4.9★", label: "Client rating" },
      { value: "FDA", label: "Approved" },
    ],
    trustBadges: ["Board-Certified", "FDA-Approved", "Free Consultation", "5-Star Reviews"],
  },
  dental: {
    hero: "Modern Dental Care for the Whole Family",
    sub: "Gentle dentistry with same-day emergencies. Digital technology, sedation options, and a comfort-first philosophy. Your healthiest smile starts here.",
    cta: "Book Appointment",
    phone: "(555) 170-3682",
    primary: "#134e4a",
    primaryDark: "#042f2e",
    accent: "#14b8a6",
    bgImage: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&q=80",
    serviceName: "Dental Services",
    services: [
      { title: "General Dentistry", desc: "Cleanings, exams, fillings, and preventive care for patients of all ages.", img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80" },
      { title: "Cosmetic Dentistry", desc: "Veneers, whitening, and complete smile makeovers with digital preview.", img: IMG.gallery2 },
      { title: "Dental Implants", desc: "Single tooth, multiple teeth, and All-on-4 full-arch restoration.", img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80" },
      { title: "Emergency Dental Care", desc: "Same-day appointments for toothaches, broken teeth, and dental trauma.", img: IMG.gallery1 },
    ],
    gallery: ["https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80", IMG.gallery2, IMG.gallery1, IMG.gallery2],
    testimonials: [
      { name: "Patricia W.", text: "Best dental experience ever. They use sedation and I didn't feel a thing. No more dental anxiety.", avatar: IMG.avatar2, rating: 5 },
      { name: "Robert L.", text: "My veneers look completely natural. The digital preview showed me exactly what to expect.", avatar: IMG.avatar1, rating: 5 },
      { name: "Maria S.", text: "They fit us in same-day when my son chipped his tooth. Gentle, fast, and comforting for a scared kid.", avatar: IMG.avatar3, rating: 5 },
    ],
    stats: [
      { value: "Same-day", label: "Emergencies" },
      { value: "3,000+", label: "Patients" },
      { value: "4.9★", label: "Patient rating" },
      { value: "All ages", label: "Welcome" },
    ],
    trustBadges: ["Accepting New Patients", "Most Insurance", "Same-Day Emergencies", "5-Star Reviews"],
  },
  chiropractic: {
    hero: "Chiropractic Care — Natural Pain Relief Without Drugs",
    sub: "Drug-free pain relief with corrective care and wellness programs. Digital X-ray on-site. Gentle adjustments for every age, from kids to seniors.",
    cta: "New Patient Special",
    phone: "(555) 180-2425",
    primary: "#134e4a",
    primaryDark: "#042f2e",
    accent: "#2dd4bf",
    bgImage: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&q=80",
    serviceName: "Chiropractic Services",
    services: [
      { title: "Spinal Adjustment", desc: "Gentle, precise corrections for neck, back, and joint pain.", img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80" },
      { title: "Corrective Care", desc: "Posture correction and spinal rehabilitation programs.", img: IMG.gallery2 },
      { title: "Massage Therapy", desc: "Therapeutic massage integrated with your chiropractic treatment plan.", img: IMG.gallery1 },
      { title: "Wellness Programs", desc: "Ongoing maintenance care to keep you pain-free, active, and healthy.", img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80" },
    ],
    gallery: ["https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80", IMG.gallery2, IMG.gallery1, IMG.gallery2],
    testimonials: [
      { name: "John D.", text: "After years of back pain, I'm finally pain-free. They address the cause, not just the symptoms.", avatar: IMG.avatar1, rating: 5 },
      { name: "Catherine M.", text: "The on-site X-ray showed exactly what was wrong. The adjustment plan has been life-changing.", avatar: IMG.avatar2, rating: 5 },
      { name: "Phil R.", text: "They adjust my whole family — me, my wife, and the kids. Gentle, professional, and effective.", avatar: IMG.avatar4, rating: 5 },
    ],
    stats: [
      { value: "20+ yrs", label: "Experience" },
      { value: "4,000+", label: "Patients" },
      { value: "4.9★", label: "Patient rating" },
      { value: "Drug-free", label: "Care" },
    ],
    trustBadges: ["New Patient Special", "Most Insurance Accepted", "20+ Years", "5-Star Reviews"],
  },
  solar: {
    hero: "Go Solar — Save on Energy with $0 Down",
    sub: "Premium panels with 25-year warranty. Federal tax credits, production guarantee, and battery-ready systems. $0 down financing available.",
    cta: "Get Free Solar Quote",
    phone: "(555) 190-7652",
    primary: "#1e3a5f",
    primaryDark: "#0f1e3a",
    accent: "#f59e0b",
    bgImage: IMG.gallery1,
    serviceName: "Solar Installation",
    services: [
      { title: "Solar Panel Installation", desc: "Premium panels with 25-year performance warranty and expert installation.", img: IMG.gallery1 },
      { title: "Battery Storage", desc: "Tesla Powerwall and Enphase battery systems for energy independence.", img: IMG.gallery2 },
      { title: "System Design", desc: "Custom system sizing based on your usage, roof, and energy goals.", img: IMG.gallery1 },
      { title: "Monitoring & Maintenance", desc: "Remote monitoring and annual cleaning for peak energy output.", img: IMG.gallery2 },
    ],
    gallery: [IMG.gallery1, IMG.gallery2, IMG.gallery1, IMG.gallery2],
    testimonials: [
      { name: "Steve W.", text: "Our electric bill went from $300/month to $12. The production guarantee gave us confidence to switch.", avatar: IMG.avatar1, rating: 5 },
      { name: "Linda K.", text: "$0 down and paying less than our old electric bill. The battery backup is a bonus during storms.", avatar: IMG.avatar2, rating: 5 },
      { name: "Mike T.", text: "Professional install in one day. The monitoring app shows exactly how much we're producing.", avatar: IMG.avatar4, rating: 5 },
    ],
    stats: [
      { value: "26%", label: "Federal tax credit" },
      { value: "2,000+", label: "Installations" },
      { value: "4.9★", label: "Customer rating" },
      { value: "$0", label: "Down financing" },
    ],
    trustBadges: ["26% Federal Tax Credit", "25-Year Warranty", "Licensed & Insured", "Production Guarantee"],
  },
  automotive: {
    hero: "Auto Repair You Can Trust — ASE Certified",
    sub: "ASE-certified mechanics, honest diagnostics, and 12-month warranty on all repairs. Digital inspections with photos sent to your phone.",
    cta: "Schedule Service",
    phone: "(555) 200-2886",
    primary: "#450a0a",
    primaryDark: "#220404",
    accent: "#dc2626",
    bgImage: "https://images.unsplash.com/photo-1492144534155-93156a5f2de7?w=1600&q=80",
    serviceName: "Auto Repair",
    services: [
      { title: "Engine Repair & Diagnostics", desc: "Check engine light, timing belts, and full engine rebuilds.", img: "https://images.unsplash.com/photo-1492144534155-93156a5f2de7?w=800&q=80" },
      { title: "Brake Service", desc: "Pads, rotors, calipers, and ABS diagnostics for all makes and models.", img: IMG.gallery1 },
      { title: "Transmission Service", desc: "Fluid service, repair, and replacement for automatic and manual.", img: "https://images.unsplash.com/photo-1492144534155-93156a5f2de7?w=800&q=80" },
      { title: "Oil & Maintenance", desc: "Synthetic oil changes, tire rotation, and 30/60/90K services.", img: IMG.gallery2 },
    ],
    gallery: ["https://images.unsplash.com/photo-1492144534155-93156a5f2de7?w=800&q=80", IMG.gallery1, IMG.gallery2, IMG.gallery1],
    testimonials: [
      { name: "Dan R.", text: "They sent photos and videos of what was wrong with my car. No more trusting blindly — I can see it myself.", avatar: IMG.avatar1, rating: 5 },
      { name: "Lisa M.", text: "Honest pricing and they explain everything. They showed me the old parts and the new ones. Trustworthy.", avatar: IMG.avatar2, rating: 5 },
      { name: "Carlos V.", text: "Free shuttle while my car was in the shop. 12-month warranty on the brake job. Great experience.", avatar: IMG.avatar4, rating: 5 },
    ],
    stats: [
      { value: "ASE", label: "Certified" },
      { value: "8,000+", label: "Cars serviced" },
      { value: "4.8★", label: "Customer rating" },
      { value: "12-mo", label: "Warranty" },
    ],
    trustBadges: ["ASE Certified", "12-Month Warranty", "Free Diagnostics", "All Makes & Models"],
  },
  cleaning: {
    hero: "Professional Cleaning — Bonded, Insured, Guaranteed",
    sub: "Eco-friendly products safe for kids and pets. Background-checked teams. Satisfaction guaranteed — if it's not right, we re-clean free.",
    cta: "Get Free Quote",
    phone: "(555) 210-2532",
    primary: "#1e3a5f",
    primaryDark: "#0f1e3a",
    accent: "#06b6d4",
    bgImage: "https://images.unsplash.com/photo-1581578731548-c64695cccae9?w=1600&q=80",
    serviceName: "Cleaning Services",
    services: [
      { title: "Residential Cleaning", desc: "Weekly, bi-weekly, and monthly cleaning for homes of any size.", img: "https://images.unsplash.com/photo-1581578731548-c64695cccae9?w=800&q=80" },
      { title: "Commercial Cleaning", desc: "Office, retail, and medical facility cleaning after hours.", img: IMG.gallery2 },
      { title: "Deep Cleaning", desc: "Move-in, move-out, and spring deep cleans with detailed checklist.", img: "https://images.unsplash.com/photo-1581578731548-c64695cccae9?w=800&q=80" },
      { title: "Post-Construction Cleaning", desc: "Dust removal, window cleaning, and final cleanup for new builds.", img: IMG.gallery1 },
    ],
    gallery: ["https://images.unsplash.com/photo-1581578731548-c64695cccae9?w=800&q=80", IMG.gallery2, IMG.gallery1, IMG.gallery2],
    testimonials: [
      { name: "Barbara S.", text: "Same team every visit and they remember exactly how I like things done. My home has never been cleaner.", avatar: IMG.avatar2, rating: 5 },
      { name: "Greg T.", text: "Eco-friendly products that actually work. No harsh chemical smell and our kids' allergies are gone.", avatar: IMG.avatar1, rating: 5 },
      { name: "Nancy L.", text: "They re-cleaned a bathroom for free because I noticed a spot. That's service. Now we're weekly customers.", avatar: IMG.avatar3, rating: 5 },
    ],
    stats: [
      { value: "Bonded", label: "& insured" },
      { value: "5,000+", label: "Homes cleaned" },
      { value: "4.9★", label: "Customer rating" },
      { value: "100%", label: "Guaranteed" },
    ],
    trustBadges: ["Bonded & Insured", "Eco-Friendly", "Satisfaction Guaranteed", "Background Checked"],
  },
  identity: {
    hero: "Brand Identity & Web Design That Converts",
    sub: "Custom branding, logo design, and website development. We build brands that stand out and drive action. Award-winning design, fast turnaround.",
    cta: "Start Your Project",
    phone: "(555) 220-2732",
    primary: "#1e1b4b",
    primaryDark: "#0c0a3e",
    accent: "#818cf8",
    bgImage: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3a?w=1600&q=80",
    serviceName: "Brand & Web Design",
    services: [
      { title: "Logo Design", desc: "Custom logo creation with complete brand guidelines and file packages.", img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3a?w=800&q=80" },
      { title: "Website Design", desc: "Modern, responsive websites that look great and drive conversions.", img: IMG.gallery2 },
      { title: "Brand Strategy", desc: "Positioning, messaging, and visual identity that sets you apart.", img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3a?w=800&q=80" },
      { title: "Print & Marketing Design", desc: "Business cards, brochures, and marketing materials that match your brand.", img: IMG.gallery1 },
    ],
    gallery: ["https://images.unsplash.com/photo-1573497019940-1c28c88b4f3a?w=800&q=80", IMG.gallery2, IMG.gallery1, IMG.gallery2],
    testimonials: [
      { name: "Alex M.", text: "They captured our brand perfectly. The new logo and website have tripled our inbound leads.", avatar: IMG.avatar1, rating: 5 },
      { name: "Sara K.", text: "Fast turnaround and unlimited revisions until it was perfect. The brand guide is incredibly thorough.", avatar: IMG.avatar2, rating: 5 },
      { name: "Jordan T.", text: "We own all the files and fonts. No lock-in, no hidden fees. Professional from start to finish.", avatar: IMG.avatar4, rating: 5 },
    ],
    stats: [
      { value: "Award", label: "Winning" },
      { value: "500+", label: "Brands built" },
      { value: "4.9★", label: "Client rating" },
      { value: "100%", label: "Ownership" },
    ],
    trustBadges: ["Award-Winning", "Fast Turnaround", "Unlimited Revisions", "5-Star Reviews"],
  },
};

const DISPLAY_MAP: Record<string, string> = {
  "Legal": "legal", "Real Estate": "real_estate", "Epoxy Flooring": "epoxy",
  "Roofing": "roofing", "HVAC": "hvac", "Plumbing": "plumbing",
  "Electrical": "electrician", "Med Spa": "med_spa", "Dental": "dental",
  "Chiropractic": "chiropractic", "Remodeling": "remodeling",
  "Landscaping": "landscaping", "Solar": "solar", "Pest Control": "pest_control",
};

function getConfig(niche: string): NicheProfile {
  const key = (niche || "").toLowerCase().replace(/ /g, "_");
  return NICHES[key] || NICHES[DISPLAY_MAP[niche]] || NICHES.epoxy;
}

function esc(s: string): string {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function stars(n: number): string {
  return "★★★★★".substring(0, n) + "☆☆☆☆☆".substring(0, 5 - n);
}

export function generateTemplateHtml(niche: string, brandName?: string): string {
  const c = getConfig(niche);
  const brand = brandName || c.serviceName;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(brand)} — ${esc(c.hero)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1a1a2e;line-height:1.6;background:#fff;overflow-x:hidden}
img{display:block;max-width:100%}
a{text-decoration:none;color:inherit}
.container{max-width:1200px;margin:0 auto;padding:0 24px}

/* === Sticky Header with Phone === */
.hdr{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.97);backdrop-filter:blur(16px);border-bottom:1px solid #e8e8e8;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.hdr .container{display:flex;align-items:center;justify-content:space-between;height:68px}
.brand{font-size:19px;font-weight:800;color:${c.primary};letter-spacing:-.02em;display:flex;align-items:center;gap:8px}
.brand::before{content:'';width:8px;height:8px;border-radius:50%;background:${c.accent}}
.nav{display:flex;gap:28px}
.nav a{font-size:14px;font-weight:600;color:#555;transition:color .2s}
.nav a:hover{color:${c.primary}}
.phone-cta{display:flex;align-items:center;gap:12px}
.phone-num{font-size:15px;font-weight:800;color:${c.primary};white-space:nowrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 22px;border-radius:10px;font-size:14px;font-weight:700;color:#fff;background:linear-gradient(135deg,${c.primary},${c.accent});box-shadow:0 4px 14px ${c.accent}33;transition:transform .15s,box-shadow .15s;cursor:pointer;border:none;white-space:nowrap}
.btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px ${c.accent}44}
.btn-outline{background:transparent;color:${c.primary};border:2px solid ${c.primary}22}
.btn-outline:hover{background:${c.primary}08;border-color:${c.primary}44}
.btn-lg{padding:16px 36px;font-size:16px}

/* === Hero with Real Background Image === */
.hero{position:relative;min-height:580px;display:flex;align-items:center;overflow:hidden}
.hero-bg{position:absolute;inset:0;background:url('${c.bgImage}') center/cover no-repeat;transform:scale(1.05)}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(135deg,${c.primaryDark}f0 0%,${c.primaryDark}cc 50%,${c.primary}88 100%)}
.hero .container{position:relative;z-index:1;max-width:680px;padding:80px 24px}
.hero-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;background:rgba(255,255,255,.15);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:20px}
.hero h1{font-size:44px;font-weight:800;line-height:1.1;letter-spacing:-.02em;color:#fff;margin-bottom:16px}
.hero p{font-size:18px;color:rgba(255,255,255,.9);margin-bottom:28px;max-width:560px}
.hero-ctas{display:flex;gap:12px;flex-wrap:wrap}
.hero .btn-light{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(8px)}
.hero .btn-light:hover{background:rgba(255,255,255,.25)}
.hero-stars{display:flex;align-items:center;gap:8px;margin-top:24px;color:rgba(255,255,255,.85);font-size:14px;font-weight:600}
.hero-stars .stars{color:${c.accent};font-size:18px;letter-spacing:2px}

/* === Trust Bar === */
.trust{background:${c.primary};color:#fff;padding:16px 0}
.trust .container{display:flex;justify-content:center;gap:32px;flex-wrap:wrap}
.trust-badge{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;opacity:.95}
.trust-badge::before{content:'✓';width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0}

/* === Stats Section === */
.stats{padding:48px 0;background:#f8f9fb;border-bottom:1px solid #e8e8e8}
.stats .container{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center}
.stat-val{font-size:36px;font-weight:800;color:${c.primary};letter-spacing:-.02em;line-height:1}
.stat-lbl{font-size:13px;color:#666;margin-top:6px;font-weight:500}

/* === Section === */
.section{padding:72px 0}
.section.alt{background:#f8f9fb}
.section-head{text-align:center;max-width:600px;margin:0 auto 48px}
.section-head h2{font-size:32px;font-weight:800;color:${c.primary};letter-spacing:-.02em;margin-bottom:10px}
.section-head p{font-size:17px;color:#666}

/* === Service Cards with Images === */
.svc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
.svc-card{background:#fff;border:1px solid #e8e8e8;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04);transition:border-color .2s,box-shadow .2s,transform .15s}
.svc-card:hover{border-color:${c.accent};box-shadow:0 12px 40px ${c.accent}1a;transform:translateY(-4px)}
.svc-img{width:100%;aspect-ratio:16/10;object-fit:cover}
.svc-body{padding:22px}
.svc-body h3{font-size:18px;font-weight:700;color:${c.primary};margin-bottom:8px}
.svc-body p{font-size:14px;color:#555;line-height:1.5}
.svc-link{display:inline-flex;align-items:center;gap:6px;margin-top:14px;font-size:13px;font-weight:700;color:${c.accent}}
.svc-link::after{content:'→';transition:transform .15s}
.svc-card:hover .svc-link::after{transform:translateX(4px)}

/* === Gallery === */
.gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.gallery img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;transition:transform .3s,box-shadow .3s}
.gallery img:hover{transform:scale(1.05);box-shadow:0 8px 30px rgba(0,0,0,.15)}

/* === Testimonials === */
.test-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px}
.test-card{background:#fff;border:1px solid #e8e8e8;border-radius:16px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
.test-stars{color:${c.accent};font-size:18px;letter-spacing:2px;margin-bottom:12px}
.test-text{font-size:15px;color:#333;line-height:1.6;margin-bottom:18px;font-style:italic}
.test-author{display:flex;align-items:center;gap:12px}
.test-avatar{width:44px;height:44px;border-radius:50%;object-fit:cover}
.test-name{font-size:14px;font-weight:700;color:${c.primary}}
.test-role{font-size:12px;color:#999}

/* === CTA Section === */
.cta-sec{background:linear-gradient(135deg,${c.primary},${c.accent});color:#fff;text-align:center;padding:64px 0}
.cta-sec h2{font-size:30px;font-weight:800;margin-bottom:10px}
.cta-sec p{font-size:17px;opacity:.92;margin-bottom:28px}
.cta-sec .btn{background:#fff;color:${c.primary}}

/* === Contact Form === */
.contact{padding:64px 0;background:#f8f9fb}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start}
.contact-info h2{font-size:28px;font-weight:800;color:${c.primary};margin-bottom:12px}
.contact-info p{font-size:15px;color:#666;margin-bottom:24px}
.contact-item{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.contact-item-icon{width:40px;height:40px;border-radius:10px;background:${c.primary}10;display:flex;align-items:center;justify-content:center;font-size:18px}
.contact-item-text{font-size:15px;font-weight:600;color:#333}
.contact-form{background:#fff;border:1px solid #e8e8e8;border-radius:16px;padding:32px;box-shadow:0 4px 20px rgba(0,0,0,.06)}
.form-group{margin-bottom:16px}
.form-label{display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px}
.form-input{width:100%;height:44px;border:1px solid #ddd;border-radius:10px;padding:0 14px;font-size:15px;outline:none;transition:border-color .15s}
.form-input:focus{border-color:${c.accent}}
.form-textarea{height:120px;padding:12px 14px;resize:vertical}

/* === Footer === */
.footer{background:#0f172a;color:#94a3b8;padding:48px 0 24px}
.footer .container{display:grid;grid-template-columns:2fr 1fr 1fr;gap:40px}
.footer-brand{font-size:20px;font-weight:800;color:#fff;margin-bottom:8px}
.footer p{font-size:14px;margin-bottom:8px}
.footer h4{font-size:14px;font-weight:700;color:#fff;margin-bottom:12px;text-transform:uppercase;letter-spacing:.05em}
.footer a{display:block;font-size:14px;color:#94a3b8;margin-bottom:8px;transition:color .15s}
.footer a:hover{color:#fff}
.footer-bottom{border-top:1px solid #1e293b;margin-top:32px;padding-top:20px;text-align:center;font-size:13px;color:#64748b}

/* === Mobile Sticky CTA === */
.mobile-cta{display:none;position:fixed;bottom:0;left:0;right:0;z-index:100;background:rgba(255,255,255,.97);backdrop-filter:blur(16px);border-top:1px solid #e8e8e8;padding:10px 16px calc(10px + env(safe-area-inset-bottom));gap:10px}
.mobile-cta .btn{flex:1}
.mobile-cta .btn-call{background:${c.primary};flex:0 0 auto;padding:11px 16px}

@media(max-width:768px){
  .nav{display:none}
  .phone-num{display:none}
  .hero{min-height:480px}
  .hero h1{font-size:30px}
  .hero p{font-size:16px}
  .hero .container{padding:60px 24px}
  .stats .container{grid-template-columns:repeat(2,1fr);gap:20px}
  .stat-val{font-size:28px}
  .gallery{grid-template-columns:repeat(2,1fr)}
  .contact-grid{grid-template-columns:1fr;gap:32px}
  .footer .container{grid-template-columns:1fr;gap:24px}
  .section{padding:48px 0}
  .section-head h2{font-size:26px}
  .mobile-cta{display:flex}
  body{padding-bottom:70px}
}
</style>
</head>
<body>

<!-- Sticky Header with Phone -->
<header class="hdr">
  <div class="container">
    <div class="brand">${esc(brand)}</div>
    <nav class="nav">
      <a href="#services">Services</a>
      <a href="#gallery">Projects</a>
      <a href="#reviews">Reviews</a>
      <a href="#contact">Contact</a>
    </nav>
    <div class="phone-cta">
      <span class="phone-num">${esc(c.phone)}</span>
      <button class="btn">${esc(c.cta)}</button>
    </div>
  </div>
</header>

<!-- Hero with Real Background Image -->
<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-overlay"></div>
  <div class="container">
    <span class="hero-badge">★ ${esc(c.stats[2].value)} Rated · ${esc(c.trustBadges[0])}</span>
    <h1>${esc(c.hero)}</h1>
    <p>${esc(c.sub)}</p>
    <div class="hero-ctas">
      <button class="btn btn-lg">${esc(c.cta)}</button>
      <button class="btn btn-lg btn-light">View Our Work</button>
    </div>
    <div class="hero-stars">
      <span class="stars">${stars(5)}</span>
      <span>${esc(c.stats[1].value)}+ satisfied customers · ${esc(c.stats[2].value)} average rating</span>
    </div>
  </div>
</section>

<!-- Trust Bar -->
<div class="trust">
  <div class="container">
    ${c.trustBadges.map((b) => `<span class="trust-badge">${esc(b)}</span>`).join("\n    ")}
  </div>
</div>

<!-- Stats Section -->
<section class="stats">
  <div class="container">
    ${c.stats.map((s) => `<div><div class="stat-val">${esc(s.value)}</div><div class="stat-lbl">${esc(s.label)}</div></div>`).join("\n    ")}
  </div>
</section>

<!-- Services with Images -->
<section class="section" id="services">
  <div class="container">
    <div class="section-head">
      <h2>Our Services</h2>
      <p>Professional, reliable, and backed by our satisfaction guarantee. Explore what we do best.</p>
    </div>
    <div class="svc-grid">
      ${c.services.map((s) => `<article class="svc-card">
        <img class="svc-img" src="${s.img}" alt="${esc(s.title)}" loading="lazy">
        <div class="svc-body">
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.desc)}</p>
          <span class="svc-link">Learn more</span>
        </div>
      </article>`).join("\n      ")}
    </div>
  </div>
</section>

<!-- Project Gallery -->
<section class="section alt" id="gallery">
  <div class="container">
    <div class="section-head">
      <h2>Recent Projects</h2>
      <p>See the quality of our work. Real projects, real results.</p>
    </div>
    <div class="gallery">
      ${c.gallery.map((g) => `<img src="${g}" alt="Project photo" loading="lazy">`).join("\n      ")}
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="section" id="reviews">
  <div class="container">
    <div class="section-head">
      <h2>What Our Customers Say</h2>
      <p>Real reviews from real customers. We let our work speak for itself.</p>
    </div>
    <div class="test-grid">
      ${c.testimonials.map((t) => `<div class="test-card">
        <div class="test-stars">${stars(t.rating)}</div>
        <p class="test-text">"${esc(t.text)}"</p>
        <div class="test-author">
          <img class="test-avatar" src="${t.avatar}" alt="${esc(t.name)}" loading="lazy">
          <div>
            <div class="test-name">${esc(t.name)}</div>
            <div class="test-role">Verified Customer</div>
          </div>
        </div>
      </div>`).join("\n      ")}
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="cta-sec">
  <div class="container">
    <h2>Ready to Get Started?</h2>
    <p>Contact us today for a free consultation and quote. ${esc(c.phone)}</p>
    <button class="btn btn-lg">${esc(c.cta)}</button>
  </div>
</section>

<!-- Contact Form -->
<section class="contact" id="contact">
  <div class="container">
    <div class="contact-grid">
      <div class="contact-info">
        <h2>Get In Touch</h2>
        <p>Call us or fill out the form and we'll get back to you within 1 business hour.</p>
        <div class="contact-item">
          <div class="contact-item-icon">📞</div>
          <div class="contact-item-text">${esc(c.phone)}</div>
        </div>
        <div class="contact-item">
          <div class="contact-item-icon">✉️</div>
          <div class="contact-item-text">info@${brand.toLowerCase().replace(/[^a-z0-9]/g, "")}.com</div>
        </div>
        <div class="contact-item">
          <div class="contact-item-icon">⏰</div>
          <div class="contact-item-text">Open 24/7 for emergencies</div>
        </div>
      </div>
      <form class="contact-form" onsubmit="return false">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input class="form-input" placeholder="John Smith">
        </div>
        <div class="form-group">
          <label class="form-label">Phone Number</label>
          <input class="form-input" type="tel" placeholder="(555) 123-4567">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" placeholder="john@example.com">
        </div>
        <div class="form-group">
          <label class="form-label">How Can We Help?</label>
          <textarea class="form-input form-textarea" placeholder="Tell us about your project..."></textarea>
        </div>
        <button class="btn btn-lg" style="width:100%">Send Message</button>
      </form>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="footer">
  <div class="container">
    <div>
      <div class="footer-brand">${esc(brand)}</div>
      <p>${esc(c.sub.substring(0, 120))}...</p>
      <p style="margin-top:12px">${esc(c.trustBadges.join(" · "))}</p>
    </div>
    <div>
      <h4>Services</h4>
      ${c.services.slice(0, 4).map((s) => `<a href="#">${esc(s.title)}</a>`).join("\n      ")}
    </div>
    <div>
      <h4>Contact</h4>
      <a href="tel:${c.phone}">${esc(c.phone)}</a>
      <a href="#contact">Get a Quote</a>
      <a href="#">Service Areas</a>
    </div>
  </div>
  <div class="container footer-bottom">
    &copy; 2026 ${esc(brand)}. All rights reserved. Licensed & Insured.
  </div>
</footer>

<!-- Mobile Sticky CTA -->
<div class="mobile-cta">
  <a href="tel:${c.phone}" class="btn btn-call">📞 Call</a>
  <button class="btn">${esc(c.cta)}</button>
</div>

</body>
</html>`;
}

export function getSupportedNiches(): string[] {
  return Object.keys(NICHES);
}