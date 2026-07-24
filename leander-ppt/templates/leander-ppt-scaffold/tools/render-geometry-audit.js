const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { POLICY_VERSION, policyFor, isDeclaredOverlap } = require("./geometry-policy");

function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; }
}
function shaFile(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile()
    ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")
    : "";
}
function rounded(value) {
  return Number(Number(value || 0).toFixed(5));
}
function textValue(object) {
  return Array.isArray(object.text) ? object.text.map(run => String(run.text || "")).join("") : "";
}
function normalizedFill(options = {}) {
  const fill = options.fill || {};
  const transparency = Number(fill.transparency ?? options.transparency ?? 0);
  return {
    color: String(fill.color || ""),
    transparency,
    opaque: !!fill.color && transparency < 95
  };
}
function lineEndpoints(options = {}) {
  const x = Number(options.x || 0), y = Number(options.y || 0);
  const x2 = x + Number(options.w || 0), y2 = y + Number(options.h || 0);
  return {
    x1: options.flipH ? x2 : x,
    y1: options.flipV ? y2 : y,
    x2: options.flipH ? x : x2,
    y2: options.flipV ? y : y2
  };
}
function explicitMeta(page = {}, objectName = "") {
  const items = page.geometryPolicy?.objects || {};
  return items[objectName] || {};
}
function inferLineRole(options = {}, meta = {}) {
  if (meta.role) return meta.role;
  const line = options.line || {};
  return line.beginArrowType || line.endArrowType ? "connector" : "line";
}
function sceneFromSlide(slide, pageId, page = {}) {
  const elements = (slide?._slideObjects || []).map((object, z) => {
    const options = object.options || {};
    const objectName = String(options.objectName || `${object._type || "object"}-${z}`);
    const meta = explicitMeta(page, objectName);
    const base = { id: String(meta.qaId || objectName), objectName, z };
    if (object.shape === "line") {
      const endpoints = lineEndpoints(options), line = options.line || {};
      return {
        ...base,
        type: "line",
        role: inferLineRole(options, meta),
        group: String(meta.group || ""),
        ...Object.fromEntries(Object.entries(endpoints).map(([key, value]) => [key, rounded(value)])),
        lineWidthPt: Number(line.width || 1),
        color: String(line.color || ""),
        arrowBegin: String(line.beginArrowType || ""),
        arrowEnd: String(line.endArrowType || "")
      };
    }
    const text = textValue(object);
    if (text.trim()) {
      const runSizes = (object.text || []).map(run => Number(run.options?.fontSize || 0)).filter(Boolean);
      return {
        ...base,
        type: "text",
        role: String(meta.role || "text"),
        x: rounded(options.x), y: rounded(options.y),
        w: rounded(options.w), h: rounded(options.h),
        fontSize: Number(options.fontSize || Math.max(0, ...runSizes) || 10),
        align: String(options.align || "left"),
        valign: String(options.valign || "top"),
        text
      };
    }
    const fill = normalizedFill(options);
    return {
      ...base,
      type: object._type === "image" ? "image" : "shape",
      role: String(meta.role || (object._type === "image" ? "image" : "shape")),
      x: rounded(options.x), y: rounded(options.y),
      w: rounded(options.w), h: rounded(options.h),
      opaque: object._type === "image" ? Number(options.transparency || 0) < 95 : fill.opaque,
      fillColor: fill.color
    };
  });
  return {
    version: "render-geometry.v1",
    policyVersion: POLICY_VERSION,
    pageId: String(pageId || page.id || ""),
    elements,
    reservedZones: page.geometryPolicy?.reservedZones || [],
    intentionalOverlaps: page.geometryPolicy?.intentionalOverlaps || [],
    policy: page.geometryPolicy?.thresholds || {}
  };
}
function rect(element, margin = 0) {
  return {
    x: Number(element.x || 0) - margin,
    y: Number(element.y || 0) - margin,
    w: Math.max(0, Number(element.w || 0) + margin * 2),
    h: Math.max(0, Number(element.h || 0) + margin * 2)
  };
}
function rectIntersection(a, b) {
  const left = Math.max(a.x, b.x), top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.w, b.x + b.w), bottom = Math.min(a.y + a.h, b.y + b.h);
  return { x: left, y: top, w: Math.max(0, right - left), h: Math.max(0, bottom - top), area: Math.max(0, right - left) * Math.max(0, bottom - top) };
}
function textInkRect(element) {
  const value = String(element.text || ""), lines = value.split(/\r?\n/);
  const fontSize = Number(element.fontSize || 10);
  const charWidth = char => {
    if (/[\u2E80-\u9FFF\uF900-\uFAFF]/.test(char)) return 1;
    if (/[A-Z]/.test(char)) return 0.68;
    if (/[a-z0-9]/.test(char)) return 0.56;
    if (/\s/.test(char)) return 0.30;
    return 0.50;
  };
  const estimatedWidth = Math.max(...lines.map(line => [...line].reduce((sum, char) => sum + charWidth(char), 0)), 0) * fontSize / 72;
  const estimatedHeight = Math.max(1, lines.length) * fontSize / 72 * 1.18;
  const w = Math.min(Number(element.w || 0), estimatedWidth);
  const h = Math.min(Number(element.h || 0), estimatedHeight);
  const x = element.align === "right"
    ? Number(element.x || 0) + Number(element.w || 0) - w
    : element.align === "center"
      ? Number(element.x || 0) + (Number(element.w || 0) - w) / 2
      : Number(element.x || 0);
  const y = element.valign === "bottom"
    ? Number(element.y || 0) + Number(element.h || 0) - h
    : element.valign === "mid" || element.valign === "middle"
      ? Number(element.y || 0) + (Number(element.h || 0) - h) / 2
      : Number(element.y || 0);
  return { x, y, w, h };
}
function segmentRectInterval(line, box) {
  const dx = line.x2 - line.x1, dy = line.y2 - line.y1;
  let t0 = 0, t1 = 1;
  const tests = [
    [-dx, line.x1 - box.x],
    [dx, box.x + box.w - line.x1],
    [-dy, line.y1 - box.y],
    [dy, box.y + box.h - line.y1]
  ];
  for (const [p, q] of tests) {
    if (Math.abs(p) < 1e-9) {
      if (q < 0) return null;
      continue;
    }
    const r = q / p;
    if (p < 0) {
      if (r > t1) return null;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return null;
      if (r < t1) t1 = r;
    }
  }
  return t0 <= t1 ? { t0, t1 } : null;
}
function pointAt(line, t) {
  return { x: line.x1 + (line.x2 - line.x1) * t, y: line.y1 + (line.y2 - line.y1) * t };
}
function contains(box, point) {
  return point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h;
}
function lineLength(line) {
  return Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
}
function blockingOccluder(scene, line, text, point) {
  return (scene.elements || []).some(element => element.z > line.z
    && element.z < text.z
    && element.opaque
    && ["shape", "image"].includes(element.type)
    && contains(rect(element), point));
}
function finding(ruleId, severity, objects, message, metrics = {}) {
  const digest = crypto.createHash("sha256").update(JSON.stringify({ ruleId, severity, objects, message, metrics })).digest("hex").slice(0, 12);
  return { id: `geometry-${digest}`, ruleId, severity, objects, message, metrics };
}
function lineStyleKey(line) {
  const dx = Math.abs(line.x2 - line.x1), dy = Math.abs(line.y2 - line.y1);
  const orientation = dx < 0.001 ? "vertical" : dy < 0.001 ? "horizontal" : "diagonal";
  return [line.group || "", line.color || "", Number(line.lineWidthPt || 0).toFixed(2), line.arrowBegin || "", line.arrowEnd || "", orientation].join("|");
}
function suppressed(scene, item) {
  const suppressions = scene.suppressions || [];
  return suppressions.some(entry => entry.findingId === item.id && String(entry.reason || "").trim().length >= 12);
}
function auditScene(scene = {}) {
  const policy = policyFor(scene), findings = [];
  const elements = scene.elements || [];
  const texts = elements.filter(item => item.type === "text");
  const lines = elements.filter(item => item.type === "line");

  for (let i = 0; i < texts.length; i += 1) {
    for (let j = i + 1; j < texts.length; j += 1) {
      const a = texts[i], b = texts[j];
      if (isDeclaredOverlap(scene, a.id, b.id)) continue;
      if (a.text === b.text && Math.abs(a.x - b.x) < 0.001 && Math.abs(a.y - b.y) < 0.001 && Math.abs(a.w - b.w) < 0.001 && Math.abs(a.h - b.h) < 0.001) continue;
      const overlap = rectIntersection(textInkRect(a), textInkRect(b));
      if (overlap.area > policy.minTextIntersectionArea) {
        findings.push(finding("u.geometry.overlap", "P0", [a.id, b.id], "文字框发生非意图重叠。", { intersectionArea: rounded(overlap.area) }));
      }
    }
  }

  for (const line of lines) {
    for (const text of texts) {
      if (isDeclaredOverlap(scene, line.id, text.id)) continue;
      const interval = segmentRectInterval(line, rect(textInkRect(text), policy.textSafeMargin));
      if (!interval) continue;
      const samples = [interval.t0, (interval.t0 + interval.t1) / 2, interval.t1].map(t => pointAt(line, t));
      if (samples.every(point => blockingOccluder(scene, line, text, point))) continue;
      findings.push(finding(
        "u.geometry.overlap",
        "P0",
        [line.id, text.id],
        "线条或箭头侵入文字安全区。",
        { safeMargin: policy.textSafeMargin, t0: rounded(interval.t0), t1: rounded(interval.t1) }
      ));
    }
  }

  const zones = scene.reservedZones || [];
  for (const zone of zones) {
    const zoneBox = rect(zone, -policy.reservedZoneTolerance);
    for (const element of elements) {
      if (element.id === zone.owner || isDeclaredOverlap(scene, element.id, zone.id)) continue;
      let intersects = false;
      if (element.type === "line") intersects = !!segmentRectInterval(element, zoneBox);
      else intersects = rectIntersection(rect(element), zoneBox).area > 0;
      if (intersects) findings.push(finding("u.geometry.reserved-zone", "P0", [element.id, zone.id], "页面元素侵入组件保留区域。"));
    }
  }

  const groups = new Map();
  lines.forEach(line => {
    const key = lineStyleKey(line);
    groups.set(key, [...(groups.get(key) || []), line]);
  });
  groups.forEach(group => {
    if (group.length < 4) return;
    const lengths = group.map(lineLength), min = Math.min(...lengths), max = Math.max(...lengths);
    if (max - min >= policy.connectorImbalanceDelta && min / max < policy.connectorImbalanceRatio) {
      findings.push(finding(
        "u.geometry.connector",
        "P1",
        group.map(item => item.id),
        "同组连接线长度严重失衡，关系图可能出现残线或错误间距。",
        { minLength: rounded(min), maxLength: rounded(max), ratio: rounded(min / max) }
      ));
    }
  });

  for (const element of elements) {
    if (element.type === "line") continue;
    const box = rect(element);
    if (box.x < -policy.boundsTolerance || box.y < -policy.boundsTolerance
      || box.x + box.w > policy.slideWidth + policy.boundsTolerance
      || box.y + box.h > policy.slideHeight + policy.boundsTolerance) {
      findings.push(finding("u.geometry.bounds", "P0", [element.id], "元素超出幻灯片边界。", box));
    }
  }

  const active = findings.filter(item => !suppressed(scene, item));
  return {
    version: "render-geometry-audit.v1",
    policyVersion: POLICY_VERSION,
    pageId: scene.pageId || "",
    generatedAt: new Date().toISOString(),
    findings: active,
    counts: {
      P0: active.filter(item => item.severity === "P0").length,
      P1: active.filter(item => item.severity === "P1").length
    },
    verdict: active.some(item => ["P0", "P1"].includes(item.severity)) ? "FIX-FIRST" : "PASS"
  };
}
function writePageAudit(pageDir, scene, renderFile) {
  const renderSha256 = shaFile(renderFile);
  const report = { ...auditScene(scene), renderSha256, sceneSha256: crypto.createHash("sha256").update(JSON.stringify(scene)).digest("hex") };
  const out = path.join(pageDir, "out", "geometry-audit.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(report, null, 2) + "\n", "utf8");
  fs.writeFileSync(path.join(pageDir, "out", "geometry.json"), JSON.stringify(scene, null, 2) + "\n", "utf8");
  return report;
}
function verifyPageAudit(pageDir, page = readJson(path.join(pageDir, "page.json"), {})) {
  const id = String(page.id || path.basename(pageDir));
  const render = path.join(pageDir, "out", `${id}.png`);
  const reportFile = path.join(pageDir, "out", "geometry-audit.json");
  const report = readJson(reportFile);
  const errors = [];
  if (!report || report.version !== "render-geometry-audit.v1") errors.push("geometry audit missing or has the wrong version");
  if (report?.policyVersion !== POLICY_VERSION) errors.push("geometry audit policy version is stale");
  if (report?.renderSha256 !== shaFile(render)) errors.push("geometry audit render hash is stale");
  if (report?.verdict !== "PASS") {
    (report?.findings || []).filter(item => ["P0", "P1"].includes(item.severity)).forEach(item => errors.push(`${item.severity} ${item.ruleId}: ${item.message} [${(item.objects || []).join(", ")}]`));
  }
  return { ok: errors.length === 0, errors, report, reportFile };
}
function verifyProject(root, pages = []) {
  const base = path.join(root, "pages"), wanted = new Set(pages.filter(Boolean));
  const rows = fs.existsSync(base) ? fs.readdirSync(base).filter(dir => fs.existsSync(path.join(base, dir, "page.json"))).sort().filter(dir => {
    const page = readJson(path.join(base, dir, "page.json"), {});
    return !wanted.size || wanted.has(dir) || wanted.has(String(page.id || ""));
  }).map(dir => {
    const pageDir = path.join(base, dir), page = readJson(path.join(pageDir, "page.json"), {});
    return { dir, id: String(page.id || dir), ...verifyPageAudit(pageDir, page) };
  }) : [];
  return { ok: rows.length > 0 && rows.every(row => row.ok), rows };
}

if (require.main === module) {
  const root = path.join(__dirname, "..");
  const index = process.argv.indexOf("--pages");
  const pages = index >= 0 && process.argv[index + 1] ? process.argv[index + 1].split(",").map(value => value.trim()).filter(Boolean) : [];
  const result = verifyProject(root, pages);
  result.rows.forEach(row => console.log(`${row.ok ? "PASS" : "FIX-FIRST"} ${row.id}${row.errors.length ? `: ${row.errors.join("; ")}` : ""}`));
  if (!result.ok) process.exit(1);
}

module.exports = {
  sceneFromSlide,
  auditScene,
  writePageAudit,
  verifyPageAudit,
  verifyProject,
  rect,
  rectIntersection,
  segmentRectInterval,
  textInkRect,
  lineLength,
  shaFile
};
