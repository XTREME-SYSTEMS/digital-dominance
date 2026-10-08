// TLS Fingerprint Module
// Generates and validates TLS/JA3/JA4 fingerprints for anti-bot evasion
// Matches TLS handshake parameters to browser user agent for consistency

export interface TLSFingerprint {
  ja3_hash: string;
  ja4: string;
  tls_version: string;
  cipher_suites: number[];
  extensions: number[];
  supported_groups: number[];
  alpn: string[];
  signature_algorithms: number[];
}

const BROWSER_PROFILES: Record<string, Omit<TLSFingerprint, 'ja3_hash' | 'ja4'>> = {
  chrome_131: {
    tls_version: 'TLS 1.3',
    cipher_suites: [4865, 4866, 4867, 49195, 49199, 49196, 49200, 52393, 52392, 49195, 49199, 52393],
    extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 34, 51, 43, 13, 45, 28, 27],
    supported_groups: [29, 23, 30, 25, 24, 256, 257],
    alpn: ['h2', 'http/1.1'],
    signature_algorithms: [1027, 1283, 1535, 1281, 1539, 2055, 2056, 2057],
  },
  chrome_120: {
    tls_version: 'TLS 1.3',
    cipher_suites: [4865, 4866, 4867, 49195, 49199, 49196, 49200, 52393, 52392, 49195, 49199, 52393],
    extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 34, 51, 43, 13],
    supported_groups: [29, 23, 30, 25, 24, 256, 257],
    alpn: ['h2', 'http/1.1'],
    signature_algorithms: [1027, 1283, 1535, 1281, 1539, 2055, 2056, 2057],
  },
  firefox_133: {
    tls_version: 'TLS 1.3',
    cipher_suites: [4865, 4866, 4867, 49195, 49199, 49196, 49200, 52393, 52392],
    extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 34, 51, 43, 13, 45, 28, 27, 17513],
    supported_groups: [29, 23, 30, 25, 24, 256, 257],
    alpn: ['h2', 'http/1.1'],
    signature_algorithms: [1027, 1283, 1535, 1281, 1539, 2055, 2056, 2057],
  },
  safari_17: {
    tls_version: 'TLS 1.3',
    cipher_suites: [4865, 4866, 4867, 49195, 49199, 49196, 49200, 52393, 52392],
    extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 34, 51, 43, 13, 45, 28, 27],
    supported_groups: [29, 23, 30, 25, 24],
    alpn: ['h2', 'http/1.1'],
    signature_algorithms: [1027, 1283, 1535, 1281, 1539, 2055, 2056, 2057],
  },
};

function generateJa3Hash(fp: Omit<TLSFingerprint, 'ja3_hash' | 'ja4'>): string {
  const ja3String = `${fp.tls_version},${fp.cipher_suites.join('-')},${fp.extensions.join('-')},${fp.supported_groups.join('-')},0`;
  let hash = 0;
  for (let i = 0; i < ja3String.length; i++) {
    const char = ja3String.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function generateJa4(fp: Omit<TLSFingerprint, 'ja3_hash' | 'ja4'>): string {
  const cipherCount = fp.cipher_suites.length.toString(16).padStart(2, '0');
  const extCount = fp.extensions.length.toString(16).padStart(2, '0');
  const groupCount = fp.supported_groups.length.toString(16).padStart(2, '0');
  return `t13${cipherCount}${extCount}${groupCount}_${fp.alpn.join('-')}`;
}

export function getFingerprint(browserProfile: string = 'chrome_131'): TLSFingerprint {
  const profile = BROWSER_PROFILES[browserProfile] || BROWSER_PROFILES.chrome_131;
  return {
    ...profile,
    ja3_hash: generateJa3Hash(profile),
    ja4: generateJa4(profile),
  };
}

export function getMatchingUserAgent(browserProfile: string): string {
  const userAgents: Record<string, string> = {
    chrome_131: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    chrome_120: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    firefox_133: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    safari_17: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  };
  return userAgents[browserProfile] || userAgents.chrome_131;
}

export function getAvailableProfiles(): string[] {
  return Object.keys(BROWSER_PROFILES);
}