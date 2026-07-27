// Guard the still-active workflow contracts. The context-budget / rotation / active-task
// binding enforcement was retired for single-task mode, so its call-site guards were removed
// with it; the Token ledger remains for cost measurement only, not enforcement.
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const ROOT = __dirname;
function source(name) { return fs.readFileSync(path.join(ROOT, name), "utf8"); }
function selfTest() {
  const workflow = source("workflow-gate.js"), resume = source("resume-job.js"), handoff = source("phase-handoff.js");
  assert(/requiredStep\("token-ledger\.js"/.test(workflow), "Gate 0 must initialize the Token ledger (cost measurement)");
  assert(/requirements-trace\.js", \["verify", "--stage", "plan"\]/.test(workflow) && /state\/requirements-contract\.json/.test(workflow), "Gate 1 approval must verify and bind the requirements contract");
  assert(/requirements-trace\.js", "verify", "--stage", "resume"/.test(resume), "resume must verify original requirements before creating a context pack");
  assert(/leander-phase-handoff\.v2/.test(handoff) && /resumeEligible/.test(handoff), "phase handoff must carry a resume-eligible requirements trace");
  console.log("PASS hard Gate enforcement contract self-test");
}
if (require.main === module) { try { selfTest(); } catch (error) { console.error(error.message); process.exit(1); } }
module.exports = { selfTest };
