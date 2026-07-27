// Verify deck terminology consistency.
// Usage:
//   node tools/verify-terminology.js
//   node tools/verify-terminology.js outline.md layout-blueprint.md
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TERMS_PATH = path.join(ROOT, "terminology.json");

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function readText(file) {
  return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function listPageFiles(name) {
  const pages = path.join(ROOT, "pages");
  if (!fs.existsSync(pages)) return [];
  return fs.readdirSync(pages)
    .map(dir => path.join("pages", dir, name))
    .filter(rel => fs.existsSync(path.join(ROOT, rel)));
}

function defaultTargets() {
  return [
    "outline.md",
    "layout-blueprint.md",
    "layout-blueprint.json",
    ...listPageFiles("page.json"),
    ...listPageFiles("page.js"),
    "speaker-notes.md"
  ].filter(rel => fs.existsSync(path.join(ROOT, rel)));
}

function main() {
  const terms = readJson(TERMS_PATH);
  if (!terms) {
    console.error("缺少 terminology.json；无法校验术语一致性。");
    process.exit(2);
  }

  const targets = process.argv.slice(2).length ? process.argv.slice(2) : defaultTargets();
  const forbidden = terms.forbiddenAliases || {};
  const findings = [];
  const corpusParts = [];

  for (const rel of targets) {
    const file = path.resolve(ROOT, rel);
    if (!fs.existsSync(file)) continue;
    const text = readText(file);
    corpusParts.push(text);
    for (const [alias, canonical] of Object.entries(forbidden)) {
      const rx = new RegExp(escapeRegExp(alias), "g");
      const matches = text.match(rx);
      if (matches && matches.length) {
        findings.push({
          file: path.relative(ROOT, file).replace(/\\/g, "/"),
          alias,
          canonical,
          count: matches.length
        });
      }
    }
  }

  const corpus = corpusParts.join("\n");
  const missing = (terms.canonicalTerms || []).filter(term => !corpus.includes(term));

  if (findings.length || missing.length) {
    console.log("# 术语一致性检查：FIX-FIRST");
    findings.forEach(item => {
      console.log(`- ${item.file}: "${item.alias}" 出现 ${item.count} 次；建议统一为 "${item.canonical}"。`);
    });
    missing.forEach(term => {
      console.log(`- 缺少标准术语："${term}"。如果本 deck 不需要该术语，请从 terminology.json 移除。`);
    });
    process.exit(1);
  }

  console.log("# 术语一致性检查：PASS");
  console.log(`- Canonical terms: ${(terms.canonicalTerms || []).join(" / ")}`);
}

main();
