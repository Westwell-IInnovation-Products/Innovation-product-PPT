# Lessons — Accumulated Defect Checklist

The distilled, deduplicated working set of everything this skill has been corrected on. **Read this every run** before anchor samples, before full production, and during QA — it is the pre-flight list of past mistakes so they are not repeated. The skill gets sharper with use precisely because this list grows.

- Full raw history: [`feedback/LOG.md`](feedback/LOG.md).
- True theme-independent universals graduate into [`SLIDE-CRAFT.md`](SLIDE-CRAFT.md) → Universal Output Rules. Items here marked `[graduated]` are also enforced there; the rest are the live working set.

## How this list grows

After each round of user feedback: append the raw item to `feedback/LOG.md`, then if its `Category` has recurred (≥2×) or is clearly general, add/sharpen a one-line rule here. Keep each lesson **general** (a reusable rule), never a project-specific symptom. Promote anything that is a true universal into `SLIDE-CRAFT.md` and tag it `[graduated]` here.

## Pre-flight checklist (verify the deck against each)

### Color — `color-semantics`
- [ ] Peer/equal items share **one** structural color (theme `primary`); only the single focal element gets `accent`. No decorative rainbow. `[graduated]`
- [ ] `accent` is theme-relative: Base = Westwell red, Global = azure. Red in **Global is status-only** (✗/error), never a structural highlight. Use `colors.danger` for true error, not `accent`.
- [ ] A second hue (`blue`) only for a genuine second category; if you can't name what it encodes, make it `primary`.

### Whitespace — `whitespace-fill`
- [ ] No content block pinned to the top with a dead band above the footer. Fill the body or center it so margins are symmetric. `[graduated]`
- [ ] A component that stacks N variable-height rows must **measure total height first, then offset the start** so the block is centered/filled — never start at a fixed top y and let the bottom fall where it may. (archLayered fix, 2026-06-23)
- [ ] Any text box whose height is **derived from a fixed card/row height** must clamp to a sensible minimum, or short cards collapse the body to ~6pt. Make secondary-line Y adapt to whether the optional line above it is present. (archLayered fix, 2026-06-23)
- [ ] Sparse pages get real substance (sub-points, takeaway/caveat band), never inflated empty cards or oversized fonts. `[graduated]`
- [ ] **Switching white fills → line frames does NOT fix fill-the-page.** A frame/zone stretched over little content (sparse top, dead bottom) reads just as AI-generated. Size each zone/card to its content (estimate line count), then **center the block** so margins are symmetric. (zoneGrid content-fit, 2026-06-25)
- [ ] Two sanctioned layouts when a page is light: (a) **background ground + line-frame dividers**, or (b) **text zone + graphic zone** split. Never inflate cards to span the body. Designed whitespace only. (2026-06-25)

### Typography — `typography`
- [ ] Use ONE shared **type scale** (`theme.type`: hero/h1/h2/lead/h3/bodyLg/body/bodySm/cap/micro/tiny). Same role = same size across every page; dense pages take the smaller step, airy pages the larger — never ad-hoc per-component sizes. (type-scale, 2026-06-25)
- [ ] **It's a WIDE hierarchy, not one big body size.** "该大的大、该小的小": titles/numbers big (18–25pt), but the BULK of supporting text — labels, captions, chips, table cells, in-graphic detail — genuinely small (6.5–10.5pt). Standard body ≈ 10.5pt, dense ≈ 9pt, micro labels ≈ 7pt. Use ≥4 distinct sizes per page. (type-scale corrected, 2026-06-26)
- [ ] **Do NOT "fix small fonts" by bumping everything to one larger size.** That flattens the hierarchy and makes supporting text "小字太大了实在太丑". The earlier mistake was pushing body to 15–16pt uniformly — wrong. The cactus look is big titles + lots of small fused detail; contrast (not uniform bigness) reads as 精致. (correction, 2026-06-26)
- [ ] When the user cites a reference deck for typography, **open it and read the real `sz` values** (unzip .pptx → slide XML, `sz` is pt×100). Cactus measured: titles 22pt, paragraphs 18pt, but the MAJORITY of text is 6–9pt in-graphic labels — so "before it was basically 7-8pt" is correct; honor the small end. (2026-06-26)
- [ ] A **subtitle summarizes the page's core takeaway in one concise line** (a thesis), never a colloquial restatement of the title — and don't duplicate a list that already appears in the body (e.g. dimension names). (2026-06-25)

### Text–graphic fusion — `layout-composition`
- [ ] Fuse text INTO the graphic, don't park a text block beside it. Numbers/labels live on the visual: stat = big value + tiny label stacked & hairline-separated (not a boxed chip); milestone labels on the axis; values inside tier bands / nodes / tracks. "图形 + 旁边一块文字" reads as 死板/auto-generated. (2026-06-26)
- [ ] Data stats are the clearest fusion win: render `值(大) / 标签(极小)` inline, hairline-divided — far better than uniform text in floating rounded chips. (tierLadder, 2026-06-26)

### QA must actually run — `process`
- [ ] Rendering then "glancing" is NOT the Design Review Pass. Actually walk SLIDE-CRAFT + QA + LESSONS per page (independent reviewer subagent when possible) and produce pass/fail + evidence + repairs; fix before reporting. A real review catches flat tables, false accents, dead-bottom cards, crude glyphs, placeholder text — a glance does not. (2026-06-26)
- [ ] Connector geometry, text/shape clearance, and icon semantics are hard QA gates, not polish notes. Orthogonal tree/flow diagrams must have straight horizontal/vertical connectors; labels/chips must clear strokes and nodes; library/tool icons must visually communicate the represented asset type. (2026-07-03)

### Visual variety — `layout-composition`
- [ ] **Never reuse one component 3-4× across a deck** — that's visual fatigue / AI-smell. Give every page a different visual form; mix line-frame (`editorial.js`), large illustrative metaphor (`bespoke.js`), and occasional white-card. Audit the deck for repeats before shipping. (2026-06-25)
- [ ] Avoid "every page = box with text inside" (死板). Budget **≥1 large pure-graphic page per ~3 pages** (dual-circle, hub-radial, journey, pipeline, bespoke scene line-art). Study the reference deck's actual artwork and draw per-domain glyphs from primitives, not stock icons. (bespoke.js, 2026-06-25)
- [ ] Never draw a **full-width horizontal rule near the footer** — it collides with the footer bar into a "double line". Use short flanking ticks or a framed pill for bottom statements. (lineCompare fix, 2026-06-25)

### Brand chrome — `chrome-signature` / `logo-brand` / `background-ground`
- [ ] Every content page sets the theme background; never default white. `[graduated]`
- [ ] Logo is one standard size/position from `theme.brand`, identical on every page — never hand-set per page. `[graduated]`
- [ ] Cover/header/footer/closing/**divider** all come from the active theme's **signature** (`theme.signature`), reproducing its reference template — don't hardcode one theme's look into another. On dark covers use the white wordmark, not the dark logo image.
- [ ] A chapter/divider page is a signature-aware chrome component (`sectionDivider`), one variant per theme — Base big-number, Global white-underline. Don't hand-build a one-off divider page.
- [ ] Derive a theme's line/footer/rule treatment by **measuring the reference deck** (exact hue, dotted vs solid, wordmark vs bar) — never invent it. (Global rules follow CTN/FMS: navy `#002060` dotted title rule + grey WESTWELL wordmark footer, 2026-06-23)
- [ ] To "match a reference", **measure SIZE too**, not just style: cap-height→pt for titles, exact hues for subtitles/rules. The type scale (title size, subtitle color) is a per-theme **signature** dimension, not a constant. (Global title was half FMS size until measured, 2026-06-23)
- [ ] When a specific reference detail won't match after one redraw, **open the source `.pptx`** (unzip, read slide/master XML) and take the real value or the real asset — don't eyeball-redraw a third time. A reference "line" may be a baked **image** (CTN's footer was `ppt/media/image2.png`), not a vector; its title rule had exact params (`#0070C0`/`lgDash`/0.25pt). Reuse the actual graphic. (CTN footer + title rule, 2026-06-23)
- [ ] When a chrome dimension is theme-variable (e.g. title size), the chrome must **publish its content-bottom Y** and top-aligned components must read it — never hardcode "content starts at y=N". After changing any shared chrome size, re-render the dense/diagram pages to catch new overlaps. (header() returns content-top, 2026-06-23)

### Architecture — `architecture`
- [ ] Pick the right archetype: **Type A `archLayered`** for system/technical composition; **Type B `archDualEngine`** for scenario/business collaboration. A deck may use both. `[graduated]`
- [ ] Rich, not stiff: differentiated icons (no repeated identical badges), real flow direction, a clear center; cap layers ~5; keep arrows clear of cores.

### Diagram vs text — `density` / `icon-meaning` / `layout-composition`
- [ ] Every content page has a real visual explanation (diagram/chart/image/mechanism), not title + text cards. `[graduated]`
- [ ] Icons map to concrete meaning (role/action/metric/status/module), never decoration. `[graduated]`
- [ ] Don't shrink fonts to hide crowding — reduce text, split the page, or convert to a diagram. `[graduated]`
- [ ] Generated line-art assets (e.g. a cover skyline) must be **supersampled** — draw at ≥3× then downscale (LANCZOS) for smooth strokes — and use varied, detailed elements. Uniform thick geometric shapes read as crude; study the reference deck's actual artwork. (cover art fix, 2026-06-23)

### Evidence — `data-boundary`
- [ ] Numbers/claims carry source + boundary (achieved/planned/estimate/public-reference). No invented data, logos, or customer claims. `[graduated]`

### Theme fit — `theme-fit`
- [ ] When a bundled company theme fits, offer it first; never lead with an invented style. Internal/company → Leander Base; external/international/formal → Leander Global. `[graduated]`
- [ ] Match font discipline: Base bilingual; Global English-first (Century Gothic), CJK via YaHei. Detect CJK before choosing the face so Chinese never renders in a Latin-only font.

### Component reuse — `component-gap`
- [ ] **Every content page needs a `page.json.visualSelection` contract before drawing.** Classify the relationship, check the component catalog first, then evaluate external-graphic and image2/imageSlot routes; page-specific custom is last-resort. Reviewer must fail pages that hand-draw boxes while a close component exists. (2026-07-02)
- [ ] Prefer fixing the **shared component** over a single page, so every page using it improves at once. New page-specific patterns that recur should be promoted into `components/`.
- [ ] **Before adding ANY new component, check `COMPONENT-CATALOG.md`'s canonical map.** If the archetype already exists (table, icon-grid, hub-spoke, timeline, two-option, swimlane, tiers, before/after…), **add a `variant:"fill"|"line"` flag (+ `surface3` ground) to the existing one — do NOT fork a near-duplicate.** Root cause of the editorial/bespoke bloat: ~11 of 13 "new" components were just fill→line restyles of components that already existed. A line-frame look is a *variant*, not a new component. (2026-06-26)
- [ ] When abstracting, parameterize counts and slots (spoke count, column count, an optional `img`/`icon` slot) instead of cloning a fixed-N component (hubRadial=hubSpoke@4, sceneColumns=fourColumn+img). One flexible component beats five rigid forks. (2026-06-26)
- [ ] Components must not hardcode language-specific literal strings (e.g. "联动", "AI 赋能"). Every author-facing label needs a data override with a sensible default, so one component serves a CN internal deck and an EN external deck alike. (archDualEngine fix, 2026-06-23)
- [ ] Put rendered/review deliverables in the **active deck project's `output/`** (the scaffold's output dir), never scattered at the workspace root. Don't touch the user's own files when relocating. (2026-06-23)
- [ ] Every stacked-list / multi-row component MUST advance its Y (or X) cursor each iteration. QA any such component with **≥3 items** so a missing increment (all rows on top of each other) is visible — one test item hides it. (numberedList bug, 2026-06-24)
- [ ] Top-anchored diagrams (trees, topologies) still obey Fill-The-Body: center the whole block vertically (or fill) rather than leaving bottom dead space. (orgTree centering, 2026-06-24)
- [ ] When mining a library, cover the full relationship vocabulary, not just cards: positioning (quadrant), hierarchy (pyramid/tree), geo (coverage), network (topology), media (gallery), % (rings), narrative (numbered / vertical timeline), statement (quote), conversion (funnel), decision (A/B), schedule (gantt), role-process (swimlane), value-chain (chevron), bridge (waterfall), intensity (heatmap), set-overlap (venn). One decision-tree row per pattern. (2026-06-24)
- [ ] For genuine data viz use **native** `slide.addChart("bar"|"line"|"radar"|"doughnut", …)` (editable in PPT) over hand-drawn bars; pass theme colors as `chartColors`. (2026-06-24)
- [ ] Overlapping multi-series viz (radar, area, venn) must use outline/transparency so no series hides another; solid fill is only safe for a single series. Always QA charts with ≥2 series. (radar fix, 2026-06-24)
- [ ] Tapered diagrams (pyramid/funnel) must use real `triangle`/`trapezoid` presets, NOT stacked rectangles (rectangles read as "方的/square"). Match band widths to the trapezoid's ~0.5 top-ratio (`base/2^(n-1-i)`) so the slanted edges align into a clean cone. Put labels in side cards — narrow apex/tip bands can't hold text. (2026-06-24)
- [ ] Never place text inside a `chevron`'s left notch — it gets clipped/garbled. Put stage text in a card and use the chevron only as a connector arrow. (valueChain redesign, 2026-06-24)
- [ ] For a progress %, draw a **native doughnut [value, 100−value]** (real arc) with the number cleanly overlaid in the large hole — a solid donut with a number jammed in a small hole garbles. "Too simple" feedback → add per-region detail, a callout card, and a takeaway. (ringStats/venn redesign, 2026-06-24)
- [ ] The library has an **editorial / line-frame** counterpart (`components/editorial.js`): `lineCompare`, `milestoneTimeline`, `zoneGrid`, `splitDossier`, `panelDuo`, `lineTable`. Reach for these on "背景色+线框" / "文字+图形" requests, ugly-table complaints, or when white-card density feels AI-generated. A "节奏/计划" page often wants `milestoneTimeline` (icon nodes on an axis), not a grid/swimlane gantt. (2026-06-25)

### Process — `process`
- [ ] **Confirm the page-by-page outline with the user before any theme/sample/production.** Present the page list and get explicit sign-off; do not assume "you decide" or silently jump to building. A correct deck built without the sync step is still a process failure. (2026-06-25)
- [ ] **Run the Design Review Pass after EVERY render, not once at the end.** Re-tuning one knob per complaint without re-reviewing ships regressions and quality drifts down across rounds. Each iteration: render → walk the checklist → fix overlap/dead-space/fusion fails → only then show. (2026-06-26)
- [ ] **Every new bespoke/custom component passes the same checklist before it ships** — text must never overlap a shape's stroke (integrate labels INSIDE the shape; never pin a floating chip on a circle/line), the body must fill or center, one accent focus. QA a custom graphic exactly like a library one, with ≥ real content. (fusionVenn pills-on-stroke, hubRadial sparse, 2026-06-26)
- [ ] **Mix fills with line-frames by design** — not everything is background+outline. A filled tinted ground panel behind a glyph, or a filled center node, prevents bare line-art floating in white and adds intent. Decide per page; don't default to all-outline. (2026-06-26)
- [ ] Tooling reality check before promising: **gpt-image-2 needs `OPENAI_API_KEY` or a host image tool** — else it's advisor-only (prompts, no raster). Don't promise generated illustrations you can't render; redraw vector or hand the user runnable prompts. (2026-06-26)
- [ ] **Anchor samples must include the most at-risk page types** (dense table, flow, comparison, small-text-in-graphic), not just cover+content+complex — AND explicitly probe style preference (line-frame vs card, density, font scale, whether to use real imagery). Style disagreement should surface at the cheap sample stage, not after the full deck. (root cause of multiple redo rounds, 2026-06-26)
- [ ] **Changing a shared token or component triggers a FULL re-render + review**, not just the page you were looking at. A one-knob global change (font scale, a tint, a shared component) silently alters many pages; re-review all of them. (15pt-everywhere regression, 2026-06-26)
- [ ] **Balance vector diagrams with real imagery.** An all-vector deck (every page boxes+lines) reads stiff/工程感. Plan ≥1 real screenshot / image2 illustration / photo where it adds evidence (e.g. a colored point-cloud result, a cover scene). "Every page a diagram" ≠ "every page hand-drawn shapes". (2026-06-26)
- [ ] **Complex/scene images use the reserve-slot + prompt-spec workflow** (`IMAGE-ASSETS.md`): build the page with `imageSlot` (transparent PNG **blends on the theme ground — NO white card**; vector fallback until it arrives) and emit a `<deck>-images.gpt-image-2.md` prompt list. Verify PNGs are truly transparent (RGBA/colorType 6) — a "keyed"/exported file may be opaque RGB. Don't hand-draw a realistic scene out of primitives. `[graduated]` (P5/P2/closing, 2026-06-26)

### Color / contrast — `color-semantics` (addendum)
- [ ] **A filled panel/chip ground must visibly contrast with the page background.** Never reuse a near-bg surface tint (e.g. surface2 ≈ bg) as a fill — it looks washed out / "费力". Use a dedicated ground token (Base: `surface3 #E6EAF3`) for filled grounds, or white+border for chips. (2026-06-26)

### Icon footprint — `icon-meaning` (addendum)
- [ ] Library icons have intrinsic sizes. In a small badge (<60px) pick a **contained** glyph (target/gauge/gear/shield), not a big-spoke one (`hub` draws ±42) — else the icon overflows the badge and overlaps the title/border. (P6 hub overflow, 2026-06-26)
- [ ] Abstract asset-library icons need a domain-specific visual metaphor: theme libraries should read as swatches/style sheets, component libraries as reusable blocks/grids, and image tools as image frames or prompt slots. A generic square with a label is not an icon. (2026-07-03)

### Artifact Truth / Image2 / Alignment Addendum — 2026-07-03
- [ ] Mechanism slides must match the real artifact structure. If a slide explains files/folders, inspect the actual directory before drawing; do not show conceptual files as if they exist. If a memory is embedded inside a file (e.g. `visualSelection` in `page.json`), label it that way.
- [ ] For image2 assets, inspect the actual file mode/alpha channel before placing it. A checkerboard-looking background can be baked into an RGB image; convert/crop or regenerate before using it in PPT.
- [ ] Repeated peer cards and paired result boxes must use the same text scale, vertical alignment, and baseline. Mismatched font sizes inside the same role are a QA fail, even if the text technically fits.

### Page Design Method Addendum - 2026-07-03
- [ ] Start every slide from the one-sentence message and relationship type, not from the nearest existing component. Classify the relationship first: contrast, sequence, state, toolbox, evidence, repair scope, sharing boundary, or system map.
- [ ] Run a four-route visual gate before drawing: component library, external graphic, image2/imageSlot, or page-specific custom. Custom is valid only after the other routes are considered and rejected.
- [ ] Use image2 for one simple focal metaphor or real scene only. Do not ask image2 to draw dense workflows, labels, small text, many documents, tangled cables, or multi-step logic. Keep generated images text-free and low-complexity, then explain the logic with editable PPT components.
- [ ] Build the layout skeleton before decoration: major zones, alignment rails, connector paths, peer card sizes, and text hierarchy. Decorative lines or icons that do not encode a relationship should be removed.
- [ ] QA must check geometry and type as first-class gates: straight lines must be straight, orthogonal trees must stay orthogonal, peer text sizes must match, labels must not touch strokes, and every icon must be semantically recognizable.
- [ ] When a slide explains a real skill scaffold, do not use a generic architecture component just because the relationship is `system-map`. If the message is "directory -> module -> responsibility/output", use or promote a dedicated correspondence component with source chips, output labels, and explicit color semantics. Generic layered architecture hides the artifact truth and forces page-specific custom work. (moduleCorrespondenceMap, 2026-07-07)
- [ ] Rendered QA PASS is not user approval. Stage transitions must be recorded in `checkpoint-status.json`; Phase 4 requires `node tools/verify-checkpoints.js phase4` to pass, including anchor sample approval and production mode approval. (2026-07-07)
- [ ] Production workers are not final role reviewers. Mode A/B/C only controls page-production cadence; after the full deck is integrated and rendered, production-stage decks must run real post-production `component-curator-zh`, `visual-designer-zh`, `reviewer-zh`, and `presenter-zh` reviews. Chapter workers, anchor-sample reviews, and fallback notes cannot satisfy this gate. (2026-07-07)

### Agent Role And Design Gate Addendum - 2026-07-08
- [ ] Component abstraction is relationship-first, not current-deck-semantics-first. A component used for "team collaboration" may also express context handoff or governance flow; metadata must record `relationPrimitive`, `expressionCapability`, reusable `slots`, and multiple `semanticBindings`.
- [ ] Component curator recommendations based only on current slide keywords are invalid. Score relationship fit, structure fit, slots, composability, evidence fit, and theme fit before semantic keyword fit.
- [ ] Obvious visual failures are `FIX-FIRST`, not "future polish": crooked or confusing lines, overlapped labels, peer typography mismatch, unexplained accent colors, and style-breaking color palettes must be repaired before the page is treated as review-ready.
- [ ] Every red/accent element needs a declared role: current focus, risk/problem, active step, decision/exception, or before/after contrast. If no role can be named, remove the accent.
- [ ] Every section should check for an appropriate image or external-render opportunity, but images must carry scene/evidence/metaphor value. Use image2 for simple text-free illustrations only; do not ask image2 to draw dense workflows or labeled diagrams.
- [ ] Presenter review must include page-level supplementary knowledge, not only speaking flow. For concept-evolution pages, add current research/company-action references with source or verification notes.
