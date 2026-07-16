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

    // 自定义区一：证据/来源条（正式项目替换为真实截图槽、指标或来源出处）
    ui.rect(slide, 118, 838, 1080, 54, { fill: C.surface2, line: C.line, round: true });
    ui.addText(slide, 146, 853, 1030, 24, "<证据锚点：来源、指标口径或真实截图说明>", { size: T.micro, color: C.mute });

    // 自定义区二：结论带（页面主张，不是栏目名）
    ui.rect(slide, 1226, 838, 576, 54, { fill: C.accentSoft, line: C.accent, round: true });
    ui.addText(slide, 1246, 853, 536, 24, "<本页结论：听众应带走的一句话>", { size: T.micro, color: C.accent, bold: true, align: "center" });

    ui.footer(slide);
  }
};
