// Render the real Gate 1.5 component shortlist in the active project theme.
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const crypto = require("crypto");
const { inspectBlueprintComponentContracts } = require("./component-contract");

const ROOT = path.join(__dirname, "..");
const BLUEPRINT = path.join(ROOT, "layout-blueprint.json");
const OUT = path.join(ROOT, "output");
const ASSETS = path.join(OUT, "layout-blueprint-component-shortlist-assets");
const REPORT = path.join(OUT, "layout-blueprint-component-shortlist.json");
const REPORT_MD = path.join(OUT, "layout-blueprint-component-shortlist.md");
const CONTACT = path.join(OUT, "layout-blueprint-component-shortlist.svg");

function readJson(file, fallback = {}) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function esc(value) { return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function content(contract) { return !/(?:cover|closing|transition|divider)/i.test(`${contract.relationship || ""} ${contract.expressionMode || ""}`); }
function priority(contract) { return contract.highVisualRisk === true || /^(?:high|critical)$/i.test(String(contract.riskLevel || "")) || contract.anchorCandidate === true || contract.shortlistPreview === true; }
function renderedSlidePath(assetDir, index) {
  const candidates = [
    path.join(assetDir, "slides", `slide-${String(index).padStart(2, "0")}.png`),
    path.join(assetDir, "slides", `slide-${index}.png`)
  ];
  return candidates.find(file => fs.existsSync(file)) || candidates[0];
}

function contactSheet(rows) {
  const columns = Math.min(3, rows.length), cardW = 640, cardH = 430, gap = 28, margin = 36;
  const rowCount = Math.ceil(rows.length / columns), width = margin * 2 + columns * cardW + (columns - 1) * gap, height = margin * 2 + rowCount * cardH + (rowCount - 1) * gap;
  const cards = rows.map((row, index) => {
    const x = margin + (index % columns) * (cardW + gap), y = margin + Math.floor(index / columns) * (cardH + gap);
    const png = fs.readFileSync(row.png).toString("base64");
    return `<g transform="translate(${x} ${y})"><rect width="${cardW}" height="${cardH}" rx="8" fill="#f7f9fc" stroke="#c7d3e3"/><image x="12" y="12" width="616" height="346" href="data:image/png;base64,${png}" preserveAspectRatio="xMidYMid meet"/><text x="14" y="386" font-family="Century Gothic, Microsoft YaHei, sans-serif" font-size="20" font-weight="700" fill="#192033">${esc(row.name)}</text><text x="14" y="414" font-family="Microsoft YaHei, sans-serif" font-size="13" fill="#5d6b80">候选页面：${esc(row.pages.join(" / "))}</text></g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#e9eef5"/>${cards}</svg>`;
}

function main() {
  if (!fs.existsSync(BLUEPRINT)) throw new Error("Missing layout-blueprint.json");
  const source = fs.readFileSync(BLUEPRINT);
  const blueprint = JSON.parse(source.toString("utf8").replace(/^\uFEFF/, ""));
  const contracts = blueprint.contracts || blueprint.pages || [];
  const audit = inspectBlueprintComponentContracts(contracts);
  if (audit.errors.length) throw new Error(`Cannot render invalid component contract: ${audit.errors.map(item => item.message).join("; ")}`);
  const candidates = audit.rows.map((row, index) => ({ row, contract: contracts[index] })).filter(item => content(item.contract) && item.row.candidateComponents.length);
  const prioritized = candidates.filter(item => priority(item.contract));
  const selected = (prioritized.length ? prioritized : candidates.slice(0, 4));
  const pageMap = selected.map(item => ({ page: item.row.page, candidateComponents: item.row.candidateComponents.slice(0, 3), reason: priority(item.contract) ? "anchor-or-high-risk" : "representative-fallback" }));
  const components = [...new Set(pageMap.flatMap(item => item.candidateComponents))].slice(0, 12);
  if (!components.length) {
    fs.writeFileSync(REPORT, JSON.stringify({ version: "layout-blueprint-component-shortlist.v1", sourceSha256: crypto.createHash("sha256").update(source).digest("hex"), theme: null, pages: [], components: [], skipped: "no component candidates" }, null, 2) + "\n");
    console.log("SKIP component shortlist: no component candidates");
    return;
  }
  const cfg = require(path.join(ROOT, "deck.config.js"));
  const theme = cfg.theme || "leander-base";
  cp.execFileSync(process.execPath, [path.join(__dirname, "render-component-library-preview.js"), "--theme", theme, "--components", components.join(","), "--out-dir", ASSETS], { cwd: ROOT, stdio: "inherit" });
  const preview = readJson(path.join(ASSETS, "preview-manifest.json"));
  const rows = (preview.manifest || []).map(item => ({
    name: item.name,
    pages: pageMap.filter(page => page.candidateComponents.includes(item.name)).map(page => page.page),
    png: renderedSlidePath(ASSETS, item.index)
  }));
  const missingPngs = rows.filter(row => !fs.existsSync(row.png));
  if (missingPngs.length) throw new Error(`Real component PNG preview missing: ${missingPngs.map(row => row.name).join(", ")}`);
  fs.writeFileSync(CONTACT, contactSheet(rows), "utf8");
  const report = {
    version: "layout-blueprint-component-shortlist.v1",
    generatedAt: new Date().toISOString(),
    sourceSha256: crypto.createHash("sha256").update(source).digest("hex"),
    theme,
    selectionPolicy: prioritized.length ? "anchor-or-high-risk" : "first-four-component-pages",
    pages: pageMap,
    components,
    contactSheet: path.relative(ROOT, CONTACT).replace(/\\/g, "/"),
    assetDir: path.relative(ROOT, ASSETS).replace(/\\/g, "/")
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + "\n", "utf8");
  fs.writeFileSync(REPORT_MD, ["# Gate 1.5 真实组件候选预览", "", `- 主题：${theme}`, `- 组件数：${components.length}`, `- 选择策略：${report.selectionPolicy}`, `- 联系表：\`${report.contactSheet}\``, "", ...pageMap.map(item => `- ${item.page}: ${item.candidateComponents.join(" / ")} (${item.reason})`), ""].join("\n"), "utf8");
  console.log(`PASS real component shortlist: ${components.length} components -> ${path.relative(ROOT, CONTACT)}`);
}

main();
