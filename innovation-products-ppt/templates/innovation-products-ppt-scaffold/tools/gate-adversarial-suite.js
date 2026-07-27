// Cross-gate adversarial regression suite.
const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");
const ROOT = path.join(__dirname, "..");

function testRevision() {
  require("./revision-mode").selfTest();
}
function testApproval() {
  require("./approval-receipt").selfTest();
  const workflow = fs.readFileSync(path.join(__dirname, "workflow-gate.js"), "utf8");
  assert(/Approval receipt required/.test(workflow), "note-only approval is not blocked");
  assert(/Direct migration to final is forbidden/.test(workflow), "direct final migration is not blocked");
}
function testSource() {
  require("./verify-source-evidence").selfTest();
}
function testDependencies() {
  const { digestPage } = require("./page-digests");
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "leander-dependency-"));
  try {
    const pageDir = path.join(temp, "pages", "p01");
    [pageDir, path.join(temp, "theme"), path.join(temp, "components"), path.join(temp, "tools"), path.join(temp, "state")].forEach(dir => fs.mkdirSync(dir, { recursive: true }));
    fs.writeFileSync(path.join(temp, "deck.config.js"), "module.exports={theme:'base',renderContextVersion:1};\n");
    fs.writeFileSync(path.join(temp, "package-lock.json"), '{"version":1}\n');
    fs.writeFileSync(path.join(temp, "tools", "qa-rules.zh.json"), "{}\n");
    fs.writeFileSync(path.join(temp, "theme", "tokens.js"), "module.exports={};\n");
    fs.writeFileSync(path.join(temp, "components", "c.js"), "module.exports={};\n");
    fs.writeFileSync(path.join(pageDir, "page.js"), "module.exports={id:'p01'};\n");
    const page = {
      id: "p01",
      title: "Title one",
      visualSelection: { selectedRoute: { route: "page-specific-custom", name: "custom" } },
      qaProfile: { version: "qa-profile.zh.v2" }
    };
    fs.writeFileSync(path.join(pageDir, "page.json"), JSON.stringify(page));
    const before = digestPage(pageDir, temp);
    page.title = "Title two";
    fs.writeFileSync(path.join(pageDir, "page.json"), JSON.stringify(page));
    const contentChanged = digestPage(pageDir, temp);
    assert.notEqual(before.renderDigest, contentChanged.renderDigest, "visible page.json change did not invalidate render");
    fs.writeFileSync(path.join(temp, "package-lock.json"), '{"version":2}\n');
    const runtimeChanged = digestPage(pageDir, temp);
    assert.notEqual(contentChanged.renderDigest, runtimeChanged.renderDigest, "package lock change did not invalidate render");
    console.log("PASS dependency closure adversarial test");
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
function testCollaboration() {
  require("./agent-run-receipt").selfTest();
  const source = fs.readFileSync(path.join(__dirname, "verify-agent-collaboration.js"), "utf8");
  assert(/agent run receipt missing/.test(source), "collaboration gate does not require host receipt");
}
function testFinalGate() {
  const source = fs.readFileSync(path.join(__dirname, "final-gate.js"), "utf8");
  for (const required of ["verify-source-evidence.js", "verify-terminology.js", "verify-state-memory.js", "render-geometry-audit.js", "user-feedback-gate.js", "verify-agent-collaboration.js", "render-quality-gate.js", "verify-pages-only"]) {
    assert(source.includes(required), `final gate missing ${required}`);
  }
  assert(source.includes("context-budget-gate.js"), "final gate does not recheck the context lock");
  console.log("PASS final gate wiring adversarial test");
}
function testFinalArtifact() {
  require("./final-artifact-gate").selfTest();
  const deck = fs.readFileSync(path.join(__dirname, "deck.js"), "utf8");
  assert(deck.includes('"final-artifact-gate.js"'), "formal build does not call final artifact gate");
  assert(deck.includes('".staging"'), "formal build does not use staging");
}
function testDraft() {
  const { draftOutputPath } = require("./deck");
  const result = draftOutputPath("output/final.pptx").replace(/\\/g, "/");
  assert.equal(result, "output/final.draft.pptx");
  const source = fs.readFileSync(path.join(__dirname, "deck.js"), "utf8");
  assert(source.includes("DRAFT · NOT QA APPROVED"), "draft watermark missing");
  assert(source.includes("canonical untouched"), "draft/canonical isolation missing");
  console.log("PASS draft isolation adversarial test");
}
function testRenderReview() {
  require("./render-quality-gate").selfTest();
}
function testVisualGeometry() {
  require("./visual-gate-regression").run();
  require("./user-feedback-gate").selfTest();
}

const suites = {
  revision: testRevision,
  approval: testApproval,
  source: testSource,
  dependencies: testDependencies,
  collaboration: testCollaboration,
  "final-gate": testFinalGate,
  "final-artifact": testFinalArtifact,
  draft: testDraft,
  "render-review": testRenderReview,
  "visual-geometry": testVisualGeometry
};
function main() {
  const selected = process.argv[2] && process.argv[2] !== "--self-test" ? process.argv[2] : "";
  if (selected) {
    if (!suites[selected]) throw new Error(`unknown adversarial suite: ${selected}`);
    suites[selected]();
  } else Object.values(suites).forEach(run => run());
  console.log(`PASS gate adversarial suite: ${selected || Object.keys(suites).length + " groups"}`);
}
if (require.main === module) {
  try { main(); } catch (error) { console.error(error.stack || error.message); process.exit(1); }
}
module.exports = { main, suites };
