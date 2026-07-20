// Combine deterministic phase work into one model-visible call.
// Full logs go to output/phase-run.log; stdout stays compact.
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const ROOT = path.join(__dirname, "..");
const OUTPUT = path.join(ROOT, "output");
const LOG = path.join(OUTPUT, "phase-run.log");
const cfg = require(path.join(ROOT, "deck.config.js"));
const { inspect: inspectChanges, compact: compactImpact } = require("./change-impact");
const { enforceBudget: enforceContextBudget } = require("./context-budget-gate");
const { verify: verifyToolFreeze } = require("./tool-freeze");
const results = [];
let impactSummary = null;
let rotationSummary = { rotationRequired: false, nextAction: "continue" };

function arg(name, fallback = "") { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
function append(text) { fs.mkdirSync(OUTPUT, { recursive: true }); fs.appendFileSync(LOG, text + "\n", "utf8"); }
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function run(label, script, args = []) {
  const started = Date.now();
  const result = cp.spawnSync(process.execPath, [path.join(__dirname, script), ...args], { cwd: ROOT, encoding: "utf8" });
  append(`\n## ${new Date().toISOString()} ${label}\n${result.stdout || ""}${result.stderr || ""}`);
  if (result.status !== 0) {
    console.error(`FAIL ${label}`);
    process.stderr.write((result.stderr || result.stdout || "").slice(-6000));
    process.exit(result.status || 1);
  }
  results.push({ label, seconds: Number(((Date.now() - started) / 1000).toFixed(1)) });
}
function runContextBoundary(label) {
  const started = Date.now();
  const result = cp.spawnSync(process.execPath, [path.join(__dirname, "context-budget-gate.js"), "--lock", "--gate", label], { cwd: ROOT, encoding: "utf8" });
  append(`\n## ${new Date().toISOString()} context budget boundary\n${result.stdout || ""}${result.stderr || ""}`);
  if (![0, 2].includes(result.status)) {
    console.error("FAIL context budget boundary");
    process.stderr.write((result.stderr || result.stdout || "").slice(-6000));
    process.exit(result.status || 1);
  }
  results.push({ label: "context budget boundary", seconds: Number(((Date.now() - started) / 1000).toFixed(1)) });
  const lock = readJson(path.join(ROOT, "state", "context-rotation-lock.json"), {});
  const rotationRequired = result.status === 2 || lock.status === "pending";
  return {
    rotationRequired,
    reason: rotationRequired ? (lock.reason || "context budget exceeded") : "",
    nextAction: rotationRequired ? "Start a fresh Codex task, attach it with token-ledger.js, and resume from state/phase-handoff.json." : "continue"
  };
}
function pageDirs() {
  const pagesRoot = path.join(ROOT, "pages");
  const all = fs.existsSync(pagesRoot) ? fs.readdirSync(pagesRoot).filter(dir => fs.existsSync(path.join(pagesRoot, dir, "page.json"))).sort() : [];
  const requested = new Set(arg("pages").split(",").map(v => v.trim()).filter(Boolean));
  const active = new Set(cfg.workflow?.activePages || []);
  return all.filter(dir => {
    const meta = JSON.parse(fs.readFileSync(path.join(pagesRoot, dir, "page.json"), "utf8").replace(/^\uFEFF/, ""));
    const id = String(meta.id || "");
    if (requested.size) return requested.has(dir) || requested.has(id);
    return !active.size || active.has(dir) || active.has(id);
  });
}
function preparePages() {
  const dirs = pageDirs();
  if (!dirs.length) throw new Error("No active page contracts found.");
  dirs.forEach(dir => {
    const contract = path.join("pages", dir, "page.json");
    const meta = JSON.parse(fs.readFileSync(path.join(ROOT, contract), "utf8").replace(/^\uFEFF/, ""));
    const locked = meta.visualSelection?.selectionLocked === true || meta.visualSelection?.selectedRoute?.overridden === true;
    if (locked && !process.argv.includes("--force-route")) {
      append(`${new Date().toISOString()} ${dir}: preserved approved visual route`);
      results.push({ label: `${dir} visual route preserved`, seconds: 0 });
    } else {
      run(`${dir} visual route`, "select-visual-route.js", [contract, "--write"]);
    }
    run(`${dir} dynamic QA`, "build-qa-profile.js", [contract, "--write"]);
  });
  run("page design contracts", "verify-design-gates.js", ["pages"]);
  run("quality baseline", "verify-quality-baseline.js");
  run("final visual-contract preflight", "verify-page-preflight.js", ["--pages", dirs.join(",")]);
}

const command = process.argv[2] || "status";
try {
  fs.mkdirSync(OUTPUT, { recursive: true });
  if (command !== "status") { enforceContextBudget(`phase-start-${command}`); verifyToolFreeze(); }
  if (command === "status") {
    run("workflow status", "workflow-gate.js", ["status"]);
    run("context budget", "context-budget-gate.js", ["--write"]);
    run("compact context", "context-pack.js", ["--mode", "status", "--strict", "--write"]);
    run("artifact map", "artifact-map.js", ["--write"]);
  } else if (command === "prepare-pages") {
    preparePages();
  } else if (command === "page-cycle") {
    preparePages();
    const scope = arg("pages"), pageArgs = scope ? ["--pages", scope] : [];
    impactSummary = compactImpact(inspectChanges({ pages: scope ? scope.split(",") : [] }));
    run("render affected pages", "deck.js", ["render", ...pageArgs]);
    run("contact sheet", "render-contact-sheet.js");
    run("render-level diversity and whitespace audit", "render-diversity.js");
    run("batch QA init for affected pages", "qa-batch.js", ["init", ...pageArgs]);
    run("capture split digests", "page-digests.js", ["capture", ...pageArgs]);
    if (["anchor-sample", "production"].includes(cfg.workflow?.stage)) run("capture render-quality evidence", "render-quality-gate.js", ["capture"]);
    run("agent event plan", "plan-agent-events.js", ["--write"]);
    run("artifact map", "artifact-map.js", ["--write"]);
  } else if (command === "render-review") {
    impactSummary = compactImpact(inspectChanges({ pages: [] }));
    run("render current pages", "deck.js", ["render"]);
    run("contact sheet", "render-contact-sheet.js");
    run("render-level diversity and whitespace audit", "render-diversity.js");
    if (["anchor-sample", "production"].includes(cfg.workflow?.stage)) run("capture render-quality evidence", "render-quality-gate.js", ["capture"]);
    run("candidate harvest scan", "candidate-harvest.js", ["--write"]);
    run("agent event plan", "plan-agent-events.js", ["--write"]);
  } else if (command === "final-verify") {
    run("final gated verification", "deck.js", ["verify", "--final"]);
    run("candidate harvest", "candidate-harvest.js", ["--write", "--materialize"]);
    run("artifact map", "artifact-map.js", ["--write"]);
  } else {
    throw new Error("usage: run-phase.js status|prepare-pages|page-cycle|render-review|final-verify [--pages p01,p02] [--force-route]");
  }
  if (command !== "status") {
    run("token checkpoint", "token-ledger.js", ["checkpoint", "--label", `phase-${command}`]);
    rotationSummary = runContextBoundary(`phase-${command}`);
    run("phase handoff", "phase-handoff.js", ["write"]);
  }
  console.log(JSON.stringify({ status: rotationSummary.rotationRequired ? "ROTATE_REQUIRED" : "PASS", phase: command, steps: results.length, seconds: Number(results.reduce((sum, item) => sum + item.seconds, 0).toFixed(1)), impact: impactSummary, log: "output/phase-run.log", exceptions: [], ...rotationSummary }));
} catch (error) { console.error(error.message); process.exit(1); }
