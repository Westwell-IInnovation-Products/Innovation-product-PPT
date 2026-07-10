// Example content page using a generic bespoke component (hub + radiating value cards).
module.exports = {
  id: "p02",
  title: "核心价值",
  visualBinding: { route: "component-library", name: "hubRadial" },
  build(slide, { bp }) {
    bp.hubRadial(slide, {
      title: "<页面标题>",
      subtitle: "<一句话概括本页核心>",
      center: { name: "<中心机制>", sub: "<副说明>" },
      spokes: [
        { t: "<价值一>", b: "<说明，正文小字、标题大字——见 theme.type>" },
        { t: "<价值二>", b: "<说明>" },
        { t: "<价值三>", b: "<说明>", focus: true },   // 单点焦点 = 红；其余同级藏蓝
        { t: "<价值四>", b: "<说明>" }
      ]
    });
  }
};
