const pageId = "p07";

function build(slide, { ui, theme }) {
  slide.background = { color: theme.colors.bg };
  ui.hubSpokeCapability(slide, {
    title: "Hub-Spoke Capability",
    subtitle: "For showing how one core system supports multiple modules or roles.",
    center: "Leander PPT",
    modules: [
      { title: "Outline", desc: "Structure first", icon: "document", status: "key" },
      { title: "Theme", desc: "Token reuse", icon: "shield" },
      { title: "Components", desc: "Page assets", icon: "hub" },
      { title: "Charts", desc: "Visible info", icon: "chart" },
      { title: "Assets", desc: "Image/icon", icon: "person" },
      { title: "QA", desc: "Rendered check", icon: "clock" }
    ],
    takeaway: "Hub-spoke pages must explain relationships, not just decorate the page."
  });
}

module.exports = { pageId, build };
