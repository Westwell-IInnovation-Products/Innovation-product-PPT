// 验证扩充批次 3 的 11 个细分组件（含 3 个原生图表）。Leander Global 主题。
const pptxgen = require("pptxgenjs");
const { getTheme } = require("./theme/tokens");
const { makeComponents } = require("./components/ppt-components");
const theme = getTheme("leander-global");
const pptx = new pptxgen();
pptx.defineLayout(theme.ppt.layout); pptx.layout = theme.ppt.layout.name; pptx.lang = "zh-CN";
const ui = makeComponents(pptx, theme);
const S = () => pptx.addSlide();

ui.gantt(S(), { title: "甘特图 gantt", subtitle: "分阶段交付计划。", corner: "工作项", periods: ["Q1", "Q2", "Q3", "Q4"], tasks: [
  { name: "调研与方案", start: 0, span: 1 }, { name: "试点上线", start: 1, span: 1, milestone: 2 },
  { name: "全场扩展", start: 1, span: 2, focus: true }, { name: "无人自治", start: 3, span: 1 },
  { name: "运营托管", start: 2, span: 2 }], note: "菱形=里程碑；焦点行=当期关键路径。" });

ui.heatmap(S(), { title: "热力矩阵 heatmap", subtitle: "场景 × 维度风险/优先级。", high: "accent", showValue: true,
  cols: ["技术", "成本", "周期", "收益"], lowLabel: "低", highLabel: "高", rows: [
  { label: "无人重卡", values: [0.8, 0.6, 0.7, 0.9] }, { label: "岸桥自动化", values: [0.6, 0.8, 0.5, 0.7] },
  { label: "堆场调度", values: [0.4, 0.3, 0.4, 0.85] }, { label: "能源管理", values: [0.3, 0.4, 0.2, 0.6] }] });

ui.radar(S(), { title: "雷达图 radar", subtitle: "能力多维对比。", axes: ["调度", "仿真", "感知", "能源", "安全", "数据"], series: [
  { name: "ReeWell", values: [9, 9, 8, 7, 8, 9] }, { name: "传统方案", values: [4, 2, 5, 3, 6, 4] }] });

ui.valueChain(S(), { title: "价值链 valueChain", subtitle: "端到端价值环节。", focus: 2, stages: [
  { name: "采购到厂", items: ["原料计划", "到货管理"] }, { name: "生产作业", items: ["设备调度", "节拍管控"] },
  { name: "仓储倒运", items: ["库位管理", "无人运输"] }, { name: "成品发运", items: ["装车计划", "跨境物流"] }] });

ui.waterfall(S(), { title: "瀑布 / 价值桥 waterfall", subtitle: "效率提升来源拆解。", start: { label: "基线", value: 100 },
  deltas: [{ label: "统一调度", value: 14 }, { label: "仿真预演", value: 9 }, { label: "等待损耗", value: -6 }, { label: "能源优化", value: 5 }],
  end: { label: "目标", value: 122 } });

ui.swimlaneProcess(S(), { title: "角色泳道流程 swimlaneProcess", subtitle: "跨角色协同。", phases: ["计划", "执行", "监控", "复盘"], lanes: [
  { role: "调度中心", steps: ["生成计划", { label: "下发指令", focus: true }, "实时监控", "复盘优化"] },
  { role: "现场设备", steps: [null, "执行作业", "状态上报", null] },
  { role: "运营管理", steps: ["目标设定", null, "异常处理", "报表分析"] }] });

ui.venn(S(), { title: "韦恩图 venn", subtitle: "交集即差异化。", sets: [
  { label: "调度能力", sub: "全局实时" }, { label: "仿真能力", sub: "先验证" }], intersection: "仿真驱动的智能调度" });

ui.annotatedDiagram(S(), { title: "标注图 annotatedDiagram", subtitle: "产品界面/系统示意 + 标注。", icon: "gauge", placeholder: "调度驾驶舱界面占位",
  markers: [{ x: 0.25, y: 0.3, n: 1 }, { x: 0.7, y: 0.35, n: 2 }, { x: 0.5, y: 0.7, n: 3 }], legend: [
  { n: 1, text: "全场态势总览：设备/车辆实时位置。" }, { n: 2, text: "任务队列：进行中与待分配任务。" }, { n: 3, text: "KPI 看板：节拍、能耗、完成率。" }] });

ui.barChart(S(), { title: "柱状图 barChart（原生）", subtitle: "各站点效率提升对比。", showValue: true,
  labels: ["天津港", "盐田港", "甘其毛都", "瑞钢联"], series: [{ name: "效率提升 %", values: [30, 26, 22, 28] }, { name: "能耗下降 %", values: [25, 20, 18, 24] }] });

ui.lineChart(S(), { title: "折线图 lineChart（原生）", subtitle: "月度作业量趋势。", smooth: true,
  labels: ["1月", "2月", "3月", "4月", "5月", "6月"], series: [{ name: "2025", values: [42, 50, 55, 61, 70, 78] }, { name: "2026", values: [60, 68, 75, 88, 96, 105] }] });

ui.pieBreakdown(S(), { title: "占比环图 pieBreakdown（原生）", subtitle: "任务类型构成。", unit: "%", showPercent: true, items: [
  { label: "进口卸船", value: 45 }, { label: "出口装船", value: 35 }, { label: "堆场翻倒", value: 20 }] });

pptx.writeFile({ fileName: "output/batch3.pptx" }).then(f => console.log("wrote", f)).catch(e => { console.error(e); process.exit(1); });
