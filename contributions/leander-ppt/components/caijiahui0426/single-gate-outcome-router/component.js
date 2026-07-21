module.exports = {
  name: "singleGateOutcomeRouter",
  create({ ui, theme }) {
    return function singleGateOutcomeRouter(slide, data = {}) {
      const C = theme.colors;
      const inputs = (data.inputs || ["Evidence A", "Evidence B", "Evidence C"]).slice(0, 4);
      const outcomes = (data.outcomes || [
        { label: "Direct route", detail: "Continue through the standard path" },
        { label: "Review route", detail: "Pause for a focused decision" },
        { label: "Blocked route", detail: "Stop before the protected action" }
      ]).slice(0, 3);
      const top = ui.header(
        slide,
        data.title || "Route one input set through a single decision gate",
        data.subtitle || "One decision point produces mutually exclusive outcomes"
      ) || 220;

      const inputX = 120;
      const inputW = 350;
      inputs.forEach((label, index) => {
        const y = top + 38 + index * 104;
        ui.rect(slide, inputX, y, inputW, 76, { fill: C.surface, line: C.line, round: true });
        ui.addText(slide, inputX + 22, y + 19, inputW - 44, 34, label, {
          size: 16,
          color: C.primary,
          bold: true,
          fit: "shrink"
        });
      });

      const gateX = 675;
      const gateY = top + 170;
      ui.rect(slide, gateX, gateY, 270, 136, { fill: C.accentSoft, line: C.accent, round: true });
      ui.addText(slide, gateX + 28, gateY + 31, 214, 30, data.gateLabel || "Single decision gate", {
        size: 19,
        color: C.accent,
        bold: true,
        align: "center",
        fit: "shrink"
      });
      ui.addText(slide, gateX + 28, gateY + 76, 214, 24, data.gateDetail || "Evaluate once, then route", {
        size: 13,
        color: C.primary,
        align: "center",
        fit: "shrink"
      });

      const outcomeX = 1130;
      const outcomeW = 380;
      outcomes.forEach((outcome, index) => {
        const y = top + 28 + index * 152;
        const isBlocked = index === 2;
        ui.line(slide, gateX + 270, gateY + 68, outcomeX, y + 54, {
          color: isBlocked ? C.accent : C.line,
          width: isBlocked ? 2 : 1.2,
          arrow: "triangle"
        });
        ui.rect(slide, outcomeX, y, outcomeW, 108, {
          fill: isBlocked ? C.accentSoft : C.surface,
          line: isBlocked ? C.accent : C.line,
          round: true
        });
        ui.addText(slide, outcomeX + 24, y + 18, outcomeW - 48, 29, outcome.label, {
          size: 18,
          color: isBlocked ? C.accent : C.primary,
          bold: true,
          fit: "shrink"
        });
        ui.addText(slide, outcomeX + 24, y + 58, outcomeW - 48, 27, outcome.detail, {
          size: 13,
          color: C.text || C.primary,
          fit: "shrink"
        });
      });

      ui.addText(
        slide,
        120,
        top + 500,
        1390,
        34,
        data.boundaryNote || "Each item follows one outcome only; the protected action stays outside this component.",
        { size: 14, color: C.muted || C.primary, align: "center", fit: "shrink" }
      );
      ui.footer(slide);
    };
  }
};
