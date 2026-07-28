// Content-layer theme-fidelity gate.
// Combines page.json declarations, page.js exports, shared-component mappings,
// and machine-testable composition proxies. Color/chrome alone never passes.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ROOT = path.join(__dirname, "..");
const PAGES = path.join(ROOT, "pages");
const OUTPUT = path.join(ROOT, "output");
const { getContentFidelity, normalizeThemeId } = require("../theme/content-fidelity");
const COMPONENT_INDEX = readJson(path.join(__dirname, "component-index.min.json"), { components: [] });

function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); }
  catch { return fallback; }
}
function text(value) { return String(value || "").trim(); }
function featureIds(value) {
  return [...new Set((Array.isArray(value) ? value : []).map(item => text(typeof item === "string" ? item : item?.id)).filter(Boolean))];
}
function isChrome(page = {}) {
  return /(^|[.\s_-])(cover|closing)($|[.\s_-])|brand-(cover|closing)/i.test([
    page.relationship, page.relationshipSubtype, page.storyRole,
    page.visualSelection?.relationship, page.visualSelection?.relationshipSubtype
  ].join(" "));
}
function moduleEvidence(pageDir) {
  const file = path.join(pageDir, "page.js");
  if (!fs.existsSync(file)) return null;
  try {
    delete require.cache[require.resolve(file)];
    return require(file).themeFidelity || null;
  } catch {
    return null;
  }
}
function inputDigest(pageDir, themeId = "") {
  const hash = crypto.createHash("sha256");
  for (const name of ["page.json", "page.js"]) {
    const file = path.join(pageDir, name);
    hash.update(name);
    hash.update(fs.existsSync(file) ? fs.readFileSync(file) : "");
  }
  hash.update(normalizeThemeId(themeId));
  return hash.digest("hex");
}
function selectedComponent(page = {}) {
  const selected = page.visualSelection?.selectedRoute || {};
  return selected.route === "component-library" ? text(selected.name) : "";
}
function inferCompositionFeatures(themeId, composition = {}) {
  const inferred = [];
  if (themeId === "leander-global") {
    if (composition.evidenceDominant && Number(composition.evidenceSlots || 0) >= 1) inferred.push("evidence-dominant-main");
    if (composition.kpiRail?.compact && Number(composition.kpiRail?.count || 0) >= 4) inferred.push("compact-kpi-rail");
    if (Number(composition.tableRows || 0) >= 4) inferred.push("engineering-variable-table");
    if (Number(composition.deltaPairs || 0) >= 2) inferred.push("delta-comparison");
    if (Number(composition.pendingStates || 0) >= 1 && Number(composition.inventedPendingValues || 0) === 0) inferred.push("pending-simulation-state");
    if (composition.evidenceDominant && Number(composition.secondaryInfoCards || 0) <= 2) inferred.push("asymmetric-technical-layout");
    if (Number(composition.calloutAnchors || 0) >= 2) inferred.push("precise-callout-anchors");
    if (Number(composition.tableRows || 0) >= 4 || composition.kpiRail?.compact) inferred.push("ruled-information-hierarchy");
  }
  return inferred;
}
function inspectPage(page, options = {}) {
  const selected = page.visualSelection?.selectedRoute || {};
  const contract = page.themeFidelity || page.visualSelection?.themeFidelity || null;
  const configuredTheme = options.theme || contract?.theme || "leander-base";
  const themeId = normalizeThemeId(configuredTheme);
  const profile = getContentFidelity(themeId);
  const errors = [], warnings = [];
  if (isChrome(page)) return {
    pageId: page.id || "page",
    theme: themeId,
    verdict: "PASS",
    skipped: "theme-chrome",
    errors,
    warnings,
    humanReviewRequired: false,
    inputDigest: options.inputDigest || ""
  };

  const route = text(selected.route);
  const custom = route === "page-specific-custom";
  const componentName = selectedComponent(page);
  const moduleContract = options.moduleThemeFidelity || null;
  const composition = contract?.composition || {};
  const declared = featureIds(contract?.features);
  const moduleFeatures = featureIds(moduleContract?.features);
  const componentMeta = (COMPONENT_INDEX.components || []).find(item => text(item.name).toLowerCase() === componentName.toLowerCase());
  const mapped = featureIds(componentMeta?.themeFidelityFeatures?.[themeId] || profile.componentFeatureMap?.[componentName]);
  const inferred = inferCompositionFeatures(themeId, composition);
  const implemented = [...new Set([...moduleFeatures, ...mapped, ...inferred])];
  const validDeclared = declared.filter(id => profile.features[id]);
  const invalidDeclared = declared.filter(id => !profile.features[id]);
  const categories = new Set(validDeclared.map(id => profile.features[id]?.category).filter(Boolean));
  const unimplemented = validDeclared.filter(id => !implemented.includes(id));

  if (custom && !contract) errors.push("page-specific-custom requires themeFidelity evidence");
  if (contract) {
    if (contract.version !== "theme-fidelity.v1") errors.push("themeFidelity.version must be theme-fidelity.v1");
    if (normalizeThemeId(contract.theme) !== themeId) errors.push(`themeFidelity.theme must match ${themeId}`);
    if (!text(contract.archetype)) errors.push("themeFidelity.archetype missing");
    if (invalidDeclared.length) errors.push(`unknown or skin-only theme features: ${invalidDeclared.join(", ")}`);
    if (validDeclared.length < profile.minimumFeatures) errors.push(`theme fidelity needs at least ${profile.minimumFeatures} non-chrome features; got ${validDeclared.length}`);
    if (categories.size < profile.minimumCategories) errors.push(`theme fidelity needs at least ${profile.minimumCategories} feature categories; got ${categories.size}`);
    if (custom && !moduleContract) errors.push("page-specific-custom page.js must export themeFidelity");
    if (moduleContract) {
      if (normalizeThemeId(moduleContract.theme) !== themeId) errors.push("page.js themeFidelity.theme does not match page contract");
      if (text(moduleContract.archetype) !== text(contract.archetype)) errors.push("page.js themeFidelity.archetype does not match page contract");
      if (unimplemented.length) errors.push(`declared theme features lack page.js/component/composition implementation evidence: ${unimplemented.join(", ")}`);
    }
  }

  const grid = composition.uniformCardGrid || {};
  const gridCount = Number(grid.count || (Number(grid.rows || 0) * Number(grid.columns || 0)));
  const emptyCards = Number(grid.emptyCards || 0);
  const genericGrid = grid.uniform === true && gridCount >= 6 && emptyCards >= 4;
  const engineeringEvidence = composition.evidenceDominant
    || Number(composition.tableRows || 0) >= 4
    || Number(composition.deltaPairs || 0) >= 2
    || (composition.kpiRail?.compact && Number(composition.kpiRail?.count || 0) >= 4);
  const genericComponent = /^(metricCards|featureGrid|dashboardMock|scenarioBankGrid|painCards)$/i.test(componentName);
  const highCapacity = text(page.contentDensity).toLowerCase() === "high"
    || Number(page.contentShape?.maxItems || page.visualSelection?.contentShape?.maxItems || 0) >= 6;

  if (themeId === "leander-global" && genericGrid && Number(composition.secondaryInfoCards || 0) >= 3 && !engineeringEvidence) {
    errors.push("Global body is a generic uniform card wall: 2×3 empty metric cards plus ordinary information cards is skin-only, not theme fidelity");
  }
  if (themeId === "leander-global" && highCapacity && genericComponent && !engineeringEvidence) {
    errors.push(`Global high-capacity page cannot use ${componentName} as an equal-weight dashboard/card fallback`);
  }
  if (themeId === "leander-global" && contract && !profile.preferredArchetypes.includes(contract.archetype)) {
    warnings.push(`Global archetype ${contract.archetype} is not a preferred engineering composition`);
  }
  if (themeId === "leander-global" && Number(composition.pendingStates || 0) > 0 && Number(composition.inventedPendingValues || 0) > 0) {
    errors.push("pending simulation/measurement states must not contain invented values");
  }
  if (!contract && !custom) warnings.push("themeFidelity evidence missing; contact-sheet reviewer must verify the body is not a generic reskin");

  const score = Math.min(100, Math.round((implemented.filter(id => profile.features[id]).length / Math.max(1, profile.minimumFeatures)) * 70)
    + (profile.preferredArchetypes.includes(contract?.archetype) ? 20 : 0)
    + (errors.length ? 0 : 10));
  return {
    pageId: page.id || page.page || "page",
    theme: themeId,
    route,
    archetype: contract?.archetype || "",
    declaredFeatures: validDeclared,
    implementedFeatures: implemented.filter(id => profile.features[id]),
    featureCategories: [...categories],
    composition,
    fidelityScore: Math.min(100, score),
    verdict: errors.length ? "FIX-FIRST" : "PASS",
    errors,
    warnings,
    humanReviewRequired: themeId === "leander-global" || warnings.length > 0,
    humanReviewInstruction: "Compare the current full-size PNG and contact sheet against approved anchors; verify body composition, not only colors/chrome.",
    inputDigest: options.inputDigest || ""
  };
}

function pageDirs(wanted = new Set()) {
  if (!fs.existsSync(PAGES)) return [];
  return fs.readdirSync(PAGES).filter(dir => fs.existsSync(path.join(PAGES, dir, "page.json"))).filter(dir => {
    const page = readJson(path.join(PAGES, dir, "page.json"), {});
    return !wanted.size || wanted.has(dir) || wanted.has(String(page.id || ""));
  }).sort();
}
function writeReport(rows) {
  const report = {
    version: "theme-fidelity-audit.v1",
    generatedAt: new Date().toISOString(),
    verdict: rows.some(row => row.verdict !== "PASS") ? "FIX-FIRST" : "PASS",
    humanReviewPages: rows.filter(row => row.humanReviewRequired).map(row => row.pageId),
    pages: rows
  };
  fs.mkdirSync(OUTPUT, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT, "theme-fidelity-audit.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  const md = [
    "# 主题保真审计", "",
    `- 结论：${report.verdict}`,
    `- 页面：${rows.length}`,
    `- 需联系表/全尺寸人工复核：${report.humanReviewPages.join(", ") || "无"}`, "",
    ...rows.flatMap(row => [
      `## ${row.pageId} / ${row.theme} / ${row.verdict}`,
      `- Archetype：${row.archetype || "未声明"}`,
      `- 已落实内容特征：${row.implementedFeatures?.join(", ") || "无"}`,
      ...row.errors.map(item => `- 阻塞：${item}`),
      ...row.warnings.map(item => `- 提醒：${item}`),
      ""
    ])
  ].join("\n");
  fs.writeFileSync(path.join(OUTPUT, "theme-fidelity-audit.md"), md, "utf8");
  return report;
}
function selfTest() {
  const assert = require("assert");
  const fixtures = path.join(ROOT, "tests", "theme-fidelity");
  const bad = readJson(path.join(fixtures, "global-generic-dashboard.json"));
  const good = readJson(path.join(fixtures, "global-engineering-evidence.json"));
  const badResult = inspectPage(bad, { theme: "leander-global", moduleThemeFidelity: bad._testModuleFidelity });
  const goodResult = inspectPage(good, { theme: "leander-global", moduleThemeFidelity: good._testModuleFidelity });
  assert.equal(badResult.verdict, "FIX-FIRST");
  assert(badResult.errors.some(item => /generic uniform card wall/.test(item)));
  assert.equal(goodResult.verdict, "PASS", goodResult.errors.join("; "));
  assert(goodResult.implementedFeatures.includes("engineering-variable-table"));
  const chromeResult = inspectPage({
    id: "cover-fixture",
    relationship: "cover"
  }, {
    theme: "leander-global",
    inputDigest: "cover-input-digest"
  });
  assert.equal(chromeResult.verdict, "PASS");
  assert.equal(chromeResult.skipped, "theme-chrome");
  assert.equal(chromeResult.inputDigest, "cover-input-digest");
  const skinOnly = inspectPage({
    id: "skin-only", contentDensity: "high",
    visualSelection: { selectedRoute: { route: "page-specific-custom", name: "custom-composition" } },
    themeFidelity: { version: "theme-fidelity.v1", theme: "leander-global", archetype: "global.engineering-evidence", features: ["global-blue", "global-footer"], composition: {} }
  }, { theme: "leander-global", moduleThemeFidelity: { theme: "leander-global", archetype: "global.engineering-evidence", features: ["global-blue", "global-footer"] } });
  assert.equal(skinOnly.verdict, "FIX-FIRST");
  assert(skinOnly.errors.some(item => /skin-only/.test(item)));
  console.log("PASS theme fidelity negative/positive fixtures");
}
function main() {
  if (process.argv.includes("--self-test")) return selfTest();
  const direct = process.argv.slice(2).find(arg => !arg.startsWith("--") && fs.existsSync(path.resolve(arg)));
  const cfg = (() => { try { return require(path.join(ROOT, "deck.config.js")); } catch { return {}; } })();
  if (direct) {
    const file = path.resolve(direct);
    const page = readJson(file, {});
    const theme = cfg.theme || page.themeFidelity?.theme;
    const row = inspectPage(page, {
      theme,
      moduleThemeFidelity: moduleEvidence(path.dirname(file)),
      inputDigest: inputDigest(path.dirname(file), theme)
    });
    console.log(JSON.stringify(row, null, 2));
    if (row.verdict !== "PASS") process.exit(1);
    return;
  }
  const index = process.argv.indexOf("--pages");
  const wanted = new Set(index >= 0 && process.argv[index + 1] ? process.argv[index + 1].split(",").map(v => v.trim()).filter(Boolean) : []);
  const rows = pageDirs(wanted).map(dir => {
    const pageDir = path.join(PAGES, dir);
    return inspectPage(readJson(path.join(pageDir, "page.json"), {}), {
      theme: cfg.theme,
      moduleThemeFidelity: moduleEvidence(pageDir),
      inputDigest: inputDigest(pageDir, cfg.theme)
    });
  });
  const report = writeReport(rows);
  rows.forEach(row => console.log(`${row.verdict === "PASS" ? "PASS" : "FAIL"} ${row.pageId}: ${row.errors.join("; ") || row.warnings.join("; ") || row.archetype || "theme fidelity"}`));
  console.log(`Theme fidelity: ${report.verdict} (${rows.length} pages, ${report.humanReviewPages.length} human-review flags)`);
  if (report.verdict !== "PASS") process.exit(1);
}

if (require.main === module) main();
module.exports = { inspectPage, inferCompositionFeatures, featureIds, inputDigest, writeReport, selfTest };
