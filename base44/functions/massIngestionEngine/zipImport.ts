import { unzipSync } from 'npm:fflate@0.8.2';
import { getSupabaseConfig } from '../../shared/supabaseClient.ts';

const MAX_ZIP = 8 * 1024 * 1024;
const MAX_UNPACKED = 12 * 1024 * 1024;
const ALLOWED = /\.(html?|css|jsx?|tsx?|json|md|txt)$/i;
const decoder = new TextDecoder('utf-8', { fatal: false });

function inspectZip(bytes: Uint8Array) {
  if (bytes.length < 22 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error('Not a valid ZIP archive');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) throw new Error('ZIP directory missing or unsupported archive');
  const count = view.getUint16(end + 10, true);
  if (count > 300) throw new Error('ZIP contains too many entries (maximum 300)');
  let at = view.getUint32(end + 16, true), total = 0;
  const selected = new Set<string>();
  for (let i = 0; i < count; i++) {
    if (at + 46 > bytes.length || view.getUint32(at, true) !== 0x02014b50) throw new Error('Damaged ZIP directory');
    const flags = view.getUint16(at + 8, true);
    const size = view.getUint32(at + 24, true);
    const nameLength = view.getUint16(at + 28, true);
    const extraLength = view.getUint16(at + 30, true);
    const commentLength = view.getUint16(at + 32, true);
    if (at + 46 + nameLength + extraLength + commentLength > bytes.length) throw new Error('Damaged ZIP entry');
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength));
    if (flags & 1) throw new Error('Encrypted ZIP files are not supported');
    if (size === 0xffffffff) throw new Error('ZIP64 files are not supported');
    total += size;
    if (total > MAX_UNPACKED) throw new Error('ZIP expands beyond the 12 MB safety limit');
    if (name.startsWith('/') || name.includes('\\') || name.split('/').includes('..')) throw new Error('Unsafe archive path');
    if (ALLOWED.test(name) && !/(^|\/)(node_modules|\.git|__MACOSX)\//i.test(name) && size <= 512 * 1024) selected.add(name);
    at += 46 + nameLength + extraLength + commentLength;
  }
  if (!selected.size) throw new Error('No supported website source files in ZIP');
  return selected;
}

async function storeZip(base44: any, bytes: Uint8Array, path: string) {
  const { projectUrl: root, serviceRoleKey: key } = await getSupabaseConfig(base44, 'Epoxyquotenearme.com');
  const headers = { Authorization: `Bearer ${key}`, apikey: key };
  const bucket = await fetch(`${root}/storage/v1/bucket/ingested-archives`, { headers });
  const bucketBody = bucket.ok ? null : await bucket.json().catch(() => ({}));
  if (bucketBody?.code === 'NoSuchBucket' || bucket.status === 404) {
    const created = await fetch(`${root}/storage/v1/bucket`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'ingested-archives', name: 'ingested-archives', public: false }) });
    if (!created.ok && created.status !== 409) throw new Error('Could not prepare private archive storage');
  } else if (!bucket.ok) throw new Error('Could not access private archive storage');
  const uploaded = await fetch(`${root}/storage/v1/object/ingested-archives/${path}`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/zip' }, body: bytes });
  if (!uploaded.ok && uploaded.status !== 409) throw new Error('Could not store ZIP archive');
  return `ingested-archives/${path}`;
}

export async function ingestZip(base44: any, user: any, body: any) {
  const filename = body.filename;
  if (typeof filename !== 'string' || !/^[^/\\]{1,150}\.zip$/i.test(filename) || typeof body.file_data !== 'string' || !/^data:(?:application\/(?:zip|x-zip-compressed|octet-stream)|application\/x-zip);base64,/i.test(body.file_data)) {
    throw new Error('Select a valid ZIP file');
  }
  const encoded = body.file_data.split(',')[1];
  if (encoded.length > Math.ceil(MAX_ZIP * 4 / 3) + 8) throw new Error('ZIP must be 8 MB or smaller');
  const binary = atob(encoded);
  if (binary.length > MAX_ZIP) throw new Error('ZIP must be 8 MB or smaller');
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  const selected = inspectZip(bytes);
  const entries = unzipSync(bytes, { filter: entry => selected.has(entry.name) });
  const names = Object.keys(entries);
  const main = names.find(n => /(^|\/)index\.html?$/i.test(n)) || names.find(n => /(^|\/)(home|app|page)\.(jsx?|tsx?)$/i.test(n)) || names.find(n => /\.html?$/i.test(n)) || names[0];
  const content = decoder.decode(entries[main]).slice(0, 39000);
  const isWebsite = names.some(n => /\.html?$/i.test(n)) || names.some(n => /(^|\/)(app|page)\.(jsx?|tsx?)$/i.test(n));
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(n => n.toString(16).padStart(2, '0')).join('');
  const websiteId = `IW-${user.id.slice(0, 12)}-${digest.slice(0, 24)}`;
  const existing = await base44.entities.IngestedWebsite.filter({ website_id: websiteId, owner_id: user.id }, '-created_date', 1);
  if (existing.length) return { ok: true, duplicate: true, website_id: websiteId, template: existing[0].template_type !== 'custom', files: names.length };
  const stored = await storeZip(base44, bytes, `${user.id}/${digest}.zip`);
  const name = filename.replace(/\.zip$/i, '');
  const record = await base44.entities.IngestedWebsite.create({
    owner_id: user.id, website_id: websiteId, source_name: filename, source_url: stored,
    template_type: isWebsite ? 'full_site' : 'custom', stage: 'categorized', raw_content: content,
    cleaned_content: content, parsed_structure: JSON.stringify({ entry_point: main, files: names }).slice(0, 30000),
    organized_data: JSON.stringify({ archive: stored, source_files: names, template: isWebsite }).slice(0, 30000),
    categories: isWebsite ? ['website_template'] : ['source_archive'], tags: ['zip_import'], processed_at: new Date().toISOString(),
  });
  if (isWebsite) {
    try {
      await base44.entities.TemplateLibrary.create({
        name, slug: `zip-${digest.slice(0, 16)}`, category: 'homepage', status: 'draft',
        description: `Imported website template from ${filename}; entry point: ${main}. Full archive retained in ingestion records.`,
        content: content.slice(0, 49000), tags: ['zip-import', 'website'],
      });
    } catch (error) {
      await base44.entities.IngestedWebsite.update(record.id, { error_log: `Archive imported but template library save failed: ${error.message}` });
      throw new Error(`Archive imported, but template library save failed: ${error.message}`);
    }
  }
  return { ok: true, website_id: websiteId, template: isWebsite, files: names.length, entry_point: main };
}