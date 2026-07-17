// Guard against accidental removal of the hard context-rotation enforcement call sites.
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const ROOT = __dirname;
function source(name) { return fs.readFileSync(path.join(ROOT, name), "utf8"); }
function selfTest() {
  const deck = source("deck.js"), workflow = source("workflow-gate.js"), phase = source("run-phase.js"), ledger = source("token-ledger.js"), budget = source("context-budget-gate.js");
  assert(/workflow-gate\.js[\s\S]{0,800}context-budget-gate\.js[\s\S]{0,160}--enforce-budget/.test(deck), "deck.js must evaluate the current budget and recheck a lock created inside workflow verification");
  assert((workflow.match(/enforceContextRotation\(\);/g) || []).length >= 2, "checkpoint approval and workflow verification must both enforce the active-task lock");
  assert(/command !== "status"[\s\S]{0,160}enforceContextBudget\(`phase-start-\$\{command\}`\)/.test(phase), "every mutating phase runner command must evaluate the current budget before work");
  assert(/context-budget-gate\.js"\), "--lock", "--gate", label/.test(phase), "phase runner must evaluate the context budget at each successful mutating boundary");
  const checkpointIndex = phase.indexOf('run("token checkpoint"');
  const boundaryIndex = phase.indexOf('runContextBoundary(`phase-${command}`)');
  const handoffIndex = phase.indexOf('run("phase handoff"');
  assert(checkpointIndex >= 0 && boundaryIndex > checkpointIndex && handoffIndex > boundaryIndex, "phase boundary must checkpoint, create any rotation lock, then write the handoff");
  assert(/--root-thread must match CODEX_THREAD_ID/.test(ledger) && /created after the rotation lock/.test(ledger), "attach-thread must reject historical or foreign task IDs");
  assert(/INACTIVE TASK BLOCKED/.test(budget) && /CODEX_THREAD_ID REQUIRED/.test(budget), "post-rotation commands must be bound to the active Codex task and fail closed");
  assert(/TOKEN OBSERVABILITY REQUIRED/.test(budget), "protected commands must fail closed when active-root Token logs are unavailable");
  assert(/assessCalls\(snap\.activeRootCalls/.test(budget) && /activeRootCalls,/.test(ledger), "context rotation must use the complete ordered call stream from the active root task");
  assert(/activeRootActual/.test(ledger) && /active root task rollout is not readable/.test(ledger), "Token accuracy must require the currently active root rollout, not merely any historical root");
  assert(/FRESH TASK REQUIRED/.test(ledger) && /requiredStep\("token-ledger\.js"/.test(workflow), "Gate 0 must reject an already-heavy root task and treat Token-ledger initialization as mandatory");
  console.log("PASS hard Gate enforcement contract self-test");
}
if (require.main === module) { try { selfTest(); } catch (error) { console.error(error.message); process.exit(1); } }
module.exports = { selfTest };
