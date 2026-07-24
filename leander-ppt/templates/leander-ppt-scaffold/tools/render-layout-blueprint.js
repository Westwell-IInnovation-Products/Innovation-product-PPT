// Deterministic low-fidelity blueprint renderer.
// It renders stable SVG review artifacts and machine-readable geometry evidence.
// Usage: node tools/render-layout-blueprint.js [--blueprint layout-blueprint.json]
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const cp = require("child_process");
const { lintScene } = require("./blueprint-geometry");

const ROOT = path.join(__dirname, "..");
const W = 1600, H = 900;
const SAFE = { x: 90, y: 165, w: 1420, h: 585 };
const C = { bg: "#F5F5F0", surface: "#FFFFFF", navy: "#07195A", red: "#C51516", redSoft: "#FBEAEA", blueSoft: "#E8EEF8", line: "#CFCBC1", mute: "#8A877F", cyan: "#00A9C6" };

function argsOf(argv) {
  const args = { blueprint: path.join(ROOT, "layout-blueprint.json"), outDir: path.join(ROOT, "output") };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--blueprint" && argv[i + 1]) args.blueprint = path.resolve(argv[++i]);
    else if (argv[i] === "--out-dir" && argv[i + 1]) args.outDir = path.resolve(argv[++i]);
  }
  return args;
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")); }
function escapeXml(value) { return String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char])); }
function contractsOf(data) { return Array.isArray(data.contracts) ? data.contracts : Array.isArray(data.pages) ? data.pages : []; }
function shortLabel(value, fallback = "") { const text = String(value || fallback).trim(); return text.length > 12 ? `${text.slice(0, 11)}…` : text; }

function scene(contract) {
  return { id: contract.page || contract.id, title: contract.title || "", contract, safe: SAFE, objects: [], checkCenter: true };
}
function addRect(s, id, x, y, w, h, style = "normal", options = {}) {
  s.objects.push({ id, type: "rect", role: options.role || "block", x, y, w, h, style, label: options.label || "", peerGroup: options.peerGroup, excludeFromCenter: options.excludeFromCenter });
  return id;
}
function addLine(s, id, points, source, target, options = {}) {
  s.objects.push({ id, type: "connector", role: "connector", points, source, target, kind: options.kind || "orthogonal", path: options.path || "", intentionalDiagonal: options.intentionalDiagonal === true });
}
function centerY(box) { return box.y + box.h / 2; }

function buildCover(s) {
  s.checkCenter = false;
  addRect(s, "title", 820, 355, 590, 88, "focus", { label: "TITLE" });
  addRect(s, "subtitle", 940, 470, 470, 30, "navy", { label: "SUBTITLE" });
  addRect(s, "tagline", 1030, 675, 380, 26, "line", { label: "TAGLINE" });
}
function buildClosing(s) {
  s.checkCenter = false;
  addRect(s, "slogan", 330, 365, 940, 82, "focus", { label: "CLOSING" });
  addRect(s, "tagline", 590, 485, 420, 28, "navy", { label: "TAGLINE" });
}
function buildDivider(s) {
  s.checkCenter = false;
  addRect(s, "chapter", 160, 340, 700, 96, "focus", { label: "SECTION" });
  addRect(s, "subtitle", 160, 470, 500, 26, "navy", { label: "SUBTITLE" });
}
function buildPoster(s) {
  const focus = { x: 620, y: 345, w: 360, h: 120 };
  addRect(s, "focus", focus.x, focus.y, focus.w, focus.h, "focus", { label: "KEY IDEA" });
  const peers = [
    { id: "k1", x: 160, y: 230 }, { id: "k2", x: 160, y: 530 },
    { id: "k3", x: 1190, y: 230 }, { id: "k4", x: 1190, y: 530 }
  ];
  peers.forEach((p, i) => addRect(s, p.id, p.x, p.y, 250, 72, i === 0 ? "normal" : "soft", { label: `POINT ${i + 1}`, peerGroup: "poster-keywords" }));
  addLine(s, "l1", [{ x: 410, y: 266 }, { x: 520, y: 266 }, { x: 520, y: 385 }, { x: 620, y: 385 }], "k1", "focus");
  addLine(s, "l2", [{ x: 410, y: 566 }, { x: 520, y: 566 }, { x: 520, y: 425 }, { x: 620, y: 425 }], "k2", "focus");
  addLine(s, "l3", [{ x: 1190, y: 266 }, { x: 1080, y: 266 }, { x: 1080, y: 385 }, { x: 980, y: 385 }], "k3", "focus");
  addLine(s, "l4", [{ x: 1190, y: 566 }, { x: 1080, y: 566 }, { x: 1080, y: 425 }, { x: 980, y: 425 }], "k4", "focus");
  addRect(s, "shift", 500, 640, 600, 46, "navy", { label: "CAPABILITY SHIFT" });
}
function buildTensionBridge(s) {
  addRect(s, "personalArtifacts", 110, 225, 520, 470, "frame-navy", { role: "decor", label: "SCATTERED ARTIFACTS" });
  [285, 375, 465, 555].forEach((y, i) => {
    addRect(s, `artifact${i + 1}`, 175, y, 390, 58, i === 0 ? "soft-red" : "soft", {
      label: `ARTIFACT ${i + 1}`,
      peerGroup: "personal-artifacts"
    });
  });

  addRect(s, "governedVault", 1170, 225, 320, 470, "navy", { role: "decor", label: "TEAM VAULT" });
  [335, 445, 555].forEach((y, i) => {
    addRect(s, `criterion${i + 1}`, 1220, y, 220, 62, "normal", {
      label: `CRITERION ${i + 1}`,
      peerGroup: "vault-criteria"
    });
  });

  // The two rails deliberately stop at the red gap. They express a missing
  // governance bridge without implying one-to-one mappings between either list.
  addRect(s, "leftRail", 630, 424, 155, 22, "navy", { role: "decor", excludeFromCenter: true });
  addRect(s, "rightRail", 1015, 424, 155, 22, "navy", { role: "decor", excludeFromCenter: true });
  addRect(s, "governanceGap", 785, 350, 230, 170, "focus", { label: "MISSING BRIDGE" });
  addRect(s, "teamCompounding", 465, 700, 670, 42, "line", { label: "TEAM COMPOUNDING" });
}
function buildDecisionKeywordBoard(s) {
  addRect(s, "decision", 620, 315, 360, 150, "focus", { label: "DECISION" });
  const peers = [{ id: "input1", x: 150, y: 245 }, { id: "input2", x: 150, y: 500 }, { id: "input3", x: 1190, y: 245 }, { id: "input4", x: 1190, y: 500 }];
  peers.forEach((p, i) => addRect(s, p.id, p.x, p.y, 260, 82, i === 0 ? "soft-red" : "normal", { label: `INPUT ${i + 1}`, peerGroup: "decision-inputs" }));
  addLine(s, "i1", [{ x: 410, y: 286 }, { x: 520, y: 286 }, { x: 520, y: 365 }, { x: 620, y: 365 }], "input1", "decision");
  addLine(s, "i2", [{ x: 410, y: 541 }, { x: 520, y: 541 }, { x: 520, y: 415 }, { x: 620, y: 415 }], "input2", "decision");
  addLine(s, "i3", [{ x: 1190, y: 286 }, { x: 1080, y: 286 }, { x: 1080, y: 365 }, { x: 980, y: 365 }], "input3", "decision");
  addLine(s, "i4", [{ x: 1190, y: 541 }, { x: 1080, y: 541 }, { x: 1080, y: 415 }, { x: 980, y: 415 }], "input4", "decision");
  addLine(s, "toReturn", [{ x: 800, y: 465 }, { x: 800, y: 610 }], "decision", "return");
  addRect(s, "return", 500, 610, 600, 54, "navy", { label: "DECISION RETURN" });
}
function buildDiagnosis(s) {
  addRect(s, "focus", 660, 300, 280, 300, "focus", { label: "CORE PAIN" });
  const ys = [220, 390, 560];
  ys.forEach((y, i) => {
    addRect(s, `left${i}`, 150, y, 300, 76, i === 0 ? "soft-red" : "normal", { label: `PAIN ${i + 1}`, peerGroup: "diagnosis-left" });
    addRect(s, `right${i}`, 1150, y, 300, 76, "normal", { label: `PAIN ${i + 4}`, peerGroup: "diagnosis-right" });
    addLine(s, `dl${i}`, [{ x: 450, y: y + 38 }, { x: 560, y: y + 38 }, { x: 560, y: 350 + i * 100 }, { x: 660, y: 350 + i * 100 }], `left${i}`, "focus");
    addLine(s, `dr${i}`, [{ x: 1150, y: y + 38 }, { x: 1040, y: y + 38 }, { x: 1040, y: 350 + i * 100 }, { x: 940, y: 350 + i * 100 }], `right${i}`, "focus");
  });
}
function buildNested(s) {
  addRect(s, "outer", 360, 205, 880, 500, "frame-red", { role: "decor" });
  addRect(s, "middle", 505, 275, 590, 360, "frame-navy", { role: "decor" });
  addRect(s, "inner", 660, 355, 280, 200, "soft", { label: "CORE" });
  addRect(s, "definition", 1030, 600, 310, 48, "normal", { label: "DEFINITION" });
}
function buildCompare(s) {
  addRect(s, "left", 160, 235, 520, 390, "normal", { label: "CONCEPT A", peerGroup: "compare" });
  addRect(s, "right", 920, 235, 520, 390, "soft-red", { label: "CONCEPT B", peerGroup: "compare" });
  addRect(s, "divider", 790, 225, 20, 410, "focus", { role: "decor" });
  addRect(s, "relation", 720, 390, 160, 64, "focus", { label: "≠" });
}
function buildEvidence(s) {
  [160, 610, 1060].forEach((x, i) => addRect(s, `case${i + 1}`, x, 265, 360, 270, i === 1 ? "soft-red" : "normal", { label: `CASE ${i + 1}`, peerGroup: "cases" }));
  addRect(s, "outcome", 500, 600, 600, 54, "focus", { label: "SHARED DIRECTION" });
}
function buildLandscape(s) {
  const xs = [190, 600, 1010], ys = [230, 450];
  let n = 1;
  ys.forEach(y => xs.forEach(x => addRect(s, `cell${n}`, x, y, 320, 140, n++ === 5 ? "soft-red" : "normal", { label: "CASE", peerGroup: "landscape" })));
  addRect(s, "result", 520, 650, 560, 42, "line", { label: "BUSINESS OUTCOME" });
}
function buildEvidenceImageAnnotation(s) {
  addRect(s, "sourceImage", 120, 205, 900, 470, "frame-navy", { label: "REAL INSTALLATION IMAGE" });
  [220, 330, 440, 550].forEach((y, i) => addRect(s, `anchor${i + 1}`, 1110, y, 350, 72, i === 0 ? "soft-red" : "normal", { label: `ANCHOR ${i + 1}`, peerGroup: "evidence-anchors" }));
  addLine(s, "imageToAnchors", [{ x: 1020, y: 440 }, { x: 1060, y: 440 }, { x: 1060, y: 256 }, { x: 1110, y: 256 }], "sourceImage", "anchor1");
}
function buildImageSceneMapping(s) {
  addRect(s, "sceneImage", 120, 220, 830, 430, "frame-navy", { label: "SIMPLE TEST SCENE" });
  [245, 385, 525].forEach((y, i) => addRect(s, `mapping${i + 1}`, 1070, y, 390, 92, i === 1 ? "soft-red" : "normal", { label: `CAPABILITY ${i + 1}`, peerGroup: "scene-mappings" }));
  addLine(s, "sceneToMap", [{ x: 950, y: 435 }, { x: 1010, y: 435 }, { x: 1010, y: 431 }, { x: 1070, y: 431 }], "sceneImage", "mapping2");
}
function buildMindmap(s) {
  addRect(s, "hub", 650, 350, 300, 160, "focus", { label: "FRAMEWORK" });
  const left = [220, 355, 490].map((y, i) => ({ id: `left${i + 1}`, x: 120, y }));
  const right = [190, 315, 440, 565].map((y, i) => ({ id: `right${i + 1}`, x: 1210, y }));
  left.forEach((p, i) => { addRect(s, p.id, p.x, p.y, 280, 74, i === 0 ? "soft-red" : "normal", { label: `LAYER ${i + 1}`, peerGroup: "mind-left" }); addLine(s, `cl${i}`, [{ x: 400, y: p.y + 37 }, { x: 520, y: p.y + 37 }, { x: 520, y: 430 }, { x: 650, y: 430 }], p.id, "hub"); });
  right.forEach((p, i) => { addRect(s, p.id, p.x, p.y, 280, 74, "normal", { label: `LAYER ${i + 4}`, peerGroup: "mind-right" }); addLine(s, `cr${i}`, [{ x: 1210, y: p.y + 37 }, { x: 1080, y: p.y + 37 }, { x: 1080, y: 430 }, { x: 950, y: 430 }], p.id, "hub"); });
}
function buildDualSensorFusion(s) {
  addRect(s, "radarInput", 150, 245, 330, 100, "normal", { label: "RADAR / SPACE" });
  addRect(s, "visionInput", 150, 515, 330, 100, "normal", { label: "VISION / SEMANTICS" });
  addRect(s, "fusionCore", 635, 325, 330, 210, "focus", { label: "FUSION CORE" });
  addRect(s, "coordinateOutput", 1120, 365, 330, 130, "navy", { label: "COORDINATE OUTPUT" });
  addLine(s, "radarToFusion", [{ x: 480, y: 295 }, { x: 555, y: 295 }, { x: 555, y: 380 }, { x: 635, y: 380 }], "radarInput", "fusionCore");
  addLine(s, "visionToFusion", [{ x: 480, y: 565 }, { x: 555, y: 565 }, { x: 555, y: 480 }, { x: 635, y: 480 }], "visionInput", "fusionCore");
  addLine(s, "fusionToOutput", [{ x: 965, y: 430 }, { x: 1120, y: 430 }], "fusionCore", "coordinateOutput");
}
function buildSwimlane(s) {
  addRect(s, "humanLane", 120, 215, 1360, 190, "frame-navy", { role: "decor" });
  addRect(s, "aiLane", 120, 465, 1360, 190, "frame-red", { role: "decor" });
  const xs = [220, 500, 780, 1060, 1340];
  xs.forEach((x, i) => {
    addRect(s, `h${i}`, x - 90, 270, 180, 70, i === 0 ? "soft-red" : "normal", { label: "HUMAN", peerGroup: "human" });
    addRect(s, `a${i}`, x - 90, 520, 180, 70, i === 4 ? "soft-red" : "soft", { label: "AI", peerGroup: "ai" });
    if (i < xs.length - 1) addLine(s, `ha${i}`, [{ x: x + 90, y: 305 }, { x: xs[i + 1] - 90, y: 305 }], `h${i}`, `h${i + 1}`);
    addLine(s, `handoff${i}`, [{ x, y: 340 }, { x, y: 520 }], `h${i}`, `a${i}`);
  });
}
function buildBeforeAfter(s) {
  addRect(s, "beforeInput", 150, 260, 240, 80, "normal", { label: "TASK" });
  addRect(s, "beforeOutput", 1180, 260, 240, 80, "soft-red", { label: "ONE SHOT" });
  addLine(s, "beforeLine", [{ x: 390, y: 300 }, { x: 1180, y: 300 }], "beforeInput", "beforeOutput");
  const xs = [170, 430, 690, 950, 1210];
  xs.forEach((x, i) => addRect(s, `gate${i}`, x, 500, 180, 76, i === 4 ? "focus" : "normal", { label: i % 2 ? "GATE" : "STEP", peerGroup: "gates" }));
  for (let i = 0; i < xs.length - 1; i += 1) addLine(s, `g${i}`, [{ x: xs[i] + 180, y: 538 }, { x: xs[i + 1], y: 538 }], `gate${i}`, `gate${i + 1}`);
}
function buildFusionPipelineSpine(s) {
  const groups = [150, 585, 1020];
  groups.forEach((x, group) => {
    addRect(s, `group${group}`, x, 245, 360, 230, group === 1 ? "frame-red" : "frame-navy", { role: "decor" });
    [0, 1, 2].forEach(node => addRect(s, `g${group}n${node}`, x + 35 + node * 105, 320, 82, 70, group === 1 && node === 1 ? "soft-red" : "soft", { label: `${group + 1}.${node + 1}`, peerGroup: `pipeline-group-${group}` }));
    if (group < 2) addLine(s, `groupFlow${group}`, [{ x: x + 360, y: 360 }, { x: groups[group + 1], y: 360 }], `group${group}`, `group${group + 1}`);
  });
  addRect(s, "evidenceRail", 330, 590, 940, 50, "line", { label: "TRACE / REPLAY EVIDENCE" });
}
function buildResponsibilityDivider(s) {
  addRect(s, "leftResponsibility", 150, 235, 560, 92, "navy", { label: "SENSING RESPONSIBILITY" });
  addRect(s, "rightResponsibility", 890, 235, 560, 92, "focus", { label: "NEAR-END RESPONSIBILITY" });
  addRect(s, "boundaryLine", 790, 205, 20, 450, "focus", { role: "decor" });
  [390, 515].forEach((y, i) => {
    addRect(s, `leftDuty${i}`, 230, y, 400, 72, "soft", { label: `DUTY ${i + 1}`, peerGroup: "left-duties" });
    addRect(s, `rightDuty${i}`, 970, y, 400, 72, i === 1 ? "soft-red" : "soft", { label: `DUTY ${i + 3}`, peerGroup: "right-duties" });
  });
}
function buildStageGateRoadmap(s) {
  const xs = [120, 470, 820, 1170];
  xs.forEach((x, i) => {
    addRect(s, `milestone${i}`, x, 260, 280, 170, i === 3 ? "soft-red" : "normal", { label: `MILESTONE ${i + 1}`, peerGroup: "roadmap-milestones" });
    if (i < xs.length - 1) addLine(s, `milestoneFlow${i}`, [{ x: x + 280, y: 345 }, { x: xs[i + 1], y: 345 }], `milestone${i}`, `milestone${i + 1}`);
  });
  addLine(s, "roadmapToDecision", [{ x: 1310, y: 430 }, { x: 1310, y: 585 }, { x: 1090, y: 585 }], "milestone3", "roadmapDecision");
  addRect(s, "roadmapDecision", 510, 555, 580, 72, "focus", { label: "ENGINEERING DECISION" });
}
function buildProgressive(s) {
  addRect(s, "skill", 140, 235, 470, 410, "frame-navy", { role: "decor" });
  [280, 350, 420, 490, 560].forEach((y, i) => addRect(s, `doc${i}`, 205, y, 340, 44, i === 0 ? "soft-red" : "soft", { label: i === 0 ? "SKILL" : "REFERENCE", peerGroup: "docs" }));
  addRect(s, "divider", 725, 220, 12, 440, "focus", { role: "decor" });
  [250, 360, 470, 580].forEach((y, i) => addRect(s, `phase${i}`, 870, y, 500, 66, i === 1 ? "soft-red" : "normal", { label: `PHASE ${i + 1}`, peerGroup: "phases" }));
}
function buildFolderZoom(s) {
  const xs = [140, 350, 560, 770, 980, 1190];
  xs.forEach((x, i) => addRect(s, `folder${i}`, x, 215, 160, 70, i === 3 ? "soft-red" : "normal", { label: `PAGE ${i + 1}`, peerGroup: "folders" }));
  addLine(s, "expand", [{ x: 850, y: 285 }, { x: 850, y: 365 }], "folder3", "detail");
  addRect(s, "detail", 570, 365, 730, 300, "frame-red", { role: "decor" });
  [420, 495, 570].forEach((y, i) => addRect(s, `file${i}`, 650, y, 560, 48, i === 0 ? "soft-red" : "soft", { label: "PAGE ARTIFACT", peerGroup: "files" }));
}
function buildStateEvidence(s) {
  [250, 360, 470, 580].forEach((y, i) => addRect(s, `state${i}`, 150, y, 380, 64, i === 2 ? "soft-red" : "normal", { label: "STATE", peerGroup: "states" }));
  addRect(s, "screen", 700, 215, 720, 430, "frame-navy", { role: "decor" });
  [285, 370, 455, 540].forEach((y, i) => addRect(s, `row${i}`, 790, y, 540, 48, i === 1 ? "soft-red" : "soft", { label: "EVIDENCE", peerGroup: "screenRows" }));
}
function buildToolTree(s) {
  addRect(s, "root", 110, 360, 250, 100, "navy", { label: "TOOLS" });
  const ys = [215, 385, 555];
  ys.forEach((y, i) => {
    addRect(s, `branch${i}`, 540, y, 320, 92, i === 1 ? "soft-red" : "normal", { label: `POOL ${i + 1}`, peerGroup: "toolBranches" });
    addRect(s, `preview${i}`, 1050, y, 390, 92, "soft", { label: "PREVIEW", peerGroup: "toolPreviews" });
    addLine(s, `rb${i}`, [{ x: 360, y: 410 }, { x: 445, y: 410 }, { x: 445, y: y + 46 }, { x: 540, y: y + 46 }], "root", `branch${i}`);
    addLine(s, `bp${i}`, [{ x: 860, y: y + 46 }, { x: 1050, y: y + 46 }], `branch${i}`, `preview${i}`);
  });
}
function buildContractBoard(s) {
  addRect(s, "intent", 120, 245, 350, 350, "frame-navy", { role: "decor" });
  [290, 380, 470].forEach((y, i) => addRect(s, `intent${i}`, 190, y, 210, 48, "soft", { label: "INTENT", peerGroup: "intentRows" }));
  addRect(s, "contract", 620, 280, 360, 280, "frame-red", { role: "decor" });
  [330, 410, 490].forEach((y, i) => addRect(s, `contract${i}`, 690, y, 220, 44, i === 1 ? "soft-red" : "soft", { label: "CONTRACT", peerGroup: "contractRows" }));
  addRect(s, "result", 1140, 300, 300, 240, "frame-navy", { role: "decor" });
  [345, 425, 505].forEach((y, i) => addRect(s, `result${i}`, 1200, y, 180, 38, "soft", { label: "RESULT", peerGroup: "resultRows" }));
  addLine(s, "i2c", [{ x: 470, y: 420 }, { x: 620, y: 420 }], "intent", "contract");
  addLine(s, "c2r", [{ x: 980, y: 420 }, { x: 1140, y: 420 }], "contract", "result");
}
function buildDecision(s) {
  addRect(s, "input", 130, 340, 320, 130, "navy", { label: "BLUEPRINT" });
  [220, 350, 480].forEach((y, i) => addRect(s, `candidate${i}`, 650, y, 340, 76, i === 1 ? "soft-red" : "normal", { label: `CANDIDATE ${i + 1}`, peerGroup: "candidates" }));
  addRect(s, "selected", 1180, 340, 280, 130, "focus", { label: "SELECTED" });
  addLine(s, "in", [{ x: 450, y: 405 }, { x: 560, y: 405 }, { x: 560, y: 388 }, { x: 650, y: 388 }], "input", "candidate1");
  addLine(s, "out", [{ x: 990, y: 388 }, { x: 1080, y: 388 }, { x: 1080, y: 405 }, { x: 1180, y: 405 }], "candidate1", "selected");
}
function buildQaChain(s) {
  const xs = [140, 510, 880, 1250];
  xs.forEach((x, i) => addRect(s, `qa${i}`, x, 335, 240, 130, i === 3 ? "focus" : "normal", { label: ["FIXED", "DYNAMIC", "RENDER", "VERDICT"][i], peerGroup: "qa" }));
  for (let i = 0; i < 3; i += 1) addLine(s, `q${i}`, [{ x: xs[i] + 240, y: 400 }, { x: xs[i + 1], y: 400 }], `qa${i}`, `qa${i + 1}`);
  addRect(s, "evidence", 440, 575, 720, 48, "soft", { label: "EVIDENCE CHAIN" });
}
function buildRoleEvidence(s) {
  [210, 320, 430, 540].forEach((y, i) => addRect(s, `role${i}`, 140, y, 300, 66, i === 2 ? "soft-red" : "normal", { label: `ROLE ${i + 1}`, peerGroup: "roles" }));
  addRect(s, "handoff", 610, 330, 220, 130, "focus", { label: "HANDOFF" });
  addRect(s, "evidence", 1030, 220, 430, 410, "frame-navy", { role: "decor" });
  [290, 390, 490].forEach((y, i) => addRect(s, `e${i}`, 1100, y, 290, 54, "soft", { label: "ARTIFACT", peerGroup: "evidenceRows" }));
  addLine(s, "rolesToHandoff", [{ x: 440, y: 395 }, { x: 610, y: 395 }], "role1", "handoff");
  addLine(s, "handoffToEvidence", [{ x: 830, y: 395 }, { x: 1030, y: 395 }], "handoff", "evidence");
}
function buildLoop(s) {
  addRect(s, "center", 620, 330, 360, 190, "soft", { label: "LEARNING" });
  const nodes = [
    [230, 220], [1070, 220], [1070, 565], [230, 565]
  ];
  nodes.forEach((p, i) => addRect(s, `loop${i}`, p[0], p[1], 300, 76, i === 0 ? "soft-red" : "normal", { label: `STEP ${i + 1}`, peerGroup: "loopNodes" }));
  addLine(s, "loopCurve", [], "loop0", "loop3", { kind: "curve", path: "M 530 258 C 760 120, 1060 120, 1070 258 C 1220 410, 1220 570, 1070 603 C 820 760, 500 760, 230 603 C 80 470, 80 320, 230 258" });
}
function buildLifecycle(s) {
  const xs = [180, 430, 680, 930, 1180, 1430];
  xs.forEach((x, i) => addRect(s, `life${i}`, x - 80, 330, 160, 76, i === 5 ? "focus" : "normal", { label: `STEP ${i + 1}`, peerGroup: "lifecycle" }));
  for (let i = 0; i < xs.length - 1; i += 1) addLine(s, `lc${i}`, [{ x: xs[i] + 80, y: 368 }, { x: xs[i + 1] - 80, y: 368 }], `life${i}`, `life${i + 1}`);
  addRect(s, "shared", 500, 560, 600, 52, "soft", { label: "SHARED RESULT" });
}
function buildBoundary(s) {
  [210, 330, 450].forEach((y, i) => addRect(s, `in${i}`, 130, y, 300, 70, i === 2 ? "soft-red" : "normal", { label: "LOCAL", peerGroup: "boundaryIn" }));
  addRect(s, "filter", 650, 300, 300, 220, "soft-red", { label: "FILTER" });
  [210, 330, 450].forEach((y, i) => addRect(s, `out${i}`, 1170, y, 300, 70, i === 1 ? "soft-red" : "normal", { label: "OUTPUT", peerGroup: "boundaryOut" }));
  addLine(s, "toFilter", [{ x: 430, y: 365 }, { x: 650, y: 365 }], "in1", "filter");
  addLine(s, "fromFilter", [{ x: 950, y: 365 }, { x: 1170, y: 365 }], "filter", "out1");
}
function buildTransfer(s) {
  [185, 260, 335, 410, 485, 560, 635].forEach((y, i) => addRect(s, `layer${i}`, 120, y, 300, 48, i === 6 ? "soft-red" : "normal", { label: `LAYER ${i + 1}`, peerGroup: "layers" }));
  addRect(s, "transfer", 610, 350, 250, 120, "focus", { label: "TRANSFER" });
  const xs = [1040, 1280], ys = [230, 390, 550]; let n = 0;
  ys.forEach(y => xs.forEach(x => addRect(s, `scene${n++}`, x, y, 200, 100, "soft", { label: "SCENE", peerGroup: "scenes" })));
  addLine(s, "layersToTransfer", [{ x: 420, y: 410 }, { x: 610, y: 410 }], "layer3", "transfer");
  addLine(s, "transferToScenes", [{ x: 860, y: 410 }, { x: 1040, y: 410 }], "transfer", "scene2");
}
function buildCapabilityMigrationMap(s) {
  addRect(s, "capabilityCore", 560, 300, 480, 210, "focus", { label: "TRANSFERABLE CAPABILITY" });
  const scenes = [{ id: "scene1", x: 130, y: 215 }, { id: "scene2", x: 1170, y: 215 }, { id: "scene3", x: 130, y: 545 }, { id: "scene4", x: 1170, y: 545 }];
  scenes.forEach((p, i) => addRect(s, p.id, p.x, p.y, 300, 82, i === 0 ? "soft-red" : "normal", { label: `SCENE ${i + 1}`, peerGroup: "migration-scenes" }));
  addLine(s, "coreToScene1", [{ x: 560, y: 350 }, { x: 490, y: 350 }, { x: 490, y: 256 }, { x: 430, y: 256 }], "capabilityCore", "scene1");
  addLine(s, "coreToScene2", [{ x: 1040, y: 350 }, { x: 1110, y: 350 }, { x: 1110, y: 256 }, { x: 1170, y: 256 }], "capabilityCore", "scene2");
  addLine(s, "coreToScene3", [{ x: 560, y: 460 }, { x: 490, y: 460 }, { x: 490, y: 586 }, { x: 430, y: 586 }], "capabilityCore", "scene3");
  addLine(s, "coreToScene4", [{ x: 1040, y: 460 }, { x: 1110, y: 460 }, { x: 1110, y: 586 }, { x: 1170, y: 586 }], "capabilityCore", "scene4");
}
function buildBenefit(s) {
  addRect(s, "before", 150, 280, 430, 240, "soft", { label: "BEFORE" });
  addRect(s, "after", 1010, 280, 430, 240, "soft-red", { label: "AFTER" });
  addRect(s, "gain", 640, 345, 320, 110, "focus", { label: "GAIN" });
  addRect(s, "memory", 450, 610, 700, 42, "navy", { label: "EXPERIENCE ACCUMULATES" });
}
function buildDecisionAskPoster(s) {
  addRect(s, "mainAsk", 270, 205, 1060, 110, "focus", { label: "CURRENT ASK" });
  [350, 445, 540, 635].forEach((y, i) => addRect(s, `support${i + 1}`, 160, y, 380, 62, i === 0 ? "soft-red" : "normal", { label: `SUPPORT ${i + 1}`, peerGroup: "support-asks" }));
  addRect(s, "decisionOutlet", 900, 415, 500, 180, "frame-red", { label: "ONE DECISION OUTLET" });
  [381, 476, 571, 666].forEach((y, i) => addLine(s, `supportToBus${i + 1}`, [{ x: 540, y }, { x: 680, y }, { x: 680, y: 505 }], `support${i + 1}`, "decisionOutlet"));
  addLine(s, "busToDecision", [{ x: 680, y: 505 }, { x: 900, y: 505 }], "support2", "decisionOutlet");
}
function buildLearning(s) {
  [215, 330, 445, 560].forEach((y, i) => {
    addRect(s, `no${i}`, 190, y, 72, 72, i === 0 ? "focus" : "navy", { label: String(i + 1), peerGroup: "numbers" });
    addRect(s, `ref${i}`, 310, y, 1080, 72, "normal", { label: "REFERENCE", peerGroup: "references" });
  });
}

const BUILDERS = {
  "brand-cover": buildCover,
  "brand-closing": buildClosing,
  "section-divider": buildDivider,
  "tension-radial": buildPoster,
  "tension-bridge": buildTensionBridge,
  "decision-keyword-board": buildDecisionKeywordBoard,
  "keyword-diagnosis": buildDiagnosis,
  "big-typography-benefit": buildBenefit,
  "nested-concept": buildNested,
  "concept-boundary": buildCompare,
  "case-evidence": buildEvidence,
  "landscape-grid": buildLandscape,
  "evidence-image-annotation": buildEvidenceImageAnnotation,
  "image-scene-mapping": buildImageSceneMapping,
  "architecture-map": buildMindmap,
  "dual-sensor-fusion-map": buildDualSensorFusion,
  "swimlane-flow": buildSwimlane,
  "before-after-orchestration": buildBeforeAfter,
  "fusion-pipeline-spine": buildFusionPipelineSpine,
  "responsibility-divider": buildResponsibilityDivider,
  "stage-gate-roadmap": buildStageGateRoadmap,
  "screenshot-mechanism": buildProgressive,
  "folder-zoom": buildFolderZoom,
  "state-evidence": buildStateEvidence,
  "tool-tree": buildToolTree,
  "artifact-contract": buildContractBoard,
  "decision-funnel": buildDecision,
  "qa-evidence-chain": buildQaChain,
  "role-evidence": buildRoleEvidence,
  "feedback-loop": buildLoop,
  "governance-lifecycle": buildLifecycle,
  "boundary-filter": buildBoundary,
  "method-transfer-map": buildTransfer,
  "capability-migration-map": buildCapabilityMigrationMap,
  "decision-ask-poster": buildDecisionAskPoster,
  "learning-path": buildLearning
};

function buildScene(contract) {
  const s = scene(contract);
  const family = String(contract.skeletonFamily || "").trim();
  const builder = BUILDERS[family];
  if (!builder) { s.rendererError = `没有覆盖 skeletonFamily=${family || "<missing>"} 的预览模式。`; return s; }
  builder(s);
  return s;
}

function rectStyle(style) {
  const map = {
    normal: [C.surface, C.navy, C.navy], soft: [C.blueSoft, C.line, C.navy], "soft-red": [C.redSoft, C.red, C.red],
    focus: [C.red, C.red, C.surface], navy: [C.navy, C.navy, C.surface], line: [C.surface, C.line, C.navy],
    "frame-red": ["none", C.red, C.red], "frame-navy": ["none", C.navy, C.navy]
  };
  return map[style] || map.normal;
}
function slideSvg(s) {
  const defs = `<defs><marker id="arrow-${escapeXml(s.id)}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${C.line}"/></marker></defs>`;
  const chrome = `<rect width="${W}" height="${H}" fill="${C.bg}"/><rect x="80" y="72" width="520" height="10" fill="${C.red}"/><rect x="1460" y="64" width="54" height="54" rx="4" fill="${C.cyan}"/><rect x="80" y="810" width="1440" height="7" fill="${C.red}"/>`;
  const objects = s.objects.map(o => {
    if (o.type === "rect") {
      const [fill, stroke, text] = rectStyle(o.style);
      const label = o.label ? `<text x="${o.x + o.w / 2}" y="${o.y + o.h / 2 + 8}" text-anchor="middle" font-family="Arial, Microsoft YaHei" font-size="24" font-weight="700" fill="${text}">${escapeXml(o.label)}</text>` : "";
      return `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="4"/>${label}`;
    }
    if (o.kind === "curve") return `<path d="${o.path}" fill="none" stroke="${C.line}" stroke-width="5" marker-end="url(#arrow-${escapeXml(s.id)})"/>`;
    const points = o.points.map(p => `${p.x},${p.y}`).join(" ");
    return `<polyline points="${points}" fill="none" stroke="${C.line}" stroke-width="5" stroke-linejoin="round" marker-end="url(#arrow-${escapeXml(s.id)})"/>`;
  }).join("");
  return `${defs}${chrome}${objects}`;
}

function contactSheetSvg(scenes, columns, cardW, includeReason = false) {
  const scale = cardW / W;
  const slideH = H * scale;
  const labelH = includeReason ? 56 : 34;
  const gapX = 26, gapY = 28, margin = 36;
  const rows = Math.ceil(scenes.length / columns);
  const width = margin * 2 + columns * cardW + (columns - 1) * gapX;
  const height = margin * 2 + rows * (slideH + labelH) + (rows - 1) * gapY;
  const groups = scenes.map((s, index) => {
    const col = index % columns, row = Math.floor(index / columns);
    const x = margin + col * (cardW + gapX), y = margin + row * (slideH + labelH + gapY);
    const title = `${s.contract.pageNo || index + 1}. ${shortLabel(s.title, s.id)}`;
    const reason = includeReason ? shortLabel((s.contract.qaFocus || []).join(" / ") || s.contract.risk || s.contract.visualSignature, "高风险页") : "";
    return `<g><rect x="${x - 4}" y="${y - 4}" width="${cardW + 8}" height="${slideH + 8}" rx="8" fill="#FFFFFF" stroke="#D8D4CB"/><g transform="translate(${x},${y}) scale(${scale})">${slideSvg(s)}</g><text x="${x}" y="${y + slideH + 24}" font-family="Arial, Microsoft YaHei" font-size="16" font-weight="700" fill="${C.navy}">${escapeXml(title)}</text>${includeReason ? `<text x="${x}" y="${y + slideH + 46}" font-family="Arial, Microsoft YaHei" font-size="13" fill="${C.mute}">${escapeXml(reason)}</text>` : ""}</g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#EAE9E4"/>${groups}</svg>`;
}

function isRisk(contract) {
  return contract.complexityBudget === "high" || (contract.screenshotSlots || []).length > 0 ||
    ["architecture-map", "tool-tree", "folder-zoom", "decision-funnel", "boundary-filter", "role-evidence", "feedback-loop", "tension-bridge",
      "decision-keyword-board", "fusion-pipeline-spine", "responsibility-divider", "evidence-image-annotation",
      "stage-gate-roadmap", "image-scene-mapping", "capability-migration-map", "decision-ask-poster"].includes(contract.skeletonFamily);
}

function geometrySignature(s) {
  const normalized = s.objects.map(object => {
    if (object.type === "rect") return ["r", object.role, object.x, object.y, object.w, object.h];
    if (object.kind === "curve") return ["c", object.path];
    return ["l", ...(object.points || []).flatMap(point => [point.x, point.y])];
  });
  return crypto.createHash("sha1").update(JSON.stringify(normalized)).digest("hex");
}
function duplicateGeometryFindings(scenes) {
  const groups = new Map();
  scenes.forEach(s => {
    const signature = geometrySignature(s);
    if (!groups.has(signature)) groups.set(signature, []);
    groups.get(signature).push(s);
  });
  const findings = [];
  groups.forEach(items => {
    if (items.length < 2) return;
    for (let i = 0; i < items.length; i += 1) for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i], b = items[j];
      const allowedFamily = a.contract.skeletonFamily === b.contract.skeletonFamily && ["section-divider"].includes(a.contract.skeletonFamily);
      const echoA = a.contract.echoWith || [], echoB = b.contract.echoWith || [];
      const echo = echoA.includes(b.id) || echoB.includes(a.id);
      if (!allowedFamily && !echo) findings.push({ page: `${a.id}/${b.id}`, type: "renderer-duplicate-geometry", message: "不同蓝图签名被渲染成相同几何；需要拆分预览模式或明确标记为有意呼应。" });
    }
  });
  return findings;
}

function main() {
  const args = argsOf(process.argv.slice(2));
  if (!fs.existsSync(args.blueprint)) throw new Error(`Missing blueprint: ${args.blueprint}`);
  const source = fs.readFileSync(args.blueprint);
  const data = JSON.parse(source.toString("utf8").replace(/^\uFEFF/, ""));
  const contracts = contractsOf(data);
  if (!contracts.length) throw new Error("layout-blueprint.json has no contracts/pages");
  const scenes = contracts.map(buildScene);
  const checks = scenes.map(s => ({ page: s.id, rendererError: s.rendererError || null, ...lintScene(s) }));
  const errors = checks.flatMap(check => [
    ...(check.rendererError ? [{ page: check.page, type: "renderer-coverage", message: check.rendererError }] : []),
    ...check.findings.filter(item => item.severity === "error").map(item => ({ page: check.page, ...item }))
  ]).concat(duplicateGeometryFindings(scenes));
  const warnings = checks.flatMap(check => check.findings.filter(item => item.severity !== "error").map(item => ({ page: check.page, ...item })));
  const digest = crypto.createHash("sha256").update(source).digest("hex");
  const qa = {
    version: "layout-blueprint-preview-qa.v2",
    source: path.relative(ROOT, args.blueprint).replace(/\\/g, "/"),
    sourceSha256: digest,
    generatedAt: new Date().toISOString(),
    verdict: errors.length ? "FIX-FIRST" : "PASS",
    geometry: { checked: true, pages: checks.length, errors: errors.length, warnings: warnings.length },
    errors,
    warnings,
    pages: checks.map(check => ({ page: check.page, verdict: check.rendererError ? "FIX-FIRST" : check.verdict, metrics: check.metrics }))
  };
  fs.mkdirSync(args.outDir, { recursive: true });
  fs.writeFileSync(path.join(args.outDir, "layout-blueprint-preview.svg"), contactSheetSvg(scenes, 4, 330), "utf8");
  const riskScenes = scenes.filter(s => isRisk(s.contract));
  fs.writeFileSync(path.join(args.outDir, "layout-blueprint-risk-preview.svg"), contactSheetSvg(riskScenes.length ? riskScenes : scenes.slice(0, 4), 2, 680, true), "utf8");
  fs.writeFileSync(path.join(args.outDir, "layout-blueprint-geometry.json"), JSON.stringify({ version: "blueprint-geometry.v2", sourceSha256: digest, scenes, checks }, null, 2) + "\n", "utf8");
  fs.writeFileSync(path.join(args.outDir, "layout-blueprint-preview-qa.json"), JSON.stringify(qa, null, 2) + "\n", "utf8");
  const md = [
    "# 蓝图预览 QA", "", `- 结论：${qa.verdict}`, `- 检查页面：${checks.length}`, `- 几何错误：${errors.length}`, `- 提醒：${warnings.length}`,
    "", "## 用户确认", "- `output/layout-blueprint-preview.svg`：仅几何蓝图，用于检查整套故事节奏和版面结构，不代表真实组件效果。", "- `output/layout-blueprint-risk-preview.svg`：高风险页仅几何放大预览。", "- `output/layout-blueprint-component-shortlist.svg`：当前主题下的真实组件候选预览。",
    "", "## 后续输入", "- `layout-blueprint.json`：蓝图合同。", "- `output/layout-blueprint-geometry.json`：组件选择和生产使用的几何证据。",
    "", "## 内部证据", "- `output/layout-blueprint-preview-qa.json`：机器可读关卡结果。", "",
    "## 错误", ...(errors.length ? errors.map(item => `- [${item.page} / ${item.type}] ${item.message}`) : ["- 无。"])
  ].join("\n") + "\n";
  fs.writeFileSync(path.join(args.outDir, "layout-blueprint-preview-qa.md"), md, "utf8");
  const defaultBlueprint = path.join(ROOT, "layout-blueprint.json");
  if (!process.argv.includes("--skip-component-shortlist") && path.resolve(args.blueprint) === path.resolve(defaultBlueprint)) {
    cp.execFileSync(process.execPath, [path.join(__dirname, "render-component-shortlist-preview.js")], { cwd: ROOT, stdio: "inherit" });
  }
  console.log(`${qa.verdict} rendered ${checks.length} blueprint pages; errors=${errors.length}`);
  if (errors.length) process.exitCode = 1;
}

if (require.main === module) main();
module.exports = { buildScene, contactSheetSvg, BUILDERS };
