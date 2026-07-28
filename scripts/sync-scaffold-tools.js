// Upgrade only Skill-managed workflow tools in an existing Innovation-Products_ppt project.
// Project pages, selected theme/config, project-local extensions, content, state and approvals are preserved.
// Explicitly listed shared theme contracts and the core component library are Skill-managed and may be upgraded.
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const SKILL = path.join(__dirname, "..");
const TEMPLATE = path.join(SKILL, "templates", "innovation-products-ppt-scaffold");
const target = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const check = process.argv.includes("--check");
const managed = [
  "tools/artifact-map.js", "tools/build-qa-profile.js", "tools/context-pack.js", "tools/context-budget-gate.js", "tools/deck.js",
  "tools/environment-doctor.js", "tools/approval-receipt.js", "tools/agent-run-receipt.js", "tools/verify-source-evidence.js",
  "tools/verify-theme-fidelity.js",
  "tools/final-gate.js", "tools/final-artifact-gate.js", "tools/gate-adversarial-suite.js",
  "tools/geometry-policy.js", "tools/render-geometry-audit.js", "tools/user-feedback-gate.js", "tools/visual-gate-regression.js",
  "tests/visual-gate/arrow-text-collision.json", "tests/visual-gate/connector-imbalance.json", "tests/visual-gate/reserved-zone-collision.json",
  "tests/visual-gate/clean-layout.json", "tests/visual-gate/intentional-overlap.json",
  "tests/theme-fidelity/global-generic-dashboard.json", "tests/theme-fidelity/global-engineering-evidence.json",
  "tools/regression-tests.js", "tools/hard-gate-contract.js", "tools/hard-gate-blackbox.js", "tools/render-diversity.js", "tools/render-risk.js", "tools/tool-freeze.js",
  "tools/change-impact.js", "tools/migrate-evidence-v2.js", "tools/migrate-agent-collaboration-v3.js", "tools/page-digests.js", "tools/phase-handoff.js",
  "tools/plan-agent-events.js", "tools/qa-batch.js", "tools/qa-evidence-index.js", "tools/requirements-trace.js", "tools/resume-job.js", "tools/rollout-usage.js", "tools/task-portfolio.js", "tools/token-ledger.js",
  "tools/qa-rules.zh.json",
  "tools/revision-mode.js",
  "tools/lint-scope-hygiene.js", "tools/lint-layout-blueprint.js", "tools/lint-blueprint-preview.js", "tools/render-contact-sheet.js", "tools/render-quality-gate.js",
  "tools/component-registry.json", "tools/component-index.min.json", "tools/component-metadata-overrides.json",
  "tools/build-component-index.js", "tools/enrich-component-registry.js", "tools/lint-component-library.js", "tools/lint-component-metadata-overrides.js", "tools/component-metadata-audit.js", "tools/verify-component-themes.js",
  "tools/component-contract.js", "tools/run-phase.js", "tools/render-layout-blueprint.js", "tools/render-component-library-preview.js", "tools/render-component-shortlist-preview.js",
  "tools/select-visual-route.js", "tools/visual-selection-diversity.js", "tools/verify-agent-collaboration.js",
  "tools/verify-checkpoints.js", "tools/verify-design-gates.js", "tools/verify-page-preflight.js", "tools/verify-qa-result.js",
  "tools/verify-quality-baseline.js", "tools/verify-state-memory.js", "tools/verify-terminology.js",
  "tools/workflow-gate.js", "theme/content-fidelity.js", "components/ppt-components.js",
  "components/extensions/evidence-legend.js", "components/extensions/stage-gate-rail.js", "components/extensions/status-legend.js"
];
function same(a, b) { return fs.existsSync(a) && fs.existsSync(b) && fs.readFileSync(a).equals(fs.readFileSync(b)); }
if (!fs.existsSync(path.join(target, "deck.config.js"))) {
  console.error(`Not a Innovation-Products_ppt scaffold: ${target}`); process.exit(1);
}
const changed = managed.filter(rel => !same(path.join(TEMPLATE, rel), path.join(target, rel)));
const expectedVersion = JSON.parse(fs.readFileSync(path.join(TEMPLATE, ".leander-scaffold-version.json"), "utf8"));
const targetVersion = (() => { try { return JSON.parse(fs.readFileSync(path.join(target, ".leander-scaffold-version.json"), "utf8")); } catch { return {}; } })();
const packageFile = path.join(target, "package.json");
const packageData = JSON.parse(fs.readFileSync(packageFile, "utf8"));
packageData.dependencies = packageData.dependencies || {};
const dependencyChanged = packageData.dependencies.pngjs !== "7.0.0";
const packageVersionChanged = packageData.version !== expectedVersion.version;
const qualityTargetFile = path.join(target, "quality-target.json");
const qualityTargetMissing = !fs.existsSync(qualityTargetFile);
const requiredAnchorCoverage = ["tone-or-cover", "modal-content", "complex-structure", "screenshot-evidence", "data-dense", "asset-gap-high-capacity"];
const qualityTargetData = qualityTargetMissing ? {} : (() => { try { return JSON.parse(fs.readFileSync(qualityTargetFile, "utf8")); } catch { return {}; } })();
const qualityTargetNeedsThemeFidelity = requiredAnchorCoverage.some(name => !(qualityTargetData.anchorCoverage || []).includes(name));
const sourceEvidenceFile = path.join(target, "source-evidence-index.json");
const sourceEvidenceMissing = !fs.existsSync(sourceEvidenceFile);
const sourceEvidenceVersion = (() => { try { return JSON.parse(fs.readFileSync(sourceEvidenceFile, "utf8")).version || "missing"; } catch { return "missing"; } })();
const sourceEvidenceNeedsMigration = sourceEvidenceVersion !== "source-evidence-index.v2";
const collaborationFile = path.join(target, "agent-collaboration.json");
const collaborationNeedsMigration = (() => { try { const value = JSON.parse(fs.readFileSync(collaborationFile, "utf8")); return value.version !== "agent-collaboration.v3" || value.policy !== "event-driven.v3" || Object.values(value.roles || {}).some(role => !Array.isArray(role.runs)); } catch { return true; } })();
if (check) {
  if (changed.length || dependencyChanged || packageVersionChanged || qualityTargetMissing || qualityTargetNeedsThemeFidelity || sourceEvidenceNeedsMigration || collaborationNeedsMigration || targetVersion.version !== expectedVersion.version) {
    console.error(`Scaffold stale: tools=${changed.length}, dependencyChanged=${dependencyChanged}, packageVersionChanged=${packageVersionChanged}, qualityTargetMissing=${qualityTargetMissing}, themeFidelityAnchorMigration=${qualityTargetNeedsThemeFidelity}, sourceEvidenceVersion=${sourceEvidenceVersion}, collaborationNeedsMigration=${collaborationNeedsMigration}, version=${targetVersion.version || "missing"}`);
    changed.forEach(item => console.error(`- ${item}`)); process.exit(1);
  }
  console.log(`Scaffold tools are current: ${expectedVersion.version}`); process.exit(0);
}
changed.forEach(rel => {
  const src = path.join(TEMPLATE, rel), dst = path.join(target, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
});
if (qualityTargetMissing) {
  fs.copyFileSync(path.join(TEMPLATE, "quality-target.json"), qualityTargetFile);
} else if (qualityTargetNeedsThemeFidelity) {
  qualityTargetData.anchorCoverage = [...new Set([...(qualityTargetData.anchorCoverage || []), ...requiredAnchorCoverage])];
  fs.writeFileSync(qualityTargetFile, JSON.stringify(qualityTargetData, null, 2) + "\n", "utf8");
}
if (sourceEvidenceMissing) fs.copyFileSync(path.join(TEMPLATE, "source-evidence-index.json"), path.join(target, "source-evidence-index.json"));
packageData.version = expectedVersion.version;
fs.writeFileSync(packageFile, JSON.stringify(packageData, null, 2) + "\n", "utf8");
const lockFile = path.join(target, "package-lock.json");
if (fs.existsSync(lockFile)) {
  const lockData = JSON.parse(fs.readFileSync(lockFile, "utf8"));
  lockData.version = expectedVersion.version;
  lockData.packages = lockData.packages || {};
  lockData.packages[""] = { ...(lockData.packages[""] || {}), version: expectedVersion.version };
  fs.writeFileSync(lockFile, JSON.stringify(lockData, null, 2) + "\n", "utf8");
}
if (dependencyChanged) {
  packageData.dependencies.pngjs = "7.0.0";
  fs.writeFileSync(packageFile, JSON.stringify(packageData, null, 2) + "\n", "utf8");
  const npmArgs = ["install", "--ignore-scripts", "--no-audit", "--no-fund"];
  const installed = process.platform === "win32"
    ? cp.spawnSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm", ...npmArgs], { cwd: target, stdio: "inherit" })
    : cp.spawnSync("npm", npmArgs, { cwd: target, stdio: "inherit" });
  if (installed.error) console.error(`Unable to install managed dependencies: ${installed.error.message}`);
  if (installed.status !== 0) { console.error("Failed to install the managed pngjs render-audit dependency."); process.exit(installed.status || 1); }
}
if (collaborationNeedsMigration) {
  const migrated = cp.spawnSync(process.execPath, [path.join(target, "tools", "migrate-agent-collaboration-v3.js")], { cwd: target, encoding: "utf8" });
  if (migrated.stdout) process.stdout.write(migrated.stdout);
  if (migrated.status !== 0) { console.error((migrated.stderr || "Failed to migrate agent-collaboration.json to V3.").trim()); process.exit(migrated.status || 1); }
}
const version = expectedVersion;
version.syncedAt = new Date().toISOString();
version.managedFiles = managed;
fs.writeFileSync(path.join(target, ".leander-scaffold-version.json"), JSON.stringify(version, null, 2) + "\n", "utf8");
const stateDirs = [path.join(target, "state", "approval-receipts"), path.join(target, "state", "agent-run-receipts")];
stateDirs.forEach(dir => fs.mkdirSync(dir, { recursive: true }));
const doctor = cp.spawnSync(process.execPath, [path.join(target, "tools", "environment-doctor.js"), "--json"], { cwd: target, encoding: "utf8" });
if (doctor.status !== 0) { console.error((doctor.stderr || doctor.stdout || "Environment doctor failed before tool freeze.").trim()); process.exit(doctor.status || 1); }
const frozen = cp.spawnSync(process.execPath, [path.join(target, "tools", "tool-freeze.js"), "capture", "scaffold-sync"], { cwd: target, encoding: "utf8" });
if (frozen.status !== 0) { console.error((frozen.stderr || frozen.stdout || "Failed to capture tool freeze after sync.").trim()); process.exit(frozen.status || 1); }
console.log(`Synced Innovation-Products_ppt scaffold ${version.version}: ${changed.length} managed files updated; dependencyChanged=${dependencyChanged}; packageVersionChanged=${packageVersionChanged}; qualityTargetCreated=${qualityTargetMissing}; themeFidelityAnchorsMigrated=${qualityTargetNeedsThemeFidelity}; collaborationMigrated=${collaborationNeedsMigration}; project content preserved.`);
if (sourceEvidenceNeedsMigration && !sourceEvidenceMissing) {
  console.log(`SOURCE EVIDENCE MIGRATION REQUIRED: preserved ${sourceEvidenceVersion}; convert it to source-evidence-index.v2 with real source/snapshot hashes before final verification.`);
}
