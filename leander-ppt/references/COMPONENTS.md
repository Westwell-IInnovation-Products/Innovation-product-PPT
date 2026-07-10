# PPT Component Library

Reusable components prevent every deck from being redesigned from zero.

## When To Read

Read this file when creating anchor samples, extending a template, or extracting reusable patterns from existing PPT materials.

After reading this file, use `COMPONENT-CATALOG.md` as the current menu of reusable page components extracted from internal decks. The catalog is intentionally generic: source PPTs are references, not one-off case rules.

For routine route selection or repair, prefer the scaffold's compact `tools/component-index.min.json` first. Read the full catalog only after candidates are shortlisted. For component evolution, also read `COMPONENT-LIBRARY-DESIGN.md`.

## Maintenance Tools

这些工具只用于组件库维护，不是每次制作 PPT 都要执行：

```bash
node tools/enrich-component-registry.js
node tools/build-component-index.js
node tools/lint-component-library.js --strict
```

输出文件：

- `tools/component-registry.json`：组件管理员维护的完整注册表，给组件库治理使用。
- `tools/component-index.min.json`：日常选组件优先读取的轻量索引，给后续生产流程使用。
- `output/component-library-lint.json`：组件库维护证据，给维护者看，不需要用户每轮确认。

组件维护必须遵循“可运行基线 -> 小步修改 -> 立即检查”。不要用全局替换盲目改组件源文件；先确认 `node tools/lint-component-library.js --strict` 通过，再进入真实 PPT 生产。

## Component Types

Leander PPT should accumulate components in three layers.

Use the library model in `COMPONENT-LIBRARY-DESIGN.md`: page patterns, layout blocks, and visual parts. Do not treat every useful drawing as a new full-page component.

### 1. Editable PPT Components

Preferred for final deck output.

- Cover hero.
- Section divider.
- Big-word + card matrix.
- Four-column mechanism.
- Three metric cards.
- Timeline / roadmap.
- Flow / process.
- Layered architecture.
- Hub-and-spoke system map.
- Evidence board with caveat band.
- Dashboard mockup.
- Before/after comparison.
- Risk / priority stack.
- Image-led product page.

These should be built from PowerPoint text, shapes, lines, icons, tables, and images wherever possible.

### 2. Static Render Components

Use when the visual is too complex for editable PPT shapes or when fidelity matters more than editability.

- ECharts charts.
- Mapbox maps.
- Three.js / Spline 3D scenes.
- Rive animation still frames.
- Canvas / SVG diagrams.
- Complex simulation renderings.

Render them to high-resolution PNG/SVG, insert into PPT, and keep source files in the working folder. Label the component as non-editable or partially editable.

### 3. Reference Mock Components

Use only during design exploration.

- HTML/CSS mockups.
- Spline scene previews.
- Rive animation previews.
- Three.js prototypes.

Do not treat reference mocks as final PPT unless exported and QA checked.

## External Library Policy

| Library | Best use in PPT workflow | Final output |
|---|---|---|
| ECharts | Charts, dashboards, trend comparisons, sankey, radar | PNG/SVG; sometimes editable via reconstructed PPT shapes |
| Three.js | 3D product, spatial scene, port/yard simulation, camera perspective | PNG sequence/still; source retained |
| Spline | Polished 3D object/scene mockup | PNG still; source retained |
| Rive | Animated icon/state machine concept | still frame or exported video/gif only if PPT context supports it |
| Matter.js | Physics-style explanatory mockups | mostly reference; still frame if useful |
| Mapbox | Geographic route, network, port map | PNG; attribution and map style retained |

Rule: external components are welcome when they add information. They are not a substitute for PPT structure, hierarchy, or claim boundaries.

## Component Source Decision

Choose the component source based on the page relationship, not on what is easiest to draw. Record the decision in `page.json.visualSelection` before implementing the page; see `VISUAL-SELECTION.md`.

| Page need | Prefer | Final PPT form |
|---|---|---|
| Logic, mechanism, comparison, process, roadmap | Existing PPT component | Editable PPT shapes/text |
| Data pattern, dashboard, trend, sankey, radar | ECharts or data render | PNG/SVG plus source retained |
| Spatial scene, device, port/yard system, 3D product relation | Three.js / Spline / image2 | High-resolution image plus source/prompt retained |
| Geographic route, network, region, port map | Mapbox | PNG with attribution/source retained |
| State transition or motion concept | Rive or frame sequence | Still frame unless animation is explicitly needed |
| Missing cover/scene/product visual | image2/generated image | Image with prompt and usage note |

Use mixed sources when useful: for example, an editable PPT architecture frame plus an image2 scene thumbnail, or an ECharts chart inside a PPT evidence board.

Before finalizing a mixed-source page, run `VISUAL-COMPOSITION.md`. The page must look designed, not assembled. QA must be able to see why the selected route is better than component-library, external-graphic, image2/imageSlot, or page-specific-custom alternatives.

## Icon Library Policy

Build an icon language from existing internal decks and reusable vector patterns:

- Keep one stroke style per deck.
- Prefer simple line or filled vector icons.
- Every icon must map to a concrete concept: role, action, metric, module, risk, status, asset, location.
- Do not mix emoji, stock icons, and hand-drawn icons in one deck.
- Store reusable icons as SVG or as pptxgenjs shape helper functions.

## Extracting Components From Existing PPTX

For each source deck, inspect exported thumbnails and collect:

- Repeated page layouts.
- Header / section styles.
- Card styles.
- Number badges.
- Diagrams.
- Icon treatment.
- Chart styles.
- Image placement.
- Color and font usage.

Then classify each pattern:

| Status | Meaning |
|---|---|
| `adopt` | Good enough to become a reusable component |
| `adapt` | Useful idea, needs cleanup or generalization |
| `avoid` | Too case-specific, visually weak, or unstable |

## Component Spec Format

```markdown
## <component-name>

- Purpose:
- Best for:
- Structure:
- Required inputs:
- Optional inputs:
- Theme tokens used:
- Editable: yes / partial / no
- Source inspiration:
- QA risks:
```

## Self Check

- [ ] Component solves a recurring slide problem.
- [ ] Component is not tied to one case or one page title.
- [ ] Inputs are clear enough for another agent to reuse.
- [ ] Editable/non-editable status is explicit.
- [ ] External assets or source files are retained when needed.
- [ ] QA risks are known before production.

## Renderer Availability Gate

组件注册表不是“可用证明”。一个组件只有同时满足下面条件，才能进入日常页面选型：

- `route=component-library`
- 组件库 JS 文件中存在同名导出的真实渲染函数
- `designStatus` 不是 `planned`、`needs-renderer`、`needs-redesign`、`deprecated`、`archived`
- `node tools/lint-component-library.js --strict` 通过

维护时必须区分三种状态：

| 状态 | 含义 | 能否进入自动选型 |
|---|---|---|
| `usable` + `renderable` | 有真实 JS 渲染器，且设计质量允许复用 | 可以 |
| `needs-renderer` + `no-renderer` | 只有 registry 信息，还没有迁移成正式组件函数 | 不可以 |
| `needs-redesign` + `renderable` | 可以画出来，但语义、布局或美感不达标 | 不可以 |

`tools/component-index.min.json` 中的 `selectable` 是生产流程使用的最终判断。视觉选择器必须只从 `selectable=true` 的组件中挑选候选，不能直接相信 registry 条目数量。

真实组件图册通过下面命令生成：

```bash
node tools/render-component-library-preview.js
```

图册输出中的 `NO RENDERER` 和 `BLOCKED` 都是组件库治理信号，不是最终 PPT 页面。遇到这类条目，先修组件机制或组件设计，再让它回到候选池。
