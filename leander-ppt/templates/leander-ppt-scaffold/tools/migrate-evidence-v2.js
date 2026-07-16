// One-time migration for current, already-PASS legacy evidence.
// This tool never creates a PASS and refuses stale legacy hashes.
const fs = require("fs");
const path = require("path");
const { digestPage, legacyContractDigest, shaFile, shaText } = require("./page-digests");
const ROOT = path.join(__dirname, "..");
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function migratePage(dir) {
  const pageDir = path.join(ROOT, "pages", dir), page = readJson(path.join(pageDir, "page.json"), {}), resultFile = path.join(pageDir, "qa-result.json"), result = readJson(resultFile), id = String(page.id || dir), render = path.join(pageDir, "out", `${id}.png`), errors = [];
  if (!result || result.version !== "qa-result.zh.v2") errors.push("legacy qa-result.zh.v2 missing");
  if (result?.verdict !== "PASS") errors.push("legacy verdict is not PASS");
  if (!fs.existsSync(render) || result?.renderSha256 !== shaFile(render)) errors.push("legacy render hash is stale");
  if (result?.contractSha256 !== legacyContractDigest(pageDir)) errors.push("legacy contract hash is stale");
  if (result?.profileSha256 !== shaText(JSON.stringify(page.qaProfile || {}))) errors.push("legacy profile hash is stale");
  if ((result?.checks || []).some(check => check.status !== "PASS")) errors.push("legacy checks are not all PASS");
  if (errors.length) return { dir, status: "REFUSED", errors };
  const digests = digestPage(pageDir, ROOT);
  result.digests = { renderDigest: digests.renderDigest, selectionOutcomeDigest: digests.selectionOutcomeDigest, qaDigest: digests.qaDigest, sourceDigest: digests.sourceDigest };
  fs.writeFileSync(resultFile, JSON.stringify(result, null, 2) + "\n", "utf8");
  const traceFile = path.join(pageDir, "out", "component-trace.json"), trace = readJson(traceFile);
  if (trace) { trace.digests = { renderDigest: digests.renderDigest, selectionOutcomeDigest: digests.selectionOutcomeDigest }; fs.writeFileSync(traceFile, JSON.stringify(trace, null, 2) + "\n", "utf8"); }
  return { dir, status: "MIGRATED", errors: [] };
}
function main() {
  const base = path.join(ROOT, "pages"), dirs = fs.existsSync(base) ? fs.readdirSync(base).filter(dir => fs.existsSync(path.join(base, dir, "page.json"))).sort() : [];
  const rows = dirs.map(migratePage), failed = rows.filter(row => row.status !== "MIGRATED");
  rows.forEach(row => console.log(`${row.status} ${row.dir}${row.errors.length ? `: ${row.errors.join("; ")}` : ""}`));
  if (failed.length) process.exit(1);
}
if (require.main === module) main();
module.exports = { migratePage };
