const { icon } = require("./icons");
const fs = require("fs");

function makeComponents(pptx, theme) {
  const U = px => +(px / theme.ppt.pxPerIn).toFixed(3);
  const PT = px => +(px / theme.ppt.pxPerPt).toFixed(1);
  const C = theme.colors;
  const F = theme.fonts;
  const shape = pptx.ShapeType;

  function shadowToken(kind, fallback) {
    const token = theme.elevation && theme.elevation[kind];
    return token ? { ...token } : fallback;
  }

  function addText(slide, x, y, w, h, text, opts = {}) {
    const plainText = Array.isArray(text) ? text.map(item => item && item.text || "").join("") : String(text || "");
    const fontFace = opts.fontFace || (/[一-鿿]/.test(plainText) ? F.cn : F.en);
    const roleSize = opts.role && theme.type && theme.type[opts.role];
    const textOptions = {
      x: U(x), y: U(y), w: U(w), h: U(h),
      fontFace,
      fontSize: PT(opts.size || roleSize || 28),
      color: opts.color || C.text,
      bold: !!opts.bold,
      italic: !!opts.italic,
      align: opts.align || "left",
      valign: opts.valign || "top",
      margin: opts.margin ?? 0,
      breakLine: false,
      charSpacing: opts.charSpacing,
      lineSpacingMultiple: opts.lineSpacingMultiple || 1
    };
    // Silent shrink makes peer labels inconsistent and can hide an over-capacity
    // component. Use it only as an explicit, reviewed exception.
    if (opts.fit) textOptions.fit = opts.fit;
    slide.addText(text, textOptions);
  }

  function rect(slide, x, y, w, h, opts = {}) {
    const cont = theme.container || {};
    const radiusScale = theme.shape && theme.shape.radius;
    const themedRadius = radiusScale
      ? h <= 48
        ? (radiusScale.control ?? 12)
        : h <= 84
          ? (radiusScale.inset ?? 14)
          : (radiusScale.card ?? 18)
      : (cont.radius ?? 8);
    const wantRound = opts.round && cont.round !== false;
    const shadow = cont.shadow === false
      ? undefined
      : opts.shadow && typeof opts.shadow === "object"
        ? opts.shadow
        : opts.shadow
          ? shadowToken("card", { type: "outer", color: "1A2030", opacity: 0.14, blur: 8, offset: 2, angle: 90 })
          : undefined;
    slide.addShape(wantRound ? shape.roundRect : shape.rect, {
      x: U(x), y: U(y), w: U(w), h: U(h),
      fill: opts.fill ? { color: opts.fill } : { type: "none" },
      line: opts.line ? { color: opts.line, width: opts.lineWidth || 1 } : { type: "none" },
      rectRadius: wantRound ? U(opts.radius ?? themedRadius) : undefined,
      shadow
    });
  }

  function line(slide, x1, y1, x2, y2, opts = {}) {
    slide.addShape(shape.line, {
      x: U(Math.min(x1, x2)), y: U(Math.min(y1, y2)),
      w: U(Math.abs(x2 - x1) || 0.01), h: U(Math.abs(y2 - y1) || 0.01),
      line: { color: opts.color || C.line, width: opts.width || 1.5, dashType: opts.dash, endArrowType: opts.arrow },
      flipH: x2 < x1,
      flipV: y2 < y1
    });
  }

  // 通用自选图形（donut / can / cube / upArrow / rightArrow / roundRect 等），px 入参。
  function shp(slide, type, x, y, w, h, o = {}) {
    const shadow = (theme.container && theme.container.shadow === false)
      ? undefined
      : o.shadow && typeof o.shadow === "object"
        ? o.shadow
        : o.shadow
          ? shadowToken("focus", { type: "outer", color: "1A2030", opacity: 0.18, blur: 9, offset: 3, angle: 90 })
          : undefined;
    slide.addShape(type, {
      x: U(x), y: U(y), w: U(w), h: U(h),
      fill: o.fill ? { color: o.fill } : { type: "none" },
      line: o.line ? { color: o.line, width: o.lw || 1.4 } : { type: "none" },
      rotate: o.rotate, flipV: o.flipV, flipH: o.flipH,
      shadow
    });
  }

  // 右上角品牌 logo（WESTWELL）。尺寸/定位统一取自 brand 标准，勿在页面层覆盖。
  function logo(slide) {
    const brand = theme.brand || {};
    if (!brand.logo) return;
    const w = brand.logoW || 90;
    const h = w / (brand.logoAspect || 1.235);
    const x = theme.grid.w - (brand.logoMarginR || 72) - w;
    const y = brand.logoTop || 82;
    slide.addImage({ path: brand.logo, x: U(x), y: U(y), w: U(w), h: U(h) });
  }

  // 所有内容页统一铺主题底色（避免默认白底与封面/封底不一致）。
  // 标题色 + 分隔线样式由 theme.signature 决定（Base=红标题+实心红条；Global=海军蓝标题+点状 azure）。
  function header(slide, title, subtitle, opts = {}) {
    slide.background = { color: C.bg };
    const sig = theme.signature || {};
    const titleColor = sig.titleColor === "primary" ? C.primary : C.accent;
    const tSize = sig.titleSize || 40;
    const titleTop = 72;
    const titleH = tSize <= 40 ? 58 : Math.round(tSize * 1.12);   // 大标题需要更高的文本框
    const titleCJK = /[一-鿿]/.test(title || "");
    addText(slide, 96, titleTop, 1560, titleH, title, { size: tSize, color: titleColor, bold: true, fontFace: titleCJK ? F.cn : F.en });
    const ruleY = tSize <= 40 ? 144 : (titleTop + titleH + 8);     // base 保持 144；大标题下移
    const hr = sig.headerRule || { style: "solid", color: "accent", w: 760, h: 3 };
    const ruleColor = C[hr.color] || hr.color || C.accent;
    let rw = hr.w || 760;
    if (hr.track) rw = Math.max(520, Math.min(1180, Math.round((title || "").length * (titleCJK ? 90 : 52))));
    if (hr.style === "solid") {
      rect(slide, 96, ruleY, rw, hr.h || 3, { fill: ruleColor });
    } else {                                   // dash / dotted / line：虚线（CTN 复刻用 lgDash + 0.25pt + #0070C0）
      line(slide, 96, ruleY + 1, 96 + rw, ruleY + 1, { color: ruleColor, width: hr.weight || hr.h || 1.4, dash: hr.dash || "sysDot" });
    }
    const subColor = C[sig.subtitleColor] || sig.subtitleColor || C.mute;
    if (subtitle) addText(slide, 96, ruleY + 20, 1500, 34, subtitle, { size: sig.subtitleSize || 18, color: subColor, fontFace: /[一-鿿]/.test(subtitle) ? F.cn : F.en });
    if (!opts.noLogo) logo(slide);
    return ruleY + (subtitle ? 58 : 18);   // 内容可安全起始的 Y（大标题主题更靠下）；顶部对齐的组件应据此排版
  }

  // 页脚：Base=实心红条；Global=右下角灰色 WESTWELL 字标 + 钢蓝小线（参考 CTN/FMS）；
  // 也支持 thin（细线）/ none。
  function footer(slide, data = {}) {
    const f = (theme.signature && theme.signature.footer) || { style: "bar", color: "accent" };
    if (f.style === "none") return;
    if (f.style === "image" && f.img) { slide.addImage({ path: f.img, x: U(f.x ?? 23), y: U(f.y ?? 987), w: U(f.w ?? 1806), h: U(f.h ?? 63) }); return; }
    if (f.style === "wordmark") return footerWordmark(slide, f);
    const col = C[f.color] || C.accent;
    if (f.style === "thin") line(slide, 96, 1000, 1824, 1000, { color: col, width: 1.5 });
    else rect(slide, 56, 996, 1808, 4, { fill: col });
  }

  // 右下角灰色 WESTWELL 字标 + "FROM HUMAN TO HUMAN" + 左侧钢蓝小线（对齐 CTN/FMS 页脚）。
  function footerWordmark(slide, f) {
    const brand = theme.brand || {};
    const name = brand.nameEN || "WESTWELL";
    addText(slide, 1224, 988, 600, 40, name, { size: 30, color: "8C8C8C", bold: true, align: "right", fontFace: F.en, fit: "none", charSpacing: 3 });
    const tag = brand.footerTagline;
    if (tag) addText(slide, 1224, 1034, 600, 20, tag, { size: 11, color: "9A9A9A", align: "right", fontFace: F.en, fit: "none", charSpacing: 2 });
    line(slide, 650, 1044, 1612, 1044, { color: f.accentLine || "6496B9", width: 1.2 }); // 半幅钢蓝线，止于字标左侧（参考 FMS）
  }

  // 封面分发：按 theme.signature.cover（或 data.coverStyle 覆盖）选构图。
  //   warm-right    —— Leander Base：暖白底 + 右对齐红标题（默认）
  //   photo-dark    —— Leander Global：项目提供的深色大图 + 白字标题 + azure 强调
  //   white-minimal —— 通用：干净白底 + 海军蓝标题 + 点状 azure 线（FMS/CTN 风）
  function cover(slide, data) {
    const sig = theme.signature || {};
    const style = data.coverStyle || sig.cover || "warm-right";
    if (style === "photo-dark") return coverPhotoDark(slide, data, sig);
    if (style === "white-minimal") return coverWhiteMinimal(slide, data, sig);
    return coverWarmRight(slide, data);
  }

  function coverWarmRight(slide, data) {
    slide.background = { color: C.bg };
    const brand = theme.brand || {};
    logo(slide);
    addText(slide, 520, 330, 1200, 96, data.title, { size: 64, color: C.accent, bold: true, align: "right" });
    const subCJK = /[一-鿿]/.test(data.subtitle || "");
    if (data.subtitle) addText(slide, 520, 432, 1200, 50, data.subtitle, { size: 30, color: C.accent, bold: true, align: "right", fontFace: subCJK ? F.cn : F.en, fit: "none" });
    const tagline = data.tagline || brand.tagline;
    if (tagline) addText(slide, 520, 690, 1200, 44, tagline, { size: 30, color: C.text, bold: true, align: "right", fontFace: F.en });
    const tagSub = data.taglineSub || brand.taglineSub;
    if (tagSub) addText(slide, 600, 742, 1120, 56, tagSub, { size: 14, color: C.faint, align: "right", fontFace: F.en, lineSpacingMultiple: 1.2 });
    if (data.date) addText(slide, 104, 900, 800, 36, data.date, { size: 16, color: C.mute });
    footer(slide);
  }

  // 深色项目大图封面。共享 Skill 不提供行业场景；由 data.image 注入，无图则阻断。
  function coverPhotoDark(slide, data, sig) {
    const L = theme.ppt.layout;
    const brand = theme.brand || {};
    const img = data.image || sig.coverPhoto;
    if (!img) throw new Error("coverStyle=photo-dark requires a project-approved data.image");
    slide.addImage({ path: img, x: 0, y: 0, w: L.width, h: L.height });
    // 右上角白色字标（深底用文字字标，避免深色 logo 不可见）
    addText(slide, 1300, 78, 480, 40, brand.nameEN || "WESTWELL", { size: 20, color: "FFFFFF", bold: true, align: "right", fontFace: F.en, fit: "none" });
    // 标题（azure 亮蓝），左上清爽区
    const titleCJK = /[一-鿿]/.test(data.title || "");
    addText(slide, 96, 170, 1320, 110, data.title, { size: 72, color: C.accent, bold: true, align: "left", fontFace: titleCJK ? F.cn : F.en, fit: "none" });
    const subCJK = /[一-鿿]/.test(data.subtitle || "");
    if (data.subtitle) addText(slide, 100, 300, 1240, 90, data.subtitle, { size: 24, color: "FFFFFF", align: "left", fontFace: subCJK ? F.cn : F.en, fit: "none", lineSpacingMultiple: 1.2 });
    const tagline = data.tagline || brand.tagline;
    if (tagline) addText(slide, 100, 898, 900, 42, tagline, { size: 22, color: C.accent, bold: true, align: "left", fontFace: F.en, fit: "none" });
    if (data.date) addText(slide, 100, 950, 700, 28, data.date, { size: 14, color: "9AA7B4", align: "left", fontFace: F.en, fit: "none" });
  }

  // 干净白底极简封面（海军蓝标题 + 点状 azure 线 + 小 logo）。
  function coverWhiteMinimal(slide, data, sig) {
    slide.background = { color: C.bg };
    const brand = theme.brand || {};
    logo(slide);
    const titleCJK = /[一-鿿]/.test(data.title || "");
    addText(slide, 104, 360, 1640, 116, data.title, { size: 84, color: C.primary, bold: true, align: "left", fontFace: titleCJK ? F.cn : F.en, fit: "none" });
    const sig2 = theme.signature || {};
    const hr2 = sig2.headerRule || {};
    const ruleColor = C[hr2.color] || hr2.color || C.primary;
    line(slide, 108, 502, 1028, 502, { color: ruleColor, width: 0.75, dash: hr2.dash || "lgDash" });   // 复刻 CTN 标题线样式
    const subCJK = /[一-鿿]/.test(data.subtitle || "");
    if (data.subtitle) addText(slide, 108, 524, 1500, 52, data.subtitle, { size: 28, color: C[sig2.subtitleColor] || sig2.subtitleColor || C.blue, align: "left", fontFace: subCJK ? F.cn : F.en, fit: "none" });
    const tagline = data.tagline || brand.tagline;
    if (tagline) addText(slide, 108, 898, 900, 42, tagline, { size: 22, color: C.accent, bold: true, align: "left", fontFace: F.en, fit: "none" });
    if (data.date) addText(slide, 100, 950, 700, 28, data.date, { size: 14, color: C.mute, align: "left", fontFace: F.en, fit: "none" });
    footer(slide);
  }

  // 封底分发：按 theme.signature.closing（或 data.closingStyle 覆盖）选构图。
  // data.slogan 可为字符串，或 [{text, hot}] 富文本数组（hot=true 用强调色）。
  function closing(slide, data) {
    const sig = theme.signature || {};
    const style = data.closingStyle || sig.closing || "center-warm";
    if (style === "photo-dark") return closingPhotoDark(slide, data, sig);
    if (style === "white-minimal") return closingWhite(slide, data);
    return closingCenterWarm(slide, data);
  }

  // 白底封底（呼应白底封面）：居中海军蓝+azure 口号 + 居中点状海军蓝线 + azure 标语 + 字标页脚。
  function closingWhite(slide, data) {
    slide.background = { color: C.bg };
    const brand = theme.brand || {};
    logo(slide);
    const runs = Array.isArray(data.slogan)
      ? data.slogan.map(r => ({ text: r.text, options: { color: r.hot ? C.accent : C.primary, bold: true } }))
      : [{ text: data.slogan || "", options: { color: C.primary, bold: true } }];
    slide.addText(runs, {
      x: U(260), y: U(402), w: U(1400), h: U(110),
      fontFace: F.cn, fontSize: PT(54), align: "center", valign: "middle", margin: 0, fit: "shrink"
    });
    const sig = theme.signature || {};
    const hr3 = sig.headerRule || {};
    line(slide, 760, 540, 1160, 540, { color: C[hr3.color] || hr3.color || C.primary, width: 0.75, dash: hr3.dash || "lgDash" });
    const tagline = data.tagline || brand.tagline;
    if (tagline) addText(slide, 360, 566, 1200, 44, tagline, { size: 26, color: C.accent, bold: true, align: "center", fontFace: F.en });
    footer(slide);
  }

  function closingCenterWarm(slide, data) {
    slide.background = { color: C.bg };
    const brand = theme.brand || {};
    logo(slide);
    const runs = Array.isArray(data.slogan)
      ? data.slogan.map(r => ({ text: r.text, options: { color: r.hot ? C.accent : C.primary, bold: true } }))
      : [{ text: data.slogan || "", options: { color: C.primary, bold: true } }];
    slide.addText(runs, {
      x: U(360), y: U(430), w: U(1200), h: U(96),
      fontFace: F.cn, fontSize: PT(54), align: "center", valign: "middle", margin: 0, fit: "shrink"
    });
    rect(slide, 810, 548, 300, 3, { fill: C.primary });
    const tagline = data.tagline || brand.tagline;
    if (tagline) addText(slide, 360, 576, 1200, 44, tagline, { size: 26, color: C.accent, bold: true, align: "center", fontFace: F.en });
    footer(slide);
  }

  // 深色封底：项目大图 + 居中白色口号（azure 强调）+ azure 分隔线 + 标语 + 白字标。
  function closingPhotoDark(slide, data, sig) {
    const L = theme.ppt.layout;
    const brand = theme.brand || {};
    const img = data.image || sig.coverPhoto;
    if (!img) throw new Error("closingStyle=photo-dark requires a project-approved data.image");
    slide.addImage({ path: img, x: 0, y: 0, w: L.width, h: L.height });
    addText(slide, 1300, 78, 480, 40, brand.nameEN || "WESTWELL", { size: 20, color: "FFFFFF", bold: true, align: "right", fontFace: F.en, fit: "none" });
    const runs = Array.isArray(data.slogan)
      ? data.slogan.map(r => ({ text: r.text, options: { color: r.hot ? C.accent : "FFFFFF", bold: true } }))
      : [{ text: data.slogan || "", options: { color: "FFFFFF", bold: true } }];
    slide.addText(runs, {
      x: U(260), y: U(404), w: U(1400), h: U(110),
      fontFace: F.cn, fontSize: PT(50), align: "center", valign: "middle", margin: 0, fit: "shrink"
    });
    rect(slide, 810, 540, 300, 3, { fill: C.accent });
    const tagline = data.tagline || brand.tagline;
    if (tagline) addText(slide, 360, 572, 1200, 44, tagline, { size: 24, color: C.accent, bold: true, align: "center", fontFace: F.en, fit: "none" });
  }

  function metricCards(slide, data) {
    header(slide, data.title, data.subtitle);
    const w = 538, g = 38, y = 270;
    data.items.slice(0, 3).forEach((item, i) => {
      const x = 96 + i * (w + g);
      rect(slide, x, y, w, 270, { fill: C.surface, line: C.line, round: true, shadow: true });
      rect(slide, x, y, w, 6, { fill: i === 0 ? C.accent : C.primary });
      addText(slide, x + 30, y + 42, 260, 70, item.value, { size: 58, color: i === 0 ? C.accent : C.primary, bold: true, fontFace: F.en });
      addText(slide, x + 30, y + 126, w - 60, 34, item.label, { size: 22, color: C.primary, bold: true });
      addText(slide, x + 30, y + 176, w - 60, 62, item.desc, { size: 16, color: C.mute, lineSpacingMultiple: 1.2 });
    });
    if (data.caveat) caveatBand(slide, data.caveat, 646);
    footer(slide);
  }

  function bigWordCardMatrix(slide, data) {
    header(slide, data.title, data.subtitle);
    addText(slide, 108, 286, 460, 140, data.words.join("\n"), { size: 58, color: C.primary, bold: true, lineSpacingMultiple: 0.88 });
    rect(slide, 108, 520, 6, 88, { fill: C.accent });
    addText(slide, 136, 522, 420, 74, data.summary, { size: 18, color: C.text, lineSpacingMultiple: 1.25 });
    rect(slide, 642, 244, 1, 540, { fill: C.line });
    data.cards.slice(0, 4).forEach((card, i) => {
      const x = 724 + (i % 2) * 440;
      const y = 286 + Math.floor(i / 2) * 210;
      const hot = i === 0;
      rect(slide, x, y, 390, 160, { fill: C.surface, line: C.line, round: true, shadow: true });
      rect(slide, x, y, 390, 6, { fill: hot ? C.accent : C.primary });
      addText(slide, x + 26, y + 28, 48, 36, String(i + 1).padStart(2, "0"), { size: 20, color: hot ? C.accent : C.primary, bold: true, fontFace: F.en });
      addText(slide, x + 86, y + 28, 260, 30, card.title, { size: 22, color: hot ? C.accent : C.primary, bold: true });
      addText(slide, x + 86, y + 72, 260, 48, card.desc, { size: 15, color: C.mute, lineSpacingMultiple: 1.15 });
    });
    footer(slide);
  }

  // 四列机制。全高列卡填满正文；同级统一藏蓝，仅 data.focus 那列用红色焦点（配色=语义）。
  // 中部视觉：item.img（透明 PNG）优先贴图融入卡面；缺图回退 item.icon 矢量图标。
  function fourColumnMechanism(slide, data) {
    header(slide, data.title, data.subtitle);
    const items = data.items.slice(0, 4), n = items.length || 1;
    const gap = 28, cw = (1728 - (n - 1) * gap) / n, top = 252, h = 624;
    items.forEach((item, i) => {
      const x = 96 + i * (cw + gap);
      const focal = item.accent === true || data.focus === i;
      const col = focal ? C.accent : C.primary;
      const soft = focal ? C.accentSoft : C.surface2;
      rect(slide, x, top, cw, h, { fill: C.surface, line: focal ? C.accent : C.line, lineWidth: focal ? 1.6 : 1, round: true, shadow: true });
      rect(slide, x, top, cw, 6, { fill: col });
      addText(slide, x + 28, top + 34, cw - 56, 22, String(i + 1).padStart(2, "0"), { size: 16, color: C.faint, bold: true, fontFace: F.en });
      addText(slide, x + 28, top + 64, cw - 56, 34, item.title, { size: 24, color: col, bold: true });
      rect(slide, x + 28, top + 112, 72, 5, { fill: col });
      if (item.img && fs.existsSync(item.img)) {
        const s = Math.min(196, cw - 80);
        slide.addImage({ path: item.img, x: U(x + cw / 2 - s / 2), y: U(top + 250 - s / 2), w: U(s), h: U(s) });
      } else {
        icon(pptx, slide, U, x + cw / 2, top + 250, item.icon || "document", { color: col, soft });
      }
      addText(slide, x + 28, top + 334, cw - 56, 150, item.desc, { size: 17, color: C.text, lineSpacingMultiple: 1.42 });
      rect(slide, x + 28, top + h - 78, cw - 56, 54, { fill: soft, line: focal ? C.accent : C.line, round: true });
      addText(slide, x + 28, top + h - 65, cw - 56, 28, item.close, { size: 17, color: col, bold: true, align: "center" });
    });
    footer(slide);
  }

  // 分页页（章节过渡）分发：按 theme.signature.divider 选构图。
  //   big-number      —— Leander Base：大号灰字 + 红标题 + 红线 + 关键词 chip
  //   white-underline —— Leander Global：白底 + 海军蓝粗体下划线标题 + 蓝副标题（参考 FMS）
  // data:{ number?/eyebrow?, title, subtitle?, keywords?(仅 base) }
  function sectionDivider(slide, data) {
    const v = (theme.signature && theme.signature.divider) || "big-number";
    if (v === "white-underline") return sectionDividerUnderline(slide, data);
    return sectionDividerBigNumber(slide, data);
  }

  // 对外分页页：白底、海军蓝粗体标题 + 实心下划线、蓝副标题，右下角字标（对齐 FMS WellFMS Architecture 页）。
  function sectionDividerUnderline(slide, data) {
    slide.background = { color: C.bg };
    logo(slide);
    const X = 120;                                              // 左移靠近版心左缘（参考 FMS）
    const titleCJK = /[一-鿿]/.test(data.title || "");
    if (data.number || data.eyebrow) {
      addText(slide, X, 388, 1000, 28, data.eyebrow || ("SECTION " + data.number), { size: 16, color: C.faint, bold: true, align: "left", fontFace: F.en, fit: "none", charSpacing: 3 });
    }
    addText(slide, X, 446, 1560, 100, data.title, { size: 64, color: C.primary, bold: true, align: "left", fontFace: titleCJK ? F.cn : F.en, fit: "none" });
    const uw = Math.min(1380, Math.round(80 + (data.title || "").length * (titleCJK ? 64 : 34)));
    rect(slide, X + 2, 562, uw, 4, { fill: C.primary });
    if (data.subtitle) {
      const subCJK = /[一-鿿]/.test(data.subtitle);
      addText(slide, X + 2, 590, 1400, 46, data.subtitle, { size: 28, color: C.blue, align: "left", fontFace: subCJK ? F.cn : F.en, fit: "none" });
    }
    footer(slide);
  }

  function sectionDividerBigNumber(slide, data) {
    slide.background = { color: C.bg };
    addText(slide, 96, 132, 620, 250, String(data.number || "01"), {
      size: 150, color: C.line, bold: true, fontFace: F.en
    });
    rect(slide, 104, 520, 8, 112, { fill: C.accent });
    addText(slide, 144, 500, 1180, 76, data.title, { size: 50, color: C.accent, bold: true });
    if (data.subtitle) addText(slide, 146, 588, 1020, 42, data.subtitle, { size: 24, color: C.mute });
    (data.keywords || []).slice(0, 3).forEach((kw, i) => {
      const x = 144 + i * 260;
      rect(slide, x, 700, 210, 50, { fill: i === 0 ? C.accentSoft : C.surface2, line: i === 0 ? C.accent : C.line, round: true });
      addText(slide, x, 714, 210, 22, kw, { size: 17, color: i === 0 ? C.accent : C.primary, bold: true, align: "center" });
    });
    footer(slide);
  }

  function systemArchitectureCenter(slide, data) {
    header(slide, data.title, data.subtitle);
    const leftX = 110, centerX = 615, rightX = 1325, topY = 272;
    addText(slide, leftX, 222, 330, 28, data.inputTitle || "Inputs", { size: 18, color: C.primary, bold: true });
    addText(slide, rightX, 222, 330, 28, data.outputTitle || "Outputs", { size: 18, color: C.primary, bold: true });
    (data.inputs || []).slice(0, 5).forEach((t, i) => {
      const y = topY + i * 82;
      rect(slide, leftX, y, 330, 54, { fill: C.surface, line: C.line, round: true });
      addText(slide, leftX + 18, y + 15, 294, 22, t, { size: 16, color: C.text, bold: i === 0 });
      line(slide, leftX + 330, y + 27, centerX - 34, y + 27, { color: C.primary, width: 1.2, arrow: "triangle" });
    });
    rect(slide, centerX, 250, 560, 420, { fill: C.primary, line: C.primary, round: true, shadow: true });
    addText(slide, centerX + 42, 284, 476, 42, data.coreTitle || "Core Platform", { size: 30, color: "FFFFFF", bold: true, align: "center" });
    addText(slide, centerX + 70, 334, 420, 42, data.coreSubtitle || "", { size: 15, color: "DDE5FF", align: "center" });
    (data.modules || []).slice(0, 6).forEach((m, i) => {
      const x = centerX + 54 + (i % 2) * 246;
      const y = 412 + Math.floor(i / 2) * 72;
      rect(slide, x, y, 206, 44, { fill: i % 2 ? C.accentSoft : C.surface2, line: i % 2 ? C.accent : C.line, round: true });
      addText(slide, x + 12, y + 12, 182, 20, m, { size: 14, color: i % 2 ? C.accent : C.primary, bold: true, align: "center" });
    });
    (data.outputs || []).slice(0, 5).forEach((t, i) => {
      const y = topY + i * 82;
      line(slide, centerX + 560, y + 27, rightX, y + 27, { color: C.primary, width: 1.2, arrow: "triangle" });
      rect(slide, rightX, y, 330, 54, { fill: C.surface, line: C.line, round: true });
      addText(slide, rightX + 18, y + 15, 294, 22, t, { size: 16, color: C.text, bold: i === 0 });
    });
    footer(slide);
  }

  function hubSpokeCapability(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const modules = (data.modules && data.modules.length ? data.modules : [
      { title: "Intent", desc: "page purpose", icon: "target" },
      { title: "Structure", desc: "visual relation", icon: "layers", status: "key" },
      { title: "Evidence", desc: "source boundary", icon: "document" },
      { title: "QA", desc: "render check", icon: "shield" },
      { title: "Learning", desc: "promote rules", icon: "chart" }
    ]).slice(0, 6);
    const cx = 960, cy = 520, hubW = 360, hubH = 138;
    rect(slide, cx - hubW / 2, cy - hubH / 2, hubW, hubH, { fill: C.primary, line: C.primary, round: true, shadow: true });
    addText(slide, cx - hubW / 2 + 30, cy - 34, hubW - 60, 38, data.center || "Core", { size: 27, color: "FFFFFF", bold: true, align: "center", fit: "shrink" });
    if (data.centerSub) addText(slide, cx - hubW / 2 + 36, cy + 12, hubW - 72, 24, data.centerSub, { size: 13, color: "FFFFFF", align: "center", fit: "shrink" });
    const slots = [
      { x: 330, y: 318, side: "left" },
      { x: 960, y: 278, side: "top" },
      { x: 1590, y: 318, side: "right" },
      { x: 330, y: 718, side: "left" },
      { x: 960, y: 760, side: "bottom" },
      { x: 1590, y: 718, side: "right" }
    ];
    modules.forEach((m, i) => {
      const p = slots[i];
      const hot = m.status === "key" || m.focus === true || i === data.focus;
      const col = hot ? C.accent : C.primary;
      const boxW = 310, boxH = 92;
      const x = p.x - boxW / 2, y = p.y - boxH / 2;
      let sx = cx, sy = cy, ex = p.x, ey = p.y;
      if (p.side === "left") { sx = cx - hubW / 2; sy = cy; ex = x + boxW; ey = p.y; }
      if (p.side === "right") { sx = cx + hubW / 2; sy = cy; ex = x; ey = p.y; }
      if (p.side === "top") { sx = cx; sy = cy - hubH / 2; ex = p.x; ey = y + boxH; }
      if (p.side === "bottom") { sx = cx; sy = cy + hubH / 2; ex = p.x; ey = y; }
      line(slide, sx, sy, ex, ey, { color: hot ? C.accent : C.line, width: hot ? 1.6 : 1.1 });
      rect(slide, x, y, boxW, boxH, { fill: hot ? C.accentSoft : C.surface, line: hot ? C.accent : C.line, lineWidth: hot ? 1.4 : 1, round: true, shadow: true });
      icon(pptx, slide, U, x + 42, p.y, m.icon || "document", { color: col, soft: hot ? C.accentSoft : C.surface2 });
      addText(slide, x + 84, y + 24, boxW - 108, 22, m.title, { size: 17, color: col, bold: true, fit: "shrink" });
      if (m.desc) addText(slide, x + 84, y + 54, boxW - 108, 20, m.desc, { size: 11.5, color: C.mute, fit: "shrink" });
    });
    if (data.takeaway) caveatBand(slide, data.takeaway, 888);
    footer(slide);
  }

  function roadmapSwimlane(slide, data) {
    header(slide, data.title, data.subtitle);
    const left = 180, top = 250, laneH = 116, labelW = 170, stageW = 285;
    (data.stages || []).slice(0, 5).forEach((s, i) => {
      const x = left + labelW + i * stageW;
      rect(slide, x, 222, stageW - 24, 48, { fill: i === 0 ? C.accent : C.primary, round: true });
      addText(slide, x, 235, stageW - 24, 20, s, { size: 15, color: "FFFFFF", bold: true, align: "center" });
    });
    (data.lanes || []).slice(0, 4).forEach((lane, r) => {
      const y = top + r * laneH;
      rect(slide, left, y, labelW - 22, 76, { fill: r % 2 ? C.surface2 : C.accentSoft, line: C.line, round: true });
      addText(slide, left + 14, y + 25, labelW - 50, 22, lane.name, { size: 16, color: r % 2 ? C.primary : C.accent, bold: true, align: "center" });
      (lane.items || []).slice(0, 5).forEach((it, i) => {
        const x = left + labelW + i * stageW;
        rect(slide, x, y, stageW - 24, 76, { fill: C.surface, line: C.line, round: true });
        addText(slide, x + 16, y + 14, stageW - 56, 42, it, { size: 13, color: C.text, lineSpacingMultiple: 1.08 });
      });
    });
    if (data.current) {
      const idx = Math.max(0, Math.min((data.stages || []).length - 1, data.current));
      const x = left + labelW + idx * stageW + (stageW - 24) / 2;
      line(slide, x, 206, x, 250 + (data.lanes || []).length * laneH - 32, { color: C.accent, width: 2, dash: "dash" });
    }
    footer(slide);
  }

  function caveatBand(slide, text, y = 760) {
    rect(slide, 96, y, 1728, 66, { fill: C.surface, line: C.line, round: true });
    addText(slide, 128, y + 18, 1664, 28, text, { size: 16, color: C.primary, bold: true, align: "center" });
  }

  // 横向步进导航 / 汇报路线（agenda）。steps:[{title, desc, points?:[]}]，current 高亮（缺省不高亮）。
  // 卡片内含小标题→说明→要点列表，按内容填充，避免无意义留白。
  function stepNav(slide, data) {
    header(slide, data.title, data.subtitle);
    const items = (data.steps || []).slice(0, 5);
    const n = items.length || 1;
    const gap = 36, totalW = 1728, cardW = (totalW - (n - 1) * gap) / n;
    const anyDesc = items.some(s => s.desc);
    const maxPts = Math.max(0, ...items.map(s => (s.points || []).length));
    const pStartOff = anyDesc ? 142 : 84;
    const cardH = pStartOff + maxPts * 42 + 24;      // 卡片按内容定高
    const block = 64 + 34 + cardH;
    const top = Math.max(238, Math.round(238 + ((952 - 238) - block) / 2)); // 整块垂直居中
    const lineY = top + 32, cardY = top + 98;
    line(slide, 96 + cardW / 2, lineY, 96 + totalW - cardW / 2, lineY, { color: C.line, width: 2 });
    items.forEach((s, i) => {
      const x = 96 + i * (cardW + gap);
      const cx = x + cardW / 2;
      const hot = (data.current != null && i === data.current);
      const col = hot ? C.accent : C.primary;
      if (i < n - 1) line(slide, cx + 44, lineY, cx + cardW - 44, lineY, { color: C.faint, width: 1.6, arrow: "triangle" });
      rect(slide, cx - 32, lineY - 32, 64, 64, { fill: col, round: true, radius: 32 });
      addText(slide, cx - 32, lineY - 21, 64, 42, String(i + 1).padStart(2, "0"), { size: 24, color: "FFFFFF", bold: true, align: "center", fontFace: F.en });
      rect(slide, x, cardY, cardW, cardH, { fill: C.surface, line: hot ? col : C.line, lineWidth: hot ? 1.6 : 1, round: true, shadow: true });
      rect(slide, x, cardY, cardW, 6, { fill: col });
      addText(slide, x + 28, cardY + 28, cardW - 56, 34, s.title, { size: 23, color: col, bold: true });
      if (s.desc) addText(slide, x + 28, cardY + 76, cardW - 56, 60, s.desc, { size: 15, color: C.mute, lineSpacingMultiple: 1.26 });
      (s.points || []).slice(0, 4).forEach((p, j) => {
        const py = cardY + pStartOff + j * 42;
        rect(slide, x + 30, py + 9, 7, 7, { fill: col, round: true, radius: 3 });
        addText(slide, x + 50, py, cardW - 82, 34, p, { size: 14, color: C.text, lineSpacingMultiple: 1.12 });
      });
    });
    footer(slide);
  }

  // 痛点卡 + 后果（problem -> consequence）。items:[{icon, title, desc, consequence}]
  function painCards(slide, data) {
    header(slide, data.title, data.subtitle);
    const items = (data.items || []).slice(0, 3);
    const gap = 40, cardW = (1728 - (items.length - 1) * gap) / items.length, y = 392, h = 404;
    items.forEach((it, i) => {
      const x = 96 + i * (cardW + gap);
      rect(slide, x, y, cardW, h, { fill: C.surface, line: C.line, round: true, shadow: true });
      rect(slide, x, y, cardW, 6, { fill: C.accent });
      icon(pptx, slide, U, x + 66, y + 84, it.icon || "document", { color: C.accent, soft: C.accentSoft });
      addText(slide, x + 120, y + 54, cardW - 152, 28, "0" + (i + 1), { size: 18, color: C.faint, bold: true, fontFace: F.en });
      addText(slide, x + 120, y + 84, cardW - 152, 36, it.title, { size: 24, color: C.primary, bold: true });
      addText(slide, x + 32, y + 154, cardW - 64, 120, it.desc, { size: 16, color: C.mute, lineSpacingMultiple: 1.32 });
      rect(slide, x + 24, y + h - 80, cardW - 48, 56, { fill: C.accentSoft, line: C.accent, round: true });
      addText(slide, x + 44, y + h - 66, cardW - 88, 30, "→ " + it.consequence, { size: 16, color: C.accent, bold: true });
    });
    footer(slide);
  }

  // 闭环流程（cycle）。center 文案 + steps:[{title, desc}]（4 步），顺时针箭头；可选右侧 note 说明。
  function cycleLoop(slide, data) {
    header(slide, data.title, data.subtitle);
    const cx = 600, cy = 576, R = 312;
    const pts = [[cx, cy - R], [cx + R, cy], [cx, cy + R], [cx - R, cy]];
    const cols = [C.primary, C.primary, C.primary, C.primary]; // 同级阶段统一藏蓝；焦点由中心 hub 承担
    const steps = (data.steps || []).slice(0, 4);
    const arrow = (a, b) => {
      const [x1, y1] = pts[a], [x2, y2] = pts[b];
      line(slide, x1 + (x2 - x1) * 0.24, y1 + (y2 - y1) * 0.24, x1 + (x2 - x1) * 0.76, y1 + (y2 - y1) * 0.76, { color: C.faint, width: 2, arrow: "triangle" });
    };
    arrow(0, 1); arrow(1, 2); arrow(2, 3); arrow(3, 0);
    rect(slide, cx - 132, cy - 66, 264, 132, { fill: C.primary, round: true, shadow: true });
    addText(slide, cx - 120, cy - 44, 240, 88, data.center || "闭环", { size: 24, color: "FFFFFF", bold: true, align: "center", valign: "middle", lineSpacingMultiple: 1.15 });
    steps.forEach((s, i) => {
      const [x, y] = pts[i];
      const col = cols[i];
      rect(slide, x - 152, y - 50, 304, 100, { fill: C.surface, line: col, lineWidth: 1.6, round: true, shadow: true });
      rect(slide, x - 152, y - 50, 6, 100, { fill: col });
      addText(slide, x - 130, y - 36, 268, 30, (i + 1) + " · " + s.title, { size: 19, color: col, bold: true });
      addText(slide, x - 130, y + 2, 268, 40, s.desc, { size: 14, color: C.mute, lineSpacingMultiple: 1.12 });
    });
    if (data.note) {
      // 说明块随环图垂直居中，避免右侧高悬 + 下方大片死白
      const lines = String(data.note).split("\n").length;
      const noteH = lines * 27;
      const tY = Math.max(280, Math.round(cy - (44 + noteH) / 2));
      line(slide, 1190, tY - 16, 1190, tY + 44 + noteH + 16, { color: C.line, width: 1.2 });
      addText(slide, 1230, tY, 594, 32, data.noteTitle || "说明", { size: 21, color: C.primary, bold: true });
      addText(slide, 1230, tY + 50, 594, noteH + 24, data.note, { size: 17, color: C.text, lineSpacingMultiple: 1.45 });
    }
    footer(slide);
  }

  // 架构图 A：系统分层架构（系统视角）。单色克制——层 banner 默认藏蓝，data.focus / card.focus 焦点用红。
  // layers:[{ label?, sub?, focus?, h?, cards?:[{title,sub?,desc?,focus?}], groups?:[{title?,cells:[{title}]}], text? }]
  function archLayered(slide, data) {
    const EN = /[A-Za-z]/;
    const cTop = header(slide, data.title, data.subtitle) || 214;
    const X = 96, W = 1728;
    const layers = data.layers || [];
    // 预测整叠高度，使分层在正文区垂直居中（避免顶部堆叠、底部死白）。
    let total = 0;
    layers.forEach(L => {
      if (L.label) total += (L.sub ? 60 : 48) + 12;
      const ch = L.h || 0;
      if (L.cards || L.groups) total += ch + 14;
      else if (L.text) total += (ch || 36) + 14;
    });
    const top0 = Math.max(214, cTop);
    let y = Math.max(top0, Math.round(top0 + ((952 - top0) - total) / 2));
    layers.forEach(L => {
      if (L.label) {
        const focusInk = L.focus ? C.accent : C.primary;
        // 结构填充按主题自适应:solid=深色实底白字;soft=浅底深字(高键主题,不发黑);outline=白底描边深字(线框主题)
        const ss = (theme.signature && theme.signature.structStyle) || "solid";
        let bandFill = focusInk, bandText = "FFFFFF", bandSub = C.inverseMuted, bandLine = null, bandLW = 0;
        if (ss === "soft") { bandFill = L.focus ? C.accentSoft : C.surface2; bandText = focusInk; bandSub = C.mute; bandLine = L.focus ? C.accent : C.line; bandLW = 1; }
        else if (ss === "outline") { bandFill = C.surface; bandText = focusInk; bandSub = C.mute; bandLine = focusInk; bandLW = L.focus ? 1.6 : 1.2; }
        const bh = L.sub ? 60 : 48;
        const bandOpts = { fill: bandFill, round: true };
        if (bandLine) { bandOpts.line = bandLine; bandOpts.lineWidth = bandLW; }
        rect(slide, X, y, W, bh, bandOpts);
        addText(slide, X + 24, y + (L.sub ? 8 : 11), W - 48, 28, L.label, { size: 20, color: bandText, bold: true, align: "center" });
        if (L.sub) addText(slide, X, y + 36, W, 20, L.sub, { size: 13, color: bandSub, align: "center" });
        y += bh + 12;
      }
      const ch = L.h || 0;
      if (L.cards) {
        const n = L.cards.length, g = 18, cw = (W - (n - 1) * g) / n;
        L.cards.forEach((c, i) => {
          const cx = X + i * (cw + g);
          const col = c.focus ? C.accent : C.primary;
          rect(slide, cx, y, cw, ch, { fill: C.surface, line: c.focus ? C.accent : C.line, lineWidth: c.focus ? 1.6 : 1, round: true, shadow: true });
          rect(slide, cx, y, cw, 5, { fill: col });
          addText(slide, cx + 18, y + 18, cw - 36, 30, c.title, { size: 20, color: col, bold: true, fontFace: EN.test(c.title) ? F.en : F.cn });
          if (c.sub) addText(slide, cx + 18, y + 54, cw - 36, 24, c.sub, { size: 13, color: C.primary, bold: true });
          if (c.desc) {
            const dY = c.sub ? 84 : 54;                  // 无 sub 时上移，矮卡也有正常行高
            const dH = Math.max(26, ch - dY - 16);       // 文本框高度兜底，避免矮卡把正文压成极小字
            addText(slide, cx + 18, y + dY, cw - 36, dH, c.desc, { size: 14, color: C.mute, lineSpacingMultiple: 1.22 });
          }
        });
        y += ch + 14;
      } else if (L.groups) {
        const n = L.groups.length, g = 18, gw = (W - (n - 1) * g) / n;
        L.groups.forEach((grp, i) => {
          const gx = X + i * (gw + g);
          rect(slide, gx, y, gw, ch, { line: C.line, round: true });
          if (grp.title) addText(slide, gx, y + 12, gw, 24, grp.title, { size: 15, color: C.primary, bold: true, align: "center" });
          const cy0 = y + (grp.title ? 46 : 14);
          const cells = grp.cells || [];
          const cellH = (ch - (grp.title ? 58 : 26) - (cells.length - 1) * 8) / cells.length;
          cells.forEach((cell, j) => {
            const yy = cy0 + j * (cellH + 8);
            rect(slide, gx + 12, yy, gw - 24, cellH, { fill: C.surface2, line: C.line, round: true });
            addText(slide, gx + 12, yy + cellH / 2 - 11, gw - 24, 22, cell.title, { size: 13, color: C.text, align: "center" });
          });
        });
        y += ch + 14;
      } else if (L.text) {
        addText(slide, X, y, W, ch || 36, L.text, { size: 15, color: C.text, align: "center", lineSpacingMultiple: 1.3 });
        y += (ch || 36) + 14;
      }
    });
    footer(slide);
  }

  // 架构图 B：场景双擎流（业务 / 场景视角）。中心双核 ✕ 联动 + 左右两翼流向 + 底部 AI 底座赋能。
  // data:{ topBand?, centerUp?, center:{left:{name,desc,icon?},right:{...},mid?,link?}, leftWing:{top?,flow?,items:[{title,sub?,icon?}]}, rightWing:{...}, base?:{core,feeders:[],boost?} }
  // center.link 覆盖中心「联动」文案，base.boost 覆盖底座「AI 赋能」文案（英文/对外材料用，缺省中文）。
  // glyph 取自统一图标集，差异化以避免重复。
  function archDualEngine(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 196;
    const d = Math.max(0, cTop - 196);                 // 大标题主题下整体顶部下移，避免与副标题/页眉重叠
    if (data.topBand) {
      rect(slide, 470, 196 + d, 980, 50, { fill: C.accentSoft, line: C.accent, round: true });
      addText(slide, 470, 208 + d, 980, 30, data.topBand, { size: 19, color: C.accent, bold: true, align: "center" });
    }
    const cyC = 512, r = 100, ax = 806, bx = 1114, mx = (ax + bx) / 2;
    if (data.centerUp) {
      const upY = 258 + d, upH = Math.min(128, 404 - upY);
      shp(slide, shape.upArrow, 836, upY, 248, upH, { fill: C.accentSoft, line: C.accent });
      addText(slide, 856, upY + Math.max(20, upH / 2 - 32), 208, 64, data.centerUp, { size: 14, color: C.accent, bold: true, align: "center", valign: "middle", lineSpacingMultiple: 1.16 });
    }
    const glyph = (type, cx, cy, col) => {
      const wht = "FFFFFF";
      if (type === "gear") { shp(slide, shape.donut, cx - 19, cy - 19, 38, 38, { fill: col }); }
      else if (type === "box") { shp(slide, shape.cube, cx - 17, cy - 15, 34, 30, { fill: col }); }
      else if (type === "coin") { shp(slide, shape.ellipse, cx - 18, cy - 18, 36, 36, { fill: col }); addText(slide, cx - 18, cy - 19, 36, 36, "¥", { size: 18, color: wht, bold: true, align: "center", valign: "middle" }); }
      else if (type === "data") { shp(slide, shape.can, cx - 15, cy - 18, 30, 36, { fill: col }); }
      else if (type === "chart") { [0, 1, 2].forEach(i => rect(slide, cx - 18 + i * 13, cy + 14 - (12 + i * 7), 10, 12 + i * 7, { fill: col })); }
      else if (type === "globe") { shp(slide, shape.ellipse, cx - 18, cy - 18, 36, 36, { fill: col }); line(slide, cx - 18, cy, cx + 18, cy, { color: wht, width: 1 }); shp(slide, shape.ellipse, cx - 8, cy - 18, 16, 36, { line: wht, lw: 1 }); }
      else if (type === "doc") { rect(slide, cx - 15, cy - 19, 30, 38, { fill: col, round: true, radius: 4 }); line(slide, cx - 8, cy - 6, cx + 8, cy - 6, { color: wht, width: 1.5 }); line(slide, cx - 8, cy + 3, cx + 8, cy + 3, { color: wht, width: 1.5 }); }
      else if (type === "hub") { shp(slide, shape.donut, cx - 19, cy - 19, 38, 38, { fill: col }); shp(slide, shape.ellipse, cx - 6, cy - 6, 12, 12, { fill: col }); }
      else if (type === "route") { line(slide, cx - 17, cy + 13, cx - 2, cy - 11, { color: col, width: 3 }); line(slide, cx - 2, cy - 11, cx + 17, cy + 9, { color: col, width: 3, arrow: "triangle" }); }
      else { shp(slide, shape.ellipse, cx - 18, cy - 18, 36, 36, { fill: col }); }
    };
    const wing = (cfg, side) => {
      const items = (cfg && cfg.items) || [];
      const n = items.length || 1, nh = 96, gap = 22, total = n * nh + (n - 1) * gap;
      const y0 = cyC - total / 2;
      const wx = side === "L" ? 150 : 1470, ww = 300, accent = side === "L" ? C.primary : C.blue;
      if (cfg && cfg.top) addText(slide, wx, y0 - 48, ww, 28, cfg.top, { size: 17, color: accent, bold: true, align: "center" });
      items.forEach((it, i) => {
        const ny = y0 + i * (nh + gap);
        rect(slide, wx, ny, ww, nh, { fill: C.surface, line: C.line, round: true, shadow: true });
        rect(slide, wx, ny, 6, nh, { fill: accent });
        glyph(it.icon, wx + 44, ny + nh / 2, accent);
        addText(slide, wx + 84, ny + (it.sub ? 20 : 34), ww - 100, 28, it.title, { size: 17, color: accent, bold: true });
        if (it.sub) addText(slide, wx + 84, ny + 52, ww - 100, 24, it.sub, { size: 12, color: C.mute });
      });
    };
    wing(data.leftWing, "L");
    wing(data.rightWing, "R");
    shp(slide, shape.rightArrow, 470, cyC - 42, 212, 84, { fill: C.accentSoft, line: C.accent });
    addText(slide, 470, cyC - 16, 202, 32, (data.leftWing && data.leftWing.flow) || "数据产生", { size: 16, color: C.accent, bold: true, align: "center" });
    shp(slide, shape.rightArrow, 1238, cyC - 42, 212, 84, { fill: C.accentSoft, line: C.accent });
    addText(slide, 1238, cyC - 16, 202, 32, (data.rightWing && data.rightWing.flow) || "方案输出", { size: 16, color: C.accent, bold: true, align: "center" });
    const core = (cx, fill, halo, d) => {
      shp(slide, shape.ellipse, cx - r - 13, cyC - r - 13, 2 * (r + 13), 2 * (r + 13), { fill: halo });
      shp(slide, shape.ellipse, cx - r, cyC - r, 2 * r, 2 * r, { fill, shadow: true });
      if (d.icon) glyph(d.icon, cx, cyC - 44, "FFFFFF");
      addText(slide, cx - r, cyC - 6, 2 * r, 32, d.name, { size: 20, color: "FFFFFF", bold: true, align: "center", fontFace: F.en });
      addText(slide, cx - r + 10, cyC + 30, 2 * r - 20, 44, d.desc, { size: 12.5, color: "EAF0FA", align: "center", lineSpacingMultiple: 1.12 });
    };
    core(ax, C.primary, "36468F", data.center.left);
    core(bx, C.blue, "5E97B6", data.center.right);
    shp(slide, shape.roundRect, mx - 48, cyC - 34, 96, 68, { fill: C.surface, line: C.accent, lw: 1.8, shadow: true });
    line(slide, mx - 30, cyC - 12, mx + 30, cyC - 12, { color: C.accent, width: 2, arrow: "triangle" });
    line(slide, mx + 30, cyC + 2, mx - 30, cyC + 2, { color: C.accent, width: 2, arrow: "triangle" });
    addText(slide, mx - 48, cyC + 8, 96, 22, (data.center && data.center.link) || "联动", { size: 14, color: C.accent, bold: true, align: "center" });
    if (data.center.mid) addText(slide, mx - 200, cyC + r + 16, 400, 26, data.center.mid, { size: 14, color: C.mute, bold: true, align: "center" });
    if (data.base) {
      const px = 480, pw = 960, py = 832, ph = 112;
      const ay = cyC + r + 22, ah = py - ay - 6;
      shp(slide, shape.upArrow, ax - 18, ay, 36, ah, { fill: C.blueSoft, line: C.blue });
      shp(slide, shape.upArrow, bx - 18, ay, 36, ah, { fill: C.blueSoft, line: C.blue });
      addText(slide, mx - 70, ay + ah / 2 - 14, 140, 28, data.base.boost || "AI 赋能", { size: 14, color: C.blue, bold: true, align: "center" });
      rect(slide, px, py, pw, ph, { fill: C.primary, round: true, shadow: true });
      shp(slide, shape.can, px + 26, py + 16, 58, 44, { fill: C.blue });
      addText(slide, px + 100, py + 22, pw - 130, 32, data.base.core, { size: 18, color: "FFFFFF", bold: true });
      const fs = data.base.feeders || [];
      const fpw = 210, fpg = 14, ftot = fs.length * fpw + (fs.length - 1) * fpg, fx0 = px + (pw - ftot) / 2;
      fs.forEach((f, i) => {
        const fx = fx0 + i * (fpw + fpg);
        rect(slide, fx, py + 64, fpw, 36, { fill: "24347A", line: C.blue, round: true });
        addText(slide, fx, py + 71, fpw, 22, f, { size: 13, color: C.inverseSubtle, bold: true, align: "center" });
      });
    }
    footer(slide);
  }

  // 横向流程时间线。steps:[{title, desc, key?}]，key=true=关键节点（红，语义高亮）；可选 data.takeaway 底部收束带。
  function processTimeline(slide, data) {
    header(slide, data.title, data.subtitle);
    const steps = (data.steps || []).slice(0, 8);
    const n = steps.length || 1;
    const x0 = 96, x1 = 1824, axisY = 502;
    const slot = (x1 - x0) / n;
    line(slide, x0 + slot / 2, axisY, x1 - slot / 2, axisY, { color: C.line, width: 2 });
    steps.forEach((s, i) => {
      const cx = x0 + slot / 2 + i * slot;
      const key = !!s.key;
      const col = key ? C.accent : C.primary;
      if (i < n - 1) line(slide, cx + 30, axisY, cx + slot - 30, axisY, { color: C.faint, width: 1.4, arrow: "triangle" });
      const above = i % 2 === 0;
      const cardW = slot - 32, cardH = 158;
      const cardX = cx - cardW / 2;
      const cardY = above ? axisY - 46 - cardH : axisY + 46;
      rect(slide, cardX, cardY, cardW, cardH, { fill: C.surface, line: key ? col : C.line, lineWidth: key ? 1.6 : 1, round: true, shadow: true });
      rect(slide, cardX, cardY, cardW, 5, { fill: col });
      addText(slide, cardX + 16, cardY + 20, cardW - 32, 28, s.title, { size: 16, color: col, bold: true });
      if (s.desc) addText(slide, cardX + 16, cardY + 56, cardW - 32, cardH - 72, s.desc, { size: 13, color: C.mute, lineSpacingMultiple: 1.2 });
      line(slide, cx, above ? cardY + cardH : axisY, cx, above ? axisY : cardY, { color: C.line, width: 1 });
      rect(slide, cx - 22, axisY - 22, 44, 44, { fill: col, round: true, radius: 22 });
      addText(slide, cx - 22, axisY - 13, 44, 26, String(i + 1), { size: 18, color: "FFFFFF", bold: true, align: "center", fontFace: F.en });
    });
    if (data.takeaway) caveatBand(slide, data.takeaway, 884);
    footer(slide);
  }

  // 状态机 / 生命周期。main:[{name,status,ops:[]}]。配色=状态语义：
  // current=强调色 draft=琥珀 ready=藏蓝 queued=灰 running=蓝 done=绿 failed=危险色 stopped=灰。
  // currentState 可按状态 name 或数组下标显式指定当前态；failed 永远只表示失败/异常。
  function stateFlow(slide, data) {
    header(slide, data.title, data.subtitle);
    const sc = s => ({ current: C.accent, draft: C.warn, ready: C.primary, queued: C.faint, running: C.blue, done: C.green, failed: C.danger, stopped: C.mute }[s] || C.primary);
    const main = (data.main || []).slice(0, 6);
    const currentState = data.currentState;
    const n = main.length || 1;
    const chipW = 232, chipH = 72, gap = (1728 - n * chipW) / Math.max(1, n - 1);
    const maxOps = Math.max(0, ...main.map(s => (s.ops || []).length));
    const cardH = 54 + maxOps * 50 + 24;             // 操作卡按内容定高
    const bodyBot = data.note ? 860 : 952;
    const block = chipH + 24 + cardH;
    const y = Math.max(238, Math.round(238 + ((bodyBot - 238) - block) / 2)); // 整块垂直居中
    main.forEach((s, i) => {
      const x = 96 + i * (chipW + gap);
      const isCurrent = s.status === "current" || currentState === s.name || currentState === i;
      const col = sc(isCurrent ? "current" : s.status);
      if (i < n - 1) line(slide, x + chipW + 8, y + chipH / 2, x + chipW + gap - 8, y + chipH / 2, { color: C.faint, width: 2, arrow: "triangle" });
      rect(slide, x, y, chipW, chipH, { fill: col, line: isCurrent ? col : undefined, lineWidth: isCurrent ? 2 : 0, round: true, shadow: true });
      if (isCurrent) addText(slide, x, y + 5, chipW, 14, "CURRENT", { size: 9, color: "FFFFFF", bold: true, align: "center", charSpacing: 1.4, fontFace: F.en });
      addText(slide, x, y + (isCurrent ? 27 : 22), chipW, 30, s.name, { size: isCurrent ? 19 : 21, color: "FFFFFF", bold: true, align: "center" });
      const cy = y + chipH + 24;
      rect(slide, x, cy, chipW, cardH, { fill: C.surface, line: C.line, round: true, shadow: true });
      rect(slide, x, cy, chipW, 5, { fill: col });
      addText(slide, x + 22, cy + 18, chipW - 44, 22, "可用操作", { size: 13, color: C.faint, bold: true });
      (s.ops || []).slice(0, 6).forEach((op, j) => {
        const oy = cy + 54 + j * 50;
        rect(slide, x + 22, oy + 8, 7, 7, { fill: col, round: true, radius: 3 });
        addText(slide, x + 40, oy, chipW - 62, 36, op, { size: 14, color: C.text, lineSpacingMultiple: 1.12 });
      });
    });
    if (data.note) caveatBand(slide, data.note, 884);
    footer(slide);
  }

  // 前后对照（before → after）。rows:[{old, neu}]；左列旧方式（灰），右列新方式（藏蓝+红强调）。
  function beforeAfter(slide, data) {
    header(slide, data.title, data.subtitle);
    const rows = (data.rows || []).slice(0, 6);
    const n = rows.length || 1;
    const top = 388, bottom = 900, rgap = 16, rh = (bottom - top - (n - 1) * rgap) / n;
    rect(slide, 96, 296, 820, 64, { fill: C.surface2, line: C.line, round: true });
    addText(slide, 96, 314, 820, 30, data.leftTitle || "旧方式", { size: 22, color: C.mute, bold: true, align: "center" });
    rect(slide, 1004, 296, 820, 64, { fill: C.primary, round: true });
    addText(slide, 1004, 314, 820, 30, data.rightTitle || "平台方式", { size: 22, color: "FFFFFF", bold: true, align: "center" });
    rows.forEach((r, i) => {
      const ry = top + i * (rh + rgap);
      rect(slide, 96, ry, 820, rh, { fill: C.surface, line: C.line, round: true });
      addText(slide, 128, ry, 760, rh, r.old, { size: 16, color: C.mute, valign: "middle", lineSpacingMultiple: 1.18 });
      line(slide, 930, ry + rh / 2, 998, ry + rh / 2, { color: C.accent, width: 2, arrow: "triangle" });
      rect(slide, 1004, ry, 820, rh, { fill: C.surface, line: C.accent, lineWidth: 1.4, round: true });
      rect(slide, 1004, ry, 6, rh, { fill: C.accent });
      addText(slide, 1044, ry, 760, rh, r.neu, { size: 16, color: C.primary, bold: true, valign: "middle", lineSpacingMultiple: 1.18 });
    });
    footer(slide);
  }

  // 分期路线 / 范围（phased roadmap）。phases:[{name,tag,status,items:[]}]。
  // 配色=时序语义：now=红（当期焦点） future=藏蓝（规划） excluded=灰（本期不做）。
  function roadmapPhases(slide, data) {
    header(slide, data.title, data.subtitle);
    const phases = (data.phases || []).slice(0, 3);
    const n = phases.length || 1;
    const gap = 24, colW = (1728 - (n - 1) * gap) / n;
    const pc = st => st === "now" ? C.accent : st === "excluded" ? C.mute : C.primary;
    const maxItems = Math.max(1, ...phases.map(p => (p.items || []).length));
    const headerH = 78, cardH = 32 + maxItems * 62 + 22; // 列卡按内容定高
    const block = headerH + 24 + cardH;
    const top = Math.max(246, Math.round(246 + ((950 - 246) - block) / 2)); // 整块垂直居中
    const cy = top + headerH + 24;
    phases.forEach((p, i) => {
      const x = 96 + i * (colW + gap);
      const col = pc(p.status);
      rect(slide, x, top, colW, headerH, { fill: col, round: true, shadow: true });
      addText(slide, x + 26, top + 18, colW - 140, 32, p.name, { size: 22, color: "FFFFFF", bold: true });
      if (p.tag) addText(slide, x + colW - 150, top + 20, 124, 28, p.tag, { size: 14, color: "FFFFFF", align: "right" });
      rect(slide, x, cy, colW, cardH, { fill: C.surface, line: C.line, round: true, shadow: true });
      rect(slide, x, cy, 6, cardH, { fill: col });
      (p.items || []).slice(0, 7).forEach((it, j) => {
        const oy = cy + 30 + j * 62;
        rect(slide, x + 30, oy + 9, 8, 8, { fill: col, round: true, radius: 4 });
        addText(slide, x + 52, oy, colW - 84, 54, it, { size: 16, color: C.text, lineSpacingMultiple: 1.22 });
      });
    });
    footer(slide);
  }

  // 三栏配置工作台示意（UI mock）。tree:[{name,sub,sel}] objects:[{x,y,label,hot}] attrs:[{k,v}]
  // 配色：结构藏蓝；属性卡（当前选中对象）为焦点用红；地图选中标记用红，其余藏蓝。
  function workbenchMock(slide, data) {
    header(slide, data.title, data.subtitle);
    const top = 250, h = 600;
    const lx = 96, lw = 372;
    rect(slide, lx, top, lw, h, { fill: C.surface, line: C.line, round: true, shadow: true });
    rect(slide, lx, top, lw, 50, { fill: C.primary, round: true });
    addText(slide, lx, top + 13, lw, 26, "对象树", { size: 18, color: "FFFFFF", bold: true, align: "center" });
    (data.tree || []).slice(0, 7).forEach((t, i) => {
      const ty = top + 74 + i * 72;
      if (t.sel) rect(slide, lx + 12, ty - 6, lw - 24, 58, { fill: C.accentSoft, line: C.accent, round: true });
      rect(slide, lx + 24, ty + 9, 8, 8, { fill: t.sel ? C.accent : C.primary, round: true, radius: 4 });
      addText(slide, lx + 44, ty, lw - 70, 28, t.name, { size: 16, color: t.sel ? C.accent : C.text, bold: true });
      if (t.sub) addText(slide, lx + 44, ty + 28, lw - 70, 22, t.sub, { size: 12, color: C.mute });
    });
    const mx = 492, mw = 856;
    rect(slide, mx, top, mw, h, { fill: C.surface, line: C.line, round: true, shadow: true });
    rect(slide, mx, top, mw, 50, { fill: C.primary, round: true });
    addText(slide, mx, top + 13, mw, 26, "地图预览（OSM 线框 + 作业对象）", { size: 18, color: "FFFFFF", bold: true, align: "center" });
    const cvx = mx + 24, cvy = top + 74, cvw = mw - 48, cvh = h - 168;
    rect(slide, cvx, cvy, cvw, cvh, { fill: C.surface2, line: C.line, round: true });
    line(slide, cvx + 24, cvy + 60, cvx + cvw - 24, cvy + 60, { color: C.primary, width: 3 });
    (data.objects || []).forEach(o => {
      const ox = cvx + o.x * cvw, oy = cvy + o.y * cvh;
      rect(slide, ox - 9, oy - 9, 18, 18, { fill: o.hot ? C.accent : C.primary, round: true, radius: 9 });
      addText(slide, ox + 16, oy - 12, 150, 24, o.label, { size: 13, color: o.hot ? C.accent : C.primary, bold: true });
    });
    addText(slide, cvx, cvy + cvh + 16, cvw, 24, "对象：船舶 · 岸桥 QC · VPB · 锁站 TS · 堆场 · 场桥 YC · 车辆 · 充电位", { size: 13, color: C.mute });
    const rx = 1372, rw = 452;
    rect(slide, rx, top, rw, h, { fill: C.surface, line: C.line, round: true, shadow: true });
    rect(slide, rx, top, rw, 50, { fill: C.accent, round: true });
    addText(slide, rx, top + 13, rw, 26, "属性卡 · 当前选中对象", { size: 18, color: "FFFFFF", bold: true, align: "center" });
    (data.attrs || []).slice(0, 6).forEach((a, i) => {
      const ay = top + 78 + i * 84;
      addText(slide, rx + 26, ay, rw - 52, 24, a.k, { size: 14, color: C.mute });
      addText(slide, rx + 26, ay + 26, rw - 52, 28, a.v, { size: 17, color: C.primary, bold: true });
      line(slide, rx + 26, ay + 64, rx + rw - 26, ay + 64, { color: C.line, width: 1 });
    });
    footer(slide);
  }

  // 任务/Workflow 配置：上=作业链路 flow（hot 高亮关键节点），下=比例规则卡。specs:[{title,value,desc}]
  function workflowConfig(slide, data) {
    header(slide, data.title, data.subtitle);
    addText(slide, 96, 246, 900, 28, data.flowTitle || "作业链路（Workflow）", { size: 18, color: C.primary, bold: true });
    const nodes = (data.flow || []).slice(0, 6), fn = nodes.length || 1;
    const nw = 232, fgap = (1728 - fn * nw) / Math.max(1, fn - 1), fy = 312, fh = 100;
    nodes.forEach((nd, i) => {
      const x = 96 + i * (nw + fgap), col = nd.hot ? C.accent : C.primary;
      if (i < fn - 1) line(slide, x + nw + 8, fy + fh / 2, x + nw + fgap - 8, fy + fh / 2, { color: C.faint, width: 2, arrow: "triangle" });
      rect(slide, x, fy, nw, fh, { fill: C.surface, line: col, lineWidth: 1.4, round: true, shadow: true });
      rect(slide, x, fy, 6, fh, { fill: col });
      addText(slide, x + 22, fy + 24, nw - 40, 28, nd.name, { size: 19, color: col, bold: true });
      if (nd.desc) addText(slide, x + 22, fy + 58, nw - 40, 28, nd.desc, { size: 13, color: C.mute });
    });
    addText(slide, 96, 484, 900, 28, data.specTitle || "任务生成规则（比例合计校验 100%）", { size: 18, color: C.primary, bold: true });
    const specs = (data.specs || []).slice(0, 4), sn = specs.length || 1;
    const sgap = 24, sw = (1728 - (sn - 1) * sgap) / sn, sy = 548, sh = 248;
    specs.forEach((sp, i) => {
      const x = 96 + i * (sw + sgap);
      rect(slide, x, sy, sw, sh, { fill: C.surface, line: C.line, round: true, shadow: true });
      rect(slide, x, sy, sw, 6, { fill: C.primary });
      addText(slide, x + 24, sy + 28, sw - 48, 30, sp.title, { size: 19, color: C.primary, bold: true });
      addText(slide, x + 24, sy + 74, sw - 48, 40, sp.value, { size: 26, color: C.primary, bold: true, fontFace: F.en });
      if (sp.desc) addText(slide, x + 24, sy + 132, sw - 48, 140, sp.desc, { size: 14, color: C.mute, lineSpacingMultiple: 1.32 });
    });
    if (data.note) caveatBand(slide, data.note, 880);
    footer(slide);
  }

  // 运行监控仪表盘（UI mock）。左=实时画面 markers:[{x,y,hot}]；右=进度面板 progress/moves/eta/start/speeds。
  function dashboardMock(slide, data) {
    header(slide, data.title, data.subtitle);
    const top = 250, lh = 556;
    const lx = 96, lw = 1080;
    rect(slide, lx, top, lw, lh, { fill: C.surface, line: C.line, round: true, shadow: true });
    rect(slide, lx, top, lw, 50, { fill: C.primary, round: true });
    addText(slide, lx + 22, top + 13, lw - 44, 26, "实时画面（SVG · 3~5s 刷新）", { size: 17, color: "FFFFFF", bold: true });
    const cvx = lx + 24, cvy = top + 74, cvw = lw - 48, cvh = lh - 150;
    rect(slide, cvx, cvy, cvw, cvh, { fill: C.surface2, line: C.line, round: true });
    line(slide, cvx + 24, cvy + 64, cvx + cvw - 24, cvy + 64, { color: C.primary, width: 3 });
    (data.markers || []).forEach(m => {
      const ox = cvx + m.x * cvw, oy = cvy + m.y * cvh;
      rect(slide, ox - 7, oy - 7, 14, 14, { fill: m.hot ? C.accent : C.blue, round: true, radius: 7 });
    });
    addText(slide, cvx + 16, cvy + cvh - 30, cvw - 32, 24, "岸桥 · VPB · 锁站 · 堆场 · 充电位 · IGV/AGV 实时位置（红 = 异常/作业中）", { size: 13, color: C.mute });
    const rx = 1208, rw = 616;
    rect(slide, rx, top, rw, lh, { fill: C.surface, line: C.line, round: true, shadow: true });
    rect(slide, rx, top, rw, 50, { fill: C.accent, round: true });
    addText(slide, rx + 22, top + 13, rw - 44, 26, "运行进度", { size: 17, color: "FFFFFF", bold: true });
    const pv = parseFloat(data.progress != null ? data.progress : 47);
    addText(slide, rx + 30, top + 78, rw - 60, 92, pv + "%", { size: 72, color: C.accent, bold: true, fontFace: F.en });
    rect(slide, rx + 30, top + 186, rw - 60, 22, { fill: C.surface2, line: C.line, round: true, radius: 11 });
    rect(slide, rx + 30, top + 186, (rw - 60) * Math.max(0, Math.min(1, pv / 100)), 22, { fill: C.accent, round: true, radius: 11 });
    const ms = [["已完成 moves", data.moves || "470 / 1000"], ["预计剩余 ETA", data.eta || "≈ 8 分钟"], ["开始时间", data.start || "10:24"]];
    ms.forEach((m, i) => {
      const my = top + 234 + i * 78;
      addText(slide, rx + 30, my, rw - 60, 24, m[0], { size: 14, color: C.mute });
      addText(slide, rx + 30, my + 26, rw - 60, 28, m[1], { size: 19, color: C.primary, bold: true });
      line(slide, rx + 30, my + 64, rx + rw - 30, my + 64, { color: C.line, width: 1 });
    });
    addText(slide, rx + 30, top + lh - 92, rw - 60, 24, "仿真倍速", { size: 14, color: C.mute });
    const sps = (data.speeds || ["1x", "2x", "4x", "8x", "16x"]).slice(0, 6);
    const sgp = 10, scw = (rw - 60 - (sps.length - 1) * sgp) / sps.length; // 按数量自适应，避免溢出面板
    sps.forEach((sp, i) => {
      const cx = rx + 30 + i * (scw + sgp);
      const hot = i === 0;
      rect(slide, cx, top + lh - 62, scw, 40, { fill: hot ? C.accentSoft : C.surface2, line: hot ? C.accent : C.line, round: true });
      addText(slide, cx, top + lh - 52, scw, 22, sp, { size: 14, color: hot ? C.accent : C.primary, bold: true, align: "center", fontFace: F.en });
    });
    if (data.note) caveatBand(slide, data.note, 880);
    footer(slide);
  }

  // === 从钢厂 / 园区 / 口岸方案类材料提炼的新组件 ============================
  // 共同约束：用 header() 返回的 cTop 起排；正文区 (cTop..940) 内容定高居中、铺满；
  // 同级一律藏蓝，单点 accent 焦点；配色=语义。

  // 能力 / 对比矩阵表。columns:[表头...]，rows:[{label, cells:[...], focus?}]，focusCol 高亮某列。
  // variant:"fill"(默认，藏蓝表头+斑马纹填充) | "line"(背景为底+细线分隔，即原 editorial.lineTable)。
  // cell 取值：字符串=文本；true/"ok"/"✓"=绿勾；false/"no"/"-"=灰横线；{level,of}=等级圆点。
  function capabilityMatrix(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const isLine = data.variant === "line";
    const cols = data.columns || [], rows = data.rows || [];
    const n = cols.length || 1, X = 96, W = 1728;
    const labelW = data.labelW || 380, cw = (W - labelW) / n, headH = isLine ? 56 : 68;
    const noteH = data.note ? 78 : 0;
    const availTop = cTop + 8, availBot = 942 - noteH;
    const rowH = Math.min(98, Math.max(50, Math.round((availBot - availTop - headH) / Math.max(1, rows.length))));
    const tableH = headH + rows.length * rowH;
    const y0 = Math.round(availTop + ((availBot - availTop) - tableH) / 2);
    let y = y0;
    if (!isLine) rect(slide, X, y, labelW, headH, { fill: C.surface2, line: C.line });
    if (data.corner) addText(slide, X + 18, y + headH / 2 - 12, labelW - 36, 24, data.corner, { size: 15, color: C.mute, bold: true, valign: "middle" });
    cols.forEach((c, i) => {
      const cx = X + labelW + i * cw, foc = data.focusCol === i;
      if (!isLine) rect(slide, cx, y, cw, headH, { fill: foc ? C.accent : C.primary });
      addText(slide, cx + (isLine ? 16 : 8), y + headH / 2 - 15, cw - 24, 30, c, { size: 17, color: isLine ? (foc ? C.accent : C.primary) : "FFFFFF", bold: true, align: isLine ? "left" : "center", valign: "middle", fontFace: /[一-鿿]/.test(c) ? F.cn : F.en });
    });
    y += headH;
    if (isLine) line(slide, X, y, X + W, y, { color: C.primary, width: 2 });   // 表头下实线
    const cellGlyph = (cell, cx, midY, cellW, foc) => {
      if (cell === true || cell === "ok" || cell === "✓") addText(slide, cx, midY - 17, cellW, 34, "✓", { size: 22, color: C.green, bold: true, align: "center", valign: "middle" });
      else if (cell === false || cell === "no" || cell === "-" || cell === "—") addText(slide, cx, midY - 16, cellW, 32, "—", { size: 20, color: C.faint, align: "center", valign: "middle" });
      else if (cell && typeof cell === "object" && cell.level != null) {
        const tot = cell.of || 3, dw = 16, g = 7, tw = tot * dw + (tot - 1) * g, sx = cx + (cellW - tw) / 2;
        for (let k = 0; k < tot; k++) shp(slide, shape.ellipse, sx + k * (dw + g), midY - 8, dw, dw, { fill: k < cell.level ? (foc ? C.accent : C.primary) : C.line });
      } else addText(slide, cx + (isLine ? 16 : 10), midY - 18, cellW - (isLine ? 28 : 20), 36, String(cell), { size: 15, color: foc ? C.accent : C.text, bold: foc, align: isLine ? "left" : "center", valign: "middle", lineSpacingMultiple: 1.06, fontFace: /[一-鿿]/.test(String(cell)) ? F.cn : F.en });
    };
    rows.forEach((r, ri) => {
      const band = ri % 2 ? C.surface : C.surface2;
      if (isLine) { if (r.focus) rect(slide, X, y, W, rowH, { fill: C.accentSoft }); }
      else rect(slide, X, y, labelW, rowH, { fill: r.focus ? C.accentSoft : band, line: C.line });
      addText(slide, X + 18, y + rowH / 2 - 15, labelW - 36, 30, r.label, { size: 16, color: r.focus ? C.accent : C.primary, bold: true, valign: "middle", fontFace: /[一-鿿]/.test(r.label || "") ? F.cn : F.en });
      (r.cells || []).slice(0, n).forEach((cell, ci) => {
        const cx = X + labelW + ci * cw, foc = data.focusCol === ci;
        if (!isLine) rect(slide, cx, y, cw, rowH, { fill: foc ? C.accentSoft : band, line: C.line });
        cellGlyph(cell, cx, y + rowH / 2, cw, foc);
      });
      if (isLine && ri < rows.length - 1) line(slide, X, y + rowH, X + W, y + rowH, { color: C.line, width: 1 });
      y += rowH;
    });
    if (isLine) line(slide, X + labelW, y0, X + labelW, y0 + tableH, { color: C.line, width: 1 });
    else rect(slide, X, y0, W, tableH, { line: C.line, lineWidth: 1.3 });
    if (data.note) caveatBand(slide, data.note, availBot + 10);
    footer(slide);
  }

  // 图标特性网格（2×3 / 自定义列）。items:[{icon,title,desc,focus?}]，data.cols 默认 3。
  function featureGrid(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const items = (data.items || []).slice(0, 6);
    const cols = data.cols || (items.length <= 4 ? 2 : 3), rows = Math.ceil(items.length / cols);
    const X = 96, W = 1728, gap = 28, cw = (W - (cols - 1) * gap) / cols;
    const availTop = cTop + 10, availBot = 942;
    const ch = Math.min(304, Math.round((availBot - availTop - (rows - 1) * gap) / rows));
    const blockH = rows * ch + (rows - 1) * gap;
    const y0 = Math.round(availTop + ((availBot - availTop) - blockH) / 2);
    items.forEach((it, i) => {
      const r = Math.floor(i / cols), c = i % cols, x = X + c * (cw + gap), y = y0 + r * (ch + gap);
      const foc = it.focus === true || data.focus === i, col = foc ? C.accent : C.primary;
      rect(slide, x, y, cw, ch, { fill: C.surface, line: foc ? C.accent : C.line, lineWidth: foc ? 1.6 : 1, round: true, shadow: true });
      rect(slide, x, y, cw, 6, { fill: col });
      shp(slide, shape.ellipse, x + 30, y + 34, 66, 66, { fill: foc ? C.accentSoft : C.surface2 });
      icon(pptx, slide, U, x + 63, y + 67, it.icon || "document", { color: col, soft: foc ? C.accentSoft : C.surface2 });
      addText(slide, x + 116, y + 50, cw - 144, 32, it.title, { size: 21, color: col, bold: true, fontFace: /[一-鿿]/.test(it.title || "") ? F.cn : F.en });
      addText(slide, x + 30, y + 120, cw - 60, ch - 140, it.desc, { size: 15, color: C.mute, lineSpacingMultiple: 1.34 });
    });
    footer(slide);
  }

  // 分层方案栈（云-边-端 / 平台层）。tiers:[{name,sub?,items:[chip...],focus?}]，左侧层标签 + 右侧组件芯片。
  function tierStack(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const tiers = data.tiers || [], X = 96, W = 1728, labelW = 300, gap = 16;
    const noteH = data.note ? 76 : 0, availTop = cTop + 12, availBot = 942 - noteH;
    const th = Math.min(156, Math.round((availBot - availTop - (tiers.length - 1) * gap) / Math.max(1, tiers.length)));
    const blockH = tiers.length * th + (tiers.length - 1) * gap;
    let y = Math.round(availTop + ((availBot - availTop) - blockH) / 2);
    tiers.forEach((t, i) => {
      const foc = t.focus === true, col = foc ? C.accent : C.primary;
      rect(slide, X, y, labelW, th, { fill: col, round: true });
      addText(slide, X + 22, y + th / 2 - (t.sub ? 28 : 14), labelW - 44, 32, t.name, { size: 21, color: "FFFFFF", bold: true, valign: "middle", fontFace: /[一-鿿]/.test(t.name || "") ? F.cn : F.en });
      if (t.sub) addText(slide, X + 22, y + th / 2 + 8, labelW - 44, 24, t.sub, { size: 13, color: C.inverseMuted });
      const rx = X + labelW + 18, rw = W - labelW - 18;
      rect(slide, rx, y, rw, th, { fill: C.surface, line: foc ? C.accent : C.line, lineWidth: foc ? 1.5 : 1, round: true });
      const chips = t.items || [], m = chips.length || 1, cg = 14;
      const chw = (rw - 32 - (m - 1) * cg) / m, chh = Math.min(70, th - 28);
      chips.forEach((c, j) => {
        const cxp = rx + 16 + j * (chw + cg), cyp = y + (th - chh) / 2;
        rect(slide, cxp, cyp, chw, chh, { fill: foc ? C.accentSoft : C.surface2, line: foc ? C.accent : C.line, round: true });
        addText(slide, cxp + 8, cyp + chh / 2 - 15, chw - 16, 30, c, { size: 15, color: foc ? C.accent : C.primary, bold: true, align: "center", valign: "middle", lineSpacingMultiple: 1.05, fontFace: /[一-鿿]/.test(String(c)) ? F.cn : F.en });
      });
      if (i < tiers.length - 1) line(slide, X + labelW / 2, y + th, X + labelW / 2, y + th + gap, { color: C.faint, width: 2, arrow: "triangle" });
      y += th + gap;
    });
    if (data.note) caveatBand(slide, data.note, availBot + 10);
    footer(slide);
  }

  // 大数字指标带。stats:[{value,label,sub?,focus?}]，单面板内 N 个大数字 + 竖分隔；可选底部 note。
  function statBand(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const stats = (data.stats || []).slice(0, 6), n = stats.length || 1, X = 96, W = 1728;
    const availTop = cTop + 10, availBot = 942, panelH = 262, noteH = data.note ? 72 : 0;
    const blockH = panelH + (noteH ? noteH + 20 : 0);
    const py = Math.round(availTop + ((availBot - availTop) - blockH) / 2), cw = W / n;
    rect(slide, X, py, W, panelH, { fill: C.surface, line: C.line, round: true, shadow: true });
    stats.forEach((s, i) => {
      const cx = X + i * cw, foc = s.focus === true || data.focus === i, col = foc ? C.accent : C.primary;
      if (i > 0) line(slide, cx, py + 42, cx, py + panelH - 42, { color: C.line, width: 1 });
      addText(slide, cx, py + 52, cw, 84, String(s.value), { size: 66, color: col, bold: true, align: "center", fontFace: F.en, fit: "shrink" });
      addText(slide, cx + 16, py + 150, cw - 32, 30, s.label, { size: 19, color: C.primary, bold: true, align: "center", fontFace: /[一-鿿]/.test(s.label || "") ? F.cn : F.en });
      if (s.sub) addText(slide, cx + 24, py + 188, cw - 48, 46, s.sub, { size: 13, color: C.mute, align: "center", lineSpacingMultiple: 1.22 });
    });
    if (data.note) caveatBand(slide, data.note, py + panelH + 20);
    footer(slide);
  }

  // 分类要点列（需求 / 痛点 / 能力枚举）。columns:[{head,items:[...],focus?}]，可选底部 banner 结论带。
  function bulletColumns(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const colsArr = (data.columns || []).slice(0, 4), n = colsArr.length || 1, X = 96, W = 1728, gap = 24;
    const cw = (W - (n - 1) * gap) / n, bannerH = data.banner ? 72 : 0;
    const availTop = cTop + 12, availBot = 942 - (bannerH ? bannerH + 18 : 0), headH = 58, colH = availBot - availTop, y = availTop;
    colsArr.forEach((col, i) => {
      const x = X + i * (cw + gap), foc = col.focus === true || data.focus === i, c = foc ? C.accent : C.primary;
      rect(slide, x, y, cw, headH, { fill: c, round: true });
      addText(slide, x + 16, y + headH / 2 - 14, cw - 32, 28, col.head, { size: 19, color: "FFFFFF", bold: true, align: "center", valign: "middle", fontFace: /[一-鿿]/.test(col.head || "") ? F.cn : F.en });
      rect(slide, x, y + headH + 10, cw, colH - headH - 10, { fill: C.surface, line: foc ? C.accent : C.line, lineWidth: foc ? 1.5 : 1, round: true, shadow: true });
      const items = col.items || [], iy0 = y + headH + 34, ih = (colH - headH - 58) / Math.max(items.length, 1);
      items.forEach((it, j) => {
        const yy = iy0 + j * ih;
        shp(slide, shape.ellipse, x + 26, yy + 7, 9, 9, { fill: c });
        addText(slide, x + 48, yy, cw - 70, ih - 6, it, { size: 15, color: C.text, lineSpacingMultiple: 1.26 });
      });
    });
    if (data.banner) {
      rect(slide, X, availBot + 18, W, bannerH, { fill: C.accentSoft, line: C.accent, round: true });
      addText(slide, X + 30, availBot + 18 + bannerH / 2 - 15, W - 60, 30, data.banner, { size: 18, color: C.accent, bold: true, align: "center", valign: "middle" });
    }
    footer(slide);
  }

  // 三支柱 / 三产品卡。pillars:[{name,tag?,desc,icon,points?[],focus?}]，大图标圆 + 名称 + 描述 + 要点。
  function pillarTrio(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const ps = (data.pillars || []).slice(0, 3), n = ps.length || 1, X = 96, W = 1728, gap = 36;
    const cw = (W - (n - 1) * gap) / n, availTop = cTop + 16, availBot = 942;
    const ch = Math.min(590, availBot - availTop), y = Math.round(availTop + ((availBot - availTop) - ch) / 2);
    ps.forEach((p, i) => {
      const x = X + i * (cw + gap), foc = p.focus === true || data.focus === i, c = foc ? C.accent : C.primary, cxp = x + cw / 2;
      rect(slide, x, y, cw, ch, { fill: C.surface, line: foc ? C.accent : C.line, lineWidth: foc ? 1.8 : 1, round: true, shadow: true });
      rect(slide, x, y, cw, 8, { fill: c });
      shp(slide, shape.ellipse, cxp - 54, y + 44, 108, 108, { fill: foc ? C.accentSoft : C.surface2, line: c, lw: 2 });
      icon(pptx, slide, U, cxp, y + 98, p.icon || "hub", { color: c, soft: foc ? C.accentSoft : C.surface2 });
      addText(slide, x + 24, y + 174, cw - 48, 38, p.name, { size: 26, color: c, bold: true, align: "center", fontFace: /[一-鿿]/.test(p.name || "") ? F.cn : F.en });
      if (p.tag) addText(slide, x + 24, y + 216, cw - 48, 26, p.tag, { size: 15, color: C.mute, align: "center" });
      line(slide, x + 40, y + 252, x + cw - 40, y + 252, { color: C.line, width: 1 });
      if (p.desc) addText(slide, x + 30, y + 270, cw - 60, 96, p.desc, { size: 15, color: C.text, align: "center", lineSpacingMultiple: 1.3 });
      (p.points || []).slice(0, 4).forEach((pt, j) => {
        const yy = y + 378 + j * 46;
        shp(slide, shape.ellipse, x + 34, yy + 7, 8, 8, { fill: c });
        addText(slide, x + 52, yy, cw - 84, 40, pt, { size: 14, color: C.mute, lineSpacingMultiple: 1.16 });
      });
    });
    footer(slide);
  }

  // === 扩充批次 2：象限 / 金字塔 / 覆盖 / 拓扑 / 画廊 / 环形 / 编号 / 竖时间线 / 金句 / 漏斗 / 双选 / 树 ===

  // 2×2 象限矩阵。axis:{x:[左,右],y:[下,上]}，quadrants:[TL,TR,BL,BR]，items:[{x,y(0..1),label,focus?}]。
  function quadrantMatrix(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const ax = data.axis || {}, items = data.items || [], q = data.quadrants || [];
    const availTop = cTop + 34, availBot = 914, PW = 1120, PH = Math.min(availBot - availTop, 648);
    const x0 = Math.round(96 + (1728 - PW) / 2), y0 = Math.round(availTop + ((availBot - availTop) - PH) / 2);
    const cx = x0 + PW / 2, cy = y0 + PH / 2;
    rect(slide, x0, y0, PW / 2, PH / 2, { fill: C.surface2, line: C.line });
    rect(slide, cx, y0, PW / 2, PH / 2, { fill: C.accentSoft, line: C.line });
    rect(slide, x0, cy, PW / 2, PH / 2, { fill: C.surface, line: C.line });
    rect(slide, cx, cy, PW / 2, PH / 2, { fill: C.surface2, line: C.line });
    const corn = [[x0 + 22, y0 + 16, "left"], [x0 + PW - 322, y0 + 16, "right"], [x0 + 22, y0 + PH - 42, "left"], [x0 + PW - 322, y0 + PH - 42, "right"]];
    q.slice(0, 4).forEach((t, i) => addText(slide, corn[i][0], corn[i][1], 300, 26, t, { size: 15, color: C.faint, bold: true, align: corn[i][2], fontFace: /[一-鿿]/.test(t) ? F.cn : F.en }));
    line(slide, x0, cy, x0 + PW, cy, { color: C.mute, width: 1.4 });
    line(slide, cx, y0, cx, y0 + PH, { color: C.mute, width: 1.4 });
    if (ax.x) { addText(slide, x0 + 8, cy + 8, 240, 24, ax.x[0], { size: 14, color: C.mute }); addText(slide, x0 + PW - 248, cy + 8, 240, 24, ax.x[1], { size: 14, color: C.primary, bold: true, align: "right" }); }
    if (ax.y) { addText(slide, cx + 12, y0 + 6, 260, 24, ax.y[1], { size: 14, color: C.primary, bold: true }); addText(slide, cx + 12, y0 + PH - 28, 260, 24, ax.y[0], { size: 14, color: C.mute }); }
    items.forEach(it => {
      const px = x0 + Math.max(0, Math.min(1, it.x)) * PW, py = y0 + (1 - Math.max(0, Math.min(1, it.y))) * PH, foc = it.focus === true;
      shp(slide, shape.ellipse, px - 13, py - 13, 26, 26, { fill: foc ? C.accent : C.primary, line: "FFFFFF", lw: 2, shadow: true });
      addText(slide, px + 18, py - 13, 280, 26, it.label, { size: 15, color: foc ? C.accent : C.primary, bold: foc, fontFace: /[一-鿿]/.test(it.label || "") ? F.cn : F.en });
    });
    footer(slide);
  }

  // 优先级 / 层级金字塔。levels 顶→底（顶最重要、最窄）。levels:[{name,sub?,focus?}]
  // 真·锥形金字塔（梯形带，顶层最重要）。levels 顶→底；标题在右侧带连接线的标签卡，narrow 顶带也清晰。
  function priorityPyramid(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const levels = (data.levels && data.levels.length ? data.levels : [
      { name: "Critical", desc: "must fix first", focus: true },
      { name: "Important", desc: "review next" },
      { name: "Reusable", desc: "promote later" }
    ]).slice(0, 5);
    const availTop = cTop + 26, rowH = 112, gap = 22;
    const blockH = levels.length * rowH + (levels.length - 1) * gap;
    const y0 = Math.round(availTop + ((918 - availTop) - blockH) / 2);
    const x0 = 180, maxW = 980, minW = 430, cardX = 1260, cardW = 500;
    line(slide, x0 + 18, y0 + rowH / 2, x0 + 18, y0 + blockH - rowH / 2, { color: C.line, width: 1.4 });
    levels.forEach((l, i) => {
      const rank = i + 1;
      const foc = l.focus === true || data.focus === i || i === 0;
      const col = foc ? C.accent : C.primary;
      const w = maxW - (maxW - minW) * (i / Math.max(1, levels.length - 1));
      const x = x0 + 70 + (maxW - w) / 2;
      const y = y0 + i * (rowH + gap);
      shp(slide, shape.ellipse, x0, y + rowH / 2 - 18, 36, 36, { fill: col, line: "FFFFFF", lw: 2, shadow: true });
      addText(slide, x0, y + rowH / 2 - 13, 36, 26, String(rank), { size: 15, color: "FFFFFF", bold: true, align: "center", fontFace: F.en });
      rect(slide, x, y, w, rowH, { fill: foc ? C.accentSoft : C.surface, line: col, lineWidth: foc ? 1.8 : 1.2, round: true, shadow: true });
      rect(slide, x, y, 9, rowH, { fill: col });
      addText(slide, x + 34, y + 24, w - 68, 28, l.name, { size: 23, color: col, bold: true, fit: "shrink", fontFace: /[一-鿿]/.test(l.name || "") ? F.cn : F.en });
      addText(slide, x + 34, y + 62, w - 68, 24, l.desc || l.sub || "", { size: 14, color: C.mute, fit: "shrink" });
      line(slide, x + w, y + rowH / 2, cardX - 22, y + rowH / 2, { color: foc ? C.accent : C.line, width: foc ? 1.7 : 1 });
      addText(slide, cardX, y + rowH / 2 - 16, cardW, 28, `P${rank}`, { size: 18, color: col, bold: true, fontFace: F.en });
      addText(slide, cardX + 58, y + rowH / 2 - 15, cardW - 58, 26, rank === 1 ? "highest priority" : rank === 2 ? "secondary priority" : "candidate pool", { size: 13, color: C.mute, fit: "shrink", fontFace: F.en });
    });
    footer(slide);
  }

  // 覆盖示意图。region 区域名；hub:{x,y}；sites:[{x,y(0..1),label,sub?,focus?}]；右侧自动生成站点清单。
  function coverageMap(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const availTop = cTop + 14, availBot = 934, PW = 1100, PH = availBot - availTop, x0 = 96, y0 = Math.round(availTop);
    rect(slide, x0, y0, PW, PH, { fill: C.surface2, line: C.line, round: true });
    if (data.region) addText(slide, x0 + 24, y0 + 18, PW - 48, 28, data.region, { size: 16, color: C.faint, bold: true });
    const hub = data.hub || { x: 0.5, y: 0.5 }, hx = x0 + hub.x * PW, hy = y0 + hub.y * PH, sites = data.sites || [];
    sites.forEach(s => line(slide, hx, hy, x0 + s.x * PW, y0 + s.y * PH, { color: C.line, width: 1, dash: "sysDot" }));
    sites.forEach(s => {
      const sx = x0 + s.x * PW, sy = y0 + s.y * PH, foc = s.focus === true;
      shp(slide, shape.ellipse, sx - 11, sy - 11, 22, 22, { fill: foc ? C.accent : C.primary, line: "FFFFFF", lw: 2, shadow: true });
      if (s.label) addText(slide, sx + 16, sy - 12, 220, 24, s.label, { size: 13, color: foc ? C.accent : C.primary, bold: foc, fontFace: /[一-鿿]/.test(s.label) ? F.cn : F.en });
    });
    shp(slide, shape.ellipse, hx - 17, hy - 17, 34, 34, { fill: C.accent, line: "FFFFFF", lw: 3, shadow: true });
    const lx = x0 + PW + 30, lw = 1824 - lx;
    addText(slide, lx, y0, lw, 30, data.legendTitle || "站点清单", { size: 18, color: C.primary, bold: true });
    const list = data.list || sites.filter(s => s.label).map(s => ({ name: s.label, sub: s.sub, focus: s.focus }));
    const ih = Math.min(84, (PH - 54) / Math.max(1, list.length));
    list.slice(0, 8).forEach((it, i) => {
      const yy = y0 + 50 + i * ih, foc = it.focus;
      shp(slide, shape.ellipse, lx + 4, yy + 8, 14, 14, { fill: foc ? C.accent : C.primary });
      addText(slide, lx + 30, yy, lw - 36, 28, it.name, { size: 16, color: foc ? C.accent : C.primary, bold: true, fontFace: /[一-鿿]/.test(it.name || "") ? F.cn : F.en });
      if (it.sub) addText(slide, lx + 30, yy + 28, lw - 36, 22, it.sub, { size: 13, color: C.mute });
    });
    footer(slide);
  }

  // 网络 / 部署拓扑（云-边-端）。cloud:{name}；edges:[{name}|名]；devices:[{name}|名]。
  function topology(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const availTop = cTop + 30, availBot = 922;
    const cloud = data.cloud || { name: "云平台" }, edges = (data.edges || []).slice(0, 5), devices = (data.devices || []).slice(0, 8);
    const yC = availTop + 36, yE = Math.round((availTop + availBot) / 2), yD = availBot - 54, cw = 360, cx = 960;
    rect(slide, cx - cw / 2, yC - 38, cw, 76, { fill: C.accent, round: true, shadow: true });
    addText(slide, cx - cw / 2, yC - 16, cw, 32, cloud.name, { size: 20, color: "FFFFFF", bold: true, align: "center", fontFace: /[一-鿿]/.test(cloud.name || "") ? F.cn : F.en });
    const en = edges.length || 1, ew = Math.min(260, (1560 - (en - 1) * 30) / en), ex0 = 960 - (en * ew + (en - 1) * 30) / 2 + ew / 2;
    const edgeX = i => ex0 + i * (ew + 30);
    edges.forEach((e, i) => {
      const xX = edgeX(i);
      line(slide, cx, yC + 38, xX, yE - 30, { color: C.line, width: 1.4 });
      rect(slide, xX - ew / 2, yE - 30, ew, 60, { fill: C.primary, round: true, shadow: true });
      addText(slide, xX - ew / 2 + 8, yE - 14, ew - 16, 28, e.name || e, { size: 16, color: "FFFFFF", bold: true, align: "center", fontFace: /[一-鿿]/.test(e.name || e || "") ? F.cn : F.en });
    });
    const dn = devices.length || 1, dw = Math.min(204, (1700 - (dn - 1) * 22) / dn), dx0 = 960 - (dn * dw + (dn - 1) * 22) / 2 + dw / 2;
    devices.forEach((d, i) => {
      const xX = dx0 + i * (dw + 22), ne = edges.length ? edgeX(Math.min(en - 1, Math.round(i / Math.max(1, dn - 1) * (en - 1)))) : cx;
      line(slide, ne, yE + 30, xX, yD - 26, { color: C.line, width: 1 });
      rect(slide, xX - dw / 2, yD - 26, dw, 52, { fill: C.surface, line: C.line, round: true });
      addText(slide, xX - dw / 2 + 6, yD - 12, dw - 12, 26, d.name || d, { size: 13, color: C.primary, bold: true, align: "center", fontFace: /[一-鿿]/.test(d.name || d || "") ? F.cn : F.en });
    });
    ["云 Cloud", "边 Edge", "端 Device"].forEach((t, i) => addText(slide, 96, [yC, yE, yD][i] - 12, 150, 24, t, { size: 13, color: C.faint, bold: true }));
    footer(slide);
  }

  // 图文画廊。items:[{image?,icon?,title,desc?,placeholder?,focus?}]（image 给路径则贴真图，否则占位框）。
  function imageGallery(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const items = (data.items || []).slice(0, 4), n = items.length || 1, X = 96, W = 1728, gap = 26, cw = (W - (n - 1) * gap) / n;
    const availTop = cTop + 14, availBot = 934, ch = Math.min(560, availBot - availTop), y = Math.round(availTop + ((availBot - availTop) - ch) / 2);
    const capH = 96, imgH = ch - capH;
    items.forEach((it, i) => {
      const x = X + i * (cw + gap), foc = it.focus === true || data.focus === i, col = foc ? C.accent : C.primary;
      rect(slide, x, y, cw, ch, { fill: C.surface, line: foc ? C.accent : C.line, lineWidth: foc ? 1.6 : 1, round: true, shadow: true });
      if (it.image) { try { slide.addImage({ path: it.image, x: U(x + 10), y: U(y + 10), w: U(cw - 20), h: U(imgH - 10) }); } catch (e) { } }
      else {
        rect(slide, x + 10, y + 10, cw - 20, imgH - 10, { fill: C.surface2, line: C.line, round: true });
        shp(slide, shape.ellipse, x + cw / 2 - 27, y + imgH / 2 - 34, 54, 54, { fill: C.surface, line: col, lw: 2 });
        icon(pptx, slide, U, x + cw / 2, y + imgH / 2 - 6, it.icon || "document", { color: col, soft: C.surface });
        addText(slide, x + 10, y + imgH - 42, cw - 20, 24, it.placeholder || "图片占位 / Screenshot", { size: 12, color: C.faint, align: "center" });
      }
      rect(slide, x, y + imgH, cw, 4, { fill: col });
      addText(slide, x + 22, y + imgH + 16, cw - 44, 30, it.title, { size: 18, color: col, bold: true, fontFace: /[一-鿿]/.test(it.title || "") ? F.cn : F.en });
      if (it.desc) addText(slide, x + 22, y + imgH + 50, cw - 44, 36, it.desc, { size: 13, color: C.mute, lineSpacingMultiple: 1.2 });
    });
    footer(slide);
  }

  // 环形进度指标（原生 doughnut，真实百分比弧）。items:[{value,label,sub?,focus?}]，value 含百分比，中心大数值。
  function ringStats(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const items = (data.items || []).slice(0, 5), n = items.length || 1, X = 96, W = 1728, cw = W / n;
    const noteH = data.note ? 70 : 0, availTop = cTop + 12, availBot = 936 - noteH;
    const ringD = Math.min(212, cw - 70, availBot - availTop - 120);
    const blockH = ringD + 96, ringY = Math.round(availTop + ((availBot - availTop) - blockH) / 2);
    items.forEach((it, i) => {
      const cx = X + i * cw + cw / 2, foc = it.focus === true || data.focus === i, col = foc ? C.accent : C.primary;
      const pct = Math.max(0, Math.min(100, parseFloat(String(it.value)) || 0));
      slide.addChart("doughnut", [{ name: it.label, labels: ["done", "rest"], values: [pct, 100 - pct] }], {
        x: U(cx - ringD / 2), y: U(ringY), w: U(ringD), h: U(ringD), holeSize: 76,
        chartColors: [col, C.surface2], showLegend: false, showValue: false, showTitle: false, dataBorder: { pt: 0, color: "FFFFFF" }
      });
      addText(slide, cx - ringD / 2, ringY + ringD / 2 - 30, ringD, 60, String(it.value), { size: ringD > 184 ? 34 : 28, color: col, bold: true, align: "center", valign: "middle", fontFace: F.en, fit: "shrink" });
      addText(slide, cx - cw / 2 + 20, ringY + ringD + 16, cw - 40, 30, it.label, { size: 19, color: C.primary, bold: true, align: "center", fontFace: /[一-鿿]/.test(it.label || "") ? F.cn : F.en });
      if (it.sub) addText(slide, cx - cw / 2 + 30, ringY + ringD + 50, cw - 60, 40, it.sub, { size: 13, color: C.mute, align: "center", lineSpacingMultiple: 1.2 });
    });
    if (data.note) caveatBand(slide, data.note, availBot + 4);
    footer(slide);
  }

  // 编号叙述列表。items:[{title,desc,focus?}]，大序号 + 标题 + 说明，整行卡片。
  function numberedList(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const items = (data.items || []).slice(0, 5), n = items.length || 1, X = 96, W = 1728;
    const availTop = cTop + 12, availBot = 936, rh = Math.min(150, (availBot - availTop - (n - 1) * 14) / n), blockH = n * rh + (n - 1) * 14;
    let y = Math.round(availTop + ((availBot - availTop) - blockH) / 2);
    items.forEach((it, i) => {
      const foc = it.focus === true || data.focus === i, col = foc ? C.accent : C.primary;
      rect(slide, X, y, W, rh, { fill: C.surface, line: foc ? C.accent : C.line, lineWidth: foc ? 1.6 : 1, round: true, shadow: true });
      const rrn = (theme.shape && theme.shape.radius) ? (theme.shape.radius.card ?? 18) : ((theme.container && theme.container.radius) ?? 8);
      rect(slide, X, y + rrn, 8, Math.max(4, rh - 2 * rrn), { fill: col }); // inset by radius: bar must not overshoot rounded corners
      addText(slide, X + 34, y, 150, rh, String(i + 1).padStart(2, "0"), { size: 56, color: foc ? C.accent : C.faint, bold: true, valign: "middle", fontFace: F.en });
      addText(slide, X + 206, y + rh / 2 - 34, 1500, 36, it.title, { size: 23, color: col, bold: true, fontFace: /[一-鿿]/.test(it.title || "") ? F.cn : F.en });
      if (it.desc) addText(slide, X + 206, y + rh / 2 + 6, 1500, 40, it.desc, { size: 15, color: C.mute, lineSpacingMultiple: 1.25 });
      y += rh + 14;
    });
    footer(slide);
  }

  // 竖向里程碑时间线。items:[{date,title,desc,focus?}]，左轴 + 右卡片。
  function timelineVertical(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const items = (data.items || []).slice(0, 5), n = items.length || 1, axisX = 360;
    const availTop = cTop + 20, availBot = 926, span = availBot - availTop, step = span / n;
    line(slide, axisX, availTop, axisX, availBot, { color: C.line, width: 2 });
    items.forEach((it, i) => {
      const cy = availTop + step * i + step / 2, foc = it.focus === true || data.focus === i, col = foc ? C.accent : C.primary;
      if (it.date) addText(slide, 96, cy - 16, 234, 30, it.date, { size: 17, color: col, bold: true, align: "right", fontFace: /[一-鿿]/.test(it.date) ? F.cn : F.en });
      shp(slide, shape.ellipse, axisX - 15, cy - 15, 30, 30, { fill: col, line: "FFFFFF", lw: 3, shadow: true });
      const cardX = axisX + 40, cardW = 1824 - cardX, cardH = Math.min(step - 18, 132);
      rect(slide, cardX, cy - cardH / 2, cardW, cardH, { fill: C.surface, line: foc ? C.accent : C.line, lineWidth: foc ? 1.6 : 1, round: true, shadow: true });
      rect(slide, cardX, cy - cardH / 2, 6, cardH, { fill: col });
      addText(slide, cardX + 28, cy - cardH / 2 + 18, cardW - 56, 32, it.title, { size: 21, color: col, bold: true, fontFace: /[一-鿿]/.test(it.title || "") ? F.cn : F.en });
      if (it.desc) addText(slide, cardX + 28, cy - cardH / 2 + 58, cardW - 56, cardH - 72, it.desc, { size: 14, color: C.mute, lineSpacingMultiple: 1.25 });
    });
    footer(slide);
  }

  // 金句 / 关键论断页。quote 字符串或 [{text,hot}]；by 署名。设计性留白、居中。
  function quoteHighlight(slide, data) {
    header(slide, data.title, data.subtitle);
    addText(slide, 220, 322, 160, 160, "“", { size: 150, color: C.accentSoft, bold: true, fontFace: F.en, fit: "none" });
    const runs = Array.isArray(data.quote) ? data.quote.map(r => ({ text: r.text, options: { color: r.hot ? C.accent : C.primary, bold: true } })) : [{ text: data.quote || "", options: { color: C.primary, bold: true } }];
    slide.addText(runs, { x: U(300), y: U(384), w: U(1320), h: U(248), fontFace: F.cn, fontSize: PT(46), align: "center", valign: "middle", margin: 0, lineSpacingMultiple: 1.26, fit: "shrink" });
    rect(slide, 860, 666, 200, 4, { fill: C.accent });
    if (data.by) addText(slide, 360, 694, 1200, 36, data.by, { size: 20, color: C.mute, bold: true, align: "center", fontFace: /[一-鿿]/.test(data.by) ? F.cn : F.en });
    footer(slide);
  }

  // 真·漏斗（倒梯形带，上宽下窄）。stages 顶→底，stages:[{name,value?,focus?}]，右侧标注名称+数值。
  function funnel(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const stages = (data.stages && data.stages.length ? data.stages : [
      { name: "All Ideas", value: 70 },
      { name: "Candidates", value: 42 },
      { name: "Selected", value: 18, focus: true },
      { name: "Shipped", value: 12 }
    ]).slice(0, 5);
    const availTop = cTop + 28, availBot = 920;
    const n = stages.length || 1, rowH = Math.min(96, (availBot - availTop - (n - 1) * 24) / n);
    const blockH = n * rowH + (n - 1) * 24;
    const y0 = Math.round(availTop + ((availBot - availTop) - blockH) / 2);
    const x0 = 160, maxW = 940, minW = 430, labelX = 1230;
    line(slide, labelX - 70, y0 + rowH / 2, labelX - 70, y0 + blockH - rowH / 2, { color: C.line, width: 1.2 });
    stages.forEach((s, i) => {
      const foc = s.focus === true || data.focus === i;
      const col = foc ? C.accent : C.primary;
      const ratio = 1 - i / Math.max(1, n - 1);
      const w = minW + (maxW - minW) * ratio;
      const x = x0 + (maxW - w) / 2;
      const y = y0 + i * (rowH + 24);
      rect(slide, x, y, w, rowH, { fill: foc ? C.accentSoft : C.surface, line: col, lineWidth: foc ? 1.7 : 1.1, round: true, shadow: true });
      const rrp = (theme.shape && theme.shape.radius) ? (theme.shape.radius.card ?? 18) : ((theme.container && theme.container.radius) ?? 8);
      rect(slide, x, y + rrp, 8, Math.max(4, rowH - 2 * rrp), { fill: col }); // inset by radius: bar must not overshoot rounded corners
      addText(slide, x + 28, y + 22, w - 220, 26, s.name, { size: 20, color: col, bold: true, fit: "shrink", fontFace: /[一-鿿]/.test(s.name || "") ? F.cn : F.en });
      if (s.value != null) addText(slide, x + w - 176, y + 20, 140, 34, String(s.value), { size: 26, color: col, bold: true, align: "right", fontFace: F.en });
      if (i < n - 1) line(slide, x0 + maxW / 2, y + rowH + 5, x0 + maxW / 2, y + rowH + 20, { color: C.line, width: 1.1, arrow: "triangle" });
      line(slide, x + w, y + rowH / 2, labelX - 70, y + rowH / 2, { color: foc ? C.accent : C.line, width: foc ? 1.6 : 1 });
      shp(slide, shape.ellipse, labelX - 78, y + rowH / 2 - 8, 16, 16, { fill: col, line: "FFFFFF", lw: 1.5 });
      const stageNote = s.note || (foc ? "current focus" : i === 0 ? "input pool" : i === n - 1 ? "final output" : "filter stage");
      addText(slide, labelX, y + rowH / 2 - 18, 390, 28, stageNote, { size: 15, color: col, bold: foc, fontFace: /[一-鿿]/.test(stageNote) ? F.cn : F.en });
    });
    footer(slide);
  }

  // 双方案对比。options:[{name,recommended?,points:[字符串|{text,no}]}]（最多 2），中间 VS 徽标。
  function twoOptionCompare(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const opts = (data.options || []).slice(0, 2), availTop = cTop + 16, availBot = 936, gap = 64, cw = (1728 - gap) / 2, ch = availBot - availTop, y = availTop;
    opts.forEach((o, i) => {
      const x = 96 + i * (cw + gap), rec = o.recommended === true, col = rec ? C.accent : C.primary;
      rect(slide, x, y, cw, ch, { fill: C.surface, line: rec ? C.accent : C.line, lineWidth: rec ? 2 : 1, round: true, shadow: true });
      rect(slide, x, y, cw, 70, { fill: col, round: true });
      addText(slide, x + 26, y + 20, cw - 220, 34, o.name, { size: 24, color: "FFFFFF", bold: true, fontFace: /[一-鿿]/.test(o.name || "") ? F.cn : F.en });
      if (rec) addText(slide, x + cw - 196, y + 22, 172, 30, data.recommendLabel || "推荐", { size: 16, color: "FFFFFF", bold: true, align: "right" });
      const feats = (o.points || []).slice(0, 7), iy0 = y + 100, ih = (ch - 124) / Math.max(1, feats.length);
      feats.forEach((ft, j) => {
        const yy = iy0 + j * ih, no = (typeof ft === "object" && ft.no), txt = typeof ft === "object" ? ft.text : ft;
        addText(slide, x + 28, yy + ih / 2 - 17, 38, 34, no ? "✗" : "✓", { size: 18, color: no ? C.faint : C.green, bold: true, align: "center" });
        addText(slide, x + 74, yy, cw - 104, ih, txt, { size: 16, color: C.text, valign: "middle", lineSpacingMultiple: 1.2 });
      });
    });
    if (opts.length === 2) {
      const mxc = 96 + cw + gap / 2;
      shp(slide, shape.ellipse, mxc - 34, y + ch / 2 - 34, 68, 68, { fill: C.surface, line: C.primary, lw: 2, shadow: true });
      addText(slide, mxc - 34, y + ch / 2 - 18, 68, 36, "VS", { size: 21, color: C.primary, bold: true, align: "center", fontFace: F.en });
    }
    footer(slide);
  }

  // 组织 / 层级树（2 层 + 可选孙级 chip）。root:{name}；children:[{name,focus?,items:[]}]。
  function orgTree(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const root = data.root || { name: "根节点" }, ch = (data.children || []).slice(0, 5);
    const availTop = cTop + 28, availBot = 922, rootW = 380, cxR = 960;
    const maxG = Math.max(0, ...ch.map(c => (c.items || []).length));
    const treeH = 296 + (maxG > 0 ? (maxG - 1) * 56 : -76);      // 根+子(+孙)整体高度
    const yR = Math.round(availTop + Math.max(0, ((availBot - availTop) - treeH) / 2) + 40); // 整树垂直居中
    rect(slide, cxR - rootW / 2, yR - 40, rootW, 80, { fill: C.accent, round: true, shadow: true });
    addText(slide, cxR - rootW / 2, yR - 16, rootW, 34, root.name, { size: 22, color: "FFFFFF", bold: true, align: "center", fontFace: /[一-鿿]/.test(root.name || "") ? F.cn : F.en });
    const n = ch.length || 1, cw = Math.min(300, (1640 - (n - 1) * 28) / n), x0 = 960 - (n * cw + (n - 1) * 28) / 2 + cw / 2;
    const yChild = yR + 150, busY = yR + 80;
    line(slide, cxR, yR + 40, cxR, busY, { color: C.line, width: 1.5 });
    if (n > 1) line(slide, x0, busY, x0 + (n - 1) * (cw + 28), busY, { color: C.line, width: 1.5 });
    ch.forEach((c, i) => {
      const cx = x0 + i * (cw + 28), col = c.focus ? C.accent : C.primary;
      line(slide, cx, busY, cx, yChild - 38, { color: C.line, width: 1.5 });
      rect(slide, cx - cw / 2, yChild - 38, cw, 76, { fill: col, round: true, shadow: true });
      addText(slide, cx - cw / 2, yChild - 22, cw, 30, c.name, { size: 18, color: "FFFFFF", bold: true, align: "center", fontFace: /[一-鿿]/.test(c.name || "") ? F.cn : F.en });
      (c.items || []).slice(0, 4).forEach((g, j) => {
        const gy = yChild + 60 + j * 56;
        line(slide, cx, yChild + 38, cx, gy + 23, { color: C.line, width: 1 });
        rect(slide, cx - cw / 2 + 12, gy, cw - 24, 46, { fill: C.surface, line: C.line, round: true });
        addText(slide, cx - cw / 2 + 12, gy + 11, cw - 24, 24, g, { size: 14, color: C.primary, align: "center", fontFace: /[一-鿿]/.test(String(g)) ? F.cn : F.en });
      });
    });
    footer(slide);
  }

  // === 扩充批次 3：甘特 / 热力 / 雷达 / 价值链 / 瀑布 / 泳道流程 / 韦恩 / 标注图 / 柱状 / 折线 / 占比 ===
  const mixHex = (a, b, t) => { const f = h => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; const pa = f(a), pb = f(b); return pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("").toUpperCase(); };

  // 甘特图。periods:[列名]，tasks:[{name,start,span,focus?,milestone?}]（start=0 起列号，milestone=列号画菱形）。
  function gantt(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const periods = data.periods || [], tasks = data.tasks || [], N = periods.length || 1;
    const X = 96, W = 1728, labelW = data.labelW || 360, gx = X + labelW, gw = W - labelW, colW = gw / N;
    const noteH = data.note ? 76 : 0, availTop = cTop + 8, availBot = 940 - noteH, headH = 56;
    const rh = Math.min(82, Math.max(44, (availBot - availTop - headH) / Math.max(1, tasks.length)));
    const tableH = headH + tasks.length * rh, y0 = Math.round(availTop + ((availBot - availTop) - tableH) / 2);
    rect(slide, X, y0, labelW, headH, { fill: C.surface2, line: C.line });
    addText(slide, X + 18, y0 + headH / 2 - 12, labelW - 36, 24, data.corner || "任务", { size: 14, color: C.mute, bold: true, valign: "middle" });
    periods.forEach((p, i) => { rect(slide, gx + i * colW, y0, colW, headH, { fill: i % 2 ? C.surface2 : C.surface, line: C.line }); addText(slide, gx + i * colW, y0 + headH / 2 - 12, colW, 24, p, { size: 15, color: C.primary, bold: true, align: "center" }); });
    let y = y0 + headH;
    tasks.forEach((t, r) => {
      rect(slide, X, y, labelW, rh, { fill: C.surface, line: C.line });
      addText(slide, X + 18, y, labelW - 30, rh, t.name, { size: 15, color: t.focus ? C.accent : C.primary, bold: true, valign: "middle", fontFace: /[一-鿿]/.test(t.name || "") ? F.cn : F.en });
      for (let i = 0; i < N; i++) rect(slide, gx + i * colW, y, colW, rh, { fill: r % 2 ? C.surface : C.surface2, line: C.line });
      const col = t.focus ? C.accent : C.primary, bx = gx + (t.start || 0) * colW + 8, bw = Math.max(colW * 0.5, (t.span || 1) * colW - 16);
      rect(slide, bx, y + rh / 2 - 14, bw, 28, { fill: col, round: true, shadow: true });
      if (t.milestone != null) shp(slide, shape.diamond, gx + t.milestone * colW - 13, y + rh / 2 - 13, 26, 26, { fill: C.danger, line: "FFFFFF", lw: 1.5 });
      y += rh;
    });
    if (data.note) caveatBand(slide, data.note, availBot + 8);
    footer(slide);
  }

  // 热力矩阵。cols:[列名]，rows:[{label,values:[0..1],raw?:[]}]，high 强度色 token，showValue 显示数值。
  function heatmap(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const cols = data.cols || [], rows = data.rows || [], n = cols.length || 1;
    const X = 96, W = 1728, labelW = data.labelW || 300, legendW = 110, gx = X + labelW, gw = W - labelW - legendW, colW = gw / n;
    const noteH = data.note ? 76 : 0, availTop = cTop + 10, availBot = 934 - noteH, headH = 50;
    const rh = Math.min(98, Math.max(42, (availBot - availTop - headH) / Math.max(1, rows.length)));
    const tableH = headH + rows.length * rh, y0 = Math.round(availTop + ((availBot - availTop) - tableH) / 2);
    const lowC = C.surface2, highC = (data.high && (C[data.high] || data.high)) || C.primary;
    cols.forEach((c, i) => addText(slide, gx + i * colW, y0 + 14, colW, 26, c, { size: 14, color: C.primary, bold: true, align: "center", fontFace: /[一-鿿]/.test(c) ? F.cn : F.en }));
    let y = y0 + headH;
    rows.forEach(r => {
      addText(slide, X, y, labelW - 16, rh, r.label, { size: 15, color: C.primary, bold: true, valign: "middle", fontFace: /[一-鿿]/.test(r.label || "") ? F.cn : F.en });
      (r.values || []).slice(0, n).forEach((v, i) => {
        const t = Math.max(0, Math.min(1, typeof v === "number" ? v : 0)), fc = mixHex(lowC, highC, t);
        rect(slide, gx + i * colW + 3, y + 3, colW - 6, rh - 6, { fill: fc, line: C.line, round: true });
        if (data.showValue) addText(slide, gx + i * colW, y + rh / 2 - 12, colW, 24, (r.raw && r.raw[i] != null) ? String(r.raw[i]) : Math.round(t * 100), { size: 13, color: t > 0.52 ? "FFFFFF" : C.primary, bold: true, align: "center", fontFace: F.en });
      });
      y += rh;
    });
    const lx = gx + gw + 28, lw = 64, lh = rows.length * rh, steps = 12;
    for (let i = 0; i < steps; i++) rect(slide, lx, y0 + headH + (lh * (steps - 1 - i) / steps), lw, lh / steps + 1, { fill: mixHex(lowC, highC, i / (steps - 1)) });
    addText(slide, lx - 10, y0 + headH - 26, lw + 20, 22, data.highLabel || "高", { size: 12, color: C.mute, align: "center" });
    addText(slide, lx - 10, y0 + headH + lh + 4, lw + 20, 22, data.lowLabel || "低", { size: 12, color: C.mute, align: "center" });
    if (data.note) caveatBand(slide, data.note, availBot + 8);
    footer(slide);
  }

  // 雷达图（原生可编辑）。axes:[维度]，series:[{name,values:[...]}]。
  function radar(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const axes = data.axes || [], series = (data.series || []).map(s => ({ name: s.name, labels: axes, values: s.values }));
    const availTop = cTop + 14, availBot = 932, h = availBot - availTop, w = Math.min(Math.round(h * 1.25), 1080), x = Math.round(96 + (1728 - w) / 2);
    slide.addChart("radar", series, {
      x: U(x), y: U(availTop), w: U(w), h: U(h), radarStyle: data.filled === true ? "filled" : "marker",
      chartColors: [C.accent, C.primary, C.blue, C.green], lineSize: 3, lineDataSymbolSize: 6,
      showLegend: series.length > 1, legendPos: "b", legendFontFace: F.cn, legendColor: C.text,
      catAxisLabelColor: C.primary, catAxisLabelFontFace: F.cn, catAxisLabelFontSize: 12, valAxisHidden: true
    });
    footer(slide);
  }

  // 价值链：阶段卡（彩色页眉 + 要点）以箭头相连。文字在卡内，不会被切。stages:[{name,items:[...],focus?}]。
  function valueChain(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const st = (data.stages || []).slice(0, 5), n = st.length || 1, X = 96, W = 1728, arr = 50, g = 6;
    const cw = (W - (n - 1) * (arr + g)) / n;
    const availTop = cTop + 22, availBot = 924, ch = Math.min(540, availBot - availTop), y = Math.round(availTop + ((availBot - availTop) - ch) / 2);
    st.forEach((s, i) => {
      const x = X + i * (cw + arr + g), foc = s.focus === true || data.focus === i, col = foc ? C.accent : C.primary;
      rect(slide, x, y, cw, ch, { fill: C.surface, line: foc ? C.accent : C.line, lineWidth: foc ? 1.8 : 1, round: true, shadow: true });
      rect(slide, x, y, cw, 62, { fill: col, round: true });
      rect(slide, x, y + 40, cw, 22, { fill: col });
      addText(slide, x + 14, y + 16, cw - 28, 32, s.name, { size: 20, color: "FFFFFF", bold: true, align: "center", fontFace: /[一-鿿]/.test(s.name || "") ? F.cn : F.en });
      (s.items || []).slice(0, 6).forEach((it, j) => {
        const iy = y + 90 + j * 50;
        shp(slide, shape.ellipse, x + 24, iy + 7, 9, 9, { fill: col });
        addText(slide, x + 44, iy, cw - 66, 44, it, { size: 15, color: C.text, lineSpacingMultiple: 1.18, fontFace: /[一-鿿]/.test(it) ? F.cn : F.en });
      });
      if (i < n - 1) shp(slide, shape.chevron, x + cw + g, y + ch / 2 - 26, arr, 52, { fill: i === data.focus || (i + 1) === data.focus ? C.accent : C.faint });
    });
    footer(slide);
  }

  // 瀑布 / 价值桥。start:{label,value}，deltas:[{label,value(+/-)}], end?:{label,value}。
  function waterfall(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const start = data.start || { label: "起始", value: 0 }, deltas = data.deltas || [], end = data.end;
    const bars = []; let cum = start.value;
    bars.push({ label: start.label, base: 0, top: start.value, col: C.primary, val: start.value, cum });
    deltas.forEach(d => { const b0 = cum, b1 = cum + d.value; bars.push({ label: d.label, base: Math.min(b0, b1), top: Math.max(b0, b1), col: d.value >= 0 ? C.green : C.danger, val: d.value, rel: true, cum: b1 }); cum = b1; });
    bars.push({ label: (end && end.label) || "合计", base: 0, top: (end && end.value != null) ? end.value : cum, col: C.accent, val: (end && end.value != null) ? end.value : cum, cum });
    const n = bars.length, X = 96, W = 1728, availTop = cTop + 36, availBot = 894, plotH = availBot - availTop;
    const top = Math.max(...bars.map(b => b.top), 1) * 1.14, colW = W / n, bw = Math.min(150, colW * 0.54), yBase = availBot;
    bars.forEach((b, i) => {
      const cx = X + i * colW + colW / 2, by = yBase - (b.top / top) * plotH, bh = Math.max(3, ((b.top - b.base) / top) * plotH);
      rect(slide, cx - bw / 2, by, bw, bh, { fill: b.col, round: true, shadow: true });
      addText(slide, cx - colW / 2, by - 30, colW, 24, String(b.rel ? (b.val >= 0 ? "+" + b.val : b.val) : b.val), { size: 14, color: b.col, bold: true, align: "center", fontFace: F.en });
      addText(slide, cx - colW / 2, yBase + 12, colW, 44, b.label, { size: 14, color: C.primary, bold: true, align: "center", lineSpacingMultiple: 1.08, fontFace: /[一-鿿]/.test(b.label || "") ? F.cn : F.en });
      if (i < n - 1) { const yC = yBase - (b.cum / top) * plotH; line(slide, cx + bw / 2, yC, X + (i + 1) * colW + colW / 2 - bw / 2, yC, { color: C.faint, width: 1.2, dash: "sysDash" }); }
    });
    footer(slide);
  }

  // 角色泳道流程。lanes:[{role,steps:[字符串|{label,focus}|null]}]，phases?:[阶段名]（列头）。
  function swimlaneProcess(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const lanes = (data.lanes || []).slice(0, 4), phases = data.phases || [];
    const X = 96, W = 1728, labelW = 220, gx = X + labelW, gw = W - labelW;
    const ncol = phases.length || Math.max(1, ...lanes.map(l => (l.steps || []).length)), colW = gw / ncol;
    const availTop = cTop + 12, availBot = 936, headH = phases.length ? 46 : 0;
    const laneH = Math.min(154, (availBot - availTop - headH) / Math.max(1, lanes.length));
    const blockH = headH + lanes.length * laneH, y0 = Math.round(availTop + ((availBot - availTop) - blockH) / 2);
    phases.forEach((p, i) => addText(slide, gx + i * colW, y0 + 8, colW, 28, p, { size: 15, color: C.faint, bold: true, align: "center", fontFace: /[一-鿿]/.test(p) ? F.cn : F.en }));
    let y = y0 + headH;
    lanes.forEach((ln, r) => {
      rect(slide, X, y + 6, labelW - 14, laneH - 24, { fill: r % 2 ? C.surface2 : C.accentSoft, line: C.line, round: true });
      addText(slide, X + 10, y + 6, labelW - 34, laneH - 24, ln.role, { size: 16, color: r % 2 ? C.primary : C.accent, bold: true, align: "center", valign: "middle", fontFace: /[一-鿿]/.test(ln.role || "") ? F.cn : F.en });
      (ln.steps || []).slice(0, ncol).forEach((stp, i) => {
        if (!stp) return;
        const x = gx + i * colW + 12, foc = typeof stp === "object" && stp.focus, col = foc ? C.accent : C.primary, label = typeof stp === "object" ? stp.label : stp;
        rect(slide, x, y + 14, colW - 24, laneH - 40, { fill: C.surface, line: foc ? C.accent : C.line, lineWidth: foc ? 1.6 : 1, round: true, shadow: true });
        rect(slide, x, y + 14, 6, laneH - 40, { fill: col });
        addText(slide, x + 18, y + 14, colW - 44, laneH - 40, label, { size: 14, color: col, bold: true, valign: "middle", lineSpacingMultiple: 1.12, fontFace: /[一-鿿]/.test(label || "") ? F.cn : F.en });
        if (i < ncol - 1 && ln.steps[i + 1]) line(slide, gx + (i + 1) * colW - 12, y + laneH / 2, gx + (i + 1) * colW + 12, y + laneH / 2, { color: C.faint, width: 1.6, arrow: "triangle" });
      });
      y += laneH;
    });
    footer(slide);
  }

  // 韦恩图（2 集富版 / 3 集）。sets:[{label,sub?,items:[]}]，intersection 交集短语，
  // intersectionDesc 交集说明，overlapItems:[] 交集要点（右侧卡片），takeaway 底部收束带。
  function venn(slide, data) {
    const C2 = s => /[一-鿿]/.test(s || "") ? F.cn : F.en;
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const sets = (data.sets || []).slice(0, 3), availBot = data.takeaway ? 858 : 924, availTop = cTop + 16;
    const cyc = Math.round((availTop + availBot) / 2);
    const ell = (cx, cy, r, col) => slide.addShape(shape.ellipse, { x: U(cx - r), y: U(cy - r), w: U(2 * r), h: U(2 * r), fill: { color: col, transparency: 40 }, line: { color: col, width: 2.5 } });
    if (sets.length <= 2) {
      const r = Math.min(220, (availBot - availTop) / 2 - 14), cx1 = 540, cx2 = cx1 + r * 1.5, midx = (cx1 + cx2) / 2;
      const s0 = sets[0] || {}, s1 = sets[1] || {};
      ell(cx1, cyc, r, C.primary); ell(cx2, cyc, r, C.blue);
      addText(slide, cx1 - r, cyc - r - 48, 2 * r, 34, s0.label || "", { size: 22, color: C.primary, bold: true, align: "center", fontFace: C2(s0.label) });
      addText(slide, cx2 - r, cyc - r - 48, 2 * r, 34, s1.label || "", { size: 22, color: C.blue, bold: true, align: "center", fontFace: C2(s1.label) });
      (s0.items || []).slice(0, 4).forEach((it, j) => addText(slide, cx1 - r + 30, cyc - 54 + j * 38, midx - (cx1 - r) - 90, 34, "· " + it, { size: 14, color: C.primary, lineSpacingMultiple: 1.1, fontFace: C2(it) }));
      (s1.items || []).slice(0, 4).forEach((it, j) => addText(slide, midx + 56, cyc - 54 + j * 38, (cx2 + r) - midx - 70, 34, "· " + it, { size: 14, color: C.blue, lineSpacingMultiple: 1.1, fontFace: C2(it) }));
      shp(slide, shape.ellipse, midx - 9, cyc - r + 10, 18, 18, { fill: C.accent, line: "FFFFFF", lw: 2 });
      addText(slide, midx - 60, cyc - r - 6, 120, 22, "交集 ∩", { size: 12, color: C.accent, bold: true, align: "center" });
      const lx = cx2 + r + 56, lw = 1824 - lx;
      rect(slide, lx, cyc - 150, lw, 300, { fill: C.surface, line: C.accent, lineWidth: 1.4, round: true, shadow: true });
      rect(slide, lx, cyc - 150, lw, 6, { fill: C.accent });
      addText(slide, lx + 26, cyc - 128, lw - 52, 56, data.intersection || "交集 · 差异化", { size: 20, color: C.accent, bold: true, lineSpacingMultiple: 1.1, fontFace: C2(data.intersection) });
      if (data.intersectionDesc) addText(slide, lx + 26, cyc - 64, lw - 52, 60, data.intersectionDesc, { size: 14, color: C.text, lineSpacingMultiple: 1.3, fontFace: C2(data.intersectionDesc) });
      (data.overlapItems || []).slice(0, 4).forEach((it, j) => { const oy = cyc + 6 + j * 36; shp(slide, shape.ellipse, lx + 28, oy + 7, 8, 8, { fill: C.accent }); addText(slide, lx + 48, oy, lw - 74, 32, it, { size: 14, color: C.text, lineSpacingMultiple: 1.12, fontFace: C2(it) }); });
    } else {
      const r = 196, dx = r * 0.64, dy = r * 0.58, cs = [[960, cyc - dy], [960 - dx, cyc + dy * 0.75], [960 + dx, cyc + dy * 0.75]], cols = [C.primary, C.blue, C.accent];
      cs.forEach((p, i) => ell(p[0], p[1], r, cols[i]));
      const lp = [[960 - 110, cyc - dy - r - 44], [960 - dx - r - 6, cyc + dy + r - 30], [960 + dx + r - 194, cyc + dy + r - 30]];
      sets.forEach((s, i) => addText(slide, lp[i][0], lp[i][1], 200, 30, s.label, { size: 18, color: cols[i], bold: true, align: "center", fontFace: C2(s.label) }));
      if (data.intersection) addText(slide, 960 - 130, cyc + 14, 260, 50, data.intersection, { size: 15, color: C.primary, bold: true, align: "center", fontFace: C2(data.intersection) });
    }
    if (data.takeaway) caveatBand(slide, data.takeaway, availBot + 8);
    footer(slide);
  }

  // 标注图。image? 路径，否则占位框；markers:[{x,y(0..1),n}]；legend:[{n,text}]。
  function annotatedDiagram(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const availTop = cTop + 14, availBot = 936, PW = 1100, PH = availBot - availTop, x0 = 96, y0 = availTop;
    if (data.image) { try { slide.addImage({ path: data.image, x: U(x0), y: U(y0), w: U(PW), h: U(PH) }); } catch (e) { } }
    else {
      rect(slide, x0, y0, PW, PH, { fill: C.surface2, line: C.line, round: true });
      shp(slide, shape.ellipse, x0 + PW / 2 - 30, y0 + PH / 2 - 46, 60, 60, { fill: C.surface, line: C.primary, lw: 2 });
      icon(pptx, slide, U, x0 + PW / 2, y0 + PH / 2 - 16, data.icon || "document", { color: C.primary, soft: C.surface });
      addText(slide, x0, y0 + PH / 2 + 28, PW, 24, data.placeholder || "系统/产品示意图占位", { size: 13, color: C.faint, align: "center" });
    }
    (data.markers || []).forEach(m => { const mx = x0 + m.x * PW, my = y0 + m.y * PH; shp(slide, shape.ellipse, mx - 17, my - 17, 34, 34, { fill: C.accent, line: "FFFFFF", lw: 2, shadow: true }); addText(slide, mx - 17, my - 16, 34, 32, String(m.n), { size: 16, color: "FFFFFF", bold: true, align: "center", valign: "middle", fontFace: F.en }); });
    const lx = x0 + PW + 30, lw = 1824 - lx;
    addText(slide, lx, y0, lw, 30, data.legendTitle || "标注说明", { size: 18, color: C.primary, bold: true });
    const lg = data.legend || [], ih = Math.min(98, (PH - 52) / Math.max(1, lg.length));
    lg.slice(0, 7).forEach((it, i) => { const yy = y0 + 50 + i * ih; shp(slide, shape.ellipse, lx, yy + 2, 30, 30, { fill: C.accent }); addText(slide, lx, yy, 30, 30, String(it.n != null ? it.n : i + 1), { size: 15, color: "FFFFFF", bold: true, align: "center", valign: "middle", fontFace: F.en }); addText(slide, lx + 44, yy + 1, lw - 48, ih - 10, it.text, { size: 15, color: C.text, valign: "top", lineSpacingMultiple: 1.2, fontFace: /[一-鿿]/.test(it.text || "") ? F.cn : F.en }); });
    footer(slide);
  }

  // 柱状图（原生）。labels:[...]，series:[{name,values:[...]}]，horizontal? showValue?
  function barChart(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const cd = (data.series || []).map(s => ({ name: s.name, labels: data.labels || [], values: s.values }));
    const noteH = data.note ? 72 : 0, availTop = cTop + 14, availBot = 932 - noteH;
    slide.addChart("bar", cd, {
      x: U(120), y: U(availTop), w: U(1680), h: U(availBot - availTop), barDir: data.horizontal ? "bar" : "col", barGrouping: "clustered",
      chartColors: [C.primary, C.accent, C.blue, C.green, C.warn], showLegend: cd.length > 1, legendPos: "b", legendFontFace: F.cn, legendColor: C.text,
      showValue: !!data.showValue, dataLabelColor: C.text, dataLabelFontFace: F.en, dataLabelFontSize: 10,
      catAxisLabelColor: C.primary, catAxisLabelFontFace: F.cn, catAxisLabelFontSize: 12,
      valAxisLabelColor: C.mute, valAxisLabelFontSize: 10, valGridLine: { color: C.line, style: "solid", size: 1 }, catGridLine: { style: "none" }
    });
    if (data.note) caveatBand(slide, data.note, availBot + 8);
    footer(slide);
  }

  // 折线图（原生）。labels:[...]，series:[{name,values:[...]}]，smooth?
  function lineChart(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const cd = (data.series || []).map(s => ({ name: s.name, labels: data.labels || [], values: s.values }));
    const noteH = data.note ? 72 : 0, availTop = cTop + 14, availBot = 932 - noteH;
    slide.addChart("line", cd, {
      x: U(120), y: U(availTop), w: U(1680), h: U(availBot - availTop), lineSize: 3, lineSmooth: !!data.smooth, lineDataSymbol: "circle", lineDataSymbolSize: 6,
      chartColors: [C.accent, C.primary, C.blue, C.green], showLegend: cd.length > 1, legendPos: "b", legendFontFace: F.cn, legendColor: C.text,
      catAxisLabelColor: C.primary, catAxisLabelFontFace: F.cn, catAxisLabelFontSize: 12,
      valAxisLabelColor: C.mute, valAxisLabelFontSize: 10, valGridLine: { color: C.line, style: "solid", size: 1 }, catGridLine: { style: "none" }
    });
    if (data.note) caveatBand(slide, data.note, availBot + 8);
    footer(slide);
  }

  // 占比环图（原生 doughnut）+ 右侧构成清单。items:[{label,value}]，unit?
  function pieBreakdown(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const items = data.items || [], cd = [{ name: data.seriesName || "占比", labels: items.map(i => i.label), values: items.map(i => i.value) }];
    const availTop = cTop + 16, availBot = 932, h = availBot - availTop, cols = [C.primary, C.accent, C.blue, C.green, C.warn, C.mute];
    slide.addChart("doughnut", cd, {
      x: U(150), y: U(availTop), w: U(820), h: U(h), holeSize: 60, chartColors: cols.map((c, i) => i < items.length ? c : c),
      showLegend: false, showValue: false, showPercent: !!data.showPercent, dataLabelColor: "FFFFFF", dataLabelFontFace: F.en, dataLabelFontSize: 12
    });
    const lx = 1060, lw = 1824 - lx;
    addText(slide, lx, availTop + 8, lw, 30, data.listTitle || "构成占比", { size: 18, color: C.primary, bold: true });
    const ih = Math.min(82, (h - 56) / Math.max(1, items.length));
    items.slice(0, 6).forEach((it, i) => { const yy = availTop + 54 + i * ih; rect(slide, lx, yy + 5, 18, 18, { fill: cols[i % cols.length] }); addText(slide, lx + 32, yy, lw - 150, 30, it.label, { size: 16, color: C.primary, bold: true, valign: "middle", fontFace: /[一-鿿]/.test(it.label || "") ? F.cn : F.en }); addText(slide, lx + lw - 130, yy, 130, 30, String(it.value) + (data.unit || ""), { size: 17, color: C.accent, bold: true, align: "right", valign: "middle", fontFace: F.en }); });
    footer(slide);
  }

  function moduleCorrespondenceMap(slide, data) {
    header(slide, data.title, data.subtitle);

    const folders = data.folders || [];
    const modules = data.modules || [];
    const left = { x: 96, y: 222, w: 430, h: 642 };
    const rightX = 650;
    const colGap = 42;
    const cardW = 560;
    const cardH = 150;
    const rowGap = 26;
    const cardTop = 226;
    const railX = 585;

    rect(slide, left.x, left.y, left.w, left.h, { fill: C.surface, line: C.line, round: true, shadow: true });
    rect(slide, left.x, left.y, left.w, 7, { fill: C.primary });
    addText(slide, left.x + 30, left.y + 34, left.w - 60, 32, data.rootTitle || "innovation-products-ppt/", {
      size: 26,
      color: C.primary,
      bold: true,
      fontFace: F.en
    });
    addText(slide, left.x + 30, left.y + 78, left.w - 60, 54, data.rootDesc || "一套可执行、可复用、可校验、可演进的 PPT 生产目录。", {
      size: 15,
      color: C.text,
      lineSpacingMultiple: 1.15
    });

    const treeX = left.x + 64;
    const rowX = left.x + 112;
    const rowW = left.w - 148;
    const rowH = 40;
    const rowStart = left.y + 160;
    const rowStep = 55;
    const spineTop = rowStart + 20;
    const spineBottom = rowStart + Math.max(0, folders.length - 1) * rowStep + 20;
    line(slide, treeX, spineTop, treeX, spineBottom, { color: C.line, width: 1 });

    folders.forEach((f, i) => {
      const y = rowStart + i * rowStep;
      const hot = !!f.focus;
      const ink = hot ? C.accent : C.primary;
      line(slide, treeX, y + rowH / 2, rowX - 10, y + rowH / 2, { color: C.line, width: 1 });
      rect(slide, rowX, y, rowW, rowH, {
        fill: hot ? C.accentSoft : C.surface2,
        line: hot ? C.accent : C.line,
        lineWidth: hot ? 1.25 : 1,
        round: true
      });
      addText(slide, rowX + 18, y + 9, 118, 18, f.name, {
        size: 13,
        color: ink,
        bold: true,
        fontFace: F.en,
        fit: "shrink"
      });
      addText(slide, rowX + 150, y + 10, rowW - 168, 18, f.role, {
        size: 12,
        color: C.mute,
        fit: "shrink"
      });
    });

    line(slide, left.x + left.w + 18, 544, railX, 544, { color: C.line, width: 1.2 });
    line(slide, railX, cardTop + 75, railX, cardTop + 2 * (cardH + rowGap) + 75, { color: C.line, width: 1.2 });

    modules.forEach((m, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = rightX + col * (cardW + colGap);
      const y = cardTop + row * (cardH + rowGap);
      const hot = !!m.focus;
      const ink = hot ? C.accent : C.primary;
      const sourceText = (m.sources || []).join(" / ");

      if (col === 0) {
        line(slide, railX, y + cardH / 2, x - 22, y + cardH / 2, {
          color: C.line,
          width: 1.1,
          arrow: "triangle"
        });
      }

      rect(slide, x, y, cardW, cardH, {
        fill: hot ? C.accentSoft : C.surface,
        line: hot ? C.accent : C.line,
        lineWidth: hot ? 1.45 : 1,
        round: true,
        shadow: true
      });
      rect(slide, x + 22, y + 22, 5, cardH - 44, { fill: ink });
      addText(slide, x + 46, y + 22, 270, 28, m.title, {
        size: 22,
        color: ink,
        bold: true,
        fit: "shrink"
      });
      addText(slide, x + 322, y + 28, cardW - 348, 16, m.label || "", {
        size: 10,
        color: C.faint,
        bold: true,
        align: "right",
        fontFace: F.en,
        fit: "shrink"
      });
      addText(slide, x + 46, y + 58, cardW - 92, 30, m.role, {
        size: 14,
        color: C.text,
        fit: "shrink",
        lineSpacingMultiple: 1.12
      });
      rect(slide, x + 46, y + 104, 206, 28, {
        fill: C.surface2,
        line: hot ? C.accent : C.line,
        lineWidth: 0.85,
        round: true
      });
      addText(slide, x + 58, y + 111, 182, 12, `来自 ${sourceText}`, {
        size: 9.5,
        color: hot ? C.accent : C.primary,
        bold: true,
        fontFace: F.en,
        fit: "shrink"
      });
      addText(slide, x + 274, y + 108, cardW - 320, 18, `输出：${m.output}`, {
        size: 12.5,
        color: C.mute,
        fit: "shrink"
      });
    });

    if (data.note) caveatBand(slide, data.note, 884);
    footer(slide);
  }

  function platformTrend(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const items = (data.cols || data.items || [
      { title: "Industry Signal", desc: "Common direction is becoming visible.", items: ["agent", "workflow", "QA"] },
      { title: "Platform Move", desc: "Capability is moving from prompt to harness.", items: ["tools", "state", "routing"], focus: true },
      { title: "Project Value", desc: "Local practice turns into reusable assets.", items: ["components", "lessons", "templates"] }
    ]).slice(0, 3);
    const center = { x: 690, y: 412, w: 540, h: 150 };
    rect(slide, center.x, center.y, center.w, center.h, { fill: C.primary, line: C.primary, round: true, shadow: true });
    addText(slide, center.x + 36, center.y + 36, center.w - 72, 34, data.center || "Shared Trend", { size: 27, color: "FFFFFF", bold: true, align: "center", fit: "shrink" });
    addText(slide, center.x + 42, center.y + 82, center.w - 84, 28, data.centerBody || "A repeated signal across platform, product, and project layers.", { size: 13, color: "FFFFFF", align: "center", fit: "shrink" });
    const cards = [
      { x: 126, y: 288, w: 430, h: 230, anchor: [center.x, center.y + 74] },
      { x: 1364, y: 288, w: 430, h: 230, anchor: [center.x + center.w, center.y + 74] },
      { x: 520, y: 682, w: 880, h: 142, anchor: [center.x + center.w / 2, center.y + center.h] }
    ];
    items.forEach((it, i) => {
      const p = cards[i], hot = it.focus === true || data.focus === i || i === 1, col = hot ? C.accent : C.primary;
      const targetX = i === 0 ? p.x + p.w : i === 1 ? p.x : p.x + p.w / 2;
      const targetY = i === 2 ? p.y : p.y + p.h / 2;
      line(slide, p.anchor[0], p.anchor[1], targetX, targetY, { color: hot ? C.accent : C.line, width: hot ? 1.5 : 1.1, arrow: "triangle" });
      rect(slide, p.x, p.y, p.w, p.h, { fill: hot ? C.accentSoft : C.surface, line: hot ? C.accent : C.line, lineWidth: hot ? 1.5 : 1, round: true, shadow: true });
      rect(slide, p.x, p.y, p.w, 6, { fill: col });
      addText(slide, p.x + 28, p.y + 28, p.w - 56, 28, it.title, { size: 20, color: col, bold: true, fit: "shrink" });
      addText(slide, p.x + 28, p.y + 70, p.w - 56, i === 2 ? 24 : 58, it.desc || "", { size: 14, color: C.text, lineSpacingMultiple: 1.2, fit: "shrink" });
      (it.items || []).slice(0, i === 2 ? 4 : 3).forEach((chip, j) => {
        const chipW = i === 2 ? 160 : 116;
        const x = p.x + 28 + j * (chipW + 14), y = p.y + (i === 2 ? 98 : 154);
        rect(slide, x, y, chipW, 28, { fill: C.surface2, line: hot ? C.accent : C.line, round: true });
        addText(slide, x + 8, y + 9, chipW - 16, 10, chip, { size: 10, color: col, bold: true, align: "center", fit: "shrink", fontFace: F.en });
      });
    });
    if (data.takeaway) caveatBand(slide, data.takeaway, 884);
    footer(slide);
  }

  function problemMap(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const rows = (data.rows || [
      { name: "Drift", problem: "context moves away", mechanism: "State", result: "keep local memory" },
      { name: "Rework", problem: "changes spread too far", mechanism: "Scope", result: "repair the smallest unit", focus: true },
      { name: "Noise", problem: "too much context", mechanism: "Route", result: "read only needed files" },
      { name: "Quality", problem: "visual issues slip through", mechanism: "QA", result: "rendered evidence gate" }
    ]).slice(0, 5);
    const leftX = 110, rightX = 1160, rowH = 74, gap = 26;
    const blockH = rows.length * rowH + (rows.length - 1) * gap;
    const y0 = Math.round(cTop + 28 + ((900 - cTop) - blockH) / 2);
    addText(slide, leftX, y0 - 42, 520, 26, data.leftTitle || "Problem", { size: 20, color: C.primary, bold: true });
    addText(slide, rightX, y0 - 42, 520, 26, data.rightTitle || "Harness Mechanism", { size: 20, color: C.accent, bold: true });
    rows.forEach((r, i) => {
      const y = y0 + i * (rowH + gap), hot = r.focus === true || data.focus === i, col = hot ? C.accent : C.primary;
      rect(slide, leftX, y, 540, rowH, { fill: hot ? C.accentSoft : C.surface, line: hot ? C.accent : C.line, lineWidth: hot ? 1.4 : 1, round: true, shadow: true });
      shp(slide, shape.ellipse, leftX + 28, y + 19, 36, 36, { fill: col });
      addText(slide, leftX + 28, y + 29, 36, 12, String(i + 1), { size: 10, color: "FFFFFF", bold: true, align: "center", fontFace: F.en });
      addText(slide, leftX + 84, y + 16, 160, 20, r.name, { size: 16, color: col, bold: true, fit: "shrink" });
      addText(slide, leftX + 250, y + 18, 250, 28, r.problem, { size: 12.5, color: C.mute, fit: "shrink" });
      line(slide, leftX + 560, y + rowH / 2, rightX - 24, y + rowH / 2, { color: hot ? C.accent : C.line, width: hot ? 1.6 : 1, arrow: "triangle" });
      rect(slide, rightX, y, 540, rowH, { fill: C.surface, line: hot ? C.accent : C.line, lineWidth: hot ? 1.4 : 1, round: true, shadow: true });
      rect(slide, rightX, y, 7, rowH, { fill: col });
      addText(slide, rightX + 28, y + 16, 150, 20, r.mechanism, { size: 16, color: col, bold: true, fit: "shrink" });
      addText(slide, rightX + 196, y + 18, 300, 28, r.result, { size: 12.5, color: C.text, fit: "shrink" });
    });
    if (data.takeaway) caveatBand(slide, data.takeaway, 884);
    footer(slide);
  }

  function repairScope(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const levels = (data.levels || [
      { title: "Page", body: "repair one page folder", check: "render page PNG", focus: true },
      { title: "Component", body: "repair reusable block", check: "rerender affected pages" },
      { title: "Theme", body: "repair shared tokens", check: "full deck gate" }
    ]).slice(0, 4);
    const x0 = 150, y0 = cTop + 64, cardW = 360, cardH = 150, gap = 52;
    levels.forEach((l, i) => {
      const x = x0 + i * (cardW + gap), y = y0 + i * 38, hot = l.focus === true || data.focus === i, col = hot ? C.accent : C.primary;
      rect(slide, x, y, cardW, cardH, { fill: hot ? C.accentSoft : C.surface, line: hot ? C.accent : C.line, lineWidth: hot ? 1.6 : 1, round: true, shadow: true });
      rect(slide, x, y, cardW, 6, { fill: col });
      addText(slide, x + 26, y + 26, cardW - 52, 28, l.title, { size: 22, color: col, bold: true, fit: "shrink" });
      addText(slide, x + 26, y + 68, cardW - 52, 34, l.body || "", { size: 14, color: C.text, fit: "shrink" });
      addText(slide, x + 26, y + 112, cardW - 52, 18, l.check || "", { size: 11.5, color: C.mute, fit: "shrink" });
      if (i < levels.length - 1) line(slide, x + cardW, y + cardH / 2, x + cardW + gap - 8, y + cardH / 2 + 38, { color: C.line, width: 1.2, arrow: "triangle" });
    });
    rect(slide, 260, 760, 1400, 72, { fill: C.surface2, line: C.line, round: true });
    addText(slide, 300, 782, 220, 24, data.ruleTitle || "Repair Rule", { size: 18, color: C.accent, bold: true, fontFace: F.en });
    addText(slide, 540, 782, 1060, 24, data.rule || "Choose the smallest affected unit first; expand scope only when shared assets changed.", { size: 16, color: C.primary, bold: true, fit: "shrink" });
    footer(slide);
  }

  function shareBoundary(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const zones = (data.zones || [
      { title: "Share", body: "common logic, neutral components, theme tokens", items: ["component", "template", "QA rule"], focus: true },
      { title: "Review", body: "needs judgment before promotion", items: ["variant", "example", "lesson"] },
      { title: "Keep Local", body: "project-specific or sensitive content", items: ["customer data", "private file", "one-off claim"] }
    ]).slice(0, 3);
    const gap = 42, w = (1728 - 2 * gap) / 3, y = cTop + 76, h = 440;
    zones.forEach((z, i) => {
      const x = 96 + i * (w + gap), hot = z.focus === true || data.focus === i, col = hot ? C.accent : C.primary;
      rect(slide, x, y, w, h, { fill: hot ? C.accentSoft : C.surface, line: hot ? C.accent : C.line, lineWidth: hot ? 1.6 : 1, round: true, shadow: true });
      rect(slide, x, y, w, 7, { fill: col });
      addText(slide, x + 30, y + 34, w - 60, 30, z.title, { size: 24, color: col, bold: true, fit: "shrink" });
      addText(slide, x + 30, y + 82, w - 60, 58, z.body, { size: 14, color: C.text, lineSpacingMultiple: 1.2, fit: "shrink" });
      (z.items || []).slice(0, 5).forEach((it, j) => {
        const yy = y + 170 + j * 46;
        rect(slide, x + 34, yy, w - 68, 30, { fill: C.surface2, line: j === 0 && hot ? C.accent : C.line, round: true });
        addText(slide, x + 52, yy + 9, w - 104, 12, it, { size: 11.5, color: col, bold: j === 0 && hot, align: "center", fit: "shrink" });
      });
      if (i < zones.length - 1) line(slide, x + w + 4, y + h / 2, x + w + gap - 6, y + h / 2, { color: C.line, width: 1.2, arrow: "triangle" });
    });
    if (data.bottom) caveatBand(slide, data.bottom, 842);
    footer(slide);
  }

  function scenarioBankGrid(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const items = (data.items || [
      { title: "Project", desc: "case-specific scene", icon: "document" },
      { title: "Process", desc: "repeatable workflow", icon: "route", focus: true },
      { title: "Component", desc: "visual expression", icon: "layers" },
      { title: "Evidence", desc: "source-backed proof", icon: "target" },
      { title: "QA", desc: "check profile", icon: "shield" },
      { title: "Lesson", desc: "promoted rule", icon: "chart" }
    ]).slice(0, 6);
    const cols = 3, cardW = 500, cardH = 170, gapX = 54, gapY = 36;
    const blockW = cols * cardW + (cols - 1) * gapX, x0 = 960 - blockW / 2, y0 = cTop + 52;
    items.forEach((it, i) => {
      const x = x0 + (i % cols) * (cardW + gapX), y = y0 + Math.floor(i / cols) * (cardH + gapY);
      const hot = it.focus === true || data.focus === i, col = hot ? C.accent : C.primary;
      rect(slide, x, y, cardW, cardH, { fill: hot ? C.accentSoft : C.surface, line: hot ? C.accent : C.line, lineWidth: hot ? 1.5 : 1, round: true, shadow: true });
      icon(pptx, slide, U, x + 58, y + 78, it.icon || "document", { color: col, soft: hot ? C.accentSoft : C.surface2 });
      addText(slide, x + 116, y + 40, cardW - 150, 28, it.title, { size: 21, color: col, bold: true, fit: "shrink" });
      addText(slide, x + 116, y + 82, cardW - 150, 36, it.desc || "", { size: 14, color: C.mute, fit: "shrink" });
    });
    footer(slide);
  }

  function positioningMatrix(slide, data) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const x = 260, y = cTop + 42, w = 1100, h = 610;
    rect(slide, x, y, w, h, { fill: C.surface, line: C.line, round: true, shadow: true });
    line(slide, x + w / 2, y + 48, x + w / 2, y + h - 48, { color: C.line, width: 1.2 });
    line(slide, x + 58, y + h / 2, x + w - 58, y + h / 2, { color: C.line, width: 1.2 });
    addText(slide, x + w - 270, y + h - 40, 250, 24, data.xLabel || "Higher reuse", { size: 13, color: C.mute, align: "right", fontFace: F.en });
    addText(slide, x + 18, y + 18, 260, 24, data.yLabel || "Higher impact", { size: 13, color: C.mute, fontFace: F.en });
    const labels = data.quadrants || ["Strategic", "Scale", "Niche", "Foundation"];
    [[x + w / 2 + 34, y + 74], [x + 86, y + 74], [x + 86, y + h / 2 + 34], [x + w / 2 + 34, y + h / 2 + 34]].forEach((p, i) => {
      addText(slide, p[0], p[1], 260, 26, labels[i], { size: 15, color: C.faint, bold: true, fontFace: F.en });
    });
    const items = (data.items || [
      { name: "A", x: 0.72, y: 0.78, focus: true },
      { name: "B", x: 0.42, y: 0.62 },
      { name: "C", x: 0.30, y: 0.34 },
      { name: "D", x: 0.68, y: 0.38 }
    ]).slice(0, 8);
    items.forEach((it, i) => {
      const px = x + 80 + it.x * (w - 160), py = y + h - 80 - it.y * (h - 160);
      const hot = it.focus === true || data.focus === i, col = hot ? C.accent : C.primary;
      shp(slide, shape.ellipse, px - 18, py - 18, 36, 36, { fill: col, line: "FFFFFF", lw: 2, shadow: true });
      addText(slide, px - 18, py - 12, 36, 24, it.name, { size: 12, color: "FFFFFF", bold: true, align: "center", fontFace: F.en });
      if (it.desc) addText(slide, px + 24, py - 13, 170, 24, it.desc, { size: 11, color: col, bold: hot, fit: "shrink" });
    });
    rect(slide, 1430, y + 80, 360, 280, { fill: C.surface2, line: C.line, round: true });
    addText(slide, 1460, y + 112, 300, 26, data.legendTitle || "Decision Reading", { size: 18, color: C.primary, bold: true, fontFace: F.en });
    addText(slide, 1460, y + 158, 290, 118, data.legend || "Use the upper-right area for high-impact, high-reuse candidates. Red marks the recommended focus.", { size: 14, color: C.text, lineSpacingMultiple: 1.25, fit: "shrink" });
    footer(slide);
  }

  // ——— Base2 signature 元件（Round 2）———
  // 三者都走 rect()/addText()。圆角由主题收口，阴影由语义 surface
  // role 决定；Base2 不是“所有矩形自动带阴影”。

  // 分区眉标：letter-spaced 全大写区域标，作为区块上方的导览层。
  function regionEyebrow(slide, x, y, w, text, opts = {}) {
    addText(slide, x, y, w, opts.h || 22, String(text || "").toUpperCase(), {
      size: opts.size || theme.type.tiny || 13,
      color: opts.color || C.mute,
      bold: true,
      align: opts.align || "left",
      fontFace: F.en,
      charSpacing: opts.charSpacing ?? 2.2
    });
  }

  // 左色条卡：容器级状态编码。tier=low/mid/high/done/warn，或用 barColor 自定义。
  // 位置 + 色条 + 填充 + 标签四通道表达状态，颜色不是唯一通道。
  function barCard(slide, x, y, w, h, data = {}) {
    const danger = C.danger || C.accent;
    const dangerSoft = C.dangerSoft || C.accentSoft;
    const tierColor = { low: C.primary, mid: C.blue, high: danger, done: C.green, warn: C.warn };
    const col = data.barColor || tierColor[data.tier] || C.primary;
    const blocked = data.blocked || data.tier === "high";
    rect(slide, x, y, w, h, {
      fill: blocked ? dangerSoft : C.surface,
      line: blocked ? danger : C.line,
      lineWidth: blocked ? 1.4 : 1,
      round: true,
      shadow: true
    });
    if (theme.rail?.enabled !== false && data.rail !== false) {
      rect(slide, x + 10, y + 12, 5, Math.max(8, h - 24), { fill: col, round: true, radius: 3 });
    }
    if (data.label) addText(slide, x + 30, y + 14, w - 210, 26, data.label, { size: theme.type.cap || 16, color: blocked ? danger : C.primary, bold: true, fontFace: F.en, charSpacing: 0.8 });
    if (data.meta) addText(slide, x + 30, y + 44, w - 210, 24, data.meta, { size: theme.type.micro || 14, color: C.mute });
    if (data.tag) addText(slide, x + w - 180, y + 15, 160, 22, data.tag, { size: theme.type.micro || 14, color: C.mute, align: "right" });
    if (data.outcome) addText(slide, x + w - 330, y + 42, 310, 28, data.outcome, { size: theme.type.bodyLg || 22, color: blocked ? danger : C.primary, bold: true, align: "right" });
  }

  // 结论带：base=居中红字、无容器；base2=描边圆角带 + 眉标。由 signature.conclusion 决定。
  function conclusionBand(slide, data = {}) {
    const style = data.style || (theme.signature && theme.signature.conclusion) || "plain";
    const x = data.x ?? 96, w = data.w ?? 1728, y = data.y ?? 892;
    if (style === "band") {
      const h = data.h ?? 92;
      rect(slide, x, y, w, h, { fill: C.surface, line: C.primary, lineWidth: 1, round: true });
      if (data.eyebrow) regionEyebrow(slide, x, y + 14, w, data.eyebrow, { align: "center" });
      addText(slide, x, y + (data.eyebrow ? 44 : 30), w, 34, data.text || "", { size: theme.type.bodyLg || 24, color: C.primary, bold: true, align: "center" });
      return;
    }
    addText(slide, x, y + 20, w, 40, data.text || "", { size: theme.type.lead || 28, color: C.accent, bold: true, align: "center" });
  }

  // Base2 compositional primitives. They intentionally expose semantic roles
  // instead of asking page code to hand-author fills, radii, rails, and shadows.
  function surface(slide, x, y, w, h, role = "card", opts = {}) {
    const style = theme.componentStyle?.[role] || theme.componentStyle?.card || {};
    const radiusName = style.radius || (role === "panel" || role === "gate" ? "panel" : "card");
    const radius = opts.radius ?? theme.shape?.radius?.[radiusName] ?? 18;
    const fill = opts.fill ?? (style.fill && C[style.fill]) ?? C.surface;
    const styledLine = style.line === "none" ? undefined : (style.line && C[style.line]);
    const lineColor = opts.line === undefined ? styledLine : opts.line;
    const strokeRole = style.stroke || (role === "gate" ? "gate" : role === "activeState" ? "focus" : role === "panel" ? "emphasized" : "neutral");
    const lineWidth = opts.lineWidth ?? theme.stroke?.[strokeRole] ?? 1;
    const elevation = opts.shadow === undefined
      ? (style.elevation && style.elevation !== "none" ? shadowToken(style.elevation) : false)
      : opts.shadow;
    rect(slide, x, y, w, h, {
      ...opts,
      fill,
      line: lineColor,
      lineWidth,
      round: radius > 0,
      radius,
      shadow: elevation
    });
    return { role, fill, line: lineColor, lineWidth, radius };
  }

  function surfaceRail(slide, x, y, w, h, opts = {}) {
    const side = opts.side || "left";
    const token = theme.rail || {};
    const thickness = opts.thickness ?? token.thickness ?? 6;
    const edgeInset = opts.edgeInset ?? token.edgeInset ?? 1;
    const crossInset = opts.crossInset ?? token.crossInset ?? 12;
    const radius = opts.radius ?? theme.shape?.radius?.[token.radius || "micro"] ?? 5;
    const color = opts.color || C.primary;
    if (side === "top" || side === "bottom") {
      const railY = side === "top" ? y + edgeInset : y + h - edgeInset - thickness;
      rect(slide, x + crossInset, railY, Math.max(1, w - crossInset * 2), thickness, { fill: color, round: true, radius });
    } else {
      const railX = side === "left" ? x + edgeInset : x + w - edgeInset - thickness;
      rect(slide, railX, y + crossInset, thickness, Math.max(1, h - crossInset * 2), { fill: color, round: true, radius });
    }
    return { side, thickness, edgeInset, crossInset, color };
  }

  // Rails encode state, never decoration. In particular, review stays on a
  // neutral surface with a blue rail; only blocked/current/Gate states turn red.
  function semanticRail(slide, x, y, w, h, meaning = "stable", opts = {}) {
    if (theme.rail?.enabled === false || opts.enabled === false) {
      return { skipped: true, reason: "theme.rail.enabled=false", meaning: String(meaning || "stable") };
    }
    const meanings = theme.rail?.meanings || {
      stable: "primary", review: "blue", blocked: "danger", pass: "green", warning: "warn"
    };
    const rawMeaning = String(meaning || "stable").trim().toLowerCase();
    const normalizedMeaning = ["high", "current", "gate", "active"].includes(rawMeaning) ? "blocked" : rawMeaning;
    const colorRole = meanings[normalizedMeaning];
    if (!colorRole) throw new Error(`semanticRail requires one of: ${[...Object.keys(meanings), "high", "current", "gate", "active"].join(", ")}`);
    return surfaceRail(slide, x, y, w, h, {
      side: opts.side || theme.rail?.preferredSide || "left",
      color: opts.color || C[colorRole] || colorRole,
      thickness: opts.thickness,
      edgeInset: opts.edgeInset,
      crossInset: opts.crossInset,
      radius: opts.radius
    });
  }

  function sectionLabel(slide, x, y, w, text, opts = {}) {
    const tone = opts.tone || "stable";
    const color = tone === "boundary" ? C.accent : tone === "muted" ? C.mute : C.primary;
    addText(slide, x, y, w, opts.h || 24, text, {
      size: opts.size || theme.type.micro,
      color,
      bold: true,
      align: opts.align || "left",
      fontFace: F.en,
      charSpacing: opts.charSpacing ?? 2.1
    });
  }

  function numberBadge(slide, x, y, number, opts = {}) {
    const active = opts.active === true;
    const fill = active ? C.accent : (opts.fill || C.surface3);
    const ink = active ? C.onAccent : (opts.color || C.primary);
    const size = opts.size || 44;
    rect(slide, x, y, size, size, {
      fill,
      line: active ? C.accent : (opts.line || C.line),
      lineWidth: active ? 1.4 : 1,
      round: true,
      radius: size / 2
    });
    addText(slide, x, y + Math.round(size * 0.23), size, Math.round(size * 0.5), String(number), {
      size: opts.textSize || theme.type.micro,
      color: ink,
      bold: true,
      align: "center",
      fontFace: F.en
    });
  }

  function insetRow(slide, x, y, w, h, data = {}) {
    surface(slide, x, y, w, h, data.role || "insetRow", {
      fill: data.fill,
      line: data.line,
      lineWidth: data.lineWidth,
      shadow: false
    });
    if (data.number != null) numberBadge(slide, x + 16, y + (h - 38) / 2, data.number, { size: 38, active: data.active });
    const left = x + (data.number != null ? 70 : 20);
    const rightReserve = data.trailing ? (data.trailingWidth || 150) : 0;
    addText(slide, left, y + 12, w - (left - x) - 20 - rightReserve, 26, data.title || "", {
      size: data.titleSize || theme.type.bodySm,
      color: data.active ? C.accent : (data.titleColor || C.primary),
      bold: true,
      fontFace: data.fontFace
    });
    if (data.desc) addText(slide, left, y + 42, w - (left - x) - 20 - rightReserve, Math.max(18, h - 50), data.desc, {
      size: data.descSize || theme.type.micro,
      color: data.descColor || C.mute,
      valign: data.descValign || "top"
    });
    if (data.trailing) addText(slide, x + w - rightReserve - 16, y + 12, rightReserve, h - 24, data.trailing, {
      size: data.trailingSize || theme.type.micro,
      color: data.trailingColor || C.primary,
      bold: !!data.trailingBold,
      align: "right",
      valign: "middle",
      fontFace: data.trailingFontFace
    });
  }

  function statusCard(slide, x, y, w, h, data = {}) {
    const hasNamedState = data.state != null || data.railMeaning != null;
    const state = String(data.state || data.railMeaning || "stable").trim().toLowerCase();
    const dangerState = ["blocked", "high", "current", "gate", "active"].includes(state);
    // A named state wins over the generic active flag. In particular,
    // review + active must never become a red surface with a blue rail.
    const active = dangerState || (!hasNamedState && data.active === true) || (state === "stable" && data.active === true);
    const railMeaning = active ? "blocked" : state;
    const surfaceRole = active ? "activeState" : (data.role || "statusCard");
    surface(slide, x, y, w, h, surfaceRole, data.surface || {});
    if (railMeaning && theme.rail?.enabled !== false && data.rail !== false) {
      semanticRail(slide, x, y, w, h, railMeaning, { side: data.railSide || "left" });
    }
    const activeColor = C.danger || C.accent;
    addText(slide, x + 28, y + 18, w - 56, 30, data.title || "", {
      size: data.titleSize || theme.type.body,
      color: active ? activeColor : (data.titleColor || C.primary),
      bold: true,
      align: data.align || "left",
      fontFace: data.fontFace
    });
    if (data.desc) addText(slide, x + 28, y + 56, w - 56, h - 72, data.desc, {
      size: data.descSize || (h >= 120 ? theme.type.bodySm : theme.type.cap),
      color: data.descColor || C.mute,
      align: data.align || "left",
      valign: data.descValign || (h >= 220 ? "middle" : "top")
    });
    return { state, railMeaning, active, surfaceRole };
  }

  // Compatibility wrapper for approved Base2 pages. New pages may call
  // conclusionBand directly; both variants preserve the same decision-band
  // geometry and semantic color contract.
  function semanticConclusion(slide, data = {}) {
    const tone = data.tone || "boundary";
    const role = tone === "stable" ? "stableConclusion" : "conclusionBand";
    const ink = tone === "stable" ? C.primary : C.accent;
    const x = data.x ?? 96, y = data.y ?? 850, w = data.w ?? 1728, h = data.h ?? 78;
    surface(slide, x, y, w, h, role);
    if (data.label) sectionLabel(slide, x + 24, y + 12, w - 48, data.label, {
      tone: tone === "stable" ? "stable" : "boundary",
      align: "center",
      h: 20,
      size: theme.type.micro,
      charSpacing: 1.3
    });
    addText(slide, x + 28, y + (data.label ? 40 : 22), w - 56, data.label ? 28 : 34, data.text || "", {
      size: data.textSize || theme.type.bodySm,
      color: ink,
      bold: true,
      align: "center",
      valign: "middle"
    });
  }

  // A reusable Base2 page pattern: supporting source and receipt zones flank
  // one dominant governance board. This prevents the common equal-card-wall
  // regression while preserving a full-height decision band.
  function base2GovernanceChain(slide, data = {}) {
    header(slide, data.title, data.subtitle);
    const stages = (data.steps || []).slice(0, 5);
    sectionLabel(slide, 96, 246, 250, data.sourceLabel || "SOURCE", { tone: "muted" });
    sectionLabel(slide, 382, 246, 1156, data.chainLabel || "GOVERNANCE CHAIN", { align: "center" });
    sectionLabel(slide, 1574, 246, 250, data.receiptLabel || "GOVERNED OUTPUT", { align: "right" });

    surface(slide, 96, 310, 250, 438, "evidencePanel");
    addText(slide, 122, 330, 198, 54, data.sourceTitle || "Source bundle", { size: theme.type.body, color: C.primary, bold: true, align: "center", valign: "middle" });
    addText(slide, 122, 392, 198, 50, data.sourceDesc || "Prepared evidence entering the mechanism", { size: theme.type.bodySm, color: C.mute, align: "center", valign: "middle" });
    (data.sourceFacts || ["declared scope", "source boundary", "review context"]).slice(0, 3).forEach((fact, i) => {
      insetRow(slide, 120, 456 + i * 72, 202, 54, { title: fact, titleSize: theme.type.micro });
    });

    surface(slide, 382, 284, 1156, 490, "evidencePanel");
    addText(slide, 418, 314, 720, 30, data.boardTitle || "REQUIRED LINKS", { size: theme.type.body, color: C.primary, bold: true, fontFace: F.en, charSpacing: 1.1 });
    addText(slide, 1200, 318, 302, 24, data.boardNote || "Each link must remain explicit and auditable", { size: theme.type.micro, color: C.mute, align: "right" });
    line(slide, 418, 366, 1502, 366, { color: C.line, width: 1.2 });

    const nodeY = 410, nodeH = 228, gap = 30, innerX = 414, innerW = 1092;
    const nodeW = (innerW - gap * 4) / 5;
    stages.forEach((stage, i) => {
      const x = innerX + i * (nodeW + gap);
      const active = !!stage.key;
      surface(slide, x, nodeY, nodeW, nodeH, active ? "activeState" : "insetRow", { shadow: active ? undefined : false });
      numberBadge(slide, x + (nodeW - 46) / 2, nodeY + 24, String(i + 1).padStart(2, "0"), { size: 46, active });
      addText(slide, x + 14, nodeY + 88, nodeW - 28, 30, stage.title || "", { size: theme.type.body, color: active ? C.accent : C.primary, bold: true, align: "center" });
      addText(slide, x + 16, nodeY + 134, nodeW - 32, 64, stage.desc || "", { size: theme.type.micro, color: C.mute, align: "center", valign: "middle", lineSpacingMultiple: 1.15 });
      if (i < stages.length - 1) line(slide, x + nodeW + 5, nodeY + nodeH / 2, x + nodeW + gap - 5, nodeY + nodeH / 2, {
        color: active ? C.accent : C.line,
        width: active ? 1.8 : 1.4,
        arrow: "triangle"
      });
    });
    addText(slide, 418, 680, 1084, 24, data.chainNote || "prepare → check → decide → version → recover", { size: theme.type.micro, color: C.primary, bold: true, align: "center" });

    surface(slide, 1574, 310, 250, 438, "evidencePanel");
    addText(slide, 1600, 330, 198, 54, data.receiptTitle || "Governed output", { size: theme.type.body, color: C.primary, bold: true, align: "center", valign: "middle" });
    addText(slide, 1600, 392, 198, 50, data.receiptDesc || "A traceable and recoverable result", { size: theme.type.bodySm, color: C.mute, align: "center", valign: "middle" });
    (data.receiptFacts || ["traceable", "reviewed", "recoverable"]).slice(0, 3).forEach((fact, i) => {
      insetRow(slide, 1598, 456 + i * 72, 202, 54, { number: i + 1, title: fact, titleSize: theme.type.micro });
    });
    line(slide, 346, 526, 382, 526, { color: C.primary, width: 1.8, arrow: "triangle" });
    line(slide, 1538, 526, 1574, 526, { color: C.primary, width: 1.8, arrow: "triangle" });

    semanticConclusion(slide, {
      tone: "boundary",
      label: data.conclusionLabel || "DECISION BOUNDARY",
      text: data.takeaway || "A governed result needs explicit checks, a decision boundary, versioning, and recovery."
    });
    footer(slide);
  }

  // Global-capable high-capacity engineering patterns. They remain shared
  // renderers: theme.contentFidelity changes density/geometry without forking
  // the component library.

  // Dominant screenshot/diagram plus a narrow, precisely numbered evidence rail.
  function evidenceBoard(slide, data = {}) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const global = theme.contentFidelity?.id === "leander-global" || theme.signature?.id === "leander-global";
    const top = cTop + 14, bottom = 934, gap = global ? 26 : 34;
    const railW = global ? 430 : 470, mainX = 96, mainW = 1728 - railW - gap, h = bottom - top;
    rect(slide, mainX, top, mainW, h, { fill: C.surface2, line: C.line, round: !global, shadow: false });
    if (data.image && fs.existsSync(data.image)) {
      slide.addImage({ path: data.image, x: U(mainX + 8), y: U(top + 8), w: U(mainW - 16), h: U(h - 16) });
    } else {
      addText(slide, mainX + 42, top + h / 2 - 34, mainW - 84, 30, data.placeholder || "EVIDENCE SLOT — SOURCE REQUIRED", {
        size: global ? 17 : 19, color: C.primary, bold: true, align: "center", fontFace: F.en, charSpacing: global ? 1.5 : 0
      });
      addText(slide, mainX + 70, top + h / 2 + 12, mainW - 140, 28, data.placeholderDetail || "Insert a real screenshot, engineering diagram, or approved render.", {
        size: 13, color: C.mute, align: "center", fit: "shrink"
      });
    }
    const railX = mainX + mainW + gap;
    regionEyebrow(slide, railX, top, railW, data.railTitle || "EVIDENCE ANCHORS", { size: global ? 11 : 13, charSpacing: global ? 2.8 : 2 });
    const items = (data.callouts || []).slice(0, 7), rowTop = top + 38;
    const rowH = Math.min(global ? 76 : 88, (h - 48) / Math.max(1, items.length));
    items.forEach((item, i) => {
      const y = rowTop + i * rowH, hot = item.focus === true || data.focus === i;
      line(slide, railX, y + rowH - 2, railX + railW, y + rowH - 2, { color: C.line, width: global ? 0.7 : 1 });
      shp(slide, shape.ellipse, railX, y + 10, 30, 30, { fill: hot ? C.accent : C.primary, line: hot ? C.accent : C.primary });
      addText(slide, railX, y + 17, 30, 14, String(i + 1).padStart(2, "0"), { size: 9, color: hot ? C.onAccent : C.onPrimary, bold: true, align: "center", fontFace: F.en });
      addText(slide, railX + 46, y + 6, railW - 46, 24, item.title || item.label || `Anchor ${i + 1}`, { size: global ? 14 : 16, color: hot ? C.accent : C.primary, bold: true, fit: "shrink" });
      addText(slide, railX + 46, y + 33, railW - 46, Math.max(20, rowH - 40), item.body || item.desc || "", { size: global ? 11.5 : 13, color: C.mute, fit: "shrink", lineSpacingMultiple: 1.15 });
    });
    if (data.source) addText(slide, mainX + 18, bottom - 26, mainW - 36, 18, `SOURCE  ${data.source}`, { size: 9.5, color: C.mute, fontFace: F.en, fit: "shrink" });
    footer(slide);
  }

  // Dense horizontal metric rail. Metrics share rules and baselines rather than
  // expanding into equal-size dashboard cards.
  function compactKpiRail(slide, data = {}) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const global = theme.contentFidelity?.id === "leander-global" || theme.signature?.id === "leander-global";
    const items = (data.items || []).slice(0, 10), n = Math.max(1, items.length);
    const x = 96, w = 1728, y = cTop + (global ? 28 : 48), h = global ? 166 : 190;
    line(slide, x, y, x + w, y, { color: C.primary, width: global ? 1.2 : 1.5 });
    line(slide, x, y + h, x + w, y + h, { color: C.line, width: 1 });
    const cellW = w / n;
    items.forEach((item, i) => {
      const cx = x + i * cellW, hot = item.focus === true || data.focus === i;
      if (i) line(slide, cx, y + 18, cx, y + h - 18, { color: C.line, width: global ? 0.65 : 1 });
      addText(slide, cx + 16, y + 20, cellW - 32, 18, item.label || "", { size: global ? 10.5 : 12.5, color: C.mute, bold: true, fontFace: F.en, charSpacing: global ? 1.2 : 0, fit: "shrink" });
      addText(slide, cx + 16, y + 50, cellW - 32, 42, item.value == null ? "—" : String(item.value), { size: global ? 25 : 29, color: hot ? C.accent : C.primary, bold: true, fontFace: F.en, fit: "shrink" });
      addText(slide, cx + 16, y + 99, cellW - 32, 20, item.unit || item.state || "", { size: global ? 9.5 : 11, color: C.mute, fontFace: F.en, fit: "shrink" });
      if (item.delta != null) addText(slide, cx + 16, y + 127, cellW - 32, 18, `Δ ${item.delta}`, { size: global ? 10.5 : 12, color: item.negative ? C.danger : C.blue, bold: true, fontFace: F.en, fit: "shrink" });
    });
    const rows = (data.notes || []).slice(0, 5), rowY = y + h + 54;
    regionEyebrow(slide, x, rowY - 30, w, data.notesTitle || "ENGINEERING READING", { size: global ? 10.5 : 12.5 });
    rows.forEach((row, i) => {
      const yy = rowY + i * (global ? 64 : 70);
      line(slide, x, yy + 52, x + w, yy + 52, { color: C.line, width: 0.7 });
      addText(slide, x, yy, 250, 22, row.label || row.title || `Note ${i + 1}`, { size: global ? 12 : 14, color: C.primary, bold: true, fit: "shrink" });
      addText(slide, x + 280, yy, w - 280, 34, row.body || row.desc || "", { size: global ? 12 : 13.5, color: C.text, fit: "shrink" });
    });
    footer(slide);
  }

  // High-capacity variable register with explicit unit, baseline, scenario,
  // delta, and source/state columns. Pending values stay blank by design.
  function engineeringVariableTable(slide, data = {}) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const global = theme.contentFidelity?.id === "leander-global" || theme.signature?.id === "leander-global";
    const rows = (data.rows || []).slice(0, 12);
    const x = 96, w = 1728, y = cTop + 22, bottom = 934;
    const headers = data.headers || ["VARIABLE", "UNIT", "BASELINE", "SCENARIO", "Δ", "STATE / SOURCE"];
    const widths = global ? [430, 130, 230, 230, 180, 528] : [390, 140, 240, 240, 190, 528];
    const headH = global ? 46 : 54, rowH = Math.min(global ? 52 : 60, (bottom - y - headH) / Math.max(1, rows.length));
    let xx = x;
    headers.forEach((label, i) => {
      rect(slide, xx, y, widths[i], headH, { fill: global ? C.primary : C.surface2, line: C.line, round: false });
      addText(slide, xx + 12, y + 15, widths[i] - 24, 18, label, { size: global ? 10 : 11.5, color: global ? C.onPrimary : C.primary, bold: true, fontFace: F.en, charSpacing: global ? 1.1 : 0, fit: "shrink" });
      xx += widths[i];
    });
    rows.forEach((row, ri) => {
      const yy = y + headH + ri * rowH, pending = /pending|待仿真|待测|待确认/i.test(`${row.state || ""} ${row.status || ""}`);
      const values = [
        row.variable || row.name || "",
        row.unit || "",
        pending ? "—" : (row.baseline ?? "—"),
        pending ? "—" : (row.scenario ?? row.value ?? "—"),
        pending ? "—" : (row.delta ?? "—"),
        pending ? (row.state || "PENDING SIMULATION") : (row.source || row.state || "")
      ];
      xx = x;
      values.forEach((value, ci) => {
        const fill = pending ? C.surface2 : (ri % 2 ? C.surface : C.bg);
        rect(slide, xx, yy, widths[ci], rowH, { fill, line: C.line, lineWidth: global ? 0.55 : 0.8, round: false });
        addText(slide, xx + 12, yy + Math.max(9, (rowH - 22) / 2), widths[ci] - 24, 22, String(value), {
          size: global ? (ci === 0 ? 12.5 : 11.5) : (ci === 0 ? 14 : 12.5),
          color: pending && ci === 5 ? C.blue : (ci === 0 ? C.primary : C.text),
          bold: ci === 0 || (pending && ci === 5),
          fontFace: ci > 0 && ci < 5 ? F.en : undefined,
          fit: "shrink"
        });
        xx += widths[ci];
      });
    });
    footer(slide);
  }

  // Engineering baseline/candidate/delta comparison with aligned rows and a
  // compact visual delta bar; no independent comparison cards.
  function deltaCompare(slide, data = {}) {
    const cTop = header(slide, data.title, data.subtitle) || 220;
    const global = theme.contentFidelity?.id === "leander-global" || theme.signature?.id === "leander-global";
    const rows = (data.rows || []).slice(0, 9), x = 96, w = 1728, y = cTop + 30;
    const labelW = 430, valueW = 210, deltaW = 210, plotW = w - labelW - valueW * 2 - deltaW;
    const rowH = Math.min(global ? 62 : 70, (928 - y - 50) / Math.max(1, rows.length));
    const cols = [
      { x, w: labelW, label: data.labelHeader || "VARIABLE" },
      { x: x + labelW, w: valueW, label: data.baseHeader || "BASELINE" },
      { x: x + labelW + valueW, w: valueW, label: data.caseHeader || "SCENARIO" },
      { x: x + labelW + valueW * 2, w: deltaW, label: "Δ" },
      { x: x + labelW + valueW * 2 + deltaW, w: plotW, label: "RELATIVE CHANGE" }
    ];
    cols.forEach(col => {
      addText(slide, col.x + 10, y, col.w - 20, 18, col.label, { size: global ? 10 : 11.5, color: C.mute, bold: true, fontFace: F.en, charSpacing: global ? 1.1 : 0, fit: "shrink" });
      line(slide, col.x, y + 32, col.x + col.w, y + 32, { color: C.primary, width: 1 });
    });
    const scale = Math.max(1, ...rows.map(row => Math.abs(Number(row.delta || 0))));
    rows.forEach((row, i) => {
      const yy = y + 40 + i * rowH, delta = Number(row.delta || 0), pending = /pending|待仿真|待测/i.test(row.state || "");
      line(slide, x, yy + rowH - 2, x + w, yy + rowH - 2, { color: C.line, width: global ? 0.55 : 0.8 });
      addText(slide, x + 10, yy + 14, labelW - 20, 24, row.label || row.variable || "", { size: global ? 12.5 : 14, color: C.primary, bold: true, fit: "shrink" });
      addText(slide, x + labelW + 10, yy + 14, valueW - 20, 24, pending ? "—" : String(row.baseline ?? "—"), { size: global ? 12 : 13.5, color: C.text, fontFace: F.en, fit: "shrink" });
      addText(slide, x + labelW + valueW + 10, yy + 14, valueW - 20, 24, pending ? "—" : String(row.scenario ?? "—"), { size: global ? 12 : 13.5, color: C.text, fontFace: F.en, fit: "shrink" });
      addText(slide, x + labelW + valueW * 2 + 10, yy + 14, deltaW - 20, 24, pending ? "PENDING" : String(row.deltaLabel ?? row.delta ?? "—"), { size: global ? 11.5 : 13, color: pending ? C.blue : (delta < 0 ? C.danger : C.primary), bold: true, fontFace: F.en, fit: "shrink" });
      const plotX = x + labelW + valueW * 2 + deltaW + 12, center = plotX + plotW / 2 - 12;
      line(slide, center, yy + 10, center, yy + rowH - 12, { color: C.line, width: 0.7 });
      if (!pending && delta !== 0) {
        const bw = Math.min(plotW / 2 - 24, Math.abs(delta) / scale * (plotW / 2 - 24));
        rect(slide, delta < 0 ? center - bw : center, yy + 20, bw, Math.max(12, rowH - 34), { fill: delta < 0 ? C.danger : C.blue, round: false });
      }
    });
    footer(slide);
  }

  return {
    U, PT, addText, rect, line, logo, header, footer, cover, closing,
    regionEyebrow, sectionLabel, surface, semanticRail, numberBadge, insetRow, statusCard,
    barCard, conclusionBand, semanticConclusion, base2GovernanceChain,
    evidenceBoard, compactKpiRail, engineeringVariableTable, deltaCompare,
    metricCards, bigWordCardMatrix, fourColumnMechanism,
    sectionDivider, sectionDividerBigNumber, sectionDividerUnderline, systemArchitectureCenter, hubSpokeCapability, roadmapSwimlane,
    caveatBand, stepNav, painCards, cycleLoop, processTimeline,
    archLayered, archDualEngine, moduleCorrespondenceMap,
    stateFlow, beforeAfter, roadmapPhases, workbenchMock, workflowConfig, dashboardMock,
    capabilityMatrix, featureGrid, tierStack, statBand, bulletColumns, pillarTrio,
    quadrantMatrix, priorityPyramid, coverageMap, topology, imageGallery, ringStats,
    numberedList, timelineVertical, quoteHighlight, funnel, twoOptionCompare, orgTree,
    platformTrend, problemMap, repairScope, shareBoundary, scenarioBankGrid, positioningMatrix,
    gantt, heatmap, radar, valueChain, waterfall, swimlaneProcess, venn, annotatedDiagram,
    barChart, lineChart, pieBreakdown
  };
}

module.exports = { makeComponents };
