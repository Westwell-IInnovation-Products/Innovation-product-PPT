// Structured issue lifecycle. It never edits the shared Skill automatically.
// Commands: status | record | observe | promote | proposals
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
function arg(name, fallback = "") { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
const ROOT = path.resolve(arg("root", path.join(__dirname, "..")));
const FILE = path.join(ROOT, "state", "issues.json"), OUT = path.join(ROOT, "output");
function load() { try { return JSON.parse(fs.readFileSync(FILE, "utf8").replace(/^\uFEFF/, "")); } catch { return { version: "leander-issues.v1", issues: [] }; } }
function save(data) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n", "utf8"); }
function idFor(summary) { return `issue-${crypto.createHash("sha1").update(`${Date.now()}:${summary}`).digest("hex").slice(0, 10)}`; }
function now() { return new Date().toISOString(); }
function status(data) {
  const counts = data.issues.reduce((acc, item) => { acc[item.status] = (acc[item.status] || 0) + 1; return acc; }, {});
  console.log(JSON.stringify({ version: data.version, total: data.issues.length, counts, active: data.issues.filter(item => ["new", "active", "promoted"].includes(item.status)).map(item => ({ id: item.id, severity: item.severity, category: item.category, summary: item.summary, occurrences: item.occurrences, cleanRuns: item.cleanRuns, status: item.status })) }, null, 2));
}
function record(data) {
  const summary = arg("summary"), severity = arg("severity", "P2"), category = arg("category", "design"), scope = arg("scope", "page-specific");
  if (!summary) throw new Error("record requires --summary");
  const signature = arg("signature", `${category}:${summary}`), existing = data.issues.find(item => item.signature === signature && item.status !== "archived");
  if (existing) {
    existing.occurrences += 1; existing.cleanRuns = 0; existing.lastSeenAt = now(); existing.status = existing.occurrences >= 2 || severity === "P0" ? "active" : existing.status;
    if (arg("evidence")) existing.evidence = [...new Set([...(existing.evidence || []), arg("evidence")])];
    save(data); console.log(`updated ${existing.id}`); return;
  }
  const issue = {
    id: idFor(summary), signature, severity, category, scope, summary,
    rootCause: arg("root-cause"), abstraction: arg("abstraction"), target: arg("target"),
    evidence: arg("evidence") ? [arg("evidence")] : [], status: severity === "P0" ? "active" : "new",
    occurrences: 1, cleanRuns: 0, createdAt: now(), lastSeenAt: now(), promotedAt: null
  };
  data.issues.push(issue); save(data); console.log(`recorded ${issue.id}`);
}
function observe(data) {
  const id = arg("id"), result = arg("result");
  const issue = data.issues.find(item => item.id === id);
  if (!issue || !["recurrence", "clean"].includes(result)) throw new Error("observe requires valid --id and --result recurrence|clean");
  if (result === "recurrence") { issue.occurrences += 1; issue.cleanRuns = 0; issue.lastSeenAt = now(); if (issue.status === "new") issue.status = "active"; }
  else {
    issue.cleanRuns += 1;
    if (issue.status === "promoted" && issue.cleanRuns >= 3) issue.status = "stable";
    if (issue.status === "stable" && issue.cleanRuns >= 6) issue.status = "archived";
  }
  save(data); console.log(`${issue.id} -> ${issue.status}; occurrences=${issue.occurrences}; cleanRuns=${issue.cleanRuns}`);
}
function promote(data) {
  const id = arg("id"), target = arg("target");
  const issue = data.issues.find(item => item.id === id);
  if (!issue || !target) throw new Error("promote requires valid --id and --target");
  if (!(issue.abstraction || arg("abstraction"))) throw new Error("promote requires a de-identified --abstraction");
  issue.abstraction = issue.abstraction || arg("abstraction"); issue.target = target; issue.status = "promoted"; issue.promotedAt = now(); issue.cleanRuns = 0;
  save(data); console.log(`promoted ${issue.id} -> ${target}; shared Skill still requires manual patch and regression`);
}
function proposals(data) {
  const candidates = data.issues.filter(item => ["new", "active"].includes(item.status) && (item.severity === "P0" || item.occurrences >= 2) && item.scope !== "project-preference");
  const archive = data.issues.filter(item => (item.status === "stable" && item.cleanRuns >= 6) || item.status === "archived");
  const report = { version: "learning-proposals.v1", generatedAt: now(), promotionCandidates: candidates, archiveCandidates: archive };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "learning-proposals.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  const lines = ["# 经验提升候选", "", "## 建议提升", ...(candidates.length ? candidates.map(item => `- ${item.id} / ${item.severity} / ${item.summary} / 目标：${item.target || "待判断"}`) : ["- 无。"]), "", "## 建议归档", ...(archive.length ? archive.map(item => `- ${item.id} / ${item.summary}`) : ["- 无。"]), "", "这些条目只是候选，不会自动修改共享 Skill。"];
  fs.writeFileSync(path.join(OUT, "learning-proposals.md"), lines.join("\n") + "\n", "utf8");
  console.log(`wrote ${path.join(OUT, "learning-proposals.json")}`);
}
const data = load(), cmd = process.argv[2] || "status";
try {
  if (cmd === "status") status(data); else if (cmd === "record") record(data); else if (cmd === "observe") observe(data); else if (cmd === "promote") promote(data); else if (cmd === "proposals") proposals(data); else throw new Error("usage: issue-registry.js status|record|observe|promote|proposals");
} catch (error) { console.error(error.message); process.exit(1); }
