// Adversarial process-level smoke test for the context-rotation hard Gate.
const fs = require("fs");
const os = require("os");
const path = require("path");
const cp = require("child_process");
const assert = require("assert");

const SOURCE = path.join(__dirname, "..");
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8"); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); }
function usage(input) { return { input_tokens: input, cached_input_tokens: 0, output_tokens: 10, reasoning_output_tokens: 0, total_tokens: input + 10 }; }
function row(timestamp, last, total) { return JSON.stringify({ timestamp, type: "event_msg", payload: { info: { last_token_usage: usage(last), total_token_usage: usage(total) } } }); }
function rollout(file, id, createdAt, cwd, calls = []) {
  const meta = JSON.stringify({ timestamp: createdAt, type: "session_meta", payload: { id, session_id: id, thread_source: "user", cwd, timestamp: createdAt } });
  fs.writeFileSync(file, [meta, ...calls].join("\n") + "\n", "utf8");
}
function run(root, args, env) {
  const result = cp.spawnSync(process.execPath, args, { cwd: root, env, encoding: "utf8" });
  return { status: result.status, output: `${result.stdout || ""}${result.stderr || ""}`.trim() };
}
function expectBlocked(result, pattern, label) {
  assert.notEqual(result.status, 0, `${label} unexpectedly succeeded`);
  assert(pattern.test(result.output), `${label} failed for the wrong reason: ${result.output}`);
}
function selfTest() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "leander-hard-gate-blackbox-"));
  const root = path.join(temp, "scaffold"), sessions = path.join(temp, "sessions");
  const oldId = "root-old", historicalId = "root-historical", freshId = "root-fresh", staleId = "root-stale";
  try {
    fs.cpSync(SOURCE, root, { recursive: true, filter: source => path.basename(source) !== "node_modules" });
    fs.mkdirSync(sessions, { recursive: true });
    const staleRoot = path.join(temp, "stale-scaffold");
    fs.cpSync(SOURCE, staleRoot, { recursive: true, filter: source => path.basename(source) !== "node_modules" });
    ["workflow-receipt.json", path.join("state", "token-ledger.json"), path.join("state", "context-rotation-lock.json")].forEach(rel => fs.rmSync(path.join(staleRoot, rel), { force: true }));
    rollout(path.join(sessions, `rollout-${staleId}.jsonl`), staleId, "2026-01-01T00:00:00.000Z", staleRoot, [row("2026-01-01T00:00:01.000Z", 190000, 190000)]);
    const sharedEnv = { ...process.env, NODE_PATH: path.join(SOURCE, "node_modules"), CODEX_SESSIONS_ROOT: sessions };
    expectBlocked(run(staleRoot, [path.join(staleRoot, "tools", "workflow-gate.js"), "init", "review"], { ...sharedEnv, CODEX_THREAD_ID: staleId }), /FRESH TASK REQUIRED/, "Gate 0 on an over-limit existing task");

    ["workflow-receipt.json", path.join("state", "token-ledger.json"), path.join("state", "context-rotation-lock.json")].forEach(rel => fs.rmSync(path.join(root, rel), { force: true }));
    const oldFile = path.join(sessions, `rollout-${oldId}.jsonl`);
    rollout(oldFile, oldId, "2026-01-01T00:00:00.000Z", root, [row("2026-01-01T00:00:01.000Z", 1000, 1000)]);
    const baseEnv = { ...sharedEnv, CODEX_THREAD_ID: oldId };
    let result = run(root, [path.join(root, "tools", "workflow-gate.js"), "init", "review"], baseEnv);
    assert.equal(result.status, 0, `Gate 0 failed: ${result.output}`);
    for (const checkpoint of ["plan", "designTermsState", "theme", "layoutBlueprint"]) {
      result = run(root, [path.join(root, "tools", "workflow-gate.js"), "approve", checkpoint, "--note", "blackbox"], baseEnv);
      assert.equal(result.status, 0, `${checkpoint} approval failed: ${result.output}`);
    }
    const configFile = path.join(root, "deck.config.js");
    fs.writeFileSync(configFile, fs.readFileSync(configFile, "utf8").replace('stage: "outline-reset"', 'stage: "anchor-sample"'), "utf8");
    fs.appendFileSync(oldFile, row("2026-01-01T00:00:06.000Z", 190000, 191000) + "\n", "utf8");

    result = run(root, [path.join(root, "tools", "deck.js"), "render"], baseEnv);
    expectBlocked(result, /CONTEXT ROTATION REQUIRED/, "direct deck render over budget");
    const lock = readJson(path.join(root, "state", "context-rotation-lock.json"));
    assert.equal(lock.status, "pending", "direct deck render did not create a pending lock");
    assert.equal(lock.gateLabel, "deck-render", "direct deck render used the wrong lock label");

    expectBlocked(run(root, [path.join(root, "tools", "deck.js"), "verify"], baseEnv), /CONTEXT ROTATION REQUIRED/, "verify while pending");
    expectBlocked(run(root, [path.join(root, "tools", "deck.js"), "build", "--draft"], baseEnv), /CONTEXT ROTATION REQUIRED/, "draft build while pending");
    expectBlocked(run(root, [path.join(root, "tools", "run-phase.js"), "prepare-pages"], baseEnv), /CONTEXT ROTATION REQUIRED/, "phase while pending");
    expectBlocked(run(root, [path.join(root, "tools", "workflow-gate.js"), "approve", "anchorSample", "--note", "blocked"], baseEnv), /CONTEXT ROTATION REQUIRED/, "approval while pending");
    expectBlocked(run(root, [path.join(root, "tools", "token-ledger.js"), "attach-thread"], baseEnv), /fresh Codex root task/, "old task reattach");

    rollout(path.join(sessions, `rollout-${historicalId}.jsonl`), historicalId, "2026-01-01T00:00:02.000Z", root, [row("2026-01-01T00:00:03.000Z", 500, 500)]);
    expectBlocked(run(root, [path.join(root, "tools", "token-ledger.js"), "attach-thread"], { ...baseEnv, CODEX_THREAD_ID: historicalId }), /created after the rotation lock/, "historical real task attach");

    const future = new Date(Date.now() + 60000).toISOString();
    const freshFile = path.join(sessions, `rollout-${freshId}.jsonl`);
    rollout(freshFile, freshId, future, root, [row(new Date(Date.now() + 61000).toISOString(), 500, 500)]);
    result = run(root, [path.join(root, "tools", "token-ledger.js"), "attach-thread"], { ...baseEnv, CODEX_THREAD_ID: freshId });
    assert.equal(result.status, 0, `fresh task could not attach: ${result.output}`);
    expectBlocked(run(root, [path.join(root, "tools", "context-budget-gate.js"), "--enforce"], baseEnv), /INACTIVE TASK BLOCKED/, "old task return after fresh attach");
    result = run(root, [path.join(root, "tools", "context-budget-gate.js"), "--enforce-budget", "--gate", "fresh-check"], { ...baseEnv, CODEX_THREAD_ID: freshId });
    assert.equal(result.status, 0, `fresh active task was blocked: ${result.output}`);
    fs.rmSync(freshFile, { force: true });
    expectBlocked(run(root, [path.join(root, "tools", "context-budget-gate.js"), "--enforce-budget", "--gate", "missing-active-rollout"], { ...baseEnv, CODEX_THREAD_ID: freshId }), /TOKEN OBSERVABILITY REQUIRED/, "missing active-root rollout");
    console.log("PASS hard Gate adversarial black-box self-test");
  } finally {
    if (path.dirname(temp) === path.resolve(os.tmpdir())) fs.rmSync(temp, { recursive: true, force: true });
  }
}
if (require.main === module) { try { selfTest(); } catch (error) { console.error(error.message); process.exit(1); } }
module.exports = { selfTest };
