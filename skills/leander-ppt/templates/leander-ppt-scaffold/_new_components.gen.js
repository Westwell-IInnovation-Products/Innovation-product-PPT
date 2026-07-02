// 验证新组件（从钢厂/园区/口岸方案类材料提炼）。用 Leander Global 主题渲染。
const pptxgen = require("pptxgenjs");
const { getTheme } = require("./theme/tokens");
const { makeComponents } = require("./components/ppt-components");

const theme = getTheme("leander-global");
const pptx = new pptxgen();
pptx.defineLayout(theme.ppt.layout);
pptx.layout = theme.ppt.layout.name;
pptx.lang = "zh-CN";
const ui = makeComponents(pptx, theme);

// 1) capabilityMatrix
ui.capabilityMatrix(pptx.addSlide(), {
  title: "能力对比 · 为什么选 ReeWell",
  subtitle: "同类方案横向对比，焦点列高亮。",
  corner: "能力维度",
  columns: ["传统人工", "单点自动化", "ReeWell 平台"],
  focusCol: 2,
  rows: [
    { label: "多品牌车队统一接入", cells: [false, { level: 1, of: 3 }, true] },
    { label: "实时动态调度", cells: [false, { level: 2, of: 3 }, true] },
    { label: "仿真预演与验证", cells: ["—", "部分", true], focus: true },
    { label: "能耗与碳可视", cells: [false, false, true] },
    { label: "落地周期", cells: ["数月", "数周", "分阶段上线"] }
  ],
  note: "焦点列即为本方案；同级能力统一藏蓝，差异用语义色（绿=具备 / 灰=缺失）。"
});

// 2) featureGrid
ui.featureGrid(pptx.addSlide(), {
  title: "平台六大核心能力",
  subtitle: "图标 + 标题 + 说明，铺满正文。",
  focus: 0,
  items: [
    { icon: "hub", title: "统一调度", desc: "全场有人/无人设备实时协同调度。" },
    { icon: "chart", title: "仿真预测", desc: "高精度数字孪生，先验证后落地。" },
    { icon: "clock", title: "节拍管控", desc: "作业节拍可视，异常实时预警。" },
    { icon: "shield", title: "安全合规", desc: "全流程安全策略与权限合规。" },
    { icon: "document", title: "数据资产", desc: "作业数据沉淀为可复用资产。" },
    { icon: "person", title: "少人无人", desc: "关键岗位减员，7×24 连续作业。" }
  ]
});

// 3) tierStack（云-边-端）
ui.tierStack(pptx.addSlide(), {
  title: "端 · 边 · 云 三层方案架构",
  subtitle: "自上而下的部署分层与组件构成。",
  tiers: [
    { name: "云 · 平台层", sub: "Cloud", items: ["调度算法", "数字孪生", "数据中台", "能源管理"], focus: true },
    { name: "边 · 边缘层", sub: "Edge", items: ["边缘计算盒", "实时定位", "视频结构化"] },
    { name: "端 · 设备层", sub: "Device", items: ["无人重卡", "有人车队", "岸桥/堆场", "传感器网"] }
  ],
  note: "焦点层（平台层）为差异化所在；层间为部署依赖关系。"
});

// 4) statBand
ui.statBand(pptx.addSlide(), {
  title: "规模化落地成效",
  subtitle: "来自多个港口/厂区的真实部署。",
  focus: 0,
  stats: [
    { value: "30%", label: "作业效率提升", sub: "混合车队岸桥-堆场节拍" },
    { value: "24/7", label: "连续无人作业", sub: "实时调度下不间断运行" },
    { value: "12", label: "落地站点", sub: "覆盖三大洲并持续扩展" },
    { value: "-25%", label: "综合能耗", sub: "能源调度与碳可视" }
  ],
  note: "数字为部署占位；正式材料须标注口径与来源。"
});

// 5) bulletColumns
ui.bulletColumns(pptx.addSlide(), {
  title: "现状调研 · 三类核心痛点",
  subtitle: "分类枚举，配底部结论带。",
  focus: 2,
  columns: [
    { head: "人 · 成本", items: ["关键岗位用工紧张", "夜班连续作业难", "经验依赖、培养周期长", "安全责任压力大"] },
    { head: "车 · 设备", items: ["多品牌车队各自为政", "设备利用率不均", "调度靠人工经验", "故障被动响应"] },
    { head: "数 · 管理", items: ["数据散落难沉淀", "缺乏预演手段", "节拍不可视", "决策滞后于现场"] }
  ],
  banner: "→ 三类痛点共同指向：缺一个统一、可预演、自学习的调度运营平台"
});

// 6) pillarTrio
ui.pillarTrio(pptx.addSlide(), {
  title: "三大产品支柱",
  subtitle: "厂内厂外一体化的产品矩阵。",
  focus: 1,
  pillars: [
    { name: "ReeWell", tag: "场内生产运营", icon: "hub", desc: "全场设备统一调度与运营管控的核心平台。", points: ["统一接入", "实时调度", "仿真预演"] },
    { name: "WellSmart", tag: "AI 调度底座", icon: "gear", desc: "全要素智能调度算法，平台的智能内核。", points: ["全局优化", "自学习", "持续进化"] },
    { name: "PowerDash", tag: "数据驾驶舱", icon: "chart", desc: "全场运营数据可视化与决策支持。", points: ["实时监控", "趋势预测", "一屏总览"] }
  ]
});

pptx.writeFile({ fileName: "output/new-components.pptx" })
  .then(f => console.log("wrote", f))
  .catch(e => { console.error(e); process.exit(1); });
