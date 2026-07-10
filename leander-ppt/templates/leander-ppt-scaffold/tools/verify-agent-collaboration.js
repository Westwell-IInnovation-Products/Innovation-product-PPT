const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ROOT = path.join(__dirname, "..");
const cfg = require("../deck.config");
function arg(name, fallback) { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
const file = path.resolve(arg("file", path.join(ROOT, "agent-collaboration.json")));
const roleBrief = path.join(ROOT, "role-briefs.md");
function readJson(target) { try { return JSON.parse(fs.readFileSync(target, "utf8").replace(/^\uFEFF/, "")); } catch { return null; } }
function shaFile(target) { return fs.existsSync(target) && fs.statSync(target).isFile() ? crypto.createHash("sha256").update(fs.readFileSync(target)).digest("hex") : ""; }
function artifactPath(value) { return value && !value.includes("*") ? path.join(ROOT, value) : ""; }
function isHex(value) { return /^[a-f0-9]{64}$/i.test(String(value || "")); }
function uniq(items) { return [...new Set(items.filter(Boolean))]; }
function requiredRoles() {
  const ac = cfg.agentCollaboration || {}, events = cfg.workflow?.events || {}, triggers = ac.roleTriggers || {};
  const required = [];
  Object.entries(triggers).forEach(([role, eventNames]) => { if ((eventNames || []).some(event => events[event] === true)) required.push(role); });
  if (cfg.workflow?.stage === "outline-reset") required.push("planner-zh");
  if (cfg.workflow?.stage === "layout-blueprint") required.push("layout-architect-zh");
  if (cfg.workflow?.stage === "production") required.push(...(ac.finalAlwaysRequiredRoles || ["reviewer-zh"]));
  if (cfg.workflow?.stage === "production" && cfg.deckType === "internal-sharing") required.push(...(ac.internalSharingRequiredRoles || ["presenter-zh"]));
  return uniq(required);
}
function main() {
  const ac = cfg.agentCollaboration || {};
  if (!ac.enabled) { console.log("Agent collaboration gate skipped: disabled"); return; }
  const data = readJson(file), errors = [];
  if (!data || data.version !== "agent-collaboration.v2") errors.push("agent-collaboration.json must be agent-collaboration.v2");
  if (data && data.policy !== "event-driven.v2") errors.push("agent collaboration policy must be event-driven.v2");
  if (ac.requireRoleBriefs !== false && !fs.existsSync(roleBrief)) errors.push("role-briefs.md is required");
  const roles = data?.roles || {}, required = requiredRoles(), final = cfg.workflow?.stage === "production";
  required.forEach(role => {
    const item = roles[role];
    if (!item) { errors.push(`${role}: missing role entry`); return; }
    if (!["completed", "fallback", "bypassed"].includes(item.status)) { errors.push(`${role}: required event is open but status=${item.status || "pending"}`); return; }
    if (item.status === "bypassed" && ac.allowRequiredBypass !== true) errors.push(`${role}: required role cannot be bypassed`);
    if (final && (ac.independentAtFinal || []).includes(role) && item.status !== "completed") errors.push(`${role}: final triggered role requires an independent completed run`);
    if (item.status === "fallback" && ac.allowMainAgentFallback !== true) errors.push(`${role}: fallback disabled`);
    if (item.status === "fallback" && !String(item.reason || "").trim()) errors.push(`${role}: fallback requires reason`);
    if (["completed", "fallback"].includes(item.status) && !["PASS", "SHIP", "READY"].includes(String(item.verdict || "").toUpperCase())) errors.push(`${role}: verdict must be PASS/SHIP/READY`);
    if (!String(item.summary || item.reason || "").trim()) errors.push(`${role}: summary or reason required`);
    if (!String(item.event || "").trim()) errors.push(`${role}: event is required`);
    if (!String(item.runId || "").trim()) errors.push(`${role}: runId is required`);
    if (!isHex(item.inputDigest)) errors.push(`${role}: inputDigest must be a SHA-256 context-pack digest`);
    const artifact = artifactPath(item.artifact);
    if (!artifact || !fs.existsSync(artifact)) errors.push(`${role}: artifact missing or wildcard artifacts are not valid role evidence`);
    else if (item.outputDigest !== shaFile(artifact)) errors.push(`${role}: outputDigest does not match current artifact`);
  });
  if (errors.length) {
    console.error("Agent collaboration gate FAILED:");
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
  console.log(`Agent collaboration gate OK: required=${required.join(", ") || "none"}`);
}
main();
