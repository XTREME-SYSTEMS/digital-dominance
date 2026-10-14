// APEX: no-side-effect synthetic contract regression for one noindex canary.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import handler from "../api/canary-lead.js";
const html = readFileSync(new URL("../public/canary/index.html", import.meta.url), "utf8");
const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));

function invoke(method, body, headers = { "content-type": "application/json" }) {
  const snapshot = { statusCode: 200, headers: {}, data: null };
  const response = {
    setHeader(key, val) { snapshot.headers[key.toLowerCase()] = val; },
    status(code) { snapshot.statusCode = code; return this; },
    json(data) { snapshot.data = data; return this; },
  };
  return Promise.resolve(handler({ method, body, headers }, response)).then(() => snapshot);
}
const fixture = {
  fixture_id: "apex-single-noindex-canary-v1",
  name: "Synthetic Test Lead",
  email: "synthetic-test@example.invalid",
  message: "Synthetic canary: form-to-API connectivity test",
};
const prevEnv = process.env.VERCEL_ENV;
try {
  process.env.VERCEL_ENV = "preview";
  const ok = await invoke("POST", fixture);
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.data.ok, true);
  assert.equal(ok.data.synthetic, true);
  assert.equal(ok.data.persisted, false);
  assert.equal(ok.data.outbound_messages, 0);
  assert.match(ok.data.receipt_id, /^CANARY-[a-f0-9]{24}$/);
  assert.match(ok.headers["x-robots-tag"], /noindex/);

  const repeat = await invoke("POST", fixture);
  assert.equal(repeat.data.receipt_id, ok.data.receipt_id, "idempotency receipt stable across retries");
  assert.equal((await invoke("GET", fixture)).statusCode, 405);
  assert.equal((await invoke("POST", { ...fixture, email: "human@gmail.com" })).statusCode, 422);
  assert.equal((await invoke("POST", { ...fixture, name: "Real Person" })).statusCode, 422);
  assert.equal((await invoke("POST", { ...fixture, message: "hello" })).statusCode, 422);
  assert.equal((await invoke("POST", { ...fixture, extra: "data" })).statusCode, 422);
  assert.equal((await invoke("POST", fixture, { "content-type": "text/plain" })).statusCode, 415);
  assert.equal((await invoke("POST", fixture, { "content-type": "application/json", "content-length": "9000" })).statusCode, 413);
  assert.equal((await invoke("POST", "{ invalid")).statusCode, 400);

  process.env.VERCEL_ENV = "production";
  assert.equal((await invoke("POST", fixture)).statusCode, 403, "production must reject canary requests");
  process.env.VERCEL_ENV = "preview";

  assert.match(html, /<meta name="robots" content="noindex,nofollow,noarchive"/);
  assert.match(html, /<form id="canary-form"/);
  assert.match(html, /fetch\('\/api\/canary-lead'/);
  assert.match(html, /data\.synthetic !== true/);
  assert.match(html, /No real leads are collected|No real leads are collected, sent, or stored/i);
  assert.ok(config.headers.some(h => h.source === "/canary/(.*)" && h.headers.some(v => v.key === "X-Robots-Tag" && v.value.includes("noindex"))));
  assert.ok(config.headers.some(h => h.source === "/api/canary-lead" && h.headers.some(v => v.key === "X-Robots-Tag" && v.value.includes("noindex"))));
  console.log("PASS synthetic website and API fixture: valid receipt, idempotency, abuse rejection, production fail-closed, noindex headers, zero outbound");
} finally {
  if (prevEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = prevEnv;
}
