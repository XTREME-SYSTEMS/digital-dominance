import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import { createEdenCommsReadiness } from './reader.mjs';

// Admin-only read-only endpoint. Never expose credentials or originate calls.
export default createEdenCommsReadiness({
  authenticate: async req => {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    return user ? { role: user.role } : null;
  },
  getApiKey: () => secrets.get('XTREME_COMMUNICATION_API_KEY'),
  getEdenNumber: () => secrets.get('EDEN_TWILIO_NUMBER_E164'),
});
