// 组件库总览：每个组件一页，Leander Global 主题渲染。
const pptxgen = require("pptxgenjs");
const { getTheme } = require("./theme/tokens");
const { makeComponents } = require("./components/ppt-components");
const theme = getTheme("leander-global");
const pptx = new pptxgen();
pptx.defineLayout(theme.ppt.layout); pptx.layout = theme.ppt.layout.name; pptx.lang = "zh-CN";
const ui = makeComponents(pptx, theme);
const S = () => pptx.addSlide();

// ---- Chrome ----
ui.cover(S(), { title: "ReeWell", subtitle: "智慧港口智能调度与管理平台", date: "2026.06" });                 // 封面·白底
ui.cover(S(), { coverStyle: "photo-dark", title: "ReeWell", subtitle: "智慧港口智能调度与管理平台", date: "2026.06" }); // 封面·深色变体
ui.sectionDivider(S(), { number: "01", title: "组件库总览", subtitle: "每个组件一页，便于挑选。" });          // 分页

// ---- 数据 / 价值 ----
ui.metricCards(S(), { title: "三指标卡 metricCards", subtitle: "量化价值 / 基准证据。", items: [
  { value: "30%", label: "效率提升", desc: "混合车队岸桥-堆场节拍效率。" },
  { value: "24/7", label: "连续作业", desc: "实时调度下不间断运行。" },
  { value: "12", label: "落地站点", desc: "覆盖三大洲并持续扩展。" }], caveat: "数字为占位；正式材料须标注口径。" });
ui.statBand(S(), { title: "大数字带 statBand", subtitle: "几个标志性数字成带。", focus: 0, stats: [
  { value: "30%", label: "效率提升", sub: "岸桥-堆场节拍" }, { value: "24/7", label: "连续无人", sub: "不间断运行" },
  { value: "12", label: "落地站点", sub: "持续扩展" }, { value: "-25%", label: "综合能耗", sub: "能源调度" }], note: "数字为部署占位。" });
ui.bigWordCardMatrix(S(), { title: "大字卡阵 bigWordCardMatrix", subtitle: "战略判断 + 设计留白。", words: ["仿真", "先行"],
  summary: "在没有实机的条件下，让落地过程稳健、风险可控。", cards: [
  { title: "短期降风险", desc: "上线前充分预演。" }, { title: "长期成资产", desc: "数据沉淀复用。" },
  { title: "平台与验证", desc: "标准化验证闭环。" }, { title: "可复制", desc: "一地验证多地推广。" }] });
ui.fourColumnMechanism(S(), { title: "四列机制 fourColumnMechanism", subtitle: "四项并列能力，单点焦点。", focus: 2, items: [
  { title: "统一调度", close: "全局最优", icon: "hub", desc: "全场设备实时协同调度。" },
  { title: "仿真预演", close: "先验证", icon: "chart", desc: "高精度数字孪生预演。" },
  { title: "AI 内核", close: "差异化", icon: "gear", desc: "物流世界模型驱动决策。" },
  { title: "能源管理", close: "更绿色", icon: "leaf", desc: "能耗与碳可视化。" }] });
ui.featureGrid(S(), { title: "特性网格 featureGrid", subtitle: "六大能力，图标 + 文字。", focus: 0, items: [
  { icon: "hub", title: "统一调度", desc: "全场有人/无人设备协同。" }, { icon: "chart", title: "仿真预测", desc: "先验证后落地。" },
  { icon: "clock", title: "节拍管控", desc: "异常实时预警。" }, { icon: "shield", title: "安全合规", desc: "全流程权限合规。" },
  { icon: "layers", title: "数据资产", desc: "作业数据沉淀复用。" }, { icon: "person", title: "少人无人", desc: "关键岗位减员。" }] });
ui.pillarTrio(S(), { title: "三支柱 pillarTrio", subtitle: "产品矩阵。", focus: 1, pillars: [
  { name: "ReeWell", tag: "场内运营", icon: "hub", desc: "全场调度运营核心平台。", points: ["统一接入", "实时调度", "仿真预演"] },
  { name: "WellSmart", tag: "AI 底座", icon: "gear", desc: "全要素智能调度算法内核。", points: ["全局优化", "自学习", "持续进化"] },
  { name: "PowerDash", tag: "数据驾驶舱", icon: "gauge", desc: "运营数据可视与决策。", points: ["实时监控", "趋势预测", "一屏总览"] }] });
ui.bulletColumns(S(), { title: "分类要点列 bulletColumns", subtitle: "枚举 + 结论带。", focus: 2, columns: [
  { head: "人 · 成本", items: ["关键岗位紧张", "夜班连续难", "经验依赖", "安全压力大"] },
  { head: "车 · 设备", items: ["多品牌各自为政", "利用率不均", "调度靠经验", "故障被动"] },
  { head: "数 · 管理", items: ["数据散落", "缺预演手段", "节拍不可视", "决策滞后"] }], banner: "→ 共同指向：缺一个统一、可预演、自学习的调度平台" });
ui.painCards(S(), { title: "痛点卡 painCards", subtitle: "问题 → 后果。", items: [
  { icon: "hub", title: "混合车队", desc: "多品牌有人/无人各自为政、系统不互通。", consequence: "设备空转、盲区多" },
  { icon: "clock", title: "人工调度", desc: "凭经验排班，无法实时适应拥堵与故障。", consequence: "高峰期产能流失" },
  { icon: "chart", title: "缺乏预演", desc: "问题发生后才被动响应，无法先验证方案。", consequence: "试错成本高" }] });

// ---- 结构 / 架构 ----
ui.systemArchitectureCenter(S(), { title: "中心式架构 systemArchitectureCenter", subtitle: "输入 → 平台 → 输出。",
  inputTitle: "数据输入", outputTitle: "应用输出", inputs: ["设备状态", "作业计划", "实时定位", "视频结构化"],
  coreTitle: "ReeWell 平台", coreSubtitle: "统一调度运营内核", modules: ["调度算法", "数字孪生", "数据中台", "能源管理", "路径规划", "安全策略"],
  outputs: ["作业指令", "运营看板", "预警告警", "KPI 报表"] });
ui.hubSpokeCapability(S(), { title: "中心-辐射 hubSpokeCapability", subtitle: "平台 + 周边能力。", center: "ReeWell 平台", takeaway: "一个平台统筹六类能力，闭环运营。", modules: [
  { title: "统一调度", desc: "全场协同", icon: "hub", status: "key" }, { title: "仿真预演", desc: "先验证", icon: "chart" },
  { title: "数字孪生", desc: "虚实结合", icon: "layers" }, { title: "能源管理", desc: "能碳可视", icon: "leaf" },
  { title: "安全合规", desc: "权限管控", icon: "shield" }, { title: "数据资产", desc: "沉淀复用", icon: "document" }] });
ui.archLayered(S(), { title: "系统分层架构 archLayered（Type A）", subtitle: "自上而下的模块构成。", layers: [
  { label: "ReeWell 平台 · AI 工具链优化全场运营流程" },
  { h: 196, cards: [
    { title: "WellFMS", sub: "车辆管控", desc: "多品牌有人/无人统一接入。" }, { title: "WellYMS", sub: "仓储管理", desc: "堆场库位精细管理。" },
    { title: "WellSmart", sub: "AI 调度", desc: "实时动态全场调度，平台核心。", focus: true }, { title: "WellSimtec", sub: "仿真", desc: "高精度孪生预演。" },
    { title: "WellEMS", sub: "能源", desc: "能碳可视省钱。" }, { title: "Digital Brain", sub: "孪生", desc: "实时监控预警。" }] },
  { label: "核心算法与模型" },
  { h: 92, cards: [{ title: "统筹调度算法", desc: "垂直水平、有人无人全局协同。" }, { title: "路径规划算法", desc: "时空一致的全局/局部规划。" }] },
  { label: "Hymala 物流大模型矩阵", sub: "全场协同调度的底层模型支撑" }] });
ui.archDualEngine(S(), { title: "场景双擎流 archDualEngine（Type B）", subtitle: "厂内厂外一体化闭环。",
  topBand: "厂内厂外生产运输供应链一站式管理", centerUp: "协同产出：计划 · 供应 · 调整",
  center: { left: { name: "ReeWell", desc: "场内生产运营管控", icon: "hub" }, right: { name: "LOOPO", desc: "场外供应链运输", icon: "route" }, mid: "信息指令联动", link: "联动" },
  leftWing: { top: "生产要素 · 输入", flow: "数据产生", items: [{ title: "生产计划", sub: "节拍与异常", icon: "doc" }, { title: "资源调度", sub: "设备 · 车辆", icon: "gear" }, { title: "仓储库存", sub: "原料 · 成品", icon: "box" }] },
  rightWing: { top: "供应链 · 产出", flow: "方案输出", items: [{ title: "跨境服务", sub: "通关 · 贸易", icon: "globe" }, { title: "供应链金融", sub: "资信 · 保理", icon: "coin" }, { title: "风控数据", sub: "数据 · 洞察", icon: "chart" }] },
  base: { core: "WellSmart · 全要素智能调度底座（AI）", feeders: ["大数据", "仿真预测", "AI 智能体", "节拍调度"], boost: "AI 赋能" } });
ui.tierStack(S(), { title: "云-边-端分层 tierStack", subtitle: "部署分层与组件。", tiers: [
  { name: "云 · 平台层", sub: "Cloud", items: ["调度算法", "数字孪生", "数据中台", "能源管理"], focus: true },
  { name: "边 · 边缘层", sub: "Edge", items: ["边缘计算盒", "实时定位", "视频结构化"] },
  { name: "端 · 设备层", sub: "Device", items: ["无人重卡", "有人车队", "岸桥/堆场", "传感网"] }], note: "层间为部署依赖关系。" });
ui.capabilityMatrix(S(), { title: "能力对比表 capabilityMatrix", subtitle: "同类方案横向对比。", corner: "能力维度",
  columns: ["传统人工", "单点自动化", "ReeWell 平台"], focusCol: 2, rows: [
  { label: "多品牌统一接入", cells: [false, { level: 1, of: 3 }, true] }, { label: "实时动态调度", cells: [false, { level: 2, of: 3 }, true] },
  { label: "仿真预演验证", cells: ["—", "部分", true], focus: true }, { label: "能耗与碳可视", cells: [false, false, true] },
  { label: "落地周期", cells: ["数月", "数周", "分阶段上线"] }], note: "绿=具备 / 灰=缺失 / 圆点=能力等级。" });

// ---- 流程 / 时序 ----
ui.stepNav(S(), { title: "步进导航 stepNav", subtitle: "汇报路线 / 议程。", current: 0, steps: [
  { title: "挑战", desc: "为什么遇到瓶颈。", points: ["车队割裂", "人工调度"] }, { title: "平台", desc: "一个 AI 平台。", points: ["统一管控", "世界模型"] },
  { title: "架构", desc: "分层与引擎。", points: ["模块底座", "双擎协同"] }, { title: "价值", desc: "可量化可落地。", points: ["效率提升", "连续无人"] }] });
ui.processTimeline(S(), { title: "横向时间线 processTimeline", subtitle: "分阶段低风险落地。", steps: [
  { title: "评估", desc: "盘点场地、车队、接口。" }, { title: "试点", desc: "单车道有人在环。" },
  { title: "扩展", key: true, desc: "全场统一调度。" }, { title: "自治", desc: "7×24 无人 + AI 预见。" }], takeaway: "每个阶段都能独立交付价值，无需一次性切换。" });
ui.cycleLoop(S(), { title: "闭环 cycleLoop", subtitle: "配置 → 运行 → KPI → 导出。", center: "运营闭环", noteTitle: "为什么闭环",
  note: "每一轮运行都\n沉淀数据、优化\n下一轮调度策略。", steps: [
  { title: "配置", desc: "参数与工作流。" }, { title: "运行", desc: "实时调度作业。" }, { title: "KPI", desc: "量化成效。" }, { title: "导出", desc: "报表与资产。" }] });
ui.stateFlow(S(), { title: "状态机 stateFlow", subtitle: "生命周期 + 状态语义色。", main: [
  { name: "草稿", status: "draft", ops: ["编辑", "提交"] }, { name: "排队", status: "queued", ops: ["取消"] },
  { name: "运行", status: "running", ops: ["暂停", "停止"] }, { name: "完成", status: "done", ops: ["查看", "导出"] }] });
ui.beforeAfter(S(), { title: "前后对照 beforeAfter", subtitle: "旧方式 → 平台方式。", leftTitle: "旧方式", rightTitle: "ReeWell 方式", rows: [
  { old: "凭经验人工排班", neu: "实时动态自动调度" }, { old: "问题发生后被动响应", neu: "仿真预演先验证" },
  { old: "多品牌车队各自为政", neu: "多品牌统一接入管控" }, { old: "数据散落难复用", neu: "作业数据沉淀为资产" }] });
ui.roadmapPhases(S(), { title: "分期路线 roadmapPhases", subtitle: "当期 / 规划 / 不做。", phases: [
  { name: "当期", tag: "Now", status: "now", items: ["单场景试点", "核心调度上线", "数据打通"] },
  { name: "下一阶段", tag: "Next", status: "future", items: ["全场扩展", "仿真预演", "能源接入"] },
  { name: "本期不做", tag: "Later", status: "excluded", items: ["跨园区互联", "对外开放 API"] }] });
ui.roadmapSwimlane(S(), { title: "泳道路线 roadmapSwimlane", subtitle: "多轨道里程碑。", current: 1, stages: ["Q1", "Q2", "Q3", "Q4"], lanes: [
  { name: "平台", items: ["调度内核", "孪生上线", "能源模块", "多场扩展"] }, { name: "算法", items: ["路径规划", "调度优化", "自学习", "持续进化"] },
  { name: "交付", items: ["试点验收", "全场推广", "运营托管", "复制推广"] }] });

// ---- 产品 / UI mock ----
ui.workbenchMock(S(), { title: "配置工作台 workbenchMock", subtitle: "三栏配置 UI 示意。",
  tree: [{ name: "船舶 Vessel", sub: "靠泊计划" }, { name: "岸桥 QC-03", sub: "选中", sel: true }, { name: "锁站 TS", sub: "缓冲" }, { name: "堆场 Yard-A", sub: "库区" }, { name: "车辆 IGV", sub: "运输" }],
  objects: [{ x: 0.2, y: 0.3, label: "QC-03", hot: true }, { x: 0.5, y: 0.5, label: "TS-1" }, { x: 0.75, y: 0.4, label: "Yard-A" }],
  attrs: [{ k: "对象类型", v: "岸桥 QC" }, { k: "编号", v: "QC-03" }, { k: "工作点", v: "Bay 12" }, { k: "状态", v: "作业中" }] });
ui.workflowConfig(S(), { title: "Workflow 配置 workflowConfig", subtitle: "作业链路 + 比例规则。",
  flow: [{ name: "卸船", desc: "QC 起吊" }, { name: "水平运输", desc: "IGV 运送", hot: true }, { name: "堆场", desc: "YC 堆码" }, { name: "提箱", desc: "外集卡" }],
  specs: [{ title: "进口", value: "45%", desc: "卸船进场任务占比。" }, { title: "出口", value: "35%", desc: "装船出场任务占比。" },
    { title: "翻倒", value: "20%", desc: "堆场内倒箱占比。" }], note: "比例合计应为 100%。" });
ui.dashboardMock(S(), { title: "运行监控 dashboardMock", subtitle: "实时画面 + 进度面板。", progress: 47, moves: "470 / 1000", eta: "≈ 8 分钟", start: "10:24",
  markers: [{ x: 0.25, y: 0.35, hot: true }, { x: 0.5, y: 0.5 }, { x: 0.7, y: 0.4 }, { x: 0.4, y: 0.7 }], speeds: ["1x", "2x", "4x", "8x", "16x"] });

// ---- 封底 ----
ui.closing(S(), { slogan: [{ text: "Smarter, Greener, " }, { text: "Autonomous Ports", hot: true }] });               // 封底·白底
ui.closing(S(), { closingStyle: "photo-dark", slogan: [{ text: "Taking One Westwell, " }, { text: "Building the Future", hot: true }] }); // 封底·深色变体

pptx.writeFile({ fileName: "output/gallery.pptx" }).then(f => console.log("wrote", f)).catch(e => { console.error(e); process.exit(1); });
