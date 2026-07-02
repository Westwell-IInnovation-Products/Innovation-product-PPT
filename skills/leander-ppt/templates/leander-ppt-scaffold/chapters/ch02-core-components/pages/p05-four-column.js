const pageId = "p05";

function build(slide, { ui, theme }) {
  slide.background = { color: theme.colors.bg };
  ui.fourColumnMechanism(slide, {
    title: "Four-Column Mechanism",
    subtitle: "For four values, four roles, four capabilities, or four process links.",
    items: [
      { title: "Operate", desc: "Connect metrics, process, and action.", icon: "chart", close: "Visible" },
      { title: "Govern", desc: "Close the loop from issue to solution.", icon: "arrow", close: "Closed Loop" },
      { title: "Assetize", desc: "Turn one-off experience into reusable knowledge.", icon: "hub", close: "Reusable" },
      { title: "Decide", desc: "Unify language across teams.", icon: "document", close: "Aligned" }
    ]
  });
}

module.exports = { pageId, build };
