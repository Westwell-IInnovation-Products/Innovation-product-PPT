#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");
const cp = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const outputRoot = path.join(os.tmpdir(), "iin-ppt-team-sharing-simulations");
const evidenceRoot = path.join(repoRoot, "team-sharing", "output");
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const runRoot = path.join(outputRoot, `simulation-${runId}`);
const remote = path.join(runRoot, "remote.git");
const seed = path.join(runRoot, "seed");
const maintainer = path.join(runRoot, "maintainer");
const consumer = path.join(runRoot, "consumer");
const installDestination = path.join(runRoot, "consumer-installed", "iinnovation-products-ppt");
const logs = [];

function run(command, args, cwd, options = {}) {
  const result = cp.spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    env: { ...process.env, ...(options.env || {}) },
    maxBuffer: 64 * 1024 * 1024
  });
  logs.push({ command: [command, ...args].join(" "), cwd, status: result.status, stdout: result.stdout || "", stderr: result.stderr || "" });
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    const detail = result.error ? `: ${result.error.message}` : "";
    throw new Error(`Command failed (${result.status}): ${command} ${args.join(" ")}${detail}`);
  }
  if (options.echo && result.stdout) process.stdout.write(result.stdout);
  return String(result.stdout || "").trim();
}

function git(cwd, ...args) { return run("git", args, cwd); }
function configureGit(cwd, name) {
  git(cwd, "config", "user.name", name);
  git(cwd, "config", "user.email", `${name}@example.invalid`);
}
function copyTree(source, destination) {
  fs.cpSync(source, destination, {
    recursive: true,
    filter(sourcePath) {
      const relative = path.relative(source, sourcePath).replace(/\\/g, "/");
      const segments = relative.split("/");
      return !segments.includes(".git") && !segments.includes("node_modules") && !segments.includes("output");
    }
  });
}
function clone(name) {
  const destination = path.join(runRoot, name);
  run("git", ["clone", remote, destination], runRoot);
  configureGit(destination, name);
  return destination;
}
function contribute(worktree, contributor, id) {
  const source = path.join(worktree, "team-sharing", "tests", "fixtures", "valid", contributor, id);
  const personal = path.join(runRoot, "personal-candidates", contributor, id);
  fs.mkdirSync(path.dirname(personal), { recursive: true });
  copyTree(source, personal);
  const shell = findPowerShell();
  const output = run(shell, [
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
    path.join(worktree, "team-sharing", "scripts", "publish-candidate.ps1"),
    "-RepositoryRoot", worktree,
    "-CandidatePath", personal,
    "-Contributor", contributor
  ], worktree, { echo: true });
  const line = output.split(/\r?\n/).find(item => item.startsWith("PUBLISHED_BRANCH="));
  if (!line) throw new Error(`Publisher did not report a branch for ${contributor}/${id}.`);
  return line.slice("PUBLISHED_BRANCH=".length);
}
function findPowerShell() {
  for (const command of ["pwsh.exe", "powershell.exe"]) {
    const result = cp.spawnSync(command, ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.ToString()"], { encoding: "utf8", windowsHide: true });
    if (result.status === 0) return command;
  }
  throw new Error("PowerShell runtime not found.");
}

async function main() {
  fs.mkdirSync(runRoot, { recursive: true });
  run("git", ["init", "--bare", remote], runRoot);
  fs.mkdirSync(seed, { recursive: true });
  git(seed, "init");
  configureGit(seed, "seed-maintainer");
  copyTree(path.join(repoRoot, "iinnovation-products-ppt"), path.join(seed, "iinnovation-products-ppt"));
  copyTree(path.join(repoRoot, "team-sharing"), path.join(seed, "team-sharing"));
  git(seed, "add", ".");
  git(seed, "commit", "-m", "Seed IInnovation-Products_ppt sharing simulation");
  git(seed, "branch", "-M", "main");
  git(seed, "remote", "add", "origin", remote);
  git(seed, "push", "-u", "origin", "main");
  git(remote, "symbolic-ref", "HEAD", "refs/heads/main");

  const analystA = clone("analyst-a");
  const analystB = clone("analyst-b");
  const branchA = contribute(analystA, "analyst-a", "multi-actor-contribution-pool");
  const branchB = contribute(analystB, "analyst-b", "evidence-metric-band");

  run("git", ["clone", remote, maintainer], runRoot);
  configureGit(maintainer, "component-curator");
  git(maintainer, "fetch", "origin");
  git(maintainer, "merge", "--no-ff", `origin/${branchA}`, "-m", "Merge analyst-a candidate");
  git(maintainer, "merge", "--no-ff", `origin/${branchB}`, "-m", "Merge analyst-b candidate");
  git(maintainer, "push", "origin", "main");

  const scaffold = path.join(maintainer, "iinnovation-products-ppt", "templates", "iinnovation-products-ppt-scaffold");
  run(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm.cmd ci --no-audit --no-fund"], scaffold, { echo: true });
  const promoter = path.join(maintainer, "team-sharing", "scripts", "promote-candidate.js");
  const skillRoot = path.join(maintainer, "iinnovation-products-ppt");
  const candidateA = path.join(maintainer, "contributions", "iinnovation-products-ppt", "components", "analyst-a", "multi-actor-contribution-pool");
  const candidateB = path.join(maintainer, "contributions", "iinnovation-products-ppt", "components", "analyst-b", "evidence-metric-band");
  run(process.execPath, [promoter, candidateA, "--skill-root", skillRoot, "--curator", "component-curator", "--approve-production", "--skip-gates"], maintainer, { echo: true });
  run(process.execPath, [promoter, candidateB, "--skill-root", skillRoot, "--curator", "component-curator", "--approve-production", "--skip-gates"], maintainer, { echo: true });

  run(process.execPath, [path.join(scaffold, "tools", "enrich-component-registry.js")], scaffold, { echo: true });
  run(process.execPath, [path.join(scaffold, "tools", "build-component-index.js")], scaffold, { echo: true });
  run(process.execPath, [path.join(scaffold, "tools", "lint-component-library.js"), "--strict"], scaffold, { echo: true });

  const basePreview = path.join(runRoot, "preview-base");
  const globalPreview = path.join(runRoot, "preview-global");
  run(process.execPath, [path.join(scaffold, "tools", "render-component-library-preview.js"), "--theme", "leander-base", "--out-dir", basePreview], scaffold, { echo: true });
  run(process.execPath, [path.join(scaffold, "tools", "render-component-library-preview.js"), "--theme", "leander-global", "--out-dir", globalPreview], scaffold, { echo: true });
  run(process.execPath, [
    path.join(scaffold, "tools", "verify-component-themes.js"),
    path.join(basePreview, "preview-manifest.json"),
    path.join(globalPreview, "preview-manifest.json"),
    "--write"
  ], scaffold, { echo: true });
  run(process.execPath, [path.join(scaffold, "tools", "build-component-index.js")], scaffold);
  run(process.execPath, [path.join(scaffold, "tools", "lint-component-library.js"), "--strict"], scaffold);

  git(maintainer, "add", "iinnovation-products-ppt", "contributions");
  git(maintainer, "commit", "-m", "Promote two reviewed IInnovation-Products_ppt components");
  const tag = "iinnovation-products-ppt-sim-v0.1.0";
  git(maintainer, "tag", "-a", tag, "-m", "Simulated IInnovation-Products_ppt component release");
  git(maintainer, "push", "origin", "main", tag);

  run("git", ["clone", "--branch", tag, remote, consumer], runRoot);
  const shell = findPowerShell();
  run(shell, [
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
    path.join(consumer, "team-sharing", "scripts", "install-iinnovation-products-ppt.ps1"),
    "-RepositoryRoot", consumer,
    "-Destination", installDestination,
    "-AllowCustomDestination"
  ], consumer, { echo: true });

  const installedIndex = JSON.parse(fs.readFileSync(path.join(installDestination, "templates", "iinnovation-products-ppt-scaffold", "tools", "component-index.min.json"), "utf8"));
  const expectedNames = ["multiActorContributionPool", "evidenceMetricBand"];
  const installed = expectedNames.map(name => installedIndex.components.find(component => component.name === name));
  if (installed.some(component => !component || !component.selectable)) {
    throw new Error("Consumer install did not contain both promoted selectable components.");
  }

  const report = {
    schemaVersion: "leander-team-sharing-simulation.v1",
    runId,
    status: "PASS",
    remote,
    contributorBranches: [branchA, branchB],
    mergedWithoutConflict: true,
    promotedComponents: installed.map(component => ({ name: component.name, selectable: component.selectable, library: component.library })),
    releaseTag: tag,
    consumerInstall: installDestination,
    previews: {
      base: path.join(basePreview, "preview-manifest.json"),
      global: path.join(globalPreview, "preview-manifest.json")
    },
    commandCount: logs.length
  };
  fs.writeFileSync(path.join(runRoot, "simulation-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(runRoot, "simulation-command-log.json"), `${JSON.stringify(logs, null, 2)}\n`, "utf8");
  fs.mkdirSync(evidenceRoot, { recursive: true });
  fs.copyFileSync(path.join(runRoot, "simulation-report.json"), path.join(evidenceRoot, `simulation-report-${runId}.json`));
  console.log(JSON.stringify(report, null, 2));
}

main().catch(error => {
  fs.mkdirSync(runRoot, { recursive: true });
  fs.writeFileSync(path.join(runRoot, "simulation-failure.json"), `${JSON.stringify({ runId, status: "FAIL", message: error.message, logs }, null, 2)}\n`, "utf8");
  console.error(error.stack || error.message);
  process.exit(1);
});
