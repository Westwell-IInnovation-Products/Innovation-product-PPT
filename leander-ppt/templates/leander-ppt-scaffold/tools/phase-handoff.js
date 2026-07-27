// Compact, hash-bound handoff for continuing a Leander run in a fresh task.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const requirementsTrace = require("./requirements-trace");
const ROOT = path.join(__dirname, "..");
const FILE = path.join(ROOT, "state", "phase-handoff.json");
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function sha(file) { return fs.existsSync(file) ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") : ""; }
function rel(file) { return path.relative(ROOT, file).replace(/\\/g, "/"); }
function build() {
  const receipt = readJson(path.join(ROOT, "workflow-receipt.json"), {});
  const checkpoints = readJson(path.join(ROOT, "checkpoint-status.json"), {});
  const runState = readJson(path.join(ROOT, "state", "run-state.json"), {});
  const context = readJson(path.join(ROOT, "state", "context-pack.json"), {});
  const contextBudget = readJson(path.join(ROOT, "state", "context-budget.json"), {});
  const rotationLock = readJson(path.join(ROOT, "state", "context-rotation-lock.json"), {});
  const portfolio = readJson(path.join(ROOT, "state", "task-portfolio.json"), {});
  const cfg = fs.existsSync(path.join(ROOT, "deck.config.js")) ? require(path.join(ROOT, "deck.config.js")) : {};
  const candidates = ["brief.md", "outline.md", "DESIGN.md", "visual-direction.md", "theme-contract.md", "layout-blueprint.json", "checkpoint-status.json", "agent-collaboration.json", "state/requirements-contract.json", "state/requirements-coverage.json", "output/render-quality-evidence.json"];
  const artifactDigests = Object.fromEntries(candidates.map(item => [item, sha(path.join(ROOT, item))]).filter(([, digest]) => digest));
  const approvedDecisions = Object.entries(checkpoints.checkpoints || {}).filter(([, item]) => item.status === "approved").map(([name, item]) => ({ name, mode: item.mode || "", approvedAt: item.approvedAt || "" }));
  const activeJob = (portfolio.jobs || []).find(item => item.status === "active") || null;
  const requirementState = requirementsTrace.inspect(ROOT, "handoff");
  const traceReads = ["state/requirements-contract.json", "state/requirements-coverage.json"];
  const recommendedReads = [...traceReads, ...(context.recommendedReads || ["checkpoint-status.json", "state/run-state.json", "artifact-manifest.md"])]
    .filter((item, index, list) => list.indexOf(item) === index);
  const handoff = {
    version: "leander-phase-handoff.v2",
    generatedAt: new Date().toISOString(),
    runId: receipt.runId || "",
    currentGate: runState.currentGate || cfg.workflow?.stage || "",
    currentStage: cfg.workflow?.stage || "",
    approvedDecisions,
    artifactDigests,
    changedPages: (context.selectedPages || []).map(page => page.id),
    openIssues: runState.openIssues || [],
    nextAction: runState.nextAction || "Run context-pack status and continue from the current approved gate.",
    activeJob: activeJob ? { id: activeJob.id, label: activeJob.label, scope: activeJob.scope, goal: activeJob.goal, commands: activeJob.commands } : null,
    resumeCommand: "node tools/resume-job.js",
    recommendedReads,
    requirementsTrace: {
      resumeEligible: requirementState.ok,
      contractSha256: sha(path.join(ROOT, "state", "requirements-contract.json")),
      coverageSha256: sha(path.join(ROOT, "state", "requirements-coverage.json")),
      sourceTaskIds: requirementState.contract?.sourceContext?.sourceTasks || [],
      summary: requirementState.summary,
      blockingErrors: requirementState.errors
    },
    contextRotation: {
      budgetStatus: contextBudget.status || "unknown",
      lockStatus: rotationLock.status || "clear",
      reason: rotationLock.reason || contextBudget.reason || "",
      blockedRootThreadIds: rotationLock.status === "pending" ? (rotationLock.blockedRootThreadIds || []) : []
    },
    continuationPolicy: {
      replayConversationHistory: !requirementState.ok,
      attachFreshTaskToTokenLedger: true,
      preserveWorkflowReceipt: true,
      preserveRequirementsContract: true,
      expandReadsOnlyForNamedGap: true,
      adaptiveCalls: true,
      fixedSubagentCap: null,
      maxEstimatedTokens: 3000
    }
  };
  const serialized = JSON.stringify(handoff);
  handoff.packet = { sha256: crypto.createHash("sha256").update(serialized).digest("hex"), bytes: Buffer.byteLength(serialized), estimatedTokens: Math.ceil(Buffer.byteLength(serialized) / 4) };
  return handoff;
}
function write() {
  const handoff = build();
  if (handoff.packet.estimatedTokens > 3000) throw new Error(`phase handoff exceeds 3000 estimated tokens: ${handoff.packet.estimatedTokens}`);
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(handoff, null, 2) + "\n", "utf8");
  return handoff;
}
function verify() {
  const current = readJson(FILE), expected = build(), errors = [];
  if (!current || current.version !== "leander-phase-handoff.v2") errors.push("missing leander-phase-handoff.v2");
  if (current && current.runId !== expected.runId) errors.push("handoff runId does not match workflow receipt");
  for (const [file, digest] of Object.entries(current?.artifactDigests || {})) if (sha(path.join(ROOT, file)) !== digest) errors.push(`handoff artifact changed: ${file}`);
  if (current?.requirementsTrace?.resumeEligible !== true) errors.push("handoff is not resume-eligible because the original requirements trace is incomplete");
  if (current?.requirementsTrace?.contractSha256 !== expected.requirementsTrace.contractSha256) errors.push("requirements contract changed after handoff");
  if (current?.requirementsTrace?.coverageSha256 !== expected.requirementsTrace.coverageSha256) errors.push("requirements coverage changed after handoff");
  if (current?.packet) {
    const copy = JSON.parse(JSON.stringify(current));
    delete copy.packet;
    const serialized = JSON.stringify(copy);
    const digest = crypto.createHash("sha256").update(serialized).digest("hex");
    if (digest !== current.packet.sha256 || Buffer.byteLength(serialized) !== current.packet.bytes) errors.push("handoff packet integrity check failed");
  } else errors.push("handoff packet is missing");
  if (errors.length) throw new Error(errors.join("; "));
  return current;
}
function summary(value) {
  return [`Handoff ${value.runId || "unbound"}`, `stage=${value.currentStage || "unknown"}`, `approved=${value.approvedDecisions.length}`, `requirements=${value.requirementsTrace?.resumeEligible ? "ready" : "blocked"}`, `next=${value.nextAction}`, `packet=${value.packet?.estimatedTokens || "?"} tokens`].join(" | ");
}
const command = process.argv[2] || "summary";
try {
  if (command === "write") console.log(summary(write()));
  else if (command === "verify") console.log(summary(verify()));
  else if (command === "summary") console.log(summary(readJson(FILE) || build()));
  else throw new Error("usage: phase-handoff.js write|verify|summary");
} catch (error) { console.error(error.message); process.exit(1); }
module.exports = { build, write, verify };
