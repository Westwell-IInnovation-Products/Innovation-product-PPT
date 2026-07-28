# 布局蓝图 Gate

布局蓝图是大纲审批和详细幻灯片生产之间的一个低成本检查点。

它回答:"在我们花 token 和时间画完整幻灯片之前,这份 deck 的页面结构和视觉节奏行得通吗?"

## 何时用

在用户审批逐页大纲之后、标杆样张或全量生产之前用。

从当前 deck 的 brief、受众、故事、主题、源素材和证据生成蓝图。以前的 deck 和组件预览只是模式参考;绝不把它们的页面顺序、signature 配比或布局分配作为默认照搬。

以下情况必需:
- 超过 8 页的 deck
- 有很多机制/架构/流程幻灯片的 deck
- 用户正在积极塑造视觉风格的 deck
- 任何之前迭代显示出布局/视觉路线反复的 deck

以下情况可选:
- 小修复
- 单页实验
- 布局必须保持忠实的已有 PPT 标准化

## 输出

创建一个低保真的 `layout-blueprint.md` 或 `layout-blueprint.png/contact-sheet`。

在页面级版面结构之前,先做一个**故事级布局遍历**。一份 deck 不是一堆页面;每一页都有一个叙事任务。对内部分享 deck,从 `NARRATIVE-FRAMEWORK.md` 里更宽的框架出发:大问题 -> 当前环境 -> 目标问题 -> 提出的方案 -> 方案展开 -> 实施/效果。然后把这条弧线适配到具体项目。

对超过 8 页的 deck,加一张故事节奏表:

- 章节 / 页面范围
- 叙事阶段:大问题、当前环境、目标问题、方案、方案展开、实施/效果,或一个 deck 专属变体
- 叙事任务:hook、证据、定义、诊断、框架、机制、计划、效果、迁移、收尾
- 布局表达形式:安静封面、对比、证据图、转场、框架图、流程、状态、工具箱、决策、路线图、结尾
- 为什么这个表达形式与上一节不同
- 必须在视觉上彼此呼应或对比的页面

然后产出一份**蓝图到生产约束**。预览阶段可以与组件选择重叠,但必须是刻意的重叠:它定义后续组件选择的搜索边界,而不是最终的组件实现。

### 蓝图大小预算(硬上限)

蓝图是一份约束,不是用户逐行读的交付物。保持它紧凑:

- 逐页约束:至多 12 行 JSON,限于 `page`、`purpose`、`relationship`(+子类型)、`visualSignature`、`expressionMode`、`previewPattern`、`primaryShapeClass`、`candidateComponents`/`patternHints`/`routePreference`,以及稀疏时的 `densityRationale`。没有散文段落,不重复主题规则,不复制大纲文本。
- Deck 级小节(节奏矩阵、颜色语义、呼应对):总共 80 行。
- 一份 24 页 deck 的 `layout-blueprint.json` 应保持在约 350 行以下。如果它涨过这个数,你就是在重复本该属于 `outline.md`、`DESIGN.md` 或主题的信息。
- 仅几何 SVG 预览是**可选**的:只为高风险页(密集机制/架构页、不寻常的 signature)、或用户要求看蓝图的可视化时才生成。它只证明节奏和版面结构,不代表组件效果。只要蓝图声明了 `candidateComponents`,Gate 1.5 就必须另行生成当前主题下的 `layout-blueprint-component-shortlist.svg`;过期或缺失会 fail。

### 1. 故事节奏矩阵

对每个章节或故事段,定义:

- `storySegment`:big-problem、environment、target-problem、solution、solution-detail、implementation-effect、close
- `narrativeJob`:hook、define、prove、transition、diagnose、explain、plan、effect、transfer、close
- `rhythm`:quiet、tension、explanatory、evidence、transition、dense mechanism、synthesis、closing
- `visualTone`:calm、sharp、systematic、proof-oriented、lightweight、governance、aspirational
- `handoff`:这一段如何连接上一段和下一段

### 2. 页面意图卡

在画任何布局之前,每一页都得到一张意图卡:

```json
{
  "page": "p12",
  "message": "Each page folder turns a complex task into a locatable repair unit.",
  "storyRole": "mechanism detail",
  "handoff": "p11 context routing -> p13 tool system",
  "relationship": "state",
  "relationshipSubtype": "state.folder-zoom",
  "risk": ["too much detail", "must match real folder structure"]
}
```

### 3. 布局 Signature 矩阵

每一页都必须有一个**视觉 signature**。signature 比关系更具体。例如:

| 粗关系 | 糟糕的捷径 | 更好的视觉 signature |
|---|---|---|
| `contrast` | 通用双列对比 | `problem-tension`、`concept-boundary`、`before-after-benefit` |
| `ecosystem` | 中心加周围节点 | `domestic-landscape`、`method-transfer-map`、`platform-convergence` |
| `state` | 通用状态盒子 | `folder-zoom`、`version-lifecycle`、`local-memory-unit` |
| `toolbox` | 通用卡片 | `tool-tree-with-call-engine`、`asset-pool-routing` |

矩阵必须包含:

- `visualSignature`
- `themeArchetype`:从所选主题的 `contentFidelity.preferredArchetypes` 中选择主体构图；高容量 Global 页必须从 `highCapacityArchetypes` 选择
- `themeFeatures`:至少两个非 chrome 内容特征；颜色、字体、页眉和页脚不计
- `relationshipSubtype`
- `layoutArchetype`
- `skeletonFamily`:用于节奏审计的粗预览族,例如 contrast / process / map / state / tool-decision / evidence-role / lifecycle
- `previewPattern`:用户真正会看到的低保真渲染形状,例如 split-compare / linear-timeline / hub-map / folder-zoom / evidence-board / center-loop
- `primaryShapeClass`:主导的渲染形状,只从受控集合里取——diamond-fanout / funnel-converge / timeline / grid-matrix / tree-hierarchy / layered-rail / swimlane / radial-hub / evidence-board / big-type / cover。比 `skeletonFamily` 更粗,而且**不是**自由字符串:`skeletonFamily` 让每一页都能取一个唯一标签(于是族审计变得没牙),而一个封闭的形状集合会强制真正的碰撞浮现。两个将画出同一形状的页面必须共享这个 class,好让审计抓住它们——不要靠声明不同的 `skeletonFamily` 字符串来粉饰"菱形对菱形"的重复。声明的 class 必须与页面实际渲染的一致。
- `candidateComponents`:只能填写 `component-index.min.json` 中 `selectable=true` 的精确组件 ID；顺序表示优先级
- `patternHints`:自由布局/构图提示,只能作为弱语义信号,不能冒充组件 ID
- `avoidSignatures`
- `complexityBudget`:low / medium / high
- `contentDensity`:low / medium / high
- `whitespaceIntent`:none / focus / pause / tension / image-led / premium / chapter-breathing
- `densityRationale`:为什么这一页应该稀疏或密集;当低密度创造焦点或节奏时,它是被允许的
- `expressionMode`:mechanism-diagram、screenshot-evidence、big-typography、case-evidence、human-ai-swimlane、artifact-map、simple-image2-illustration,或 component-composite
- `screenshotSlots`:显式槽位,带来源、裁剪规则、解释锚点和脱敏状态
- `implementationStatus`:implemented、partial、proposed、public-reference,或 unknown
- `bodyBox` / `visualCenterY`:当一页显示出居中风险时的正文区约束
- `echoWith`:刻意镜像这一页的页面
- `mustDifferFrom`:必须不用同一版面结构的页面

### 4. 蓝图到组件约束

对每一张内容页,输出一份后续视觉选择能读的约束:

```json
{
  "page": "p13",
  "visualSignature": "tool-tree-with-call-engine",
  "themeArchetype": "base.linear-explanation",
  "themeFeatures": ["linear-divider-structure", "single-semantic-focus"],
  "relationshipSubtype": "toolbox.tool-tree",
  "layoutArchetype": "left-root-middle-branches-right-engine",
  "skeletonFamily": "tool-decision",
  "previewPattern": "tool-tree",
  "primaryShapeClass": "tree-hierarchy",
  "routePreference": ["component-library"],
  "candidateComponents": ["toolSystemTree", "hubSpokeCapability"],
  "patternHints": ["left-root-middle-branches-right-engine", "orthogonal tool tree"],
  "avoidSignatures": ["plain-card-grid", "generic-tree"],
  "complexityBudget": "medium",
  "expressionMode": "mechanism-diagram",
  "screenshotSlots": [],
  "implementationStatus": "implemented",
  "qaFocus": ["orthogonal connectors", "right engine aligned to tool tree"]
}
```

这份约束变窄组件库搜索。`candidateComponents` 是真实组件白名单和强排序信号；`patternHints` 只描述自由构图意图。旧字段 `candidateFamilies` 仅作兼容读取：其中可识别的精确组件会迁移，任何非组件名称都会阻断 Gate 1.5，直到显式移入 `patternHints`。视觉选择引擎只有在记录理由时,才可以覆盖建议路线。

当 `component-library` 是首选或锁定路线时，至少要有一个有效 `candidateComponents`。当外部图、Image2 或页面专属构图为首选且没有组件候选时，必须填写 `routeRationale`，说明为什么组件库不承担主表达。

### 5. 颜色语义约束

布局蓝图还必须定义**颜色含义**,不只是位置。主题颜色不是装饰;它们是帮助受众跟随故事的语义标记。

加一个 deck 级颜色语义块:

```json
{
  "colorSemantics": {
    "red": "focus, conflict, risk, current selection, gate, or key change only",
    "navy": "stable structure, normal system path, baseline state, reusable asset",
    "lightBlue": "supporting context, inactive peer, neutral evidence",
    "lightRed": "selected focus background, problem highlight, changed result",
    "gray": "secondary connector, inactive boundary, scaffold line",
    "cyan": "brand marker only, not a logic color"
  }
}
```

对每一张内容页,添加或推断:

- `colorIntent`:哪个元素值得红 / 藏青 / 中性处理
- `accentTarget`:那唯一最重要、要强调的对象
- `neutralElements`:必须不与焦点竞争的支撑对象
- `forbiddenColorUsage`:红、青或装饰性多色不应出现的地方

蓝图阶段应决定**角色和强调**。后续的幻灯片生产阶段可以调精确的色调、透明度和局部平衡,但不应从头发明一套新的颜色逻辑。

每一页都应展示:

- 页面 ID 和标题
- 在整个故事里的叙事角色
- 上一页/下一页交接
- 一句话页面信息
- 关系类型和子类型
- 视觉 signature
- 用大块表示的粗略布局分区
- 计划的视觉路线:组件 / 外部图形 / image2 / 混合 / 自定义
- 候选组件族或模式族
- 要避免的 signature / 重复版面结构
- 风险备注

不要写最终幻灯片文案。不要画详细图标。不要调排版。

## 页面蓝图格式

```markdown
| Page | Story role | Handoff | Message | Relationship subtype | Visual signature | Skeleton family | Preview pattern | Layout skeleton | Candidate families | Avoid | Risk |
|---|---|---|---|---|---|---|---|---|---|---|---|
| p11 | Mechanism detail | p10 orchestration -> p12 state | Context should be routed by phase | `contrast.problem-vs-route` | context-overload-vs-router | contrast | split-compare | left failure scene / center divider / right vertical route | imageSlot, pipelineFlow | generic two-column compare | image must stay simple; right route must not overlap |
```

对截图证据页,在矩阵下方加一张短槽位表:

```markdown
| Page | Slot | Source | Crop rule | Explanation anchor | Redaction |
|---|---|---|---|---|---|
| p13 | skill-md | `.codex/skills/innovation-products-ppt/SKILL.md` | first screen only | left callout | no secrets |
```

对可视化预览,用简单的彩色块:

- 标题/页眉带
- 主图形区
- 文字/支撑区
- 图片槽位
- 证据/结果带
- 结论/提醒带

预览允许低保真,但它仍然必须服从颜色语义约束。例如,如果红标记当前版本或选中的页面文件夹,就不要在不相关的同级块上也用红。如果一页不需要冲突/当前状态强调,就让正文结构大部分保持藏青 / 中性,把红留给标题横线或一个焦点标记。

对超过 8 页的 deck,产出至少两个预览视图:

- contact sheet:所有页面,用于检查故事节奏和重复
- 风险页放大预览:仅高风险页,用于检查布局可行性

如果时间允许,再产出一个故事条预览,展示章节如何连接。

## 低保真预览 QA(仅当生成了预览时)

预览是可选加入的(见上面的大小预算)。跳过预览就跳过整节;蓝图 gate 于是依赖 `lint-layout-blueprint.js`、`verify-design-gates.js blueprint`,以及主 agent 的清单自审。

低保真不意味着几何可以错。在展示布局预览之前,跑一遍快速几何检查:

- 没有形状/文字区可以与另一个区重叠,除非那个重叠正是被测试的显式视觉关系
- 每个页面版面结构都必须留在幻灯片安全区内
- 连接线必须直、或刻意做成曲线;意外的斜线/交叉线 fail
- 连接线必须不从视觉上穿过不相关的盒子、标签、截图槽位或伪文本行
- 内部组件标记必须看起来不像坏掉的真实内容;如果预览符号细到在 contact-sheet 尺度下无法保持干净,就简化它
- 一个在 contact-sheet 尺度下看着错位、纠缠或含糊的预览组件 fail,即便坐标检查器报 PASS
- 重复的同级块必须共享相同的尺寸、基线和间距
- 关键机制页必须在 contact-sheet 尺度下保持可读
- 如果预览渲染器产生了一个 artifact,用更简单的版面结构重渲染它,而不是把它解释过去
- 产出一份 `preview-qa.md` 或等价备注,把以下三者分开:面向用户的预览文件、下游约束文件,以及内部渲染器/调试文件
- 检查截图槽位:它们必须有足够的空间、一个来源,以及附近的解释锚点
- 检查实现真实性:implemented/partial/proposed 的说法必须匹配真实文件、脚本或公开来源
- 检查颜色语义:红在页面上有一个清晰角色,青仅作品牌,中性元素不与焦点标记竞争
- 写机器可读的预览 QA,例如 `layout-blueprint-preview-qa.json`;保持文件名稳定,并在文件里存机制版本加源哈希
- 跑一次布局多样性审计:重复的视觉 signature、重复的布局 archetype,或相邻页面用同一版面结构,都必须在用户评审之前被计数
- 如果预览渲染器把不同 signature 映射到同一个通用绘制,那是渲染器覆盖缺陷,不是一个有效的设计决策

### 布局多样性审计

Gate 1.5 必须不仅检查"每一页单独是否有效",还要检查"整份 deck 是否有一个设计过的节奏"。

在请用户审批蓝图之前,跑两道硬 gate:

```bash
node tools/verify-design-gates.js blueprint
node tools/lint-layout-blueprint.js
node tools/render-layout-blueprint.js
node tools/lint-blueprint-preview.js
```

当渲染器运行时,它必须产出两类稳定 artifact。仅几何层是 `layout-blueprint-preview.svg`、`layout-blueprint-risk-preview.svg`、`layout-blueprint-geometry.json` 和 `layout-blueprint-preview-qa.json/md`；真实组件层是 `layout-blueprint-component-shortlist.svg/json/md` 及其渲染素材目录。只有源哈希匹配当前蓝图时,PASS 才有效。没有组件候选时，几何预览可以按成本策略跳过；只要存在 `candidateComponents`，真实组件 shortlist 就是 Gate 1.5 必需证据。

`verify-design-gates.js blueprint` 检查项目设计规则是否存在于蓝图约束里:表达模式、故事角色、颜色意图、截图槽位、正文区、底部总结理由，以及组件 ID 合同。`lint-layout-blueprint.js` 检查 deck 节奏、preview-pattern 重复、候选组件真实性和旧字段迁移。`lint-blueprint-preview.js` 检查面向用户的预览是否安全到能作为生产约束用，并验证真实 shortlist 的主题渲染和源哈希；仅几何预览绝不能被描述成组件效果。如果任何一个返回 `FIX-FIRST` / 非零退出,不要把蓝图作为审批证据展示。

在展示蓝图预览之前,审计这些项:

- **相邻重复**:用同一 `layoutArchetype` 的相邻页面通常应说明这是不是一个对比系列、呼应,或刻意的节奏。重复不自动是缺陷。
- **连续重复**:一个 3 页连续共享一个粗版面结构族的段落需要评审。它对刻意的案例系列或对比序列可能有效;否则改变表达形式或记录该系列的理由。
- **Deck 重复**:重复的 `visualSignature` 或 `previewPattern` 对真实的系列、对比、复现或呼应是允许的。审计重复是否服务故事,而不是强加一条通用的一次性规则。
- **渲染器重复**:如果两个不同的 signature 渲染成同一个低保真几何,在审批之前拆分渲染器的 preview pattern,或把其中一页简化成一个不同的版面结构。
- **形状类碰撞**:`lint-layout-blueprint.js` 计数 `primaryShapeClass` 的复用(一个受控集合,所以不同的 `skeletonFamily` 标签藏不住它),`render-diversity.js` 在渲染后重新检查它。共享一个形状类的两页不自动是缺陷,但它们必须并排打开、并被证明在真实构图上不同——这就是那道能抓住"菱形对菱形"重复的守卫,而占用率类特征(仅像素填充)看不出这种重复。超过三页在一个形状类上则阻塞。
- **Preview-pattern 重复**:每张内容页都必须显式声明 `previewPattern`。当重复制造一个长的机械段落、主导整份 deck,或忽视不同的叙事任务时,它成为阻塞。
- **机制节的节奏**:对长机制章节,刻意交替表达形式:概览 -> 流程 -> 对比 -> 状态 -> 工具箱 -> 决策 -> 证据 -> 角色/证据 -> 生命周期 -> 综合。不要让每一张机制页都变成盒子加箭头。

建议阈值:

| 检查 | 何时 fail Gate 1.5 |
|---|---|
| 相邻页面用同一 `layoutArchetype` | 通常是警告;当它制造一个计划外的 3 页连续、或与不同叙事任务矛盾时阻塞 |
| 同一 `visualSignature` 重复 | 通常是警告;当重复的页面本该表达不同关系、且没有理由时阻塞 |
| 同一粗版面结构族连续出现 3 次 | 没有刻意的节奏备注 |
| 一个版面结构族超过约 25% 的内容页 | 警告以待评审;只有当它在没有故事理由的情况下制造机械重复时才阻塞 |
| 同一 `previewPattern` 出现多次 | 通常是警告;当它主导 deck、或在没有理由的情况下制造机械段落时阻塞 |
| 任何内容页没有 `previewPattern` | 总是 |
| 出现渲染器备用/通用模式 | 面向用户的预览里任何一次出现 |

多样性审计应产出一份简短的中文报告,例如 `layout-blueprint-diversity-audit.md`。如果它报 `FIX-FIRST`,先不要请用户审批蓝图。

如果一个低保真预览有明显的重叠、偏心的结构或误导的连接线,Gate 1.5 **不通过**。在标杆样张之前修蓝图或预览渲染器。一个坏掉的预览只允许作为内部诊断 artifact,不能作为审批证据。

### 蓝图预览模式安全

预览渲染器是机制的一部分,不是一张用完即弃的草图。不要审批那些会教生产错误结构的低保真绘制。

用这些硬规则:

| 页面意图 | 失败的预览模式 | 更安全的模式 |
|---|---|---|
| 大字号 / 关键词张力 | 中心块带放射辐条、轨道线或意外斜线 | 中心词 / 环绕的关键词块 / 底部位移带 |
| 概念边界 | 一个看起来像第三个概念或桥接组件的红色中间 chip | 两个概念面 + 一条干净的分隔 + 一个小的关系标记 |
| 工具树 / 组件路由 | 纠缠的树、斜连接线、预览面板穿过分支 | 左根 / 竖干 / 正交分支 / 右预览列 |
| Agent 或证据交接 | 许多小角色盒子全都连到一个节点 | 紧凑的交接阶段 + 证据截图槽位 |
| 反馈闭环 / 生命周期 | 线穿过中心或不清晰的循环方向 | 外循环提示、分阶段的环,或带清晰复现的从左到右生命周期 |
| 分享 / 公私过滤 | 带含糊线条的装饰性漏斗 | 输入 -> 过滤 -> 输出管线,带一个选定结果 |

这些是通用安全规则。如果一个项目需要不同的模式,在蓝图约束里记录理由,并用一张干净的放大预览证明它。

## 预览 vs 生产

蓝图预览不是最终幻灯片实现,不应被当作最终坐标。它是关于故事节奏、布局族、preview pattern、强调,以及组件搜索边界的约束。

然而,预览缺陷仍然可能以三种方式向下游传播:

- 它们可能让用户审批一个薄弱或令人困惑的页面结构
- 它们可能把视觉选择引向一个不合适的组件族
- 它们可能把真实的布局风险藏到昂贵的页面生产阶段

因此,任何可见的预览失序都必须在向前推进之前分类:

| 缺陷类型 | 含义 | 动作 |
|---|---|---|
| 渲染器 artifact | 想法是好的,但低保真渲染器画糟了 | 简化或修复预览渲染器,再重渲染 |
| 蓝图约束缺陷 | 页面的布局想法不清晰或太密 | 修订 `visualSignature`、`previewPattern`、版面结构,或拆分页面 |
| 组件风险 | 预览揭示可能的组件族也许不合适 | 把该页标为高风险,并要求在全量生产前有锚点/样张证明 |

如果面向用户的预览组件看着纠缠、歪斜或语义误导,不要从 Gate 1.5 推进到标杆样张。

## 审批标准

在详细幻灯片生产之前,确认:

- 故事弧线在整份 deck 上可见,不只是在每一页内部
- 故事弧线保持足够宽以适配 deck 类型,而不是复制上一个项目的详细序列
- 页面顺序仍然行得通
- 每一页都有清晰的叙事任务和到下一页的交接
- 每一页都有一个比粗关系更具体的视觉 signature
- 同 signature 的页面是刻意的系列、对比或呼应,而不是意外的模板复用
- 内容页存在蓝图到组件约束,且具体到能变窄组件搜索
- 需要的页面存在表达模式、截图槽位和实现状态
- 当故事变化时布局节奏变化,当故事刻意回指时视觉上呼应
- 相邻页面不太频繁地重复同一布局
- 整份 deck 里重复的版面结构被计数并有理由
- 重复的版面结构要么被当前故事/系列证明合理,要么在审批前重新设计
- 密集的页面被拆分或简化
- image2/外部图形的需求被早早识别
- 高风险页被选为标杆样张
- 锚点覆盖封面/品牌页、截图证据页、数据密集页,以及至少一张缺素材但需高指标容量的变量/待仿真页
- 组件选择在详细绘制前感觉合理
- 低保真预览居中且结构可读;粗糙可接受,但混乱的连接线或明显偏心的版面结构让蓝图 fail
- 颜色角色在整个故事里有意义:红标识张力/当前/gate/变化,藏青标识稳定结构,装饰性颜色不被当填充用

## 这道 Gate 防止什么

- 从一个结构薄弱的大纲搭建整份 deck
- 搭建局部正确、却不构成连贯故事的页面
- 太晚才发现很多页面用同一种卡片布局
- 对本该可编辑的逻辑过度使用 image2
- 把一个整页组件硬套到一个只需要局部版块的页面上
- 全量 PPT 生成之后昂贵的重新设计
- 在生产中才发现颜色强调与故事矛盾、或让每个对象看起来同等重要

## 最小蓝图循环

```text
outline approved -> generate layout blueprint -> user confirms structural rhythm -> anchor samples -> production
```

如果用户否决一个版面结构,先改蓝图,而不是改完成的幻灯片。
