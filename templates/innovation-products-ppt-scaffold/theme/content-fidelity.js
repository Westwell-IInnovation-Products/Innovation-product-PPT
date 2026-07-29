// Executable content-layer signatures for the three shared themes.
// Colors and chrome never count as fidelity evidence: every feature below must
// change body composition, information hierarchy, evidence treatment, or state.

const profiles = {
  "leander-base": {
    id: "leander-base",
    label: "Leander Base",
    intent: "A restrained internal engineering brief organized by rules, dividers, and one semantic focus.",
    minimumFeatures: 3,
    minimumCategories: 2,
    features: {
      "linear-divider-structure": { category: "composition", description: "Use rails, rules, or dividers as the primary grouping device instead of a wall of cards." },
      "single-semantic-focus": { category: "hierarchy", description: "Keep one explicit focal claim or current item while peers remain structurally quiet." },
      "flat-content-plane": { category: "depth", description: "Keep body containers flat and subordinate to line structure." },
      "plain-conclusion": { category: "hierarchy", description: "Resolve the page with a plain typographic conclusion, not a floating summary panel." },
      "asymmetric-explanation": { category: "composition", description: "Use a dominant explanation area with a smaller supporting area." },
      "source-boundary-strip": { category: "evidence", description: "Place source or implementation boundaries in a compact ruled strip." }
    },
    preferredArchetypes: [
      "base.linear-explanation",
      "base.rule-led-compare",
      "base.stage-rail",
      "base.flat-mechanism"
    ],
    forbiddenPatterns: [
      "shadow-card-wall",
      "ornamental-dashboard",
      "equal-weight-card-array",
      "accent-everywhere"
    ],
    componentFeatureMap: {
      processTimeline: ["linear-divider-structure", "single-semantic-focus"],
      pipelineFlow: ["linear-divider-structure", "asymmetric-explanation"],
      beforeAfter: ["linear-divider-structure", "plain-conclusion"],
      capabilityMatrix: ["flat-content-plane", "source-boundary-strip"]
    }
  },
  base2: {
    id: "base2",
    label: "Base2",
    intent: "A softly layered internal mechanism board with explicit state, evidence, and decision depth.",
    minimumFeatures: 3,
    minimumCategories: 2,
    features: {
      "layered-evidence-board": { category: "composition", description: "Use one primary evidence plane plus inset supporting evidence." },
      "state-rail": { category: "state", description: "Encode current, blocked, done, and pending states through position, outline, and labels." },
      "tiered-radius-depth": { category: "depth", description: "Use distinct panel, card, and inset levels with one restrained elevation layer." },
      "role-based-elevation": { category: "depth", description: "Apply one light shadow to primary surfaces while support, inset, row, and control layers stay flat." },
      "meaningful-rule-integration": { category: "composition", description: "Combine form-led surfaces with connectors, matrix rules, timelines, hierarchy branches, swimlane boundaries, or equivalent relationship-bearing lines." },
      "region-eyebrows": { category: "hierarchy", description: "Use compact region labels to separate evidence, mechanism, and decision zones." },
      "semantic-focus-panel": { category: "state", description: "Reserve the soft focus panel for the current gate, risk, blockage, or conclusion." },
      "decision-band": { category: "hierarchy", description: "Resolve a decision or governance page with a bounded conclusion band." }
    },
    preferredArchetypes: [
      "base2.layered-evidence-board",
      "base2.status-rail",
      "base2.mechanism-chain",
      "base2.decision-path"
    ],
    forbiddenPatterns: [
      "uniform-radius-card-wall",
      "multi-layer-shadow-stack",
      "decorative-soft-red",
      "equal-weight-card-array",
      "decorative-state-rail",
      "all-surfaces-shadowed"
    ],
    strictRequiredFeatures: ["meaningful-rule-integration", "role-based-elevation"],
    componentFeatureMap: {
      stateFlow: ["state-rail", "semantic-focus-panel"],
      stageGateRail: ["state-rail", "region-eyebrows"],
      barCard: ["semantic-focus-panel", "tiered-radius-depth", "role-based-elevation"],
      statusCard: ["state-rail", "tiered-radius-depth", "role-based-elevation"],
      conclusionBand: ["decision-band", "tiered-radius-depth"],
      base2GovernanceChain: ["layered-evidence-board", "region-eyebrows", "semantic-focus-panel", "decision-band", "meaningful-rule-integration", "role-based-elevation"],
      evidenceBoard: ["layered-evidence-board", "region-eyebrows", "role-based-elevation"],
      engineeringVariableTable: ["tiered-radius-depth", "meaningful-rule-integration", "role-based-elevation"]
    }
  },
  "leander-global": {
    id: "leander-global",
    label: "Leander Global",
    intent: "A formal FMS-style engineering report led by evidence, variables, deltas, and compact technical annotation.",
    minimumFeatures: 3,
    minimumCategories: 2,
    features: {
      "evidence-dominant-main": { category: "composition", description: "Give the real screenshot, diagram, or proof object the largest body region." },
      "compact-kpi-rail": { category: "density", description: "Place many metrics in one compact ruled rail instead of equal-size metric cards." },
      "engineering-variable-table": { category: "density", description: "Use a compact variable table with units, cases, source/state, and aligned values." },
      "delta-comparison": { category: "comparison", description: "Show baseline, candidate, and delta on the same engineering scale." },
      "pending-simulation-state": { category: "state", description: "Represent missing results as explicit pending simulation/measurement rows without invented values." },
      "asymmetric-technical-layout": { category: "composition", description: "Use a dominant technical field plus a narrow annotation or decision rail." },
      "precise-callout-anchors": { category: "evidence", description: "Anchor numbered callouts to real locations on the evidence object." },
      "ruled-information-hierarchy": { category: "hierarchy", description: "Use fine rules, row bands, and aligned labels to organize dense information." }
    },
    preferredArchetypes: [
      "global.engineering-evidence",
      "global.variable-register",
      "global.delta-study",
      "global.pending-simulation-board",
      "global.compact-kpi-evidence"
    ],
    highCapacityArchetypes: [
      "global.engineering-evidence",
      "global.variable-register",
      "global.delta-study",
      "global.pending-simulation-board",
      "global.compact-kpi-evidence"
    ],
    forbiddenPatterns: [
      "uniform-metric-grid",
      "generic-card-wall",
      "dashboard-skin",
      "equal-weight-card-array",
      "empty-kpi-cards"
    ],
    componentFeatureMap: {
      evidenceBoard: ["evidence-dominant-main", "asymmetric-technical-layout", "precise-callout-anchors"],
      compactKpiRail: ["compact-kpi-rail", "ruled-information-hierarchy"],
      engineeringVariableTable: ["engineering-variable-table", "pending-simulation-state", "ruled-information-hierarchy"],
      deltaCompare: ["delta-comparison", "ruled-information-hierarchy"],
      annotatedDiagram: ["evidence-dominant-main", "precise-callout-anchors"],
      capabilityMatrix: ["engineering-variable-table", "ruled-information-hierarchy"],
      waterfall: ["delta-comparison", "ruled-information-hierarchy"]
    }
  }
};

function normalizeThemeId(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (/^base-?2$/.test(raw)) return "base2";
  if (raw === "global") return "leander-global";
  if (raw === "base") return "leander-base";
  return profiles[raw] ? raw : "leander-base";
}

function getContentFidelity(value) {
  return profiles[normalizeThemeId(value)];
}

function selfTest() {
  const assert = require("assert");
  const ids = Object.keys(profiles);
  assert.deepEqual(ids.sort(), ["base2", "leander-base", "leander-global"].sort());
  ids.forEach(id => {
    const profile = profiles[id];
    assert(profile.intent && profile.preferredArchetypes.length >= 4);
    assert(Object.keys(profile.features).length >= 6);
    assert(profile.forbiddenPatterns.length >= 4);
    Object.entries(profile.features).forEach(([featureId, feature]) => {
      assert(!/color|chrome|footer|header|font/.test(featureId), `${id}/${featureId} is only skin evidence`);
      assert(feature.category && feature.description);
    });
  });
  assert(getContentFidelity("Base2").id === "base2");
  for (const feature of getContentFidelity("Base2").strictRequiredFeatures) {
    assert(getContentFidelity("Base2").features[feature], `Base2 strict feature missing: ${feature}`);
  }
  assert(getContentFidelity("global").id === "leander-global");
  console.log("PASS theme content-fidelity profile contract");
}

if (require.main === module && process.argv.includes("--self-test")) selfTest();

module.exports = { profiles, normalizeThemeId, getContentFidelity, selfTest };
