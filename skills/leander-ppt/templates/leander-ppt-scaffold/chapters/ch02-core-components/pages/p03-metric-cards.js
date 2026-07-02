const pageId = "p03";

function build(slide, { ui, theme }) {
  slide.background = { color: theme.colors.bg };
  ui.metricCards(slide, {
    title: "Three Metric Cards",
    subtitle: "For quantified value, benchmark evidence, and staged benefits.",
    items: [
      { value: "30%", label: "Efficiency", desc: "Use a strong number for the claim; keep body text to source and boundary." },
      { value: "2.5x", label: "Response", desc: "Number, unit, source, and scenario should appear together." },
      { value: "P0", label: "Priority", desc: "When a point is not numeric, use a clear decision level." }
    ],
    caveat: "Sample numbers are layout placeholders. Real decks must label source and estimate boundaries."
  });
}

module.exports = { pageId, build };
