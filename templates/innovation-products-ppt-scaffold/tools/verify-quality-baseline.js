// Verify the reusable content and visual quality floor before render/build.
// Usage: node tools/verify-quality-baseline.js
const fs = require("fs");
const path = require("path");
const cfg = require("../deck.config");
const { inspectSelectionDiversity } = require("./visual-selection-diversity");

const ROOT = path.join(__dirname, "..");
const PAGES = path.join(ROOT, "pages");
const OUTPUT = path.join(ROOT, "output");

function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); }
  catch (e) { return fallback; }
}

const REGISTRY = readJson(path.join(__dirname, "component-registry.json"), { components: [] });
const COMPONENT_NAMES = new Set((REGISTRY.components || []).map(c => String(c.name || "").toLowerCase()));

function selectedDirs() {
  const dirs = fs.existsSync(PAGES)
    ? fs.readdirSync(PAGES).filter(name => fs.existsSync(path.join(PAGES, name, "page.json"))).sort()
    : [];
  const active = Array.isArray(cfg.workflow && cfg.workflow.activePages)
    ? cfg.workflow.activePages.map(String).filter(Boolean)
    : [];
  if (!active.length) return dirs;
  const wanted = new Set(active);
  return dirs.filter(dir => {
    const page = readJson(path.join(PAGES, dir, "page.json"), {});
    return wanted.has(dir) || wanted.has(String(page.id || ""));
  });
}

function text(value) { return String(value || "").trim(); }
function present(value, min = 1) { return text(value).length >= min; }
function placeholder(value) { return /^(?:-|—|none|n\/a|na|tbd|todo|unknown|待定|暂无)$/i.test(text(value)); }
function isContent(page) {
  return !/(cover|closing|transition|divider|section-divider|brand-cover|brand-closing)/i
    .test(`${page.relationship || ""} ${page.expressionMode || ""}`);
}
function add(list, page, field, message) { list.push({ page, field, message }); }

const errors = [];
const warnings = [];
const pages = selectedDirs().map(dir => ({ dir, data: readJson(path.join(PAGES, dir, "page.json"), {}) }));
const qualityTarget = readJson(path.join(ROOT, "quality-target.json"), {});
const blueprintDataForDiversity = readJson(path.join(ROOT, "layout-blueprint.json"), {});
const diversityAudit = inspectSelectionDiversity(pages.map(item => item.data), blueprintDataForDiversity.contracts || blueprintDataForDiversity.pages || []);
diversityAudit.errors.forEach(item => add(errors, "deck", item.type, item.message));
diversityAudit.warnings.forEach(item => add(warnings, "deck", item.type, item.message));
if (qualityTarget.version !== "leander-quality-target.v1") add(errors, "deck", "qualityTarget", "缺少 leander-quality-target.v1。同步框架并明确本项目质量目标。");
if (Number(qualityTarget.minimumOverallScore || 0) < 8) add(errors, "deck", "qualityTarget", "正式质量目标不得低于 8/10。");
if (!Array.isArray(qualityTarget.dimensions) || qualityTarget.dimensions.length < 5) add(errors, "deck", "qualityTarget", "质量目标必须覆盖内容、故事、视觉、可读性、证据和可讲述性等维度。");
const ids = new Set();
const titles = new Set();
const contentPages = [];
let reportDeckStats = {};

for (const { dir, data: page } of pages) {
  const id = text(page.id) || dir;
  const content = isContent(page);
  if (ids.has(id)) add(errors, id, "id", "页面 ID 重复。深度修复和 QA 无法可靠定位。");
  ids.add(id);
  if (!present(page.title, content ? 4 : 2)) add(errors, id, "title", "缺少可讲述的页面标题。");
  if (titles.has(text(page.title))) add(warnings, id, "title", "页面标题与其他活动页完全重复，请确认是否为有意呼应。");
  titles.add(text(page.title));
  const themeFeatures = Array.isArray(page.themeFidelity?.features) ? page.themeFidelity.features.map(item => typeof item === "string" ? item : item?.id) : [];
  const explicitPending = themeFeatures.includes("pending-simulation-state")
    && /partial|proposed/i.test(text(page.implementationStatus))
    && /pending|missing|待仿真|待测|缺素材/i.test(text(page.assetNeed))
    && present(page.dataBoundary, 8)
    && Number(page.themeFidelity?.composition?.inventedPendingValues || 0) === 0;
  if (/TODO|TBD|PLACEHOLDER|待补|占位/i.test(JSON.stringify(page)) && !explicitPending) add(errors, id, "placeholder", "页面合同仍含未处理的占位内容。待仿真/待测必须用显式 pending state、事实边界和零虚构值合同。");
  if (!content) continue;
  contentPages.push(page);

  const takeaway = text(page.takeaway || page.visualSelection?.intent);
  if (takeaway.length < 8) add(errors, id, "takeaway", "核心主张过短或缺失，不能只是栏目名。");
  if (takeaway === text(page.title)) add(errors, id, "takeaway", "takeaway 不能与标题完全相同。");
  if (!present(page.relationship, 3)) add(errors, id, "relationship", "缺少页面关系类型。");
  if (!present(page.expressionMode, 3)) add(errors, id, "expressionMode", "缺少表达模式。");
  if (!present(page.implementationStatus, 3)) add(errors, id, "implementationStatus", "缺少实现/事实状态边界。");
  if (!present(page.dataBoundary, 5) || placeholder(page.dataBoundary)) add(errors, id, "dataBoundary", "缺少可信的数据、来源或实现边界。");
  if (!present(page.colorIntent, 8)) add(errors, id, "colorIntent", "缺少页面颜色语义和强调对象。");

  const slots = Array.isArray(page.requiredSlots) ? page.requiredSlots : [];
  const relationship = text(page.relationship).toLowerCase();
  const normalMinimum = /(system|sequence|state|toolbox|decision|lifecycle|artifact|evidence|ecosystem|contrast)/.test(relationship) ? 3 : 2;
  const density = text(page.contentDensity).toLowerCase();
  const whitespaceIntent = text(page.whitespaceIntent);
  const densityRationale = text(page.densityRationale || page.whitespaceRationale);
  const intentionallySparse = density === "low" || slots.length < normalMinimum;
  const minimumSlots = intentionallySparse ? 1 : normalMinimum;
  if (slots.length < minimumSlots) add(errors, id, "requiredSlots", `支撑内容槽位不足，当前 ${slots.length}，至少需要 ${minimumSlots}。`);
  if (intentionallySparse && (!present(whitespaceIntent, 3) || !present(densityRationale, 8))) {
    add(errors, id, "whitespaceIntent", "低密度页面必须说明留白用途和密度理由，不能用空白掩盖内容不足。");
  }

  const vs = page.visualSelection || {};
  if (!vs.selectedRoute || !present(vs.selectedRoute.route) || !present(vs.selectedRoute.name)) {
    add(errors, id, "visualSelection", "缺少真实视觉路线和实现名称。");
  }
  const qa = page.qaProfile || {};
  if (!Array.isArray(qa.pageRules) || qa.pageRules.length < 1) add(errors, id, "qaProfile", "缺少针对本页主张的动态 QA。");
  if (!Array.isArray(qa.requiredEvidence) || !qa.requiredEvidence.includes("render-sha256")) add(errors, id, "qaProfile", "动态 QA 未要求真实渲染证据。");
  if (!Array.isArray(qa.requiredEvidence) || !qa.requiredEvidence.includes("theme-fidelity-audit")) add(errors, id, "qaProfile", "动态 QA 未要求主题保真审计证据。");

  const publicOrEvidence = page.implementationStatus === "public-reference" || relationship === "evidence";
  if (publicOrEvidence && (!Array.isArray(qa.requiredEvidence) || !qa.requiredEvidence.includes("source-reference"))) {
    add(errors, id, "source-reference", "外部事实或证据页未要求来源证据。");
  }

  if (/screenshot-evidence/i.test(text(page.expressionMode))) {
    const shots = Array.isArray(page.screenshotSlots) ? page.screenshotSlots : [];
    if (!shots.length) add(errors, id, "screenshotSlots", "截图证据页没有声明截图槽位。");
    shots.forEach((slot, index) => {
      if (!present(slot.source || slot.sourcePath, 3)) add(errors, id, `screenshotSlots[${index}]`, "缺少截图来源。");
      if (!present(slot.cropRule || slot.crop, 3)) add(errors, id, `screenshotSlots[${index}]`, "缺少裁剪规则。");
      if (!present(slot.explanationAnchor || slot.purpose, 3)) add(errors, id, `screenshotSlots[${index}]`, "缺少解释锚点。");
    });
  }

  // Composition floor: components are blocks, not page templates. A content
  // page whose body is one bare component call with almost no bespoke
  // composition reads as template assembly and fails the quality floor.
  const pageJsFile = path.join(PAGES, dir, "page.js");
  if (fs.existsSync(pageJsFile)) {
    const src = fs.readFileSync(pageJsFile, "utf8");
    // Cover every renderer namespace (ui/bp/ed/toolTree); a bespoke component
    // called through bp.* is still a component, not bespoke composition.
    const uiCalls = [...src.matchAll(/\b(?:ui|bp|ed|toolTree)\.([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]);
    const componentCalls = uiCalls.filter(name => COMPONENT_NAMES.has(name.toLowerCase()));
    const compositionMoves = (uiCalls.length - componentCalls.length) + (src.match(/\bslide\.add\w+\s*\(/g) || []).length;
    if (componentCalls.length >= 1 && compositionMoves < 6) {
      add(intentionallySparse ? warnings : errors, id, "composition",
        `疑似单组件直出页（组件调用 ${componentCalls.length}，构图动作仅 ${compositionMoves}）。组件只允许承担主体区块，页面还需标题带、2–3 个职责清楚的大区、主证据/机制/决策核心，以及必要的图例、标注或关系线。`);
    } else if (componentCalls.length === 0 && compositionMoves < 8) {
      add(warnings, id, "composition", `页面构图动作偏少（${compositionMoves}），请确认不是内容单薄的占位构图。`);
    }
  }
}

if (cfg.workflow?.stage === "anchor-sample") {
  const blueprint = readJson(path.join(ROOT, "layout-blueprint.json"), {});
  const contracts = blueprint.contracts || blueprint.pages || [];
  const contentContracts = contracts.filter(isContent);
  const modeCounts = {};
  contentContracts.forEach(item => { const mode = text(item.expressionMode).toLowerCase(); if (mode) modeCounts[mode] = (modeCounts[mode] || 0) + 1; });
  const modalMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  const active = pages.map(item => item.data);
  const coverage = {
    "tone-or-cover": active.some(page => !isContent(page) || /brand/.test(`${page.storyRole || ""} ${page.themeFidelity?.archetype || ""}`.toLowerCase())),
    "modal-content": !!modalMode && active.some(page => text(page.expressionMode).toLowerCase() === modalMode),
    "complex-structure": active.some(page => /system|architecture|mechanism|network|tree|flow|hierarchy|dense/i.test(`${page.relationship || ""} ${page.expressionMode || ""}`)),
    "screenshot-evidence": active.some(page => /screenshot-evidence/i.test(text(page.expressionMode)) || (page.screenshotSlots || []).length > 0),
    "data-dense": active.some(page => text(page.contentDensity).toLowerCase() === "high"
      || /variable|delta|compact-kpi|data-dense/.test(`${page.themeFidelity?.archetype || ""} ${(page.themeFidelity?.features || []).join(" ")}`.toLowerCase())),
    "asset-gap-high-capacity": active.some(page => {
      const featureText = (page.themeFidelity?.features || []).map(item => typeof item === "string" ? item : item?.id).join(" ");
      const capacity = Number(page.contentShape?.maxItems || page.visualSelection?.contentShape?.maxItems || 0);
      return /pending|missing|待仿真|待测|缺素材/i.test(text(page.assetNeed))
        && (capacity >= 6 || text(page.contentDensity).toLowerCase() === "high")
        && /pending-simulation-state/.test(featureText);
    })
  };
  (qualityTarget.anchorCoverage || []).filter(name => !coverage[name]).forEach(name => add(errors, "deck", "anchorCoverage", `锚点样页缺少代表性类别：${name}。`));
  reportDeckStats.anchorCoverage = coverage;
  reportDeckStats.modalExpressionMode = modalMode;
}

if (contentPages.length >= 4) {
  const componentPages = contentPages.filter(page => text(page.visualSelection?.selectedRoute?.route).toLowerCase() === "component-library");
  const dominanceOverride = cfg.qualityOverrides?.allowComponentRouteDominance === true;
  const dominanceJustified = componentPages.every(page => present(page.visualSelection?.dominanceJustification || page.routeDominanceJustification, 16));
  if (componentPages.length === contentPages.length && !(dominanceOverride && dominanceJustified)) {
    add(errors, "deck", "visualRoute", "内容页 100% 选择组件库路线；必须重新竞争四类路线，或启用显式整套豁免并为每页记录充分理由。");
  }
}

if (contentPages.length >= 10) {
  const modes = new Set(contentPages.map(page => text(page.expressionMode).toLowerCase()).filter(Boolean));
  const relationships = new Set(contentPages.map(page => text(page.relationship).toLowerCase()).filter(Boolean));
  if (modes.size < 4) add(errors, "deck", "expressionMode", `长 PPT 表达模式过于单一，当前只有 ${modes.size} 类。`);
  if (relationships.size < 4) add(errors, "deck", "relationship", `长 PPT 关系类型过于单一，当前只有 ${relationships.size} 类。`);
  const modeCounts = {};
  contentPages.forEach(page => { const mode = text(page.expressionMode).toLowerCase(); modeCounts[mode] = (modeCounts[mode] || 0) + 1; });
  const dominant = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0];
  if (dominant && dominant[1] / contentPages.length > 0.5) {
    add(errors, "deck", "expressionMode", `表达模式 ${dominant[0]} 占比超过 50%，整套 PPT 容易机械重复。`);
  }
  const routeCounts = {};
  const signatureCounts = {};
  let imageEvidencePages = 0;
  let cardLikePages = 0;
  let lowMarginPages = 0;
  contentPages.forEach(page => {
    const route = text(page.visualSelection?.selectedRoute?.route).toLowerCase() || "missing";
    const signature = text(page.visualSelection?.visualSignature || page.visualSignature).toLowerCase() || "missing";
    routeCounts[route] = (routeCounts[route] || 0) + 1;
    signatureCounts[signature] = (signatureCounts[signature] || 0) + 1;
    if (/external|image2|screenshot|image|evidence/.test(`${route} ${page.expressionMode || ""}`.toLowerCase())) imageEvidencePages += 1;
    if (/card|panel|grid/.test(`${page.expressionMode || ""} ${signature} ${page.visualSelection?.selectedRoute?.name || ""}`.toLowerCase())) cardLikePages += 1;
    if (Number(page.visualSelection?.selectedRoute?.margin ?? 99) < 8) lowMarginPages += 1;
  });
  const componentShare = (routeCounts["component-library"] || 0) / contentPages.length;
  const dominanceOverride = cfg.qualityOverrides?.allowComponentRouteDominance === true;
  const dominanceJustified = contentPages
    .filter(page => text(page.visualSelection?.selectedRoute?.route) === "component-library")
    .every(page => present(page.visualSelection?.dominanceJustification || page.routeDominanceJustification, 16));
  if (componentShare > 0.75 && componentShare < 1) add(warnings, "deck", "visualRoute", `组件库路线占比 ${Math.round(componentShare * 100)}%，最终视觉评审必须确认没有退化为模板拼装。`);
  if (cardLikePages / contentPages.length > 0.35) add(warnings, "deck", "cardLike", `疑似卡片/面板型页面 ${cardLikePages}/${contentPages.length}，需在 Contact sheet 中检查连续重复和 AI 味。`);
  if (contentPages.length >= 12 && imageEvidencePages < 2) add(warnings, "deck", "imageEvidence", `图片、截图、外部图或证据型页面仅 ${imageEvidencePages} 页，需确认是否错过真实素材机会。`);
  if (lowMarginPages / contentPages.length > 0.25) add(warnings, "deck", "routeConfidence", `低分差路线选择 ${lowMarginPages}/${contentPages.length}，应批量交给组件管理员复核。`);
  reportDeckStats = { modeCounts, routeCounts, signatureCounts, imageEvidencePages, cardLikePages, lowMarginPages, componentShare, dominanceOverride, dominanceJustified };
}

const verdict = errors.length ? "FIX-FIRST" : "PASS";
const report = {
  version: "leander-quality-baseline.v1",
  generatedAt: new Date().toISOString(),
  activePages: pages.length,
  contentPages: contentPages.length,
  verdict,
  errors,
  warnings,
  deckStats: reportDeckStats,
  qualityTarget
};
fs.mkdirSync(OUTPUT, { recursive: true });
fs.writeFileSync(path.join(OUTPUT, "quality-baseline-audit.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
const md = [
  "# PPT 质量基线审计",
  "",
  `- 活动页面：${pages.length}`,
  `- 内容页面：${contentPages.length}`,
  `- 错误：${errors.length}`,
  `- 警告：${warnings.length}`,
  `- 结论：${verdict}`,
  "",
  "## 必须修复",
  ...(errors.length ? errors.map(item => `- ${item.page} / ${item.field} / ${item.message}`) : ["- 无"]),
  "",
  "## 提醒",
  ...(warnings.length ? warnings.map(item => `- ${item.page} / ${item.field} / ${item.message}`) : ["- 无"]),
  ""
].join("\n");
fs.writeFileSync(path.join(OUTPUT, "quality-baseline-audit.md"), md, "utf8");
console.log(`Quality baseline: ${verdict} (${pages.length} active pages, ${errors.length} errors, ${warnings.length} warnings)`);
if (errors.length) {
  errors.slice(0, 20).forEach(item => console.error(`- ${item.page} / ${item.field}: ${item.message}`));
  process.exit(1);
}
