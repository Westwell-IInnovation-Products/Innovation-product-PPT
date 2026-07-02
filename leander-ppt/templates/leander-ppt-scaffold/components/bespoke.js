// 定制大图形组件库（leander-ppt 扩展 · "灵动感"）—— 通用核。
// 目标：少用"方框+文字"，多用大块、留白、细线条的图形化表达，每页一套不同的视觉隐喻。
// 通用组件：hubRadial(中心辐射) · tierLadder(梯队阶梯) · goalPath(双阶段路径) ·
//           pipelineFlow(流水线) · actionTracks(行动轨道) · sceneColumns(图片/插画分栏)。
// 字号统一取 theme.type；配色=语义（同级一色，单点 accent 焦点）。
// 项目/领域专属的定制图（fusionVenn 传感器双环 / sceneGlyph 港口线稿 / resourceBoard GitHub 卡）
// 已移到 examples/livo-sense-bespoke.js —— 作为"如何写页面专属图形"的范例，需要时复制改用，不进通用核。
const { icon } = require("./icons");
const fs = require("fs");

function makeBespoke({ ui, theme, pptx }) {
  const C = theme.colors, F = theme.fonts, T = theme.type, U = ui.U;
  const S = pptx.ShapeType;
  const X = 96, W = 1728;
  const cjk = s => /[一-鿿]/.test(String(s || "")) ? F.cn : F.en;
  const circle = (slide, cx, cy, r, fill, lineC, lw) => slide.addShape(S.ellipse, {
    x: U(cx - r), y: U(cy - r), w: U(2 * r), h: U(2 * r),
    fill: fill ? { color: fill } : { type: "none" },
    line: lineC ? { color: lineC, width: lw || 2 } : { type: "none" }
  });
  // ===== 中心辐射价值图（hubRadial）——中心机制 + 四向价值卡 =====
  // data:{title,subtitle, center:{name,sub}, spokes:[{t,b,focus?}] (4)}
  function hubRadial(slide, data) {
    ui.header(slide, data.title, data.subtitle);
    const spokes = (data.spokes || []).slice(0, 4);
    const icons = data.icons || ["target", "gauge", "gear", "shield"];
    const cw = 432, ch = 182, topY = 312, botY = 624;          // 加大卡片、上下铺满正文
    const cx = 960, cy = (topY + botY + ch) / 2, R = 152;       // 中心与四卡整体居中
    const pos = [
      { x: X, y: topY }, { x: X + W - cw, y: topY },
      { x: X, y: botY }, { x: X + W - cw, y: botY }
    ];
    // 连接线（中心圆边缘 → 各卡内侧中点，避免穿过文字）
    spokes.forEach((s, i) => {
      const p = pos[i], rightCard = p.x > cx;
      const tx = rightCard ? p.x : p.x + cw, ty = p.y + ch / 2;
      const sx = cx + (rightCard ? R : -R) * 0.62, sy = cy + (p.y < cy ? -R : R) * 0.62;
      ui.line(slide, sx, sy, tx, ty, { color: C.line, width: 1.4 });
    });
    // 中心机制圆（填充藏蓝 + 浅色光环）——填充与线框混搭
    circle(slide, cx, cy, R + 16, C.surface, C.line, 1.2);
    circle(slide, cx, cy, R, C.primary, null);
    ui.addText(slide, cx - R, cy - 42, 2 * R, 46, (data.center || {}).name || "融合价值", { size: T.h2, color: "FFFFFF", bold: true, align: "center", fontFace: cjk((data.center || {}).name) });
    ui.addText(slide, cx - R + 12, cy + 10, 2 * R - 24, 56, (data.center || {}).sub || "", { size: T.micro, color: "DDE5FF", align: "center", lineSpacingMultiple: 1.2, fontFace: cjk((data.center || {}).sub) });
    // 四向价值卡（线框 + 图标徽章，单点焦点描红）
    spokes.forEach((s, i) => {
      const p = pos[i], foc = s.focus, ink = foc ? C.accent : C.primary;
      if (foc) ui.rect(slide, p.x, p.y, cw, ch, { fill: C.accentSoft });
      ui.rect(slide, p.x, p.y, cw, ch, { line: ink, lineWidth: foc ? 1.8 : 1.3, round: true });
      ui.rect(slide, p.x, p.y, cw, 6, { fill: ink });
      circle(slide, p.x + 50, p.y + 46, 28, foc ? C.accentSoft : C.surface, ink, 1.5);
      icon(pptx, slide, U, p.x + 50, p.y + 46, icons[i], { color: ink, soft: foc ? C.accentSoft : C.surface });
      ui.addText(slide, p.x + 94, p.y + 28, cw - 118, 36, s.t, { size: T.h3, color: ink, bold: true, fontFace: cjk(s.t) });
      ui.addText(slide, p.x + 24, p.y + 90, cw - 48, ch - 108, s.b, { size: T.bodySm, color: C.text, lineSpacingMultiple: 1.24, fontFace: cjk(s.b) });
    });
    ui.footer(slide);
  }

  // ===== 3) 梯队阶梯图（tierLadder）——一/二梯队，厂商 + 参数 chip，非表格 =====
  // data:{title,subtitle, tiers:[{no,name,sub,focus?,vendors:[{name,specs:[]}]}], dims?, note?}
  function tierLadder(slide, data) {
    const cTop = ui.header(slide, data.title, data.subtitle) || 214;
    const tiers = (data.tiers || []).slice(0, 2);
    const dimsH = data.dims ? 64 : 0, noteH = data.note ? 50 : 0;
    const availTop = cTop + 22, availBot = 940 - dimsH - noteH;
    const gap = 64, bandH = Math.min(212, (availBot - availTop - gap) / 2);   // 加大梯队间距，整体居中（独立复核建议）
    const blockH = tiers.length * bandH + (tiers.length - 1) * gap;
    let y = Math.round(availTop + ((availBot - availTop) - blockH) / 2);
    tiers.forEach((t, ti) => {
      const foc = t.focus, ink = foc ? C.accent : C.primary;
      const indent = ti * 60;                 // 阶梯缩进
      const bx = X + indent, bw = W - indent;
      if (foc) ui.rect(slide, bx, y, bw, bandH, { fill: C.accentSoft });
      ui.rect(slide, bx, y, bw, bandH, { line: ink, lineWidth: foc ? 1.8 : 1.3, round: true });
      ui.rect(slide, bx, y, 8, bandH, { fill: ink });
      // 左侧梯队标识：大号数字 +（小）梯队名 +（更小）注 —— 该大的大、该小的小
      ui.addText(slide, bx + 24, y + 14, 176, 100, String(t.no || ti + 1).padStart(2, "0"), { size: 92, color: ink, bold: true, fontFace: F.en });
      ui.addText(slide, bx + 28, y + bandH - 66, 210, 30, t.name, { size: T.h3, color: ink, bold: true, fontFace: cjk(t.name) });
      ui.addText(slide, bx + 28, y + bandH - 34, 210, 22, t.sub || "", { size: T.tiny, color: C.mute, fontFace: cjk(t.sub) });
      ui.line(slide, bx + 234, y + 22, bx + 234, y + bandH - 22, { color: C.line, width: 1.2 });
      // 右侧厂商：名称 + 内联指标（数值大、标签小，细线分隔；文字长进图里，不用浮动方框）
      const vx0 = bx + 260, vw0 = bw - 260 - 22, vs = (t.vendors || []).slice(0, 2);
      const vgap = 22, vw = (vw0 - (vs.length - 1) * vgap) / Math.max(1, vs.length);
      vs.forEach((v, vi) => {
        const vx = vx0 + vi * (vw + vgap);
        if (vi > 0) ui.line(slide, vx - vgap / 2, y + 22, vx - vgap / 2, y + bandH - 22, { color: C.line, width: 1.2 });
        ui.addText(slide, vx, y + 26, vw, 34, v.name, { size: T.h2, color: ink, bold: true, fontFace: cjk(v.name) });
        const st = (v.stats || []).slice(0, 4), sw = vw / Math.max(1, st.length);
        st.forEach((s, si) => {
          const sx = vx + si * sw;
          if (si > 0) ui.line(slide, sx, y + 82, sx, y + bandH - 26, { color: C.line, width: 0.8 });
          ui.addText(slide, sx + 6, y + 82, sw - 12, 44, s.v, { size: 30, color: ink, bold: true, lineSpacingMultiple: 1, fontFace: cjk(s.v) });
          ui.addText(slide, sx + 6, y + 130, sw - 12, 24, s.l, { size: T.micro, color: C.mute, fontFace: cjk(s.l) });
        });
      });
      y += bandH + gap;
    });
    if (data.dims) {
      const dy = availBot + 14;
      ui.addText(slide, X, dy, W, 30, "对比维度　" + data.dims.join("　·　"), { size: T.cap, color: C.primary, bold: true, fontFace: cjk(data.dims.join("")) });
    }
    if (data.note) ui.addText(slide, X, availBot + dimsH + 6, W, 36, data.note, { size: T.tiny, color: C.mute, fontFace: cjk(data.note) });
    ui.footer(slide);
  }

  // ===== 4) 双阶段路径（goalPath）——短期→长期，主轴 + 阶段标记 + 双面板 =====
  // data:{title,subtitle, short:{name,sub,head,items:[]}, long:{name,sub,head,items:[]}, banner?}
  function goalPath(slide, data) {
    ui.header(slide, data.title, data.subtitle);
    const sh = data.short || {}, lg = data.long || {}, axisY = 372;
    ui.line(slide, 300, axisY, 1620, axisY, { color: C.line, width: 4 });
    slide.addShape(S.rightArrow, { x: U(1612), y: U(axisY - 15), w: U(40), h: U(30), fill: { color: C.faint }, line: { type: "none" } });
    ui.addText(slide, 760, axisY - 46, 400, 28, "能力迁移", { size: T.cap, color: C.mute, align: "center", fontFace: F.cn });
    const marker = (cx, name, sub, fill, subc) => {
      circle(slide, cx, axisY, 86, fill, "FFFFFF", 3);
      ui.addText(slide, cx - 86, axisY - 34, 172, 38, name, { size: T.h3, color: "FFFFFF", bold: true, align: "center", fontFace: cjk(name) });
      ui.addText(slide, cx - 86, axisY + 8, 172, 26, sub, { size: T.micro, color: subc, align: "center", fontFace: cjk(sub) });
    };
    marker(560, sh.name || "短期", sh.sub || "2 个月", C.accent, "FFE9E9");
    marker(1360, lg.name || "长期", lg.sub || "业务落地", C.primary, "DDE5FF");
    const py = 512, ph = 300, pw = 520;
    // 面板 A（短期，焦点）
    ui.rect(slide, 300, py, pw, ph, { fill: C.accentSoft });
    ui.rect(slide, 300, py, pw, ph, { line: C.accent, lineWidth: 1.8, round: true });
    ui.line(slide, 560, axisY + 86, 560, py, { color: C.line, width: 1.2 });
    ui.addText(slide, 326, py + 22, pw - 52, 36, sh.head || "公司楼下真实空间验证", { size: T.h3, color: C.accent, bold: true, fontFace: cjk(sh.head) });
    (sh.items || []).slice(0, 4).forEach((it, j) => { const iy = py + 80 + j * 52; ui.rect(slide, 326, iy + 12, 16, 4, { fill: C.accent }); ui.addText(slide, 352, iy, pw - 80, 48, it, { size: T.body, color: C.text, lineSpacingMultiple: 1.1, fontFace: cjk(it) }); });
    // 面板 B（长期）：填充浅底 + 白色芯片（带边框），与左侧短期面板对称、对比清晰
    ui.rect(slide, 1100, py, pw, ph, { fill: C.surface3, round: true });
    ui.line(slide, 1360, axisY + 86, 1360, py, { color: C.line, width: 1.2 });
    ui.addText(slide, 1126, py + 20, pw - 52, 34, lg.head || "同一套能力迁移四场景", { size: T.h3, color: C.primary, bold: true, fontFace: cjk(lg.head) });
    const chips = (lg.items || []).slice(0, 4), chw = pw - 52, cg = 12, chTop = py + 74, chh = (ph - 74 - 16 - 3 * cg) / 4;
    chips.forEach((c, j) => { const cx = 1126, cy = chTop + j * (chh + cg); ui.rect(slide, cx, cy, chw, chh, { fill: C.surface, line: C.line, lineWidth: 1, round: true }); ui.rect(slide, cx, cy, 6, chh, { fill: C.primary }); ui.addText(slide, cx + 24, cy, chw - 44, chh, c, { size: T.bodySm, color: C.primary, bold: true, valign: "middle", lineSpacingMultiple: 1.0, fontFace: cjk(c) }); });
    if (data.banner) {
      const by = 858, tw = Math.min(W - 240, Math.round(String(data.banner).length * (T.lead * 1.05) + 80)), cx = X + W / 2;
      ui.rect(slide, cx - tw / 2 - 70, by + 22, 48, 4, { fill: C.accent }); ui.rect(slide, cx + tw / 2 + 22, by + 22, 48, 4, { fill: C.accent });
      ui.addText(slide, cx - tw / 2, by, tw, 48, data.banner, { size: T.lead, color: C.accent, bold: true, align: "center", fontFace: cjk(data.banner) });
    }
    ui.footer(slide);
  }

  // ===== 图片/插画分栏（sceneColumns）——竖线分栏 + 编号 + 图片槽位（仿 cactus c04）=====
  // data:{title,subtitle, items:[{t,tag,b,img?,icon?,req:[]}]}
  // 缺图回退：有 it.icon 用图标集；否则占位提示。领域插画（港口等）请用 image2 透明 PNG（见 IMAGE-ASSETS.md）。
  function sceneColumns(slide, data) {
    ui.header(slide, data.title, data.subtitle);
    const items = (data.items || []).slice(0, 4), n = items.length || 1, cw = W / n;
    items.forEach((it, i) => {
      const x0 = X + i * cw, ink = C.primary, px = x0 + 34, iw = cw - 68;
      if (i > 0) ui.line(slide, x0, 250, x0, 838, { color: C.line, width: 1.2 });
      // 编号 + 标题 + 标签
      ui.rect(slide, px, 250, 46, 46, { fill: ink, round: true, radius: 6 });
      ui.addText(slide, px, 257, 46, 32, String(i + 1).padStart(2, "0"), { size: T.cap, color: "FFFFFF", bold: true, align: "center", fontFace: F.en });
      ui.addText(slide, px + 60, 248, iw - 60, 42, it.t, { size: T.h3, color: ink, bold: true, fontFace: cjk(it.t) });
      ui.addText(slide, px, 312, iw, 26, it.tag, { size: T.cap, color: C.mute, fontFace: cjk(it.tag) });
      ui.addText(slide, px, 348, iw, 122, it.b, { size: T.bodySm, color: C.text, lineSpacingMultiple: 1.3, fontFace: cjk(it.b) });
      // 场景插画：优先用 image2 生成的透明 PNG（it.img）——直接落在页面底色上、无白卡，融入背景；
      // 缺图回退：有 it.icon 用通用图标集，否则画占位提示（领域专属线稿请走 image2，不在通用核里硬画）。
      const gy = 470, gh = 272;
      if (it.img && fs.existsSync(it.img)) {
        const s = Math.min(gh, iw), ix = px + (iw - s) / 2, iy = gy + (gh - s) / 2;
        slide.addImage({ path: it.img, x: U(ix), y: U(iy), w: U(s), h: U(s) });
      } else {
        ui.rect(slide, px, gy, iw, gh, { fill: C.surface2, round: true });
        if (it.icon) icon(pptx, slide, U, x0 + cw / 2, gy + gh / 2, it.icon, { color: ink, soft: C.surface2 });
        else ui.addText(slide, px, gy + gh / 2 - 14, iw, 28, "[ 待生成插画 ]", { size: T.cap, color: C.faint, align: "center" });
      }
      // 关键要求
      if (it.req) { ui.line(slide, px, 762, px + iw, 762, { color: C.line, width: 1 }); ui.addText(slide, px, 776, iw, 30, it.req.join("　·　"), { size: T.micro, color: ink, bold: true, fontFace: cjk(it.req.join("")) }); }
    });
    ui.footer(slide);
  }

  // ===== 6) 设计化流水线（pipelineFlow）——9 节点 + 三段分组 + 归纳带 =====
  // data:{title,subtitle, phases:[{name,span,focus}], steps:[{t,focus}], summary:[{t,b,accent}]}
  function pipelineFlow(slide, data) {
    ui.header(slide, data.title, data.subtitle);
    const steps = data.steps || [], phases = data.phases || [], n = steps.length || 1, slot = W / n;
    // 三段填充色块底（duotone ground，借 web-video 手法）——流程"写进"色块里，不再每个环节一个方框
    const bandTop = 300, bandH = 318, lineY = bandTop + 168;
    let acc = 0;
    phases.forEach(ph => {
      const gx = X + acc * slot, gw = ph.span * slot, ink = ph.focus ? C.accent : C.primary;
      ui.rect(slide, gx + 8, bandTop, gw - 16, bandH, { fill: ph.focus ? C.accentSoft : C.surface3, round: true });
      ui.rect(slide, gx + 8, bandTop, gw - 16, 5, { fill: ink });
      ui.addText(slide, gx + 8, bandTop + 22, gw - 16, 34, ph.name, { size: T.h3, color: ink, bold: true, align: "center", fontFace: cjk(ph.name) });
      acc += ph.span;
    });
    // 贯穿流程线 + 编号圆点（落在色块上），环节名在点下方 —— 文字与图形合一
    ui.line(slide, X + slot / 2, lineY, X + W - slot / 2, lineY, { color: C.line, width: 2 });
    steps.forEach((s, i) => {
      const cx = X + slot / 2 + i * slot, ink = s.focus ? C.accent : C.primary;
      if (i < n - 1) ui.line(slide, cx + 30, lineY, cx + slot - 30, lineY, { color: C.faint, width: 1.6, arrow: "triangle" });
      circle(slide, cx, lineY, 26, ink, "FFFFFF", 2);
      ui.addText(slide, cx - 26, lineY - 26, 52, 52, String(i + 1), { size: T.cap, color: "FFFFFF", bold: true, align: "center", valign: "middle", fontFace: F.en });
      ui.addText(slide, cx - slot / 2 + 8, lineY + 44, slot - 16, 56, s.t, { size: T.bodySm, color: ink, bold: true, align: "center", lineSpacingMultiple: 1.08, fontFace: cjk(s.t) });
    });
    // 归纳：底部单条强调带（左红=难点 / 右蓝=自研空间），细竖线分隔，不再两个高方框
    const sm = (data.summary || []).slice(0, 2), sy = 668, shh = 150, half = W / 2;
    ui.rect(slide, X, sy, W, shh, { fill: C.surface2, round: true });
    ui.line(slide, X + half, sy + 22, X + half, sy + shh - 22, { color: C.line, width: 1.2 });
    sm.forEach((z, i) => {
      const x = X + i * half + 28, ink = z.accent ? C.accent : C.primary;
      ui.rect(slide, x, sy + 30, 8, 56, { fill: ink });
      ui.addText(slide, x + 22, sy + 28, half - 80, 32, z.t, { size: T.h3, color: ink, bold: true, fontFace: cjk(z.t) });
      ui.addText(slide, x + 22, sy + 74, half - 80, 56, z.b, { size: T.body, color: C.text, lineSpacingMultiple: 1.2, fontFace: cjk(z.b) });
    });
    ui.footer(slide);
  }

  // ===== 行动轨道（actionTracks）——四线 + 负责人/时间/状态 =====
  // data:{title,subtitle, tracks:[{icon,name,action,owner,time,status,focus}], banner?}
  function actionTracks(slide, data) {
    ui.header(slide, data.title, data.subtitle);
    const tracks = (data.tracks || []).slice(0, 4), bannerH = data.banner ? 76 : 0;
    const availTop = 252, availBot = 940 - bannerH, gap = 16;
    const laneH = Math.min(152, (availBot - availTop - (tracks.length - 1) * gap) / Math.max(1, tracks.length));
    let y = availTop;
    tracks.forEach(t => {
      const foc = t.focus, ink = foc ? C.accent : C.primary;
      if (foc) ui.rect(slide, X, y, W, laneH, { fill: C.accentSoft });
      ui.rect(slide, X, y, W, laneH, { line: ink, lineWidth: foc ? 1.8 : 1.3, round: true });
      ui.rect(slide, X, y, 6, laneH, { fill: ink });
      circle(slide, X + 56, y + laneH / 2, 28, foc ? C.accentSoft : C.surface2, ink, 1.6); icon(pptx, slide, U, X + 56, y + laneH / 2, t.icon || "target", { color: ink, soft: foc ? C.accentSoft : C.surface2 });
      ui.addText(slide, X + 100, y + laneH / 2 - 20, 250, 40, t.name, { size: T.h3, color: ink, bold: true, valign: "middle", fontFace: cjk(t.name) });
      ui.addText(slide, X + 372, y + 16, W - 372 - 474, laneH - 32, t.action, { size: T.body, color: C.text, valign: "middle", lineSpacingMultiple: 1.2, fontFace: cjk(t.action) });
      const chipX = X + W - 462, defs = [["负责人", t.owner || "___"], ["时间", t.time || "—"], ["状态", t.status || "—"]];
      defs.forEach((c, j) => { const cx = chipX + j * 150; ui.rect(slide, cx, y + laneH / 2 - 32, 138, 64, { line: j === 2 && foc ? C.accent : C.line, lineWidth: 1.2, round: true }); ui.addText(slide, cx + 12, y + laneH / 2 - 26, 116, 22, c[0], { size: T.tiny, color: C.faint, bold: true, fontFace: F.cn }); ui.addText(slide, cx + 12, y + laneH / 2 - 0, 116, 30, c[1], { size: T.bodySm, color: j === 2 && foc ? C.accent : C.primary, bold: true, fontFace: cjk(c[1]) }); });
      y += laneH + gap;
    });
    if (data.banner) {
      ui.rect(slide, X, availBot + 16, W, bannerH - 6, { line: C.accent, lineWidth: 1.6, round: true });
      ui.addText(slide, X + 24, availBot + 16, W - 48, bannerH - 6, data.banner, { size: T.lead, color: C.accent, bold: true, align: "center", valign: "middle", fontFace: cjk(data.banner) });
    }
    ui.footer(slide);
  }

  return { hubRadial, tierLadder, goalPath, sceneColumns, pipelineFlow, actionTracks, circle };
}

module.exports = { makeBespoke };
