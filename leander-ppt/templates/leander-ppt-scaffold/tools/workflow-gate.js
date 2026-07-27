// Mandatory workflow entry and stage gate for every Leander deck.
// Usage:
//   node tools/workflow-gate.js init [create|redesign|review]
//   node tools/workflow-gate.js migrate <outline|blueprint|anchor|production> --note "user confirmation" --receipt-dir <dir> --run-id <id>
//   node tools/workflow-gate.js status
//   node tools/workflow-gate.js approve <checkpoint> [mode] --receipt <file> [--note "user confirmation"]
//   node tools/workflow-gate.js verify anchor|production|final
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const cp = require("child_process");
const { verifyFile: verifyApprovalFile, shaFile: shaApprovalFile } = require("./approval-receipt");

const ROOT = path.join(__dirname, "..");
const RECEIPT = path.join(ROOT, "workflow-receipt.json");
const CHECKPOINTS = path.join(ROOT, "checkpoint-status.json");

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}
function bestEffort(script, args = []) {
  const result = cp.spawnSync(process.execPath, [path.join(__dirname, script), ...args], { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 0) console.warn(`NOTICE ${script} unavailable; workflow quality gate continues and usage will be marked incomplete/estimated.`);
}
function requiredStep(script, args = []) {
  const result = cp.spawnSync(process.execPath, [path.join(__dirname, script), ...args], { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 0) {
    console.error((result.stderr || result.stdout || `${script} failed.`).trim());
    process.exit(result.status || 1);
  }
}
function enforceContextRotation() {
  const result = cp.spawnSync(process.execPath, [path.join(__dirname, "context-budget-gate.js"), "--enforce"], { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 0) {
    console.error((result.stderr || result.stdout || "Context rotation is required before continuing.").trim());
    process.exit(result.status || 2);
  }
}
function contextBudgetAtGate(label) {
  const result = cp.spawnSync(process.execPath, [path.join(__dirname, "context-budget-gate.js"), "--lock", "--gate", label], { cwd: ROOT, encoding: "utf8" });
  const message = (result.stdout || result.stderr || "").trim();
  if (message) console.warn(message);
  if (result.status !== 0 && result.status !== 2) console.warn("NOTICE context budget gate unavailable; usage will be marked incomplete/estimated.");
}
function gateTelemetry(label, final = false) {
  bestEffort("token-ledger.js", ["checkpoint", "--label", label]);
  contextBudgetAtGate(label);
  bestEffort("phase-handoff.js", ["write"]);
  if (final) bestEffort("token-ledger.js", ["report"]);
}

function initialize(intent) {
  const existingReceipt = readJson(RECEIPT, null);
  const existingPages = fs.existsSync(path.join(ROOT, "pages"))
    ? fs.readdirSync(path.join(ROOT, "pages"), { withFileTypes: true }).filter(entry => entry.isDirectory()).length
    : 0;
  const existingOutputDeck = fs.existsSync(path.join(ROOT, "output"))
    && fs.readdirSync(path.join(ROOT, "output")).some(name => name.toLowerCase().endsWith(".pptx"));
  const meaningfulExistingBaseline = Boolean(existingReceipt?.initialized) || existingOutputDeck || existingPages > 2;
  let revisionContract = null;
  if (intent === "redesign" && meaningfulExistingBaseline) {
    requiredStep("revision-mode.js", ["verify", "--intent", "redesign"]);
    revisionContract = readJson(path.join(ROOT, "state", "revision-contract.json"), null);
  }
  // A verified delta-revision carries prior user approvals forward instead of re-walking the
  // whole create pipeline. Only `plan` reopens, because the revision SCOPE (the verified pageMap)
  // is the one thing the user must re-confirm. full-rebuild and first-time create still reset all.
  const deltaCarry = Boolean(revisionContract && revisionContract.mode === "delta-revision" && existingReceipt?.initialized);
  const now = new Date().toISOString();
  const receipt = {
    version: "leander-workflow-receipt.v1",
    initialized: true,
    runId: `${now.replace(/[-:.TZ]/g, "").slice(0, 14)}-${crypto.randomBytes(4).toString("hex")}`,
    intent: deltaCarry ? "delta-revision" : (intent || "create"),
    createdAt: now,
    lastVerifiedAt: null
  };
  if (deltaCarry) {
    receipt.carriedFromRunId = existingReceipt.runId;
    receipt.revisionContractAt = revisionContract.createdAt || now;
  }
  const checkpoints = planCheckpointTransition(
    readJson(CHECKPOINTS, { version: "checkpoint-status.v1", checkpoints: {} }),
    { deltaCarry, newRunId: receipt.runId, fromRunId: existingReceipt?.runId, now });
  requiredStep("token-ledger.js", ["start", "--run-id", receipt.runId]);
  writeJson(RECEIPT, receipt);
  writeJson(CHECKPOINTS, checkpoints);
  bestEffort("requirements-trace.js", ["init"]);
  // Delta reuses the existing portfolio; a full reset re-plans it. (R3 will add a 1-job revision plan.)
  if (!deltaCarry) bestEffort("task-portfolio.js", ["create", "--force"]);
  bestEffort("tool-freeze.js", ["capture", "gate0"]);
  bestEffort("phase-handoff.js", ["write"]);
  if (deltaCarry) {
    const carried = checkpointOrder.filter(key => checkpoints.checkpoints?.[key]?.carriedFromRunId);
    console.log(`Leander Gate 0 (delta-revision) initialized: ${receipt.runId}`);
    console.log(`Carried forward from ${existingReceipt.runId}: ${carried.join(", ") || "(none approved yet)"}.`);
    console.log("Reopened `plan` only — confirm the revision scope (state/revision-contract.json pageMap), then patch just the changed pages.");
  } else {
    console.log(`Leander Gate 0 initialized: ${receipt.runId}`);
    console.log("Next required checkpoint: brief + page-by-page outline, then explicit user approval of `plan`.");
  }
}

function migrateExisting(stage, note, receiptDir, explicitRunId) {
  if (stage === "final") {
    console.error("Direct migration to final is forbidden; migrate at outline/blueprint/anchor and re-run final gates.");
    process.exit(1);
  }
  if (!note || !receiptDir || !explicitRunId) {
    console.error("Migration requires --note, --receipt-dir and --run-id so each migrated checkpoint is bound to an approval receipt.");
    process.exit(1);
  }
  const stageKeys = {
    outline: ["plan"],
    blueprint: ["plan", "designTermsState", "theme", "layoutBlueprint"],
    anchor: ["plan", "designTermsState", "theme", "layoutBlueprint", "anchorSample"],
    production: checkpointOrder,
    final: checkpointOrder
  };
  if (!stageKeys[stage]) {
    console.error("Migration stage must be outline, blueprint, anchor, production, or final.");
    process.exit(1);
  }
  const existing = readJson(RECEIPT, null);
  if (existing && existing.initialized) {
    console.error("Project already has an initialized workflow receipt; use status/approve instead of migrate.");
    process.exit(1);
  }
  const now = new Date().toISOString();
  const receipt = {
    version: "leander-workflow-receipt.v1",
    initialized: true,
    runId: explicitRunId,
    intent: "migrated-existing-project",
    createdAt: now,
    migratedStage: stage,
    migrationNote: note,
    lastVerifiedAt: null
  };
  const data = readJson(CHECKPOINTS, { version: "checkpoint-status.v1", checkpoints: {} });
  checkpointOrder.forEach(key => {
    const item = data.checkpoints[key] || {};
    if (stageKeys[stage].includes(key)) {
      const approvalFile = path.resolve(ROOT, receiptDir, `${key}.json`);
      const checked = verifyApprovalFile(approvalFile, { root: ROOT, checkpoint: key, runId: receipt.runId });
      if (!checked.ok) {
        console.error(`Migration approval receipt failed for ${key}: ${checked.errors.join("; ")}`);
        process.exit(1);
      }
      item.status = "approved";
      item.approvedAt = now;
      item.approvedBy = "explicit-existing-project-migration";
      item.runId = receipt.runId;
      item.approvalNote = note;
      item.approvalReceipt = path.relative(ROOT, approvalFile).replace(/\\/g, "/");
      item.approvalReceiptSha256 = checked.sha256;
      item.approvalReceiptRunId = receipt.runId;
      if (key === "productionMode" && !["A", "B", "C"].includes(item.mode)) item.mode = "B";
    } else {
      item.status = "pending";
      delete item.approvedAt;
      delete item.approvedBy;
      delete item.runId;
      delete item.approvalNote;
    }
    data.checkpoints[key] = item;
  });
  writeJson(RECEIPT, receipt);
  writeJson(CHECKPOINTS, data);
  console.log(`Migrated existing Leander project at ${stage}: ${receipt.runId}`);
}

function loadReceipt() {
  const receipt = readJson(RECEIPT, null);
  if (!receipt || receipt.version !== "leander-workflow-receipt.v1" || receipt.initialized !== true || !receipt.runId) {
    console.error("LEANDER GATE 0 FAILED: this project has no valid workflow receipt.");
    console.error("Run `node tools/workflow-gate.js init create` before producing, rendering, or building slides.");
    process.exit(1);
  }
  return receipt;
}

function approved(key, item, receipt, allowBypass = false) {
  if (item && item.status === "approved" && item.approvedAt && item.runId === receipt.runId) {
    const approvalFile = path.resolve(ROOT, item.approvalReceipt || "");
    const approvalRunId = item.approvalReceiptRunId || receipt.runId;
    const checked = verifyApprovalFile(approvalFile, { root: ROOT, checkpoint: key, runId: approvalRunId });
    if (checked.ok && checked.sha256 === item.approvalReceiptSha256) return true;
  }
  return !!(allowBypass && item && item.status === "bypassed" && item.reason);
}

const checkpointOrder = ["plan", "designTermsState", "theme", "layoutBlueprint", "anchorSample", "productionMode"];

// Decide which checkpoints carry forward vs reset on init. Pure + deterministic so the
// regression suite can assert it without spawning child processes. On a delta-revision only
// `plan` reopens; carried checkpoints are re-stamped under the new runId (with provenance) so
// approved() accepts them. A full reset (full-rebuild / first create) clears every field.
function planCheckpointTransition(data, { deltaCarry, newRunId, fromRunId, now }) {
  const reopen = new Set(deltaCarry ? ["plan"] : checkpointOrder);
  const out = data && data.checkpoints ? data : { version: "checkpoint-status.v1", checkpoints: {} };
  Object.entries(out.checkpoints).forEach(([key, item]) => {
    const carry = deltaCarry && !reopen.has(key) && item.status === "approved" && item.approvedAt && item.approvalReceipt && item.approvalReceiptSha256;
    if (carry) {
      item.runId = newRunId;
      item.carriedFromRunId = fromRunId;
      item.carriedAt = now;
    } else {
      item.status = "pending";
      ["approvedAt", "approvedBy", "runId", "approvalNote", "approvalReceipt", "approvalReceiptSha256", "approvalReceiptRunId", "reason", "carriedFromRunId", "carriedAt"]
        .forEach(field => delete item[field]);
    }
  });
  return out;
}

function approveCheckpoint(key, value, note, approvalFileArg) {
  enforceContextRotation();
  const receipt = loadReceipt();
  if (!checkpointOrder.includes(key)) {
    console.error(`Unknown checkpoint: ${key}`);
    process.exit(1);
  }
  if (!approvalFileArg) {
    console.error("Approval receipt required: use --receipt state/approval-receipts/<checkpoint>.json.");
    process.exit(1);
  }
  if (key === "productionMode" && !["A", "B", "C"].includes(value)) {
    console.error("productionMode approval requires mode A, B, or C.");
    process.exit(1);
  }
  const data = readJson(CHECKPOINTS, { version: "checkpoint-status.v1", checkpoints: {} });
  const index = checkpointOrder.indexOf(key);
  const missingPrior = checkpointOrder.slice(0, index)
    .filter(prior => !approved(prior, (data.checkpoints || {})[prior], receipt, false));
  if (missingPrior.length) {
    console.error(`Cannot approve ${key}; earlier checkpoints are pending: ${missingPrior.join(", ")}`);
    process.exit(1);
  }
  const approvalFile = path.resolve(ROOT, approvalFileArg);
  const checked = verifyApprovalFile(approvalFile, { root: ROOT, checkpoint: key, runId: receipt.runId });
  if (!checked.ok) {
    console.error(`Approval receipt failed: ${checked.errors.join("; ")}`);
    process.exit(1);
  }
  if (key === "plan") {
    requiredStep("requirements-trace.js", ["verify", "--stage", "plan"]);
    if (String(checked.receipt?.artifact?.path || "").replace(/\\/g, "/") !== "state/requirements-contract.json") {
      console.error("Plan approval must bind state/requirements-contract.json so original goals, scope decisions, outline mapping and source snapshots are approved together.");
      process.exit(1);
    }
  }
  const item = data.checkpoints[key] || {};
  item.status = "approved";
  item.approvedAt = new Date().toISOString();
  item.approvedBy = "explicit-user-confirmation";
  item.runId = receipt.runId;
  item.approvalNote = note || checked.receipt.summary;
  item.approvalReceipt = path.relative(ROOT, approvalFile).replace(/\\/g, "/");
  item.approvalReceiptSha256 = checked.sha256;
  item.approvalReceiptRunId = receipt.runId;
  if (key === "productionMode") item.mode = value;
  data.checkpoints[key] = item;
  writeJson(CHECKPOINTS, data);
  gateTelemetry(`gate-${key}`);
  console.log(`Approved ${key} for run ${receipt.runId}${value ? ` (${value})` : ""}.`);
}

const requirements = {
  anchor: ["plan", "designTermsState", "theme", "layoutBlueprint"],
  production: ["plan", "designTermsState", "theme", "layoutBlueprint", "anchorSample", "productionMode"],
  final: ["plan", "designTermsState", "theme", "layoutBlueprint", "anchorSample", "productionMode"]
};

function enforceRequirementsTrace(target, data, receipt) {
  const stage = target === "anchor" ? "anchor" : target === "production" ? "production" : "final";
  requiredStep("requirements-trace.js", ["verify", "--stage", stage]);
  const plan = data.checkpoints?.plan;
  const approvalFile = path.resolve(ROOT, plan?.approvalReceipt || "");
  const approvalRunId = plan?.approvalReceiptRunId || receipt.runId;
  const checked = verifyApprovalFile(approvalFile, { root: ROOT, checkpoint: "plan", runId: approvalRunId });
  if (!checked.ok || String(checked.receipt?.artifact?.path || "").replace(/\\/g, "/") !== "state/requirements-contract.json") {
    console.error("LEANDER REQUIREMENTS GATE FAILED: plan approval is not bound to the current requirements contract.");
    console.error("Reopen plan, present the requirements-to-page trace to the user, and approve state/requirements-contract.json with a new receipt.");
    process.exit(1);
  }
}

function verify(target) {
  enforceContextRotation();
  const receipt = loadReceipt();
  const required = requirements[target];
  if (!required) {
    console.error("usage: node tools/workflow-gate.js init [intent]|status|verify anchor|production|final");
    process.exit(1);
  }
  const data = readJson(CHECKPOINTS, { checkpoints: {} });
  const missing = required.filter(key => !approved(key, (data.checkpoints || {})[key], receipt, false));
  if (missing.length) {
    console.error(`LEANDER ${target.toUpperCase()} GATE FAILED: ${missing.join(", ")} not approved.`);
    console.error("Stop at the current checkpoint, present the user-facing artifact, and obtain explicit approval.");
    process.exit(1);
  }
  enforceRequirementsTrace(target, data, receipt);
  receipt.lastVerifiedAt = new Date().toISOString();
  receipt.lastVerifiedTarget = target;
  writeJson(RECEIPT, receipt);
  if (target === "final") gateTelemetry("gate-final", true);
  console.log(`Leander workflow gate OK: ${target} (${receipt.runId})`);
}

function status() {
  const receipt = readJson(RECEIPT, null);
  const cps = readJson(CHECKPOINTS, { checkpoints: {} }).checkpoints || {};
  console.log(`Gate 0: ${receipt && receipt.initialized ? "initialized " + receipt.runId : "missing"}`);
  ["plan", "designTermsState", "theme", "layoutBlueprint", "anchorSample", "productionMode"]
    .forEach(key => console.log(`  - ${key}: ${(cps[key] && cps[key].status) || "missing"}`));
  bestEffort("task-portfolio.js", ["status"]);
}

function selfTest() {
  const assert = require("assert");
  const base = () => ({
    version: "checkpoint-status.v1",
    checkpoints: {
      plan: { status: "approved", approvedAt: "t0", approvedBy: "u", runId: "OLD", approvalNote: "n", approvalReceipt: "state/approval-receipts/plan.json", approvalReceiptSha256: "a".repeat(64), approvalReceiptRunId: "OLD" },
      designTermsState: { status: "approved", approvedAt: "t0", runId: "OLD", approvalReceipt: "state/approval-receipts/designTermsState.json", approvalReceiptSha256: "a".repeat(64), approvalReceiptRunId: "OLD" },
      theme: { status: "approved", approvedAt: "t0", runId: "OLD", approvalReceipt: "state/approval-receipts/theme.json", approvalReceiptSha256: "a".repeat(64), approvalReceiptRunId: "OLD" },
      layoutBlueprint: { status: "approved", approvedAt: "t0", runId: "OLD", approvalReceipt: "state/approval-receipts/layoutBlueprint.json", approvalReceiptSha256: "a".repeat(64), approvalReceiptRunId: "OLD" },
      anchorSample: { status: "approved", approvedAt: "t0", runId: "OLD", approvalReceipt: "state/approval-receipts/anchorSample.json", approvalReceiptSha256: "a".repeat(64), approvalReceiptRunId: "OLD" },
      productionMode: { status: "approved", approvedAt: "t0", runId: "OLD", mode: "B", approvalReceipt: "state/approval-receipts/productionMode.json", approvalReceiptSha256: "a".repeat(64), approvalReceiptRunId: "OLD" }
    }
  });
  // delta-revision: downstream approvals carry forward re-stamped; only `plan` reopens.
  const carried = planCheckpointTransition(base(), { deltaCarry: true, newRunId: "NEW", fromRunId: "OLD", now: "t1" });
  assert.equal(carried.checkpoints.plan.status, "pending", "delta must reopen plan");
  ["designTermsState", "theme", "layoutBlueprint", "anchorSample", "productionMode"].forEach(key => {
    assert.equal(carried.checkpoints[key].status, "approved", `delta must carry ${key}`);
    assert.equal(carried.checkpoints[key].runId, "NEW", `carried ${key} must be re-stamped under the new runId`);
    assert.equal(carried.checkpoints[key].carriedFromRunId, "OLD", `carried ${key} must record provenance`);
  });
  assert.equal(carried.checkpoints.productionMode.mode, "B", "carried productionMode keeps its mode");
  // full reset (full-rebuild / first create): nothing carries.
  const reset = planCheckpointTransition(base(), { deltaCarry: false, newRunId: "NEW", fromRunId: "OLD", now: "t1" });
  checkpointOrder.forEach(key => {
    assert.equal(reset.checkpoints[key].status, "pending", `reset must clear ${key}`);
    assert.equal(reset.checkpoints[key].runId, undefined, `reset must strip ${key} runId`);
    assert.equal(reset.checkpoints[key].carriedFromRunId, undefined, `reset must not add provenance to ${key}`);
  });
  console.log("PASS workflow-gate carry-forward self-test");
}

if (process.argv.includes("--self-test")) selfTest();
else {
  const command = process.argv[2] || "status";
  if (command === "init") initialize(process.argv[3]);
  else if (command === "migrate") {
    const noteIndex = process.argv.indexOf("--note");
    const receiptIndex = process.argv.indexOf("--receipt-dir");
    const runIndex = process.argv.indexOf("--run-id");
    migrateExisting(
      process.argv[3],
      noteIndex >= 0 ? process.argv[noteIndex + 1] : "",
      receiptIndex >= 0 ? process.argv[receiptIndex + 1] : "",
      runIndex >= 0 ? process.argv[runIndex + 1] : ""
    );
  }
  else if (command === "status") status();
  else if (command === "approve") {
    const key = process.argv[3];
    const value = key === "productionMode" ? process.argv[4] : "";
    const noteIndex = process.argv.indexOf("--note");
    const receiptIndex = process.argv.indexOf("--receipt");
    approveCheckpoint(key, value, noteIndex >= 0 ? process.argv[noteIndex + 1] : "", receiptIndex >= 0 ? process.argv[receiptIndex + 1] : "");
  }
  else if (command === "verify") verify(process.argv[3]);
  else {
    console.error("usage: node tools/workflow-gate.js init [intent]|migrate <stage> --note <text> --receipt-dir <dir> --run-id <id>|status|approve <checkpoint> [mode] --receipt <file> [--note <text>]|verify anchor|production|final");
    process.exit(1);
  }
}
