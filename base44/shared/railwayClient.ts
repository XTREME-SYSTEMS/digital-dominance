import { secrets } from "base44:runtime";

// Railway GraphQL API client — uses Project-Access-Token header (not Bearer)
const RAILWAY_GRAPHQL_URL = "https://backboard.railway.app/graphql/v2";

let cachedProjectId: string | null = null;
let cachedEnvId: string | null = null;

export async function railwayGraphQL<T = any>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> {
  const token = secrets.get("RAILWAY_TOKEN") || secrets.get("RAILWAY_API_TOKEN");
  if (!token) throw new Error("RAILWAY_TOKEN secret not set");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  let res: Response;
  try {
    res = await fetch(RAILWAY_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Project-Access-Token": token.trim(),
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Railway API timeout (10s) — API may be slow during deployments");
    }
    throw new Error(`Railway API unreachable: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json();

  if (data.errors?.length) {
    const msg = data.errors[0].message;
    if (msg === "Not Authorized") {
      throw new Error("Railway token not authorized — ensure RAILWAY_TOKEN is a project access token with full scope");
    }
    throw new Error(`Railway GraphQL error: ${msg}`);
  }

  return data.data as T;
}

export async function getProjectMeta(): Promise<{ projectId: string; environmentId: string }> {
  if (cachedProjectId && cachedEnvId) {
    return { projectId: cachedProjectId, environmentId: cachedEnvId };
  }

  const data = await railwayGraphQL<{
    projectToken: { projectId: string; environmentId: string; project: { name: string } };
  }>(`query { projectToken { id name projectId environmentId project { id name } } }`);

  cachedProjectId = data.projectToken.projectId;
  cachedEnvId = data.projectToken.environmentId;

  return { projectId: cachedProjectId!, environmentId: cachedEnvId! };
}

export async function listServices() {
  const { projectId } = await getProjectMeta();
  return railwayGraphQL(
    `query GetServices($projectId: String!) {
      project(id: $projectId) {
        services { edges { node { id name serviceInstances { edges { node { id domain } } } } } }
      }
    }`,
    { projectId }
  );
}

export async function triggerRedeploy(serviceId: string) {
  const { environmentId } = await getProjectMeta();
  return railwayGraphQL(
    `mutation TriggerRedeploy($input: ServiceInstanceDeployInput!) {
      serviceInstanceDeploy(input: $input) { id status }
    }`,
    { input: { environmentId, serviceId } }
  );
}