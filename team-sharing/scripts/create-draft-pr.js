#!/usr/bin/env node
const fs = require("fs");
const cp = require("child_process");

function value(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
function fail(message) {
  console.error(`PR CREATION BLOCKED: ${message}`);
  process.exit(1);
}

const repository = value("repo");
const head = value("head");
const base = value("base", "main");
const title = value("title");
const bodyFile = value("body-file");
if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) || !head || !title) {
  fail("Usage: node team-sharing/scripts/create-draft-pr.js --repo owner/name --head branch --base main --title title [--body-file file]");
}

const credential = cp.spawnSync("git", ["credential", "fill"], {
  input: "protocol=https\nhost=github.com\n\n",
  encoding: "utf8",
  windowsHide: true
});
if (credential.status !== 0) fail("The existing Git credential helper did not return GitHub credentials.");
const fields = Object.fromEntries(String(credential.stdout || "").split(/\r?\n/).filter(Boolean).map(line => {
  const index = line.indexOf("=");
  return index > 0 ? [line.slice(0, index), line.slice(index + 1)] : [line, ""];
}));
const token = fields.password;
if (!token) fail("Git credential helper returned no password/token. Use the GitHub web compare page to create the PR manually.");

const [owner] = repository.split("/");
const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "leander-team-sharing"
};

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  if (!response.ok) throw new Error(`${response.status} ${data && data.message ? data.message : response.statusText}`);
  return data;
}

async function main() {
  const existingUrl = `https://api.github.com/repos/${repository}/pulls?state=open&base=${encodeURIComponent(base)}&head=${encodeURIComponent(`${owner}:${head}`)}`;
  const existing = await request(existingUrl);
  if (existing.length) {
    console.log(JSON.stringify({ status: "existing", number: existing[0].number, url: existing[0].html_url }, null, 2));
    return;
  }
  const body = bodyFile && fs.existsSync(bodyFile) ? fs.readFileSync(bodyFile, "utf8") : "";
  const created = await request(`https://api.github.com/repos/${repository}/pulls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, head, base, body, draft: true, maintainer_can_modify: true })
  });
  console.log(JSON.stringify({ status: "created", number: created.number, url: created.html_url, draft: created.draft }, null, 2));
}

main().catch(error => fail(error.message));
