module.exports = {
  name: "stageGateRail",
  create({ ui, theme, pptx }) {
    const C = theme.colors;
    return function stageGateRail(slide, data = {}) {
      const x = Number(data.x ?? 180), y = Number(data.y ?? 350), w = Number(data.w ?? 1560), h = Number(data.h ?? 340);
      const stages = (data.stages || [
        { label: "Discover", gate: "G1", status: "complete", deliverable: "Validated intent" },
        { label: "Design", gate: "G2", status: "current", deliverable: "Approved blueprint" },
        { label: "Build", gate: "G3", status: "upcoming", deliverable: "Editable output" },
        { label: "Review", gate: "G4", status: "upcoming", deliverable: "QA evidence" }
      ]).slice(0, 6);
      const statusColor = status => status === "complete" ? (C.green || C.accent) : status === "current" ? C.accent : status === "blocked" ? (C.danger || C.accent) : C.line;
      ui.rect(slide, x, y, w, h, { fill: C.surface, line: C.line, round: true });
      const railY = y + 145, left = x + 92, right = x + w - 92;
      ui.line(slide, left, railY, right, railY, { color: C.line, width: 2 });
      const step = stages.length > 1 ? (right - left) / (stages.length - 1) : 0;
      stages.forEach((stage, index) => {
        const cx = left + index * step, hot = stage.status === "current" || data.currentStage === index;
        const nodeColor = hot ? C.accent : statusColor(stage.status);
        if (index > 0 && stages[index - 1].status === "complete") ui.line(slide, left + (index - 1) * step, railY, cx, railY, { color: C.green || C.accent, width: 3 });
        slide.addShape(pptx.ShapeType.ellipse, { x: ui.U(cx - 25), y: ui.U(railY - 25), w: ui.U(50), h: ui.U(50), fill: { color: hot ? C.accentSoft : C.surface }, line: { color: nodeColor, width: hot ? 2.5 : 1.6 } });
        ui.addText(slide, cx - 25, railY - 9, 50, 20, String(index + 1).padStart(2, "0"), { size: 11, color: nodeColor, bold: true, align: "center", fontFace: theme.fonts.en });
        ui.addText(slide, cx - Math.min(115, step / 2 - 8), y + 48, Math.min(230, Math.max(120, step - 16)), 34, stage.label, { size: 17, color: hot ? C.accent : C.primary, bold: true, align: "center", fit: "shrink" });
        ui.rect(slide, cx - 38, railY + 42, 76, 30, { fill: hot ? C.accentSoft : C.surface2, line: nodeColor, round: true });
        ui.addText(slide, cx - 34, railY + 50, 68, 14, stage.gate || `G${index + 1}`, { size: 10.5, color: nodeColor, bold: true, align: "center", fontFace: theme.fonts.en, fit: "shrink" });
        ui.addText(slide, cx - Math.min(120, step / 2 - 8), railY + 94, Math.min(240, Math.max(130, step - 16)), 48, stage.deliverable || "", { size: 12, color: C.mute, align: "center", fit: "shrink" });
      });
    };
  }
};
