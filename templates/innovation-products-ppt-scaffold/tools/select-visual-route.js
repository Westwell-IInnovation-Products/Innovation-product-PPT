// Relationship-first visual selector V2.
// Usage: node tools/select-visual-route.js pages/<id>/page.json [--write]
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { loadComponentRuntime, rendererStatus } = require("./component-runtime");
const { inspectComponentContract } = require("./component-contract");
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
function requiredSlots(page, blueprint, relationship) {
  const explicit = [...(page.requiredSlots || []), ...(blueprint?.requiredSlots || [])];
  return [...new Set(explicit.length ? explicit : (RELATION_SLOTS[relationship] || []))];
}
function componentFamilyText(component) { return [component.name, component.family, component.relationPrimitive, ...(component.tags || [])].join(" "); }
function scoreComponent(component, context) {
  const breakdown = { relationship: 0, blueprint: 0, slots: 0, capacity: 0, evidence: 0, theme: 0, keyword: 0, risk: 0 };
  const reasons = [], rejections = [];
  const primaryRelationships = component.relationships || [];
  const secondaryRelationships = component.secondaryRelationships || [];
  if (primaryRelationships.includes(context.relationship) || component.relationPrimitive === context.relationship) { breakdown.relationship = 30; reasons.push("relationship.exact"); }
  else if (secondaryRelationships.includes(context.relationship)) { breakdown.relationship = 22; reasons.push("relationship.component-secondary"); }
  else if ([...primaryRelationships, ...secondaryRelationships].some(rel => context.secondaryRelationships.includes(rel))) { breakdown.relationship = 18; reasons.push("relationship.page-secondary"); }
  else if ([...primaryRelationships, ...secondaryRelationships].some(rel => context.relationshipAliases.includes(rel))) { breakdown.relationship = 18; reasons.push("relationship.alias"); }
  else rejections.push("relationship.mismatch");

  const familyText = componentFamilyText(component);
  const exactComponentIndex = (context.candidateComponents || []).findIndex(name => norm(component.name) === norm(name));
  if (exactComponentIndex >= 0) {
    breakdown.blueprint = Math.max(20, 40 - exactComponentIndex * 6);
    reasons.push(`contract.component-rank.${exactComponentIndex + 1}`);
  } else if ((context.patternHints || []).some(hint => norm(hint) && norm(familyText).includes(norm(hint)))) {
    breakdown.blueprint = 6;
    reasons.push("contract.pattern-hint");
  }
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

  if (context.needsEvidence && [...primaryRelationships, ...secondaryRelationships].includes("evidence")) breakdown.evidence = 8;
  else if (!context.needsEvidence) breakdown.evidence = 5;
  const chartLike = /(?:chart|pie|donut|heatmap|radar|waterfall)/i.test(familyText);
  if (chartLike && !context.hasQuantitativeEvidence && exactComponentIndex < 0) {
    breakdown.risk -= 45;
    rejections.push("semantics.quantitative-evidence-missing");
  }
  if ((component.themeCompatibility || []).includes(context.theme)) { breakdown.theme = 8; reasons.push("theme.proven"); }
  else { breakdown.theme = 2; reasons.push("theme.unproven"); }

  const keywordHits = (component.tags || []).filter(tag => context.text.toLowerCase().includes(String(tag).toLowerCase())).length;
  breakdown.keyword = Math.min(6, keywordHits * 2);
  const rawScore = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const confidenceCap = component.selectionConfidenceCap == null ? 0.7 : component.selectionConfidenceCap;
  const score = Math.max(0, Math.min(rawScore, 100));
  const hardRejected = rejections.includes("blueprint.avoid") || rejections.includes("slots.insufficient") || rejections.includes("capacity.overflow") || rejections.includes("semantics.quantitative-evidence-missing") || breakdown.relationship === 0;
  return { route: "component-library", name: component.name, library: component.library, level: component.level, score, confidenceCap, breakdown, reasons, rejections, hardRejected };
}
function nonComponentRoutes(context) {
  const mode = String(context.expressionMode || "").toLowerCase();
  const external = context.hasSourceGraphic || /screenshot|case-evidence|artifact|source-graphic/.test(mode)
    ? 92
    : context.relationship === "scene" ? 86 : context.needsEvidence ? 78 : 34;
  const image2 = /simple-image2|illustration|concept-scene|metaphor/.test(mode)
    ? 94
    : context.relationship === "scene" && !context.hasSourceGraphic ? 74 : 30;
  // Custom composition is a first-class route for content pages, not a last
  // resort: high-quality decks win on bespoke per-page composition, with
  // library components used as blocks inside it. Components should only win
  // when they genuinely fit the relationship, slots, and blueprint contract.
  const custom = /big-typography|brand|section-divider|poster|custom-composition/.test(mode)
    ? 94
    : 62;
  return [
    { route: "external-graphic", name: "source-evidence", score: external, reasons: [external >= 58 ? "evidence.strong" : "evidence.not-required"], rejections: [] },
    { route: "image2", name: "imageSlot", score: image2, reasons: [image2 >= 64 ? "image.simple-illustration" : "image.not-primary"], rejections: [] },
    { route: "page-specific-custom", name: "custom-composition", score: custom, reasons: [custom >= 90 ? "expression.custom-fit" : "composition.first-class"], rejections: [] }
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
  if (relationship === "closing" || blueprint?.storyRole === "closing" || /brand-closing/.test(expressionMode)) {
    return {
      engineVersion: "visual-selector.v2", intent: page.takeaway || page.title || "收束演示主题", relationship: "closing",
      relationshipSubtype: blueprint?.relationshipSubtype || "closing.brand", visualSignature: blueprint?.visualSignature || "theme-closing",
      blueprintRef: blueprint ? `layout-blueprint.json#${blueprint.page || blueprint.id}` : null, expressionMode,
      candidateRoutes: [
        { route: "component-library", name: "closing", score: 92, reasons: ["theme.chrome"], rejections: [] },
        ...nonComponentRoutes({ expressionMode, relationship: "closing", needsEvidence: false })
      ].map(compactCandidate), selectedRoute: { route: "component-library", name: "closing", score: 92, confidence: 0.92, margin: 20 },
      requiresCuratorReview: false, rejectedRoutes: [], implementation: { expectedBinding: { route: "component-library", name: "closing" }, pageJsMustExport: "visualBinding" },
      reviewFocus: ["尾页必须使用已批准主题 closing chrome。", "品牌标语、中心口号和留白必须符合主题合同，补充行动内容移到相邻内容页。"]
    };
  }
  const mergedContract = {
    ...(blueprint || {}),
    page: page.id || page.page || blueprint?.page || blueprint?.id,
    candidateComponents: [...new Set([...(page.candidateComponents || []), ...(blueprint?.candidateComponents || [])])],
    patternHints: [...new Set([...(page.patternHints || []), ...(blueprint?.patternHints || [])])],
    candidateFamilies: [...new Set([...(page.candidateFamilies || []), ...(blueprint?.candidateFamilies || [])])]
  };
  const contractAudit = inspectComponentContract(mergedContract);
  if (contractAudit.errors.length) {
    throw new Error(`Invalid Gate 1.5 component contract for ${mergedContract.page || "unknown"}: ${contractAudit.errors.map(item => item.message).join("; ")}`);
  }
  const context = {
    blueprint, text, relationship,
    relationshipAliases: relationship === "ecosystem"
      ? ["system-map", "evidence"]
      : relationship === "lifecycle" && /roadmap|milestone|stage-gate/.test(expressionMode)
        ? ["sequence"]
        : [],
    expressionMode, requiredSlots: requiredSlots(page, blueprint, relationship), shape: contentShape(page),
    candidateComponents: contractAudit.candidateComponents,
    patternHints: contractAudit.patternHints,
    secondaryRelationships: [...new Set([...(page.secondaryRelationships || []), ...(blueprint?.secondaryRelationships || [])])],
    needsEvidence: /evidence|screenshot|artifact|case/.test(expressionMode) || relationship === "evidence",
    hasSourceGraphic: [page.screenshotSlots, page.evidenceSlots, page.imageSlots, page.sourceGraphics].some(value => Array.isArray(value) && value.length > 0) || !!page.sourceGraphic,
    hasQuantitativeEvidence: /metric|chart|quantitative|ratio|trend|kpi|data/i.test(`${expressionMode} ${relationship} ${text}`) || [page.metrics, page.series, page.chartData, page.dataPoints].some(value => Array.isArray(value) && value.length > 0),
    theme: require(path.join(ROOT, "deck.config.js")).theme || "leander-base"
  };
  const components = REGISTRY.components
    .map(component => ({ ...component, runtime: rendererStatus(component, RUNTIME) }))
    .filter(component => component.runtime.selectable)
    .filter(component => !context.candidateComponents.length || context.candidateComponents.some(name => norm(name) === norm(component.name)))
    .map(component => scoreComponent(component, context))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const viable = components.filter(item => !item.hardRejected).slice(0, 4);
  const preferredRoutes = Array.isArray(blueprint?.routePreference) ? blueprint.routePreference : [];
  const allCandidates = [...viable, ...nonComponentRoutes(context)];
  // Blueprint preference constrains selection, but must not erase route
  // evaluation evidence. Final QA requires all four production routes to be
  // scored even when only a subset is eligible for the current page.
  const evaluatedCandidates = allCandidates.map(item => {
    const rank = preferredRoutes.indexOf(item.route);
    const preferenceBonus = rank < 0 ? 0 : Math.max(0, 8 - rank * 4);
    return { ...item, score: Math.min(100, item.score + preferenceBonus), reasons: [...(item.reasons || []), ...(rank >= 0 ? [`blueprint.route-rank.${rank + 1}`] : [])] };
  });
  const allowedCandidates = preferredRoutes.length
    ? evaluatedCandidates.filter(item => preferredRoutes.includes(item.route))
    : evaluatedCandidates;
  const candidates = allowedCandidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ai = context.candidateComponents.findIndex(name => norm(name) === norm(a.name));
    const bi = context.candidateComponents.findIndex(name => norm(name) === norm(b.name));
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
  });
  const routeLocked = blueprint?.routeLock ? candidates.find(item => item.route === blueprint.routeLock) : null;
  if (blueprint?.routeLock && !routeLocked) throw new Error(`routeLock ${blueprint.routeLock} has no viable candidate for ${mergedContract.page || "unknown"}`);
  if (preferredRoutes.length && !candidates.length) throw new Error(`routePreference has no viable candidate for ${mergedContract.page || "unknown"}`);
  const customFirstWithoutFit = preferredRoutes[0] === "page-specific-custom" && !viable.some(item => (item.breakdown?.blueprint || 0) > 0);
  const customFallback = customFirstWithoutFit ? candidates.find(item => item.route === "page-specific-custom") : null;
  const selected = routeLocked
    ? { ...routeLocked, score: Math.min(100, Math.max(96, routeLocked.score)), reasons: [...(routeLocked.reasons || []), "blueprint.route-lock"] }
    : customFallback || candidates[0] || { route: "page-specific-custom", name: "custom-composition", score: 10, reasons: ["no-viable-candidate"], rejections: [] };
  const second = candidates.find(item => item.route !== selected.route || item.name !== selected.name) || { score: 0 };
  const contractExact = (selected.reasons || []).includes("contract.component-rank.1");
  const customAsAllowedFallback = selected.route === "page-specific-custom" && !viable.length && preferredRoutes.includes("page-specific-custom");
  // Choosing bespoke composition must not trigger extra review by itself;
  // curator attention is for genuinely ambiguous component picks.
  const customFirstClass = selected.route === "page-specific-custom" && selected.score >= 60;
  const contractApproved = !!routeLocked || !!customFallback || contractExact || customAsAllowedFallback || customFirstClass;
  const margin = contractApproved ? Math.max(8, selected.score - second.score) : selected.score - second.score;
  const confidence = routeLocked ? 0.96 : customFallback ? 0.9 : customAsAllowedFallback ? 0.85 : contractExact ? 0.86 : Math.max(0, Math.min(selected.confidenceCap || 0.99, selected.score / 100 * (margin < 8 ? 0.82 : 1)));
  // Every route must leave evidence. If no component is viable, retain the
  // highest-scoring rejected component with its rejection reasons instead of
  // silently omitting the component-library route.
  const componentEvidence = viable.length ? viable.slice(0, 3) : components.slice(0, 1);
  const routeCoverage = ROUTES.map(route => evaluatedCandidates
    .filter(item => item.route === route)
    .sort((a, b) => b.score - a.score)[0]).filter(Boolean);
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
    requiresCuratorReview: !contractApproved && (confidence < 0.68 || margin < 8),
    rejectedRoutes: components.filter(item => item.hardRejected).slice(0, 3).map(item => ({ route: item.route, name: item.name, score: item.score, reasons: item.rejections })),
    implementation: {
      expectedBinding: { route: selected.route, name: selected.name },
      pageJsMustExport: "visualBinding",
      pageJsMustExportThemeFidelity: selected.route === "page-specific-custom",
      compositionContract: selected.route === "component-library"
        ? "组件只承担主体区块：页面仍需标题带、2–3 个职责清楚的大区、一个主证据/机制/决策核心，以及必要的图例、标注、对比或关系线；单组件直出仅限封面与章节页。"
        : "按蓝图视觉签名手工构图：标题带 + 2–3 个职责清楚的大区 + 一个主证据/机制/决策核心；组件可作为局部积木调用，结论带只在确有决策或边界语义时使用。"
    },
    reviewFocus: ["所选路线是否保持蓝图视觉签名？", "必需槽位和内容容量是否匹配？", "低置信或小分差是否已由组件管理员复核？"]
  };
  const declaredThemeFeatures = [...new Set([...(page.themeFeatures || []), ...(blueprint?.themeFeatures || [])])];
  const themeArchetype = page.themeArchetype || blueprint?.themeArchetype || "";
  if (declaredThemeFeatures.length || themeArchetype || page.themeFidelity) {
    result.themeFidelity = page.themeFidelity || {
      version: "theme-fidelity.v1",
      theme: context.theme,
      archetype: themeArchetype,
      features: declaredThemeFeatures,
      composition: page.themeComposition || {}
    };
  }
  if (selected.route === "image2") result.promptSpec = { file: `assets/${page.id || "page"}-image2-prompt.md`, constraints: ["一个核心意象", "不画小字", "不画复杂流程", "说明背景融合方式"] };
  if (selected.route === "page-specific-custom") result.customJustification = `页面专属构图为一等路线：按蓝图视觉签名（${expressionMode}）手工构图，组件可作为局部积木参与。`;
  return result;
}
function main() {
  if (process.argv.includes("--self-test")) {
    const source = nonComponentRoutes({ expressionMode: "screenshot-evidence", relationship: "evidence", needsEvidence: true, hasSourceGraphic: true, shape: { maxItems: 2 } });
    const image = nonComponentRoutes({ expressionMode: "simple-image2", relationship: "scene", needsEvidence: false, hasSourceGraphic: false, shape: { maxItems: 1 } });
    const custom = nonComponentRoutes({ expressionMode: "big-typography", relationship: "decision", needsEvidence: false, hasSourceGraphic: false, shape: { maxItems: 2 } });
    assert.equal(source.sort((a, b) => b.score - a.score)[0].route, "external-graphic");
    assert.equal(image.sort((a, b) => b.score - a.score)[0].route, "image2");
    assert.equal(custom.sort((a, b) => b.score - a.score)[0].route, "page-specific-custom");
    const mechanism = nonComponentRoutes({ expressionMode: "mechanism-diagram", relationship: "system-map", needsEvidence: false, hasSourceGraphic: false, shape: { maxItems: 6 } });
    const mechCustom = mechanism.find(item => item.route === "page-specific-custom");
    assert(mechCustom.score >= 60, "custom composition must stay first-class for content pages");
    assert(!(mechCustom.reasons || []).includes("last-resort"), "custom composition must not be labeled last-resort");
    const baseContext = {
      relationship: "sequence", relationshipAliases: [], secondaryRelationships: [], candidateComponents: [], patternHints: [],
      blueprint: {}, requiredSlots: [], shape: { maxItems: 4 }, needsEvidence: false, hasQuantitativeEvidence: false,
      theme: "leander-global", text: "operational recovery convergence"
    };
    const chart = scoreComponent({ name: "pieBreakdown", relationships: ["evidence"], relationPrimitive: "evidence", tags: ["chart", "ratio"], slots: [], themeCompatibility: ["leander-global"] }, baseContext);
    assert(chart.hardRejected && chart.rejections.includes("semantics.quantitative-evidence-missing"), "non-quantitative mechanism pages must not fall back to a chart");
    const exact = scoreComponent({ name: "processTimeline", relationships: ["sequence"], relationPrimitive: "sequence", tags: ["process"], slots: [], themeCompatibility: ["leander-global"] }, { ...baseContext, candidateComponents: ["processTimeline"] });
    assert(exact.reasons.includes("contract.component-rank.1") && exact.breakdown.blueprint >= 40, "exact candidateComponents must be a strong component constraint");
    const hinted = scoreComponent({ name: "processTimeline", relationships: ["sequence"], relationPrimitive: "sequence", tags: ["process"], slots: [], themeCompatibility: ["leander-global"] }, { ...baseContext, patternHints: ["process"] });
    assert(hinted.reasons.includes("contract.pattern-hint") && hinted.breakdown.blueprint < exact.breakdown.blueprint, "patternHints must stay weaker than exact component IDs");
    console.log("PASS visual route competition self-test");
    return;
  }
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
module.exports = { select, scoreComponent, nonComponentRoutes, contentShape, requiredSlots };
