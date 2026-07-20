#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { assessCandidate } = require("../lib/candidate-risk");

function value(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
const candidate = process.argv[2];
if (!candidate) {
  console.error("Usage: node team-sharing/scripts/assess-candidate.js <candidate-dir> [--registry file] [--contributions dir] [--write file]");
  process.exit(2);
}
try {
  const result = assessCandidate(path.resolve(candidate), {
    registry: value("registry") ? path.resolve(value("registry")) : "",
    contributionsRoot: value("contributions") ? path.resolve(value("contributions")) : ""
  });
  const output = value("write");
  if (output) {
    fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
    fs.writeFileSync(path.resolve(output), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify(result));
  if (result.lane === "blocked") process.exitCode = 3;
} catch (error) { console.error(error.message); process.exit(1); }
