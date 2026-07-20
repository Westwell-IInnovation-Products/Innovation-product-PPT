#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { validateBatch } = require("../lib/automation-policy");

function value(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
function discover(root, found = [], includePublished = false) {
  if (!root || !fs.existsSync(root)) return found;
  if (fs.existsSync(path.join(root, "candidate.json"))) {
    if (includePublished || !fs.existsSync(path.join(root, ".published.json"))) found.push(path.resolve(root));
    return found;
  }
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) discover(path.join(root, entry.name), found, includePublished);
  }
  return found;
}

try {
  const root = path.resolve(value("root"));
  const maxCandidates = Number(value("max", "3"));
  const candidates = discover(root, [], process.argv.includes("--include-published")).sort((a, b) => a.localeCompare(b));
  const result = validateBatch(candidates, { maxCandidates });
  console.log(JSON.stringify({ schemaVersion: "leander-automation-batch.v1", ...result, candidates }, null, 2));
  if (!result.ok) process.exitCode = 3;
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
