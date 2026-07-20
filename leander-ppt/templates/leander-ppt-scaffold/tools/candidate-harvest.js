// Collect reusable-component signals and materialize agent-reviewed proposals.
// This tool writes only project output and the user's contribution inbox; it never edits the shared Skill.
const fs = require("fs");
const os = require("os");
const path = require("path");

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; }
}
function inside(root, target) {
  const base = path.resolve(root).replace(/[\\/]+$/, "") + path.sep;
  return path.resolve(target).startsWith(base);
}
function safeText(value, fallback = "") {
  return String(value == null ? fallback : value).replace(/[<>&]/g, char => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[char]));
}
function discoverSignals(root) {
  const signals = [];
  const pagesRoot = path.join(root, "pages");
  if (fs.existsSync(pagesRoot)) {
    for (const dir of fs.readdirSync(pagesRoot).sort()) {
      const meta = readJson(path.join(pagesRoot, dir, "page.json"));
      if (!meta) continue;
      const selected = meta.visualSelection?.selectedRoute || {};
      if (selected.route === "page-specific-custom" || meta.visualSelection?.requiresCuratorReview === true) {
        signals.push({
          type: selected.route === "page-specific-custom" ? "custom-route" : "low-confidence-selection",
          pageId: meta.id || dir,
          relationship: meta.relationship || meta.visualSelection?.relationship || "unknown",
          name: selected.name || meta.component || "custom-composition",
          source: `pages/${dir}/page.json`
        });
      }
    }
  }
  const promotionDir = path.join(root, "components", "promotion-candidates");
  if (fs.existsSync(promotionDir)) {
    for (const file of fs.readdirSync(promotionDir).filter(name => name.endsWith(".js")).sort()) {
      signals.push({ type: "explicit-component-source", name: path.basename(file, ".js"), source: `components/promotion-candidates/${file}` });
    }
  }
  const issues = readJson(path.join(root, "state", "issues.json"), { issues: [] });
  for (const issue of issues.issues || []) {
    if (issue.category === "component" && ["new", "active", "promoted"].includes(issue.status) && (issue.occurrences >= 2 || issue.severity === "P0")) {
      signals.push({ type: "repeated-component-issue", issueId: issue.id, name: issue.summary, source: "state/issues.json" });
    }
  }
  return signals;
}
function requiredCandidateFields(candidate) {
  const fields = [
    "id", "name", "contributor", "version", "level", "relationships", "tags", "density", "editable", "composable",
    "relationPrimitive", "expressionCapability", "semanticBindings", "slots", "variants", "avoidWhen", "qaRisks",
    "themeTokensUsed", "contentCapacity", "themeCompatibility", "designReviewPriority"
  ];
  return fields.filter(field => candidate?.[field] == null || candidate[field] === "");
}
function normalizeCandidate(candidate) {
  return {
    ...candidate,
    status: "candidate",
    route: "component-library",
    metadataSource: "agent-proposed",
    metadataReviewStatus: "pending",
    selectionConfidenceCap: Math.min(Number(candidate.selectionConfidenceCap || 0.4), 0.5),
    designStatus: "review-required"
  };
}
function previewSvg(candidate) {
  const title = safeText(candidate.name);
  const relation = safeText(candidate.relationPrimitive);
  const slots = safeText((candidate.slots || []).slice(0, 6).join(" · "));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#F6F3EE"/>
  <rect x="80" y="76" width="800" height="388" rx="24" fill="#FFFFFF" stroke="#9AA5B1"/>
  <text x="120" y="156" font-family="Arial" font-size="34" font-weight="700" fill="#1F3A5F">${title}</text>
  <text x="120" y="208" font-family="Arial" font-size="20" fill="#D71920">${relation}</text>
  <line x1="120" y1="246" x2="840" y2="246" stroke="#D7DCE2" stroke-width="2"/>
  <text x="120" y="304" font-family="Arial" font-size="18" fill="#52606D">Agent-generated candidate preview</text>
  <text x="120" y="352" font-family="Arial" font-size="18" fill="#52606D">Slots: ${slots}</text>
  <text x="120" y="414" font-family="Arial" font-size="16" fill="#7B8794">Production use remains blocked until curator review and dual-theme rendering.</text>
</svg>
`;
}
function proposalReadme(candidate, proposal) {
  const evidence = Array.isArray(proposal.evidence) ? proposal.evidence.map(item => `- ${item}`).join("\n") : "- Agent extraction report";
  return `# ${candidate.name}\n\n${candidate.expressionCapability}\n\n## Generic slots\n\n${candidate.slots.map(item => `- ${item}`).join("\n")}\n\n## Promotion evidence\n\n${evidence}\n\nThis bundle is an agent-generated candidate. It is not production-ready until curator approval and dual-theme review.\n`;
}
function materializeProposal(root, proposal, contributionRoot) {
  const candidate = normalizeCandidate(proposal.candidate || {});
  const missing = requiredCandidateFields(candidate);
  if (missing.length) throw new Error(`proposal ${candidate.id || "unknown"} missing candidate fields: ${missing.join(", ")}`);
  if (proposal.decision !== "submit") return { id: candidate.id, status: "skipped", reason: proposal.decision || "no-decision" };
  if (proposal.review?.status !== "pass" || !proposal.review?.evidenceDigest) {
    return { id: candidate.id, status: "review-required", reason: "independent review evidence is missing" };
  }
  const source = path.resolve(root, proposal.componentSource || "");
  if (!inside(root, source) || !fs.existsSync(source) || path.extname(source).toLowerCase() !== ".js") {
    throw new Error(`proposal ${candidate.id} has an unsafe or missing componentSource`);
  }
  const destination = path.resolve(contributionRoot, candidate.id);
  if (!inside(contributionRoot, destination)) throw new Error(`unsafe contribution destination for ${candidate.id}`);
  if (fs.existsSync(destination)) return { id: candidate.id, status: "exists", destination };
  fs.mkdirSync(destination, { recursive: true });
  fs.copyFileSync(source, path.join(destination, "component.js"));
  fs.writeFileSync(path.join(destination, "candidate.json"), `${JSON.stringify(candidate, null, 2)}\n`, "utf8");
  const previewSource = proposal.previewSource ? path.resolve(root, proposal.previewSource) : null;
  if (previewSource && inside(root, previewSource) && fs.existsSync(previewSource) && path.extname(previewSource).toLowerCase() === ".svg") {
    fs.copyFileSync(previewSource, path.join(destination, "preview.svg"));
  } else {
    fs.writeFileSync(path.join(destination, "preview.svg"), previewSvg(candidate), "utf8");
  }
  fs.writeFileSync(path.join(destination, "README.md"), proposalReadme(candidate, proposal), "utf8");
  fs.writeFileSync(path.join(destination, ".agent-review.json"), `${JSON.stringify({
    schemaVersion: "leander-candidate-agent-review.v1",
    extractionMode: proposal.extractionMode || "component-curator",
    status: proposal.review.status,
    evidenceDigest: proposal.review.evidenceDigest,
    riskHint: proposal.riskHint || "curator-review"
  }, null, 2)}\n`, "utf8");
  return { id: candidate.id, status: "materialized", destination };
}
function harvest(options = {}) {
  const root = path.resolve(options.root || path.join(__dirname, ".."));
  const contributionRoot = path.resolve(options.contributionRoot || path.join(os.homedir(), ".codex", "leander-contributions"));
  const proposalFile = path.join(root, "state", "component-candidate-proposals.json");
  const proposalDoc = readJson(proposalFile, { schemaVersion: "leander-component-proposals.v1", proposals: [] });
  const signals = discoverSignals(root);
  const proposals = Array.isArray(proposalDoc.proposals) ? proposalDoc.proposals : [];
  const materialized = options.materialize ? proposals.map(proposal => materializeProposal(root, proposal, contributionRoot)) : [];
  const report = {
    schemaVersion: "leander-candidate-harvest.v1",
    generatedAt: new Date().toISOString(),
    signals,
    proposalCount: proposals.length,
    materialized,
    agentActionRequired: signals.length > 0 && proposals.length === 0,
    nextAction: signals.length > 0 && proposals.length === 0
      ? "Use component-curator extraction mode to decide submit/skip and write state/component-candidate-proposals.json."
      : "Review materialized candidate results and leave production promotion to a human curator."
  };
  if (options.write) {
    const output = path.join(root, "output");
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(path.join(output, "candidate-harvest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    const lines = ["# 组件候选收集", "", `- 信号：${signals.length}`, `- Agent 提案：${proposals.length}`, `- 已物化：${materialized.filter(item => item.status === "materialized").length}`, `- 下一步：${report.nextAction}`];
    fs.writeFileSync(path.join(output, "candidate-harvest.md"), `${lines.join("\n")}\n`, "utf8");
  }
  return report;
}
function selfTest() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "leander-harvest-test-"));
  const contributionRoot = fs.mkdtempSync(path.join(os.tmpdir(), "leander-harvest-inbox-"));
  fs.mkdirSync(path.join(root, "pages", "p01-custom"), { recursive: true });
  fs.mkdirSync(path.join(root, "components", "promotion-candidates"), { recursive: true });
  fs.mkdirSync(path.join(root, "state"), { recursive: true });
  fs.writeFileSync(path.join(root, "pages", "p01-custom", "page.json"), JSON.stringify({ id: "p01", relationship: "comparison", visualSelection: { selectedRoute: { route: "page-specific-custom", name: "custom-comparison" } } }));
  fs.writeFileSync(path.join(root, "components", "promotion-candidates", "comparisonBand.js"), "module.exports={name:'comparisonBand',create(){return function(){}}};\n");
  const candidate = {
    id: "comparison-band", name: "comparisonBand", contributor: "analyst-a", version: "0.1.0", level: "layout-block",
    relationships: ["comparison"], tags: ["comparison", "evidence"], density: "medium", editable: "yes", composable: "yes",
    relationPrimitive: "comparison", expressionCapability: "compare two evidence groups in one horizontal band", semanticBindings: ["option comparison"],
    slots: ["left", "right", "takeaway"], variants: ["base"], avoidWhen: ["there is only one group"], qaRisks: ["uneven density"],
    themeTokensUsed: ["colors.primary", "colors.accent"], contentCapacity: { maxItems: 6 }, themeCompatibility: ["leander-base", "leander-global"], designReviewPriority: "P1"
  };
  fs.writeFileSync(path.join(root, "state", "component-candidate-proposals.json"), JSON.stringify({ schemaVersion: "leander-component-proposals.v1", proposals: [{ decision: "submit", componentSource: "components/promotion-candidates/comparisonBand.js", candidate, evidence: ["used in two relationship pages"], review: { status: "pass", evidenceDigest: "sha256:test" } }] }));
  const report = harvest({ root, contributionRoot, write: true, materialize: true });
  if (report.signals.length < 2 || report.materialized[0]?.status !== "materialized" || !fs.existsSync(path.join(contributionRoot, "comparison-band", "candidate.json"))) throw new Error("candidate harvest self-test failed");
  console.log("PASS candidate harvest self-test");
}

if (require.main === module) {
  try {
    if (process.argv.includes("--self-test")) selfTest();
    else console.log(JSON.stringify(harvest({ root: arg("root"), contributionRoot: arg("contribution-root"), write: process.argv.includes("--write"), materialize: process.argv.includes("--materialize") }), null, 2));
  } catch (error) { console.error(error.message); process.exit(1); }
}

module.exports = { discoverSignals, normalizeCandidate, materializeProposal, harvest, previewSvg };
