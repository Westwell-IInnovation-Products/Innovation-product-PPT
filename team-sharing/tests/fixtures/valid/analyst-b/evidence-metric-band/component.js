module.exports = {
  name: "evidenceMetricBand",
  create({ ui, theme }) {
    return function evidenceMetricBand(slide, data = {}) {
      const C = theme.colors;
      const metrics = (data.metrics || [
        { value: "24", label: "Reviewed" },
        { value: "18", label: "Reusable" },
        { value: "2", label: "Rolled Back" }
      ]).slice(0, 4);
      const x0 = data.x || 220;
      const y = data.y || 340;
      const gap = 28;
      const width = (1480 - gap * (metrics.length - 1)) / metrics.length;
      metrics.forEach((metric, index) => {
        const x = x0 + index * (width + gap);
        ui.rect(slide, x, y, width, 190, { fill: C.surface, line: C.line, round: true });
        ui.addText(slide, x + 20, y + 42, width - 40, 52, metric.value, { size: 34, color: index === 0 ? C.accent : C.primary, bold: true, align: "center", fit: "shrink" });
        ui.addText(slide, x + 20, y + 112, width - 40, 34, metric.label, { size: 16, color: C.mute, align: "center", fit: "shrink" });
      });
    };
  }
};
