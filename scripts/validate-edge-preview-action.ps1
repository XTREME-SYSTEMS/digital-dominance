$ErrorActionPreference = 'Stop'
Set-Location 'C:\_Strategic_Minds_AI_OS\02_Active_Builds\digital-dominance-edge-routing-20260927'
npm run test:edge-routing
if($LASTEXITCODE -ne 0){ exit $LASTEXITCODE }
npm run test:seo-indexing
if($LASTEXITCODE -ne 0){ exit $LASTEXITCODE }
npx eslint middleware.js edge-route-policy.mjs scripts/generate-edge-route-manifest.mjs scripts/edge-routing-regression.mjs scripts/edge-routing-http-smoke.mjs --quiet
if($LASTEXITCODE -ne 0){ exit $LASTEXITCODE }
npm run build
if($LASTEXITCODE -ne 0){ exit $LASTEXITCODE }
npm run test:edge-routing-http
exit $LASTEXITCODE
