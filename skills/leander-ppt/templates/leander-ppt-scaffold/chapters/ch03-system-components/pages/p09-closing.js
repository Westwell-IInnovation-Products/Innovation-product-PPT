const pageId = "p09";

function build(slide, { ui }) {
  ui.closing(slide, {
    slogan: [
      { text: "把重复的页面问题，沉淀为可复用的" },
      { text: "组件", hot: true },
      { text: "与" },
      { text: "规则", hot: true },
      { text: "。" }
    ]
  });
}

module.exports = { pageId, build };
