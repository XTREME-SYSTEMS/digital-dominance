import {createClientFromRequest} from 'npm:@base44/sdk@0.8.48';
import {secrets} from 'base44:runtime';
import {createTwilioProxy} from './proxy.mjs';
export default createTwilioProxy({
  authenticate:async req => {
    const user = await createClientFromRequest(req).auth.me().catch(()=>null);
    return user?.role === 'admin';
  },
  getKey:()=>secrets.get('XTREME_COMMUNICATION_API_KEY')
});
