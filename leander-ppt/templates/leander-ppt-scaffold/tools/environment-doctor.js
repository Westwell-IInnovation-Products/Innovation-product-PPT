// Preflight the local runtime before Gate 0 or any render work.
// Usage: node tools/environment-doctor.js [--json]
const fs = require("fs");
const path = require("path");
const os = require("os");
const { resolveToolchain } = require("./toolchain");

const ROOT = path.join(__dirname, "..");

function item(name, status, detail, action = "") {
  return { name, status, detail, action };
}

function canRead(dir) {
  try { fs.accessSync(dir, fs.constants.R_OK); return true; }
  catch { return false; }
}

function installedFont(candidates) {
  if (process.platform !== "win32") return "";
  const root = process.env.WINDIR ? path.join(process.env.WINDIR, "Fonts") : "";
  if (!root || !fs.existsSync(root)) return "";
  const names = new Map(fs.readdirSync(root).map(name => [name.toLowerCase(), name]));
  const hit = candidates.find(name => names.has(name.toLowerCase()));
  return hit ? path.join(root, names.get(hit.toLowerCase())) : "";
}

function inspect() {
  const checks = [];
  const major = Number(process.versions.node.split(".")[0]);
  checks.push(major >= 18
    ? item("Node.js", "PASS", process.version)
    : item("Node.js", "FAIL", process.version, "Install Node.js 18 or newer."));

  try {
    const resolved = require.resolve("pptxgenjs", { paths: [ROOT] });
    checks.push(item("pptxgenjs", "PASS", resolved));
  } catch {
    checks.push(item("pptxgenjs", "FAIL", "dependency is not installed", "Run `npm ci` in the scaffold root."));
  }
  try {
    const resolved = require.resolve("pngjs", { paths: [ROOT] });
    checks.push(item("pngjs", "PASS", resolved));
  } catch {
    checks.push(item("pngjs", "FAIL", "render-audit dependency is not installed", "Run `npm ci` in the scaffold root."));
  }

  const tools = resolveToolchain();
  checks.push(tools.soffice
    ? item("LibreOffice", "PASS", tools.soffice)
    : item("LibreOffice", "FAIL", "soffice not found", "Install LibreOffice or set SOFFICE_PATH."));
  checks.push(tools.pdftoppm
    ? item("Poppler", "PASS", tools.pdftoppm)
    : item("Poppler", "FAIL", "pdftoppm not found", "Install Poppler or set PDFTOPPM_PATH."));

  if (process.platform === "win32") {
    const zh = installedFont(["msyh.ttc", "msyh.ttf", "msyhbd.ttc", "msyhl.ttc"]);
    const en = installedFont(["gothic.ttf", "gothicb.ttf", "gothicbi.ttf", "gothici.ttf"]);
    checks.push(zh
      ? item("Microsoft YaHei", "PASS", zh)
      : item("Microsoft YaHei", "WARN", "preferred Chinese font not detected", "Use an approved Chinese fallback and visually recheck text flow."));
    checks.push(en
      ? item("Century Gothic", "PASS", en)
      : item("Century Gothic", "WARN", "preferred Latin font not detected", "Use an approved Latin fallback and visually recheck metrics."));
  } else {
    checks.push(item("Preferred fonts", "WARN", "automatic font detection is Windows-only", "Confirm the approved fonts before rendering."));
  }

  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
  const rolloutCandidates = [path.join(codexHome, "sessions"), path.join(codexHome, "rollouts")];
  const rolloutRoot = rolloutCandidates.find(canRead) || "";
  checks.push(rolloutRoot
    ? item("Codex rollout logs", "PASS", rolloutRoot)
    : item("Codex rollout logs", "WARN", "no readable rollout directory found", "Token Ledger will label usage as estimated; do not report it as exact."));

  const failed = checks.filter(check => check.status === "FAIL");
  const warnings = checks.filter(check => check.status === "WARN");
  return {
    version: "leander-environment-doctor.v1",
    root: ROOT,
    platform: `${process.platform}/${process.arch}`,
    ok: failed.length === 0,
    summary: { pass: checks.length - failed.length - warnings.length, warn: warnings.length, fail: failed.length },
    checks
  };
}

function print(report) {
  report.checks.forEach(check => {
    console.log(`${check.status.padEnd(4)} ${check.name}: ${check.detail}`);
    if (check.action) console.log(`     action: ${check.action}`);
  });
  console.log(`Environment ${report.ok ? "READY" : "BLOCKED"}: ${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail`);
}

if (require.main === module) {
  const report = inspect();
  if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else print(report);
  if (!report.ok) process.exit(1);
}

module.exports = { inspect };
