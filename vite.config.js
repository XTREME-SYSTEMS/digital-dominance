import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { execFileSync } from "node:child_process";
import { BASE44_CANONICAL_APP_ID } from "./src/lib/base44-backend.js";

// The Vite Base44 plugin needs this PUBLIC identity during bundling.
// Vercel's existing project lacks VITE_BASE44_APP_ID; do not inject a secret,
// impersonate a user, or enable a new backend proxy.
if (!process.env.VITE_BASE44_APP_ID) {
  process.env.VITE_BASE44_APP_ID = BASE44_CANONICAL_APP_ID;
}


function sourceIdentity() {
  const fromPlatform = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA;
  if (typeof fromPlatform === "string" && /^[a-f0-9]{40}$/i.test(fromPlatform)) return fromPlatform;
  try {
    const dirty = execFileSync("git", ["status", "--porcelain"], { encoding:"utf8", stdio:["ignore","pipe","ignore"] });
    if (dirty.trim()) return "UNKNOWN";
    const sha = execFileSync("git", ["rev-parse", "HEAD"], { encoding:"utf8", stdio:["ignore","pipe","ignore"] }).trim();
    return /^[a-f0-9]{40}$/i.test(sha) ? sha : "UNKNOWN";
  } catch (_) {
    return "UNKNOWN";
  }
}


// https://vite.dev/config/
export default defineConfig({
  define: { __DD_BUILD_SOURCE_SHA__: JSON.stringify(sourceIdentity()) },
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ]
});
