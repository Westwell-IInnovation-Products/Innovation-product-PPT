// Leander Global 真实成片样例（对外：海外智慧港口 / ReeWell 平台介绍）。
const pptxgen = require("pptxgenjs");
const { getTheme } = require("./theme/tokens");
const { makeComponents } = require("./components/ppt-components");

const theme = getTheme("leander-global");
const pptx = new pptxgen();
pptx.defineLayout(theme.ppt.layout);
pptx.layout = theme.ppt.layout.name;
pptx.lang = "zh-CN";
const ui = makeComponents(pptx, theme);

// 1) 封面（深色港口大图）
ui.cover(pptx.addSlide(), {
  title: "ReeWell",
  subtitle: "Multi-modular Intelligent Dispatch & Management Platform\nfor Smart, Green and Autonomous Ports",
  date: "June 2026"
});

// 2) 议程（stepNav）
ui.stepNav(pptx.addSlide(), {
  title: "Today's Agenda",
  subtitle: "From the operational challenge to measurable, deployable value.",
  current: 0,
  steps: [
    { title: "The Challenge", desc: "Why today's port operations hit a ceiling.", points: ["Fragmented fleets", "Manual scheduling"] },
    { title: "The Platform", desc: "One AI platform across the whole yard.", points: ["Unified control", "World-model AI"] },
    { title: "Architecture", desc: "System layers and scenario engines.", points: ["Modular base", "Dual-engine"] },
    { title: "The Value", desc: "Proven, quantified, low-risk to deploy.", points: ["Throughput lift", "24/7 autonomy"] }
  ]
});

// 2.5) 分页页（white-underline 变体，参考 FMS）
ui.sectionDivider(pptx.addSlide(), {
  number: "01",
  title: "The Challenge",
  subtitle: "Why today's port operations hit a ceiling."
});

// 3) 痛点（painCards）
ui.painCards(pptx.addSlide(), {
  title: "Where Port Operations Hit a Ceiling",
  subtitle: "Three structural gaps that cap throughput today.",
  items: [
    { icon: "hub", title: "Mixed Fleets", desc: "Manned and unmanned trucks from many brands run on separate systems that do not talk to each other.", consequence: "Idle equipment & blind spots" },
    { icon: "clock", title: "Manual Scheduling", desc: "Dispatchers plan by experience; plans cannot adapt in real time to congestion or breakdowns.", consequence: "Lost throughput at peaks" },
    { icon: "chart", title: "No Foresight", desc: "Teams react after problems happen, with no way to test a plan before it hits the ground.", consequence: "Costly trial-and-error" }
  ]
});

// 4) 系统架构（Type A · archLayered）
ui.archLayered(pptx.addSlide(), {
  title: "Platform Architecture · System View",
  subtitle: "One modular base; an AI tool-chain across the full operating flow.",
  layers: [
    { label: "ReeWell Platform · AI tool-chain optimizing the full port operating flow" },
    { h: 196, cards: [
      { title: "WellFMS", sub: "Fleet Management", desc: "Standard onboarding of manned/unmanned, multi-brand vehicles under one control." },
      { title: "WellYMS", sub: "Yard Management", desc: "Storage, stacking and slotting managed down to the vehicle and location." },
      { title: "WellSmart", sub: "AI Scheduling", desc: "Real-time, dynamic whole-yard scheduling — the platform core.", focus: true },
      { title: "WellSimtec", sub: "Simulation", desc: "High-fidelity digital twin to validate plans before execution." },
      { title: "WellEMS", sub: "Energy Mgmt", desc: "Energy and carbon visibility turned into measurable savings." },
      { title: "Digital Brain", sub: "3D Twin", desc: "Live monitoring, real-time alerts and history replay." }
    ] },
    { label: "Core Algorithms & Models" },
    { h: 92, cards: [
      { title: "Unified Scheduling", desc: "Global coordination of horizontal & vertical, manned & unmanned transport." },
      { title: "Path Planning", desc: "Space-time consistent global and local path planning." }
    ] },
    { label: "Hymala Logistics Large-Model Matrix", sub: "Foundation models underpinning whole-yard coordination across all transport types" }
  ]
});

// 5) 场景架构（Type B · archDualEngine）
ui.archDualEngine(pptx.addSlide(), {
  title: "Scenario Architecture · Dual Engines",
  subtitle: "In-port operations × cross-border supply chain, in one closed loop.",
  topBand: "End-to-end production, transport and supply-chain management",
  centerUp: "Joint output: plans · supply · adjustments",
  center: {
    left: { name: "ReeWell", desc: "In-port operations control", icon: "hub" },
    right: { name: "LOOPO", desc: "Cross-border transport mgmt", icon: "route" },
    mid: "Information & command linkage",
    link: "Link"
  },
  leftWing: { top: "Production · Input", flow: "Data in", items: [
    { title: "Production Plan", sub: "tempo & exceptions", icon: "doc" },
    { title: "Resource Dispatch", sub: "equipment · vehicles", icon: "gear" },
    { title: "Inventory", sub: "raw · finished · yard", icon: "box" }
  ] },
  rightWing: { top: "Supply-chain · Output", flow: "Plan out", items: [
    { title: "Cross-border", sub: "customs · trade", icon: "globe" },
    { title: "SC Finance", sub: "credit · factoring", icon: "coin" },
    { title: "Risk & Data", sub: "control · insight", icon: "chart" }
  ] },
  base: { core: "WellSmart · Full-element AI scheduling base", feeders: ["Big Data", "Simulation", "AI Agents", "Tempo Scheduling"], boost: "AI boost" }
});

// 6) 量化价值（metricCards）
ui.metricCards(pptx.addSlide(), {
  title: "Proven, Quantified Value",
  subtitle: "Outcomes from live international deployments.",
  items: [
    { value: "30%", label: "Throughput Lift", desc: "Crane-to-yard cycle efficiency in mixed manned/unmanned fleets." },
    { value: "24/7", label: "Autonomy", desc: "Continuous unmanned operation under live AI scheduling." },
    { value: "12", label: "Live Ports", desc: "Deployments across three continents, and counting." }
  ],
  caveat: "Figures are deployment placeholders; production decks must cite source and boundary."
});

// 7) 部署路径（processTimeline，关键节点 azure）
ui.processTimeline(pptx.addSlide(), {
  title: "From Pilot to Full Autonomy",
  subtitle: "A staged, low-risk deployment path.",
  steps: [
    { title: "Assess", desc: "Survey yard, fleet and integration points." },
    { title: "Pilot", desc: "Deploy on one lane with humans in the loop." },
    { title: "Scale", key: true, desc: "Expand to the full yard under unified scheduling." },
    { title: "Autonomy", desc: "24/7 unmanned operation with AI foresight." }
  ],
  takeaway: "Each stage delivers value on its own — no big-bang cutover required."
});

// 8) 封底（深色）
ui.closing(pptx.addSlide(), {
  slogan: [{ text: "Smarter, Greener, " }, { text: "Autonomous Ports", hot: true }]
});

pptx.writeFile({ fileName: "output/leander-global-demo.pptx" })
  .then(f => console.log("wrote", f))
  .catch(e => { console.error(e); process.exit(1); });
