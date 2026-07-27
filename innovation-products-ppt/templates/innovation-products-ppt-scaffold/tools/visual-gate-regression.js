const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { auditScene } = require("./render-geometry-audit");

const FIXTURES = path.join(__dirname, "..", "tests", "visual-gate");

function normalized(findings) {
  return findings
    .filter(item => ["P0", "P1"].includes(item.severity))
    .map(item => ({
      ruleId: item.ruleId,
      severity: item.severity,
      objects: [...(item.objects || [])].sort()
    }))
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function run() {
  const files = fs.readdirSync(FIXTURES).filter(file => file.endsWith(".json")).sort();
  const rows = [];
  for (const file of files) {
    const fixture = JSON.parse(fs.readFileSync(path.join(FIXTURES, file), "utf8"));
    const result = auditScene(fixture);
    assert.deepStrictEqual(normalized(result.findings), normalized(fixture.expected || []), file);
    rows.push({ file, findings: result.findings.length });
  }
  console.log(`PASS visual gate regression: ${rows.length} fixtures`);
  return rows;
}

if (require.main === module) {
  try { run(); } catch (error) { console.error(error.stack || error.message); process.exit(1); }
}

module.exports = { run, normalized };
