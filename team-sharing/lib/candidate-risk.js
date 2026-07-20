const fs = require("fs");
const path = require("path");
const { validateCandidate, readJson } = require("./candidate");

function strings(value) { return Array.isArray(value) ? value.filter(item => typeof item === "string") : []; }
function jaccard(left, right) {
  const a = new Set(strings(left).map(item => item.toLowerCase()));
  const b = new Set(strings(right).map(item => item.toLowerCase()));
  if (!a.size && !b.size) return 0;
  const intersection = [...a].filter(item => b.has(item)).length;
  return intersection / (a.size + b.size - intersection);
}
function similarity(candidate, component) {
  let score = 0;
  if (String(candidate.relationPrimitive || "").toLowerCase() === String(component.relationPrimitive || "").toLowerCase()) score += 0.4;
  score += 0.2 * jaccard(candidate.relationships, component.relationships);
  score += 0.25 * jaccard(candidate.slots, component.slots);
  score += 0.15 * jaccard(candidate.tags, component.tags);
  return Number(score.toFixed(3));
}
function discoverCandidateMetadata(root, current) {
  const rows = [];
  if (!root || !fs.existsSync(root)) return rows;
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.name === "candidate.json" && path.resolve(absolute) !== path.resolve(current || "")) {
        try { rows.push(readJson(absolute)); } catch { /* validation handles malformed current candidates separately */ }
      }
    }
  }
  walk(root);
  return rows;
}
function assessCandidate(candidateDir, options = {}) {
  const validation = validateCandidate(candidateDir, options.validation || {});
  if (!validation.ok) return { schemaVersion: "leander-candidate-assessment.v1", lane: "blocked", score: 100, reasons: ["candidate-validation-failed"], findings: validation.findings, similar: [] };
  const candidate = validation.metadata;
  const registry = options.registry && fs.existsSync(options.registry) ? readJson(options.registry) : { components: [] };
  const otherCandidates = discoverCandidateMetadata(options.contributionsRoot, path.join(candidateDir, "candidate.json"));
  const exactId = otherCandidates.find(item => item.id === candidate.id && item.contributor !== candidate.contributor);
  const exactCandidateName = otherCandidates.find(item => item.name === candidate.name && item.id !== candidate.id);
  const exactFormalName = (registry.components || []).find(item => item.name === candidate.name && item.contribution?.id !== candidate.id);
  const reasons = [];
  if (exactId) reasons.push(`candidate-id-collision:${exactId.contributor || "unknown"}`);
  if (exactCandidateName) reasons.push(`candidate-name-collision:${exactCandidateName.id || "unknown"}`);
  if (exactFormalName) reasons.push(`formal-name-collision:${exactFormalName.name}`);
  const similar = (registry.components || [])
    .map(component => ({ name: component.name, score: similarity(candidate, component), relationPrimitive: component.relationPrimitive || "" }))
    .filter(item => item.score >= 0.3)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 5);
  const top = similar[0]?.score || 0;
  if (top >= 0.7) reasons.push(`high-semantic-overlap:${similar[0].name}`);
  else if (top >= 0.45) reasons.push(`possible-semantic-overlap:${similar[0].name}`);
  const reviewFile = path.join(candidateDir, ".agent-review.json");
  const review = fs.existsSync(reviewFile) ? readJson(reviewFile) : {};
  if (review.status !== "pass" || !review.evidenceDigest) reasons.push("independent-agent-review-missing");
  let lane = "auto-intake";
  if (exactId || exactCandidateName || exactFormalName) lane = "blocked";
  else if (top >= 0.45 || reasons.includes("independent-agent-review-missing")) lane = "curator-review";
  const score = lane === "blocked" ? 100 : Math.min(99, Math.round(top * 70 + (review.status === "pass" ? 0 : 20)));
  return {
    schemaVersion: "leander-candidate-assessment.v1",
    assessedAt: new Date().toISOString(),
    candidate: { id: candidate.id, name: candidate.name, contributor: candidate.contributor, version: candidate.version },
    lane,
    score,
    reasons,
    similar,
    automation: {
      createDraftPullRequest: lane !== "blocked",
      candidateAreaMayAutoMerge: lane === "auto-intake",
      productionPromotionRequiresHuman: true
    }
  };
}

module.exports = { jaccard, similarity, discoverCandidateMetadata, assessCandidate };
