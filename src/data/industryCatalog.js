export const OTHER_OPTION = '__other__';

/**
 * The 20 service industries the template catalogue is built from, with the
 * services each trade traditionally offers and its sub-industries. The wizard
 * uses this to list services with a select-all, and every dropdown keeps an
 * "Other" write-in so a business outside the list is never blocked.
 */
const CATALOG = [
  ['legal', 'Legal', ['Personal Injury', 'Business Law', 'Estate Planning', 'Family Law', 'Property Law', 'Case Consultation'], ['Personal Injury', 'Family Law', 'Business Law', 'Estate Planning', 'Criminal Defense', 'Immigration']],
  ['real_estate', 'Real Estate', ['Buy a Home', 'Sell a Property', 'Luxury Homes', 'Property Valuation', 'Relocation', 'Investment Properties'], ['Residential Sales', 'Luxury Homes', 'Commercial Property', 'Property Management', 'Buyer Representation', 'Investment Property']],
  ['epoxy_flooring', 'Epoxy Flooring', ['Garage Coatings', 'Metallic Epoxy', 'Flake Systems', 'Commercial Floors', 'Concrete Preparation', 'Polyaspartic Finishes'], ['Garage Floors', 'Metallic Epoxy', 'Flake Systems', 'Commercial Flooring', 'Concrete Polishing', 'Polyaspartic Coating']],
  ['roofing', 'Roofing', ['Roof Inspection', 'Leak Repair', 'Roof Replacement', 'Storm Damage Assessment', 'Gutters', 'Roof Maintenance'], ['Shingle Roofing', 'Metal Roofing', 'Flat Roofing', 'Roof Repair', 'Storm Restoration', 'Gutters']],
  ['hvac', 'HVAC', ['AC Repair', 'Heating Repair', 'System Installation', 'Indoor Air Quality', 'Duct Services', 'Maintenance Plans'], ['AC Repair', 'Heating Repair', 'System Installation', 'Ductwork', 'Indoor Air Quality', 'Maintenance Plans']],
  ['plumbing', 'Plumbing', ['Leak Detection', 'Drain Cleaning', 'Water Heaters', 'Pipe Repair', 'Fixture Installation', 'Sewer Services'], ['Emergency Plumbing', 'Drain Cleaning', 'Water Heaters', 'Repiping', 'Sewer Lines', 'Fixture Installation']],
  ['electrical', 'Electrical', ['Panel Upgrades', 'Lighting', 'Wiring', 'EV Charging', 'Generators', 'Electrical Inspection'], ['Residential Electrical', 'Commercial Electrical', 'Panel Upgrades', 'EV Chargers', 'Generators', 'Lighting Design']],
  ['med_spa', 'Med Spa', ['Skin Consultation', 'Facial Treatments', 'Injectable Consultation', 'Laser Treatments', 'Body Treatments', 'Skin Care'], ['Injectables', 'Laser Treatments', 'Facial Treatments', 'Body Contouring', 'Skin Care', 'Wellness Programs']],
  ['dental', 'Dental', ['General Dentistry', 'Preventive Care', 'Cosmetic Consultation', 'Restorative Care', 'Dental Implants', 'Emergency Assessment'], ['General Dentistry', 'Cosmetic Dentistry', 'Implants', 'Orthodontics', 'Pediatric Dentistry', 'Emergency Dentistry']],
  ['chiropractic', 'Chiropractic', ['Initial Assessment', 'Chiropractic Care', 'Mobility Support', 'Posture Consultation', 'Rehabilitation', 'Wellness Visits'], ['Spinal Adjustment', 'Sports Chiropractic', 'Posture Correction', 'Rehabilitation', 'Pediatric Chiropractic', 'Wellness Care']],
  ['remodeling', 'Remodeling', ['Kitchen Remodels', 'Bathroom Remodels', 'Home Additions', 'Whole-Home Renovation', 'Custom Cabinetry', 'Interior Finishes'], ['Kitchen Remodeling', 'Bathroom Remodeling', 'Home Additions', 'Basement Finishing', 'Whole-Home Renovation', 'Custom Cabinetry']],
  ['landscaping', 'Landscaping', ['Landscape Design', 'Planting', 'Hardscaping', 'Lawn Care', 'Irrigation', 'Outdoor Lighting'], ['Landscape Design', 'Lawn Care', 'Hardscaping', 'Irrigation', 'Tree & Shrub Care', 'Outdoor Lighting']],
  ['solar', 'Solar', ['Solar Consultation', 'System Design', 'Panel Installation', 'Battery Storage', 'System Monitoring', 'Maintenance'], ['Residential Solar', 'Commercial Solar', 'Battery Storage', 'Solar Repair', 'System Design', 'Energy Audits']],
  ['pest_control', 'Pest Control', ['Pest Inspection', 'Termite Services', 'Rodent Services', 'Mosquito Services', 'Commercial Pest Care', 'Prevention Plans'], ['General Pest Control', 'Termite Treatment', 'Rodent Control', 'Bed Bug Treatment', 'Mosquito Control', 'Wildlife Removal']],
  ['moving', 'Moving', ['Local Moving', 'Long-Distance Moving', 'Packing', 'Storage', 'Office Moving', 'Specialty Items'], ['Local Moving', 'Long-Distance Moving', 'Packing Services', 'Storage', 'Office Relocation', 'Specialty Items']],
  ['auto_detailing', 'Auto Detailing', ['Exterior Detail', 'Interior Detail', 'Paint Correction', 'Ceramic Coatings', 'Paint Protection', 'Maintenance Detail'], ['Ceramic Coating', 'Paint Correction', 'Interior Detailing', 'Exterior Detailing', 'Window Tinting', 'Fleet Detailing']],
  ['restaurants', 'Restaurants', ['Seasonal Menu', 'Dining Reservations', 'Private Dining', 'Events', 'Catering', 'Takeaway'], ['Fine Dining', 'Casual Dining', 'Cafe & Bakery', 'Catering', 'Food Truck', 'Private Events']],
  ['insurance', 'Insurance', ['Home Coverage', 'Auto Coverage', 'Life Coverage', 'Business Coverage', 'Renters Coverage', 'Policy Review'], ['Auto Insurance', 'Home Insurance', 'Life Insurance', 'Business Insurance', 'Health Insurance', 'Medicare Plans']],
  ['mortgage', 'Mortgage', ['Home Purchase', 'Refinancing', 'First-Time Buyers', 'Loan Consultation', 'Prequalification', 'Financing Education'], ['Home Purchase Loans', 'Refinancing', 'FHA Loans', 'VA Loans', 'Jumbo Loans', 'First-Time Buyer Programs']],
  ['cleaning_services', 'Cleaning Services', ['Home Cleaning', 'Deep Cleaning', 'Move-In Cleaning', 'Office Cleaning', 'Recurring Service', 'Specialty Cleaning'], ['Residential Cleaning', 'Commercial Cleaning', 'Deep Cleaning', 'Move-In / Move-Out', 'Recurring Service', 'Window Cleaning']],
];

export const INDUSTRY_OPTIONS = CATALOG.map(([key, label, services, subIndustries]) => ({
  key, label, services, sub_industries: subIndustries,
}));

export function industryOption(key) {
  return INDUSTRY_OPTIONS.find(industry => industry.key === key) || null;
}

export function industryLabel(key) {
  return industryOption(key)?.label || '';
}

export function industryKeyForLabel(label) {
  const wanted = String(label || '').toLowerCase();
  return INDUSTRY_OPTIONS.find(industry => industry.label.toLowerCase() === wanted)?.key || null;
}

export function industryServices(key) {
  return industryOption(key)?.services || [];
}

export function subIndustryOptions(key) {
  return industryOption(key)?.sub_industries || [];
}