#!/usr/bin/env node
const cp = require("child_process");
const path = require("path");
const { evaluatePushUpdates, validateStagedPaths } = require("../lib/automation-policy");

function value(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
function git(repo, args) {
  const result = cp.spawnSync("git", ["-C", repo, ...args], { encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `git ${args.join(" ")} failed`);
  return String(result.stdout || "").trim();
}

try {
  const repo = path.resolve(value("repo"));
  const allowedRoot = value("allowed-root");
  const expectedPrefix = value("expected-branch-prefix");
  const branch = git(repo, ["branch", "--show-current"]);
  const staged = git(repo, ["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB"]).split(/\r?\n/).filter(Boolean);
  const branchCheck = evaluatePushUpdates([`refs/heads/${branch} ${"1".repeat(40)} refs/heads/${branch} ${"0".repeat(40)}`]);
  const prefixOk = expectedPrefix && branch.startsWith(expectedPrefix);
  const pathCheck = validateStagedPaths(staged, allowedRoot);
  const ok = branchCheck.ok && prefixOk && pathCheck.ok;
  const result = { schemaVersion: "leander-publish-scope.v1", ok, branch, expectedPrefix, staged, findings: [...branchCheck.findings, ...(prefixOk ? [] : [{ rule: "unexpected-publish-branch", branch, expectedPrefix }]), ...pathCheck.findings] };
  console.log(JSON.stringify(result, null, 2));
  if (!ok) process.exitCode = 3;
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
