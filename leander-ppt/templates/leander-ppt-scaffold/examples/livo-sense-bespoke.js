// EXAMPLE — project-specific custom graphics (NOT part of the generic core).
// These were built for the Livo Sense (雷视一体 / port domain) deck. They are kept as a worked
// reference for "how to build a page-specific bespoke graphic": copy a function into your deck's
// own components and adapt, rather than bloating the shared scaffold with domain shapes.
//   - fusionVenn:   two-sensor overlap (LiDAR/camera glyphs) → fused core. Domain: sensor fusion.
//   - sceneGlyph:   port line-icons (quay crane / jet bridge / AV / camera pole). Domain: ports.
//   - resourceBoard: GitHub repo card + media tiles. Domain: open-source project pages.
// Usage: const ex = makeLivoBespoke({ ui, theme, pptx }); ex.fusionVenn(slide, {...});
const { icon } = require("../components/icons");

function makeLivoBespoke({ ui, theme, pptx }) {
  const C = theme.colors, F = theme.fonts, T = theme.type, U = ui.U;
  const S = pptx.ShapeType;
  const X = 96, W = 1728;
  const cjk = s => /[一-鿿]/.test(String(s || "")) ? F.cn : F.en;
  const circle = (slide, cx, cy, r, fill, lineC, lw) => slide.addShape(S.ellipse, {
    x: U(cx - r), y: U(cy - r), w: U(2 * r), h: U(2 * r),
    fill: fill ? { color: fill } : { type: "none" },
    line: lineC ? { color: lineC, width: lw || 2 } : { type: "none" }
  });
  const leadRuns = runs => (Array.isArray(runs) ? runs : [{ text: String(runs || "") }])
    .map(r => ({ text: r.text, options: { color: r.hot ? C.accent : C.text, bold: !!r.hot } }));

  // 融合双环大图：两传感器交叠 → 红色融合核（域：雷视融合）
  function fusionVenn(slide, data) {
    ui.header(slide, data.title, data.subtitle);
    const cyC = 552, r = 244, lcx = 760, rcx = 1160, midx = (lcx + rcx) / 2;
    const L = data.left || {}, R = data.right || {}, core = data.core || {};
    circle(slide, lcx, cyC, r, null, C.primary, 2.6);
    circle(slide, rcx, cyC, r, null, C.blue, 2.6);
    const lidarGlyph = (gx, gy, ink) => {
      slide.addShape(S.ellipse, { x: U(gx - 24), y: U(gy - 24), w: U(48), h: U(15), fill: { type: "none" }, line: { color: ink, width: 2.4 } });
      ui.line(slide, gx - 24, gy - 17, gx - 24, gy + 10, { color: ink, width: 2.4 });
      ui.line(slide, gx + 24, gy - 17, gx + 24, gy + 10, { color: ink, width: 2.4 });
      slide.addShape(S.ellipse, { x: U(gx - 24), y: U(gy + 3), w: U(48), h: U(15), fill: { type: "none" }, line: { color: ink, width: 2.4 } });
      ui.line(slide, gx - 14, gy - 4, gx + 14, gy - 4, { color: ink, width: 1.4 });
      ui.line(slide, gx + 28, gy - 8, gx + 52, gy - 14, { color: ink, width: 1.4, dash: "sysDash" });
      ui.line(slide, gx + 28, gy - 1, gx + 54, gy - 1, { color: ink, width: 1.4, dash: "sysDash" });
    };
    const camGlyph = (gx, gy, ink) => {
      slide.addShape(S.roundRect, { x: U(gx - 28), y: U(gy - 16), w: U(56), h: U(36), fill: { type: "none" }, line: { color: ink, width: 2.4 }, rectRadius: U(5) });
      slide.addShape(S.ellipse, { x: U(gx - 10), y: U(gy - 8), w: U(22), h: U(22), fill: { type: "none" }, line: { color: ink, width: 2.4 } });
      slide.addShape(S.ellipse, { x: U(gx - 3), y: U(gy - 1), w: U(8), h: U(8), fill: { color: ink }, line: { type: "none" } });
      ui.rect(slide, gx - 22, gy - 24, 18, 9, { line: ink, lineWidth: 2.4 });
    };
    const side = (ctx, d, ink, glyph) => {
      const tx = ctx - 150, tw = 300;
      if (glyph) glyph(ctx, cyC - 150, ink);
      ui.addText(slide, tx, cyC - 100, tw, 50, d.name || "", { size: T.h2, color: ink, bold: true, align: "center", fontFace: cjk(d.name) });
      ui.addText(slide, tx, cyC - 52, tw, 30, d.tag || "", { size: T.cap, color: C.mute, align: "center", fontFace: cjk(d.tag) });
      ui.addText(slide, tx, cyC - 8, tw, 38, d.gap || "", { size: T.bodySm, color: ink, align: "center", lineSpacingMultiple: 1.15, fontFace: cjk(d.gap) });
      if (d.cue) ui.addText(slide, tx, cyC + 54, tw, 28, d.cue, { size: T.micro, color: C.mute, align: "center", fontFace: cjk(d.cue) });
    };
    side(lcx - 64, L, C.primary, lidarGlyph);
    side(rcx + 64, R, C.blue, camGlyph);
    circle(slide, midx, cyC, 90, C.accent, "FFFFFF", 3);
    ui.addText(slide, midx - 90, cyC - 36, 180, 40, core.name || "雷视融合", { size: T.h3, color: "FFFFFF", bold: true, align: "center", fontFace: cjk(core.name) });
    ui.addText(slide, midx - 90, cyC + 8, 180, 26, core.sub || "标定 + 同步", { size: T.micro, color: "FFE9E9", align: "center", fontFace: cjk(core.sub) });
    slide.addText(leadRuns(data.lead), { x: U(X), y: U(884), w: U(W), h: U(50), align: "center", valign: "middle", fontFace: F.cn, fontSize: ui.PT(T.lead), margin: 0, fit: "shrink", lineSpacingMultiple: 1.1 });
    ui.footer(slide);
  }

  // 港口场景线稿（域：港口）。type: quay / bridge / vehicle / monitor。
  function sceneGlyph(slide, type, cx, cy, ink, s) {
    s = s || 1;
    const ln = (x1, y1, x2, y2, o = {}) => ui.line(slide, cx + x1 * s, cy + y1 * s, cx + x2 * s, cy + y2 * s, { color: ink, width: o.w || 2.2, dash: o.d, arrow: o.a });
    const el = (x, y, w, h) => slide.addShape(S.ellipse, { x: U(cx + x * s), y: U(cy + y * s), w: U(w * s), h: U(h * s), fill: { type: "none" }, line: { color: ink, width: 2.2 } });
    const rr = (x, y, w, h, r) => slide.addShape(S.roundRect, { x: U(cx + x * s), y: U(cy + y * s), w: U(w * s), h: U(h * s), fill: { type: "none" }, line: { color: ink, width: 2.2 }, rectRadius: U((r || 6) * s) });
    const dot = (x, y, r) => slide.addShape(S.ellipse, { x: U(cx + (x - r) * s), y: U(cy + (y - r) * s), w: U(2 * r * s), h: U(2 * r * s), fill: { color: ink }, line: { type: "none" } });
    if (type === "quay") {
      ln(-100, 48, 100, 48); ln(-66, 48, -66, -54); ln(-66, -54, 78, -54); ln(46, -54, 46, -10);
      slide.addShape(S.trapezoid, { x: U(cx - 56 * s), y: U(cy + 8 * s), w: U(132 * s), h: U(38 * s), fill: { type: "none" }, line: { color: ink, width: 2.2 }, flipV: true });
      ln(46, -8, 4, 10, { d: "sysDash", w: 1.5 }); ln(46, -8, 70, 10, { d: "sysDash", w: 1.5 });
    } else if (type === "bridge") {
      el(-108, -16, 118, 34); ln(-96, -16, -114, -38); ln(-58, 2, -30, 30); ln(-58, 2, -88, 30); el(-20, -10, 16, 22);
      rr(40, -8, 70, 30, 4); ln(74, 22, 74, 48); ln(100, 22, 100, 48); ln(16, 7, 40, 7, { a: "triangle" });
    } else if (type === "vehicle") {
      rr(-80, -8, 160, 48, 12); el(-56, 30, 34, 34); el(22, 30, 34, 34); rr(-16, -36, 32, 30, 4);
      ln(0, -36, -52, -66, { d: "sysDash", w: 1.5 }); ln(0, -36, 0, -70, { d: "sysDash", w: 1.5 }); ln(0, -36, 52, -66, { d: "sysDash", w: 1.5 });
    } else {
      ln(-68, 56, -68, -48); rr(-82, -60, 46, 28, 4); rr(-8, 8, 108, 54, 6);
      dot(48, 36, 9); dot(78, 42, 6); ln(-36, -48, 2, 14, { d: "sysDash", w: 1.5 }); ln(-36, -48, 44, 30, { d: "sysDash", w: 1.5 });
    }
  }

  // 资源板：repo 卡 + 媒体贴片（域：开源项目资源）
  function resourceBoard(slide, data) {
    ui.header(slide, data.title, data.subtitle);
    const repo = data.repo || {}, tiles = (data.tiles || []).slice(0, 3);
    const lx = 96, ly = 250, lw = 820, lh = 542;
    ui.rect(slide, lx, ly, lw, lh, { line: C.primary, lineWidth: 1.4, round: true });
    ui.rect(slide, lx, ly, lw, 60, { fill: C.primary, round: true });
    ui.addText(slide, lx + 24, ly + 12, lw - 200, 36, repo.head || "GitHub · 开源仓库", { size: T.h3, color: "FFFFFF", bold: true, valign: "middle", fontFace: cjk(repo.head) });
    ui.addText(slide, lx + lw - 200, ly + 12, 176, 36, repo.star || "", { size: T.h3, color: "FFFFFF", bold: true, align: "right", valign: "middle", fontFace: F.en });
    ui.addText(slide, lx + 28, ly + 86, lw - 56, 42, repo.path || "", { size: T.h2, color: C.primary, bold: true, fontFace: F.en });
    ui.addText(slide, lx + 28, ly + 142, lw - 56, 58, repo.desc || "", { size: T.body, color: C.text, lineSpacingMultiple: 1.25, fontFace: cjk(repo.desc) });
    (repo.rows || []).slice(0, 4).forEach((r, j) => { const ry = ly + 226 + j * 64; ui.line(slide, lx + 28, ry, lx + lw - 28, ry, { color: C.line, width: 1 }); ui.addText(slide, lx + 34, ry + 10, 72, 44, r.k || "·", { size: T.bodyLg, color: C.accent, bold: true, valign: "middle", fontFace: F.en }); ui.addText(slide, lx + 118, ry + 10, lw - 152, 44, r.v, { size: T.bodySm, color: C.text, valign: "middle", lineSpacingMultiple: 1.1, fontFace: cjk(r.v) }); });
    const rx = 964, rw = 860, th = 170, tg = 26;
    tiles.forEach((t, i) => {
      const ty = 250 + i * (th + tg), ink = t.focus ? C.accent : C.primary;
      if (t.focus) ui.rect(slide, rx, ty, rw, th, { fill: C.accentSoft });
      ui.rect(slide, rx, ty, rw, th, { line: ink, lineWidth: 1.4, round: true }); ui.rect(slide, rx, ty, 6, th, { fill: ink });
      circle(slide, rx + 60, ty + th / 2, 34, t.focus ? C.accentSoft : C.surface2, ink, 1.6); icon(pptx, slide, U, rx + 60, ty + th / 2, t.icon || "document", { color: ink, soft: t.focus ? C.accentSoft : C.surface2 });
      ui.addText(slide, rx + 116, ty + 32, rw - 240, 36, t.t, { size: T.h3, color: ink, bold: true, fontFace: cjk(t.t) });
      ui.addText(slide, rx + 116, ty + 82, rw - 150, 60, t.b, { size: T.body, color: C.text, lineSpacingMultiple: 1.2, fontFace: cjk(t.b) });
      if (t.mark) ui.addText(slide, rx + rw - 130, ty + 30, 106, 30, t.mark, { size: T.cap, color: ink, bold: true, align: "right", fontFace: cjk(t.mark) });
    });
    if (data.note) ui.addText(slide, 96, 822, W, 36, data.note, { size: T.tiny, color: C.mute, fontFace: cjk(data.note) });
    ui.footer(slide);
  }

  return { fusionVenn, sceneGlyph, resourceBoard, circle };
}

module.exports = { makeLivoBespoke };
