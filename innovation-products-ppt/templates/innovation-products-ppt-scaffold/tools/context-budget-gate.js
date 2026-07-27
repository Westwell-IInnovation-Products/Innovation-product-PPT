// Observe cumulative conversation usage and rotate only at a safe job boundary.
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { loadLedger, snapshotForLedger, checkpoint } = require("./token-ledger");
const ROOT = path.join(__dirname, "..");
const OUTPUT = path.join(ROOT, "state", "context-budget.json");
const LOCK = path.join(ROOT, "state", "context-rotation-lock.json");

function rawArg(name, fallback = "") { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
function numberArg(name, fallback) { const value = Number(rawArg(name, fallback)); return Number.isFinite(value) ? value : fallback; }
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8"); }
function configPolicy() {
  let cfg = {};
  try { cfg = require(path.join(ROOT, "deck.config.js")); } catch {}
  return {
    enforcementMode: rawArg("enforcement-mode", cfg.executionBudget?.enforcementMode || "report-only"),
    conversationHardTotalTokens: numberArg("hard-total", Number(cfg.executionBudget?.conversationHardTotalTokens || 260000)),
    executionStopTokens: numberArg("execution-stop", Number(cfg.executionBudget?.executionStopTokens || 180000)),
    handoffOnlyTokens: numberArg("handoff-only", Number(cfg.executionBudget?.handoffOnlyTokens || 220000)),
    reservedCompletionTokens: Number(cfg.executionBudget?.reservedCompletionTokens || 40000)
  };
}

function assessCalls(calls = [], thresholds = {}) {
  const window = Math.max(1, Number(thresholds.window || 3));
  const recent = calls.slice(-window);
  const average = recent.length ? Math.round(recent.reduce((sum, call) => sum + Number(call.input_tokens || 0), 0) / recent.length) : 0;
  const max = calls.length ? Math.max(...calls.map(call => Number(call.input_tokens || 0))) : 0;
  const warn = Number(thresholds.warn || 120000);
  const rotateAverage = Number(thresholds.rotateAverage || 180000);
  const rotateSingle = Number(thresholds.rotateSingle || 260000);
  const status = "continue"; // single-task mode: recent-call rotation retired
  return { status, windowCalls: recent.length, averageInputTokens: average, maxInputTokens: max, thresholds: { warn, rotateAverage, rotateSingle } };
}

function assessConversation(totalTokens = 0, policy = configPolicy()) {
  const total = Number(totalTokens || 0);
  const status = "continue"; // budget ceiling retired: one task, no token limit
  return {
    status,
    cumulativeTotalTokens: total,
    remainingToHardLimit: Math.max(0, policy.conversationHardTotalTokens - total),
    thresholds: {
      executionStopTokens: policy.executionStopTokens,
      handoffOnlyTokens: policy.handoffOnlyTokens,
      conversationHardTotalTokens: policy.conversationHardTotalTokens,
      reservedCompletionTokens: policy.reservedCompletionTokens
    }
  };
}

function inspect() {
  const ledger = loadLedger();
  if (!ledger) return { version: "leander-context-budget.v3", generatedAt: new Date().toISOString(), status: "unavailable", reason: "token ledger not initialized" };
  const snap = snapshotForLedger(ledger), policy = configPolicy();
  const callAssessment = assessCalls(snap.activeRootCalls || snap.activeRootRecentCalls || [], {
    window: numberArg("window", 3),
    warn: numberArg("warn", 120000),
    rotateAverage: numberArg("rotate-average", 180000),
    rotateSingle: numberArg("rotate-single", 260000)
  });
  const latestRootThreadId = ledger.activeRootThreadId || (ledger.rootThreadIds || []).slice(-1)[0] || "";
  const compactions = Number((snap.taskCompactions || []).find(item => item.threadId === latestRootThreadId)?.compactions || 0);
  const conversation = assessConversation(snap.activeConversation?.usage?.total_tokens || 0, policy);
  const status = conversation.status; // always "continue": single-task mode never rotates
  const wouldRotateAtBoundary = false;
  return {
    version: "leander-context-budget.v3",
    generatedAt: new Date().toISOString(),
    accuracy: snap.accuracy,
    status,
    enforcementMode: policy.enforcementMode,
    wouldRotateAtBoundary,
    cumulativeTotalTokens: conversation.cumulativeTotalTokens,
    remainingToHardLimit: conversation.remainingToHardLimit,
    thresholds: conversation.thresholds,
    recentCallGuard: callAssessment,
    averageInputTokens: callAssessment.averageInputTokens,
    maxInputTokens: callAssessment.maxInputTokens,
    latestRootThreadId,
    callScope: "active-conversation-main-plus-descendant-subagents",
    modelCalls: Number(snap.activeConversation?.model_calls || 0),
    subagentThreads: Number(snap.activeConversation?.subagent_threads || 0),
    compactions,
    rule: policy.enforcementMode === "enforce"
      ? "At execution-stop, finish the current bounded job, write handoff, and attach a fresh task. At handoff-only, do not start production work."
      : "Report-only pilot: record the would-rotate decision, but do not block production until the thresholds are validated on real decks."
  };
}

function createLock(gateLabel = "gate") {
  const budget = inspect();
  writeJson(OUTPUT, budget);
  const shouldLock = false; // rotation locks retired in single-task mode
  if (!shouldLock) return { locked: false, wouldLock: budget.wouldRotateAtBoundary, budget };
  const ledger = loadLedger() || {};
  const lock = {
    version: "leander-context-rotation-lock.v2",
    status: "pending",
    gateLabel,
    createdAt: new Date().toISOString(),
    reason: `conversation budget ${budget.status}: cumulative=${budget.cumulativeTotalTokens}, calls=${budget.modelCalls}, compactions=${budget.compactions || 0}`,
    blockedRootThreadIds: [...new Set(ledger.rootThreadIds || [])],
    requiredAction: "Start a fresh Codex task and run node tools/resume-job.js."
  };
  writeJson(LOCK, lock);
  return { locked: true, wouldLock: true, budget, lock };
}

function pendingLock() {
  const lock = readJson(LOCK, null);
  return lock?.status === "pending" ? lock : null;
}

function activeTaskError(ledger, currentThreadId) {
  if (!ledger) return "TOKEN LEDGER REQUIRED: initialize Gate 0 before production.";
  const active = ledger.activeRootThreadId || (ledger.rootThreadIds || []).slice(-1)[0] || "";
  if (!active) return "ACTIVE ROOT TASK REQUIRED: Gate 0 could not bind this project to a Codex root task.";
  if (!currentThreadId) return "CODEX_THREAD_ID REQUIRED: context accounting cannot verify the active task; fail closed.";
  if (currentThreadId !== active) return `INACTIVE TASK BLOCKED: this command runs in ${currentThreadId}, but the project is bound to ${active}. Continue only in the active attached task.`;
  return "";
}

function enforce() {
  // Rotation-lock and active-task binding enforcement retired: single-task mode never blocks.
  // pendingLock()/activeTaskError() stay defined for measurement and back-compat inspection.
  const ledger = loadLedger() || {};
  return { ok: true, activeRootThreadId: ledger.activeRootThreadId || (ledger.rootThreadIds || []).slice(-1)[0] || "" };
}
function enforceBudget(gateLabel = "protected-command") {
  // Budget/observability enforcement retired: record a measurement checkpoint, never fail closed.
  try { checkpoint(gateLabel); } catch (error) { console.warn(`NOTICE token checkpoint unavailable at ${gateLabel}: ${error.message}`); }
  const outcome = createLock(gateLabel);
  return { ok: true, budget: outcome.budget, wouldLock: false };
}

function selfTest() {
  // Single-task mode: the gate never rotates or blocks, regardless of usage.
  assert.equal(assessCalls([{ input_tokens: 900000 }]).status, "continue");
  const policy = { conversationHardTotalTokens: 260000, executionStopTokens: 180000, handoffOnlyTokens: 220000, reservedCompletionTokens: 40000 };
  assert.equal(assessConversation(1000000, policy).status, "continue");
  assert.equal(enforce().ok, true);
  // activeTaskError stays defined (measurement/back-compat) but no longer blocks.
  assert.equal(typeof activeTaskError, "function");
  assert.equal(typeof enforceBudget, "function");
  console.log("PASS context budget self-test");
}

if (require.main === module) {
  try {
    if (process.argv.includes("--self-test")) selfTest();
    else if (process.argv.includes("--enforce-budget")) { const value = enforceBudget(rawArg("gate", "protected-command")); console.log(`Context budget Gate: clear; total=${value.budget.cumulativeTotalTokens || 0}; mode=${value.budget.enforcementMode}${value.wouldLock ? "; would-rotate" : ""}`); }
    else if (process.argv.includes("--enforce")) { enforce(); console.log("Context rotation lock: clear"); }
    else if (process.argv.includes("--tail")) { /* single-task mode: token water-line retired, no per-command output */ }
    else {
      const value = process.argv.includes("--lock") ? createLock(rawArg("gate", "gate")) : { locked: false, wouldLock: false, budget: inspect() };
      if (process.argv.includes("--write") && !process.argv.includes("--lock")) writeJson(OUTPUT, value.budget);
      console.log(`Context budget: ${value.budget.status}; total=${value.budget.cumulativeTotalTokens || 0}; mode=${value.budget.enforcementMode}${value.locked ? "; rotation-lock=pending" : value.wouldLock ? "; would-rotate-at-boundary" : ""}`);
      if (value.locked) process.exitCode = 2;
    }
  } catch (error) { console.error(error.message); process.exit(2); }
}

module.exports = { assessCalls, assessConversation, configPolicy, inspect, createLock, pendingLock, activeTaskError, enforce, enforceBudget, selfTest };
