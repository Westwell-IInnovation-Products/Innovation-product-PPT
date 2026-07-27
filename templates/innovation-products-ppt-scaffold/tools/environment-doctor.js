// Preflight the local runtime before Gate 0 or any render work.
// Usage: node tools/environment-doctor.js [--json]
const fs = require("fs");
const path = require("path");
const os = require("os");
const cp = require("child_process");
const crypto = require("crypto");
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
function shaFile(file) {
  return file && fs.existsSync(file) && fs.statSync(file).isFile()
    ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")
    : "";
}
function toolVersion(file, args = ["--version"], timeoutMs = 5000) {
  if (!file) return { version: "", error: "executable path is missing" };
  const result = cp.spawnSync(file, args, { encoding: "utf8", timeout: timeoutMs, windowsHide: true });
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim().split(/\r?\n/)[0] || "";
  if (result.error) {
    const timedOut = result.error.code === "ETIMEDOUT";
    return {
      version: "",
      error: timedOut ? `version probe timed out after ${timeoutMs} ms` : `version probe failed: ${result.error.message}`
    };
  }
  if (result.status !== 0) {
    return { version: "", error: `version probe exited ${result.status}${output ? `: ${output}` : ""}` };
  }
  return { version: output, error: output ? "" : "version probe returned no output" };
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
  const libreOfficeProbePath = process.platform === "win32" && tools.soffice
    ? (() => {
        const consoleExe = path.join(path.dirname(tools.soffice), "soffice.com");
        return fs.existsSync(consoleExe) ? consoleExe : tools.soffice;
      })()
    : tools.soffice;
  const libreOfficeVersion = tools.soffice ? toolVersion(libreOfficeProbePath) : { version: "", error: "soffice not found" };
  const popplerVersion = tools.pdftoppm ? toolVersion(tools.pdftoppm, ["-v"]) : { version: "", error: "pdftoppm not found" };
  checks.push(tools.soffice && !libreOfficeVersion.error
    ? item("LibreOffice", "PASS", `${tools.soffice} (${libreOfficeVersion.version})`)
    : item("LibreOffice", "FAIL", libreOfficeVersion.error, "Install/fix LibreOffice or set SOFFICE_PATH to a responsive executable."));
  checks.push(tools.pdftoppm && !popplerVersion.error
    ? item("Poppler", "PASS", `${tools.pdftoppm} (${popplerVersion.version})`)
    : item("Poppler", "FAIL", popplerVersion.error, "Install/fix Poppler or set PDFTOPPM_PATH to a responsive executable."));

  let zh = "", en = "";
  if (process.platform === "win32") {
    zh = installedFont(["msyh.ttc", "msyh.ttf", "msyhbd.ttc", "msyhl.ttc"]);
    en = installedFont(["gothic.ttf", "gothicb.ttf", "gothicbi.ttf", "gothici.ttf"]);
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
  const fingerprint = {
    version: "leander-toolchain-fingerprint.v1",
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    packageLockSha256: shaFile(path.join(ROOT, "package-lock.json")),
    libreOffice: { path: tools.soffice || "", versionProbePath: libreOfficeProbePath || "", version: libreOfficeVersion.version, probeError: libreOfficeVersion.error, sha256: shaFile(tools.soffice) },
    poppler: { path: tools.pdftoppm || "", version: popplerVersion.version, probeError: popplerVersion.error, sha256: shaFile(tools.pdftoppm) },
    fonts: {
      microsoftYaHei: { path: zh, sha256: shaFile(zh) },
      centuryGothic: { path: en, sha256: shaFile(en) }
    }
  };
  return {
    version: "leander-environment-doctor.v1",
    root: ROOT,
    platform: `${process.platform}/${process.arch}`,
    ok: failed.length === 0,
    summary: { pass: checks.length - failed.length - warnings.length, warn: warnings.length, fail: failed.length },
    checks,
    fingerprint
  };
}

function print(report) {
  report.checks.forEach(check => {
    console.log(`${check.status.padEnd(4)} ${check.name}: ${check.detail}`);
    if (check.action) console.log(`     action: ${check.action}`);
  });
  console.log(`Environment ${report.ok ? "READY" : "BLOCKED"}: ${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail`);
}

function selfTest() {
  const responsive = toolVersion(process.execPath, ["-e", "console.log('v-test')"], 2000);
  if (responsive.version !== "v-test" || responsive.error) {
    throw new Error(`responsive version probe failed: ${JSON.stringify(responsive)}`);
  }
  const stalled = toolVersion(process.execPath, ["-e", "setInterval(() => {}, 1000)"], 100);
  if (!/timed out/i.test(stalled.error || "")) {
    throw new Error(`stalled version probe did not fail closed: ${JSON.stringify(stalled)}`);
  }
  console.log("PASS environment doctor bounded probe self-test");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) {
    selfTest();
  } else {
    const report = inspect();
    const fingerprintFile = path.join(ROOT, "state", "toolchain-fingerprint.json");
    fs.mkdirSync(path.dirname(fingerprintFile), { recursive: true });
    fs.writeFileSync(fingerprintFile, JSON.stringify(report.fingerprint, null, 2) + "\n", "utf8");
    if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
    else print(report);
    if (!report.ok) process.exit(1);
  }
}

module.exports = { inspect, toolVersion };
