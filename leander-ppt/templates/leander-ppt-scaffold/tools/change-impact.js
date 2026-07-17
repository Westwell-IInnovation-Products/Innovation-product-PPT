// Compare current purpose-specific digests with the last committed render set.
const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");
const { digestPage, pageDirs, selectDirs, loadManifest, commitManifest, sharedRenderDigest } = require("./page-digests");
const ROOT = path.join(__dirname, "..");
function inspect({ root = ROOT, pages = [] } = {}) {
  const dirs = selectDirs(root, pages), all = pageDirs(root), manifest = loadManifest(root), currentShared = sharedRenderDigest(root);
  const current = Object.fromEntries(dirs.map(dir => [dir, digestPage(path.join(root, "pages", dir), root)]));
  if (!manifest.committedAt) return { version: "change-impact.v1", kind: "bootstrap", affectedPages: dirs, evidenceChanges: {}, sharedRenderChanged: true, current };
  if (manifest.sharedRenderDigest !== currentShared) return { version: "change-impact.v1", kind: "shared-render", affectedPages: all, evidenceChanges: {}, sharedRenderChanged: true, current };
  const renderPages = [], evidenceChanges = {};
  dirs.forEach(dir => {
    const before = manifest.pages?.[dir], now = current[dir];
    if (!before || before.renderDigest !== now.renderDigest) renderPages.push(dir);
    const changed = ["selectionDigest", "selectionOutcomeDigest", "qaDigest", "sourceDigest"].filter(field => !before || before[field] !== now[field]);
    if (changed.length) evidenceChanges[dir] = changed;
  });
  return { version: "change-impact.v1", kind: renderPages.length ? "page-render" : "no-render", affectedPages: renderPages, evidenceChanges, sharedRenderChanged: false, current };
}
function compact(value) { return { kind: value.kind, affectedPages: value.affectedPages, evidencePages: Object.keys(value.evidenceChanges || {}), sharedRenderChanged: value.sharedRenderChanged }; }
function selfTest() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "leander-impact-")), pageDir = path.join(root, "pages", "p01");
  [pageDir, path.join(root, "theme"), path.join(root, "components"), path.join(root, "tools")].forEach(dir => fs.mkdirSync(dir, { recursive: true }));
  fs.writeFileSync(path.join(root, "deck.config.js"), "module.exports={theme:'base'};\n");
  fs.writeFileSync(path.join(root, "theme", "tokens.js"), "module.exports={};\n"); fs.writeFileSync(path.join(root, "components", "c.js"), "module.exports={};\n"); fs.writeFileSync(path.join(root, "tools", "qa-rules.zh.json"), "{}\n");
  fs.writeFileSync(path.join(pageDir, "page.js"), "module.exports={id:'p01'};\n");
  const page = { id: "p01", renderInputs: { title: "A" }, visualSelection: { selectedRoute: { route: "page-specific-custom", name: "x" }, candidateRoutes: [] }, qaProfile: {} };
  fs.writeFileSync(path.join(pageDir, "page.json"), JSON.stringify(page));
  assert.equal(inspect({ root }).kind, "bootstrap"); commitManifest({ root });
  page.qaProfile.x = 1; fs.writeFileSync(path.join(pageDir, "page.json"), JSON.stringify(page));
  let impact = inspect({ root }); assert.equal(impact.kind, "no-render"); assert(impact.evidenceChanges.p01.includes("qaDigest"));
  commitManifest({ root }); page.visualSelection.candidateRoutes.push({ route: "image2", score: 1 }); fs.writeFileSync(path.join(pageDir, "page.json"), JSON.stringify(page));
  impact = inspect({ root }); assert.equal(impact.kind, "no-render"); assert(impact.evidenceChanges.p01.includes("selectionDigest"));
  commitManifest({ root }); page.visualSelection.selectedRoute.name = "y"; fs.writeFileSync(path.join(pageDir, "page.json"), JSON.stringify(page));
  impact = inspect({ root }); assert.equal(impact.kind, "page-render"); assert(impact.evidenceChanges.p01.includes("selectionOutcomeDigest"));
  fs.writeFileSync(path.join(pageDir, "page.js"), "module.exports={id:'p01',v:2};\n"); assert.equal(inspect({ root }).kind, "page-render");
  commitManifest({ root }); fs.writeFileSync(path.join(root, "components", "c.js"), "module.exports={v:2};\n"); assert.equal(inspect({ root }).kind, "shared-render");
  fs.rmSync(root, { recursive: true, force: true }); console.log("PASS change impact self-test");
}
if (require.main === module) {
  const command = process.argv[2] || "inspect", i = process.argv.indexOf("--pages"), pages = i >= 0 && process.argv[i + 1] ? process.argv[i + 1].split(",") : [];
  try {
    if (process.argv.includes("--self-test")) selfTest();
    else if (command === "inspect") console.log(JSON.stringify(compact(inspect({ pages }))));
    else throw new Error("usage: change-impact.js inspect [--pages p01,p02]");
  } catch (error) { console.error(error.message); process.exit(1); }
}
module.exports = { inspect, compact, selfTest };
