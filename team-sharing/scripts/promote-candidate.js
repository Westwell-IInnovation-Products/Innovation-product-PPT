#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const { validateCandidate, candidateRegistryEntry, readJson } = require("../lib/candidate");

function value(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
function fail(message) {
  console.error(`PROMOTION BLOCKED: ${message}`);
  process.exit(1);
}
function runNode(script, args, cwd) {
  const result = cp.spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8", windowsHide: true });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.status !== 0) {
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`Gate failed: ${path.basename(script)}`);
  }
}

const candidateArg = process.argv[2];
const skillArg = value("skill-root");
const curator = value("curator");
const approveForProduction = process.argv.includes("--approve-production");
const skipGates = process.argv.includes("--skip-gates");
if (!candidateArg || !skillArg || !curator) {
  fail("Usage: node team-sharing/scripts/promote-candidate.js <candidate-dir> --skill-root <iinnovation-products-ppt> --curator <github-login> [--approve-production] [--skip-gates]");
}

const candidateDir = path.resolve(candidateArg);
const skillRoot = path.resolve(skillArg);
const result = validateCandidate(candidateDir);
if (!result.ok) {
  result.findings.forEach(item => console.error(`- ${item.rule} ${item.file}: ${item.message}`));
  fail("Candidate validation failed.");
}
if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(curator)) fail("Invalid curator login.");

const scaffold = path.join(skillRoot, "templates", "iinnovation-products-ppt-scaffold");
const extensionDir = path.join(scaffold, "components", "extensions");
const extensionFile = path.join(extensionDir, `${result.metadata.name}.js`);
const registryFile = path.join(scaffold, "tools", "component-registry.json");
if (!fs.existsSync(registryFile)) fail(`Registry not found: ${registryFile}`);
fs.mkdirSync(extensionDir, { recursive: true });

const registryText = fs.readFileSync(registryFile, "utf8");
const registry = readJson(registryFile);
const existingIndex = registry.components.findIndex(component => component.name === result.metadata.name);
if (existingIndex >= 0 && registry.components[existingIndex].contribution?.id !== result.metadata.id) {
  fail(`Registry already contains a different component named ${result.metadata.name}.`);
}
const extensionBackup = fs.existsSync(extensionFile) ? fs.readFileSync(extensionFile) : null;
const approvedAt = new Date().toISOString();
const entry = candidateRegistryEntry(result.metadata, { curator, approvedAt, approveForProduction });
if (existingIndex >= 0) registry.components[existingIndex] = entry;
else registry.components.push(entry);
registry.maintenance = {
  ...(registry.maintenance || {}),
  updatedAt: approvedAt,
  note: "Shared component promotion updates are curator-reviewed and regression-tested."
};

const repoRoot = path.dirname(skillRoot);
const auditDir = path.join(repoRoot, "contributions", "iinnovation-products-ppt", "promotions");
const auditFile = path.join(auditDir, `${result.metadata.id}.json`);
fs.mkdirSync(auditDir, { recursive: true });
const previousAudit = fs.existsSync(auditFile) ? fs.readFileSync(auditFile) : null;

try {
  fs.copyFileSync(path.join(candidateDir, "component.js"), extensionFile);
  fs.writeFileSync(registryFile, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
  fs.writeFileSync(auditFile, `${JSON.stringify({
    schemaVersion: "leander-promotion.v1",
    candidate: result.metadata.id,
    component: result.metadata.name,
    contributor: result.metadata.contributor,
    curator,
    approvedAt,
    approveForProduction,
    source: path.relative(repoRoot, candidateDir).replace(/\\/g, "/")
  }, null, 2)}\n`, "utf8");

  if (!skipGates) {
    runNode(path.join(scaffold, "tools", "enrich-component-registry.js"), [], scaffold);
    runNode(path.join(scaffold, "tools", "build-component-index.js"), [], scaffold);
    runNode(path.join(scaffold, "tools", "lint-component-library.js"), ["--strict"], scaffold);
  }
} catch (error) {
  fs.writeFileSync(registryFile, registryText, "utf8");
  if (extensionBackup) fs.writeFileSync(extensionFile, extensionBackup);
  else fs.rmSync(extensionFile, { force: true });
  if (previousAudit) fs.writeFileSync(auditFile, previousAudit);
  else fs.rmSync(auditFile, { force: true });
  fail(error.message);
}

console.log(JSON.stringify({
  status: approveForProduction ? "promoted-production" : "promoted-review-required",
  candidate: result.metadata.id,
  component: result.metadata.name,
  extension: extensionFile,
  audit: auditFile
}, null, 2));
