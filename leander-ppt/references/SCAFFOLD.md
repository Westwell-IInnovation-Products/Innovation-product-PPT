# Leander PPT 框架

框架是那个可复用的工作结构,它防止每个 PPT 任务都沦为一次性脚本。

## "真正的框架"意味着什么

对 Leander PPT 来说,真正的框架不只是指令。它是一套文件夹结构、主题 token、组件 helper、抽取工具和 QA 工具,可以跨 deck 复用。

可执行的 Codex 框架随 skill 发布在 `templates/leander-ppt-scaffold/`。它包含主题 token、组件库、图标 helper、逐页生产工具,以及输出目录。

## 逐页生产模型(当前)

一份 deck 是一组**逐页文件夹**加上一个 config 和一批工具。每一页的构建代码都住在它自己的 `page.js` 里,所以一页可以被隔离地渲染、评审和修复——而 `tools/deck.js` 里的一道**硬 QA gate** 会拒绝组装任何缺少当前视觉选择约束、匹配实现绑定或新鲜渲染评审的页面。

```text
<deck-project>/
+-- source/                 original.docx / notes / extracted
+-- brief.md
+-- outline.md
+-- artifact-manifest.md    generated human-readable output labels
+-- artifact-manifest.json  generated machine-readable handoff
+-- deck.config.js          { name, theme, fileName }
+-- checkpoint-status.json  phase checkpoint approvals before scaling
+-- agent-collaboration.json machine-checkable role evidence
+-- agent-collaboration.md   human-readable role notes and fallback reasons
+-- theme/                  tokens.js (+ leander-global.js), assets/
+-- components/             ppt-components.js · editorial.js · bespoke.js · icons.js
+-- state/                  compact run memory + project-local feedback log
+-- pages/
|   +-- p01-cover/
|   |   +-- page.js         module.exports = { id, title, visualBinding, build(slide, ctx) }
|   |   +-- page.json       contract { id, title, component, dataBoundary, assetNeed, visualSelection, qaProfile }
|   |   +-- qa.md           per-page verdict — "Verdict: PASS" required, newer than page.js
|   |   +-- out/p01.png     isolated render of THIS page
|   +-- p02-.../ ...
+-- tools/
|   +-- deck.js             render | verify (gate) | build (gated assemble)
|   +-- deck-ctx.js         builds { ui, ed, bp, theme, pptx }
|   +-- context-pack.js     compact project/page/agent state for low-token continuation
|   +-- phase-handoff.js    hash-bound Gate continuation packet for a fresh task
|   +-- token-ledger.js     rollout-backed Gate/role Token accounting and Chinese report
|   +-- task-portfolio.js   adaptive 3-6 root-task job portfolio
|   +-- resume-job.js       one-command attach + handoff + strict pack + active job
|   +-- page-digests.js     split render/selection/QA/source dependency digests
|   +-- verify-page-preflight.js  final route/capacity/slot/prompt/signature gate
|   +-- qa-batch.js         preserve current QA and apply one reviewer evidence matrix
|   +-- qa-evidence-index.js compact per-rule digest index for delta reviewer reads
|   +-- artifact-map.js     labels generated files by audience and next-step use
|   +-- component-registry.json  machine-readable visual/tool capability index
|   +-- component-index.min.json compact low-token component index generated from registry
|   +-- build-component-index.js rebuilds the compact index after registry changes
|   +-- select-visual-route.js   page intent -> ranked candidates -> selected route
|   +-- build-qa-profile.js      page intent + visual route -> Chinese dynamic QA checks
|   +-- verify-agent-collaboration.js role evidence gate for multi-agent workflow
|   +-- verify-checkpoints.js phase transition approval gate
+-- output/                 <deck>.pptx + preview/
+-- qa.md                   deck-level QA summary (per-page table + reviewer verdict)
```

Pipeline:对已有工作,新根任务直接跑 `node tools/resume-job.js`,只打开严格 context pack 推荐的文件。对一个页面切片,用 `node tools/run-phase.js page-cycle --pages <ids>`:路线选择 -> 动态 QA -> preflight -> 确定性 lint -> 增量 render -> contact sheet -> 受影响页 QA 初始化 -> 紧凑 QA 索引 -> 拆分摘要抓取。审阅员证据在一次 `qa-review-batch.v1` 里应用,后续只读 `qa-evidence-index.json` 的 delta 和被点名页面。然后跑页面 verify、终版 collaboration/render-quality verify、受 gate 约束的 build,以及产物映射。渲染新鲜度用目的专属的摘要,而不是整文件 mtime:QA/来源元数据永不使 PNG 失效,选定渲染的变化使该页失效,共享 theme/组件的变化使整份 deck 失效。

Phase 4 之前,跑 `node tools/verify-checkpoints.js phase4`。文件 `checkpoint-status.json` 必须为 plan、布局蓝图、theme、标杆样张和生产模式记录明确的审批或明确的 bypass。如果 `deck.config.js.workflow.stage = "production"`,终版 verify/build 会自动跑这道检查点 gate。

> 旧版说明:早期框架用 `chapters/<id>/chapter.json` + 一个单体生成器。新框架不再发布那些文件;"chapter/batch" 只表示一组逻辑上归为一类的页面文件夹。

## 框架的职责

- 读主题 token。
- 提供稳定的 PPTX helper。
- 提供可复用的组件函数。
- 提供逐页文件夹(`pages/<id>/page.js`),这样单独一页可以在不重建 deck 逻辑的情况下修复。
- 为每一页提供一个 `page.json` 约束,作为它的本地事实来源。
- 让来源抽取与最终输出分开。
- 让外部渲染来源与导出的 PNG/SVG 放在一起。
- 为 QA 导出幻灯片预览。
- 给生成的产物打标签,让用户评审文件和下一步输入不混在一起。
- 让反馈之后的重生成变得容易。

## Deck 输出必须用框架

对任何多页 PPTX、预览 deck、标杆样张或完整 deck,都先创建一个 deck 项目框架。不要在工作文件夹里用一个松散的一次性脚本生成 PPTX。

允许的例外:

- 一个用户明确当作用完即弃的、极小的单页实验。
- 检查或修复一份还没有生成器的已有 PPTX。这种情况下,创建一份修复备注,把被编辑的幻灯片编号映射到源文件和受影响元素。

创建新框架时,复制或镜像:

```text
-- theme/
-- components/
-- pages/            (one folder per page: page.js · page.json · qa.md · out/)
-- tools/            (deck.js · deck-ctx.js · context-pack.js · artifact-map.js · component-registry.json · select-visual-route.js)
-- deck.config.js
-- checkpoint-status.json
-- agent-collaboration.json
-- agent-collaboration.md
-- output/
|   +-- preview/
-- qa.md
```

第一个 phase 输出之后,用 `node tools/artifact-map.js --write` 生成 `artifact-manifest.md/json`;不要在干净模板里发布一份过期 manifest。

框架必须是生成的工作事实来源。任何临时渲染器、截图脚本、图表渲染或素材抽取,都应住在框架内部的 `source/`、`components/external-renders/` 或某一页自己的文件夹里。

## 反绕过规则

- 不要在页面文件里重新定义一整套 theme。把全局颜色、字体、栅格、logo 规则和安全区放进 `theme/`。
- 不要创建一个只为当前场景命名、却本可以是可复用模式的组件。把可复用模式放进 `components/`。
- 在跑 `tools/select-visual-route.js` 并检查 `component-registry.json` 的排名候选之前,不要用页面专属盒子绕开组件库。
- 不要把所有页面放进一个长生成器。每一页的构建代码住在它自己的 `pages/<id>/page.js`。
- 如果 PPTX 本身还没被渲染,不要用临时图片交付预览,除非用户明确接受一个低置信度预览。
- 不要把一份 deck 称为"基于模板",除非生成器确实 import 了模板/主题/组件文件。
- 不要声称用了某个角色 agent,除非 `agent-collaboration.json` 记录了该角色的状态、产物、结论,以及任何备用/bypass 理由。

## 最小主题 Token

```js
export const theme = {
  fonts: { cn: "Microsoft YaHei", en: "Century Gothic" },
  colors: { bg: "...", surface: "...", text: "...", mute: "...", line: "...", primary: "...", accent: "..." },
  grid: { w: 1920, h: 1080, safe: { l: 96, t: 80, r: 1824, b: 980 } }
}
```

## 内置组件 Helper

当前内置框架实现了:

- `cover()`
- `header()` / `footer()`
- `metricCards()`
- `bigWordCardMatrix()`
- `fourColumnMechanism()`
- `sectionDividerBigNumber()`
- `systemArchitectureCenter()`
- `hubSpokeCapability()`
- `roadmapSwimlane()`
- `caveatBand()`

接下来要添加的组件应来自 `COMPONENT-CATALOG.md`,尤其是流程、金字塔、定位矩阵、dashboard mockup 和图片主导的产品页。

## 逐页约束

每个页面文件夹都是生产控制边界和最小修复单位。

```text
pages/<id>-<name>/
+-- page.js      module.exports = { id, title, visualBinding, build(slide, ctx) }
+-- page.json    { id, title, component, dataBoundary, assetNeed, visualSelection, qaProfile }
+-- qa.md        per-page verdict (Verdict: PASS, newer than page.js)
+-- out/<id>.png isolated render of THIS page
```

`page.json` 是那一页的本地事实来源;`page.js` 实现它。QA 和修复报告应引用 `pageId`。

每个 `page.json` 都必须包含 `component`(来源)、`assetNeed`、`dataBoundary`、一个由 `tools/select-visual-route.js` 生成的当前 `visualSelection`,以及一个由 `tools/build-qa-profile.js` 生成的中文 `qaProfile`。每个内容页的 `page.js` 都必须导出 `visualBinding: { route, name }`,并与 `visualSelection.selectedRoute` 一致。如果一页用了自定义视觉形态,把它的 `component` 标为 `page-specific custom`,并在 `visualSelection` + `qaProfile` + `qa.md` 里解释为什么现有组件、外部图形或图片槽位都不够用。

> 旧版:chapter/batch 表示一组逻辑上归类的页面文件夹。不要重新引入一个平行的 chapter 文件夹树或单体生成器。

## 示例是用来做什么的

示例页不是装饰样品。它们是"组件能工作"的可执行证明。

每个示例页都应展示:

- 组件期望什么输入。
- 在真实文本长度下它如何表现。
- 它是否仍然可读。
- 图片/图标/图表放在哪里。
- 要盯什么 QA 风险。

好的示例会成为未来 deck 的回归测试。

## 外部渲染槽位

当外部视觉工具增加信息时,允许使用:

- ECharts 用于图表和 dashboard。
- Three.js / Spline 用于 3D 产品或空间场景。
- Rive 用于运动状态参考。
- Matter.js 用于仿真参考。
- Mapbox 用于地理或路线视图。

最终 PPT 输出应插入高分辨率 PNG/SVG 定格,并把外部来源保留在 `components/external-renders/`。

## 自检

- [ ] 框架能从源文件重新生成 PPTX。
- [ ] 主题 token 与幻灯片内容分开。
- [ ] 组件可复用、按用途命名,而不是按场景。
- [ ] 每一页都是它自己的文件夹 `pages/<id>/`,含 `page.js`、`page.json`、`qa.md`、`out/`。
- [ ] `tools/deck.js`(render/verify/build)、`tools/select-visual-route.js`、`tools/component-registry.json` 和 `deck.config.js` 都在。
- [ ] `tools/context-pack.js` 在;在已有框架工作里打开长 reference 之前先用它。
- [ ] `tools/artifact-map.js` 在;每个 phase 输出或反馈轮次之后用 `--write` 跑它。
- [ ] `artifact-manifest.md/json` 区分 `user-confirm`、`next-input`、`internal-evidence`、`final-output` 和 `archive-reference`。
- [ ] `checkpoint-status.json` 和 `tools/verify-checkpoints.js` 都在;在标杆样张和生产模式被明确审批之前,Phase 4 被阻塞。
- [ ] `tools/component-index.min.json` 存在,或能用 `tools/build-component-index.js` 重新生成,以供紧凑的组件读取。
- [ ] `tools/build-qa-profile.js` 在,且每一页都有 `page.json.qaProfile.version = "qa-profile.zh.v2"`。
- [ ] 每个渲染过的页面都有哈希匹配的 `qa-result.json`;`qa.md` 是一份生成的中文摘要,而不是事实来源。
- [ ] `tools/verify-agent-collaboration.js` 在;如果 `deck.config.js.agentCollaboration.enabled` 为 true,`agent-collaboration.json` 没有待决的必需角色、没有未审批的必需 bypass,且 `agent-collaboration.md` 在终版 build 之前包含审阅员证据。
- [ ] 每个 `page.json` 都写明组件来源、素材需求和数据边界。
- [ ] 每个内容页的 `page.json` 都有当前的 `visualSelection.engineVersion`、排名候选和 `selectedRoute`。
- [ ] 每个内容页的 `page.js` 都导出匹配的 `visualBinding`。
- [ ] 生成器 import 框架的 theme/components,而不是重新定义一套新的本地 theme。
- [ ] 外部渲染来源被保留。
- [ ] 预览导出和 contact sheet 是工作流的一部分。
