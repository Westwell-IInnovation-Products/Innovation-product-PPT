// Single fail-closed aggregator for every formal final verification/build.
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const ROOT = path.join(__dirname, "..");

function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; }
}
function run(label, script, args = []) {
  const result = cp.spawnSync(process.execPath, [path.join(__dirname, script), ...args], { cwd: ROOT, encoding: "utf8" });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) throw new Error(`FINAL GATE FAILED [${label}]`);
  console.log(`PASS final gate: ${label}`);
}
function verify() {
  const receipt = readJson(path.join(ROOT, "workflow-receipt.json"), {});
  run("workflow", "workflow-gate.js", ["verify", "final"]);
  run("context-budget", "context-budget-gate.js", ["--enforce-budget", "--gate", "final-gate"]);
  run("checkpoints", "verify-checkpoints.js", ["phase4"]);
  if (["delta-revision", "redesign", "full-rebuild"].includes(receipt.intent)) run("revision", "revision-mode.js", ["verify"]);
  run("design", "verify-design-gates.js", ["pages"]);
  run("preflight", "verify-page-preflight.js");
  run("quality", "verify-quality-baseline.js");
  run("source", "verify-source-evidence.js");
  run("terminology", "verify-terminology.js");
  run("state-memory", "verify-state-memory.js");
  run("machine-geometry", "render-geometry-audit.js");
  run("user-feedback", "user-feedback-gate.js", ["verify"]);
  run("page-qa", "deck.js", ["verify-pages-only"]);
  run("collaboration", "verify-agent-collaboration.js");
  run("render-quality", "render-quality-gate.js", ["verify"]);
  console.log("FINAL GATE OK");
}
if (require.main === module) {
  try { verify(); } catch (error) { console.error(error.message); process.exit(1); }
}
module.exports = { verify, run };
