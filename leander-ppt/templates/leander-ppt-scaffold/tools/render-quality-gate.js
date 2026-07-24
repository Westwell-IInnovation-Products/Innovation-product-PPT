// Hash-bound rendered quality evidence. This gate cannot judge taste by itself;
// it proves that the required independent reviews inspected the current renders
// and supplied page-grounded full-size observations.
//
// Usage:
//   node tools/render-quality-gate.js capture
//   node tools/render-quality-gate.js record --role visual-designer-zh --artifact agent-reviews/visual-designer-zh.md --agent-receipt state/agent-run-receipts/visual-designer-zh.json --inspection output/visual-designer-full-size.json --verdict PASS --pages all --full-size p09,p13
//   node tools/render-quality-gate.js record --role reviewer-zh --artifact agent-reviews/reviewer-zh.md --agent-receipt state/agent-run-receipts/reviewer-zh.json --inspection output/reviewer-full-size.json --verdict SHIP --pages all --full-size all --overall SHIP
//   node tools/render-quality-gate.js verify
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ROOT = path.join(__dirname, "..");
const PAGES = path.join(ROOT, "pages");
const OUTPUT = path.join(ROOT, "output");
const FILE = path.join(OUTPUT, "render-quality-evidence.json");
const cfg = require(path.join(ROOT, "deck.config.js"));
const { classifyPage } = require("./render-risk");
const EVIDENCE_VERSION = "render-quality-evidence.v4";
const INSPECTION_VERSION = "full-size-inspection.v2";
const REQUIRED_OBSERVATION_KINDS = ["geometry", "composition", "semantics", "readability"];

function arg(name, fallback = "") { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function sha(file) {
  try { return fs.existsSync(file) && fs.statSync(file).isFile() ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") : ""; }
  catch { return ""; }
}
const VOLATILE_KEYS = new Set(["generatedAt", "capturedAt", "syncedAt", "updatedAt", "verifiedAt", "recordedAt", "startedAt", "completedAt", "timestamp"]);
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
function stripVolatile(value) {
  if (Array.isArray(value)) return value.map(stripVolatile);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([key]) => !VOLATILE_KEYS.has(key)).map(([key, item]) => [key, stripVolatile(item)]));
  }
  return value;
}
function semanticJsonSha(file) {
  const value = readJson(file);
  return value ? crypto.createHash("sha256").update(JSON.stringify(stable(stripVolatile(value)))).digest("hex") : sha(file);
}
function inspectionEvidenceDigest(value) {
  const evidence = JSON.parse(JSON.stringify(value));
  delete evidence.agentRunReceiptSha256;
  return crypto.createHash("sha256").update(JSON.stringify(stable(evidence))).digest("hex");
}
function inspectionEvidenceSha(file) {
  const value = readJson(file);
  return value ? inspectionEvidenceDigest(value) : sha(file);
}
function rel(file) { return path.relative(ROOT, file).replace(/\\/g, "/"); }
function pageDirs() {
  const all = fs.existsSync(PAGES) ? fs.readdirSync(PAGES).filter(dir => fs.existsSync(path.join(PAGES, dir, "page.json"))).sort() : [];
  if (cfg.workflow?.stage === "production") return all;
  const active = new Set(cfg.workflow?.activePages || []);
  return active.size ? all.filter(dir => active.has(dir) || active.has(String(readJson(path.join(PAGES, dir, "page.json"), {}).id || ""))) : all;
}
function contactSheet() {
  const names = cfg.workflow?.stage === "anchor-sample"
    ? ["anchor-samples-contact-sheet.png", "anchor-samples-contact-sheet.svg"]
    : ["full-deck-contact-sheet.png", "full-deck-contact-sheet.svg"];
  const candidates = names
    .map(name => path.join(OUTPUT, name)).filter(fs.existsSync);
  return candidates[0] || "";
}
function anchorSheet() {
  const candidates = ["anchor-samples-contact-sheet.png", "anchor-samples-contact-sheet.svg"]
    .map(name => path.join(OUTPUT, name)).filter(fs.existsSync);
  return candidates[0] || (cfg.workflow?.stage === "anchor-sample" ? contactSheet() : "");
}
function currentPages(warningsByPage = new Map()) {
  return pageDirs().map(dir => {
    const meta = readJson(path.join(PAGES, dir, "page.json"), {});
    const id = String(meta.id || (dir.match(/^p\d+/i) || [dir])[0]);
    const render = path.join(PAGES, dir, "out", `${id}.png`);
    const geometryFile = path.join(PAGES, dir, "out", "geometry-audit.json");
    const geometry = readJson(geometryFile, {});
    const warningFields = warningsByPage.get(id) || [];
    const risk = classifyPage(meta, warningFields);
    return {
      id, dir, title: meta.title || "", relationship: meta.qaProfile?.relationship || meta.relationship || "",
      render: rel(render), renderSha256: sha(render),
      geometryAudit: rel(geometryFile), geometryAuditSha256: sha(geometryFile), geometryVerdict: geometry.verdict || "MISSING",
      highRisk: risk.fullSizeRequired, riskLevel: risk.level, riskReasons: risk.reasons, warningEscalation: warningFields.length > 0
    };
  });
}
function pageRuleIds(pageId) {
  const page = pageDirs().map(dir => readJson(path.join(PAGES, dir, "page.json"), {})).find(item => String(item.id || item.page || "") === pageId);
  return (page?.qaProfile?.pageRules || []).map(item => String(item.id || "")).filter(Boolean);
}
function normalizeObservation(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "").replace(/[，。；：、,.!?:;()[\]{}'"“”‘’_-]+/g, "");
}
function validateInspection(doc, { role, renderSetSha256, fullPages, pages, pageRules = new Map(), agentRunReceiptSha256 = "" }) {
  const errors = [];
  if (!doc || doc.version !== INSPECTION_VERSION) return [`inspection must be ${INSPECTION_VERSION}`];
  if (doc.role !== role) errors.push(`inspection role must equal ${role}`);
  if (doc.renderSetSha256 !== renderSetSha256) errors.push("inspection renderSetSha256 is stale");
  if (!agentRunReceiptSha256 || doc.agentRunReceiptSha256 !== agentRunReceiptSha256) errors.push("inspection is not bound to the reviewer agent-run receipt");
  const byId = new Map((pages || []).map(page => [page.id, page]));
  const seenObservations = new Map();
  for (const id of fullPages) {
    const expected = byId.get(id), item = doc.pages?.[id];
    if (!expected) { errors.push(`${id}: full-size page is not in the current render set`); continue; }
    if (!item || typeof item !== "object") { errors.push(`${id}: full-size inspection record missing`); continue; }
    if (item.renderSha256 !== expected.renderSha256) errors.push(`${id}: inspection render hash is stale`);
    if (!expected.geometryAuditSha256 || expected.geometryVerdict !== "PASS") errors.push(`${id}: current machine geometry audit must PASS before visual inspection`);
    if (item.geometryAuditSha256 !== expected.geometryAuditSha256) errors.push(`${id}: inspection geometry audit hash is stale`);
    if (item.viewer !== "view_image" || item.viewedAtFullSize !== true) errors.push(`${id}: inspection must declare viewer=view_image and viewedAtFullSize=true`);
    if (!String(item.viewedAt || "").trim()) errors.push(`${id}: inspection viewedAt is required`);
    const observations = Array.isArray(item.observations) ? item.observations : [];
    if (observations.length < REQUIRED_OBSERVATION_KINDS.length) errors.push(`${id}: at least ${REQUIRED_OBSERVATION_KINDS.length} grounded observations are required`);
    const kinds = new Set();
    const coveredRules = new Set();
    observations.forEach((observation, index) => {
      const prefix = `${id}: observation ${index + 1}`;
      const kind = String(observation.kind || "");
      if (!REQUIRED_OBSERVATION_KINDS.includes(kind) && kind !== "color-focus" && kind !== "content-hierarchy") errors.push(`${prefix} has unsupported kind ${kind || "missing"}`);
      else kinds.add(kind);
      if (String(observation.location || "").trim().length < 4) errors.push(`${prefix} requires a specific location`);
      const region = observation.region || {};
      if (![region.x, region.y, region.w, region.h].every(value => Number.isFinite(Number(value))) || Number(region.w) <= 0 || Number(region.h) <= 0) errors.push(`${prefix} requires numeric region {x,y,w,h}`);
      if (!/(view_image|full.?size|100%|全尺寸|原图)/i.test(String(observation.method || ""))) errors.push(`${prefix} method must name the full-size image inspection`);
      const fact = String(observation.observation || "").trim();
      if (fact.length < 12) errors.push(`${prefix} requires a concrete observable fact`);
      if (/^(未发现问题|无明显问题|符合要求|检查通过|整体成立)[。.!]*$/i.test(fact)) errors.push(`${prefix} is generic and not pixel-grounded`);
      const fingerprint = normalizeObservation(fact);
      if (fingerprint) seenObservations.set(fingerprint, [...(seenObservations.get(fingerprint) || []), `${id}#${index + 1}`]);
      (observation.ruleIds || []).forEach(ruleId => coveredRules.add(String(ruleId)));
      if (!["PASS", "FAIL"].includes(String(observation.status || "").toUpperCase())) errors.push(`${prefix} status must be PASS or FAIL`);
      if (String(observation.status || "").toUpperCase() === "FAIL" && ["P0", "P1"].includes(String(observation.severity || "").toUpperCase())) errors.push(`${prefix} is a blocking finding and cannot be recorded under a passing inspection`);
      if (kind === "geometry") {
        if (String(observation.geometryAuditSha256 || "") !== expected.geometryAuditSha256) errors.push(`${prefix} geometryAuditSha256 is stale`);
        if (String(observation.cropArtifact || "").trim().length < 4) errors.push(`${prefix} geometry observation requires cropArtifact`);
        if (!/^[a-f0-9]{64}$/i.test(String(observation.cropSha256 || ""))) errors.push(`${prefix} geometry observation requires cropSha256`);
      }
    });
    REQUIRED_OBSERVATION_KINDS.forEach(kind => { if (!kinds.has(kind)) errors.push(`${id}: missing ${kind} full-size observation`); });
    (pageRules.get(id) || []).forEach(ruleId => { if (!coveredRules.has(ruleId)) errors.push(`${id}: page-specific rule lacks a full-size observation: ${ruleId}`); });
    if (String(expected.relationship).toLowerCase() === "contrast") {
      const facts = item.relationshipFacts || {};
      if (!Number.isInteger(facts.leftCount) || facts.leftCount < 1 || !Number.isInteger(facts.rightCount) || facts.rightCount < 1) errors.push(`${id}: contrast inspection requires positive integer leftCount/rightCount`);
      if (!["one-to-one", "group-level", "one-to-many", "many-to-one", "none"].includes(facts.mapping)) errors.push(`${id}: contrast inspection mapping mode is invalid`);
    }
  }
  seenObservations.forEach((uses, fingerprint) => {
    if (uses.length >= 2) errors.push(`duplicate full-size observation reused: ${uses.join(", ")}`);
  });
  return errors;
}
function capture() {
  const sheet = contactSheet(), anchor = anchorSheet();
  const baseline = readJson(path.join(OUTPUT, "quality-baseline-audit.json"), {});
  const diversityFile = path.join(OUTPUT, "render-diversity-audit.json");
  const diversity = readJson(diversityFile, {});
  const qualityTargetFile = path.join(ROOT, "quality-target.json");
  const qualityTarget = readJson(qualityTargetFile, {});
  const warningsByPage = new Map();
  for (const item of [...(baseline.warnings || []), ...(diversity.warnings || [])]) {
    const id = String(item.page || "");
    if (!id || id === "deck") continue;
    warningsByPage.set(id, [...new Set([...(warningsByPage.get(id) || []), String(item.field || item.code || "warning")])]);
  }
  const pages = currentPages(warningsByPage);
  const existing = readJson(FILE, {});
  const evidence = {
    version: EVIDENCE_VERSION, capturedAt: new Date().toISOString(), stage: cfg.workflow?.stage || "",
    contactSheet: { path: sheet ? rel(sheet) : "", sha256: sheet ? sha(sheet) : "" },
    anchorReference: { path: anchor ? rel(anchor) : "", sha256: anchor ? sha(anchor) : "" },
    renderDiversity: { path: fs.existsSync(diversityFile) ? rel(diversityFile) : "", sha256: semanticJsonSha(diversityFile), verdict: diversity.verdict || "MISSING" },
    qualityTarget: { ...qualityTarget, path: rel(qualityTargetFile), sha256: sha(qualityTargetFile) },
    pages,
    requiredReviewTopics: [...new Set([...(baseline.warnings || []), ...(diversity.warnings || [])].map(item => item.field || item.code).filter(Boolean))],
    reviews: existing.version === EVIDENCE_VERSION ? existing.reviews || {} : {}, overallVerdict: "PENDING", summary: ""
  };
  evidence.renderSetSha256 = crypto.createHash("sha256").update(JSON.stringify({
    contactSheet: evidence.contactSheet.sha256,
    anchor: evidence.anchorReference.sha256,
    renderDiversity: evidence.renderDiversity.sha256,
    qualityTarget: evidence.qualityTarget.sha256,
    pages: pages.map(page => [page.id, page.renderSha256, page.geometryAuditSha256])
  })).digest("hex");
  fs.mkdirSync(OUTPUT, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(evidence, null, 2) + "\n", "utf8");
  console.log(`Captured rendered quality evidence for ${evidence.pages.length} pages.`);
}
function ids(value, all) {
  if (!value) return [];
  if (value.toLowerCase() === "all") return all.map(page => page.id);
  return value.split(",").map(item => item.trim()).filter(Boolean);
}
function record() {
  const data = readJson(FILE);
  if (!data) throw new Error("Run render-quality-gate.js capture first.");
  const role = arg("role"), artifact = path.resolve(ROOT, arg("artifact")), verdict = arg("verdict").toUpperCase();
  if (!role || !artifact || !["PASS", "SHIP", "READY", "FIX-FIRST"].includes(verdict)) throw new Error("record requires --role, --artifact and a valid --verdict.");
  if (!fs.existsSync(artifact)) throw new Error(`review artifact missing: ${artifact}`);
  const reviewed = new Set(ids(arg("pages"), data.pages));
  const full = new Set(ids(arg("full-size"), data.pages));
  const addressesArg = arg("addresses");
  const addressedTopics = addressesArg.toLowerCase() === "all" ? (data.requiredReviewTopics || []) : addressesArg.split(",").map(item => item.trim()).filter(Boolean);
  const artifactText = fs.readFileSync(artifact, "utf8");
  if (!artifactText.includes(`[render-set:${data.renderSetSha256}]`)) throw new Error(`review artifact is not bound to the current render set; include [render-set:${data.renderSetSha256}]`);
  const missingTopicMarkers = addressedTopics.filter(topic => !artifactText.includes(`[topic:${topic}]`));
  if (missingTopicMarkers.length) throw new Error(`review artifact must explicitly address quality topics: ${missingTopicMarkers.join(", ")} using [topic:<id>] markers`);
  const qualityScore = Number((artifactText.match(/\[quality-score:\s*([0-9]+(?:\.[0-9]+)?)\]/i) || [])[1]);
  const minimumOverall = Number(data.qualityTarget?.minimumOverallScore || 8);
  if (!Number.isFinite(qualityScore) || qualityScore < minimumOverall) throw new Error(`review artifact requires [quality-score:<number>] at or above ${minimumOverall}`);
  const dimensionScores = {};
  for (const dimension of (data.qualityTarget?.dimensions || [])) {
    const escaped = String(dimension).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const score = Number((artifactText.match(new RegExp(`\\[quality:${escaped}=\\s*([0-9]+(?:\\.[0-9]+)?)\\]`, "i")) || [])[1]);
    if (!Number.isFinite(score)) throw new Error(`review artifact missing [quality:${dimension}=<number>]`);
    if (score < Number(data.qualityTarget?.minimumDimensionScore || 7)) throw new Error(`${dimension} score ${score} is below the quality target`);
    dimensionScores[dimension] = score;
  }
  let inspectionSnapshot = null;
  if (full.size) {
    const inspectionArg = arg("inspection");
    if (!inspectionArg) throw new Error(`record with --full-size requires --inspection <${INSPECTION_VERSION}.json>`);
    const inspectionFile = path.resolve(ROOT, inspectionArg);
    const agentReceiptArg = arg("agent-receipt");
    if (!agentReceiptArg) throw new Error("record with --full-size requires --agent-receipt <leander-agent-run-receipt.v1.json>");
    const agentReceiptFile = path.resolve(ROOT, agentReceiptArg);
    if (!fs.existsSync(agentReceiptFile)) throw new Error(`agent-run receipt missing: ${agentReceiptFile}`);
    const agentReceiptSha256 = sha(agentReceiptFile);
    if (!fs.existsSync(inspectionFile)) throw new Error(`inspection artifact missing: ${inspectionFile}`);
    const inspection = readJson(inspectionFile);
    const rules = new Map(data.pages.map(page => [page.id, pageRuleIds(page.id)]));
    const inspectionProblems = validateInspection(inspection, {
      role,
      renderSetSha256: data.renderSetSha256,
      fullPages: full,
      pages: data.pages,
      pageRules: rules,
      agentRunReceiptSha256: agentReceiptSha256
    });
    if (inspectionProblems.length) throw new Error(`full-size inspection rejected:\n- ${inspectionProblems.join("\n- ")}`);
    const inspectionSha = inspectionEvidenceSha(inspectionFile);
    if (!artifactText.includes(`[inspection-sha:${inspectionSha}]`)) throw new Error(`review artifact must include [inspection-sha:${inspectionSha}]`);
    inspectionSnapshot = { source: inspectionFile, sha256: inspectionSha, pageIds: [...full] };
  }
  const reviewedPages = data.pages.filter(page => reviewed.has(page.id)).map(page => ({ id: page.id, renderSha256: page.renderSha256 }));
  if (!reviewedPages.length) throw new Error("record requires --pages all or explicit page ids");
  const recordedAt = new Date().toISOString(), snapshotDir = path.join(OUTPUT, "review-events");
  fs.mkdirSync(snapshotDir, { recursive: true });
  const snapshot = path.join(snapshotDir, `${role}-${recordedAt.replace(/[-:.TZ]/g, "")}-${sha(artifact).slice(0, 10)}.md`);
  fs.copyFileSync(artifact, snapshot);
  let inspectionEvent = null;
  if (inspectionSnapshot) {
    const target = path.join(snapshotDir, `${role}-${recordedAt.replace(/[-:.TZ]/g, "")}-${inspectionSnapshot.sha256.slice(0, 10)}.inspection.json`);
    fs.copyFileSync(inspectionSnapshot.source, target);
    inspectionEvent = { artifact: rel(target), artifactSha256: sha(target), pageIds: inspectionSnapshot.pageIds };
  }
  const event = { artifact: rel(snapshot), sourceArtifact: rel(artifact), artifactSha256: sha(snapshot), inspection: inspectionEvent, verdict, qualityScore, dimensionScores, renderSetSha256: data.renderSetSha256, contactSheetSha256: data.contactSheet.sha256, pages: reviewedPages, fullSizePages: data.pages.filter(page => full.has(page.id)).map(page => ({ id: page.id, renderSha256: page.renderSha256 })), addressedTopics, recordedAt };
  const previous = data.reviews[role]?.events || [];
  data.reviews[role] = { role, events: [...previous, event].slice(-100), latestVerdict: verdict };
  const overall = arg("overall").toUpperCase();
  if (overall) data.overallVerdict = overall;
  const summary = arg("summary");
  if (summary) data.summary = summary;
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Recorded ${role}: ${verdict}.`);
}
function verify() {
  const data = readJson(FILE), errors = [];
  if (!data || data.version !== EVIDENCE_VERSION) errors.push(`missing ${EVIDENCE_VERSION}; run capture after the current render/contact sheet`);
  if (data) {
    const sheet = path.join(ROOT, data.contactSheet?.path || "");
    if (!data.contactSheet?.sha256 || sha(sheet) !== data.contactSheet.sha256) errors.push("contact sheet is missing or stale");
    const anchor = path.join(ROOT, data.anchorReference?.path || "");
    if (!data.anchorReference?.sha256 || sha(anchor) !== data.anchorReference.sha256) errors.push("approved anchor contact sheet is missing or stale");
    const diversity = path.join(ROOT, data.renderDiversity?.path || "");
    if (!data.renderDiversity?.sha256 || semanticJsonSha(diversity) !== data.renderDiversity.sha256) errors.push("render-level diversity audit is missing or stale");
    const qualityTarget = path.join(ROOT, data.qualityTarget?.path || "");
    if (!data.qualityTarget?.sha256 || sha(qualityTarget) !== data.qualityTarget.sha256) errors.push("quality target is missing or changed after capture");
    const current = new Map(currentPages(new Map((data.pages || []).map(page => [page.id, page.warningEscalation ? ["captured-warning"] : []]))).map(page => [page.id, page]));
    (data.pages || []).forEach(page => {
      const now = current.get(page.id);
      if (!now || !page.renderSha256 || now.renderSha256 !== page.renderSha256) errors.push(`${page.id}: render changed after quality capture`);
      if (!now || !page.geometryAuditSha256 || now.geometryAuditSha256 !== page.geometryAuditSha256) errors.push(`${page.id}: geometry audit changed after quality capture`);
      if (now?.geometryVerdict !== "PASS") errors.push(`${page.id}: machine geometry audit verdict=${now?.geometryVerdict || "MISSING"}`);
    });
    if ((data.pages || []).length !== current.size) errors.push("active page set changed after quality capture");
    [...new Set(["reviewer-zh", ...(cfg.agentCollaboration?.finalAlwaysRequiredRoles || [])])].forEach(role => {
      const events = data.reviews?.[role]?.events || [], valid = events.filter(event => {
        const inspectionOk = !(event.fullSizePages || []).length || (
          event.inspection?.artifactSha256 === sha(path.join(ROOT, event.inspection?.artifact || ""))
          && (event.fullSizePages || []).every(item => (event.inspection?.pageIds || []).includes(item.id))
        );
        return ["PASS", "SHIP", "READY"].includes(event.verdict)
          && event.artifactSha256 === sha(path.join(ROOT, event.artifact || ""))
          && inspectionOk
          && Number(event.qualityScore || 0) >= Number(data.qualityTarget?.minimumOverallScore || 8)
          && (data.qualityTarget?.dimensions || []).every(dimension => Number(event.dimensionScores?.[dimension] || 0) >= Number(data.qualityTarget?.minimumDimensionScore || 7));
      });
      if (!valid.length) errors.push(`${role}: current rendered review is required`);
      else {
        const covered = new Set(valid.flatMap(event => (event.pages || []).filter(item => current.get(item.id)?.renderSha256 === item.renderSha256).map(item => item.id)));
        current.forEach((page, id) => { if (!covered.has(id)) errors.push(`${role}: ${id} current render lacks review coverage`); });
        if (!valid.some(event => event.contactSheetSha256 === data.contactSheet.sha256)) errors.push(`${role}: current contact sheet lacks review coverage`);
      }
    });
    const fullSize = new Set(Object.values(data.reviews || {}).flatMap(review => review.events || []).flatMap(event => (event.fullSizePages || []).filter(item => current.get(item.id)?.renderSha256 === item.renderSha256).map(item => item.id)));
    (data.pages || []).forEach(page => { if ((page.highRisk || page.warningEscalation) && !fullSize.has(page.id)) errors.push(`${page.id}: risk/warning page lacks current full-size review`); });
    const reviewerFullSize = new Set((data.reviews?.["reviewer-zh"]?.events || []).filter(event => event.inspection?.artifactSha256 === sha(path.join(ROOT, event.inspection?.artifact || ""))).flatMap(event => (event.fullSizePages || []).filter(item => current.get(item.id)?.renderSha256 === item.renderSha256 && (event.inspection?.pageIds || []).includes(item.id)).map(item => item.id)));
    current.forEach((page, id) => { if (!reviewerFullSize.has(id)) errors.push(`reviewer-zh: ${id} current render lacks grounded full-size inspection`); });
    const visualTopics = new Set((data.reviews?.["visual-designer-zh"]?.events || []).filter(event => event.contactSheetSha256 === data.contactSheet.sha256).flatMap(event => event.addressedTopics || []));
    (data.requiredReviewTopics || []).forEach(topic => {
      if (!visualTopics.has(topic)) errors.push(`visual-designer-zh: quality warning topic not addressed: ${topic}`);
    });
    if (![["SHIP"], ["PASS"], ["READY"]].flat().includes(data.overallVerdict)) errors.push(`overallVerdict must be SHIP/PASS/READY, got ${data.overallVerdict || "missing"}`);
  }
  if (errors.length) {
    console.error("Rendered quality gate FAILED:"); errors.forEach(error => console.error(`- ${error}`)); process.exit(1);
  }
  console.log(`Rendered quality gate OK: ${data.pages.length} pages, current contact sheet and independent reviews.`);
}

function selfTest() {
  const semanticA = crypto.createHash("sha256").update(JSON.stringify(stable(stripVolatile({ generatedAt: "a", verdict: "PASS", warnings: [] })))).digest("hex");
  const semanticB = crypto.createHash("sha256").update(JSON.stringify(stable(stripVolatile({ generatedAt: "b", verdict: "PASS", warnings: [] })))).digest("hex");
  if (semanticA !== semanticB) throw new Error("volatile render evidence timestamp changed semantic hash");
  const receiptBindingA = inspectionEvidenceDigest({ version: INSPECTION_VERSION, agentRunReceiptSha256: "a", pages: { p01: { observation: "same" } } });
  const receiptBindingB = inspectionEvidenceDigest({ version: INSPECTION_VERSION, agentRunReceiptSha256: "b", pages: { p01: { observation: "same" } } });
  if (receiptBindingA !== receiptBindingB) throw new Error("inspection receipt binding changed the evidence hash");
  const pages = [{ id: "p01", renderSha256: "abc123", relationship: "contrast", geometryAuditSha256: "f".repeat(64), geometryVerdict: "PASS" }];
  const pageRules = new Map([["p01", ["page.p01.message"]]]);
  const valid = {
    version: INSPECTION_VERSION,
    role: "reviewer-zh",
    renderSetSha256: "set123",
    agentRunReceiptSha256: "receipt123",
    pages: {
      p01: {
        renderSha256: "abc123",
        geometryAuditSha256: "f".repeat(64),
        viewer: "view_image",
        viewedAtFullSize: true,
        viewedAt: "2026-07-23T00:00:00.000Z",
        relationshipFacts: { leftCount: 2, rightCount: 3, mapping: "group-level" },
        observations: REQUIRED_OBSERVATION_KINDS.map((kind, index) => ({
          kind,
          location: `region-${index + 1}`,
          region: { x: index, y: index, w: 10, h: 10 },
          method: "view_image full-size",
          observation: `${kind} observable fact with page-specific detail ${index + 1}`,
          status: "PASS",
          ruleIds: index === 0 ? ["page.p01.message"] : [],
          ...(kind === "geometry" ? {
            geometryAuditSha256: "f".repeat(64),
            cropArtifact: "output/inspection-crops/p01-geometry.png",
            cropSha256: "e".repeat(64)
          } : {})
        }))
      }
    }
  };
  const pass = validateInspection(valid, { role: "reviewer-zh", renderSetSha256: "set123", fullPages: new Set(["p01"]), pages, pageRules, agentRunReceiptSha256: "receipt123" });
  if (pass.length) throw new Error(`valid inspection failed: ${pass.join("; ")}`);
  const invalid = JSON.parse(JSON.stringify(valid));
  invalid.pages.p01.observations = invalid.pages.p01.observations.filter(item => item.kind !== "semantics");
  const fail = validateInspection(invalid, { role: "reviewer-zh", renderSetSha256: "set123", fullPages: new Set(["p01"]), pages, pageRules, agentRunReceiptSha256: "receipt123" });
  if (!fail.some(item => /semantics/.test(item))) throw new Error("missing semantic observation did not fail");
  console.log("PASS grounded full-size inspection self-test");
}

if (require.main === module) {
  const command = process.argv[2];
  try {
    if (command === "capture") capture();
    else if (command === "record") record();
    else if (command === "verify") verify();
    else if (command === "--self-test") selfTest();
    else throw new Error("usage: render-quality-gate.js capture|record|verify|--self-test");
  } catch (error) { console.error(error.message); process.exit(1); }
}

module.exports = { validateInspection, semanticJsonSha, inspectionEvidenceSha, inspectionEvidenceDigest, stripVolatile, REQUIRED_OBSERVATION_KINDS, selfTest };
