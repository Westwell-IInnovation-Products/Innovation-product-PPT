# Leander PPT Component Catalog

This catalog is the first reusable component batch extracted from two internal decks:

- An industrial automation product introduction deck.
- A Cactus product introduction deck.

Use this catalog as a component selection menu before creating anchor samples. Source decks are references, not case-specific rules.

## Component List

| Component | Status | Best for |
|---|---|---|
| `minimal-cover-right-title` | adopt | Formal cover with large negative space |
| `three-stage-evolution` | adopt | Product history, maturity path, phased narrative |
| `why-now-dual-evidence-hub` | adapt | Why-now argument with internal/external forces |
| `four-column-mechanism` | adopt | Four values, four roles, four capabilities |
| `capability-map-table` | adapt | Product capability overview and module map |
| `dual-evidence-panels` | adopt | Data analysis, before/after, two-sided evidence |
| `case-card-strip` | adapt | From one case to reusable asset |
| `solution-closed-loop` | adopt | Solution architecture and operating loop |
| `scenario-bank-grid` | adapt | Scenario library, configuration library, capability inventory |
| `big-word-card-matrix` | adopt | Value proposition, strategic judgement, operating value |
| `roadmap-swimlane` | adopt | Product roadmap, service plan, delivery stages |
| `minimal-closing-center` | adopt | Closing statement |
| `three-metric-cards` | adopt | Quantified value, estimates, benchmark evidence |
| `last-mile-process` | adapt | Process gap and bottleneck explanation |
| `priority-pyramid` | adopt | Priority stack, difficulty hierarchy |
| `positioning-matrix` | adapt | Competitor or capability positioning |
| `system-architecture-center` | adopt | Product architecture, platform, input-output flow |
| `section-divider-big-number` | adopt | Chapter divider |
| `sensor-fusion-flow` | adapt | Multi-source sensing and fusion |
| `control-window-mechanism` | adapt | Control logic, timing window, algorithm decision |
| `hub-spoke-capability` | adopt | Central platform and surrounding capabilities |
| `service-work-package` | adopt | Service package, project scope, responsibility matrix |
| `pricing-model-split` | adapt | Commercial model comparison |

## Implemented In Scaffold

The current scaffold has executable helpers for:

1. `minimal-cover-right-title` as `cover()`
2. `three-metric-cards` as `metricCards()`
3. `big-word-card-matrix` as `bigWordCardMatrix()`
4. `four-column-mechanism` as `fourColumnMechanism()`
5. `system-architecture-center` as `systemArchitectureCenter()`
6. `hub-spoke-capability` as `hubSpokeCapability()`
7. `roadmap-swimlane` as `roadmapSwimlane()`
8. `section-divider` as `sectionDivider()` — signature-aware chapter/transition page. Base = `big-number` (large faint number + red title + rule + keyword chips); Global = `white-underline` (navy bold title + solid underline + blue subtitle + wordmark footer, per the FMS reference). Variant selected by `theme.signature.divider`. (`sectionDividerBigNumber` / `sectionDividerUnderline` still exported directly.)
9. `minimal-closing-center` as `closing()` (back cover: centered navy+red slogan + tagline)
10. `step-nav` as `stepNav()` (agenda / 汇报路线)
11. `pain-cards-consequence` as `painCards()` (problem → consequence)
12. `solution-closed-loop` as `cycleLoop()` (config→run→KPI→export loop)
13. `arch-layered` as `archLayered()` — Type A 系统分层架构（系统视角）：层 banner + 卡片 / 分组子格 / 文本带；monochrome，`focus` 单点红
14. `arch-dual-engine` as `archDualEngine()` — Type B 场景双擎流（业务/场景视角）：双核 ✕「联动」+ 两翼流向（数据产生/方案输出）+ 底部 AI 底座赋能；节点差异化图标
15. `process-timeline` as `processTimeline()` (horizontal N-step rail, `key` nodes accent, optional bottom takeaway band)
16. `state-flow` as `stateFlow()` (lifecycle/state machine; status-semantic colors; per-state ops cards, content-fit + centered)
17. `before-after` as `beforeAfter()` (old vs new paired rows; old=grey, new=navy+red arrow)
18. `roadmap-phases` as `roadmapPhases()` (3 phase columns; now=accent / future=navy / excluded=grey; content-fit + centered)
19. `workbench-mock` as `workbenchMock()` (3-pane config UI: tree + map + property card; selected object focal red)
20. `workflow-config` as `workflowConfig()` (top link flow with key endpoints + bottom ratio-spec cards)
21. `dashboard-mock` as `dashboardMock()` (run monitor: live canvas + progress panel + speed chips; auto-fit chips)
22. `capability-matrix` as `capabilityMatrix()` — styled comparison/capability table: header row + row labels + cells (text / ✓ green / — grey / `{level,of}` dots); `focusCol` + per-row `focus`; rows auto-fit to fill the body. (mined from 钢厂/园区/口岸 方案对比页)
23. `feature-grid` as `featureGrid()` — 2×3 (or `cols`) icon feature cards (icon badge + title + desc), one `focus` accent; auto-fits rows to fill the body. (能力九宫格)
24. `tier-stack` as `tierStack()` — 云-边-端 / platform layers: per tier a left navy label block + right component chips, focal tier accent, down-arrows between tiers. (端边云分层架构)
25. `stat-band` as `statBand()` — single panel of N big stats (value + label + sub) with vertical dividers, one `focus` accent + optional note band. (规模化成效数字带)
26. `bullet-columns` as `bulletColumns()` — categorized bullet columns (colored category header + bullet card per column) + optional bottom conclusion banner; one `focus` accent. (现状调研/痛点枚举)
27. `pillar-trio` as `pillarTrio()` — three product/pillar cards (big icon circle + name + tag + desc + sub-points), one `focus` accent. (三大产品支柱)
28. `quadrant-matrix` as `quadrantMatrix()` — 2×2 positioning: tinted quadrants + axes + corner labels + `axis:{x,y}` end labels + plotted `items:[{x,y(0..1),label,focus}]`.
29. `priority-pyramid` as `priorityPyramid()` — true tapered pyramid (triangle apex + trapezoid bands, edges aligned via the 0.5 top-ratio); rank badge in each band + right-side label cards w/ connectors. `levels:[{name,sub,focus}]` top→bottom. **Not stacked rectangles.**
30. `coverage-map` as `coverageMap()` — schematic coverage: region panel + hub + plotted `sites:[{x,y,label,sub,focus}]` (dotted links) + auto right-side site list.
31. `topology` as `topology()` — cloud-edge-device network: cloud node → edge row → device row with connectors + tier labels.
32. `image-gallery` as `imageGallery()` — N framed cells (real `image` path or placeholder icon frame) + caption bar; one `focus` accent.
33. `ring-stats` as `ringStats()` — row of N **native doughnut progress rings** (arc = the actual percentage over a light track) + clean centered value + label + sub; one `focus` accent. `value` must be a percentage. (百分比型成效)
34. `numbered-list` as `numberedList()` — vertical 01..N big-index rows (index + title + desc), one `focus` accent; fills the body.
35. `timeline-vertical` as `timelineVertical()` — left axis + milestone dots + right cards (`date/title/desc`), one `focus` accent.
36. `quote-highlight` as `quoteHighlight()` — big centered pull-quote (`quote` string or `[{text,hot}]`) + accent rule + `by` attribution; designed whitespace.
37. `funnel` as `funnel()` — true inverted funnel (flipped trapezoid bands, top wide → narrowing down, aligned edges) + right-side name/value labels. `stages:[{name,value,focus}]`. **Not stacked rectangles.**
38. `two-option-compare` as `twoOptionCompare()` — two columns A/B (`options:[{name,recommended,points:[str|{text,no}]}]`), ✓/✗ bullets, center VS badge, recommended = accent.
39. `org-tree` as `orgTree()` — 2-level hierarchy (`root` + `children:[{name,focus,items:[]}]`) with connectors + grandchild chips; vertically centered.
40. `gantt` as `gantt()` — Gantt: `periods` columns × `tasks:[{name,start,span,focus,milestone}]` bars; milestone diamond; focal task accent; rows fill the body.
41. `heatmap` as `heatmap()` — labeled matrix, cells tinted by intensity (`values` 0..1) via low→`high` blend, optional `showValue`, gradient legend strip.
42. `radar` as `radar()` — **native** radar chart; `axes` + `series:[{name,values}]`; outlined `marker` by default (all series visible), `filled:true` to fill. Multi-series = comparison.
43. `value-chain` as `valueChain()` — stage cards (colored header + bullet items) linked by chevron arrows; text lives in the card, never cut by a notch. `stages:[{name,items,focus}]`.
44. `waterfall` as `waterfall()` — value bridge: `start` + `deltas:[{label,value±}]` + `end`; positive=green, negative=red, endpoints navy/accent, dashed step connectors.
45. `swimlane-process` as `swimlaneProcess()` — role lanes × phase columns; per-cell step boxes + intra-lane arrows; one `focus` accent.
46. `venn` as `venn()` — rich 2-set (or 3-set) overlap: translucent circles + per-region bullet `items`, an `intersection`∩ badge, a right-side intersection callout card (`intersection` + `intersectionDesc` + `overlapItems`), and optional `takeaway` band. `sets:[{label,sub,items:[]}]`.
47. `annotated-diagram` as `annotatedDiagram()` — big image/placeholder + numbered markers (`markers:[{x,y,n}]`) + side `legend:[{n,text}]`.
48. `bar-chart` as `barChart()` — **native** clustered bar/column (`labels` + `series`), themed colors, optional `showValue`, `horizontal`.
49. `line-chart` as `lineChart()` — **native** multi-line trend (`labels` + `series`), optional `smooth`.
50. `pie-breakdown` as `pieBreakdown()` — **native** doughnut (`items:[{label,value}]`) + right-side composition list with values.

Native charts (radar/bar/line/pie) are real editable PowerPoint charts via `slide.addChart("bar"|"line"|"radar"|"doughnut", ...)` — the data stays editable in PPT. Pass theme colors as `chartColors`. **Multi-series radar must use `marker` (outline) style, not `filled`** — a solid fill hides the other series.

## Editorial / Line-Frame Components (`components/editorial.js`)

A line-frame counterpart to the white-card library, for "背景色 + 线框分隔" / "文字 + 图形" requests, ugly-table complaints, and any page where white-card density reads AI-generated. Instantiate with `const ed = makeEditorial({ ui, theme, pptx })`. All use the **page background as ground** (minimal fills), **hairline dividers / outlined frames**, the shared **`theme.type` scale** (no tiny text), a single accent focus, and content-fit-then-center whitespace.

| Component | Best for |
|---|---|
| `lineCompare` | 2–4 column compare on background ground, vertical-rule dividers, focus column = faint accent wash + red heading; optional bottom conclusion rule+statement. (why-X, A/B, before/after) |
| `milestoneTimeline` | Schedule / 节奏 as **icon nodes on a horizontal axis** (cards alternate above/below, line-frame), optional bottom legend. Use instead of a grid/swimlane gantt when the ask is "图标式". |
| `zoneGrid` | 2×2 / N line-frame zones (optional icon badge + title + body), **content-fit height + centered block**, focus zone accent, optional bottom banner. (scenarios, value, materials, next-steps) |
| `splitDossier` | Left identity rail (big name + sub + fact rows w/ hairlines) + right line-frame zone grid. (project / product deep-dive) |
| `panelDuo` | Two rich line-frame panels side by side, each a header bar + entries (`{name,desc}`). (left vendors / right self-research; option vs option) |
| `lineTable` | Tabular data as **background + hairline rows** (no filled grid), header underline, focus row = faint accent wash. Use instead of the filled `capabilityMatrix` when a table "太丑/太重". |
| `imageSlot` | Reserve a rectangle for a **complex/scene image** (better generated than vector-drawn). Transparent PNG **blends on the theme ground — no white card**; vector `fallback` until the image arrives. Pair with a `<deck>-images.gpt-image-2.md` prompt-spec. See [`IMAGE-ASSETS.md`](IMAGE-ASSETS.md). |

These are reusable editorial alternatives when the current deck rejects white-card density or needs line-frame styling. Select them by relationship and capacity, not because they appeared in a prior deck.

## Bespoke / Large-Graphic Components (`components/bespoke.js`)

Big, airy, *pure-graphic* metaphors — the antidote to "every page is a box with text inside" (死板). Distilled from the cactus 产品介绍 deck. Instantiate with `const bp = makeBespoke({ ui, theme, pptx })`. Each is a different visual metaphor, so **no two pages repeat a template**. Reach for these when a deck feels rigid/box-heavy, or the user wants 灵动感 / 设计感 / 大图形.

| Component (generic core) | Metaphor / best for |
|---|---|
| `hubRadial` | Center mechanism circle + 4 value cards radiating on thin connectors. (core idea → N consequences/values) |
| `tierLadder` | Ranked tier bands (01/02), each with vendor blocks + spec chips; indented staircase. A *ranked* alternative to a comparison table. (第一/第二梯队, leaderboard) |
| `goalPath` | Horizontal journey axis with 2 big phase markers + a panel under each. (short→long, now→future, before→after) |
| `sceneColumns` | N columns split by thin rules, each: number badge + title + sub-label + paragraph + an **image slot** (`it.img` transparent PNG, blends on the ground; falls back to `it.icon` or a placeholder) + req chips. Mirrors cactus p4. (parallel scenarios with per-column imagery) |
| `pipelineFlow` | N step nodes in a row, grouped under phase bands (one focus), + a bottom 归纳 summary band. (process that also needs grouping/judgement) |
| `actionTracks` | Horizontal lanes, each: icon + track name + action + owner/time/status chips. (next-steps with accountability — concrete, not vague) |

**Page-specific graphics** belong in the active project, not the reusable component core. Build them from the current page relationship, evidence, theme, and required slots; promote only de-identified, reusable patterns after regression testing. For scene or realistic imagery prefer image2 + `imageSlot` (see `IMAGE-ASSETS.md`).

## Before adding a component: check this canonical map (avoid forking)

**The #1 accumulation mistake is forking a near-duplicate instead of extending the existing archetype.** Most "line-frame" components are just a *fill→line* restyle of a component that already exists. Before writing a new one, find its archetype here; if it exists, **extend it with a `variant: "fill" | "line"` flag (+ `theme.colors.surface3` ground), don't add a parallel component.**

| Archetype (canonical in `ppt-components.js`) | Related editorial/bespoke | Status / action |
|---|---|---|
| `capabilityMatrix` (table) | `lineTable` | **DONE — `capabilityMatrix` now takes `variant:"fill"\|"line"`.** Use it for new tables. `lineTable` kept (its navy-header+zebra look was user-approved; distinct enough). |
| `featureGrid` (icon cards) | `zoneGrid` | DISTINCT — `zoneGrid` adds content-fit centering + banner + tag. Keep; reuse, don't re-fork. Future restyle → `variant`. |
| `twoOptionCompare` / `bulletColumns` | `panelDuo` / `lineCompare` | DISTINCT layouts (rich panels w/ icon+foot; N-col line compare). Keep. |
| `hubSpokeCapability` | `hubRadial` | DISTINCT — 4-corner cards vs 6-point hub. Keep. |
| `processTimeline` / `timelineVertical` | `milestoneTimeline` / `pipelineFlow` | DISTINCT — icon nodes + phase bands + 归纳. Keep. |
| `tierStack` / `priorityPyramid` | `tierLadder` | DISTINCT — staircase + per-vendor stat chips. Keep. |
| `beforeAfter` / `roadmapPhases` | `goalPath` | DISTINCT — journey axis + dual panels. Keep. |
| `swimlaneProcess` / `stateFlow` | `actionTracks` | DISTINCT — owner/time/status chips. Keep. |
| `fourColumnMechanism` | `sceneColumns` | **DONE — `fourColumnMechanism` now takes per-item `img`** (transparent PNG in the card middle, icon fallback). `sceneColumns` kept (distinct thin-divider editorial style w/ tag + req chips). |

Genuinely new (no existing archetype — keep): `imageSlot` (image placeholder + emit prompt-spec), `splitDossier` (identity rail + zones).

> **Honest re-assessment (corrected).** An earlier note here claimed "~11/13 are duplicates, collapse them all." On rigorous inspection that was overstated: only the **table** pair was a true fill↔line restyle (now unified via `capabilityMatrix variant`). The rest each add a real, separately **user-approved** layout (content-fit centering, phase bands, corner hub, journey axis, owner chips…). **Merging those would regress approved designs — so they are kept as distinct components, not forced into one.** The real fix for "don't duplicate" is forward-looking: (1) base components now support a `variant` flag (proven on `capabilityMatrix`); (2) the **check-this-map-before-forking** rule (here + in `LESSONS.md`) stops *new* forks; (3) collapse a remaining pair only when it's a true no-regression restyle, incrementally, **render-diffed under the per-page gate** — never a big-bang. Capability merges done so far: table (`capabilityMatrix variant:"line"`) and four-column imagery (`fourColumnMechanism` per-item `img`); both additive, no regression. No further forced merges pending.

**Three libraries, by intent (not by accident anymore):** `ppt-components.js` = the broad archetype set (now `variant`-aware where it matters); `editorial.js` = approved line-frame looks; `bespoke.js` = large metaphors. Mix fill + line + image so pages read differently — and for any *new* restyle, add a `variant` to the base rather than a 4th near-duplicate.

Icon set (`components/icons.js`): `document person hub chart arrow shield clock gear cloud target lock leaf layers gauge` (else → "i" fallback). Use a real icon, never the fallback, in shipped pages.

All of the above follow the `SLIDE-CRAFT.md` Color Semantics rule (peers = structural color, accent = single focus) and the Fill-The-Body rule (centered/filled, no asymmetric bottom whitespace). Logo/background come from the theme standard, never per-page. Every component reads `theme.colors`/`theme.fonts`, so the same code reskins to Base (red accent) or Global (azure accent) automatically.

## One Shared Library, Multiple Themes

The catalog is **one** shared library (`components/ppt-components.js`), not a library per theme.

- **Content components are theme-agnostic** — they read `theme.colors` / `theme.fonts`, so every component above auto-reskins when you switch themes (`leander-base` ↔ `leander-global`). Add a component once; it works in all themes. The Color Semantics rule is theme-relative: "accent = single focus" means Westwell red in Base, azure in Global (where red is status-only).
- **Chrome follows the theme `signature`.** `cover` / `header` / `footer` / `closing` branch on `theme.signature` (`titleColor`, `headerRule`, `footer`, `cover`, `closing`, `coverPhoto`) so each theme reproduces its own reference look:
  - Base: warm right-aligned red cover, solid red rule + footer, centered navy+red closing.
  - Global: photo-dark (or white-minimal) cover, navy title + dotted azure rule + thin footer, photo-dark closing; `cover()` accepts `coverStyle` / `data.image` overrides.
- **Adding a theme** = new tokens + a `signature` block (+ optional cover asset). Never fork the component library. Selection: `getTheme("leander-global")` from `theme/tokens.js`. See `THEMES.md` → One Shared Component Library + Per-Theme Signature.

## Architecture Diagrams — Two Types & When To Use

An architecture page is usually the core of a product/management deck. There are two distinct archetypes; pick by the question the page answers, not by habit. A deck may contain both.

| | Type A — `archLayered` | Type B — `archDualEngine` |
|---|---|---|
| Answers | "系统由哪些层 / 模块组成" | "在某业务场景里如何协同、被什么赋能" |
| View | 系统 / 技术视角 | 业务 / 场景视角 |
| Form | 自上而下分层堆叠（banner + 模块行） | 中心双核 ✕ 联动 + 左右两翼流向 + 底部底座 |
| Reference decks | 钢厂智能化、多模块底座、口岸详版 | 工厂双擎、口岸双平台 |
| Use when | 平台/产品的静态构成、模块清单、技术拆解 | 双平台/双引擎协同、输入→产出的业务故事、AI 赋能叙事 |

Both keep the Color Semantics rule: structure = navy, single focus = red, second engine = blue, flow arrows = red. Do not multi-color layers/nodes for variety.

### arch-layered (Type A)

- Purpose: System/technical architecture as a top-down layered stack.
- Structure: per layer a full-width colored band (label + optional sub) over a module row; module row is `cards` (name/sub/desc), `groups` (group title + stacked sub-cells), or a single `text` band.
- Required inputs: title; layers (each with `label` and/or content).
- Optional inputs: `focus` (focal layer red), per-card `focus`, layer `sub`, `h` (content height).
- Color: bands navy by default; one focal layer/card red; no per-layer rainbow.
- QA risks: too many layers (cap ~5); algo/sub-card body text too small; bands without content row.

### arch-dual-engine (Type B)

- Purpose: Scenario/business architecture — two engines/platforms collaborating, fed by an enabling base.
- Structure: optional top value band; central dual cores (two concentric circles + a `联动` hub with ⇄); left wing inputs → red `数据产生` block arrow → core; core → red `方案输出` block arrow → right wing outputs; optional central up-arrow (协同产出); optional bottom AI base panel (cylinder + capability pills) with two blue `AI 赋能` up-arrows.
- Required inputs: title; `center.left`/`center.right` (name, desc, icon); `leftWing.items` / `rightWing.items` (title, sub, icon).
- Optional inputs: `topBand`, `centerUp`, `center.mid`, wing `top`/`flow`, `base.core` + `base.feeders`.
- Color: left engine navy, right engine blue; flow arrows + hub + focus red; base/feeders blue. Two hues = two real engines, not decoration.
- Glyph set (differentiated, avoid repetition): `doc gear box coin data chart globe hub route`.
- QA risks: graphics overlapping (keep arrows clear of cores); identical repeated badges (use distinct icons); crowded center column (keep 协同产出 above, 联动+mid below, base arrows off-center at engine x).

## Component Specs

### minimal-cover-right-title

- Purpose: Set a formal tone with restrained brand presence.
- Structure: Large right-side title, small subtitle, bottom rule, small date/version.
- Required inputs: title, subtitle, deck type/date.
- Optional inputs: logo, tagline.
- Editable: yes.
- QA risks: title too far right, bottom text too small, excessive empty space without tone.

### four-column-mechanism

- Purpose: Present four parallel values or mechanisms with equal visual weight.
- Structure: Four columns; each has number, title, tag, short text, icon/diagram, closing line.
- Required inputs: four items with title, tag, explanation, visual cue.
- Optional inputs: left/right stakeholder grouping.
- Editable: yes.
- QA risks: columns becoming text-only; uneven vertical alignment; icons not meaningful.

### big-word-card-matrix

- Purpose: Make a strategic/value judgement with designed whitespace.
- Structure: Left 35-40% large keywords and short explanation; right 2x2 cards.
- Required inputs: 1-2 big keywords, summary, four supporting cards.
- Optional inputs: audience-side grouping, color emphasis.
- Editable: yes.
- QA risks: empty left side without strong typography; right cards too sparse.

### three-metric-cards

- Purpose: Show quantified value or benchmark evidence.
- Structure: Three equal cards with large number, label, explanation, caveat/source.
- Required inputs: three metrics, labels, source/boundary.
- Optional inputs: formula or caveat band.
- Editable: yes.
- QA risks: numbers without source; body text too small; all cards equally emphasized when one is the key.

### system-architecture-center

- Purpose: Explain a product architecture or data/control platform.
- Structure: Inputs on left, central platform, outputs/applications on right.
- Required inputs: input list, core modules, output list, core engine.
- Optional inputs: data loop arrows, platform subtitle.
- Editable: yes.
- QA risks: too many modules; center block too dense.

### hub-spoke-capability

- Purpose: Show a central system/platform and surrounding modules.
- Structure: central circle/card with radial modules and side explanation.
- Required inputs: center name, 4-6 modules, one takeaway.
- Optional inputs: achieved/planned status per module.
- Editable: yes.
- QA risks: spokes crossing text; module labels too small; layout leaning.

### roadmap-swimlane

- Purpose: Show timeline or plan across multiple tracks.
- Structure: time axis with swimlanes or stage cards.
- Required inputs: stages, dates, tracks, milestones.
- Optional inputs: risks or decision gates.
- Editable: yes.
- QA risks: too many small labels; dates unreadable; no current-state marker.

### section-divider (signature-aware)

- Purpose: Create strong chapter rhythm; one divider style per theme.
- Dispatch: `sectionDivider()` reads `theme.signature.divider`.
  - **Base — `big-number`**: large faint number, red chapter title, red rule, short subtitle, optional keyword chips.
  - **Global — `white-underline`** (per FMS reference): optional eyebrow (`SECTION 01`), navy bold title with a solid navy underline, blue subtitle, W logo top-right, grey WESTWELL wordmark footer.
- Required inputs: title (+ number for the eyebrow/big-number).
- Optional inputs: subtitle; keywords (base only); eyebrow (global).
- Editable: yes.
- QA risks: base — right side too empty / number competing with title; global — underline width should track the title; keep title vertically near center.

### step-nav

- Purpose: Agenda / report roadmap; show the talk's 3-5 stages up front.
- Structure: header (with logo); a horizontal axis with numbered nodes; one title+desc card under each node; arrows between nodes; `current` node in accent.
- Required inputs: title, steps (title + desc each).
- Optional inputs: subtitle, current index.
- Editable: yes.
- QA risks: cards too empty (keep desc to one line of value, not filler); too many steps (cap ~5).

### pain-cards-consequence

- Purpose: State problems and their business consequence, not just text cards.
- Structure: header (with logo); 3 equal white cards, each with accent top bar, meaning icon, number, title, body, and an accent consequence band (`→ consequence`).
- Required inputs: title, 3 items (icon, title, desc, consequence).
- Optional inputs: subtitle.
- Editable: yes.
- QA risks: consequence missing (then it is just a text card); icon not mapping to the problem.

### solution-closed-loop (cycleLoop)

- Purpose: Show a closed operating loop (e.g. config → run → KPI → export).
- Structure: header (with logo); 4 nodes on a ring around a filled center label; clockwise arrows; optional right-side note panel for "why".
- Required inputs: center label, 4 steps (title + desc).
- Optional inputs: subtitle, noteTitle + note panel.
- Editable: yes.
- QA risks: center box overlapping side nodes (keep ring radius clear of both half-widths); arrows not reading as one direction.

## Next Implementation Priority

Implement these next in the scaffold helper library:

1. `last-mile-process`
2. `priority-pyramid`
3. `positioning-matrix`
4. `dual-evidence-panels`
5. `dashboard-mockup`
6. `image-led-product-page`
7. `kpi-six-cards` (promote from the WellSimtec deck `p13`)
8. `validation-stack` (promote from the WellSimtec deck `p11`)

These cover most internal product, management, presales, training, and customer demo decks.
