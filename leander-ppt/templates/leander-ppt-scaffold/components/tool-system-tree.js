const { icon } = require("./icons");

function makeToolSystemTree({ ui, theme, pptx }) {
  const C = theme.colors;
  const T = theme.type;
  const U = ui.U;
  const S = pptx.ShapeType;
  const F = theme.fonts;

  function labelFont(s) {
    return /[A-Za-z]/.test(String(s || "")) ? F.en : F.cn;
  }

  function libraryIcon(slide, cx, cy, type, color) {
    if (type === "theme") {
      [[-24, -20, C.surface], [-12, -10, C.surface2], [0, 0, C.surface3]].forEach(([dx, dy, fill]) => {
        slide.addShape(S.roundRect, {
          x: U(cx + dx), y: U(cy + dy), w: U(52), h: U(32),
          fill: { color: fill },
          line: { color, width: 1.15 },
          rectRadius: U(4)
        });
      });
      ui.rect(slide, cx + 6, cy + 10, 16, 4, { fill: C.accent });
      ui.rect(slide, cx + 26, cy + 10, 16, 4, { fill: C.blue });
    } else if (type === "component") {
      [[-22, -18], [2, -18], [-22, 6], [2, 6]].forEach(([dx, dy], i) => {
        ui.rect(slide, cx + dx, cy + dy, 18, 18, {
          fill: i === 1 ? C.accentSoft : C.surface3,
          line: i === 1 ? C.accent : color,
          lineWidth: 1.15,
          round: true
        });
      });
    } else {
      slide.addShape(S.roundRect, {
        x: U(cx - 30), y: U(cy - 22), w: U(60), h: U(44),
        fill: { color: C.surface },
        line: { color, width: 1.2 },
        rectRadius: U(5)
      });
      slide.addShape(S.ellipse, {
        x: U(cx + 11), y: U(cy - 12), w: U(8), h: U(8),
        fill: { color: C.accent },
        line: { type: "none" }
      });
      slide.addShape(S.arc, {
        x: U(cx - 20), y: U(cy - 4), w: U(46), h: U(28),
        line: { color, width: 1.4 },
        adjustPoint: 0.2
      });
    }
  }

  function branchCard(slide, c) {
    const hot = !!c.focus;
    const ink = hot ? C.accent : C.primary;
    ui.rect(slide, c.x, c.y, c.w, c.h, {
      fill: hot ? C.accentSoft : C.surface,
      line: ink,
      lineWidth: hot ? 1.6 : 1.1,
      round: true,
      shadow: true
    });
    libraryIcon(slide, c.x + 48, c.y + 50, c.iconType, ink);
    ui.addText(slide, c.x + 96, c.y + 26, c.w - 120, 22, c.title, {
      size: T.body,
      color: ink,
      bold: true
    });
    ui.addText(slide, c.x + 96, c.y + 58, c.w - 120, 14, c.sub, {
      size: T.tiny,
      color: C.faint,
      fontFace: F.en
    });
  }

  function detailCard(slide, d) {
    const hot = !!d.focus;
    const ink = hot ? C.accent : C.primary;
    ui.rect(slide, d.x, d.y, d.w, d.h, {
      fill: hot ? C.accentSoft : C.surface,
      line: hot ? C.accent : C.line,
      lineWidth: hot ? 1.5 : 1,
      round: true,
      shadow: true
    });
    ui.rect(slide, d.x + 24, d.y + 22, 5, d.h - 44, { fill: ink });
    ui.addText(slide, d.x + 48, d.y + 18, d.w - 78, 22, d.title, {
      size: T.bodySm,
      color: ink,
      bold: true,
      fit: "shrink"
    });
    (d.items || []).forEach((it, j) => {
      const yy = d.y + 54 + j * 30;
      ui.addText(slide, d.x + 54, yy, 112, 17, it[0], {
        size: T.micro,
        color: C.primary,
        bold: true,
        fontFace: labelFont(it[0]),
        fit: "shrink"
      });
      ui.addText(slide, d.x + 170, yy, d.w - 200, 17, it[1], {
        size: T.micro,
        color: C.text,
        fit: "shrink"
      });
    });
  }

  function toolSystemTree(slide, data) {
    ui.header(slide, data.title, data.subtitle);

    const root = data.root || { title: "工具系统", sub: "Tool System" };
    const rootBox = { x: 110, y: 480, w: 254, h: 106 };
    ui.rect(slide, rootBox.x, rootBox.y, rootBox.w, rootBox.h, {
      fill: C.primary,
      line: C.primary,
      round: true,
      shadow: true
    });
    icon(pptx, slide, U, rootBox.x + 58, rootBox.y + 54, "gear", {
      color: C.onPrimary || C.inverseText,
      soft: C.primary,
      width: 1.4
    });
    ui.addText(slide, rootBox.x + 106, rootBox.y + 28, 118, 24, root.title, {
      size: T.body,
      color: C.onPrimary || C.inverseText,
      bold: true
    });
    ui.addText(slide, rootBox.x + 106, rootBox.y + 60, 118, 18, root.sub, {
      size: T.micro,
      color: C.inverseMuted,
      fontFace: F.en
    });

    const branches = data.branches || [];
    const xBranch = 498;
    const xDetail = 842;
    const busX = 424;
    const ys = [250, 480, 710];

    const rootMidY = rootBox.y + rootBox.h / 2;
    ui.line(slide, rootBox.x + rootBox.w, rootMidY, busX, rootMidY, { color: C.line, width: 1.15 });
    ui.line(slide, busX, ys[0] + 48, busX, ys[2] + 48, { color: C.line, width: 1.15 });

    branches.forEach((b, i) => {
      const y = ys[i];
      const card = { ...b, x: xBranch, y, w: 258, h: 96 };
      const detailH = i === 1 ? 152 : 126;
      const detail = { ...b.detail, x: xDetail, y: y + 48 - detailH / 2, w: 462, h: detailH, focus: b.focus };
      ui.line(slide, busX, y + 48, xBranch - 22, y + 48, {
        color: C.line,
        width: 1.15,
        arrow: "triangle"
      });
      branchCard(slide, card);
      ui.line(slide, xBranch + 258, y + 48, xDetail - 22, y + 48, {
        color: C.line,
        width: 1.15,
        arrow: "triangle"
      });
      detailCard(slide, detail);
    });

    const panel = data.enginePanel || {};
    const p = { x: 1370, y: 250, w: 424, h: 556 };
    ui.rect(slide, p.x, p.y, p.w, p.h, {
      fill: C.surface,
      line: C.primary,
      lineWidth: 1.2,
      round: true,
      shadow: true
    });
    ui.addText(slide, p.x + 30, p.y + 28, 320, 26, panel.title || "每页调用逻辑", {
      size: T.h3,
      color: C.primary,
      bold: true
    });
    ui.addText(slide, p.x + 30, p.y + 62, 350, 18, panel.sub || "Visual Selection Engine", {
      size: T.tiny,
      color: C.faint,
      fontFace: F.en,
      bold: true
    });
    (panel.steps || []).forEach((c, i) => {
      const y = p.y + 112 + i * 66;
      const hot = i === (panel.focusIndex == null ? 3 : panel.focusIndex);
      const ink = hot ? C.accent : C.primary;
      slide.addShape(S.ellipse, {
        x: U(p.x + 28), y: U(y + 6), w: U(34), h: U(34),
        fill: { color: ink },
        line: { type: "none" }
      });
      ui.addText(slide, p.x + 28, y + 16, 34, 10, String(i + 1), {
        size: T.tiny,
      color: hot ? (C.onAccent || C.inverseText) : (C.onPrimary || C.inverseText),
        bold: true,
        align: "center",
        fontFace: F.en
      });
      ui.addText(slide, p.x + 80, y, 124, 20, c[0], {
        size: T.bodySm,
        color: ink,
        bold: true,
        fit: "shrink"
      });
      ui.addText(slide, p.x + 80, y + 28, 286, 16, c[1], {
        size: T.tiny,
        color: C.mute,
        fit: "shrink"
      });
      if (i < panel.steps.length - 1) {
        ui.line(slide, p.x + 45, y + 40, p.x + 45, y + 64, {
          color: C.line,
          width: 1,
          arrow: "triangle"
        });
      }
    });

    ui.footer(slide);
  }

  return { toolSystemTree };
}

module.exports = { makeToolSystemTree };
