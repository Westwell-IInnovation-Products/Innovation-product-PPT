// Verify evidence-backed page QA. A recent Markdown PASS alone is not sufficient.
// Usage:
//   node tools/verify-qa-result.js pages/<id>
//   node tools/verify-qa-result.js pages/<id> --init
//   node tools/verify-qa-result.js pages/<id> --write-md
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, "qa-rules.zh.json"), "utf8").replace(/^\uFEFF/, ""));
function readJson(file) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return null; } }
function shaFile(file) { return fs.existsSync(file) ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") : ""; }
function shaText(text) { return crypto.createHash("sha256").update(String(text)).digest("hex"); }
function norm(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, ""); }
function evidencePresent(value) {
  if (typeof value === "string") return value.trim().length >= 4;
  if (!value || typeof value !== "object") return false;
  return [value.artifact, value.location, value.note, value.source].some(item => String(item || "").trim().length >= 3);
}
function expectedRuleIds(profile) {
  const ids = [];
  for (const setName of profile.ruleSets || []) ids.push(...(RULES.ruleSets[setName] || []));
  ids.push(...(profile.pageRules || []).map(item => item.id));
  return [...new Set(ids)];
}
function renderContextDigest(pageDir) {
  const root = path.resolve(pageDir, "..", "..");
  const configFile = path.join(root, "deck.config.js");
  let config = {};
  try {
    delete require.cache[require.resolve(configFile)];
    config = require(configFile) || {};
  } catch {}
  return shaText(JSON.stringify({ theme: config.theme || "", renderContextVersion: config.renderContextVersion || 1 }));
}
function contractDigest(pageDir) {
  const pageJson = path.join(pageDir, "page.json"), pageJs = path.join(pageDir, "page.js");
  return shaText(`${shaFile(pageJson)}:${shaFile(pageJs)}:${renderContextDigest(pageDir)}`);
}
function findRender(pageDir, page) {
  const id = page.id || page.page || path.basename(pageDir);
  return path.join(pageDir, "out", `${id}.png`);
}
function traceMatches(pageDir, page, renderSha) {
  const route = page.qaProfile?.selectedRoute || page.visualSelection?.selectedRoute || {};
  if (route.route !== "component-library") return { ok: true, reason: "route does not require component trace" };
  const traceFile = path.join(pageDir, "out", "component-trace.json");
  const trace = readJson(traceFile);
  if (!trace) return { ok: false, reason: "missing out/component-trace.json" };
  if (trace.renderSha256 !== renderSha) return { ok: false, reason: "component trace render hash is stale" };
  if (trace.contractSha256 !== contractDigest(pageDir)) return { ok: false, reason: "component trace contract hash is stale" };
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
  if (!result || result.version !== "qa-result.zh.v2") errors.push("qa-result.json missing or not qa-result.zh.v2");
  const renderFile = findRender(pageDir, page), renderSha = shaFile(renderFile);
  if (!renderSha) errors.push(`render missing: ${renderFile}`);
  if (result && result.renderSha256 !== renderSha) errors.push("qa-result renderSha256 does not match current PNG");
  if (result && result.contractSha256 !== contractDigest(pageDir)) errors.push("qa-result contractSha256 does not match current page contract/code");
  if (result && result.profileSha256 !== shaText(JSON.stringify(profile || {}))) errors.push("qa-result profileSha256 does not match current qaProfile");
  const expected = profile ? expectedRuleIds(profile) : [];
  const checks = new Map(((result && result.checks) || []).map(item => [item.ruleId, item]));
  expected.forEach(ruleId => {
    const check = checks.get(ruleId);
    if (!check) errors.push(`missing QA check: ${ruleId}`);
    else if (check.status !== "PASS") errors.push(`QA check not PASS: ${ruleId} (${check.status || "unknown"})`);
    else if (!evidencePresent(check.evidence)) errors.push(`QA check lacks evidence: ${ruleId}`);
  });
  if (result && result.verdict !== "PASS") errors.push(`qa-result verdict=${result.verdict || "unknown"}`);
  if (result && !(result.reviewer && result.reviewer.role && result.reviewer.runId)) errors.push("qa-result reviewer.role and reviewer.runId are required");
  const trace = traceMatches(pageDir, page, renderSha);
  if (!trace.ok) errors.push(`component trace failed: ${trace.reason}`);
  return { ok: errors.length === 0, errors, page, result, renderFile, renderSha, expectedRuleIds: expected, trace };
}

function init(pageDir) {
  const page = readJson(path.join(pageDir, "page.json"));
  if (!page || page.qaProfile?.version !== "qa-profile.zh.v2") throw new Error("Build qa-profile.zh.v2 before --init");
  const renderFile = findRender(pageDir, page);
  if (!fs.existsSync(renderFile)) throw new Error("Render page before --init");
  const profile = page.qaProfile;
  const output = {
    version: "qa-result.zh.v2",
    pageId: page.id || page.page || path.basename(pageDir),
    verdict: "PENDING",
    renderSha256: shaFile(renderFile),
    contractSha256: contractDigest(pageDir),
    profileSha256: shaText(JSON.stringify(profile)),
    reviewer: { role: "reviewer-zh", runId: "", mode: "independent-render-review" },
    checks: expectedRuleIds(profile).map(ruleId => ({ ruleId, status: "PENDING", evidence: { artifact: path.relative(pageDir, renderFile).replace(/\\/g, "/"), location: "", note: "" } })),
    remainingRisks: []
  };
  fs.writeFileSync(path.join(pageDir, "qa-result.json"), JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(`initialized ${path.join(pageDir, "qa-result.json")}`);
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "leander-qa-v2-"));
  fs.mkdirSync(path.join(dir, "out"), { recursive: true });
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
  init(dir);
  const resultFile = path.join(dir, "qa-result.json");
  const result = readJson(resultFile);
  result.verdict = "PASS";
  result.reviewer.runId = "self-test";
  result.checks.forEach(check => { check.status = "PASS"; check.evidence.location = "whole render"; });
  fs.writeFileSync(resultFile, JSON.stringify(result), "utf8");
  const pass = verify(dir);
  if (!pass.ok) throw new Error(`valid QA fixture failed: ${pass.errors.join("; ")}`);
  fs.writeFileSync(path.join(dir, "out", "fixture.png"), "render-v2", "utf8");
  const stale = verify(dir);
  if (stale.ok || !stale.errors.some(item => /renderSha256/.test(item))) throw new Error("stale render fixture did not fail");
  fs.rmSync(dir, { recursive: true, force: true });
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
  if (!result.ok) { console.error(`FIX-FIRST QA evidence: ${path.basename(pageDir)}`); result.errors.forEach(item => console.error(`- ${item}`)); process.exit(1); }
  console.log(`PASS QA evidence: ${path.basename(pageDir)} (${result.expectedRuleIds.length} checks)`);
}

if (require.main === module) main();
module.exports = { verify, expectedRuleIds, contractDigest, renderContextDigest, shaFile, shaText };
