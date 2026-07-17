const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { validateCandidate, candidateRegistryEntry } = require("../lib/candidate");

const fixtures = path.join(__dirname, "fixtures", "valid");
const candidateA = path.join(fixtures, "analyst-a", "multi-actor-contribution-pool");
const candidateB = path.join(fixtures, "analyst-b", "evidence-metric-band");

function mutateCandidate(source, mutate) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "leander-candidate-test-"));
  fs.cpSync(source, temp, { recursive: true });
  mutate(temp);
  return temp;
}

test("accepts two isolated generic candidate bundles", () => {
  assert.equal(validateCandidate(candidateA, { expectedContributor: "analyst-a" }).ok, true);
  assert.equal(validateCandidate(candidateB, { expectedContributor: "analyst-b" }).ok, true);
});

test("rejects a missing preview", () => {
  const temp = mutateCandidate(candidateA, dir => fs.rmSync(path.join(dir, "preview.svg")));
  const result = validateCandidate(temp);
  assert.equal(result.ok, false);
  assert.ok(result.findings.some(item => item.rule === "missing-file"));
});

test("rejects absolute paths and secrets", () => {
  const temp = mutateCandidate(candidateA, dir => {
    fs.appendFileSync(path.join(dir, "README.md"), "\nC:\\private\\deck.pptx\nghp_12345678901234567890\n");
  });
  const result = validateCandidate(temp);
  assert.equal(result.ok, false);
  assert.ok(result.findings.some(item => item.rule === "absolute-local-path"));
  assert.ok(result.findings.some(item => item.rule === "github-token"));
});

test("rejects project deny terms", () => {
  const temp = mutateCandidate(candidateB, dir => fs.appendFileSync(path.join(dir, "README.md"), "\nProject Orion Harbor\n"));
  const result = validateCandidate(temp, { denyTerms: ["Orion Harbor"] });
  assert.equal(result.ok, false);
  assert.ok(result.findings.some(item => item.rule === "deny-term"));
});

test("rejects candidates that claim production readiness", () => {
  const temp = mutateCandidate(candidateA, dir => {
    const file = path.join(dir, "candidate.json");
    const value = JSON.parse(fs.readFileSync(file, "utf8"));
    value.designStatus = "usable";
    value.metadataReviewStatus = "manual-reviewed";
    value.selectionConfidenceCap = 0.9;
    fs.writeFileSync(file, JSON.stringify(value, null, 2));
  });
  const result = validateCandidate(temp);
  assert.equal(result.ok, false);
  assert.ok(result.findings.some(item => item.rule === "unsafe-design-status"));
});

test("curator approval converts candidate metadata into a selectable registry entry", () => {
  const candidate = JSON.parse(fs.readFileSync(path.join(candidateA, "candidate.json"), "utf8"));
  const entry = candidateRegistryEntry(candidate, {
    curator: "caijiahui0426",
    approvedAt: "2026-07-16T00:00:00.000Z",
    approveForProduction: true
  });
  assert.equal(entry.designStatus, "usable");
  assert.equal(entry.metadataReviewStatus, "manual-reviewed");
  assert.deepEqual(entry.themeCompatibility, ["leander-base", "leander-global"]);
});
