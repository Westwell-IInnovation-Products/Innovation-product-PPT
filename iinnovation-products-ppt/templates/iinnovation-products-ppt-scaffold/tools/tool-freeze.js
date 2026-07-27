// Freeze workflow machinery during a deck run so process fixes happen in a separate Skill task.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ROOT = path.join(__dirname, "..");
const FILE = path.join(ROOT, "state", "tool-freeze.json");
const DEFECT = path.join(ROOT, "state", "skill-defect.json");
const { runtimeFingerprint } = require("./page-digests");
function sha(file) { return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"); }
function files() { return fs.readdirSync(__dirname).filter(name => /\.(?:js|json)$/i.test(name)).sort().map(name => path.join(__dirname, name)); }
function snapshot(reason = "gate0") {
  return {
    version: "leander-tool-freeze.v2",
    capturedAt: new Date().toISOString(),
    reason,
    files: Object.fromEntries(files().map(file => [path.basename(file), sha(file)])),
    runtime: runtimeFingerprint(ROOT)
  };
}
function capture(reason = "gate0") { const value = snapshot(reason); fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(value, null, 2) + "\n", "utf8"); return value; }
function verify() {
  let frozen;
  try { frozen = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { throw new Error("tool freeze missing; initialize Gate 0 or resync the scaffold before production"); }
  const current = snapshot("verify"), changed = [...new Set([...Object.keys(frozen.files || {}), ...Object.keys(current.files)])].filter(name => frozen.files?.[name] !== current.files[name]);
  if (frozen.version !== "leander-tool-freeze.v2") changed.push("tool-freeze-version");
  if (JSON.stringify(frozen.runtime || {}) !== JSON.stringify(current.runtime || {})) changed.push("runtime-fingerprint");
  if (changed.length) {
    const defect = { version: "leander-skill-defect.v1", detectedAt: new Date().toISOString(), changedTools: changed, requiredAction: "Pause deck production; fix and test the shared Skill separately, then resync and start a clean phase." };
    fs.writeFileSync(DEFECT, JSON.stringify(defect, null, 2) + "\n", "utf8");
    throw new Error(`workflow tools changed during the deck run: ${changed.join(", ")}`);
  }
  return { ok: true, files: changed.length };
}
if (require.main === module) {
  const command = process.argv[2] || "verify";
  try {
    if (command === "capture") console.log(`Tool freeze captured: ${Object.keys(capture(process.argv[3] || "manual").files).length} files`);
    else if (command === "verify") { verify(); console.log("Tool freeze: current"); }
    else throw new Error("usage: tool-freeze.js capture [reason]|verify");
  } catch (error) { console.error(error.message); process.exit(1); }
}
module.exports = { snapshot, capture, verify };
