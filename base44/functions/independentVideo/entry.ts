import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { generateIndependentVideo } from '../../shared/videoGateway.ts';

// Drop-in replacement for Base44 Core.GenerateVideo.
// Uses Vercel AI Gateway + Supabase Storage and therefore does not consume
// Base44 integration credits.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (!body.prompt) return Response.json({ error: 'prompt required' }, { status: 400 });

    const result = await generateIndependentVideo(base44, body);
    return Response.json(result);
  } catch (error: any) {
    console.error('[independentVideo] Error:', error?.message || error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
