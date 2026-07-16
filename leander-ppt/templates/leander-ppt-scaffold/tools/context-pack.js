// Compact, event-bounded context pack. It prints by default and overwrites one
// stable state/context-pack.json only when --write is requested.
// Usage:
//   node tools/context-pack.js --mode status
//   node tools/context-pack.js --mode repair --pages p11,p12
//   node tools/context-pack.js --mode agent --role reviewer-zh --pages p11,p12
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { classifyPage } = require("./render-risk");

function arg(name, fallback = "") { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
const ROOT = path.resolve(arg("root", path.join(__dirname, "..")));
const PAGES = path.join(ROOT, "pages");
const mode = arg("mode", "status"), role = arg("role", ""), pagesArg = arg("pages", "");
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function readText(file, fallback = "") { try { return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""); } catch { return fallback; } }
function rel(file) { return path.relative(ROOT, file).replace(/\\/g, "/"); }
function exists(file) { return fs.existsSync(file); }
function pageDirs() { return exists(PAGES) ? fs.readdirSync(PAGES).filter(dir => exists(path.join(PAGES, dir, "page.json"))).sort() : []; }
function requestedPages() { return pagesArg ? new Set(pagesArg.split(",").map(item => item.trim().toLowerCase()).filter(Boolean)) : null; }
function pageId(dir, meta) { return String(meta.id || meta.page || (dir.match(/^p\d+/i) || [dir])[0]).toLowerCase(); }
function summarizePage(dir) {
  const pageDir = path.join(PAGES, dir), meta = readJson(path.join(pageDir, "page.json"), {}), id = pageId(dir, meta);
  const selected = meta.visualSelection?.selectedRoute || {};
  const result = readJson(path.join(pageDir, "qa-result.json"), {});
  const trace = readJson(path.join(pageDir, "out", "component-trace.json"), {});
  const warningFields = ["quality-baseline-audit.json", "render-diversity-audit.json"].flatMap(name => (readJson(path.join(ROOT, "output", name), {}).warnings || []))
    .filter(item => String(item.page || "").toLowerCase() === id).map(item => String(item.field || item.code || "warning"));
  const risk = classifyPage(meta, warningFields);
  return {
    id, dir, title: meta.title || "", takeaway: meta.takeaway || meta.visualSelection?.intent || "", relationship: meta.qaProfile?.relationship || meta.visualSelection?.relationship || "",
    blueprintRef: meta.blueprintRef || meta.visualSelection?.blueprintRef || "",
    route: selected.route ? `${selected.route}/${selected.name || ""}` : "",
    qa: result.verdict || "MISSING", trace: trace.version ? "present" : "missing",
    highRisk: risk.fullSizeRequired,
    riskReasons: risk.reasons,
    curatorReview: meta.visualSelection?.requiresCuratorReview === true,
    files: {
      contract: rel(path.join(pageDir, "page.json")), implementation: rel(path.join(pageDir, "page.js")),
      render: rel(path.join(pageDir, "out", `${id}.png`)), qaResult: rel(path.join(pageDir, "qa-result.json"))
    }
  };
}
function checkpointSummary() {
  const data = readJson(path.join(ROOT, "checkpoint-status.json"), {});
  return Object.fromEntries(Object.entries(data.checkpoints || {}).map(([name, item]) => [name, { status: item.status || "pending", mode: item.mode || "" }]));
}
function stateSummary() {
  const run = readJson(path.join(ROOT, "state", "run-state.json"), {});
  return { phase: run.currentPhase || "", gate: run.currentGate || "", nextAction: run.nextAction || "", activeDecisions: (run.activeDecisions || []).slice(0, 5) };
}
function roleSummary() {
  const data = readJson(path.join(ROOT, "agent-collaboration.json"), {});
  return Object.fromEntries(Object.entries(data.roles || {}).map(([name, item]) => [name, { status: item.status || "pending", event: item.event || "", verdict: item.verdict || "" }]));
}
function roleReads(roleName, pages) {
  const riskPages = pages.filter(page => page.highRisk);
  const reviewPages = (riskPages.length ? riskPages : pages).slice(0, 6);
  const failedPages = pages.filter(page => !["PASS", "SHIP", "READY"].includes(String(page.qa || "").toUpperCase()));
  const pageContracts = reviewPages.map(page => page.files.contract);
  const renders = (riskPages.length ? riskPages : pages).map(page => page.files.render);
  const common = ["role-briefs.md", `agents/${roleName || "<role>"}.md`, "state/context-pack.json or this stdout packet"];
  const map = {
    "planner-zh": ["brief.md", "outline.md", "terminology.json"],
    "layout-architect-zh": ["outline.md", "layout-blueprint.json", "output/layout-blueprint-preview.svg", "output/layout-blueprint-risk-preview.svg", "output/layout-blueprint-preview-qa.md"],
    "visual-designer-zh": ["DESIGN.md", "visual-direction.md", "quality-target.json", "state/agent-event-plan.json", "output/render-quality-evidence.json", "output/render-diversity-audit.json", "output/anchor-samples-contact-sheet.svg", "output/full-deck-contact-sheet.png", "output/full-deck-contact-sheet.svg", ...renders],
    "component-curator-zh": ["tools/component-index.min.json", "layout-blueprint.json", ...pages.filter(page => page.curatorReview).map(page => page.files.contract)],
    "reviewer-zh": ["outline.md", "quality-target.json", "state/agent-event-plan.json", "output/render-quality-evidence.json", "output/render-diversity-audit.json", "output/anchor-samples-contact-sheet.svg", "output/full-deck-contact-sheet.png", "output/full-deck-contact-sheet.svg", "output/quality-baseline-audit.md", ...pageContracts, ...renders, ...failedPages.map(page => page.files.qaResult)],
    "presenter-zh": ["outline.md", "speaker-notes.md", "output/full-deck-contact-sheet.png"]
  };
  return [...common, ...(map[roleName] || pageContracts)].filter((item, index, list) => item && list.indexOf(item) === index);
}
function readCost(item) {
  if (/context-pack\.json or this stdout packet/i.test(item)) return { path: item, exists: true, bytes: 0, estimatedTextTokens: 0 };
  const file = path.join(ROOT, item);
  const visual = /\.(?:png|jpe?g|webp|svg)$/i.test(item);
  const bytes = exists(file) && fs.statSync(file).isFile() ? fs.statSync(file).size : 0;
  return { path: item, exists: exists(file), bytes, estimatedTextTokens: visual ? 0 : Math.ceil(bytes / 4), openMode: visual ? "visual-tool-only" : "text" };
}
function budgetFor() {
  if (mode === "status") return 3000;
  if (mode === "repair") return 10000;
  if (mode === "agent") return 16000;
  return 20000;
}
function recommendedReads(stage, pages) {
  if (mode === "agent") return roleReads(role, pages);
  if (mode === "status") return ["checkpoint-status.json", "state/run-state.json", "artifact-manifest.md"];
  if (stage === "layout-blueprint") return [
    "checkpoint-status.json", "layout-blueprint.md", "layout-blueprint.json",
    "output/layout-blueprint-preview.svg", "output/layout-blueprint-risk-preview.svg",
    "output/layout-blueprint-preview-qa.md", "output/layout-blueprint-preview-lint.md",
    "output/layout-blueprint-diversity-audit.md", "artifact-manifest.md"
  ];
  if (mode === "repair") return ["state/context-pack.json or this stdout packet", ...pages.flatMap(page => Object.values(page.files)), "only the selected component source"];
  if (mode === "qa") return ["tools/qa-rules.zh.json", "output/contact sheet or selected renders", ...pages.map(page => page.files.qaResult)];
  return ["checkpoint-status.json", "state/run-state.json", "artifact-manifest.md"];
}
function build() {
  const cfg = exists(path.join(ROOT, "deck.config.js")) ? require(path.join(ROOT, "deck.config.js")) : {};
  const stage = cfg.workflow?.stage || "", request = requestedPages();
  const allPages = pageDirs().map(summarizePage);
  const activePages = new Set(cfg.workflow?.activePages || []);
  const scopedPages = activePages.size
    ? allPages.filter(page => activePages.has(page.id) || activePages.has(page.dir))
    : allPages;
  const preProduction = ["outline-reset", "layout-blueprint"].includes(stage);
  const pages = request ? scopedPages.filter(page => request.has(page.id) || request.has(page.dir.toLowerCase())) : (preProduction ? [] : scopedPages);
  const pack = {
    version: "leander-context-pack.v3", generatedAt: new Date().toISOString(), mode, role,
    deck: { name: cfg.name || "", theme: cfg.theme || "", stage, deckType: cfg.deckType || "general" },
    checkpoints: checkpointSummary(), state: stateSummary(), selectedPages: pages,
    stalePageFolders: preProduction ? allPages.length : Math.max(0, allPages.length - scopedPages.length),
    agents: mode === "status" || mode === "agent" ? roleSummary() : undefined,
    recommendedReads: recommendedReads(stage, pages)
  };
  pack.readPlan = pack.recommendedReads.map(readCost);
  pack.contextBudget = {
    maxEstimatedTextTokens: budgetFor(),
    recommendedEstimatedTextTokens: pack.readPlan.reduce((sum, item) => sum + item.estimatedTextTokens, 0),
    rule: "Start from state/phase-handoff.json in a fresh task. Do not replay task history or open visual assets as text. Expand beyond recommendedReads only after naming the missing decision or changed shared dependency."
  };
  const compact = JSON.stringify(pack);
  pack.packet = { sha256: crypto.createHash("sha256").update(compact).digest("hex"), bytes: Buffer.byteLength(compact), estimatedTokens: Math.ceil(Buffer.byteLength(compact) / 4) };
  return pack;
}
function markdown(pack) {
  const lines = [
    `# 上下文包（${pack.mode}${pack.role ? ` / ${pack.role}` : ""}）`, "",
    `- Deck：${pack.deck.name || "未命名"}`, `- 阶段：${pack.deck.stage || "未设置"}`, `- 选中页面：${pack.selectedPages.length}`, `- 上下文包估算 Token：${pack.packet.estimatedTokens}`,
    `- 建议文本读取预算：${pack.contextBudget.recommendedEstimatedTextTokens} / ${pack.contextBudget.maxEstimatedTextTokens}`
  ];
  if (pack.stalePageFolders) lines.push(`- 保留但禁止生产的旧页面目录：${pack.stalePageFolders}`);
  lines.push("", "## 页面", "| 页面 | 标题 | 核心主张 | 关系 | 路线 | QA |", "|---|---|---|---|---|---|");
  pack.selectedPages.forEach(page => lines.push(`| ${page.id} | ${page.title} | ${String(page.takeaway || "-").replace(/\|/g, "/")} | ${page.relationship || "-"} | ${page.route || "-"} | ${page.qa} |`));
  if (!pack.selectedPages.length) lines.push("| - | 当前阶段不读取旧页面 | - | - | - | - |");
  lines.push("", "## 下一步读取", ...pack.recommendedReads.map(item => `- ${item}`));
  return lines.join("\n") + "\n";
}

const pack = build();
if (process.argv.includes("--strict") && pack.contextBudget.recommendedEstimatedTextTokens > pack.contextBudget.maxEstimatedTextTokens) {
  console.error(`Context budget exceeded: ${pack.contextBudget.recommendedEstimatedTextTokens} > ${pack.contextBudget.maxEstimatedTextTokens}`);
  process.exit(1);
}
if (process.argv.includes("--write")) {
  const target = path.join(ROOT, "state", "context-pack.json");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(pack, null, 2) + "\n", "utf8");
}
if (process.argv.includes("--json")) console.log(JSON.stringify(pack, null, 2));
else process.stdout.write(markdown(pack));
