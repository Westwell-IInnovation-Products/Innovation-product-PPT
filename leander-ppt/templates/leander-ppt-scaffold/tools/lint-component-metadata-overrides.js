// Validate manually reviewed component metadata before it can affect registry/index generation.
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const OVERRIDES_FILE = path.join(__dirname, "component-metadata-overrides.json");
const REGISTRY_FILE = path.join(__dirname, "component-registry.json");
const REQUIRED = ["relationships", "secondaryRelationships", "expressionCapability", "slots", "avoidWhen", "qaRisks", "selectionConfidenceCap", "reviewedAt", "reviewedBy"];
const CAP_MIN = 0.45;
const CAP_MAX = 0.92;

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); }
function list(value) { return Array.isArray(value) ? value.map(item => String(item || "").trim()).filter(Boolean) : []; }
function fingerprint(meta) {
  return JSON.stringify({
    relationships: list(meta.relationships).sort(),
    secondaryRelationships: list(meta.secondaryRelationships).sort(),
    slots: list(meta.slots).sort(),
    expressionCapability: String(meta.expressionCapability || "").trim().toLowerCase(),
    avoidWhen: list(meta.avoidWhen).sort(),
    qaRisks: list(meta.qaRisks).sort()
  });
}
function mergeMetadata(base, override) {
  const protectedRuntime = {
    renderStatus: base.renderStatus,
    selectable: base.selectable,
    availabilityReason: base.availabilityReason
  };
  return { ...base, ...override, ...protectedRuntime, name: base.name };
}
function inspectOverrides(overrides, registry) {
  const errors = [], warnings = [];
  const add = (list, type, component, message) => list.push({ type, component, message });
  const registryNames = new Set((registry.components || []).map(component => component.name));
  const allowed = new Set(overrides.allowedRelationships || []);
  if (overrides.schemaVersion !== "component-metadata-overrides.v1") add(errors, "invalid-schema", "registry", "schemaVersion must be component-metadata-overrides.v1");
  const entries = Object.entries(overrides.components || {});
  const fingerprints = new Map();
  entries.forEach(([name, meta]) => {
    if (!registryNames.has(name)) add(errors, "unknown-component", name, "override references an unknown registry component");
    REQUIRED.forEach(field => {
      const value = meta[field];
      if (value === undefined || value === null || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && !value.length)) add(errors, "missing-required-field", name, `missing ${field}`);
    });
    const primary = list(meta.relationships), secondary = list(meta.secondaryRelationships);
    [...primary, ...secondary].filter(rel => !allowed.has(rel)).forEach(rel => add(errors, "unknown-relationship", name, `unknown relationship ${rel}`));
    const duplicate = primary.filter(rel => secondary.includes(rel));
    if (duplicate.length) add(errors, "duplicate-primary-secondary", name, `relationship appears in primary and secondary: ${duplicate.join(", ")}`);
    const cap = Number(meta.selectionConfidenceCap);
    if (!Number.isFinite(cap) || cap < CAP_MIN || cap > CAP_MAX) add(errors, "invalid-confidence-cap", name, `selectionConfidenceCap must be ${CAP_MIN}-${CAP_MAX}`);
    if (meta.metadataSource !== "manual") add(errors, "invalid-metadata-source", name, "metadataSource must be manual");
    const fp = fingerprint(meta);
    if (!fingerprints.has(fp)) fingerprints.set(fp, []);
    fingerprints.get(fp).push(name);
  });
  for (const names of fingerprints.values()) {
    if (names.length >= 4) add(warnings, "repeated-reviewed-fingerprint", names.join(","), `${names.length} reviewed components still share one metadata fingerprint`);
  }
  return { errors, warnings, reviewedCount: entries.length, fingerprintCount: fingerprints.size };
}
function selfTest() {
  const registry = { components: [{ name: "processTimeline" }, { name: "a" }, { name: "b" }, { name: "c" }, { name: "d" }] };
  const baseMeta = { relationships: ["sequence"], secondaryRelationships: ["lifecycle"], expressionCapability: "linear ordered stages", slots: ["stages"], avoidWhen: ["not a sequence"], qaRisks: ["unclear direction"], selectionConfidenceCap: 0.84, reviewedAt: "2026-07-22", reviewedBy: "curator", metadataSource: "manual" };
  const valid = { schemaVersion: "component-metadata-overrides.v1", allowedRelationships: ["sequence", "lifecycle"], components: { processTimeline: baseMeta } };
  assert.equal(inspectOverrides(valid, registry).errors.length, 0);
  const unknownId = { ...valid, components: { missing: baseMeta } };
  assert(inspectOverrides(unknownId, registry).errors.some(item => item.type === "unknown-component"));
  const badCap = { ...valid, components: { processTimeline: { ...baseMeta, selectionConfidenceCap: 0.99 } } };
  assert(inspectOverrides(badCap, registry).errors.some(item => item.type === "invalid-confidence-cap"));
  const duplicateFingerprint = { ...valid, components: Object.fromEntries(["a", "b", "c", "d"].map(name => [name, baseMeta])) };
  assert(inspectOverrides(duplicateFingerprint, registry).warnings.some(item => item.type === "repeated-reviewed-fingerprint"));
  const merged = mergeMetadata({ name: "processTimeline", metadataSource: "legacy-inferred", relationships: ["sequence"], selectionConfidenceCap: 0.74, renderStatus: "renderable", selectable: true }, { metadataSource: "manual", relationships: ["sequence"], secondaryRelationships: ["lifecycle"], selectionConfidenceCap: 0.88 });
  assert.deepEqual(merged.relationships, ["sequence"]);
  assert.deepEqual(merged.secondaryRelationships, ["lifecycle"]);
  assert.equal(merged.selectionConfidenceCap, 0.88);
  assert.equal(merged.metadataSource, "manual");
  assert.equal(merged.selectable, true);
  console.log("PASS component metadata overrides self-test");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    const report = inspectOverrides(readJson(OVERRIDES_FILE), readJson(REGISTRY_FILE));
    console.log(JSON.stringify(report, null, 2));
    if (report.errors.length) process.exit(1);
  }
}
module.exports = { inspectOverrides, mergeMetadata, fingerprint, REQUIRED, CAP_MIN, CAP_MAX };
