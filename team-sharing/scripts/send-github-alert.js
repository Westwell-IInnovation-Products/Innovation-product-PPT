#!/usr/bin/env node
const cp = require("child_process");

const ALLOWED_KINDS = new Set(["candidate-cycle-blocked", "consumer-update-failed", "automation-disabled"]);
function value(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith("--") ? process.argv[index + 1] : fallback;
}
function sanitizeAlert(input, limit = 400) {
  return String(input == null ? "" : input)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{12,}/gi, "[redacted-token]")
    .replace(/https:\/\/[^\s/@:]+:[^\s/@]+@/gi, "https://[redacted]@")
    .replace(/[A-Za-z]:\\[^\s]+/g, "[local-path]")
    .replace(/\/(?:Users|home)\/[^\s]+/gi, "[local-path]")
    .trim()
    .slice(0, limit);
}
function safeGithubUrl(input, fallback = "https://github.com") {
  const text = sanitizeAlert(input, 300);
  return /^https:\/\/github\.com(?:\/|$)/i.test(text) ? text : fallback;
}
function buildDispatch(kind, title, details, url, source = "team-member") {
  if (!ALLOWED_KINDS.has(kind)) throw new Error(`Unsupported local alert kind: ${kind}`);
  return {
    event_type: "leander_local_alert",
    client_payload: {
      kind,
      title: sanitizeAlert(title, 120),
      details: sanitizeAlert(details, 400),
      url: safeGithubUrl(url),
      source: /^[A-Za-z0-9_.-]{1,80}$/.test(source) ? source : "team-member"
    }
  };
}
function repositoryFromRemote(repoRoot) {
  const result = cp.spawnSync("git", ["-C", repoRoot, "remote", "get-url", "origin"], { encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error("Unable to read the GitHub origin remote");
  const match = String(result.stdout || "").trim().match(/github\.com[/:]([^/]+\/[^/.]+)(?:\.git)?$/i);
  if (!match) throw new Error("Origin is not a supported GitHub repository");
  return match[1];
}
function localIdentity(repoRoot) {
  const result = cp.spawnSync("git", ["-C", repoRoot, "config", "user.name"], { encoding: "utf8", windowsHide: true });
  const candidate = String(result.stdout || "").trim();
  return /^[A-Za-z0-9_.-]{1,80}$/.test(candidate) ? candidate : "team-member";
}
function githubCredential() {
  const result = cp.spawnSync("git", ["credential", "fill"], { input: "protocol=https\nhost=github.com\n\n", encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error("Git credential helper is unavailable");
  const fields = Object.fromEntries(String(result.stdout || "").split(/\r?\n/).filter(Boolean).map(line => {
    const index = line.indexOf("=");
    return index > 0 ? [line.slice(0, index), line.slice(index + 1)] : [line, ""];
  }));
  if (!fields.password) throw new Error("Git credential helper returned no GitHub credential");
  return fields.password;
}
async function main() {
  const repoRoot = value("repo-root", process.cwd());
  const repository = repositoryFromRemote(repoRoot);
  const payload = buildDispatch(value("kind"), value("title"), value("details"), value("url", `https://github.com/${repository}/actions`), localIdentity(repoRoot));
  if (process.argv.includes("--dry-run")) { console.log(JSON.stringify({ repository, ...payload })); return; }
  const token = githubCredential();
  const response = await fetch(`https://api.github.com/repos/${repository}/dispatches`, {
    method: "POST",
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "leander-local-alert" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`GitHub repository dispatch failed: HTTP ${response.status}`);
  console.log(`DISPATCHED_GITHUB_ALERT=${payload.client_payload.kind}`);
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exit(1); });
module.exports = { ALLOWED_KINDS, sanitizeAlert, safeGithubUrl, buildDispatch, repositoryFromRemote, localIdentity };
