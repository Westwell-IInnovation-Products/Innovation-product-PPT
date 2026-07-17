// Verify that actual role runs match the recorded event plan and independence policy.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ROOT = path.join(__dirname, "..");
const cfg = require("../deck.config");
const { build: buildEventPlan, requiredRoles } = require("./plan-agent-events");
function arg(name, fallback) { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
const file = path.resolve(arg("file", path.join(ROOT, "agent-collaboration.json")));
const roleBrief = path.join(ROOT, "role-briefs.md");
function readJson(target) { try { return JSON.parse(fs.readFileSync(target, "utf8").replace(/^\uFEFF/, "")); } catch { return null; } }
function shaFile(target) { return fs.existsSync(target) && fs.statSync(target).isFile() ? crypto.createHash("sha256").update(fs.readFileSync(target)).digest("hex") : ""; }
function artifactPath(value) { return value && !value.includes("*") ? path.join(ROOT, value) : ""; }
function isHex(value) { return /^[a-f0-9]{64}$/i.test(String(value || "")); }
function validVerdict(value) { return ["PASS", "SHIP", "READY"].includes(String(value || "").toUpperCase()); }

function validateRun(role, item, planned, errors) {
  if (!item) { errors.push(`${role}: missing role entry`); return; }
  if (!planned) { errors.push(`${role}: missing recorded event plan`); return; }
  if (!["completed", "fallback", "bypassed"].includes(item.status)) { errors.push(`${role}: required event is open but status=${item.status || "pending"}`); return; }
  if (item.status === "bypassed" && cfg.agentCollaboration?.allowRequiredBypass !== true) errors.push(`${role}: required role cannot be bypassed`);
  if (item.status === "fallback" && cfg.agentCollaboration?.allowMainAgentFallback !== true) errors.push(`${role}: fallback disabled`);
  if (["completed", "fallback"].includes(item.status) && !validVerdict(item.verdict)) errors.push(`${role}: verdict must be PASS/SHIP/READY`);
  if (!String(item.summary || item.reason || "").trim()) errors.push(`${role}: summary or reason required`);
  if (!String(item.event || "").trim()) errors.push(`${role}: event is required`);
  if (!String(item.runId || "").trim()) errors.push(`${role}: runId is required`);
  if (!String(item.threadId || "").trim()) errors.push(`${role}: threadId is required`);
  if (item.phase !== planned.requiredPhase) errors.push(`${role}: phase=${item.phase || "missing"} does not match planned ${planned.requiredPhase}`);
  if (item.action !== planned.action) errors.push(`${role}: action=${item.action || "missing"} does not match recorded plan ${planned.action}`);
  if (!isHex(item.eventDigest) || item.eventDigest !== planned.eventDigest) errors.push(`${role}: eventDigest is missing or stale`);
  if (!isHex(item.inputDigest)) errors.push(`${role}: inputDigest must be a SHA-256 compact context-pack digest`);
  const artifact = artifactPath(item.artifact);
  if (!artifact || !fs.existsSync(artifact)) errors.push(`${role}: artifact missing or wildcard artifacts are invalid`);
  else if (item.outputDigest !== shaFile(artifact)) errors.push(`${role}: outputDigest does not match current artifact`);
  if (planned.threadPolicy === "fresh-fork-none" && item.status !== "completed") errors.push(`${role}: fresh review requires an independent completed run`);
  if (planned.action === "reuse-existing-run" && item.threadId !== planned.reuseThreadId) errors.push(`${role}: reused run must keep planned threadId`);
  const phaseRuns = [...(item.runs || []), item].filter(run => run.phase === planned.requiredPhase && run.status === "completed");
  if (phaseRuns.length > Number(planned.maxRunsThisPhase || 1)) errors.push(`${role}: more than one completed run recorded for ${planned.requiredPhase}`);
}

function main() {
  const ac = cfg.agentCollaboration || {};
  if (!ac.enabled) { console.log("Agent collaboration gate skipped: disabled"); return; }
  const data = readJson(file), errors = [];
  if (!data || data.version !== "agent-collaboration.v3") errors.push("agent-collaboration.json must be agent-collaboration.v3");
  if (data && data.policy !== "event-driven.v3") errors.push("agent collaboration policy must be event-driven.v3");
  if (ac.requireRoleBriefs !== false && !fs.existsSync(roleBrief)) errors.push("role-briefs.md is required");
  const livePlan = buildEventPlan();
  const recordedPlan = readJson(path.join(ROOT, "state", "agent-event-plan.json"));
  if (!recordedPlan || recordedPlan.version !== "agent-event-plan.v2") errors.push("state/agent-event-plan.json v2 is required before running roles");
  const roles = data?.roles || {}, required = requiredRoles();
  required.forEach(role => {
    const planned = recordedPlan?.roles?.[role];
    if (!planned?.required) errors.push(`${role}: recorded plan does not mark the role required`);
    if (planned?.eventDigest !== livePlan.roles?.[role]?.eventDigest) errors.push(`${role}: recorded event plan is stale`);
    validateRun(role, roles[role], planned, errors);
  });

  const completedByThread = new Map();
  Object.entries(roles).forEach(([role, item]) => {
    if (item?.status !== "completed" || !item.threadId) return;
    completedByThread.set(item.threadId, [...(completedByThread.get(item.threadId) || []), role]);
  });
  completedByThread.forEach((roleNames, threadId) => { if (roleNames.length > 1) errors.push(`cross-role thread reuse is forbidden: ${threadId} used by ${roleNames.join(", ")}`); });

  if (errors.length) {
    console.error("Agent collaboration gate FAILED:");
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
  console.log(`Agent collaboration gate OK: required=${required.join(", ") || "none"}`);
}
function selfTest() {
  const errors = [], digest = "a".repeat(64);
  validateRun("reviewer-zh", { status: "completed", action: "run-fresh-once", event: "final", phase: "production-final", threadId: "t1", runId: "r1", eventDigest: digest, inputDigest: digest, outputDigest: digest, artifact: "missing.md", verdict: "SHIP", summary: "checked", runs: [] }, { action: "run-fresh-once", requiredPhase: "production-final", eventDigest: digest, threadPolicy: "fresh-fork-none", maxRunsThisPhase: 1 }, errors);
  if (!errors.some(error => /artifact missing/.test(error))) throw new Error("missing review artifact was not enforced");
  const staleErrors = [];
  validateRun("reviewer-zh", { status: "completed", action: "run-fresh-once", event: "final", phase: "production-final", threadId: "t1", runId: "r1", eventDigest: "b".repeat(64), inputDigest: digest, outputDigest: digest, artifact: "missing.md", verdict: "MAYBE", summary: "checked", runs: [] }, { action: "run-fresh-once", requiredPhase: "production-final", eventDigest: digest, maxRunsThisPhase: 1 }, staleErrors);
  if (!staleErrors.some(error => /verdict/.test(error)) || !staleErrors.some(error => /eventDigest/.test(error))) throw new Error("verdict/eventDigest validation was not enforced");
  console.log("PASS agent independence self-test");
}
if (require.main === module) { if (process.argv.includes("--self-test")) selfTest(); else main(); }
module.exports = { validateRun, selfTest };
