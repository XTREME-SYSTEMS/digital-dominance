// ─────────────────────────────────────────────────────────────────────────────
// Shared Supabase access — project ref + service role key retrieval.
// Used by ragPipeline, supabaseUpload, and any other function that needs
// direct Supabase database or storage access.
// ─────────────────────────────────────────────────────────────────────────────

export async function getSupabaseConfig(base44: any, projectName?: string): Promise<{
  projectRef: string;
  projectUrl: string;
  serviceRoleKey: string;
  accessToken: string;
}> {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');

  const projectsRes = await fetch('https://api.supabase.com/v1/projects', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  if (!projectsRes.ok) {
    const err = await projectsRes.text();
    throw new Error(`Failed to list Supabase projects: ${err}`);
  }
  const projects = await projectsRes.json();
  if (!projects || projects.length === 0) {
    throw new Error('No Supabase projects found in your account');
  }
  const project = projectName ? projects.find((item: any) => item.name === projectName) : projects[0];
  if (!project) throw new Error(`Supabase project ${projectName} not found`);
  const projectRef = project.ref;
  const projectUrl = `https://${projectRef}.supabase.co`;

  const keysRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  if (!keysRes.ok) {
    const err = await keysRes.text();
    throw new Error(`Failed to get Supabase API keys: ${err}`);
  }
  const keys = await keysRes.json();
  const serviceRoleKey = keys.find((k: any) => k.name === 'service_role')?.api_key;
  if (!serviceRoleKey) {
    throw new Error('service_role key not found');
  }

  return { projectRef, projectUrl, serviceRoleKey, accessToken };
}

export async function runSupabaseSQL(base44: any, query: string): Promise<any> {
  const { projectRef, accessToken } = await getSupabaseConfig(base44);

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase SQL error: ${err}`);
  }

  return res.json();
}