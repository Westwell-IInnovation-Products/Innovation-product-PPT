// Render-level geometry and whitespace audit using low-resolution PNG occupancy features.
const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");
const { PNG } = require("pngjs");

const ROOT = path.join(__dirname, "..");
const PAGES = path.join(ROOT, "pages");
const OUTPUT = path.join(ROOT, "output");
const cfg = require(path.join(ROOT, "deck.config.js"));

function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function colorDistance(data, offset, background) {
  return Math.sqrt((data[offset] - background[0]) ** 2 + (data[offset + 1] - background[1]) ** 2 + (data[offset + 2] - background[2]) ** 2);
}
function backgroundColor(png) {
  const points = [[2, 2], [png.width - 3, 2], [2, png.height - 3], [png.width - 3, png.height - 3]];
  return [0, 1, 2].map(channel => Math.round(points.reduce((sum, [x, y]) => sum + png.data[(y * png.width + x) * 4 + channel], 0) / points.length));
}
function occupancyFeature(file, cols = 8, rows = 5) {
  const png = PNG.sync.read(fs.readFileSync(file));
  const bg = backgroundColor(png), yStart = Math.floor(png.height * 0.14), yEnd = Math.floor(png.height * 0.9);
  const feature = [], threshold = 42;
  let bodyInk = 0, bodyPixels = 0, lowerInk = 0, lowerPixels = 0;
  for (let row = 0; row < rows; row++) {
    const y0 = Math.floor(yStart + (yEnd - yStart) * row / rows), y1 = Math.floor(yStart + (yEnd - yStart) * (row + 1) / rows);
    for (let col = 0; col < cols; col++) {
      const x0 = Math.floor(png.width * col / cols), x1 = Math.floor(png.width * (col + 1) / cols);
      let ink = 0, count = 0;
      for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
        const occupied = colorDistance(png.data, (y * png.width + x) * 4, bg) > threshold;
        if (occupied) ink += 1;
        count += 1;
      }
      feature.push(count ? ink / count : 0);
      bodyInk += ink; bodyPixels += count;
      if (row >= Math.ceil(rows / 2)) { lowerInk += ink; lowerPixels += count; }
    }
  }
  return { feature, bodyInkRatio: bodyPixels ? bodyInk / bodyPixels : 0, lowerInkRatio: lowerPixels ? lowerInk / lowerPixels : 0, background: bg };
}
function similarity(a, b) {
  if (!a.length || a.length !== b.length) return 0;
  const distance = a.reduce((sum, value, index) => sum + Math.abs(value - b[index]), 0) / a.length;
  return Number(Math.max(0, 1 - distance).toFixed(4));
}
// 占用特征只能比"哪里有墨"，比不出"两页都是菱形扇出"这类 gestalt 撞形。
// 主视觉形状类在蓝图里声明；这里把共享同一形状类的页对拉出来强制并排复审。
function shapeClassMap() {
  const bp = readJson(path.join(ROOT, "layout-blueprint.json"), {});
  const contracts = bp.contracts || bp.pages || [];
  const map = {};
  for (const contract of contracts) {
    const shape = String(contract.primaryShapeClass || "").toLowerCase().trim();
    if (!shape) continue;
    const key = String(contract.page || contract.id || "").toLowerCase().trim();
    if (key) map[key] = shape;
    const short = (key.match(/^p\d+/) || [])[0];
    if (short) map[short] = shape;
  }
  return map;
}
function shapeForPage(page, map) {
  const dir = String(page.dir || "").toLowerCase(), id = String(page.id || "").toLowerCase();
  const short = (id.match(/^p\d+/) || dir.match(/^p\d+/) || [])[0] || "";
  return map[dir] || map[id] || map[short] || "";
}
function pageRows() {
  const active = new Set(cfg.workflow?.activePages || []);
  if (!fs.existsSync(PAGES)) return [];
  return fs.readdirSync(PAGES).filter(dir => fs.existsSync(path.join(PAGES, dir, "page.json"))).sort().map(dir => {
    const meta = readJson(path.join(PAGES, dir, "page.json"), {}), id = String(meta.id || dir);
    return { dir, id, meta, file: path.join(PAGES, dir, "out", `${id}.png`) };
  }).filter(row => (!active.size || active.has(row.dir) || active.has(row.id)) && fs.existsSync(row.file));
}
function auditRows(rows) {
  const pages = rows.map(row => ({ id: row.id, dir: row.dir, ...occupancyFeature(row.file), contentDensity: row.meta.contentDensity || "", whitespaceIntent: row.meta.whitespaceIntent || "" }));
  const warnings = [], adjacentSimilarities = [];
  pages.forEach((page, index) => {
    const sparseAllowed = String(page.contentDensity).toLowerCase() === "low" && String(page.whitespaceIntent).trim().length >= 3;
    if (!sparseAllowed && page.bodyInkRatio < 0.035) warnings.push({ page: page.id, field: "renderSparse", message: `正文有效占用仅 ${(page.bodyInkRatio * 100).toFixed(1)}%，需检查内容空洞或字号过小。` });
    if (!sparseAllowed && page.bodyInkRatio >= 0.035 && page.lowerInkRatio < 0.012) warnings.push({ page: page.id, field: "deadSpace", message: `页面下半区有效占用仅 ${(page.lowerInkRatio * 100).toFixed(1)}%，需检查上重下空。` });
    if (index > 0) {
      const score = similarity(pages[index - 1].feature, page.feature);
      adjacentSimilarities.push({ left: pages[index - 1].id, right: page.id, score });
      if (score >= 0.97) warnings.push({ page: page.id, field: "renderSimilarity", message: `与前一页 ${pages[index - 1].id} 的渲染几何相似度 ${score}，需检查连续模板化。` });
    }
  });
  const highlySimilarPairs = [];
  for (let i = 0; i < pages.length; i++) for (let j = i + 1; j < pages.length; j++) {
    const score = similarity(pages[i].feature, pages[j].feature);
    if (score >= 0.985) highlySimilarPairs.push({ left: pages[i].id, right: pages[j].id, score });
  }
  if (pages.length >= 10 && highlySimilarPairs.length > pages.length) warnings.push({ page: "deck", field: "renderRepetition", message: `高相似渲染页面对 ${highlySimilarPairs.length} 组，整套需检查版面结构重复。` });
  const shapeMap = shapeClassMap();
  const sharedShapeClassPairs = [];
  if (Object.keys(shapeMap).length) {
    for (let i = 0; i < pages.length; i++) for (let j = i + 1; j < pages.length; j++) {
      const si = shapeForPage(pages[i], shapeMap), sj = shapeForPage(pages[j], shapeMap);
      if (si && si === sj && !["cover", "big-type"].includes(si)) sharedShapeClassPairs.push({ left: pages[i].id, right: pages[j].id, shapeClass: si });
    }
    sharedShapeClassPairs.forEach(pair => warnings.push({ page: pair.right, field: "shapeClassCollision", message: `与 ${pair.left} 共用主视觉形状类「${pair.shapeClass}」，必须并排复审确认构图有实质区分（占用特征查不到 gestalt 撞形）。` }));
  }
  return { version: "render-diversity-audit.v1", generatedAt: new Date().toISOString(), verdict: warnings.length ? "REVIEW" : "PASS", pages: pages.map(({ feature, ...page }) => page), adjacentSimilarities, highlySimilarPairs, sharedShapeClassPairs, warnings };
}
function writeAudit() {
  const report = auditRows(pageRows());
  fs.mkdirSync(OUTPUT, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT, "render-diversity-audit.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  const md = ["# 渲染级多样性审计", "", `- 页面：${report.pages.length}`, `- 警告：${report.warnings.length}`, `- 结论：${report.verdict}`, "", ...report.warnings.map(item => `- ${item.page} / ${item.field} / ${item.message}`), ""].join("\n");
  fs.writeFileSync(path.join(OUTPUT, "render-diversity-audit.md"), md, "utf8");
  console.log(`Render diversity: ${report.verdict} (${report.pages.length} pages, ${report.warnings.length} warnings)`);
  return report;
}
function selfTest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "leander-render-diversity-"));
  function image(file, rect) {
    const png = new PNG({ width: 100, height: 60 });
    png.data.fill(255);
    for (let y = rect.y; y < rect.y + rect.h; y++) for (let x = rect.x; x < rect.x + rect.w; x++) {
      const o = (y * png.width + x) * 4; png.data[o] = 20; png.data[o + 1] = 40; png.data[o + 2] = 60; png.data[o + 3] = 255;
    }
    fs.writeFileSync(file, PNG.sync.write(png));
  }
  const a = path.join(dir, "a.png"), b = path.join(dir, "b.png"), c = path.join(dir, "c.png");
  image(a, { x: 10, y: 12, w: 70, h: 15 }); image(b, { x: 10, y: 12, w: 70, h: 15 }); image(c, { x: 20, y: 38, w: 50, h: 15 });
  const fa = occupancyFeature(a), fb = occupancyFeature(b), fc = occupancyFeature(c);
  assert(similarity(fa.feature, fb.feature) >= 0.99);
  assert(similarity(fa.feature, fc.feature) < 0.95);
  assert.equal(shapeForPage({ dir: "p12-risk-routing", id: "p12" }, { p12: "diamond-fanout" }), "diamond-fanout");
  assert.equal(shapeForPage({ dir: "p14-gate", id: "p14" }, { "p14-gate": "funnel-converge" }), "funnel-converge");
  assert.equal(shapeForPage({ dir: "p99", id: "p99" }, {}), "");
  fs.rmSync(dir, { recursive: true, force: true });
  console.log("PASS render diversity self-test");
}

if (require.main === module) {
  try { if (process.argv.includes("--self-test")) selfTest(); else writeAudit(); }
  catch (error) { console.error(error.message); process.exit(1); }
}
module.exports = { occupancyFeature, similarity, auditRows, writeAudit, selfTest };
