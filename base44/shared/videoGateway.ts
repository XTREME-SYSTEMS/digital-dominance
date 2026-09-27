import { experimental_generateVideo as generateVideo } from 'npm:ai';
import { createGateway } from 'npm:@ai-sdk/gateway';
import { secrets } from 'base44:runtime';

const BUCKET_NAME = 'epoxy-uploads';

async function getSupabaseRuntime(base44: any) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
  if (!accessToken) throw new Error('Supabase connector is not authorized');

  const projectsRes = await fetch('https://api.supabase.com/v1/projects', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!projectsRes.ok) throw new Error(`Failed to list Supabase projects: ${await projectsRes.text()}`);

  const projects = await projectsRes.json();
  const preferredRef = secrets.get('SUPABASE_PROJECT_REF') || secrets.get('SUPABASE_PRODUCTION_PROJECT_REF');
  const project = preferredRef
    ? projects.find((p: any) => p.ref === preferredRef)
    : projects[0];
  if (!project?.ref) throw new Error('No matching Supabase project found');

  const keysRes = await fetch(`https://api.supabase.com/v1/projects/${project.ref}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!keysRes.ok) throw new Error(`Failed to get Supabase API keys: ${await keysRes.text()}`);
  const keys = await keysRes.json();
  const serviceRoleKey = keys.find((k: any) => k.name === 'service_role')?.api_key;
  if (!serviceRoleKey) throw new Error('Supabase service_role key not available');

  return {
    projectRef: project.ref,
    projectUrl: `https://${project.ref}.supabase.co`,
    serviceRoleKey,
  };
}

async function ensureBucket(projectUrl: string, serviceRoleKey: string) {
  const check = await fetch(`${projectUrl}/storage/v1/bucket/${BUCKET_NAME}`, {
    headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey },
  });
  if (check.ok) return;

  const create = await fetch(`${projectUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: BUCKET_NAME, name: BUCKET_NAME, public: true }),
  });
  if (!create.ok && create.status !== 409) {
    throw new Error(`Failed to create Supabase video bucket: ${await create.text()}`);
  }
}

async function uploadVideo(base44: any, bytes: Uint8Array, mediaType = 'video/mp4') {
  const { projectUrl, serviceRoleKey } = await getSupabaseRuntime(base44);
  await ensureBucket(projectUrl, serviceRoleKey);

  const ext = mediaType.includes('webm') ? 'webm' : 'mp4';
  const path = `generated-video/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const upload = await fetch(`${projectUrl}/storage/v1/object/${BUCKET_NAME}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      'Content-Type': mediaType,
      'x-upsert': 'false',
    },
    body: bytes,
  });
  if (!upload.ok) throw new Error(`Supabase video upload failed: ${await upload.text()}`);

  return `${projectUrl}/storage/v1/object/public/${BUCKET_NAME}/${path}`;
}

export async function generateIndependentVideo(base44: any, opts: any) {
  const apiKey = secrets.get('VERCEL_AI_GATEWAY_API_KEY') || secrets.get('AI_GATEWAY_API_KEY');
  if (!apiKey) throw new Error('VERCEL_AI_GATEWAY_API_KEY is not configured');

  const gateway = createGateway({ apiKey });
  const model = opts.model || secrets.get('VIDEO_MODEL') || 'bytedance/seedance-v1.5-pro';
  const duration = Math.max(4, Math.min(Number(opts.duration || 6), 12));

  const request: any = {
    model: gateway.video(model),
    prompt: opts.prompt,
    duration,
  };
  if (opts.aspect_ratio || opts.aspectRatio) request.aspectRatio = opts.aspect_ratio || opts.aspectRatio;
  if (opts.resolution) request.resolution = opts.resolution;
  if (opts.generate_audio !== undefined) request.generateAudio = !!opts.generate_audio;

  const result: any = await generateVideo(request);
  const video = result?.videos?.[0];
  if (!video) throw new Error('AI Gateway returned no generated video');

  const bytes: Uint8Array | undefined = video.uint8Array;
  if (!bytes?.length) throw new Error('AI Gateway video result contained no bytes');

  const url = await uploadVideo(base44, bytes, video.mediaType || 'video/mp4');
  return {
    ok: true,
    independent: true,
    provider: 'vercel-ai-gateway',
    model,
    duration,
    url,
    media_type: video.mediaType || 'video/mp4',
    size: bytes.length,
  };
}
