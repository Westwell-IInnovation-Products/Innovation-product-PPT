// Compact machine-readable QA index for incremental reviewer context.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const assert = require("assert");
const ROOT = path.join(__dirname, "..");
const FILE = path.join(ROOT, "output", "qa-evidence-index.json");
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function stable(value) { if (Array.isArray(value)) return value.map(stable); if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])); return value; }
function digest(value) { return crypto.createHash("sha256").update(JSON.stringify(stable(value))).digest("hex"); }
function compactQaResult(result = {}, pageId = "") {
  const checks = result.checks || [], counts = { PASS: 0, FAIL: 0, PENDING: 0, OTHER: 0 };
  checks.forEach(check => { const key = counts[check.status] == null ? "OTHER" : check.status; counts[key] += 1; });
  const ruleDigests = Object.fromEntries(checks.map(check => [check.ruleId, digest({ status: check.status, evidence: check.evidence || {} }).slice(0, 16)]));
  return {
    pageId: result.pageId || pageId,
    verdict: result.verdict || "MISSING",
    renderSha256: result.renderSha256 || "",
    digests: result.digests || {},
    reviewer: result.reviewer?.runId ? { role: result.reviewer.role || "", runId: result.reviewer.runId, mode: result.reviewer.mode || "" } : null,
    counts,
    failingRules: checks.filter(check => check.status === "FAIL").map(check => check.ruleId),
    pendingRules: checks.filter(check => check.status !== "PASS" && check.status !== "FAIL").map(check => check.ruleId),
    remainingRiskCount: (result.remainingRisks || []).length,
    ruleDigests,
    evidenceDigest: digest({ verdict: result.verdict, checks, remainingRisks: result.remainingRisks || [], reviewer: result.reviewer || {} })
  };
}
function build(previous = readJson(FILE, {})) {
  const base = path.join(ROOT, "pages"), pages = [];
  if (fs.existsSync(base)) for (const dir of fs.readdirSync(base).sort()) {
    const page = readJson(path.join(base, dir, "page.json"), null);
    if (!page) continue;
    pages.push(compactQaResult(readJson(path.join(base, dir, "qa-result.json"), {}), String(page.id || dir)));
  }
  const prior = new Map((previous.pages || []).map(page => [page.pageId, page.evidenceDigest]));
  const changedPages = pages.filter(page => prior.get(page.pageId) !== page.evidenceDigest).map(page => page.pageId);
  const needsReview = pages.filter(page => page.verdict !== "PASS" || page.failingRules.length || page.pendingRules.length).map(page => page.pageId);
  return {
    version: "leander-qa-evidence-index.v1",
    generatedAt: new Date().toISOString(),
    totals: {
      pages: pages.length,
      pass: pages.filter(page => page.verdict === "PASS").length,
      needsReview: needsReview.length,
      checks: pages.reduce((sum, page) => sum + Object.values(page.counts).reduce((a, b) => a + b, 0), 0)
    },
    delta: { changedPages, needsReview, reviewerScope: [...new Set([...changedPages, ...needsReview])] },
    pages
  };
}
function writeIndex() { const value = build(); fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(value, null, 2) + "\n", "utf8"); return value; }
function selfTest() {
  const compact = compactQaResult({ pageId: "p01", verdict: "PENDING", checks: [{ ruleId: "a", status: "PASS", evidence: { observation: "ok" } }, { ruleId: "b", status: "PENDING", evidence: {} }] });
  assert.equal(compact.counts.PASS, 1);
  assert.deepStrictEqual(compact.pendingRules, ["b"]);
  assert.equal(compact.ruleDigests.a.length, 16);
  console.log("PASS QA evidence index self-test");
}
function main() {
  if (process.argv.includes("--self-test")) return selfTest();
  const value = process.argv.includes("--write") ? writeIndex() : build();
  console.log(`QA evidence index: pages=${value.totals.pages}; checks=${value.totals.checks}; reviewerScope=${value.delta.reviewerScope.join(",") || "none"}`);
  if (process.argv.includes("--json")) console.log(JSON.stringify(value, null, 2));
}
if (require.main === module) main();
module.exports = { compactQaResult, build, writeIndex, selfTest };
