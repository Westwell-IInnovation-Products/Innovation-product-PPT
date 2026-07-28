const POLICY_VERSION = "visual-geometry-policy.v2";

const DEFAULTS = Object.freeze({
  slideWidth: 13.333,
  slideHeight: 7.5,
  textSafeMargin: 0.042,
  boundsTolerance: 0.01,
  minTextIntersectionArea: 0.0002,
  maxConnectorOcclusionRatio: 0.60,
  minVisibleConnector: 0.167,
  connectorImbalanceRatio: 0.45,
  connectorImbalanceDelta: 0.50,
  reservedZoneTolerance: 0.014,
  bodyTop: 1.0,
  bodyBottom: 6.9,
  minBodyFontSizePt: 7.5,
  smallBodyMinChars: 12,
  smallBodyMinCount: 4,
  smallBodyTotalChars: 180,
  tallCardMinHeight: 1.4,
  tallCardMaxHeight: 3.5,
  tallCardMaxWidth: 4.2,
  tallCardGapRatio: 0.42
});

function pairKey(a, b) {
  return [String(a || ""), String(b || "")].sort().join("::");
}

function validReason(value) {
  return String(value || "").trim().length >= 12;
}

function intentionalOverlapSet(scene = {}) {
  return new Set((scene.intentionalOverlaps || [])
    .filter(item => item && item.a && item.b && validReason(item.reason))
    .map(item => pairKey(item.a, item.b)));
}

function isDeclaredOverlap(scene, a, b) {
  return intentionalOverlapSet(scene).has(pairKey(a, b));
}

function policyFor(scene = {}) {
  return { ...DEFAULTS, ...(scene.policy || {}) };
}

module.exports = {
  POLICY_VERSION,
  DEFAULTS,
  pairKey,
  validReason,
  intentionalOverlapSet,
  isDeclaredOverlap,
  policyFor
};
