// Produce an event-digest plan with bounded Mode B review runs.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ROOT = path.join(__dirname, "..");
const cfg = require(path.join(ROOT, "deck.config.js"));
const { digestPage } = require("./page-digests");
const { discoverSignals: discoverCandidateSignals } = require("./candidate-harvest");
function shaFile(file) { return fs.existsSync(file) && fs.statSync(file).isFile() ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") : ""; }
function stable(value) { if (Array.isArray(value)) return value.map(stable); if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])); return value; }
function digest(value) { return crypto.createHash("sha256").update(JSON.stringify(stable(value))).digest("hex"); }
// Event digests must track semantic content only. Hashing raw report files
// makes every regeneration (new generatedAt/capturedAt) look like a content
// change and forces pointless re-reviews.
const VOLATILE_KEYS = new Set(["generatedAt", "capturedAt", "syncedAt", "updatedAt", "verifiedAt", "recordedAt", "startedAt", "completedAt", "timestamp"]);
function stripVolatile(value) { if (Array.isArray(value)) return value.map(stripVolatile); if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([key]) => !VOLATILE_KEYS.has(key)).map(([key, item]) => [key, stripVolatile(item)])); return value; }
function relHash(file) {
  const abs = path.join(ROOT, file);
  if (file.endsWith(".json") && fs.existsSync(abs)) {
    try { return [file, digest(stripVolatile(JSON.parse(fs.readFileSync(abs, "utf8").replace(/^﻿/, ""))))]; } catch {}
  }
  return [file, shaFile(abs)];
}
function pageHashes() {
  const base = path.join(ROOT, "pages");
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base).filter(dir => fs.existsSync(path.join(base, dir, "page.json"))).sort().map(dir => {
    const page = JSON.parse(fs.readFileSync(path.join(base, dir, "page.json"), "utf8").replace(/^\uFEFF/, "")), id = String(page.id || dir);
    const d = digestPage(path.join(base, dir), ROOT);
    return { id, renderSha256: shaFile(path.join(base, dir, "out", `${id}.png`)), renderDigest: d.renderDigest, selectionDigest: d.selectionDigest, selectionOutcomeDigest: d.selectionOutcomeDigest, qaProfileDigest: digest(page.qaProfile || {}), sourceDigest: d.sourceDigest };
  });
}
function scopedPageHashes() {
  const all = pageHashes(), active = new Set(cfg.workflow?.activePages || []);
  const fullDeck = cfg.workflow?.events?.fullDeckRendered === true;
  return fullDeck || !active.size ? all : all.filter(page => active.has(page.id));
}
function requiredRoles() {
  const ac = cfg.agentCollaboration || {}, events = cfg.workflow?.events || {}, roles = [];
  Object.entries(ac.roleTriggers || {}).forEach(([role, names]) => { if ((names || []).some(name => events[name] === true)) roles.push(role); });
  const stage = cfg.workflow?.stage;
  // Two-review budget: outline and blueprint are checked by the main agent
  // against their reference checklists and stop at user checkpoints; the
  // visual designer reviews once at anchor and the reviewer once at final.
  // Other roles run only when their workflow events are explicitly opened.
  if (stage === "anchor-sample") roles.push("visual-designer-zh");
  if (stage === "production") roles.push("reviewer-zh", ...(cfg.deckType === "internal-sharing" ? (ac.internalSharingRequiredRoles || []) : []));
  if (stage === "production" && discoverCandidateSignals(ROOT).length > 0) roles.push("component-curator-zh");
  return [...new Set(roles)];
}
function phaseForRole(role) {
  if (cfg.workflow?.stage === "anchor-sample" && ["visual-designer-zh", "reviewer-zh"].includes(role)) return "anchor-sample";
  if (cfg.workflow?.stage === "production" && ["visual-designer-zh", "reviewer-zh", "presenter-zh"].includes(role)) return "production-final";
  return cfg.workflow?.stage || "";
}
function inputs(role) {
  const common = { stage: cfg.workflow?.stage || "", phase: phaseForRole(role), mode: "B", role };
  const map = {
    "planner-zh": [relHash("brief.md"), relHash("outline.md")],
    "layout-architect-zh": [relHash("outline.md"), relHash("layout-blueprint.json"), relHash("DESIGN.md")],
    "visual-designer-zh": [relHash("DESIGN.md"), relHash("visual-direction.md"), relHash("output/full-deck-contact-sheet.png"), relHash("output/render-diversity-audit.json"), pageHashes().map(({ id, renderSha256, renderDigest, selectionOutcomeDigest }) => ({ id, renderSha256, renderDigest, selectionOutcomeDigest }))],
    "component-curator-zh": [relHash("tools/component-registry.json"), relHash("output/candidate-harvest.json"), relHash("state/component-candidate-proposals.json"), pageHashes().map(({ id, selectionDigest }) => ({ id, selectionDigest }))],
    // qa-evidence-index.json is a compact reviewer read surface, but it is not
    // part of the event digest: reviewer output changes its own verdict/checks
    // and must not recursively trigger another identical review.
    "reviewer-zh": [relHash("output/full-deck-contact-sheet.png"), relHash("output/quality-baseline-audit.json"), relHash("output/render-diversity-audit.json"), scopedPageHashes().map(({ id, renderSha256, renderDigest, selectionOutcomeDigest, qaProfileDigest, sourceDigest }) => ({ id, renderSha256, renderDigest, selectionOutcomeDigest, qaProfileDigest, sourceDigest }))],
    "presenter-zh": [relHash("outline.md"), relHash("speaker-notes.md"), relHash("output/full-deck-contact-sheet.png")]
  };
  return { ...common, artifacts: map[role] || [] };
}
function build() {
  const data = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, "agent-collaboration.json"), "utf8")); } catch { return {}; } })(), required = new Set(requiredRoles());
  const roles = {};
  for (const role of Object.keys(cfg.agentCollaboration?.roleTriggers || {})) {
    const eventDigest = digest(inputs(role)), prior = data.roles?.[role] || {}, requiredPhase = phaseForRole(role);
    const reusable = prior.status === "completed" && prior.phase === requiredPhase && prior.eventDigest === eventDigest && prior.outputDigest === shaFile(path.join(ROOT, prior.artifact || ""));
    const freshReview = ["anchor-sample", "production-final"].includes(requiredPhase) && ["visual-designer-zh", "reviewer-zh", "presenter-zh"].includes(role);
    roles[role] = {
      required: required.has(role),
      action: !required.has(role) ? "not-triggered" : reusable ? "reuse-existing-run" : freshReview ? "run-fresh-once" : "run-once",
      requiredPhase,
      eventDigest,
      reuseThreadId: reusable ? prior.threadId || "" : "",
      threadPolicy: freshReview ? "fresh-fork-none" : "bounded-context-pack",
      maxRunsThisPhase: 1
    };
  }
  return { version: "agent-event-plan.v3", generatedAt: new Date().toISOString(), stage: cfg.workflow?.stage || "", policy: "mode-b-delta-first-review", reviewerScope: cfg.workflow?.events?.fullDeckRendered === true ? "full-deck-once" : "active-pages-delta", roles };
}
if (require.main === module) { const value = build(); if (process.argv.includes("--write")) { fs.mkdirSync(path.join(ROOT, "state"), { recursive: true }); fs.writeFileSync(path.join(ROOT, "state", "agent-event-plan.json"), JSON.stringify(value, null, 2) + "\n", "utf8"); } console.log(JSON.stringify(value)); }
module.exports = { build, requiredRoles, phaseForRole };
