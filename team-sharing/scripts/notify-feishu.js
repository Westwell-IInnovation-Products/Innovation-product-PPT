#!/usr/bin/env node
const { buildReviewCard } = require("../lib/feishu");
function value(name, fallback = "") { const index = process.argv.indexOf(`--${name}`); return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback; }
async function main() {
  const payload = buildReviewCard({ status: value("status"), title: value("title"), details: value("details"), url: value("url"), actionUrl: value("action-url") });
  if (process.argv.includes("--dry-run")) { console.log(JSON.stringify(payload)); return; }
  const webhook = process.env.FEISHU_WEBHOOK_URL;
  if (!webhook) { console.log("SKIP Feishu notification: FEISHU_WEBHOOK_URL is not configured"); return; }
  const response = await fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const text = await response.text();
  if (!response.ok) throw new Error(`Feishu webhook failed: HTTP ${response.status}`);
  let result = {};
  try { result = JSON.parse(text); } catch { result = {}; }
  if (result.code && result.code !== 0) throw new Error(`Feishu webhook rejected the card: code ${result.code}`);
  console.log("SENT Feishu review notification");
}
main().catch(error => { console.error(error.message); process.exit(1); });
