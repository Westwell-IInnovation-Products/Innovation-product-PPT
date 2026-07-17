// Leander-PPT 设计硬门禁。
// 用法：
//   node tools/verify-design-gates.js outline
//   node tools/verify-design-gates.js blueprint
//   node tools/verify-design-gates.js pages
//   node tools/verify-design-gates.js all
//
// 这个工具检查“规则是否真的进入产物合同”，不是检查美感本身。
// 渲染后的重叠、线条歪斜、微小字号仍需要 rendered QA / 视觉设计师复核。
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PAGES = path.join(ROOT, "pages");
const OUT_DIR = path.join(ROOT, "output");
const mdOut = path.join(OUT_DIR, "design-gate-audit.md");
const jsonOut = path.join(OUT_DIR, "design-gate-audit.json");

const cmd = (process.argv[2] || "all").toLowerCase();
const allowed = new Set(["outline", "blueprint", "pages", "all"]);
if (!allowed.has(cmd)) {
  console.error("用法：node tools/verify-design-gates.js outline|blueprint|pages|all");
  process.exit(2);
}

function exists(file) {
  return fs.existsSync(file);
}

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

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function norm(value) {
  return String(value || "").trim();
}

function lower(value) {
  return norm(value).toLowerCase();
}

function add(list, severity, scope, file, message, suggestion) {
  list.push({ severity, scope, file: file ? rel(file) : "", message, suggestion });
}

function pageRowsFromOutline(text) {
  const rows = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\|\s*(p\d{2}[-\w]*)\s*\|\s*(\d+)\s*\|[^|]*\|\s*([^|]+?)\s*\|/i);
    if (m) rows.push({ id: m[1], page: Number(m[2]), title: norm(m[3]) });
  }
  return rows;
}

function outlinePageCount() {
  const text = readText(path.join(ROOT, "outline.md"));
  const target = text.match(/Target pages:\s*(\d+)/i);
  if (target) return Number(target[1]);
  const rows = pageRowsFromOutline(text);
  return rows.length;
}

function isContent(contract) {
  const relType = lower(contract.relationship || contract.storyRole || contract.expressionMode);
  return !/(cover|closing|transition|divider|brand-cover|brand-closing|section-divider)/.test(relType);
}

function contractsFromBlueprint(data) {
  if (!data) return [];
  if (Array.isArray(data.contracts)) return data.contracts;
  if (Array.isArray(data.pages)) return data.pages;
  if (Array.isArray(data)) return data;
  return [];
}

function hasAny(obj, keys) {
  return keys.some(k => obj && obj[k] !== undefined && obj[k] !== null && norm(obj[k]) !== "");
}

function hasRationale(obj) {
  if (!obj) return false;
  if (typeof obj === "string") return norm(obj).length > 12;
  return hasAny(obj, ["rationale", "purpose", "reason", "why", "designPurpose"]);
}

function inspectDesignMd(findings) {
  const file = path.join(ROOT, "DESIGN.md");
  if (!exists(file)) {
    add(findings, "error", "design", file, "缺少 DESIGN.md。", "先创建项目级 DESIGN.md，再进入蓝图和页面设计。");
    return;
  }
  const text = readText(file);
  const required = [
    ["颜色语义", /红色|颜色|semantic|focus|risk|当前|强调/i],
    ["字体规则", /微软雅黑|Microsoft YaHei|Century Gothic|字体/i],
    ["默认总结框限制", /底部总结|summary bars|默认/i],
    ["截图槽位规则", /截图|screenshot|crop|脱敏|来源/i],
    ["视觉居中和留白", /视觉中心|居中|贴顶|留白|body/i],
    ["组件表达规则", /组件|expression mode|表达模式|图形|image2/i]
  ];
  for (const [label, pattern] of required) {
    if (!pattern.test(text)) {
      add(findings, "error", "design", file, `DESIGN.md 缺少规则：${label}。`, "把该规则写进 DESIGN.md，否则后续 QA 没有项目级依据。");
    }
  }
}

function inspectVisualDirection(findings) {
  const file = path.join(ROOT, "visual-direction.md");
  const count = outlinePageCount();
  if (count >= 8 && !exists(file)) {
    add(findings, "error", "visual-direction", file, "缺少 visual-direction.md。", "长 PPT 必须先定义视觉导向，不能只依赖 QA 检查。");
    return;
  }
  if (!exists(file)) return;
  const text = readText(file);
  const required = [
    ["视觉目标", /视觉目标|最终效果|第一眼|设计气质/i],
    ["表达模式组合", /表达模式|大字|截图|机制图|image2|组件/i],
    ["图片和截图原则", /截图|图片|image2|真实文件|裁剪/i],
    ["禁止 AI 味设计", /AI 味|默认总结|卡片|红色|歪线|溢出/i],
    ["渲染后看图标准", /渲染后|contact sheet|远看|中看|近看|连看|讲看/i]
  ];
  for (const [label, pattern] of required) {
    if (!pattern.test(text)) {
      add(findings, "error", "visual-direction", file, `visual-direction.md 缺少${label}。`, "视觉导向必须能指导实际效果，而不是只写一句风格描述。");
    }
  }
}

function inspectOutline(findings) {
  const file = path.join(ROOT, "outline.md");
  if (!exists(file)) {
    add(findings, "error", "outline", file, "缺少 outline.md。", "先完成大纲，再进入蓝图。");
    return;
  }
  const text = readText(file);
  const rows = pageRowsFromOutline(text);
  if (!rows.length) {
    add(findings, "error", "outline", file, "outline.md 没有可识别的 Page Plan 表格。", "Page Plan 需要包含 Page ID、Title、Visual intent / expression mode 等字段。");
  }
  const mustHave = [
    ["表达模式", /expressionMode|表达模式|Visual intent/i],
    ["截图槽位", /Screenshot Slot|截图槽位|截图位置/i],
    ["数据和验证边界", /Data And Verification Boundaries|数据和验证边界|数据边界/i]
  ];
  for (const [label, pattern] of mustHave) {
    if (!pattern.test(text)) {
      add(findings, "error", "outline", file, `outline.md 缺少${label}。`, "大纲阶段就要声明表达模式、截图槽位和数据边界，不能等页面生产时再临时判断。");
    }
  }
  if (rows.length >= 10) {
    if (!/素材充足度|evidence capacity|source capacity|可支撑页数|资料缺口/i.test(text)) {
      add(findings, "error", "outline", file, "长 PPT 的 outline.md 缺少素材充足度说明。", "说明来源可支撑页数、现有图片/截图和资料缺口处理策略。" );
    }
    const inventoryFile = path.join(ROOT, "source-evidence-index.json");
    const inventory = readJson(inventoryFile);
    if (!inventory || inventory.version !== "source-evidence-index.v1") {
      add(findings, "error", "outline", inventoryFile, "长 PPT 缺少 source-evidence-index.v1。", "先记录来源事实、可用素材、可支撑页数和缺口处理策略，避免稀释内容扩页。");
    } else {
      const capacity = Number(inventory.evidenceCapacityPages || 0);
      const target = Number(inventory.targetPages || rows.length);
      const policy = norm(inventory.expansionPolicy);
      if (target !== rows.length) add(findings, "error", "outline", inventoryFile, `source-evidence-index targetPages=${target} 与大纲页数 ${rows.length} 不一致。`, "更新素材索引或大纲。" );
      if (capacity < target && !["research-added", "merge-pages", "user-approved-low-evidence"].includes(policy)) {
        add(findings, "error", "outline", inventoryFile, `素材估计只支撑 ${capacity} 页，但目标为 ${target} 页。`, "补充研究/素材、合并页面，或记录用户明确接受的低证据边界。" );
      }
      if (!Array.isArray(inventory.sources) || !inventory.sources.length) add(findings, "error", "outline", inventoryFile, "素材索引没有来源记录。", "至少记录原始文档、截图、公开资料或用户输入的路径/边界。" );
    }
  }
}

function inspectBlueprint(findings, warnings) {
  const cfg = exists(path.join(ROOT, "deck.config.js")) ? require(path.join(ROOT, "deck.config.js")) : {};
  const file = path.join(ROOT, "layout-blueprint.json");
  if (cfg.workflow && cfg.workflow.stage === "outline-reset") {
    add(warnings, "warning", "blueprint", file, "当前处于 outline-reset，旧 layout-blueprint.json 应视为 stale。", "确认大纲后重新生成蓝图，再运行 blueprint 门禁。");
    return;
  }
  if (!exists(file)) {
    add(findings, "error", "blueprint", file, "缺少 layout-blueprint.json。", "Gate 1.5 必须生成机器可读蓝图合同。");
    return;
  }
  const contracts = contractsFromBlueprint(readJson(file));
  if (!contracts.length) {
    add(findings, "error", "blueprint", file, "layout-blueprint.json 没有 contracts/pages。", "蓝图必须逐页写出视觉合同。");
    return;
  }
  for (const c of contracts) {
    const page = c.page || c.id || "unknown";
    if (!hasAny(c, ["expressionMode", "visualSignature"])) {
      add(findings, "error", "blueprint", file, `${page} 缺少 expressionMode / visualSignature。`, "每页必须先确定表达模式，再进入组件选择。");
    }
    if (isContent(c) && !hasAny(c, ["storyRole", "relationship", "frameworkLayer", "mechanismLayer"])) {
      add(findings, "error", "blueprint", file, `${page} 缺少故事角色或框架层归属。`, "蓝图要说明这一页在整套叙事里的任务，而不只是摆放形状。");
    }
    if (isContent(c) && !hasAny(c, ["colorPlan", "colorIntent", "accentTarget"])) {
      add(findings, "error", "blueprint", file, `${page} 缺少颜色意图。`, "红色/蓝色/灰色必须服务逻辑，蓝图阶段要写明强调对象。");
    }
    if (isContent(c) && lower(c.contentDensity) === "low") {
      if (!hasAny(c, ["whitespaceIntent"]) || !hasAny(c, ["densityRationale", "whitespaceRationale"])) {
        add(findings, "error", "blueprint", file, `${page} 声明为低密度页但没有留白意图或密度理由。`, "说明留白用于焦点、停顿、张力、图片强调或章节换气；否则应补充内容或重新布局。");
      }
    }
    const summaryLike = c.bottomSummary || c.takeawayBand || c.summaryBand || c.footerConclusion;
    if (summaryLike && !hasRationale(summaryLike)) {
      add(findings, "error", "blueprint", file, `${page} 使用了底部总结/结论区但没有设计理由。`, "默认总结框禁止使用；只有承载转折、结论或证据时才允许。");
    }
    const slots = c.screenshotSlots || c.evidenceSlots || [];
    for (const slot of slots) {
      if (!hasAny(slot, ["source", "sourcePath"])) {
        add(findings, "error", "blueprint", file, `${page} 截图槽位缺少 source。`, "截图槽位必须说明来源文件/目录。");
      }
      if (!hasAny(slot, ["cropRule", "crop", "placementRule"])) {
        add(findings, "error", "blueprint", file, `${page} 截图槽位缺少裁剪或摆放规则。`, "截图不是装饰，需要提前规定裁剪范围和解释锚点。");
      }
    }
    if (isContent(c)) {
      const body = c.bodyBox || c.bodyArea || c.mainRegion;
      if (!body || typeof body !== "object") {
        add(findings, "error", "blueprint", file, `${page} 缺少 bodyBox/bodyArea。`, "蓝图要显式声明主体区域，避免页面内容整体靠上。");
      } else if (Number.isFinite(body.y) && Number.isFinite(body.h)) {
        const base = Math.max(body.y + body.h, 1) > 1.5 ? 1080 : 1;
        const center = (body.y + body.h / 2) / base;
        if (center < 0.38 || center > 0.68) {
          add(findings, "error", "blueprint", file, `${page} 主体视觉中心异常：${center.toFixed(2)}。`, "主体内容应围绕页面视觉中心组织，除非写明 intentionallyHigh/low rationale。");
        }
      }
    }
  }
}

function pageDirs(activePages = []) {
  if (!exists(PAGES)) return [];
  const dirs = fs.readdirSync(PAGES)
    .filter(d => exists(path.join(PAGES, d, "page.json")) || exists(path.join(PAGES, d, "page.js")))
    .sort();
  if (!activePages.length) return dirs;
  const active = new Set(activePages);
  return dirs.filter(dir => active.has(dir));
}

function inspectPages(findings, warnings) {
  const cfg = exists(path.join(ROOT, "deck.config.js")) ? require(path.join(ROOT, "deck.config.js")) : {};
  if (cfg.workflow && cfg.workflow.stage === "outline-reset") {
    add(warnings, "warning", "pages", path.join(ROOT, "pages"), "当前处于 outline-reset，旧 pages/* 只作为 stale archive。", "确认新蓝图后重新生成页面合同，再运行 pages 门禁。");
    return;
  }
  const activePages = Array.isArray(cfg.workflow?.activePages) ? cfg.workflow.activePages : [];
  const dirs = pageDirs(activePages);
  if (activePages.length) {
    const missing = activePages.filter(page => !dirs.includes(page));
    missing.forEach(page => add(findings, "error", "pages", path.join(PAGES, page), `活动页面 ${page} 不存在。`, "修正 workflow.activePages 或创建对应页面文件夹。"));
  }
  const blueprintData = readJson(path.join(ROOT, "layout-blueprint.json"), {});
  const blueprintContracts = blueprintData.contracts || blueprintData.pages || [];
  if (!dirs.length) {
    add(findings, "error", "pages", path.join(ROOT, "pages"), "缺少页面文件夹。", "页面生产阶段必须有 pages/<id>/page.json。");
    return;
  }
  for (const dir of dirs) {
    const pageJson = path.join(PAGES, dir, "page.json");
    const pageJs = path.join(PAGES, dir, "page.js");
    const meta = readJson(pageJson, {});
    const page = meta.id || dir;
    const blueprint = blueprintContracts.find(item => String(item.page || item.id) === String(page)) || meta.blueprintContract || {};
    if (!hasAny(meta, ["expressionMode"]) && !hasAny(blueprint, ["expressionMode"])) {
      add(findings, "error", "pages", pageJson, `${page} 缺少 expressionMode。`, "页面合同必须继承蓝图表达模式，组件选择不能临时拍脑袋。");
    }
    if (!hasAny(meta, ["implementationStatus"])) {
      add(findings, "error", "pages", pageJson, `${page} 缺少 implementationStatus。`, "概念、外部事实、建议机制、已实现机制要区分，不能混讲。");
    }
    if (!hasAny(meta, ["colorPlan", "colorIntent", "accentTarget"]) && !hasAny(blueprint, ["colorPlan", "colorIntent", "accentTarget"])) {
      add(findings, "error", "pages", pageJson, `${page} 缺少颜色意图。`, "每页要说明红色或强调色为什么出现。");
    }
    const density = lower(meta.contentDensity || blueprint.contentDensity);
    if (density === "low") {
      const whitespaceIntent = meta.whitespaceIntent || blueprint.whitespaceIntent;
      const densityRationale = meta.densityRationale || meta.whitespaceRationale || blueprint.densityRationale || blueprint.whitespaceRationale;
      if (!norm(whitespaceIntent) || norm(densityRationale).length < 8) {
        add(findings, "error", "pages", pageJson, `${page} 是低密度页但没有可执行的留白说明。`, "保留留白可以，但必须说明焦点和节奏作用；不能用空白掩盖内容不足。");
      }
    }
    const summaryLike = meta.bottomSummary || meta.takeawayBand || meta.summaryBand || meta.footerConclusion;
    if (summaryLike && !hasRationale(summaryLike)) {
      add(findings, "error", "pages", pageJson, `${page} 使用底部总结/结论区但没有设计理由。`, "禁止默认总结框；没有表达作用就删掉。");
    }
    const slots = meta.screenshotSlots || blueprint.screenshotSlots || [];
    for (const slot of slots) {
      if (!hasAny(slot, ["source", "sourcePath"])) {
        add(findings, "error", "pages", pageJson, `${page} 截图槽位缺少 source。`, "截图槽位必须能追溯来源。");
      }
      if (!hasAny(slot, ["cropRule", "crop", "placementRule"])) {
        add(findings, "error", "pages", pageJson, `${page} 截图槽位缺少裁剪或摆放规则。`, "截图槽位必须说明怎么截、放在哪里、解释什么。");
      }
    }
    const qa = meta.qaProfile || {};
    if (qa.version === "qa-profile.zh.v2") {
      if (!Array.isArray(qa.ruleSets) || !qa.ruleSets.includes("universal")) {
        add(findings, "error", "pages", pageJson, `${page} qaProfile.ruleSets 缺少 universal。`, "重新运行 build-qa-profile 生成紧凑 QA 合同。" );
      }
      if (!Array.isArray(qa.requiredEvidence) || !qa.requiredEvidence.includes("render-sha256")) {
        add(findings, "error", "pages", pageJson, `${page} qaProfile 缺少 render-sha256 证据要求。`, "QA 必须绑定当前渲染哈希。" );
      }
    } else {
      add(findings, "error", "pages", pageJson, `${page} 尚无 qa-profile.zh.v2。`, "页面生产前运行 build-qa-profile；旧 V1 不能继续通过门禁。" );
    }
    const code = readText(pageJs);
    if (/fontFace\s*:\s*["']Microsoft YaHei["'][\s\S]{0,80}[A-Za-z0-9]/.test(code)) {
      add(warnings, "warning", "pages", pageJs, `${page} 可能存在英文/数字使用微软雅黑。`, "英文标签和数字优先使用 Century Gothic；最终以渲染 QA 为准。");
    }
  }
}

function writeReport(findings, warnings) {
  const verdict = findings.length ? "FIX-FIRST" : "PASS";
  const report = {
    version: "design-gate-audit.v1",
    mode: cmd,
    verdict,
    summary: {
      errors: findings.length,
      warnings: warnings.length
    },
    findings,
    warnings
  };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2), "utf8");

  const lines = [
    "# 设计硬门禁审计",
    "",
    `- 模式：${cmd}`,
    `- 结论：${verdict}`,
    `- 硬性问题：${findings.length}`,
    `- 提醒项：${warnings.length}`,
    "",
    "## 这个门禁检查什么",
    "- 规则是否进入 DESIGN.md、outline、layout-blueprint、page.json、qaProfile。",
    "- 是否显式声明表达模式、颜色意图、截图槽位、主体区域和默认总结框理由。",
    "- 是否把状态、机制、事实边界写进产物合同。",
    "",
    "## 这个门禁不检查什么",
    "- 不直接判断渲染 PNG 里的真实重叠、线条歪斜、字号观感和美感。",
    "- 这些必须通过 rendered QA、视觉设计师和 reviewer 子 agent 继续检查。",
    "",
    "## 硬性问题"
  ];
  if (findings.length) {
    findings.forEach(item => {
      lines.push(`- [${item.scope}] ${item.file}: ${item.message}`);
      lines.push(`  - 建议：${item.suggestion}`);
    });
  } else {
    lines.push("- 无硬性失败项。");
  }
  lines.push("", "## 提醒项");
  if (warnings.length) {
    warnings.forEach(item => {
      lines.push(`- [${item.scope}] ${item.file}: ${item.message}`);
      lines.push(`  - 建议：${item.suggestion}`);
    });
  } else {
    lines.push("- 无提醒项。");
  }
  fs.writeFileSync(mdOut, lines.join("\n") + "\n", "utf8");
  console.log(mdOut);
  console.log(jsonOut);
  if (findings.length) process.exit(1);
}

const findings = [];
const warnings = [];

if (cmd === "outline" || cmd === "all") {
  inspectDesignMd(findings);
  inspectVisualDirection(findings);
  inspectOutline(findings);
}
if (cmd === "blueprint" || cmd === "all") {
  inspectDesignMd(findings);
  inspectVisualDirection(findings);
  inspectBlueprint(findings, warnings);
}
if (cmd === "pages" || cmd === "all") {
  inspectDesignMd(findings);
  inspectVisualDirection(findings);
  inspectPages(findings, warnings);
}

writeReport(findings, warnings);
