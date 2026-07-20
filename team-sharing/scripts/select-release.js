#!/usr/bin/env node
const fs = require("fs");
const { parseVersion, compareVersions, selectLatest } = require("../lib/semver");
function value(name, fallback = "") { const index = process.argv.indexOf(`--${name}`); return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback; }
try {
  const channel = value("channel", "stable");
  if (!["stable", "beta"].includes(channel)) throw new Error("channel must be stable or beta");
  const currentText = value("current");
  const tagsFile = value("tags-file");
  const tagsText = tagsFile ? fs.readFileSync(tagsFile, "utf8") : fs.readFileSync(0, "utf8");
  const tags = tagsText.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
  const selected = selectLatest(tags, channel);
  const current = parseVersion(currentText);
  const updateAvailable = Boolean(selected && (!current || compareVersions(selected.version, current) > 0));
  console.log(JSON.stringify({ schemaVersion: "leander-release-selection.v1", channel, current: current?.raw || null, selectedTag: selected?.tag || null, selectedVersion: selected?.version.raw || null, updateAvailable }));
} catch (error) { console.error(error.message); process.exit(1); }
