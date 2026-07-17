// Upgrade only Skill-managed workflow tools in an existing Leander project.
// Project pages, theme, components, config, content, state and approvals are preserved.
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const SKILL = path.join(__dirname, "..");
const TEMPLATE = path.join(SKILL, "templates", "leander-ppt-scaffold");
const target = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const check = process.argv.includes("--check");
const managed = [
  "tools/artifact-map.js", "tools/build-qa-profile.js", "tools/context-pack.js", "tools/context-budget-gate.js", "tools/deck.js",
  "tools/environment-doctor.js",
  "tools/regression-tests.js", "tools/hard-gate-contract.js", "tools/hard-gate-blackbox.js", "tools/render-diversity.js", "tools/render-risk.js", "tools/tool-freeze.js",
  "tools/change-impact.js", "tools/migrate-evidence-v2.js", "tools/migrate-agent-collaboration-v3.js", "tools/page-digests.js", "tools/phase-handoff.js",
  "tools/plan-agent-events.js", "tools/qa-batch.js", "tools/rollout-usage.js", "tools/token-ledger.js",
  "tools/qa-rules.zh.json",
  "tools/lint-scope-hygiene.js", "tools/render-contact-sheet.js", "tools/render-quality-gate.js",
  "tools/run-phase.js", "tools/render-layout-blueprint.js", "tools/select-visual-route.js", "tools/verify-agent-collaboration.js",
  "tools/verify-checkpoints.js", "tools/verify-design-gates.js", "tools/verify-page-preflight.js", "tools/verify-qa-result.js",
  "tools/verify-quality-baseline.js", "tools/verify-state-memory.js", "tools/verify-terminology.js",
  "tools/workflow-gate.js"
];
function same(a, b) { return fs.existsSync(a) && fs.existsSync(b) && fs.readFileSync(a).equals(fs.readFileSync(b)); }
if (!fs.existsSync(path.join(target, "deck.config.js"))) {
  console.error(`Not a Leander scaffold: ${target}`); process.exit(1);
}
const changed = managed.filter(rel => !same(path.join(TEMPLATE, rel), path.join(target, rel)));
const expectedVersion = JSON.parse(fs.readFileSync(path.join(TEMPLATE, ".leander-scaffold-version.json"), "utf8"));
const targetVersion = (() => { try { return JSON.parse(fs.readFileSync(path.join(target, ".leander-scaffold-version.json"), "utf8")); } catch { return {}; } })();
const packageFile = path.join(target, "package.json");
const packageData = JSON.parse(fs.readFileSync(packageFile, "utf8"));
packageData.dependencies = packageData.dependencies || {};
const dependencyChanged = packageData.dependencies.pngjs !== "7.0.0";
const qualityTargetMissing = !fs.existsSync(path.join(target, "quality-target.json"));
const collaborationFile = path.join(target, "agent-collaboration.json");
const collaborationNeedsMigration = (() => { try { const value = JSON.parse(fs.readFileSync(collaborationFile, "utf8")); return value.version !== "agent-collaboration.v3" || value.policy !== "event-driven.v3" || Object.values(value.roles || {}).some(role => !Array.isArray(role.runs)); } catch { return true; } })();
if (check) {
  if (changed.length || dependencyChanged || qualityTargetMissing || collaborationNeedsMigration || targetVersion.version !== expectedVersion.version) {
    console.error(`Scaffold stale: tools=${changed.length}, dependencyChanged=${dependencyChanged}, qualityTargetMissing=${qualityTargetMissing}, collaborationNeedsMigration=${collaborationNeedsMigration}, version=${targetVersion.version || "missing"}`);
    changed.forEach(item => console.error(`- ${item}`)); process.exit(1);
  }
  console.log(`Scaffold tools are current: ${expectedVersion.version}`); process.exit(0);
}
changed.forEach(rel => {
  const src = path.join(TEMPLATE, rel), dst = path.join(target, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
});
if (qualityTargetMissing) fs.copyFileSync(path.join(TEMPLATE, "quality-target.json"), path.join(target, "quality-target.json"));
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
const frozen = cp.spawnSync(process.execPath, [path.join(target, "tools", "tool-freeze.js"), "capture", "scaffold-sync"], { cwd: target, encoding: "utf8" });
if (frozen.status !== 0) { console.error((frozen.stderr || frozen.stdout || "Failed to capture tool freeze after sync.").trim()); process.exit(frozen.status || 1); }
console.log(`Synced Leander scaffold ${version.version}: ${changed.length} managed files updated; dependencyChanged=${dependencyChanged}; qualityTargetCreated=${qualityTargetMissing}; collaborationMigrated=${collaborationNeedsMigration}; project content preserved.`);
