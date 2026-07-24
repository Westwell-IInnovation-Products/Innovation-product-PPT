// Batch initialize/apply page QA without discarding still-current PASS evidence.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const PAGES = path.join(ROOT, "pages");
const { init, upgrade, verify, writeMarkdown, evidenceError, evidenceSetErrors, isMachineRule, machineCheck } = require("./verify-qa-result");
const { digestPage, shaFile } = require("./page-digests");
const { writeIndex } = require("./qa-evidence-index");
const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, "qa-rules.zh.json"), "utf8").replace(/^\uFEFF/, ""));
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8"); }
function arg(name, fallback = "") { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
function dirs() {
  const wanted = new Set(arg("pages").split(",").filter(Boolean));
  return fs.existsSync(PAGES) ? fs.readdirSync(PAGES).filter(dir => fs.existsSync(path.join(PAGES, dir, "page.json"))).filter(dir => {
    const page = readJson(path.join(PAGES, dir, "page.json"), {}); return !wanted.size || wanted.has(dir) || wanted.has(String(page.id || ""));
  }).sort() : [];
}
function validateMergedChecks(checks) {
  const errors = [];
  checks.forEach(check => {
    if (check.status !== "PASS") errors.push(`${check.ruleId}: status must be PASS`);
    else {
      const problem = evidenceError(check.evidence, RULES.rules?.[check.ruleId]?.evidence || "", check.ruleId);
      if (problem) errors.push(`${check.ruleId}: ${problem}`);
    }
  });
  errors.push(...evidenceSetErrors(checks, checks.map(check => check.ruleId)));
  return errors;
}
function initialize() {
  const rows = [];
  for (const dir of dirs()) {
    const pageDir = path.join(PAGES, dir), current = verify(pageDir), page = readJson(path.join(pageDir, "page.json"), {}), result = readJson(path.join(pageDir, "qa-result.json"));
    const digests = digestPage(pageDir, ROOT), render = path.join(pageDir, "out", `${page.id || dir}.png`);
    const renderBound = result?.renderSha256 === shaFile(render)
      && result?.digests?.renderDigest === digests.renderDigest
      && result?.digests?.selectionOutcomeDigest === digests.selectionOutcomeDigest
      && result?.digests?.sourceDigest === digests.sourceDigest;
    if (current.ok) rows.push({ dir, action: "preserved-current-pass" });
    else if (renderBound) {
      upgrade(pageDir, result);
      const upgraded = verify(pageDir);
      rows.push({ dir, action: upgraded.ok ? "upgraded-current-pass" : "upgraded-current-work", priorErrors: upgraded.errors.slice(0, 3) });
    }
    else { init(pageDir); rows.push({ dir, action: "initialized-affected-page", priorErrors: current.errors.slice(0, 3) }); }
  }
  writeIndex();
  return rows;
}
function applyBatch(file) {
  const batch = readJson(path.resolve(ROOT, file));
  if (!batch || batch.version !== "qa-review-batch.v1" || !batch.reviewer?.role || !batch.reviewer?.runId) throw new Error("batch must be qa-review-batch.v1 with reviewer.role/runId");
  const rows = [];
  for (const dir of dirs()) {
    const pageDir = path.join(PAGES, dir), page = readJson(path.join(pageDir, "page.json"), {}), id = String(page.id || dir);
    const patch = batch.pages?.[id] || batch.pages?.[dir];
    if (!patch) { rows.push({ dir, action: "no-batch-evidence" }); continue; }
    const resultFile = path.join(pageDir, "qa-result.json"), result = readJson(resultFile);
    if (!result) throw new Error(`${dir}: initialize QA before applying batch evidence`);
    result.reviewer = { ...result.reviewer, ...batch.reviewer };
    result.verdict = patch.verdict || "PENDING";
    result.remainingRisks = patch.remainingRisks || [];
    const checks = patch.checks || {};
    const mergedChecks = (result.checks || []).map(check => {
      if (isMachineRule(check.ruleId)) return machineCheck(pageDir, check.ruleId);
      return checks[check.ruleId] ? { ...check, ...checks[check.ruleId] } : check;
    });
    if (mergedChecks.some(check => isMachineRule(check.ruleId) && check.status !== "PASS")) {
      result.verdict = "FIX-FIRST";
    }
    if (result.verdict === "PASS") {
      const evidenceErrors = validateMergedChecks(mergedChecks);
      if (evidenceErrors.length) throw new Error(`${dir}: batch QA evidence rejected: ${evidenceErrors.slice(0, 8).join("; ")}`);
    }
    result.checks = mergedChecks;
    writeJson(resultFile, result);
    result.digests.qaDigest = digestPage(pageDir, ROOT).qaDigest;
    writeJson(resultFile, result);
    const checked = verify(pageDir);
    if (checked.ok) writeMarkdown(pageDir, checked);
    rows.push({ dir, action: checked.ok ? "applied-pass" : "applied-pending", errors: checked.errors.slice(0, 5) });
  }
  writeIndex();
  return rows;
}
function main() {
  if (process.argv.includes("--self-test")) {
    const checks = ["u.geometry.overlap", "u.color.semantic", "r.sequence.direction"].map(ruleId => ({ ruleId, status: "PASS", evidence: { ruleId, artifact: "out/test.png", location: "full-slide", method: "visual-contact-sheet", observation: "same generic observation" } }));
    const errors = validateMergedChecks(checks);
    if (!errors.some(error => /generic evidence reused/.test(error))) throw new Error("generic QA evidence was not rejected");
    console.log("PASS QA batch specificity self-test");
    return;
  }
  const command = process.argv[2] || "init", rows = command === "init" ? initialize() : command === "apply" ? applyBatch(arg("file")) : null;
  if (!rows) throw new Error("usage: qa-batch.js init [--pages p01,p02] | apply --file output/qa-review-batch.json [--pages ...]");
  rows.forEach(row => console.log(`${row.action.toUpperCase()} ${row.dir}${row.errors?.length ? `: ${row.errors.join("; ")}` : ""}`));
  console.log(`QA batch processed ${rows.length} pages.`);
}
try { if (require.main === module) main(); } catch (error) { console.error(error.message); process.exit(1); }
module.exports = { initialize, applyBatch, validateMergedChecks };
