const pageId = "p02";

function build(slide, { ui }) {
  ui.sectionDividerBigNumber(slide, {
    number: "01",
    title: "Componentized Expression",
    subtitle: "Turn recurring slide problems into reusable layouts, components, and QA rules.",
    keywords: ["Structure", "Visual", "QA"]
  });
}

module.exports = { pageId, build };
