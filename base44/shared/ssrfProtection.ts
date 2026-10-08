// SSRF Protection — validates URLs to prevent Server-Side Request Forgery attacks.
// Blocks private IP ranges, cloud metadata endpoints, localhost, and non-HTTP protocols.

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
  /^fd/,
];

const METADATA_ENDPOINTS = new Set([
  '169.254.169.254',
  'metadata.google.internal',
  'metadata.aws.internal',
  '100.100.100.200',
  'metadata.azure.com',
]);

export function isPrivateIP(ip: string): boolean {
  return PRIVATE_IP_PATTERNS.some(pattern => pattern.test(ip));
}

export function isMetadataEndpoint(hostname: string): boolean {
  return METADATA_ENDPOINTS.has(hostname.toLowerCase());
}

export interface UrlValidationOptions {
  allowlist?: string[];
  blocklist?: string[];
  enforceHttps?: boolean;
  allowPrivateIps?: boolean;
}

export interface UrlValidationResult {
  valid: boolean;
  reason?: string;
  sanitized?: string;
  hostname?: string;
  protocol?: string;
}

export function validateUrl(url: string, options?: UrlValidationOptions): UrlValidationResult {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, reason: `Protocol '${parsed.protocol}' not allowed — only http/https` };
  }

  if (options?.enforceHttps && parsed.protocol !== 'https:') {
    return { valid: false, reason: 'HTTPS required but URL uses HTTP' };
  }

  const hostname = parsed.hostname;

  if (isMetadataEndpoint(hostname)) {
    return { valid: false, reason: 'Cloud metadata endpoint blocked (SSRF protection)' };
  }

  if (!options?.allowPrivateIps && isPrivateIP(hostname)) {
    return { valid: false, reason: `Private/internal IP address blocked: ${hostname}` };
  }

  if (!options?.allowPrivateIps && (hostname === 'localhost' || hostname === '0.0.0.0' || hostname === '[::]')) {
    return { valid: false, reason: 'Localhost blocked' };
  }

  if (options?.blocklist && options.blocklist.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
    return { valid: false, reason: `Domain blocked by blocklist: ${hostname}` };
  }

  if (options?.allowlist && !options.allowlist.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
    return { valid: false, reason: `Domain not in allowlist: ${hostname}` };
  }

  return {
    valid: true,
    sanitized: parsed.href,
    hostname,
    protocol: parsed.protocol,
  };
}