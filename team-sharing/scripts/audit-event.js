#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");

function value(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
function safe(input, limit = 500) {
  return String(input == null ? "" : input)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{12,}/gi, "[redacted-token]")
    .replace(/https:\/\/[^\s/@:]+:[^\s/@]+@/gi, "https://[redacted]@")
    .trim()
    .slice(0, limit);
}

try {
  const log = path.resolve(value("log", path.join(os.homedir(), ".codex", "leander-logs", "team-sharing-audit.jsonl")));
  const record = {
    schemaVersion: "leander-team-sharing-audit.v1",
    at: new Date().toISOString(),
    event: safe(value("event", "unknown"), 80),
    status: safe(value("status", "info"), 40),
    subject: safe(value("subject"), 160),
    branch: safe(value("branch"), 200),
    details: safe(value("details"))
  };
  fs.mkdirSync(path.dirname(log), { recursive: true });
  fs.appendFileSync(log, `${JSON.stringify(record)}\n`, "utf8");
  console.log(`AUDIT_RECORDED=${record.event}`);
} catch (error) {
  console.error(`Audit logging failed: ${error.message}`);
  process.exit(1);
}
