// Render a staging PPTX, compare its pixels to the reviewed page PNGs, then
// atomically publish the canonical deck and write a hash-bound receipt.
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const crypto = require("crypto");
const { PNG } = require("pngjs");
const { requireToolchain, libreOfficeProfile } = require("./toolchain");
const { verifyPageAudit } = require("./render-geometry-audit");
const ROOT = path.join(__dirname, "..");
const PAGES = path.join(ROOT, "pages");
const OUTPUT = path.join(ROOT, "output");

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; }
}
function shaFile(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile()
    ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")
    : "";
}
function comparePng(expectedFile, actualFile) {
  const expected = PNG.sync.read(fs.readFileSync(expectedFile));
  const actual = PNG.sync.read(fs.readFileSync(actualFile));
  if (expected.width !== actual.width || expected.height !== actual.height) {
    return { equal: false, changedPixels: Math.max(expected.width * expected.height, actual.width * actual.height), reason: "dimension mismatch" };
  }
  let changedPixels = 0;
  for (let i = 0; i < expected.data.length; i += 4) {
    if (expected.data[i] !== actual.data[i]
      || expected.data[i + 1] !== actual.data[i + 1]
      || expected.data[i + 2] !== actual.data[i + 2]
      || expected.data[i + 3] !== actual.data[i + 3]) changedPixels += 1;
  }
  return { equal: changedPixels === 0, changedPixels, reason: changedPixels ? "pixel mismatch" : "" };
}
function activePages() {
  const cfg = require(path.join(ROOT, "deck.config.js"));
  const dirs = fs.readdirSync(PAGES).filter(dir => fs.existsSync(path.join(PAGES, dir, "page.json"))).sort();
  const wanted = new Set(cfg.workflow?.stage === "production" ? [] : (cfg.workflow?.activePages || []));
  return dirs.filter(dir => !wanted.size || wanted.has(dir) || wanted.has(String(readJson(path.join(PAGES, dir, "page.json"), {}).id || ""))).map(dir => {
    const page = readJson(path.join(PAGES, dir, "page.json"), {});
    const id = String(page.id || dir.match(/^p\d+/i)?.[0] || dir);
    return { id, dir, page, reviewed: path.join(PAGES, dir, "out", `${id}.png`) };
  });
}
function renderPptx(pptx, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const tools = requireToolchain();
  const profile = libreOfficeProfile("lo_final_artifact");
  cp.execFileSync(tools.soffice, ["--headless", "-env:UserInstallation=" + profile, "--convert-to", "pdf", "--outdir", outDir, pptx], { stdio: "ignore" });
  const pdf = path.join(outDir, path.basename(pptx).replace(/\.pptx$/i, ".pdf"));
  cp.execFileSync(tools.pdftoppm, ["-png", "-r", "96", pdf, path.join(outDir, "slide")], { stdio: "ignore" });
  return fs.readdirSync(outDir).filter(name => /^slide-\d+\.png$/i.test(name)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(name => path.join(outDir, name));
}
function publish(staging, canonical) {
  const next = `${canonical}.next`;
  const backup = `${canonical}.previous-${new Date().toISOString().replace(/[-:.TZ]/g, "")}`;
  fs.mkdirSync(path.dirname(canonical), { recursive: true });
  fs.copyFileSync(staging, next);
  let movedOld = false;
  try {
    if (fs.existsSync(canonical)) {
      fs.renameSync(canonical, backup);
      movedOld = true;
    }
    fs.renameSync(next, canonical);
  } catch (error) {
    if (fs.existsSync(next)) fs.rmSync(next, { force: true });
    if (movedOld && !fs.existsSync(canonical) && fs.existsSync(backup)) fs.renameSync(backup, canonical);
    throw error;
  }
  return { canonical, backup: movedOld ? backup : "" };
}
function verifyAndPublish({ staging, canonical, publishFile = true }) {
  if (!fs.existsSync(staging)) throw new Error(`staging PPTX missing: ${staging}`);
  const pages = activePages();
  if (pages.some(page => !fs.existsSync(page.reviewed))) throw new Error("reviewed page PNG missing");
  const receipt = readJson(path.join(ROOT, "workflow-receipt.json"), {});
  const outDir = path.join(OUTPUT, ".staging", `${receipt.runId || "run"}-final-png`);
  fs.rmSync(outDir, { recursive: true, force: true });
  const rendered = renderPptx(staging, outDir);
  if (rendered.length !== pages.length) throw new Error(`final slide count mismatch: expected ${pages.length}, got ${rendered.length}`);
  const rows = pages.map((page, index) => {
    const comparison = comparePng(page.reviewed, rendered[index]);
    return {
      id: page.id,
      reviewedPng: path.relative(ROOT, page.reviewed).replace(/\\/g, "/"),
      reviewedPngSha256: shaFile(page.reviewed),
      finalPng: path.relative(ROOT, rendered[index]).replace(/\\/g, "/"),
      finalPngSha256: shaFile(rendered[index]),
      changedPixels: comparison.changedPixels,
      equal: comparison.equal
    };
  });
  const failures = rows.filter(row => !row.equal);
  if (failures.length) throw new Error(`final artifact differs from reviewed PNGs:\n- ${failures.map(row => `${row.id}: ${row.changedPixels} changed pixels`).join("\n- ")}`);
  const geometryRows = pages.map(page => {
    const checked = verifyPageAudit(path.join(PAGES, page.dir), page.page);
    return {
      id: page.id,
      audit: path.relative(ROOT, checked.reportFile).replace(/\\/g, "/"),
      auditSha256: shaFile(checked.reportFile),
      verdict: checked.report?.verdict || "MISSING",
      errors: checked.errors
    };
  });
  const geometryFailures = geometryRows.filter(row => row.errors.length);
  if (geometryFailures.length) throw new Error(`final staging geometry lock failed:\n- ${geometryFailures.map(row => `${row.id}: ${row.errors.join("; ")}`).join("\n- ")}`);
  const published = publishFile ? publish(staging, canonical) : { canonical: "", backup: "" };
  const artifactReceipt = {
    version: "leander-final-artifact-receipt.v2",
    runId: receipt.runId || "",
    generatedAt: new Date().toISOString(),
    staging: { path: path.relative(ROOT, staging).replace(/\\/g, "/"), sha256: shaFile(staging) },
    canonical: published.canonical ? { path: path.relative(ROOT, published.canonical).replace(/\\/g, "/"), sha256: shaFile(published.canonical), backup: published.backup ? path.relative(ROOT, published.backup).replace(/\\/g, "/") : "" } : null,
    pages: rows,
    geometry: geometryRows,
    verdict: "PASS"
  };
  fs.writeFileSync(path.join(OUTPUT, "final-artifact-receipt.json"), JSON.stringify(artifactReceipt, null, 2) + "\n", "utf8");
  return artifactReceipt;
}
function selfTest() {
  const os = require("os");
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "leander-final-pixels-"));
  try {
    const make = color => {
      const png = new PNG({ width: 2, height: 2 });
      for (let i = 0; i < png.data.length; i += 4) { png.data[i] = color; png.data[i + 3] = 255; }
      return PNG.sync.write(png);
    };
    const a = path.join(temp, "a.png"), b = path.join(temp, "b.png");
    fs.writeFileSync(a, make(10)); fs.writeFileSync(b, make(10));
    if (!comparePng(a, b).equal) throw new Error("equal PNGs failed");
    fs.writeFileSync(b, make(11));
    if (comparePng(a, b).equal) throw new Error("pixel mutation did not fail");
    console.log("PASS final artifact pixel self-test");
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
if (require.main === module) {
  try {
    if (process.argv.includes("--self-test")) selfTest();
    else if (process.argv[2] === "verify") {
      const result = verifyAndPublish({
        staging: path.resolve(ROOT, arg("pptx")),
        canonical: path.resolve(ROOT, arg("publish")),
        publishFile: !process.argv.includes("--no-publish")
      });
      console.log(`PASS final artifact: ${result.pages.length} pages, zero changed pixels`);
    } else throw new Error("usage: final-artifact-gate.js verify --pptx <staging> --publish <canonical> [--no-publish]");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
module.exports = { comparePng, activePages, renderPptx, publish, verifyAndPublish, shaFile, selfTest };
