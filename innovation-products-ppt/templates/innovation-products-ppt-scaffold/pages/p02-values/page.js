// Example content page: the library component carries the BODY BLOCK only;
// the page still composes its own evidence strip and takeaway band around it.
// A single bare component call is reserved for covers and section dividers —
// see references/PAGE-DESIGN-METHOD.md "Composition Skeleton Floor".
module.exports = {
  id: "p02",
  title: "核心价值",
  visualBinding: { route: "component-library", name: "hubRadial" },
  build(slide, { ui, bp, theme }) {
    const C = theme.colors, T = theme.type;

    // 主体区块：组件承担核心结构（含标题带）
    bp.hubRadial(slide, {
      title: "<页面标题：书面/学术陈述，非口语>",
      subtitle: "<副标题＝本页一句话论点（听众应带走的那句），不是标题的口语化复述>",
      center: { name: "<中心机制>", sub: "<副说明>" },
      spokes: [
        { t: "<价值一>", b: "<说明，正文小字、标题大字——见 theme.type>" },
        { t: "<价值二>", b: "<说明>" },
        { t: "<价值三>", b: "<说明>", focus: true },   // 单点焦点 = 红；其余同级藏蓝
        { t: "<价值四>", b: "<说明>" }
      ]
    });

    // 自定义区：证据/来源锚点（正式项目替换为真实截图槽、指标口径或来源出处）。
    // 这是"新增信息"，不是复述论点，所以可以留在底部。
    ui.rect(slide, 118, 838, 1684, 54, { fill: C.surface2, line: C.line, round: true });
    ui.addText(slide, 146, 853, 1630, 24, "<证据锚点：来源、指标口径或真实截图说明>", { size: T.micro, color: C.mute });

    // 注意：默认不再加"底部结论带"。本页论点已经写在 subtitle 里。
    // 只有当底部要承担 副标题没有的 新增综合判断/边界，或作为少数过渡页的引导句时，
    // 才另加一条 caveatBand/引导句；否则不要在页尾复述 takeaway（见 SLIDE-CRAFT.md）。

    ui.footer(slide);
  }
};
