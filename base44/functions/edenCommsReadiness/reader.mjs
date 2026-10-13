// Read-only GPT/Eden -> Xtreme Communications bridge.
// No calls, messages, provider writes, purchases, or contact lookups.
const ENDPOINT = 'https://xtreme-communications.com/api/functions/gptTwilio';
const respond = (value, status = 200) => Response.json(value, {
  status,
  headers: { 'cache-control': 'no-store' },
});
const onlyBoolean = value => value === true;
const maskRoute = route => route && typeof route === 'object' ? {
  configured: onlyBoolean(route.configured),
  excluded: onlyBoolean(route.excluded),
} : { configured: false, excluded: false };
const canonicalNumber = value => typeof value === 'string' && /^\+[1-9][0-9]{7,14}$/.test(value);

export function createEdenCommsReadiness({ authenticate, getApiKey, getEdenNumber, fetcher = fetch } = {}) {
  if (typeof authenticate !== 'function' || typeof getApiKey !== 'function' || typeof getEdenNumber !== 'function') {
    throw new TypeError('Server-side authorization and secret bindings are required');
  }
  return async function handle(req) {
    try {
      if (req.method !== 'POST') return respond({ status: 'blocked', error: 'POST required' }, 405);
      const identity = await authenticate(req);
      if (!identity) return respond({ status: 'blocked', error: 'Authentication required' }, 401);
      if (identity.role !== 'admin') return respond({ status: 'blocked', error: 'Admin authorization required' }, 403);
      if (req.headers.get('sec-fetch-site') === 'cross-site') return respond({ status: 'blocked', error: 'Cross-site request denied' }, 403);
      let body;
      try { body = await req.json(); } catch { return respond({ status: 'invalid_request', error: 'JSON required' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return respond({ status: 'invalid_request', error: 'JSON object required' }, 400);
      const action = body.action ?? 'status';
      if (!['status', 'inspect_number'].includes(action)) return respond({ status: 'blocked', error: 'Read-only status or inspect_number only' }, 400);
      const allowedNumber = getEdenNumber();
      if (action === 'inspect_number' && (!canonicalNumber(allowedNumber) || (body.number && body.number !== allowedNumber))) {
        return respond({ status: 'blocked', error: 'Number not authorized for inspection' }, 403);
      }
      const apiKey = getApiKey();
      if (!apiKey || typeof apiKey !== 'string') return respond({ status: 'credentials_required', provider: 'xtreme-communications' }, 503);
      const outgoing = action === 'status' ? { action: 'status' } : { action: 'inspect_number', number: allowedNumber };
      // Fixed host prevents SSRF. API key is never sent in the JSON body.
      const res = await fetcher(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
        body: JSON.stringify(outgoing),
        signal: AbortSignal.timeout(10000),
        redirect: 'error',
      });
      if (!res.ok) {
        if (res.status === 503) return respond({ status: 'credentials_required', provider: 'twilio', upstream_status: 503 }, 503);
        return respond({ status: 'upstream_unverified', provider: 'xtreme-communications', upstream_status: res.status }, 502);
      }
      let data;
      try { data = await res.json(); } catch { return respond({ status: 'upstream_unverified', error: 'Unexpected response shape' }, 502); }
      if (!data || data.provider !== 'twilio') return respond({ status: 'upstream_unverified', error: 'Provider identity mismatch' }, 502);
      if (action === 'status') {
        const verified = onlyBoolean(data.account_verified);
        return respond({
          status: verified ? 'verified_account' : 'upstream_unverified',
          provider: 'twilio',
          account_verified: verified,
          account_status: typeof data.account_status === 'string' ? data.account_status.slice(0, 40) : null,
          live_voice: 'UNKNOWN',
          next_action: verified ? 'Inspect authorized number and voice route' : 'Check scoped Twilio credentials',
        }, verified ? 200 : 502);
      }
      const verified = onlyBoolean(data.ownership_verified);
      const voiceRoute = maskRoute(data.voice_route);
      const excluded = voiceRoute.excluded;
      return respond({
        status: verified ? (excluded ? 'blocked_excluded_route' : 'number_verified') : 'upstream_unverified',
        provider: 'twilio',
        ownership_verified: verified,
        phone_suffix: allowedNumber.slice(-4),
        capabilities: {
          sms: onlyBoolean(data.capabilities?.sms),
          mms: onlyBoolean(data.capabilities?.mms),
          voice: onlyBoolean(data.capabilities?.voice),
        },
        voice_route: voiceRoute,
        live_voice: 'UNKNOWN',
        routing_changed: false,
      }, verified ? 200 : 502);
    } catch {
      return respond({ status: 'upstream_unverified', error: 'Connection failed; see protected logs' }, 502);
    }
  };
}
