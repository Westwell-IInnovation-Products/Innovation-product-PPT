// Gate 1.5 component contract: exact component IDs are separate from free-form pattern hints.
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const DEFAULT_INDEX = path.join(__dirname, "component-index.min.json");

function readJson(file, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); }
  catch { return fallback; }
}
function list(value) { return Array.isArray(value) ? value.map(item => String(item || "").trim()).filter(Boolean) : []; }
function norm(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, ""); }
function text(value) { return String(value || "").trim(); }
function contentContract(contract) {
  return !/(?:cover|closing|transition|divider|section-divider|brand-cover|brand-closing)/i
    .test(`${contract.relationship || ""} ${contract.expressionMode || ""}`);
}
function componentMap(index) {
  return new Map((index.components || []).map(component => [norm(component.name), component]));
}
function rationaleOf(contract) {
  return text(contract.routeRationale || contract.selectionRationale || contract.externalGraphicRationale || contract.customJustification || contract.routeOverrideReason);
}

function inspectComponentContract(contract, index = readJson(DEFAULT_INDEX, { components: [] })) {
  const errors = [], warnings = [];
  const page = String(contract.page || contract.id || "unknown");
  const byName = componentMap(index);
  const exact = list(contract.candidateComponents);
  const hints = list(contract.patternHints);
  const legacy = list(contract.candidateFamilies);
  const resolved = [];

  if (legacy.length) {
    warnings.push({ type: "deprecated-candidate-families", page, message: `${page} 仍使用 candidateFamilies；请迁移为 candidateComponents + patternHints。` });
    if (exact.length || hints.length) {
      errors.push({ type: "mixed-component-fields", page, message: `${page} 同时使用 candidateFamilies 与新字段，组件语义不唯一。` });
    }
  }

  const sourceComponents = exact.length ? exact : legacy.filter(name => byName.has(norm(name)));
  const legacyPatterns = legacy.filter(name => !byName.has(norm(name)));
  if (legacyPatterns.length) {
    warnings.push({
      type: "legacy-pattern-compatible",
      page,
      message: `${page} 的 candidateFamilies 含旧式形态提示：${legacyPatterns.join(", ")}；已按 patternHints 兼容读取。`
    });
  }

  for (const name of sourceComponents) {
    const component = byName.get(norm(name));
    if (!component) {
      errors.push({ type: "unknown-component", page, message: `${page} 引用了不存在的组件 ID：${name}` });
      continue;
    }
    if (component.selectable !== true) {
      errors.push({ type: "component-not-selectable", page, message: `${page} 引用了不可选择组件：${component.name}` });
      continue;
    }
    if (!resolved.includes(component.name)) resolved.push(component.name);
  }

  const routes = list(contract.routePreference);
  const primaryRoute = text(contract.routeLock || routes[0]);
  if (!legacy.length && contentContract(contract) && primaryRoute === "component-library" && !resolved.length) {
    errors.push({ type: "component-route-without-candidate", page, message: `${page} 首选组件库路线，但没有有效 candidateComponents。` });
  }
  if (!legacy.length && contentContract(contract) && !resolved.length && /^(?:external-graphic|image2|page-specific-custom)$/.test(primaryRoute) && rationaleOf(contract).length < 8) {
    errors.push({ type: "non-component-route-without-rationale", page, message: `${page} 首选 ${primaryRoute} 且无组件候选，必须填写 routeRationale。` });
  }

  return {
    page,
    errors,
    warnings,
    candidateComponents: resolved,
    patternHints: [...new Set([...hints, ...legacyPatterns])],
    usedLegacyField: legacy.length > 0,
    primaryRoute
  };
}

function inspectBlueprintComponentContracts(contracts, index = readJson(DEFAULT_INDEX, { components: [] })) {
  const rows = (contracts || []).map(contract => inspectComponentContract(contract, index));
  return {
    rows,
    errors: rows.flatMap(row => row.errors),
    warnings: rows.flatMap(row => row.warnings)
  };
}

function selfTest() {
  const index = { components: [{ name: "flowA", selectable: true }, { name: "blockedB", selectable: false }] };
  assert.equal(inspectComponentContract({ page: "p1", relationship: "sequence", routePreference: ["component-library"], candidateComponents: ["missing"] }, index).errors[0].type, "unknown-component");
  assert(inspectComponentContract({ page: "p1", relationship: "sequence", routePreference: ["component-library"], candidateComponents: ["blockedB"] }, index).errors.some(item => item.type === "component-not-selectable"));
  assert(inspectComponentContract({ page: "p1", relationship: "sequence", routePreference: ["component-library"], candidateComponents: ["flowA"], patternHints: ["converging rail"] }, index).errors.length === 0);
  const legacy = inspectComponentContract({ page: "p1", relationship: "sequence", routePreference: ["component-library"], candidateFamilies: ["flowA", "converging rail"] }, index);
  assert.equal(legacy.errors.length, 0);
  assert(legacy.warnings.some(item => item.type === "legacy-pattern-compatible"));
  assert(inspectComponentContract({ page: "p1", relationship: "scene", routePreference: ["external-graphic"], routeRationale: "Use the supplied product screenshot as primary evidence." }, index).errors.length === 0);
  assert(inspectComponentContract({ page: "p1", relationship: "scene", routePreference: ["external-graphic"] }, index).errors.some(item => item.type === "non-component-route-without-rationale"));
  console.log("PASS component contract self-test");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else console.log(JSON.stringify(inspectBlueprintComponentContracts(readJson(process.argv[2], {}).contracts || []), null, 2));
}

module.exports = { inspectComponentContract, inspectBlueprintComponentContracts, contentContract, norm };
