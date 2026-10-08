// Anti-Bot Bypass Strategy Module
// Provides bypass strategies for Akamai, DataDome, PerimeterX, Kasada, Imperva, Arkose Labs
// Uses existing platform capabilities: fingerprint randomization, human behavior, proxy rotation, stealth options

export interface BypassStrategy {
  system: string;
  detected: boolean;
  strategy: string[];
  recommendedConfig: {
    proxyType: string;
    fingerprintLevel: string;
    behaviorLevel: string;
    captchaProvider: string;
    additionalHeaders: Record<string, string>;
  };
  confidence: number;
}

const STRATEGIES: Record<string, Omit<BypassStrategy, 'detected'>> = {
  akamai: {
    system: 'Akamai Bot Manager',
    strategy: [
      'Use residential/mobile proxy with ASN matching target site',
      'Enable full fingerprint randomization (WebGL, Canvas, AudioContext)',
      'Enable human behavior simulation (mouse bezier + typing jitter)',
      'Set realistic TLS fingerprint matching browser UA',
      'Block sensor script endpoints via network interception',
      'Use persistent profile with valid cookies from prior visit',
    ],
    recommendedConfig: {
      proxyType: 'residential',
      fingerprintLevel: 'full',
      behaviorLevel: 'high',
      captchaProvider: 'none',
      additionalHeaders: { 'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24"' },
    },
    confidence: 0.75,
  },
  datadome: {
    system: 'DataDome',
    strategy: [
      'Use residential proxy with city-level geo-targeting',
      'Enable fingerprint randomization with consistent session identity',
      'Simulate human behavior with realistic scroll + click patterns',
      'Pre-warm session with non-bot navigation before target page',
      'Use mobile proxy for highest trust score',
      'Rotate proxy on each DataDome challenge',
    ],
    recommendedConfig: {
      proxyType: 'mobile',
      fingerprintLevel: 'full',
      behaviorLevel: 'high',
      captchaProvider: '2captcha',
      additionalHeaders: { 'accept-language': 'en-US,en;q=0.9' },
    },
    confidence: 0.70,
  },
  perimeterx: {
    system: 'PerimeterX (HUMAN)',
    strategy: [
      'Use residential proxy with stable session (no rotation mid-session)',
      'Enable full fingerprint randomization with consistent values per session',
      'Simulate human behavior: mouse movements, scroll, hover before click',
      'Set TLS fingerprint matching declared User-Agent',
      'Avoid headless detection: patch navigator.webdriver, plugins, languages',
      'Use persistent cookies from prior successful visit',
    ],
    recommendedConfig: {
      proxyType: 'residential',
      fingerprintLevel: 'full',
      behaviorLevel: 'high',
      captchaProvider: 'none',
      additionalHeaders: { 'sec-ch-ua-platform': '"Windows"' },
    },
    confidence: 0.72,
  },
  kasada: {
    system: 'Kasada',
    strategy: [
      'Use mobile proxy with high reputation IP pool',
      'Enable full fingerprint randomization including WebRTC',
      'Simulate advanced human behavior with realistic timing',
      'Patch all headless indicators (webdriver, plugins, chrome object)',
      'Use TLS fingerprint matching latest Chrome version',
      'Pre-solve Kasada challenge token via browser engine before navigation',
    ],
    recommendedConfig: {
      proxyType: 'mobile',
      fingerprintLevel: 'full',
      behaviorLevel: 'high',
      captchaProvider: 'capsolver',
      additionalHeaders: { 'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24"' },
    },
    confidence: 0.60,
  },
  imperva: {
    system: 'Imperva Incapsula',
    strategy: [
      'Use residential proxy with ASN matching target site region',
      'Enable fingerprint randomization with consistent session identity',
      'Simulate human behavior with natural scroll patterns',
      'Set realistic TLS fingerprint and User-Agent',
      'Use persistent cookies from prior visit',
      'Handle Imperva reCAPTCHA challenge via captcha solver',
    ],
    recommendedConfig: {
      proxyType: 'residential',
      fingerprintLevel: 'full',
      behaviorLevel: 'medium',
      captchaProvider: '2captcha',
      additionalHeaders: {},
    },
    confidence: 0.68,
  },
  arkose: {
    system: 'Arkose Labs (FunCaptcha)',
    strategy: [
      'Use residential proxy with stable session',
      'Enable fingerprint randomization',
      'Simulate human behavior before captcha appears',
      'Use third-party captcha solver for Arkose Labs puzzles',
      'Rotate proxy if captcha challenge difficulty increases',
      'Pre-warm session with normal browsing before target page',
    ],
    recommendedConfig: {
      proxyType: 'residential',
      fingerprintLevel: 'full',
      behaviorLevel: 'medium',
      captchaProvider: 'capsolver',
      additionalHeaders: {},
    },
    confidence: 0.55,
  },
  cloudflare: {
    system: 'Cloudflare Bot Management',
    strategy: [
      'Use residential proxy with clean IP reputation',
      'Enable TLS fingerprint matching browser UA (JA3/JA4)',
      'Solve Cloudflare Turnstile challenge via captcha provider',
      'Simulate human behavior: mouse movement, scroll, delay',
      'Set realistic HTTP/2 headers and ALPN',
      'Use persistent cookies from prior successful challenge solve',
    ],
    recommendedConfig: {
      proxyType: 'residential',
      fingerprintLevel: 'full',
      behaviorLevel: 'high',
      captchaProvider: 'capsolver',
      additionalHeaders: { 'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24"' },
    },
    confidence: 0.78,
  },
};

// Detect which anti-bot system is present from page content / headers
export function detectAntiBotSystem(html: string, headers: Record<string, string> = {}): string | null {
  const checks: Record<string, (html: string, headers: Record<string, string>) => boolean> = {
    akamai: (h, hdr) => h.includes('_abck') || h.includes('akamai') || hdr['server']?.includes('Akamai') || false,
    datadome: (h, hdr) => h.includes('datadome') || hdr['x-datadome'] !== undefined || false,
    perimeterx: (h, hdr) => h.includes('_px') || h.includes('perimeterx') || hdr['x-px'] !== undefined || false,
    kasada: (h, hdr) => h.includes('kasada') || hdr['x-kasada'] !== undefined || false,
    imperva: (h, hdr) => h.includes('incapsula') || hdr['x-iinfo'] !== undefined || false,
    arkose: (h, hdr) => h.includes('arkose') || h.includes('funcaptcha') || false,
    cloudflare: (h, hdr) => h.includes('cf-') || hdr['server']?.includes('cloudflare') || h.includes('cf-browser-verification') || false,
  };

  for (const [system, check] of Object.entries(checks)) {
    if (check(html, headers)) return system;
  }
  return null;
}

// Get bypass strategy for a detected system
export function getBypassStrategy(system: string | null): BypassStrategy | null {
  if (!system || !STRATEGIES[system]) return null;
  return { ...STRATEGIES[system], detected: true };
}

// Get all available strategies
export function getAllStrategies(): BypassStrategy[] {
  return Object.entries(STRATEGIES).map(([key, val]) => ({ ...val, detected: false }));
}