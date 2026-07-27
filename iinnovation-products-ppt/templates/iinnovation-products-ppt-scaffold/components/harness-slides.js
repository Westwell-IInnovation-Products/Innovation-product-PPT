function fitFont(text, cnSize, enSize, theme) {
  return {
    size: /[\u4e00-\u9fff]/.test(text || "") ? cnSize : enSize,
    fontFace: /[\u4e00-\u9fff]/.test(text || "") ? theme.fonts.cn : theme.fonts.en
  };
}

function band(ui, slide, theme, x, y, w, h, title, subtitle, opts = {}) {
  const C = theme.colors, T = theme.type;
  const col = opts.accent ? C.accent : C.primary;
  ui.rect(slide, x, y, w, h, { fill: opts.fill || C.surface, line: opts.line || C.line, lineWidth: opts.accent ? 1.5 : 1, round: true, shadow: opts.shadow !== false });
  if (opts.top) ui.rect(slide, x, y, w, 6, { fill: col });
  else ui.rect(slide, x, y, 6, h, { fill: col });
  ui.addText(slide, x + 22, y + 20, w - 44, 26, title, { size: opts.titleSize || T.body, color: col, bold: true, fit: "shrink" });
  if (subtitle) ui.addText(slide, x + 22, y + 58, w - 44, h - 70, subtitle, { size: opts.bodySize || T.bodySm, color: C.text, lineSpacingMultiple: 1.16, fit: "shrink" });
}

function note(ui, slide, theme, text, y = 884) {
  ui.caveatBand(slide, text, y);
}

function section(slide, { ui, theme }, data) {
  const C = theme.colors, T = theme.type;
  slide.background = { color: C.bg };
  ui.logo(slide);
  ui.addText(slide, 120, 242, 360, 90, data.eyebrow || data.number, { size: 72, color: C.surface3, bold: true, fontFace: theme.fonts.en, fit: "none" });
  ui.addText(slide, 320, 378, 1280, 72, data.title, { size: 48, color: C.accent, bold: true, align: "center", fit: "shrink" });
  ui.rect(slide, 760, 482, 400, 3, { fill: C.accent });
  ui.addText(slide, 430, 516, 1060, 54, data.subtitle || "", { size: T.bodyLg, color: C.primary, bold: true, align: "center", lineSpacingMultiple: 1.18, fit: "shrink" });
  const chips = data.chips || [];
  chips.forEach((c, i) => {
    const x = 520 + i * 300;
    ui.rect(slide, x, 632, 240, 42, { fill: C.surface2, line: C.line, round: true });
    ui.addText(slide, x + 12, 644, 216, 16, c, { size: T.micro, color: C.primary, bold: true, align: "center", fit: "shrink" });
  });
  ui.footer(slide);
}

function question(slide, { ui, theme }, data) {
  const C = theme.colors, T = theme.type;
  ui.header(slide, data.title, data.subtitle);
  ui.addText(slide, 116, 284, 560, 150, data.big, { size: 50, color: C.accent, bold: true, lineSpacingMultiple: 0.96, fit: "shrink" });
  ui.rect(slide, 126, 482, 6, 180, { fill: C.primary });
  ui.addText(slide, 160, 488, 460, 136, data.lead, { size: T.bodyLg, color: C.text, lineSpacingMultiple: 1.24, fit: "shrink" });
  data.items.forEach((it, i) => {
    const y = 248 + i * 124;
    band(ui, slide, theme, 750, y, 998, 88, it[0], it[1], { accent: i === data.focus, bodySize: T.cap });
  });
  note(ui, slide, theme, data.takeaway);
}

function timeline(slide, { ui, theme }, data) {
  const C = theme.colors, T = theme.type;
  ui.header(slide, data.title, data.subtitle);
  const y = 330, x0 = 160, gap = 390;
  ui.line(slide, x0 + 80, y + 64, x0 + 3 * gap + 80, y + 64, { color: C.faint, width: 2 });
  data.steps.forEach((s, i) => {
    const x = x0 + i * gap;
    const hot = i === data.focus;
    ui.rect(slide, x, y, 160, 128, { fill: hot ? C.accentSoft : C.surface, line: hot ? C.accent : C.line, lineWidth: hot ? 1.5 : 1, round: true, shadow: true });
    ui.addText(slide, x + 18, y + 24, 124, 28, s[0], { size: T.body, color: hot ? C.accent : C.primary, bold: true, align: "center", fontFace: theme.fonts.en, fit: "shrink" });
    ui.addText(slide, x + 18, y + 66, 124, 32, s[1], { size: T.micro, color: C.text, align: "center", fit: "shrink" });
  });
  data.layers.forEach((l, i) => {
    const x = 166 + (i % 4) * 392, y2 = 568 + Math.floor(i / 4) * 86;
    ui.rect(slide, x, y2, 330, 56, { fill: C.surface2, line: C.line, round: true });
    ui.addText(slide, x + 18, y2 + 16, 294, 20, l, { size: T.bodySm, color: C.primary, bold: true, align: "center", fit: "shrink" });
  });
  note(ui, slide, theme, data.takeaway);
}

function compare(slide, { ui, theme }, data) {
  const C = theme.colors, T = theme.type;
  ui.header(slide, data.title, data.subtitle);
  const panels = data.panels;
  panels.forEach((p, i) => {
    const x = i === 0 ? 126 : 1134;
    const hot = i === data.focus;
    band(ui, slide, theme, x, 276, 660, 420, p.title, p.body, { accent: hot, top: true, bodySize: T.bodySm });
    p.points.forEach((pt, j) => {
      ui.rect(slide, x + 42, 476 + j * 54, 576, 36, { fill: hot && j === 0 ? C.accentSoft : C.surface2, line: C.line, round: true });
      ui.addText(slide, x + 62, 486 + j * 54, 536, 14, pt, { size: T.micro, color: C.text, fit: "shrink" });
    });
  });
  ui.addText(slide, 824, 424, 272, 70, data.middle || "包含 / 管理", { size: T.h3, color: C.primary, bold: true, align: "center", valign: "middle", fit: "shrink" });
  ui.line(slide, 792, 460, 1126, 460, { color: C.accent, width: 2, arrow: "triangle" });
  note(ui, slide, theme, data.takeaway);
}

function evidence(slide, { ui, theme }, data) {
  const C = theme.colors, T = theme.type;
  ui.header(slide, data.title, data.subtitle);
  const n = data.cols.length, gap = 32, w = (1728 - (n - 1) * gap) / n;
  data.cols.forEach((col, i) => {
    const x = 96 + i * (w + gap);
    band(ui, slide, theme, x, 270, w, 510, col.title, col.desc, { accent: i === data.focus, top: true, bodySize: T.bodySm });
    col.items.forEach((it, j) => {
      ui.addText(slide, x + 32, 434 + j * 54, w - 64, 26, "· " + it, { size: T.bodySm, color: C.text, fit: "shrink" });
    });
  });
  note(ui, slide, theme, data.takeaway);
}

function matrix(slide, { ui, theme }, data) {
  const C = theme.colors, T = theme.type;
  ui.header(slide, data.title, data.subtitle);
  const x = 126, y = 248, w = 1668, h = 552;
  const cols = data.cols, rows = data.rows;
  const labelW = 270, headH = 68, colW = (w - labelW) / cols.length, rowH = (h - headH) / rows.length;
  ui.rect(slide, x, y, w, h, { fill: C.surface, line: C.line, round: true, shadow: true });
  cols.forEach((c, i) => ui.addText(slide, x + labelW + i * colW, y + 22, colW, 24, c, { size: T.bodySm, color: C.primary, bold: true, align: "center", fit: "shrink" }));
  rows.forEach((r, ri) => {
    const yy = y + headH + ri * rowH;
    ui.addText(slide, x + 24, yy + 16, labelW - 48, 24, r.name, { size: T.bodySm, color: ri === data.focus ? C.accent : C.primary, bold: true, fit: "shrink" });
    r.cells.forEach((cell, ci) => {
      ui.rect(slide, x + labelW + ci * colW + 10, yy + 8, colW - 20, rowH - 16, { fill: cell.hot ? C.accentSoft : C.surface2, line: cell.hot ? C.accent : C.line, round: true });
      ui.addText(slide, x + labelW + ci * colW + 24, yy + 20, colW - 48, rowH - 34, cell.text, { size: T.cap, color: C.text, lineSpacingMultiple: 1.08, fit: "shrink" });
    });
  });
  note(ui, slide, theme, data.takeaway);
}

function flow(slide, { ui, theme }, data) {
  const C = theme.colors, T = theme.type;
  ui.header(slide, data.title, data.subtitle);
  const items = data.steps, n = items.length, w = Math.min(260, (1728 - (n - 1) * 28) / n), gap = (1728 - n * w) / (n - 1);
  items.forEach((s, i) => {
    const x = 96 + i * (w + gap), y = 330 + (i % 2) * 54;
    const hot = i === data.focus || s.hot;
    band(ui, slide, theme, x, y, w, 150, s.title, s.body, { accent: hot, top: true, bodySize: T.cap });
    if (i < n - 1) ui.line(slide, x + w, y + 76, x + w + gap - 10, 330 + ((i + 1) % 2) * 54 + 76, { color: hot ? C.accent : C.faint, width: hot ? 1.8 : 1.1, arrow: "triangle" });
  });
  if (data.bottom) {
    const bw = Math.min(300, (1500 - (data.bottom.length - 1) * 32) / data.bottom.length);
    const startX = 960 - (data.bottom.length * bw + (data.bottom.length - 1) * 32) / 2;
    data.bottom.forEach((b, i) => {
      const x = startX + i * (bw + 32);
      ui.rect(slide, x, 670, bw, 60, { fill: C.surface2, line: C.line, round: true });
      ui.addText(slide, x + 12, 688, bw - 24, 18, b, { size: T.micro, color: C.primary, bold: true, align: "center", fit: "shrink" });
    });
  }
  note(ui, slide, theme, data.takeaway);
}

function router(slide, { ui, theme }, data) {
  const C = theme.colors, T = theme.type;
  ui.header(slide, data.title, data.subtitle);
  data.routes.forEach((r, i) => {
    const y = 246 + i * 94;
    band(ui, slide, theme, 126, y, 420, 64, r.phase, r.goal, { accent: i === data.focus, shadow: false, bodySize: T.micro });
    ui.line(slide, 556, y + 32, 664, y + 32, { color: i === data.focus ? C.accent : C.faint, width: 1.5, arrow: "triangle" });
    ui.rect(slide, 682, y, 1038, 64, { fill: i === data.focus ? C.accentSoft : C.surface, line: i === data.focus ? C.accent : C.line, round: true, shadow: true });
    ui.addText(slide, 704, y + 20, 980, 18, r.files, { size: T.cap, color: i === data.focus ? C.accent : C.primary, bold: true, fontFace: theme.fonts.en, fit: "shrink" });
  });
  note(ui, slide, theme, data.takeaway);
}

function state(slide, { ui, theme }, data) {
  const C = theme.colors, T = theme.type;
  ui.header(slide, data.title, data.subtitle);
  band(ui, slide, theme, 126, 246, 540, 540, "pages/<id>/", "每一页都有自己的生产文件、状态文件和渲染结果。", { accent: true, top: true });
  data.files.forEach((f, i) => {
    ui.rect(slide, 190, 410 + i * 70, 410, 42, { fill: i === 0 ? C.accentSoft : C.surface2, line: i === 0 ? C.accent : C.line, round: true });
    ui.addText(slide, 214, 422 + i * 70, 150, 16, f[0], { size: T.cap, color: i === 0 ? C.accent : C.primary, bold: true, fontFace: theme.fonts.en });
    ui.addText(slide, 382, 423 + i * 70, 190, 16, f[1], { size: T.micro, color: C.mute });
  });
  const steps = data.lifecycle;
  steps.forEach((s, i) => {
    const x = 802 + (i % 2) * 430, y = 286 + Math.floor(i / 2) * 150;
    band(ui, slide, theme, x, y, 360, 92, s[0], s[1], { accent: i === data.focus, shadow: true, bodySize: T.micro });
  });
  note(ui, slide, theme, data.takeaway);
}

function loop(slide, { ui, theme }, data) {
  const C = theme.colors, T = theme.type;
  ui.header(slide, data.title, data.subtitle);
  const pts = [[320, 344], [760, 250], [1200, 344], [1200, 640], [760, 734], [320, 640]];
  data.steps.forEach((s, i) => {
    const [x, y] = pts[i];
    band(ui, slide, theme, x, y, 300, 86, s[0], s[1], { accent: i === data.focus, bodySize: T.micro });
    const next = pts[(i + 1) % pts.length];
    ui.line(slide, x + 300, y + 43, next[0], next[1] + 43, { color: i === data.focus ? C.accent : C.faint, width: i === data.focus ? 1.8 : 1.1, arrow: "triangle" });
  });
  ui.addText(slide, 660, 486, 520, 90, data.center, { size: T.h3, color: C.primary, bold: true, align: "center", valign: "middle", lineSpacingMultiple: 1.12, fit: "shrink" });
  note(ui, slide, theme, data.takeaway);
}

function hub(slide, { ui, theme }, data) {
  const C = theme.colors, T = theme.type;
  ui.header(slide, data.title, data.subtitle);
  const positions = data.items.map((it, i) => {
    const angle = (-150 + i * (300 / Math.max(1, data.items.length - 1))) * Math.PI / 180;
    const x = 960 + Math.cos(angle) * 650 - 145;
    const y = 510 + Math.sin(angle) * 300 - 42;
    return { it, i, x, y };
  });
  positions.forEach(({ i, x, y }) => {
    ui.line(slide, 960, 510, x + 145, y + 42, { color: i === data.focus ? C.accent : C.faint, width: i === data.focus ? 1.6 : 1 });
  });
  positions.forEach(({ it, i, x, y }) => {
    band(ui, slide, theme, x, y, 290, 84, it[0], it[1], { accent: i === data.focus, bodySize: T.micro, shadow: true });
  });
  band(ui, slide, theme, 716, 394, 488, 178, data.center, data.centerBody, { accent: true, top: true, bodySize: T.bodySm });
  note(ui, slide, theme, data.takeaway);
}

function benefits(slide, { ui, theme }, data) {
  const C = theme.colors, T = theme.type;
  ui.header(slide, data.title, data.subtitle);
  compare(slide, { ui, theme }, {
    title: data.title,
    subtitle: data.subtitle,
    focus: 1,
    middle: "复用系统",
    panels: [
      { title: "以前：出一份 PPT", body: "每次重新解释需求、重调样式、人工发现问题。", points: ["速度取决于临场发挥", "返工集中在版式和风格", "经验很难沉淀"] },
      { title: "现在：复用一套 Harness", body: "流程、组件、QA 和经验都可以继续复用。", points: ["样稿先对齐，降低返工", "单页修复，影响范围可控", "问题进入 LESSONS"] }
    ],
    takeaway: data.takeaway
  });
  data.metrics.forEach((m, i) => {
    const x = 360 + i * 420;
    ui.rect(slide, x, 730, 300, 72, { fill: C.surface2, line: C.line, round: true });
    ui.addText(slide, x + 20, 746, 260, 22, m[0], { size: T.bodySm, color: C.primary, bold: true, align: "center" });
    ui.addText(slide, x + 20, 774, 260, 14, m[1], { size: T.micro, color: C.mute, align: "center" });
  });
}

function references(slide, { ui, theme }, data) {
  const C = theme.colors, T = theme.type;
  ui.header(slide, data.title, data.subtitle);
  data.groups.forEach((g, i) => {
    const x = 116 + (i % 3) * 584, y = 252 + Math.floor(i / 3) * 226;
    band(ui, slide, theme, x, y, 500, 170, g.title, g.items.join("\n"), { accent: i === 0, top: true, bodySize: T.cap });
  });
  const path = data.path;
  ui.rect(slide, 250, 754, 1420, 82, { fill: C.surface2, line: C.line, round: true });
  ui.addText(slide, 280, 776, 240, 22, "学习路径", { size: T.bodySm, color: C.accent, bold: true });
  ui.addText(slide, 540, 778, 1080, 20, path, { size: T.bodySm, color: C.text, fit: "shrink" });
  note(ui, slide, theme, data.takeaway);
}

function platformTrend(slide, { ui, theme }, data) {
  const C = theme.colors, T = theme.type;
  ui.header(slide, data.title, data.subtitle);
  const center = { x: 716, y: 404, w: 488, h: 170 };
  band(ui, slide, theme, center.x, center.y, center.w, center.h, data.center || "Agent Harness", data.centerBody, {
    accent: true,
    top: true,
    bodySize: T.bodySm
  });
  const nodes = data.cols || [];
  const pts = [
    { x: 120, y: 278, w: 458, h: 250 },
    { x: 1342, y: 278, w: 458, h: 250 },
    { x: 546, y: 650, w: 828, h: 168 }
  ];
  nodes.forEach((n, i) => {
    const p = pts[i];
    const hot = i === data.focus;
    band(ui, slide, theme, p.x, p.y, p.w, p.h, n.title, n.desc, {
      accent: hot,
      top: true,
      bodySize: i === 2 ? T.cap : T.bodySm
    });
    if (i < 2) {
      ui.line(slide, i === 1 ? p.x : p.x + p.w, p.y + p.h / 2, i === 1 ? center.x + center.w : center.x, center.y + center.h / 2, {
        color: C.faint,
        width: 1,
        arrow: "triangle"
      });
    } else {
      ui.line(slide, center.x + center.w / 2, center.y + center.h, center.x + center.w / 2, p.y, {
        color: C.accent,
        width: 1.3,
        arrow: "triangle"
      });
    }
    const items = (n.items || []).slice(0, 4);
    items.forEach((it, j) => {
      const cols = i === 2 ? 4 : 2;
      const chipW = (p.w - 56 - (cols - 1) * 14) / cols;
      const x = p.x + 28 + (j % cols) * (chipW + 14);
      const y = p.y + (i === 2 ? 102 : 154) + Math.floor(j / cols) * 38;
      ui.rect(slide, x, y, chipW, 26, { fill: C.surface2, line: C.line, round: true });
      ui.addText(slide, x + 8, y + 8, chipW - 16, 9, it, {
        size: T.tiny,
        color: C.primary,
        bold: true,
        align: "center",
        fit: "shrink",
        fontFace: /[A-Za-z]/.test(it) ? theme.fonts.en : theme.fonts.cn
      });
    });
  });
  note(ui, slide, theme, data.takeaway);
}

function problemMap(slide, { ui, theme, pptx }, data) {
  const C = theme.colors, T = theme.type, U = ui.U, S = pptx.ShapeType;
  ui.header(slide, data.title, data.subtitle);
  ui.addText(slide, 126, 246, 520, 34, data.leftTitle || "问题不是生成，而是生产系统不稳定", {
    size: T.h3, color: C.primary, bold: true, fit: "shrink"
  });
  ui.addText(slide, 1110, 246, 520, 34, data.rightTitle || "对应需要的 Harness 机制", {
    size: T.h3, color: C.accent, bold: true, fit: "shrink"
  });
  (data.rows || []).forEach((r, i) => {
    const y = 320 + i * 120;
    const hot = i === data.focus;
    const ink = hot ? C.accent : C.primary;
    ui.rect(slide, 126, y, 530, 78, { fill: hot ? C.accentSoft : C.surface, line: hot ? C.accent : C.line, lineWidth: hot ? 1.5 : 1, round: true, shadow: true });
    slide.addShape(S.ellipse, { x: U(150), y: U(y + 20), w: U(38), h: U(38), fill: { color: ink }, line: { type: "none" } });
    ui.addText(slide, 150, y + 31, 38, 10, String(i + 1), { size: T.tiny, color: "FFFFFF", bold: true, align: "center", fontFace: theme.fonts.en });
    ui.addText(slide, 210, y + 16, 160, 18, r.name, { size: T.bodySm, color: ink, bold: true, fit: "shrink" });
    ui.addText(slide, 210, y + 44, 390, 18, r.problem, { size: T.tiny, color: C.text, fit: "shrink" });
    ui.line(slide, 670, y + 39, 1090, y + 39, { color: hot ? C.accent : C.faint, width: hot ? 1.6 : 1.1, arrow: "triangle" });
    ui.rect(slide, 1110, y, 560, 78, { fill: hot ? C.accentSoft : C.surface2, line: hot ? C.accent : C.line, lineWidth: hot ? 1.5 : 1, round: true });
    ui.addText(slide, 1134, y + 16, 170, 18, r.mechanism, { size: T.bodySm, color: ink, bold: true, fit: "shrink" });
    ui.addText(slide, 1320, y + 18, 318, 36, r.result, { size: T.tiny, color: C.text, fit: "shrink", lineSpacingMultiple: 1.1 });
  });
  note(ui, slide, theme, data.takeaway);
}

function repairScope(slide, { ui, theme }, data) {
  const C = theme.colors, T = theme.type;
  ui.header(slide, data.title, data.subtitle);
  const levels = data.levels || [];
  levels.forEach((l, i) => {
    const x = 154 + i * 412;
    const y = 330 + i * 44;
    const hot = i === data.focus;
    band(ui, slide, theme, x, y, 330, 156, l.title, l.body, { accent: hot, top: true, bodySize: T.cap });
    ui.addText(slide, x + 24, y + 104, 282, 18, l.check, { size: T.tiny, color: C.mute, fit: "shrink" });
    if (i < levels.length - 1) {
      ui.line(slide, x + 330, y + 78, x + 410, y + 122, { color: C.faint, width: 1.2, arrow: "triangle" });
    }
  });
  ui.rect(slide, 236, 728, 1448, 74, { fill: C.surface2, line: C.line, round: true });
  ui.addText(slide, 266, 752, 220, 20, data.ruleTitle || "修复规则", { size: T.bodySm, color: C.accent, bold: true });
  ui.addText(slide, 506, 750, 1120, 22, data.rule || "", { size: T.bodySm, color: C.primary, bold: true, fit: "shrink" });
  note(ui, slide, theme, data.takeaway);
}

function shareBoundary(slide, { ui, theme }, data) {
  const C = theme.colors, T = theme.type;
  ui.header(slide, data.title, data.subtitle);
  const zones = data.zones || [];
  zones.forEach((z, i) => {
    const x = 126 + i * 560;
    const hot = i === data.focus;
    band(ui, slide, theme, x, 292, 486, 382, z.title, z.body, { accent: hot, top: true, bodySize: T.bodySm });
    (z.items || []).forEach((it, j) => {
      ui.rect(slide, x + 38, 462 + j * 48, 410, 32, { fill: hot && j === 0 ? C.accentSoft : C.surface2, line: hot && j === 0 ? C.accent : C.line, round: true });
      ui.addText(slide, x + 58, 472 + j * 48, 370, 12, it, { size: T.tiny, color: C.text, fit: "shrink" });
    });
    if (i < zones.length - 1) {
      ui.line(slide, x + 486, 484, x + 548, 484, { color: C.faint, width: 1.1, arrow: "triangle" });
    }
  });
  ui.rect(slide, 238, 746, 1444, 58, { fill: C.surface2, line: C.line, round: true });
  ui.addText(slide, 270, 764, 232, 18, data.bottomTitle || "核心判断", { size: T.bodySm, color: C.accent, bold: true });
  ui.addText(slide, 516, 764, 1100, 18, data.bottom || "", { size: T.bodySm, color: C.primary, bold: true, fit: "shrink" });
  note(ui, slide, theme, data.takeaway);
}

function closing(slide, { ui, theme }, data) {
  const C = theme.colors, T = theme.type;
  slide.background = { color: C.bg };
  ui.logo(slide);
  ui.addText(slide, 330, 384, 1260, 94, data.slogan, { size: 54, color: C.accent, bold: true, align: "center", fit: "shrink" });
  ui.line(slide, 850, 506, 1070, 506, { color: C.line, width: 1.2 });
  const tagline = data.tagline || theme.brand?.tagline || "";
  const org = data.org || theme.brand?.org || "";
  if (tagline) {
    ui.addText(slide, 360, 542, 1200, 34, tagline, { size: T.bodyLg, color: C.primary, bold: true, align: "center", fontFace: theme.fonts.en });
  }
  if (org) {
    ui.addText(slide, 360, 820, 1200, 26, org, { size: T.cap, color: C.faint, align: "center" });
  }
}

function buildHarnessPage(slide, ctx, data) {
  const map = { section, question, timeline, compare, evidence, matrix, flow, router, state, loop, hub, benefits, references, closing, platformTrend, problemMap, repairScope, shareBoundary };
  const fn = map[data.layout] || evidence;
  fn(slide, ctx, data);
}

module.exports = { buildHarnessPage };
