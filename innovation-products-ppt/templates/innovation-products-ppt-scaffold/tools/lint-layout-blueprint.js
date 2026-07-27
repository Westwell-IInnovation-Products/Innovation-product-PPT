const fs = require("fs");
const path = require("path");
const { inspectBlueprintComponentContracts } = require("./component-contract");

const root = process.cwd();
const input = process.argv[2] || path.join(root, "layout-blueprint.json");
const outDir = path.join(root, "output");
const mdOut = path.join(outDir, "layout-blueprint-diversity-audit.md");
const jsonOut = path.join(outDir, "layout-blueprint-diversity-audit.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function norm(value) {
  return String(value || "").trim();
}

function lower(value) {
  return norm(value).toLowerCase();
}

// 主视觉形状类：受控枚举，比 skeletonFamily 粗一档。skeletonFamily 是自由文本，
// 每页都能取唯一串，导致 family-overuse 形同虚设；shapeClass 强制从固定集合里选，
// 让"画出来是不是同一种形状"的雷同在蓝图阶段就暴露（占用特征审计看不见 gestalt）。
const SHAPE_CLASSES = [
  "diamond-fanout", "funnel-converge", "timeline", "grid-matrix", "tree-hierarchy",
  "layered-rail", "swimlane", "radial-hub", "evidence-board", "big-type", "cover"
];
function shapeClassOf(contract) {
  return lower(contract.primaryShapeClass);
}

function pagesOf(items) {
  return items.map((item) => item.page).join(" / ");
}

function familyOf(contract) {
  if (contract.skeletonFamily) return norm(contract.skeletonFamily);

  const sig = [
    contract.visualSignature,
    contract.relationshipSubtype,
    contract.layoutArchetype,
    contract.relationship
  ].map(lower).join(" ");

  if (/cover|closing|transition|divider/.test(sig)) return "transition/brand";
  if (/compare|contrast|before|after|tension|boundary/.test(sig)) return "contrast";
  if (/flow|timeline|gate|spine|sequence|process|sync|route|orchestration/.test(sig)) return "process";
  if (/map|ecosystem|landscape|mindmap|hub|spoke|architecture/.test(sig)) return "map";
  if (/state|folder|memory|zoom|isolation/.test(sig)) return "state";
  if (/tool|asset|selector|funnel|decision|component|library/.test(sig)) return "tool/decision";
  if (/qa|evidence|agent|artifact|manifest|screenshot|role|review/.test(sig)) return "evidence/role";
  if (/loop|cycle|flywheel|lifecycle|evolution/.test(sig)) return "lifecycle";
  return "other";
}

function previewPatternOf(contract) {
  if (contract.previewPattern) return norm(contract.previewPattern);
  const family = lower(contract.skeletonFamily);
  const sig = lower(contract.visualSignature);

  if (/cover|closing|transition/.test(`${family} ${sig}`)) return "brand-transition";
  if (/architecture/.test(family)) return "architecture-map";
  if (/landscape|convergence|transfer-map|map/.test(family)) return "hub-map";
  if (/contrast|boundary|benefit|keyword|router/.test(family)) return "split-compare";
  if (/timeline|process|gate|learning/.test(family)) return "linear-timeline";
  if (/state|folder|zoom/.test(family)) return "folder-zoom";
  if (/tool-tree/.test(family)) return "tool-tree";
  if (/decision|repair|governance|filter/.test(family)) return "decision-chain";
  if (/qa|evidence|screenshot|artifact/.test(family)) return "evidence-board";
  if (/role/.test(family)) return "role-matrix";
  if (/loop|lifecycle|evolution/.test(family)) return "center-loop";

  const fallback = [
    contract.visualSignature,
    contract.relationshipSubtype,
    contract.layoutArchetype,
    contract.relationship
  ].map(lower).join(" ");
  if (/map|ecosystem|landscape|convergence/.test(fallback)) return "hub-map";
  if (/flow|timeline|gate|sequence|process/.test(fallback)) return "linear-timeline";
  if (/qa|evidence|agent|artifact/.test(fallback)) return "evidence-board";
  if (/loop|cycle|flywheel/.test(fallback)) return "center-loop";
  if (/compare|contrast|boundary|benefit/.test(fallback)) return "split-compare";
  return "unknown-preview-pattern";
}

function allowsEcho(contract, otherPage) {
  const echo = contract.echoWith || contract.intentionalEchoWith || [];
  const rationale = contract.echoRationale || contract.rhythmRationale || "";
  return (Array.isArray(echo) && echo.includes(otherPage)) || norm(rationale).length > 0;
}

function countBy(items, fn) {
  const map = new Map();
  for (const item of items) {
    const key = fn(item) || "unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function isContentPage(item) {
  return !["cover", "closing", "transition"].includes(lower(item.relationship));
}

function addFinding(list, severity, type, pages, message, suggestion) {
  list.push({ severity, type, pages, message, suggestion });
}

function main() {
  if (!fs.existsSync(input)) {
    console.error(`找不到布局蓝图文件：${input}`);
    process.exit(2);
  }

  const data = readJson(input);
  const all = data.contracts || data.pages || [];
  const content = all.filter(isContentPage);
  const findings = [];
  const warnings = [];

  const componentAudit = inspectBlueprintComponentContracts(all);
  componentAudit.errors.forEach(item => addFinding(
    findings,
    "error",
    item.type,
    [item.page],
    item.message,
    "candidateComponents 只能填写 component-index.min.json 中 selectable=true 的精确组件 ID；自由布局词移入 patternHints。"
  ));
  componentAudit.warnings.forEach(item => addFinding(
    warnings,
    "warning",
    item.type,
    [item.page],
    item.message,
    "迁移旧字段后重新生成真实组件候选预览。"
  ));

  for (const item of content) {
    if (!norm(item.skeletonFamily)) {
      addFinding(
        findings,
        "error",
        "missing-skeleton-family",
        [item.page],
        `页面缺少 skeletonFamily：${item.page}`,
        "在蓝图合同中显式填写 skeletonFamily，避免工具仅靠关键词误判版式家族。"
      );
    }
    if (!norm(item.previewPattern)) {
      addFinding(
        findings,
        "error",
        "missing-preview-pattern",
        [item.page],
        `页面缺少 previewPattern：${item.page}`,
        "在蓝图合同中显式填写 previewPattern。只写 visualSignature 不够，必须声明低保真预览最终会被画成哪一种形态。"
      );
    }
    const shape = shapeClassOf(item);
    if (!shape) {
      addFinding(
        warnings,
        "warning",
        "missing-shape-class",
        [item.page],
        `页面缺少 primaryShapeClass：${item.page}`,
        `声明主视觉形状类（受控枚举）：${SHAPE_CLASSES.join(" / ")}。用于整套比对"画出来是不是同一种形状"，占用特征审计看不见这一层。`
      );
    } else if (!SHAPE_CLASSES.includes(shape)) {
      addFinding(
        findings,
        "error",
        "invalid-shape-class",
        [item.page],
        `primaryShapeClass 取值非法：${item.page} -> ${shape}`,
        `只能取受控枚举之一：${SHAPE_CLASSES.join(" / ")}。不允许自造字符串，否则每页唯一、检查形同虚设。`
      );
    }
  }

  for (let i = 1; i < all.length; i++) {
    const prev = all[i - 1];
    const curr = all[i];
    if (!isContentPage(prev) || !isContentPage(curr)) continue;
    if (norm(prev.layoutArchetype) === norm(curr.layoutArchetype) && !allowsEcho(curr, prev.page)) {
      addFinding(
        warnings,
        "warning",
        "adjacent-archetype-repeat",
        [prev.page, curr.page],
        `相邻页面复用了同一个版面结构：${prev.page} / ${curr.page} -> ${norm(curr.layoutArchetype)}`,
        "检查它们是否属于有意系列/对照；如果叙事任务不同，再更换版面结构或补充 echoWith / echoRationale。"
      );
    }
    if (previewPatternOf(prev) === previewPatternOf(curr) && !allowsEcho(curr, prev.page)) {
      addFinding(
        warnings,
        "warning",
        "adjacent-preview-pattern-repeat",
        [prev.page, curr.page],
        `相邻页面在低保真预览中会落到同一渲染形态：${prev.page} / ${curr.page} -> ${previewPatternOf(curr)}`,
        "检查是否为有意系列；如果两页任务不同，再指定不同 previewPattern / skeletonFamily。"
      );
    }
  }

  for (let i = 0; i < all.length - 2; i++) {
    const run = all.slice(i, i + 3);
    if (!run.every(isContentPage)) continue;
    const families = run.map(familyOf);
    if (families.every((item) => item === families[0]) && families[0] !== "transition/brand") {
      const justified = run.slice(1).some((item, index) => allowsEcho(item, run[index].page));
      addFinding(
        justified ? warnings : findings,
        justified ? "warning" : "error",
        "three-page-family-run",
        run.map((item) => item.page),
        `连续三页属于同一粗版面结构家族：${pagesOf(run)} -> ${families[0]}`,
        justified ? "已说明系列/呼应关系，生产时仍需检查细节区分。" : "确认是否为有意系列；否则至少插入一个不同视觉寄存器。"
      );
    }
  }

  for (const [sig, pages] of countBy(content, (item) => norm(item.visualSignature))) {
    if (sig !== "unknown" && sig && pages.length > 1) {
      const allJustified = pages.every((page) => allowsEcho(page, pages[0].page));
      addFinding(
        warnings,
        "warning",
        "visual-signature-repeat",
        pages.map((page) => page.page),
        `visualSignature 重复：${sig} -> ${pagesOf(pages)}`,
        allJustified ? "已存在呼应说明，后续制作时仍需确保视觉细节有区分。" : "检查是否为有意系列；若页面关系不同，再改写 visualSignature 或补充理由。"
      );
    }
  }

  for (const [pattern, pages] of countBy(content, previewPatternOf)) {
    if (pattern !== "brand-transition" && pattern !== "unknown-preview-pattern" && pages.length > 1) {
      const allJustified = pages.every((page) => allowsEcho(page, pages[0].page));
      const ratio = pages.length / Math.max(content.length, 1);
      const blocking = pages.length >= 3 && ratio > 0.4 && !allJustified;
      addFinding(
        blocking ? findings : warnings,
        blocking ? "error" : "warning",
        "preview-pattern-repeat",
        pages.map((page) => page.page),
        `previewPattern 重复：${pattern} -> ${pagesOf(pages)}`,
        blocking ? "该形态占比过高；重新规划部分页面或补充真实系列/呼应理由。" : "检查是否为有意系列，并在生产时用内容、层级和证据形成区分。"
      );
    }
  }

  for (const [family, pages] of countBy(content, familyOf)) {
    const ratio = pages.length / Math.max(content.length, 1);
    if (family !== "transition/brand" && ratio > 0.25) {
      addFinding(
        warnings,
        "warning",
        "family-overuse",
        pages.map((page) => page.page),
        `粗版面结构家族占比偏高：${family} ${pages.length}/${content.length}`,
        "检查是否需要在章节内增加对比、证据、放大、矩阵或汇总型版式，避免整套 PPT 看起来都是同一种图。"
      );
    }
  }

  for (const [shape, pages] of countBy(content, shapeClassOf)) {
    if (!shape || shape === "unknown" || !SHAPE_CLASSES.includes(shape)) continue;
    if (shape === "cover" || shape === "big-type") continue; // 结构性形状允许复现（封面/大字收束）
    if (pages.length > 3) {
      addFinding(
        findings,
        "error",
        "shape-class-overuse",
        pages.map((page) => page.page),
        `同一主视觉形状类占用过多页面：${shape} -> ${pagesOf(pages)}（${pages.length} 页）`,
        "整套过度依赖同一种图形；给其中几页改换形状类，或明确说明这是有意系列并补 echo 理由。"
      );
    } else if (pages.length >= 2) {
      const allJustified = pages.every((page) => allowsEcho(page, pages[0].page));
      if (!allJustified) {
        addFinding(
          warnings,
          "warning",
          "shape-class-collision",
          pages.map((page) => page.page),
          `多页共用同一主视觉形状类：${shape} -> ${pagesOf(pages)}`,
          "这些页渲染出来容易撞形（占用特征审计查不到 gestalt）；生产时必须并排比对，确保信息层级与构图有实质区分。若为有意系列请补 echoWith / echoRationale。"
        );
      }
    }
  }

  const generic = content.filter((item) => /generic|fallback|plain-card-grid|default/.test(`${item.visualSignature || ""} ${item.layoutArchetype || ""}`.toLowerCase()));
  for (const item of generic) {
    addFinding(
      findings,
      "error",
      "generic-preview-pattern",
      [item.page],
      `页面仍存在通用/备用预览形态：${item.page}`,
      "补充更具体的 visualSignature 和 layoutArchetype，渲染器也需要有对应版面结构。"
    );
  }

  const verdict = findings.length ? "FIX-FIRST" : "PASS";
  const report = {
    version: "layout-blueprint-diversity-audit.v1",
    input: path.relative(root, input),
    verdict,
    summary: {
      totalPages: all.length,
      contentPages: content.length,
      errors: findings.length,
      warnings: warnings.length
    },
    findings,
    warnings
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2), "utf8");

  const lines = [
    "# 布局蓝图多样性审计",
    "",
    `- 结论：${verdict}`,
    `- 总页数：${all.length}`,
    `- 内容页：${content.length}`,
    `- 硬性问题：${findings.length}`,
    `- 提醒项：${warnings.length}`,
    "",
    "## 检查范围",
    "- 相邻页面是否复用同一个版面结构。",
    "- 连续三页是否属于同一粗版面结构家族。",
    "- visualSignature 是否重复且没有 echo 理由。",
    "- 某一粗版面结构家族是否占比过高。",
    "- 不同视觉签名是否被预览器画成同一种形态。",
    "- previewPattern 是否全页显式填写、是否在整套中重复使用。",
    "- primaryShapeClass 是否合法、是否多页撞形（受控枚举，粗于 skeletonFamily）。",
    "- candidateComponents 是否为真实可选组件，patternHints 是否与组件 ID 分离。",
    "- 是否存在 generic / fallback / plain-card-grid 备用形态。",
    "",
    "## 硬性问题"
  ];

  if (findings.length) {
    for (const item of findings) {
      lines.push(`- [${item.type}] ${item.message}`);
      lines.push(`  - 建议：${item.suggestion}`);
    }
  } else {
    lines.push("- 无硬性失败项。");
  }

  lines.push("", "## 提醒项");
  if (warnings.length) {
    for (const item of warnings) {
      lines.push(`- [${item.type}] ${item.message}`);
      lines.push(`  - 建议：${item.suggestion}`);
    }
  } else {
    lines.push("- 无提醒项。");
  }

  fs.writeFileSync(mdOut, lines.join("\n") + "\n", "utf8");

  console.log(mdOut);
  console.log(jsonOut);
  if (findings.length) process.exit(1);
}

main();
