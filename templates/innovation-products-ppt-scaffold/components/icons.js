// Icon renderer.
// Two styles, chosen per-theme via setIconStyle():
//   - "soft" : two-tone icons (soft fill + colored outline).
//   - "line" : thin-line, single-color, stroke-only icons (Global).
// Uniform sizing: every icon is normalized to a target box (opts.size, default 52px)
//   so that icons never overflow the container a component places them in. Each icon
//   declares its NATIVE box; all offsets/sizes/fonts are scaled by S = size / NATIVE.
//   Callers may pass opts.size to fit a specific badge; otherwise the default fits the
//   common ~56px badge with margin. This is what stops large icons (e.g. hub ~100px)
//   from spilling out of small circles.
let LINE_MODE = false;
function setIconStyle(theme) {
  const s = theme && theme.signature && theme.signature.icon && theme.signature.icon.style;
  LINE_MODE = s === "line";
}

// Native bounding box (px) each icon is drawn at, before normalization.
const NATIVE = {
  document: 52, person: 60, hub: 100, chart: 68, arrow: 60, shield: 46, clock: 50,
  gear: 60, cloud: 52, target: 44, lock: 46, leaf: 48, layers: 44, gauge: 48
};

function icon(pptx, slide, U, cx, cy, type, opts = {}) {
  const lineMode = opts.style ? opts.style === "line" : LINE_MODE;
  const c = opts.color || "07195A";
  const soft = opts.soft || "F3F6FA";
  const box = opts.size || 52;
  const S = box / (NATIVE[type] || 48);            // normalize every icon to `box` px
  const line = { color: c, width: opts.width || (lineMode ? 1.6 : 1.4) };
  const none = { type: "none" };
  const fill = lineMode ? none : { color: soft };  // soft fills collapse to none in line mode
  const solidFill = (x) => (lineMode ? none : x);  // c-colored solid accents collapse too
  const shape = pptx.ShapeType;
  // helpers: take offsets/sizes in NATIVE px relative to (cx,cy); scale by S.
  const circ = (dx, dy, r, f = fill, l = line) =>
    slide.addShape(shape.ellipse, { x: U(cx + dx * S - r * S), y: U(cy + dy * S - r * S), w: U(2 * r * S), h: U(2 * r * S), fill: lineMode ? none : f, line: l });
  const ln = (x1, y1, x2, y2, endArrowType) => {
    const X1 = cx + x1 * S, Y1 = cy + y1 * S, X2 = cx + x2 * S, Y2 = cy + y2 * S;
    slide.addShape(shape.line, {
      x: U(Math.min(X1, X2)), y: U(Math.min(Y1, Y2)),
      w: U(Math.abs(X2 - X1) || 0.01), h: U(Math.abs(Y2 - Y1) || 0.01),
      line: { ...line, endArrowType }, flipH: X2 < X1, flipV: Y2 < Y1
    });
  };
  const rrect = (x, y, w, h, f, l, rad) =>
    slide.addShape(shape.roundRect, { x: U(cx + x * S), y: U(cy + y * S), w: U(w * S), h: U(h * S), fill: f, line: l, rectRadius: U((rad || 0) * S) });
  const rct = (x, y, w, h, f, l) =>
    slide.addShape(shape.rect, { x: U(cx + x * S), y: U(cy + y * S), w: U(w * S), h: U(h * S), fill: f, line: l });
  const txt = (str, x, y, w, h, fs) =>
    slide.addText(str, { x: U(cx + x * S), y: U(cy + y * S), w: U(w * S), h: U(h * S), fontFace: "Century Gothic", fontSize: fs * S, color: c, bold: true, align: "center", valign: "mid", margin: 0 });

  if (type === "document") {
    rrect(-22, -26, 44, 52, fill, line, 5);
    ln(-12, -7, 12, -7); ln(-12, 6, 12, 6);
  } else if (type === "person") {
    circ(0, -14, 11);
    rrect(-23, 2, 46, 28, fill, line, 13);
  } else if (type === "hub") {
    circ(0, 0, 16, { color: c }, none);
    [[-42, -32], [42, -32], [-42, 32], [42, 32]].forEach(([dx, dy]) => { ln(0, 0, dx, dy); circ(dx, dy, 8); });
  } else if (type === "chart") {
    [18, 32, 46].forEach((h, i) => rct(-26 + i * 20, 24 - h, 12, h, solidFill({ color: i === 2 ? c : soft }), line));
    ln(-34, 24, 34, 24);
  } else if (type === "arrow") {
    ln(-30, 20, 24, -22, "triangle"); ln(-30, 20, 30, 20);
  } else if (type === "shield") {
    rrect(-23, -23, 46, 46, fill, line, 10);
    txt("OK", -18, -11, 36, 22, 10);
  } else if (type === "clock") {
    circ(0, 0, 25); ln(0, 0, 0, -14); ln(0, 0, 13, 8);
  } else if (type === "gear") {
    circ(0, 0, 21, none, line); circ(0, 0, 8, { color: c }, none);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ln(Math.cos(a) * 21, Math.sin(a) * 21, Math.cos(a) * 30, Math.sin(a) * 30); }
  } else if (type === "cloud") {
    rrect(-26, -2, 52, 22, fill, line, 11);
    circ(-12, -4, 12); circ(11, -4, 13);
  } else if (type === "target") {
    circ(0, 0, 22, none, line); circ(0, 0, 13, none, line); circ(0, 0, 5, { color: c }, none);
  } else if (type === "lock") {
    circ(0, -6, 12, none, line);
    rrect(-18, -2, 36, 30, solidFill({ color: c }), lineMode ? line : none, 5);
    circ(0, 11, 3, lineMode ? none : { color: soft }, lineMode ? line : none);
  } else if (type === "leaf") {
    slide.addShape(shape.ellipse, { x: U(cx - 14 * S), y: U(cy - 20 * S), w: U(28 * S), h: U(40 * S), fill, line, rotate: 45 });
    ln(-9, 11, 8, -11);
  } else if (type === "layers") {
    [13, 0, -13].forEach((dy, i) => rrect(-22, dy - 6, 44, 13, i === 1 ? solidFill({ color: c }) : fill, line, 3));
  } else if (type === "gauge") {
    circ(0, 0, 22, none, line); ln(0, 0, 12, -12, "triangle"); circ(0, 0, 4, { color: c }, none);
  } else {
    circ(0, 0, 24);
    txt("i", -18, -16, 36, 32, 20);
  }
}

module.exports = { icon, setIconStyle };
