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
      fullDeckRendered: false
    }
  },
  executionBudget: {
    // Single-task mode: the whole deck is produced in one task. There is no token
    // ceiling and no rotation — the token ledger only measures cost, it never blocks.
    // The threshold fields below are retained for the ledger's report labels only.
    enforcementMode: "report-only", // retained field; the gate never enforces
    conversationHardTotalTokens: 0,  // 0 = no hard limit
    executionStopTokens: 0,
    handoffOnlyTokens: 0,
    reservedCompletionTokens: 40000,
    callBudgetMode: "single-task",
    preferredRootTasks: 1,
    maxPlannedRootTasks: 1,
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
    // is flagged highVisualRisk. planner-zh owns story + outline AND the whole-deck
    // layout blueprint in one pass (they are one planning decision, not two reviews).
    // Speaker notes are a main-agent deliverable step, not an agent role.
    roleTriggers: {
      "planner-zh": ["storyChanged", "layoutChanged"],
      "visual-designer-zh": ["designChanged", "themeChanged", "highVisualRisk"],
      "component-curator-zh": ["componentChanged", "lowConfidenceSelection"],
      "reviewer-zh": ["renderedPagesReady", "fullDeckRendered"]
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
