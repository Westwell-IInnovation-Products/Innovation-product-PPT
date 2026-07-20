# Component Library Design

This file defines how the Leander PPT component library should evolve. It addresses a key issue: the current library is useful, but most components are page-level generators. Stable production needs a layered, tagged, composable library.

## Current State

Components are executable JavaScript functions, not `.pptx` snippets. A page calls a component from `page.js`, passing data and theme context. The output PPTX is generated later.

Current strengths:
- Editable PPT shapes and text.
- Version-diff friendly JS/JSON.
- Per-page isolation and QA.
- Registry-driven route selection.

Current gaps:
- The registry mostly describes full-page components.
- Component scoring is lightweight keyword matching.
- There is no formal way to combine one component's layout with another component's visual part.
- Component metadata does not yet describe slots, variants, composition safety, or avoid conditions.

## Three-Layer Component Model

### 1. Page Patterns

Whole-slide structures. Use when the page relationship is clear and the component fits most of the page.

Examples:
- problem -> mechanism map
- state isolation page
- tool-system tree
- repair-scope ladder
- sharing-boundary board
- architecture center

Purpose: decide the page's main visual organization.

### 2. Layout Blocks

Reusable structural regions that can be combined inside a page pattern.

Examples:
- left-right contrast
- folder row + selected expansion
- vertical step rail
- tree branch group
- three-zone boundary
- evidence board
- callout panel

Purpose: allow mixed pages without creating one-off full-page components.

### 3. Visual Parts

Small reusable visual assets and drawing helpers.

Examples:
- file chips
- folder icons
- stage number dots
- semantic asset icons
- arrow/connectors
- imageSlot
- badge/chip styles
- callout leader lines

Purpose: make custom or mixed pages look consistent without rebuilding every detail.

## Component Metadata Standard

Every reusable component should eventually declare:

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

## Semantic-Neutral Abstraction Standard

Reusable components must be abstracted by their **relationship primitive** and **expression capability**, not by the one semantic meaning they happened to carry in the current deck.

Bad abstraction:

- `teamCollaborationFlow`
- `contextTransitionChart`
- `harnessSkillSharingPage`

Better abstraction:

- `multiActorContributionToSharedPool`
- `selectAndExpandUnit`
- `boundaryFilterMatrix`
- `phaseRoutedContext`
- `feedbackLoopWithPromotion`

The same component may bind to multiple meanings:

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

### Component Scoring

When selecting a component, score in this order:

1. Relationship fit: does the primitive match the page intent?
2. Structure fit: do the required slots exist without forcing the page?
3. Composition fit: can a page pattern combine with layout blocks and visual parts cleanly?
4. Evidence fit: can the component show the real artifact or source boundary?
5. Theme fit: does the component work with the active theme tokens?
6. Keyword fit: current deck wording is only a weak signal.

Keyword-only matching is not enough. If a component is chosen because a page says "team", "tool", or "context" but the relationship structure differs, reject it.

Do not present internal numeric scores as the user-facing selection logic in a deck. Scores are an internal shortlist aid. In the PPT, explain the mechanism as:

```text
blueprint contract -> expression mode -> relationship primitive -> required slots -> theme/evidence fit -> risk rejection -> page binding
```

If the blueprint has already fixed the page skeleton and expression mode, component selection should narrow the search, not redesign the page from scratch.

### Variant And Derivative Rule

If a new drawing is a derivative of an existing component:

- Same relationship + same structure + different content: extend slots or examples.
- Same relationship + small visual change: add a variant.
- Same page pattern + one reusable region: extract a layout block.
- Same icon/connector/chip repeated in several pages: extract a visual part.
- Different relationship primitive: add a new page pattern.

The library should grow by reusable logic, not by accumulating one-off deck semantics.

## Reuse Decision

Before adding a new component:

1. Is it only a color/line/fill style difference?
   - Add a `variant` to the existing component.
2. Is the structure the same but the data slots differ?
   - Extend the component input schema.
3. Is only one local part useful?
   - Extract a layout block or visual part.
4. Does the page relationship differ from all existing components?
   - Add a new page pattern.
5. Is it project-specific or sensitive?
   - Keep it in the project, not the shared library.

## Fusion Rule

A page may combine components, but the combination should be explicit:

```text
page pattern + layout block + visual parts
```

Examples:
- `problemMap` page pattern + `imageSlot` visual part.
- `toolSystemTree` page pattern + custom external component source list.
- `stateFlow` relationship + folder-expansion layout block + file-chip visual parts.

Avoid combining two full page patterns unless one is reduced to a layout block. Two page patterns on one slide usually create clutter.

### Expression Mode First

Before selecting a component, decide the page's expression mode:

- mechanism-diagram
- screenshot-evidence
- big-typography
- case-evidence
- human-ai-swimlane
- artifact-map
- simple-image2-illustration
- component-composite

The component library is only one route. It should not override a stronger evidence screenshot, a clearer big-number page, or a simple generated illustration.

## Promotion Rule

A new drawing should enter the shared component library only when:

- it solves a recurring page problem
- its inputs can be described generically
- it has a clear level: page-pattern, layout-block, or visual-part
- it is not tied to one confidential project
- it has at least one realistic example and a QA risk list

If it is a one-off but useful, keep it in the deck project's page implementation or project-local `components/`.

### Agent-assisted candidate intake

项目完成后的候选提取由现有 `component-curator-zh` 承担。确定性工具发现信号、物化四文件候选包和计算重复风险；Agent 负责语义脱敏、关系抽象、通用槽位和近似组件解释。候选入库可以自动，正式晋升必须保留一次人工批准。

自动物化要求：

- 渲染器已经从页面实现抽到 `components/promotion-candidates/`，并导出 `{ name, create }`。
- 提案包含完整 V3 元数据、复用证据和独立复核摘要。
- 固定状态仍为 `review-required / pending`，自动流程不能声称双主题视觉已经人工通过。
- 完全同 ID、同候选名或与不同来源正式组件同名时必须阻断；关系/槽位高度相似时转入 Curator 复核。

## Stability And Ease-Of-Use

- Prefer fewer stable components with good slots over many near-duplicates.
- Give every component a simple default path and optional advanced slots.
- Keep component names semantic, not visual-only.
- Make the registry compact enough for routine reads.
- When a component repeatedly needs manual overrides, fix its metadata or split it into smaller blocks.

## Component Maintenance Mode

组件库维护是临时治理动作，不是日常 PPT 生产流程。只有在用户明确要求“打磨组件库 / 优化组件 / 沉淀新组件 / 调整组件选择机制”时执行。

维护顺序：

1. 先建立可运行基线：对 `components/*.js` 执行语法检查，不能在不可运行文件上做视觉优化。
2. 再更新注册表：运行 `node tools/enrich-component-registry.js`，补齐 relationship-first 元数据，并重算组件数量。
3. 再更新索引：运行 `node tools/build-component-index.js`，让日常选组件读取 compact index。
4. 再跑组件库 lint：运行 `node tools/lint-component-library.js --strict`，检查语法、元数据、硬编码颜色。
5. 最后才考虑代码层组件美化；每次只改少量组件，并立即跑语法和 lint。

不要用全局字符串替换盲目“换肤”。组件文件可能包含特殊编码或历史注释，必须使用可运行基线、小步修改、逐步验证。

## Visual Designer Review Rules

视觉设计师参与组件库维护时，不按当前 PPT 页面的语义评价组件，而按组件的表达能力评价：

- 这个组件表达的是对比、流程、层级、状态、工具箱、证据、场景，还是治理闭环？
- 它的主视觉关系是否清楚，而不是只靠文字解释？
- 红色 / azure / 高亮色是否有逻辑意义：当前、风险、焦点、推荐、冲突、异常、关键节点。
- 组件是否允许换主题：主题、线条、阴影、前景文字必须优先使用 theme token。
- 是否存在常见视觉风险：线条歪斜、连接误导、文字压框、图标语义不清、色彩过多、卡片堆叠。
- 如果需要 image2 或外部图形，只把它作为信息承载的插图，不把装饰图硬塞进页面。

## Theme Adaptation Rule

组件库应通过 `theme.colors`、`theme.type`、`theme.signature` 自动换肤。新增组件必须避免直接写死项目色值。

允许的例外：

- `FFFFFF` 用作深色底上的文字或白色描边。
- `000000` 仅用于导入资产或特殊黑色标记，并需要人工复核。
- 其他固定色值应先进入 `theme/tokens.js` 和对应命名主题，再被组件引用。

如果一个组件在 `leander-base` 下好看，但切到 `leander-global` 后出现低对比、白字压浅色、红色语义混乱，优先修 token 或组件前景色规则，而不是复制一份新组件。
## Registry / Renderer / Selector Contract

组件库必须保持三层一致：

1. **Registry 层**：`tools/component-registry.json` 记录组件语义、关系、标签、槽位、风险和治理状态。
2. **Renderer 层**：`components/*.js`、`components/editorial.js`、`components/bespoke.js`、`components/tool-system-tree.js` 提供真实可调用的同名 JS 函数。
3. **Selector 层**：`tools/component-index.min.json` 和 `tools/select-visual-route.js` 只允许选择 `selectable=true` 的组件。

禁止把某次 PPT 中的页面级函数直接登记成 `usable` 组件。页面级函数如果值得沉淀，必须先完成组件迁移：

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

双主题验证必须真实渲染：

```bash
node tools/render-component-library-preview.js --theme leander-base --out-dir <base-output>
node tools/render-component-library-preview.js --theme leander-global --out-dir <global-output>
node tools/verify-component-themes.js <base-manifest> <global-manifest> --write
```

这个验证只能证明组件能够在主题下技术渲染。视觉设计师仍需检查对比度、前景色、颜色语义和结构质量。
