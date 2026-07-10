# Feedback Log (append-only)

Raw history of every improvement/feedback this skill received. This is the **full record**; the distilled, deduplicated working set lives in [`../LESSONS.md`](../LESSONS.md). Universals that graduate go into [`../SLIDE-CRAFT.md`](../SLIDE-CRAFT.md) → Universal Output Rules.

This file is an **archive of examples and raw feedback**, not a default production rulebook. Do not load it as routine context for page production. Use `LESSONS.md` for active rules; open this log only when tracing why a rule exists, consolidating repeated issues, or promoting a new lesson.

**Never edit past entries.** Append new ones at the bottom. When you promote an entry's lesson, set its `Promoted` line — don't delete it.

## How to use

1. **After every fix from user feedback**, append one entry using the template below.
2. **Distill**: when a `Category` has appeared **≥2 times**, or an entry is clearly universal, promote a one-line rule into `LESSONS.md` (and into `SLIDE-CRAFT.md` if it is a true theme-independent universal). Mark the entry `Promoted`.
3. The point is abstraction: record the **general** lesson, not the project-specific symptom. "Architecture page looked bad for deck X" is not a lesson; "scenario architecture needs a dual-engine archetype, not a layered stack" is.

## Defect taxonomy (use these category tags)

`color-semantics` · `whitespace-fill` · `logo-brand` · `background-ground` · `architecture` · `typography` · `density` · `data-boundary` · `layout-composition` · `theme-fit` · `chrome-signature` · `icon-meaning` · `component-gap`

## Entry template

```md
### YYYY-MM-DD · <short title>
- Context: <deck / occasion>
- Theme: leander-base | leander-global
- Affected: <page id / component / chrome / theme token>
- Category: <one or more taxonomy tags>
- Raw feedback: "<verbatim or close paraphrase of what the user said>"
- Fix: <what actually changed>
- Scope: page | component | theme | skill-rule
- Generalizable: yes/no — <the abstracted lesson if yes>
- Promoted: pending | LESSONS.md | SLIDE-CRAFT.md
```

---

## Entries

### 2026-06-15 · Theme must be the existing company theme, not an invented one
- Context: 仿真平台 internal leadership report
- Theme: leander-base
- Affected: theme selection (Phase 2)
- Category: theme-fit
- Raw feedback: "这个主题风格不对…主题里面应该有一个 Leander 的自定义主题，是之前结合公司内部材料整理的"
- Fix: Made Phase 2 open by asking "use Leander Base, or a different style?" before any alternatives; documented leander-base identity in THEMES.md.
- Scope: skill-rule
- Generalizable: yes — when a bundled company template exists, offer it first; never lead with invented styles.
- Promoted: SLIDE-CRAFT.md (Phase 2 "ask first"), THEMES.md

### 2026-06-15 · Cover/back-cover and logo must match the reference decks
- Context: 仿真平台 deck, Leander Base
- Theme: leander-base
- Affected: cover(), closing(), logo()
- Category: chrome-signature, logo-brand
- Raw feedback: "封面、封底都要使用…参考样式…右上角少了 logo"
- Fix: Rebuilt cover/closing to match cactus reference (warm ground, right-aligned red title, centered navy+red slogan, Make a Well Change.); added WESTWELL logo top-right via single brand standard.
- Scope: component, theme
- Generalizable: yes — chrome (cover/closing/logo) must reproduce the reference template's signature, from one brand standard.
- Promoted: LESSONS.md

### 2026-06-21 · Five systemic AI-smell defects
- Context: 仿真平台 deck front half
- Theme: leander-base
- Affected: header/footer (white bg), logo() (inconsistent/oversized), p02/p07 (empty whitespace), p06 (weak architecture), multiple (decorative color)
- Category: background-ground, logo-brand, whitespace-fill, architecture, color-semantics
- Raw feedback: "背景偏白…logo 大小不一样且太大…留白没有意义…架构图展示相当不好…颜色搭配没有业务含义…记得抽象出来优化 skill（通用问题，不是针对这个 PPT）"
- Fix: header() now paints theme bg on every page; logo size single-sourced from theme.brand (~90px); fill-the-body / centered rule; architecture redesigned; color-semantics rule (peers one color, single accent focus).
- Scope: component, skill-rule
- Generalizable: yes — see each as a universal (background ground, single-source logo, designed whitespace, real diagram, color encodes meaning).
- Promoted: SLIDE-CRAFT.md (Universal Output Rules)

### 2026-06-21 · Two architecture archetypes, not one
- Context: 仿真平台 deck, architecture page
- Theme: leander-base
- Affected: archLayered (Type A), archDualEngine (Type B)
- Category: architecture, component-gap
- Raw feedback: "参考的架构图基本分为两种…传统系统架构图…从场景出发的架构图…一个材料里两种都要…抽象成两种模板融合进 skill"
- Fix: Added archLayered (system/technical, layered bands) and archDualEngine (scenario/business, dual core + wings + AI base); documented when to use which.
- Scope: component, skill-rule
- Generalizable: yes — architecture is two archetypes (system-view layered vs scenario-view dual-engine); pick by the question the page answers.
- Promoted: COMPONENT-CATALOG.md, SLIDE-CRAFT.md

### 2026-06-21 · Dual-engine first pass too thin / repetitive / stiff
- Context: 仿真平台 deck, Type B sample
- Theme: leander-base
- Affected: archDualEngine
- Category: architecture, icon-meaning
- Raw feedback: "太单薄… 图形之间会有重复，内容生硬… 还是不够"
- Fix: Added concentric dual cores, block flow arrows (数据产生/方案输出), 联动 hub, differentiated glyph set (doc/gear/box/coin/data/chart/globe/hub/route), bottom AI base with 赋能 arrows.
- Scope: component
- Generalizable: yes — a rich diagram needs differentiated icons (no repeated badges), real flow direction, and a clear center; thin/repeated shapes read as stiff.
- Promoted: COMPONENT-CATALOG.md (Type B QA risks)

### 2026-06-23 · Need a second theme for external/international decks
- Context: New requirement — formal/international/外部正式 occasions
- Theme: leander-global (new)
- Affected: theme registry, signature layer, cover/header/footer/closing
- Category: theme-fit, chrome-signature
- Raw feedback: "之前默认是 leander-base 用于内部汇报；新风格主要对外、正式/国际化场合…基于三份材料整理一个新主题和配套组件…组件共享一个库吗？…还要一个问题日志库，积累并自动抽取共性问题"
- Fix: Added leander-global (cool white + azure #00B0F0 + navy #002060, red=status only, photo-dark cover); made tokens.js a multi-theme registry (getTheme); added a per-theme `signature` block so chrome differs by theme while content components stay shared/auto-reskinned; created this feedback log + LESSONS.md.
- Scope: theme, skill-rule
- Generalizable: yes — themes accumulate in one registry; the shared component library auto-reskins by reading theme colors; only chrome varies, via a theme signature block.
- Promoted: THEMES.md, COMPONENT-CATALOG.md, LESSONS.md

### 2026-06-23 · archLayered top-pinned with dead bottom whitespace
- Context: Leander Global demo deck, Platform Architecture (Type A) page
- Theme: leander-global
- Affected: archLayered()
- Category: whitespace-fill
- Raw feedback: (self-QA on rendered demo) layered stack started at a fixed top y and ended mid-slide, leaving a large empty band above the footer — violates our own Fill-The-Body rule.
- Fix: archLayered now measures total stack height first, then offsets the start y so the whole stack is vertically centered in the body (symmetric top/bottom margins). Also fixed short cards (h≈92) whose desc box height went negative → text shrank to ~6pt; desc Y is now sub-aware and box height is clamped to ≥26px.
- Scope: component
- Generalizable: yes — any component that stacks N variable-height rows from a fixed top must measure-then-center (or fill) so leftover space is symmetric, not a bottom dead band. Any content box whose height is derived from a fixed card height must clamp to a minimum so text never collapses to unreadable size.
- Promoted: LESSONS.md (whitespace-fill now ≥2×)

### 2026-06-23 · Hardcoded CJK labels leak into an English/Global deck
- Context: Leander Global demo deck, Scenario Architecture (Type B) page
- Theme: leander-global
- Affected: archDualEngine()
- Category: typography, theme-fit
- Raw feedback: (self-QA on rendered demo) the dual-engine diagram showed "联动" and "AI 赋能" hardcoded in Chinese on an otherwise all-English international deck.
- Fix: parameterized both labels — center.link overrides "联动", base.boost overrides "AI 赋能" (defaults stay Chinese for leander-base). Global demo passes "Link" / "AI boost".
- Scope: component
- Generalizable: yes — components must not hardcode language-specific literal strings; every author-facing label needs a data override (with a sensible default), so the same component works in a CN internal deck and an EN external deck.
- Promoted: LESSONS.md

### 2026-06-23 · Cover photo art looked crude / stiff
- Context: Leander Global cover & back-cover port skyline
- Theme: leander-global
- Affected: theme/assets/cover-port-dark.png (generator)
- Category: background-ground, layout-composition
- Raw feedback: "封面/封底的港口剪影大图画得不好，岸桥、堆场、船舶线条很生硬…能否再美化下，参考 ReeWell 国际展会封面"
- Fix: rebuilt the generator with 3× supersampling (smooth anti-aliased thin lines) and richer, varied elements (refinery columns + flare, four differentiated quay cranes with trolleys/hoists, a container ship, domed terminal + control tower + RTG stacks, water depth contours, a faint plane) — matching the ReeWell reference aesthetic.
- Scope: theme
- Generalizable: yes — generated line-art assets must be supersampled (draw ≥3× then downscale) for smooth strokes, and use varied/detailed elements; uniform thick geometric shapes read as crude. Study the reference deck's actual artwork, not a generic idea of it.
- Promoted: LESSONS.md

### 2026-06-23 · Need a section-divider page for both themes
- Context: both themes lacked a recorded chapter/transition page; user supplied a base reference (warm big-number) and a global reference (white underlined-title, FMS deck)
- Theme: leander-base + leander-global
- Affected: sectionDivider() (new dispatcher), sectionDividerUnderline() (new), signature.divider token
- Category: component-gap, chrome-signature
- Raw feedback: "base 和 global 都需要一个分页的页面…base 参考红色大号数字截图，global 参考白色 WellFMS 截图…这个分页作为一个组件记录下来"
- Fix: promoted the divider to a signature-aware component sectionDivider(); base = big-number (existing), global = white-underline (navy bold title + solid underline + blue subtitle + wordmark footer). Selected by theme.signature.divider.
- Scope: component, theme
- Generalizable: yes — a chapter/divider page is a first-class chrome component with one variant per theme signature, selected by a signature token (like cover/closing), not a one-off page.
- Promoted: COMPONENT-CATALOG.md, LESSONS.md

### 2026-06-23 · Global rules/footer should follow the CTN reference
- Context: Leander Global header rule + footer
- Theme: leander-global
- Affected: signature.headerRule, signature.footer, footer()/footerWordmark()
- Category: chrome-signature
- Raw feedback: "global 主副标题中间的横线、每页下面的横线，颜色和风格直接参考 CTN 2025 Scheduler"
- Fix: measured CTN — title rule is a fine navy #002060 dotted hairline (not azure); footer is a bottom-right grey WESTWELL wordmark + "FROM HUMAN TO HUMAN" + a steel-blue #6496B9 accent line. Changed Global headerRule to dotted primary, footer to a new "wordmark" style.
- Scope: theme, component
- Generalizable: yes — derive a theme's line/footer treatment by measuring the reference deck (exact hue + dotted/solid + element), not by inventing; chrome details are signature tokens.
- Promoted: THEMES.md, LESSONS.md

### 2026-06-23 · Title/subtitle/rule/footer SIZE didn't match the reference (FMS)
- Context: Leander Global, comparing content pages against FMS 技术介绍
- Theme: leander-global
- Affected: header(), signature.titleSize/subtitleColor, footerWordmark()
- Category: typography, chrome-signature
- Raw feedback: "对照技术介绍 PPT，主副标题、主副标题横线、页面下方横线的样式和大小，目前 Global 明显和参考不一样"
- Fix: measured FMS — title `#002060` ~40pt (mine was ~20pt, half), subtitle light blue `#539ED4` (mine grey), footer steel-blue half-width line ending at the wordmark. Made header title size + subtitle color signature-driven (titleSize 76≈38pt, subtitleColor 539ED4); lengthened the footer line. Header layout (rule/subtitle Y) now derives from titleSize so Base (40) is byte-identical.
- Scope: component, theme
- Generalizable: yes — to "match a reference", **measure it** (cap-height→pt, exact hues), don't eyeball. Type scale itself is a signature dimension (titleSize/subtitleColor), not a constant.
- Promoted: LESSONS.md

### 2026-06-23 · Bigger shared-chrome title collided with top-aligned diagrams
- Context: enlarging the Global header title pushed the subtitle into archDualEngine's top band
- Theme: leander-global
- Affected: header() return value; archLayered, archDualEngine
- Category: layout-composition, whitespace-fill
- Raw feedback: (self-QA after the title-size change) subtitle overlapped the dual-engine top band on the architecture page.
- Fix: header() now returns its content-bottom Y; archLayered centers from that baseline and archDualEngine offsets its top band + center arrow by it. No hardcoded "content starts at y=214/196" when the header height is variable.
- Scope: component
- Generalizable: yes — when chrome height is theme-variable (e.g. title size), the chrome must publish where content can start, and top-aligned components must read it instead of hardcoding a top Y. Changing one shared dimension can break every page that assumed the old one — re-render diagram pages after any chrome size change.
- Promoted: LESSONS.md

### 2026-06-23 · Outputs scattered at project root instead of the deck output dir
- Context: review PNGs/PPTX were copied to the project root, not the deck's output folder
- Theme: n/a (workflow)
- Affected: output routing
- Category: layout-composition (workflow)
- Raw feedback: "所有的输出为什么直接在 03仿真平台 目录下，而不是 deck_仿真平台汇报\\output 下了？"
- Fix: route deliverables to the deck's `output/` (here `deck_仿真平台汇报/output/leander-global/`); moved stray root artifacts there; left user files untouched.
- Scope: skill-rule
- Generalizable: yes — review/render deliverables belong in the active deck project's `output/`, never scattered at the workspace root. Confirm the output path with the deck scaffold, not convenience.
- Promoted: LESSONS.md

### 2026-06-24 · Component library too thin — mine more from real decks
- Context: user supplied 3 solution decks (钢厂数字化 / 盐田智慧园区 / 易大宗口岸) to extract components from
- Theme: n/a (both)
- Affected: ppt-components.js (+6), icons.js (+7)
- Category: component-gap, icon-meaning
- Raw feedback: "组件库里可用组件还是比较少…从这三个材料再提炼一些组件，再结合风格做一些新的，要遵守 PPT 原则——组件和文字相互融合、页面饱满、留白有设计感"
- Fix: rendered + surveyed the 3 decks; abstracted 6 recurring patterns into theme-agnostic components — `capabilityMatrix` (comparison table), `featureGrid` (icon cards), `tierStack` (云-边-端 layers), `statBand` (big-stat band), `bulletColumns` (categorized enumeration + conclusion), `pillarTrio` (3 product pillars). All use header()'s cTop, fill the body (content-fit + centered), single-accent focus. Expanded icons by 7 (gear/cloud/target/lock/leaf/layers/gauge).
- Scope: component
- Generalizable: yes — when a component library feels thin, mine recurring layouts from 2-3 real decks in the target genre and abstract the *pattern* (table / icon-grid / tier-stack / stat-band / category-columns / pillars), theme-agnostic. New components must obey the same invariants: read theme colors, fill the body, one accent focus, real icons (never the "i" fallback).
- Promoted: COMPONENT-CATALOG.md, SLIDE-CRAFT.md, LESSONS.md

### 2026-06-24 · Expand library by 12 more (27 → 39)
- Context: user asked to add the suggested gaps and expand further
- Theme: n/a (both)
- Affected: ppt-components.js (+12), theme tokens (+warn)
- Category: component-gap
- Raw feedback: "把要补充的这些全部加进去，甚至还可以再扩充一些"
- Fix: added quadrantMatrix, priorityPyramid, coverageMap, topology, imageGallery, ringStats, numberedList, timelineVertical, quoteHighlight, funnel, twoOptionCompare, orgTree. Added `warn` amber status token (fixed stateFlow draft empty-fill). Each fills the body + single-accent focus + CJK-aware fonts.
- Scope: component
- Generalizable: yes — a complete deck library needs the full relationship vocabulary: positioning(quadrant), hierarchy(pyramid/tree), geo(coverage), network(topology), media(gallery), %(rings), narrative(numbered/vertical-timeline), statement(quote), conversion(funnel), decision(A/B). Decision-tree row per pattern so selection is mechanical.
- Promoted: COMPONENT-CATALOG.md, SLIDE-CRAFT.md, LESSONS.md

### 2026-06-24 · numberedList rows stacked — missing y increment (caught in QA render)
- Context: batch-2 QA render
- Theme: leander-global
- Affected: numberedList()
- Category: layout-composition
- Raw feedback: (self-QA) all rows drew at the same Y; only the last (04) was visible.
- Fix: added `y += rh + 14` at the end of the row loop. Also centered orgTree vertically (was top-heavy → bottom dead space, violating Fill-The-Body).
- Scope: component
- Generalizable: yes — every stacked-list component MUST advance its cursor each iteration; always render a multi-item component with ≥3 items in QA so an omitted increment is visible. A single test item hides this class of bug.
- Promoted: LESSONS.md

### 2026-06-24 · Batch 3 — finer/specialized components incl. native charts (39 → 50)
- Context: "继续挖更细的"
- Theme: n/a (both)
- Affected: ppt-components.js (+11)
- Category: component-gap
- Raw feedback: "继续挖更细的"（gantt/heatmap/radar/valueChain 等）
- Fix: added gantt, heatmap, radar, valueChain, waterfall, swimlaneProcess, venn, annotatedDiagram + 3 **native editable charts** (barChart, lineChart, pieBreakdown via slide.addChart). Charts keep data editable in PPT and take theme colors via chartColors.
- Scope: component
- Generalizable: yes — for genuine data viz prefer native `slide.addChart(...)` (editable) over hand-drawn bars; pass theme colors as `chartColors`. A complete library mixes hand-drawn diagrams (gantt/heatmap/venn/waterfall/chevron/swimlane) with native charts (bar/line/radar/doughnut).
- Promoted: COMPONENT-CATALOG.md, SLIDE-CRAFT.md, LESSONS.md

### 2026-06-24 · Multi-series radar fill hid the second series (caught in QA)
- Context: batch-3 QA render
- Theme: leander-global
- Affected: radar()
- Category: color-semantics, layout-composition
- Raw feedback: (self-QA) the first (larger) radar series filled opaque and covered the smaller second series — looked like a single polygon.
- Fix: default radar to `marker` (outline + dots) so every series stays visible; `filled:true` is opt-in (only sensible for a single series).
- Scope: component
- Generalizable: yes — for any overlapping multi-series viz (radar, area, venn), use outline/transparency so no series hides another; solid fill is only safe for a single series. Always QA charts with ≥2 series.
- Promoted: LESSONS.md, COMPONENT-CATALOG.md

### 2026-06-24 · Pyramid/funnel were rectangles; valueChain cut text; venn/ringStats too plain
- Context: user review of 5 components
- Theme: leander-global
- Affected: priorityPyramid, funnel, valueChain, venn, ringStats
- Category: layout-composition, component-gap
- Raw feedback: "金字塔和漏斗都是方的；价值链这样的展示形式不好；韦恩图太简单；环形指标太简单；这几张图文字还会错乱，重新设计"
- Fix: (1) priorityPyramid → real cone: `triangle` apex + `trapezoid` bands with widths = base/2^(n-1-i) so the 0.5 top-ratio edges align into a clean pyramid; labels moved to right-side cards (narrow apex can't hold text). (2) funnel → flipped `trapezoid` bands (flipV), widths halving, right-side name/value. (3) valueChain → stage cards (header + bullets) linked by chevron arrows — text in card, never cut by a notch. (4) venn → per-region bullet items + ∩ badge + right intersection callout card + takeaway. (5) ringStats → native doughnut progress rings (arc = real %) + clean center number (the old solid-donut hid/garbled the number).
- Scope: component
- Generalizable: yes — taper shapes (pyramid/funnel) need real `triangle`/`trapezoid` presets with widths matched to the preset's 0.5 top-ratio so band edges align (rectangles read as "方的"). Never put text inside a `chevron`'s notch — put it in a card. For progress %, a native doughnut [v,100-v] gives a true arc; a solid donut with a number in the hole garbles. "Too simple" = add region detail + a callout + a takeaway.
- Promoted: COMPONENT-CATALOG.md, LESSONS.md

### 2026-06-23 · Stop redrawing reference lines — extract the actual shapes from the source PPTX
- Context: title rule + bottom line still "不对" after two redraw attempts; user pointed at CTN and said "直接复制里面的图形，不要自己画了"
- Theme: leander-global
- Affected: signature.headerRule, signature.footer, header()/footer(), theme/assets/footer-westwell.png
- Category: chrome-signature, theme-fit
- Raw feedback: "主副标题中间的横线、每一页下面的横线还是不对…可以直接使用里面的图形，直接复制到 GLOBAL 里面形成模板，不要自己画了"
- Fix: unzipped CTN, read the slide XML — title rule is a connector `#0070C0` / `lgDash` / 0.25pt (I'd been drawing navy `sysDot`); the bottom "line" is not vector at all but a footer PNG (`ppt/media/image2.png`, line+wordmark baked in). Reproduced the connector with its exact params and **reused CTN's own footer image** as `footer-westwell.png` placed full-width; `footer()` now just drops the image.
- Scope: component, theme
- Generalizable: yes — when matching a specific reference detail, **open the source file** (unzip the .pptx, read slide/master XML) and take the real value or the real asset; a "line" in a reference may be a baked image, not a shape. Two eyeball redraws cost more than one extraction. Connector line params (color/dash/weight) and footer bitmaps are signature data.
- Promoted: LESSONS.md

---

## 2026-06-25 — Internal deck restyle (Livo Sense 雷视一体)

### Entry: outline approved without a real sync
- Theme: leander-base
- Affected: SKILL.md Phase 1 Checkpoint, OUTLINE.md
- Category: process
- Raw feedback: "这次PPT大纲都没有和我直接确认，缺少了一个同步的过程"
- Fix: Strengthened the Checkpoint Plan into a hard gate — the page-by-page outline must be explicitly confirmed by the user (not assumed via "you decide") before theme/sample work. Treat the deck-type+page-list confirmation as Gate 1.5.
- Scope: skill docs
- Generalizable: yes — present the page plan and get explicit page-list sign-off before producing; a silent jump to samples/production is a process failure even if the output is good.
- Promoted: LESSONS.md

### Entry: tiny text inside white cards, deck-wide
- Theme: leander-base
- Affected: theme/tokens.js (new `type` scale), all card components
- Category: typography, density
- Raw feedback: "每个图形里面的小字太小了，和整个图形就不搭配…整个PPT材料都需要注意；字体每一页要协调，小字大小尽可能一致，但以每页内容为准，和谐美观"
- Fix: Added a shared **type scale** token `theme.type` (hero/h1/h2/lead/bodyLg/h3/body/bodySm/cap/tiny, design-px). New components read it; body floor ≥22px(11pt). Existing white-card components render body at 14–15px(7pt) which is too small for projection — flagged for migration.
- Scope: theme token, components
- Generalizable: yes — a deck needs ONE type scale applied consistently (same role = same size across pages; dense pages take the smaller step, airy pages the larger), never ad-hoc per-component sizes. Min body ≥ ~11pt.
- Promoted: LESSONS.md, SLIDE-CRAFT.md

### Entry: line-frame / sparse zones stretched to fill the page
- Theme: leander-base
- Affected: components/editorial.js zoneGrid (content-fit + centering)
- Category: whitespace-fill, layout-composition
- Raw feedback: "无意义的空白 + 无意义的撑满整个页面，但内容很少，一看就是AI出来的；要么背景色+线框分隔，要么文字+图形，留白也必须设计过"
- Fix: zoneGrid now estimates body line count, sizes each zone to its content (min floor), then centers the block → symmetric designed margins. Switching from white fills to line frames is NOT enough; a frame stretched over little content reads just as AI-generated.
- Scope: component
- Generalizable: yes — "fill the page" must mean fit-content-then-center, never inflate a frame/card to span the body with a sparse top and dead bottom. Two acceptable layouts: (a) background ground + line-frame dividers, or (b) split into a text zone + a graphic zone; whitespace must be designed.
- Promoted: LESSONS.md, SLIDE-CRAFT.md

### Entry: missing editorial / line-frame component vocabulary
- Theme: leander-base
- Affected: components/editorial.js (new)
- Category: component-gap
- Raw feedback: (multiple) "直接用背景色+线框分割来表达；表格太丑→背景+线框；甘特要图标式而不是网格"
- Fix: Added `editorial.js` (`makeEditorial`): lineCompare (background + vertical-rule columns), milestoneTimeline (icon nodes on an axis, not a grid gantt), zoneGrid (content-fit line-frame cells), splitDossier (identity rail + line-frame zones), panelDuo (two rich panels), lineTable (background + hairline rows, no filled grid). All read `theme.type`, use background ground + line frames, single accent focus.
- Scope: components
- Generalizable: yes — the white-card-heavy library needed a line-frame/editorial counterpart; offer it for "背景+线框" / "文字+图形" requests and ugly-table complaints. A "节奏/计划" page often wants an icon milestone timeline, not a grid gantt.
- Promoted: LESSONS.md, COMPONENT-CATALOG.md

---

## 2026-06-25 — Designer-grade redesign (Livo Sense v3, against cactus reference)

### Entry: typography too small vs the brand reference
- Theme: leander-base
- Affected: theme/tokens.js `type` scale
- Category: typography
- Raw feedback: "字体大小也不好，参考我上传PPT第三页、第四页，字体看着精美些，也不会显得小"
- Fix: **Measured the reference** (unzipped cactus.pptx, read slide3/4 XML `sz`): body paragraphs 18pt, column titles 22pt, lead 18pt, sub-labels 11pt; tiny in-graphic labels 6-9pt. My scale was body 12pt — too small. Bumped the scale one full step (body 12→15pt, h3 13→17pt, h2 17→22pt, lead 15→18pt, added `micro` 10.5pt for in-graphic labels). Also clearer hierarchy (bold lead + red keyword + grey sub-label) so nothing reads as a uniform small wall.
- Scope: theme token
- Generalizable: yes — when the user cites a reference deck for "font feels small/refined", OPEN it and read the real `sz` values; don't guess. Body ~15-18pt, titles ~22pt is the comfortable-projection range. Hierarchy (lead/title/body/sub) matters as much as absolute size.
- Promoted: LESSONS.md, SLIDE-CRAFT.md

### Entry: same template reused across pages → visual fatigue + 死板
- Theme: leander-base
- Affected: components/bespoke.js (new), pages assignment
- Category: layout-composition, component-gap
- Raw feedback: "不能重复使用一套图形模板，视觉会疲劳，需要多套图形；而且基本都是图形里塞文字，很少用大块纯图形化表达，显得死板、缺灵动感和设计感；作为专业设计师重新设计规划"
- Fix: Audited the deck — found 3 reused templates (lineCompare×2, zoneGrid×4, lineTable×2). Built `bespoke.js` (8 large-graphic metaphors: fusionVenn, hubRadial, tierLadder, goalPath, sceneColumns w/ hand-drawn scene glyphs, pipelineFlow, resourceBoard, actionTracks) and reassigned every page a DIFFERENT form. Mirrored cactus's bespoke vocabulary (dual-circle, 4 custom mini-diagrams, tier ladder, repo-card mockup).
- Scope: components, whole-deck composition
- Generalizable: yes — a polished deck varies the visual form every page; never reuse one component 3-4×. Mix line-frame (editorial) + large illustrative metaphor (bespoke) + occasional white-card. "Box with text inside" on every page reads as AI/死板 — budget ≥1 large pure-graphic page per ~3 pages, with bespoke per-domain line-art (study the reference deck's actual artwork).
- Promoted: LESSONS.md, SLIDE-CRAFT.md, COMPONENT-CATALOG.md

### Entry: subtitles colloquial instead of summarizing
- Theme: leander-base
- Affected: all page subtitles
- Category: data-boundary (copy), typography
- Raw feedback: "副标题相当不好，副标题是对主标题的补充，但不能口语化，需要概括这一页的核心内容"
- Fix: Rewrote every subtitle to a concise one-line summary of the page's core point (e.g. "单传感器各有盲区，融合实现距离与语义的互补"), matching cactus's English summary subtitles ("Internal efficiency release × Customer demand fulfillment").
- Scope: copy
- Generalizable: yes — a subtitle summarizes the page's takeaway in one concise line, not a chatty restatement of the title. Treat it as the page's one-sentence thesis.
- Promoted: LESSONS.md

### Entry: bottom "double horizontal line" defect
- Theme: leander-base
- Affected: components/editorial.js lineCompare banner
- Category: chrome-signature, layout-composition
- Raw feedback: "第二页、第三页下面有两个横线，这个画的有问题"
- Fix: The conclusion banner drew a full-width accent rule that parallels the footer red bar → two lines. Replaced with a centered statement flanked by two short accent ticks (no full-width rule). Applies anywhere a bottom statement sits above the footer.
- Scope: component
- Generalizable: yes — never draw a full-width horizontal rule near the footer; it collides with the footer bar into a "double line". Use short flanking ticks or a framed pill for bottom statements.
- Promoted: LESSONS.md

### Entry: quality regressed across rounds — Design Review Pass not actually run
- Theme: leander-base
- Affected: SKILL.md / QA.md (Design Review Pass), bespoke components, theme.type
- Category: process, typography, layout-composition
- Raw feedback: "做的更丑了…为什么字体是15-16？…现在到底有在继续用skill中的复核校验吗？我感觉检查机制根本没派上用场…留白有设计、文字和图形要融合、页面要有设计感，到底什么问题导致的？"
- Root cause: I reacted to one complaint per round by turning a single global knob (e.g. bumped body to 15pt, flattening the type hierarchy) and did NOT run the skill's required rendered Design Review Pass each iteration — so self-authored bespoke graphics shipped with the exact defects the checklist exists to catch (text pills overlapping circle strokes on the venn; sparse hub with crossing lines; oversized "small" labels).
- Fix: (1) Re-tuned theme.type to a WIDE hierarchy — titles 20pt, body 10.5pt, supporting/labels/in-graphic 6.5–7.5pt ("该大的大该小的小"), not a uniform 15pt. (2) Removed overlap-prone floating chips (integrate cue text inside the shape). (3) Made the rendered Design Review Pass mandatory every render, hunting overlap / dead-space / text-graphic fusion as automatic fails. (4) Mixed fills + line-frames (filled ground panels behind glyphs / center node) instead of all-outline.
- Tooling findings: gpt-image-2 is advisor-only here (no OPENAI_API_KEY / host image tool) — can't auto-generate raster; redrew vector instead. web-video-presentation ships ~24 art-direction themes (CSS tokens, not a PPT component lib) — borrow filled-duotone grounds / oversized numerals / asymmetric splits to reduce boxiness.
- Scope: skill docs + theme + components
- Generalizable: yes — (a) NEVER flatten the type scale to fix "looks small"; widen the hierarchy and shrink supporting text. (b) Run the rendered Design Review Pass EVERY render, not once at the end; treat overlap / dead-space / poor text-graphic fusion as automatic fails. (c) Each new bespoke component must pass the same checklist before it ships.
- Promoted: LESSONS.md

### Entry: de-box pass — filled duotone grounds beat hollow outlines
- Theme: leander-base
- Affected: components/bespoke.js (pipelineFlow, goalPath), components/editorial.js (panelDuo, splitDossier)
- Category: layout-composition, theme-fit
- Raw feedback: "把更多页面做成插入到画里，减少方框…不是全部都要背景色+线框，有的页面图形可以用一些背景色的…参考 web-video 的不同主题图形库"
- Fix: Borrowed web-video art-direction (filled duotone ground blocks, oversized numerals, continuous-flow) to de-box the boxiest pages: pipelineFlow → 3 filled phase BANDS with the numbered flow drawn ON the band (text fused into graphic) + a single inline summary strip instead of 9 node boxes + 2 tall summary boxes; panelDuo → filled grounds (surface2 / accentSoft) + entry hairlines + a central VS node instead of two hollow outlined panels; splitDossier zones + goalPath chips → filled grounds, full-width single-column chips (fixes mid-word wrap).
- Scope: components
- Generalizable: yes — when a page reads "死板/all boxes", convert hollow outlined cards to FILLED tinted grounds (duotone) and fuse labels onto the graphic (numbers on the flow line, values in the band) rather than parking text in separate outlined boxes. Mix fills + line-frames by design; don't default to all-outline. web-video themes are an art-direction source (filled blocks, big numerals, asymmetric splits), not a component lib.
- Promoted: LESSONS.md (text–graphic fusion + mix-fills items already cover this)

### Entry: contrast / fill-ground tint + refinement round
- Theme: leander-base
- Affected: theme/tokens.js (surface3), bespoke.js (pipelineFlow/hubRadial/goalPath/fusionVenn/resourceBoard/sceneColumns), editorial.js (panelDuo/splitDossier/milestoneTimeline)
- Category: color-semantics, layout-composition, typography, component-gap
- Raw feedback: "图形颜色和背景色太接近看着费力 (P7)；白色底芯片和页面背景接近看不清 (P3)；表格里不同颜色有什么含义吗 (P8)；图形撑满但内容少很空洞 (P9)；图标偏大和方框重叠 (P6)；字体该大的不大该小的太大、和图形重叠 (P11/P12)；线条太简单缺设计感 (P2)"
- Fix: (1) Added `surface3:#E6EAF3` ground tint — surface2(#F3F6FA) was ~indistinguishable from bg(#F5F5F0), so filled grounds/chips looked washed out; switched filled grounds to surface3 (P7 bands, P3 long panel, P11 zones) and chips to white+border. (2) P8 removed the arbitrary red focus row (color must encode meaning — it didn't). (3) P9 enriched hollow panels: icon badge per entry + per-panel takeaway band. (4) P6 swapped oversized "hub" icon → contained "gear", moved title/body to clear the badge. (5) P11 enlarged left fact-labels (cap→h3), shrank oversized right zone body (body→bodySm). (6) P12 aligned red key column (valign middle, wider gap) to stop overlap. (7) P2 added LiDAR+camera product line-glyphs inside the circles for design intent. (8) P5 wired optional image2 raster (fs.existsSync fallback to vector).
- Scope: theme token + components
- Generalizable: yes — (a) a filled panel/chip ground must contrast with the page bg; never reuse a near-bg surface tint for a fill (need a dedicated ground token). (b) A hollow graphic that spans the page with little content = enrich (icons + takeaway) or shrink+center, never leave it sparse. (c) Library icons have intrinsic footprints — pick contained ones for small badges (avoid "hub"/big-spoke icons in <60px badges) or the icon overflows the badge into text.
- Promoted: LESSONS.md

### Entry: image-asset reserve-slot + prompt-spec workflow
- Theme: leander-base
- Affected: references/IMAGE-ASSETS.md (new), editorial.js `imageSlot`, SKILL.md Stage Guide, OUTLINE.md component-source, COMPONENT-CATALOG.md; deck P5/P2/closing image integration
- Category: component-gap, layout-composition
- Raw feedback: "P2/P5 满意；后续遇到需要复杂图片、不适合用图形直接画的，都留出对应位置并提供画图用的 markdown，把这套逻辑整合进 leander-ppt"
- Fix: Made images a first-class workflow. `imageSlot(slide,{x,y,w,h,img,fallback,ground})` — transparent PNG blends on the theme ground (no white card), vector fallback so the deck always renders. `IMAGE-ASSETS.md` defines when to draw vector vs reserve an image slot, the hard conventions (transparent RGBA never opaque/keyed, no white card, per-theme navy line/stipple style token, square 1:1 / strip 3:1, kebab naming), and the prompt-spec markdown template `<deck>-images.gpt-image-2.md`. Wired into SKILL Stage Reading Guide + OUTLINE component-source.
- Scope: skill docs + shared component
- Generalizable: yes — reserve a slot for scene/realistic imagery rather than hand-drawing it from primitives; emit a prompt-spec md the user (or gpt-image-2) fills; transparent art blends on the ground, never boxed in a white card; verify transparency (colorType 6).
- Promoted: LESSONS.md [graduated], IMAGE-ASSETS.md, COMPONENT-CATALOG.md

### Entry: anchor samples should prove the actual message, not force-fit library components
- Theme: leander-base
- Affected: anchor sample pages p01 / p09 / p15 in `leander-ppt-internal-sharing`
- Category: process, layout-composition, component-gap, typography
- Raw feedback: "封面不需要左上角这一块内容；标题不对，核心是分享 harness 的工程设计思路；总架构页不应该套架构组件，要讲清楚 skill 由哪些模块组成；多人共用一个 skill 不适合泳道图，要讲共享和迭代机制；正文每一个副标题都用英文说明"
- Fix: Repaired the minimum unit: page-specific `page.js` for the three anchor pages only. p01 became a cleaner cover with the real subject "Harness 工程设计框架", English subtitle, more whitespace, no unrelated left-side diagram, and the brand tagline moved close to the footer rule. p09 replaced generic layered architecture with a page-specific module map showing `SKILL.md`, `references/`, `templates/`, `components/`, `theme/`, and `tools/`, including each module's content and role. p15 replaced the swimlane with a shared-repo contribution flow: contributor A/B -> branch/change note -> shared repo -> review/merge -> version release, plus extensible areas and conflict handling.
- Scope: page-level repair
- Generalizable: yes — anchor pages must validate the deck's actual message and visual form. If the library component explains the wrong relationship, do not force-fit it; create a page-specific composition and record the component gap. Cover titles must match the real thesis of the share, and slide subtitles/section labels should use the approved language convention consistently.
- Promoted: no

### Entry: team skill sharing needs versioned automatic sync, not only manual upload
- Theme: leander-base
- Affected: anchor sample p15 in `leander-ppt-internal-sharing`; local cover design decision
- Category: process, layout-composition, component-gap
- Raw feedback: "封面按我截图的位置记住；Skill 模块组成两边不对齐、内容没有对应关系；团队共享机制文字太多且溢出，没有 QA；共享机制不能只靠主动上传，需要原始 skill 版本号、每个人拿到版本号后正常使用和迭代，系统按周自动上传前跑本地校验，对比上次版本号，检查新增/修改组件，判断哪些可进入公共池、哪些项目定制或敏感，再自动上传 git 仓库。"
- Fix: Recorded the cover standard in the deck-level `design-decisions.md`. Rebuilt p09 as a module/content/responsibility/output correspondence table so every row has a clear mapping. Rebuilt p15 as a versioned auto-sync mechanism: base version -> local copy -> in-task update -> candidate pack -> shared repo; weekly preflight checks version diff, change classification, public-pool eligibility, sensitive-content exclusion, local QA, and Git upload. Reduced text density and re-rendered to check for overflow.
- Scope: page-level repair + project design decision
- Generalizable: yes — when explaining shared Skill evolution, do not stop at "people upload to Git." Design the governance mechanism: base version, local version metadata, periodic diff, abstraction/public-pool classifier, sensitivity filter, local QA, generated summary, and automated PR/push. Also, module composition pages should use an explicit correspondence structure when the point is "what module contains / does / outputs."
- Promoted: no

### Entry: visual selection gate missing from per-page workflow
- Date: 2026-07-02
- Theme: leander-base
- Affected: `leander-ppt` skill docs and scaffold gate
- Category: component-gap, process, layout-composition
- Raw feedback: "组件库里面应该是有不少适配的图形，为什么不用？检查 leander-ppt 针对每一页的图形使用机制是什么；我要根据这一页表达内容自动选择图形库、外部图形、或者 image2，并由 subagent 校验。怀疑图形选择机制、检查机制都没效果。"
- Root cause: The skill had a component catalog, slide decision tree, imageSlot workflow, and reviewer checklist, but no hard per-page artifact that forced the builder to evaluate component-library / external-graphic / image2 / custom routes before drawing. `tools/deck.js` only gated `qa.md` PASS and render freshness; it did not reject missing visual-route decisions. This let page-specific box diagrams bypass reusable components such as `stateFlow`, `workflowConfig`, and `pipelineFlow`.
- Fix: Added `references/VISUAL-SELECTION.md` and made it required in SKILL phases, Gate 4.5, Production, QA, Scaffold, Components, and reviewer prompt. Each content page now needs `page.json.visualSelection` with relationship, candidate routes, selected route, rejected routes, and review focus. Updated scaffold `tools/deck.js` to fail verify/build when `page.json.visualSelection.selectedRoute.route` is missing or stale versus QA.
- Scope: skill docs + scaffold gate
- Generalizable: yes — component reuse cannot rely on advice alone. Make the visual route a per-page contract, then have the build gate and reviewer enforce it. Page-specific custom composition is last-resort after component-library, external-graphic, and image2/imageSlot routes are evaluated.
- Promoted: LESSONS.md

### 2026-07-03 路 QA must catch connector geometry and semantic-icon failures
- Context: Harness internal sharing deck, P11-P13 mechanism pages
- Theme: leander-base
- Affected: P11 context routing, P12 page-folder memory, P13 tool-system tree, `toolSystemTree` component
- Category: process, layout-composition, icon-meaning, component-gap
- Raw feedback: "文字和图形还有重叠；P13 箭头都不是直的，是歪的，这是低级错误；主题库、组件库图形不好，看不出来是什么；彩色横线太丑且没意义。"
- Fix: Rebuilt P11 right-side routing with separated text/chip zones and clearer vector AI node. Rebuilt P12 as folder-row plus selected-folder expansion. Promoted P13 into a reusable `toolSystemTree` component with orthogonal connectors, semantic theme/component/image icons, and vertical accent detail cards; backfilled it into the scaffold component registry.
- Scope: page + component + skill-rule
- Generalizable: yes - connector geometry, text clearance, and semantic icon meaning are hard QA gates. Tree/flow diagrams must use straight/orthogonal connectors where intended; labels and chips must clear nodes/strokes; asset-library icons must be drawn from domain metaphors, not generic labeled boxes.
- Promoted: LESSONS.md

### 2026-07-03 · Mechanism slides must reflect real artifacts and use image assets flexibly
- Context: Harness internal sharing deck, P11-P13 mechanism pages
- Theme: leander-base
- Affected: P11 context management, P12 state memory, P13 tool system, `toolSystemTree`, image2 asset workflow
- Category: process, layout-composition, typography, component-gap
- Raw feedback: "P11 AI 图形不好就用 image2 PNG；P12 展开内容和实际文件夹不一致；P13 线条还是歪的、图标圆圈没必要；字体大小、图形对齐这些细节要注意；有必要用 image2 就直接用。"
- Fix: P11 switched the AI overload metaphor to an image2 PNG asset, grouped MD files in one framed input area, aligned paired result boxes, and enlarged route numbers. P12 was corrected against the real page folder structure: `page.json`, `page.js`, `qa.md`, and `out/`; it now explains that `visualSelection` lives inside `page.json` and lessons live in the skill feedback log. P13's shared `toolSystemTree` component now uses strict horizontal/vertical connectors, removes unnecessary circular icon grounds, reduces dense detail text, and aligns the right engine panel with the tree.
- Scope: page + component + skill-rule
- Generalizable: yes - before drawing a mechanism about files/folders, inspect the real artifact structure; image2 assets need real alpha-channel verification, not visual assumptions; peer cards/result boxes need consistent typography and alignment; shared diagram components should enforce straight connector geometry by construction.
- Promoted: LESSONS.md

### 2026-07-03 - Page design method before drawing components
- Context: Harness internal sharing deck, full 24-page method refresh after repeated P11/P12/P13 repair rounds
- Theme: leander-base
- Affected: `references/PAGE-DESIGN-METHOD.md`, SKILL stage guide, QA checklist, SLIDE-CRAFT, P5/P8/P11/P12/P13/P14/P20 pages, scaffold `harness-slides.js`
- Category: process, layout-composition, visual-selection, image-asset, typography
- Raw feedback: P11 image2 became too complex; repeated revisions showed that the issue was not a single page, but the lack of a design method for deciding message, visual route, artifact truth, layout skeleton, image complexity, connector geometry, and typography QA.
- Fix: Added `PAGE-DESIGN-METHOD.md` and wired it into the skill stage guide, QA, and slide craft rules. The method requires: one-sentence message first; relationship classification; four-route visual gate (component, external graphic, image2/imageSlot, custom); real artifact inspection; layout skeleton before decoration; low-complexity image2 usage; and geometry/type QA. Updated the full deck with refreshed reusable components: `platformTrend`, `problemMap`, `repairScope`, and `shareBoundary`, plus the simpler P11 image2 asset.
- Scope: skill-rule + component + full-deck refresh
- Generalizable: yes - mechanism slides should not start from boxes or a favorite component. They start from the intended relationship, then choose the simplest faithful expression route. image2 is for simple focal metaphors or real scenes, while editable PPT components carry text, steps, and logic.
- Promoted: PAGE-DESIGN-METHOD.md, LESSONS.md, QA.md, SLIDE-CRAFT.md, scaffold component library

### 2026-07-06 - Token-light workflow, component library layers, and layout blueprint gate
- Context: User reviewed the Leander-PPT harness and identified three immediate optimization needs before deeper scoring/QA work: reduce token use, clarify component-library design, and add a low-fidelity whole-deck layout checkpoint after outline approval.
- Theme: skill-level
- Affected: `SKILL.md`, `FAST-RUN.md`, `COMPONENT-LIBRARY-DESIGN.md`, `LAYOUT-BLUEPRINT.md`, `COMPONENTS.md`, `OUTLINE.md`, `SCAFFOLD.md`, `VISUAL-SELECTION.md`, scaffold `build-component-index.js`, scaffold `component-index.min.json`
- Category: process, component-gap, visual-selection
- Raw feedback: The skill consumes too much token; component use and scoring are unclear; the library needs stable/easy-to-use construction rules; after outline confirmation there should be a low-fidelity whole-deck layout preview before detailed PPT production.
- Fix: Added a fast-run mode for full/repair/fast-QA/deep-QA context control; added a three-layer component model (page patterns, layout blocks, visual parts) plus promotion/fusion rules; added a Layout Blueprint Gate and reference; added a compact component index generator so routine component selection can read a smaller registry before the full catalog.
- Scope: skill docs + scaffold tool
- Generalizable: yes - before improving the visual scoring algorithm or dynamic QA, reduce context load, clarify component granularity, and add a cheap structural checkpoint to catch deck-level layout problems early.
- Promoted: FAST-RUN.md, COMPONENT-LIBRARY-DESIGN.md, LAYOUT-BLUEPRINT.md

### 2026-07-06 - Chinese self-evolution lifecycle and dynamic per-page QA profile
- 等级：P1
- 状态：promoted
- 触发场景：skill-level QA and feedback loop design
- 原始反馈：继续修改剩余的自进化机制和 QA 机制，并注意 QA 等材料用中文来写。
- 根因：原机制有 `LOG -> LESSONS -> QA` 的方向，但缺少问题等级、生命周期、归档机制；QA 也主要是通用清单，没有强制生成每页针对性的检查项。
- 修复：新增 `SELF-EVOLUTION.md`，定义 P0-P3、new/active/promoted/stable/archived、抽象和归档规则；新增 `DYNAMIC-QA.md` 和中文 reviewer；新增 `tools/build-qa-profile.js`，把每页的关系、路线、组件和内容转成中文 `qaProfile`；`deck.js verify` 增加 `qaProfile` gate。
- 抽象规则：自进化要管理问题生命周期，而不是无限堆积问题；QA 必须由通用检查 + 页面关系检查 + 视觉路线检查 + 内容证据检查组成，并以中文 `qaProfile` 作为每页契约。
- 进入位置：SELF-EVOLUTION.md / DYNAMIC-QA.md / agents/reviewer-zh.md / scaffold tools / SKILL gate / QA.md / SCAFFOLD.md / PRODUCTION.md / VISUAL-SELECTION.md

### 2026-07-06 - Full 24-page rerun exposed visual-binding and image2 traceability gates
- 等级：P1
- 状态：active
- 触发场景：使用更新后的 Leander-ppt skill 重新跑原 24 页 Harness 内部分享 PPT
- 原始反馈：用户要求按更新后的 skill 重新跑完整 24 页，每一步流程都要走，大纲和每页表述内容不变，一边跑一边看问题。
- 根因：
  - 旧页面多数没有显式导出 `visualBinding`，新 Gate 无法稳定判断页面实际采用的视觉路线。
  - 自动视觉选择仍存在关键词倾向，P05/P08/P11/P20 出现自动选择与当前页面实现不一致。
  - image2 路线如果没有 `promptSpec.file`，后续 QA 无法追溯图片生成意图。
  - P11 的 image2 插图虽然解决了手绘粗糙问题，但元素仍偏多，影响“上下文堆叠导致注意力稀释”的快速理解。
- 修复：
  - 为本项目生成 `layout-blueprint.md`，作为 Gate 1.5 的整包布局观察。
  - 重新生成 24 页 `visualSelection` 和中文 `qaProfile`。
  - 生成 `output/v6-gate-contract-report.md`，记录自动选择、实际绑定和 QA 绑定差异。
  - 对旧页面做兼容对齐：不改正文和画面，只补齐 `actualBinding` 或沿用 page.js 的真实 `visualBinding`。
  - 为 P11 补齐 `promptSpec.file` 与 image2 输出文件关系。
  - 重新渲染 24 页，写入中文 `qa.md`；Gate 最终达到 23/24 PASS，P11 因图像复杂度标记为 FIX-FIRST。
- 抽象规则：
  - 新 Gate 推广到旧项目时，要有“兼容对齐”阶段：先记录自动选择与实际实现的差异，再决定是调优评分、改 page.js 绑定，还是保留历史适配。
  - 所有 image2 路线必须同时具备图片槽位、输出文件和 promptSpec；否则不能进入 PASS。
  - image2 插图不应追求复杂完整，应优先服务单一焦点隐喻；机制页上的复杂逻辑仍应由可编辑组件承担。
  - QA 的 PASS 不只看是否无溢出，还要看图像复杂度、第一眼理解、表达路线是否承载页面意图。
- 进入位置：feedback/LOG.md；待推广到 LESSONS.md、DYNAMIC-QA.md、VISUAL-SELECTION.md、PAGE-DESIGN-METHOD.md

### 2026-07-06 - Layout blueprint must be story-first, not page-only
- 等级：P1
- 状态：active
- 触发场景：Leander-PPT 内部分享 deck 的 Gate 1.5 布局蓝图阶段
- 原始反馈：布局不能只考虑单页内容，因为 PPT 是一个完整故事；逻辑性和叙事完整性也要体现在整套 PPT 的布局节奏上，形成层层递进、环环相扣。
- 根因：原 Layout Blueprint 规则只要求每页 message、relationship、skeleton、route、risk，缺少 deck-level narrative job、chapter rhythm、page handoff 和视觉节奏控制，容易得到“单页成立但整套故事松散”的蓝图。
- 修复：更新 `references/LAYOUT-BLUEPRINT.md`，要求先做 story-level layout pass，再做 page-level skeleton；当前项目新增 story arc、chapter narrative job、story handoff rules，并输出 `layout-blueprint-story-v5.png`。
- 抽象规则：长 deck 的布局蓝图必须先设计整套故事弧线，再设计单页骨架。每页需要声明叙事角色、前后承接和版式节奏变化。低保真预览不要求精美，但必须居中、结构可读、线条不误导。
- 进入位置：LAYOUT-BLUEPRINT.md / feedback LOG；后续可推广到 OUTLINE.md 和 reviewer QA。

### 2026-07-06 - Low-fi layout previews must also pass geometry QA
- 等级：P1
- 状态：promoted
- 触发场景：Leander-PPT 内部分享 deck 的 Gate 1.5 布局蓝图预览
- 原始反馈：用户指出预览图里仍有组件重叠和展示问题，并质疑这是否会延续到正式 PPT。
- 根因：之前把低保真预览定位为“只看大概结构”，但没有给预览图本身设置碰撞、越界、对齐、连接线可读性的硬门槛，导致预览绘制器的粗糙问题和真实布局风险混在一起。
- 修复：更新 `references/LAYOUT-BLUEPRINT.md`，新增 Low-Fi Preview QA；当前项目将 `layout-blueprint-story-v5.png` 标记为未通过诊断稿，并重绘 `layout-blueprint-story-v6.png`，使用固定安全区、正交线、等距节点和简化骨架。
- 抽象规则：低保真不是免检。只要预览出现明显重叠、越界、误导性线条或页面骨架失衡，Gate 1.5 就不能通过；必须先修蓝图或预览器，再进入样张和正式 PPT。
- 进入位置：LAYOUT-BLUEPRINT.md / 当前项目 layout-blueprint.md。

### 2026-07-06 - Layout blueprint should create a component-selection contract
- 等级：P1
- 状态：promoted
- 触发场景：Leander-PPT 内部分享 deck 的 Gate 1.5 预览图继续出现重复模板和语义表达不准
- 原始反馈：用户指出预览图如果做得更深，会和后续组件库选择环节重叠；需要重新设计预览图环节和整条作业链路。
- 根因：原机制从 `relationship -> fixed preview template` 直接出图，缺少 `relationshipSubtype`、`visualSignature`、`candidateFamilies`、`avoidSignatures` 和全 deck 重复度约束，导致 p02/p04/p22 这类同属 compare 的页面被画成同一种模板。
- 修复：将 Gate 1.5 升级为 Blueprint-to-Component Contract。更新 `SKILL.md`、`LAYOUT-BLUEPRINT.md`、`PAGE-DESIGN-METHOD.md`、`VISUAL-SELECTION.md`、`DYNAMIC-QA.md`；脚手架 `select-visual-route.js` 支持读取 `layout-blueprint.json` 或页面 `blueprintContract`，`build-qa-profile.js` 增加 `blueprintChecks`。
- 抽象规则：预览图不是提前做 PPT，而是提前做设计决策。它负责确定故事节奏、页面视觉签名、候选组件族、禁止复用骨架和复杂度预算；组件选择负责在该合同内选择、组合和参数化组件；QA 负责检查最终页是否偏离合同。
- 进入位置：LAYOUT-BLUEPRINT.md / PAGE-DESIGN-METHOD.md / VISUAL-SELECTION.md / DYNAMIC-QA.md / scaffold tools。

### 2026-07-06 - Layout preview needs color semantics and signature coverage gates
- 等级：P1
- 状态：promoted
- 触发场景：Leander-PPT 内部分享 deck 的 Gate 1.5 v7/v8 预览复查
- 原始反馈：用户指出部分红框页仍有重叠风险，输出文件太多不清楚哪些需要看；同时要求颜色使用必须有意义，不能只依赖主题色，红色、蓝色、灰色需要服务页面逻辑。
- 根因：
  - 预览 QA 只检查几何，没有把“文件分工”和“颜色语义”纳入硬门槛。
  - 低保真预览器对未覆盖的 `visualSignature` 会退回通用占位，导致 P11 这种关键机制页看似通过但表达失真。
  - 组件前置合同只定义位置和候选组件族，未定义页面强调对象和颜色角色，后续正式制作仍要重新猜“哪里该红、哪里该弱化”。
- 修复：
  - 更新 `LAYOUT-BLUEPRINT.md`，新增 Color Semantics Contract 和预览 QA 文件分工要求。
  - 更新 `PAGE-DESIGN-METHOD.md`，新增“先定颜色角色再做样式”的页面设计步骤。
  - 更新 `DYNAMIC-QA.md`，新增蓝图预览 QA 补充，要求检查几何、连接线、故事一致、颜色语义和文件分工。
  - 当前项目新增 `layout-blueprint.json.colorSemantics`，并生成 `layout-blueprint-story-v8.png`、`layout-blueprint-risk-pages-v8.png`、`layout-blueprint-preview-qa-v8.md`。
  - 预览器新增签名覆盖门槛：未覆盖的 `visualSignature` 不能自动退回通用占位并通过 QA。
- 抽象规则：Gate 1.5 预览必须同时回答三件事：这套 PPT 的故事节奏是否成立；每页视觉签名是否有专属骨架；颜色是否承担明确语义。用户只需要看 story preview 和 risk preview；合同 JSON、QA md、渲染脚本服务后续自动制作。
- 进入位置：LAYOUT-BLUEPRINT.md / PAGE-DESIGN-METHOD.md / DYNAMIC-QA.md / 当前项目 layout-blueprint.md。

### 2026-07-07 - Multi-agent roles need executable evidence gates
- 等级：P1
- 状态：promoted
- 触发场景：用户希望将 Leander-PPT 从单一 agent 流程升级为多角色协作，包括策划师、设计师、组件管理员、质检员和汇报人。
- 原始反馈：用户担心只创建多个子 agent 规格但没有实际效果，希望设计后进行校验，确认机制能运行，而不是只有形式。
- 根因：
  - 旧机制只有 reviewer 子 agent 规格和文档要求，缺少多角色分工。
  - 即使要求使用 subagent，也没有机器可检查的角色证据；`deck.js verify` 不能证明角色真的参与或 fallback 已记录。
  - 多角色如果没有所有权边界，容易导致故事、设计、组件和 QA 互相覆盖。
- 修复：
  - 新增 `references/AGENT-COLLABORATION.md`，定义角色、阶段、证据合同、fallback/bypass 规则和失败条件。
  - 新增中文角色 agent：`planner-zh.md`、`layout-architect-zh.md`、`visual-designer-zh.md`、`component-curator-zh.md`、`presenter-zh.md`，并将 `reviewer-zh.md` 设为默认 QA reviewer。
  - 脚手架新增 `agent-collaboration.json`、`agent-collaboration.md`、`tools/verify-agent-collaboration.js`，并在 `deck.js verify/build` 中启用协作门禁。
  - 新增 passing 示例，验证填写完整的角色证据可以通过；默认 pending 状态会被 gate 拦住。
- 抽象规则：多 agent 不能靠“角色名”生效，必须靠产物合同生效。每个角色要么留下具体 artifact + verdict，要么留下 fallback/bypass reason；最终构建前由脚本检查 required roles，主 agent 保留最终责任。
- 进入位置：AGENT-COLLABORATION.md / agents/*.md / SKILL.md / PRODUCTION.md / QA.md / SCAFFOLD.md / scaffold tools。

### 2026-07-07 - Agent collaboration gate must not become a decorative or overblocking gate
- 等级：P1
- 状态：promoted
- 触发场景：独立子 agent 审查新增多角色协作机制
- 原始反馈：协作机制已有接入和门禁，但仍可能只是验证 JSON；required role 可 bypass 过松；`agent-collaboration.md` 不参与校验；默认 `verify` 过早阻塞页面 QA；artifact 校验太浅。
- 根因：
  - 第一版门禁把“最终协作证据检查”和“日常页面 QA verify”绑在一起。
  - 脚本只看 JSON 状态，没有检查 Markdown 证据和 reviewer SHIP 原文。
  - required role 允许 bypass，容易使复杂 deck 形式合规。
  - wildcard artifact 直接返回 true，不能证明页面合同存在。
- 修复：
  - `deck.js verify` 改为页面 QA gate；`deck.js verify --final` 和非 draft `deck.js build` 才触发协作门禁。
  - `verify-agent-collaboration.js` 增强：required role 默认不能 bypass；fallback 也需要 verdict、summary、reason；completed 需要 evidence；Markdown 必须提到角色；reviewer completed 时 Markdown 必须包含 `结论：SHIP`；wildcard artifact 改为真实文件扫描。
  - agent frontmatter `name` 与 JSON role key 对齐，如 `planner-zh`、`reviewer-zh`。
  - visual designer 和 reviewer artifact 拆开，避免都指向 `qa.md`。
- 抽象规则：协作门禁要分阶段。工作中先保证页面 QA 可运行，最终交付前再检查角色协作证据；required role 不能轻易 bypass，fallback 可以存在但必须留下可审计证据。
- 进入位置：deck.js / verify-agent-collaboration.js / AGENT-COLLABORATION.md / SCAFFOLD.md / PRODUCTION.md / QA.md / agents frontmatter。
## 2026-07-07 - Deck gate should tolerate UTF-8 BOM in JSON contracts

- Category: process
- Defect: `deck.js verify` treated an otherwise valid `page.json` as `BAD-CONTRACT` when the file contained a UTF-8 BOM. Other scaffold tools already strip BOM, so the gate was less robust than the surrounding toolchain.
- Fix: Strip a leading BOM in `tools/deck.js` before parsing page JSON.
- General lesson: All scaffold JSON readers should normalize BOM consistently; otherwise the gate can fail for encoding artifacts rather than real contract defects.
- Promoted: no

## 2026-07-07 - Module map pages need a dedicated correspondence component

- Category: component-gap / visual-selection
- Defect: p09 "Skill 模块组成" used a page-specific custom drawing because the selector scored generic `archLayered` higher than the actual visual need. This made the page depend on manual layout and weakened the directory-to-module correspondence.
- Fix: Promoted `moduleCorrespondenceMap` into the base component library, registered it with `module-correspondence-map`, `system.module-map`, and `directory-to-module-responsibility-output` tags, rebuilt the compact component index, and updated p09 to bind the component directly.
- General lesson: Layout Blueprint should not only name a relationship; it must name the visual signature and candidate family strongly enough that component selection can do useful front-loading work.
- Promoted: LESSONS.md

## 2026-07-07 - Checkpoint approval must be machine-checkable

- Category: process
- Defect: After anchor sample QA passed, the workflow response almost jumped to Phase 4 batch production without explicit user approval. The skill prose required stopping, but there was no machine-checkable state to distinguish "QA passed" from "user approved".
- Fix: Added `checkpoint-status.json` and `tools/verify-checkpoints.js`; documented Gate 5.5; updated `deck.js` so projects marked `workflow.stage = "production"` run the Phase 4 checkpoint gate before final verify/build.
- General lesson: Stage transitions need explicit artifacts. A rendered page gate validates quality; a checkpoint gate validates user approval and production mode.
- Promoted: LESSONS.md

## 2026-07-07 - Production mode workers must not satisfy final role review

- Category: process, agent-collaboration, QA
- Defect: Mode C parallel chapter production created real page-production subagents, but the final collaboration evidence could still rely on fallback roles or older anchor-sample reviewer evidence. This made it look as if component curator, visual designer, reviewer, and presenter had participated in final deck review when they had not all run against the integrated full deck.
- Fix: Added a post-production role review gate to `SKILL.md`, `PRODUCTION.md`, `AGENT-COLLABORATION.md`, scaffold `deck.config.js`, and `verify-agent-collaboration.js`. Production-stage decks now require completed `component-curator-zh`, `visual-designer-zh`, `reviewer-zh`, and `presenter-zh` reviews with `phase="post-production"` and `full-deck` evidence.
- General lesson: Production mode and role review are separate. Page-production workers draft content; final role reviewers judge the integrated deck after render. Do not let chapter self-checks, fallback notes, or anchor reviews masquerade as final multi-agent evidence.
- Promoted: LESSONS.md
