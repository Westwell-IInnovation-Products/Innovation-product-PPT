// Verify lightweight state/memory artifacts.
// Usage:
//   node tools/verify-state-memory.js
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const REQUIRED = [
  "state/run-state.json",
  "state/decision-log.md",
  "state/conversation-summary.md",
  "state/issues.json",
  "checkpoint-status.json",
  "deck.config.js"
];

function readJson(rel) {
  const file = path.join(ROOT, rel);
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function main() {
  const missing = REQUIRED.filter(rel => !fs.existsSync(path.join(ROOT, rel)));
  const findings = [];

  if (!missing.length) {
    try {
      const state = readJson("state/run-state.json");
      ["currentPhase", "currentGate", "nextAction"].forEach(key => {
        if (!state[key]) findings.push(`state/run-state.json 缺少 ${key}`);
      });
      if (!Array.isArray(state.activeDecisions)) {
        findings.push("state/run-state.json 的 activeDecisions 应为数组");
      }
      const cfg = require(path.join(ROOT, "deck.config.js"));
      const checkpoints = readJson("checkpoint-status.json").checkpoints || {};
      const approved = key => ["approved", "bypassed"].includes(checkpoints[key]?.status);
      const stage = cfg.workflow?.stage || "";
      const dependencies = {
        "layout-blueprint": ["plan", "designTermsState", "theme"],
        "anchor-sample": ["plan", "designTermsState", "theme", "layoutBlueprint"],
        production: ["plan", "designTermsState", "theme", "layoutBlueprint", "anchorSample", "productionMode"]
      }[stage] || [];
      dependencies.forEach(key => { if (!approved(key)) findings.push(`workflow.stage=${stage}，但 checkpoint ${key} 尚未批准或有理由地绕过`); });
      const phaseWords = {
        "outline-reset": /(brief|outline|大纲|简报)/i,
        "layout-blueprint": /(layout|blueprint|蓝图)/i,
        "anchor-sample": /(anchor|sample|theme|样页|主题)/i,
        production: /(production|生产|制作)/i
      };
      if (phaseWords[stage] && !phaseWords[stage].test(state.currentPhase)) {
        findings.push(`run-state.currentPhase=${state.currentPhase} 与 workflow.stage=${stage} 不一致`);
      }
    } catch (err) {
      findings.push(`state/run-state.json 不是合法 JSON：${err.message}`);
    }
  }

  if (missing.length || findings.length) {
    console.log("# 状态和记忆检查：FIX-FIRST");
    missing.forEach(rel => console.log(`- 缺少文件：${rel}`));
    findings.forEach(item => console.log(`- ${item}`));
    process.exit(1);
  }

  console.log("# 状态和记忆检查：PASS");
  REQUIRED.forEach(rel => console.log(`- ${rel}`));
}

main();
