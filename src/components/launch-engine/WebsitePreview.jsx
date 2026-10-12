import React from "react";
import { Phone, MapPin, Star, Check, ChevronRight, Mail, Clock, Shield, Award, ThumbsUp, Zap, Leaf, Flame, Gem, Anchor, Building, Sun, Heart, Sparkles, Rocket } from "lucide-react";

const LOGO_ICONS = { shield: Shield, star: Star, leaf: Leaf, flame: Flame, gem: Gem, anchor: Anchor, building: Building, sun: Sun, heart: Heart, zap: Zap, award: Award, sparkles: Sparkles, rocket: Rocket };

// Industry-specific content for a realistic finished website
const INDUSTRY_CONTENT = {
  "Legal": {
    accent: "#1a1a1a", accentLight: "#404040", phone: "(555) 100-2000",
    domain: "justiceadvocates.com", rating: 4.9, reviews: 247,
    heroHeadline: "Get the Compensation You Deserve",
    heroSubhead: "Experienced personal injury attorneys. Free consultation. No fee unless we win your case.",
    heroImg: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&fit=crop",
    services: [
      { title: "Personal Injury", desc: "Comprehensive representation for injury victims" },
      { title: "Car Accidents", desc: "Maximize your settlement after a collision" },
      { title: "Slip & Fall", desc: "Property liability and premises claims" },
      { title: "Wrongful Death", desc: "Compassionate advocacy for your family" },
      { title: "Workers' Comp", desc: "Get the benefits you're entitled to" },
      { title: "Insurance Claims", desc: "Don't let insurers undervalue your claim" },
    ],
    trustBadge: "$50M+ Recovered",
    trustLabel: "For Our Clients",
    about: "With over 20 years of experience, our attorneys have recovered millions for injury victims. We fight insurance companies so you don't have to.",
    testimonials: [
      { name: "Sarah M.", text: "They got me 3x what the insurance company offered. Incredible team.", role: "Car Accident Client" },
      { name: "James R.", text: "Professional, responsive, and they truly cared about my case.", role: "Slip & Fall Client" },
      { name: "Diana L.", text: "I didn't have to worry about anything. They handled it all.", role: "Personal Injury Client" },
    ],
  },
  "Real Estate": {
    accent: "#0D9488", accentLight: "#14b8a6", phone: "(555) 200-3000",
    domain: "luxuryhomesrealty.com", rating: 5.0, reviews: 189,
    heroHeadline: "Find Your Dream Home Today",
    heroSubhead: "Luxury properties, expert agents, and seamless buying experiences. Your perfect home is waiting.",
    heroImg: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&fit=crop",
    services: [
      { title: "Luxury Listings", desc: "Exclusive properties in prime locations" },
      { title: "Buyer Representation", desc: "Find the right home at the right price" },
      { title: "Seller Marketing", desc: "Sell faster with our proven strategy" },
      { title: "Property Valuation", desc: "Know exactly what your home is worth" },
      { title: "Relocation Services", desc: "Moving? We make it effortless" },
      { title: "Investment Properties", desc: "Build wealth through real estate" },
    ],
    trustBadge: "$500M+",
    trustLabel: "Properties Sold",
    about: "Our award-winning team has helped thousands of families find their perfect home. We combine local expertise with luxury service.",
    testimonials: [
      { name: "Robert K.", text: "Sold our home in 3 days above asking price. Unbelievable!", role: "Home Seller" },
      { name: "Maria S.", text: "They found us the perfect house in our dream neighborhood.", role: "Home Buyer" },
      { name: "Tom B.", text: "Best real estate experience we've ever had. Highly recommend.", role: "Investor" },
    ],
  },
  "Epoxy Flooring": {
    accent: "#D4AF37", accentLight: "#E6C84E", phone: "(555) 300-4000",
    domain: "epoxygaragepros.com", rating: 4.9, reviews: 312,
    heroHeadline: "Premium Epoxy Garage Floors",
    heroSubhead: "Transform your garage with durable, stunning epoxy coatings. 15-year warranty. Free estimates.",
    heroImg: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80&fit=crop",
    services: [
      { title: "Garage Floor Coating", desc: "Metallic and flake epoxy systems" },
      { title: "Commercial Flooring", desc: "Heavy-duty industrial coatings" },
      { title: "Concrete Polishing", desc: "Smooth, polished concrete finishes" },
      { title: "Concrete Resurfacing", desc: "Repair and restore damaged concrete" },
      { title: "Basement Floors", desc: "Moisture-resistant epoxy systems" },
      { title: "Patio & Pool Decks", desc: "Outdoor decorative coatings" },
    ],
    trustBadge: "15-Year",
    trustLabel: "Warranty Included",
    about: "Family-owned and operated, we've installed over 5,000 epoxy floors. Our coatings are built to last and look amazing.",
    testimonials: [
      { name: "Mike D.", text: "My garage looks like a showroom. Best investment I've made!", role: "Homeowner" },
      { name: "Lisa P.", text: "Professional crew, clean work, and the floor is stunning.", role: "Homeowner" },
      { name: "Carlos V.", text: "They finished on time and on budget. Highly recommend.", role: "Commercial Client" },
    ],
  },
  "Roofing": {
    accent: "#DC2626", accentLight: "#ef4444", phone: "(555) 400-5000",
    domain: "trustedroofingco.com", rating: 4.8, reviews: 425,
    heroHeadline: "Trusted Roofing Experts",
    heroSubhead: "Storm damage? Leaks? We provide fast, reliable roof repair and replacement. Free inspections.",
    heroImg: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80&fit=crop",
    services: [
      { title: "Roof Replacement", desc: "Full roof installation with warranty" },
      { title: "Storm Damage Repair", desc: "Insurance-approved storm restoration" },
      { title: "Leak Detection", desc: "Find and fix leaks fast" },
      { title: "Roof Inspection", desc: "Free comprehensive inspection" },
      { title: "Gutter Installation", desc: "Seamless gutter systems" },
      { title: "Skylight Repair", desc: "Natural light without the leaks" },
    ],
    trustBadge: "25-Year",
    trustLabel: "Roof Warranty",
    about: "Licensed and insured, we've protected over 10,000 homes from the elements. We work directly with your insurance company.",
    testimonials: [
      { name: "Patricia H.", text: "They handled everything with our insurance. New roof in two days!", role: "Homeowner" },
      { name: "Steve W.", text: "Honest, fair pricing and excellent workmanship.", role: "Homeowner" },
      { name: "Karen J.", text: "After the storm, they were there the next morning. Lifesavers.", role: "Homeowner" },
    ],
  },
  "HVAC": {
    accent: "#2563EB", accentLight: "#3b82f6", phone: "(555) 500-6000",
    domain: "comfortairpros.com", rating: 4.9, reviews: 356,
    heroHeadline: "24/7 Heating & Air Conditioning",
    heroSubhead: "Fast response, certified technicians, upfront pricing. Your comfort is our priority.",
    heroImg: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800&q=80&fit=crop",
    services: [
      { title: "AC Repair", desc: "Same-day air conditioning repair" },
      { title: "AC Installation", desc: "Energy-efficient system upgrades" },
      { title: "Heating Repair", desc: "Furnace and heat pump service" },
      { title: "Duct Cleaning", desc: "Improve your indoor air quality" },
      { title: "Maintenance Plans", desc: "Prevent costly breakdowns" },
      { title: "Emergency Service", desc: "24/7 emergency HVAC response" },
    ],
    trustBadge: "24/7",
    trustLabel: "Emergency Service",
    about: "NATE-certified technicians with 15+ years of experience. We service all brands and offer transparent, upfront pricing.",
    testimonials: [
      { name: "Amanda T.", text: "AC died on the hottest day of the year. They came within the hour!", role: "Homeowner" },
      { name: "Bill F.", text: "Fair pricing, no surprises. The maintenance plan is worth every penny.", role: "Homeowner" },
      { name: "Susan K.", text: "Professional, clean, and respectful of our home. Best HVAC company around.", role: "Homeowner" },
    ],
  },
  "Plumbing": {
    accent: "#2563EB", accentLight: "#3b82f6", phone: "(555) 600-7000",
    domain: "fastflowplumbing.com", rating: 4.8, reviews: 289,
    heroHeadline: "24/7 Emergency Plumber",
    heroSubhead: "Burst pipe? No hot water? We're there in minutes, not hours. Upfront pricing, no surprises.",
    heroImg: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80&fit=crop",
    services: [
      { title: "Emergency Plumbing", desc: "24/7 rapid response service" },
      { title: "Drain Cleaning", desc: "Hydro-jetting and snaking" },
      { title: "Water Heater Repair", desc: "Tank and tankless service" },
      { title: "Sewer Line Repair", desc: "Trenchless sewer solutions" },
      { title: "Leak Detection", desc: "Advanced electronic detection" },
      { title: "Fixture Installation", desc: "Faucets, toilets, and more" },
    ],
    trustBadge: "Same-Day",
    trustLabel: "Service Available",
    about: "Licensed master plumbers available 24/7. We've been solving plumbing problems for over 20 years with honest, upfront pricing.",
    testimonials: [
      { name: "Greg M.", text: "Burst pipe at 2 AM, they were here in 45 minutes. Saved our basement!", role: "Homeowner" },
      { name: "Brenda C.", text: "No hidden fees, no upselling. Just honest, quality work.", role: "Homeowner" },
      { name: "Tony R.", text: "Best plumber I've ever used. Clean, fast, and professional.", role: "Homeowner" },
    ],
  },
  "Electrical": {
    accent: "#EA580C", accentLight: "#f97316", phone: "(555) 700-8000",
    domain: "brightsparks.com", rating: 4.9, reviews: 198,
    heroHeadline: "Licensed Electricians You Can Trust",
    heroSubhead: "From panel upgrades to emergency repairs. Safe, code-compliant, and guaranteed work.",
    heroImg: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80&fit=crop",
    services: [
      { title: "Panel Upgrades", desc: "Modernize your electrical panel" },
      { title: "Wiring & Rewiring", desc: "Whole-home electrical wiring" },
      { title: "Lighting Installation", desc: "Indoor and outdoor lighting" },
      { title: "Emergency Repairs", desc: "24/7 emergency electrician" },
      { title: "EV Charger Install", desc: "Home EV charging stations" },
      { title: "Safety Inspections", desc: "Whole-home electrical audit" },
    ],
    trustBadge: "Licensed",
    trustLabel: "& Insured",
    about: "Master electricians with 25+ years of experience. Every job is code-compliant, inspected, and guaranteed.",
    testimonials: [
      { name: "Phil D.", text: "Installed my EV charger perfectly. Clean work and great price.", role: "Homeowner" },
      { name: "Janet W.", text: "They found dangerous wiring and fixed it the same day.", role: "Homeowner" },
      { name: "Marcus L.", text: "Professional, punctual, and the work is impeccable.", role: "Homeowner" },
    ],
  },
  "Med Spa": {
    accent: "#E11D48", accentLight: "#f43f5e", phone: "(555) 800-9000",
    domain: "serenitymedspa.com", rating: 5.0, reviews: 412,
    heroHeadline: "Reveal Your Natural Beauty",
    heroSubhead: "Advanced aesthetic treatments in a luxurious setting. Botox, fillers, laser, and more.",
    heroImg: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80&fit=crop",
    services: [
      { title: "Botox & Fillers", desc: "Smooth wrinkles and restore volume" },
      { title: "Laser Hair Removal", desc: "Permanent hair reduction" },
      { title: "Facial Treatments", desc: "Hydrafacial, microneedling, peels" },
      { title: "Body Contouring", desc: "Non-surgical fat reduction" },
      { title: "Skin Rejuvenation", desc: "Restore your youthful glow" },
      { title: "Wellness IV Therapy", desc: "Boost energy and immunity" },
    ],
    trustBadge: "5-Star",
    trustLabel: "Client Rating",
    about: "Our medical director and certified aestheticians deliver natural-looking results in a serene, spa-like environment.",
    testimonials: [
      { name: "Jennifer L.", text: "Best med spa in the city. My skin has never looked better!", role: "Client" },
      { name: "Ashley P.", text: "The results are natural and subtle. Exactly what I wanted.", role: "Client" },
      { name: "Christine D.", text: "Luxurious experience from start to finish. Worth every penny.", role: "Client" },
    ],
  },
  "Dental": {
    accent: "#0D9488", accentLight: "#14b8a6", phone: "(555) 900-1000",
    domain: "brightsmiledental.com", rating: 4.9, reviews: 367,
    heroHeadline: "Your Best Smile Starts Here",
    heroSubhead: "Comprehensive dental care for the whole family. Same-day emergencies welcome.",
    heroImg: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800&q=80&fit=crop",
    services: [
      { title: "Emergency Dentistry", desc: "Same-day emergency appointments" },
      { title: "Dental Implants", desc: "Permanent tooth replacement" },
      { title: "Teeth Whitening", desc: "Professional whitening systems" },
      { title: "Invisalign", desc: "Clear aligner orthodontics" },
      { title: "Cosmetic Bonding", desc: "Fix chips and gaps instantly" },
      { title: "Family Dentistry", desc: "Gentle care for all ages" },
    ],
    trustBadge: "Same-Day",
    trustLabel: "Emergencies",
    about: "State-of-the-art technology meets compassionate care. We make going to the dentist something to smile about.",
    testimonials: [
      { name: "Rachel S.", text: "Best dental experience ever. No pain, no anxiety, great results!", role: "Patient" },
      { name: "David K.", text: "They got me in the same day for my emergency. Lifesavers.", role: "Patient" },
      { name: "Emily W.", text: "My kids actually love going to the dentist now!", role: "Parent" },
    ],
  },
  "Chiropractic": {
    accent: "#16A34A", accentLight: "#22c55e", phone: "(555) 110-2000",
    domain: "wellnesschiro.com", rating: 4.9, reviews: 234,
    heroHeadline: "Live Pain-Free, Naturally",
    heroSubhead: "Expert chiropractic care for back pain, neck pain, and total wellness. New patients welcome.",
    heroImg: "https://images.unsplash.com/photo-1576091160399-1ba3876e2f5b?w=800&q=80&fit=crop",
    services: [
      { title: "Spinal Adjustment", desc: "Corrective chiropractic care" },
      { title: "Massage Therapy", desc: "Therapeutic and deep tissue" },
      { title: "Physical Rehab", desc: "Injury recovery programs" },
      { title: "Posture Correction", desc: "Improve alignment naturally" },
      { title: "Sports Injury", desc: "Get back in the game faster" },
      { title: "Wellness Care", desc: "Preventive maintenance" },
    ],
    trustBadge: "15+ Years",
    trustLabel: "Experience",
    about: "Our holistic approach combines chiropractic, massage, and rehab to address the root cause, not just symptoms.",
    testimonials: [
      { name: "Helen M.", text: "After years of back pain, I can finally sleep through the night again.", role: "Patient" },
      { name: "Robert T.", text: "They fixed my sports injury in weeks, not months.", role: "Athlete" },
      { name: "Linda F.", text: "Gentle, thorough, and they really listen. Best chiropractor I've been to.", role: "Patient" },
    ],
  },
  "Remodeling": {
    accent: "#475569", accentLight: "#64748b", phone: "(555) 120-3000",
    domain: "dreamhomeremodeling.com", rating: 4.8, reviews: 178,
    heroHeadline: "Transform Your Home",
    heroSubhead: "Kitchen, bath, and whole-home remodeling. Quality craftsmanship, on-time delivery, fair pricing.",
    heroImg: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&fit=crop",
    services: [
      { title: "Kitchen Remodel", desc: "Custom kitchens built to last" },
      { title: "Bathroom Remodel", desc: "Spa-like bathroom transformations" },
      { title: "Home Additions", desc: "Expand your living space" },
      { title: "Whole-Home Renovation", desc: "Complete home makeovers" },
      { title: "Custom Cabinetry", desc: "Built-in storage solutions" },
      { title: "Flooring Installation", desc: "Hardwood, tile, and luxury vinyl" },
    ],
    trustBadge: "100%",
    trustLabel: "Satisfaction",
    about: "From design to completion, we handle every detail. Our 3D design process lets you see your dream before we build it.",
    testimonials: [
      { name: "Frank G.", text: "Our kitchen is stunning. The craftsmanship is incredible.", role: "Homeowner" },
      { name: "Cynthia B.", text: "On time, on budget, and the quality exceeded our expectations.", role: "Homeowner" },
      { name: "Alex R.", text: "They made our cramped bathroom feel like a luxury spa.", role: "Homeowner" },
    ],
  },
  "Landscaping": {
    accent: "#16A34A", accentLight: "#22c55e", phone: "(555) 130-4000",
    domain: "greenleaflandscaping.com", rating: 4.9, reviews: 201,
    heroHeadline: "Beautiful Outdoor Spaces",
    heroSubhead: "Professional landscaping, hardscaping, and lawn care. Your yard, perfected.",
    heroImg: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80&fit=crop",
    services: [
      { title: "Landscape Design", desc: "Custom 3D landscape plans" },
      { title: "Hardscaping", desc: "Patios, walkways, and retaining walls" },
      { title: "Lawn Care", desc: "Weekly maintenance programs" },
      { title: "Tree & Shrub Care", desc: "Pruning, trimming, and removal" },
      { title: "Irrigation Systems", desc: "Smart sprinkler installation" },
      { title: "Outdoor Lighting", desc: "Illuminate your landscape" },
    ],
    trustBadge: "Free",
    trustLabel: "Design Consult",
    about: "Award-winning designers and experienced crews. We turn ordinary yards into outdoor living spaces you'll love.",
    testimonials: [
      { name: "Doug H.", text: "Our backyard is now an oasis. The design is incredible.", role: "Homeowner" },
      { name: "Tina M.", text: "Reliable, clean, and they show up on time every week.", role: "Maintenance Client" },
      { name: "Paul S.", text: "The hardscaping work is museum quality. Stunning results.", role: "Homeowner" },
    ],
  },
  "Solar": {
    accent: "#EA580C", accentLight: "#f97316", phone: "(555) 140-5000",
    domain: "solarsavings.com", rating: 4.9, reviews: 312,
    heroHeadline: "Power Your Home with Solar",
    heroSubhead: "Save up to 90% on energy bills. $0 down installation. 25-year warranty.",
    heroImg: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80&fit=crop",
    services: [
      { title: "Solar Panel Installation", desc: "Premium panels, expert install" },
      { title: "Battery Storage", desc: "Power your home at night" },
      { title: "Solar Repair", desc: "Fix underperforming systems" },
      { title: "System Monitoring", desc: "Track your savings in real-time" },
      { title: "Tax Credit Help", desc: "Maximize your federal incentives" },
      { title: "EV Charger Setup", desc: "Charge with solar power" },
    ],
    trustBadge: "$0 Down",
    trustLabel: "Financing",
    about: "Certified installers with 10,000+ systems installed. We handle permits, installation, and utility interconnection.",
    testimonials: [
      { name: "Walter J.", text: "My electric bill went from $300 to $12. Best decision ever.", role: "Homeowner" },
      { name: "Nicole B.", text: "The whole process was seamless. They handled everything.", role: "Homeowner" },
      { name: "Steve P.", text: "Professional install, great warranty, and real savings.", role: "Homeowner" },
    ],
  },
  "Pest Control": {
    accent: "#16A34A", accentLight: "#22c55e", phone: "(555) 150-6000",
    domain: "bugfreepestcontrol.com", rating: 4.8, reviews: 267,
    heroHeadline: "Pest-Free, Guaranteed",
    heroSubhead: "Same-day service. Pet-safe treatments. 100% satisfaction guarantee.",
    heroImg: "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80&fit=crop",
    services: [
      { title: "General Pest Control", desc: "Ants, roaches, spiders, and more" },
      { title: "Termite Treatment", desc: "Protect your home's structure" },
      { title: "Rodent Control", desc: "Mice and rat elimination" },
      { title: "Bed Bug Removal", desc: "Heat treatment specialists" },
      { title: "Mosquito Control", desc: "Enjoy your yard again" },
      { title: "Quarterly Service", desc: "Year-round protection plans" },
    ],
    trustBadge: "100%",
    trustLabel: "Guarantee",
    about: "Licensed, bonded, and insured. Our eco-friendly treatments are safe for your family and pets.",
    testimonials: [
      { name: "Rosa M.", text: "No more ants! They came the same day I called.", role: "Homeowner" },
      { name: "Kevin D.", text: "The quarterly plan keeps our home bug-free year-round.", role: "Homeowner" },
      { name: "Beth S.", text: "Pet-safe treatments that actually work. Thank you!", role: "Pet Owner" },
    ],
  },
  "Moving": {
    accent: "#4F46E5", accentLight: "#6366f1", phone: "(555) 160-7000",
    domain: "smoothmovemovers.com", rating: 4.9, reviews: 189,
    heroHeadline: "Stress-Free Moving Services",
    heroSubhead: "Local and long-distance moving. Fully insured. Flat-rate pricing.",
    heroImg: "https://images.unsplash.com/photo-160051846444f-297d5e0cc4d1?w=800&q=80&fit=crop",
    services: [
      { title: "Local Moving", desc: "Same-city moves, done right" },
      { title: "Long-Distance Moving", desc: "State-to-state relocation" },
      { title: "Packing Services", desc: "Professional packing and supplies" },
      { title: "Storage Solutions", desc: "Climate-controlled storage" },
      { title: "Office Moving", desc: "Business relocation experts" },
      { title: "Furniture Assembly", desc: "We handle the heavy lifting" },
    ],
    trustBadge: "Flat-Rate",
    trustLabel: "Pricing",
    about: "Background-checked crews, clean trucks, and a commitment to treating your belongings like our own.",
    testimonials: [
      { name: "Larry F.", text: "Best move I've ever had. Fast, careful, and no surprises.", role: "Customer" },
      { name: "Patty W.", text: "They packed everything perfectly. Not a single broken item.", role: "Customer" },
      { name: "Derek M.", text: "On time, professional, and the price was exactly what they quoted.", role: "Customer" },
    ],
  },
  "Auto Detailing": {
    accent: "#4F46E5", accentLight: "#6366f1", phone: "(555) 170-8000",
    domain: "pristinedetailing.com", rating: 5.0, reviews: 156,
    heroHeadline: "Showroom Shine, Every Time",
    heroSubhead: "Mobile detailing that comes to you. Ceramic coatings, paint correction, and full details.",
    heroImg: "https://images.unsplash.com/photo-1605542236755-9b3f5c4e6429?w=800&q=80&fit=crop",
    services: [
      { title: "Full Detail", desc: "Interior and exterior perfection" },
      { title: "Ceramic Coating", desc: "5-year paint protection" },
      { title: "Paint Correction", desc: "Remove swirls and scratches" },
      { title: "Interior Deep Clean", desc: "Stain removal and restoration" },
      { title: "Headlight Restoration", desc: "Clear up cloudy lenses" },
      { title: "Fleet Detailing", desc: "Commercial vehicle care" },
    ],
    trustBadge: "Mobile",
    trustLabel: "We Come to You",
    about: "Certified detailers using premium products. We bring the water, power, and products — you just enjoy the results.",
    testimonials: [
      { name: "Vince R.", text: "My car looks better than the day I bought it. Incredible!", role: "Customer" },
      { name: "Olivia S.", text: "They came to my office and detailed my car while I worked.", role: "Customer" },
      { name: "Nick T.", text: "The ceramic coating is worth every penny. Still beading water!", role: "Customer" },
    ],
  },
  "Restaurants": {
    accent: "#DC2626", accentLight: "#ef4444", phone: "(555) 180-9000",
    domain: "bellavitarestaurant.com", rating: 4.8, reviews: 523,
    heroHeadline: "Authentic Flavors, Unforgettable Experience",
    heroSubhead: "Farm-to-table cuisine in a warm, inviting atmosphere. Reserve your table tonight.",
    heroImg: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&fit=crop",
    services: [
      { title: "Dine-In", desc: "Elegant dining room experience" },
      { title: "Private Events", desc: "Host your special occasion" },
      { title: "Catering", desc: "Off-site catering for any size" },
      { title: "Takeout", desc: "Fresh meals to go" },
      { title: "Happy Hour", desc: "Daily drink specials" },
      { title: "Gift Cards", desc: "The perfect gift for foodies" },
    ],
    trustBadge: "Award",
    trustLabel: "Winning Cuisine",
    about: "Chef-driven menu featuring seasonal, locally-sourced ingredients. Voted Best Restaurant 3 years running.",
    testimonials: [
      { name: "Claire B.", text: "The best meal we've had in years. Every dish was perfection.", role: "Diner" },
      { name: "James W.", text: "Incredible atmosphere and the service was impeccable.", role: "Diner" },
      { name: "Sophia L.", text: "We had our anniversary dinner here. Unforgettable evening.", role: "Diner" },
    ],
  },
  "Insurance": {
    accent: "#475569", accentLight: "#64748b", phone: "(555) 190-1000",
    domain: "shieldinsurancegroup.com", rating: 4.9, reviews: 178,
    heroHeadline: "Protect What Matters Most",
    heroSubhead: "Auto, home, life, and business insurance. Compare rates and save up to 40%.",
    heroImg: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80&fit=crop",
    services: [
      { title: "Auto Insurance", desc: "Save on car and truck coverage" },
      { title: "Home Insurance", desc: "Protect your biggest asset" },
      { title: "Life Insurance", desc: "Secure your family's future" },
      { title: "Business Insurance", desc: "Commercial coverage solutions" },
      { title: "Health Insurance", desc: "Affordable health plans" },
      { title: "Bundle & Save", desc: "Multi-policy discounts" },
    ],
    trustBadge: "Save 40%",
    trustLabel: "On Average",
    about: "Independent agents representing 20+ top-rated carriers. We shop the market so you don't have to.",
    testimonials: [
      { name: "Harry B.", text: "Saved $800 a year on auto and home insurance. Incredible!", role: "Client" },
      { name: "Diane F.", text: "They made understanding life insurance so simple.", role: "Client" },
      { name: "Rick S.", text: "Best insurance experience I've had. No pushy sales.", role: "Client" },
    ],
  },
  "Mortgage": {
    accent: "#475569", accentLight: "#64748b", phone: "(555) 200-2000",
    domain: "trustedmortgage.com", rating: 4.9, reviews: 234,
    heroHeadline: "Your Dream Home, Within Reach",
    heroSubhead: "Purchase, refinance, and first-time buyer programs. Low rates, fast approvals.",
    heroImg: "https://images.unsplash.com/photo-1486406146926-c690a1a3a3a3?w=800&q=80&fit=crop",
    services: [
      { title: "Home Purchase", desc: "Get pre-approved today" },
      { title: "Refinance", desc: "Lower your rate and payment" },
      { title: "FHA Loans", desc: "Low down payment options" },
      { title: "VA Loans", desc: "Veteran benefits, zero down" },
      { title: "Jumbo Loans", desc: "Financing for luxury homes" },
      { title: "Cash-Out Refi", desc: "Access your home equity" },
    ],
    trustBadge: "Fast",
    trustLabel: "Approvals",
    about: "Direct lender with 25 years of experience. We close loans in as little as 14 days with transparent pricing.",
    testimonials: [
      { name: "Brenda L.", text: "Closed in 12 days! The rate was better than anyone else offered.", role: "Home Buyer" },
      { name: "Tom K.", text: "As a first-time buyer, they made the process stress-free.", role: "First-Time Buyer" },
      { name: "Maria G.", text: "Refinanced and saved $400 a month. So glad I called.", role: "Homeowner" },
    ],
  },
  "Cleaning Services": {
    accent: "#0D9488", accentLight: "#14b8a6", phone: "(555) 210-3000",
    domain: "sparklecleanteam.com", rating: 4.9, reviews: 298,
    heroHeadline: "Spotless Clean, Every Time",
    heroSubhead: "Residential and commercial cleaning. Bonded, insured, and 100% satisfaction guaranteed.",
    heroImg: "https://images.unsplash.com/photo-1605152276897-4296181db00d?w=800&q=80&fit=crop",
    services: [
      { title: "House Cleaning", desc: "Weekly, bi-weekly, and monthly" },
      { title: "Deep Cleaning", desc: "Top-to-bottom thorough clean" },
      { title: "Move In/Out", desc: "Make-ready cleaning service" },
      { title: "Office Cleaning", desc: "Commercial janitorial service" },
      { title: "Carpet Cleaning", desc: "Steam extraction specialists" },
      { title: "Post-Construction", desc: "Construction cleanup" },
    ],
    trustBadge: "100%",
    trustLabel: "Guaranteed",
    about: "Background-checked, trained professionals. We bring our own eco-friendly supplies and equipment.",
    testimonials: [
      { name: "Grace H.", text: "My house has never been this clean. They even cleaned the blinds!", role: "Client" },
      { name: "Peter J.", text: "Reliable, trustworthy, and they do an amazing job every time.", role: "Client" },
      { name: "Nancy W.", text: "Our office has never looked better. Highly recommend.", role: "Business Owner" },
    ],
  },
};

// Fallback for any industry not in the map
const GENERIC = {
  accent: "#00a2ff", accentLight: "#3b82f6", phone: "(555) 000-0000",
  domain: "yourbusiness.com", rating: 4.9, reviews: 150,
  heroHeadline: "Professional Services You Can Trust",
  heroSubhead: "Quality work, fair pricing, and exceptional customer service. Call for a free estimate today.",
  heroImg: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&fit=crop",
  services: [
    { title: "Service One", desc: "Professional quality service" },
    { title: "Service Two", desc: "Reliable and affordable" },
    { title: "Service Three", desc: "Experienced technicians" },
    { title: "Service Four", desc: "Satisfaction guaranteed" },
    { title: "Service Five", desc: "Free estimates available" },
    { title: "Service Six", desc: "Same-day appointments" },
  ],
  trustBadge: "Trusted",
  trustLabel: "Local Business",
  about: "We pride ourselves on delivering exceptional service with integrity and professionalism.",
  testimonials: [
    { name: "John D.", text: "Excellent service from start to finish. Highly recommend!", role: "Verified Customer" },
    { name: "Mary S.", text: "Professional, punctual, and the quality is outstanding.", role: "Verified Customer" },
    { name: "Bob R.", text: "Best in the business. Will definitely use them again.", role: "Verified Customer" },
  ],
};

export default function WebsitePreview({ industry, template, brand }) {
  const base = INDUSTRY_CONTENT[industry] || { ...GENERIC, heroHeadline: `${industry || "Professional"} Services You Can Trust` };
  const c = brand ? { ...base, accent: brand.accent, accentLight: brand.accentLight } : base;
  const LogoIcon = brand ? (LOGO_ICONS[brand.logo] || Shield) : null;
  const heroLayout = brand?.layout || "left";

  return (
    <div className="flex flex-col h-full">
      {/* Browser frame */}
      <div className="flex items-center gap-1.5 bg-[#1a1a1a] px-3 py-2 rounded-t-xl">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 mx-2 bg-[#333] rounded-md px-3 py-1 text-[10px] text-white/50 font-mono truncate">
          https://{c.domain}
        </div>
        <span className="text-[9px] text-white/30 font-bold px-1">LIVE</span>
      </div>

      {/* Scrollable website */}
      <div className="flex-1 overflow-y-auto bg-white rounded-b-xl">
        {/* Top bar */}
        <div className="bg-[#0a0a0a] text-white text-[10px] flex items-center justify-between px-4 py-1.5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Open Now</span>
            <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> Serving Your Area</span>
          </div>
          <a className="flex items-center gap-1 font-bold hover:opacity-80" style={{ color: c.accentLight }}>
            <Phone className="w-2.5 h-2.5" /> {c.phone}
          </a>
        </div>

        {/* Navigation */}
        <nav className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: c.accent }}>
              {LogoIcon ? <LogoIcon className="w-3.5 h-3.5 text-white" /> : <span className="text-white font-black text-xs">{industry?.[0] || "P"}</span>}
            </div>
            <span className="font-black text-sm text-gray-900">{industry || "Pro"}</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[10px] font-semibold text-gray-600">
            <span>Home</span>
            <span>Services</span>
            <span>About</span>
            <span>Reviews</span>
            <span>Contact</span>
          </div>
          <button
            className="text-[10px] font-bold text-white px-3 py-1.5 rounded-lg"
            style={{ background: c.accent }}
          >
            Free Quote
          </button>
        </nav>

        {/* Hero */}
        <section className="relative h-48 overflow-hidden">
          {heroLayout === "split" ? (
            <div className="flex h-full">
              <div className="w-1/2 flex flex-col justify-center px-4" style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accentLight})` }}>
                <div className="flex items-center gap-0.5 mb-1.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                </div>
                <h1 className="text-lg font-black text-white leading-tight mb-1">{c.heroHeadline}</h1>
                <p className="text-[10px] text-white/80 leading-relaxed mb-2">{c.heroSubhead}</p>
                <button className="text-[11px] font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 bg-white" style={{ color: c.accent }}>
                  <Phone className="w-3 h-3" /> Call Now
                </button>
              </div>
              <div className="w-1/2 relative overflow-hidden">
                <img src={c.heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            </div>
          ) : (
            <>
              <img src={c.heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className={`absolute inset-0 ${heroLayout === "center" ? "bg-black/60" : "bg-gradient-to-r from-black/80 via-black/50 to-transparent"}`} />
              <div className={`relative h-full flex flex-col justify-center px-5 ${heroLayout === "center" ? "items-center text-center" : "max-w-md"}`}>
                <div className="inline-flex items-center gap-1 mb-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <span className="text-[9px] text-white/80 font-bold">{c.rating} · {c.reviews} reviews</span>
                </div>
                <h1 className="text-xl font-black text-white leading-tight mb-1.5">{c.heroHeadline}</h1>
                <p className="text-[11px] text-white/80 leading-relaxed mb-3">{c.heroSubhead}</p>
                <div className="flex items-center gap-2">
                  <button className="text-[11px] font-bold text-white px-4 py-2 rounded-lg flex items-center gap-1.5" style={{ background: c.accent }}>
                    <Phone className="w-3 h-3" /> Call Now
                  </button>
                  <button className="text-[11px] font-bold text-white border border-white/40 px-4 py-2 rounded-lg">
                    Free Estimate
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Trust badges */}
        <section className="flex items-center justify-around px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="text-center">
            <Shield className="w-4 h-4 mx-auto mb-0.5" style={{ color: c.accent }} />
            <div className="text-[9px] font-black text-gray-900">{c.trustBadge}</div>
            <div className="text-[8px] text-gray-400">{c.trustLabel}</div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <Award className="w-4 h-4 mx-auto mb-0.5" style={{ color: c.accent }} />
            <div className="text-[9px] font-black text-gray-900">Licensed</div>
            <div className="text-[8px] text-gray-400">& Insured</div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <ThumbsUp className="w-4 h-4 mx-auto mb-0.5" style={{ color: c.accent }} />
            <div className="text-[9px] font-black text-gray-900">{c.rating}★ Rating</div>
            <div className="text-[8px] text-gray-400">{c.reviews}+ Reviews</div>
          </div>
        </section>

        {/* Services */}
        <section className="px-4 py-5">
          <div className="text-center mb-4">
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: c.accent }}>What We Do</span>
            <h2 className="text-base font-black text-gray-900 mt-0.5">Our Services</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {c.services.map((s, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-3 hover:shadow-md transition" style={{ borderTop: `2px solid ${c.accent}` }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center mb-1.5" style={{ background: `${c.accent}15` }}>
                  <Check className="w-3 h-3" style={{ color: c.accent }} />
                </div>
                <h3 className="text-[11px] font-bold text-gray-900 mb-0.5">{s.title}</h3>
                <p className="text-[9px] text-gray-500 leading-tight">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* About */}
        <section className="px-4 py-5 bg-gray-50">
          <div className="text-center mb-3">
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: c.accent }}>About Us</span>
            <h2 className="text-base font-black text-gray-900 mt-0.5">Why Choose Us</h2>
          </div>
          <p className="text-[10px] text-gray-600 leading-relaxed text-center mb-4 max-w-sm mx-auto">{c.about}</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Zap, title: "Fast Response", desc: "Same-day service" },
              { icon: Shield, title: "Fully Insured", desc: "Your protection" },
              { icon: Award, title: "Experienced", desc: "Years of expertise" },
            ].map((f, i) => (
              <div key={i} className="text-center">
                <div className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center" style={{ background: `${c.accent}15` }}>
                  <f.icon className="w-4 h-4" style={{ color: c.accent }} />
                </div>
                <div className="text-[9px] font-bold text-gray-900">{f.title}</div>
                <div className="text-[8px] text-gray-400">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-4 py-5">
          <div className="text-center mb-3">
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: c.accent }}>Testimonials</span>
            <h2 className="text-base font-black text-gray-900 mt-0.5">What Clients Say</h2>
          </div>
          <div className="space-y-2">
            {c.testimonials.map((t, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-3">
                <div className="flex items-center gap-0.5 mb-1">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-[10px] text-gray-700 italic mb-1.5">"{t.text}"</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: c.accent }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-gray-900">{t.name}</div>
                    <div className="text-[8px] text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-6 text-center" style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accentLight})` }}>
          <h2 className="text-lg font-black text-white mb-1">Ready to Get Started?</h2>
          <p className="text-[10px] text-white/80 mb-3">Call now for a free consultation. Same-day appointments available.</p>
          <button className="inline-flex items-center gap-1.5 bg-white text-[12px] font-bold px-5 py-2.5 rounded-xl" style={{ color: c.accent }}>
            <Phone className="w-3.5 h-3.5" /> {c.phone}
          </button>
        </section>

        {/* Footer */}
        <footer className="bg-[#0a0a0a] text-white/60 px-4 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: c.accent }}>
              {LogoIcon ? <LogoIcon className="w-2.5 h-2.5 text-white" /> : <span className="text-white font-black text-[8px]">{industry?.[0] || "P"}</span>}
            </div>
            <span className="text-[10px] font-bold text-white">{industry || "Pro"}</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-[8px] mb-1.5">
            <span className="flex items-center gap-0.5"><Phone className="w-2 h-2" /> {c.phone}</span>
            <span className="flex items-center gap-0.5"><Mail className="w-2 h-2" /> info@{c.domain}</span>
          </div>
          <div className="text-[8px] text-white/30">© 2026 {industry || "Pro"}. All rights reserved. | Privacy Policy | Terms</div>
        </footer>
      </div>
    </div>
  );
}