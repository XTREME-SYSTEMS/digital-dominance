// Major US cities for national programmatic site launches
// Grouped by region for strategic targeting
export const NATIONAL_CITIES = [
  // ── Florida (home base) ──
  { city: "Miami", state: "FL", region: "Southeast", priority: "high" },
  { city: "Orlando", state: "FL", region: "Southeast", priority: "high" },
  { city: "Tampa", state: "FL", region: "Southeast", priority: "high" },
  { city: "Jacksonville", state: "FL", region: "Southeast", priority: "high" },
  { city: "Fort Lauderdale", state: "FL", region: "Southeast", priority: "high" },
  { city: "St. Petersburg", state: "FL", region: "Southeast", priority: "medium" },
  { city: "Tallahassee", state: "FL", region: "Southeast", priority: "medium" },
  { city: "Gainesville", state: "FL", region: "Southeast", priority: "medium" },
  { city: "Naples", state: "FL", region: "Southeast", priority: "medium" },
  { city: "Sarasota", state: "FL", region: "Southeast", priority: "medium" },
  // ── Texas ──
  { city: "Austin", state: "TX", region: "Southwest", priority: "high" },
  { city: "Dallas", state: "TX", region: "Southwest", priority: "high" },
  { city: "Houston", state: "TX", region: "Southwest", priority: "high" },
  { city: "San Antonio", state: "TX", region: "Southwest", priority: "high" },
  { city: "Fort Worth", state: "TX", region: "Southwest", priority: "medium" },
  { city: "El Paso", state: "TX", region: "Southwest", priority: "medium" },
  // ── California ──
  { city: "Los Angeles", state: "CA", region: "West", priority: "high" },
  { city: "San Diego", state: "CA", region: "West", priority: "high" },
  { city: "San Francisco", state: "CA", region: "West", priority: "high" },
  { city: "San Jose", state: "CA", region: "West", priority: "high" },
  { city: "Sacramento", state: "CA", region: "West", priority: "medium" },
  { city: "Fresno", state: "CA", region: "West", priority: "medium" },
  // ── Colorado ──
  { city: "Denver", state: "CO", region: "Mountain", priority: "high" },
  { city: "Colorado Springs", state: "CO", region: "Mountain", priority: "medium" },
  { city: "Boulder", state: "CO", region: "Mountain", priority: "medium" },
  // ── New York ──
  { city: "New York", state: "NY", region: "Northeast", priority: "high" },
  { city: "Buffalo", state: "NY", region: "Northeast", priority: "medium" },
  { city: "Rochester", state: "NY", region: "Northeast", priority: "medium" },
  // ── Illinois ──
  { city: "Chicago", state: "IL", region: "Midwest", priority: "high" },
  { city: "Aurora", state: "IL", region: "Midwest", priority: "medium" },
  // ── Georgia ──
  { city: "Atlanta", state: "GA", region: "Southeast", priority: "high" },
  { city: "Savannah", state: "GA", region: "Southeast", priority: "medium" },
  // ── North Carolina ──
  { city: "Charlotte", state: "NC", region: "Southeast", priority: "high" },
  { city: "Raleigh", state: "NC", region: "Southeast", priority: "high" },
  { city: "Asheville", state: "NC", region: "Southeast", priority: "medium" },
  // ── Arizona ──
  { city: "Phoenix", state: "AZ", region: "Southwest", priority: "high" },
  { city: "Tucson", state: "AZ", region: "Southwest", priority: "medium" },
  // ── Washington ──
  { city: "Seattle", state: "WA", region: "West", priority: "high" },
  { city: "Spokane", state: "WA", region: "West", priority: "medium" },
  // ── Massachusetts ──
  { city: "Boston", state: "MA", region: "Northeast", priority: "high" },
  // ── Pennsylvania ──
  { city: "Philadelphia", state: "PA", region: "Northeast", priority: "high" },
  { city: "Pittsburgh", state: "PA", region: "Northeast", priority: "medium" },
  // ── Ohio ──
  { city: "Columbus", state: "OH", region: "Midwest", priority: "high" },
  { city: "Cleveland", state: "OH", region: "Midwest", priority: "medium" },
  { city: "Cincinnati", state: "OH", region: "Midwest", priority: "medium" },
  // ── Michigan ──
  { city: "Detroit", state: "MI", region: "Midwest", priority: "high" },
  { city: "Grand Rapids", state: "MI", region: "Midwest", priority: "medium" },
  // ── Minnesota ──
  { city: "Minneapolis", state: "MN", region: "Midwest", priority: "high" },
  // ── Oregon ──
  { city: "Portland", state: "OR", region: "West", priority: "high" },
  // ── Nevada ──
  { city: "Las Vegas", state: "NV", region: "West", priority: "high" },
  // ── Tennessee ──
  { city: "Nashville", state: "TN", region: "Southeast", priority: "high" },
  { city: "Memphis", state: "TN", region: "Southeast", priority: "medium" },
  // ── Indiana ──
  { city: "Indianapolis", state: "IN", region: "Midwest", priority: "high" },
  // ── Missouri ──
  { city: "Kansas City", state: "MO", region: "Midwest", priority: "medium" },
  { city: "St. Louis", state: "MO", region: "Midwest", priority: "medium" },
  // ── Wisconsin ──
  { city: "Milwaukee", state: "WI", region: "Midwest", priority: "medium" },
  // ── Utah ──
  { city: "Salt Lake City", state: "UT", region: "Mountain", priority: "medium" },
  // ── New Mexico ──
  { city: "Albuquerque", state: "NM", region: "Southwest", priority: "medium" },
  // ── Oklahoma ──
  { city: "Oklahoma City", state: "OK", region: "Southwest", priority: "medium" },
  { city: "Tulsa", state: "OK", region: "Southwest", priority: "medium" },
  // ── Louisiana ──
  { city: "New Orleans", state: "LA", region: "Southeast", priority: "medium" },
  // ── Alabama ──
  { city: "Birmingham", state: "AL", region: "Southeast", priority: "medium" },
  // ── South Carolina ──
  { city: "Charleston", state: "SC", region: "Southeast", priority: "medium" },
  // ── Kentucky ──
  { city: "Louisville", state: "KY", region: "Southeast", priority: "medium" },
  // ── Connecticut ──
  { city: "Hartford", state: "CT", region: "Northeast", priority: "medium" },
];

export const REGIONS = ["Southeast", "Southwest", "West", "Mountain", "Northeast", "Midwest"];

export const HIGH_PRIORITY_CITIES = NATIONAL_CITIES.filter((c) => c.priority === "high");