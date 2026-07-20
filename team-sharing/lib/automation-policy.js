const fs = require("fs");
const path = require("path");

const ZERO_OID = /^0{40,64}$/;
const ALLOWED_REMOTE_BRANCH = /^refs\/heads\/(?:agent|contrib|promote)\/[A-Za-z0-9._/-]+$/;
const PROTECTED_REMOTE_REF = /^(?:refs\/heads\/(?:main|master|release(?:\/|$))|refs\/tags\/)/;

function parsePushLine(line) {
  const parts = String(line || "").trim().split(/\s+/);
  if (parts.length !== 4) return null;
  return { localRef: parts[0], localOid: parts[1], remoteRef: parts[2], remoteOid: parts[3] };
}

function evaluatePushUpdates(lines) {
  const findings = [];
  for (const raw of lines || []) {
    if (!String(raw).trim()) continue;
    const update = parsePushLine(raw);
    if (!update) {
      findings.push({ rule: "malformed-push-update", value: String(raw) });
      continue;
    }
    if (ZERO_OID.test(update.localOid)) findings.push({ rule: "remote-deletion-blocked", ref: update.remoteRef });
    if (PROTECTED_REMOTE_REF.test(update.remoteRef)) findings.push({ rule: "protected-ref-blocked", ref: update.remoteRef });
    else if (!ALLOWED_REMOTE_BRANCH.test(update.remoteRef)) findings.push({ rule: "automation-branch-prefix-required", ref: update.remoteRef });
  }
  return { ok: findings.length === 0, findings };
}

function reviewObject(candidateDir) {
  const file = path.join(candidateDir, ".agent-review.json");
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return null; }
}

function reviewResult(review) {
  const digest = typeof review?.evidenceDigest === "string" ? review.evidenceDigest.trim() : "";
  const ok = review?.status === "pass" && /^sha256:[A-Za-z0-9._-]+$/.test(digest);
  return { ok, status: review?.status || "missing", evidenceDigest: digest };
}

function hasIndependentReview(candidateDir) {
  return reviewResult(reviewObject(candidateDir));
}

function validateBatch(candidateDirs, options = {}) {
  const maxCandidates = Number.isInteger(Number(options.maxCandidates)) ? Number(options.maxCandidates) : 3;
  const reviewReader = options.reviewReader || reviewObject;
  const findings = [];
  if (maxCandidates < 1) findings.push({ rule: "invalid-candidate-batch-limit", maxCandidates });
  if ((candidateDirs || []).length > maxCandidates) findings.push({ rule: "candidate-batch-limit", count: candidateDirs.length, maxCandidates });
  for (const candidateDir of candidateDirs || []) {
    const review = reviewResult(reviewReader(candidateDir));
    if (!review.ok) findings.push({ rule: "independent-agent-review-required", candidateDir, status: review.status });
  }
  return { ok: findings.length === 0, count: (candidateDirs || []).length, maxCandidates, findings };
}

function normalizedRepoPath(value) {
  const raw = String(value || "").replace(/\\/g, "/");
  if (!raw || raw.startsWith("/") || /^[A-Za-z]:\//.test(raw)) return null;
  const normalized = path.posix.normalize(raw);
  if (normalized === ".." || normalized.startsWith("../")) return null;
  return normalized.replace(/^\.\//, "");
}

function validateStagedPaths(paths, allowedRoot) {
  const root = normalizedRepoPath(allowedRoot);
  const findings = [];
  if (!root) return { ok: false, findings: [{ rule: "invalid-staged-path-allowlist", value: allowedRoot }] };
  for (const value of paths || []) {
    const normalized = normalizedRepoPath(value);
    if (!normalized || (normalized !== root && !normalized.startsWith(`${root}/`))) {
      findings.push({ rule: "staged-path-outside-allowlist", value: String(value) });
    }
  }
  if (!(paths || []).length) findings.push({ rule: "empty-staged-diff" });
  return { ok: findings.length === 0, findings };
}

module.exports = {
  ALLOWED_REMOTE_BRANCH,
  PROTECTED_REMOTE_REF,
  parsePushLine,
  evaluatePushUpdates,
  hasIndependentReview,
  validateBatch,
  validateStagedPaths
};
