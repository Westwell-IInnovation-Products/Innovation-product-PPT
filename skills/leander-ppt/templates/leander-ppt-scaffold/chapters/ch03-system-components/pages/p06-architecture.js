const pageId = "p06";

function build(slide, { ui, theme }) {
  slide.background = { color: theme.colors.bg };
  ui.systemArchitectureCenter(slide, {
    title: "System Architecture Center",
    subtitle: "For platform, product architecture, data flow, and control flow.",
    inputTitle: "Inputs",
    outputTitle: "Outputs",
    coreTitle: "Core Platform",
    coreSubtitle: "Data processing / strategy orchestration / state management",
    inputs: ["Business data", "Device status", "Field feedback", "Rules", "External system"],
    modules: ["Data access", "Algorithm", "Task flow", "Metrics", "Permission", "Knowledge"],
    outputs: ["Dashboard", "Decision advice", "Task command", "Risk alert", "Review report"]
  });
}

module.exports = { pageId, build };
