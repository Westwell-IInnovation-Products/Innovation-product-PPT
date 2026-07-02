// 验证扩充批次 2 的 12 个新组件。Leander Global 主题。
const pptxgen = require("pptxgenjs");
const { getTheme } = require("./theme/tokens");
const { makeComponents } = require("./components/ppt-components");
const theme = getTheme("leander-global");
const pptx = new pptxgen();
pptx.defineLayout(theme.ppt.layout); pptx.layout = theme.ppt.layout.name; pptx.lang = "zh-CN";
const ui = makeComponents(pptx, theme);
const S = () => pptx.addSlide();

ui.quadrantMatrix(S(), { title: "象限矩阵 quadrantMatrix", subtitle: "二维定位。", axis: { x: ["低成本", "高成本"], y: ["低价值", "高价值"] },
  quadrants: ["观察", "重点投入", "放弃", "快赢"], items: [
  { x: 0.7, y: 0.85, label: "ReeWell 平台", focus: true }, { x: 0.3, y: 0.6, label: "单点自动化" },
  { x: 0.25, y: 0.25, label: "纯人工" }, { x: 0.75, y: 0.35, label: "定制开发" }] });

ui.priorityPyramid(S(), { title: "优先级金字塔 priorityPyramid", subtitle: "顶层最重要。", focus: 0, levels: [
  { name: "安全稳定", sub: "不可妥协的底线" }, { name: "效率提升", sub: "核心价值" },
  { name: "成本优化", sub: "持续改进" }, { name: "体验增强", sub: "锦上添花" }] });

ui.coverageMap(S(), { title: "覆盖示意 coverageMap", subtitle: "站点分布与总部联动。", region: "全国部署区域", hub: { x: 0.5, y: 0.45 },
  sites: [{ x: 0.2, y: 0.25, label: "天津港", focus: true }, { x: 0.75, y: 0.3, label: "盐田港", sub: "智慧园区" },
    { x: 0.3, y: 0.7, label: "甘其毛都", sub: "口岸" }, { x: 0.68, y: 0.72, label: "瑞钢联", sub: "钢厂" }, { x: 0.5, y: 0.2, label: "上海总部" }] });

ui.topology(S(), { title: "部署拓扑 topology", subtitle: "云-边-端三层。", cloud: { name: "ReeWell 云平台" },
  edges: [{ name: "港区边缘" }, { name: "厂区边缘" }, { name: "园区边缘" }],
  devices: [{ name: "无人重卡" }, { name: "岸桥 QC" }, { name: "场桥 YC" }, { name: "IGV" }, { name: "有人车队" }, { name: "传感网" }] });

ui.imageGallery(S(), { title: "图文画廊 imageGallery", subtitle: "产品/现场截图占位。", focus: 1, items: [
  { icon: "hub", title: "调度驾驶舱", desc: "全场实时调度总览。" }, { icon: "gauge", title: "运行监控", desc: "进度与异常预警。" },
  { icon: "layers", title: "数字孪生", desc: "虚实结合三维呈现。" }, { icon: "chart", title: "数据看板", desc: "KPI 一屏总览。" }] });

ui.ringStats(S(), { title: "环形指标 ringStats", subtitle: "百分比型成效。", focus: 0, items: [
  { value: "30%", label: "效率提升", sub: "岸桥-堆场节拍" }, { value: "92%", label: "设备利用率", sub: "调度优化后" },
  { value: "65%", label: "研发占比", sub: "团队结构" }, { value: "99.9%", label: "系统可用", sub: "稳定运行" }], note: "数字为占位。" });

ui.numberedList(S(), { title: "编号叙述 numberedList", subtitle: "要点逐条展开。", focus: 0, items: [
  { title: "统一接入", desc: "多品牌有人/无人设备标准化接入统一管理。" },
  { title: "实时调度", desc: "全局动态调度算法，垂直水平协同最优。" },
  { title: "仿真预演", desc: "上线前充分预演，落地稳健、风险可控。" },
  { title: "数据资产", desc: "作业数据沉淀为可复用的运营资产。" }] });

ui.timelineVertical(S(), { title: "竖向时间线 timelineVertical", subtitle: "里程碑。", focus: 2, items: [
  { date: "2024 Q4", title: "立项与调研", desc: "完成场景调研与方案框架。" },
  { date: "2025 Q2", title: "试点上线", desc: "单场景试点，有人在环验证。" },
  { date: "2025 Q4", title: "全场扩展", desc: "统一调度全场推广。" },
  { date: "2026 Q2", title: "无人自治", desc: "7×24 无人作业 + AI 预见。" }] });

ui.quoteHighlight(S(), { title: "金句页 quoteHighlight", subtitle: "关键论断。",
  quote: [{ text: "在没有实机的条件下，让落地过程" }, { text: "稳健、风险可控", hot: true }, { text: "。" }], by: "— ReeWell 仿真先行理念" });

ui.funnel(S(), { title: "漏斗 funnel", subtitle: "逐层收敛。", focus: 3, stages: [
  { name: "触达场景", value: "100%" }, { name: "可自动化", value: "72%" },
  { name: "已接入平台", value: "55%" }, { name: "无人作业", value: "38%" }] });

ui.twoOptionCompare(S(), { title: "双方案对比 twoOptionCompare", subtitle: "A / B 取舍。", recommendLabel: "推荐", options: [
  { name: "自研单点系统", points: ["短期可控", { text: "难以全局协同", no: true }, { text: "数据难沉淀", no: true }, { text: "扩展成本高", no: true }] },
  { name: "ReeWell 平台", recommended: true, points: ["多品牌统一接入", "全局实时调度", "仿真预演验证", "数据沉淀复用", "分阶段低风险落地"] }] });

ui.orgTree(S(), { title: "层级树 orgTree", subtitle: "平台能力分解。", root: { name: "ReeWell 平台" }, children: [
  { name: "调度中枢", focus: true, items: ["统筹调度", "路径规划"] }, { name: "感知层", items: ["实时定位", "视频结构化"] },
  { name: "孪生层", items: ["三维呈现", "历史回放"] }, { name: "运营层", items: ["KPI 看板", "能耗管理"] }] });

pptx.writeFile({ fileName: "output/batch2.pptx" }).then(f => console.log("wrote", f)).catch(e => { console.error(e); process.exit(1); });
