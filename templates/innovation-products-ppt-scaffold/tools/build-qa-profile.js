// Build a compact Chinese QA contract from rule-set IDs and page-specific risks.
// Usage: node tools/build-qa-profile.js pages/<id>/page.json [--write]
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, "qa-rules.zh.json"), "utf8").replace(/^\uFEFF/, ""));
const INDEX_FILE = path.join(__dirname, "component-index.min.json");
const INDEX = fs.existsSync(INDEX_FILE) ? JSON.parse(fs.readFileSync(INDEX_FILE, "utf8").replace(/^\uFEFF/, "")) : { components: [] };
const BLUEPRINT_FILE = path.join(ROOT, "layout-blueprint.json");
const BLUEPRINT = fs.existsSync(BLUEPRINT_FILE) ? JSON.parse(fs.readFileSync(BLUEPRINT_FILE, "utf8").replace(/^\uFEFF/, "")) : null;
const CONFIG = (() => { try { return require(path.join(ROOT, "deck.config.js")); } catch { return {}; } })();
const { normalizeThemeId } = require("../theme/content-fidelity");

function usage() { console.error("usage: node tools/build-qa-profile.js <page.json> [--write]"); process.exit(1); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); }
function norm(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, ""); }
function normalizeRelationship(value) {
  const rel = String(value || "").toLowerCase();
  return ({ "hub-spoke": "system-map", hub: "system-map", architecture: "system-map", process: "sequence", flow: "sequence", memory: "state", "tool-system": "toolbox", compare: "contrast", metric: "evidence", image: "scene" })[rel] || rel || "decision";
}
function findComponent(name) {
  const needle = norm(name);
  return (INDEX.components || []).find(item => norm(item.name) === needle) || null;
}
function findBlueprint(pageId) {
  if (!BLUEPRINT) return null;
  const contracts = BLUEPRINT.contracts || BLUEPRINT.pages || [];
  return contracts.find(item => (item.page || item.id) === pageId) || null;
}
function pageRule(id, text, severity = "P1") { return { id, severity, text: String(text).trim() }; }

function buildProfile(page) {
  const vs = page.visualSelection || {};
  const selected = vs.selectedRoute || {};
  const blueprint = findBlueprint(page.id || page.page) || vs.blueprintContract || page.blueprintContract || null;
  const chromeFields = [
    page.storyRole, page.relationship, page.relationshipSubtype, page.skeletonFamily,
    blueprint?.storyRole, blueprint?.relationship, blueprint?.relationshipSubtype, blueprint?.skeletonFamily,
    vs.relationship, vs.relationshipSubtype
  ].map(value => String(value || "").toLowerCase());
  const chromeRelationship = chromeFields.some(value => /(^|[.\s_-])closing($|[.\s_-])|brand-closing/.test(value))
    ? "closing"
    : chromeFields.some(value => /(^|[.\s_-])cover($|[.\s_-])|brand-cover/.test(value))
      ? "cover"
      : "";
  const relationship = chromeRelationship || normalizeRelationship(vs.relationship || page.relationship || "decision");
  const component = findComponent(selected.name || page.component);
  const ruleSets = ["universal"];
  const themeId = normalizeThemeId(page.themeFidelity?.theme || CONFIG.theme || "leander-base");
  if (RULES.ruleSets[`theme.${themeId}`]) ruleSets.push(`theme.${themeId}`);
  if (RULES.ruleSets[`relationship.${relationship}`]) ruleSets.push(`relationship.${relationship}`);
  if (selected.route && RULES.ruleSets[`route.${selected.route}`]) ruleSets.push(`route.${selected.route}`);
  if (blueprint) ruleSets.push("blueprint.contract");
  if (page.implementationStatus || vs.implementationStatus) ruleSets.push("evidence.implementation");
  if ((page.screenshotSlots || blueprint?.screenshotSlots || []).length) ruleSets.push("evidence.screenshot");

  const pageId = page.id || page.page || "page";
  const pageRules = [];
  const addMany = (items, prefix, severity) => (items || []).slice(0, 5).forEach((item, index) => pageRules.push(pageRule(`page.${pageId}.${prefix}.${index + 1}`, item, severity)));
  addMany(blueprint && blueprint.qaFocus, "blueprint", "P1");
  if (page.takeaway || vs.intent) pageRules.push(pageRule(`page.${pageId}.message`, `核心信息必须由视觉结构支撑：${page.takeaway || vs.intent}`, "P1"));

  const requiredEvidence = ["render-sha256", "visual-location"];
  if (!["cover", "closing"].includes(relationship)) requiredEvidence.push("theme-fidelity-audit");
  if (selected.route === "component-library") requiredEvidence.push("component-trace");
  if (ruleSets.includes("evidence.implementation") || ruleSets.includes("evidence.screenshot")) requiredEvidence.push("source-reference");

  return {
    version: "qa-profile.zh.v2",
    rulesVersion: RULES.version,
    scope: selected.route === "theme-chrome" || ["cover", "closing"].includes(relationship) ? "theme-chrome-page" : "content-page",
    relationship,
    selectedRoute: { route: selected.route || "unknown", name: selected.name || "unknown" },
    blueprintRef: blueprint ? `layout-blueprint.json#${blueprint.page || blueprint.id}` : null,
    componentRef: component ? `tools/component-index.min.json#${component.name}` : null,
    ruleSets,
    pageRules,
    requiredEvidence
  };
}

function main() {
  const file = process.argv[2];
  if (!file) usage();
  const abs = path.resolve(process.cwd(), file);
  const page = readJson(abs);
  page.qaProfile = buildProfile(page);
  if (process.argv.includes("--write")) {
    fs.writeFileSync(abs, JSON.stringify(page, null, 2) + "\n", "utf8");
    console.log(`wrote compact qaProfile -> ${path.relative(process.cwd(), abs)}`);
  } else console.log(JSON.stringify(page.qaProfile, null, 2));
}

if (require.main === module) main();

module.exports = { buildProfile };
