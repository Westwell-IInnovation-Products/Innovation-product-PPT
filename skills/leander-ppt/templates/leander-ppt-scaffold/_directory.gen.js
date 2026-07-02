// 组件库目录（索引）：一页排版全部 50 个组件，按类别分块（4 列 masonry）。Leander Global 主题。
const pptxgen = require("pptxgenjs");
const { getTheme } = require("./theme/tokens");
const { makeComponents } = require("./components/ppt-components");
const theme = getTheme("leander-global");
const C = theme.colors, F = theme.fonts;
const pptx = new pptxgen();
pptx.defineLayout(theme.ppt.layout); pptx.layout = theme.ppt.layout.name; pptx.lang = "zh-CN";
const ui = makeComponents(pptx, theme);

const cats = [
  { name: "框架 Chrome", items: [["cover", "封面 白/深"], ["sectionDivider", "分页"], ["closing", "封底 白/深"]] },
  { name: "数据 / 价值", items: [["metricCards", "三指标卡"], ["statBand", "大数字带"], ["bigWordCardMatrix", "大字卡阵"], ["fourColumnMechanism", "四列机制"], ["featureGrid", "特性网格"], ["pillarTrio", "三支柱"], ["painCards", "痛点卡"]] },
  { name: "结构 / 架构", items: [["systemArchitectureCenter", "中心式架构"], ["hubSpokeCapability", "中心辐射"], ["archLayered", "系统分层 A"], ["archDualEngine", "场景双擎 B"], ["tierStack", "云-边-端"]] },
  { name: "流程 / 时序", items: [["stepNav", "步进导航"], ["processTimeline", "横向时间线"], ["cycleLoop", "闭环"], ["stateFlow", "状态机"], ["beforeAfter", "前后对照"], ["roadmapPhases", "分期路线"], ["roadmapSwimlane", "泳道路线"], ["timelineVertical", "竖向时间线"], ["swimlaneProcess", "角色泳道流程"]] },
  { name: "矩阵 / 对比", items: [["capabilityMatrix", "能力对比表"], ["heatmap", "热力矩阵"], ["twoOptionCompare", "双方案对比"]] },
  { name: "定位 / 层级", items: [["quadrantMatrix", "2×2 象限"], ["priorityPyramid", "优先级金字塔"], ["orgTree", "层级树"], ["funnel", "漏斗"]] },
  { name: "地理 / 网络", items: [["coverageMap", "覆盖示意"], ["topology", "云边端拓扑"], ["annotatedDiagram", "标注图"]] },
  { name: "项目 / 链条", items: [["gantt", "甘特图"], ["valueChain", "价值链"], ["waterfall", "瀑布/价值桥"]] },
  { name: "列表 / 叙事", items: [["bulletColumns", "分类要点列"], ["numberedList", "编号叙述"], ["quoteHighlight", "金句页"]] },
  { name: "媒体 / 集合", items: [["imageGallery", "图文画廊"], ["ringStats", "环形指标"], ["venn", "韦恩图"]] },
  { name: "原生图表", items: [["radar", "雷达"], ["barChart", "柱状"], ["lineChart", "折线"], ["pieBreakdown", "占比环图"]] },
  { name: "产品 / UI mock", items: [["workbenchMock", "配置工作台"], ["workflowConfig", "Workflow 配置"], ["dashboardMock", "运行监控"]] }
];

const slide = pptx.addSlide();
const U = ui.U;
const total = cats.reduce((a, c) => a + c.items.length, 0);
ui.header(slide, "Leander 组件库 · 目录", `共 ${total} 个组件 · 一套共享库，Base(红) / Global(蓝) 自动换肤 · 配色=语义、铺满正文、单点焦点`);

const cols = 4, gap = 26, X = 96, bodyTop = 248, bodyBot = 940;
const colW = (1728 - (cols - 1) * gap) / cols;
const colY = Array(cols).fill(bodyTop);
const headerH = 40, lineH = 26.5;

cats.forEach(cat => {
  const blockH = headerH + cat.items.length * lineH + 16;
  let c = 0; for (let i = 1; i < cols; i++) if (colY[i] < colY[c]) c = i;   // 最短列
  const x = X + c * (colW + gap), y = colY[c];
  // 类别头
  slide.addShape(pptx.ShapeType.rect, { x: U(x), y: U(y), w: U(4), h: U(headerH - 8), fill: { color: C.accent } });
  ui.addText(slide, x + 16, y, colW - 16, 28, cat.name, { size: 17, color: C.primary, bold: true });
  ui.addText(slide, x + colW - 60, y + 2, 60, 24, "(" + cat.items.length + ")", { size: 13, color: C.faint, bold: true, align: "right", fontFace: F.en });
  // 组件行
  cat.items.forEach((it, i) => {
    const ly = y + headerH + i * lineH;
    slide.addShape(pptx.ShapeType.ellipse, { x: U(x + 6), y: U(ly + 7), w: U(6), h: U(6), fill: { color: C.blue } });
    slide.addText([
      { text: it[0], options: { color: C.primary, bold: true, fontFace: F.en } },
      { text: "  " + it[1], options: { color: C.mute, fontFace: F.cn } }
    ], { x: U(x + 20), y: U(ly), w: U(colW - 24), h: U(lineH), fontSize: ui.PT(13), align: "left", valign: "middle", margin: 0, fit: "shrink" });
  });
  colY[c] += blockH + 14;
});
ui.footer(slide);

pptx.writeFile({ fileName: "output/directory.pptx" }).then(f => console.log("wrote", f)).catch(e => { console.error(e); process.exit(1); });
