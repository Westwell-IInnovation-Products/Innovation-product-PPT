const pageId = "p08";

function build(slide, { ui, theme }) {
  slide.background = { color: theme.colors.bg };
  ui.roadmapSwimlane(slide, {
    title: "Roadmap Swimlane",
    subtitle: "For version planning, delivery rhythm, and multi-team plans.",
    stages: ["Stage 1", "Stage 2", "Stage 3", "Stage 4", "Stage 5"],
    current: 1,
    lanes: [
      { name: "Content", items: ["Collect", "Outline", "Samples", "Full deck", "Archive"] },
      { name: "Design", items: ["Theme", "Component", "Calibrate", "Repair", "Update"] },
      { name: "QA", items: ["Structure", "Preview", "Text", "Demo", "Close"] }
    ]
  });
}

module.exports = { pageId, build };
