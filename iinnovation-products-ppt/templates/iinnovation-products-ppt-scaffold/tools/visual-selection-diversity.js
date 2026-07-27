// Pre-render deck-level guard against repeated selected components and repeated geometry signatures.
const assert = require("assert");

function text(value) { return String(value || "").trim(); }
function norm(value) { return text(value).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, ""); }
function rationale(page, contract) {
  return text(page.componentReuseRationale || page.visualSelection?.componentReuseRationale || page.reuseRationale || contract?.echoRationale || contract?.rhythmRationale);
}
function isContent(page) {
  return !/(?:cover|closing|transition|divider|section-divider|brand-cover|brand-closing)/i.test(`${page.relationship || ""} ${page.expressionMode || ""}`);
}
function group(items, keyOf) {
  const groups = new Map();
  items.forEach(item => {
    const key = keyOf(item);
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return groups;
}
function inspectSelectionDiversity(pages, contracts = []) {
  const byPage = new Map(contracts.map(contract => [String(contract.page || contract.id), contract]));
  const rows = pages.filter(isContent).map(page => ({ page, contract: byPage.get(String(page.id || page.page)) || {} }));
  const errors = [], warnings = [];
  for (const [name, uses] of group(rows.filter(row => row.page.visualSelection?.selectedRoute?.route === "component-library"), row => norm(row.page.visualSelection.selectedRoute.name))) {
    if (uses.length <= 2) continue;
    const pagesUsed = uses.map(row => String(row.page.id || row.page.page));
    const justified = uses.slice(1).every(row => rationale(row.page, row.contract).length >= 8);
    const finding = { type: uses.length > 3 && !justified ? "component-overuse" : "component-repeat", component: name, pages: pagesUsed, message: `组件 ${uses[0].page.visualSelection.selectedRoute.name} 被选择 ${uses.length} 次：${pagesUsed.join(" / ")}` };
    (uses.length > 3 && !justified ? errors : warnings).push(finding);
  }
  for (const [signature, uses] of group(rows, row => {
    const pattern = norm(row.contract.previewPattern || row.contract.skeletonFamily);
    const shape = norm(row.contract.primaryShapeClass);
    return pattern && shape ? `${pattern}::${shape}` : "";
  })) {
    if (uses.length <= 2) continue;
    const pagesUsed = uses.map(row => String(row.page.id || row.page.page));
    const justified = uses.slice(1).every(row => rationale(row.page, row.contract).length >= 8);
    const finding = { type: uses.length > 3 && !justified ? "geometry-signature-overuse" : "geometry-signature-repeat", signature, pages: pagesUsed, message: `布局形态 + 主形状组合重复 ${uses.length} 次：${pagesUsed.join(" / ")}` };
    (uses.length > 3 && !justified ? errors : warnings).push(finding);
  }
  return { errors, warnings };
}

function selfTest() {
  const pages = [1, 2, 3, 4].map(id => ({ id: `p${id}`, relationship: "sequence", expressionMode: "mechanism", visualSelection: { selectedRoute: { route: "component-library", name: "flowA" } } }));
  const contracts = pages.map(page => ({ page: page.id, previewPattern: "rail", primaryShapeClass: "timeline" }));
  const blocked = inspectSelectionDiversity(pages, contracts);
  assert(blocked.errors.some(item => item.type === "component-overuse"));
  assert(blocked.errors.some(item => item.type === "geometry-signature-overuse"));
  pages.slice(1).forEach(page => { page.componentReuseRationale = "Intentional chapter series with progressive evidence."; });
  contracts.slice(1).forEach(contract => { contract.echoRationale = "Intentional chapter series with progressive evidence."; });
  const allowed = inspectSelectionDiversity(pages, contracts);
  assert.equal(allowed.errors.length, 0);
  assert(allowed.warnings.length >= 2);
  console.log("PASS visual selection diversity self-test");
}

if (require.main === module && process.argv.includes("--self-test")) selfTest();
module.exports = { inspectSelectionDiversity };
