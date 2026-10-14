// Preview-only synthetic API canary. Does not store personal data or send messages.
import { createHash } from "node:crypto";

const FIXTURE = "apex-single-noindex-canary-v1";
const EMAIL = "synthetic-test@example.invalid";
const NAME = "Synthetic Test Lead";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  // This endpoint is never a public lead intake or a production messaging route.
  if (process.env.VERCEL_ENV === "production") {
    return res.status(403).json({ ok: false, code: "CANARY_DISABLED_IN_PRODUCTION" });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED" });
  }
  if (!String(req.headers?.["content-type"] || "").toLowerCase().includes("application/json")) {
    return res.status(415).json({ ok: false, code: "JSON_REQUIRED" });
  }
  if (Number(req.headers?.["content-length"] || 0) > 2048) {
    return res.status(413).json({ ok: false, code: "PAYLOAD_TOO_LARGE" });
  }
  let body = req.body || {};
  try {
    if (typeof body === "string") body = JSON.parse(body);
  } catch {
    return res.status(400).json({ ok: false, code: "INVALID_JSON" });
  }
  const valid = body && Object.getPrototypeOf(body) === Object.prototype &&
    Object.keys(body).length === 4 &&
    body.fixture_id === FIXTURE &&
    body.name === NAME &&
    body.email === EMAIL &&
    body.message === "Synthetic canary: form-to-API connectivity test";
  if (!valid) {
    return res.status(422).json({ ok: false, code: "SYNTHETIC_FIXTURE_ONLY" });
  }
  const fingerprint = [FIXTURE, NAME, EMAIL, body.message].join("|");
  const receipt_id = "CANARY-" + createHash("sha256").update(fingerprint).digest("hex").slice(0, 24);
  return res.status(200).json({
    ok: true,
    receipt_id,
    synthetic: true,
    persisted: false,
    outbound_messages: 0,
    stage: process.env.VERCEL_ENV || "isolated-test",
    source_sha: process.env.VERCEL_GIT_COMMIT_SHA || null,
  });
}
