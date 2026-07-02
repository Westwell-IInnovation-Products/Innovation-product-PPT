// 重设计验证：priorityPyramid / funnel / valueChain / venn / ringStats。Leander Global。
const pptxgen = require("pptxgenjs");
const { getTheme } = require("./theme/tokens");
const { makeComponents } = require("./components/ppt-components");
const theme = getTheme("leander-global");
const pptx = new pptxgen();
pptx.defineLayout(theme.ppt.layout); pptx.layout = theme.ppt.layout.name; pptx.lang = "zh-CN";
const ui = makeComponents(pptx, theme);
const S = () => pptx.addSlide();

ui.priorityPyramid(S(), { title: "优先级金字塔 priorityPyramid", subtitle: "顶层最重要（真锥形 + 右侧标签）。", focus: 0, levels: [
  { name: "安全稳定", sub: "不可妥协的底线" }, { name: "效率提升", sub: "核心价值" },
  { name: "成本优化", sub: "持续改进" }, { name: "体验增强", sub: "锦上添花" }] });

ui.funnel(S(), { title: "漏斗 funnel", subtitle: "逐层收敛（真倒锥 + 右侧名称/数值）。", focus: 3, stages: [
  { name: "触达场景", value: "100%" }, { name: "可自动化", value: "72%" },
  { name: "已接入平台", value: "55%" }, { name: "无人作业", value: "38%" }] });

ui.valueChain(S(), { title: "价值链 valueChain", subtitle: "阶段卡 + 箭头相连，文字在卡内。", focus: 2, stages: [
  { name: "采购到厂", items: ["原料计划", "到货管理", "质检入库"] },
  { name: "生产作业", items: ["设备调度", "节拍管控", "异常处理"] },
  { name: "仓储倒运", items: ["库位管理", "无人运输", "盘点对账"] },
  { name: "成品发运", items: ["装车计划", "跨境物流", "签收回执"] }] });

ui.venn(S(), { title: "韦恩图 venn", subtitle: "交集即差异化（富版：分区要点 + 交集卡）。", sets: [
  { label: "调度能力", items: ["全局实时调度", "多设备协同", "动态再规划"] },
  { label: "仿真能力", items: ["上线前预演", "高精度孪生", "What-if 推演"] }],
  intersection: "仿真驱动的智能调度", intersectionDesc: "用仿真先验证、再调度，二者交集正是 ReeWell 的护城河。",
  overlapItems: ["先验证后执行", "持续自学习", "风险可控落地"], takeaway: "两种能力单独都有人做；真正稀缺的是把它们打通的交集。" });

ui.ringStats(S(), { title: "环形指标 ringStats", subtitle: "真实百分比进度环。", focus: 0, items: [
  { value: "30%", label: "效率提升", sub: "岸桥-堆场节拍" }, { value: "92%", label: "设备利用率", sub: "调度优化后" },
  { value: "65%", label: "研发占比", sub: "团队结构" }, { value: "99.9%", label: "系统可用", sub: "稳定运行" }], note: "环填充比例 = 数值百分比；数字为占位。" });

pptx.writeFile({ fileName: "output/redesign.pptx" }).then(f => console.log("wrote", f)).catch(e => { console.error(e); process.exit(1); });
