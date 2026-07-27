const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { validateCandidate, candidateRegistryEntry } = require("../lib/candidate");
const { assessCandidate } = require("../lib/candidate-risk");
const { buildReviewCard } = require("../lib/feishu");
const { classifyPullRequest, buildLifecycleNotification } = require("../lib/feishu-events");
const { parseVersion, compareVersions, selectLatest, bumpVersion } = require("../lib/semver");

const fixtures = path.join(__dirname, "fixtures", "valid");
const candidateA = path.join(fixtures, "analyst-a", "multi-actor-contribution-pool");
const candidateB = path.join(fixtures, "analyst-b", "evidence-metric-band");

function mutateCandidate(source, mutate) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "iin-ppt-candidate-test-"));
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

test("risk triage allows isolated reviewed candidates into automatic intake", () => {
  const temp = mutateCandidate(candidateA, dir => fs.writeFileSync(path.join(dir, ".agent-review.json"), JSON.stringify({ status: "pass", evidenceDigest: "sha256:test" })));
  const registry = path.join(temp, "registry.json");
  fs.writeFileSync(registry, JSON.stringify({ components: [] }));
  const result = assessCandidate(temp, { registry });
  assert.equal(result.lane, "auto-intake");
  assert.equal(result.automation.candidateAreaMayAutoMerge, false);
  assert.equal(result.automation.candidateAreaRequiresHumanMerge, true);
  assert.equal(result.automation.productionPromotionRequiresHuman, true);
});

test("risk triage sends semantically similar candidates to curator review", () => {
  const temp = mutateCandidate(candidateA, dir => fs.writeFileSync(path.join(dir, ".agent-review.json"), JSON.stringify({ status: "pass", evidenceDigest: "sha256:test" })));
  const metadata = JSON.parse(fs.readFileSync(path.join(temp, "candidate.json"), "utf8"));
  const registry = path.join(temp, "registry.json");
  fs.writeFileSync(registry, JSON.stringify({ components: [{ name: "sharedPoolFlow", relationPrimitive: metadata.relationPrimitive, relationships: metadata.relationships, slots: metadata.slots, tags: metadata.tags }] }));
  const result = assessCandidate(temp, { registry });
  assert.equal(result.lane, "curator-review");
  assert.ok(result.similar[0].score >= 0.7);
});

test("risk triage blocks exact candidate id collisions", () => {
  const temp = mutateCandidate(candidateA, dir => fs.writeFileSync(path.join(dir, ".agent-review.json"), JSON.stringify({ status: "pass", evidenceDigest: "sha256:test" })));
  const inbox = fs.mkdtempSync(path.join(os.tmpdir(), "iin-ppt-existing-candidate-"));
  const existing = path.join(inbox, "other");
  fs.mkdirSync(existing);
  const metadata = JSON.parse(fs.readFileSync(path.join(temp, "candidate.json"), "utf8"));
  fs.writeFileSync(path.join(existing, "candidate.json"), JSON.stringify({ ...metadata, contributor: "analyst-b" }));
  const result = assessCandidate(temp, { contributionsRoot: inbox });
  assert.equal(result.lane, "blocked");
  assert.ok(result.reasons.some(reason => reason.startsWith("candidate-id-collision")));
});

test("Feishu review cards contain status and safe GitHub actions", () => {
  const card = buildReviewCard({ status: "success", title: "Candidate ready", details: "Checks passed", url: "https://github.com/acme/repo/pull/7", actionUrl: "https://github.com/acme/repo/pull/7/files" });
  assert.equal(card.msg_type, "interactive");
  assert.equal(card.card.header.template, "green");
  assert.equal(card.card.elements[1].actions[0].url, "https://github.com/acme/repo/pull/7");
});

test("Feishu cards use distinct templates for blocked and closed states", () => {
  assert.equal(buildReviewCard({ status: "blocked" }).card.header.template, "red");
  assert.equal(buildReviewCard({ status: "closed" }).card.header.template, "grey");
});

test("classifies pull requests by governed branch and path", () => {
  assert.equal(classifyPullRequest({ head: { ref: "contrib/alice/card" } }, []), "candidate-intake");
  assert.equal(classifyPullRequest({ head: { ref: "promote/alice/card" } }, []), "component-promotion");
  assert.equal(classifyPullRequest({ head: { ref: "agent/core" } }, [{ filename: "iinnovation-products-ppt/SKILL.md" }]), "core-change");
  assert.equal(classifyPullRequest({ head: { ref: "agent/docs" } }, [{ filename: "docs/readme.md" }]), "governance-change");
});

test("builds a curator-specific candidate approval notification", () => {
  const result = buildLifecycleNotification({
    eventName: "workflow_run",
    workflowName: "IInnovation-Products_ppt Team Sharing",
    conclusion: "success",
    pullRequest: { number: 8, html_url: "https://github.com/acme/repo/pull/8", user: { login: "alice" }, head: { ref: "contrib/alice/card" } },
    assessment: { lane: "curator-review", score: 58, reasons: ["possible-semantic-overlap:metricBand"] }
  });
  assert.equal(result.status, "review-required");
  assert.match(result.title, /候选入库/);
  assert.match(result.details, /curator-review/);
  assert.match(result.details, /metricBand/);
  assert.equal(result.actionUrl, "https://github.com/acme/repo/pull/8/files");
});

test("builds typed review, merge, release, and local-alert notifications", () => {
  const approved = buildLifecycleNotification({ eventName: "pull_request_review", reviewState: "approved", pullRequest: { number: 9, html_url: "https://github.com/acme/repo/pull/9" } });
  assert.equal(approved.status, "approved");
  const merged = buildLifecycleNotification({ eventName: "pull_request_target", action: "closed", pullRequest: { number: 9, merged: true, html_url: "https://github.com/acme/repo/pull/9" } });
  assert.equal(merged.status, "merged");
  const release = buildLifecycleNotification({ eventName: "workflow_run", workflowName: "Tag Approved IInnovation-Products_ppt Version", conclusion: "failure", runUrl: "https://github.com/acme/repo/actions/runs/3", version: "0.7.0" });
  assert.equal(release.status, "failed");
  assert.equal(buildLifecycleNotification({ eventName: "workflow_run", workflowName: "Tag Approved IInnovation-Products_ppt Version", conclusion: "success" }), null);
  const local = buildLifecycleNotification({ eventName: "repository_dispatch", localAlert: { kind: "consumer-update-failed", title: "更新失败", details: "请检查本机日志", url: "https://github.com/acme/repo/actions" } });
  assert.match(local.title, /更新失败/);
  assert.equal(buildLifecycleNotification({ eventName: "repository_dispatch", localAlert: { kind: "arbitrary-event", url: "https://example.com/phishing" } }), null);
  assert.equal(buildLifecycleNotification({ eventName: "pull_request_review", reviewState: "commented", pullRequest: { number: 9 } }), null);
});

test("release versions respect stable and beta channels", () => {
  assert.equal(parseVersion("iinnovation-products-ppt-v0.6.0-beta.8").prerelease.join("."), "beta.8");
  assert.ok(compareVersions("0.6.0", "0.6.0-beta.8") > 0);
  assert.equal(selectLatest(["iinnovation-products-ppt-v0.6.0-beta.8", "iinnovation-products-ppt-v0.5.2", "iinnovation-products-ppt-v0.6.0"], "stable").tag, "iinnovation-products-ppt-v0.6.0");
  assert.equal(selectLatest(["iinnovation-products-ppt-v0.6.0-beta.8", "iinnovation-products-ppt-v0.5.2"], "beta").tag, "iinnovation-products-ppt-v0.6.0-beta.8");
  assert.equal(bumpVersion("0.6.0-beta.8", "minor", "beta"), "0.7.0-beta.1");
  assert.equal(bumpVersion("0.6.0-beta.8", "prerelease", "beta"), "0.6.0-beta.9");
});
