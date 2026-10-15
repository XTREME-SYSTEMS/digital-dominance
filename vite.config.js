import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { transformIndexHtmlForEnvironment } from './scripts/preview-index-html.mjs'
import { execFileSync } from "node:child_process";

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
      // Preview builds without an authenticated Base44 app must not POST to /api/apps/null.
      // Enable SDK analytics only when a real app binding exists.
      analyticsTracker: /^[a-f0-9]{24}$/i.test(process.env.VITE_BASE44_APP_ID || ''),
      visualEditAgent: true
    }),
    react(),
    {
      name: 'digital-dominance-preview-robots',
      apply: 'build',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          return transformIndexHtmlForEnvironment(html, process.env.VERCEL_ENV);
        },
      },
    },
  ]
});
