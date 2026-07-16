// Hash-bound rendered quality evidence. This gate cannot judge taste by itself;
// it proves that the required independent reviews inspected the current renders.
//
// Usage:
//   node tools/render-quality-gate.js capture
//   node tools/render-quality-gate.js record --role visual-designer-zh --artifact agent-reviews/visual-designer-zh.md --verdict PASS --pages all --full-size p09,p13
//   node tools/render-quality-gate.js record --role reviewer-zh --artifact agent-reviews/reviewer-zh.md --verdict SHIP --pages all --full-size p09,p13 --overall SHIP
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

function arg(name, fallback = "") { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
function readJson(file, fallback = null) { try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); } catch { return fallback; } }
function sha(file) { return fs.existsSync(file) ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") : ""; }
function rel(file) { return path.relative(ROOT, file).replace(/\\/g, "/"); }
function pageDirs() {
  const all = fs.existsSync(PAGES) ? fs.readdirSync(PAGES).filter(dir => fs.existsSync(path.join(PAGES, dir, "page.json"))).sort() : [];
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
    const warningFields = warningsByPage.get(id) || [];
    const risk = classifyPage(meta, warningFields);
    return { id, dir, title: meta.title || "", render: rel(render), renderSha256: sha(render), highRisk: risk.fullSizeRequired, riskLevel: risk.level, riskReasons: risk.reasons, warningEscalation: warningFields.length > 0 };
  });
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
    version: "render-quality-evidence.v2", capturedAt: new Date().toISOString(), stage: cfg.workflow?.stage || "",
    contactSheet: { path: sheet ? rel(sheet) : "", sha256: sheet ? sha(sheet) : "" },
    anchorReference: { path: anchor ? rel(anchor) : "", sha256: anchor ? sha(anchor) : "" },
    renderDiversity: { path: fs.existsSync(diversityFile) ? rel(diversityFile) : "", sha256: sha(diversityFile), verdict: diversity.verdict || "MISSING" },
    qualityTarget: { ...qualityTarget, path: rel(qualityTargetFile), sha256: sha(qualityTargetFile) },
    pages,
    requiredReviewTopics: [...new Set([...(baseline.warnings || []), ...(diversity.warnings || [])].map(item => item.field || item.code).filter(Boolean))],
    reviews: existing.version === "render-quality-evidence.v2" ? existing.reviews || {} : {}, overallVerdict: "PENDING", summary: ""
  };
  evidence.renderSetSha256 = crypto.createHash("sha256").update(JSON.stringify({
    contactSheet: evidence.contactSheet.sha256,
    anchor: evidence.anchorReference.sha256,
    renderDiversity: evidence.renderDiversity.sha256,
    qualityTarget: evidence.qualityTarget.sha256,
    pages: pages.map(page => [page.id, page.renderSha256])
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
  const reviewedPages = data.pages.filter(page => reviewed.has(page.id)).map(page => ({ id: page.id, renderSha256: page.renderSha256 }));
  if (!reviewedPages.length) throw new Error("record requires --pages all or explicit page ids");
  const recordedAt = new Date().toISOString(), snapshotDir = path.join(OUTPUT, "review-events");
  fs.mkdirSync(snapshotDir, { recursive: true });
  const snapshot = path.join(snapshotDir, `${role}-${recordedAt.replace(/[-:.TZ]/g, "")}-${sha(artifact).slice(0, 10)}.md`);
  fs.copyFileSync(artifact, snapshot);
  const event = { artifact: rel(snapshot), sourceArtifact: rel(artifact), artifactSha256: sha(snapshot), verdict, qualityScore, dimensionScores, renderSetSha256: data.renderSetSha256, contactSheetSha256: data.contactSheet.sha256, pages: reviewedPages, fullSizePages: data.pages.filter(page => full.has(page.id)).map(page => ({ id: page.id, renderSha256: page.renderSha256 })), addressedTopics, recordedAt };
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
  if (!data || data.version !== "render-quality-evidence.v2") errors.push("missing render-quality-evidence.v2; run capture after the current render/contact sheet");
  if (data) {
    const sheet = path.join(ROOT, data.contactSheet?.path || "");
    if (!data.contactSheet?.sha256 || sha(sheet) !== data.contactSheet.sha256) errors.push("contact sheet is missing or stale");
    const anchor = path.join(ROOT, data.anchorReference?.path || "");
    if (!data.anchorReference?.sha256 || sha(anchor) !== data.anchorReference.sha256) errors.push("approved anchor contact sheet is missing or stale");
    const diversity = path.join(ROOT, data.renderDiversity?.path || "");
    if (!data.renderDiversity?.sha256 || sha(diversity) !== data.renderDiversity.sha256) errors.push("render-level diversity audit is missing or stale");
    const qualityTarget = path.join(ROOT, data.qualityTarget?.path || "");
    if (!data.qualityTarget?.sha256 || sha(qualityTarget) !== data.qualityTarget.sha256) errors.push("quality target is missing or changed after capture");
    const current = new Map(currentPages(new Map((data.pages || []).map(page => [page.id, page.warningEscalation ? ["captured-warning"] : []]))).map(page => [page.id, page]));
    (data.pages || []).forEach(page => {
      const now = current.get(page.id);
      if (!now || !page.renderSha256 || now.renderSha256 !== page.renderSha256) errors.push(`${page.id}: render changed after quality capture`);
    });
    if ((data.pages || []).length !== current.size) errors.push("active page set changed after quality capture");
    [...new Set(["reviewer-zh", ...(cfg.agentCollaboration?.finalAlwaysRequiredRoles || [])])].forEach(role => {
      const events = data.reviews?.[role]?.events || [], valid = events.filter(event => ["PASS", "SHIP", "READY"].includes(event.verdict) && event.artifactSha256 === sha(path.join(ROOT, event.artifact || "")) && Number(event.qualityScore || 0) >= Number(data.qualityTarget?.minimumOverallScore || 8) && (data.qualityTarget?.dimensions || []).every(dimension => Number(event.dimensionScores?.[dimension] || 0) >= Number(data.qualityTarget?.minimumDimensionScore || 7)));
      if (!valid.length) errors.push(`${role}: current rendered review is required`);
      else {
        const covered = new Set(valid.flatMap(event => (event.pages || []).filter(item => current.get(item.id)?.renderSha256 === item.renderSha256).map(item => item.id)));
        current.forEach((page, id) => { if (!covered.has(id)) errors.push(`${role}: ${id} current render lacks review coverage`); });
        if (!valid.some(event => event.contactSheetSha256 === data.contactSheet.sha256)) errors.push(`${role}: current contact sheet lacks review coverage`);
      }
    });
    const fullSize = new Set(Object.values(data.reviews || {}).flatMap(review => review.events || []).flatMap(event => (event.fullSizePages || []).filter(item => current.get(item.id)?.renderSha256 === item.renderSha256).map(item => item.id)));
    (data.pages || []).forEach(page => { if ((page.highRisk || page.warningEscalation) && !fullSize.has(page.id)) errors.push(`${page.id}: risk/warning page lacks current full-size review`); });
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

const command = process.argv[2];
try {
  if (command === "capture") capture();
  else if (command === "record") record();
  else if (command === "verify") verify();
  else throw new Error("usage: render-quality-gate.js capture|record|verify");
} catch (error) { console.error(error.message); process.exit(1); }
