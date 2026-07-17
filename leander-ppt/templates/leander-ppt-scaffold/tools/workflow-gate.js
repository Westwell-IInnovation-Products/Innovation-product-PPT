// Mandatory workflow entry and stage gate for every Leander deck.
// Usage:
//   node tools/workflow-gate.js init [create|redesign|review]
//   node tools/workflow-gate.js migrate <outline|blueprint|anchor|production|final> --note "user confirmation"
//   node tools/workflow-gate.js status
//   node tools/workflow-gate.js approve <checkpoint> [mode] --note "user confirmation"
//   node tools/workflow-gate.js verify anchor|production|final
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const cp = require("child_process");

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
  const now = new Date().toISOString();
  const receipt = {
    version: "leander-workflow-receipt.v1",
    initialized: true,
    runId: `${now.replace(/[-:.TZ]/g, "").slice(0, 14)}-${crypto.randomBytes(4).toString("hex")}`,
    intent: intent || "create",
    createdAt: now,
    lastVerifiedAt: null
  };
  const checkpoints = readJson(CHECKPOINTS, { version: "checkpoint-status.v1", checkpoints: {} });
  Object.values(checkpoints.checkpoints || {}).forEach(item => {
    item.status = "pending";
    delete item.approvedAt;
    delete item.approvedBy;
    delete item.runId;
    delete item.approvalNote;
    delete item.reason;
  });
  requiredStep("token-ledger.js", ["start", "--run-id", receipt.runId]);
  writeJson(RECEIPT, receipt);
  writeJson(CHECKPOINTS, checkpoints);
  bestEffort("tool-freeze.js", ["capture", "gate0"]);
  bestEffort("phase-handoff.js", ["write"]);
  console.log(`Leander Gate 0 initialized: ${receipt.runId}`);
  console.log("Next required checkpoint: brief + page-by-page outline, then explicit user approval of `plan`.");
}

function migrateExisting(stage, note) {
  if (!note) {
    console.error("Migration requires `--note` that records why the existing project state is trusted.");
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
    runId: `${now.replace(/[-:.TZ]/g, "").slice(0, 14)}-${crypto.randomBytes(4).toString("hex")}`,
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
      item.status = "approved";
      item.approvedAt = now;
      item.approvedBy = "explicit-existing-project-migration";
      item.runId = receipt.runId;
      item.approvalNote = note;
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

function approved(item, receipt, allowBypass = false) {
  if (item && item.status === "approved" && item.approvedAt && item.runId === receipt.runId) return true;
  return !!(allowBypass && item && item.status === "bypassed" && item.reason);
}

const checkpointOrder = ["plan", "designTermsState", "theme", "layoutBlueprint", "anchorSample", "productionMode"];

function approveCheckpoint(key, value, note) {
  enforceContextRotation();
  const receipt = loadReceipt();
  if (!checkpointOrder.includes(key)) {
    console.error(`Unknown checkpoint: ${key}`);
    process.exit(1);
  }
  if (!note) {
    console.error("Approval requires `--note` that identifies the user's explicit confirmation.");
    process.exit(1);
  }
  if (key === "productionMode" && !["A", "B", "C"].includes(value)) {
    console.error("productionMode approval requires mode A, B, or C.");
    process.exit(1);
  }
  const data = readJson(CHECKPOINTS, { version: "checkpoint-status.v1", checkpoints: {} });
  const index = checkpointOrder.indexOf(key);
  const missingPrior = checkpointOrder.slice(0, index)
    .filter(prior => !approved((data.checkpoints || {})[prior], receipt, false));
  if (missingPrior.length) {
    console.error(`Cannot approve ${key}; earlier checkpoints are pending: ${missingPrior.join(", ")}`);
    process.exit(1);
  }
  const item = data.checkpoints[key] || {};
  item.status = "approved";
  item.approvedAt = new Date().toISOString();
  item.approvedBy = "explicit-user-confirmation";
  item.runId = receipt.runId;
  item.approvalNote = note;
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

function verify(target) {
  enforceContextRotation();
  const receipt = loadReceipt();
  const required = requirements[target];
  if (!required) {
    console.error("usage: node tools/workflow-gate.js init [intent]|status|verify anchor|production|final");
    process.exit(1);
  }
  const data = readJson(CHECKPOINTS, { checkpoints: {} });
  const missing = required.filter(key => !approved((data.checkpoints || {})[key], receipt, false));
  if (missing.length) {
    console.error(`LEANDER ${target.toUpperCase()} GATE FAILED: ${missing.join(", ")} not approved.`);
    console.error("Stop at the current checkpoint, present the user-facing artifact, and obtain explicit approval.");
    process.exit(1);
  }
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
}

const command = process.argv[2] || "status";
if (command === "init") initialize(process.argv[3]);
else if (command === "migrate") {
  const noteIndex = process.argv.indexOf("--note");
  migrateExisting(process.argv[3], noteIndex >= 0 ? process.argv[noteIndex + 1] : "");
}
else if (command === "status") status();
else if (command === "approve") {
  const key = process.argv[3];
  const value = key === "productionMode" ? process.argv[4] : "";
  const noteIndex = process.argv.indexOf("--note");
  approveCheckpoint(key, value, noteIndex >= 0 ? process.argv[noteIndex + 1] : "");
}
else if (command === "verify") verify(process.argv[3]);
else {
  console.error("usage: node tools/workflow-gate.js init [intent]|migrate <stage> --note <text>|status|approve <checkpoint> [mode] --note <text>|verify anchor|production|final");
  process.exit(1);
}
