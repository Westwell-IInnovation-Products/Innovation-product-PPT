// Gate 1.5 preview lint.
// This script checks whether the low-fi blueprint preview is safe to use as a
// production contract. It does not judge final beauty; it catches patterns that
// repeatedly mislead later component selection or hide obvious visual defects.
//
// Usage:
//   node tools/lint-blueprint-preview.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const rootArgIndex = process.argv.indexOf("--root");
const ROOT = rootArgIndex >= 0 && process.argv[rootArgIndex + 1]
  ? path.resolve(process.argv[rootArgIndex + 1])
  : path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "output");
const BLUEPRINT = path.join(ROOT, "layout-blueprint.json");
const QA_JSON = path.join(OUT_DIR, "layout-blueprint-preview-qa.json");
const QA_MD = path.join(OUT_DIR, "layout-blueprint-preview-qa.md");
const GEOMETRY_JSON = path.join(OUT_DIR, "layout-blueprint-geometry.json");
const COMPONENT_SHORTLIST_JSON = path.join(OUT_DIR, "layout-blueprint-component-shortlist.json");
const COMPONENT_SHORTLIST_SVG = path.join(OUT_DIR, "layout-blueprint-component-shortlist.svg");
const REPORT_MD = path.join(OUT_DIR, "layout-blueprint-preview-lint.md");
const REPORT_JSON = path.join(OUT_DIR, "layout-blueprint-preview-lint.json");

function readText(file, fallback = "") {
  try {
    return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  } catch {
    return fallback;
  }
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(readText(file));
  } catch {
    return fallback;
  }
}

function norm(value) {
  return String(value || "").trim();
}

function lower(value) {
  return norm(value).toLowerCase();
}

function contractsOf(data) {
  if (!data) return [];
  if (Array.isArray(data.contracts)) return data.contracts;
  if (Array.isArray(data.pages)) return data.pages;
  if (Array.isArray(data)) return data;
  return [];
}

function isContent(contract) {
  const text = lower(`${contract.relationship || ""} ${contract.storyRole || ""} ${contract.expressionMode || ""} ${contract.visualSignature || ""}`);
  return !/(cover|closing|transition|divider|brand-cover|brand-closing|section-divider)/.test(text);
}

function hasAny(obj, keys) {
  return keys.some((key) => obj && obj[key] !== undefined && obj[key] !== null && norm(obj[key]) !== "");
}

function add(list, severity, page, type, message, suggestion) {
  list.push({ severity, page, type, message, suggestion });
}

function inspectContract(contract, findings, warnings) {
  if (!isContent(contract)) return;
  const page = contract.page || contract.id || "unknown";
  const pattern = lower(contract.previewPattern);
  const signature = lower(contract.visualSignature);
  const subtype = lower(contract.relationshipSubtype);
  const mode = lower(contract.expressionMode);
  const arch = lower(contract.layoutArchetype);
  const text = `${pattern} ${signature} ${subtype} ${mode} ${arch}`;

  if (!pattern) {
    add(findings, "error", page, "missing-preview-pattern", "缺少 previewPattern。", "蓝图必须声明用户会看到的低保真预览形态。");
    return;
  }

  if (/(big-typography|poster|keyword|instability)/.test(text) && /(radial|spoke|orbit)/.test(pattern)) {
    add(
      findings,
      "error",
      page,
      "poster-page-uses-radial-preview",
      `大字/关键词/不稳定类页面不应使用放射型预览：${contract.previewPattern}`,
      "改成 poster、keyword-board、center-word-with-keywords 等结构；不要用斜线从中心发散。"
    );
  }

  if (/(concept-plane|concept-boundary|skill-harness)/.test(text) && /(bridge|middle-chip|center-chip)/.test(pattern)) {
    add(
      findings,
      "error",
      page,
      "concept-boundary-uses-bridge-chip",
      `概念边界页不应出现中间桥接组件：${contract.previewPattern}`,
      "使用左右概念平面 + 清晰分隔线；红色只用于关系焦点，不要画成第三个概念。"
    );
  }

  if (/(filter|public-private|share-boundary)/.test(text) && !/(input|output|pipeline|filter)/.test(`${pattern} ${arch}`)) {
    add(
      findings,
      "error",
      page,
      "filter-lacks-input-output",
      "边界/过滤页没有明确输入、过滤、输出结构。",
      "蓝图 pattern 应表达 input -> filter -> output，避免漏斗或交叉线条造成误读。"
    );
  }

  if (/(loop|cycle|lifecycle|flywheel|evolution)/.test(text) && /(wire|wiring|spider|crossing)/.test(pattern)) {
    add(
      findings,
      "error",
      page,
      "loop-uses-wiring-preview",
      `闭环页使用了类似接线图的预览：${contract.previewPattern}`,
      "改成外圈循环、阶段环或左右迭代链，不允许连线穿过中心证据区。"
    );
  }

  const highRisk = /(tree|filter|loop|cycle|handoff|route|boundary|router|funnel|screenshot|evidence|agent)/.test(text);
  if (highRisk) {
    const qaFocus = Array.isArray(contract.qaFocus) ? contract.qaFocus.join(" ") : norm(contract.qaFocus);
    if (!/(连线|对齐|重叠|截图|证据|语义|颜色|边界|可读|正交|避免|溢出)/.test(qaFocus)) {
      add(
        warnings,
        "warning",
        page,
        "weak-preview-qa-focus",
        "高风险蓝图页缺少可执行的预览 QA 焦点。",
        "在 qaFocus 中写清楚连线、对齐、截图槽位、颜色语义或边界规则，供后续页面 QA 继承。"
      );
    }
  }
}

function inspectPreviewQa(findings, warnings) {
  const qa = readJson(QA_JSON);
  const geometry = readJson(GEOMETRY_JSON);
  const md = readText(QA_MD);
  if (!qa) {
    // Preview generation is optional (cost control): generate it only for
    // high-risk pages or on explicit user request. Without preview evidence
    // this lint records a skip instead of blocking the blueprint gate; stale
    // evidence, when present, still fails.
    add(warnings, "warning", "preview", "preview-skipped", "未生成蓝图预览证据（预览为可选产物）。", "如需低保真预览，运行 node tools/render-layout-blueprint.js；默认只对高风险页或用户要求时生成。");
    return;
  }
  if (qa.version !== "layout-blueprint-preview-qa.v2") {
    add(findings, "error", "preview", "legacy-preview-qa", `预览 QA 版本为 ${qa.version || "unknown"}。`, "重新运行 V2 蓝图渲染器。" );
  }
  const blueprintBuffer = fs.existsSync(BLUEPRINT) ? fs.readFileSync(BLUEPRINT) : null;
  const digest = blueprintBuffer ? crypto.createHash("sha256").update(blueprintBuffer).digest("hex") : "";
  if (!digest || qa.sourceSha256 !== digest) {
    add(findings, "error", "preview", "stale-preview-qa", "预览 QA 与当前 layout-blueprint.json 哈希不一致。", "蓝图修改后必须重新渲染，不能复用旧 PASS。" );
  }
  if (!geometry || geometry.sourceSha256 !== digest) {
    add(findings, "error", "preview", "missing-or-stale-geometry", "缺少与当前蓝图匹配的几何证据。", "运行稳定蓝图渲染器，生成 output/layout-blueprint-geometry.json。" );
  }
  if (!(qa.geometry && qa.geometry.checked === true)) {
    add(findings, "error", "preview", "geometry-not-checked", "预览 QA 没有声明已执行几何检查。", "几何检查必须覆盖安全区、重叠、连线穿框、斜线和视觉中心。" );
  }
  if (Array.isArray(qa.errors) && qa.errors.length) {
    qa.errors.forEach(item => add(findings, "error", item.page || "preview", item.type || "geometry-error", item.message || "蓝图几何检查失败。", "修复蓝图版面结构或通用预览模式后重跑。"));
  }
  if (qa.verdict !== "PASS") {
    add(findings, "error", "preview", "preview-qa-not-pass", `预览 QA 结论为 ${qa.verdict || "unknown"}。`, "先修复预览 QA JSON 中的 errors，再进入用户确认。");
  }
  if (/人工视觉复核(?:已完成|通过)/.test(md)) {
    add(
      findings,
      "error",
      "preview",
      "manual-claim-in-preview-qa",
      "预览 QA 中仍包含不可验证的“人工视觉复核”声明。",
      "用脚本输出、角色评审记录或明确的人工审阅结论替代空泛声明。"
    );
  }
  if (Array.isArray(qa.warnings) && qa.warnings.length) {
    qa.warnings.forEach((item) => add(warnings, "warning", "preview", "preview-warning", item, "评估是否需要在蓝图或渲染器中修复。"));
  }
}

function inspectComponentShortlist(contracts, findings) {
  const needsPreview = contracts.some(contract => isContent(contract) && Array.isArray(contract.candidateComponents) && contract.candidateComponents.length > 0);
  if (!needsPreview) return;
  const report = readJson(COMPONENT_SHORTLIST_JSON);
  if (!report || !fs.existsSync(COMPONENT_SHORTLIST_SVG)) {
    add(findings, "error", "component-shortlist", "missing-real-component-preview", "缺少当前主题下的真实组件候选预览。", "运行 node tools/render-component-shortlist-preview.js，不能用仅几何蓝图替代组件效果。" );
    return;
  }
  const blueprintBuffer = fs.existsSync(BLUEPRINT) ? fs.readFileSync(BLUEPRINT) : null;
  const digest = blueprintBuffer ? crypto.createHash("sha256").update(blueprintBuffer).digest("hex") : "";
  if (report.version !== "layout-blueprint-component-shortlist.v1" || report.sourceSha256 !== digest) {
    add(findings, "error", "component-shortlist", "stale-real-component-preview", "真实组件候选预览与当前蓝图不匹配。", "蓝图或候选组件修改后重新渲染 shortlist。" );
  }
  if (!Array.isArray(report.components) || !report.components.length || !Array.isArray(report.pages) || !report.pages.length) {
    add(findings, "error", "component-shortlist", "empty-real-component-preview", "真实组件候选预览没有组件或页面映射。", "至少为标杆页或高风险页生成真实候选组件。" );
  }
}

function writeReport(findings, warnings) {
  const verdict = findings.length ? "FIX-FIRST" : "PASS";
  const report = {
    version: "layout-blueprint-preview-lint.v2",
    verdict,
    summary: {
      errors: findings.length,
      warnings: warnings.length
    },
    findings,
    warnings
  };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2), "utf8");

  const lines = [
    "# 蓝图预览机制审计",
    "",
    `- 结论：${verdict}`,
    `- 硬性问题：${findings.length}`,
    `- 提醒项：${warnings.length}`,
    "",
    "## 检查内容",
    "- 大字/关键词页是否误用放射斜线。",
    "- 概念边界页是否误画成中间桥接组件。",
    "- 边界/过滤页是否有清晰输入、过滤、输出。",
    "- 闭环页是否避免接线图和中心穿线。",
    "- 高风险页是否有可执行的预览 QA 焦点。",
    "- 预览 QA 是否有机器可读 JSON，且没有空泛人工复核声明。",
    "",
    "## 硬性问题"
  ];
  if (findings.length) {
    findings.forEach((item) => {
      lines.push(`- [${item.page} / ${item.type}] ${item.message}`);
      lines.push(`  - 建议：${item.suggestion}`);
    });
  } else {
    lines.push("- 无硬性失败项。");
  }
  lines.push("", "## 提醒项");
  if (warnings.length) {
    warnings.forEach((item) => {
      lines.push(`- [${item.page} / ${item.type}] ${item.message}`);
      lines.push(`  - 建议：${item.suggestion}`);
    });
  } else {
    lines.push("- 无提醒项。");
  }
  fs.writeFileSync(REPORT_MD, lines.join("\n") + "\n", "utf8");
  console.log(REPORT_MD);
  console.log(REPORT_JSON);
  if (findings.length) process.exit(1);
}

const blueprint = readJson(BLUEPRINT);
const contracts = contractsOf(blueprint);
const findings = [];
const warnings = [];
if (!contracts.length) {
  add(findings, "error", "blueprint", "missing-contracts", "layout-blueprint.json 没有可检查的 contracts/pages。", "先生成机器可读蓝图合同。");
} else {
  contracts.forEach((contract) => inspectContract(contract, findings, warnings));
}
inspectPreviewQa(findings, warnings);
inspectComponentShortlist(contracts, findings);
writeReport(findings, warnings);
