// Proxy Provider Integration Module
// Supports Bright Data, Smartproxy, Oxylabs, IPRoyal, SOAX API-based proxy rotation
// Enables residential/mobile proxy network access without owning the infrastructure

export interface ProxyProviderConfig {
  provider: string;
  endpoint: string;
  username: string;
  password: string;
  rotation: 'sticky' | 'session' | 'random';
  sessionTtlMin?: number;
}

export interface ProxyEndpoint {
  url: string;
  country?: string;
  city?: string;
  state?: string;
  asn?: string;
  zipCode?: string;
  ipType: string;
}

const PROVIDER_ENDPOINTS: Record<string, string> = {
  bright_data: 'brd-customer-{}-zone-{}:{}@brd.superproxy.io:22225',
  smartproxy: '{}:{}@gate.smartproxy.com:7000',
  oxylabs: 'customer-{}-cc-{}:{}@pr.oxylabs.io:7777',
  iproyal: '{}:{}@geo.iproyal.com:12321',
  soax: '{}:{}@p.soax.com:9000',
};

export function buildProxyUrl(config: ProxyProviderConfig, geo?: {
  country?: string;
  city?: string;
  state?: string;
  asn?: string;
  zipCode?: string;
}): ProxyEndpoint {
  let url: string;
  if (config.provider === 'bright_data') {
    let usernamePart = config.username;
    if (geo?.country) usernamePart += `-country-${geo.country.toLowerCase()}`;
    if (geo?.city) usernamePart += `-city-${geo.city.toLowerCase().replace(/\s/g, '')}`;
    if (geo?.state) usernamePart += `-state-${geo.state.toLowerCase()}`;
    if (geo?.asn) usernamePart += `-asn-${geo.asn.toLowerCase()}`;
    if (geo?.zipCode) usernamePart += `-zip-${geo.zipCode}`;
    url = `${usernamePart}:${config.password}@brd.superproxy.io:22225`;
  } else if (config.provider === 'smartproxy') {
    let usernamePart = config.username;
    if (geo?.country) usernamePart += `-country-${geo.country.toLowerCase()}`;
    if (geo?.city) usernamePart += `-city-${geo.city.toLowerCase().replace(/\s/g, '_')}`;
    if (geo?.state) usernamePart += `-state-${geo.state.toLowerCase()}`;
    url = `${usernamePart}:${config.password}@gate.smartproxy.com:7000`;
  } else if (config.provider === 'oxylabs') {
    let usernamePart = config.username;
    if (geo?.country) usernamePart += `-cc-${geo.country.toLowerCase()}`;
    if (geo?.city) usernamePart += `-city-${geo.city.toLowerCase().replace(/\s/g, '_')}`;
    url = `${usernamePart}:${config.password}@pr.oxylabs.io:7777`;
  } else if (config.provider === 'iproyal') {
    let usernamePart = config.username;
    if (geo?.country) usernamePart += `-country-${geo.country.toLowerCase()}`;
    if (geo?.state) usernamePart += `-state-${geo.state.toLowerCase()}`;
    url = `${usernamePart}:${config.password}@geo.iproyal.com:12321`;
  } else if (config.provider === 'soax') {
    let usernamePart = config.username;
    if (geo?.country) usernamePart += `-cc-${geo.country.toLowerCase()}`;
    url = `${usernamePart}:${config.password}@p.soax.com:9000`;
  } else {
    url = `${config.username}:${config.password}@${config.endpoint}`;
  }

  return {
    url,
    country: geo?.country,
    city: geo?.city,
    state: geo?.state,
    asn: geo?.asn,
    zipCode: geo?.zipCode,
    ipType: config.provider === 'bright_data' || config.provider === 'smartproxy' ? 'residential' : 'datacenter',
  };
}

export function getSupportedProviders(): string[] {
  return Object.keys(PROVIDER_ENDPOINTS);
}