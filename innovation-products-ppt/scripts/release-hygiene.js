// Validate that the installed/shared Skill is a clean Codex internal-trial package.
// Usage: node scripts/release-hygiene.js
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TEMPLATE = path.join(ROOT, "templates", "innovation-products-ppt-scaffold");
const TEXT_EXTENSIONS = new Set([".md", ".js", ".json", ".yaml", ".yml", ".py", ".ps1", ".sh"]);
const SKIP_DIRS = new Set(["node_modules", ".git"]);

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); }
function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, files);
    else files.push(abs);
  }
  return files;
}
function relative(file) { return path.relative(ROOT, file).replace(/\\/g, "/"); }
function privateTermsFromArgs() {
  const index = process.argv.indexOf("--deny-file");
  if (index < 0 || !process.argv[index + 1]) return [];
  const file = path.resolve(process.argv[index + 1]);
  const value = readJson(file);
  if (!Array.isArray(value) || value.some(term => typeof term !== "string" || !term.trim())) {
    throw new Error("--deny-file must contain a JSON array of non-empty strings");
  }
  return value.map(term => term.trim());
}

function inspect() {
  const findings = [];
  const add = (rule, file, message) => findings.push({ rule, file: relative(file), message });
  const manifestFile = path.join(ROOT, "manifest.json");
  const scaffoldVersionFile = path.join(TEMPLATE, ".leander-scaffold-version.json");
  const packageFile = path.join(TEMPLATE, "package.json");
  const lockFile = path.join(TEMPLATE, "package-lock.json");
  const manifest = readJson(manifestFile);
  const scaffoldVersion = readJson(scaffoldVersionFile);
  const pkg = readJson(packageFile);
  const lock = readJson(lockFile);
  const expected = manifest.version;

  [[scaffoldVersion.version, scaffoldVersionFile], [pkg.version, packageFile], [lock.version, lockFile], [lock.packages?.[""]?.version, lockFile]]
    .forEach(([version, file]) => { if (version !== expected) add("version-mismatch", file, `expected ${expected}, got ${version || "missing"}`); });
  if (JSON.stringify(manifest.compat) !== JSON.stringify(["codex"])) add("compatibility-claim", manifestFile, "internal beta must claim only tested Codex compatibility");

  const forbiddenPaths = [
    "templates/innovation-products-ppt-scaffold/state/context-pack.json",
    "templates/innovation-products-ppt-scaffold/artifact-manifest.json",
    "templates/innovation-products-ppt-scaffold/artifact-manifest.md",
    "templates/innovation-products-ppt-scaffold/workflow-receipt.json",
    "templates/innovation-products-ppt-scaffold/state/token-ledger.json",
    "templates/innovation-products-ppt-scaffold/state/phase-handoff.json",
    "templates/innovation-products-ppt-scaffold/state/toolchain-fingerprint.json"
  ];
  forbiddenPaths.forEach(rel => {
    const file = path.join(ROOT, ...rel.split("/"));
    if (fs.existsSync(file)) add("generated-or-private-artifact", file, "remove this file from the release template");
  });
  const templateModules = path.join(TEMPLATE, "node_modules");
  if (fs.existsSync(templateModules)) add("generated-dependencies", templateModules, "remove template node_modules before distribution; init-scaffold installs the locked dependencies");

  const files = walk(ROOT);
  files.filter(file => relative(file).startsWith("references/feedback/"))
    .forEach(file => add("private-feedback", file, "raw project feedback must stay outside the shared Skill"));
  files.filter(file => {
    const rel = relative(file);
    return /^templates\/innovation-products-ppt-scaffold\/(output\/|pages\/[^/]+\/out\/)/.test(rel);
  }).forEach(file => add("runtime-evidence", file, "release templates must not contain rendered output or trace evidence"));

  const projectTerms = privateTermsFromArgs();
  files.filter(file => TEXT_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .filter(file => path.resolve(file) !== path.resolve(__filename))
    .forEach(file => {
      const text = fs.readFileSync(file, "utf8");
      if (/\.(js|py|ps1|sh)$/i.test(file) && /(^|[\s"'=(])[A-Za-z]:[\\/]/m.test(text)) add("absolute-local-path", file, "release executables must discover tools and paths at runtime");
      projectTerms.forEach(term => {
        if (text.toLocaleLowerCase().includes(term.toLocaleLowerCase())) add("project-name", file, "project-specific content must not ship in the shared Skill");
      });
    });

  const scopeModule = path.join(TEMPLATE, "tools", "lint-scope-hygiene.js");
  const scopeFindings = require(scopeModule).inspectSkill(ROOT);
  scopeFindings.forEach(item => add(item.rule, item.file, item.message));
  return findings;
}

if (require.main === module) {
  const findings = inspect();
  if (findings.length) {
    console.error(`RELEASE BLOCKED: ${findings.length} issue(s)`);
    findings.forEach(item => console.error(`- ${item.rule} ${item.file}: ${item.message}`));
    process.exit(1);
  }
  console.log("PASS release hygiene: Codex internal beta package is clean");
}

module.exports = { inspect };
