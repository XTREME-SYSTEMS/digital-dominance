import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import { enginePost, engineGet, isEngineConfigured } from '../../shared/engineClient.ts';
import { detectAntiBotSystem, getBypassStrategy } from '../../shared/antiBotBypass.ts';
import { validateUrl } from '../../shared/ssrfProtection.ts';

// ═══════════════════════════════════════════════════════════════════════════
// captchaSolver — Solves captchas using the cloud browser engine.
//
// Fallback chain:
//   1. Self-solve via browser engine (human behavior simulation)
//   2. LLM vision solve (Claude/Gemini analyzes captcha screenshot)
//   3. Third-party solver (2captcha, capsolver) — if API keys configured
//
// All solve attempts are logged to CaptchaSolveLog entity.
// ═══════════════════════════════════════════════════════════════════════════

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── solve: Attempt to solve a captcha on a page ──
    if (action === 'solve') {
      const { url, session_id, captcha_type } = body;
      if (!url) return Response.json({ error: 'url required' }, { status: 400 });

      // SSRF protection
      const urlCheck = validateUrl(url);
      if (!urlCheck.valid) {
        return Response.json({ error: `URL validation failed: ${urlCheck.reason}` }, { status: 400 });
      }

      // Check if engine is configured
      if (!(await isEngineConfigured())) {
        return Response.json({ error: 'Cloud browser engine not configured — set CLOUD_BROWSER_ENGINE_URL + ENGINE_API_KEY' }, { status: 500 });
      }

      const startTime = Date.now();
      let solved = false;
      let token: string | null = null;
      let provider = 'self';
      let fallbackLevel = 0;
      let errorMsg: string | null = null;

      // ── Tier 1: Self-solve via browser engine ──
      try {
        const solveRes = await enginePost('/captcha/solve', {
          url,
          session_id,
          captcha_type: captcha_type || 'unknown',
          strategy: 'human_behavior',
        });

        if (solveRes?.solved) {
          solved = true;
          token = solveRes.token || null;
          fallbackLevel = 1;
          provider = 'self';
        }
      } catch (err) {
        errorMsg = `Self-solve failed: ${err.message}`;
      }

      // ── Tier 2: LLM Vision solve ──
      if (!solved) {
        try {
          // Take screenshot of captcha
          const screenshotRes = await enginePost(`/sessions/${session_id}/screenshot`, {
            selector: 'captcha',
          });

          if (screenshotRes?.screenshot_url) {
            // Use Vercel AI Gateway vision to analyze captcha
            const visionRes = await base44.asServiceRole.functions.invoke('vercelAiGateway', {
              action: 'generateText',
              prompt: 'Analyze this captcha image and provide the solution text. Return ONLY the solution, nothing else.',
              file_urls: [screenshotRes.screenshot_url],
              model: 'anthropic/claude-opus-4.7',
            });

            if (visionRes.data?.text) {
              token = visionRes.data.text.trim();
              solved = true;
              fallbackLevel = 2;
              provider = 'llm_vision';
            }
          }
        } catch (err) {
          errorMsg = `LLM vision solve failed: ${err.message}`;
        }
      }

      // ── Tier 3: Third-party solver ──
      if (!solved) {
        const twoCaptchaKey = secrets.get('TWOCAPTCHA_API_KEY');
        const capSolverKey = secrets.get('CAPSOLVER_API_KEY');

        if (capSolverKey) {
          try {
            const solveRes = await fetch('https://api.capsolver.com/createTask', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientKey: capSolverKey,
                task: {
                  type: captcha_type === 'recaptcha_v2' ? 'ReCaptchaV2Task' : 'HCaptchaTask',
                  websiteURL: url,
                  websiteKey: body.site_key,
                },
              }),
            });
            const solveData = await solveRes.json();
            if (solveData.solution?.token) {
              token = solveData.solution.token;
              solved = true;
              fallbackLevel = 3;
              provider = 'capsolver';
            }
          } catch (err) {
            errorMsg = `CapSolver failed: ${err.message}`;
          }
        } else if (twoCaptchaKey) {
          try {
            const submitRes = await fetch('https://2captcha.com/in.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                key: twoCaptchaKey,
                method: 'userrecaptcha',
                googlekey: body.site_key,
                pageurl: url,
                json: 1,
              }),
            });
            const submitData = await submitRes.json();
            if (submitData.status === 1) {
              // Poll for result
              for (let i = 0; i < 12; i++) {
                await new Promise((r) => setTimeout(r, 5000));
                const resultRes = await fetch(`https://2captcha.com/res.php?key=${twoCaptchaKey}&action=get&id=${submitData.request}&json=1`);
                const resultData = await resultRes.json();
                if (resultData.status === 1) {
                  token = resultData.request;
                  solved = true;
                  fallbackLevel = 3;
                  provider = '2captcha';
                  break;
                }
              }
            }
          } catch (err) {
            errorMsg = `2captcha failed: ${err.message}`;
          }
        }
      }

      const durationMs = Date.now() - startTime;

      // Log to CaptchaSolveLog
      try {
        await base44.asServiceRole.entities.CaptchaSolveLog.create({
          session_id: session_id || null,
          url,
          captcha_type: captcha_type || 'unknown',
          provider,
          detected: true,
          solved,
          token: solved ? (token || '').slice(0, 500) : null,
          error: solved ? null : errorMsg,
          duration_ms: durationMs,
          triggered_by: 'auto',
          fallback_level: fallbackLevel,
          cost_cents: provider === 'capsolver' ? 50 : provider === '2captcha' ? 30 : 0,
        });
      } catch { /* best-effort logging */ }

      return Response.json({
        ok: solved,
        solved,
        token,
        provider,
        fallback_level: fallbackLevel,
        duration_ms: durationMs,
        error: solved ? null : errorMsg || 'All solve tiers failed',
      });
    }

    // ── detect: Detect anti-bot system on a page ──
    if (action === 'detect') {
      const { html, headers } = body;
      const system = detectAntiBotSystem(html || '', headers || {});
      const strategy = system ? getBypassStrategy(system) : null;

      return Response.json({
        ok: true,
        detected_system: system,
        bypass_strategy: strategy,
      });
    }

    // ── status ──
    if (action === 'status') {
      const configured = await isEngineConfigured();
      return Response.json({
        ok: true,
        engine_configured: configured,
        third_party_available: {
          capsolver: !!secrets.get('CAPSOLVER_API_KEY'),
          '2captcha': !!secrets.get('TWOCAPTCHA_API_KEY'),
        },
        tiers: ['self (browser engine)', 'llm_vision (Claude/Gemini)', 'third-party (capsolver/2captcha)'],
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('[captchaSolver] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}