import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';

// GitHub Code Studio sync: OFF by default, branch-only and fail-closed.
// This function is NOT a background scheduler and NEVER writes main.
// The privileged server configuration must explicitly permit a single feature
// branch. A client-supplied branch or approval string alone is NOT authority.

const CANONICAL_REPO = 'XTREME-SYSTEMS/digital-dominance';
const MAX_FILES_PER_RUN = 40;
const MAX_CONTENT_BYTES = 200_000;
const VALID_FILE_STEM = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;
const SECRET_PATTERN = /-----BEGIN [A-Z ]*PRIVATE KEY-----|sk-(?:proj|live)-[A-Za-z0-9_-]{8}|gh[pousr]_[A-Za-z0-9]{20}|sb_secret_[A-Za-z0-9_-]{8}|AIza[0-9A-Za-z_-]{30}/;

type Candidate = { path: string; content: string };
type Existing = { sha: string | null; contentBase64: string | null };

function isAllowedBranch(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (value.length > 120 || value.includes('..') || value.includes('//')) return false;
  return /^(feature|sandbox)\/[a-z0-9][a-z0-9._/-]{0,99}$/i.test(value) && !value.endsWith('/');
}

function fileStem(value: unknown): string {
  if (typeof value !== 'string' || !VALID_FILE_STEM.test(value)) {
    throw new Error('Invalid page slug or code block name; sync aborted');
  }
  return value;
}

function base64Utf8(content: string): string {
  const bytes = new TextEncoder().encode(content);
  if (bytes.length > MAX_CONTENT_BYTES) throw new Error('Sync candidate exceeds per-file safety limit');
  const chunks: string[] = [];
  for (let index = 0; index < bytes.length; index += 8192) {
    chunks.push(String.fromCharCode(...bytes.subarray(index, index + 8192)));
  }
  return btoa(chunks.join(''));
}

function cleanBase64(value: string): string {
  return value.replace(/\s+/g, '');
}

function createCandidates(pages: any[], blocks: any[]): Candidate[] {
  const files: Candidate[] = [];
  for (const page of pages) {
    const path = 'pages/' + fileStem(page?.slug) + '.json';
    files.push({ path, content: JSON.stringify(page, null, 2) });
  }
  for (const block of blocks) {
    const extension = { css: 'css', js: 'js', html: 'html', json: 'json' }[block?.type as 'css' | 'js' | 'html' | 'json'];
    if (!extension) throw new Error('Unsupported code block type; sync aborted');
    const path = 'code-blocks/' + fileStem(block?.name) + '.' + extension;
    files.push({ path, content: String(block?.content || '') });
  }
  if (files.length > MAX_FILES_PER_RUN - 1) {
    throw new Error('Too many files for one bounded sync; split and review batches');
  }
  const paths = files.map(file => file.path);
  if (new Set(paths).size !== paths.length) throw new Error('Duplicate output path; sync aborted');
  for (const file of files) {
    if (SECRET_PATTERN.test(file.content)) throw new Error('Possible embedded credential; sync blocked');
    base64Utf8(file.content);
  }
  const manifest = {
    schema: 'strategic-minds.code-studio-branch-sync/2',
    repository: CANONICAL_REPO,
    pages: pages.length,
    code_blocks: blocks.length,
    paths: paths.sort(),
    release_state: 'DRAFT_ONLY',
  };
  files.push({ path: 'code-studio-manifest.json', content: JSON.stringify(manifest, null, 2) + '\n' });
  return files;
}

function githubHeaders(token: string): Record<string, string> {
  return {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'strategic-minds-branch-sync',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function verifyUnprotectedExistingBranch(token: string, branch: string): Promise<void> {
  const url = 'https://api.github.com/repos/' + CANONICAL_REPO + '/branches/' + encodeURIComponent(branch);
  const response = await fetch(url, { headers: githubHeaders(token), signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Target branch does not exist or cannot be verified');
  const info = await response.json();
  if (info.name !== branch || info.protected !== false) {
    throw new Error('Target branch identity or protection check failed');
  }
}

async function getExisting(token: string, path: string, branch: string): Promise<Existing> {
  const url = 'https://api.github.com/repos/' + CANONICAL_REPO + '/contents/' + path + '?ref=' + encodeURIComponent(branch);
  const response = await fetch(url, { headers: githubHeaders(token), signal: AbortSignal.timeout(10000) });
  if (response.status === 404) return { sha: null, contentBase64: null };
  if (!response.ok) throw new Error('GitHub existing-file read failed');
  const data = await response.json();
  if (typeof data.sha !== 'string' || data.encoding !== 'base64' || typeof data.content !== 'string') {
    throw new Error('Unexpected GitHub file content; refusing to overwrite');
  }
  return { sha: data.sha, contentBase64: cleanBase64(data.content) };
}

async function upsertCandidate(token: string, file: Candidate, branch: string) {
  const encoded = base64Utf8(file.content);
  const existing = await getExisting(token, file.path, branch);
  if (existing.contentBase64 === encoded) {
    return { path: file.path, state: 'unchanged' };
  }
  const requestBody: Record<string, string> = {
    message: 'sync(draft): ' + file.path,
    content: encoded,
    branch,
  };
  if (existing.sha) requestBody.sha = existing.sha;
  const response = await fetch(
    'https://api.github.com/repos/' + CANONICAL_REPO + '/contents/' + file.path,
    {
      method: 'PUT',
      headers: { ...githubHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(10000),
    }
  );
  if (!response.ok) throw new Error('GitHub branch file write rejected: ' + file.path);
  const writeReceipt = await response.json();
  const readback = await getExisting(token, file.path, branch);
  if (readback.contentBase64 !== encoded || readback.sha !== writeReceipt.content?.sha) {
    throw new Error('GitHub branch readback mismatch: ' + file.path);
  }
  return { path: file.path, state: 'written', commit_sha: writeReceipt.commit?.sha || null };
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ ok: false, error: 'Admin access required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'preview';
    if (action !== 'preview' && action !== 'apply') {
      return Response.json({ ok: false, error: 'Unsupported action' }, { status: 400 });
    }

    const pages = await base44.asServiceRole.entities.DynamicPage.list('-updated_date', 100);
    const blocks = await base44.asServiceRole.entities.CodeBlock.list('-updated_date', 100);
    const files = createCandidates(pages, blocks);
    if (action === 'preview') {
      return Response.json({
        ok: true,
        action: 'preview',
        write_enabled: false,
        files_planned: files.length,
        paths: files.map(file => file.path),
        note: 'Read-only plan. Nothing has been pushed, approved or deployed.',
      });
    }

    const requestedBranch = body.target_branch;
    const configuredBranch = secrets.get('GITHUB_SYNC_TARGET_BRANCH');
    const writeEnabled = secrets.get('GITHUB_SYNC_WRITE_ENABLED') === 'true';
    const configuredRepo = secrets.get('GITHUB_REPO');
    const token = secrets.get('GITHUB_TOKEN');
    if (!writeEnabled || !isAllowedBranch(requestedBranch) || !isAllowedBranch(configuredBranch) ||
        requestedBranch !== configuredBranch || configuredRepo !== CANONICAL_REPO || !token ||
        body.ack_branch_only !== true) {
      return Response.json({
        ok: false,
        status: 'BLOCKED',
        error: 'Nonproduction branch-sync authorization/configuration incomplete',
      }, { status: 403 });
    }

    await verifyUnprotectedExistingBranch(token, configuredBranch);
    const results: Record<string, any>[] = [];
    for (const file of files) {
      try {
        const result = await upsertCandidate(token, file, configuredBranch);
        results.push(result);
      } catch {
        return Response.json({
          ok: false,
          status: 'PARTIAL_OR_BLOCKED',
          branch: configuredBranch,
          applied: results,
          failed_path: file.path,
          error: 'Sync stopped; inspect remote branch readback before any retry',
          release_approved: false,
        }, { status: 502 });
      }
    }

    return Response.json({
      ok: true,
      status: 'BRANCH_ONLY_COMPLETE',
      branch: configuredBranch,
      repository: CANONICAL_REPO,
      results,
      release_approved: false,
      note: 'Read back branch files only. No merge, deployment, scheduler or production approval.',
    });
  } catch {
    return Response.json({ ok: false, status: 'BLOCKED', error: 'Branch sync safety check failed' }, { status: 500 });
  }
}
