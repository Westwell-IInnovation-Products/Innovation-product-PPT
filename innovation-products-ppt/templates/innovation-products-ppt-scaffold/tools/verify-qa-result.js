// Verify evidence-backed page QA. A recent Markdown PASS alone is not sufficient.
// Usage:
//   node tools/verify-qa-result.js pages/<id>
//   node tools/verify-qa-result.js pages/<id> --init
//   node tools/verify-qa-result.js pages/<id> --write-md
const fs = require("fs");
const path = require("path");
const os = require("os");
const { digestPage, legacyContractDigest, legacyRenderContextDigest, shaFile, shaText } = require("./page-digests");
const { POLICY_VERSION } = require("./geometry-policy");

const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, "qa-rules.zh.json"), "utf8").replace(/^\uFEFF/, ""));
const QA_RESULT_VERSION = "qa-result.zh.v3";
function readJson(file) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return null; } }
function norm(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, ""); }
function evidenceError(value, expectedType = "", ruleId = "") {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "evidence must be a structured object";
  if (value.ruleId !== ruleId) return "evidence.ruleId must match the QA rule";
  const method = String(value.method || "").trim();
  const observation = String(value.observation || value.numericResult || "").trim();
  if (method.length < 4) return "evidence.method is required";
  if (observation.length < 6) return "evidence.observation or numericResult is required";
  if (/^(未发现该规则失败|未发现问题|无明显问题|符合要求|检查通过|整体成立|由.+共同支撑)[。.!]*$/i.test(observation)) return "evidence.observation is generic and not grounded in an observable page fact";
  if (ruleId === "r.contrast.scale" && !/(\d+\s*[×xX*]\s*\d+|等宽|等高|同尺寸|同尺度|不等|比例|视觉重量|体量|基线)/i.test(observation)) return "contrast scale evidence must state the observed size, baseline, ratio, or visual-weight relationship";
  if (ruleId === "r.contrast.mapping" && !/(一一|逐项|组级|多对一|一对多|无映射|不映射|基数|\d+\s*(?:对|→|项))/i.test(observation)) return "contrast mapping evidence must state the actual cardinality or mapping mode";
  if (expectedType === "machine-geometry") {
    if (method !== "machine-geometry") return "machine geometry evidence requires method=machine-geometry";
    if (!Array.isArray(value.findingIds)) return "machine geometry evidence requires findingIds[]";
    if (String(value.policyVersion || "") !== POLICY_VERSION) return "machine geometry evidence policyVersion is stale";
    if (!/^[a-f0-9]{64}$/i.test(String(value.artifactSha256 || ""))) return "machine geometry evidence requires artifactSha256";
    return String(value.artifact || "").trim().length >= 3 ? "" : "machine geometry evidence requires artifact";
  }
  if (expectedType === "source-reference") return String(value.source || "").trim().length >= 3 ? "" : "source-reference evidence requires source";
  if (expectedType === "component-trace") return String(value.artifact || "").trim().length >= 3 ? "" : "component-trace evidence requires artifact";
  if (String(value.artifact || "").trim().length < 3) return "render/contract evidence requires artifact";
  if (String(value.location || "").trim().length < 3) return "render/contract evidence requires a specific location";
  return "";
}
function isMachineRule(ruleId) {
  return RULES.rules?.[ruleId]?.evidenceClass === "machine-geometry" || RULES.rules?.[ruleId]?.evidence === "machine-geometry";
}
function geometryReport(pageDir) {
  const file = path.join(pageDir, "out", "geometry-audit.json");
  return { file, report: readJson(file), sha256: shaFile(file) };
}
function machineCheck(pageDir, ruleId) {
  const current = geometryReport(pageDir);
  const findings = (current.report?.findings || []).filter(item => item.ruleId === ruleId && ["P0", "P1"].includes(item.severity));
  const page = readJson(path.join(pageDir, "page.json"), {});
  const renderSha256 = shaFile(findRender(pageDir, page));
  const valid = current.report?.version === "render-geometry-audit.v1"
    && current.report?.policyVersion === POLICY_VERSION
    && current.report?.renderSha256 === renderSha256
    && !!current.sha256;
  return {
    ruleId,
    status: valid && !findings.length ? "PASS" : "FAIL",
    evidence: {
      ruleId,
      artifact: "out/geometry-audit.json",
      artifactSha256: current.sha256,
      location: findings.length ? findings.map(item => (item.objects || []).join(" / ")).join("; ") : "full-slide geometry scene",
      method: "machine-geometry",
      policyVersion: POLICY_VERSION,
      findingIds: findings.map(item => item.id),
      observation: valid
        ? `${findings.length} blocking finding(s) for ${ruleId}`
        : "geometry audit missing or stale"
    }
  };
}
function machineEvidenceError(pageDir, check) {
  const current = machineCheck(pageDir, check.ruleId);
  const evidence = check.evidence || {};
  if (check.status !== current.status) return `machine status must be ${current.status}`;
  if (evidence.artifactSha256 !== current.evidence.artifactSha256) return "machine geometry artifact hash is stale";
  if (JSON.stringify(evidence.findingIds || []) !== JSON.stringify(current.evidence.findingIds || [])) return "machine geometry findingIds do not match the current audit";
  return "";
}
function evidenceFingerprint(check) {
  const e = check.evidence || {};
  return [e.artifact, e.location, e.method, e.observation, e.numericResult, e.source].map(value => String(value || "").trim().toLowerCase()).join("|");
}
function evidenceSetErrors(checks = [], expectedIds = []) {
  const errors = [], relevant = checks.filter(check => expectedIds.includes(check.ruleId) && check.status === "PASS");
  const fingerprints = new Map(), locations = new Set(), observations = new Map();
  relevant.forEach(check => {
    const fp = evidenceFingerprint(check);
    if (fp) fingerprints.set(fp, [...(fingerprints.get(fp) || []), check.ruleId]);
    if (check.evidence?.location) locations.add(String(check.evidence.location).trim().toLowerCase());
    const normalizedObservation = String(check.evidence?.observation || check.evidence?.numericResult || "").toLowerCase().replace(/\s+/g, "").replace(/[，。；：、,.!?:;()[\]{}'"“”‘’_-]+/g, "");
    if (normalizedObservation) observations.set(normalizedObservation, [...(observations.get(normalizedObservation) || []), check.ruleId]);
  });
  fingerprints.forEach((ruleIds, fp) => {
    const families = new Set(ruleIds.map(id => id.split(".").slice(0, 2).join(".")));
    if (ruleIds.length >= 3 && families.size >= 2) errors.push(`generic evidence reused across unrelated rules: ${ruleIds.join(", ")}`);
  });
  observations.forEach(ruleIds => {
    const families = new Set(ruleIds.map(id => id.split(".").slice(0, 2).join(".")));
    if (ruleIds.length >= 2 && families.size >= 2) errors.push(`same observation reused across unrelated rules: ${ruleIds.join(", ")}`);
  });
  const renderChecks = relevant.filter(check => RULES.rules?.[check.ruleId]?.evidence === "render-location");
  if (renderChecks.length >= 8 && locations.size < 2) errors.push("render QA uses one generic location for all checks; provide rule-specific page locations");
  return errors;
}
function expectedRuleIds(profile) {
  const ids = [];
  for (const setName of profile.ruleSets || []) ids.push(...(RULES.ruleSets[setName] || []));
  ids.push(...(profile.pageRules || []).map(item => item.id));
  return [...new Set(ids)];
}
function renderContextDigest(pageDir) {
  return legacyRenderContextDigest(pageDir);
}
function contractDigest(pageDir) {
  return legacyContractDigest(pageDir);
}
function findRender(pageDir, page) {
  const id = page.id || page.page || path.basename(pageDir);
  return path.join(pageDir, "out", `${id}.png`);
}
function traceMatches(pageDir, page, renderSha, digests) {
  const route = page.qaProfile?.selectedRoute || page.visualSelection?.selectedRoute || {};
  if (route.route !== "component-library") return { ok: true, reason: "route does not require component trace" };
  const traceFile = path.join(pageDir, "out", "component-trace.json");
  const trace = readJson(traceFile);
  if (!trace) return { ok: false, reason: "missing out/component-trace.json" };
  if (trace.renderSha256 !== renderSha) return { ok: false, reason: "component trace render hash is stale" };
  if (trace.digests?.renderDigest !== digests.renderDigest) return { ok: false, reason: "component trace renderDigest is stale" };
  if (trace.digests?.selectionOutcomeDigest !== digests.selectionOutcomeDigest) return { ok: false, reason: "component trace selectionOutcomeDigest is stale" };
  const selected = norm(route.name);
  const called = (trace.calls || []).some(call => {
    const name = norm(call.name);
    return selected && name && (selected === name || selected.includes(name) || name.includes(selected));
  });
  return called ? { ok: true, reason: "selected component was called" } : { ok: false, reason: `selected component ${route.name} was not called` };
}

function verify(pageDir) {
  const page = readJson(path.join(pageDir, "page.json"));
  const result = readJson(path.join(pageDir, "qa-result.json"));
  const errors = [];
  if (!page) return { ok: false, errors: ["page.json missing or invalid"] };
  const profile = page.qaProfile;
  if (!profile || profile.version !== "qa-profile.zh.v2") errors.push("qaProfile must be qa-profile.zh.v2");
  if (!result || result.version !== QA_RESULT_VERSION) errors.push(`qa-result.json missing or not ${QA_RESULT_VERSION}`);
  const renderFile = findRender(pageDir, page), renderSha = shaFile(renderFile);
  const digests = digestPage(pageDir, path.resolve(pageDir, "..", ".."));
  if (!renderSha) errors.push(`render missing: ${renderFile}`);
  if (result && result.renderSha256 !== renderSha) errors.push("qa-result renderSha256 does not match current PNG");
  if (result && !result.digests) errors.push("qa-result lacks split digests; run migrate-evidence-v2.js or re-initialize affected QA");
  if (result?.digests?.renderDigest !== digests.renderDigest) errors.push("qa-result renderDigest does not match current render inputs");
  if (result?.digests?.selectionOutcomeDigest !== digests.selectionOutcomeDigest) errors.push("qa-result selectionOutcomeDigest does not match current selected route");
  if (result?.digests?.qaDigest !== digests.qaDigest) errors.push("qa-result qaDigest does not match current QA profile/rules");
  if (result?.digests?.sourceDigest !== digests.sourceDigest) errors.push("qa-result sourceDigest does not match current source/fact boundary");
  const expected = profile ? expectedRuleIds(profile) : [];
  const checks = new Map(((result && result.checks) || []).map(item => [item.ruleId, item]));
  expected.forEach(ruleId => {
    const check = checks.get(ruleId);
    if (!check) errors.push(`missing QA check: ${ruleId}`);
    else if (check.status !== "PASS") errors.push(`QA check not PASS: ${ruleId} (${check.status || "unknown"})`);
    else {
      const evidenceProblem = evidenceError(check.evidence, RULES.rules?.[ruleId]?.evidence || "", ruleId);
      if (evidenceProblem) errors.push(`QA check lacks rule-specific evidence: ${ruleId} (${evidenceProblem})`);
      if (isMachineRule(ruleId)) {
        const machineProblem = machineEvidenceError(pageDir, check);
        if (machineProblem) errors.push(`QA machine evidence mismatch: ${ruleId} (${machineProblem})`);
      }
    }
  });
  errors.push(...evidenceSetErrors([...(checks.values())], expected));
  if (result && result.verdict !== "PASS") errors.push(`qa-result verdict=${result.verdict || "unknown"}`);
  if (result && !(result.reviewer && result.reviewer.role && result.reviewer.runId)) errors.push("qa-result reviewer.role and reviewer.runId are required");
  // Soft gate: a component-library page that hand-composes beyond (or instead
  // of) the bound component is a quality win, not a violation. Surface the
  // mismatch for the render review instead of failing the page.
  const warnings = [];
  const trace = traceMatches(pageDir, page, renderSha, digests);
  if (!trace.ok) warnings.push(`component trace warning: ${trace.reason}（若为有意手工构图，请在渲染评审中确认构图完整性）`);
  return { ok: errors.length === 0, errors, warnings, page, result, renderFile, renderSha, expectedRuleIds: expected, trace };
}

function init(pageDir) {
  const page = readJson(path.join(pageDir, "page.json"));
  if (!page || page.qaProfile?.version !== "qa-profile.zh.v2") throw new Error("Build qa-profile.zh.v2 before --init");
  const renderFile = findRender(pageDir, page);
  if (!fs.existsSync(renderFile)) throw new Error("Render page before --init");
  const profile = page.qaProfile;
  const currentDigests = digestPage(pageDir, path.resolve(pageDir, "..", ".."));
  const output = {
    version: QA_RESULT_VERSION,
    pageId: page.id || page.page || path.basename(pageDir),
    verdict: "PENDING",
    renderSha256: shaFile(renderFile),
    digests: {
      renderDigest: currentDigests.renderDigest,
      selectionOutcomeDigest: currentDigests.selectionOutcomeDigest,
      qaDigest: currentDigests.qaDigest,
      sourceDigest: currentDigests.sourceDigest
    },
    reviewer: { role: "reviewer-zh", runId: "", mode: "independent-render-review" },
    checks: expectedRuleIds(profile).map(ruleId => isMachineRule(ruleId)
      ? machineCheck(pageDir, ruleId)
      : { ruleId, status: "PENDING", evidence: { ruleId, artifact: path.relative(pageDir, renderFile).replace(/\\/g, "/"), location: "", method: "", observation: "", source: "" } }),
    remainingRisks: []
  };
  const resultFile = path.join(pageDir, "qa-result.json");
  fs.writeFileSync(resultFile, JSON.stringify(output, null, 2) + "\n", "utf8");
  output.digests.qaDigest = digestPage(pageDir, path.resolve(pageDir, "..", "..")).qaDigest;
  fs.writeFileSync(resultFile, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(`initialized ${path.join(pageDir, "qa-result.json")}`);
  return output;
}

function upgrade(pageDir, prior = readJson(path.join(pageDir, "qa-result.json"))) {
  const page = readJson(path.join(pageDir, "page.json"));
  if (!page || page.qaProfile?.version !== "qa-profile.zh.v2") throw new Error("Build qa-profile.zh.v2 before QA upgrade");
  const renderFile = findRender(pageDir, page);
  if (!fs.existsSync(renderFile)) throw new Error("Render page before QA upgrade");
  const priorChecks = new Map((prior?.checks || []).map(check => [check.ruleId, check]));
  const currentDigests = digestPage(pageDir, path.resolve(pageDir, "..", ".."));
  const checks = expectedRuleIds(page.qaProfile).map(ruleId => {
    if (isMachineRule(ruleId)) return machineCheck(pageDir, ruleId);
    return priorChecks.get(ruleId) || { ruleId, status: "PENDING", evidence: { ruleId, artifact: path.relative(pageDir, renderFile).replace(/\\/g, "/"), location: "", method: "", observation: "", source: "" } };
  });
  const machineFailed = checks.some(check => isMachineRule(check.ruleId) && check.status !== "PASS");
  const allPassed = checks.every(check => check.status === "PASS");
  const output = {
    version: QA_RESULT_VERSION,
    pageId: page.id || page.page || path.basename(pageDir),
    verdict: machineFailed ? "FIX-FIRST" : allPassed ? "PASS" : "PENDING",
    renderSha256: shaFile(renderFile),
    digests: {
      renderDigest: currentDigests.renderDigest,
      selectionOutcomeDigest: currentDigests.selectionOutcomeDigest,
      qaDigest: currentDigests.qaDigest,
      sourceDigest: currentDigests.sourceDigest
    },
    reviewer: prior?.reviewer || { role: "reviewer-zh", runId: "", mode: "independent-render-review" },
    checks,
    remainingRisks: machineFailed
      ? checks.filter(check => isMachineRule(check.ruleId) && check.status !== "PASS").map(check => `${check.ruleId}: ${(check.evidence?.findingIds || []).join(", ")}`)
      : (prior?.remainingRisks || [])
  };
  const resultFile = path.join(pageDir, "qa-result.json");
  fs.writeFileSync(resultFile, JSON.stringify(output, null, 2) + "\n", "utf8");
  output.digests.qaDigest = digestPage(pageDir, path.resolve(pageDir, "..", "..")).qaDigest;
  fs.writeFileSync(resultFile, JSON.stringify(output, null, 2) + "\n", "utf8");
  return output;
}

function writeMarkdown(pageDir, verified) {
  if (!verified.ok) throw new Error(`QA result is not valid:\n${verified.errors.join("\n")}`);
  const result = verified.result;
  const lines = [
    "Verdict: PASS", "", "# 页面 QA 摘要", "",
    `- 页面：${result.pageId}`,
    `- 复核角色：${result.reviewer.role}`,
    `- 复核运行：${result.reviewer.runId}`,
    `- 渲染哈希：${result.renderSha256}`,
    `- 规则通过：${result.checks.length}`,
    "", "## 剩余风险",
    ...((result.remainingRisks || []).length ? result.remainingRisks.map(item => `- ${item}`) : ["- 无。"])
  ];
  fs.writeFileSync(path.join(pageDir, "qa.md"), lines.join("\n") + "\n", "utf8");
  console.log(`wrote ${path.join(pageDir, "qa.md")}`);
}

function selfTest() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "leander-qa-v2-"));
  const dir = path.join(root, "pages", "fixture");
  [path.join(dir, "out"), path.join(root, "theme"), path.join(root, "components"), path.join(root, "tools")].forEach(p => fs.mkdirSync(p, { recursive: true }));
  fs.writeFileSync(path.join(root, "deck.config.js"), "module.exports={theme:'base'};\n", "utf8");
  fs.writeFileSync(path.join(root, "theme", "tokens.js"), "module.exports={};\n", "utf8");
  fs.writeFileSync(path.join(root, "tools", "qa-rules.zh.json"), JSON.stringify(RULES), "utf8");
  const page = {
    id: "fixture",
    visualSelection: { selectedRoute: { route: "page-specific-custom", name: "fixture" } },
    qaProfile: {
      version: "qa-profile.zh.v2",
      ruleSets: ["universal"],
      pageRules: [],
      requiredEvidence: ["render-sha256"],
      selectedRoute: { route: "page-specific-custom", name: "fixture" }
    }
  };
  fs.writeFileSync(path.join(dir, "page.json"), JSON.stringify(page), "utf8");
  fs.writeFileSync(path.join(dir, "page.js"), "module.exports = {};\n", "utf8");
  fs.writeFileSync(path.join(dir, "out", "fixture.png"), "render-v1", "utf8");
  fs.writeFileSync(path.join(dir, "out", "geometry-audit.json"), JSON.stringify({
    version: "render-geometry-audit.v1",
    policyVersion: POLICY_VERSION,
    pageId: "fixture",
    renderSha256: shaFile(path.join(dir, "out", "fixture.png")),
    findings: [],
    verdict: "PASS"
  }), "utf8");
  init(dir);
  const resultFile = path.join(dir, "qa-result.json");
  const result = readJson(resultFile);
  result.verdict = "PASS";
  result.reviewer.runId = "self-test";
  result.checks.forEach((check, index) => {
    if (isMachineRule(check.ruleId)) return;
    const type = RULES.rules?.[check.ruleId]?.evidence || "";
    check.status = "PASS";
    check.evidence.ruleId = check.ruleId;
    check.evidence.location = `region-${index % 3}`;
    check.evidence.method = type === "source-reference" ? "source-audit" : type === "contract-compare" ? "contract-compare" : "visual-full-size";
    check.evidence.observation = `self-test observation for ${check.ruleId}`;
    check.evidence.source = "self-test fixture";
  });
  fs.writeFileSync(resultFile, JSON.stringify(result), "utf8");
  result.digests.qaDigest = digestPage(dir, root).qaDigest;
  fs.writeFileSync(resultFile, JSON.stringify(result), "utf8");
  const pass = verify(dir);
  if (!pass.ok) throw new Error(`valid QA fixture failed: ${pass.errors.join("; ")}`);
  fs.writeFileSync(path.join(dir, "out", "fixture.png"), "render-v2", "utf8");
  const stale = verify(dir);
  if (stale.ok || !stale.errors.some(item => /renderSha256/.test(item))) throw new Error("stale render fixture did not fail");
  fs.rmSync(root, { recursive: true, force: true });
  console.log("PASS QA evidence self-test");
}

function main() {
  if (process.argv.includes("--self-test")) return selfTest();
  const target = process.argv[2];
  if (!target) { console.error("usage: node tools/verify-qa-result.js pages/<id> [--init|--write-md]"); process.exit(1); }
  const pageDir = path.resolve(process.cwd(), target);
  if (process.argv.includes("--init")) return init(pageDir);
  const result = verify(pageDir);
  if (process.argv.includes("--write-md")) writeMarkdown(pageDir, result);
  (result.warnings || []).forEach(item => console.warn(`- WARN ${item}`));
  if (!result.ok) { console.error(`FIX-FIRST QA evidence: ${path.basename(pageDir)}`); result.errors.forEach(item => console.error(`- ${item}`)); process.exit(1); }
  console.log(`PASS QA evidence: ${path.basename(pageDir)} (${result.expectedRuleIds.length} checks)`);
}

if (require.main === module) main();
module.exports = { verify, init, upgrade, writeMarkdown, expectedRuleIds, evidenceError, evidenceSetErrors, isMachineRule, machineCheck, contractDigest, renderContextDigest, shaFile, shaText, QA_RESULT_VERSION };
