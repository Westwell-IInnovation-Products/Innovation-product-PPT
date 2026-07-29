# 内容层主题保真

主题保真不是“主题色 + 页眉页脚正确”。它必须改变主体构图、信息层级、证据处理或状态表达。

## 执行合同

把 `theme/content-fidelity.js` 作为三主题内容签名的机器事实源。每个 profile 定义：

- `features`：可验证的内容层特征，按 composition / hierarchy / evidence / density / state / depth / comparison 分类。
- `preferredArchetypes`：本主题优先的主体构图。
- `forbiddenPatterns`：即使颜色正确也不能使用的退化模式。
- `highCapacityArchetypes`：高指标容量或缺素材页面可用的工程型结构。

在蓝图内容页声明：

```json
{
  "themeArchetype": "global.engineering-evidence",
  "themeFeatures": [
    "evidence-dominant-main",
    "compact-kpi-rail",
    "ruled-information-hierarchy"
  ]
}
```

颜色、字体、logo、标题线和页脚不计入 `themeFeatures`。

## 三主题内容签名

| 主题 | 主体偏好 | 禁用模式 |
|---|---|---|
| Leander Base | 线性分隔、规则/轨道、扁平内容面、一个语义焦点、朴素结论 | 阴影卡墙、装饰 dashboard、平均卡片阵列、强调色遍地 |
| Base2 | 主证据/机制/决策核心 + 内嵌层、图形与规则线融合、分级半径、角色化单层纵深 | 均匀圆角卡墙、所有矩形统一阴影、多层阴影、装饰 rail、装饰性淡红 |
| Leander Global | 证据主画面、紧凑 KPI rail、工程变量表、Δ 对比、待仿真状态、精确标注 | 均匀指标格、通用卡墙、dashboard skin、空 KPI 卡 |

跨主题状态语义固定为：`review = 中性卡面 + 明确 Review 标签`，`blocked/high = danger 阻断面、描边和明确标签`。状态 rail 是项目可选通道：启用时 review 用蓝轨、blocked/high 用红轨；禁用时不得用其他装饰线代替。主题的通用 `accent` 不能覆盖阻断语义。

Global 高容量页面优先使用共享组件：`evidenceBoard`、`compactKpiRail`、`engineeringVariableTable`、`deltaCompare`。这些组件属于同一个共享库。不要为 Base、Base2、Global 复制 renderer；让 renderer 读取主题签名和 `contentFidelity` 参数。

## Base2 基准合同

Base2 的发布态视觉锚点是 `docs/theme-samples/02-base2-contact-sheet.jpg` 与对应可编辑参考 deck。检查时看主体构图，不只看颜色：

- 内容页通常由 2–3 个有明确职责的大区组成，并有一个占主导的证据板、机制核心、风险路由或审计面板。
- 普通支撑信息进入灰蓝内嵌层；不要把所有信息提升成同权重、同圆角、同阴影的卡片。
- `review` 是中性卡面 + 明确标签；`blocked/high`、当前 Gate、显式 active 或决策边界才使用淡红底与红描边。rail 只有在项目启用并且确有状态时才出现。
- 主 surface 使用一层轻阴影；support、inset、evidence row 和 control 保持平面。阴影层级按角色而不是按矩形数量决定。
- 图形是主体，但至少存在一种承担关系的线性结构：连接线、时间轴、层级枝干、泳道边界、矩阵/表格规则或同等清晰的线性组织。
- decision/boundary band 是可选语义组件，不是每页结构。无结论带时，标题下副标题或正文核心必须完成判断，并让主体自然使用下部安全区。
- 当页面同时出现红色激活面和蓝色 rail 时，必须证明它们表达两个不同且不冲突的语义；“review 被通用 hot 逻辑染红”直接判为失败。
- 状态名优先于通用 `active/hot` 标记：`review + active` 仍是中性面；`high/current/Gate` 归一为 blocked 危险语义。角色名、职责名、类别名和编号不构成状态，不能触发 rail。
- 共享组件优先使用 `surface`、`insetRow` 与关系组件；只有真实状态/风险才使用 `statusCard`、`barCard`，只有真实决策/边界才使用 `conclusionBand`。

## 修改后的视觉连续性

`delta-revision` 不能只验证“哪些文件改了”。revision baseline 还会记录主题、archetype、theme features、primary shape class、视觉路线以及 `DESIGN.md`/`visual-direction.md`/theme/components 的摘要。

- 纯内容修改默认保留这些视觉签名；未在 pageMap 中声明的主题、archetype、shape class 或视觉路线变化直接阻塞。
- 修改页占整稿较大比例，或 change[] 明确涉及布局、主题、阴影、线条、卡片、颜色、rail 等视觉语言时，自动升级为视觉改版。
- 多页视觉改版必须在本轮 revision contract 之后重新批准锚点，并在终版触发 fresh visual-designer 全稿复核。
- 共享主题、组件、`DESIGN.md` 或 `visual-direction.md` 变化还必须重新批准 theme/layoutBlueprint，并按 Gate 7 扩大重渲。
- 主题保真验证会把 `page.json.themeFidelity.composition` 与 `page.js` 的实际结构信号交叉核对；仅声明 feature 名称不能通过。

Base2 新建页或视觉改版页的 `composition` 至少声明：

```json
{
  "majorRegions": 2,
  "primaryVisualCore": true,
  "meaningfulLines": 2,
  "shadowedPrimarySurfaces": 1,
  "flatSupportLayers": 2,
  "decorativeRails": 0,
  "semanticStateRails": 0,
  "statusStates": 0
}
```

矩阵页面可以额外声明 `matrixPurpose: true`；否则 6 个以上同尺寸卡片的均匀网格按卡片墙阻塞。

## page-specific-custom 证据

自定义内容页必须同时在 `page.json` 和 `page.js` 声明同一合同：

```js
module.exports = {
  themeFidelity: {
    version: "theme-fidelity.v1",
    theme: "leander-global",
    archetype: "global.engineering-evidence",
    features: [
      "evidence-dominant-main",
      "engineering-variable-table",
      "precise-callout-anchors"
    ]
  }
};
```

`page.json.themeFidelity` 还要保存 `composition` 代理指标。至少落实三个非 chrome 特征，并跨至少两个类别。声明与 `page.js` 导出、组件能力或构图代理不一致时阻塞。

## Global 机器代理

把以下情况判为阻塞：

- 2×3 均匀指标卡中至少四张为空，又追加三张普通信息卡。
- 高容量页把 `metricCards`、`featureGrid`、`dashboardMock` 等平均卡片模式当 fallback，且没有证据主画面、紧凑 rail、工程表或 Δ 对比。
- pending 仿真/测量行填入编造值。
- 自定义页只声明 Global 蓝色、字体或 chrome。

把以下情况标为人工复核：

- Global 内容页缺少 theme-fidelity 合同。
- 使用非首选 archetype，但机器代理未发现明确违规。
- 机器通过但主题相似度仍需联系表判断。

运行：

```bash
node tools/verify-theme-fidelity.js --pages p01,p02
```

审计输出 `output/theme-fidelity-audit.json/md`。人工 reviewer 必须在当前 contact sheet 和全尺寸 PNG 上核对主体构图，不能用“配色正确”覆盖机器失败。

`qa-result.json` 中所有 `theme-fidelity-audit` 证据必须绑定当前审计，而不是只写一个文件名：

```json
{
  "artifact": "../../output/theme-fidelity-audit.json",
  "artifactSha256": "<当前审计文件 SHA-256>",
  "auditPageId": "p16",
  "method": "machine-theme-fidelity+contact-sheet",
  "observation": "证据主画面占主体，右侧为紧凑变量轨；未出现均匀空卡墙"
}
```

门禁会重算 `page.json + page.js + theme` 的输入摘要，并核对审计行、文件哈希、页面 ID 和结论。Global 页还必须在 `method` 中记录 `contact-sheet` 或 `full-size-render` 人工复核；陈旧审计不能复用。

## 锚点覆盖

锚点样张必须覆盖：

1. 封面或品牌定调页。
2. 真实截图/证据页。
3. 数据密集页。
4. 缺素材但需高指标容量的变量/待仿真页。

同一页可覆盖多个类别，但 `quality-target.json.anchorCoverage` 的每个类别都必须被活动锚点命中。
