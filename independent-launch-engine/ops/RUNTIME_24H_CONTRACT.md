# Website Factory Persistent Runtime Contract
Mission: DD-WLE-BOOTSTRAP-20261010. Status: DRAFT / PENDING / budget 0.
Supabase staging project: uvdkzsbjackpjvpoxtyk, with existing x1_work_queue, x1_task_leases, x1_execution_ledger and x1_worker_heartbeats.
Observed initial queue: 36 COMPLETED, 16 BLOCKED, 20 DEAD_LETTER. Reconcile error causes before dispatch.
Observed JARVIS local preview heartbeat: worker jarvis-local-power-grid-1 reported ONLINE 2026-10-11 03:46 UTC; heartbeat is not build proof.
Railway sandbox source: project 15f90272-e2f6-4739-8286-91447f545d71, environments sandbox-code and sandbox-orchestrator. Historical successful deployments are insufficient for worker verification; sandbox-code deploy logs showed Caddy web-server startup, not demonstrated website compilation.
Canary Railway environment has 11 pending permission/spend-related staged changes, which must NOT be applied under this mission.
The existing canonical supervisor, queue consumers, lease handling, and safe resumability must be evidenced before activating additional schedules.
Live 24/7 claim requires observed continued processing across an unattended period and recovery from worker restart, duplicate claim and missed heartbeat; a running process, deployed service or queued job alone is insufficient.
First Golden Canary: approved premium Instant Estimate design -> real code commit -> preview URL -> independent browser visual and functional tests -> synthetic persisted form -> intentional failure + bounded repair -> independent PASS receipt -> rollback.
No production, spending, secrets, public posting, customer outreach or DNS operations without separate approval.