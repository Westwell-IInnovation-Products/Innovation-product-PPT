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
  executionBudget: {
    // Wave A observes first. Switch to "enforce" only after several real decks
    // show that the thresholds leave enough room for a clean handoff.
    enforcementMode: "report-only", // report-only | enforce
    conversationHardTotalTokens: 260000,
    executionStopTokens: 180000,
    handoffOnlyTokens: 220000,
    reservedCompletionTokens: 40000,
    callBudgetMode: "adaptive",
    preferredRootTasks: 4,
    maxPlannedRootTasks: 6,
    subagentTargetTotalTokens: 120000,
    contextPacks: {
      status: 3000,
      repair: 10000,
      qa: 12000,
      agent: 16000
    }
  },
  agentCollaboration: {
    enabled: true,
    policy: "event-driven.v3",
    requireRoleBriefs: true,
    // Each opened workflow.event above pulls in a fresh-fork review role here — a
    // fresh review re-reads renders + role-brief references and does not share
    // cache, so every extra role is real token cost. Open an event only when you
    // genuinely need that role.
    // Final review defaults to reviewer-only: fullDeckRendered pulls in reviewer-zh
    // but NOT visual-designer-zh (style is already locked at anchor, and the final
    // reviewer already covers composition/visual/color/shape-class defects).
    // visual-designer re-engages only when design/theme actually changed or a page
    // is flagged highVisualRisk. presenter-zh is a deliverable step (speaker notes)
    // run on rehearsalRequested, not an extra quality gate — opening it does not
    // "double-check" the deck, it only adds a pass.
    roleTriggers: {
      "planner-zh": ["storyChanged"],
      "layout-architect-zh": ["layoutChanged"],
      "visual-designer-zh": ["designChanged", "themeChanged", "highVisualRisk"],
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
    // This is a quality/reuse guard, not a global hard cap. A changed event
    // digest may justify another run; unchanged evidence must be reused.
    maxRunsPerRolePerPhase: 1,
    callCountPolicy: "telemetry-only",
    subagentCountPolicy: "telemetry-only",
    reviewerScope: "delta-first",
    allowMainAgentFallback: true,
    allowRequiredBypass: false
  }
};
