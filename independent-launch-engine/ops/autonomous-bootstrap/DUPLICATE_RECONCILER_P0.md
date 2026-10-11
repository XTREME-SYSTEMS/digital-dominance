# P0 OBSERVED | Duplicated estate reconciler in live JARVIS Docker fleet
Date: 2026-10-11. **Read-only investigation. No processes stopped, restarted or reconfigured.**

## Verified container ownership
- Current container `sm-estate-reconciler`, image `strategic-minds-local-agents-orchestrator:latest`, command `node /runtime-scripts/estate-reconciler.mjs`, restart `unless-stopped`. Mounts current `C:\_Strategic_Minds_AI_OS\02_Active_Builds\local-agent-containers\scripts` and separate current `runtime-state`.
- Legacy container `9829a1c2601f_sm-estate-reconciler`, same image and command, restart `unless-stopped`. Mounts `C:\_Strategic_Minds_AI_OS\90_Legacy_Staging\2026-10-03_convergence\02_Active_Builds_SPACE_VARIANT\local-agent-containers\scripts` and separate **legacy runtime-state**.
- Both mount the same `/estate-ro` source `C:\_Strategic_Minds_AI_OS` and use the same control-plane target default `http://control-plane:4311`. Effective environment overrides, service scope and permissions have not yet been fully resolved.
- Both scripts are same 69-line program at inspection. Each own state `/state/estate-reconciler.json`, every >=10 minutes by default, each scans the local estate master registry. On a fingerprint change, each submits `AgentTask.create` with `task_type:'agent_request'`, at most 6 per cycle, and separately records seen fingerprint.
- Existing local worker `server/worker.mjs` handles `agent_request` with an optional configured AI Gateway POST `/chat/completions`; there is **no confirmed shared distributed task idempotency lock in these reconciler implementations**.

## Risk
Two independent `seen` ledgers may produce duplicate tasks for the same asset/fingerprint, wasting tokens and muddling completion evidence. `agent_request` tasks marked completed can be merely a planning document or gateway call, **not a built app**. Automatic paid calls may occur if gateway keys are bound; actual cost is unverified. Do not assert duplicate financial charges without provider billing evidence.

## Narrow remediation plan (NOT YET EXECUTED)
1. Read current/legacy `/state/estate-reconciler.json` and task/receipt IDs with credential-safe filtering, obtain current service owners and existing lease mechanism.
2. Inspect no-op state and whether both instances actually enqueue over multiple 10-minute ticks.
3. Design an idempotency key over `assetId|sourceFingerprint|missionVersion`, atomically reserved by existing canonical X1 queue or one verified local supervisor, not both legacy state files.
4. Identify the canonical current container. Quiesce the legacy instance ONLY with an explicit scoped operational authorization and rollback plan, monitoring that required business jobs continue.
5. Independently verify two no-duplicate cycles and zero unexpected gateway calls; record original instance IDs/config for rollback. Do not create a third supervisor.

This risk is a **release blocker for unmetered 24/7 autonomy**, not a blocker for nonproduction documentation and deterministic local tests.
