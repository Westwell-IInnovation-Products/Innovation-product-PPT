#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const { evaluatePushUpdates, parsePushLine } = require("../lib/automation-policy");

function guard(input) {
  const lines = String(input || "").split(/\r?\n/).filter(Boolean);
  const result = evaluatePushUpdates(lines);
  return { ...result, refs: lines.map(parsePushLine).filter(Boolean).map(item => item.remoteRef) };
}

function selfTest() {
  const zero = "0".repeat(40);
  const sha = "1".repeat(40);
  const allowed = guard(`refs/heads/local ${sha} refs/heads/agent/test ${zero}\n`);
  const blocked = guard(`refs/heads/local ${sha} refs/heads/main ${zero}\n`);
  if (!allowed.ok || blocked.ok) throw new Error("pre-push guard self-test failed");
  console.log("PASS pre-push guard self-test");
}
function audit(status, result) {
  const refs = [...new Set([...(result.refs || []), ...(result.findings || []).map(item => item.ref).filter(Boolean)])];
  const rules = [...new Set((result.findings || []).map(item => item.rule).filter(Boolean))];
  cp.spawnSync(process.execPath, [path.join(__dirname, "audit-event.js"), "--event", "pre-push", "--status", status, "--branch", refs.join(","), "--details", `Rules=${rules.join(",") || "passed"}`], { stdio: "ignore", windowsHide: true });
}

try {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    const result = guard(fs.readFileSync(0, "utf8"));
    if (!result.ok) {
      audit("blocked", result);
      console.error("BLOCKED: Leander automation may push only agent/*, contrib/*, or promote/* branches.");
      for (const finding of result.findings) console.error(`- ${finding.rule}: ${finding.ref || finding.value || "unknown"}`);
      process.exit(1);
    }
    audit("allowed", result);
  }
} catch (error) {
  console.error(`BLOCKED: pre-push safety guard failed closed: ${error.message}`);
  process.exit(1);
}

module.exports = { guard };
