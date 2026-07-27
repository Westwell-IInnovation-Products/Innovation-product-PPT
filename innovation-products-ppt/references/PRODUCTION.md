# PPT 生产模式

本文件是"标杆样张审批之后产出完整 deck"、以及"反馈之后修复已生成 deck"的唯一必读指南。

## 何时读

只在以下情况读本文件:

- 用户审批了标杆样张页,并要求继续到全量生产。
- 用户要求从一份已审批的大纲生成很多幻灯片。
- 用户对已生成的幻灯片给出反馈。
- deck 长到需要章节、批次或并行工作。

不要在最初的 brief 或大纲工作期间读本文件。

## Context 进入规则

对已有框架,在打开长 reference 或很多页面文件之前,先构建一个紧凑状态数据包:

```bash
node tools/context-pack.js --mode status
```

对页面或批次修复:

```bash
node tools/context-pack.js --mode repair --pages p11,p12
```

把数据包当作默认的 context 边界。只打开 `recommendedReads` 点名的页面文件、路线约束、QA 备注和组件文档,除非修复改变共享 theme token、共享组件、故事结构或终版交付 gate。

## 产物标签规则

在每个 phase 输出、批量生产、反馈修复或终版交付之后,更新产物 manifest:

```bash
node tools/artifact-map.js --write
```

向用户报告时用 `artifact-manifest.md`。分开:

- `user-confirm`:用户现在应检查或审批的文件。
- `next-input`:为下一步生产/修复/QA/agent 保留的文件。
- `internal-evidence`:QA/渲染/角色证据;对审计有用,通常不需要用户确认。
- `final-output`:可交付的 PPTX 或最终包。
- `archive-reference`:长期记忆/历史。

不要让用户去决定哪些生成文件重要。这个分类归工作流所有。

## 生产单位模型

Innovation-Products_ppt 有三种生产单位:

| 单位 | 用于 | 隔离规则 |
|---|---|---|
| 页(Page) | 单张幻灯片的创建或修复 | 只编辑目标幻灯片函数或幻灯片对象 |
| 批(Batch) | 3-6 张相关页面 | 让批内页面对齐到同一章节和同一组件语言 |
| 章(Chapter) | `outline.md` 里的一个逻辑段 | 从大纲的一个章节切片工作,而不是整份 deck |

默认单位:

- 小 deck:页或批。
- 长 deck:章。
- 用户反馈:最小的受影响页面集。

撰写单位 vs 存储单位(token 节奏):撰写和 QA 回填单位是章——把一章的 `page.js` 文件一起读,在一遍里填它们 `qa-result.json` 的证据,让这一章的约束共享一次 context 加载,而不是每页一次往返。存储和摘要单位仍是页:每页保持一个文件夹和一个 `qa-result.json`,这样单页修复只使那一页失效并重渲染。绝不把一章合并成一个共享文件夹或一个共享 `qa-result.json`——那会用便宜的增量重渲染换来修复循环里昂贵的整章重跑,而那些循环才是主要成本。一轮 FIX-FIRST 之后,只重审改动过的页面加上未决发现,而不是整章再来一遍。

## 强制 Preflight

在产出任何 PPTX 页面之前,确认这些项存在:

- `brief.md` 和 `outline.md`。
- `tools/artifact-map.js`,或框架的等价物,好让当前输出能被标注为用户确认物和下一步交接。
- 已审批或明确选定的主题/模板。
- 带 `theme/`、`components/`、`pages/`、`tools/deck.js`、`deck.config.js` 和 `output/` 的 deck 项目框架。
- 每个大纲页面一个页面文件夹:`pages/<id>/{page.js, page.json, qa.md, out/}`。
- 每一页的 `page.json`(逐页约束),从已审批大纲生成,内容页含 `visualSelection` 和中文 `qaProfile`。
- 如果启用 agent 协作:`agent-collaboration.json` 和 `agent-collaboration.md`,带角色证据或备用/bypass 理由。
- 标杆样张 PPTX 和渲染 PNG,除非用户只要求大纲/主题工作。
- `checkpoint-status.json` 表明标杆样张已审批或明确 bypass,且生产模式已审批。

如果任何项缺失,在产出幻灯片之前创建或索取它。不要用一次性脚本悄悄继续。

## 页面隔离(当前模型)

隔离单位是**逐页文件夹** `pages/<id>/{page.js, page.json, qa.md, out/}`。一个"章"或"批"是那些页面文件夹的一个*逻辑分组*(按大纲章节),用于生产排序和评审——不是一棵单独的文件夹树。页面顺序 = `pages/` 下排序后的文件夹名。

```text
pages/
+-- p01-cover/      page.js · page.json · qa.md · out/p01.png
+-- p02-context/    page.js · page.json · qa.md · out/p02.png
+-- p03-product/    ...
```

每个页面文件夹是生产控制单位。`page.json` 是它的本地约束(`id, title, component, dataBoundary, assetNeed, frameworkLayer, mechanismLayer, expressionMode, implementationStatus, screenshotSlots, visualSelection, qaProfile`);`outline.md` 拥有全局故事和每一页的 takeaway/视觉意图。没有逐页文件夹,最小单位修复和 `tools/deck.js` QA gate 就都不可用。

> 旧版:下文的 chapter/batch 表示一组页面文件夹。新框架不包含平行的 chapter 树或单体生成器。

## 本地事实来源

在逐页模型里,本地事实来源是每一页的 `page.json`(加上 `outline.md` 里那一页的行,用于 takeaway/视觉意图)。它扮演旧模型里 `chapter.json` 扮演的角色。

`page.json` 字段:

```json
{
  "id": "p01",
  "title": "Opening",
  "component": "cover",
  "dataBoundary": "none",
  "assetNeed": "none",
  "frameworkLayer": "执行编排",
  "mechanismLayer": "阶段 Gate 与人工确认",
  "expressionMode": "mechanism-diagram",
  "implementationStatus": "implemented",
  "implementationEvidence": ["checkpoint-status.json"],
  "screenshotSlots": [],
  "visualSelection": {
    "intent": "Opening tone page",
    "relationship": "cover",
    "candidateRoutes": [],
    "selectedRoute": { "route": "theme-chrome", "name": "cover" },
    "rejectedRoutes": [],
    "reviewFocus": ["Theme fit", "Title hierarchy", "Brand chrome"]
  }
}
```

规则:

- `outline.md` 拥有全局故事和每一页的 takeaway + 视觉意图。
- `page.json` 拥有一页的本地构建约束(组件来源、数据边界、素材需求)。
- `page.json.visualSelection` 拥有视觉路线决策:component-library、external-graphic、image2/imageSlot,或页面专属自定义。读 `VISUAL-SELECTION.md`。
- `page.json.qaProfile` 拥有中文动态 QA 约束:通用检查、关系检查、路线检查、组件检查、内容检查和证据检查。读 `DYNAMIC-QA.md`。
- `frameworkLayer` 和 `mechanismLayer` 把第一层概念和具体机制分开。
- `expressionMode` 在组件选择之前决定页面的呈现模式。
- `implementationStatus` 和 `implementationEvidence` 防止把计划中的机制当作已实现来呈现。
- `screenshotSlots` 早早预留真实证据,且必须被蓝图和页面实现遵守。
- `page.js` 实现它们;它不应悄悄改动标题、takeaway、视觉意图或数据边界。
- QA 和修复报告应引用 `pageId`(`pages/<id>/`)。
- 如果全局大纲变了,在生产继续之前更新受影响的 `page.json` / `page.js`。
- 如果一页在实现期间改变视觉形态,先更新 `page.json`(和大纲行),或把已批准的理由记录在该页的 `qa.md` 里。

## 画之前先做视觉选择

在实现或修复一张内容页之前:

1. 读那一页的 `outline.md` 行:takeaway、视觉意图、数据边界和素材需求。
2. 归类受众必须看到的关系:sequence、hierarchy、contrast、state、system-map、toolbox、evidence、scene、decision,或 lifecycle。
3. 在 `COMPONENT-CATALOG.md` 和框架的 `components/` 里查找匹配的原型。优先改编/扩展现有组件,而不是手画。
4. 评估 `VISUAL-SELECTION.md` 里的全部四条路线:component-library、external-graphic、image2/imageSlot,以及 page-specific-custom。
5. 把决策写进 `page.json.visualSelection`。
6. 跑 `node tools/build-qa-profile.js pages/<id>/page.json --write` 生成中文动态 QA 检查。
7. 在渲染 QA/build 之前跑 `node tools/verify-design-gates.js pages`,确保设计规则抵达了 `page.json` 和 `qaProfile`。
8. 只有到这时才实现或敲定 `page.js`。

如果页面是 `expressionMode = screenshot-evidence`,不要从一个通用组件开始。先决定截图框、裁剪、解释锚点和脱敏边界。如果页面是 `expressionMode = big-typography`,不要硬塞一个图表或卡片网格。

页面专属构图是内容页的默认。如果存在一个相近的组件(`stateFlow`、`workflowConfig`、`pipelineFlow`、`featureGrid`、`hubSpokeCapability` 等),把它作为构图页面里的正文块用;在封面和章节分隔页之外,把一个组件原样当作整页是质量底线违规。

## 规模化之前先锚点

第一份生产证明不是线框。它必须是一份真实可编辑的 PPTX 样张。

1. 做 2-3 张标杆页:封面/定调、密集内容页、最难的图示页。
2. 把标杆页渲染成 PNG。
3. 跑自检,并在启用时,把 `visual-designer-zh` 证据或备用记录在 `agent-collaboration.json`。
4. 修 fail 项。
5. 停下来等用户审批。

只有在审批之后,skill 才可以进入全量生产。

在任何 Phase 4 页面生产之前跑这个:

```bash
node tools/verify-checkpoints.js phase4
```

如果 gate 失败,在检查点停下。不要把渲染 QA PASS 当作用户审批。

标杆样张必须从打算用于完整 deck 的同一套框架、theme token 和组件库产出。一个视觉相似但独立的一次性脚本不算一份已审批的锚点。

## 全量生产模式

在 Checkpoint Plan 处、或 Phase 4 之前选一种模式。

Mode A/B/C 只决定页面如何产出。它们不决定哪些专家角色活跃。角色由 `workflow.events` 触发;锚点和整片渲染需要 visual-designer 和 reviewer 证据,而 component 角色取决于组件置信度、共享变更和 deck 类型;讲稿由主 Agent 按需产出,不是角色。

### Mode A - 章/批确认

当质量和对齐最重要时用这个。

流程:

```text
Batch or chapter 1 -> render -> self-check -> user review
Batch or chapter 2 -> render -> self-check -> user review
...
Full integration -> full render -> event-triggered role review -> final user review
```

当用户明确想检查每一章、或叙事/视觉不确定性仍然很高时用它。它的返工风险最低,但重复 context 成本最高。

对每个 Mode A 批次,用 `workflow.stage = "production-batch"`,把 `workflow.activePages` 设为只有当前的页面文件夹,并把 `batchFileName` 设为一个稳定的批次输出。生成 `output/current-batch-contact-sheet.svg` 并停下来等用户评审。只有在所有批次都整合之后,才切到 `workflow.stage = "production"`;这时才应用整片角色 gate 和终版交付。

### Mode B - 顺序整片

在用户审批了一份稳定的大纲、蓝图、主题和锚点风格之后,这是推荐的默认。它保住同样的终版质量锁,同时避免重复的批次 context 和 QA。

流程:

```text
Batch/chapter 1 -> batch/chapter 2 -> ... -> full render -> full QA -> event-triggered role review -> user review
```

主 agent 顺序实现。如果样张风格仍未定,不要用这个模式。

### Mode C - 并行章节生产

只有当 subagent 可用、且 deck 能按章节分区时才用这个。

流程:

```text
Main agent owns: outline, theme tokens, anchor sample, final integration, final QA
Subagents own: isolated chapter or batch drafts
Main agent merges, normalizes, renders, fixes, runs event-triggered role review, and reports
```

并行工作只在标杆样张审批之后才允许。

每个 subagent 的 prompt 都必须包含:

- 来自 `outline.md` 的确切页面范围(分配的页面批次)。
- 页面文件夹路径(`pages/<id>/`)和每一页的 `page.json`。
- `references/SLIDE-CRAFT.md` 路径。
- `references/VISUAL-SELECTION.md` 路径。
- 需要视觉/组件决策时的 `references/VISUAL-COMPOSITION.md` 路径。
- `references/QA.md` 路径。
- `references/DYNAMIC-QA.md` 路径和受影响的 `page.json.qaProfile`。
- 当前 theme/模板 token。
- 已审批的标杆样张截图或 PPTX 路径。
- 如果预期用到组件,组件目录路径。
- 明确指示:不要修改不相关页面或全局主题文件。

预期风险:章节风格可能不同。主 agent 必须在终版交付之前统一排版、间距、组件使用、页眉/页脚节奏和说法标注。

Mode C 硬规则:章/批生产 worker 不是角色评审 agent。一个起草页面或执行批次自检的 subagent 不满足 `component-curator-zh`、`visual-designer-zh` 或 `reviewer-zh` 的终版证据。Mode C 整合之后,对完整渲染的 deck 再跑一遍那些角色 agent,并记录 `phase: "post-production"` 证据。

## 能力使用协议

只在能改进隔离或评审质量的地方使用额外 agent。

| 能力 | 何时用 | 何时不用 |
|---|---|---|
| 主 agent | 标杆样张、主题选择、终版整合、终版 QA、面向用户的决策 | 绝不下放最终责任 |
| Planner agent | 复杂的"来源到大纲"工作、故事评审、页面意图评审 | 只修一个视觉缺陷时 |
| Layout architect agent | 长 deck 布局蓝图、视觉 signature 评审、预览风险评审 | 极小的 deck 或没有布局变化 |
| Visual designer agent | 标杆样张风格、颜色语义、视觉打磨、高风险页风格评审 | 纯内容编辑 |
| Component curator agent | 视觉路线/组件库决策、可复用组件提升 | 页面路线已审批且未变时 |
| Reviewer agent / Agent Teams | 对大纲、样张页、完整 deck 或修复页的独立 QA | 琐碎的纯文字元数据改动不需要 |
| 讲稿(主 Agent 交付步骤,非角色) | 终版讲者流、内部分享就绪度 | deck 还没通过渲染 QA 之前 |
| Subagent 生产 | 锚点审批之后的 Mode C 并行章/批生产 | 锚点审批之前,或 deck 风格未定时 |
| Subagent 评审 | 审阅员团队不可用、但独立 QA 有价值时 | 还没有渲染 artifact 时 |
| 当前 agent 自检 | 没有审阅员/subagent 时的备用 | 绝不用瞄一眼替代基于渲染的 QA |

主 agent 必须始终拥有:

- `brief.md` 和 `outline.md` 的最终结构。
- 主题/模板选择。
- 标杆样张审批交接。
- 共享组件和主题变更。
- 终版合并、渲染 QA 和用户报告。

Subagent 可以拥有:

- 一份角色专属的评审或规划 artifact。
- 一个隔离的章节。
- 一批相邻页面。
- 一次独立评审。

Subagent 必须不拥有:

- 整片结构变更。
- 共享 theme/token 变更。
- 最终 deck 验收。
- 面向用户的结论。

## Agent 协作证据

当启用基于角色的协作时,在每个角色贡献之后更新 `agent-collaboration.json`:

- `planner-zh`:大纲/故事评审 **与布局蓝图评审**之后(同一角色,一次出完)。
- `visual-designer-zh`:锚点/风格评审之后。
- `component-curator-zh`:路线/组件决策评审之后。
- `reviewer-zh`:每次渲染 QA 之后。

跑:

```bash
node tools/deck.js verify --final
```

在终版 build 之前。常规页面工作期间,用 `node tools/deck.js verify` 只检查页面 QA;终版协作证据由 `node tools/deck.js verify --final` 和非 draft 的 `node tools/deck.js build` 检查。

如果一个必需角色没有被真实 subagent 跑,把 `status` 设为 `fallback`,写一个清晰的 `reason`,并仍然提供 `verdict`、`summary` 和 `evidence`。不要把一个必需角色标为 `bypassed`,除非 deck 配置明确允许对小/简单 deck 的必需 bypass。

生产阶段例外:当 `deck.config.js.workflow.stage = "production"` 且 `agentCollaboration.requirePostProductionRoleReview` 不为 `false` 时,终版的 `component-curator-zh`、`visual-designer-zh` 或 `reviewer-zh` 检查不允许备用。这些角色必须是 `status: "completed"`、`phase: "post-production"`,且它们的证据必须提到 `full-deck`。标杆样张评审、页面生产 worker 和主 agent 备用都不能满足这道终版 gate。

## 最小单位修复协议

当反馈识别出幻灯片问题时,修复最小的受影响单位。

1. 定位幻灯片编号和页面 id(`pages/<id>/`),以及产出它们的 `page.js`。
2. 归类问题:
   - 内容错误
   - 布局/裁切/重叠
   - 排版/可读性
   - 视觉形态/组件不匹配
   - 素材/图片问题
   - 说法/来源边界问题
3. 只修补受影响的幻灯片,除非问题是全局主题或重复的组件行为。
4. 重新生成受影响的 PPTX。
5. 重新导出受影响页,当节奏或一致性可能变化时加 contact sheet。
6. 对修复过的页面跑 QA。
7. 报告改了什么、没动什么。

不要为一页的反馈重新生成或重新设计整份 deck,除非用户要求、或根因是一个共享组件/主题 bug。

## 修复范围决策树

| 反馈类型 | 修复范围 |
|---|---|
| 错字、措辞、一个标签 | 仅目标页 |
| 一页布局偏心、裁切、太小 | 仅目标页 |
| 重复的卡片样式在很多页上太小 | 共享组件,然后受影响页 |
| 字体、颜色、安全区全局错误 | 主题 token 或 helper,然后受影响页/整片预览 |
| 章节逻辑错误 | 章节批次和大纲检查点 |
| 页面顺序或故事线错误 | 生产之前的大纲修订检查点 |
| 用户说"让整份 deck 更像样张 X" | 新的标杆样张或主题检查点,而不是盲目整片重写 |

如果范围不清楚,先检查受影响页,选最小的合理范围。只有当同一根因出现在多页上时才升级。

## 共享组件修复

如果一个缺陷来自一个可复用组件:

- 把组件 helper 修一次。
- 重新生成所有用到它的页面。
- 至少检查所有受影响页。
- 说明这次修复是组件级的。

## 隔离规则

- 每份 deck 都用逐页文件夹(`pages/<id>/`);长 deck 时把它们逻辑地分组成批/章。
- 让每个 `page.json` 与 `outline.md` 保持同步。
- 把页面专属逻辑放在它的 `page.js` 构建函数里,不放在共享文件里。
- 让主题 token 与页面内容分开。
- 让组件 helper 可复用、通用。
- 从框架文件 import 已审批的主题和组件;不要在页面脚本里重新定义一套新调色板或布局系统。
- 让外部渲染源文件挨着它们导出的 PNG/SVG 定格。
- 不要让一页的补丁重写不相关页面。
- 不要在生产期间修改大纲,除非用户批准一次结构变更。
- 不要让 subagent 改动共享组件文件,除非明确分配。

## 生产自检

在把任何批/章/页报告为完成之前:

- [ ] 该单位匹配它的 `outline.md` 切片。
- [ ] 该单位匹配它的 `page.json` 约束和它的 `outline.md` 行。
- [ ] 每张内容页都有 `page.json.visualSelection`,且实现遵循选定路线。
- [ ] 每一页都有中文 `page.json.qaProfile`,且评审备注回答了它的检查。
- [ ] 当 `terminology.json` 存在时,页面标题和框架标签通过 `node tools/verify-terminology.js`。
- [ ] 当 deck 讨论 state、memory、恢复或续做时,state/记忆的说法通过 `node tools/verify-state-memory.js`。
- [ ] 页面约束通过 `node tools/verify-design-gates.js pages`;设计规则不只是写在 `DESIGN.md` 里。
- [ ] 截图槽位、表达模式、实现状态和证据边界都反映在页面设计里。
- [ ] 如果启用 agent 协作,`agent-collaboration.json` 没有待决的必需角色、没有未审批的必需 bypass,且 `node tools/deck.js verify --final` 通过。
- [ ] 如果 `workflow.stage` 是 `production`,当前事件触发的所有角色都有 V2 run ID、输入/输出哈希、真实 artifact 和有效结论;reviewer 始终必需(讲稿由主 Agent 产出,不计入角色证据)。
- [ ] 最新输出之后跑了 `node tools/artifact-map.js --write`,且用户报告把确认文件和下一步输入分开。
- [ ] 在任何页面专属自定义路线之前,考虑过 component-library、external-graphic 和 image2/imageSlot 路线。
- [ ] 视觉形态匹配页面关系,不只是标题。
- [ ] 该单位使用已审批的主题/模板和锚点风格。
- [ ] 该单位 import 框架的 theme/components,而不是用一次性的本地样式。
- [ ] 每一页都有组件来源、素材来源/需求和数据边界的可追溯性。
- [ ] 该单位被渲染成 PNG。
- [ ] 可见的 fail 项被修掉。
- [ ] 如果该单位被修复过,不相关页面没有被改动,除非确有必要。
- [ ] 剩余风险被清楚报告。
