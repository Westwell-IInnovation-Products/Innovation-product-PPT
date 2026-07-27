// Preserve original user intent across Leander task handoffs.
//
// The immutable requirements contract is approved at Gate 1. The mutable
// coverage file proves that every active requirement reached a real artifact.
//
// Usage:
//   node tools/requirements-trace.js init --source-task <id> --source-snapshot <project-file>
//   node tools/requirements-trace.js seal
//   node tools/requirements-trace.js verify --stage <plan|resume|anchor|production|final>
//   node tools/requirements-trace.js status
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
function readJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; }
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}
function shaFile(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile()
    ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")
    : "";
}
function isHex(value) { return /^[a-f0-9]{64}$/i.test(String(value || "")); }
function rel(root, file) { return path.relative(root, file).replace(/\\/g, "/"); }
function safeProjectFile(root, value) {
  const target = path.resolve(root, String(value || ""));
  const relative = path.relative(root, target);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative) ? target : "";
}
function artifact(root, value) {
  const file = safeProjectFile(root, value);
  return file && fs.existsSync(file) && fs.statSync(file).isFile()
    ? { path: rel(root, file), sha256: shaFile(file) }
    : { path: String(value || ""), sha256: "" };
}
function contractFile(root) { return path.join(root, "state", "requirements-contract.json"); }
function coverageFile(root) { return path.join(root, "state", "requirements-coverage.json"); }
function pageDirs(root) {
  const pages = path.join(root, "pages");
  return fs.existsSync(pages)
    ? fs.readdirSync(pages, { withFileTypes: true }).filter(item => item.isDirectory()).map(item => item.name)
    : [];
}
function targetExists(root, target) {
  if (target === "deck") return true;
  const normalized = String(target || "").toLowerCase();
  return pageDirs(root).some(dir => dir.toLowerCase() === normalized || dir.toLowerCase().startsWith(`${normalized}-`));
}
function evidenceExists(root, values) {
  return Array.isArray(values) && values.length > 0 && values.every(value => {
    const file = safeProjectFile(root, value);
    return file && fs.existsSync(file);
  });
}

function initialize(root, options = {}) {
  const file = contractFile(root);
  const existing = readJson(file, null);
  const contract = existing?.version === "leander-requirements-contract.v1" ? existing : {
    version: "leander-requirements-contract.v1",
    status: "draft",
    createdAt: new Date().toISOString(),
    sourceContext: { sourceTasks: [], snapshots: [] },
    artifacts: {
      brief: { path: "brief.md", sha256: "" },
      outline: { path: "outline.md", sha256: "" }
    },
    requirements: []
  };
  const taskId = String(options.sourceTask || "").trim();
  if (taskId && !contract.sourceContext.sourceTasks.includes(taskId)) contract.sourceContext.sourceTasks.push(taskId);
  const snapshotValue = String(options.sourceSnapshot || "").trim();
  if (snapshotValue) {
    const snapshot = artifact(root, snapshotValue);
    if (!snapshot.sha256) throw new Error("source snapshot must be an existing file inside the project");
    const id = String(options.sourceId || `source-${contract.sourceContext.snapshots.length + 1}`).trim();
    const item = { id, type: "codex-conversation-snapshot", taskId, ...snapshot };
    const existingIndex = contract.sourceContext.snapshots.findIndex(value => value.id === id);
    if (existingIndex >= 0) contract.sourceContext.snapshots[existingIndex] = item;
    else contract.sourceContext.snapshots.push(item);
  }
  writeJson(file, contract);
  if (!fs.existsSync(coverageFile(root))) {
    writeJson(coverageFile(root), {
      version: "leander-requirements-coverage.v1",
      contractSha256: "",
      updatedAt: new Date().toISOString(),
      items: []
    });
  }
  return contract;
}

function structuralErrors(root, contract, { requireReady = false } = {}) {
  const errors = [];
  if (!contract || contract.version !== "leander-requirements-contract.v1") {
    return ["state/requirements-contract.json must use leander-requirements-contract.v1"];
  }
  if (requireReady && contract.status !== "ready") errors.push("requirements contract must be sealed with status=ready");
  const snapshots = Array.isArray(contract.sourceContext?.snapshots) ? contract.sourceContext.snapshots : [];
  if (!snapshots.length) errors.push("at least one project-local source conversation/message snapshot is required");
  const sourceIds = new Set();
  snapshots.forEach((item, index) => {
    const label = `sourceContext.snapshots[${index}]`;
    if (!String(item.id || "").trim() || sourceIds.has(item.id)) errors.push(`${label}.id must be unique`);
    sourceIds.add(item.id);
    const file = safeProjectFile(root, item.path);
    if (!file || !fs.existsSync(file)) errors.push(`${label}.path is missing or outside the project`);
    else if (!isHex(item.sha256) || shaFile(file) !== item.sha256) errors.push(`${label} content hash changed`);
    if (!String(item.taskId || "").trim()) errors.push(`${label}.taskId is required`);
  });
  const requirements = Array.isArray(contract.requirements) ? contract.requirements : [];
  if (!requirements.length) errors.push("requirements[] must preserve the original objectives and acceptance criteria");
  const requirementIds = new Set();
  requirements.forEach((item, index) => {
    const label = `requirements[${index}]`;
    if (!String(item.id || "").trim() || requirementIds.has(item.id)) errors.push(`${label}.id must be unique`);
    requirementIds.add(item.id);
    if (String(item.text || "").trim().length < 8) errors.push(`${label}.text is too short`);
    if (!["objective", "content", "asset", "constraint", "acceptance"].includes(item.category)) errors.push(`${label}.category is invalid`);
    if (!["must", "should"].includes(item.priority)) errors.push(`${label}.priority must be must or should`);
    if (!["active", "deferred", "removed"].includes(item.disposition)) errors.push(`${label}.disposition is invalid`);
    const refs = Array.isArray(item.sourceIds) ? item.sourceIds : [];
    if (!refs.length || refs.some(id => !sourceIds.has(id))) errors.push(`${label}.sourceIds must reference captured source snapshots`);
    if (item.disposition === "active") {
      if (!Array.isArray(item.plannedTargets) || !item.plannedTargets.length) errors.push(`${label}.plannedTargets is required for active requirements`);
      if (String(item.acceptance || "").trim().length < 6) errors.push(`${label}.acceptance is required for active requirements`);
    } else {
      const decision = item.scopeDecision || {};
      if (String(decision.reason || "").trim().length < 6) errors.push(`${label}.scopeDecision.reason is required`);
      if (!sourceIds.has(decision.sourceId)) errors.push(`${label}.scopeDecision.sourceId must reference explicit user evidence`);
      if (String(decision.explicitUserWording || "").trim().length < 4) errors.push(`${label}.scopeDecision.explicitUserWording is required`);
    }
  });
  return errors;
}

function seal(root) {
  const file = contractFile(root);
  const contract = readJson(file, null);
  const preliminary = structuralErrors(root, contract, { requireReady: false });
  if (preliminary.length) throw new Error(`REQUIREMENTS CONTRACT BLOCKED:\n- ${preliminary.join("\n- ")}`);
  contract.artifacts = {
    brief: artifact(root, contract.artifacts?.brief?.path || "brief.md"),
    outline: artifact(root, contract.artifacts?.outline?.path || "outline.md")
  };
  if (!contract.artifacts.brief.sha256 || !contract.artifacts.outline.sha256) {
    throw new Error("brief.md and outline.md must exist before sealing the requirements contract");
  }
  contract.status = "ready";
  contract.sealedAt = new Date().toISOString();
  writeJson(file, contract);
  const prior = readJson(coverageFile(root), {});
  const priorById = new Map((prior.items || []).map(item => [item.requirementId, item]));
  const items = contract.requirements.map(requirement => priorById.get(requirement.id) || {
    requirementId: requirement.id,
    status: requirement.disposition === "active" ? "pending" : "not-applicable",
    evidencePaths: [],
    note: ""
  });
  writeJson(coverageFile(root), {
    version: "leander-requirements-coverage.v1",
    contractSha256: shaFile(file),
    updatedAt: new Date().toISOString(),
    items
  });
  return contract;
}

function inspect(root, stage = "plan") {
  const contract = readJson(contractFile(root), null);
  const requireReady = ["plan", "resume", "handoff", "anchor", "production", "final"].includes(stage);
  const errors = structuralErrors(root, contract, { requireReady });
  if (contract?.version === "leander-requirements-contract.v1" && requireReady) {
    for (const name of ["brief", "outline"]) {
      const item = contract.artifacts?.[name] || {};
      const file = safeProjectFile(root, item.path);
      if (!file || !fs.existsSync(file)) errors.push(`contract artifact ${name} is missing`);
      else if (!isHex(item.sha256) || shaFile(file) !== item.sha256) errors.push(`contract artifact ${name} changed after sealing`);
    }
  }
  const coverage = readJson(coverageFile(root), null);
  if (!coverage || coverage.version !== "leander-requirements-coverage.v1") {
    errors.push("state/requirements-coverage.json must use leander-requirements-coverage.v1");
  } else if (contract && coverage.contractSha256 !== shaFile(contractFile(root))) {
    errors.push("requirements coverage is not bound to the current requirements contract");
  }
  const coverageById = new Map((coverage?.items || []).map(item => [item.requirementId, item]));
  const active = (contract?.requirements || []).filter(item => item.disposition === "active");
  if (["production", "final"].includes(stage)) {
    active.filter(item => item.category === "asset").forEach(item => {
      const covered = coverageById.get(item.id);
      if (!covered || covered.status !== "covered" || !evidenceExists(root, covered.evidencePaths)) {
        errors.push(`required asset is not available with project-local evidence: ${item.id}`);
      }
    });
  }
  if (stage === "final") {
    active.forEach(item => {
      const covered = coverageById.get(item.id);
      if (!covered || covered.status !== "covered") errors.push(`active requirement is not covered: ${item.id}`);
      else if (!evidenceExists(root, covered.evidencePaths)) errors.push(`active requirement lacks current evidence paths: ${item.id}`);
      (item.plannedTargets || []).forEach(target => {
        if (!targetExists(root, target)) errors.push(`planned target does not exist in the final deck: ${item.id} -> ${target}`);
      });
    });
  }
  return {
    ok: errors.length === 0,
    errors,
    contract,
    coverage,
    summary: {
      total: contract?.requirements?.length || 0,
      active: active.length,
      deferred: (contract?.requirements || []).filter(item => item.disposition === "deferred").length,
      removed: (contract?.requirements || []).filter(item => item.disposition === "removed").length,
      covered: (coverage?.items || []).filter(item => item.status === "covered").length
    }
  };
}
function verify(root, stage) {
  const result = inspect(root, stage);
  if (!result.ok) throw new Error(`REQUIREMENTS TRACE BLOCKED (${stage}):\n- ${result.errors.join("\n- ")}`);
  return result;
}
function status(root) {
  const result = inspect(root, "plan");
  return { ok: result.ok, summary: result.summary, errors: result.errors };
}

function selfTest() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "leander-requirements-"));
  try {
    fs.mkdirSync(path.join(temp, "source"), { recursive: true });
    fs.mkdirSync(path.join(temp, "pages", "p01-intent"), { recursive: true });
    fs.mkdirSync(path.join(temp, "pages", "p02-proof"), { recursive: true });
    fs.writeFileSync(path.join(temp, "brief.md"), "# Brief\nPreserve the original decision question.\n");
    fs.writeFileSync(path.join(temp, "outline.md"), "# Outline\np01 intent\np02 proof\n");
    fs.writeFileSync(path.join(temp, "source", "conversation.md"), "User requires decision logic and a real screenshot.\n");
    initialize(temp, { sourceTask: "thread-1", sourceSnapshot: "source/conversation.md", sourceId: "src-original" });
    const contract = readJson(contractFile(temp));
    contract.requirements = [
      {
        id: "req-decision", text: "Explain the original decision question and recommendation.",
        category: "content", priority: "must", sourceIds: ["src-original"], disposition: "active",
        plannedTargets: ["p01"], acceptance: "The final page answers the decision question."
      },
      {
        id: "req-screenshot", text: "Use a real approval screenshot rather than a simulated interface.",
        category: "asset", priority: "must", sourceIds: ["src-original"], disposition: "active",
        plannedTargets: ["p02"], acceptance: "A project-local screenshot file is used as evidence."
      }
    ];
    writeJson(contractFile(temp), contract);
    seal(temp);
    if (!inspect(temp, "plan").ok) throw new Error("sealed plan contract must pass");
    if (inspect(temp, "production").ok) throw new Error("missing required asset must block production");
    fs.writeFileSync(path.join(temp, "pages", "p01-intent", "page.json"), "{}\n");
    fs.writeFileSync(path.join(temp, "pages", "p02-proof", "page.json"), "{}\n");
    fs.writeFileSync(path.join(temp, "source", "approval.png"), "png-evidence");
    const coverage = readJson(coverageFile(temp));
    coverage.items.find(item => item.requirementId === "req-screenshot").status = "covered";
    coverage.items.find(item => item.requirementId === "req-screenshot").evidencePaths = ["source/approval.png"];
    writeJson(coverageFile(temp), coverage);
    if (!inspect(temp, "production").ok) throw new Error("available required asset must pass production");
    if (inspect(temp, "final").ok) throw new Error("uncovered active requirement must block final");
    coverage.items.find(item => item.requirementId === "req-decision").status = "covered";
    coverage.items.find(item => item.requirementId === "req-decision").evidencePaths = ["pages/p01-intent/page.json"];
    writeJson(coverageFile(temp), coverage);
    if (!inspect(temp, "final").ok) throw new Error("covered requirements must pass final");
    fs.appendFileSync(path.join(temp, "source", "conversation.md"), "changed\n");
    if (inspect(temp, "plan").ok) throw new Error("changed source snapshot must invalidate the contract");
    console.log("PASS requirements trace self-test");
  } finally {
    if (path.dirname(temp) === path.resolve(os.tmpdir())) fs.rmSync(temp, { recursive: true, force: true });
  }
}

if (require.main === module) {
  const root = path.resolve(arg("root", path.join(__dirname, "..")));
  const command = process.argv[2] || "status";
  try {
    if (process.argv.includes("--self-test")) selfTest();
    else if (command === "init") {
      const value = initialize(root, { sourceTask: arg("source-task"), sourceSnapshot: arg("source-snapshot"), sourceId: arg("source-id") });
      console.log(`Initialized requirements contract: sources=${value.sourceContext.snapshots.length}; requirements=${value.requirements.length}`);
    } else if (command === "seal") {
      const value = seal(root);
      console.log(`Sealed requirements contract: requirements=${value.requirements.length}; sha256=${shaFile(contractFile(root))}`);
    } else if (command === "verify") {
      const stage = arg("stage", "plan");
      const result = verify(root, stage);
      console.log(`PASS requirements trace (${stage}): active=${result.summary.active}; covered=${result.summary.covered}`);
    } else if (command === "status") console.log(JSON.stringify(status(root), null, 2));
    else throw new Error("usage: requirements-trace.js init|seal|verify --stage <stage>|status");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { initialize, seal, inspect, verify, status, shaFile, safeProjectFile, selfTest };
