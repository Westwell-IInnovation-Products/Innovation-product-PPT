# Feedback Log (append-only)

Raw history of every improvement/feedback this skill received. This is the **full record**; the distilled, deduplicated working set lives in [`../LESSONS.md`](../LESSONS.md). Universals that graduate go into [`../SLIDE-CRAFT.md`](../SLIDE-CRAFT.md) → Universal Output Rules.

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
