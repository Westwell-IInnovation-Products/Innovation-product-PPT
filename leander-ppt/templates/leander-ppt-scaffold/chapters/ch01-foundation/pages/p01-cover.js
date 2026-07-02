const pageId = "p01";

function build(slide, { ui, page }) {
  ui.cover(slide, {
    title: "Leander PPT 脚手架",
    subtitle: "Reusable Editable Deck Scaffold",
    date: `${page.pageId} / scaffold sample · 2026`
  });
}

module.exports = { pageId, build };
