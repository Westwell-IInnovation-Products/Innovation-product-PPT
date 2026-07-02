const pageId = "p04";

function build(slide, { ui, theme }) {
  slide.background = { color: theme.colors.bg };
  ui.bigWordCardMatrix(slide, {
    title: "Big Word + Card Matrix",
    subtitle: "For strategic judgement, value statements, and operating principles.",
    words: ["Lower Cost", "Raise Speed"],
    summary: "Use the left side as the memory anchor and the right side for reusable evidence or actions.",
    cards: [
      { title: "Product", desc: "Reusable components reduce repeated design and development work." },
      { title: "Project", desc: "Delivery artifacts become traceable and easier to repair." },
      { title: "Management", desc: "Shared language improves decision quality and review speed." },
      { title: "Operations", desc: "Reusable examples reduce repeated onsite trial and error." }
    ]
  });
}

module.exports = { pageId, build };
