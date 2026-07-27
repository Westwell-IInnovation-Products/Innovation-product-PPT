// Migrate a page contract to the compact V2 ownership model.
// Usage: node tools/compact-page-contract.js pages/<id>/page.json [--write]
const fs = require("fs");
const path = require("path");
const { buildProfile } = require("./build-qa-profile");

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); }
function compact(file) {
  const source = fs.readFileSync(file, "utf8");
  const page = JSON.parse(source.toString("utf8").replace(/^\uFEFF/, ""));
  const vs = page.visualSelection || {};
  const blueprint = page.blueprintContract || vs.blueprintContract;
  const existingBlueprintRef = page.blueprintRef || vs.blueprintRef;
  if (existingBlueprintRef) {
    page.blueprintRef = existingBlueprintRef;
    vs.blueprintRef = existingBlueprintRef;
  }
  if (blueprint) {
    const pageId = page.id || page.page || blueprint.page || blueprint.id;
    page.blueprintRef = `layout-blueprint.json#${pageId}`;
    vs.blueprintRef = page.blueprintRef;
    delete page.blueprintContract;
    delete vs.blueprintContract;
  }
  if (Array.isArray(vs.candidateRoutes)) {
    const selected = vs.selectedRoute || {};
    const components = vs.candidateRoutes.filter(candidate => candidate.route === "component-library").sort((a, b) => Number(b.score || 0) - Number(a.score || 0)).slice(0, 3);
    const bestByRoute = new Map();
    vs.candidateRoutes.filter(candidate => candidate.route !== "component-library").forEach(candidate => {
      const previous = bestByRoute.get(candidate.route);
      if (!previous || Number(candidate.score || 0) > Number(previous.score || 0)) bestByRoute.set(candidate.route, candidate);
    });
    vs.candidateRoutes = [...components, ...bestByRoute.values()].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
    if (selected.route && !vs.candidateRoutes.some(candidate => candidate.route === selected.route && candidate.name === selected.name)) {
      vs.candidateRoutes.push(selected);
    }
  }
  if (Array.isArray(vs.reviewFocus) && vs.reviewFocus.length > 5) vs.reviewFocus = vs.reviewFocus.slice(0, 5);
  if (vs.blueprintRef || page.blueprintRef) {
    delete vs.intent;
    delete vs.relationship;
    delete vs.relationshipSubtype;
    delete vs.visualSignature;
    delete vs.expressionMode;
    delete vs.reviewFocus;
  }
  page.visualSelection = vs;
  page.qaProfile = buildProfile(page);
  page.schemaVersion = "leander-page.v2";
  const output = JSON.stringify(page, null, 2) + "\n";
  return { page, output, beforeBytes: source.length, afterBytes: Buffer.byteLength(output) };
}

function main() {
  const input = process.argv[2];
  if (!input) { console.error("usage: node tools/compact-page-contract.js pages/<id>/page.json [--write]"); process.exit(1); }
  const file = path.resolve(process.cwd(), input);
  const result = compact(file);
  if (process.argv.includes("--write")) fs.writeFileSync(file, result.output, "utf8");
  else process.stdout.write(result.output);
  const saved = result.beforeBytes - result.afterBytes;
  console.error(`contract bytes ${result.beforeBytes} -> ${result.afterBytes}; saved=${saved} (${Math.round(saved / result.beforeBytes * 100)}%)`);
}

if (require.main === module) main();
module.exports = { compact };
