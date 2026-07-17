// Observe model input growth and enforce a Gate-boundary fresh-task rotation.
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { loadLedger, snapshotForLedger } = require("./token-ledger");
const ROOT = path.join(__dirname, "..");
const OUTPUT = path.join(ROOT, "state", "context-budget.json");
const LOCK = path.join(ROOT, "state", "context-rotation-lock.json");

function rawArg(name, fallback = "") { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
function numberArg(name, fallback) { const value = Number(rawArg(name, fallback)); return Number.isFinite(value) ? value : fallback; }
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8"); }

function assessCalls(calls = [], thresholds = {}) {
  const window = Math.max(1, Number(thresholds.window || 3));
  const recent = calls.slice(-window);
  const average = recent.length ? Math.round(recent.reduce((sum, call) => sum + Number(call.input_tokens || 0), 0) / recent.length) : 0;
  const max = calls.length ? Math.max(...calls.map(call => Number(call.input_tokens || 0))) : 0;
  const warn = Number(thresholds.warn || 80000);
  const rotateAverage = Number(thresholds.rotateAverage || 120000);
  const rotateSingle = Number(thresholds.rotateSingle || 180000);
  const status = max >= rotateSingle || average >= rotateAverage ? "rotate-at-gate" : average >= warn ? "warning" : "continue";
  return { status, windowCalls: recent.length, averageInputTokens: average, maxInputTokens: max, thresholds: { warn, rotateAverage, rotateSingle } };
}

function inspect() {
  const ledger = loadLedger();
  if (!ledger) return { version: "leander-context-budget.v2", generatedAt: new Date().toISOString(), status: "unavailable", reason: "token ledger not initialized" };
  const snap = snapshotForLedger(ledger);
  const assessment = assessCalls(snap.activeRootCalls || snap.activeRootRecentCalls || [], {
    window: numberArg("window", 3),
    warn: numberArg("warn", 80000),
    rotateAverage: numberArg("rotate-average", 120000),
    rotateSingle: numberArg("rotate-single", 180000)
  });
  const latestRootThreadId = ledger.activeRootThreadId || (ledger.rootThreadIds || []).slice(-1)[0] || "";
  const compactions = Number((snap.taskCompactions || []).find(item => item.threadId === latestRootThreadId)?.compactions || 0);
  if (compactions > 0) assessment.status = "rotate-at-gate";
  return {
    version: "leander-context-budget.v2",
    generatedAt: new Date().toISOString(),
    accuracy: snap.accuracy,
    ...assessment,
    latestRootThreadId,
    callScope: "active-root-main-only",
    compactions,
    rule: "Close the current Gate, write a compact handoff, then attach a fresh root task before production continues."
  };
}

function createLock(gateLabel = "gate") {
  const budget = inspect();
  writeJson(OUTPUT, budget);
  if (budget.status !== "rotate-at-gate") return { locked: false, budget };
  const ledger = loadLedger() || {};
  const lock = {
    version: "leander-context-rotation-lock.v1",
    status: "pending",
    gateLabel,
    createdAt: new Date().toISOString(),
    reason: `context budget exceeded: average=${budget.averageInputTokens}, max=${budget.maxInputTokens}, compactions=${budget.compactions || 0}`,
    blockedRootThreadIds: [...new Set(ledger.rootThreadIds || [])],
    requiredAction: "Start a fresh Codex task, run token-ledger.js attach-thread, then read state/phase-handoff.json."
  };
  writeJson(LOCK, lock);
  return { locked: true, budget, lock };
}

function pendingLock() {
  const lock = readJson(LOCK, null);
  return lock?.status === "pending" ? lock : null;
}

function activeTaskError(ledger, currentThreadId) {
  if (!ledger) return "TOKEN LEDGER REQUIRED: initialize Gate 0 before production.";
  const active = ledger.activeRootThreadId || (ledger.rootThreadIds || []).slice(-1)[0] || "";
  if (!active) return "ACTIVE ROOT TASK REQUIRED: Gate 0 could not bind this project to a Codex root task.";
  if (!currentThreadId) return "CODEX_THREAD_ID REQUIRED: hard context rotation cannot verify the active task; fail closed.";
  if (currentThreadId !== active) return `INACTIVE TASK BLOCKED: this command runs in ${currentThreadId}, but the project is bound to ${active}. Continue only in the active attached task.`;
  return "";
}

function enforce() {
  const lock = pendingLock();
  if (lock) {
    const error = new Error(`CONTEXT ROTATION REQUIRED after ${lock.gateLabel}: ${lock.requiredAction}`);
    error.code = "LEANDER_CONTEXT_ROTATION";
    throw error;
  }
  const ledger = loadLedger();
  const bindingError = activeTaskError(ledger, process.env.CODEX_THREAD_ID || "");
  if (bindingError) {
    const error = new Error(bindingError);
    error.code = "LEANDER_INACTIVE_TASK";
    throw error;
  }
  return { ok: true, activeRootThreadId: ledger.activeRootThreadId || (ledger.rootThreadIds || []).slice(-1)[0] || "" };
}
function enforceBudget(gateLabel = "protected-command") {
  enforce();
  const outcome = createLock(gateLabel);
  if (outcome.budget.accuracy !== "actual") {
    const error = new Error("TOKEN OBSERVABILITY REQUIRED: the active root rollout is unreadable or its Gate 0 baseline cannot be reconstructed; protected Leander commands fail closed.");
    error.code = "LEANDER_TOKEN_OBSERVABILITY";
    throw error;
  }
  if (outcome.locked) {
    const error = new Error(`CONTEXT ROTATION REQUIRED after ${outcome.lock.gateLabel}: ${outcome.lock.requiredAction}`);
    error.code = "LEANDER_CONTEXT_ROTATION";
    throw error;
  }
  return { ok: true, budget: outcome.budget };
}

function selfTest() {
  assert.equal(assessCalls([{ input_tokens: 60000 }]).status, "continue");
  assert.equal(assessCalls([{ input_tokens: 90000 }]).status, "warning");
  assert.equal(assessCalls([{ input_tokens: 130000 }]).status, "rotate-at-gate");
  assert.equal(assessCalls([{ input_tokens: 190000 }, { input_tokens: 1000 }]).status, "rotate-at-gate");
  assert.equal(assessCalls([{ input_tokens: 190000 }, { input_tokens: 1000 }, { input_tokens: 1000 }, { input_tokens: 1000 }]).status, "rotate-at-gate");
  assert(activeTaskError(null, "task"));
  assert(activeTaskError({ activeRootThreadId: "new" }, "old"));
  assert.equal(activeTaskError({ activeRootThreadId: "new" }, "new"), "");
  console.log("PASS context budget self-test");
}

if (require.main === module) {
  try {
    if (process.argv.includes("--self-test")) selfTest();
    else if (process.argv.includes("--enforce-budget")) { const value = enforceBudget(rawArg("gate", "protected-command")); console.log(`Context budget hard Gate: clear; avg=${value.budget.averageInputTokens || 0}; max=${value.budget.maxInputTokens || 0}`); }
    else if (process.argv.includes("--enforce")) { enforce(); console.log("Context rotation lock: clear"); }
    else {
      const value = process.argv.includes("--lock") ? createLock(rawArg("gate", "gate")) : { locked: false, budget: inspect() };
      if (process.argv.includes("--write") && !process.argv.includes("--lock")) writeJson(OUTPUT, value.budget);
      console.log(`Context budget: ${value.budget.status}; avg=${value.budget.averageInputTokens || 0}; max=${value.budget.maxInputTokens || 0}${value.locked ? "; rotation-lock=pending" : ""}`);
      if (value.locked) process.exitCode = 2;
    }
  } catch (error) { console.error(error.message); process.exit(2); }
}

module.exports = { assessCalls, inspect, createLock, pendingLock, activeTaskError, enforce, enforceBudget, selfTest };
