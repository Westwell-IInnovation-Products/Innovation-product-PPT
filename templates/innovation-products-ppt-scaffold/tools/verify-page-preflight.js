// Final visual-contract gate before page production/rendering.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const PAGES = path.join(ROOT, "pages");
const INDEX = JSON.parse(fs.readFileSync(path.join(__dirname, "component-index.min.json"), "utf8").replace(/^\uFEFF/, ""));
const { buildProfile } = require("./build-qa-profile");
const { inspectSelectionDiversity } = require("./visual-selection-diversity");
const { inspectPage: inspectThemeFidelity } = require("./verify-theme-fidelity");
const cfg = require(path.join(ROOT, "deck.config.js"));
const REQUIRED_ROUTES = ["component-library", "external-graphic", "image2", "page-specific-custom"];
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function norm(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, ""); }
function sameName(a, b) { a = norm(a); b = norm(b); return !!a && !!b && (a === b || a.includes(b) || b.includes(a)); }
function blueprint(page) { const data = readJson(path.join(ROOT, "layout-blueprint.json"), {}); return (data.contracts || data.pages || []).find(item => String(item.page || item.id) === String(page.id || page.page)); }
function component(name) { return (INDEX.components || []).find(item => norm(item.name) === norm(name)); }
function themeChromeRole(page = {}, bp = {}, vs = page.visualSelection || {}) {
  const fields = [
    page.storyRole, page.relationship, page.relationshipSubtype, page.skeletonFamily, page.whitespaceIntent,
    bp.storyRole, bp.relationship, bp.relationshipSubtype, bp.skeletonFamily, bp.whitespaceIntent,
    vs.relationship, vs.relationshipSubtype, vs.expressionMode
  ].map(value => String(value || "").toLowerCase());
  if (fields.some(value => /(^|[.\s_-])closing($|[.\s_-])|brand-closing/.test(value))) return "closing";
  if (fields.some(value => /(^|[.\s_-])cover($|[.\s_-])|brand-cover/.test(value))) return "cover";
  return "";
}
function uiCallsFromSource(source) {
  const calls = [];
  const re = /\bui\.([A-Za-z_$][\w$]*)\s*\(/g;
  let match;
  while ((match = re.exec(String(source || "")))) calls.push(match[1]);
  return calls;
}
function inspectThemeChromeContract(page, bp, selected, binding, source) {
  const vs = page.visualSelection || {};
  const role = themeChromeRole(page, bp, vs);
  if (!role) return [];
  const expected = role;
  const errors = [];
  if (String(page.relationship || "").toLowerCase() !== role) errors.push(`theme ${role} page relationship must be "${role}"`);
  if (String(vs.relationship || "").toLowerCase() !== role) errors.push(`visualSelection.relationship must be "${role}" for theme ${role}`);
  if (selected.route !== "component-library" || !sameName(selected.name, expected)) {
    errors.push(`theme ${role} must select component-library/${expected}; custom or alternate routes are blocked`);
  }
  if (binding?.route !== "component-library" || !sameName(binding?.name, expected)) {
    errors.push(`theme ${role} visualBinding must be component-library/${expected}`);
  }
  const calls = uiCallsFromSource(source);
  const expectedCount = calls.filter(name => name === expected).length;
  if (expectedCount !== 1) errors.push(`theme ${role} page.js must call ui.${expected}() exactly once`);
  const extra = [...new Set(calls.filter(name => name !== expected))];
  if (extra.length) errors.push(`theme ${role} page must be pure chrome; extra ui calls are blocked: ${extra.join(", ")}`);
  if (/\btagline\s*:/.test(String(source || ""))) {
    errors.push(`theme ${role} must inherit theme.brand.tagline; explicit tagline override is blocked`);
  }
  const localExtensions = vs.implementation?.localExtensionSlots;
  if (Array.isArray(localExtensions) && localExtensions.length) {
    errors.push(`theme ${role} cannot declare localExtensionSlots; move supporting content to an adjacent content page`);
  }
  return errors;
}
function inspectThemeChromeTrace(page, trace, bp = {}) {
  const role = themeChromeRole(page, bp, page.visualSelection || {});
  if (!role) return [];
  const calls = new Map((trace?.calls || []).map(item => [String(item.name || ""), Number(item.count || 0)]));
  const errors = [];
  if (calls.get(role) !== 1) errors.push(`runtime trace must contain exactly one ui.${role} call`);
  const extra = [...calls.entries()].filter(([name, count]) => name !== role && count > 0).map(([name]) => name);
  if (extra.length) errors.push(`runtime trace for theme ${role} contains non-chrome calls: ${extra.join(", ")}`);
  return errors;
}
function componentSlotCoverage(requiredSlots, item, implementation = {}) {
  const localExtensionSlots = Array.isArray(implementation.localExtensionSlots) ? implementation.localExtensionSlots : [];
  const undeclaredLocal = localExtensionSlots.filter(slot => !requiredSlots.some(value => sameName(value, slot)));
  const absent = requiredSlots.filter(slot =>
    !(item.slots || []).some(value => sameName(value, slot))
    && !localExtensionSlots.some(value => sameName(value, slot))
  );
  const errors = [];
  if (undeclaredLocal.length) errors.push(`localExtensionSlots are not required by the page contract: ${undeclaredLocal.join(", ")}`);
  if (localExtensionSlots.length && !String(implementation.compositionContract || "").trim()) {
    errors.push("localExtensionSlots require an implementation.compositionContract");
  }
  if (absent.length) errors.push(`component lacks required slots: ${absent.join(", ")}`);
  return errors;
}
function implementationBinding(page, pageDir) {
  const declared = page.visualSelection?.implementation?.actualBinding;
  if (declared?.route && declared?.name) return declared;
  const file = path.join(pageDir, "page.js");
  if (!fs.existsSync(file)) return null;
  try { delete require.cache[require.resolve(file)]; return require(file).visualBinding || null; } catch { return null; }
}
function implementationThemeFidelity(pageDir) {
  const file = path.join(pageDir, "page.js");
  if (!fs.existsSync(file)) return null;
  try { delete require.cache[require.resolve(file)]; return require(file).themeFidelity || null; } catch { return null; }
}
function inspect(pageDir) {
  const page = readJson(path.join(pageDir, "page.json"), {}), vs = page.visualSelection || {}, selected = vs.selectedRoute || {}, errors = [], warnings = [];
  const bp = blueprint(page);
  const routes = new Set((vs.candidateRoutes || []).map(item => item.route));
  const missingRoutes = REQUIRED_ROUTES.filter(route => !routes.has(route));
  if (vs.engineVersion !== "visual-selector.v2") errors.push("visual selector must be visual-selector.v2");
  if (missingRoutes.length) errors.push(`four-route evidence incomplete: ${missingRoutes.join(", ")}`);
  for (const candidate of (vs.candidateRoutes || [])) {
    if (!Number.isFinite(Number(candidate.score)) || Number(candidate.score) < 0 || Number(candidate.score) > 100) errors.push(`candidate route score out of range: ${candidate.route}/${candidate.name}`);
    if (!Array.isArray(candidate.reasons) || !candidate.reasons.length) errors.push(`candidate route lacks evaluation reasons: ${candidate.route}/${candidate.name}`);
  }
  if (!selected.route || !selected.name) errors.push("selectedRoute route/name missing");
  if (!Number.isFinite(Number(selected.score)) || Number(selected.score) < 0 || Number(selected.score) > 100) errors.push("selectedRoute score must be within 0-100");
  if (!(vs.candidateRoutes || []).some(item => item.route === selected.route && sameName(item.name, selected.name))) errors.push("selectedRoute is not represented in candidate evidence");
  const binding = implementationBinding(page, pageDir);
  if (!binding?.route || !binding?.name) errors.push("visualBinding/actualBinding is missing");
  else if (binding.route !== selected.route || !sameName(binding.name, selected.name)) errors.push("selectedRoute does not match visualBinding/actualBinding");
  const pageJs = path.join(pageDir, "page.js");
  const source = fs.existsSync(pageJs) ? fs.readFileSync(pageJs, "utf8") : "";
  errors.push(...inspectThemeChromeContract(page, bp || {}, selected, binding, source));
  const chromeRole = themeChromeRole(page, bp || {}, vs);
  const fidelity = inspectThemeFidelity(page, {
    theme: cfg.theme,
    moduleThemeFidelity: implementationThemeFidelity(pageDir)
  });
  errors.push(...fidelity.errors);
  warnings.push(...fidelity.warnings);
  if (!vs.visualSignature) errors.push("visualSignature missing");
  if (bp?.visualSignature && norm(bp.visualSignature) !== norm(vs.visualSignature)) errors.push("blueprint visualSignature was not preserved");
  const requiredSlots = [...new Set([...(bp?.requiredSlots || []), ...(page.requiredSlots || []), ...(vs.requiredSlots || [])])];
  if (!requiredSlots.length && !/cover|closing|divider|transition/i.test(`${vs.relationship || ""} ${vs.expressionMode || ""}`)) errors.push("requiredSlots missing for content page");
  if (selected.route === "component-library") {
    const item = component(selected.name);
    if (!item) errors.push(`selected component missing from registry: ${selected.name}`);
    else {
      if (!chromeRole) errors.push(...componentSlotCoverage(requiredSlots, item, vs.implementation || {}));
      const maxItems = Number(vs.contentShape?.maxItems || page.contentShape?.maxItems || 0), capacity = Number(item.contentCapacity?.maxItems || 0);
      if (maxItems && capacity && maxItems > capacity) errors.push(`component capacity overflow: ${maxItems} > ${capacity}`);
      if (!capacity) warnings.push("component capacity is unproven");
    }
  }
  if (selected.route === "image2") {
    const prompt = vs.promptSpec?.file;
    if (!prompt) errors.push("Image2 promptSpec.file missing");
    else if (!fs.existsSync(path.resolve(ROOT, prompt))) errors.push(`Image2 prompt file missing: ${prompt}`);
  }
  const expression = String(page.expressionMode || bp?.expressionMode || "").toLowerCase();
  const sourceGraphicPrimary = /screenshot-evidence|source-graphic|case-evidence|artifact-evidence/.test(expression);
  if (sourceGraphicPrimary && selected.route !== "external-graphic" && !String(vs.routeOverrideReason || "").trim()) {
    errors.push("source/screenshot-led page must select external-graphic or record routeOverrideReason");
  }
  if (selected.route === "page-specific-custom" && !String(vs.customJustification || page.customJustification || "").trim()) {
    errors.push("page-specific-custom requires customJustification");
  }
  const expected = buildProfile(page), actual = page.qaProfile;
  if (!actual || actual.version !== "qa-profile.zh.v2") errors.push("dynamic qaProfile missing");
  else {
    const missingSets = expected.ruleSets.filter(set => !actual.ruleSets?.includes(set));
    if (missingSets.length) errors.push(`dynamic QA rule sets incomplete: ${missingSets.join(", ")}`);
    if (actual.selectedRoute?.route !== selected.route) errors.push("qaProfile route does not match selectedRoute");
    if (actual.relationship !== expected.relationship) errors.push("qaProfile relationship is stale");
    if (actual.scope !== expected.scope) errors.push("qaProfile scope is stale");
    if (actual.rulesVersion !== expected.rulesVersion) errors.push("qaProfile rulesVersion is stale");
  }
  return { id: String(page.id || path.basename(pageDir)), dir: path.basename(pageDir), ok: !errors.length, errors, warnings, themeFidelity: fidelity };
}
function dirs() {
  const i = process.argv.indexOf("--pages"), wanted = new Set(i >= 0 && process.argv[i + 1] ? process.argv[i + 1].split(",") : []);
  return fs.existsSync(PAGES) ? fs.readdirSync(PAGES).filter(dir => fs.existsSync(path.join(PAGES, dir, "page.json"))).filter(dir => {
    const page = readJson(path.join(PAGES, dir, "page.json"), {}); return !wanted.size || wanted.has(dir) || wanted.has(String(page.id || ""));
  }).sort() : [];
}
function selfTest() {
  const component = { slots: ["slogan", "brandChrome"] };
  const required = ["slogan", "threeActions", "statusBoundary"];
  const valid = componentSlotCoverage(required, component, {
    localExtensionSlots: ["threeActions", "statusBoundary"],
    compositionContract: "closing主体 + 页面局部行动"
  });
  if (valid.length) throw new Error(`valid local component extensions failed: ${valid.join("; ")}`);
  const undeclared = componentSlotCoverage(required, component, {});
  if (!undeclared.some(item => /threeActions/.test(item)) || !undeclared.some(item => /statusBoundary/.test(item))) {
    throw new Error("undeclared local extension slots did not fail");
  }
  const orphan = componentSlotCoverage(required, component, {
    localExtensionSlots: ["threeActions", "notRequired"],
    compositionContract: "test"
  });
  if (!orphan.some(item => /not required/.test(item))) throw new Error("orphan localExtensionSlots did not fail");
  const pureCover = {
    relationship: "cover",
    visualSelection: { relationship: "cover", implementation: {} }
  };
  const coverBinding = { route: "component-library", name: "cover" };
  const coverSelected = { route: "component-library", name: "cover" };
  if (inspectThemeChromeContract(pureCover, {}, coverSelected, coverBinding, "ui.cover(slide, { title: 'A' });").length) {
    throw new Error("pure theme cover was rejected");
  }
  const customCover = inspectThemeChromeContract(pureCover, {}, { route: "page-specific-custom", name: "custom-composition" }, { route: "page-specific-custom", name: "custom-composition" }, "ui.logo(slide); ui.addText(slide);");
  if (!customCover.some(item => /must select component-library\/cover/.test(item))) throw new Error("custom cover route was not blocked");
  const blankClosing = {
    relationship: "closing",
    visualSelection: { relationship: "closing", implementation: { localExtensionSlots: ["threeActions"] } }
  };
  const closingErrors = inspectThemeChromeContract(
    blankClosing, {}, { route: "component-library", name: "closing" }, { route: "component-library", name: "closing" },
    "ui.closing(slide, { tagline: '\u00a0' }); ui.addText(slide, 'extra');"
  );
  for (const expected of ["explicit tagline override", "extra ui calls", "localExtensionSlots"]) {
    if (!closingErrors.some(item => item.includes(expected))) throw new Error(`closing adversarial case was not blocked: ${expected}`);
  }
  const badTrace = inspectThemeChromeTrace(blankClosing, { calls: [{ name: "closing", count: 1 }, { name: "addText", count: 2 }] });
  if (!badTrace.some(item => /non-chrome calls/.test(item))) throw new Error("closing runtime extension was not blocked");
  const sceneClosing = inspectThemeChromeContract(
    { relationship: "scene", relationshipSubtype: "closing.actions", visualSelection: { relationship: "scene", implementation: {} } },
    {}, { route: "component-library", name: "closing" }, { route: "component-library", name: "closing" }, "ui.closing(slide, {});"
  );
  if (!sceneClosing.some(item => /relationship must be "closing"/.test(item))) throw new Error("closing disguised as scene was not blocked");
  const genericGlobal = {
    id: "generic-global",
    contentDensity: "high",
    contentShape: { maxItems: 9 },
    visualSelection: { selectedRoute: { route: "page-specific-custom", name: "custom-composition" } },
    themeFidelity: {
      version: "theme-fidelity.v1", theme: "leander-global", archetype: "global.generic-dashboard",
      features: ["ruled-information-hierarchy"],
      composition: {
        uniformCardGrid: { rows: 2, columns: 3, emptyCards: 6, uniform: true },
        secondaryInfoCards: 3
      }
    }
  };
  const genericErrors = inspectThemeFidelity(genericGlobal, {
    theme: "leander-global",
    moduleThemeFidelity: { theme: "leander-global", archetype: "global.generic-dashboard", features: ["ruled-information-hierarchy"] }
  }).errors;
  if (!genericErrors.some(item => /generic uniform card wall/.test(item))) throw new Error("Global skin-only card wall was not blocked");
  console.log("PASS page preflight local extension slot contract");
}
function main() {
  const selectedDirs = dirs();
  const rows = selectedDirs.map(dir => inspect(path.join(PAGES, dir)));
  const blueprintData = readJson(path.join(ROOT, "layout-blueprint.json"), {});
  const diversity = inspectSelectionDiversity(
    selectedDirs.map(dir => readJson(path.join(PAGES, dir, "page.json"), {})),
    blueprintData.contracts || blueprintData.pages || []
  );
  diversity.errors.forEach(item => rows.push({ id: "deck", ok: false, errors: [item.message], warnings: [] }));
  diversity.warnings.forEach(item => console.log(`WARN deck: ${item.message}`));
  const failed = rows.filter(row => !row.ok);
  rows.forEach(row => console.log(`${row.ok ? "PASS" : "FAIL"} ${row.id}${row.errors.length ? `: ${row.errors.join("; ")}` : ""}${row.warnings.length ? ` [WARN ${row.warnings.join("; ")}]` : ""}`));
  console.log(`Page preflight: ${rows.length - failed.length}/${rows.length} PASS.`);
  if (failed.length) process.exit(1);
}
if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else main();
}
module.exports = { inspect, componentSlotCoverage, themeChromeRole, inspectThemeChromeContract, inspectThemeChromeTrace, selfTest };
