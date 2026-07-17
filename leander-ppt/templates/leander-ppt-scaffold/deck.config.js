// Generic project config. Project facts belong here, not in the shared Skill rules.
module.exports = {
  name: "<Deck name>",
  deckType: "general", // general | internal-sharing | management-report | training | customer-demo
  theme: "leander-base",
  fileName: "output/<deck>.pptx",
  anchorFileName: "output/anchor-samples.pptx",
  batchFileName: "output/current-batch.pptx",
  workflow: {
    stage: "outline-reset", // outline-reset | layout-blueprint | anchor-sample | production-batch | production
    activePages: [], // page-folder names; anchor/batch mode should list only current pages
    events: {
      storyChanged: false,
      layoutChanged: false,
      designChanged: false,
      themeChanged: false,
      highVisualRisk: false,
      componentChanged: false,
      lowConfidenceSelection: false,
      renderedPagesReady: false,
      fullDeckRendered: false,
      rehearsalRequested: false
    }
  },
  agentCollaboration: {
    enabled: true,
    policy: "event-driven.v3",
    requireRoleBriefs: true,
    roleTriggers: {
      "planner-zh": ["storyChanged"],
      "layout-architect-zh": ["layoutChanged"],
      "visual-designer-zh": ["designChanged", "themeChanged", "highVisualRisk", "fullDeckRendered"],
      "component-curator-zh": ["componentChanged", "lowConfidenceSelection"],
      "reviewer-zh": ["renderedPagesReady", "fullDeckRendered"],
      "presenter-zh": ["rehearsalRequested"]
    },
    // Final quality is judged from the integrated render, not only page contracts.
    // Standard budget: one visual review at anchor, one reviewer run at final.
    finalAlwaysRequiredRoles: ["reviewer-zh"],
    internalSharingRequiredRoles: [],
    independentAtFinal: ["reviewer-zh"],
    standardModeBReviewRuns: ["anchor:visual-designer-zh", "final:reviewer-zh"],
    requireFreshFinalForkNone: true,
    maxRunsPerRolePerPhase: 1,
    allowMainAgentFallback: true,
    allowRequiredBypass: false
  }
};
