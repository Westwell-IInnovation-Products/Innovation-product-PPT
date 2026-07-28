# Innovation-Products_ppt 组件目录

这个目录是从两份内部 deck 抽取的第一批可复用组件:

- 一份工业自动化产品介绍 deck。
- 一份 Cactus 产品介绍 deck。

在创建标杆样张之前,把这个目录当作组件选择菜单。源 deck 是参考,不是场景专属的规则。

## 组件清单

| 组件 | 状态 | 最适合 |
|---|---|---|
| `minimal-cover-right-title` | adopt | 带大片负空间的正式封面 |
| `three-stage-evolution` | adopt | 产品历史、成熟路径、分阶段叙事 |
| `why-now-dual-evidence-hub` | adapt | 带内部/外部力量的"为什么是现在"论证 |
| `four-column-mechanism` | adopt | 四个价值、四个角色、四种能力 |
| `capability-map-table` | adapt | 产品能力总览和模块图 |
| `dual-evidence-panels` | adopt | 数据分析、前后、双面证据 |
| `case-card-strip` | adapt | 从一个案例到可复用资产 |
| `solution-closed-loop` | adopt | 方案架构和运行闭环 |
| `scenario-bank-grid` | adapt | 场景库、配置库、能力清单 |
| `big-word-card-matrix` | adopt | 价值主张、战略判断、运营价值 |
| `roadmap-swimlane` | adopt | 产品路线图、服务计划、交付阶段 |
| `minimal-closing-center` | adopt | 结尾陈述 |
| `three-metric-cards` | adopt | 量化价值、估算、基准证据 |
| `last-mile-process` | adapt | 流程缺口和瓶颈解释 |
| `priority-pyramid` | adopt | 优先级堆叠、难度层级 |
| `positioning-matrix` | adapt | 竞品或能力定位 |
| `system-architecture-center` | adopt | 产品架构、平台、输入-输出流 |
| `section-divider-big-number` | adopt | 章节分隔 |
| `sensor-fusion-flow` | adapt | 多源传感和融合 |
| `control-window-mechanism` | adapt | 控制逻辑、时序窗口、算法决策 |
| `hub-spoke-capability` | adopt | 中心平台和周围能力 |
| `service-work-package` | adopt | 服务包、项目范围、责任矩阵 |
| `pricing-model-split` | adapt | 商业模式对比 |

## 框架里已实现

当前框架有以下的可执行 helper:

1. `minimal-cover-right-title` 即 `cover()`
2. `three-metric-cards` 即 `metricCards()`
3. `big-word-card-matrix` 即 `bigWordCardMatrix()`
4. `four-column-mechanism` 即 `fourColumnMechanism()`
5. `system-architecture-center` 即 `systemArchitectureCenter()`
6. `hub-spoke-capability` 即 `hubSpokeCapability()`
7. `roadmap-swimlane` 即 `roadmapSwimlane()`
8. `section-divider` 即 `sectionDivider()`——signature 感知的章节/转场页。Base = `big-number`(大号淡数字 + 红标题 + 横线 + 关键词 chip);Global = `white-underline`(藏青粗标题 + 实心下划线 + 蓝副标题 + 字标页脚,遵循 FMS 参考)。变体由 `theme.signature.divider` 选择。(`sectionDividerBigNumber` / `sectionDividerUnderline` 仍直接导出。)
9. `minimal-closing-center` 即 `closing()`(封底:居中藏青+红口号 + 标语)
10. `step-nav` 即 `stepNav()`(agenda / 汇报路线)
11. `pain-cards-consequence` 即 `painCards()`(问题 → 后果)
12. `solution-closed-loop` 即 `cycleLoop()`(config→run→KPI→export 闭环)
13. `arch-layered` 即 `archLayered()`——Type A 系统分层架构（系统视角）：层 banner + 卡片 / 分组子格 / 文本带；monochrome，`focus` 单点红
14. `arch-dual-engine` 即 `archDualEngine()`——Type B 场景双擎流（业务/场景视角）：双核 ✕「联动」+ 两翼流向（数据产生/方案输出）+ 底部 AI 基座赋能；节点差异化图标
15. `process-timeline` 即 `processTimeline()`(横向 N 步轨,`key` 节点强调,可选底部 takeaway 带)
16. `state-flow` 即 `stateFlow()`(生命周期/状态机;状态语义色;逐状态操作卡,内容贴合 + 居中)
17. `before-after` 即 `beforeAfter()`(旧 vs 新成对行;旧=灰,新=藏青+红箭头)
18. `roadmap-phases` 即 `roadmapPhases()`(3 个阶段列;now=强调 / future=藏青 / excluded=灰;内容贴合 + 居中)
19. `workbench-mock` 即 `workbenchMock()`(3 栏配置 UI:树 + 地图 + 属性卡;选中对象焦点红)
20. `workflow-config` 即 `workflowConfig()`(顶部带关键端点的链路流 + 底部配比规格卡)
21. `dashboard-mock` 即 `dashboardMock()`(运行监控:实时画布 + 进度面板 + 速度 chip;自动贴合 chip)
22. `capability-matrix` 即 `capabilityMatrix()`——带样式的对比/能力表:表头行 + 行标签 + 单元(文字 / ✓ 绿 / — 灰 / `{level,of}` 点);`focusCol` + 逐行 `focus`;行自动贴合以填满正文。(挖掘自 钢厂/园区/口岸 方案对比页)
23. `feature-grid` 即 `featureGrid()`——2×3(或 `cols`)图标特性卡(图标徽章 + 标题 + 描述),一个 `focus` 强调;自动贴合行以填满正文。(能力九宫格)
24. `tier-stack` 即 `tierStack()`——云-边-端 / 平台层:每层一个左侧藏青标签块 + 右侧组件 chip,焦点层强调,层间下箭头。(端边云分层架构)
25. `stat-band` 即 `statBand()`——单面板 N 个大统计(值 + 标签 + 子)带竖分隔,一个 `focus` 强调 + 可选备注带。(规模化成效数字带)
26. `bullet-columns` 即 `bulletColumns()`——分类要点列(彩色类别头 + 每列要点卡)+ 可选底部结论横幅;一个 `focus` 强调。(现状调研/痛点枚举)
27. `pillar-trio` 即 `pillarTrio()`——三张产品/支柱卡(大图标圆 + 名称 + 标签 + 描述 + 子要点),一个 `focus` 强调。(三大产品支柱)
28. `quadrant-matrix` 即 `quadrantMatrix()`——2×2 定位:着色象限 + 轴 + 角标签 + `axis:{x,y}` 端标签 + 标绘的 `items:[{x,y(0..1),label,focus}]`。
29. `priority-pyramid` 即 `priorityPyramid()`——真正的变窄金字塔(三角顶 + 梯形带,边通过 0.5 顶比对齐);每带一个排名徽章 + 右侧带连接线的标签卡。`levels:[{name,sub,focus}]` 从上到下。**不是堆叠矩形。**
30. `coverage-map` 即 `coverageMap()`——示意覆盖:区域面板 + 枢纽 + 标绘的 `sites:[{x,y,label,sub,focus}]`(点线连接)+ 自动右侧现场列表。
31. `topology` 即 `topology()`——云-边-设备网络:云节点 → 边行 → 设备行,带连接线 + 层标签。
32. `image-gallery` 即 `imageGallery()`——N 个带框单元(真实 `image` 路径或占位图标框)+ 说明条;一个 `focus` 强调。
33. `ring-stats` 即 `ringStats()`——一排 N 个**原生 doughnut 进度环**(弧 = 覆在浅轨上的实际百分比)+ 干净居中的值 + 标签 + 子;一个 `focus` 强调。`value` 必须是百分比。(百分比型成效)
34. `numbered-list` 即 `numberedList()`——竖向 01..N 大序号行(序号 + 标题 + 描述),一个 `focus` 强调;填满正文。
35. `timeline-vertical` 即 `timelineVertical()`——左轴 + 里程碑点 + 右卡片(`date/title/desc`),一个 `focus` 强调。
36. `quote-highlight` 即 `quoteHighlight()`——大号居中引言(`quote` 字符串或 `[{text,hot}]`)+ 强调横线 + `by` 署名;设计留白。
37. `funnel` 即 `funnel()`——真正的倒漏斗(翻转的梯形带,顶宽 → 向下变窄,边对齐)+ 右侧名/值标签。`stages:[{name,value,focus}]`。**不是堆叠矩形。**
38. `two-option-compare` 即 `twoOptionCompare()`——两列 A/B(`options:[{name,recommended,points:[str|{text,no}]}]`),✓/✗ 要点,中心 VS 徽章,推荐 = 强调。
39. `org-tree` 即 `orgTree()`——2 层层级(`root` + `children:[{name,focus,items:[]}]`)带连接线 + 孙级 chip;垂直居中。
40. `gantt` 即 `gantt()`——甘特:`periods` 列 × `tasks:[{name,start,span,focus,milestone}]` 条;里程碑菱形;焦点任务强调;行填满正文。
41. `heatmap` 即 `heatmap()`——带标签的矩阵,单元按强度着色(`values` 0..1)经由 low→`high` 混合,可选 `showValue`,渐变图例条。
42. `radar` 即 `radar()`——**原生**雷达图;`axes` + `series:[{name,values}]`;默认描边 `marker`(所有系列可见),`filled:true` 则填充。多系列 = 对比。
43. `value-chain` 即 `valueChain()`——阶段卡(彩色头 + 要点项)由 chevron 箭头连接;文字住在卡里,绝不被缺口切到。`stages:[{name,items,focus}]`。
44. `waterfall` 即 `waterfall()`——价值桥:`start` + `deltas:[{label,value±}]` + `end`;正=绿,负=红,端点藏青/强调,虚线阶梯连接。
45. `swimlane-process` 即 `swimlaneProcess()`——角色泳道 × 阶段列;每单元步骤盒 + 泳道内箭头;一个 `focus` 强调。
46. `venn` 即 `venn()`——丰富的 2 集(或 3 集)重叠:半透明圆 + 逐区要点 `items`,一个 `intersection`∩ 徽章,一张右侧交集引注卡(`intersection` + `intersectionDesc` + `overlapItems`),以及可选的 `takeaway` 带。`sets:[{label,sub,items:[]}]`。
47. `annotated-diagram` 即 `annotatedDiagram()`——大图/占位 + 编号标记(`markers:[{x,y,n}]`)+ 侧边 `legend:[{n,text}]`。
48. `bar-chart` 即 `barChart()`——**原生**簇状条/柱(`labels` + `series`),主题色,可选 `showValue`、`horizontal`。
49. `line-chart` 即 `lineChart()`——**原生**多线趋势(`labels` + `series`),可选 `smooth`。
50. `pie-breakdown` 即 `pieBreakdown()`——**原生** doughnut(`items:[{label,value}]`)+ 右侧带值的构成列表。

原生图表(radar/bar/line/pie)是经由 `slide.addChart("bar"|"line"|"radar"|"doughnut", ...)` 的真实可编辑 PowerPoint 图表——数据在 PPT 里保持可编辑。把主题色作为 `chartColors` 传入。**多系列雷达必须用 `marker`(描边)样式,不是 `filled`**——实心填充会遮住其他系列。

## Editorial / 线框组件(`components/editorial.js`)

白卡库的一个线框对应物,用于"背景色 + 线框分隔" / "文字 + 图形"的诉求、丑表格抱怨,以及任何白卡密度读作 AI 生成的页面。用 `const ed = makeEditorial({ ui, theme, pptx })` 实例化。它们全都用**页面背景作底**(极少填充)、**细线分隔 / 描边框**、共享的 **`theme.type` 刻度**(没有小字)、单一强调焦点,以及"贴合内容再居中"的留白。

| 组件 | 最适合 |
|---|---|
| `lineCompare` | 背景底上的 2–4 列对比,竖线分隔,焦点列 = 淡强调洗色 + 红标题;可选底部结论横线+陈述。(why-X、A/B、前后) |
| `milestoneTimeline` | 把排期 / 节奏做成**横轴上的图标节点**(卡片上下交替,线框),可选底部图例。当诉求是"图标式"时,用它替代网格/泳道甘特。 |
| `zoneGrid` | 2×2 / N 个线框分区(可选图标徽章 + 标题 + 正文),**内容贴合高度 + 居中块**,焦点区强调,可选底部横幅。(场景、价值、素材、下一步) |
| `splitDossier` | 左侧身份轨(大名字 + 子 + 带细线的事实行)+ 右侧线框分区网格。(项目 / 产品深挖) |
| `panelDuo` | 两个丰富的线框面板并排,每个是一个头条 + 条目(`{name,desc}`)。(左供应商 / 右自研;选项 vs 选项) |
| `lineTable` | 把表格数据做成**背景 + 细线行**(没有填充网格),表头下划线,焦点行 = 淡强调洗色。当一张表"太丑/太重"时,用它替代填充的 `capabilityMatrix`。 |
| `imageSlot` | 为一张**复杂/场景图片**(生成比矢量画更好)预留一个矩形。透明 PNG **融在主题底上——没有白卡**;图片到位前用矢量 `fallback`。配一份 `<deck>-images.gpt-image-2.md` prompt 规格。见 [`IMAGE-ASSETS.md`](IMAGE-ASSETS.md)。 |

当当前 deck 拒绝白卡密度或需要线框样式时,这些是可复用的 editorial 备选。按关系和容量选它们,而不是因为它们在上一份 deck 里出现过。

## Bespoke / 大图形组件(`components/bespoke.js`)

大、疏、*纯图形*的隐喻——对"每页都是一个盒子里塞文字"(死板)的解药。提取自 cactus 产品介绍 deck。用 `const bp = makeBespoke({ ui, theme, pptx })` 实例化。每一个都是不同的视觉隐喻,所以**没有两页重复一个模板**。当一份 deck 感觉僵硬/盒子太多、或用户想要 灵动感 / 设计感 / 大图形 时,伸手拿它们。

| 组件(通用核) | 隐喻 / 最适合 |
|---|---|
| `hubRadial` | 中心机制圆 + 4 张在细连接线上辐射的价值卡。(核心想法 → N 个后果/价值) |
| `tierLadder` | 排名分层带(01/02),每个带供应商块 + 规格 chip;缩进的阶梯。一个对比表的*排名*替代。(第一/第二梯队、leaderboard) |
| `goalPath` | 横向旅程轴,带 2 个大阶段标记 + 每个下面一个面板。(短→长、现在→未来、前→后) |
| `sceneColumns` | N 列由细线分隔,每列:数字徽章 + 标题 + 子标签 + 段落 + 一个**图片槽位**(`it.img` 透明 PNG,融在底上;退回到 `it.icon` 或一个占位)+ 需求 chip。镜像 cactus p4。(带逐列图像的并列场景) |
| `pipelineFlow` | 一排 N 个步骤节点,分组在阶段带下(一个焦点),+ 一个底部归纳总结带。(还需要分组/判断的流程) |
| `actionTracks` | 横向泳道,每个:图标 + 轨名 + 动作 + owner/时间/状态 chip。(带问责的下一步——具体,不含糊) |

**页面专属图形**属于活跃项目,不属于可复用组件核。从当前页面关系、证据、主题和所需槽位构建它们;只在回归测试之后提升去标识、可复用的模式。对场景或写实图像,优先 image2 + `imageSlot`(见 `IMAGE-ASSETS.md`)。

## 添加组件之前:查这张规范映射(避免 fork)

**头号积累错误是 fork 一个近乎重复的,而不是扩展现有原型。** 大多数"线框"组件只是一个已存在组件的 *fill→line* 换皮。写一个新的之前,在这里找它的原型;如果它存在,**用一个 `variant: "fill" | "line"` 标志(+ `theme.colors.surface3` 底)扩展它,不要加一个平行组件。**

| 原型(`ppt-components.js` 里的规范) | 相关的 editorial/bespoke | 状态 / 动作 |
|---|---|---|
| `capabilityMatrix`(表格) | `lineTable` | **完成——`capabilityMatrix` 现在接受 `variant:"fill"\|"line"`。** 新表用它。`lineTable` 保留(它的藏青头+斑马看已被用户批准;够区分)。 |
| `featureGrid`(图标卡) | `zoneGrid` | 不同——`zoneGrid` 加了内容贴合居中 + 横幅 + 标签。保留;复用,别再 fork。未来换皮 → `variant`。 |
| `twoOptionCompare` / `bulletColumns` | `panelDuo` / `lineCompare` | 不同的布局(带图标+脚的丰富面板;N 列线对比)。保留。 |
| `hubSpokeCapability` | `hubRadial` | 不同——4 角卡 vs 6 点 hub。保留。 |
| `processTimeline` / `timelineVertical` | `milestoneTimeline` / `pipelineFlow` | 不同——图标节点 + 阶段带 + 归纳。保留。 |
| `tierStack` / `priorityPyramid` | `tierLadder` | 不同——阶梯 + 逐供应商统计 chip。保留。 |
| `beforeAfter` / `roadmapPhases` | `goalPath` | 不同——旅程轴 + 双面板。保留。 |
| `swimlaneProcess` / `stateFlow` | `actionTracks` | 不同——owner/时间/状态 chip。保留。 |
| `fourColumnMechanism` | `sceneColumns` | **完成——`fourColumnMechanism` 现在接受逐项 `img`**(卡片中部的透明 PNG,图标备用)。`sceneColumns` 保留(带标签 + 需求 chip 的、不同的细线 editorial 风格)。 |

真正新的(没有现有原型——保留):`imageSlot`(图片占位 + 产出 prompt 规格)、`splitDossier`(身份轨 + 分区)。

> **诚实的重新评估(已修正)。** 这里早先一条备注声称"约 11/13 是重复,把它们全合并"。严格检查后那是夸大了:只有**表格**那一对是真正的 fill↔line 换皮(现已经由 `capabilityMatrix variant` 统一)。其余每一个都加了一个真实、单独**被用户批准**的布局(内容贴合居中、阶段带、角落 hub、旅程轴、owner chip……)。**合并它们会让已批准的设计回归——所以它们作为不同组件保留,不硬塞进一个。** "别重复"的真正修法是前瞻性的:(1)基础组件现在支持一个 `variant` 标志(在 `capabilityMatrix` 上验证过);(2)**fork 前先查这张映射**的规则(这里 + 在 `LESSONS.md`)阻止*新的* fork;(3)只在一对是真正无回归的换皮时才增量地合并它,**在逐页 gate 下做 render-diff**——绝不 big-bang。至今做过的能力合并:表格(`capabilityMatrix variant:"line"`)和四列图像(`fourColumnMechanism` 逐项 `img`);两者都是增量的,无回归。没有进一步的强制合并待办。

**三个库,按意图(不再是意外):** `ppt-components.js` = 宽原型集(在要紧处现在 `variant` 感知);`editorial.js` = 已批准的线框看;`bespoke.js` = 大隐喻。混用 fill + line + image 让页面读起来不同——对任何*新*换皮,给基础加一个 `variant`,而不是第 4 个近乎重复。

图标集(`components/icons.js`):`document person hub chart arrow shield clock gear cloud target lock leaf layers gauge`(否则 → "i" 备用)。在交付的页面里用一个真实图标,绝不用备用。

以上全都遵循 `SLIDE-CRAFT.md` 的颜色语义规则(同级 = 结构色,强调 = 单一焦点)和"填满正文"规则(居中/填满,没有不对称的底部留白)。Logo/背景来自主题标准,绝不逐页。每个组件都读 `theme.colors`/`theme.fonts`,所以同一份代码自动换主题到 Base(红强调)或 Global(天蓝强调)。

## 一个共享库,多个主题

这个目录是**一个**共享库(`components/ppt-components.js`),不是每个主题一个库。

- **内容组件共享代码,但不再假装构图与主题无关。** 它们继续只实现一次并读取 `theme.colors` / `theme.fonts`；需要主题化主体几何时,读取 `theme.contentFidelity` 或组件注册表的 `themeFidelityFeatures`。切换主题必须同时改变内容层 archetype/密度/层级证据,不能只自动换色。
- **Chrome 跟随主题 `signature`。** `cover` / `header` / `footer` / `closing` 按 `theme.signature`(`titleColor`、`headerRule`、`footer`、`cover`、`closing`、`coverPhoto`)分支,让每个主题复现它自己的参考看:
  - Base:暖色右对齐红封面,实心红横线 + 页脚,居中藏青+红结尾。
  - Global:photo-dark(或 white-minimal)封面,藏青标题 + 点线天蓝横线 + 细页脚,photo-dark 结尾;`cover()` 接受 `coverStyle` / `data.image` 覆盖。
- **加一个主题** = 新 token + 一个 chrome `signature` 块 + 一个 `contentFidelity` profile(+ 可选封面素材)。绝不 fork 组件库。选择:从 `theme/tokens.js` 用 `getTheme("leander-global")`。见 `THEMES.md` / `THEME-FIDELITY.md`。

## 架构图——两种类型和何时用

一张架构页通常是产品/管理 deck 的核心。有两种不同的原型;按页面回答的问题选,而不是按习惯。一份 deck 可以两者都有。

| | Type A——`archLayered` | Type B——`archDualEngine` |
|---|---|---|
| 回答 | "系统由哪些层 / 模块组成" | "在某业务场景里如何协同、被什么赋能" |
| 视角 | 系统 / 技术视角 | 业务 / 场景视角 |
| 形态 | 自上而下分层堆叠（banner + 模块行） | 中心双核 ✕ 联动 + 左右两翼流向 + 底部基座 |
| 参考 deck | 钢厂智能化、多模块基座、口岸详版 | 工厂双擎、口岸双平台 |
| 何时用 | 平台/产品的静态构成、模块清单、技术拆解 | 双平台/双引擎协同、输入→产出的业务故事、AI 赋能叙事 |

两者都保持颜色语义规则:结构 = 藏青,单一焦点 = 红,第二引擎 = 蓝,流向箭头 = 红。不要为多样而给层/节点多色。

### arch-layered(Type A)

- 目的:把系统/技术架构做成自上而下的分层堆叠。
- 结构:每层一个满宽彩色带(标签 + 可选子)覆在一个模块行上;模块行是 `cards`(name/sub/desc)、`groups`(组标题 + 堆叠子格),或单个 `text` 带。
- 必需输入:标题;层(每层带 `label` 和/或内容)。
- 可选输入:`focus`(焦点层红)、逐卡 `focus`、层 `sub`、`h`(内容高度)。
- 颜色:带默认藏青;一个焦点层/卡红;没有逐层彩虹。
- QA 风险:层太多(上限约 5);算法/子卡正文太小;有带无内容行。

### arch-dual-engine(Type B)

- 目的:场景/业务架构——两个引擎/平台协作,被一个赋能基座喂养。
- 结构:可选顶部价值带;中心双核(两个同心圆 + 一个带 ⇄ 的 `联动` hub);左翼输入 → 红 `数据产生` 块箭头 → 核;核 → 红 `方案输出` 块箭头 → 右翼输出;可选中心上箭头(协同产出);可选底部 AI 基座面板(圆柱 + 能力药丸)带两个蓝 `AI 赋能` 上箭头。
- 必需输入:标题;`center.left`/`center.right`(name、desc、icon);`leftWing.items` / `rightWing.items`(title、sub、icon)。
- 可选输入:`topBand`、`centerUp`、`center.mid`、翼 `top`/`flow`、`base.core` + `base.feeders`。
- 颜色:左引擎藏青,右引擎蓝;流向箭头 + hub + 焦点红;基座/feeder 蓝。两种色相 = 两个真实引擎,不是装饰。
- 字形集(差异化,避免重复):`doc gear box coin data chart globe hub route`。
- QA 风险:图形重叠(让箭头避开核);相同重复的徽章(用不同图标);中心列拥挤(协同产出在上,联动+mid 在下,基座箭头在引擎 x 处偏离中心)。

## 组件规格

### minimal-cover-right-title

- 目的:用克制的品牌存在感定一个正式基调。
- 结构:大号右侧标题、小副标题、底部横线、小日期/版本。
- 必需输入:标题、副标题、deck 类型/日期。
- 可选输入:logo、标语。
- 可编辑:是。
- QA 风险:标题太靠右、底部文字太小、没有基调的过多空白。

### four-column-mechanism

- 目的:以同等视觉重量呈现四个并列的价值或机制。
- 结构:四列;每列有编号、标题、标签、短文、图标/图示、结尾行。
- 必需输入:四项,带标题、标签、解释、视觉线索。
- 可选输入:左/右干系人分组。
- 可编辑:是。
- QA 风险:列变成只有文字;垂直对齐不齐;图标无意义。

### big-word-card-matrix

- 目的:用设计留白做一个战略/价值判断。
- 结构:左 35-40% 大关键词和短解释;右 2x2 卡片。
- 必需输入:1-2 个大关键词、总结、四张支撑卡。
- 可选输入:受众侧分组、颜色强调。
- 可编辑:是。
- QA 风险:左侧空、没有强排版;右卡太稀疏。

### three-metric-cards

- 目的:展示量化价值或基准证据。
- 结构:三张等宽卡,带大数字、标签、解释、提醒/来源。
- 必需输入:三个指标、标签、来源/边界。
- 可选输入:公式或提醒带。
- 可编辑:是。
- QA 风险:数字无来源;正文太小;一个是关键时所有卡却同等强调。

### system-architecture-center

- 目的:解释一个产品架构或数据/控制平台。
- 结构:左侧输入、中心平台、右侧输出/应用。
- 必需输入:输入列表、核心模块、输出列表、核心引擎。
- 可选输入:数据循环箭头、平台副标题。
- 可编辑:是。
- QA 风险:模块太多;中心块太密。

### hub-spoke-capability

- 目的:展示一个中心系统/平台和周围模块。
- 结构:中心圆/卡,带辐射模块和侧边解释。
- 必需输入:中心名、4-6 个模块、一个 takeaway。
- 可选输入:逐模块的已达成/计划中状态。
- 可编辑:是。
- QA 风险:辐条穿过文字;模块标签太小;布局倾斜。

### roadmap-swimlane

- 目的:跨多条轨展示时间线或计划。
- 结构:时间轴,带泳道或阶段卡。
- 必需输入:阶段、日期、轨、里程碑。
- 可选输入:风险或决策 gate。
- 可编辑:是。
- QA 风险:小标签太多;日期不可读;没有当前状态标记。

### section-divider(signature 感知)

- 目的:制造强的章节节奏;每个主题一种分隔样式。
- 分派:`sectionDivider()` 读 `theme.signature.divider`。
  - **Base——`big-number`**:大号淡数字、红章节标题、红横线、短副标题、可选关键词 chip。
  - **Global——`white-underline`**(遵循 FMS 参考):可选 eyebrow(`SECTION 01`)、带实心藏青下划线的藏青粗标题、蓝副标题、右上 W logo、灰 WESTWELL 字标页脚。
- 必需输入:标题(+ 用于 eyebrow/大数字的编号)。
- 可选输入:副标题;关键词(仅 base);eyebrow(global)。
- 可编辑:是。
- QA 风险:base——右侧太空 / 数字与标题竞争;global——下划线宽度应跟随标题;让标题垂直近中心。

### step-nav

- 目的:agenda / 汇报路线;开头就展示演讲的 3-5 个阶段。
- 结构:页眉(带 logo);一条带编号节点的横轴;每个节点下一张 title+desc 卡;节点间箭头;`current` 节点强调。
- 必需输入:标题、steps(每个 title + desc)。
- 可选输入:副标题、current 索引。
- 可编辑:是。
- QA 风险:卡太空(让 desc 一行有价值,不是填充);步骤太多(上限约 5)。

### pain-cards-consequence

- 目的:陈述问题和它们的业务后果,不只是文字卡。
- 结构:页眉(带 logo);3 张等宽白卡,每张带强调顶条、含义图标、编号、标题、正文,以及一个强调后果带(`→ consequence`)。
- 必需输入:标题、3 项(icon、title、desc、consequence)。
- 可选输入:副标题。
- 可编辑:是。
- QA 风险:后果缺失(那就只是一张文字卡);图标不映射问题。

### solution-closed-loop(cycleLoop)

- 目的:展示一个闭合运行环(例如 config → run → KPI → export)。
- 结构:页眉(带 logo);围绕一个填充中心标签的环上 4 个节点;顺时针箭头;可选右侧"为什么"备注面板。
- 必需输入:中心标签、4 步(title + desc)。
- 可选输入:副标题、noteTitle + 备注面板。
- 可编辑:是。
- QA 风险:中心盒与侧节点重叠(让环半径避开两者半宽);箭头读不出一个方向。

## 下一个实现优先级

在框架 helper 库里接下来实现这些:

1. `last-mile-process`
2. `priority-pyramid`
3. `positioning-matrix`
4. `dual-evidence-panels`
5. `dashboard-mockup`
6. `image-led-product-page`
7. `kpi-six-cards`(从 WellSimtec deck 的 `p13` 提升)
8. `validation-stack`(从 WellSimtec deck 的 `p11` 提升)

这些覆盖了大多数内部产品、管理、售前、培训和客户演示 deck。
