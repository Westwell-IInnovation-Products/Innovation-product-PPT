# PPT 大纲规格

`outline.md` 是那个便宜的控制点。它规划结构、信息密度、页面意图和视觉方向,但绝不锁死最终绘制细节。

## 何时读

在 Phase 1、`brief.md` 之后、样张生产之前读本文件。另外,在决定章节结构之前读 `NARRATIVE-FRAMEWORK.md`,在分配布局原型之前读 `SLIDE-CRAFT.md`。

## 核心规则

对 10 页及以上的 deck,在 Gate 1 审批之前创建一个紧凑的 `source-evidence-index.json`:

```json
{
  "version": "source-evidence-index.v1",
  "targetPages": 20,
  "evidenceCapacityPages": 12,
  "expansionPolicy": "research-added",
  "sources": [{"path":"source/input.docx","boundary":"user-provided"}],
  "assets": [{"path":"source/install.jpg","use":"real evidence"}],
  "gaps": ["benchmark evidence", "two scenario screenshots"]
}
```

`expansionPolicy` 必须是 `supported`、`research-added`、`merge-pages` 或 `user-approved-low-evidence`。不要把一个自然只支撑 10 页的来源,通过把同一个主张拆成更多幻灯片,变成 20 页。

大纲规划的是**逻辑 + 页面内容 + 视觉意图**。它不写最终幻灯片代码,也不假装文字卡片就是图示。

## 输出格式

> 下面这个模板会被 `verify-design-gates.js` 按字段解析,请保持英文标记(如 `Target pages:`)原样。

```markdown
# PPT Outline

> Brief: <brief filename>
> Deck type: <type>
> Audience: <audience>
> Output goal: <goal>
> Target pages: <N>
> Theme/template: <candidate or TBD>

## 1. Storyline

<One paragraph explaining where the deck starts, how it develops, and what conclusion/action it reaches.>

## 2. Chapter Structure

| Chapter ID | Chapter | Pages | Production role | Visible in PPT? | Transition |
|---|---|---:|---|---|---|
| ch01-background | <name> | <range> | <why this production chapter exists> | yes / no / optional | <how it hands off to next chapter> |

## 2.1 Narrative Mapping

For internal sharing decks, start from the broad frame in `NARRATIVE-FRAMEWORK.md`:

`大问题 -> 当前环境 -> 目标问题 -> 我们的方案 -> 方案展开 -> 实施与效果`

| Narrative stage | Pages | Job | Key question | Handoff |
|---|---|---|---|---|
| 大问题 | <range> | <why the audience should care> | <what big problem appears?> | <how it leads to environment> |

## 3. Page Plan

| Page ID | Page | Chapter ID | Title | Takeaway | Content / evidence pool | Visual intent | Component source | Data boundary | Asset need |
|---|---:|---|---|---|---|---|---|---|---|
| p01 | 1 | ch01-background | ... | ... | ... | ... | ppt-component / external-render / image2 / mixed | achieved / planned / estimate / public ref | available / missing / placeholder |

## 4. Layout Anchors

Pick 2-3 representative pages for sample production:
- Cover:
- Core content page:
- Most complex diagram page:

## 5. Risks And Tradeoffs

- Content omitted:
- Claims needing caveats:
- Audience-sensitive points:
- Layout risks:

## 6. Asset List

- ✓ <asset> — <path or source>
- ⚠️ <asset> — missing / needs user input / placeholder allowed
```

## 页面规划规则

- 每一页都必须有一个清晰的结论。
- 每张内容页都必须满足 `QUALITY-BASELINE.md`:核心主张、支撑内容、证据/落地边界、受众价值,以及一个自然的交接。一张填满了但实质单薄的表格不是一份通过的大纲。
- 内容充分性因页型而异:案例需要主角/动作/结果/相关性/来源;机制需要问题/输入/过程/输出/证据/边界;框架需要层级/关系/职责;收益需要基线/变化/结果/边界。
- 每一页都应有一个稳定的 `Page ID`,如 `p01`、`p02`、`p14`。在生成代码、QA 备注和修复报告里都用这个 ID。
- 每个生产章节都应有一个稳定的 `Chapter ID`,如 `ch01-background`。
- 生产章节是隔离、QA 和修复的控制单位。它们不必作为可见的 PPT 章节页出现。
- 每份内部分享大纲都应在详细页面标题之前,把页面映射到一个宽泛的叙事阶段。不要把通用叙事过拟合到某个项目的确切章节名。
- 每张内容页都必须声明一个 `Visual intent`:流程、对比、时间线、矩阵、分层架构、证据板、dashboard mockup、流程图、图标机制、图片主导页,或大字 + 卡片矩阵。
- 每张内容页都必须声明 `Component source`:可复用 PPT 组件、外部渲染、image2/生成图片、真实素材,或混合。
- 对 `image2` / `real-image` 页面(矢量渲染起来很粗糙的场景/写实描绘——见 [`IMAGE-ASSETS.md`](IMAGE-ASSETS.md)):把页面规划成**预留一个图片槽位**(`imageSlot`,透明 PNG 融在主题底上,图片到位前用矢量备用),并把该素材加进 prompt 规格清单,以便产出一份 `<deck>-images.gpt-image-2.md`。关系/结构默认用矢量;场景/证据/装饰条才预留图片。
- `Content / evidence pool` 必须包含支撑该页的事实、数字、案例或主张。
- `Data boundary` 必须标注已达成、计划中、估算、公开引用,或未知。
- `Asset need` 必须点名所需的图片、图标、截图、产品视觉,或占位。
- 机制型 deck 应区分 `frameworkLayer` 和 `mechanismLayer`。前者是通用的 Harness 能力;后者是它下面的具体项目机制。
- 解释文件、文件夹、agent、QA 记录、工具或 state 的页面,必须在大纲阶段规划 `screenshotSlots`,包括来源、裁剪规则和解释目的。
- 解释实现的页面必须标注 `implementationStatus`:implemented、partial、proposed 或 public-reference。
- 选组件之前声明 `expressionMode`:mechanism-diagram、screenshot-evidence、big-typography、case-evidence、human-ai-swimlane、artifact-map、simple-image2-illustration,或 component-composite。
- 如果 deck 反复出现框架术语,创建 `terminology.json`,并让页面标题与规范名称对齐。

## 手工 Deck 标准化模式

当用户说某份已有 PPT 是事实来源时,先把它标准化,而不是重新设计它。

必需的小节:

1. 忠于源 deck 的完整故事线。
2. 基于源页面顺序的章节结构。
3. 逐页表格,含页面标题、结论、展示形态、来源/边界和备注。
4. 结构观察:deck 类型、优点、缺口,以及可能的后续变体。
5. 从源里学到的、以通用措辞表述的可复用规则。

除非用户明确要求重构,否则不要重排页面顺序。

## 自检

在 Checkpoint Plan 之前运行此检查。

- [ ] 页数匹配目标,或对不匹配作出了解释。
- [ ] 每个章节都有 Chapter ID、页面范围、生产角色,以及可见/不可见状态。
- [ ] 内部分享 deck 有一个宽泛的叙事映射,通常覆盖大问题、环境、目标问题、方案、方案展开,以及实施/效果。
- [ ] 每一页都有 Page ID、Chapter ID、标题、结论、证据池、视觉意图、组件来源、数据边界和素材需求。
- [ ] 每张内容页都有足够的证据或机制细节,支撑 30-90 秒有用的讲解,而不依赖填充文字。
- [ ] 视觉意图是可执行、不含糊的,例如"带图标的四列机制",而不是"漂亮布局"。
- [ ] 证据薄弱或素材缺失的页面被标出。
- [ ] 截图/证据页声明了截图槽位、来源、裁剪规则和解释目的。
- [ ] 机制页区分框架层、机制层和实现状态。
- [ ] 反复出现的框架名称与 `terminology.json` 匹配。
- [ ] 至少选出 2 张有代表性的标杆页用于样张生产。
- [ ] 没有把最终幻灯片绘制细节过度指定到会妨碍后续更好设计的程度。

## 下一个检查点

用户确认大纲之后,对超过 8 页的 deck、或含复杂机制/流程/架构页的 deck,产出一份低保真布局蓝图。见 `LAYOUT-BLUEPRINT.md`。
