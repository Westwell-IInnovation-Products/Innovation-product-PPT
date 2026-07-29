// Guard content-baseline authority for revisions of an existing editable deck.
// Usage: node tools/revision-mode.js init <delta-revision|full-rebuild> [--note <text>] [--explicit-user-evidence <text>]
//        node tools/revision-mode.js verify | status
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

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}

function stableHash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function listFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [], stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "out") stack.push(target);
      } else if (!/^(?:qa-result\.json|qa\.md)$/i.test(entry.name)) files.push(target);
    }
  }
  return files.sort();
}

const VISUAL_CHANGE_PATTERN = /(layout|design|visual|theme|style|shadow|elevation|line|rule|connector|card|rail|radius|colour|color|composition|archetype|shape|region|panel|surface|spacing|typography|版式|布局|设计|视觉|主题|风格|阴影|层级|线条|连线|卡片|状态条|圆角|颜色|构图|原型|形状|分区|面板|间距|字体)/i;

function pageVisualSignature(pageJson = {}) {
  const fidelity = pageJson.themeFidelity || {};
  const visualSelection = pageJson.visualSelection || {};
  const route = pageJson.selectedRoute || visualSelection.selectedRoute || pageJson.route || {};
  return stable({
    theme: fidelity.theme || pageJson.theme || "",
    archetype: fidelity.archetype || pageJson.archetype || "",
    features: Array.isArray(fidelity.features) ? [...fidelity.features].sort() : [],
    primaryShapeClass: pageJson.primaryShapeClass || visualSelection.primaryShapeClass || fidelity.primaryShapeClass || "",
    skeletonFamily: pageJson.skeletonFamily || visualSelection.skeletonFamily || fidelity.skeletonFamily || "",
    selectedRoute: typeof route === "string" ? route : {
      route: route.route || route.type || "",
      name: route.name || route.component || ""
    }
  });
}

function implementationVisualSignature(source = "") {
  const structuralCalls = [
    "surface", "card", "panel", "insetRow", "barCard", "statusCard",
    "line", "connector", "timeline", "processTimeline", "pipelineFlow", "processFlow",
    "swimlane", "matrix", "tree", "hierarchy", "semanticRail", "conclusionBand",
    "evidenceBoard", "base2GovernanceChain", "engineeringVariableTable", "deltaCompare"
  ];
  const calls = Object.fromEntries(structuralCalls.map(name => [
    name,
    (source.match(new RegExp(`\\b(?:ui\\.)?${name}\\s*\\(`, "g")) || []).length
  ]).filter(([, count]) => count > 0));
  const shapeClasses = [...new Set([
    ...(source.match(/ShapeType\.([A-Za-z0-9_]+)/g) || []).map(value => value.split(".")[1]),
    ...(source.match(/\b(?:diamond|hexagon|chevron|arc|ellipse|triangle|rect|roundRect)\b/g) || [])
  ])].sort();
  return stable({
    calls,
    shapeClasses,
    shadowTrue: (source.match(/\bshadow\s*:\s*true\b/g) || []).length,
    shadowFalse: (source.match(/\bshadow\s*:\s*false\b/g) || []).length,
    railDisabled: (source.match(/\brail\s*:\s*false\b/g) || []).length
  });
}

function treeHash(root) {
  const files = listFiles(root).map(file => [
    path.relative(root, file).replace(/\\/g, "/"),
    shaFile(file)
  ]);
  return stableHash(files);
}

function visualSystemSnapshot(root) {
  const files = ["DESIGN.md", "visual-direction.md", "theme-contract.md"];
  return {
    files: Object.fromEntries(files.map(file => [file, shaFile(path.join(root, file))])),
    themeTreeSha256: treeHash(path.join(root, "theme")),
    componentTreeSha256: treeHash(path.join(root, "components"))
  };
}

function pageSnapshot(root, dir) {
  const pageDir = path.join(root, "pages", dir);
  const pageJsonFile = path.join(pageDir, "page.json");
  const pageJsFile = path.join(pageDir, "page.js");
  const pageJson = readJson(pageJsonFile, {});
  const pageSource = fs.existsSync(pageJsFile) ? fs.readFileSync(pageJsFile, "utf8") : "";
  const pageContract = Object.fromEntries(Object.entries(pageJson).filter(([key]) => key !== "qaProfile"));
  const assets = listFiles(pageDir)
    .filter(file => !["page.js", "page.json"].includes(path.basename(file).toLowerCase()))
    .map(file => [path.relative(pageDir, file).replace(/\\/g, "/"), shaFile(file)]);
  return {
    pageJsSha256: shaFile(pageJsFile),
    pageJsonSha256: shaFile(pageJsonFile),
    pageContractSha256: stableHash(pageContract),
    assetTreeSha256: stableHash(assets),
    visualSignature: pageVisualSignature(pageJson),
    implementationVisualSignature: implementationVisualSignature(pageSource)
  };
}

function sameSnapshot(a, b) {
  return !!a && !!b
    && a.pageJsSha256 === b.pageJsSha256
    && (a.pageContractSha256 && b.pageContractSha256
      ? a.pageContractSha256 === b.pageContractSha256
      : a.pageJsonSha256 === b.pageJsonSha256)
    && a.assetTreeSha256 === b.assetTreeSha256;
}

function pageIds(root) {
  const pages = path.join(root, "pages");
  if (!fs.existsSync(pages)) return [];
  return fs.readdirSync(pages, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
}

function initialize(root, mode, options = {}) {
  if (!["delta-revision", "full-rebuild"].includes(mode)) throw new Error("revision mode must be delta-revision or full-rebuild");
  const ids = pageIds(root);
  if (!ids.length) throw new Error("revision mode requires an existing pages baseline");
  const explicitEvidence = String(options.explicitEvidence || "").trim();
  if (mode === "full-rebuild" && explicitEvidence.length < 8) {
    throw new Error("full-rebuild requires --explicit-user-evidence with the user's explicit authorization");
  }
  const note = String(options.note || "").trim();
  const contract = {
    version: "leander-revision-contract.v2",
    mode,
    status: "draft",
    createdAt: new Date().toISOString(),
    baseline: {
      pageCount: ids.length,
      pageIds: ids,
      pages: Object.fromEntries(ids.map(id => [id, pageSnapshot(root, id)])),
      visualSystem: visualSystemSnapshot(root),
      source: note || "existing editable pages"
    },
    authorization: {
      explicitFullRebuild: mode === "full-rebuild",
      evidence: mode === "full-rebuild" ? explicitEvidence : note || "Existing-deck revision; full rebuild not authorized."
    },
    scopes: {
      editScope: mode === "delta-revision" ? ["modify", "add", "delete", "reorder"] : ["all-current-pages"],
      finalValidationScope: "all-current-pages"
    },
    pageMap: mode === "delta-revision" ? ids.map(id => ({
      sourcePage: id,
      targetPage: id,
      operation: "preserve",
      change: [],
      preserve: ["Preserve the existing implementation unless explicit feedback requires a change."]
    })) : []
  };
  writeJson(path.join(root, "state", "revision-contract.json"), contract);
  return contract;
}

function changeText(item) {
  return Array.isArray(item?.change) ? item.change.join(" ") : String(item?.change || "");
}

function classifyVisualImpact(root, contract) {
  const map = Array.isArray(contract?.pageMap) ? contract.pageMap : [];
  const affected = map.filter(item => ["modify", "add", "reorder"].includes(item.operation));
  const declaredVisualPages = affected
    .filter(item => VISUAL_CHANGE_PATTERN.test(changeText(item)))
    .map(item => item.targetPage || item.sourcePage)
    .filter(Boolean);
  const signatureChanges = [];
  for (const item of affected) {
    if (!item.sourcePage || !item.targetPage) continue;
    const baselinePage = contract?.baseline?.pages?.[item.sourcePage];
    if (!baselinePage?.visualSignature || !fs.existsSync(path.join(root, "pages", item.targetPage))) continue;
    const currentPage = pageSnapshot(root, item.targetPage);
    const metadataChanged = stableHash(baselinePage.visualSignature) !== stableHash(currentPage.visualSignature);
    const implementationChanged = baselinePage.implementationVisualSignature
      ? stableHash(baselinePage.implementationVisualSignature) !== stableHash(currentPage.implementationVisualSignature)
      : false;
    if (metadataChanged || implementationChanged) {
      signatureChanges.push({
        sourcePage: item.sourcePage,
        targetPage: item.targetPage,
        metadataChanged,
        implementationChanged,
        declared: VISUAL_CHANGE_PATTERN.test(changeText(item))
      });
    }
  }
  const baselineSystem = contract?.baseline?.visualSystem;
  const currentSystem = visualSystemSnapshot(root);
  const sharedSystemChanged = !!baselineSystem && stableHash(baselineSystem) !== stableHash(currentSystem);
  const baselineCount = Number(contract?.baseline?.pageCount || 0);
  const wide = declaredVisualPages.length >= 3
    && baselineCount > 0
    && declaredVisualPages.length / baselineCount >= 0.35;
  const hasPageVisual = declaredVisualPages.length > 0 || signatureChanges.length > 0;
  const level = sharedSystemChanged ? "shared-system"
    : wide ? "deck-wide"
      : hasPageVisual ? "page-level"
        : "content-only";
  return {
    level,
    declaredVisualPages: [...new Set(declaredVisualPages)].sort(),
    signatureChanges,
    sharedSystemChanged,
    wide,
    requiresFreshAnchor: sharedSystemChanged || wide,
    requiresFullDeckVisualReview: sharedSystemChanged || wide,
    requiresFreshThemeBlueprint: sharedSystemChanged
  };
}

function freshCheckpointErrors(root, contract, visualImpact) {
  const errors = [];
  if (!visualImpact.requiresFreshAnchor) return errors;
  const state = readJson(path.join(root, "state", "run-state.json"), {});
  const receipt = readJson(path.join(root, "workflow-receipt.json"), {});
  const checkpoints = readJson(path.join(root, "checkpoint-status.json"), {}).checkpoints || {};
  const runId = state.runId || receipt.runId || "";
  const createdAt = Date.parse(contract.createdAt || "");
  const requireFresh = (key, label) => {
    const item = checkpoints[key] || {};
    const approvedAt = Date.parse(item.approvedAt || "");
    if (item.status !== "approved") errors.push(`${label} must be approved after a wide/shared visual revision`);
    if (!runId || (item.approvalReceiptRunId || item.runId) !== runId) errors.push(`${label} approval must belong to the current runId`);
    if (!Number.isFinite(createdAt) || !Number.isFinite(approvedAt) || approvedAt <= createdAt) {
      errors.push(`${label} approval must be fresh after revision-contract.createdAt`);
    }
  };
  requireFresh("anchorSample", "anchorSample");
  if (visualImpact.requiresFreshThemeBlueprint) {
    requireFresh("theme", "theme");
    requireFresh("layoutBlueprint", "layoutBlueprint");
  }
  return errors;
}

function inspect(root, options = {}) {
  const contract = readJson(path.join(root, "state", "revision-contract.json"), null);
  const errors = [];
  if (!contract) return { ok: false, errors: ["state/revision-contract.json is missing"], contract: null };
  if (contract.version !== "leander-revision-contract.v2") errors.push("revision contract version must be leander-revision-contract.v2");
  if (!["delta-revision", "full-rebuild"].includes(contract.mode)) errors.push("mode must be delta-revision or full-rebuild");
  if (contract.scopes && contract.scopes.finalValidationScope !== "all-current-pages") errors.push("finalValidationScope must be all-current-pages");
  const baselineIds = Array.isArray(contract.baseline?.pageIds) ? contract.baseline.pageIds : [];
  if (!baselineIds.length) errors.push("baseline.pageIds must contain the existing page baseline");
  if (contract.baseline?.pageCount !== baselineIds.length) errors.push("baseline.pageCount must equal baseline.pageIds length");
  if (new Set(baselineIds).size !== baselineIds.length) errors.push("baseline.pageIds must be unique");
  const baselinePages = contract.baseline?.pages || {};
  baselineIds.forEach(id => {
    const snap = baselinePages[id];
    if (!snap || !/^[a-f0-9]{64}$/i.test(snap.pageJsSha256 || "") || !/^[a-f0-9]{64}$/i.test(snap.pageJsonSha256 || "") || !/^[a-f0-9]{64}$/i.test(snap.assetTreeSha256 || "")) {
      errors.push(`baseline page ${id} lacks valid page/content hashes`);
    }
    if (snap?.pageContractSha256 && !/^[a-f0-9]{64}$/i.test(snap.pageContractSha256)) errors.push(`baseline page ${id} has invalid pageContractSha256`);
  });

  if (contract.mode === "full-rebuild") {
    if (contract.authorization?.explicitFullRebuild !== true) errors.push("full-rebuild requires authorization.explicitFullRebuild=true");
    if (String(contract.authorization?.evidence || "").trim().length < 8) errors.push("full-rebuild requires explicit user evidence");
  }

  if (contract.mode === "delta-revision") {
    if (contract.authorization?.explicitFullRebuild === true) errors.push("delta-revision cannot claim full-rebuild authorization");
    const allowed = new Set(["preserve", "modify", "reorder", "delete", "add"]);
    const map = Array.isArray(contract.pageMap) ? contract.pageMap : [];
    if (!map.length) errors.push("delta-revision requires a non-empty pageMap");
    const sourceCounts = new Map();
    const targetCounts = new Map();
    map.forEach((item, index) => {
      const label = `pageMap[${index}]`;
      if (!allowed.has(item.operation)) errors.push(`${label}.operation is invalid`);
      if (item.operation === "add") {
        if (item.sourcePage !== null) errors.push(`${label} add must use sourcePage=null`);
      } else if (!baselineIds.includes(item.sourcePage)) {
        errors.push(`${label}.sourcePage is not in baseline.pageIds`);
      } else {
        sourceCounts.set(item.sourcePage, (sourceCounts.get(item.sourcePage) || 0) + 1);
      }
      if (item.operation === "delete") {
        if (item.targetPage !== null) errors.push(`${label} delete must use targetPage=null`);
      } else if (typeof item.targetPage !== "string" || !item.targetPage.trim()) {
        errors.push(`${label}.targetPage is required for non-delete operations`);
      } else {
        targetCounts.set(item.targetPage, (targetCounts.get(item.targetPage) || 0) + 1);
      }
      if (item.operation === "modify" && (!Array.isArray(item.change) || !Array.isArray(item.preserve))) {
        errors.push(`${label} modify must declare change[] and preserve[]`);
      }
    });
    baselineIds.forEach(id => {
      if ((sourceCounts.get(id) || 0) !== 1) errors.push(`baseline page ${id} must appear exactly once in pageMap`);
    });
    targetCounts.forEach((count, id) => { if (count !== 1) errors.push(`target page ${id} must be unique`); });

    if (options.enforceDiff === true && !errors.length) {
      const currentIds = pageIds(root);
      const mappedTargets = new Set(map.filter(item => item.operation !== "delete").map(item => item.targetPage));
      currentIds.filter(id => !mappedTargets.has(id)).forEach(id => errors.push(`unmapped page exists: ${id}`));
      map.forEach(item => {
        const before = item.sourcePage ? baselinePages[item.sourcePage] : null;
        const targetExists = item.targetPage ? currentIds.includes(item.targetPage) : false;
        const current = targetExists ? pageSnapshot(root, item.targetPage) : null;
        if (item.operation === "preserve") {
          if (!targetExists) errors.push(`preserve page missing: ${item.sourcePage}`);
          else if (item.sourcePage !== item.targetPage) errors.push(`preserve page target changed: ${item.sourcePage} -> ${item.targetPage}`);
          else if (!sameSnapshot(before, current)) errors.push(`preserve page changed: ${item.sourcePage}`);
        } else if (item.operation === "modify") {
          if (!targetExists) errors.push(`modify page missing: ${item.targetPage}`);
          else if (sameSnapshot(before, current)) errors.push(`modify page has no actual change: ${item.sourcePage}`);
        } else if (item.operation === "delete") {
          if (currentIds.includes(item.sourcePage)) errors.push(`delete page still exists: ${item.sourcePage}`);
        } else if (item.operation === "add") {
          if (!targetExists) errors.push(`add page missing: ${item.targetPage}`);
        } else if (item.operation === "reorder") {
          if (!targetExists) errors.push(`reordered target missing: ${item.targetPage}`);
          if (item.sourcePage === item.targetPage) errors.push(`reorder must change target page id: ${item.sourcePage}`);
        }
      });
    }
    const visualImpact = classifyVisualImpact(root, contract);
    visualImpact.signatureChanges
      .filter(item => !item.declared)
      .forEach(item => errors.push(`visual signature changed without a visual change declaration: ${item.sourcePage} -> ${item.targetPage}`));
    if (options.enforceDiff === true) errors.push(...freshCheckpointErrors(root, contract, visualImpact));
    return { ok: errors.length === 0, errors, contract, visualImpact };
  }
  return {
    ok: errors.length === 0,
    errors,
    contract,
    visualImpact: contract.mode === "full-rebuild"
      ? {
        level: "full-rebuild",
        declaredVisualPages: pageIds(root),
        signatureChanges: [],
        sharedSystemChanged: true,
        wide: true,
        requiresFreshAnchor: true,
        requiresFullDeckVisualReview: true,
        requiresFreshThemeBlueprint: true
      }
      : classifyVisualImpact(root, contract)
  };
}

function verify(root, options = {}) {
  const result = inspect(root, options);
  if (!result.ok) throw new Error(`REVISION MODE BLOCKED:\n- ${result.errors.join("\n- ")}`);
  return result.contract;
}
function upgradeContract(root) {
  const file = path.join(root, "state", "revision-contract.json");
  const contract = readJson(file, null);
  if (!contract || contract.version !== "leander-revision-contract.v2") throw new Error("upgrade-contract requires leander-revision-contract.v2");
  const baselineIds = contract.baseline?.pageIds || [];
  const operationBySource = new Map((contract.pageMap || []).map(item => [item.sourcePage, item.operation]));
  for (const id of baselineIds) {
    const before = contract.baseline.pages?.[id], current = pageSnapshot(root, id);
    if (!before) throw new Error(`baseline page missing: ${id}`);
    if (before.pageContractSha256) continue;
    const operation = operationBySource.get(id);
    if (operation === "preserve" || operation === "reorder") {
      if (before.pageJsSha256 !== current.pageJsSha256 || before.assetTreeSha256 !== current.assetTreeSha256) {
        throw new Error(`cannot upgrade changed ${operation} baseline page: ${id}`);
      }
      before.pageContractSha256 = current.pageContractSha256;
    }
  }
  contract.scopes = contract.scopes || { editScope: ["modify", "add", "delete", "reorder"], finalValidationScope: "all-current-pages" };
  contract.baseline.visualSystem = contract.baseline.visualSystem || visualSystemSnapshot(root);
  for (const id of baselineIds) {
    const before = contract.baseline.pages?.[id];
    if (before && !before.visualSignature && fs.existsSync(path.join(root, "pages", id, "page.json"))) {
      before.visualSignature = pageVisualSignature(readJson(path.join(root, "pages", id, "page.json"), {}));
    }
    if (before && !before.implementationVisualSignature && fs.existsSync(path.join(root, "pages", id, "page.js"))) {
      before.implementationVisualSignature = implementationVisualSignature(fs.readFileSync(path.join(root, "pages", id, "page.js"), "utf8"));
    }
  }
  writeJson(file, contract);
  return contract;
}

function selfTest() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "leander-revision-mode-"));
  try {
    fs.mkdirSync(path.join(temp, "pages", "p01-a"), { recursive: true });
    fs.mkdirSync(path.join(temp, "pages", "p02-b"), { recursive: true });
    ["p01-a", "p02-b"].forEach(id => {
      fs.writeFileSync(path.join(temp, "pages", id, "page.js"), `module.exports={id:${JSON.stringify(id)}};\n`, "utf8");
      fs.writeFileSync(path.join(temp, "pages", id, "page.json"), JSON.stringify({
        id,
        themeFidelity: { theme: "base2", archetype: "process", features: ["meaningful-rule-integration"] },
        primaryShapeClass: "rounded-panel",
        selectedRoute: { route: "component-library", name: "timeline" }
      }) + "\n", "utf8");
    });
    if (inspect(temp).ok) throw new Error("missing contract must fail");
    const delta = initialize(temp, "delta-revision", { note: "Revise the existing deck from user feedback." });
    if (!inspect(temp).ok || delta.pageMap.length !== 2 || delta.version !== "leander-revision-contract.v2") throw new Error("complete delta contract must pass");
    const qaOnly = readJson(path.join(temp, "pages", "p02-b", "page.json"), {});
    qaOnly.qaProfile = { version: "qa-profile.zh.v2", rulesVersion: "qa-rules.zh.v3" };
    fs.writeFileSync(path.join(temp, "pages", "p02-b", "page.json"), JSON.stringify(qaOnly) + "\n", "utf8");
    if (!inspect(temp, { enforceDiff: true }).ok) throw new Error("QA-only page metadata migration must not mutate the content baseline");
    fs.appendFileSync(path.join(temp, "pages", "p01-a", "page.js"), "\n// unauthorized change\n");
    const preserveMutation = inspect(temp, { enforceDiff: true });
    if (preserveMutation.ok || !preserveMutation.errors.some(item => /preserve page changed/.test(item))) throw new Error("preserve page mutation must fail");
    fs.writeFileSync(path.join(temp, "pages", "p01-a", "page.js"), `module.exports={id:"p01-a"};\n`, "utf8");
    const resetDelta = initialize(temp, "delta-revision", { note: "Reset baseline." });
    resetDelta.pageMap[0].operation = "modify";
    resetDelta.pageMap[0].change = ["Change p01."];
    resetDelta.pageMap[0].preserve = ["Keep page identity."];
    writeJson(path.join(temp, "state", "revision-contract.json"), resetDelta);
    const unchangedModify = inspect(temp, { enforceDiff: true });
    if (unchangedModify.ok || !unchangedModify.errors.some(item => /modify page has no actual change/.test(item))) throw new Error("unchanged modify page must fail");
    const visuallyChanged = readJson(path.join(temp, "pages", "p01-a", "page.json"), {});
    visuallyChanged.primaryShapeClass = "diamond";
    fs.writeFileSync(path.join(temp, "pages", "p01-a", "page.json"), JSON.stringify(visuallyChanged) + "\n", "utf8");
    const undeclaredVisual = inspect(temp, { enforceDiff: true });
    if (undeclaredVisual.ok || !undeclaredVisual.errors.some(item => /visual signature changed without/.test(item))) throw new Error("undeclared visual signature change must fail");
    resetDelta.pageMap[0].change = ["Change layout and primary shape while preserving content."];
    writeJson(path.join(temp, "state", "revision-contract.json"), resetDelta);
    const declaredVisual = inspect(temp, { enforceDiff: true });
    if (!declaredVisual.visualImpact.declaredVisualPages.includes("p01-a")) throw new Error("declared page visual impact must be classified");
    const implementationDelta = initialize(temp, "delta-revision", { note: "Test source-level visual drift." });
    implementationDelta.pageMap[1].operation = "modify";
    implementationDelta.pageMap[1].change = ["Rewrite the body copy."];
    implementationDelta.pageMap[1].preserve = ["Keep the current layout and component structure."];
    writeJson(path.join(temp, "state", "revision-contract.json"), implementationDelta);
    fs.appendFileSync(path.join(temp, "pages", "p02-b", "page.js"), "\nui.line(slide, 0, 0, 1, 1);\n");
    const undeclaredImplementation = inspect(temp, { enforceDiff: true });
    if (undeclaredImplementation.ok || !undeclaredImplementation.visualImpact.signatureChanges.some(item => item.implementationChanged && !item.declared)) {
      throw new Error("source-level visual structure change must require a visual declaration");
    }
    const sharedSystemDelta = initialize(temp, "delta-revision", { note: "Test shared visual-system change." });
    writeJson(path.join(temp, "state", "revision-contract.json"), sharedSystemDelta);
    fs.writeFileSync(path.join(temp, "DESIGN.md"), "# Changed design system\n", "utf8");
    const sharedSystemResult = inspect(temp, { enforceDiff: true });
    if (sharedSystemResult.ok
      || sharedSystemResult.visualImpact.level !== "shared-system"
      || !sharedSystemResult.errors.some(item => /anchorSample must be approved/.test(item))
      || !sharedSystemResult.errors.some(item => /theme must be approved/.test(item))
      || !sharedSystemResult.errors.some(item => /layoutBlueprint must be approved/.test(item))) {
      throw new Error("shared visual-system change must require fresh theme, blueprint, and anchor approvals");
    }
    delta.pageMap.pop();
    writeJson(path.join(temp, "state", "revision-contract.json"), delta);
    if (inspect(temp).ok) throw new Error("incomplete baseline coverage must fail");
    let rejected = false;
    try { initialize(temp, "full-rebuild", { explicitEvidence: "" }); } catch { rejected = true; }
    if (!rejected) throw new Error("full rebuild without explicit evidence must fail");
    initialize(temp, "full-rebuild", { explicitEvidence: "User explicitly requested a full rebuild from scratch." });
    if (!inspect(temp).ok) throw new Error("authorized full rebuild must pass");
    console.log("PASS revision-mode self-test");
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
      const contract = initialize(root, process.argv[3], { note: arg("note"), explicitEvidence: arg("explicit-user-evidence") });
      console.log(`Initialized ${contract.mode} contract for ${contract.baseline.pageCount} baseline pages.`);
    } else if (command === "upgrade-contract") {
      const contract = upgradeContract(root);
      console.log(`Upgraded revision contract semantic hashes for ${contract.baseline.pageCount} pages.`);
    } else if (command === "verify") {
      const result = inspect(root, { enforceDiff: arg("intent") !== "redesign" });
      if (!result.ok) throw new Error(`REVISION MODE BLOCKED:\n- ${result.errors.join("\n- ")}`);
      console.log(`PASS revision mode: ${result.contract.mode}; baseline=${result.contract.baseline.pageCount}; map=${result.contract.pageMap.length}; visualImpact=${result.visualImpact.level}`);
    } else if (command === "status") {
      const result = inspect(root);
      console.log(JSON.stringify({ ok: result.ok, mode: result.contract?.mode || null, visualImpact: result.visualImpact || null, errors: result.errors }, null, 2));
      if (!result.ok) process.exitCode = 1;
    } else throw new Error("usage: revision-mode.js init <delta-revision|full-rebuild>|upgrade-contract|verify|status");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  initialize,
  inspect,
  verify,
  upgradeContract,
  pageIds,
  pageSnapshot,
  pageVisualSignature,
  implementationVisualSignature,
  visualSystemSnapshot,
  classifyVisualImpact,
  sameSnapshot,
  stableHash,
  shaFile,
  selfTest
};
