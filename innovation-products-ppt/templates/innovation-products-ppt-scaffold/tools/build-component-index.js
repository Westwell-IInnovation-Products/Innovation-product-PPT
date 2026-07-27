// Build a compact component index for low-token routine reads.
// Usage:
//   node tools/build-component-index.js
//
// The full registry remains the source of truth. This script emits only the
// fields needed for ordinary route selection and repair triage.
const fs = require("fs");
const path = require("path");
const { loadComponentRuntime, rendererStatus } = require("./component-runtime");
const { inspectOverrides, mergeMetadata } = require("./lint-component-metadata-overrides");

const registryPath = path.join(__dirname, "component-registry.json");
const overridesPath = path.join(__dirname, "component-metadata-overrides.json");
const outPath = path.join(__dirname, "component-index.min.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8").replace(/^\uFEFF/, ""));
const overrides = JSON.parse(fs.readFileSync(overridesPath, "utf8").replace(/^\uFEFF/, ""));
const overrideAudit = inspectOverrides(overrides, registry);
if (overrideAudit.errors.length) throw new Error(`Component metadata overrides invalid: ${overrideAudit.errors.map(item => `${item.component}/${item.type}`).join(", ")}`);
const runtime = loadComponentRuntime();

function inferLevel(c) {
  if (["imageSlot"].includes(c.name)) return "visual-part";
  if (/icon|chip|badge|slot|connector/i.test(c.name)) return "visual-part";
  if (["lineCompare", "panelDuo", "zoneGrid", "splitDossier", "lineTable"].includes(c.name)) return "layout-block";
  if (["sceneColumns", "actionTracks", "goalPath", "pipelineFlow"].includes(c.name)) return "layout-block";
  return "page-pattern";
}

function inferComposable(c) {
  const level = inferLevel(c);
  if (level === "visual-part") return "high";
  if (level === "layout-block") return "medium";
  return "limited";
}

const enriched = registry.components.map(base => {
  const c = mergeMetadata(base, overrides.components?.[base.name] || {});
  const status = rendererStatus(c, runtime);
  return {
    name: c.name,
    level: c.level || inferLevel(c),
    route: c.route,
    library: c.library,
    relationships: c.relationships || [],
    secondaryRelationships: c.secondaryRelationships || [],
    tags: c.tags || [],
    density: c.density || "medium",
    editable: c.editable || (c.route === "image2" ? "partial" : "yes"),
    composable: c.composable || inferComposable(c),
    relationPrimitive: c.relationPrimitive || (c.relationships || [])[0] || "decision",
    expressionCapability: c.expressionCapability || "",
    slots: (c.slots || []).slice(0, 6),
    variants: (c.variants || []).slice(0, 5),
    avoidWhen: (c.avoidWhen || []).slice(0, 4),
    qaRisks: (c.qaRisks || []).slice(0, 5),
    contentCapacity: c.contentCapacity || null,
    themeCompatibility: c.themeCompatibility || [],
    metadataSource: c.metadataSource || "unknown",
    metadataReviewStatus: c.metadataReviewStatus || "pending",
    reviewedAt: c.reviewedAt || null,
    reviewedBy: c.reviewedBy || null,
    selectionConfidenceCap: c.selectionConfidenceCap == null ? 0.7 : c.selectionConfidenceCap,
    designStatus: c.designStatus || "usable",
    designReviewPriority: c.designReviewPriority || "P3",
    renderStatus: status.renderStatus,
    selectable: status.selectable,
    availabilityReason: status.reason,
    variantOf: c.variantOf || null
  };
});

const selectableComponents = enriched.filter(c => c.selectable);

const compact = {
  schemaVersion: registry.schemaVersion,
  generatedFrom: "component-registry.json",
  libraryCounts: {
    ...registry.libraryCounts,
    totalRegistryEntries: registry.components.length,
    totalExecutableComponents: selectableComponents.length,
    renderableComponentLibrary: enriched.filter(c => c.route === "component-library" && c.renderStatus === "renderable").length,
    noRendererComponentLibrary: enriched.filter(c => c.route === "component-library" && c.renderStatus === "no-renderer").length
  },
  themes: registry.themes,
  externalSources: registry.externalSources,
  imageTools: registry.imageTools,
  components: enriched
};

fs.writeFileSync(outPath, JSON.stringify(compact) + "\n", "utf8");
console.log(`wrote ${path.relative(process.cwd(), outPath)}`);
