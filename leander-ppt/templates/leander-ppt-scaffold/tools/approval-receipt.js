// Integrity receipt for explicit user checkpoint approval.
// Local verification proves run/artifact/message binding. The opaque message
// and thread IDs must come from the Codex host; this script cannot prove host identity.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ROOT = path.join(__dirname, "..");

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
function shaText(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}
function isHex(value) {
  return /^[a-f0-9]{64}$/i.test(String(value || ""));
}
function safeProjectFile(root, value) {
  const target = path.resolve(root, String(value || ""));
  const rel = path.relative(root, target);
  return rel && !rel.startsWith("..") && !path.isAbsolute(rel) ? target : "";
}
function verifyReceipt(receipt, expected = {}) {
  const root = expected.root || ROOT, errors = [];
  if (!receipt || receipt.version !== "leander-approval-receipt.v1") return ["invalid approval receipt version"];
  if (receipt.checkpoint !== expected.checkpoint) errors.push("checkpoint mismatch");
  if (receipt.runId !== expected.runId) errors.push("runId mismatch");
  if (receipt.authority?.kind !== "codex-user-message") errors.push("codex-user-message authority required");
  if (!String(receipt.authority?.threadId || "").trim()) errors.push("authority.threadId required");
  if (!String(receipt.authority?.messageId || "").trim()) errors.push("authority.messageId required");
  if (!isHex(receipt.authority?.messageSha256)) errors.push("authority.messageSha256 required");
  if (!String(receipt.summary || "").trim()) errors.push("approval summary required");
  if (!String(receipt.approvedAt || "").trim() || Number.isNaN(Date.parse(receipt.approvedAt))) errors.push("valid approvedAt required");
  const artifact = safeProjectFile(root, receipt.artifact?.path);
  if (!artifact || !fs.existsSync(artifact)) errors.push("approved artifact missing or outside project");
  else if (!isHex(receipt.artifact?.sha256) || shaFile(artifact) !== receipt.artifact.sha256) errors.push("approved artifact changed");
  return errors;
}
function verifyFile(file, expected) {
  const receipt = readJson(file);
  const errors = verifyReceipt(receipt, expected);
  return { ok: errors.length === 0, errors, receipt, sha256: shaFile(file) };
}
function createReceipt(options) {
  const messageFile = path.resolve(options.messageFile);
  const artifactFile = safeProjectFile(options.root, options.artifact);
  if (!fs.existsSync(messageFile)) throw new Error("message file missing");
  if (!artifactFile || !fs.existsSync(artifactFile)) throw new Error("approval artifact missing or outside project");
  const message = fs.readFileSync(messageFile, "utf8");
  return {
    version: "leander-approval-receipt.v1",
    checkpoint: options.checkpoint,
    runId: options.runId,
    authority: {
      kind: "codex-user-message",
      threadId: options.threadId,
      messageId: options.messageId,
      messageSha256: shaText(message)
    },
    artifact: {
      path: path.relative(options.root, artifactFile).replace(/\\/g, "/"),
      sha256: shaFile(artifactFile)
    },
    approvedAt: new Date().toISOString(),
    summary: options.summary
  };
}
function selfTest() {
  const os = require("os");
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "leander-approval-"));
  try {
    const artifact = path.join(temp, "outline.md"), message = path.join(temp, "message.txt"), out = path.join(temp, "state", "approval.json");
    fs.writeFileSync(artifact, "outline-v1\n");
    fs.writeFileSync(message, "Approved.\n");
    const receipt = createReceipt({ root: temp, checkpoint: "plan", runId: "run-1", threadId: "thread-1", messageId: "message-1", messageFile: message, artifact: "outline.md", summary: "User approved outline." });
    writeJson(out, receipt);
    if (!verifyFile(out, { root: temp, checkpoint: "plan", runId: "run-1" }).ok) throw new Error("valid approval receipt failed");
    fs.writeFileSync(artifact, "outline-v2\n");
    const stale = verifyFile(out, { root: temp, checkpoint: "plan", runId: "run-1" });
    if (stale.ok || !stale.errors.some(item => /artifact changed/.test(item))) throw new Error("changed artifact did not fail approval receipt");
    console.log("PASS approval receipt self-test");
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    if (process.argv.includes("--self-test")) selfTest();
    else if (process.argv[2] === "verify") {
      const result = verifyFile(path.resolve(ROOT, arg("file")), { root: ROOT, checkpoint: arg("checkpoint"), runId: arg("run-id") });
      if (!result.ok) throw new Error(result.errors.join("; "));
      console.log(`PASS approval receipt: ${result.receipt.checkpoint}`);
    } else if (process.argv[2] === "create") {
      const out = path.resolve(ROOT, arg("out", `state/approval-receipts/${arg("checkpoint")}.json`));
      const receipt = createReceipt({
        root: ROOT,
        checkpoint: arg("checkpoint"),
        runId: arg("run-id"),
        threadId: arg("thread-id"),
        messageId: arg("message-id"),
        messageFile: arg("message-file"),
        artifact: arg("artifact"),
        summary: arg("summary")
      });
      const errors = verifyReceipt(receipt, { root: ROOT, checkpoint: receipt.checkpoint, runId: receipt.runId });
      if (errors.length) throw new Error(errors.join("; "));
      writeJson(out, receipt);
      console.log(`wrote ${path.relative(ROOT, out)}`);
    } else throw new Error("usage: approval-receipt.js create|verify [options]");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { verifyReceipt, verifyFile, createReceipt, shaFile, shaText, isHex, safeProjectFile, selfTest };
