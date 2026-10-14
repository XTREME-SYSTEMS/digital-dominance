// Deterministic one-site preview compiler. No AI, provider calls, customer data, or indexing.
// Generated HTML is static; Vercel can publish it only as an isolated Git branch preview.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {renderSyntheticPreview} from '../factory/render-synthetic-preview.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'factory', 'fixtures', 'synthetic-epoxy.json');
const inputText = readFileSync(file, 'utf8');
const {html,fixture_sha256,html_sha256} = renderSyntheticPreview(inputText);
const s = JSON.parse(inputText);
const out = path.join(root,'public','factory-demo');
const manifest = {
 schema_version:'apex-preview-manifest-v1',site_id:s.site_id,
 fixture_sha256,html_sha256,
 source:'factory/fixtures/synthetic-epoxy.json',
 generated_path:'public/factory-demo/index.html',
 synthetic:true,indexable:false,production_release:false,
 customers_contacted:0,customer_data_persisted:false,
 independent_guardian_validation:'PENDING'
};
if (process.argv.includes('--check')) {
 assert.equal(readFileSync(path.join(out,'index.html'),'utf8'),html,'Compiled site drift');
 assert.deepEqual(JSON.parse(readFileSync(path.join(out,'manifest.json'),'utf8')),manifest,'Manifest drift');
 console.log('PASS DETERMINISTIC FACTORY CHECK '+manifest.html_sha256);
} else {
 mkdirSync(out,{recursive:true});
 writeFileSync(path.join(out,'index.html'),html,'utf8');
 writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
 console.log('PASS COMPILED SINGLE SYNTHETIC SITE '+manifest.html_sha256);
}
