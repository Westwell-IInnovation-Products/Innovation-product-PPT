// Create a release-clean Leander scaffold, install locked dependencies, verify the runtime, and initialize Gate 0.
// Usage: node scripts/init-scaffold.js <project-root> <create|redesign|review> [--skip-install]
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const SKILL = path.join(__dirname, "..");
const TEMPLATE = path.join(SKILL, "templates", "leander-ppt-scaffold");
const targetArg = process.argv[2];
const intent = process.argv[3] || "create";
const skipInstall = process.argv.includes("--skip-install");
const allowedIntents = new Set(["create", "redesign", "review"]);

function fail(message) { console.error(`INIT BLOCKED: ${message}`); process.exit(1); }
function tail(text, lines = 24) { return String(text || "").split(/\r?\n/).slice(-lines).join("\n"); }
function run(command, args, cwd) {
  return cp.spawnSync(command, args, { cwd, encoding: "utf8", windowsHide: true });
}
function onPath(name) {
  try {
    const locator = process.platform === "win32" ? "where.exe" : "which";
    return cp.execFileSync(locator, [name], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split(/\r?\n/).find(Boolean) || "";
  } catch { return ""; }
}
function npmRuntime() {
  if (process.env.NPM_CLI_JS && fs.existsSync(process.env.NPM_CLI_JS)) {
    return { command: process.execPath, prefix: [process.env.NPM_CLI_JS] };
  }
  if (process.platform === "win32") {
    const npmCmd = onPath("npm.cmd");
    const npmCli = npmCmd ? path.join(path.dirname(npmCmd), "node_modules", "npm", "bin", "npm-cli.js") : "";
    if (npmCli && fs.existsSync(npmCli)) return { command: process.execPath, prefix: [npmCli] };
    return null;
  }
  const npm = onPath("npm");
  return npm ? { command: npm, prefix: [] } : null;
}

if (!targetArg) fail("usage: node scripts/init-scaffold.js <project-root> <create|redesign|review> [--skip-install]");
if (!allowedIntents.has(intent)) fail(`intent must be create, redesign, or review; got ${intent}`);

const target = path.resolve(targetArg);
const templateResolved = path.resolve(TEMPLATE);
if (target === templateResolved || target.startsWith(templateResolved + path.sep)) fail("target must not be inside the shared template.");
if (fs.existsSync(target) && fs.readdirSync(target).length) fail(`target is not empty: ${target}`);

fs.mkdirSync(target, { recursive: true });
fs.cpSync(TEMPLATE, target, {
  recursive: true,
  force: false,
  errorOnExist: true,
  filter: source => path.basename(source) !== "node_modules"
});
console.log(`PASS scaffold copied: ${target}`);

const stateDir = path.join(target, "state");
fs.mkdirSync(stateDir, { recursive: true });
if (!skipInstall) {
  const npm = npmRuntime();
  if (!npm) fail("npm runtime was not found. Install npm or set NPM_CLI_JS to npm-cli.js.");
  const install = run(npm.command, [...npm.prefix, "ci", "--no-audit", "--no-fund"], target);
  const installLog = `${install.stdout || ""}${install.stderr || ""}${install.error ? `\n${install.error.stack || install.error.message}` : ""}`;
  fs.writeFileSync(path.join(stateDir, "bootstrap.log"), installLog, "utf8");
  if (install.status !== 0) fail(`npm ci failed. See ${path.join(stateDir, "bootstrap.log")}\n${tail(installLog)}`);
  console.log("PASS locked dependencies installed");
} else {
  console.log("WARN dependency installation skipped; environment doctor will still require pptxgenjs.");
}

const doctor = run(process.execPath, [path.join(target, "tools", "environment-doctor.js")], target);
if (doctor.stdout) process.stdout.write(doctor.stdout);
if (doctor.status !== 0) fail(`environment doctor failed\n${tail(doctor.stderr || doctor.stdout)}`);

const gate = run(process.execPath, [path.join(target, "tools", "workflow-gate.js"), "init", intent], target);
if (gate.stdout) process.stdout.write(gate.stdout);
if (gate.status !== 0) fail(`Gate 0 initialization failed\n${tail(gate.stderr || gate.stdout)}`);

console.log(`READY Leander ${intent} scaffold: ${target}`);
