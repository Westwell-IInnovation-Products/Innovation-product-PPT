// Final visual-contract gate before page production/rendering.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const PAGES = path.join(ROOT, "pages");
const INDEX = JSON.parse(fs.readFileSync(path.join(__dirname, "component-index.min.json"), "utf8").replace(/^\uFEFF/, ""));
const { buildProfile } = require("./build-qa-profile");
const REQUIRED_ROUTES = ["component-library", "external-graphic", "image2", "page-specific-custom"];
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function norm(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, ""); }
function sameName(a, b) { a = norm(a); b = norm(b); return !!a && !!b && (a === b || a.includes(b) || b.includes(a)); }
function blueprint(page) { const data = readJson(path.join(ROOT, "layout-blueprint.json"), {}); return (data.contracts || data.pages || []).find(item => String(item.page || item.id) === String(page.id || page.page)); }
function component(name) { return (INDEX.components || []).find(item => norm(item.name) === norm(name)); }
function implementationBinding(page, pageDir) {
  const declared = page.visualSelection?.implementation?.actualBinding;
  if (declared?.route && declared?.name) return declared;
  const file = path.join(pageDir, "page.js");
  if (!fs.existsSync(file)) return null;
  try { delete require.cache[require.resolve(file)]; return require(file).visualBinding || null; } catch { return null; }
}
function inspect(pageDir) {
  const page = readJson(path.join(pageDir, "page.json"), {}), vs = page.visualSelection || {}, selected = vs.selectedRoute || {}, errors = [], warnings = [];
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
  const bp = blueprint(page);
  if (!vs.visualSignature) errors.push("visualSignature missing");
  if (bp?.visualSignature && norm(bp.visualSignature) !== norm(vs.visualSignature)) errors.push("blueprint visualSignature was not preserved");
  const requiredSlots = [...new Set([...(bp?.requiredSlots || []), ...(page.requiredSlots || []), ...(vs.requiredSlots || [])])];
  if (!requiredSlots.length && !/cover|closing|divider|transition/i.test(`${vs.relationship || ""} ${vs.expressionMode || ""}`)) errors.push("requiredSlots missing for content page");
  if (selected.route === "component-library") {
    const item = component(selected.name);
    if (!item) errors.push(`selected component missing from registry: ${selected.name}`);
    else {
      const absent = requiredSlots.filter(slot => !(item.slots || []).some(value => sameName(value, slot)));
      if (absent.length) errors.push(`component lacks required slots: ${absent.join(", ")}`);
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
    if (actual.rulesVersion !== expected.rulesVersion) errors.push("qaProfile rulesVersion is stale");
  }
  return { id: String(page.id || path.basename(pageDir)), dir: path.basename(pageDir), ok: !errors.length, errors, warnings };
}
function dirs() {
  const i = process.argv.indexOf("--pages"), wanted = new Set(i >= 0 && process.argv[i + 1] ? process.argv[i + 1].split(",") : []);
  return fs.existsSync(PAGES) ? fs.readdirSync(PAGES).filter(dir => fs.existsSync(path.join(PAGES, dir, "page.json"))).filter(dir => {
    const page = readJson(path.join(PAGES, dir, "page.json"), {}); return !wanted.size || wanted.has(dir) || wanted.has(String(page.id || ""));
  }).sort() : [];
}
function main() {
  const rows = dirs().map(dir => inspect(path.join(PAGES, dir))), failed = rows.filter(row => !row.ok);
  rows.forEach(row => console.log(`${row.ok ? "PASS" : "FAIL"} ${row.id}${row.errors.length ? `: ${row.errors.join("; ")}` : ""}${row.warnings.length ? ` [WARN ${row.warnings.join("; ")}]` : ""}`));
  console.log(`Page preflight: ${rows.length - failed.length}/${rows.length} PASS.`);
  if (failed.length) process.exit(1);
}
if (require.main === module) main();
module.exports = { inspect };
