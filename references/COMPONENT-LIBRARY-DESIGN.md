# 组件库设计

本文件定义 Innovation-Products_ppt 组件库应如何演进。它针对一个关键问题:当前的库有用,但大多数组件是页面级生成器。稳定的生产需要一个分层、打标签、可组合的库。

## 当前状态

组件是可执行的 JavaScript 函数,不是 `.pptx` 片段。一个页面从 `page.js` 调用一个组件,传入数据和主题上下文。输出的 PPTX 在之后生成。

当前优势:
- 可编辑的 PPT 形状和文字。
- 对版本 diff 友好的 JS/JSON。
- 逐页隔离和 QA。
- 注册表驱动的路线选择。

当前缺口:
- 注册表大多描述整页组件。
- 组件打分是轻量的关键词匹配。
- 没有正式的办法把一个组件的布局和另一个组件的小部件组合起来。
- 组件元数据还没有描述槽位、变体、组合安全性或避免条件。

## 三层组件模型

### 1. 整页版式(Page Patterns)

整张幻灯片的结构。当页面关系清楚、且组件适配页面大部分时用。

例子:
- problem -> mechanism map
- state isolation page
- tool-system tree
- repair-scope ladder
- sharing-boundary board
- architecture center

目的:决定页面的主视觉组织。

### 2. 局部版块(Layout Blocks)

可以在一个整页版式内部组合的、可复用的结构区域。

例子:
- left-right contrast
- folder row + selected expansion
- vertical step rail
- tree branch group
- three-zone boundary
- evidence board
- callout panel

目的:允许混合页面,而不用创建一次性的整页组件。

### 3. 小部件(Visual Parts)

小的可复用视觉资产和绘制 helper。

例子:
- file chips
- folder icons
- stage number dots
- semantic asset icons
- arrow/connectors
- imageSlot
- badge/chip styles
- callout leader lines

目的:让自定义或混合页面看起来一致,而不用重建每个细节。

## 组件元数据标准

每个可复用组件最终都应声明:

```json
{
  "name": "toolSystemTree",
  "level": "page-pattern",
  "route": "component-library",
  "relationships": ["toolbox", "hierarchy"],
  "tags": ["tool-system", "component-library", "image-tools"],
  "density": "high",
  "editable": "yes",
  "composable": "limited",
  "slots": ["root", "branches", "detailCards", "sidePanel"],
  "variants": ["base", "line"],
  "avoidWhen": ["the page only needs a small icon list"],
  "qaRisks": ["connector geometry", "dense side panel", "semantic icon clarity"],
  "similarTo": ["orgTree", "hubSpokeCapability"],
  "variantOf": null
}
```

## 语义中立的抽象标准

可复用组件必须按它们的**基本关系类型**和**表达能力**抽象,而不是按它们在当前 deck 里碰巧承载的那一个语义含义。

糟糕的抽象:

- `teamCollaborationFlow`
- `contextTransitionChart`
- `harnessSkillSharingPage`

更好的抽象:

- `multiActorContributionToSharedPool`
- `selectAndExpandUnit`
- `boundaryFilterMatrix`
- `phaseRoutedContext`
- `feedbackLoopWithPromotion`

同一个组件可以绑定到多个含义:

```json
{
  "name": "multiActorContributionToSharedPool",
  "relationPrimitive": "governance-chain",
  "expressionCapability": "multiple contributors produce local changes, pass a check, and promote reusable parts into a shared pool",
  "semanticBindings": [
    "team skill iteration",
    "context handoff between agents",
    "template contribution workflow",
    "data-governance approval flow"
  ],
  "level": "page-pattern",
  "slots": ["actors", "localChanges", "checkpoints", "sharedPool", "conflictPolicy"],
  "variantOf": null,
  "similarTo": ["pipeline", "hubSpokeCapability", "beforeAfterFlow"],
  "avoidWhen": ["the page only compares two options", "there is no shared destination or promotion logic"],
  "qaRisks": ["connector clutter", "too many colors", "unclear ownership boundary"]
}
```

### 组件打分

选择组件时,按此顺序打分:

1. 关系匹配:基本类型是否匹配页面意图?
2. 结构匹配:所需槽位是否存在、而不用硬套页面?
3. 组合匹配:一个整页版式能否干净地与局部版块和小部件组合?
4. 证据匹配:组件能否展示真实产物或来源边界?
5. 主题匹配:组件是否与活跃主题 token 兼容?
6. 关键词匹配:当前 deck 措辞只是一个弱信号。

只靠关键词匹配不够。如果一个组件是因为页面说了"team"、"tool"或"context"而被选中、但关系结构不同,拒绝它。

不要在 deck 里把内部数值分数当作面向用户的选择逻辑呈现。分数是一个内部的入围辅助。在 PPT 里,把机制解释成:

```text
blueprint contract -> expression mode -> relationship primitive -> required slots -> theme/evidence fit -> risk rejection -> page binding
```

如果蓝图已经固定了页面版面结构和表达模式,组件选择应变窄搜索,而不是从头重新设计页面。

### 变体与派生规则

如果一个新绘制是现有组件的派生:

- 相同关系 + 相同结构 + 不同内容:扩展槽位或例子。
- 相同关系 + 小的视觉变化:加一个变体。
- 相同整页版式 + 一个可复用区域:抽取一个局部版块。
- 相同图标/连接线/chip 在若干页面重复:抽取一个小部件。
- 不同的基本关系类型:加一个新的整页版式。

库应按可复用的逻辑增长,而不是靠积累一次性的 deck 语义。

## 复用决策

添加一个新组件之前:

1. 它只是颜色/线条/填充的样式差异吗?
   - 给现有组件加一个 `variant`。
2. 结构相同、但数据槽位不同吗?
   - 扩展组件的输入 schema。
3. 只有一个局部部件有用吗?
   - 抽取一个局部版块或小部件。
4. 页面关系与所有现有组件都不同吗?
   - 加一个新的整页版式。
5. 它是项目专属或敏感的吗?
   - 把它留在项目里,不进共享库。

## 融合规则

一个页面可以组合组件,但组合应该是显式的:

```text
page pattern + layout block + visual parts
```

例子:
- `problemMap` 整页版式 + `imageSlot` 小部件。
- `toolSystemTree` 整页版式 + 自定义外部组件来源列表。
- `stateFlow` 关系 + folder-expansion 局部版块 + file-chip 小部件。

避免组合两个整页模式,除非其中一个被降为一个局部版块。一张幻灯片上两个整页版式通常制造杂乱。

### 表达模式优先

选择组件之前,先决定页面的表达模式:

- mechanism-diagram
- screenshot-evidence
- big-typography
- case-evidence
- human-ai-swimlane
- artifact-map
- simple-image2-illustration
- component-composite

组件库只是一条路线。它不应压过一张更强的证据截图、一张更清晰的大数字页,或一张简单的生成插画。

## 提升规则

一个新绘制只有在以下情况才应进入共享组件库:

- 它解决一个反复出现的页面问题
- 它的输入能被通用地描述
- 它有一个清晰的层级:page-pattern、layout-block,或 visual-part
- 它不绑定到一个机密项目
- 它至少有一个真实的例子和一份 QA 风险清单

如果它是一次性但有用的,把它留在 deck 项目的页面实现或项目本地的 `components/` 里。

## 稳定性与易用性

- 优先少量带好槽位的稳定组件,而不是很多近乎重复的。
- 给每个组件一条简单的默认路径和可选的高级槽位。
- 让组件名保持语义,不只是视觉。
- 让注册表紧凑到能常规读取。
- 当一个组件反复需要手工覆盖时,修它的元数据、或把它拆成更小的块。

## Component Maintenance Mode

组件库维护是临时治理动作，不是日常 PPT 生产流程。只有在用户明确要求“打磨组件库 / 优化组件 / 积累新组件 / 调整组件选择机制”时执行。

维护顺序：

1. 先建立可运行基线：对 `components/*.js` 执行语法检查，不能在不可运行文件上做视觉优化。
2. 再维护人工覆盖：编辑 `tools/component-metadata-overrides.json`，并运行 `node tools/lint-component-metadata-overrides.js`。
3. 再更新注册表：运行 `node tools/enrich-component-registry.js`，只补齐未被人工覆盖的 relationship-first 元数据，并重算组件数量。
4. 再更新索引：运行 `node tools/build-component-index.js`，让日常选组件读取 compact index。
5. 再跑组件库 lint 与审计：运行 `node tools/lint-component-library.js --strict` 和 `node tools/component-metadata-audit.js`。
6. 最后才考虑代码层组件美化；每次只改少量组件，并立即跑语法和 lint。

不要用全局字符串替换盲目“换主题”。组件文件可能包含特殊编码或历史注释，必须使用可运行基线、小步修改、逐步验证。

## Visual Designer Review Rules

视觉设计师参与组件库维护时，不按当前 PPT 页面的语义评价组件，而按组件的表达能力评价：

- 这个组件表达的是对比、流程、层级、状态、工具箱、证据、场景，还是治理闭环？
- 它的主视觉关系是否清楚，而不是只靠文字解释？
- 红色 / azure / 高亮色是否有逻辑意义：当前、风险、焦点、推荐、冲突、异常、关键节点。
- 组件是否允许换主题：主题、线条、阴影、前景文字必须优先使用 theme token。
- 是否存在常见视觉风险：线条歪斜、连接误导、文字压框、图标语义不清、色彩过多、卡片堆叠。
- 如果需要 image2 或外部图形，只把它作为信息承载的插图，不把装饰图硬塞进页面。

## Theme Adaptation Rule

组件库应通过 `theme.colors`、`theme.type`、`theme.signature` 自动换主题。新增组件必须避免直接写死项目色值。

允许的例外：

- `FFFFFF` 用作深色底上的文字或白色描边。
- `000000` 仅用于导入资产或特殊黑色标记，并需要人工复核。
- 其他固定色值应先进入 `theme/tokens.js` 和对应命名主题，再被组件引用。

如果一个组件在 `leander-base` 下好看，但切到 `leander-global` 后出现低对比、白字压浅色、红色语义混乱，优先修 token 或组件前景色规则，而不是复制一份新组件。如果颜色正确但主体仍像通用 dashboard/卡墙,修 `contentFidelity` 变体、组件参数或主题 archetype；不要把这类问题误判成纯换色缺陷。
## Registry / Renderer / Selector Contract

组件库必须保持三层一致：

1. **Registry 层**：`tools/component-registry.json` 记录组件语义、关系、标签、槽位、风险和治理状态。
2. **Renderer 层**：`components/*.js`、`components/editorial.js`、`components/bespoke.js`、`components/tool-system-tree.js` 提供真实可调用的同名 JS 函数。
3. **Selector 层**：`tools/component-index.min.json` 和 `tools/select-visual-route.js` 只允许选择 `selectable=true` 的组件。

禁止把某次 PPT 中的页面级函数直接登记成 `usable` 组件。页面级函数如果值得积累，必须先完成组件迁移：

- 抽象关系能力，而不是当前页面语义；
- 给出通用输入槽位；
- 使用主题 token；
- 生成真实预览图；
- 通过严格 lint；
- 再把 `designStatus` 改回 `usable`。

组件状态的含义：

| `designStatus` | 使用规则 |
|---|---|
| `usable` | 可进入自动选型，但仍需要页面级 QA |
| `needs-renderer` | 已登记但没有真实渲染器，只能作为规划项 |
| `needs-redesign` | 有渲染器但视觉/语义质量不达标，禁止选用 |
| `planned` | 未来组件，占位记录，禁止选用 |
| `deprecated` / `archived` | 历史组件，禁止选用 |

组件维护的最低校验顺序：

```bash
node tools/build-component-index.js
node tools/lint-component-library.js --strict
node tools/render-component-library-preview.js
```

检查结果必须同时看三个数：registry 总数、renderable 数量、selectable 数量。只有 selectable 数量代表生产流程真正能用的组件数量。

## V3 元数据治理

自动推断只能补齐字段，不能自动证明组件适合生产。注册表还需要保存：

- `contentCapacity`：最大条目数、标签长度和正文长度边界。
- `themeCompatibility`：组件在哪些主题下完成过真实渲染；不能只凭“使用了 token”推断。
- `metadataSource`：`manual`、`legacy-inferred` 或其他明确来源。
- `metadataReviewStatus`：`pending`、`legacy-reviewed`、`manual-reviewed`。
- `selectionConfidenceCap`：推断元数据限制自动选择置信度；人工审核后才能提高。

新组件如果没有人工语义审核，`designStatus` 必须保持 `review-required`，不能因为 enrich 脚本补齐了字段就变成 `usable`。

### 人工覆盖的权威边界

`tools/component-metadata-overrides.json` 是策展语义的权威层，适用于：

- 主关系与次关系；
- 表达能力和语义绑定；
- 输入槽位、变体与内容容量；
- `avoidWhen`、`qaRisks` 和选择置信度上限；
- 人工审核人、审核日期和审核状态。

它不能伪造运行时事实：渲染器是否存在、组件是否实际可选择、组件是否在某个主题成功渲染，仍由 renderer、index 和真实 manifest 决定。`enrich-component-registry.js` 与 `build-component-index.js` 必须先合并人工覆盖，再补齐推断字段；重复运行的结果必须确定一致。

策展审核对每个 cohort 至少回答五个问题：

1. 每个组件靠什么独特关系获得入选资格？
2. 选择前必须具备什么证据或输入槽位？
3. 它应当击败哪个相邻组件，为什么？
4. 实际几何结构是否有实质差异，而不只是换了标签？
5. 当前选择置信度上限是否有人工证据支持？

若四个以上组件拥有相同的关系/表达能力/槽位/避免条件指纹，应视为治理告警，而不是“组件很多”。

四主题验证必须真实渲染：

```bash
node tools/render-component-library-preview.js --theme leander-base --out-dir <base-output>
node tools/render-component-library-preview.js --theme base2 --out-dir <base2-output>
node tools/render-component-library-preview.js --theme leander-global --out-dir <global-output>
node tools/verify-component-themes.js <base-manifest> <base2-manifest> <global-manifest> --write
```

这个验证只能证明组件能够在主题下技术渲染。视觉设计师仍需检查对比度、前景色、颜色语义和结构质量。

### 可组合子组件的晋升

优先把重复出现但不能独占整页的内容积累为 `layout-block` 或 `visual-part`。第二阶段的首批基准是：`evidenceLegend`（证据语义）、`stageGateRail`（阶段与审批门）、`statusLegend`（状态语义）。它们只能在以下条件全部满足后从 `review-required` 晋升为 `usable`：

- 输入槽位不绑定某个项目事实；
- 使用主题 token，四主题均真实渲染；
- 小批量图册完成人工视觉检查；
- renderer、registry、index 三层名称与状态一致；
- 严格 lint、元数据审计和回归测试通过。
