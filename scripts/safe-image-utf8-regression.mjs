import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync("src/components/ui/SafeImage.jsx", "utf8");
const start = source.indexOf("const svgDataUri =");
const end = source.indexOf("/**\n * SafeImage", start);
if (start === -1 || end === -1) throw new Error("SAFE_IMAGE_PLACEHOLDER_BOUNDARY_MISSING");

const placeholderSource = source.slice(start, end);
const result = runInNewContext(
  placeholderSource + "\n({ needs: NEEDS_REVIEW_PLACEHOLDER, gradient: GRADIENT_PLACEHOLDER })",
  {encodeURIComponent}, {timeout:1000}
);
let checks = 0;
function check(truth, label) {
  assert.ok(truth, label);
  checks += 1;
}
const decoded = (uri) => {
  const prefix = "data:image/svg+xml;charset=utf-8,";
  check(uri.startsWith(prefix), "UTF-8 SVG data URI");
  return decodeURIComponent(uri.slice(prefix.length));
};
const first = decoded(result.needs), second = decoded(result.gradient);
check(!/\bbtoa\s*\(/.test(placeholderSource), "Never use Latin-1 btoa for SVG markup");
check(first.includes("NEEDS IMAGE REVIEW"), "Fail-closed warning preserved");
check(first.includes("Category image failed — do not substitute"), "Unicode punctuation preserved");
check(first.startsWith("<svg") && first.includes("</svg>"), "Warning SVG complete");
check(second.includes("<linearGradient"), "Gradient fallback preserved");
check(second.startsWith("<svg") && second.includes("</svg>"), "Gradient SVG complete");
check(!/<script\b/i.test(first + second), "No scripts in SVG");
check(/if\s*\(failClosed\)/.test(source), "Fail-closed conditional preserved");
check(/setCurrentSrc\(NEEDS_REVIEW_PLACEHOLDER\)/.test(source), "No unrelated image substitution on failure");
check(result.needs !== result.gradient, "Distinct fallback graphics");
console.log(JSON.stringify({status:"PASS",checks,source:"src/components/ui/SafeImage.jsx",unicode_runtime_crash_prevented:true,live_site_published:false},null,2));
