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
    const sourceModules = path.join(SOURCE, "node_modules");
    const sharedEnv = {
      ...process.env,
      NODE_PATH: fs.existsSync(sourceModules) ? sourceModules : (process.env.NODE_PATH || ""),
      CODEX_SESSIONS_ROOT: sessions
    };
    expectBlocked(run(staleRoot, [path.join(staleRoot, "tools", "workflow-gate.js"), "init", "review"], { ...sharedEnv, CODEX_THREAD_ID: staleId }), /FRESH TASK REQUIRED/, "Gate 0 on an over-limit existing task");

    ["workflow-receipt.json", path.join("state", "token-ledger.json"), path.join("state", "context-rotation-lock.json")].forEach(rel => fs.rmSync(path.join(root, rel), { force: true }));
    const oldFile = path.join(sessions, `rollout-${oldId}.jsonl`);
    rollout(oldFile, oldId, "2026-01-01T00:00:00.000Z", root, [row("2026-01-01T00:00:01.000Z", 1000, 1000)]);
    const baseEnv = { ...sharedEnv, CODEX_THREAD_ID: oldId };
    let result = run(root, [path.join(root, "tools", "workflow-gate.js"), "init", "review"], baseEnv);
    assert.equal(result.status, 0, `Gate 0 failed: ${result.output}`);
    const workflowRunId = readJson(path.join(root, "workflow-receipt.json")).runId;
    fs.mkdirSync(path.join(root, "source", "conversations"), { recursive: true });
    fs.writeFileSync(path.join(root, "source", "conversations", "blackbox.md"), "User requires the approved black-box workflow scope.\n", "utf8");
    fs.writeFileSync(path.join(root, "brief.md"), "# Brief\nTest the protected workflow.\n", "utf8");
    fs.writeFileSync(path.join(root, "outline.md"), "# Outline\np01 protected workflow\n", "utf8");
    result = run(root, [
      path.join(root, "tools", "requirements-trace.js"), "init",
      "--source-task", oldId,
      "--source-snapshot", "source/conversations/blackbox.md",
      "--source-id", "src-blackbox"
    ], baseEnv);
    assert.equal(result.status, 0, `requirements trace init failed: ${result.output}`);
    const requirementsContractFile = path.join(root, "state", "requirements-contract.json");
    const requirementsContract = readJson(requirementsContractFile);
    requirementsContract.requirements = [{
      id: "req-blackbox",
      text: "Preserve and test the approved hard-gate workflow scope.",
      category: "constraint",
      priority: "must",
      sourceIds: ["src-blackbox"],
      disposition: "active",
      plannedTargets: ["deck"],
      acceptance: "Protected workflow commands remain fail closed."
    }];
    writeJson(requirementsContractFile, requirementsContract);
    result = run(root, [path.join(root, "tools", "requirements-trace.js"), "seal"], baseEnv);
    assert.equal(result.status, 0, `requirements trace seal failed: ${result.output}`);
    for (const checkpoint of ["plan", "designTermsState", "theme", "layoutBlueprint", "anchorSample", "productionMode"]) {
      const artifact = checkpoint === "plan"
        ? requirementsContractFile
        : path.join(root, "state", "approval-artifacts", `${checkpoint}.txt`);
      const message = path.join(root, "state", "approval-messages", `${checkpoint}.txt`);
      const approvalReceipt = path.join(root, "state", "approval-receipts", `${checkpoint}.json`);
      fs.mkdirSync(path.dirname(artifact), { recursive: true });
      fs.mkdirSync(path.dirname(message), { recursive: true });
      if (checkpoint !== "plan") fs.writeFileSync(artifact, `approved ${checkpoint}\n`, "utf8");
      fs.writeFileSync(message, `User approved ${checkpoint}.\n`, "utf8");
      result = run(root, [
        path.join(root, "tools", "approval-receipt.js"), "create",
        "--checkpoint", checkpoint,
        "--run-id", workflowRunId,
        "--thread-id", oldId,
        "--message-id", `message-${checkpoint}`,
        "--message-file", message,
        "--artifact", path.relative(root, artifact),
        "--summary", `Black-box approval for ${checkpoint}.`,
        "--out", path.relative(root, approvalReceipt)
      ], baseEnv);
      assert.equal(result.status, 0, `${checkpoint} receipt creation failed: ${result.output}`);
      result = run(root, [
        path.join(root, "tools", "workflow-gate.js"), "approve", checkpoint,
        ...(checkpoint === "productionMode" ? ["B"] : []),
        "--receipt", path.relative(root, approvalReceipt),
        "--note", "blackbox"
      ], baseEnv);
      assert.equal(result.status, 0, `${checkpoint} approval failed: ${result.output}`);
    }
    // Budget / rotation / active-task-binding scenarios retired for single-task mode.
    // This test now covers what stays unchanged: Gate 0 rejecting a broken/heavy baseline
    // (above) and the full user-approval checkpoint contract (all six approved via receipts).
    console.log("PASS hard Gate adversarial black-box self-test");
  } finally {
    if (path.dirname(temp) === path.resolve(os.tmpdir())) fs.rmSync(temp, { recursive: true, force: true });
  }
}
if (require.main === module) { try { selfTest(); } catch (error) { console.error(error.message); process.exit(1); } }
module.exports = { selfTest };
