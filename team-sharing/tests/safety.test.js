const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { value: auditValue } = require("../scripts/audit-event");
const { sanitizeAlert, buildDispatch } = require("../scripts/send-github-alert");
const {
  evaluatePushUpdates,
  hasIndependentReview,
  validateBatch,
  validateStagedPaths
} = require("../lib/automation-policy");

const ZERO = "0".repeat(40);
const SHA = "1".repeat(40);
function line(remoteRef, localSha = SHA) {
  return `refs/heads/local ${localSha} ${remoteRef} ${ZERO}`;
}

test("allows only automation branch prefixes", () => {
  for (const ref of [
    "refs/heads/agent/safety-guard",
    "refs/heads/contrib/analyst-a/component-one",
    "refs/heads/promote/curator/component-one"
  ]) assert.equal(evaluatePushUpdates([line(ref)]).ok, true, ref);
  assert.equal(evaluatePushUpdates([line("refs/heads/feature/unreviewed")]).ok, false);
});

test("blocks protected refs, releases, tags, and deletions", () => {
  for (const ref of [
    "refs/heads/main",
    "refs/heads/master",
    "refs/heads/release/0.7",
    "refs/tags/leander-ppt-v0.7.0"
  ]) assert.equal(evaluatePushUpdates([line(ref)]).ok, false, ref);
  const deletion = `refs/heads/local ${ZERO} refs/heads/contrib/analyst-a/old ${SHA}`;
  assert.equal(evaluatePushUpdates([deletion]).ok, false);
});

test("rejects the whole batch above the maximum", () => {
  const dirs = ["one", "two", "three", "four"];
  const result = validateBatch(dirs, { maxCandidates: 3, reviewReader: () => ({ status: "pass", evidenceDigest: "sha256:test" }) });
  assert.equal(result.ok, false);
  assert.ok(result.findings.some(item => item.rule === "candidate-batch-limit"));
});

test("requires independent review evidence for scheduled candidates", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "leander-review-policy-"));
  assert.equal(hasIndependentReview(root).ok, false);
  fs.writeFileSync(path.join(root, ".agent-review.json"), JSON.stringify({ status: "pass", evidenceDigest: "sha256:review-1" }));
  assert.equal(hasIndependentReview(root).ok, true);
  fs.writeFileSync(path.join(root, ".agent-review.json"), JSON.stringify({ status: "self-approved", evidenceDigest: "sha256:review-1" }));
  assert.equal(hasIndependentReview(root).ok, false);
});

test("confines staged files to the selected candidate directory", () => {
  const root = "contributions/leander-ppt/components/analyst-a/component-one";
  assert.equal(validateStagedPaths([
    `${root}/candidate.json`,
    `${root}/component.js`,
    `${root}/preview.svg`
  ], root).ok, true);
  const result = validateStagedPaths([`${root}/candidate.json`, "leander-ppt/SKILL.md"], root);
  assert.equal(result.ok, false);
  assert.ok(result.findings.some(item => item.rule === "staged-path-outside-allowlist"));
});

test("audit argument parsing does not consume the next option as an empty value", () => {
  const argv = ["node", "audit-event.js", "--subject", "--details", "Candidates=1"];
  assert.equal(auditValue(argv, "subject", ""), "");
  assert.equal(auditValue(argv, "details", ""), "Candidates=1");
});

test("local alert dispatches redact paths and tokens", () => {
  const safe = sanitizeAlert("C:\\private\\deck.pptx ghp_12345678901234567890 /Users/alice/private.txt");
  assert.doesNotMatch(safe, /private|ghp_|alice/i);
  const dispatch = buildDispatch("candidate-cycle-blocked", "候选处理被阻断", safe, "https://github.com/acme/repo/actions", "alice");
  assert.equal(dispatch.event_type, "leander_local_alert");
  assert.equal(dispatch.client_payload.kind, "candidate-cycle-blocked");
  assert.equal(dispatch.client_payload.source, "alice");
  assert.throws(() => buildDispatch("arbitrary-event", "x", "y", "https://github.com"));
});
