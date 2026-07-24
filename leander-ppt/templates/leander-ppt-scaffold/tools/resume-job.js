// One-command continuation in a fresh root task.
const path = require("path");
const cp = require("child_process");
const ROOT = path.join(__dirname, "..");
function commands(skipAttach = false) {
  return [
    ...(skipAttach ? [] : [["token-ledger.js", "attach-thread"]]),
    ["phase-handoff.js", "verify"],
    ["context-pack.js", "--mode", "status", "--write"],
    ["task-portfolio.js", "status", "--json"]
  ];
}
function run() {
  for (const [script, ...args] of commands(process.argv.includes("--skip-attach"))) {
    const result = cp.spawnSync(process.execPath, [path.join(__dirname, script), ...args], { cwd: ROOT, encoding: "utf8" });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.status !== 0) throw new Error((result.stderr || `${script} failed`).trim());
  }
  console.log("RESUME READY: read only state/phase-handoff.json plus the strict context pack, then execute the active portfolio job.");
}
function selfTest() {
  const list = commands(false).map(item => item[0]);
  if (list.join(",") !== "token-ledger.js,phase-handoff.js,context-pack.js,task-portfolio.js") throw new Error("resume command order changed");
  console.log("PASS resume job self-test");
}
try { if (require.main === module) process.argv.includes("--self-test") ? selfTest() : run(); } catch (error) { console.error(error.message); process.exit(1); }
module.exports = { commands, run, selfTest };
