// 编辑式 / 线框版式组件库（iinnovation-products-ppt 扩展）。
// 设计原则（来自用户反馈）：以背景色为底 + 细线框/分隔线表达，少用白色填充卡；
// 字号统一取自 theme.type 阶梯，杜绝"图形里塞小字"；留白必须设计过（内容定高、居中/铺满）。
// 所有函数 = 一页一组件，内部调用 ui.header()/ui.footer()。配色=语义：同级一色，单点焦点。
const { icon } = require("./icons");
const fs = require("fs");

function makeEditorial({ ui, theme, pptx }) {
  const C = theme.colors, F = theme.fonts, T = theme.type, U = ui.U;
  const X = 96, W = 1728, BOT = 940;
  const cjk = s => /[一-鿿]/.test(String(s || "")) ? F.cn : F.en;
  // 直接用 pptx 画圆（线框节点 / 图标徽章底）
  function addCircle(slide, cx, cy, r, fill, lineC, lw) {
    slide.addShape(pptx.ShapeType.ellipse, {
      x: U(cx - r), y: U(cy - r), w: U(2 * r), h: U(2 * r),
      fill: fill ? { color: fill } : { type: "none" },
      line: lineC ? { color: lineC, width: lw || 1.6 } : { type: "none" }
    });
  }

  // ---- 线框分栏对比（2–4 栏，背景为底 + 竖线分隔，焦点栏浅红衬底 + 红标题）----
  // data:{title,subtitle, columns:[{name,tag,items:[],focus}], banner?, yT?}
  function lineCompare(slide, data) {
    ui.header(slide, data.title, data.subtitle);
    const cols = (data.columns || []).slice(0, 4), n = cols.length || 1, cw = W / n;
    const maxItems = Math.max(1, ...cols.map(c => (c.items || []).length));
    const blockH = 168 + maxItems * 60 + (data.banner ? 110 : 0);
    const yT = data.yT || Math.round(214 + ((BOT - 214) - blockH) / 2);
    cols.forEach((col, i) => {
      const x0 = X + i * cw, ink = col.focus ? C.accent : C.primary, px = x0 + 40;
      if (col.focus) ui.rect(slide, x0, yT, cw, 168 + maxItems * 60, { fill: C.accentSoft });
      if (i > 0) ui.line(slide, x0, yT + 6, x0, yT + 168 + maxItems * 60 - 12, { color: C.line, width: 1.4 });
      ui.addText(slide, px, yT + 14, cw - 72, 48, col.name, { size: T.h2, color: ink, bold: true, fontFace: cjk(col.name) });
      if (col.tag) ui.addText(slide, px, yT + 76, cw - 72, 30, col.tag, { size: T.cap, color: C.mute });
      ui.rect(slide, px, yT + 118, 96, 5, { fill: ink });
      (col.items || []).forEach((it, j) => {
        const by = yT + 164 + j * 60;
        ui.rect(slide, px, by + 13, 18, 4, { fill: ink });
        ui.addText(slide, px + 32, by, cw - 104, 44, it, { size: T.bodyLg, color: C.text, lineSpacingMultiple: 1.1, fontFace: cjk(it) });
      });
    });
    if (data.banner) {
      // 结论句：居中陈述 + 两侧短红线（不画整幅横线，避免与页脚红条形成"双横线"）。
      const by = yT + 168 + maxItems * 60 + 30;
      const tw = Math.min(W - 240, Math.round(String(data.banner).length * (T.lead * 1.05) + 80));
      const cx = X + W / 2;
      ui.rect(slide, cx - tw / 2 - 70, by + 22, 48, 4, { fill: C.accent });
      ui.rect(slide, cx + tw / 2 + 22, by + 22, 48, 4, { fill: C.accent });
      ui.addText(slide, cx - tw / 2, by, tw, 48, data.banner, { size: T.lead, color: C.accent, bold: true, align: "center", fontFace: cjk(data.banner) });
    }
    ui.footer(slide);
  }

  // ---- 图标里程碑横轴（N 节点，卡片上下交替，线框；末/焦点节点红）----
  // data:{title,subtitle, nodes:[{label,theme,icon,items:[],focus}], legend:[]}
  function milestoneTimeline(slide, data) {
    ui.header(slide, data.title, data.subtitle);
    const nodes = (data.nodes || []).slice(0, 5), n = nodes.length || 1;
    const axisY = 556, slot = W / n;   // 下移使整块在正文区垂直居中（复核：消除页眉下空档）
    ui.line(slide, X + slot / 2, axisY, X + W - slot / 2, axisY, { color: C.line, width: 2.5 });
    nodes.forEach((nd, i) => {
      const cx = X + slot / 2 + i * slot, ink = nd.focus ? C.accent : C.primary, above = i % 2 === 0;
      if (i < n - 1) ui.line(slide, cx + 56, axisY, cx + slot - 56, axisY, { color: C.faint, width: 1.6, arrow: "triangle" });
      addCircle(slide, cx, axisY, 50, nd.focus ? C.accentSoft : C.surface, ink, 2.4);
      icon(pptx, slide, U, cx, axisY, nd.icon || "target", { color: ink, soft: nd.focus ? C.accentSoft : C.surface2 });
      ui.addText(slide, cx - slot / 2, above ? axisY + 58 : axisY - 92, slot, 30, nd.label, { size: T.cap, color: ink, bold: true, align: "center" });
      const cardW = slot - 44, cardH = 210, cardX = cx - cardW / 2;
      const cardY = above ? axisY - 112 - cardH : axisY + 112;
      ui.line(slide, cx, above ? cardY + cardH : axisY + 50, cx, above ? axisY - 50 : cardY, { color: C.line, width: 1.2 });
      ui.rect(slide, cardX, cardY, cardW, cardH, { line: ink, lineWidth: nd.focus ? 1.8 : 1.2, round: true });
      ui.rect(slide, cardX, cardY, cardW, 6, { fill: ink });
      ui.addText(slide, cardX + 22, cardY + 18, cardW - 44, 32, nd.theme, { size: T.h3, color: ink, bold: true, fontFace: cjk(nd.theme) });
      (nd.items || []).slice(0, 4).forEach((it, j) => {
        const iy = cardY + 66 + j * 36;
        ui.addText(slide, cardX + 22, iy, 26, 26, "①②③④"[j], { size: T.micro, color: C.faint, bold: true });
        ui.addText(slide, cardX + 48, iy, cardW - 72, 28, it, { size: T.cap, color: C.text, lineSpacingMultiple: 1.02, fontFace: cjk(it) });
      });
    });
    if (data.legend) {
      ui.line(slide, X, 906, X + W, 906, { color: C.line, width: 1.2 });
      const lw = W / data.legend.length;
      data.legend.forEach((t, i) => ui.addText(slide, X + i * lw, 920, lw, 28, t, { size: T.cap, color: C.primary, bold: true, align: "center", fontFace: cjk(t) }));
    }
    ui.footer(slide);
  }

  // ---- 线框区块网格（zoneGrid，2×2 / 自定义列；每格可选 icon + 标题 + 正文，焦点描红/浅红衬底）----
  // data:{title,subtitle, zones:[{icon?,t,tag?,b,focus?}], cols?, banner?}
  function zoneGrid(slide, data) {
    const cTop = ui.header(slide, data.title, data.subtitle) || 210;
    const zones = data.zones || [], cols = data.cols || (zones.length <= 4 ? 2 : 3), rows = Math.ceil(zones.length / cols);
    const gap = 28, zw = (W - (cols - 1) * gap) / cols, bannerH = data.banner ? 74 : 0;
    const availTop = cTop + 16, availBot = BOT - (bannerH ? bannerH + 18 : 0);
    // 区块按内容定高（估算正文行数），再整体居中——避免"撑满整页、下方死白"。
    const lineH = Math.round(T.body * 1.34);
    const cpl = Math.max(12, Math.floor((zw - 60) / (T.body * 0.98)));
    const maxLines = Math.max(1, ...zones.map(z => Math.ceil(String(z.b || "").length / cpl)));
    const headBlock = zones.some(z => z.icon) ? 96 : 80;
    const zhContent = headBlock + maxLines * lineH + 48;
    const zhRaw = (availBot - availTop - (rows - 1) * gap) / rows;
    const zh = Math.max(176, Math.min(zhRaw, zhContent));
    const blockH = rows * zh + (rows - 1) * gap;
    const top0 = Math.round(availTop + ((availBot - availTop) - blockH) / 2);
    zones.forEach((z, i) => {
      const r = Math.floor(i / cols), c = i % cols, zx = X + c * (zw + gap), zy = top0 + r * (zh + gap);
      const foc = z.focus, ink = foc ? C.accent : C.primary;
      if (foc) ui.rect(slide, zx, zy, zw, zh, { fill: C.accentSoft });
      ui.rect(slide, zx, zy, zw, zh, { line: ink, lineWidth: foc ? 1.8 : 1.3, round: true });
      ui.rect(slide, zx, zy, 6, zh, { fill: ink });
      let tx = zx + 28;
      if (z.icon) {
        addCircle(slide, zx + 54, zy + 52, 30, foc ? C.accentSoft : C.surface2, ink, 1.6);
        icon(pptx, slide, U, zx + 54, zy + 52, z.icon, { color: ink, soft: foc ? C.accentSoft : C.surface2 });
        tx = zx + 100;
      }
      ui.addText(slide, tx, zy + (z.icon ? 30 : 26), zw - (tx - zx) - (z.tag ? 180 : 24), 36, z.t, { size: T.h3, color: ink, bold: true, fontFace: cjk(z.t) });
      if (z.tag) ui.addText(slide, zx + zw - 188, zy + 30, 164, 28, z.tag, { size: T.tiny, color: C.faint, align: "right" });
      ui.addText(slide, zx + 28, zy + (z.icon ? 96 : 82), zw - 56, zh - (z.icon ? 116 : 100), z.b, { size: T.body, color: C.text, lineSpacingMultiple: 1.34, fontFace: cjk(z.b) });
    });
    if (data.banner) {
      ui.rect(slide, X, availBot + 18, W, bannerH, { line: C.accent, lineWidth: 1.6, round: true });
      ui.addText(slide, X + 24, availBot + 18 + bannerH / 2 - 16, W - 48, 34, data.banner, { size: T.lead, color: C.accent, bold: true, align: "center", valign: "middle", fontFace: cjk(data.banner) });
    }
    ui.footer(slide);
  }

  // ---- 身份栏 + 右侧线框区块（splitDossier）----
  // data:{title,subtitle, identity:{name,sub,facts:[[k,v]]}, zones:[{t,tag?,b,focus?}], cols?, leftW?}
  function splitDossier(slide, data) {
    ui.header(slide, data.title, data.subtitle);
    const yT = 250, bot = 936, id = data.identity || {}, LX = X, LW = data.leftW || 600;
    if (id.name) {
      ui.rect(slide, LX, yT + 4, 8, 146, { fill: C.accent });
      ui.addText(slide, LX + 28, yT, LW - 40, 70, id.name, { size: T.hero, color: C.primary, bold: true, fontFace: cjk(id.name) });
      if (id.sub) ui.addText(slide, LX + 28, yT + 80, LW - 40, 40, id.sub, { size: T.h3, color: C.mute, fontFace: cjk(id.sub) });
    }
    (id.facts || []).forEach((f, i) => {
      const fy = yT + 170 + i * 96;
      ui.line(slide, LX + 28, fy, LX + LW - 40, fy, { color: C.line, width: 1.2 });
      ui.addText(slide, LX + 28, fy + 18, 110, 32, f[0], { size: T.h3, color: C.accent, bold: true, fontFace: cjk(f[0]) });
      ui.addText(slide, LX + 150, fy + 16, LW - 170, 64, f[1], { size: T.bodySm, color: C.text, lineSpacingMultiple: 1.2, fontFace: cjk(f[1]) });
    });
    // 左栏底部：建图成果示意图（image2 点云成果）
    if (id.img && fs.existsSync(id.img)) {
      const fb = yT + 170 + (id.facts || []).length * 96 + 10;
      if (id.imgCap) ui.addText(slide, LX + 28, fb, LW - 56, 28, id.imgCap, { size: T.cap, color: C.primary, bold: true, fontFace: cjk(id.imgCap) });
      const cy = fb + (id.imgCap ? 34 : 0), s = Math.min(bot - cy - 6, LW - 120), card = s + 16, ix0 = LX + 28 + ((LW - 28) - card) / 2;
      ui.rect(slide, ix0, cy, card, card, { fill: C.surface, line: C.line, lineWidth: 1, round: true });
      slide.addImage({ path: id.img, x: U(ix0 + 8), y: U(cy + 8), w: U(s), h: U(s) });
    }
    ui.line(slide, LX + LW + 24, yT, LX + LW + 24, bot, { color: C.line, width: 1.4 });
    const RX = LX + LW + 64, RW = 1824 - RX, cols = data.cols || 2, zones = data.zones || [];
    const rrows = Math.ceil(zones.length / cols), gap = 28, zw = (RW - (cols - 1) * gap) / cols, zh = (bot - yT - (rrows - 1) * gap) / rrows;
    zones.forEach((z, i) => {
      const r = Math.floor(i / cols), c = i % cols, zx = RX + c * (zw + gap), zy = yT + r * (zh + gap), foc = z.focus, ink = foc ? C.accent : C.primary;
      ui.rect(slide, zx, zy, zw, zh, { fill: foc ? C.accentSoft : C.surface2, round: true });
      ui.rect(slide, zx, zy, 6, zh, { fill: ink });
      ui.addText(slide, zx + 26, zy + 22, zw - 200, 36, z.t, { size: T.h3, color: ink, bold: true, fontFace: cjk(z.t) });
      if (z.tag) ui.addText(slide, zx + zw - 188, zy + 26, 164, 28, z.tag, { size: T.tiny, color: C.faint, align: "right" });
      ui.addText(slide, zx + 26, zy + 74, zw - 52, zh - 94, z.b, { size: T.bodySm, color: C.text, lineSpacingMultiple: 1.3, fontFace: cjk(z.b) });
    });
    ui.footer(slide);
  }

  // ---- 双面板（panelDuo）：左右两块线框面板，各含标题 + 条目（name+desc）----
  // data:{title,subtitle, left:{head,focus?,entries:[{name,desc}]}, right:{...}, note?}
  function panelDuo(slide, data) {
    const cTop = ui.header(slide, data.title, data.subtitle) || 210;
    const gap = 104, pw = (W - gap) / 2, noteH = data.note ? 56 : 0;
    const yT = cTop + 20, ph = BOT - noteH - yT;
    [data.left, data.right].forEach((p, i) => {
      if (!p) return;
      const x = X + i * (pw + gap), foc = p.focus, ink = foc ? C.accent : C.primary;
      // 填充色块底（焦点=浅红 / 普通=浅灰）——填充而非空心方框，更"实"、不死板
      ui.rect(slide, x, yT, pw, ph, { fill: foc ? C.accentSoft : C.surface2, round: true });
      ui.rect(slide, x, yT, pw, 60, { fill: ink, round: true });
      ui.addText(slide, x + 26, yT + 14, pw - 52, 34, p.head, { size: T.h3, color: "FFFFFF", bold: true, valign: "middle", fontFace: cjk(p.head) });
      const foot = p.foot, footH = foot ? 70 : 0;
      const ents = (p.entries || []).slice(0, 6), eTop = yT + 88, eArea = ph - 104 - footH, eh = eArea / Math.max(1, ents.length);
      ents.forEach((e, j) => {
        const ey = eTop + j * eh, my = ey + eh / 2 - 8;
        if (j > 0) ui.line(slide, x + 26, ey - 2, x + pw - 26, ey - 2, { color: foc ? "EAC7C7" : C.line, width: 1 });
        addCircle(slide, x + 54, my, 25, C.surface, ink, 1.5);
        icon(pptx, slide, U, x + 54, my, e.icon || "document", { color: ink, soft: C.surface });
        ui.addText(slide, x + 96, ey + 8, pw - 128, 34, e.name, { size: T.h3, color: ink, bold: true, fontFace: cjk(e.name) });
        if (e.desc) ui.addText(slide, x + 96, ey + 46, pw - 128, eh - 56, e.desc, { size: T.bodySm, color: C.text, lineSpacingMultiple: 1.22, fontFace: cjk(e.desc) });
      });
      if (foot) {
        const fy = yT + ph - footH + 8;
        ui.rect(slide, x + 22, fy, pw - 44, footH - 16, { fill: foc ? "F6DEDE" : C.surface, round: true });
        ui.addText(slide, x + 40, fy, pw - 80, footH - 16, foot, { size: T.bodySm, color: ink, bold: true, valign: "middle", lineSpacingMultiple: 1.15, fontFace: cjk(foot) });
      }
    });
    // 中央 VS 节点（两条路线对照）
    const mxc = X + pw + gap / 2, myc = yT + ph / 2;
    addCircle(slide, mxc, myc, 42, C.surface, C.primary, 2);
    ui.addText(slide, mxc - 42, myc - 20, 84, 40, "VS", { size: T.h2, color: C.primary, bold: true, align: "center", valign: "middle", fontFace: F.en });
    if (data.note) { ui.line(slide, X, BOT - noteH + 12, X + W, BOT - noteH + 12, { color: C.line, width: 1 }); ui.addText(slide, X, BOT - noteH + 22, W, 34, data.note, { size: T.cap, color: C.mute, fontFace: cjk(data.note) }); }
    ui.footer(slide);
  }

  // ---- 线框表（lineTable）：背景为底，行用细线分隔，无填充网格；焦点行浅红衬底 ----
  // data:{title,subtitle, columns:[], rows:[{label,cells,focus}], labelW?, corner?, note?}
  function lineTable(slide, data) {
    const cTop = ui.header(slide, data.title, data.subtitle) || 210;
    const cols = data.columns || [], rows = data.rows || [], n = cols.length || 1;
    const labelW = data.labelW || 300, cw = (W - labelW) / n, noteH = data.note ? 64 : 0;
    const availTop = cTop + 18, availBot = BOT - noteH, headH = 56;
    const rowH = Math.min(98, Math.max(54, (availBot - availTop - headH) / Math.max(1, rows.length)));
    const tableH = headH + rows.length * rowH, y0 = Math.round(availTop + ((availBot - availTop) - tableH) / 2);
    ui.rect(slide, X, y0, labelW, headH, { fill: C.primary });   // 表头底（藏蓝）
    ui.rect(slide, X + labelW, y0, W - labelW, headH, { fill: C.surface2 });
    ui.addText(slide, X + 18, y0 + headH / 2 - 16, labelW - 24, 32, data.corner || "", { size: T.cap, color: "FFFFFF", bold: true, valign: "middle" });
    cols.forEach((c, i) => { const cx = X + labelW + i * cw; ui.addText(slide, cx + 16, y0 + headH / 2 - 18, cw - 24, 36, c, { size: T.h3, color: C.primary, bold: true, valign: "middle", fontFace: cjk(c) }); });
    ui.line(slide, X, y0 + headH, X + W, y0 + headH, { color: C.primary, width: 2 });
    let y = y0 + headH;
    rows.forEach((r, ri) => {
      const foc = r.focus;
      if (foc) { ui.rect(slide, X, y, W, rowH, { fill: C.accentSoft }); ui.rect(slide, X, y, 6, rowH, { fill: C.accent }); }
      else if (ri % 2 === 1) ui.rect(slide, X, y, W, rowH, { fill: C.surface2 });   // 斑马纹
      ui.addText(slide, X + 18, y + rowH / 2 - 18, labelW - 28, 36, r.label, { size: T.body, color: foc ? C.accent : C.primary, bold: true, valign: "middle", fontFace: cjk(r.label) });
      (r.cells || []).slice(0, n).forEach((cell, ci) => { const cx = X + labelW + ci * cw; ui.addText(slide, cx + 16, y + rowH / 2 - 22, cw - 28, 44, String(cell), { size: T.body, color: foc ? C.accent : C.text, valign: "middle", lineSpacingMultiple: 1.12, fontFace: cjk(cell) }); });
      if (ri < rows.length - 1) ui.line(slide, X, y + rowH, X + W, y + rowH, { color: C.line, width: 1 });
      y += rowH;
    });
    ui.line(slide, X + labelW, y0, X + labelW, y0 + tableH, { color: C.line, width: 1 });
    if (data.note) { ui.line(slide, X, availBot + 12, X + W, availBot + 12, { color: C.line, width: 1 }); ui.addText(slide, X, availBot + 22, W, 36, data.note, { size: T.cap, color: C.mute, fontFace: cjk(data.note) }); }
    ui.footer(slide);
  }

  // ---- 图片槽位（imageSlot）：为"复杂图片"保留矩形 ----
  // 透明 PNG → 直接贴在主题底色上融合（默认无白卡，等比居中）；缺图 → tinted 底 + 矢量 fallback（保证渲染不崩）。
  // o:{x,y,w,h, img, fallback:(slide,cx,cy)=>{}, ground:false|"surface3"|hex}
  function imageSlot(slide, o) {
    const fs = require("fs");
    const x = o.x, y = o.y, w = o.w, h = o.h;
    if (o.img && fs.existsSync(o.img)) {
      if (o.ground && o.ground !== false) ui.rect(slide, x, y, w, h, { fill: C[o.ground] || o.ground, round: true });
      const s = Math.min(w, h), ix = x + (w - s) / 2, iy = y + (h - s) / 2;
      slide.addImage({ path: o.img, x: ui.U(ix), y: ui.U(iy), w: ui.U(s), h: ui.U(s) });
    } else {
      ui.rect(slide, x, y, w, h, { fill: C.surface2, round: true });
      if (typeof o.fallback === "function") o.fallback(slide, x + w / 2, y + h / 2);
      else ui.addText(slide, x, y + h / 2 - 16, w, 32, o.placeholder || "[ 待生成图片 ]", { size: T.cap, color: C.faint, align: "center" });
    }
  }

  return { lineCompare, milestoneTimeline, zoneGrid, splitDossier, panelDuo, lineTable, addCircle, imageSlot };
}

module.exports = { makeEditorial };
