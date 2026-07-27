#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
function value(name, fallback = "") { const index = process.argv.indexOf(`--${name}`); return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback; }
function run(command, args, cwd, options = {}) {
  const result = cp.spawnSync(command, args, { cwd, encoding: "utf8", windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (options.echo && result.stdout) process.stdout.write(result.stdout);
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed\n${result.stderr || result.stdout || ""}`);
  return String(result.stdout || "").trim();
}
function git(repo, ...args) { return run("git", ["-C", repo, ...args], repo); }
function inside(root, target) { return path.resolve(target).startsWith(path.resolve(root).replace(/[\\/]+$/, "") + path.sep); }
function npmCi(scaffold) {
  if (process.platform === "win32") run(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm.cmd ci --no-audit --no-fund"], scaffold, { echo: true });
  else run("npm", ["ci", "--no-audit", "--no-fund"], scaffold, { echo: true });
}
try {
  const repo = path.resolve(value("repo"));
  const candidateArg = value("candidate");
  const curator = value("curator");
  const releaseType = value("release-type", "prerelease");
  const preid = value("preid", "beta");
  if (!repo || !candidateArg || !curator) throw new Error("Usage: prepare-promotion.js --repo <root> --candidate <repo-candidate-dir> --curator <login> [--release-type prerelease|patch|minor|major] [--preid beta] [--create-draft-pr]");
  const candidate = path.resolve(candidateArg);
  if (!inside(path.join(repo, "contributions", "iinnovation-products-ppt", "components"), candidate)) throw new Error("Promotion candidate must be inside the governed contributions area.");
  if (git(repo, "status", "--porcelain")) throw new Error("Repository worktree must be clean before preparing a promotion.");
  const metadata = JSON.parse(fs.readFileSync(path.join(candidate, "candidate.json"), "utf8").replace(/^\uFEFF/, ""));
  git(repo, "fetch", "origin", "main");
  git(repo, "switch", "main");
  git(repo, "pull", "--ff-only", "origin", "main");
  if (!fs.existsSync(candidate)) throw new Error("Candidate is not present on current main; merge the candidate intake PR first.");
  const branch = `promote/${curator}/${metadata.id}-${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`;
  git(repo, "switch", "-c", branch);
  const scaffold = path.join(repo, "iinnovation-products-ppt", "templates", "iinnovation-products-ppt-scaffold");
  const nodeModules = path.join(scaffold, "node_modules");
  const lintEvidence = path.join(scaffold, "output", "component-library-lint.json");
  try {
    npmCi(scaffold);
    run(process.execPath, [path.join(repo, "team-sharing", "scripts", "promote-candidate.js"), candidate, "--skill-root", path.join(repo, "iinnovation-products-ppt"), "--curator", curator, "--approve-production"], repo, { echo: true });
  } finally {
    fs.rmSync(nodeModules, { recursive: true, force: true });
    fs.rmSync(lintEvidence, { force: true });
  }
  run(process.execPath, [path.join(repo, "team-sharing", "scripts", "bump-iinnovation-products-ppt-version.js"), "--root", path.join(repo, "iinnovation-products-ppt"), "--type", releaseType, "--preid", preid, "--note", `Promote reviewed component ${metadata.id}.`], repo, { echo: true });
  const preparedVersion = JSON.parse(fs.readFileSync(path.join(repo, "iinnovation-products-ppt", "manifest.json"), "utf8")).version;
  run(process.execPath, [path.join(repo, "iinnovation-products-ppt", "scripts", "release-hygiene.js")], path.join(repo, "iinnovation-products-ppt"), { echo: true });
  git(repo, "add", "--", "iinnovation-products-ppt", "contributions/iinnovation-products-ppt/promotions");
  git(repo, "commit", "-m", `Promote IInnovation-Products_ppt component ${metadata.id}`);
  git(repo, "push", "-u", "origin", branch);
  let pullRequest = null;
  if (process.argv.includes("--create-draft-pr")) {
    const remoteUrl = git(repo, "remote", "get-url", "origin");
    const match = remoteUrl.match(/github\.com[/:]([^/]+\/[^/.]+)(?:\.git)?$/);
    if (!match) throw new Error("Cannot derive GitHub repository from origin.");
    const output = run(process.execPath, [path.join(repo, "team-sharing", "scripts", "create-draft-pr.js"), "--repo", match[1], "--head", branch, "--base", "main", "--title", `Promote IInnovation-Products_ppt component ${metadata.id}`, "--body-file", path.join(repo, ".github", "pull_request_template.md")], repo);
    pullRequest = JSON.parse(output);
  }
  git(repo, "switch", "main");
  console.log(JSON.stringify({ status: "promotion-prepared", branch, candidate: metadata.id, version: preparedVersion, pullRequest }, null, 2));
} catch (error) { console.error(error.message); process.exit(1); }
