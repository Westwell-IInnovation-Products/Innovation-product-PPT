// Scaffold-local regression suite for syntax and deterministic behavior.
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const TOOLS = __dirname;
const ROOT = path.join(__dirname, "..");
function run(label, args) {
  const result = cp.spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(`FAIL ${label}\n${result.stdout || ""}${result.stderr || ""}`);
    process.exit(result.status || 1);
  }
  const last = `${result.stdout || ""}${result.stderr || ""}`.trim().split(/\r?\n/).slice(-1)[0] || "PASS";
  console.log(`PASS ${label}: ${last}`);
}
const scripts = fs.readdirSync(TOOLS).filter(name => name.endsWith(".js")).sort();
scripts.forEach(name => run(`syntax ${name}`, ["--check", path.join(TOOLS, name)]));
const behaviors = [
  ["rollout usage", "rollout-usage.js"], ["token ledger", "token-ledger.js"], ["context budget", "context-budget-gate.js"],
  ["page digests", "page-digests.js"], ["change impact", "change-impact.js"], ["QA result", "verify-qa-result.js"],
  ["QA batch specificity", "qa-batch.js"], ["visual route competition", "select-visual-route.js"], ["render risk", "render-risk.js"],
  ["render diversity", "render-diversity.js"], ["agent independence", "verify-agent-collaboration.js"],
  ["agent collaboration migration", "migrate-agent-collaboration-v3.js"], ["hard Gate contract", "hard-gate-contract.js"],
  ["hard Gate adversarial black-box", "hard-gate-blackbox.js"], ["candidate harvest", "candidate-harvest.js"]
];
behaviors.forEach(([label, file]) => run(label, [path.join(TOOLS, file), "--self-test"]));
console.log(`PASS Leander regression suite: ${scripts.length} syntax checks, ${behaviors.length} behavior tests.`);
