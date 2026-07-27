// Phase checkpoint gate.
// Usage:
//   node tools/verify-checkpoints.js status
//   node tools/verify-checkpoints.js phase3
//   node tools/verify-checkpoints.js phase4
//
// Page QA proves slides are technically acceptable. This gate proves the user
// has approved the stage transition before the workflow scales.
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const ROOT = path.join(__dirname, "..");
const STATUS_FILE = path.join(ROOT, "checkpoint-status.json");

function readStatus() {
  if (!fs.existsSync(STATUS_FILE)) {
    return {
      version: "checkpoint-status.v1",
      checkpoints: {}
    };
  }
  return JSON.parse(fs.readFileSync(STATUS_FILE, "utf8").replace(/^\uFEFF/, ""));
}

function checkpoint(data, key) {
  return (data.checkpoints && data.checkpoints[key]) || {};
}

function isApproved(cp, allowBypass = true) {
  if (cp.status === "approved") return true;
  if (allowBypass && cp.status === "bypassed" && cp.reason) return true;
  return false;
}

function describe(cp) {
  if (!cp || !cp.status) return "missing";
  if (cp.status === "approved") return `approved${cp.approvedAt ? " @ " + cp.approvedAt : ""}`;
  if (cp.status === "bypassed") return `bypassed: ${cp.reason || "no reason"}`;
  return cp.status;
}

const phaseRules = {
  phase3: [
    ["plan", "brief/outline checkpoint", true],
    ["designTermsState", "design/terms/state checkpoint", true],
    ["theme", "theme/template checkpoint", true],
    ["layoutBlueprint", "layout blueprint checkpoint", true]
  ],
  phase4: [
    ["plan", "brief/outline checkpoint", true],
    ["designTermsState", "design/terms/state checkpoint", true],
    ["theme", "theme/template checkpoint", true],
    ["layoutBlueprint", "layout blueprint checkpoint", true],
    ["anchorSample", "anchor sample user approval", true],
    ["productionMode", "production mode approval", false]
  ]
};

function verifyPhase(phase) {
  const data = readStatus();
  const rules = phaseRules[phase];
  if (!rules) {
    console.error("usage: node tools/verify-checkpoints.js status|phase3|phase4");
    process.exit(1);
  }
  const failures = [];
  rules.forEach(([key, label, allowBypass]) => {
    const cp = checkpoint(data, key);
    if (!isApproved(cp, allowBypass)) {
      failures.push({ key, label, current: describe(cp) });
    }
  });
  if (failures.length) {
    console.error(`Checkpoint gate failed for ${phase}:`);
    failures.forEach(f => console.error(`  - ${f.label} (${f.key}) is ${f.current}`));
    process.exit(1);
  }
  console.log(`Checkpoint gate OK for ${phase}`);
  if (phase === "phase3" || phase === "phase4") {
    cp.execFileSync(process.execPath, [path.join(ROOT, "tools", "verify-design-gates.js"), "blueprint"], { stdio: "inherit" });
    cp.execFileSync(process.execPath, [path.join(ROOT, "tools", "lint-layout-blueprint.js")], { stdio: "inherit" });
    cp.execFileSync(process.execPath, [path.join(ROOT, "tools", "lint-blueprint-preview.js")], { stdio: "inherit" });
  }
}

function printStatus() {
  const data = readStatus();
  const keys = ["plan", "designTermsState", "layoutBlueprint", "theme", "anchorSample", "productionMode"];
  console.log("Checkpoint status:");
  keys.forEach(key => console.log(`  - ${key}: ${describe(checkpoint(data, key))}`));
}

const cmd = process.argv[2] || "status";
if (cmd === "status") printStatus();
else verifyPhase(cmd);
