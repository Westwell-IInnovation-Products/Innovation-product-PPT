const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const { loadComponentRuntime, rendererStatus } = require("./component-runtime");
const { resolveToolchain, libreOfficeProfile } = require("./toolchain");

const ROOT = path.join(__dirname, "..");
function arg(name, fallback = "") { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
const THEME_NAME = arg("theme", process.argv.includes("--global") ? "leander-global" : "leander-base");
const OUT = path.resolve(arg("out-dir", path.join(ROOT, "output", `component-library-real-preview-${THEME_NAME}`)));
const COMPONENT_FILTER = arg("components", "").split(",").map(value => value.trim()).filter(Boolean);
const SLIDES = path.join(OUT, "slides");
const RENDERED = path.join(OUT, "rendered");
const EMBEDDED_PREVIEW_COMPONENTS = new Set(["evidenceLegend", "stageGateRail", "statusLegend"]);

function ensureClean(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function baseData(name, c) {
  return {
    title: name,
    subtitle: `${c.library || "component"} / ${c.level || "pattern"} / ${c.relationPrimitive || "visual"}`,
  };
}

function sampleFor(c) {
  const d = baseData(c.name, c);
  const items4 = [
    { title: "Intent", desc: "Clarify the page purpose and primary audience.", focus: true, icon: "target" },
    { title: "Structure", desc: "Convert scattered notes into a stable visual relationship.", icon: "layers" },
    { title: "Evidence", desc: "Keep source boundaries and reusable proof visible.", icon: "document" },
    { title: "QA", desc: "Check alignment, hierarchy, color meaning, and overflow.", icon: "shield" },
  ];
  const steps4 = [
    { title: "Intent", desc: "Define page goal", points: ["message", "audience"], focus: true },
    { title: "Route", desc: "Select visual form", points: ["relation", "density"] },
    { title: "Build", desc: "Render editable page", points: ["component", "tokens"] },
    { title: "Review", desc: "Fix visible issues", points: ["QA", "repair"] },
  ];
  const metrics = [
    { value: "70", label: "Components", desc: "Available registry entries" },
    { value: "64", label: "Renderable", desc: "Direct JS component functions" },
    { value: "6", label: "To Implement", desc: "Registry-only entries" },
  ];
  const columns = [
    { head: "Plan", items: ["story intent", "page role", "route options"] },
    { head: "Build", items: ["component", "theme token", "evidence slot"] },
    { head: "Review", items: ["overlap", "color meaning", "readability"], focus: true },
  ];
  const stages = [
    { name: "Input", items: ["brief", "outline", "constraints"] },
    { name: "Route", items: ["relation", "density", "candidate"] },
    { name: "Render", items: ["editable shapes", "theme tokens"], focus: true },
    { name: "QA", items: ["visual check", "repair"] },
  ];
  switch (c.name) {
    case "cover":
      return { ...d, title: "Presentation System", subtitle: "Editable component preview", tagline: "Theme tagline" };
    case "closing":
      return { ...d, slogan: [{ text: "Build once, " }, { text: "reuse well.", hot: true }], tagline: "Theme tagline" };
    case "sectionDivider":
      return { ...d, number: "01", title: "Component Library", subtitle: "Real rendered component preview" };
    case "stepNav":
      return { ...d, current: 1, steps: steps4 };
    case "painCards":
      return { ...d, items: items4.slice(0, 3).map((x, i) => ({ ...x, consequence: ["rework", "drift", "token waste"][i] })) };
    case "metricCards":
      return { ...d, items: metrics, caveat: "Numbers are sample values for component preview only." };
    case "evidenceBoard":
      return {
        ...d,
        placeholder: "ENGINEERING EVIDENCE — SOURCE SLOT",
        source: "Approved screenshot or simulation render",
        callouts: [
          { title: "Operating zone", body: "Anchor the first finding to a precise visible location.", focus: true },
          { title: "Constraint", body: "Show the engineering boundary beside the evidence." },
          { title: "Result state", body: "Separate observed proof from pending work." },
          { title: "Decision", body: "State the action supported by this evidence." }
        ]
      };
    case "compactKpiRail":
      return {
        ...d,
        items: [
          { label: "CYCLE TIME", value: "48.2", unit: "s", delta: "-3.8%", focus: true },
          { label: "THROUGHPUT", value: "126", unit: "moves/h", delta: "+6.1%" },
          { label: "QUEUE", value: "7", unit: "units", delta: "-2" },
          { label: "UTILIZATION", value: "84.6", unit: "%", delta: "+4.2%" },
          { label: "ENERGY", value: "18.4", unit: "kWh", delta: "-1.6%" },
          { label: "CONFLICTS", value: "2", unit: "events", delta: "-3" }
        ],
        notes: [
          { label: "Reading", body: "One compact metric rail keeps the engineering scale shared." },
          { label: "Boundary", body: "Preview values are illustrative and must be replaced by sourced project data." }
        ]
      };
    case "engineeringVariableTable":
      return {
        ...d,
        rows: [
          { variable: "Vehicle count", unit: "unit", baseline: "18", scenario: "22", delta: "+4", source: "scenario input" },
          { variable: "Mean speed", unit: "km/h", baseline: "14.8", scenario: "15.6", delta: "+0.8", source: "simulation output" },
          { variable: "Cycle time", unit: "s", baseline: "52.0", scenario: "48.2", delta: "-3.8", source: "simulation output" },
          { variable: "Queue threshold", unit: "unit", baseline: "8", scenario: "7", delta: "-1", source: "control rule" },
          { variable: "Energy model", unit: "kWh", state: "PENDING SIMULATION" },
          { variable: "Conflict rate", unit: "event/h", state: "PENDING MEASUREMENT" }
        ]
      };
    case "deltaCompare":
      return {
        ...d,
        rows: [
          { label: "Cycle time", baseline: "52.0 s", scenario: "48.2 s", delta: -3.8, deltaLabel: "-3.8 s" },
          { label: "Throughput", baseline: "118 /h", scenario: "126 /h", delta: 8, deltaLabel: "+8 /h" },
          { label: "Queue length", baseline: "9", scenario: "7", delta: -2, deltaLabel: "-2" },
          { label: "Energy", baseline: "18.4 kWh", state: "PENDING SIMULATION" }
        ]
      };
    case "statBand":
      return { ...d, focus: 1, stats: metrics.concat({ value: "24", label: "Slides", sub: "full deck example" }) };
    case "bigWordCardMatrix":
      return {
        ...d,
        words: ["Reusable", "Visual"],
        summary: "Turn a page-specific idea into a reusable expression pattern.",
        cards: [
          { title: "Relationship", desc: "Abstract the underlying logic instead of the current slide meaning." },
          { title: "Slots", desc: "Keep content, evidence, and labels easy to replace." },
          { title: "Theme", desc: "Use tokens so the component survives theme changes." },
          { title: "QA", desc: "Preserve alignment, hierarchy, and color intent." },
        ],
      };
    case "ringStats":
      return { ...d, focus: 1, items: [{ value: "72%", label: "Reusable", sub: "shareable patterns" }, { value: "64%", label: "Stable", sub: "QA passed" }, { value: "86%", label: "Aligned", sub: "theme tokens" }] };
    case "barChart":
      return { ...d, labels: ["A", "B", "C", "D"], series: [{ name: "Before", values: [42, 55, 38, 62] }, { name: "After", values: [68, 72, 61, 78] }], showValue: true };
    case "lineChart":
      return { ...d, labels: ["W1", "W2", "W3", "W4"], series: [{ name: "Cycle", values: [20, 32, 48, 70] }, { name: "Quality", values: [52, 58, 66, 76] }], smooth: true };
    case "pieBreakdown":
      return { ...d, listTitle: "Share", items: [{ label: "Components", value: 45 }, { label: "Theme", value: 20 }, { label: "QA", value: 22 }, { label: "Images", value: 13 }], unit: "%" };
    case "radar":
      return { ...d, axes: ["Logic", "Beauty", "Reuse", "Evidence", "QA"], series: [{ name: "Current", values: [4, 3, 5, 4, 3] }, { name: "Target", values: [5, 5, 5, 5, 5] }] };
    case "waterfall":
      return { ...d, start: { label: "Base", value: 40 }, deltas: [{ label: "Route", value: 15 }, { label: "QA", value: 10 }, { label: "Repair", value: -6 }], end: { label: "Result", value: 59 } };
    case "heatmap":
      return { ...d, cols: ["Logic", "Visual", "Token", "Reuse"], rows: [{ label: "Outline", values: [0.7, 0.4, 0.6, 0.5] }, { label: "Layout", values: [0.8, 0.9, 0.5, 0.7] }, { label: "QA", values: [0.9, 0.8, 0.4, 0.8] }], showValue: true, highLabel: "High", lowLabel: "Low" };
    case "processTimeline":
      return { ...d, steps: steps4, takeaway: "A staged workflow reduces drift and repair cost." };
    case "timelineVertical":
      return { ...d, items: ["Brief", "Blueprint", "Anchor", "Production", "QA"].map((x, i) => ({ date: `0${i + 1}`, title: x, desc: "Phase output with review evidence.", focus: i === 2 })) };
    case "milestoneTimeline":
      return { ...d, nodes: steps4.map((s, i) => ({ label: `0${i + 1}`, theme: s.title, items: s.points, focus: i === 1, icon: ["target", "route", "gear", "shield"][i] })) };
    case "pipelineFlow":
      return { ...d, phases: [{ name: "Plan", span: 2 }, { name: "Build", span: 2, focus: true }, { name: "Review", span: 2 }], steps: ["Brief", "Layout", "Theme", "Page", "Render", "QA"].map((t, i) => ({ t, focus: i === 3 })), summary: [{ t: "Constraint", b: "Route before drawing", accent: true }, { t: "Output", b: "Editable slide with QA evidence" }] };
    case "valueChain":
      return { ...d, stages, focus: 2 };
    case "swimlaneProcess":
      return { ...d, phases: ["Plan", "Build", "Check", "Ship"], lanes: [{ role: "Planner", steps: ["brief", "outline", null, null] }, { role: "Designer", steps: [null, { label: "visual", focus: true }, "repair", null] }, { role: "Reviewer", steps: [null, null, "QA", "pass"] }] };
    case "gantt":
      return { ...d, periods: ["W1", "W2", "W3", "W4"], tasks: [{ name: "Blueprint", start: 0, span: 1 }, { name: "Components", start: 1, span: 2, focus: true }, { name: "QA", start: 3, span: 1, milestone: 3 }], corner: "Task" };
    case "stateFlow":
      return { ...d, main: [{ name: "Draft", status: "draft", ops: ["edit", "submit"] }, { name: "Queued", status: "queued", ops: ["wait"] }, { name: "Running", status: "running", ops: ["pause", "stop"] }, { name: "Done", status: "done", ops: ["export"] }] };
    case "workflowConfig":
      return { ...d, flow: [{ name: "Input", desc: "source" }, { name: "Route", desc: "visual", hot: true }, { name: "Build", desc: "page" }, { name: "QA", desc: "gate" }], specs: metrics.map(m => ({ title: m.label, value: m.value, desc: m.desc })), note: "Preview data only." };
    case "roadmapPhases":
      return { ...d, phases: [{ name: "Now", tag: "Q1", status: "now", items: ["route", "theme", "QA"] }, { name: "Next", tag: "Q2", status: "future", items: ["agents", "library", "sync"] }, { name: "Later", tag: "Q3", status: "excluded", items: ["public assets", "external demo"] }] };
    case "goalPath":
      return { ...d, short: { name: "Short", sub: "2 weeks", head: "Reduce repair cost", items: ["route pages", "render evidence", "QA checks"] }, long: { name: "Long", sub: "team asset", head: "Reusable harness", items: ["component pool", "version sync", "shared lessons"] }, banner: "Personal fixes become team assets." };
    case "actionTracks":
      return { ...d, tracks: items4.map((x, i) => ({ icon: x.icon, name: x.title, action: x.desc, owner: ["A", "B", "C", "D"][i], time: `W${i + 1}`, status: i === 2 ? "focus" : "open", focus: i === 2 })) };
    case "archLayered":
      return { ...d, layers: [{ label: "Presentation Harness" }, { h: 170, cards: items4.map((x, i) => ({ title: x.title, sub: `Layer ${i + 1}`, desc: x.desc, focus: i === 1 })) }, { label: "Shared Token / Component / QA Rules" }, { h: 110, cards: [{ title: "Theme", desc: "tokens" }, { title: "Components", desc: "patterns" }, { title: "QA", desc: "checks" }] }] };
    case "archDualEngine":
      return { ...d, topBand: "Plan and Render engines work together", centerUp: "Shared evidence", center: { left: { name: "Planner", desc: "intent", icon: "target" }, right: { name: "Renderer", desc: "visual", icon: "gear" }, mid: "binding", link: "sync" }, leftWing: { top: "Inputs", flow: "brief", items: items4.slice(0, 3).map(x => ({ title: x.title, sub: x.desc, icon: x.icon })) }, rightWing: { top: "Outputs", flow: "deck", items: items4.slice(1, 4).map(x => ({ title: x.title, sub: x.desc, icon: x.icon })) }, base: { core: "QA Gate", feeders: ["render", "inspect", "repair"], boost: "pass" } };
    case "systemArchitectureCenter":
      return { ...d, inputTitle: "Inputs", outputTitle: "Outputs", inputs: ["brief", "outline", "theme", "rules"], coreTitle: "Harness Core", coreSubtitle: "controlled PPT production", modules: ["route", "component", "state", "QA", "agents", "learning"], outputs: ["deck", "PNG", "notes", "lessons"] };
    case "moduleCorrespondenceMap":
      return { ...d, rootTitle: "innovation-products-ppt/", rootDesc: "Executable PPT production scaffold.", folders: ["SKILL.md", "references/", "templates/", "components/", "theme/", "tools/"].map((name, i) => ({ name, role: ["router", "rules", "scaffold", "visual patterns", "tokens", "gates"][i], focus: i === 3 })), modules: [{ title: "Router", label: "SKILL.md", sources: ["phase gates"], desc: "Entry and workflow rules", focus: true }, { title: "References", label: "rules", sources: ["brief", "qa"], desc: "Stage-specific instructions" }, { title: "Scaffold", label: "project", sources: ["pages", "output"], desc: "One folder per slide" }, { title: "Visual Assets", label: "components", sources: ["theme", "library"], desc: "Reusable expression units" }, { title: "QA System", label: "tools", sources: ["render", "verify"], desc: "Rendered gate" }, { title: "Learning Loop", label: "lessons", sources: ["feedback"], desc: "Promote common fixes" }] };
    case "toolSystemTree":
      return { ...d, root: { title: "Tool System", sub: "Visual Tools" }, branches: [{ title: "Theme", sub: "Theme Library", iconType: "theme", detail: { title: "Two built-in themes", items: [["Base", "internal sharing"], ["Global", "formal external"]] } }, { title: "Components", sub: "Component Library", iconType: "component", focus: true, detail: { title: "Reusable visual patterns", items: [["Base", "57 components"], ["Editorial", "7 layouts"], ["Bespoke", "6 patterns"]] } }, { title: "Images", sub: "Image Tools", iconType: "image", detail: { title: "Reserved image workflow", items: [["Slot", "image placeholder"], ["Prompt", "prompt spec"], ["Fallback", "editable vector"]] } }], enginePanel: { title: "Per-page call logic", sub: "Visual Selection Engine", steps: [["Intent", "what to explain"], ["Relation", "how it relates"], ["Candidates", "component / image / custom"], ["Score", "fit and risk"], ["Bind", "page.js binding"], ["QA", "rendered review"]], focusIndex: 3 } };
    case "tierStack":
      return { ...d, tiers: [{ name: "Cloud", sub: "global", items: ["planner", "version", "QA"], focus: true }, { name: "Edge", sub: "local", items: ["page", "render", "repair"] }, { name: "Device", sub: "asset", items: ["image", "chart", "evidence"] }], note: "Layered dependency preview." };
    case "orgTree":
      return { ...d, root: { name: "Shared Skill" }, children: [{ name: "Planner", items: ["outline", "intent"] }, { name: "Designer", items: ["theme", "layout"], focus: true }, { name: "Reviewer", items: ["QA", "repair"] }, { name: "Presenter", items: ["story", "notes"] }] };
    case "topology":
      return { ...d, cloud: { name: "Shared Repo" }, edges: [{ name: "Skill A" }, { name: "Skill B" }, { name: "Skill C" }], devices: ["theme", "components", "QA", "lessons", "output"].map(name => ({ name })) };
    case "platformTrend":
      return { ...d, center: "Shared Trend", centerBody: "A repeated signal across platform, product, and project layers.", cols: [
        { title: "Industry Signal", desc: "Agent work is shifting from prompt-only to controlled execution systems.", items: ["agent", "workflow", "tool"] },
        { title: "Platform Move", desc: "Capabilities are packaged as reusable harnesses with state and gates.", items: ["routing", "state", "QA"], focus: true },
        { title: "Project Value", desc: "Local practice becomes reusable assets instead of one-off pages.", items: ["components", "lessons", "templates"] }
      ] };
    case "problemMap":
      return { ...d, leftTitle: "Before", rightTitle: "After", rows: [
        { name: "Drift", problem: "context moves away", mechanism: "State", result: "keep local memory" },
        { name: "Rework", problem: "changes spread too far", mechanism: "Scope", result: "repair the smallest unit", focus: true },
        { name: "Noise", problem: "too much context", mechanism: "Route", result: "read only needed files" },
        { name: "Quality", problem: "visual issues slip through", mechanism: "QA", result: "rendered evidence gate" }
      ] };
    case "repairScope":
      return { ...d, levels: [
        { title: "Page", body: "repair one page folder", check: "render page PNG", focus: true },
        { title: "Component", body: "repair reusable block", check: "rerender affected pages" },
        { title: "Theme", body: "repair shared tokens", check: "full deck gate" }
      ], rule: "Choose the smallest affected unit first; expand scope only when shared assets changed." };
    case "shareBoundary":
      return { ...d, zones: [
        { title: "Share", body: "common logic, neutral components, theme tokens", items: ["component", "template", "QA rule"], focus: true },
        { title: "Review", body: "needs judgment before promotion", items: ["variant", "example", "lesson"] },
        { title: "Keep Local", body: "project-specific or sensitive content", items: ["customer data", "private file", "one-off claim"] }
      ], bottom: "Reusable assets enter the public pool; sensitive or deeply customized content stays local." };
    case "scenarioBankGrid":
      return { ...d, items: [
        { title: "Project", desc: "case-specific scene", icon: "document" },
        { title: "Process", desc: "repeatable workflow", icon: "route", focus: true },
        { title: "Component", desc: "visual expression", icon: "layers" },
        { title: "Evidence", desc: "source-backed proof", icon: "target" },
        { title: "QA", desc: "check profile", icon: "shield" },
        { title: "Lesson", desc: "promoted rule", icon: "chart" }
      ] };
    case "positioningMatrix":
      return { ...d, xLabel: "Higher reuse", yLabel: "Higher impact", legend: "Use the upper-right area for high-impact, high-reuse candidates. Red marks the recommended focus.", items: [
        { name: "A", x: 0.72, y: 0.78, desc: "promote", focus: true },
        { name: "B", x: 0.42, y: 0.62, desc: "adapt" },
        { name: "C", x: 0.30, y: 0.34, desc: "local" },
        { name: "D", x: 0.68, y: 0.38, desc: "variant" }
      ] };
    case "hubSpokeCapability":
      return { ...d, center: "Innovation-Products_ppt", takeaway: "One harness combines routing, components, QA, and learning.", modules: items4.concat({ title: "Learning", desc: "promote lessons", icon: "chart" }).map((x, i) => ({ title: x.title, desc: x.desc, icon: x.icon || "document", status: i === 1 ? "key" : "" })) };
    case "hubRadial":
      return { ...d, center: { name: "Harness", sub: "Reusable production logic" }, spokes: items4 };
    case "cycleLoop":
      return { ...d, center: "Learning Loop", noteTitle: "Why loop?", note: "Every repair should become a reusable check.", steps: steps4.map(s => ({ title: s.title, desc: s.desc })) };
    case "coverageMap":
      return { ...d, region: "Component Coverage", hub: { x: 0.48, y: 0.52 }, sites: [{ x: 0.25, y: 0.35, label: "Base" }, { x: 0.65, y: 0.3, label: "Editorial", focus: true }, { x: 0.72, y: 0.68, label: "Bespoke" }, { x: 0.38, y: 0.72, label: "Images" }], legendTitle: "Library Areas" };
    case "imageGallery":
      return { ...d, items: items4.map((x, i) => ({ title: x.title, desc: x.desc, icon: x.icon, focus: i === 1, placeholder: "image / screenshot slot" })) };
    case "annotatedDiagram":
      return { ...d, icon: "layers", placeholder: "diagram or product image slot", markers: [{ x: 0.28, y: 0.35, n: 1 }, { x: 0.58, y: 0.52, n: 2 }, { x: 0.78, y: 0.72, n: 3 }], legendTitle: "Annotations", legend: [{ n: 1, text: "Input boundary" }, { n: 2, text: "Core mechanism" }, { n: 3, text: "Output evidence" }] };
    case "workbenchMock":
      return { ...d, tree: [{ name: "Brief", sub: "source" }, { name: "Layout", sub: "selected", sel: true }, { name: "Component", sub: "binding" }, { name: "QA", sub: "pass" }], objects: [{ x: 0.25, y: 0.35, label: "A", hot: true }, { x: 0.5, y: 0.55, label: "B" }, { x: 0.72, y: 0.42, label: "C" }], attrs: [{ k: "route", v: "component" }, { k: "theme", v: "base" }, { k: "status", v: "review" }] };
    case "dashboardMock":
      return { ...d, progress: 64, moves: "64 / 70", eta: "6 pending", start: "14:00", markers: [{ x: 0.25, y: 0.35, hot: true }, { x: 0.5, y: 0.5 }, { x: 0.7, y: 0.4 }], speeds: ["1x", "2x", "4x"] };
    case "priorityPyramid":
      return { ...d, levels: [{ name: "Critical", desc: "must fix", focus: true }, { name: "Important", desc: "review next" }, { name: "Reusable", desc: "promote later" }] };
    case "funnel":
      return { ...d, stages: [{ name: "All Ideas", value: 70 }, { name: "Candidates", value: 42 }, { name: "Selected", value: 18, focus: true }, { name: "Shipped", value: 12 }] };
    case "twoOptionCompare":
      return { ...d, options: [{ name: "Ad hoc page", points: ["fast start", { text: "hard to reuse", no: true }, { text: "weak QA", no: true }] }, { name: "Harness page", recommended: true, points: ["stable route", "component reuse", "rendered QA"] }], recommendLabel: "Recommended" };
    case "beforeAfter":
      return { ...d, leftTitle: "Before", rightTitle: "After", rows: [{ old: "Prompt once", neu: "Stage by stage" }, { old: "Manual repair", neu: "Small-slice repair" }, { old: "Lost lessons", neu: "Promoted checks" }] };
    case "lineCompare":
      return { ...d, columns: [{ name: "Prompt", tag: "single task", items: ["quick", "unstable", "hard to reuse"] }, { name: "Skill", tag: "repeatable task", focus: true, items: ["rules", "tools", "QA"] }, { name: "Harness", tag: "task family", items: ["workflow", "state", "agents"] }], banner: "Harness turns one-off work into reusable production." };
    case "lineTable":
      return { ...d, corner: "Dimension", columns: ["Prompt", "Skill", "Harness"], rows: [{ label: "Scope", cells: ["single", "repeatable", "system"] }, { label: "QA", cells: ["manual", "rule-based", "rendered"], focus: true }, { label: "Reuse", cells: ["low", "medium", "high"] }] };
    case "bulletColumns":
      return { ...d, columns, focus: 1, banner: "Problems converge into the need for a stable harness." };
    case "panelDuo":
      return { ...d, left: { head: "Problem", focus: true, entries: [{ name: "Drift", desc: "Later pages lose context" }, { name: "Overlap", desc: "Visual QA misses obvious issues" }] }, right: { head: "Mechanism", entries: [{ name: "State", desc: "One folder per page" }, { name: "Gate", desc: "Rendered QA before delivery" }] } };
    case "zoneGrid":
      return { ...d, zones: items4.map((x, i) => ({ icon: x.icon, t: x.title, tag: `Z${i + 1}`, b: x.desc, focus: i === 1 })), cols: 2, banner: "Use zones when each block is independent but comparable." };
    case "splitDossier":
      return { ...d, identity: { name: "Component", sub: "Reusable visual unit", facts: [["Logic", "relationship-first abstraction"], ["Binding", "theme tokens and page data"], ["QA", "rendered visual evidence"]] }, zones: items4.map((x, i) => ({ t: x.title, b: x.desc, focus: i === 2 })), cols: 2 };
    case "imageSlot":
      return { x: 420, y: 280, w: 1080, h: 480, placeholder: "reserved image / image2 prompt slot", ground: "surface3" };
    case "sceneColumns":
      return { ...d, items: items4.map((x, i) => ({ t: x.title, tag: `Scene ${i + 1}`, b: x.desc, icon: x.icon, req: ["simple", "explanatory"] })) };
    case "quoteHighlight":
      return { ...d, quote: [{ text: "A component is not a page meaning; " }, { text: "it is a reusable relationship.", hot: true }], by: "Innovation-Products_ppt component principle" };
    case "numberedList":
      return { ...d, focus: 2, items: steps4.map(s => ({ title: s.title, desc: s.desc })) };
    case "pillarTrio":
      return { ...d, focus: 1, pillars: [{ name: "Route", tag: "intent", icon: "target", desc: "choose expression", points: ["relation", "density"] }, { name: "Render", tag: "editable", icon: "gear", desc: "build page", points: ["theme", "component"] }, { name: "Review", tag: "quality", icon: "shield", desc: "fix issues", points: ["QA", "learning"] }] };
    case "tierLadder":
      return { ...d, tiers: [{ no: 1, name: "Core", sub: "shared", focus: true, vendors: [{ name: "Base", stats: [{ v: "57", l: "components" }, { v: "2", l: "themes" }] }, { name: "QA", stats: [{ v: "zh", l: "checks" }, { v: "PNG", l: "evidence" }] }] }, { no: 2, name: "Extension", sub: "project", vendors: [{ name: "Bespoke", stats: [{ v: "6", l: "patterns" }, { v: "P0", l: "review" }] }] }], dims: ["reuse", "stability", "visual quality"] };
    case "capabilityMatrix":
      return { ...d, corner: "Capability", columns: ["Manual", "Skill", "Harness"], focusCol: 2, rows: [{ label: "Context", cells: [false, { level: 2, of: 3 }, true] }, { label: "QA", cells: [false, "partial", true], focus: true }, { label: "Reuse", cells: ["low", "medium", "high"] }] };
    case "quadrantMatrix":
      return { ...d, xLabel: "Reuse", yLabel: "Impact", items: [{ name: "Theme", x: 0.3, y: 0.6 }, { name: "QA Gate", x: 0.75, y: 0.8, focus: true }, { name: "Custom", x: 0.25, y: 0.25 }] };
    case "evidenceLegend":
      return { ...d, x: 250, y: 360, w: 1420, h: 250, title: "Evidence semantics", items: [{ label: "Source", meaning: "Directly traceable evidence", colorToken: "teal" }, { label: "Derived", meaning: "Interpretation from the source", colorToken: "accent" }, { label: "Boundary", meaning: "Assumption or unverified edge", colorToken: "warn" }], sourceNote: "Legend labels and colors must match the host visual." };
    case "stageGateRail":
      return { ...d, x: 180, y: 335, w: 1560, h: 380, currentStage: 1, stages: [{ label: "Discover", gate: "G1", status: "complete", deliverable: "Validated intent" }, { label: "Design", gate: "G2", status: "current", deliverable: "Approved blueprint" }, { label: "Build", gate: "G3", status: "upcoming", deliverable: "Editable output" }, { label: "Review", gate: "G4", status: "upcoming", deliverable: "QA evidence" }] };
    case "statusLegend":
      return { ...d, x: 300, y: 370, w: 1320, h: 250, statuses: [{ label: "Complete", meaning: "Evidence is available", stateToken: "complete" }, { label: "Current", meaning: "Active focus or state", stateToken: "current" }, { label: "Partial", meaning: "Some evidence is missing", stateToken: "partial" }, { label: "Planned", meaning: "Not yet implemented", stateToken: "planned" }] };
    default:
      if (c.relationPrimitive === "contrast") return { ...d, leftTitle: "Before", rightTitle: "After", rows: [{ old: "manual", neu: "systematic" }, { old: "single page", neu: "reusable pattern" }] };
      if (c.relationPrimitive === "sequence") return { ...d, steps: steps4 };
      if (c.relationPrimitive === "evidence") return { ...d, items: metrics };
      return { ...d, items: items4 };
  }
}

function statusSlide(slide, ui, c, status, message) {
  ui.header(slide, `${c.name} - ${status}`, `${c.library || "component"} / ${c.level || ""} / ${c.relationPrimitive || ""}`);
  ui.rect(slide, 180, 320, 1560, 280, { fill: "FFF2F2", line: "CF111A", lineWidth: 1.5, round: true });
  ui.addText(slide, 230, 365, 1460, 54, status, { size: 42, color: "CF111A", bold: true, fontFace: "Century Gothic" });
  ui.addText(slide, 230, 450, 1460, 92, message, { size: 22, color: "061D58", fontFace: "Century Gothic" });
  ui.addText(slide, 230, 548, 1460, 34, `designStatus=${c.designStatus || "usable"} | tags=${(c.tags || []).slice(0, 8).join(", ")}`, { size: 16, color: "7A7F87", fontFace: "Century Gothic", fit: "shrink" });
  ui.footer(slide);
}

function availabilityBadge(slide, ui, c, runtimeStatus) {
  const blocked = !runtimeStatus.selectable;
  const fill = blocked ? "FFF2F2" : "F4F8FF";
  const line = blocked ? "CF111A" : "061D58";
  const label = blocked ? `BLOCKED: ${c.designStatus || runtimeStatus.renderStatus}` : `OK: ${runtimeStatus.renderStatus}`;
  const primary = (c.relationships || [])[0] || "none";
  const secondary = (c.secondaryRelationships || (c.relationships || []).slice(1)).join("+") || "none";
  const curator = `${c.level || "unknown"} | ${primary} | secondary=${secondary} | cap=${c.selectionConfidenceCap ?? "n/a"} | ${c.metadataSource || "unknown"} | ${c.designStatus || "usable"}`;
  ui.rect(slide, 1110, 150, 720, 70, { fill, line, lineWidth: 1, round: true });
  ui.addText(slide, 1128, 161, 684, 16, label, { size: 9.5, color: line, bold: true, fontFace: "Century Gothic", fit: "shrink" });
  ui.addText(slide, 1128, 188, 684, 14, curator, { size: 8.2, color: line, fontFace: "Century Gothic", fit: "shrink" });
}

async function main() {
  ensureClean(OUT);
  fs.mkdirSync(SLIDES, { recursive: true });
  fs.mkdirSync(RENDERED, { recursive: true });

  const registry = JSON.parse(fs.readFileSync(path.join(__dirname, "component-registry.json"), "utf8"));
  const wanted = new Set(COMPONENT_FILTER.map(name => name.toLowerCase()));
  const selectedComponents = wanted.size ? registry.components.filter(component => wanted.has(String(component.name).toLowerCase())) : registry.components;
  const missing = COMPONENT_FILTER.filter(name => !selectedComponents.some(component => String(component.name).toLowerCase() === name.toLowerCase()));
  if (missing.length) throw new Error(`Unknown component preview IDs: ${missing.join(", ")}`);
  const runtime = loadComponentRuntime(THEME_NAME);
  const { theme, pptx, ui, components } = runtime;
  pptx.author = "Innovation-Products_ppt";
  pptx.company = "Westwell";
  pptx.subject = "Real component library preview";
  pptx.title = "Innovation-Products_ppt Real Component Preview";
  pptx.lang = "en-US";
  const manifest = [];
  selectedComponents.forEach((c, index) => {
    const slide = pptx.addSlide();
    slide.addNotes(`${String(index + 1).padStart(2, "0")} ${c.name}`);
    const runtimeStatus = rendererStatus(c, runtime);
    const fn = components[c.name];
    if (typeof fn !== "function") {
      statusSlide(slide, ui, c, "NO RENDERER", runtimeStatus.reason);
      manifest.push({ index: index + 1, name: c.name, status: "no-renderer", designStatus: c.designStatus || "usable", selectable: false, reason: runtimeStatus.reason });
      return;
    }
    try {
      if (c.name === "imageSlot") {
        ui.header(slide, c.name, `${c.library || "component"} / ${c.level || "visual-part"} / ${c.relationPrimitive || "scene"}`);
        fn(slide, sampleFor(c));
        ui.addText(slide, 420, 790, 1080, 42, "This is a visual-part component: it reserves a generated/real image slot inside a page.", {
          size: 18,
          color: "061D58",
          align: "center",
          fontFace: "Century Gothic",
        });
        ui.footer(slide);
      } else if (EMBEDDED_PREVIEW_COMPONENTS.has(c.name)) {
        ui.header(slide, c.name, `${c.library || "component"} / ${c.level || "layout-block"} / ${c.relationPrimitive || "visual"}`);
        fn(slide, sampleFor(c));
        ui.footer(slide);
      } else {
        fn(slide, sampleFor(c));
      }
      availabilityBadge(slide, ui, c, runtimeStatus);
      manifest.push({ index: index + 1, name: c.name, status: runtimeStatus.selectable ? "rendered" : "rendered-blocked", renderStatus: runtimeStatus.renderStatus, designStatus: c.designStatus || "usable", selectable: runtimeStatus.selectable, reason: runtimeStatus.reason, level: c.level, primaryRelationship: (c.relationships || [])[0] || null, secondaryRelationships: c.secondaryRelationships || (c.relationships || []).slice(1), selectionConfidenceCap: c.selectionConfidenceCap, metadataSource: c.metadataSource, metadataReviewStatus: c.metadataReviewStatus });
    } catch (err) {
      statusSlide(slide, ui, c, "RENDER FAILED", err && err.message ? err.message : String(err));
      manifest.push({ index: index + 1, name: c.name, status: "render-failed", designStatus: c.designStatus || "usable", selectable: false, error: err && err.stack ? err.stack : String(err) });
    }
  });

  const pptxPath = path.join(OUT, "component-library-real-preview.pptx");
  await pptx.writeFile({ fileName: pptxPath });
  fs.writeFileSync(path.join(OUT, "preview-manifest.json"), JSON.stringify({ version: "component-theme-render.v2", generatedAt: new Date().toISOString(), theme: THEME_NAME, componentCount: selectedComponents.length, requestedComponents: COMPONENT_FILTER, manifest }, null, 2));

  const renderTools = resolveToolchain();
  if (renderTools.soffice && renderTools.pdftoppm) {
    const profile = libreOfficeProfile("lo_component_preview");
    cp.execFileSync(renderTools.soffice, ["--headless", "-env:UserInstallation=" + profile, "--convert-to", "pdf", "--outdir", RENDERED, pptxPath], { stdio: "ignore" });
    const pdf = path.join(RENDERED, "component-library-real-preview.pdf");
    cp.execFileSync(renderTools.pdftoppm, ["-png", "-r", "110", pdf, path.join(SLIDES, "slide")], { stdio: "ignore" });
  }

  console.log(JSON.stringify({
    out: OUT,
    theme: THEME_NAME,
    pptx: pptxPath,
    rendered: manifest.filter(x => x.status === "rendered").length,
    renderedBlocked: manifest.filter(x => x.status === "rendered-blocked").length,
    noRenderer: manifest.filter(x => x.status === "no-renderer").length,
    failed: manifest.filter(x => x.status === "render-failed").length,
  }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
