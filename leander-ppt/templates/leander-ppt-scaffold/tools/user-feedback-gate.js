const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const FILE = path.join(ROOT, "state", "user-feedback.json");
const VERSION = "user-feedback.v1";

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; }
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}
function shaFile(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile()
    ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")
    : "";
}
function pageRecord(pageId) {
  const pagesRoot = path.join(ROOT, "pages");
  const dir = fs.readdirSync(pagesRoot).find(name => {
    const page = readJson(path.join(pagesRoot, name, "page.json"), {});
    return name === pageId || String(page.id || "") === pageId;
  });
  if (!dir) return null;
  const page = readJson(path.join(pagesRoot, dir, "page.json"), {});
  const id = String(page.id || dir);
  const render = path.join(pagesRoot, dir, "out", `${id}.png`);
  const geometry = path.join(pagesRoot, dir, "out", "geometry-audit.json");
  return { id, dir, renderSha256: shaFile(render), geometryAuditSha256: shaFile(geometry) };
}
function load() {
  return readJson(FILE, { version: VERSION, issues: [] });
}
function inspect() {
  const doc = load(), errors = [];
  if (doc.version !== VERSION) errors.push(`user feedback registry must be ${VERSION}`);
  for (const issue of doc.issues || []) {
    const label = issue.id || "issue-without-id";
    if (!Array.isArray(issue.pages) || !issue.pages.length) errors.push(`${label}: pages[] is required`);
    if (!["P0", "P1", "P2", "P3"].includes(issue.severity)) errors.push(`${label}: severity is invalid`);
    if (String(issue.summary || "").trim().length < 8) errors.push(`${label}: summary is too generic`);
    if (!["open", "closed"].includes(issue.status)) errors.push(`${label}: status must be open or closed`);
    if (["P0", "P1"].includes(issue.severity) && issue.status === "open") errors.push(`${label}: unresolved ${issue.severity} user feedback`);
    if (issue.status === "closed") {
      const evidence = issue.closedByEvidence || {};
      for (const pageId of issue.pages || []) {
        const current = pageRecord(String(pageId));
        const bound = (evidence.pages || []).find(item => item.id === current?.id);
        if (!current) errors.push(`${label}: page not found: ${pageId}`);
        else if (!bound || bound.renderSha256 !== current.renderSha256 || bound.geometryAuditSha256 !== current.geometryAuditSha256) errors.push(`${label}: closure evidence is stale for ${pageId}`);
      }
      if (!String(evidence.closedAt || "").trim()) errors.push(`${label}: closedAt is required`);
    }
  }
  return { ok: errors.length === 0, errors, doc };
}
function addIssue() {
  const doc = load(), pages = arg("pages").split(",").map(item => item.trim()).filter(Boolean);
  const severity = arg("severity", "P1").toUpperCase(), summary = arg("summary");
  if (!pages.length || !["P0", "P1", "P2", "P3"].includes(severity) || summary.trim().length < 8) throw new Error("add requires --pages, --severity P0..P3, and a concrete --summary");
  const id = `feedback-${String((doc.issues || []).length + 1).padStart(3, "0")}`;
  doc.version = VERSION;
  doc.issues = [...(doc.issues || []), {
    id, pages, severity, summary: summary.trim(), status: "open",
    openedAt: new Date().toISOString(),
    openedRender: pages.map(pageRecord).filter(Boolean),
    closedByEvidence: null
  }];
  writeJson(FILE, doc);
  return id;
}
function closeIssue() {
  const doc = load(), id = arg("id"), issue = (doc.issues || []).find(item => item.id === id);
  if (!issue) throw new Error(`feedback issue not found: ${id}`);
  const pages = (issue.pages || []).map(pageRecord);
  if (pages.some(item => !item || !item.renderSha256 || !item.geometryAuditSha256)) throw new Error("all affected pages require current render and geometry audit before closure");
  const unchanged = pages.some(current => (issue.openedRender || []).some(opened => opened.id === current.id && opened.renderSha256 === current.renderSha256));
  if (unchanged) throw new Error("user feedback cannot close without a new affected-page render");
  issue.status = "closed";
  issue.closedByEvidence = {
    closedAt: new Date().toISOString(),
    pages,
    cropArtifact: arg("crop"),
    cropSha256: arg("crop") ? shaFile(path.resolve(ROOT, arg("crop"))) : ""
  };
  writeJson(FILE, doc);
}
function selfTest() {
  const open = { version: VERSION, issues: [{ id: "feedback-001", pages: ["missing"], severity: "P0", summary: "blocking overlap remains visible", status: "open" }] };
  const prior = fs.existsSync(FILE) ? fs.readFileSync(FILE) : null;
  try {
    writeJson(FILE, open);
    const result = inspect();
    if (result.ok || !result.errors.some(item => /unresolved P0/.test(item))) throw new Error("open P0 feedback did not block");
  } finally {
    if (prior) fs.writeFileSync(FILE, prior);
    else fs.rmSync(FILE, { force: true });
  }
  console.log("PASS user feedback gate self-test");
}

if (require.main === module) {
  try {
    const command = process.argv[2] || "verify";
    if (command === "verify") {
      const result = inspect();
      if (!result.ok) throw new Error(`USER FEEDBACK GATE FAILED:\n- ${result.errors.join("\n- ")}`);
      console.log(`PASS user feedback gate: ${(result.doc.issues || []).length} issue(s) resolved or non-blocking`);
    } else if (command === "add") console.log(`Added ${addIssue()}`);
    else if (command === "close") { closeIssue(); console.log(`Closed ${arg("id")}`); }
    else if (command === "--self-test") selfTest();
    else throw new Error("usage: user-feedback-gate.js verify|add|close|--self-test");
  } catch (error) { console.error(error.message); process.exit(1); }
}

module.exports = { inspect, addIssue, closeIssue, pageRecord, VERSION, selfTest };
