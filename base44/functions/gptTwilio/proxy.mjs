// Digital Dominance -> Xtreme Communications; fixed server-side endpoint.
export function createTwilioProxy({authenticate,getKey,fetcher=fetch}) {
  return async req => {
    try {
      if (req.method !== 'POST') return Response.json({error:'POST required'},{status:405});
      if (!(await authenticate(req))) return Response.json({error:'Admin access required'},{status:403});
      let body;
      try { body = await req.json(); } catch { return Response.json({error:'Invalid JSON'},{status:400}); }
      const action = body.action || 'status';
      if (!['status','inspect_number'].includes(action)) return Response.json({error:'Read-only action required'},{status:400});
      const key = getKey();
      if (!key) return Response.json({status:'credentials_required',error:'XTREME_COMMUNICATION_API_KEY not configured'},{status:503});
      const res = await fetcher('https://xtreme-communications.com/api/functions/gptTwilio',{
        method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},
        body:JSON.stringify({action}),signal:AbortSignal.timeout(15000),redirect:'error'
      });
      const data = await res.json().catch(()=>null);
      if (!data) return Response.json({status:'invalid_upstream_response'},{status:502});
      // Only return fields from the defined read contract.
      const allowed = ['status','provider','provider_status','code','account_verified','account_status','account_type',
        'live_voice','number_suffix','ownership_verified','capabilities','voice_route','voice_method',
        'voice_application_configured','fallback_route','status_callback','routing_changed'];
      const safe = Object.fromEntries(allowed.filter(k=>k in data).map(k=>[k,data[k]]));
      if (!res.ok) safe.error = 'Xtreme Communications connection requires attention';
      return Response.json(safe,{status:res.status});
    } catch { return Response.json({status:'connection_failed'},{status:502}); }
  };
}
