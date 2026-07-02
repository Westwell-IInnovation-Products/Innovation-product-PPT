// Leander Global 主题锚样张：验证 chrome 签名层（封面/页眉/页脚/封底）+ 内容组件换肤。
const pptxgen = require("pptxgenjs");
const { getTheme } = require("./theme/tokens");
const { makeComponents } = require("./components/ppt-components");

const theme = getTheme("leander-global");
const pptx = new pptxgen();
pptx.defineLayout(theme.ppt.layout);
pptx.layout = theme.ppt.layout.name;
pptx.lang = "zh-CN";
const ui = makeComponents(pptx, theme);

// 1) 深色港口大图封面
ui.cover(pptx.addSlide(), {
  title: "ReeWell",
  subtitle: "The World's First Multi-modular Intelligent Dispatch\nand Management Platform Powered by an AI World Model",
  date: "June 2026"
});

// 2) 干净白底极简封面（同主题、按场合切换）
ui.cover(pptx.addSlide(), {
  coverStyle: "white-minimal",
  title: "FMS Clarification",
  subtitle: "Fleet Management System · Technical Overview"
});

// 3) 内容页：三指标卡（验证海军蓝标题 + 点状 azure 分隔线 + azure 焦点卡）
ui.metricCards(pptx.addSlide(), {
  title: "Proven At Scale",
  subtitle: "Quantified value across global smart-port deployments.",
  items: [
    { value: "30%", label: "Throughput", desc: "Crane-to-yard cycle efficiency lift in mixed fleets." },
    { value: "24/7", label: "Autonomy", desc: "Continuous unmanned operation under live scheduling." },
    { value: "12", label: "Ports", desc: "Live international deployments across three continents." }
  ],
  caveat: "Sample figures are layout placeholders; real decks must label source and boundary."
});

// 4) 内容页：四列机制（验证同级藏蓝、单点 azure 焦点）
ui.fourColumnMechanism(pptx.addSlide(), {
  title: "One Platform, Four Engines",
  subtitle: "Equal capabilities in navy; the differentiator highlighted in azure.",
  focus: 2,
  items: [
    { title: "Dispatch", close: "Global optimum", icon: "hub", desc: "Real-time horizontal and vertical equipment scheduling across the whole yard." },
    { title: "Simulation", close: "Predict before act", icon: "chart", desc: "High-fidelity digital twin to validate plans before they hit the ground." },
    { title: "AI Model", close: "The differentiator", icon: "gear", desc: "Logistics world model driving decisions that get better with every cycle." },
    { title: "Energy", close: "Greener ops", icon: "leaf", desc: "Energy and carbon visibility turned into measurable savings." }
  ]
});

// 5) 章节分隔（验证 azure 标题 + 焦点 chip）
ui.sectionDivider(pptx.addSlide(), {
  number: "02",
  title: "Built For International Operations",
  subtitle: "Formal, English-first, ready for the global stage.",
  keywords: ["Smart", "Green", "Autonomous"]
});

// 6) 深色封底
ui.closing(pptx.addSlide(), {
  slogan: [{ text: "Taking One Westwell, " }, { text: "Building the Future", hot: true }]
});

pptx.writeFile({ fileName: "output/leander-global-sample.pptx" })
  .then(f => console.log("wrote", f))
  .catch(e => { console.error(e); process.exit(1); });
