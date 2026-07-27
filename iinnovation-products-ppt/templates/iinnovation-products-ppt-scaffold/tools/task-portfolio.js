// Plan a small adaptive portfolio of root tasks instead of one task per micro-step.
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const ROOT = path.join(__dirname, "..");
const FILE = path.join(ROOT, "state", "task-portfolio.json");

function arg(name, fallback = "") { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8"); }
function config() { try { return require(path.join(ROOT, "deck.config.js")); } catch { return {}; } }
function pageIds() {
  const base = path.join(ROOT, "pages");
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base).filter(dir => fs.existsSync(path.join(base, dir, "page.json"))).sort().map(dir => {
    const page = readJson(path.join(base, dir, "page.json"), {});
    return String(page.id || dir);
  });
}
function job(id, label, scope, goal, commands) {
  return { id, label, status: "pending", scope, goal, commands, tokenTarget: 180000, splitAtTokens: 160000 };
}
function planJobs(pages = [], options = {}) {
  // Single-task mode: the whole deck is one job, from brief to final build.
  const jobs = [job("job-1", "整片交付", { pages }, "在一个任务里完成 brief、逐页大纲、设计/术语/state、主题、布局蓝图、锚点、全量生产、渲染 QA、终验与 build。", ["node tools/run-phase.js status"])];
  jobs[0].status = "active";
  return jobs;
}
function create(force = false) {
  const existing = readJson(FILE, null);
  if (existing && !force) return existing;
  const cfg = config(), pages = pageIds(), budget = cfg.executionBudget || {};
  const value = {
    version: "leander-task-portfolio.v1",
    generatedAt: new Date().toISOString(),
    policy: {
      callBudgetMode: budget.callBudgetMode || "adaptive",
      preferredRootTasks: Number(budget.preferredRootTasks || 4),
      maxPlannedRootTasks: Number(budget.maxPlannedRootTasks || 6),
      conversationHardTotalTokens: Number(budget.conversationHardTotalTokens || 260000),
      fixedCallCap: null,
      fixedSubagentCap: null
    },
    jobs: planJobs(pages, budget),
    history: []
  };
  writeJson(FILE, value);
  return value;
}
function activeJob(value) { return (value.jobs || []).find(item => item.status === "active") || null; }
function advance(note = "completed at verified job boundary") {
  const value = readJson(FILE, null) || create();
  const current = activeJob(value);
  if (!current) return value;
  current.status = "completed";
  current.completedAt = new Date().toISOString();
  current.completionNote = note;
  const next = value.jobs.find(item => item.status === "pending");
  if (next) { next.status = "active"; next.startedAt = new Date().toISOString(); }
  value.history.push({ at: new Date().toISOString(), action: "advance", from: current.id, to: next?.id || "complete" });
  writeJson(FILE, value);
  return value;
}
function split(reason = "forecast exceeds safe execution budget") {
  const value = readJson(FILE, null) || create(), current = activeJob(value);
  if (!current) throw new Error("no active job to split");
  const index = value.jobs.indexOf(current), pages = current.scope?.pages || [];
  if (value.jobs.length >= value.policy.maxPlannedRootTasks) throw new Error(`portfolio already has ${value.jobs.length} jobs; max=${value.policy.maxPlannedRootTasks}`);
  const middle = Math.max(1, Math.ceil(pages.length / 2)), leftPages = pages.slice(0, middle), rightPages = pages.slice(middle);
  const left = { ...current, id: `${current.id}a`, label: `${current.label} A`, scope: { ...current.scope, pages: leftPages }, splitReason: reason };
  const right = { ...current, id: `${current.id}b`, label: `${current.label} B`, status: "pending", scope: { ...current.scope, pages: rightPages }, splitReason: reason };
  if (!pages.length) {
    left.goal = `${current.goal}（前半决策）`;
    right.goal = `${current.goal}（后半决策与收口）`;
  }
  value.jobs.splice(index, 1, left, right);
  value.history.push({ at: new Date().toISOString(), action: "split", job: current.id, reason });
  writeJson(FILE, value);
  return value;
}
function forecast(value = readJson(FILE, null) || create()) {
  const budget = readJson(path.join(ROOT, "state", "context-budget.json"), {}), current = activeJob(value);
  const cumulative = Number(budget.cumulativeTotalTokens || 0), pageCount = Number(current?.scope?.pages?.length || 0);
  return {
    activeJob: current?.id || "complete",
    cumulativeTotalTokens: cumulative,
    recommendSplit: false, // single-task mode: never split
    reason: "single-task mode"
  };
}
function summary(value) {
  const current = activeJob(value), done = (value.jobs || []).filter(item => item.status === "completed").length, f = forecast(value);
  return `Portfolio ${done}/${value.jobs.length} complete | active=${current?.id || "none"}${current?.scope?.pages?.length ? ` pages=${current.scope.pages.join(",")}` : ""} | split=${f.recommendSplit ? "recommended" : "no"}`;
}
function selfTest() {
  // Single-task mode: any deck is exactly one job.
  assert.equal(planJobs(Array.from({ length: 24 }, (_, i) => `p${String(i + 1).padStart(2, "0")}`)).length, 1);
  assert.equal(planJobs(Array.from({ length: 48 }, (_, i) => `p${i + 1}`)).length, 1);
  assert.equal(planJobs(["p01", "p02"]).length, 1);
  console.log("PASS task portfolio self-test");
}
function main() {
  if (process.argv.includes("--self-test")) return selfTest();
  const command = process.argv[2] || "status";
  const value = command === "create" ? create(process.argv.includes("--force"))
    : command === "advance" ? advance(arg("note", "completed at verified job boundary"))
    : command === "split" ? split(arg("reason", "forecast exceeds safe execution budget"))
    : command === "status" ? (readJson(FILE, null) || create()) : null;
  if (!value) throw new Error("usage: task-portfolio.js create|status|advance|split [--force] [--note text] [--reason text]");
  console.log(summary(value));
  if (process.argv.includes("--json")) console.log(JSON.stringify({ ...value, forecast: forecast(value) }, null, 2));
}
try { if (require.main === module) main(); } catch (error) { console.error(error.message); process.exit(1); }
module.exports = { planJobs, create, advance, split, forecast, activeJob, summary, selfTest };
