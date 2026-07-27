// Self-contained page module. In the per-page model the build code lives HERE (not in a shared file).
module.exports = {
  id: "p01",
  title: "封面",
  visualBinding: { route: "component-library", name: "cover" },
  build(slide, { ui }) {
    ui.cover(slide, {
      title: "<标题>",
      subtitle: "<副标题：概括本页/全篇核心，非口语>",
      date: "<场合 · 年份>"
    });
  }
};
