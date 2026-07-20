module.exports = {
  name: "automationSafetyValidationBand",
  create({ ui, theme }) {
    return function automationSafetyValidationBand(slide, data = {}) {
      const C = theme.colors;
      const states = (data.states || ["Attempt", "Guard", "Review", "Outcome"]).slice(0, 4);
      const top = ui.header(slide, data.title || "Controlled Validation", data.subtitle || "Automation stops before production approval") || 220;
      states.forEach((state, index) => {
        const x = 150 + index * 390;
        ui.rect(slide, x, top + 160, 280, 120, { fill: C.surface, line: index === 1 ? C.accent : C.line, round: true });
        ui.addText(slide, x + 20, top + 198, 240, 42, state, { size: 20, color: index === 1 ? C.accent : C.primary, bold: true, align: "center", fit: "shrink" });
        if (index < states.length - 1) ui.line(slide, x + 280, top + 220, x + 390, top + 220, { color: C.line, width: 1.4, arrow: "triangle" });
      });
      ui.footer(slide);
    };
  }
};
