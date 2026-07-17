// Deterministic risk tiers for deciding which rendered pages require full-size review.
const assert = require("assert");

function classifyPage(meta = {}, warningFields = []) {
  const words = `${meta.relationship || ""} ${meta.expressionMode || ""} ${meta.visualSelection?.selectedRoute?.route || ""}`.toLowerCase();
  const reasons = [];
  if (meta.highVisualRisk === true) reasons.push("explicit-high-risk");
  if (/system|architecture|mechanism|network|tree|flow|lifecycle|hierarchy/.test(words)) reasons.push("complex-geometry");
  if (/screenshot|evidence|metric|chart|dashboard|external-graphic|image2/.test(words)) reasons.push("evidence-or-image");
  if (/dense|high/.test(String(meta.contentDensity || "").toLowerCase())) reasons.push("dense-content");
  if (Number(meta.visualSelection?.selectedRoute?.margin ?? 99) < 8) reasons.push("low-route-margin");
  if ((meta.requiredSlots || []).length >= 6 || Number(meta.contentShape?.maxItems || meta.visualSelection?.contentShape?.maxItems || 0) >= 6) reasons.push("high-capacity");
  if (warningFields.length) reasons.push(...warningFields.map(field => `warning:${field}`));
  return { level: reasons.length ? "high" : "normal", fullSizeRequired: reasons.length > 0, reasons: [...new Set(reasons)] };
}

function selfTest() {
  assert.equal(classifyPage({ relationship: "sequence", expressionMode: "mechanism-flow" }).level, "high");
  assert.equal(classifyPage({ relationship: "contrast", expressionMode: "simple-contrast", visualSelection: { selectedRoute: { route: "component-library", margin: 20 } } }).level, "normal");
  assert.equal(classifyPage({}, ["deadSpace"]).fullSizeRequired, true);
  console.log("PASS render risk self-test");
}

if (require.main === module) selfTest();
module.exports = { classifyPage, selfTest };
