// Verify source-evidence-index.v2 content hashes and page/claim coverage.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ROOT = path.join(__dirname, "..");
const INDEX = path.join(ROOT, "source-evidence-index.json");

function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; }
}
function shaFile(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile()
    ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")
    : "";
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
function stableHash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}
function isHex(value) {
  return /^[a-f0-9]{64}$/i.test(String(value || ""));
}
function sourcePath(source, root = ROOT) {
  const value = source.type === "web-snapshot" || source.type === "host-message-snapshot"
    ? source.snapshotPath
    : source.path;
  return path.isAbsolute(String(value || "")) ? path.normalize(value) : path.resolve(root, String(value || ""));
}
function treeHash(root) {
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) return "";
  const files = [], stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(target);
      else if (entry.isFile()) files.push(target);
    }
  }
  return stableHash(files.sort().map(file => [path.relative(root, file).replace(/\\/g, "/"), shaFile(file)]));
}
function actualSourceHash(source, root = ROOT) {
  const target = sourcePath(source, root);
  return source.type === "local-tree" ? treeHash(target) : shaFile(target);
}
function normalizedEvidencePath(value) {
  return String(value || "").split("#")[0].replace(/\\/g, "/").toLowerCase();
}
function pageDirs(root = ROOT) {
  const base = path.join(root, "pages");
  return fs.existsSync(base) ? fs.readdirSync(base).filter(dir => fs.existsSync(path.join(base, dir, "page.json"))).sort() : [];
}
function sourceIdsForPage(page, index) {
  const explicit = new Set([...(page.sourceIds || []), ...(page.renderSourceIds || [])].map(String));
  const byPath = new Map((index.sources || []).map(source => [normalizedEvidencePath(source.path || source.snapshotPath), source.id]));
  (page.implementationEvidence || []).forEach(value => {
    const id = byPath.get(normalizedEvidencePath(value));
    if (id) explicit.add(id);
  });
  (page.claimIds || []).forEach(claimId => {
    const claim = (index.claims || []).find(item => item.id === claimId);
    (claim?.sourceIds || []).forEach(id => explicit.add(id));
  });
  return [...explicit];
}
function verifyIndex({ root = ROOT, indexFile = path.join(root, "source-evidence-index.json") } = {}) {
  const index = readJson(indexFile), errors = [], warnings = [];
  if (!index || index.version !== "source-evidence-index.v2") return { ok: false, errors: ["source-evidence-index.v2 is required"], warnings, index: null };
  const sources = Array.isArray(index.sources) ? index.sources : [];
  const claims = Array.isArray(index.claims) ? index.claims : [];
  if (!sources.length) errors.push("source index has no sources");
  const sourceMap = new Map();
  sources.forEach((source, position) => {
    const label = source.id || `sources[${position}]`;
    if (!source.id || sourceMap.has(source.id)) errors.push(`${label}: source id missing or duplicate`);
    else sourceMap.set(source.id, source);
    if (!["local-file", "local-tree", "web-snapshot", "host-message-snapshot"].includes(source.type)) errors.push(`${label}: unsupported source type`);
    const target = sourcePath(source, root);
    if (!fs.existsSync(target)) errors.push(`${label}: source missing ${target}`);
    const actual = actualSourceHash(source, root);
    if (!isHex(source.sha256) || actual !== source.sha256) errors.push(`${label}: source hash is missing or stale`);
    if (!String(source.boundary || "").trim()) errors.push(`${label}: source boundary required`);
  });
  const claimMap = new Map();
  claims.forEach((claim, position) => {
    const label = claim.id || `claims[${position}]`;
    if (!claim.id || claimMap.has(claim.id)) errors.push(`${label}: claim id missing or duplicate`);
    else claimMap.set(claim.id, claim);
    if (!isHex(claim.textSha256)) errors.push(`${label}: textSha256 required`);
    if (!Array.isArray(claim.pages) || !claim.pages.length) errors.push(`${label}: page scope required`);
    if (!Array.isArray(claim.sourceIds) || !claim.sourceIds.length) errors.push(`${label}: sourceIds required`);
    (claim.sourceIds || []).forEach(id => { if (!sourceMap.has(id)) errors.push(`${label}: unknown source ${id}`); });
    if (!String(claim.boundary || "").trim()) errors.push(`${label}: claim boundary required`);
  });
  pageDirs(root).forEach(dir => {
    const page = readJson(path.join(root, "pages", dir, "page.json"), {});
    const id = String(page.id || dir);
    (page.claimIds || []).forEach(claimId => {
      const claim = claimMap.get(claimId);
      if (!claim) errors.push(`${id}: unknown claim ${claimId}`);
      else if (!claim.pages.includes(id) && !claim.pages.includes(dir)) errors.push(`${id}: claim page scope mismatch ${claimId}`);
    });
    const needsSource = (page.qaProfile?.requiredEvidence || []).includes("source-reference");
    const sourceIds = sourceIdsForPage(page, index);
    if (needsSource && !sourceIds.length) errors.push(`${id}: source-reference required but no indexed source is bound`);
    sourceIds.forEach(sourceId => { if (!sourceMap.has(sourceId)) errors.push(`${id}: unknown source ${sourceId}`); });
  });
  return { ok: errors.length === 0, errors, warnings, index };
}
function resolvedSourceHashes(page, index, root = ROOT) {
  const map = new Map((index?.sources || []).map(source => [source.id, source]));
  return sourceIdsForPage(page, index || { sources: [], claims: [] }).map(id => {
    const source = map.get(id);
    return source ? [id, source.sha256, actualSourceHash(source, root)] : [id, "", ""];
  });
}
function selfTest() {
  const os = require("os");
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "leander-source-v2-"));
  try {
    fs.mkdirSync(path.join(temp, "pages", "p01"), { recursive: true });
    fs.mkdirSync(path.join(temp, "source"), { recursive: true });
    fs.writeFileSync(path.join(temp, "source", "brief.md"), "fact\n");
    fs.writeFileSync(path.join(temp, "pages", "p01", "page.json"), JSON.stringify({ id: "p01", sourceIds: ["src-brief"], qaProfile: { requiredEvidence: ["source-reference"] } }));
    const index = {
      version: "source-evidence-index.v2",
      sources: [{ id: "src-brief", type: "local-file", path: "source/brief.md", sha256: shaFile(path.join(temp, "source", "brief.md")), boundary: "user-provided brief" }],
      claims: []
    };
    fs.writeFileSync(path.join(temp, "source-evidence-index.json"), JSON.stringify(index));
    if (!verifyIndex({ root: temp }).ok) throw new Error("valid source index failed");
    fs.writeFileSync(path.join(temp, "source", "brief.md"), "changed\n");
    const stale = verifyIndex({ root: temp });
    if (stale.ok || !stale.errors.some(item => /source hash/.test(item))) throw new Error("changed source did not fail");
    console.log("PASS source evidence self-test");
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    if (process.argv.includes("--self-test")) selfTest();
    else {
      const result = verifyIndex();
      if (!result.ok) throw new Error(`Source evidence gate FAILED:\n- ${result.errors.join("\n- ")}`);
      console.log(`Source evidence gate OK: sources=${result.index.sources.length}, claims=${result.index.claims.length}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { verifyIndex, resolvedSourceHashes, sourceIdsForPage, actualSourceHash, sourcePath, treeHash, shaFile, stableHash, selfTest };
