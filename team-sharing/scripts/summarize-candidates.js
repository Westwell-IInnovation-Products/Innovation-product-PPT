#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { assessCandidate } = require("../lib/candidate-risk");
function value(name, fallback = "") { const index = process.argv.indexOf(`--${name}`); return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback; }
function discover(root, found = []) {
  if (!root || !fs.existsSync(root)) return found;
  if (fs.existsSync(path.join(root, "candidate.json"))) { found.push(root); return found; }
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) if (entry.isDirectory()) discover(path.join(root, entry.name), found);
  return found;
}
try {
  const contributions = path.resolve(process.argv[2] || "contributions/leander-ppt/components");
  const registry = path.resolve(value("registry", "leander-ppt/templates/leander-ppt-scaffold/tools/component-registry.json"));
  const results = discover(contributions).map(dir => assessCandidate(dir, { registry, contributionsRoot: contributions }));
  const counts = results.reduce((acc, item) => { acc[item.lane] = (acc[item.lane] || 0) + 1; return acc; }, {});
  const lines = ["## Leander candidate assessment", "", `Candidates: ${results.length}`, "", "| Candidate | Lane | Risk | Closest formal component |", "| --- | --- | ---: | --- |"];
  for (const result of results) lines.push(`| ${result.candidate?.contributor || "-"}/${result.candidate?.id || "invalid"} | ${result.lane} | ${result.score} | ${result.similar?.[0]?.name || "none"} |`);
  if (!results.length) lines.push("| none | - | - | - |");
  const summary = value("summary");
  if (summary) fs.appendFileSync(path.resolve(summary), `${lines.join("\n")}\n`, "utf8");
  console.log(JSON.stringify({ schemaVersion: "leander-candidate-summary.v1", counts, results }));
  if (results.some(item => item.lane === "blocked")) process.exitCode = 3;
} catch (error) { console.error(error.message); process.exit(1); }
