import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const expectedSignature = (token, url, params = {}) => {
  const tail = Object.keys(params).sort().map((key) => key + String(params[key])).join('');
  return createHmac('sha1', token).update(url + tail).digest('base64');
};

export const validTwilioSignature = (token, provided, url, params = {}) => {
  if (!token || typeof provided !== 'string' || !provided.trim()) return false;
  const expected = Buffer.from(expectedSignature(token, url, params), 'utf8');
  const received = Buffer.from(provided, 'utf8');
  return received.length === expected.length && timingSafeEqual(received, expected);
};

export const newTicket = () => randomBytes(32).toString('base64url');
export const isCallSid = (value) => typeof value === 'string' && /^CA[0-9a-fA-F]{32}$/.test(value);
export const isStreamSid = (value) => typeof value === 'string' && /^MZ[0-9a-fA-F]{32}$/.test(value);
export const escapeXml = (v) => String(v).replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
