// Studio config for the Universal Template Studio.
// Manages brand styling (colors, logo, fonts) and projects them onto CSS
// custom properties so every live preview re-renders instantly.
// Adapted from the uploaded universal template system.

const STORAGE_KEY = "uts_brand_configs_v1";

export const DEFAULT_CONFIG = {
  primaryColor: "#D4A92E",
  secondaryColor: "#B8901E",
  accentColor: "#1a1a1a",
  logoText: "Xtreme Polishing Systems",
  logoImage: "",
  brandName: "Xtreme Polishing Systems",
  heading: "Transform Your Concrete Floors",
  subtitle: "Professional epoxy and polished concrete solutions.",
  themeMode: "light",
  fontColor: "#0B0B0D",
  fontFamily: "Inter",
  fontHeading: "Plus Jakarta Sans",
  fontScale: 1,
  phone: "(877) 958-5264",
  tagline: "#1 National Distributor",
};

export function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch { /* ignore */ }
}

export function resetConfig() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export function loadFont(family) {
  if (typeof document === "undefined" || !family) return;
  const id = "uts-google-fonts";
  const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@400;500;600;700;800;900&display=swap`;
  let link = document.getElementById(id);
  if (!link) {
    link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = href;
}

// Project brand config onto CSS custom properties for the scoped preview.
export function themeToCssVars(config) {
  const c = { ...DEFAULT_CONFIG, ...config };
  return {
    "--brand-primary": c.primaryColor || DEFAULT_CONFIG.primaryColor,
    "--brand-secondary": c.secondaryColor || DEFAULT_CONFIG.secondaryColor,
    "--brand-accent": c.accentColor || DEFAULT_CONFIG.accentColor,
    "--brand-text": c.themeMode === "dark" ? "#F5F5F5" : (c.fontColor || "#0B0B0D"),
    "--brand-background": c.themeMode === "dark" ? "#0B0B0D" : "#FFFFFF",
    "--brand-surface": c.themeMode === "dark" ? "#101012" : "#FFFFFF",
    "--brand-muted": c.themeMode === "dark" ? "#1F1F1F" : "#F4F4F5",
    "--brand-muted-foreground": c.themeMode === "dark" ? "#A8A8A8" : "#71717A",
    "--brand-border": c.themeMode === "dark" ? "#2E2E2E" : "#E4E4E7",
    "--brand-on-primary": "#FFFFFF",
    "--brand-gold-light": "#FFF6D5",
    "--brand-gold-bright": "#F8E71C",
    "--brand-gold-deep": "#8B6914",
    "--brand-font-heading": `'${c.fontHeading || "Plus Jakarta Sans"}', sans-serif`,
    "--brand-font-body": `'${c.fontFamily || "Inter"}', sans-serif`,
    "--vg-font-scale": String(c.fontScale || 1),
  };
}

export function configFromBrandPreset(preset) {
  return {
    ...DEFAULT_CONFIG,
    primaryColor: preset.primary_color,
    secondaryColor: preset.secondary_color,
    accentColor: preset.accent_color,
    logoText: preset.logo_text,
    logoImage: preset.logo_url || "",
    brandName: preset.name,
    tagline: preset.tagline,
    phone: preset.phone,
    fontHeading: preset.font_heading,
    fontFamily: preset.font_body,
  };
}