// Read actual Codex token usage from local rollout JSONL files.
// The parser uses the latest cumulative usage per rollout and never sums
// cumulative events within the same file.
const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");

const FIELDS = ["input_tokens", "cached_input_tokens", "non_cached_input", "output_tokens", "reasoning_output_tokens", "total_tokens"];

function emptyUsage(value = 0) {
  return Object.fromEntries(FIELDS.map(field => [field, value]));
}
function normalizeUsage(value = {}) {
  const input = Number(value.input_tokens || 0);
  const cached = Number(value.cached_input_tokens || 0);
  return {
    input_tokens: input,
    cached_input_tokens: cached,
    non_cached_input: Math.max(0, input - cached),
    output_tokens: Number(value.output_tokens || 0),
    reasoning_output_tokens: Number(value.reasoning_output_tokens || 0),
    total_tokens: Number(value.total_tokens || 0)
  };
}
function addUsage(left, right) {
  return Object.fromEntries(FIELDS.map(field => [field, Number(left?.[field] || 0) + Number(right?.[field] || 0)]));
}
function usageDelta(after, before) {
  return Object.fromEntries(FIELDS.map(field => [field, Math.max(0, Number(after?.[field] || 0) - Number(before?.[field] || 0))]));
}
function defaultSessionsRoot() {
  return process.env.CODEX_SESSIONS_ROOT || path.join(process.env.CODEX_HOME || path.join(os.homedir(), ".codex"), "sessions");
}
function listJsonl(root, since = "") {
  if (!fs.existsSync(root)) return [];
  const floor = since ? new Date(since).getTime() - 3600000 : 0;
  const out = [], stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(target);
      else if (/\.jsonl$/i.test(entry.name) && (!floor || fs.statSync(target).mtimeMs >= floor)) out.push(target);
    }
  }
  return out;
}
function firstJsonlRow(file) {
  const fd = fs.openSync(file, "r"), buffer = Buffer.alloc(256 * 1024);
  try { const bytes = fs.readSync(fd, buffer, 0, buffer.length, 0), text = buffer.subarray(0, bytes).toString("utf8"), end = text.indexOf("\n"); return JSON.parse(end >= 0 ? text.slice(0, end) : text); }
  finally { fs.closeSync(fd); }
}
function scanRollout(file) {
  let meta = null, latest = null;
  const calls = [];
  let compactions = 0;
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let row;
    try { row = JSON.parse(line); } catch { continue; }
    if (!meta && row.type === "session_meta") meta = row.payload || {};
    if (row.type === "compaction") compactions += 1;
    const info = row.payload?.info;
    if (info?.last_token_usage) calls.push({ timestamp: row.timestamp || "", ...normalizeUsage(info.last_token_usage) });
    if (info?.total_token_usage) latest = normalizeUsage(info.total_token_usage);
  }
  return {
    file,
    rolloutId: String(meta?.id || path.basename(file, ".jsonl")),
    sessionId: String(meta?.session_id || meta?.id || ""),
    parentThreadId: String(meta?.parent_thread_id || ""),
    threadSource: String(meta?.thread_source || ""),
    agentNickname: String(meta?.agent_nickname || ""),
    agentRole: String(meta?.agent_role || ""),
    cwd: String(meta?.cwd || ""),
    createdAt: String(meta?.timestamp || ""),
    latest,
    calls,
    compactions
  };
}
function discoverCurrentRootThread({ sessionsRoot = defaultSessionsRoot(), projectRoot = process.cwd(), maxAgeMs = 10 * 60 * 1000 } = {}) {
  const now = Date.now(), project = path.resolve(projectRoot).toLowerCase();
  const candidates = listJsonl(sessionsRoot).map(file => {
    try {
      const row = firstJsonlRow(file), meta = row.type === "session_meta" ? row.payload || {} : {};
      const cwd = meta.cwd ? path.resolve(meta.cwd).toLowerCase() : "", mtime = fs.statSync(file).mtimeMs;
      const related = cwd && (project === cwd || project.startsWith(cwd + path.sep) || cwd.startsWith(project + path.sep));
      return related && now - mtime <= maxAgeMs && String(meta.thread_source || "user") === "user" ? { threadId: String(meta.id || meta.session_id || ""), file, mtime, cwd } : null;
    } catch { return null; }
  }).filter(item => item?.threadId).sort((a, b) => b.mtime - a.mtime);
  if (!candidates.length) return { threadId: "", accuracy: "unavailable", reason: "no recent user rollout matched the project cwd" };
  return { threadId: candidates[0].threadId, accuracy: "inferred", source: candidates[0].file, reason: candidates.length > 1 ? "selected the most recently written matching user rollout" : "unique recent matching user rollout" };
}
function dedupeByThreadAndRollout(records) {
  const map = new Map();
  for (const record of records) {
    const key = record.rolloutId || record.file;
    const previous = map.get(key);
    if (!previous || record.calls.length >= previous.calls.length) map.set(key, record);
  }
  return [...map.values()];
}
function discoverRollouts({ sessionsRoot = defaultSessionsRoot(), rootThreadIds = [], since = "" } = {}) {
  const roots = new Set(rootThreadIds.filter(Boolean).map(String));
  const scanned = dedupeByThreadAndRollout(listJsonl(sessionsRoot, since).map(file => {
    try { return scanRollout(file); } catch { return null; }
  }).filter(Boolean));
  const selected = new Set();
  scanned.forEach(record => {
    if (roots.has(record.rolloutId) || roots.has(record.sessionId)) selected.add(record.rolloutId);
  });
  let changed = true;
  while (changed) {
    changed = false;
    scanned.forEach(record => {
      if (!selected.has(record.rolloutId) && record.parentThreadId && (roots.has(record.parentThreadId) || selected.has(record.parentThreadId))) {
        selected.add(record.rolloutId); changed = true;
      }
    });
  }
  return scanned.filter(record => selected.has(record.rolloutId));
}
function callMetrics(calls) {
  const inputs = calls.map(call => call.input_tokens || 0);
  const cached = calls.map(call => call.cached_input_tokens || 0);
  const percentile = (values, p) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1))];
  };
  const inputTotal = inputs.reduce((a, b) => a + b, 0);
  const cachedTotal = cached.reduce((a, b) => a + b, 0);
  return {
    model_calls: calls.length,
    average_input_tokens: calls.length ? Math.round(inputTotal / calls.length) : 0,
    p95_input_tokens: percentile(inputs, 0.95),
    max_input_tokens: inputs.length ? Math.max(...inputs) : 0,
    average_cached_input_tokens: calls.length ? Math.round(cachedTotal / calls.length) : 0,
    p95_cached_input_tokens: percentile(cached, 0.95),
    cached_input_fraction: inputTotal ? Number((cachedTotal / inputTotal).toFixed(4)) : 0
  };
}
function collectUsage({ sessionsRoot = defaultSessionsRoot(), rootThreadIds = [], since = "", roleByThread = {} } = {}) {
  const records = discoverRollouts({ sessionsRoot, rootThreadIds, since });
  const roots = new Set(rootThreadIds.map(String));
  const usable = records.filter(record => record.latest);
  const totals = usable.reduce((sum, record) => addUsage(sum, record.latest), emptyUsage());
  const calls = usable.flatMap(record => record.calls.map(call => ({ ...call, rolloutId: record.rolloutId })));
  const mapped = usable.map(record => {
    const source = String(record.threadSource || "").toLowerCase();
    const hasSubagentIdentity = source === "subagent" || !!record.parentThreadId || !!record.agentRole || !!record.agentNickname;
    const isMain = roots.has(record.rolloutId) || (!hasSubagentIdentity && roots.has(record.sessionId));
    return {
      rolloutId: record.rolloutId,
      sessionId: record.sessionId,
      parentThreadId: record.parentThreadId,
      threadSource: record.threadSource,
      createdAt: record.createdAt,
      cwd: record.cwd,
      kind: isMain ? "main" : "subagent",
      role: roleByThread[record.rolloutId] || record.agentRole || record.agentNickname || (!hasSubagentIdentity ? roleByThread[record.sessionId] : "") || "",
      usage: record.latest,
      callCount: record.calls.length,
      compactions: record.compactions,
      calls: record.calls,
      file: record.file
    };
  });
  const rootFound = mapped.some(record => record.kind === "main");
  return {
    accuracy: rootFound ? "actual" : "estimated",
    collectedAt: new Date().toISOString(),
    sessionsRoot,
    rootThreadIds: [...roots],
    records: mapped,
    totals,
    callMetrics: callMetrics(calls),
    limitations: rootFound ? [] : ["No readable rollout JSONL was found for the current root thread."],
    sources: mapped.map(record => record.file)
  };
}

function selfTest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "leander-rollout-"));
  const root = path.join(dir, "rollout-root-thread.jsonl");
  const child = path.join(dir, "rollout-worker-thread.jsonl");
  fs.writeFileSync(root, [
    { type: "session_meta", payload: { id: "root-thread", session_id: "root-thread", thread_source: "user" } },
    { type: "event_msg", payload: { info: { last_token_usage: { input_tokens: 100, cached_input_tokens: 60, output_tokens: 10, reasoning_output_tokens: 3, total_tokens: 110 }, total_token_usage: { input_tokens: 100, cached_input_tokens: 60, output_tokens: 10, reasoning_output_tokens: 3, total_tokens: 110 } } } },
    { type: "event_msg", payload: { info: { last_token_usage: { input_tokens: 80, cached_input_tokens: 40, output_tokens: 15, reasoning_output_tokens: 4, total_tokens: 95 }, total_token_usage: { input_tokens: 180, cached_input_tokens: 100, output_tokens: 25, reasoning_output_tokens: 7, total_tokens: 205 } } } }
  ].map(JSON.stringify).join("\n"), "utf8");
  fs.writeFileSync(child, [
    { type: "session_meta", payload: { id: "worker-thread", session_id: "root-thread", parent_thread_id: "root-thread", thread_source: "subagent", agent_role: "reviewer-zh" } },
    { type: "event_msg", payload: { info: { last_token_usage: { input_tokens: 75, cached_input_tokens: 45, output_tokens: 12, reasoning_output_tokens: 4, total_tokens: 87 }, total_token_usage: { input_tokens: 75, cached_input_tokens: 45, output_tokens: 12, reasoning_output_tokens: 4, total_tokens: 87 } } } }
  ].map(JSON.stringify).join("\n"), "utf8");
  const snapshot = collectUsage({ sessionsRoot: dir, rootThreadIds: ["root-thread"] });
  assert.deepStrictEqual(snapshot.totals, { input_tokens: 255, cached_input_tokens: 145, non_cached_input: 110, output_tokens: 37, reasoning_output_tokens: 11, total_tokens: 292 });
  assert.equal(snapshot.records.find(record => record.kind === "subagent").rolloutId, "worker-thread");
  assert.equal(snapshot.records.find(record => record.rolloutId === "worker-thread").role, "reviewer-zh");
  assert.equal(snapshot.callMetrics.model_calls, 3);
  assert.equal(snapshot.callMetrics.p95_input_tokens, 100);
  assert.equal(snapshot.accuracy, "actual");
  fs.rmSync(dir, { recursive: true, force: true });
  console.log("PASS rollout usage self-test");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else console.log(JSON.stringify(collectUsage({ rootThreadIds: [process.env.CODEX_THREAD_ID].filter(Boolean) }), null, 2));
}
module.exports = { FIELDS, emptyUsage, normalizeUsage, addUsage, usageDelta, scanRollout, discoverCurrentRootThread, discoverRollouts, dedupeByThreadAndRollout, callMetrics, collectUsage, selfTest };
