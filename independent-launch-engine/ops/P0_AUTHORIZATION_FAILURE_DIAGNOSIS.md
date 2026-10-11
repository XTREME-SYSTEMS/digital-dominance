# P0 OPERATOR BLOCKER | Control-plane authorization path
Mission: DD-WLE-BOOTSTRAP-20261010
Source: verified read-only Supabase X1 AI Hub Staging uvdkzsbjackpjvpoxtyk, public.x1_work_queue.
Counts at discovery: 36 COMPLETED; 16 BLOCKED; 20 DEAD_LETTER.
Root-cause distribution: 16 dead letters CONTROL_PLANE_AUTHORIZATION_FAILED; 3 dead letters fetch failed; 1 dead letter LOCAL_BRIDGE_TASK_TIMEOUT. Seven blocked tasks await an adapter, three blocked capability bootstrap, and six further blocks require distinct security/approval/integration resolution.
Example affected job: WP-DD-1000-CANARY-10-20260929 (digital-dominance.preview-canary.dd-0010), DEAD_LETTER after 3 attempts; CONTROL_PLANE_AUTHORIZATION_FAILED.
Diagnosis: a previously attempted website preview canary failed authorization in the existing control plane. Do NOT bypass auth, rotate keys, loosen policies, or requeue failed tasks blindly. Investigate worker identity, service-token binding references, endpoint audience/scope, tenant membership, signed request validation, token expiry, execution lease and exact provider error evidence without revealing secrets.
Read-only proof sequence:
1. Trace origin of failed work packet and target adapter, request scope, denied action and authenticated principal.
2. Inspect health checks, historical logs, worker identity and secret reference names only.
3. Ask Guardian to independently classify whether issue is expired credential, missing scope, wrong environment, bad signature, inaccessible target or authorization policy mismatch.
4. Draft a minimal staging-only repair with rollback; production credential/RLS/permission changes require explicit scoped approval.
5. Prove one synthetic authorized READ task and separately one PREVIEW-safe build canary, then independent validator receipts.
6. Resume bounded queue work only after no duplicate side effects and one supervisor confirmed.
No production changes were made. Target SAFE next step T00 authorization forensics.
