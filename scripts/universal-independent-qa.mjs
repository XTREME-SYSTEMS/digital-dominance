import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { validateSandboxArtifact } from "../base44/shared/universalPhaseQa.js";

const [file, sourceSha, receiptPath] = process.argv.slice(2);
if (!file || !sourceSha) {
  console.error("USAGE: node scripts/universal-independent-qa.mjs <html> <40char-source-sha> [receipt]");
  process.exit(2);
}
const content = readFileSync(file, "utf8");
const receipt = {
  ...validateSandboxArtifact(content, { synthetic: true, source_sha: sourceSha }),
  html_sha256: createHash("sha256").update(content).digest("hex"),
  validated_at: new Date().toISOString()
};
if (receiptPath) writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), "utf8");
console.log(JSON.stringify(receipt));
if (receipt.status !== "PASS") process.exitCode = 1;