// Enrich component-registry.json with reusable-library metadata.
// This is a component-library maintenance tool, not a normal deck-production step.
// Usage:
//   node tools/enrich-component-registry.js
const fs = require("fs");
const path = require("path");

const registryPath = path.join(__dirname, "component-registry.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8").replace(/^\uFEFF/, ""));

const visualParts = new Set(["imageSlot"]);
const layoutBlocks = new Set([
  "lineCompare", "panelDuo", "zoneGrid", "splitDossier", "lineTable",
  "sceneColumns", "actionTracks", "goalPath", "pipelineFlow"
]);

const slotsByRelationship = {
  sequence: ["stages", "connectors", "stageLabels", "evidenceOrOutput"],
  state: ["states", "currentState", "detailExpansion", "evidence"],
  "system-map": ["modules", "dependencies", "coreNode", "inputsOutputs"],
  hierarchy: ["root", "children", "levels", "annotations"],
  toolbox: ["toolGroups", "items", "detailPanel", "selectionLogic"],
  contrast: ["left", "right", "contrastBridge", "conclusion"],
  evidence: ["metricsOrChart", "sourceBoundary", "annotation", "caveat"],
  scene: ["imageArea", "markers", "caption", "sourceOrPrompt"],
  decision: ["options", "criteria", "recommendation", "tradeoff"],
  lifecycle: ["cycleSteps", "feedback", "promotion", "memory"]
};

const riskByRelationship = {
  sequence: ["connector geometry", "step spacing", "unclear start/end"],
  state: ["fake file/state structure", "unclear current state", "over-dense expansion"],
  "system-map": ["module overload", "dependency ambiguity", "center path unclear"],
  hierarchy: ["crooked branches", "unclear parent-child relation", "misaligned levels"],
  toolbox: ["tool list without calling logic", "semantic icon ambiguity", "dense side panel"],
  contrast: ["unequal comparison sides", "decorative red without meaning", "weak conclusion"],
  evidence: ["unsupported claims", "chart readability", "missing source boundary"],
  scene: ["decorative image", "generated image too complex", "image/text mismatch"],
  decision: ["unclear criteria", "fake scoring", "recommendation not prominent"],
  lifecycle: ["loop direction ambiguity", "feedback/promotion unclear", "too many colors"]
};

function inferLevel(c) {
  if (c.level) return c.level;
  if (visualParts.has(c.name) || /icon|chip|badge|slot|connector/i.test(c.name)) return "visual-part";
  if (layoutBlocks.has(c.name)) return "layout-block";
  return "page-pattern";
}

function inferComposable(level) {
  if (level === "visual-part") return "high";
  if (level === "layout-block") return "medium";
  return "limited";
}

function primaryRel(c) {
  return (c.relationships && c.relationships[0]) || "decision";
}

function expressionCapability(c, rel) {
  const tagText = (c.tags || []).slice(0, 4).join(", ");
  const base = {
    sequence: "express ordered stages, handoffs, milestones, or production flow",
    state: "show a current state, isolated unit, memory boundary, or state transition",
    "system-map": "show modules, dependencies, inputs, outputs, and central system paths",
    hierarchy: "show parent-child, layer, stack, or nested structure",
    toolbox: "show capability groups, reusable assets, and how tools are called",
    contrast: "compare two states, options, tensions, or before/after outcomes",
    evidence: "present measurable proof, charts, metrics, or source-backed observations",
    scene: "anchor the page with a real or generated visual, screenshot, map, or scene",
    decision: "support a recommendation, boundary, priority, or tradeoff decision",
    lifecycle: "show a loop, evolution path, maturity journey, or feedback promotion"
  }[rel] || "express a reusable slide relationship";
  return tagText ? `${base}; tuned for ${tagText}` : base;
}

function variantsFor(c, level, rel) {
  const variants = new Set(c.variants || ["base"]);
  if (level === "page-pattern") variants.add("compact");
  if (["sequence", "hierarchy", "toolbox", "state"].includes(rel)) variants.add("line");
  if (["scene", "evidence"].includes(rel)) variants.add("image-or-evidence");
  if (c.density === "high") variants.add("reduced-density");
  return [...variants];
}

function avoidWhen(c, rel, level) {
  const rules = new Set(c.avoidWhen || []);
  if (level === "page-pattern") rules.add("only a small local visual part is needed");
  if (c.density === "high") rules.add("the page has low information density or needs a breathing transition");
  if (rel === "toolbox") rules.add("there is no selection/calling logic, only a list of tools");
  if (rel === "contrast") rules.add("the two sides are not comparable on the same dimension");
  if (rel === "evidence") rules.add("there is no source, data boundary, or proof object");
  if (rel === "scene") rules.add("the image would be decorative rather than explanatory");
  if (rel === "lifecycle") rules.add("the relationship is linear rather than cyclic/evolutionary");
  if (!rules.size) rules.add("the page relationship, density, or required slots do not match this component");
  return [...rules];
}

function qaRisks(c, rel, level) {
  const risks = new Set(c.qaRisks || []);
  (riskByRelationship[rel] || ["visual relationship mismatch"]).forEach(r => risks.add(r));
  if (level === "layout-block") risks.add("block forced into a full-page role");
  if (level === "page-pattern") risks.add("hard-coded semantics instead of reusable relationship");
  if (c.density === "high") risks.add("text overflow or unreadable labels");
  return [...risks];
}

function slotsFor(c, rel, level) {
  if (Array.isArray(c.slots) && c.slots.length) return c.slots;
  if (level === "visual-part") return ["anchor", "label", "state", "style"];
  if (level === "layout-block") return ["container", ...(slotsByRelationship[rel] || ["items", "annotation"]).slice(0, 3)];
  return slotsByRelationship[rel] || ["headline", "body", "visual", "evidence"];
}

function semanticBindings(c, rel) {
  const existing = Array.isArray(c.semanticBindings) ? c.semanticBindings : [];
  const generic = {
    sequence: ["production workflow", "approval pipeline", "implementation path"],
    state: ["page isolation", "state memory", "local repair boundary"],
    "system-map": ["skill module map", "platform architecture", "capability architecture"],
    hierarchy: ["organization tree", "tool hierarchy", "layered model"],
    toolbox: ["tool system", "asset library", "capability inventory"],
    contrast: ["before and after", "problem versus mechanism", "option comparison"],
    evidence: ["metric proof", "trend evidence", "source-backed finding"],
    scene: ["product scene", "screenshot proof", "generated concept image"],
    decision: ["sharing boundary", "priority decision", "tradeoff recommendation"],
    lifecycle: ["learning loop", "team iteration", "feedback promotion"]
  }[rel] || ["generic slide relationship"];
  return [...new Set([...existing, ...generic])];
}

function designPriority(c, rel, level) {
  if (c.name === "toolSystemTree" || c.name === "moduleCorrespondenceMap") return "P0";
  if (["stateFlow", "pipelineFlow", "problemMap", "multiActorContributionToSharedPool", "boundaryFilterMatrix"].includes(c.name)) return "P1";
  if (c.density === "high" || level === "layout-block") return "P2";
  return "P3";
}

registry.components = registry.components.map(c => {
  const level = inferLevel(c);
  const rel = primaryRel(c);
  const hasExistingGovernance = !!c.designStatus;
  const maxItems = c.density === "high" ? 8 : c.density === "low" ? 4 : 6;
  return {
    ...c,
    level,
    relationPrimitive: c.relationPrimitive || rel,
    expressionCapability: c.expressionCapability || expressionCapability(c, rel),
    semanticBindings: semanticBindings(c, rel),
    editable: c.editable || (c.route === "image2" ? "partial" : "yes"),
    composable: c.composable || inferComposable(level),
    slots: slotsFor(c, rel, level),
    variants: variantsFor(c, level, rel),
    avoidWhen: avoidWhen(c, rel, level),
    qaRisks: qaRisks(c, rel, level),
    themeTokensUsed: c.themeTokensUsed || ["colors.bg", "colors.surface", "colors.primary", "colors.accent", "colors.line", "fonts.cn", "fonts.en", "type.*"],
    contentCapacity: c.contentCapacity || { maxItems, maxLabelChars: 18, maxBodyChars: c.density === "high" ? 72 : 48 },
    themeCompatibility: Array.isArray(c.themeCompatibility) ? c.themeCompatibility : [],
    metadataSource: c.metadataSource || "legacy-inferred",
    metadataReviewStatus: c.metadataReviewStatus || (hasExistingGovernance ? "legacy-reviewed" : "pending"),
    selectionConfidenceCap: c.selectionConfidenceCap == null ? (c.metadataSource === "manual" ? 0.95 : 0.74) : c.selectionConfidenceCap,
    designStatus: c.designStatus || "review-required",
    designReviewPriority: c.designReviewPriority || designPriority(c, rel, level)
  };
});

const libraryCounts = registry.components.reduce((acc, c) => {
  const lib = c.library || "base";
  acc[lib] = (acc[lib] || 0) + 1;
  return acc;
}, {});

registry.libraryCounts = {
  ...(registry.libraryCounts || {}),
  baseComponents: libraryCounts.base || 0,
  editorialComponents: libraryCounts.editorial || 0,
  bespokeComponents: libraryCounts.bespoke || 0,
  image2Components: libraryCounts.image2 || 0,
  totalExecutableComponents: registry.components.length
};

registry.maintenance = {
  ...(registry.maintenance || {}),
  metadataVersion: "component-metadata.v3",
  updatedAt: new Date().toISOString(),
  note: "Inferred metadata is labeled and confidence-capped. New components remain review-required until manual semantic and render review."
};

fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + "\n", "utf8");
console.log(`enriched ${registry.components.length} components -> ${path.relative(process.cwd(), registryPath)}`);
