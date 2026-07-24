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
  const status = max >= rotateSingle || average >= rotateAverage ? "rotate-at-gate" : average >= warn ? "warning" : "continue";
  return { status, windowCalls: recent.length, averageInputTokens: average, maxInputTokens: max, thresholds: { warn, rotateAverage, rotateSingle } };
}

function assessConversation(totalTokens = 0, policy = configPolicy()) {
  const total = Number(totalTokens || 0);
  let status = "continue";
  if (total >= policy.conversationHardTotalTokens) status = "limit-exceeded";
  else if (total >= policy.handoffOnlyTokens) status = "handoff-only";
  else if (total >= policy.executionStopTokens) status = "finish-current-job";
  else if (total >= Math.floor(policy.executionStopTokens * 0.75)) status = "warning";
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
  let status = conversation.status;
  if (["continue", "warning"].includes(status) && callAssessment.status === "rotate-at-gate") status = "handoff-only";
  if (status === "continue" && callAssessment.status === "warning") status = "warning";
  if (compactions > 0 && !["limit-exceeded", "handoff-only"].includes(status)) status = "handoff-only";
  const wouldRotateAtBoundary = ["finish-current-job", "handoff-only", "limit-exceeded"].includes(status);
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
  const shouldLock = budget.enforcementMode === "enforce" && budget.wouldRotateAtBoundary;
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
  try { checkpoint(gateLabel); } catch (error) { console.warn(`NOTICE token checkpoint unavailable at ${gateLabel}: ${error.message}`); }
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
  return { ok: true, budget: outcome.budget, wouldLock: outcome.wouldLock };
}

function selfTest() {
  assert.equal(assessCalls([{ input_tokens: 60000 }]).status, "continue");
  assert.equal(assessCalls([{ input_tokens: 130000 }]).status, "warning");
  assert.equal(assessCalls([{ input_tokens: 190000 }]).status, "rotate-at-gate");
  const policy = { conversationHardTotalTokens: 260000, executionStopTokens: 180000, handoffOnlyTokens: 220000, reservedCompletionTokens: 40000 };
  assert.equal(assessConversation(179999, policy).status, "warning");
  assert.equal(assessConversation(180000, policy).status, "finish-current-job");
  assert.equal(assessConversation(220000, policy).status, "handoff-only");
  assert.equal(assessConversation(260000, policy).status, "limit-exceeded");
  assert(activeTaskError(null, "task"));
  assert(activeTaskError({ activeRootThreadId: "new" }, "old"));
  assert.equal(activeTaskError({ activeRootThreadId: "new" }, "new"), "");
  console.log("PASS context budget self-test");
}

if (require.main === module) {
  try {
    if (process.argv.includes("--self-test")) selfTest();
    else if (process.argv.includes("--enforce-budget")) { const value = enforceBudget(rawArg("gate", "protected-command")); console.log(`Context budget Gate: clear; total=${value.budget.cumulativeTotalTokens || 0}; mode=${value.budget.enforcementMode}${value.wouldLock ? "; would-rotate" : ""}`); }
    else if (process.argv.includes("--enforce")) { enforce(); console.log("Context rotation lock: clear"); }
    else if (process.argv.includes("--tail")) {
      try {
        const budget = inspect();
        if (budget.status === "unavailable") { console.log("[水位] 不可用（账本未初始化）"); return; }
        const k = value => `${Math.round(Number(value || 0) / 1000)}K`;
        const t = budget.thresholds || {};
        const advice = budget.status === "limit-exceeded" ? "已越硬顶：只允许交接"
          : budget.status === "handoff-only" ? "只允许收尾交接"
          : budget.status === "finish-current-job" ? "完成当前 job 后换任务"
          : budget.status === "warning" ? "接近执行停止线" : "余量充足";
        console.log(`[水位] 累计 ${k(budget.cumulativeTotalTokens)} / 执行停 ${k(t.executionStopTokens)} / 交接 ${k(t.handoffOnlyTokens)} / 硬顶 ${k(t.conversationHardTotalTokens)} ｜ ${budget.enforcementMode} ｜ ${advice}`);
      } catch (error) { console.log(`[水位] 不可用：${error.message}`); }
    }
    else {
      const value = process.argv.includes("--lock") ? createLock(rawArg("gate", "gate")) : { locked: false, wouldLock: false, budget: inspect() };
      if (process.argv.includes("--write") && !process.argv.includes("--lock")) writeJson(OUTPUT, value.budget);
      console.log(`Context budget: ${value.budget.status}; total=${value.budget.cumulativeTotalTokens || 0}; mode=${value.budget.enforcementMode}${value.locked ? "; rotation-lock=pending" : value.wouldLock ? "; would-rotate-at-boundary" : ""}`);
      if (value.locked) process.exitCode = 2;
    }
  } catch (error) { console.error(error.message); process.exit(2); }
}

module.exports = { assessCalls, assessConversation, configPolicy, inspect, createLock, pendingLock, activeTaskError, enforce, enforceBudget, selfTest };
