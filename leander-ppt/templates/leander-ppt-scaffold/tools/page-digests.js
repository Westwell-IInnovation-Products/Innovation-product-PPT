// Purpose-specific page digests. Non-render metadata must not invalidate PNGs.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const assert = require("assert");
const ROOT = path.join(__dirname, "..");
const MANIFEST = path.join(ROOT, "state", "render-dependency-manifest.json");

function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function shaText(text) { return crypto.createHash("sha256").update(String(text)).digest("hex"); }
function shaFile(file) { return fs.existsSync(file) && fs.statSync(file).isFile() ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") : ""; }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
function stableHash(value) { return shaText(JSON.stringify(stable(value))); }
function listFiles(root, predicate) {
  if (!fs.existsSync(root)) return [];
  const files = [], stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(target);
      else if (predicate(target)) files.push(target);
    }
  }
  return files.sort();
}
function sharedRenderFiles(root = ROOT) {
  const renderExt = /\.(?:js|json|png|jpe?g|svg|webp)$/i;
  return [
    ...listFiles(path.join(root, "theme"), file => renderExt.test(file)),
    ...listFiles(path.join(root, "components"), file => /\.(?:js|png|jpe?g|svg|webp)$/i.test(file)),
    ...[path.join(root, "tools", "deck-ctx.js")].filter(fs.existsSync)
  ];
}
function sharedRenderDigest(root = ROOT) {
  return stableHash(sharedRenderFiles(root).map(file => [path.relative(root, file).replace(/\\/g, "/"), shaFile(file)]));
}
function loadConfig(root = ROOT) {
  const file = path.join(root, "deck.config.js");
  try { delete require.cache[require.resolve(file)]; return require(file) || {}; } catch { return {}; }
}
function resolveDependency(root, pageDir, item) {
  const value = typeof item === "string" ? item : item?.path;
  if (!value) return { path: "", sha256: "", missing: true };
  const candidates = path.isAbsolute(value) ? [value] : [path.resolve(pageDir, value), path.resolve(root, value)];
  const file = candidates.find(fs.existsSync) || candidates[0];
  return { path: path.relative(root, file).replace(/\\/g, "/"), sha256: shaFile(file), missing: !fs.existsSync(file) };
}
function sourceProjection(page) {
  const keys = ["implementationStatus", "dataBoundary", "sourceEvidence", "sourceReferences", "sources", "citations", "claims", "metrics", "factBoundaries", "sourceBoundary", "evidenceBoundary", "screenshotSlots"];
  return Object.fromEntries(keys.filter(key => page[key] !== undefined).map(key => [key, page[key]]));
}
function qaResultProjection(result) {
  if (!result) return null;
  return { version: result.version || "", pageId: result.pageId || "", verdict: result.verdict || "", reviewer: result.reviewer || {}, checks: result.checks || [], remainingRisks: result.remainingRisks || [] };
}
function selectionOutcome(page) {
  const vs = page.visualSelection || {};
  return { visualSignature: vs.visualSignature || "", requiredSlots: vs.requiredSlots || [], contentShape: vs.contentShape || {}, selectedRoute: vs.selectedRoute || {} };
}
function digestPage(pageDir, root = ROOT) {
  const page = readJson(path.join(pageDir, "page.json"), {}), cfg = loadConfig(root);
  const dependencies = (page.renderDependencies || []).map(item => resolveDependency(root, pageDir, item));
  const shared = sharedRenderDigest(root);
  const renderConfig = { theme: cfg.theme || "", renderContextVersion: cfg.renderContextVersion || 1 };
  return {
    version: "page-digests.v1",
    pageId: String(page.id || page.page || path.basename(pageDir)),
    generatedAt: new Date().toISOString(),
    sharedRenderDigest: shared,
    renderDependencies: dependencies,
    renderDigest: stableHash({ pageJs: shaFile(path.join(pageDir, "page.js")), renderInputs: page.renderInputs || {}, selectedVisualOutcome: selectionOutcome(page), renderDependencies: dependencies, deckRenderConfig: renderConfig, sharedRenderDigest: shared }),
    selectionDigest: stableHash(page.visualSelection || {}),
    selectionOutcomeDigest: stableHash(selectionOutcome(page)),
    qaDigest: stableHash({ qaProfile: page.qaProfile || {}, qaRules: shaFile(path.join(root, "tools", "qa-rules.zh.json")), qaResult: qaResultProjection(readJson(path.join(pageDir, "qa-result.json"))) }),
    sourceDigest: stableHash(sourceProjection(page))
  };
}
function pageDirs(root = ROOT) {
  const base = path.join(root, "pages");
  return fs.existsSync(base) ? fs.readdirSync(base).filter(dir => fs.existsSync(path.join(base, dir, "page.json"))).sort() : [];
}
function selectDirs(root = ROOT, pages = []) {
  const all = pageDirs(root), wanted = new Set(pages.filter(Boolean));
  if (!wanted.size) return all;
  return all.filter(dir => {
    const meta = readJson(path.join(root, "pages", dir, "page.json"), {}), id = String(meta.id || "");
    return wanted.has(dir) || wanted.has(id);
  });
}
function capture({ root = ROOT, pages = [], write = true } = {}) {
  const dirs = selectDirs(root, pages), out = {};
  dirs.forEach(dir => {
    const pageDir = path.join(root, "pages", dir), value = digestPage(pageDir, root);
    out[dir] = value;
    if (write) { const file = path.join(pageDir, "out", "page-digests.json"); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8"); }
  });
  return out;
}
function loadManifest(root = ROOT) { return readJson(path.join(root, "state", "render-dependency-manifest.json"), { version: "render-dependency-manifest.v1", sharedRenderDigest: "", pages: {} }); }
function commitManifest({ root = ROOT, pages = [] } = {}) {
  const dirs = selectDirs(root, pages), current = capture({ root, pages: dirs, write: true }), manifest = loadManifest(root);
  manifest.version = "render-dependency-manifest.v1";
  manifest.committedAt = new Date().toISOString();
  manifest.pages = manifest.pages || {};
  dirs.forEach(dir => { manifest.pages[dir] = current[dir]; });
  if (dirs.length === pageDirs(root).length || !manifest.sharedRenderDigest) manifest.sharedRenderDigest = sharedRenderDigest(root);
  const file = path.join(root, "state", "render-dependency-manifest.json");
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  return manifest;
}
function legacyRenderContextDigest(pageDir) {
  const root = path.resolve(pageDir, "..", ".."), cfg = loadConfig(root);
  return shaText(JSON.stringify({ theme: cfg.theme || "", renderContextVersion: cfg.renderContextVersion || 1 }));
}
function legacyContractDigest(pageDir) { return shaText(`${shaFile(path.join(pageDir, "page.json"))}:${shaFile(path.join(pageDir, "page.js"))}:${legacyRenderContextDigest(pageDir)}`); }
function selfTest() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "leander-digests-")), pageDir = path.join(root, "pages", "p01"), themeDir = path.join(root, "theme"), compDir = path.join(root, "components"), toolsDir = path.join(root, "tools");
  [pageDir, themeDir, compDir, toolsDir].forEach(dir => fs.mkdirSync(dir, { recursive: true }));
  fs.writeFileSync(path.join(root, "deck.config.js"), "module.exports={theme:'base'};\n");
  fs.writeFileSync(path.join(themeDir, "tokens.js"), "module.exports={a:1};\n");
  fs.writeFileSync(path.join(compDir, "c.js"), "module.exports={};\n");
  fs.writeFileSync(path.join(toolsDir, "qa-rules.zh.json"), "{}\n");
  fs.writeFileSync(path.join(pageDir, "page.js"), "module.exports={id:'p01'};\n");
  const page = { id: "p01", renderInputs: { title: "A" }, visualSelection: { selectedRoute: { route: "page-specific-custom", name: "x" }, candidateRoutes: [] }, qaProfile: { version: "qa-profile.zh.v2" } };
  fs.writeFileSync(path.join(pageDir, "page.json"), JSON.stringify(page));
  const a = digestPage(pageDir, root);
  page.qaProfile.pageRules = [{ id: "x" }]; fs.writeFileSync(path.join(pageDir, "page.json"), JSON.stringify(page));
  const b = digestPage(pageDir, root); assert.equal(a.renderDigest, b.renderDigest); assert.notEqual(a.qaDigest, b.qaDigest);
  page.visualSelection.candidateRoutes.push({ route: "image2", score: 1 }); fs.writeFileSync(path.join(pageDir, "page.json"), JSON.stringify(page));
  const c = digestPage(pageDir, root); assert.equal(b.renderDigest, c.renderDigest); assert.notEqual(b.selectionDigest, c.selectionDigest); assert.equal(b.selectionOutcomeDigest, c.selectionOutcomeDigest);
  page.visualSelection.selectedRoute.name = "y"; fs.writeFileSync(path.join(pageDir, "page.json"), JSON.stringify(page));
  const selectedChanged = digestPage(pageDir, root); assert.notEqual(c.renderDigest, selectedChanged.renderDigest); assert.notEqual(c.selectionOutcomeDigest, selectedChanged.selectionOutcomeDigest);
  fs.writeFileSync(path.join(pageDir, "page.js"), "module.exports={id:'p01',v:2};\n"); assert.notEqual(c.renderDigest, digestPage(pageDir, root).renderDigest);
  fs.rmSync(root, { recursive: true, force: true }); console.log("PASS page digests self-test");
}
if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    const command = process.argv[2] || "capture", i = process.argv.indexOf("--pages"), pages = i >= 0 && process.argv[i + 1] ? process.argv[i + 1].split(",") : [];
    if (command === "capture") { const result = capture({ pages }); console.log(`Captured page digests: ${Object.keys(result).length}`); }
    else throw new Error("usage: page-digests.js capture [--pages p01,p02]; render manifest commits are owned by deck.js");
  }
}
module.exports = { shaText, shaFile, stableHash, sharedRenderDigest, sourceProjection, qaResultProjection, selectionOutcome, digestPage, pageDirs, selectDirs, capture, loadManifest, commitManifest, legacyContractDigest, legacyRenderContextDigest, selfTest };
