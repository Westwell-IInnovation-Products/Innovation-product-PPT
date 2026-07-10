// Generic project config. Project facts belong here, not in the shared Skill rules.
module.exports = {
  name: "<Deck name>",
  deckType: "general", // general | internal-sharing | management-report | training | customer-demo
  theme: "leander-base",
  fileName: "output/<deck>.pptx",
  anchorFileName: "output/anchor-samples.pptx",
  batchFileName: "output/current-batch.pptx",
  workflow: {
    stage: "anchor-sample", // outline-reset | layout-blueprint | anchor-sample | production-batch | production
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
    policy: "event-driven.v2",
    requireRoleBriefs: true,
    roleTriggers: {
      "planner-zh": ["storyChanged"],
      "layout-architect-zh": ["layoutChanged"],
      "visual-designer-zh": ["designChanged", "themeChanged", "highVisualRisk", "fullDeckRendered"],
      "component-curator-zh": ["componentChanged", "lowConfidenceSelection"],
      "reviewer-zh": ["renderedPagesReady", "fullDeckRendered"],
      "presenter-zh": ["rehearsalRequested"]
    },
    finalAlwaysRequiredRoles: ["reviewer-zh"],
    internalSharingRequiredRoles: ["presenter-zh"],
    independentAtFinal: ["visual-designer-zh", "component-curator-zh", "reviewer-zh", "presenter-zh"],
    allowMainAgentFallback: true,
    allowRequiredBypass: false
  }
};
