// Build a dependency-free SVG contact sheet from rendered active pages.
// Usage: node tools/render-contact-sheet.js [--output output/custom.svg]
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PAGES = path.join(ROOT, "pages");
const cfg = require(path.join(ROOT, "deck.config.js"));
function arg(name, fallback = "") { const index = process.argv.indexOf(`--${name}`); return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback; }
function esc(value) { return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function pageFolders() {
  const all = fs.readdirSync(PAGES).filter(dir => fs.existsSync(path.join(PAGES, dir, "page.js"))).sort();
  const active = new Set(cfg.workflow?.activePages || []);
  return active.size ? all.filter(dir => active.has(dir)) : all;
}
function loadPage(dir) { delete require.cache[require.resolve(path.join(PAGES, dir, "page.js"))]; return require(path.join(PAGES, dir, "page.js")); }
function main() {
  const pages = pageFolders().map(dir => {
    const page = loadPage(dir);
    const png = path.join(PAGES, dir, "out", `${page.id}.png`);
    if (!fs.existsSync(png)) throw new Error(`render missing: ${path.relative(ROOT, png)}`);
    return { dir, id: page.id, title: page.title, data: fs.readFileSync(png).toString("base64") };
  });
  if (!pages.length) throw new Error("no active rendered pages");
  const columns = Math.min(3, pages.length), cardW = 640, cardH = 430, gap = 28, margin = 36;
  const rows = Math.ceil(pages.length / columns), width = margin * 2 + columns * cardW + (columns - 1) * gap;
  const height = margin * 2 + rows * cardH + (rows - 1) * gap;
  const cards = pages.map((page, index) => {
    const x = margin + (index % columns) * (cardW + gap), y = margin + Math.floor(index / columns) * (cardH + gap);
    return `<g transform="translate(${x} ${y})"><rect width="${cardW}" height="${cardH}" rx="6" fill="#f7f6f1" stroke="#d8d4ca"/><image x="12" y="12" width="616" height="346" href="data:image/png;base64,${page.data}" preserveAspectRatio="xMidYMid meet"/><text x="14" y="386" font-family="Microsoft YaHei, sans-serif" font-size="20" font-weight="700" fill="#001b63">${esc(page.id)}  ${esc(page.title)}</text><text x="14" y="414" font-family="Century Gothic, sans-serif" font-size="13" fill="#77746e">${esc(page.dir)}</text></g>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#eceae4"/>${cards}</svg>`;
  const stage = cfg.workflow?.stage;
  const defaultName = stage === "anchor-sample"
    ? "output/anchor-samples-contact-sheet.svg"
    : stage === "production-batch"
      ? "output/current-batch-contact-sheet.svg"
      : "output/full-deck-contact-sheet.svg";
  const output = path.resolve(ROOT, arg("output", defaultName));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, svg, "utf8");
  console.log(`wrote ${path.relative(ROOT, output)} (${pages.length} pages)`);
  if (process.argv.includes("--png")) {
    const { PNG } = require("pngjs");
    const factor = 3, pngCols = Math.min(4, pages.length);
    const shots = pages.map(page => PNG.sync.read(fs.readFileSync(path.join(PAGES, page.dir, "out", `${page.id}.png`))));
    const cellW = Math.floor(shots[0].width / factor), cellH = Math.floor(shots[0].height / factor), pad = 8;
    const pngRows = Math.ceil(shots.length / pngCols);
    const sheet = new PNG({ width: pngCols * cellW + (pngCols + 1) * pad, height: pngRows * cellH + (pngRows + 1) * pad });
    sheet.data.fill(120);
    shots.forEach((src, index) => {
      const ox = pad + (index % pngCols) * (cellW + pad), oy = pad + Math.floor(index / pngCols) * (cellH + pad);
      for (let y = 0; y < cellH; y++) for (let x = 0; x < cellW; x++) {
        let r = 0, g = 0, b = 0, n = 0;
        for (let dy = 0; dy < factor; dy++) for (let dx = 0; dx < factor; dx++) {
          const sx = x * factor + dx, sy = y * factor + dy;
          if (sx >= src.width || sy >= src.height) continue;
          const si = (src.width * sy + sx) << 2;
          r += src.data[si]; g += src.data[si + 1]; b += src.data[si + 2]; n++;
        }
        const di = (sheet.width * (oy + y) + (ox + x)) << 2;
        sheet.data[di] = r / n; sheet.data[di + 1] = g / n; sheet.data[di + 2] = b / n; sheet.data[di + 3] = 255;
      }
    });
    const pngOutput = output.replace(/\.svg$/i, ".png");
    fs.writeFileSync(pngOutput, PNG.sync.write(sheet));
    console.log(`wrote ${path.relative(ROOT, pngOutput)} (${pages.length} pages, model-readable)`);
    console.log(`reading order: ${pages.map((page, index) => `${index + 1}=${page.id}`).join(" ")}`);
  }
}
main();
