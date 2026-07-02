// Per-page production pipeline with a hard QA gate.
//   node tools/deck.js render        -> render every page to pages/<id>/out/<id>.png (isolated artifact)
//   node tools/deck.js verify        -> gate check only (exit 0 if all pages fresh+PASS, else non-zero). Used by the Stop hook.
//   node tools/deck.js build [--draft] -> verify, then assemble PASS pages into the final pptx (--draft assembles all anyway)
//
// The GATE for each page (pages/<id>/): qa.md exists, contains "Verdict: PASS", and is NOT older than page.js;
// and out/<id>.png exists and is NOT older than page.js. So "changed a page but didn't re-render / re-review" is auto-caught.
const fs = require("fs"), path = require("path"), cp = require("child_process");
const cfg = require("./../deck.config");
const { newPptx, makeCtx } = require("./deck-ctx");
const { getTheme } = require("../theme/tokens");

const ROOT = path.join(__dirname, "..");
const PAGES = path.join(ROOT, "pages");
const SOFFICE = "C:/Program Files/LibreOffice/program/soffice.exe";
const PDFTOPPM = "C:/Users/admin/AppData/Local/Microsoft/WinGet/Packages/oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe/poppler-25.07.0/Library/bin/pdftoppm.exe";

const theme = getTheme(cfg.theme);
const mtime = f => { try { return fs.statSync(f).mtimeMs; } catch (e) { return 0; } };
const pageDirs = () => fs.readdirSync(PAGES).filter(d => fs.existsSync(path.join(PAGES, d, "page.js"))).sort();
const loadPage = d => require(path.join(PAGES, d, "page.js"));

function gate() {
  const rows = pageDirs().map(d => {
    const dir = path.join(PAGES, d), pj = path.join(dir, "page.js"), qa = path.join(dir, "qa.md");
    const p = loadPage(d);
    const png = path.join(dir, "out", p.id + ".png");
    let status = "PASS", reason = "";
    if (!fs.existsSync(qa)) { status = "MISSING-QA"; reason = "no qa.md"; }
    else {
      const m = fs.readFileSync(qa, "utf8").match(/Verdict:\s*(PASS|FAIL|FIX-FIRST)/i);
      if (!m) { status = "NO-VERDICT"; reason = "qa.md lacks 'Verdict:'"; }
      else if (!/PASS/i.test(m[1])) { status = "FAIL"; reason = "verdict=" + m[1]; }
      else if (mtime(qa) < mtime(pj)) { status = "STALE-QA"; reason = "qa.md older than page.js — re-review"; }
      else if (!fs.existsSync(png)) { status = "NO-RENDER"; reason = "out/" + p.id + ".png missing"; }
      else if (mtime(png) < mtime(pj)) { status = "STALE-RENDER"; reason = "render older than page.js — re-render"; }
    }
    return { id: p.id, dir: d, title: p.title, status, reason };
  });
  return { ok: rows.every(r => r.status === "PASS"), rows };
}

function assemble(onlyPass) {
  const pptx = newPptx(theme);
  const ctx = makeCtx(pptx, theme);
  const g = gate();
  const use = g.rows.filter(r => !onlyPass || r.status === "PASS");
  use.forEach(r => {
    const p = loadPage(r.dir);
    const slide = pptx.addSlide();
    slide.addNotes(`${p.id} · ${p.title} · gate=${r.status}`);
    p.build(slide, ctx);
  });
  return { pptx, used: use, gate: g };
}

function renderPptxToPngs(pptxAbs, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const prof = "file:///C:/tmp/lo_deck_" + Date.now();
  cp.execFileSync(SOFFICE, ["--headless", "-env:UserInstallation=" + prof, "--convert-to", "pdf", "--outdir", outDir, pptxAbs], { stdio: "ignore" });
  const pdf = path.join(outDir, path.basename(pptxAbs).replace(/\.pptx$/, ".pdf"));
  cp.execFileSync(PDFTOPPM, ["-png", "-r", "96", pdf, path.join(outDir, "slide")], { stdio: "ignore" });
  return fs.readdirSync(outDir).filter(f => /^slide-\d+\.png$/.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function cmdRender() {
  // Assemble ALL pages (draft) -> render whole -> split each slide back to its page's out/<id>.png (per-page artifact).
  const { pptx, used } = assemble(false);
  const tmp = path.join(ROOT, "output", "_render.pptx");
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  return pptx.writeFile({ fileName: tmp }).then(() => {
    const tmpOut = path.join(ROOT, "output", "_renderpng");
    fs.rmSync(tmpOut, { recursive: true, force: true });
    const pngs = renderPptxToPngs(tmp, tmpOut);
    used.forEach((r, i) => {
      const od = path.join(PAGES, r.dir, "out");
      fs.mkdirSync(od, { recursive: true });
      if (pngs[i]) fs.copyFileSync(path.join(tmpOut, pngs[i]), path.join(od, r.id + ".png"));
    });
    console.log(`rendered ${used.length} pages -> pages/<id>/out/<id>.png`);
  });
}

function printGate(g) {
  g.rows.forEach(r => console.log(`  ${r.status === "PASS" ? "✓" : "✗"} ${r.id} ${r.title}  [${r.status}]${r.reason ? "  " + r.reason : ""}`));
  const pass = g.rows.filter(r => r.status === "PASS").length;
  console.log(`  ── ${pass}/${g.rows.length} PASS`);
}

function cmdVerify() {
  const g = gate();
  console.log("QA gate:");
  printGate(g);
  if (!g.ok) { console.error("GATE FAILED — fix/re-render/re-review the ✗ pages above."); process.exit(1); }
  console.log("GATE OK");
}

function cmdBuild(draft) {
  const g = gate();
  console.log("QA gate:");
  printGate(g);
  if (!g.ok && !draft) {
    console.error("REFUSING to build final deck — pages above are not fresh+PASS. Use --draft to assemble anyway.");
    process.exit(1);
  }
  const { pptx, used } = assemble(!draft);
  return pptx.writeFile({ fileName: cfg.fileName }).then(f => {
    console.log(`wrote ${f}  (${used.length} pages${draft ? ", DRAFT incl. non-PASS" : ", all PASS"})`);
  });
}

const cmd = process.argv[2], draft = process.argv.includes("--draft");
if (cmd === "render") cmdRender();
else if (cmd === "verify") cmdVerify();
else if (cmd === "build") cmdBuild(draft);
else { console.log("usage: node tools/deck.js render|verify|build [--draft]"); process.exit(1); }
