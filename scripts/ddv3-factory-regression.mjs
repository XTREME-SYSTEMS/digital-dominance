import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const launcher = read("src/components/site-builder/PipelineLauncher.jsx");
const factory = read("src/pages/admin/WebsiteFactory.jsx");
const builder = read("src/pages/admin/UniversalSiteBuilder.jsx");
const compiler = read("base44/functions/compileWebsiteBuildPacket/entry.ts");
const packetSchema = read("base44/entities/WebsiteBuildPacket.jsonc");
const legacyEngine = read("base44/functions/universalDominanceEngine/entry.ts");

const forbiddenLauncherMarkers = [
  'functions.invoke("dominanceEngine"',
  'functions.invoke("socialStudio"',
  'functions.invoke("seoGenerator"',
  'functions.invoke("dailyLeadEngine"',
  'functions.invoke("skipTrace"',
  "auto_purchase_domain",
  "auto_deploy_vercel",
  "500+ SEO",
];

check(
  "Builder launch UI has no protected execution calls",
  forbiddenLauncherMarkers.every((marker) => !launcher.includes(marker)),
  "Step 5 must compile a preview packet only."
);

check(
  "Builder launch UI uses governed compiler",
  launcher.includes('functions.invoke("compileWebsiteBuildPacket"') &&
    launcher.includes("COMPILE PREVIEW BUILD") &&
    launcher.includes("Preview-only"),
  "The user-facing launch control should produce a branch-safe BuildPacket."
);

check(
  "Universal builder labels Step 5 as preview build",
  builder.includes('label: "Preview Build"') &&
    builder.includes("Governed Website Preview Factory"),
  "The UI must not imply production launch from the onboarding flow."
);

check(
  "Legacy Website Factory simulation removed",
  !factory.includes("Simulate deployment") &&
    !factory.includes("onClick={() => deploy(t)}") &&
    factory.includes('functions.invoke("compileWebsiteBuildPacket"') &&
    factory.includes("Create Preview"),
  "Website Factory must not fake a live deploy or mark templates live."
);

check(
  "BuildPacket is preview-only by default",
  packetSchema.includes('"default": "preview_only"') &&
    packetSchema.includes('"release_authorized"') &&
    packetSchema.includes('"production_deploy_authorized"'),
  "Production authority must be explicit and false by default."
);

const requiredFalseLocks = [
  "domain_purchase_authorized: false",
  "production_deploy_authorized: false",
  "public_publish_authorized: false",
  "social_publish_authorized: false",
  "customer_message_authorized: false",
  "indexable_programmatic_pages_authorized: false",
];
check(
  "Compiler hard-locks every protected release surface",
  requiredFalseLocks.every((marker) => compiler.includes(marker)),
  "The first click must not have a route to production or external messaging."
);

check(
  "Compiler disables programmatic location expansion",
  compiler.includes("programmatic_location_pages") &&
    compiler.includes("enabled: false") &&
    compiler.includes("differentiated local value"),
  "Local pages require separate evidence and validation."
);

const requiredForbiddenActions = [
  '"merge_default_branch"',
  '"production_deploy"',
  '"purchase_domain"',
  '"change_dns"',
  '"publish_social"',
  '"send_customer_message"',
  '"create_or_replace_secret"',
  '"index_mass_programmatic_pages"',
  '"destructive_action"',
  '"spend_money"',
];
check(
  "WorkPacket forbids protected actions",
  requiredForbiddenActions.every((marker) => compiler.includes(marker)),
  "Worker permissions must fail closed."
);

check(
  "WorkPacket only allows branch/preview validation actions",
  compiler.includes('"create_feature_branch"') &&
    compiler.includes('"create_preview_deployment"') &&
    compiler.includes('"run_validation"') &&
    compiler.includes('risk_class: "BRANCH_WRITE"'),
  "Preview worker scope must stay branch-safe."
);

const retired = [
  '"provision_site"',
  '"schedule_social"',
  '"queue_batch"',
  '"run_autonomous_cycle"',
];
check(
  "Legacy direct release actions are retired",
  retired.every((marker) => legacyEngine.includes(marker)) &&
    legacyEngine.includes("DDV3_GOVERNED_FACTORY_REQUIRED") &&
    legacyEngine.includes("status: 403"),
  "Old agents cannot bypass the new BuildPacket flow."
);

check(
  "Compiler requires admin authorization",
  compiler.includes('user.role !== "admin"') &&
    compiler.includes("Admin access required"),
  "Creating a build packet is an authenticated admin action."
);

const failed = checks.filter((c) => !c.pass);
for (const c of checks) {
  console.log(`${c.pass ? "PASS" : "FAIL"} | ${c.name} | ${c.detail}`);
}
console.log(`\nDDV3 factory regression: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exit(1);
