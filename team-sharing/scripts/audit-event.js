#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");

function value(argv, name, fallback = "") {
  const index = argv.indexOf(`--${name}`);
  const next = index >= 0 ? argv[index + 1] : undefined;
  return next && !next.startsWith("--") ? next : fallback;
}
function safe(input, limit = 500) {
  return String(input == null ? "" : input)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{12,}/gi, "[redacted-token]")
    .replace(/https:\/\/[^\s/@:]+:[^\s/@]+@/gi, "https://[redacted]@")
    .trim()
    .slice(0, limit);
}

function main(argv = process.argv) {
  const log = path.resolve(value(argv, "log", path.join(os.homedir(), ".codex", "iinnovation-products-ppt-logs", "team-sharing-audit.jsonl")));
  const record = {
    schemaVersion: "leander-team-sharing-audit.v1",
    at: new Date().toISOString(),
    event: safe(value(argv, "event", "unknown"), 80),
    status: safe(value(argv, "status", "info"), 40),
    subject: safe(value(argv, "subject"), 160),
    branch: safe(value(argv, "branch"), 200),
    details: safe(value(argv, "details"))
  };
  fs.mkdirSync(path.dirname(log), { recursive: true });
  fs.appendFileSync(log, `${JSON.stringify(record)}\n`, "utf8");
  console.log(`AUDIT_RECORDED=${record.event}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Audit logging failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { value, safe, main };
