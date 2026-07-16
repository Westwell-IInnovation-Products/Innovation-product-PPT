// Per-page production pipeline with a hard QA gate.
//   node tools/deck.js render [--pages a,b] -> render active/selected pages to pages/<id>/out/<id>.png
//   node tools/deck.js verify        -> page QA gate only (exit 0 if all pages fresh+PASS, else non-zero). Used by the Stop hook.
//   node tools/deck.js verify --final -> page QA gate + agent collaboration gate.
//   node tools/deck.js build [--draft] -> verify, then assemble PASS pages into the final pptx (--draft assembles all anyway)
//
// The GATE for each page (pages/<id>/): page.json has a visualSelection contract and qaProfile;
// qa.md exists, contains "Verdict: PASS", and is NOT older than page.js/page.json;
// and out/<id>.png exists and is NOT older than page.js. So "changed a page but didn't re-render / re-review" is auto-caught.
const fs = require("fs"), path = require("path"), cp = require("child_process");
const cfg = require("./../deck.config");
const { newPptx, makeCtx } = require("./deck-ctx");
const { getTheme } = require("../theme/tokens");
const { requireToolchain, libreOfficeProfile } = require("./toolchain");
const { verify: verifyQaResult, shaFile } = require("./verify-qa-result");
const { digestPage, loadManifest, sharedRenderDigest, commitManifest } = require("./page-digests");
const { inspect: inspectChanges } = require("./change-impact");

const ROOT = path.join(__dirname, "..");
const PAGES = path.join(ROOT, "pages");

// Keep in sync with .leander-scaffold-version.json; regression blackbox fails on drift.
const SCAFFOLD_VERSION = "0.6.0-beta.8";
function verifyScaffoldVersion() {
  const file = path.join(ROOT, ".leander-scaffold-version.json");
  let version = "";
  try { version = JSON.parse(fs.readFileSync(file, "utf8")).version || ""; } catch {}
  if (version !== SCAFFOLD_VERSION) {
    console.error(`LEANDER SCAFFOLD STALE: expected ${SCAFFOLD_VERSION}, got ${version || "missing"}.`);
    console.error("Run <skill-root>/scripts/sync-scaffold-tools.js <project-root> before render/verify/build.");
    process.exit(1);
  }
}
function verifyToolFreeze() {
  try { cp.execFileSync(process.execPath, [path.join(__dirname, "tool-freeze.js"), "verify"], { stdio: "inherit" }); }
  catch { process.exit(1); }
}

function verifyWorkflowEntry(target, gateLabel) {
  try {
    cp.execFileSync(process.execPath, [path.join(__dirname, "workflow-gate.js"), "verify", target], { stdio: "inherit" });
  } catch (e) {
    process.exit(1);
  }
  // Final verification can create a Gate-boundary rotation lock. Recheck it
  // in the parent process so the same render/build command cannot continue.
  try {
    cp.execFileSync(process.execPath, [path.join(__dirname, "context-budget-gate.js"), "--enforce-budget", "--gate", gateLabel], { stdio: "inherit" });
  } catch (e) {
    process.exit(1);
  }
}

function verifyQualityBaseline() {
  try {
    cp.execFileSync(process.execPath, [path.join(__dirname, "verify-quality-baseline.js")], { stdio: "inherit" });
  } catch (e) {
    process.exit(1);
  }
}
function verifyPagePreflight() {
  const pages = selectedPageNames();
  try {
    cp.execFileSync(process.execPath, [path.join(__dirname, "verify-page-preflight.js"), ...(pages.length ? ["--pages", pages.join(",")] : [])], { stdio: "inherit" });
  } catch (e) { process.exit(1); }
}

function verifyRenderedQualityIfFinal() {
  const wf = cfg.workflow || {};
  if (wf.stage !== "production") return;
  try {
    cp.execFileSync(process.execPath, [path.join(__dirname, "render-quality-gate.js"), "verify"], { stdio: "inherit" });
  } catch (error) {
    process.exit(error.status || 1);
  }
}

function workflowTarget(command) {
  const stage = (cfg.workflow || {}).stage;
  if (stage === "anchor-sample") return "anchor";
  if (stage === "production-batch" || stage === "production") return command === "build" ? "final" : "production";
  console.error(`LEANDER WORKFLOW BLOCKED: slide ${command} is not allowed while workflow.stage=${stage || "missing"}.`);
  console.error("Complete and approve the current planning/blueprint checkpoint before producing slides.");
  process.exit(1);
}

const theme = getTheme(cfg.theme);
const loadPage = d => require(path.join(PAGES, d, "page.js"));
let runtimePageSelection = null;
function selectedPageNames() {
  const index = process.argv.indexOf("--pages");
  const cli = index >= 0 && process.argv[index + 1] ? process.argv[index + 1].split(",") : [];
  const configured = Array.isArray(cfg.workflow && cfg.workflow.activePages) ? cfg.workflow.activePages : [];
  return [...new Set((cli.length ? cli : configured).map(value => String(value).trim()).filter(Boolean))];
}
function pageDirs() {
  const dirs = fs.readdirSync(PAGES).filter(d => fs.existsSync(path.join(PAGES, d, "page.js"))).sort();
  const selected = runtimePageSelection || selectedPageNames();
  if (!selected.length) return dirs;
  const wanted = new Set(selected);
  const matches = dirs.filter(dir => wanted.has(dir) || wanted.has(loadPage(dir).id));
  const matchedNames = new Set(matches.flatMap(dir => [dir, loadPage(dir).id]));
  const missing = selected.filter(name => !matchedNames.has(name));
  if (missing.length) {
    console.error(`active pages not found: ${missing.join(", ")}`);
    process.exit(1);
  }
  return matches;
}
function verifyAgentCollaborationIfEnabled() {
  const ac = cfg.agentCollaboration || {};
  if (!ac.enabled) return;
  try {
    cp.execFileSync(process.execPath, [path.join(__dirname, "verify-agent-collaboration.js")], { stdio: "inherit" });
  } catch (e) {
    process.exit(1);
  }
}
function verifyPhaseCheckpointsIfNeeded() {
  const wf = cfg.workflow || {};
  if (!["production-batch", "production"].includes(wf.stage)) return;
  try {
    cp.execFileSync(process.execPath, [path.join(__dirname, "verify-checkpoints.js"), "phase4"], { stdio: "inherit" });
  } catch (e) {
    process.exit(1);
  }
}
function verifyDesignGateIfNeeded() {
  const wf = cfg.workflow || {};
  if (wf.stage === "outline-reset" || wf.stage === "layout-blueprint") {
    console.error(`REFUSING to use stale pages while workflow.stage=${wf.stage}. Regenerate and approve the layout blueprint first.`);
    process.exit(1);
  }
  try {
    cp.execFileSync(process.execPath, [path.join(__dirname, "verify-design-gates.js"), "pages"], { stdio: "inherit" });
  } catch (e) {
    process.exit(1);
  }
}
function loadPageJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); }
  catch (e) { return null; }
}
function hasVisualSelection(meta) {
  return !!(meta && meta.visualSelection && meta.visualSelection.selectedRoute && meta.visualSelection.selectedRoute.route);
}
function hasQaProfile(meta) {
  return !!(meta && meta.qaProfile && meta.qaProfile.version === "qa-profile.zh.v2");
}
function norm(v) {
  return String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function validateVisualSelection(meta, pageModule) {
  const vs = meta && meta.visualSelection;
  if (!vs || !vs.selectedRoute || !vs.selectedRoute.route) return "page.json lacks visualSelection.selectedRoute.route";
  if (vs.skip === true) return "";

  const routes = new Set((vs.candidateRoutes || []).map(r => r.route));
  const requiredRoutes = ["component-library", "external-graphic", "image2", "page-specific-custom"];
  const missingRoutes = requiredRoutes.filter(r => !routes.has(r));
  if (vs.engineVersion !== "visual-selector.v2") {
    return "legacy visualSelection; run `node tools/select-visual-route.js pages/<id>/page.json --write`";
  }
  if (!Array.isArray(vs.candidateRoutes) || vs.candidateRoutes.length < 4) {
    return "visualSelection needs ranked candidateRoutes";
  }
  if (missingRoutes.length) return "visualSelection did not evaluate routes: " + missingRoutes.join(", ");
  if (vs.candidateRoutes.some(r => typeof r.score !== "number")) {
    return "visualSelection candidateRoutes need numeric score";
  }
  if (vs.selectedRoute.route === "image2" && !(vs.promptSpec && vs.promptSpec.file)) {
    return "image2 route selected but promptSpec.file is missing";
  }

  const binding = pageModule.visualBinding || (vs.implementation && vs.implementation.actualBinding);
  if (!binding || !binding.route || !binding.name) {
    return "page.js must export visualBinding { route, name } or visualSelection.implementation.actualBinding";
  }
  if (binding.route !== vs.selectedRoute.route) {
    return `visualBinding.route (${binding.route}) does not match selectedRoute.route (${vs.selectedRoute.route})`;
  }
  const selectedName = norm(vs.selectedRoute.name);
  const bindingName = norm(binding.name);
  if (selectedName && bindingName && !selectedName.includes(bindingName) && !bindingName.includes(selectedName)) {
    return `visualBinding.name (${binding.name}) does not match selectedRoute.name (${vs.selectedRoute.name})`;
  }
  return "";
}

function validateQaProfile(meta) {
  const qp = meta && meta.qaProfile;
  if (!qp) return "page.json lacks qaProfile; run `node tools/build-qa-profile.js pages/<id>/page.json --write`";
  if (qp.version !== "qa-profile.zh.v2") return "qaProfile version must be qa-profile.zh.v2; rebuild the compact profile";
  if (!Array.isArray(qp.ruleSets) || !qp.ruleSets.includes("universal")) return "qaProfile.ruleSets must include universal";
  if (!Array.isArray(qp.requiredEvidence) || !qp.requiredEvidence.includes("render-sha256")) return "qaProfile.requiredEvidence must include render-sha256";
  if (!qp.relationship) return "qaProfile.relationship is missing";
  if (!qp.selectedRoute || !qp.selectedRoute.route) return "qaProfile.selectedRoute.route is missing";
  const vs = meta.visualSelection || {};
  const sr = vs.selectedRoute || {};
  if (sr.route && qp.selectedRoute.route && sr.route !== qp.selectedRoute.route) {
    return `qaProfile.selectedRoute.route (${qp.selectedRoute.route}) does not match visualSelection.selectedRoute.route (${sr.route})`;
  }
  return "";
}

function gate() {
  const manifest = loadManifest(ROOT), currentShared = sharedRenderDigest(ROOT);
  const rows = pageDirs().map(d => {
    const dir = path.join(PAGES, d), pj = path.join(dir, "page.js"), metaFile = path.join(dir, "page.json"), qa = path.join(dir, "qa.md");
    const p = loadPage(d);
    const png = path.join(dir, "out", p.id + ".png");
    const meta = loadPageJson(metaFile);
    const digests = meta ? digestPage(dir, ROOT) : null;
    let status = "PASS", reason = "";
    if (!fs.existsSync(metaFile)) { status = "MISSING-CONTRACT"; reason = "no page.json"; }
    else if (!meta) { status = "BAD-CONTRACT"; reason = "page.json is not valid JSON"; }
    else if (!hasVisualSelection(meta)) { status = "NO-VISUAL-SELECTION"; reason = "page.json lacks visualSelection.selectedRoute.route"; }
    else {
      const visualErr = validateVisualSelection(meta, p);
      if (visualErr) { status = "BAD-VISUAL-SELECTION"; reason = visualErr; }
    }
    if (status === "PASS") {
      const qaProfileErr = validateQaProfile(meta);
      if (qaProfileErr) { status = "BAD-QA-PROFILE"; reason = qaProfileErr; }
    }
    if (status !== "PASS") {
      // Keep the first structural failure. Freshness checks below only run after the visual contract is sound.
    }
    else if (!fs.existsSync(png)) { status = "NO-RENDER"; reason = "out/" + p.id + ".png missing"; }
    else if (manifest.sharedRenderDigest !== currentShared) { status = "STALE-RENDER"; reason = "shared theme/component render digest changed - re-render full deck"; }
    else if (!manifest.pages?.[d] || manifest.pages[d].renderDigest !== digests.renderDigest) { status = "STALE-RENDER"; reason = "page renderDigest changed - re-render this page"; }
    else {
      const qaEvidence = verifyQaResult(dir);
      if (!qaEvidence.ok) { status = "BAD-QA-EVIDENCE"; reason = qaEvidence.errors.slice(0, 3).join("; "); }
      else if (!fs.existsSync(qa)) { status = "MISSING-QA-SUMMARY"; reason = "qa.md must be generated from qa-result.json"; }
      else if (!/Verdict:\s*PASS/i.test(fs.readFileSync(qa, "utf8"))) { status = "BAD-QA-SUMMARY"; reason = "qa.md is not a PASS summary"; }
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
  const traces = {};
  use.forEach(r => {
    const p = loadPage(r.dir);
    const slide = pptx.addSlide();
    slide.addNotes(`${p.id} 路 ${p.title} 路 gate=${r.status}`);
    ctx.trace.beginPage(p.id);
    try { p.build(slide, ctx); }
    finally { traces[p.id] = ctx.trace.endPage(p.id); }
  });
  return { pptx, used: use, gate: g, traces };
}

function renderPptxToPngs(pptxAbs, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const renderTools = requireToolchain();
  const prof = libreOfficeProfile("lo_deck");
  cp.execFileSync(renderTools.soffice, ["--headless", "-env:UserInstallation=" + prof, "--convert-to", "pdf", "--outdir", outDir, pptxAbs], { stdio: "ignore" });
  const pdf = path.join(outDir, path.basename(pptxAbs).replace(/\.pptx$/, ".pdf"));
  cp.execFileSync(renderTools.pdftoppm, ["-png", "-r", "96", pdf, path.join(outDir, "slide")], { stdio: "ignore" });
  return fs.readdirSync(outDir).filter(f => /^slide-\d+\.png$/.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function cmdRender() {
  verifyWorkflowEntry(workflowTarget("render"), "deck-render");
  verifyQualityBaseline();
  verifyPagePreflight();
  const wf = cfg.workflow || {};
  if (wf.stage === "outline-reset" || wf.stage === "layout-blueprint") {
    console.error(`REFUSING to render stale pages while workflow.stage=${wf.stage}. Regenerate and approve the layout blueprint first.`);
    process.exit(1);
  }
  const requested = selectedPageNames();
  const impact = inspectChanges({ root: ROOT, pages: requested });
  if (impact.kind === "no-render") {
    console.log(`render skipped: no renderDigest changes (${Object.keys(impact.evidenceChanges || {}).length} evidence-only page changes)`);
    return Promise.resolve();
  }
  if (impact.kind === "shared-render") runtimePageSelection = fs.readdirSync(PAGES).filter(d => fs.existsSync(path.join(PAGES, d, "page.js"))).sort();
  else runtimePageSelection = impact.affectedPages;
  // Assemble affected pages -> render once -> split each slide back to its page output.
  const { pptx, used, traces } = assemble(false);
  const tmp = path.join(ROOT, "output", "_render.pptx");
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  return pptx.writeFile({ fileName: tmp }).then(() => {
    const tmpOut = path.join(ROOT, "output", "_renderpng");
    fs.rmSync(tmpOut, { recursive: true, force: true });
    const pngs = renderPptxToPngs(tmp, tmpOut);
    used.forEach((r, i) => {
      const od = path.join(PAGES, r.dir, "out");
      fs.mkdirSync(od, { recursive: true });
      if (pngs[i]) {
        const renderFile = path.join(od, r.id + ".png");
        fs.copyFileSync(path.join(tmpOut, pngs[i]), renderFile);
        const pageDir = path.join(PAGES, r.dir);
        const meta = loadPageJson(path.join(pageDir, "page.json")) || {};
        const selected = meta.visualSelection && meta.visualSelection.selectedRoute || {};
        const digests = digestPage(pageDir, ROOT);
        const trace = {
          version: "component-trace.v2",
          pageId: r.id,
          generatedAt: new Date().toISOString(),
          renderSha256: shaFile(renderFile),
          digests: { renderDigest: digests.renderDigest, selectionOutcomeDigest: digests.selectionOutcomeDigest },
          selectedBinding: selected,
          calls: traces[r.id] || []
        };
        fs.writeFileSync(path.join(od, "component-trace.json"), JSON.stringify(trace, null, 2) + "\n", "utf8");
      }
    });
    fs.rmSync(tmp, { force: true });
    fs.rmSync(tmpOut, { recursive: true, force: true });
    commitManifest({ root: ROOT, pages: used.map(row => row.dir) });
    console.log(`rendered ${used.length} pages -> pages/<id>/out/<id>.png`);
  });
}

function printGate(g) {
  g.rows.forEach(r => console.log(`  ${r.status === "PASS" ? "OK" : "NO"} ${r.id} ${r.title}  [${r.status}]${r.reason ? "  " + r.reason : ""}`));
  const pass = g.rows.filter(r => r.status === "PASS").length;
  console.log(`  -- ${pass}/${g.rows.length} PASS`);
}

function cmdVerify(finalMode) {
  verifyWorkflowEntry(workflowTarget(finalMode ? "build" : "verify"), finalMode ? "deck-verify-final" : "deck-verify");
  verifyQualityBaseline();
  verifyPagePreflight();
  if (finalMode) verifyPhaseCheckpointsIfNeeded();
  if (finalMode) verifyAgentCollaborationIfEnabled();
  if (finalMode) verifyRenderedQualityIfFinal();
  verifyDesignGateIfNeeded();
  const g = gate();
  console.log("QA gate:");
  printGate(g);
  if (!g.ok) { console.error("GATE FAILED: fix, re-render, and re-review the pages above."); process.exit(1); }
  console.log("GATE OK");
}

function cmdBuild(draft) {
  // --draft relaxes page QA only. It never bypasses the workflow receipt or user checkpoints.
  verifyWorkflowEntry(workflowTarget("build"), draft ? "deck-build-draft" : "deck-build");
  verifyQualityBaseline();
  verifyPagePreflight();
  if (!draft) verifyPhaseCheckpointsIfNeeded();
  if (!draft) verifyAgentCollaborationIfEnabled();
  if (!draft) verifyRenderedQualityIfFinal();
  if (!draft) verifyDesignGateIfNeeded();
  const g = gate();
  console.log("QA gate:");
  printGate(g);
  if (!g.ok && !draft) {
    console.error("REFUSING to build final deck: pages above are not fresh+PASS. Use --draft to assemble anyway.");
    process.exit(1);
  }
  const { pptx, used } = assemble(!draft);
  const stage = cfg.workflow && cfg.workflow.stage;
  const outputFile = stage === "anchor-sample" && cfg.anchorFileName
    ? cfg.anchorFileName
    : stage === "production-batch" && cfg.batchFileName
      ? cfg.batchFileName
      : cfg.fileName;
  if (/[<>]/.test(String(outputFile || ""))) {
    console.error(`deck.config fileName still contains a template placeholder: ${outputFile}. Set a real output path before building.`);
    process.exit(1);
  }
  return pptx.writeFile({ fileName: outputFile }).then(f => {
    console.log(`wrote ${f}  (${used.length} pages${draft ? ", DRAFT incl. non-PASS" : ", all PASS"})`);
  });
}

const cmd = process.argv[2], draft = process.argv.includes("--draft"), finalMode = process.argv.includes("--final");
verifyScaffoldVersion();
verifyToolFreeze();
if (cmd === "render") cmdRender();
else if (cmd === "verify") cmdVerify(finalMode);
else if (cmd === "build") cmdBuild(draft);
else { console.log("usage: node tools/deck.js render|verify [--final]|build [--draft] [--pages a,b]"); process.exit(1); }
