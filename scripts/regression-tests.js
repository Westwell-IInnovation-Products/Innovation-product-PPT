// Shared Skill regression entrypoint. Uses an isolated install when the release template has no node_modules.
const fs = require("fs");
const path = require("path");
const os = require("os");
const cp = require("child_process");
const ROOT = path.join(__dirname, "..");
const template = path.join(ROOT, "templates", "innovation-products-ppt-scaffold");
let scaffold = template, temporary = "";
try {
  require.resolve("pngjs", { paths: [template] });
} catch {
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), "iin-ppt-regression-"));
  scaffold = path.join(temporary, "scaffold");
  fs.cpSync(template, scaffold, { recursive: true, filter: source => path.basename(source) !== "node_modules" });
  const npmArgs = ["ci", "--ignore-scripts", "--no-audit", "--no-fund"];
  const install = process.platform === "win32"
    ? cp.spawnSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm", ...npmArgs], { cwd: scaffold, stdio: "inherit" })
    : cp.spawnSync("npm", npmArgs, { cwd: scaffold, stdio: "inherit" });
  if (install.status !== 0) {
    if (install.error) console.error(`Unable to run npm ci: ${install.error.message}`);
    else console.error(`npm ci failed with status ${install.status} and signal ${install.signal || "none"}`);
    if (path.dirname(temporary) === path.resolve(os.tmpdir())) fs.rmSync(temporary, { recursive: true, force: true });
    process.exit(install.status || 1);
  }
}
try {
  const result = cp.spawnSync(process.execPath, [path.join(scaffold, "tools", "regression-tests.js")], { cwd: scaffold, stdio: "inherit" });
  if (result.error) console.error(`Unable to run regression suite: ${result.error.message}`);
  process.exitCode = result.status || 0;
} finally {
  if (temporary && path.dirname(temporary) === path.resolve(os.tmpdir())) fs.rmSync(temporary, { recursive: true, force: true });
}
