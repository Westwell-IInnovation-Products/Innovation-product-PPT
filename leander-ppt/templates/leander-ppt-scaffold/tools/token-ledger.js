// Gate-aware token ledger backed by local Codex rollout JSONL.
const fs = require("fs");
const path = require("path");
const { FIELDS, emptyUsage, addUsage, usageDelta, callMetrics, collectUsage, discoverCurrentRootThread } = require("./rollout-usage");

const ROOT = path.join(__dirname, "..");
const STATE = path.join(ROOT, "state", "token-ledger.json");
const REPORT_JSON = path.join(ROOT, "output", "token-report.zh.json");
const REPORT_MD = path.join(ROOT, "output", "token-report.zh.md");
const ROTATION_LOCK = path.join(ROOT, "state", "context-rotation-lock.json");
function arg(name, fallback) { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8"); }
function receipt() { return readJson(path.join(ROOT, "workflow-receipt.json"), {}); }
function roleByThread() {
  const data = readJson(path.join(ROOT, "agent-collaboration.json"), {}), out = {};
  Object.entries(data.roles || {}).forEach(([role, item]) => {
    if (item.threadId) out[item.threadId] = role;
    (item.runs || []).forEach(run => { if (run.threadId) out[run.threadId] = role; });
  });
  return out;
}
function threadDiscovery() {
  const explicit = arg("root-thread", ""), environment = process.env.CODEX_THREAD_ID || "";
  if (explicit && environment && explicit !== environment) throw new Error("--root-thread must match CODEX_THREAD_ID; a historical real task cannot be attached from the current task.");
  if (environment || explicit) return { threadId: environment || explicit, accuracy: "explicit", reason: environment ? "CODEX_THREAD_ID" : "--root-thread" };
  return discoverCurrentRootThread({ sessionsRoot: arg("sessions-root", undefined), projectRoot: ROOT });
}
function currentThread() { return threadDiscovery().threadId; }
function loadLedger() { return readJson(STATE, null); }
function gate0FreshTaskError(root) {
  if (!root) return "TOKEN OBSERVABILITY REQUIRED: Gate 0 cannot verify the current root rollout; start the deck in a fresh observable Codex task.";
  const calls = root.calls || [], recent = calls.slice(-3);
  const average = recent.length ? Math.round(recent.reduce((sum, call) => sum + Number(call.input_tokens || 0), 0) / recent.length) : 0;
  const max = calls.length ? Math.max(...calls.map(call => Number(call.input_tokens || 0))) : 0;
  const compactions = Number(root.compactions || 0);
  if (max >= 260000 || average >= 180000 || compactions > 0) return `FRESH TASK REQUIRED: Gate 0 refuses an already-heavy root task (recent average=${average}, max=${max}, compactions=${compactions}). Start a new Codex task before initializing this deck.`;
  return "";
}
function rotationAttachError(rotation, threadId, root = {}) {
  if (rotation?.status !== "pending") return "";
  if ((rotation.blockedRootThreadIds || []).includes(threadId)) return "attach-thread must use a fresh Codex root task; the previous root task cannot clear its own rotation lock.";
  const lockTime = Date.parse(rotation.createdAt || ""), rootTime = Date.parse(root.createdAt || "");
  if (!Number.isFinite(rootTime) || !Number.isFinite(lockTime) || rootTime <= lockTime) return "attach-thread requires a root task created after the rotation lock; historical task IDs cannot clear it.";
  return "";
}
function validateRootThread(threadId) {
  const snapshot = collectUsage({ sessionsRoot: arg("sessions-root", undefined), rootThreadIds: [threadId], roleByThread: {} });
  const root = (snapshot.records || []).find(record => record.rolloutId === threadId && record.kind === "main" && String(record.threadSource || "user").toLowerCase() !== "subagent");
  if (!root) throw new Error(`attach-thread could not verify a real user/root rollout for ${threadId}; do not use a fabricated thread id.`);
  return root;
}
function baselineMap(ledger) { return ledger?.baselineByRollout || {}; }
function collect(ledger) {
  return collectUsage({
    sessionsRoot: arg("sessions-root", undefined),
    rootThreadIds: ledger.rootThreadIds || [],
    since: ledger.startedAt || "",
    roleByThread: roleByThread()
  });
}
function runDelta(snapshot, ledger) {
  const base = baselineMap(ledger), records = snapshot.records || [];
  let totals = emptyUsage(), main = emptyUsage(), subagents = emptyUsage();
  const calls = [], agentRows = [], taskCompactions = [], deltaRecords = [];
  let callSequence = 0;
  for (const record of records) {
    const gate0Roots = new Set(ledger.gate0RootThreadIds || []);
    const reconstructed = gate0Roots.has(record.rolloutId) && !base[record.rolloutId]
      ? { usage: (record.calls || []).filter(call => call.timestamp && call.timestamp <= ledger.startedAt).reduce((sum, call) => addUsage(sum, call), emptyUsage()), callCount: (record.calls || []).filter(call => call.timestamp && call.timestamp <= ledger.startedAt).length }
      : null;
    const before = base[record.rolloutId] || reconstructed || { usage: emptyUsage(), callCount: 0, compactionCount: 0 };
    const delta = usageDelta(record.usage, before.usage);
    const newCalls = (record.calls || []).slice(Number(before.callCount || 0));
    deltaRecords.push({
      rolloutId: record.rolloutId,
      parentThreadId: record.parentThreadId || "",
      kind: record.kind,
      usage: delta,
      model_calls: newCalls.length,
      compactions: Math.max(0, Number(record.compactions || 0) - Number(before.compactionCount || 0))
    });
    totals = addUsage(totals, delta);
    if (record.kind === "main") main = addUsage(main, delta); else subagents = addUsage(subagents, delta);
    calls.push(...newCalls.map(call => ({ ...call, rolloutId: record.rolloutId, kind: record.kind, sequence: callSequence++ })));
    const compactions = Math.max(0, Number(record.compactions || 0) - Number(before.compactionCount || 0));
    if (record.kind === "main") taskCompactions.push({ threadId: record.rolloutId, compactions });
    if (record.kind === "subagent") agentRows.push({ threadId: record.rolloutId, role: record.role || "unmapped-subagent", usage: delta, model_calls: newCalls.length, source: record.file });
  }
  const orderedCalls = [...calls].sort((left, right) => {
    const leftTime = Date.parse(left.timestamp || ""), rightTime = Date.parse(right.timestamp || "");
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) return leftTime - rightTime;
    if (Number.isFinite(leftTime) !== Number.isFinite(rightTime)) return Number.isFinite(leftTime) ? -1 : 1;
    return Number(left.sequence || 0) - Number(right.sequence || 0);
  }).map(({ sequence, ...call }) => call);
  const activeRootThreadId = ledger.activeRootThreadId || (ledger.rootThreadIds || []).slice(-1)[0] || "";
  const activeRootCalls = orderedCalls.filter(call => call.kind === "main" && call.rolloutId === activeRootThreadId);
  const roots = new Set(ledger.rootThreadIds || []), byId = new Map(deltaRecords.map(item => [item.rolloutId, item]));
  function rootFor(item) {
    let current = item, guard = 0;
    while (current && guard++ < 20) {
      if (roots.has(current.rolloutId)) return current.rolloutId;
      current = current.parentThreadId ? byId.get(current.parentThreadId) : null;
    }
    return "";
  }
  const conversationMap = new Map((ledger.rootThreadIds || []).map(threadId => [threadId, {
    threadId, usage: emptyUsage(), main: emptyUsage(), subagents: emptyUsage(), model_calls: 0, subagent_threads: 0, compactions: 0
  }]));
  for (const item of deltaRecords) {
    const rootThreadId = rootFor(item);
    if (!rootThreadId || !conversationMap.has(rootThreadId)) continue;
    const row = conversationMap.get(rootThreadId);
    row.usage = addUsage(row.usage, item.usage);
    row[item.kind === "main" ? "main" : "subagents"] = addUsage(row[item.kind === "main" ? "main" : "subagents"], item.usage);
    row.model_calls += Number(item.model_calls || 0);
    row.compactions += Number(item.compactions || 0);
    if (item.kind === "subagent") row.subagent_threads += 1;
  }
  const conversations = [...conversationMap.values()].map(item => ({
    ...item,
    status: item.threadId === activeRootThreadId ? "active" : "closed"
  }));
  const activeConversation = conversations.find(item => item.threadId === activeRootThreadId) || null;
  return {
    totals, main, subagents, agents: agentRows,
    callMetrics: callMetrics(orderedCalls),
    recentCalls: orderedCalls.slice(-10),
    activeRootCalls,
    activeRootRecentCalls: activeRootCalls.slice(-10),
    activeRootThreadId,
    conversations,
    activeConversation,
    taskCompactions
  };
}
function snapshotForLedger(ledger = loadLedger()) {
  if (!ledger) throw new Error("Token ledger is not initialized. Run token-ledger.js start.");
  const raw = collect(ledger), delta = runDelta(raw, ledger);
  const gate0Roots = new Set(ledger.gate0RootThreadIds || []);
  const baselineActual = gate0Roots.size > 0 && (raw.records || []).some(record => gate0Roots.has(record.rolloutId) && (ledger.baselineByRollout?.[record.rolloutId] || (record.calls || []).every(call => !!call.timestamp)));
  const activeRootThreadId = ledger.activeRootThreadId || (ledger.rootThreadIds || []).slice(-1)[0] || "";
  const activeRootActual = !!activeRootThreadId && (raw.records || []).some(record => record.kind === "main" && record.rolloutId === activeRootThreadId);
  const accuracy = raw.accuracy === "actual" && baselineActual && activeRootActual ? "actual" : "estimated";
  const limitations = [
    ...(raw.limitations || []),
    ...(!baselineActual ? ["Gate 0 did not have a readable root-thread rollout id; later logs cannot reconstruct an exact baseline."] : []),
    ...(!activeRootActual ? ["The active root task rollout is not readable; context-budget enforcement must fail closed."] : [])
  ];
  return { accuracy, collectedAt: raw.collectedAt, sources: raw.sources, limitations, ...delta };
}
function start({ runId = "" } = {}) {
  const existing = loadLedger();
  if (existing && existing.runId === (runId || receipt().runId)) return existing;
  const discovery = threadDiscovery(), threadId = discovery.threadId;
  const now = new Date().toISOString();
  const provisional = { rootThreadIds: threadId ? [threadId] : [], startedAt: now };
  const raw = collect(provisional);
  const root = (raw.records || []).find(record => record.kind === "main" && record.rolloutId === threadId);
  const freshnessError = gate0FreshTaskError(root);
  if (freshnessError) throw new Error(freshnessError);
  const baselineByRollout = Object.fromEntries((raw.records || []).map(record => [record.rolloutId, { usage: record.usage, callCount: record.callCount, compactionCount: record.compactions || 0, capturedAt: now }]));
  const ledger = {
    version: "leander-token-ledger.v1",
    runId: runId || receipt().runId || "",
    startedAt: now,
    rootThreadIds: provisional.rootThreadIds,
    activeRootThreadId: threadId,
    contextGeneration: 0,
    gate0RootThreadIds: provisional.rootThreadIds,
    threadDiscovery: discovery,
    accuracy: raw.accuracy,
    baselineAccuracy: raw.accuracy,
    baseline: { label: "gate0", capturedAt: now, cumulativeTotals: raw.accuracy === "actual" ? raw.totals : null },
    baselineByRollout,
    checkpoints: [],
    limitations: raw.limitations || []
  };
  writeJson(STATE, ledger);
  return ledger;
}
function attachThread(threadId = currentThread()) {
  const ledger = loadLedger();
  if (!ledger) throw new Error("Initialize Gate 0 token ledger before attach-thread.");
  if (!threadId) throw new Error("attach-thread requires CODEX_THREAD_ID or --root-thread.");
  const root = validateRootThread(threadId);
  const rotation = readJson(ROTATION_LOCK, null);
  const rotationError = rotationAttachError(rotation, threadId, root);
  if (rotationError) throw new Error(rotationError);
  if (!ledger.rootThreadIds.includes(threadId)) ledger.rootThreadIds.push(threadId);
  ledger.attachedThreads = ledger.attachedThreads || [];
  if (!ledger.attachedThreads.some(item => item.threadId === threadId)) ledger.attachedThreads.push({ threadId, attachedAt: new Date().toISOString(), baselinePolicy: "count-entire-fresh-task" });
  const priorActive = ledger.activeRootThreadId || "";
  if (threadId !== priorActive) ledger.contextGeneration = Number(ledger.contextGeneration || 0) + 1;
  ledger.activeRootThreadId = threadId;
  if (rotation?.status === "pending") {
    rotation.status = "satisfied";
    rotation.satisfiedAt = new Date().toISOString();
    rotation.satisfiedByThreadId = threadId;
    writeJson(ROTATION_LOCK, rotation);
  }
  writeJson(STATE, ledger);
  return ledger;
}
function checkpoint(label) {
  const ledger = loadLedger() || start({});
  const current = snapshotForLedger(ledger);
  ledger.accuracy = current.accuracy;
  ledger.limitations = [...new Set([...(ledger.limitations || []), ...(current.limitations || [])])];
  const previous = [...ledger.checkpoints].reverse().find(item => item.accuracy === "actual" && item.label !== label);
  const item = {
    label, capturedAt: current.collectedAt, accuracy: current.accuracy,
    totals: current.accuracy === "actual" ? current.totals : null,
    increment: current.accuracy === "actual" ? usageDelta(current.totals, previous?.totals || emptyUsage()) : null,
    main: current.accuracy === "actual" ? current.main : null,
    mainIncrement: current.accuracy === "actual" ? usageDelta(current.main, previous?.main || emptyUsage()) : null,
    subagents: current.accuracy === "actual" ? current.subagents : null,
    subagentIncrement: current.accuracy === "actual" ? usageDelta(current.subagents, previous?.subagents || emptyUsage()) : null,
    callMetrics: current.callMetrics,
    activeConversation: current.accuracy === "actual" ? current.activeConversation : null
  };
  const existing = ledger.checkpoints.findIndex(entry => entry.label === label);
  if (existing >= 0) ledger.checkpoints[existing] = item; else ledger.checkpoints.push(item);
  writeJson(STATE, ledger);
  return current;
}
function markdown(report) {
  const f = value => value == null ? "未知" : Number(value).toLocaleString("zh-CN");
  const lines = [
    "# Leander-PPT Token 报告", "",
    `- 数据状态：${report.accuracy === "actual" ? "实际" : "估算"}`,
    `- Run ID：${report.runId || "未记录"}`,
    `- 统计截止：${report.collectedAt}`,
    `- 根任务：${report.rootThreadIds.length}`,
    `- 当前任务累计：${f(report.activeConversation?.usage?.total_tokens)}`,
    `- 模型调用：${f(report.callMetrics.model_calls)}`,
    `- 单次平均输入：${f(report.callMetrics.average_input_tokens)}`,
    `- 单次输入 P95：${f(report.callMetrics.p95_input_tokens)}`,
    `- 单次最大输入：${f(report.callMetrics.max_input_tokens)}`,
    `- 单次平均缓存输入：${f(report.callMetrics.average_cached_input_tokens)}`,
    `- 缓存输入占比：${report.callMetrics.cached_input_fraction == null ? "未知" : `${(Number(report.callMetrics.cached_input_fraction) * 100).toFixed(1)}%`}`, "",
    "## 总量", "",
    "| 字段 | 总量 | 主任务 | 子智能体 |", "|---|---:|---:|---:|",
    ...FIELDS.map(field => `| ${field} | ${f(report.totals?.[field])} | ${f(report.main?.[field])} | ${f(report.subagents?.[field])} |`),
    "", "## Gate 增量", "",
    `| Gate | ${FIELDS.join(" | ")} | 调用累计 |`,
    `|---|${FIELDS.map(() => "---:").join("|")}|---:|`
  ];
  if (report.checkpoints.length) report.checkpoints.forEach(item => lines.push(`| ${item.label} | ${FIELDS.map(field => item.accuracy === "actual" ? f(item.increment?.[field]) : "估算/缺失").join(" | ")} | ${f(item.callMetrics?.model_calls)} |`));
  else lines.push(`| 尚无 Gate 快照 | ${FIELDS.map(() => "-").join(" | ")} | - |`);
  lines.push("", "## 子智能体", "");
  if (report.agents.length) report.agents.forEach(item => lines.push(`- ${item.role} / ${item.threadId}：${f(item.usage.total_tokens)} Token，${f(item.model_calls)} 次调用。`));
  else lines.push("- 当前统计范围内无子智能体消耗。");
  lines.push("", "## 分任务累计", "");
  if (report.conversations.length) report.conversations.forEach(item => lines.push(`- ${item.threadId}${item.status === "active" ? "（当前）" : ""}：${f(item.usage.total_tokens)} Token，${f(item.model_calls)} 次调用，${f(item.subagent_threads)} 个子智能体任务。`));
  else lines.push("- 当前没有可归属的根任务记录。");
  lines.push("", "## 角色汇总", "");
  if (report.roleTotals.length) report.roleTotals.forEach(item => lines.push(`- ${item.role}：${f(item.usage.total_tokens)} Token，${f(item.model_calls)} 次调用，${f(item.threads)} 个任务。`));
  else lines.push("- 当前统计范围内无角色消耗。");
  lines.push("", "## 边界", "", "- 报告只统计 rollout JSONL 中已经闭合写入的调用；当前尚未写入日志的最后一次助手响应不在统计内。", ...((report.limitations || []).map(item => `- ${item}`)));
  return lines.join("\n") + "\n";
}
function report() {
  const ledger = loadLedger() || start({});
  const current = snapshotForLedger(ledger);
  const actual = current.accuracy === "actual";
  const roleMap = new Map();
  if (actual) for (const item of current.agents) {
    const key = item.role || "unmapped-subagent";
    const row = roleMap.get(key) || { role: key, usage: emptyUsage(), model_calls: 0, threads: 0 };
    row.usage = addUsage(row.usage, item.usage);
    row.model_calls += Number(item.model_calls || 0);
    row.threads += 1;
    roleMap.set(key, row);
  }
  const value = {
    version: "leander-token-report.zh.v2",
    runId: ledger.runId,
    accuracy: current.accuracy,
    collectedAt: current.collectedAt,
    rootThreadIds: ledger.rootThreadIds,
    totals: actual ? current.totals : null,
    main: actual ? current.main : null,
    subagents: actual ? current.subagents : null,
    agents: actual ? current.agents : [],
    roleTotals: [...roleMap.values()],
    callMetrics: current.callMetrics,
    conversations: actual ? current.conversations : [],
    activeConversation: actual ? current.activeConversation : null,
    checkpoints: ledger.checkpoints || [],
    sources: current.sources,
    limitations: [...new Set([...(ledger.limitations || []), ...(current.limitations || [])])]
  };
  writeJson(REPORT_JSON, value);
  fs.mkdirSync(path.dirname(REPORT_MD), { recursive: true });
  fs.writeFileSync(REPORT_MD, markdown(value), "utf8");
  return value;
}
function selfTest() {
  require("./rollout-usage").selfTest();
  const lock = { status: "pending", createdAt: "2026-01-02T00:00:00.000Z", blockedRootThreadIds: ["old"] };
  if (!rotationAttachError(lock, "old", { createdAt: "2026-01-01T00:00:00.000Z" })) throw new Error("old task cleared its own rotation lock");
  if (!rotationAttachError(lock, "historical", { createdAt: "2026-01-01T00:00:00.000Z" })) throw new Error("historical real task cleared the rotation lock");
  if (rotationAttachError(lock, "fresh", { createdAt: "2026-01-03T00:00:00.000Z" })) throw new Error("fresh task was rejected by rotation lock");
  if (!gate0FreshTaskError({ calls: [{ input_tokens: 270000 }], compactions: 0 })) throw new Error("Gate 0 accepted an over-limit existing task");
  if (gate0FreshTaskError({ calls: [{ input_tokens: 1000 }], compactions: 0 })) throw new Error("Gate 0 rejected a fresh low-context task");
  const usage = input_tokens => ({ input_tokens, cached_input_tokens: 0, non_cached_input: input_tokens, output_tokens: 0, reasoning_output_tokens: 0, total_tokens: input_tokens });
  const masked = runDelta({ records: [
    { rolloutId: "root", kind: "main", usage: usage(70000), calls: [
      { timestamp: "2026-01-01T00:00:01.000Z", ...usage(10000) },
      { timestamp: "2026-01-01T00:00:06.000Z", ...usage(60000) }
    ], compactions: 0 },
    { rolloutId: "child", parentThreadId: "root", kind: "subagent", usage: usage(4000), calls: [1, 2, 3, 4].map(index => ({ timestamp: `2026-01-01T00:00:0${index + 1}.000Z`, ...usage(1000) })), compactions: 0 }
  ] }, { baselineByRollout: {}, gate0RootThreadIds: [], activeRootThreadId: "root", rootThreadIds: ["root"] });
  const activeInputs = (masked.activeRootRecentCalls || []).map(call => call.input_tokens);
  if (activeInputs.join(",") !== "10000,60000") throw new Error(`active-root budget calls were masked or unordered: ${activeInputs.join(",") || "missing"}`);
  if (masked.activeConversation?.usage?.total_tokens !== 74000) throw new Error("active conversation did not include descendant subagent usage");
  console.log("PASS token ledger self-test");
}

if (require.main === module) {
  const command = process.argv[2] || "report";
  try {
    if (process.argv.includes("--self-test")) selfTest();
    else if (command === "start") { const ledger = start({ runId: arg("run-id") }); console.log(`Token ledger started: ${ledger.runId || "unbound"}`); }
    else if (command === "attach-thread") { const ledger = attachThread(); console.log(`Attached root thread; total roots=${ledger.rootThreadIds.length}`); }
    else if (command === "checkpoint") { const result = checkpoint(arg("label", "manual")); console.log(`Token checkpoint: ${arg("label", "manual")} (${result.accuracy})`); }
    else if (command === "report") { const value = report(); console.log(`Token report: ${value.accuracy}, calls=${value.callMetrics.model_calls}`); }
    else throw new Error("usage: token-ledger.js start|attach-thread|checkpoint --label <gate>|report [--root-thread <id>]");
  } catch (error) { console.error(error.message); process.exit(1); }
}
module.exports = { start, attachThread, checkpoint, report, loadLedger, snapshotForLedger, runDelta, rotationAttachError, validateRootThread, gate0FreshTaskError };
