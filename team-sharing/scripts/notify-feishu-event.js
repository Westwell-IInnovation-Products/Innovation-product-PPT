#!/usr/bin/env node
const fs = require("fs");
const { buildReviewCard } = require("../lib/feishu");
const { buildLifecycleNotification } = require("../lib/feishu-events");
const { sendFeishu } = require("./notify-feishu");

function value(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith("--") ? process.argv[index + 1] : fallback;
}
function parseJsonFile(file, fallback = {}) {
  if (!file || !fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}
function repositoryParts(repository) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository || "")) throw new Error("Invalid GITHUB_REPOSITORY");
  return repository;
}
async function github(pathname, token, repository) {
  if (!token) throw new Error("GITHUB_TOKEN is required for GitHub event enrichment");
  const response = await fetch(`https://api.github.com/repos/${repository}${pathname}`, { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "iinnovation-products-ppt-feishu-notifier" } });
  const data = await response.json();
  if (!response.ok) throw new Error(`GitHub metadata request failed: HTTP ${response.status}`);
  return data;
}
async function pullFiles(number, token, repository) {
  const files = [];
  for (let page = 1; page <= 3; page += 1) {
    const rows = await github(`/pulls/${number}/files?per_page=100&page=${page}`, token, repository);
    files.push(...rows);
    if (rows.length < 100) break;
  }
  return files;
}
async function assessmentFromFiles(files, token, repository) {
  const file = files.find(item => /(?:^|\/)automation-review\.json$/i.test(item.filename || ""));
  if (!file || !file.sha) return null;
  const blob = await github(`/git/blobs/${encodeURIComponent(file.sha)}`, token, repository);
  if (blob.encoding !== "base64" || !blob.content) return null;
  try { return JSON.parse(Buffer.from(blob.content.replace(/\s/g, ""), "base64").toString("utf8")); } catch { return null; }
}
async function versionAt(ref, token, repository) {
  if (!ref) return "";
  try {
    const file = await github(`/contents/iinnovation-products-ppt/manifest.json?ref=${encodeURIComponent(ref)}`, token, repository);
    if (file.encoding !== "base64") return "";
    return String(JSON.parse(Buffer.from(file.content.replace(/\s/g, ""), "base64").toString("utf8")).version || "");
  } catch { return ""; }
}
async function enrich(eventName, event, env = process.env) {
  const repository = repositoryParts(env.GITHUB_REPOSITORY || value("repository", "Westwell-IInnovation-Products/Leander"));
  const token = env.GITHUB_TOKEN || "";
  const runUrl = env.GITHUB_RUN_ID ? `https://github.com/${repository}/actions/runs/${env.GITHUB_RUN_ID}` : `https://github.com/${repository}/actions`;
  if (eventName === "workflow_run") {
    const run = event.workflow_run || {};
    const input = { eventName, workflowName: run.name, conclusion: run.conclusion, runUrl: run.html_url || runUrl };
    const summary = Array.isArray(run.pull_requests) ? run.pull_requests[0] : null;
    if (run.name === "IInnovation-Products_ppt Team Sharing" && summary && summary.number) {
      input.pullRequest = await github(`/pulls/${summary.number}`, token, repository);
      input.files = await pullFiles(summary.number, token, repository);
      input.assessment = await assessmentFromFiles(input.files, token, repository);
    }
    if (["Tag Approved IInnovation-Products_ppt Version", "Release IInnovation-Products_ppt Skill"].includes(run.name)) input.version = await versionAt(run.head_sha, token, repository);
    return input;
  }
  if (eventName === "pull_request_review") return { eventName, reviewState: event.review && event.review.state, pullRequest: event.pull_request, runUrl };
  if (eventName === "pull_request_target") return { eventName, action: event.action, pullRequest: event.pull_request, runUrl };
  if (eventName === "repository_dispatch") return { eventName, localAlert: event.client_payload || {}, runUrl };
  return { eventName, runUrl };
}
async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const eventName = value("event-name", process.env.GITHUB_EVENT_NAME || "workflow_dispatch");
  const event = parseJsonFile(value("event-file", process.env.GITHUB_EVENT_PATH || ""));
  const input = dryRun && eventName === "workflow_dispatch" ? { eventName, runUrl: "https://github.com/Westwell-IInnovation-Products/Leander/actions" } : await enrich(eventName, event);
  const notification = buildLifecycleNotification(input);
  if (!notification) { console.log(`SKIP Feishu lifecycle event: ${eventName}`); return; }
  const card = buildReviewCard(notification);
  if (dryRun) { console.log(JSON.stringify(card)); return; }
  await sendFeishu(card, process.env.FEISHU_WEBHOOK_URL, { required: true });
  console.log(`SENT Feishu lifecycle notification: ${notification.status}`);
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exit(1); });
module.exports = { parseJsonFile, repositoryParts, pullFiles, assessmentFromFiles, versionAt, enrich };
