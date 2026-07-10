// Relationship-first visual selector V2.
// Usage: node tools/select-visual-route.js pages/<id>/page.json [--write]
const fs = require("fs");
const path = require("path");
const { loadComponentRuntime, rendererStatus } = require("./component-runtime");
const ROOT = path.join(__dirname, "..");
const REGISTRY = JSON.parse(fs.readFileSync(path.join(__dirname, "component-registry.json"), "utf8").replace(/^\uFEFF/, ""));
const RUNTIME = loadComponentRuntime();
const ROUTES = ["component-library", "external-graphic", "image2", "page-specific-custom"];
const RELATION_SLOTS = {
  sequence: ["stages", "connectors"], state: ["states", "currentState"], "system-map": ["modules", "coreNode"],
  ecosystem: ["items", "grouping"], hierarchy: ["root", "children"], toolbox: ["toolGroups", "selectionLogic"],
  contrast: ["left", "right"], evidence: ["metricsOrChart", "sourceBoundary"], scene: ["imageArea", "caption"],
  decision: ["options", "criteria"], lifecycle: ["cycleSteps", "feedback"]
};
const KEYWORDS = {
  sequence: ["流程", "阶段", "步骤", "执行", "process", "phase"], state: ["状态", "记忆", "隔离", "state", "memory"],
  "system-map": ["架构", "系统", "模块", "framework", "architecture"], ecosystem: ["生态", "公司", "landscape", "ecosystem"],
  hierarchy: ["层级", "树", "hierarchy", "tree"], toolbox: ["工具", "组件", "主题", "tool", "component"],
  contrast: ["对比", "之前", "之后", "compare", "before", "after"], evidence: ["证据", "数据", "案例", "evidence", "metric"],
  scene: ["截图", "图片", "场景", "screenshot", "image"], decision: ["选择", "判断", "推荐", "decision"],
  lifecycle: ["闭环", "演进", "迭代", "loop", "lifecycle"]
};
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function norm(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, ""); }
function flatten(value) { if (value == null) return ""; if (["string", "number"].includes(typeof value)) return String(value); if (Array.isArray(value)) return value.map(flatten).join(" "); if (typeof value === "object") return Object.entries(value).filter(([key]) => !["visualSelection", "qaProfile"].includes(key)).map(([, item]) => flatten(item)).join(" "); return ""; }
function includesLoose(list, value) { const needle = norm(value); return (list || []).some(item => { const current = norm(item); return current && needle && (current === needle || current.includes(needle) || needle.includes(current)); }); }
function blueprintFor(page) {
  const data = readJson(path.join(ROOT, "layout-blueprint.json"));
  const contracts = data?.contracts || data?.pages || [];
  return contracts.find(item => String(item.page || item.id) === String(page.id || page.page)) || null;
}
function detectRelationship(text) {
  const scores = Object.entries(KEYWORDS).map(([relationship, words]) => ({ relationship, hits: words.filter(word => text.toLowerCase().includes(word.toLowerCase())).length })).sort((a, b) => b.hits - a.hits);
  return scores[0]?.hits ? scores[0].relationship : "decision";
}
function contentShape(page) {
  if (page.contentShape) return page.contentShape;
  const arrays = [];
  function visit(value, key = "") { if (Array.isArray(value)) arrays.push({ key, count: value.length }); else if (value && typeof value === "object") Object.entries(value).filter(([name]) => !["visualSelection", "qaProfile"].includes(name)).forEach(([name, item]) => visit(item, name)); }
  visit(page);
  return { maxItems: arrays.reduce((max, item) => Math.max(max, item.count), 0), arrays: arrays.slice(0, 4) };
}
function requiredSlots(page, blueprint, relationship) { return [...new Set([...(page.requiredSlots || []), ...(blueprint?.requiredSlots || []), ...(RELATION_SLOTS[relationship] || [])])]; }
function componentFamilyText(component) { return [component.name, component.family, component.relationPrimitive, ...(component.tags || [])].join(" "); }
function scoreComponent(component, context) {
  const breakdown = { relationship: 0, blueprint: 0, slots: 0, capacity: 0, evidence: 0, theme: 0, keyword: 0, risk: 0 };
  const reasons = [], rejections = [];
  if ((component.relationships || []).includes(context.relationship) || component.relationPrimitive === context.relationship) { breakdown.relationship = 30; reasons.push("relationship.exact"); }
  else if ((component.relationships || []).some(rel => context.relationshipAliases.includes(rel))) { breakdown.relationship = 18; reasons.push("relationship.alias"); }
  else rejections.push("relationship.mismatch");

  const familyText = componentFamilyText(component);
  if ((context.candidateFamilies || []).some(family => norm(familyText).includes(norm(family)))) { breakdown.blueprint = 18; reasons.push("contract.family"); }
  if ((context.blueprint?.avoidSignatures || []).some(item => norm(familyText).includes(norm(item)))) { breakdown.risk -= 40; rejections.push("blueprint.avoid"); }
  if (context.blueprint?.complexityBudget === "low" && component.density === "high") { breakdown.risk -= 24; rejections.push("capacity.too-dense"); }

  const slots = component.slots || [];
  const matchedSlots = context.requiredSlots.filter(slot => includesLoose(slots, slot));
  const slotRatio = context.requiredSlots.length ? matchedSlots.length / context.requiredSlots.length : 1;
  breakdown.slots = Math.round(slotRatio * 20);
  reasons.push(`slots.${matchedSlots.length}/${context.requiredSlots.length}`);
  if (slotRatio < 0.5) rejections.push("slots.insufficient");

  const cap = component.contentCapacity || {};
  if (cap.maxItems && context.shape.maxItems) {
    if (context.shape.maxItems <= cap.maxItems) { breakdown.capacity = 10; reasons.push("capacity.fit"); }
    else { breakdown.risk -= 20; rejections.push("capacity.overflow"); }
  } else { breakdown.capacity = 4; reasons.push("capacity.unproven"); }

  if (context.needsEvidence && (component.relationships || []).includes("evidence")) breakdown.evidence = 8;
  else if (!context.needsEvidence) breakdown.evidence = 5;
  if ((component.themeCompatibility || []).includes(context.theme)) { breakdown.theme = 8; reasons.push("theme.proven"); }
  else { breakdown.theme = 2; reasons.push("theme.unproven"); }

  const keywordHits = (component.tags || []).filter(tag => context.text.toLowerCase().includes(String(tag).toLowerCase())).length;
  breakdown.keyword = Math.min(6, keywordHits * 2);
  const rawScore = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const confidenceCap = component.selectionConfidenceCap == null ? 0.7 : component.selectionConfidenceCap;
  const score = Math.max(0, Math.min(rawScore, 100));
  const hardRejected = rejections.includes("blueprint.avoid") || rejections.includes("slots.insufficient") || rejections.includes("capacity.overflow") || breakdown.relationship === 0;
  return { route: "component-library", name: component.name, library: component.library, level: component.level, score, confidenceCap, breakdown, reasons, rejections, hardRejected };
}
function nonComponentRoutes(context) {
  const mode = String(context.expressionMode || "").toLowerCase();
  const external = /screenshot|evidence|case-evidence|artifact/.test(mode) || context.relationship === "scene" ? 76 : context.needsEvidence ? 58 : 28;
  const image2 = /simple-image2|illustration/.test(mode) ? 74 : context.relationship === "scene" ? 64 : 22;
  const custom = /big-typography|brand|section-divider/.test(mode) ? 72 : 18;
  return [
    { route: "external-graphic", name: "source-evidence", score: external, reasons: [external >= 58 ? "evidence.strong" : "evidence.not-required"], rejections: [] },
    { route: "image2", name: "imageSlot", score: image2, reasons: [image2 >= 64 ? "image.simple-illustration" : "image.not-primary"], rejections: [] },
    { route: "page-specific-custom", name: "custom-composition", score: custom, reasons: [custom >= 60 ? "expression.custom-fit" : "last-resort"], rejections: [] }
  ];
}
function compactCandidate(item) {
  return {
    route: item.route,
    name: item.name,
    score: item.score,
    confidenceCap: item.confidenceCap,
    reasons: (item.reasons || []).slice(0, 4),
    rejections: (item.rejections || []).slice(0, 3)
  };
}
function select(page) {
  const blueprint = blueprintFor(page), text = flatten(page);
  const relationship = blueprint?.relationship || page.relationship || detectRelationship(text);
  const expressionMode = page.expressionMode || blueprint?.expressionMode || "mechanism-diagram";
  if (relationship === "cover" || /brand-cover/.test(expressionMode)) {
    return {
      engineVersion: "visual-selector.v2", intent: page.takeaway || page.title || "建立演示主题", relationship: "cover",
      relationshipSubtype: blueprint?.relationshipSubtype || "cover.brand", visualSignature: blueprint?.visualSignature || "theme-cover",
      blueprintRef: blueprint ? `layout-blueprint.json#${blueprint.page || blueprint.id}` : null, expressionMode,
    candidateRoutes: [
        { route: "component-library", name: "cover", score: 92, reasons: ["theme.chrome"], rejections: [] },
        ...nonComponentRoutes({ expressionMode, relationship: "cover", needsEvidence: false })
      ].map(compactCandidate), selectedRoute: { route: "component-library", name: "cover", score: 92, confidence: 0.92, margin: 20 },
      requiresCuratorReview: false, rejectedRoutes: [], implementation: { expectedBinding: { route: "component-library", name: "cover" }, pageJsMustExport: "visualBinding" },
      reviewFocus: ["封面必须使用已批准主题 chrome。", "标题层级、留白和品牌位置必须符合主题合同。"]
    };
  }
  const context = {
    blueprint, text, relationship, relationshipAliases: relationship === "ecosystem" ? ["system-map", "evidence"] : [],
    expressionMode, requiredSlots: requiredSlots(page, blueprint, relationship), shape: contentShape(page),
    candidateFamilies: [...new Set([...(page.candidateFamilies || []), ...(blueprint?.candidateFamilies || [])])],
    needsEvidence: /evidence|screenshot|artifact|case/.test(expressionMode) || relationship === "evidence",
    theme: require(path.join(ROOT, "deck.config.js")).theme || "leander-base"
  };
  const components = REGISTRY.components
    .map(component => ({ ...component, runtime: rendererStatus(component, RUNTIME) }))
    .filter(component => component.runtime.selectable)
    .map(component => scoreComponent(component, context))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const viable = components.filter(item => !item.hardRejected).slice(0, 4);
  const candidates = [...viable, ...nonComponentRoutes(context)].sort((a, b) => b.score - a.score);
  const selected = candidates[0] || { route: "page-specific-custom", name: "custom-composition", score: 10, reasons: ["no-viable-candidate"], rejections: [] };
  const second = candidates[1] || { score: 0 }, margin = selected.score - second.score;
  const confidence = Math.max(0, Math.min(selected.confidenceCap || 0.99, selected.score / 100 * (margin < 8 ? 0.82 : 1)));
  // Every route must leave evidence. If no component is viable, retain the
  // highest-scoring rejected component with its rejection reasons instead of
  // silently omitting the component-library route.
  const componentEvidence = viable.length ? viable.slice(0, 3) : components.slice(0, 1);
  const routeCoverage = ROUTES.map(route => candidates.find(item => item.route === route)).filter(Boolean);
  const candidateRoutes = [...componentEvidence, ...routeCoverage.filter(item => item.route !== "component-library")]
    .filter((item, index, list) => list.findIndex(other => other.route === item.route && other.name === item.name) === index)
    .sort((a, b) => b.score - a.score);
  const result = {
    engineVersion: "visual-selector.v2", intent: page.takeaway || page.visualIntent || page.title || "表达页面核心信息", relationship,
    relationshipSubtype: blueprint?.relationshipSubtype || relationship, visualSignature: blueprint?.visualSignature || relationship,
    blueprintRef: blueprint ? `layout-blueprint.json#${blueprint.page || blueprint.id}` : null, expressionMode,
    requiredSlots: context.requiredSlots, contentShape: context.shape, candidateRoutes: candidateRoutes.map(compactCandidate),
    selectedRoute: { route: selected.route, name: selected.name, score: selected.score, confidence: Number(confidence.toFixed(2)), margin },
    selectionEvidence: { breakdown: selected.breakdown || null, reasons: selected.reasons || [] },
    requiresCuratorReview: confidence < 0.68 || margin < 8,
    rejectedRoutes: components.filter(item => item.hardRejected).slice(0, 3).map(item => ({ route: item.route, name: item.name, score: item.score, reasons: item.rejections })),
    implementation: { expectedBinding: { route: selected.route, name: selected.name }, pageJsMustExport: "visualBinding" },
    reviewFocus: ["所选路线是否保持蓝图视觉签名？", "必需槽位和内容容量是否匹配？", "低置信或小分差是否已由组件管理员复核？"]
  };
  if (selected.route === "image2") result.promptSpec = { file: `${page.id || "page"}-image2-prompt.md`, constraints: ["一个核心意象", "不画小字", "不画复杂流程", "说明背景融合方式"] };
  return result;
}
function main() {
  const file = process.argv[2];
  if (!file) { console.error("usage: node tools/select-visual-route.js <page.json> [--write]"); process.exit(1); }
  const abs = path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs)) {
    console.error(`page contract not found: ${abs}`);
    process.exit(1);
  }
  const page = readJson(abs);
  if (!page || typeof page !== "object") {
    console.error(`invalid page contract JSON: ${abs}`);
    process.exit(1);
  }
  page.visualSelection = select(page);
  if (process.argv.includes("--write")) { fs.writeFileSync(abs, JSON.stringify(page, null, 2) + "\n", "utf8"); console.log(`wrote visualSelection V2 -> ${path.relative(process.cwd(), abs)}`); }
  else console.log(JSON.stringify(page.visualSelection, null, 2));
}
if (require.main === module) main();
module.exports = { select, scoreComponent, contentShape, requiredSlots };
