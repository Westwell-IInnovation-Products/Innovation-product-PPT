module.exports = {
  name: "evidenceLegend",
  create({ ui, theme, pptx }) {
    const C = theme.colors;
    const color = token => {
      const semanticFallbacks = {
        teal: C.teal || C.blue || C.primary,
        accent: C.accent,
        warn: C.warn || C.danger || C.mute,
        green: C.green || C.teal || C.primary,
        danger: C.danger || C.warn || C.accent,
      };
      const candidate = semanticFallbacks[token] || C[token] || token || C.accent;
      return /^[0-9a-f]{6}$/i.test(String(candidate)) ? candidate : C.accent;
    };
    return function evidenceLegend(slide, data = {}) {
      const x = Number(data.x ?? 300), y = Number(data.y ?? 360), w = Number(data.w ?? 1320), h = Number(data.h ?? 230);
      const items = (data.items || [
        { label: "Source", meaning: "Directly traceable evidence", colorToken: "teal" },
        { label: "Derived", meaning: "Interpretation from the source", colorToken: "accent" },
        { label: "Boundary", meaning: "Assumption or unverified edge", colorToken: "warn" }
      ]).slice(0, 5);
      const horizontal = data.orientation !== "vertical" && w >= h * 2;
      ui.rect(slide, x, y, w, h, { fill: C.surface, line: C.line, round: true });
      if (data.title) ui.addText(slide, x + 28, y + 20, w - 56, 28, data.title, { size: 17, color: C.primary, bold: true });
      const top = y + (data.title ? 66 : 28);
      if (horizontal) {
        const gap = 18, cellW = (w - 56 - gap * (items.length - 1)) / Math.max(items.length, 1);
        items.forEach((item, index) => {
          const cx = x + 28 + index * (cellW + gap), marker = color(item.colorToken);
          slide.addShape(pptx.ShapeType.ellipse, { x: ui.U(cx), y: ui.U(top + 8), w: ui.U(20), h: ui.U(20), fill: { color: marker }, line: { color: marker } });
          ui.addText(slide, cx + 32, top, cellW - 36, 26, item.label, { size: 15, color: C.primary, bold: true, fit: "shrink" });
          ui.addText(slide, cx + 32, top + 36, cellW - 36, h - (top - y) - 54, item.meaning, { size: 12.5, color: C.mute, fit: "shrink" });
        });
      } else {
        const rowH = (h - (top - y) - 24) / Math.max(items.length, 1);
        items.forEach((item, index) => {
          const cy = top + index * rowH, marker = color(item.colorToken);
          slide.addShape(pptx.ShapeType.ellipse, { x: ui.U(x + 28), y: ui.U(cy + 8), w: ui.U(18), h: ui.U(18), fill: { color: marker }, line: { color: marker } });
          ui.addText(slide, x + 60, cy, 180, 26, item.label, { size: 14, color: C.primary, bold: true, fit: "shrink" });
          ui.addText(slide, x + 250, cy, w - 278, 30, item.meaning, { size: 12.5, color: C.mute, fit: "shrink" });
        });
      }
      if (data.sourceNote) ui.addText(slide, x + 28, y + h - 28, w - 56, 18, data.sourceNote, { size: 10.5, color: C.faint, fit: "shrink" });
    };
  }
};
