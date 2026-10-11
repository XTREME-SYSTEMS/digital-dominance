# Supabase four-project integration V1
Development-branch implementation contract for Digital Dominance Website Launch Engine.
- project-map.json registers the actual four Supabase refs and explicit operation allowlists.
- project-router.mjs is server-only policy logic; it does NOT connect to data.
- project-router.test.mjs contains 12 fail-closed tests; run with node --test project-router.test.mjs.
- SECURITY_AND_DATA_CONTRACT.md records roles, security blockers and remaining binding/validation gates.
No production mutation or customer-facing publication performed. Only metadata-read operations are possible for specialist projects until independent RLS/security review. Production X1 remains a candidate authority until worker identity verified.
