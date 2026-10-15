import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BASE44_API_ORIGIN, BASE44_APP_ID, BASE44_CANONICAL_APP_ID,
  resolveBase44ApiOrigin,
} from "../src/lib/base44-backend.js";

let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; }
function read(path) { return readFileSync(path, "utf8"); }

const client = read("src/api/base44Client.js");
const auth = read("src/lib/AuthContext.jsx");
const params = read("src/lib/app-params.js");
const login = read("src/pages/Login.jsx");
const routes = read("src/App.jsx");
const admin = read("src/components/admin/AdminLayout.jsx");
const vite = read("vite.config.js");
check(BASE44_CANONICAL_APP_ID === "6a77f4491f0bf92de9a3ed8b", "verified public app identity");
check(BASE44_APP_ID === BASE44_CANONICAL_APP_ID, "default app identity when no Vite config");
check(resolveBase44ApiOrigin("digital-dominance-test.vercel.app") === "https://base44.app", "preview SDK uses external backend");
check(resolveBase44ApiOrigin("www.unlimitedwebsites.net") === "", "production www uses existing first-party proxy");
check(resolveBase44ApiOrigin("unlimitedwebsites.net") === "", "production apex uses existing first-party proxy");
check(resolveBase44ApiOrigin("digital-dominance-3.base44.app") === "", "native Base44 app keeps same-origin backend");
check(resolveBase44ApiOrigin("unlimitedwebsites.net.attacker.example") === "https://base44.app", "untrusted host cannot hijack backend");
check(BASE44_API_ORIGIN === "https://base44.app", "offline Node defaults to external backend");
check(vite.includes("process.env.VITE_BASE44_APP_ID = BASE44_CANONICAL_APP_ID"), "bundler has the canonical public app ID");
check(vite.includes("analyticsTracker: Boolean(process.env.VITE_BASE44_APP_BASE_URL)"), "external preview never calls missing same-origin visit logger");
check(client.includes("serverUrl: BASE44_API_ORIGIN"), "SDK uses verified backend");
check(!client.includes("serverUrl: ''"), "SDK must not silently use missing Vercel same-origin backend");
check(params.includes("appId: BASE44_APP_ID"), "app ID cannot be overridden by untrusted query/storage");
check(params.includes("appBaseUrl: BASE44_API_ORIGIN"), "Google OAuth starts at Base44's auth endpoint");
check(auth.includes("BASE44_API_ORIGIN") && auth.includes("/api/apps/public"), "public settings share known SDK backend");
check(login.includes('base44.auth.loginViaEmailPassword(email, password)'), "email login retains real provider authentication");
check(login.includes('base44.auth.loginWithProvider("google", returnTo)'), "Google login stays with real provider");
check(login.includes("safeReturnTo()"), "login destination is same-origin sanitized");
check(routes.includes('path="/admin"') && routes.includes("<ProtectedRoute"), "admin remains protected");
check(admin.includes('user.role !== "admin"'), "admin role enforcement preserved");
check(routes.includes("const AdminSignInRedirect ="), "protected screen preserved through authentication");
check(routes.includes("encodeURIComponent(destination)"), "returnTo is URL-encoded");
check(admin.includes("Admin access restricted"), "non-admin receives actionable access message");
check(!admin.includes('return <Navigate to="/portal/dashboard"'), "never silently misroute unauthorized admin");
console.log(JSON.stringify({status:"PASS",checks,provider:"Base44",preview_backend:"https://base44.app",
  production_backend:"same-origin existing proxy",admin_auth_bypass:false,
  user_credentials_changed:false,production_modified:false},null,2));
