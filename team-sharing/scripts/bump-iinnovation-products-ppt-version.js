#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { bumpVersion } = require("../lib/semver");
function value(name, fallback = "") { const index = process.argv.indexOf(`--${name}`); return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback; }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); }
function writeJson(file, data) { fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8"); }
try {
  const root = path.resolve(value("root", "iinnovation-products-ppt"));
  const type = value("type");
  const preid = value("preid");
  const note = value("note", "Automated approved team-sharing update.").replace(/[\r\n]+/g, " ").trim();
  const manifestFile = path.join(root, "manifest.json");
  const packageFile = path.join(root, "templates", "iinnovation-products-ppt-scaffold", "package.json");
  const lockFile = path.join(root, "templates", "iinnovation-products-ppt-scaffold", "package-lock.json");
  const scaffoldFile = path.join(root, "templates", "iinnovation-products-ppt-scaffold", ".leander-scaffold-version.json");
  const deckFile = path.join(root, "templates", "iinnovation-products-ppt-scaffold", "tools", "deck.js");
  const changelogFile = path.join(root, "CHANGELOG.md");
  const manifest = readJson(manifestFile);
  const previous = manifest.version;
  const next = bumpVersion(previous, type, preid);
  manifest.version = next;
  const pkg = readJson(packageFile); pkg.version = next;
  const lock = readJson(lockFile); lock.version = next; if (lock.packages?.[""]) lock.packages[""].version = next;
  const scaffold = readJson(scaffoldFile); scaffold.version = next;
  writeJson(manifestFile, manifest); writeJson(packageFile, pkg); writeJson(lockFile, lock); writeJson(scaffoldFile, scaffold);
  const deckSource = fs.readFileSync(deckFile, "utf8").replace(/const SCAFFOLD_VERSION = "[^"]+";/, `const SCAFFOLD_VERSION = "${next}";`);
  fs.writeFileSync(deckFile, deckSource, "utf8");
  const changelog = fs.readFileSync(changelogFile, "utf8");
  const entry = `## ${next} - ${new Date().toISOString().slice(0, 10)}\n\n- ${note}\n\n`;
  fs.writeFileSync(changelogFile, changelog.replace(/^# Changelog\s*/u, `# Changelog\n\n${entry}`), "utf8");
  console.log(JSON.stringify({ previous, version: next, tag: `iinnovation-products-ppt-v${next}` }));
} catch (error) { console.error(error.message); process.exit(1); }
