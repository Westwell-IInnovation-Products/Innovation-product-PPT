#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { validateCandidate } = require("../lib/candidate");

function usage() {
  console.error("Usage: node team-sharing/scripts/validate-candidate.js <candidate-or-inbox> [--deny-file terms.json]");
  process.exit(2);
}

const targetArg = process.argv[2];
if (!targetArg) usage();
const target = path.resolve(targetArg);
const denyIndex = process.argv.indexOf("--deny-file");
const denyTerms = denyIndex >= 0 ? JSON.parse(fs.readFileSync(path.resolve(process.argv[denyIndex + 1]), "utf8")) : [];

function isCandidate(dir) {
  return fs.existsSync(path.join(dir, "candidate.json"));
}

function discover(dir, found = []) {
  if (!fs.existsSync(dir)) return found;
  if (isCandidate(dir)) {
    found.push(dir);
    return found;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) discover(path.join(dir, entry.name), found);
  }
  return found;
}

const candidates = isCandidate(target) ? [target] : discover(target);
if (!candidates.length) {
  console.log(`PASS candidate validation: no candidate bundles under ${target}`);
  process.exit(0);
}

let failures = 0;
for (const candidate of candidates) {
  const result = validateCandidate(candidate, { denyTerms });
  if (result.ok) {
    console.log(`PASS ${result.metadata.contributor}/${result.metadata.id} -> ${result.metadata.name}`);
  } else {
    failures += 1;
    console.error(`FAIL ${candidate}`);
    result.findings.forEach(item => console.error(`- ${item.rule} ${item.file}: ${item.message}`));
  }
}
if (failures) process.exit(1);
console.log(`PASS candidate validation: ${candidates.length} bundle(s)`);
