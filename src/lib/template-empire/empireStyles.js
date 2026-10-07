// Template Empire — Premium visual gallery styles.
// Adapted from the Digital Dominance 2.0 marketing system.
// Scoped under .te-root so it never collides with the admin shell.

export const EMPIRE_CSS = `
.te-root{background:#fff;color:#0f0f17;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.te-root *{box-sizing:border-box}
.te-root a,.te-root button,.te-root label{cursor:pointer}
.te-root a:focus-visible,.te-root button:focus-visible{outline:2px solid #818cf8;outline-offset:3px;border-radius:6px}
.te-root a,.te-root button{transition:background .25s,color .25s,border-color .25s,box-shadow .25s,transform .25s,opacity .25s}
.te-root ::selection{background:#c7d2fe;color:#1e1b4b}

/* ── Hero ── */
.te-hero{min-height:420px;position:relative;padding:60px 40px 40px;background:#07070d;color:#fff;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;border-radius:20px}
.te-hero-bg{position:absolute;inset:0;overflow:hidden;z-index:0}
.te-hero-bg::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 15% 20%,rgba(99,102,241,.28),transparent 60%),radial-gradient(ellipse 70% 50% at 85% 80%,rgba(168,85,247,.18),transparent 55%),radial-gradient(ellipse 60% 40% at 50% 50%,rgba(79,70,229,.12),transparent 70%)}
.te-hero-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,7,13,.2) 0%,rgba(7,7,13,.6) 70%,rgba(7,7,13,.92) 100%)}
.te-hero-grid{position:absolute;inset:0;z-index:0;opacity:.4;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:64px 64px;mask-image:radial-gradient(ellipse 70% 60% at 50% 40%,#000 30%,transparent 75%);-webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 40%,#000 30%,transparent 75%)}
.te-herocopy{position:relative;z-index:2;max-width:680px}
.te-hero-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border:1px solid rgba(255,255,255,.15);border-radius:9999px;background:rgba(255,255,255,.05);backdrop-filter:blur(10px);font-size:12px;font-weight:600;color:#a5b4fc;letter-spacing:.04em;margin-bottom:20px}
.te-hero-badge::before{content:"";width:7px;height:7px;border-radius:50%;background:#34d399;box-shadow:0 0 8px #34d399;animation:te-pulse 2s ease infinite}
.te-hero h1{margin:0;font-size:42px;line-height:1.02;letter-spacing:-.045em;font-weight:800;color:#fff}
.te-hero h1 em{font-style:normal;background:linear-gradient(135deg,#a5b4fc 0%,#818cf8 50%,#c4b5fd 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.te-hero p{max-width:520px;margin:16px 0 0;font-size:16px;line-height:1.55;font-weight:400;color:#a1a1ab}
.te-buttons{display:flex;gap:12px;margin-top:24px;flex-wrap:wrap}
.te-bigbutton{display:inline-flex;align-items:center;gap:8px;background:#4f46e5;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:13px 24px;border:0;border-radius:9999px;box-shadow:0 8px 24px -6px rgba(79,70,229,.6);transition:all .25s;border:0}
.te-bigbutton:hover{background:#6366f1;box-shadow:0 12px 32px -6px rgba(99,102,241,.7);transform:translateY(-2px)}
.te-bigbutton.alt{background:rgba(255,255,255,.06);color:#fff;border:1px solid rgba(255,255,255,.18);box-shadow:none;backdrop-filter:blur(10px)}
.te-bigbutton.alt:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.3);transform:translateY(-2px)}
.te-bigbutton.gold{background:linear-gradient(135deg,#F8E71C 0%,#D4A92E 60%,#B8901E 100%);color:#1a1a1a;box-shadow:0 8px 24px -6px rgba(212,169,46,.6)}
.te-bigbutton.gold:hover{filter:brightness(1.1);box-shadow:0 12px 32px -6px rgba(212,169,46,.7)}

/* Hero floating cards */
.te-hero-cards{position:absolute;right:40px;top:50%;transform:translateY(-50%);z-index:2;display:flex;flex-direction:column;gap:12px;width:260px}
.te-hero-card{padding:16px 18px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.06);backdrop-filter:blur(20px) saturate(150%);box-shadow:0 20px 50px -15px rgba(0,0,0,.5)}
.te-hero-card:nth-child(1){animation:te-float 6s ease-in-out infinite}
.te-hero-card:nth-child(2){animation:te-float 7s .5s ease-in-out infinite}
.te-hero-card:nth-child(3){animation:te-float 8s 1s ease-in-out infinite}
.te-hero-card-top{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.te-hero-card-dot{width:8px;height:8px;border-radius:50%;flex:none}
.te-hero-card-title{font-size:11px;font-weight:600;color:#d4d4d8}
.te-hero-card-val{font-size:22px;font-weight:800;letter-spacing:-.03em;color:#fff;line-height:1}
.te-hero-card-sub{font-size:10px;color:#a1a1ab;margin-top:4px}
.te-hero-card-bar{height:4px;border-radius:2px;background:rgba(255,255,255,.1);margin-top:10px;overflow:hidden}
.te-hero-card-bar span{display:block;height:100%;border-radius:2px;background:linear-gradient(90deg,#6366f1,#a5b4fc)}

@media(max-width:1100px){.te-hero-cards{display:none}.te-herocopy{max-width:none}.te-hero{min-height:340px;padding:40px 24px}.te-hero h1{font-size:32px}}

/* ── Stats bar ── */
.te-stats{display:grid;grid-template-columns:repeat(4,1fr);background:#07070d;border-radius:16px;overflow:hidden;margin-top:16px}
.te-stat{padding:28px 20px;text-align:center;border-right:1px solid rgba(255,255,255,.06);transition:background .25s}
.te-stat:hover{background:rgba(99,102,241,.05)}
.te-stat:last-child{border:0}
.te-stat b{display:block;font-size:32px;line-height:1;font-weight:800;letter-spacing:-.04em;background:linear-gradient(135deg,#fff 0%,#a5b4fc 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.te-stat span{display:block;margin-top:8px;font:500 10px/1.4 ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em;color:#71717a}
@media(max-width:700px){.te-stats{grid-template-columns:repeat(2,1fr)}.te-stat:nth-child(2){border:0}}

/* ── Toolbar ── */
.te-toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:16px 0;border-bottom:1px solid #f4f4f5}
.te-search{position:relative;flex:1;min-width:200px}
.te-search input{width:100%;height:44px;padding:0 16px 0 44px;border:1px solid #e7e8ee;border-radius:12px;font-size:14px;background:#fff;outline:none;transition:border-color .2s}
.te-search input:focus{border-color:#818cf8;box-shadow:0 0 0 3px rgba(129,140,248,.15)}
.te-search svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#a1a1aa}

.te-chip-row{display:flex;gap:8px;flex-wrap:wrap}
.te-chip{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border:1px solid #e7e8ee;border-radius:9999px;font-size:13px;font-weight:600;color:#52525b;background:#fff;transition:all .2s}
.te-chip:hover{border-color:#c7d2fe;background:#eef2ff;color:#4f46e5}
.te-chip.active{background:#4f46e5;color:#fff;border-color:#4f46e5;box-shadow:0 4px 14px -3px rgba(79,70,229,.4)}
.te-chip .te-chip-count{font-size:10px;font-weight:700;opacity:.7;font-family:ui-monospace,monospace}

.te-view-toggle{display:flex;border:1px solid #e7e8ee;border-radius:10px;overflow:hidden}
.te-view-toggle button{padding:10px 14px;background:#fff;border:0;font-size:13px;font-weight:600;color:#71717a;display:flex;align-items:center;gap:6px}
.te-view-toggle button.active{background:#4f46e5;color:#fff}

/* ── Template grid ── */
.te-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;padding:24px 0}
.te-card{position:relative;border:1px solid #e7e8ee;border-radius:16px;overflow:hidden;background:#fff;transition:all .25s;cursor:pointer}
.te-card:hover{border-color:#c7d2fe;box-shadow:0 20px 50px -15px rgba(79,70,229,.2);transform:translateY(-4px)}
.te-card.selected{border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.2),0 20px 50px -15px rgba(79,70,229,.3)}
.te-card-preview{position:relative;height:200px;overflow:hidden;background:#f4f4f5;display:flex;align-items:center;justify-content:center}
.te-card-preview .te-card-frame{transform-origin:center;transition:transform .3s}
.te-card:hover .te-card-preview .te-card-frame{transform:scale(1.05)}
.te-card-badge{position:absolute;top:10px;left:10px;padding:4px 10px;border-radius:9999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;z-index:2}
.te-card-badge.published{background:#dcfce7;color:#16a34a}
.te-card-badge.draft{background:#f4f4f5;color:#71717a}
.te-card-badge.review{background:#fef3c7;color:#d97706}
.te-card-select{position:absolute;top:10px;right:10px;width:28px;height:28px;border-radius:8px;border:2px solid rgba(255,255,255,.6);background:rgba(255,255,255,.2);backdrop-filter:blur(8px);display:grid;place-items:center;z-index:3;transition:all .2s}
.te-card-select.checked{background:#4f46e5;border-color:#4f46e5}
.te-card-select svg{color:#fff;opacity:0;transition:opacity .15s}
.te-card-select.checked svg{opacity:1}
.te-card:hover .te-card-select{border-color:#4f46e5}
.te-card-info{padding:14px 16px}
.te-card-title{font-size:14px;font-weight:700;color:#0f0f17;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.te-card-meta{display:flex;align-items:center;gap:8px;margin-top:6px;font-size:11px;color:#71717a}
.te-card-meta .te-dot{width:3px;height:3px;border-radius:50%;background:#d4d4d8}
.te-card-brand{display:flex;align-items:center;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid #f4f4f5}
.te-card-brand-swatch{width:14px;height:14px;border-radius:4px;border:1px solid rgba(0,0,0,.1)}
.te-card-brand-name{font-size:11px;font-weight:600;color:#52525b}

/* ── Batch launch bar ── */
.te-batch-bar{position:fixed;bottom:0;left:0;right:0;z-index:50;background:#07070d;color:#fff;padding:16px 24px;display:flex;align-items:center;gap:16px;box-shadow:0 -10px 40px rgba(0,0,0,.3);transform:translateY(100%);transition:transform .3s ease}
.te-batch-bar.visible{transform:translateY(0)}
.te-batch-count{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:700}
.te-batch-count b{font-size:24px;color:#a5b4fc}
.te-batch-config{display:flex;align-items:center;gap:10px;flex:1;flex-wrap:wrap}
.te-batch-select{height:38px;padding:0 12px;border:1px solid rgba(255,255,255,.15);border-radius:10px;background:rgba(255,255,255,.05);color:#fff;font-size:13px;outline:none}
.te-batch-select option{background:#07070d;color:#fff}
.te-batch-launch{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border:0;border-radius:9999px;font-size:14px;font-weight:700;background:linear-gradient(135deg,#F8E71C 0%,#D4A92E 60%,#B8901E 100%);color:#1a1a1a;cursor:pointer;box-shadow:0 8px 24px -6px rgba(212,169,46,.5);transition:all .2s}
.te-batch-launch:hover{filter:brightness(1.1);transform:translateY(-2px)}
.te-batch-launch:disabled{opacity:.5;cursor:not-allowed}
.te-batch-close{width:36px;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:transparent;color:#a1a1ab;display:grid;place-items:center;cursor:pointer}
.te-batch-close:hover{color:#fff;border-color:rgba(255,255,255,.3)}

/* ── AI Generator panel ── */
.te-ai-overlay{position:fixed;inset:0;z-index:60;background:rgba(7,7,13,.6);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px}
.te-ai-panel{width:100%;max-width:640px;background:#fff;border-radius:20px;box-shadow:0 30px 80px rgba(0,0,0,.4);overflow:hidden;max-height:90vh;display:flex;flex-direction:column}
.te-ai-header{padding:20px 24px;background:#07070d;color:#fff;display:flex;align-items:center;justify-content:space-between}
.te-ai-header h2{margin:0;font-size:18px;font-weight:800;display:flex;align-items:center;gap:10px}
.te-ai-close{width:32px;height:32px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:transparent;color:#a1a1ab;display:grid;place-items:center;cursor:pointer}
.te-ai-close:hover{color:#fff}
.te-ai-body{padding:24px;overflow-y:auto;flex:1}
.te-ai-field{margin-bottom:16px}
.te-ai-label{display:block;font-size:12px;font-weight:700;color:#52525b;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em}
.te-ai-input{width:100%;height:44px;padding:0 14px;border:1px solid #e7e8ee;border-radius:12px;font-size:14px;outline:none;transition:border-color .2s}
.te-ai-input:focus{border-color:#818cf8;box-shadow:0 0 0 3px rgba(129,140,248,.15)}
.te-ai-textarea{width:100%;min-height:100px;padding:12px 14px;border:1px solid #e7e8ee;border-radius:12px;font-size:14px;outline:none;resize:vertical;font-family:inherit;transition:border-color .2s}
.te-ai-textarea:focus{border-color:#818cf8;box-shadow:0 0 0 3px rgba(129,140,248,.15)}
.te-ai-industry-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;max-height:200px;overflow-y:auto;padding:4px;border:1px solid #e7e8ee;border-radius:12px}
.te-ai-industry{padding:10px 12px;border:1px solid #e7e8ee;border-radius:10px;font-size:12px;font-weight:600;color:#52525b;background:#fff;cursor:pointer;transition:all .15s;text-align:left}
.te-ai-industry:hover{border-color:#c7d2fe;background:#eef2ff}
.te-ai-industry.active{border-color:#4f46e5;background:#4f46e5;color:#fff}
.te-ai-generate{width:100%;padding:14px;border:0;border-radius:12px;font-size:15px;font-weight:700;background:#4f46e5;color:#fff;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px}
.te-ai-generate:hover{background:#6366f1;box-shadow:0 8px 24px -6px rgba(79,70,229,.5)}
.te-ai-generate:disabled{opacity:.6;cursor:not-allowed}
.te-ai-result{margin-top:16px;border:1px solid #e7e8ee;border-radius:12px;overflow:hidden}
.te-ai-result-preview{height:300px;overflow:hidden;background:#f4f4f5;display:flex;align-items:center;justify-content:center}
.te-ai-result-info{padding:14px 16px;border-top:1px solid #e7e8ee}
.te-ai-result-title{font-size:14px;font-weight:700;margin:0}
.te-ai-result-meta{font-size:12px;color:#71717a;margin-top:4px}
.te-ai-actions{display:flex;gap:8px;margin-top:12px}
.te-ai-actions button{flex:1;padding:10px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid #e7e8ee;background:#fff;color:#52525b;transition:all .15s}
.te-ai-actions button:hover{border-color:#c7d2fe;background:#eef2ff;color:#4f46e5}
.te-ai-actions button.primary{background:#4f46e5;color:#fff;border-color:#4f46e5}
.te-ai-actions button.primary:hover{background:#6366f1}

/* ── Animations ── */
@keyframes te-pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes te-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes te-rise{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.te-fade-in{animation:te-rise .4s ease both}

/* ── Empty / loading ── */
.te-empty{text-align:center;padding:60px 20px;color:#71717a}
.te-empty svg{opacity:.3;margin-bottom:12px}
.te-loading{display:flex;align-items:center;justify-content:center;padding:60px}
.te-spinner{width:32px;height:32px;border:3px solid #e7e8ee;border-top-color:#4f46e5;border-radius:50%;animation:te-spin .6s linear infinite}
@keyframes te-spin{to{transform:rotate(360deg)}}
`;