// Audit the manually curated high-impact component cohort and metadata fingerprints.
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { inspectOverrides, mergeMetadata, fingerprint } = require("./lint-component-metadata-overrides");

const ROOT = path.join(__dirname, "..");
const REGISTRY_FILE = path.join(__dirname, "component-registry.json");
const OVERRIDES_FILE = path.join(__dirname, "component-metadata-overrides.json");
const COHORT = [
  "pieBreakdown", "heatmap", "radar", "waterfall",
  "processTimeline", "milestoneTimeline", "valueChain", "pipelineFlow", "swimlaneProcess",
  "stateFlow", "archLayered", "systemArchitectureCenter", "toolSystemTree", "moduleCorrespondenceMap",
  "hubSpokeCapability", "annotatedDiagram", "dashboardMock", "capabilityMatrix"
];
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); }
function buildAudit(registry, overrides) {
  const validation = inspectOverrides(overrides, registry);
  const registryByName = new Map((registry.components || []).map(component => [component.name, component]));
  const missing = COHORT.filter(name => !registryByName.has(name));
  const rows = COHORT.filter(name => registryByName.has(name)).map(name => {
    const effective = mergeMetadata(registryByName.get(name), overrides.components?.[name] || {});
    return {
      name,
      level: effective.level,
      primaryRelationships: effective.relationships || [],
      secondaryRelationships: effective.secondaryRelationships || [],
      slots: effective.slots || [],
      selectionConfidenceCap: effective.selectionConfidenceCap,
      metadataSource: effective.metadataSource,
      metadataReviewStatus: effective.metadataReviewStatus,
      designStatus: effective.designStatus,
      renderStatus: effective.renderStatus || "registry-only",
      fingerprint: fingerprint(effective)
    };
  });
  const groups = {};
  rows.forEach(row => { (groups[row.fingerprint] ||= []).push(row.name); });
  const repeatedFingerprints = Object.values(groups).filter(names => names.length > 1).sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
  return {
    version: "component-metadata-audit.v1",
    cohort: COHORT,
    missing,
    reviewed: rows.filter(row => row.metadataSource === "manual" && row.metadataReviewStatus === "manual-reviewed").length,
    uniqueFingerprints: Object.keys(groups).length,
    repeatedFingerprints,
    validation,
    rows
  };
}
function selfTest() {
  const report = buildAudit(readJson(REGISTRY_FILE), readJson(OVERRIDES_FILE));
  assert.equal(report.missing.length, 0, `cohort IDs missing: ${report.missing.join(", ")}`);
  assert.equal(report.validation.errors.length, 0, "override validation must pass before metadata audit");
  assert.equal(report.reviewed, COHORT.length, "all cohort components must resolve to manually reviewed metadata");
  assert(!report.repeatedFingerprints.some(names => names.length >= 4), "no four cohort components may share one reviewed fingerprint");
  console.log("PASS component metadata audit self-test");
}
function main() {
  const report = buildAudit(readJson(REGISTRY_FILE), readJson(OVERRIDES_FILE));
  const outDir = path.join(ROOT, "output");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "component-metadata-audit.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  const lines = ["# Component Metadata Audit", "", `- Cohort: ${report.cohort.length}`, `- Manually reviewed: ${report.reviewed}`, `- Unique fingerprints: ${report.uniqueFingerprints}`, `- Missing IDs: ${report.missing.length}`, `- Validation errors: ${report.validation.errors.length}`, "", "## Components", "", ...report.rows.map(row => `- ${row.name}: ${row.primaryRelationships.join("+")} / secondary=${row.secondaryRelationships.join("+") || "none"} / cap=${row.selectionConfidenceCap} / source=${row.metadataSource}`), "", "## Repeated fingerprints", "", ...(report.repeatedFingerprints.length ? report.repeatedFingerprints.map(names => `- ${names.join(" / ")}`) : ["- None"]), ""];
  fs.writeFileSync(path.join(outDir, "component-metadata-audit.md"), lines.join("\n"), "utf8");
  console.log(`PASS component metadata audit: ${report.reviewed}/${report.cohort.length} reviewed; fingerprints=${report.uniqueFingerprints}`);
  if (report.missing.length || report.validation.errors.length || report.reviewed !== report.cohort.length || report.repeatedFingerprints.some(names => names.length >= 4)) process.exit(1);
}
if (require.main === module) process.argv.includes("--self-test") ? selfTest() : main();
module.exports = { COHORT, buildAudit };
