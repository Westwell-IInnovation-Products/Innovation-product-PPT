// Integrity receipt copied from a Codex collaboration tool result.
// This binds local artifacts to opaque host IDs; without a host lookup API it
// does not independently prove that those IDs exist.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ROOT = path.join(__dirname, "..");

function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; }
}
function shaFile(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile()
    ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")
    : "";
}
function isHex(value) {
  return /^[a-f0-9]{64}$/i.test(String(value || ""));
}
function verifyReceipt(receipt, expected = {}) {
  const errors = [];
  if (!receipt || receipt.version !== "leander-agent-run-receipt.v1") return ["invalid agent run receipt version"];
  for (const field of ["role", "threadId", "runId", "eventDigest", "inputDigest", "outputArtifact", "outputDigest", "recordedAt"]) {
    if (!String(receipt[field] || "").trim()) errors.push(`${field} required`);
  }
  if (receipt.authority !== "codex-collaboration-tool-result") errors.push("host collaboration authority required");
  if (receipt.role !== expected.role) errors.push("role mismatch");
  if (receipt.threadId !== expected.threadId) errors.push("threadId receipt mismatch");
  if (receipt.runId !== expected.runId) errors.push("runId receipt mismatch");
  if (receipt.eventDigest !== expected.eventDigest) errors.push("event receipt mismatch");
  if (receipt.inputDigest !== expected.inputDigest) errors.push("input receipt mismatch");
  if (!isHex(receipt.eventDigest) || !isHex(receipt.inputDigest) || !isHex(receipt.outputDigest)) errors.push("receipt digests must be SHA-256");
  if (expected.threadPolicy === "fresh-fork-none" && receipt.forkTurns !== "none") errors.push("fresh reviewer receipt must use forkTurns=none");
  const artifact = path.resolve(expected.root || ROOT, receipt.outputArtifact || "");
  const rel = path.relative(expected.root || ROOT, artifact);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel) || !fs.existsSync(artifact)) errors.push("receipt output artifact missing or outside project");
  else if (shaFile(artifact) !== receipt.outputDigest) errors.push("receipt output mismatch");
  return errors;
}
function verifyFile(file, expected) {
  const receipt = readJson(file);
  const errors = verifyReceipt(receipt, expected);
  return { ok: errors.length === 0, errors, receipt, sha256: shaFile(file) };
}
function selfTest() {
  const os = require("os");
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "leander-agent-run-"));
  try {
    fs.mkdirSync(path.join(temp, "agent-reviews"), { recursive: true });
    const artifact = path.join(temp, "agent-reviews", "review.md");
    fs.writeFileSync(artifact, "SHIP\n");
    const digest = "a".repeat(64);
    const receipt = {
      version: "leander-agent-run-receipt.v1",
      role: "reviewer-zh",
      threadId: "thread-1",
      runId: "run-1",
      parentThreadId: "parent-1",
      forkTurns: "none",
      eventDigest: digest,
      inputDigest: digest,
      outputArtifact: "agent-reviews/review.md",
      outputDigest: shaFile(artifact),
      recordedAt: new Date().toISOString(),
      authority: "codex-collaboration-tool-result"
    };
    const errors = verifyReceipt(receipt, { root: temp, role: "reviewer-zh", threadId: "thread-1", runId: "run-1", eventDigest: digest, inputDigest: digest, threadPolicy: "fresh-fork-none" });
    if (errors.length) throw new Error(`valid agent receipt failed: ${errors.join("; ")}`);
    receipt.threadId = "invented";
    if (!verifyReceipt(receipt, { root: temp, role: "reviewer-zh", threadId: "thread-1", runId: "run-1", eventDigest: digest, inputDigest: digest, threadPolicy: "fresh-fork-none" }).some(item => /threadId/.test(item))) throw new Error("invented thread id did not fail");
    console.log("PASS agent run receipt self-test");
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    if (process.argv.includes("--self-test")) selfTest();
    else throw new Error("agent-run-receipt.js is verified through verify-agent-collaboration.js");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { verifyReceipt, verifyFile, shaFile, isHex, selfTest };
