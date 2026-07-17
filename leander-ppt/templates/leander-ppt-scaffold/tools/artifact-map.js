// Concise artifact manifest: list current review files, summarize repeated evidence.
// Usage: node tools/artifact-map.js [--write] [--root <project>]
const fs = require("fs");
const path = require("path");
function arg(name, fallback = "") { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
const ROOT = path.resolve(arg("root", path.join(__dirname, "..")));
const cfg = fs.existsSync(path.join(ROOT, "deck.config.js")) ? require(path.join(ROOT, "deck.config.js")) : {};
function abs(rel) { return path.join(ROOT, rel); }
function exists(rel) { return fs.existsSync(abs(rel)); }
function stat(rel) { try { const s = fs.statSync(abs(rel)); return { bytes: s.size, modifiedAt: s.mtime.toISOString() }; } catch { return { bytes: 0, modifiedAt: "" }; } }
function list(rel, predicate = () => true) {
  const base = abs(rel), files = [];
  if (!fs.existsSync(base)) return files;
  const stack = [base];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(target);
      else { const item = path.relative(ROOT, target).replace(/\\/g, "/"); if (predicate(item)) files.push(item); }
    }
  }
  return files.sort((a, b) => fs.statSync(abs(b)).mtimeMs - fs.statSync(abs(a)).mtimeMs);
}
function add(items, audience, purpose, file, note = "", required = false) {
  if (exists(file)) items.push({ audience, purpose, path: file, required, note, ...stat(file) });
}
function group(groups, audience, purpose, files, note = "") {
  if (!files.length) return;
  groups.push({ audience, purpose, count: files.length, totalBytes: files.reduce((sum, file) => sum + stat(file).bytes, 0), latest: files.slice(0, 3), note });
}
function newest(files) { return files[0] || ""; }
function activePagePath(file, activePages) {
  if (!activePages.size) return true;
  const match = String(file).replace(/\\/g, "/").match(/^pages\/([^/]+)\//);
  return !!(match && activePages.has(match[1]));
}
function build() {
  const stage = cfg.workflow?.stage || "", items = [], groups = [];
  const activePages = new Set(cfg.workflow?.activePages || []);
  if (stage === "outline-reset") {
    add(items, "user-confirm", "任务简报", "brief.md", "确认目标、受众和边界。", true);
    add(items, "user-confirm", "页面大纲", "outline.md", "确认故事线、标题和页序。", true);
    add(items, "user-confirm", "项目设计系统", "DESIGN.md", "确认视觉意图和颜色语义。", false);
  } else {
    add(items, "next-input", "已批准任务简报", "brief.md", "当前阶段只按需读取，不重复确认。", false);
    add(items, "next-input", "已批准页面大纲", "outline.md", "蓝图和生产的上游合同。", false);
    add(items, "next-input", "已批准设计系统", "DESIGN.md", "蓝图和页面遵守的视觉合同。", false);
  }
  if (stage === "layout-blueprint") {
    add(items, "user-confirm", "蓝图说明", "layout-blueprint.md", "确认故事节奏和页面合同。", true);
    add(items, "user-confirm", "整套蓝图预览", "output/layout-blueprint-preview.svg", "看整套布局节奏和重复。", true);
    add(items, "user-confirm", "高风险页预览", "output/layout-blueprint-risk-preview.svg", "放大检查复杂结构。", true);
    add(items, "user-confirm", "蓝图 QA 摘要", "output/layout-blueprint-preview-qa.md", "PASS 才能进入锚点样页。", true);
  }
  if (stage === "anchor-sample") {
    add(items, "user-confirm", "锚点样页可编辑 PPTX", cfg.anchorFileName || "output/anchor-samples.pptx", "确认真实页面的视觉、密度和编辑性。", true);
    add(items, "user-confirm", "锚点样页联系表", "output/anchor-samples-contact-sheet.svg", "并排检查锚点页的风格、节奏和复杂结构。", true);
  }
  if (stage === "production-batch") {
    add(items, "user-confirm", "当前批次可编辑 PPTX", cfg.batchFileName || "output/current-batch.pptx", "确认当前批次的内容、视觉和节奏。", true);
    add(items, "user-confirm", "当前批次联系表", "output/current-batch-contact-sheet.svg", "并排检查当前活动页面，不代表整套最终预览。", true);
  }
  const fullContact = exists("output/full-deck-contact-sheet.png")
    ? "output/full-deck-contact-sheet.png"
    : exists("output/full-deck-contact-sheet.svg") ? "output/full-deck-contact-sheet.svg" : "";
  if (stage === "production" && fullContact) add(items, "user-confirm", "整套视觉预览", fullContact, "检查节奏和一致性。", true);
  if (stage === "production" && exists("output/render-quality-evidence.json")) add(items, "internal-evidence", "渲染质量锁", "output/render-quality-evidence.json", "绑定当前页面、锚点和独立视觉评审。", true);
  const finalPptx = cfg.fileName && exists(cfg.fileName) ? cfg.fileName : "";
  if (stage === "production" && finalPptx) add(items, "final-output", "可编辑 PPTX", finalPptx, "当前最终交付物。", true);
  if (stage === "production") add(items, "final-output", "中文 Token 报告", "output/token-report.zh.md", "标明实际或估算，并按 Gate、主任务和子智能体拆分。", false);

  [
    ["checkpoint-status.json", "阶段状态"], ["layout-blueprint.json", "蓝图合同"], ["deck.config.js", "运行配置"],
    ["theme-contract.md", "主题合同"], ["terminology.json", "术语合同"], ["state/run-state.json", "运行状态"],
    ["state/phase-handoff.json", "跨任务阶段交接"], ["quality-target.json", "质量目标"], ["agent-collaboration.json", "角色状态"]
  ].forEach(([file, purpose]) => add(items, "next-input", purpose, file, "下一阶段按需读取。", false));
  [
    ["output/layout-blueprint-preview-qa.json", "蓝图机器 QA"], ["output/layout-blueprint-geometry.json", "蓝图几何证据"],
    ["output/layout-blueprint-preview-lint.json", "蓝图预览 lint"], ["output/layout-blueprint-diversity-audit.json", "布局多样性审计"]
    , ["output/render-diversity-audit.json", "渲染级多样性审计"], ["state/render-dependency-manifest.json", "渲染依赖清单"], ["state/token-ledger.json", "Token 账本"], ["state/context-rotation-lock.json", "上下文轮换锁"]
  ].forEach(([file, purpose]) => add(items, "internal-evidence", purpose, file, "内部门禁证据，通常无需逐项确认。", false));

  const collaboration = exists("agent-collaboration.json") ? JSON.parse(fs.readFileSync(abs("agent-collaboration.json"), "utf8").replace(/^\uFEFF/, "")) : {};
  const openEvents = cfg.workflow?.events || {};
  const currentRoleArtifacts = [...new Set(Object.values(collaboration.roles || {})
    .filter(role => ["completed", "fallback"].includes(role.status) && role.event && openEvents[role.event] === true && role.artifact && !role.artifact.includes("*"))
    .map(role => role.artifact)
    .filter(exists))];
  currentRoleArtifacts.forEach(file => add(items, "internal-evidence", "当前角色证据", file, "由当前 agent-collaboration.json 引用。", false));
  if (stage === "production" && collaboration.roles?.["presenter-zh"]?.status === "completed" && openEvents.rehearsalRequested === true) {
    add(items, "final-output", "中文汇报讲稿", "speaker-notes.md", "汇报人基于最终页面彩排生成的逐页讲述、转场和节奏建议。", false);
  }

  const stale = ["outline-reset", "layout-blueprint"].includes(stage);
  const pageContracts = list("pages", file => /\/page\.json$/i.test(file));
  const pageImplementations = list("pages", file => /\/page\.js$/i.test(file));
  const pageEvidence = list("pages", file => /\/out\/|\/qa-result\.json$|\/qa\.md$/i.test(file));
  const scopedByActivePages = activePages.size > 0;
  const currentOnly = files => scopedByActivePages ? files.filter(file => activePagePath(file, activePages)) : files;
  group(groups, stale ? "archive-reference" : "next-input", stale ? "旧页面合同" : "页面合同", currentOnly(pageContracts), stale ? "当前阶段禁止用于生产。" : "按受影响页面读取。" );
  group(groups, stale ? "archive-reference" : "internal-evidence", stale ? "旧页面实现" : "页面实现", currentOnly(pageImplementations), stale ? "保留用于对比。" : "只在实现或修复时读取。" );
  group(groups, stale ? "archive-reference" : "internal-evidence", stale ? "旧页面渲染与 QA" : "页面渲染与 QA", currentOnly(pageEvidence), "重复证据按组统计，不逐文件写入 JSON。" );
  if (scopedByActivePages) {
    group(groups, "archive-reference", "非活动页面目录", pageContracts.filter(file => !activePagePath(file, activePages)), "当前活动范围之外的页面不读取、不渲染，也不参与本阶段门禁。" );
  }
  const roleReports = list("agent-reviews", file => /\.md$/i.test(file) && !currentRoleArtifacts.includes(file));
  group(groups, stale ? "archive-reference" : "internal-evidence", stale ? "旧角色报告" : "其他角色报告", roleReports, "按事件读取对应角色的最新报告。" );
  group(groups, "archive-reference", "历史输出", list("output", file => !items.some(item => item.path === file)), "仅在追溯时读取。" );
  return {
    version: "leander-artifact-map.v3", generatedAt: new Date().toISOString(), stage,
    legend: {
      "user-confirm": "用户现在需要查看或确认。", "next-input": "下一轮按需读取。",
      "internal-evidence": "机器门禁或角色证据，通常无需逐项确认。", "final-output": "最终交付物。", "archive-reference": "历史参考。"
    }, items, groups
  };
}
function markdown(map) {
  const order = ["user-confirm", "final-output", "next-input", "internal-evidence", "archive-reference"];
  const labels = { "user-confirm": "用户确认", "final-output": "最终产物", "next-input": "下一步输入", "internal-evidence": "内部证据", "archive-reference": "归档参考" };
  const lines = ["# 产物清单", "", `- 阶段：${map.stage || "未设置"}`, `- 版本：${map.version}`, "", "当前需要看的文件会逐项列出；重复页面和历史输出只给分组数量。", ""];
  order.forEach(audience => {
    lines.push(`## ${labels[audience]}`, "");
    const items = map.items.filter(item => item.audience === audience), groups = map.groups.filter(item => item.audience === audience);
    if (!items.length && !groups.length) lines.push("- 无", "");
    items.forEach(item => lines.push(`- ${item.required ? "[必看] " : ""}\`${item.path}\`：${item.purpose}。${item.note}`));
    groups.forEach(item => lines.push(`- ${item.purpose}：${item.count} 个文件，${item.totalBytes} B；最新示例：${item.latest.map(file => `\`${file}\``).join("、")}。${item.note}`));
    if (items.length || groups.length) lines.push("");
  });
  return lines.join("\n") + "\n";
}
const map = build(), md = markdown(map);
if (process.argv.includes("--write")) {
  fs.writeFileSync(abs("artifact-manifest.json"), JSON.stringify(map, null, 2) + "\n", "utf8");
  fs.writeFileSync(abs("artifact-manifest.md"), md, "utf8");
}
process.stdout.write(md);
