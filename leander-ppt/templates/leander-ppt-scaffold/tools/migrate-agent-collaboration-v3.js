// Migrate historical agent-collaboration evidence to the V3 schema without inventing review evidence.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const file = path.join(ROOT, "agent-collaboration.json");
const check = process.argv.includes("--check");
// Active roles. Legacy names (layout-architect-zh, presenter-zh) are intentionally
// absent: they are no longer triggered, and migrate() copies any pre-existing role
// entry through verbatim, so historical evidence in old projects is still preserved.
const roles = ["planner-zh", "visual-designer-zh", "component-curator-zh", "reviewer-zh"];
const artifacts = {
  "planner-zh": "outline.md",
  "visual-designer-zh": "agent-reviews/visual-designer-zh.md",
  "component-curator-zh": "agent-reviews/component-curator-zh.md",
  "reviewer-zh": "agent-reviews/reviewer-zh.md"
};
function read() { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return {}; } }
function blank(role) {
  return { status: "pending", action: "", event: "", phase: "", threadId: "", forkTurns: ["visual-designer-zh", "reviewer-zh"].includes(role) ? "none" : "", contextPolicy: ["visual-designer-zh", "component-curator-zh", "reviewer-zh"].includes(role) ? "compact-pack" : "", runId: "", eventDigest: "", inputDigest: "", outputDigest: "", artifact: artifacts[role], verdict: "", summary: "", reason: "", runs: [] };
}
function needsMigration(data) { return data.version !== "agent-collaboration.v3" || data.policy !== "event-driven.v3" || roles.some(role => !Array.isArray(data.roles?.[role]?.runs)); }
function migrate(data) {
  const migrated = { ...data, version: "agent-collaboration.v3", policy: "event-driven.v3", roles: { ...(data.roles || {}) } };
  roles.forEach(role => { migrated.roles[role] = { ...blank(role), ...(data.roles?.[role] || {}), runs: Array.isArray(data.roles?.[role]?.runs) ? data.roles[role].runs : [] }; });
  return migrated;
}
function main() {
  if (process.argv.includes("--self-test")) {
    const old = { version: "agent-collaboration.v2", policy: "event-driven.v2", roles: { "reviewer-zh": { status: "completed", threadId: "old-thread", verdict: "SHIP" } } };
    if (!needsMigration(old)) throw new Error("V2 evidence was not detected");
    const next = migrate(old);
    if (next.version !== "agent-collaboration.v3" || next.policy !== "event-driven.v3") throw new Error("V3 schema was not applied");
    if (next.roles["reviewer-zh"].threadId !== "old-thread" || next.roles["reviewer-zh"].status !== "completed") throw new Error("historical evidence was not preserved");
    if (!Array.isArray(next.roles["reviewer-zh"].runs) || next.roles["reviewer-zh"].eventDigest) throw new Error("migration fabricated or malformed V3 evidence");
    if (!next.roles["planner-zh"] || next.roles["planner-zh"].status !== "pending") throw new Error("missing roles were not initialized safely");
    console.log("PASS agent collaboration V3 migration self-test"); return;
  }
  const data = read(), needed = needsMigration(data);
  if (check) { if (needed) { console.error("agent-collaboration.json requires V3 migration"); process.exit(1); } console.log("agent-collaboration.json is V3"); return; }
  if (!needed) { console.log("Agent collaboration migration not required."); return; }
  const dir = path.join(ROOT, "state", "migrations");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.join(dir, `agent-collaboration-before-v3-${stamp}.json`);
  if (fs.existsSync(file)) fs.copyFileSync(file, backup);
  fs.writeFileSync(file, JSON.stringify(migrate(data), null, 2) + "\n", "utf8");
  console.log(`Migrated agent-collaboration.json to V3; prior evidence preserved at ${path.relative(ROOT, backup)}`);
  console.log("Historical evidence is retained, but missing V3 event digests and fresh anchor/final reviews must be recorded honestly before final delivery.");
}
if (require.main === module) main();
module.exports = { migrate, needsMigration };
