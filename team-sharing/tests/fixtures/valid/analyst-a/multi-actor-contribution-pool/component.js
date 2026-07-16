module.exports = {
  name: "multiActorContributionPool",
  create({ ui, theme }) {
    return function multiActorContributionPool(slide, data = {}) {
      const C = theme.colors;
      const actors = (data.actors || ["Contributor A", "Contributor B", "Contributor C"]).slice(0, 4);
      const top = ui.header(slide, data.title || "Contribution to Shared Pool", data.subtitle || "Isolated work enters one governed release") || 220;
      const cardW = 300;
      actors.forEach((actor, index) => {
        const x = 180 + index * 360;
        ui.rect(slide, x, top + 100, cardW, 150, { fill: C.surface, line: C.line, round: true });
        ui.addText(slide, x + 24, top + 145, cardW - 48, 40, actor, { size: 19, color: C.primary, bold: true, align: "center", fit: "shrink" });
        ui.line(slide, x + cardW, top + 175, 1560, top + 420, { color: C.line, width: 1.2, arrow: "triangle" });
      });
      ui.rect(slide, 650, top + 345, 620, 170, { fill: C.accentSoft, line: C.accent, round: true });
      ui.addText(slide, 700, top + 390, 520, 44, data.pool || "Reviewed Shared Pool", { size: 25, color: C.accent, bold: true, align: "center", fit: "shrink" });
      ui.footer(slide);
    };
  }
};
