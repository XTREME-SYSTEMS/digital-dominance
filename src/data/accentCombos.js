/**
 * The ten accent combinations trending hardest on service and contractor sites
 * right now. Each one drives the site's buttons, links and accent details.
 */
export const ACCENT_COMBOS = [
  { id: 'electric_blue', name: 'Electric Blue', accent: '#0f7bd6', accentLight: '#5ab8ff', gradient: 'linear-gradient(135deg,#0f7bd6,#00c2ff)' },
  { id: 'midnight_navy', name: 'Midnight Navy', accent: '#1b2a52', accentLight: '#4b6ba8', gradient: 'linear-gradient(135deg,#1b2a52,#3763a8)' },
  { id: 'graphite_orange', name: 'Graphite / Orange', accent: '#f2660d', accentLight: '#ffa15c', gradient: 'linear-gradient(135deg,#2b2f36,#f2660d)' },
  { id: 'forest_gold', name: 'Forest / Gold', accent: '#1f5c46', accentLight: '#d4af37', gradient: 'linear-gradient(135deg,#1f5c46,#d4af37)' },
  { id: 'deep_teal', name: 'Deep Teal', accent: '#0f6f77', accentLight: '#3fbec0', gradient: 'linear-gradient(135deg,#0f6f77,#3fbec0)' },
  { id: 'slate_lime', name: 'Slate / Lime', accent: '#84cc16', accentLight: '#bef264', gradient: 'linear-gradient(135deg,#334155,#84cc16)' },
  { id: 'royal_purple', name: 'Royal Purple', accent: '#5b21b6', accentLight: '#a78bfa', gradient: 'linear-gradient(135deg,#5b21b6,#a78bfa)' },
  { id: 'crimson_steel', name: 'Crimson / Steel', accent: '#b91c1c', accentLight: '#f87171', gradient: 'linear-gradient(135deg,#1f2937,#b91c1c)' },
  { id: 'burnt_copper', name: 'Burnt Copper', accent: '#b45309', accentLight: '#f0b464', gradient: 'linear-gradient(135deg,#b45309,#f0b464)' },
  { id: 'ocean_cyan', name: 'Ocean / Cyan', accent: '#0369a1', accentLight: '#22d3ee', gradient: 'linear-gradient(135deg,#0369a1,#22d3ee)' },
];

export function accentCombo(id) {
  return ACCENT_COMBOS.find(combo => combo.id === id) || ACCENT_COMBOS[0];
}