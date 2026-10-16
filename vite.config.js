import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { transformIndexHtmlForEnvironment } from './scripts/preview-index-html.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      // Keep existing production behavior; block unbound analytics on previews.
      analyticsTracker: process.env.VERCEL_ENV === 'production' ||
        /^[a-f0-9]{24}$/i.test(process.env.VITE_BASE44_APP_ID || ''),
      visualEditAgent: true
    }),
    react(),
    {
      name: 'dd-staging-html-robots',
      apply: 'build',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          return transformIndexHtmlForEnvironment(html, process.env.VERCEL_ENV);
        }
      }
    },
  ]
});
