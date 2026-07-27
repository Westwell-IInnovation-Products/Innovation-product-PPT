module.exports = {
  name: "statusLegend",
  create({ ui, theme, pptx }) {
    const C = theme.colors;
    const tokens = { complete: C.green || C.accent, current: C.accent, partial: C.warn || C.accent, blocked: C.danger || C.accent, planned: C.mute, unknown: C.faint || C.mute };
    return function statusLegend(slide, data = {}) {
      const x = Number(data.x ?? 360), y = Number(data.y ?? 360), w = Number(data.w ?? 1200), h = Number(data.h ?? 230);
      const statuses = (data.statuses || [
        { label: "Complete", meaning: "Evidence is available", stateToken: "complete" },
        { label: "Current", meaning: "Active focus or state", stateToken: "current" },
        { label: "Partial", meaning: "Some evidence is missing", stateToken: "partial" },
        { label: "Planned", meaning: "Not yet implemented", stateToken: "planned" }
      ]).slice(0, 6);
      ui.rect(slide, x, y, w, h, { fill: C.surface, line: C.line, round: true });
      const gap = 16, cellW = (w - 56 - gap * (statuses.length - 1)) / Math.max(statuses.length, 1);
      statuses.forEach((status, index) => {
        const cx = x + 28 + index * (cellW + gap), token = tokens[status.stateToken] || C.faint;
        ui.rect(slide, cx, y + 40, cellW, 52, { fill: C.surface2, line: token, lineWidth: status.stateToken === "current" ? 1.8 : 1, round: true });
        slide.addShape(pptx.ShapeType.ellipse, { x: ui.U(cx + 16), y: ui.U(y + 56), w: ui.U(18), h: ui.U(18), fill: { color: token }, line: { color: token } });
        ui.addText(slide, cx + 46, y + 51, cellW - 58, 24, status.label, { size: 14, color: status.stateToken === "current" ? C.accent : C.primary, bold: true, fit: "shrink" });
        ui.addText(slide, cx + 8, y + 116, cellW - 16, 54, status.meaning, { size: 12, color: C.mute, align: "center", fit: "shrink" });
      });
    };
  }
};
