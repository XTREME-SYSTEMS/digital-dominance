// Scoped mini-UI kit for live template previews in the Universal Template Studio.
// All classes live under .uts-screen so they never leak into the rest of the app.
// Adapted from the uploaded universal template system's previewStyles.

export const PREVIEW_STYLES = `
.uts-screen{position:relative;display:flex;flex-direction:column;width:100%;height:100%;overflow:hidden;font-family:var(--brand-font-body);color:var(--brand-text);background:var(--brand-background);font-size:calc(11px * var(--uts-font-scale,1));line-height:1.4}
.uts-screen *{box-sizing:border-box}
.uts-row{display:flex;align-items:center}
.uts-col{display:flex;flex-direction:column}
.uts-between{justify-content:space-between}
.uts-center{align-items:center;justify-content:center}
.uts-gap2{gap:8px}.uts-gap3{gap:12px}.uts-gap4{gap:16px}
.uts-flex1{flex:1;min-width:0;min-height:0}
.uts-scroll{overflow:auto}
.uts-muted{color:var(--brand-muted-foreground)}
.uts-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:9999px;background:rgba(212,169,46,.12);color:var(--brand-primary);font-size:calc(9px * var(--uts-font-scale,1));font-weight:700;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}
.uts-chip.soft{background:var(--brand-muted);color:var(--brand-muted-foreground)}
.uts-card{background:var(--brand-surface);border:1px solid var(--brand-border);border-radius:10px;padding:10px}
.uts-bar{height:7px;border-radius:9999px;background:var(--brand-muted);overflow:hidden}
.uts-bar>i{display:block;height:100%;background:linear-gradient(90deg,var(--brand-gold-light),var(--brand-primary));border-radius:9999px}
.uts-avatar{width:22px;height:22px;border-radius:9999px;background:linear-gradient(135deg,var(--brand-gold-light),var(--brand-primary),var(--brand-gold-deep));flex:none;box-shadow:inset 0 1px #fff6}
.uts-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:6px 11px;border-radius:8px;font-size:calc(10px * var(--uts-font-scale,1));font-weight:700;white-space:nowrap;border:0;cursor:pointer}
.uts-btn.pri{background:linear-gradient(135deg,var(--brand-gold-light),var(--brand-primary) 30%,var(--brand-gold-deep));color:#000;box-shadow:inset 0 1px #fff6}
.uts-btn.dark{background:#000;color:#fff}
.uts-btn.out{border:1px solid var(--brand-border);color:var(--brand-text);background:transparent}
.uts-nav{height:38px;display:flex;align-items:center;gap:8px;padding:0 14px;border-bottom:1px solid var(--brand-border);background:var(--brand-surface);flex:none}
.uts-nav .logo{font-weight:900;font-size:calc(12px * var(--uts-font-scale,1));color:var(--brand-text);white-space:nowrap;display:inline-flex;align-items:center;gap:5px;font-family:var(--brand-font-heading)}
.uts-nav .logo b{color:var(--brand-primary)}
.uts-nav .logo img{display:block;height:18px;width:auto;border-radius:4px}
.uts-nav .phone{margin-left:auto;font-weight:700;font-size:calc(10px * var(--uts-font-scale,1));color:var(--brand-primary);white-space:nowrap}
.uts-tab{padding:5px 9px;border-radius:8px;font-weight:600;color:var(--brand-muted-foreground);font-size:calc(10px * var(--uts-font-scale,1));white-space:nowrap}
.uts-tab.on{background:var(--brand-primary);color:#000}
.uts-hero{position:relative;flex:1;display:flex;flex-direction:column;justify-content:center;padding:20px 16px;overflow:hidden;min-height:140px}
.uts-hero .bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.25}
.uts-hero .content{position:relative;z-index:1}
.uts-hero h1{font-family:var(--brand-font-heading);font-size:calc(20px * var(--uts-font-scale,1));font-weight:900;line-height:1.05;margin:0 0 6px;color:var(--brand-text)}
.uts-hero p{font-size:calc(10px * var(--uts-font-scale,1));margin:0 0 10px;color:var(--brand-muted-foreground);max-width:80%}
.uts-hero .badges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.uts-hero .badge{font-size:calc(8px * var(--uts-font-scale,1));font-weight:700;padding:2px 7px;border-radius:9999px;background:rgba(0,0,0,.06);color:var(--brand-text)}
.uts-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:10px 14px;background:var(--brand-muted);flex:none}
.uts-stat{text-align:center}
.uts-stat .v{font-family:var(--brand-font-heading);font-size:calc(16px * var(--uts-font-scale,1));font-weight:900;color:var(--brand-primary)}
.uts-stat .l{font-size:calc(7px * var(--uts-font-scale,1));color:var(--brand-muted-foreground);font-weight:600;text-transform:uppercase;letter-spacing:.04em}
.uts-section{padding:14px;flex:none}
.uts-section h2{font-family:var(--brand-font-heading);font-size:calc(14px * var(--uts-font-scale,1));font-weight:900;margin:0 0 4px;color:var(--brand-text)}
.uts-section .sub{font-size:calc(9px * var(--uts-font-scale,1));color:var(--brand-muted-foreground);margin-bottom:10px}
.uts-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.uts-tile{background:var(--brand-surface);border:1px solid var(--brand-border);border-radius:10px;overflow:hidden}
.uts-tile .img{height:60px;background:linear-gradient(135deg,var(--brand-muted),var(--brand-muted-foreground));background-size:cover;background-position:center}
.uts-tile .body{padding:7px}
.uts-tile .body .n{font-size:calc(9px * var(--uts-font-scale,1));font-weight:800;color:var(--brand-text)}
.uts-tile .body .p{font-size:calc(8px * var(--uts-font-scale,1));color:var(--brand-primary);font-weight:700}
.uts-reviews{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.uts-review{background:var(--brand-surface);border:1px solid var(--brand-border);border-radius:10px;padding:8px}
.uts-review .t{font-size:calc(8px * var(--uts-font-scale,1));color:var(--brand-text);line-height:1.5;margin-bottom:6px}
.uts-review .n{font-size:calc(8px * var(--uts-font-scale,1));font-weight:800;color:var(--brand-text)}
.uts-review .r{font-size:calc(7px * var(--uts-font-scale,1));color:var(--brand-muted-foreground)}
.uts-cta{padding:16px 14px;text-align:center;background:linear-gradient(135deg,var(--brand-gold-light),var(--brand-primary) 40%,var(--brand-gold-deep));flex:none}
.uts-cta h2{font-family:var(--brand-font-heading);font-size:calc(16px * var(--uts-font-scale,1));font-weight:900;margin:0 0 4px;color:#000}
.uts-cta p{font-size:calc(9px * var(--uts-font-scale,1));color:rgba(0,0,0,.7);margin:0 0 10px}
.uts-cta .btn{display:inline-block;padding:7px 16px;border-radius:8px;background:#000;color:#fff;font-size:calc(10px * var(--uts-font-scale,1));font-weight:800}
.uts-footer{padding:10px 14px;background:var(--brand-surface);border-top:1px solid var(--brand-border);flex:none;text-align:center}
.uts-footer .n{font-family:var(--brand-font-heading);font-size:calc(9px * var(--uts-font-scale,1));font-weight:900;color:var(--brand-primary)}
.uts-footer .p{font-size:calc(8px * var(--uts-font-scale,1));color:var(--brand-muted-foreground)}
.uts-colorgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}
.uts-swatch{aspect-ratio:1;border-radius:8px;border:1px solid var(--brand-border);background-size:cover;background-position:center}
.uts-problem{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.uts-probcard{background:var(--brand-surface);border:1px solid var(--brand-border);border-radius:10px;padding:8px}
.uts-probcard .h{font-size:calc(9px * var(--uts-font-scale,1));font-weight:800;color:var(--brand-text);margin-bottom:3px}
.uts-probcard .b{font-size:calc(8px * var(--uts-font-scale,1));color:var(--brand-muted-foreground);line-height:1.4}
`;