import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../src/pages/admin/AgentWorkspace.jsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const nav = readFileSync(new URL("../src/components/admin/AdminLayout.jsx", import.meta.url), "utf8");

test("Agent Workspace is routed within the existing Admin shell", () => {
  assert.match(app, /import AgentWorkspace from ['"]@\/pages\/admin\/AgentWorkspace['"]/);
  assert.match(app, /<Route path="agent-workspace" element=\{<AgentWorkspace \/>\} \/>/);
  assert.match(nav, /to: "\/admin\/agent-workspace"/);
});

test("Live conversations reuse the existing System Operator agent", () => {
  assert.match(page, /const AGENT = "system_operator"/);
  for (const method of ["listConversations", "createConversation", "subscribeToConversation", "addMessage"]) {
    assert.ok(page.includes("base44.agents." + method), "missing existing agent method " + method);
  }
});

test("Task feed is read-only and reports unavailable state rather than inventing metrics", () => {
  assert.match(page, /base44\.entities\.SwarmTask\.list\(/);
  assert.match(page, /setTaskStatus\("unavailable"\)/);
  assert.doesNotMatch(page, /SwarmTask\.(create|update|delete|bulkCreate)/);
});

test("Default agent prompts forbid protected side effects", () => {
  assert.match(page, /PLAN \/ READ-ONLY MODE/);
  for (const term of ["Do not publish", "change secrets", "deploy production", "separate approval"]) {
    assert.ok(page.includes(term), "missing protected-action phrase " + term);
  }
  assert.doesNotMatch(page, /base44\.functions\.invoke\(/);
});

test("Research, Build, Automate, and Audit are actionable draft modes", () => {
  for (const label of ["Research", "Build", "Automate", "Audit"]) {
    assert.ok(page.includes('label: "' + label + '"'));
  }
  assert.match(page, /onSubmit=\{submit\}/);
  assert.match(page, /setMode\(/);
});

test("Phone users can switch existing sessions", () => {
  assert.match(page, /agent-workspace-session/);
  assert.match(page, /onChange=\{\(e\) => setActive/);
});

test("Error and connection states remain visible to operators", () => {
  assert.match(page, /role="alert"/);
  assert.match(page, /Operator unavailable/);
  assert.match(page, /Task feed unavailable/);
});
