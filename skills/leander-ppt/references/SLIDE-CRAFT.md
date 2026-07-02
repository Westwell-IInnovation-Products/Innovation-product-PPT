# Slide Craft

This is the single required craft guide for producing or editing slide pages.

## Contents

- [When To Read](#when-to-read)
- [This Is PPT, Not A Text Summary](#this-is-ppt-not-a-text-summary)
- [Slide-Making Decision Tree](#slide-making-decision-tree)
- [Typography And Layout Rules](#typography-and-layout-rules)
- [Designed Whitespace Vs Empty Space](#designed-whitespace-vs-empty-space)
- [Anti AI Visual Fingerprints](#anti-ai-visual-fingerprints)
- [Anchor Sample Rules](#anchor-sample-rules)
- [Self Check](#self-check)

## When To Read

Read this file every time you create anchor sample slides or implement a batch of final slides.

For full production or feedback repair, also read `PRODUCTION.md`. It defines how to isolate pages, batches, and chapters.

## This Is PPT, Not A Text Summary

A good PPT page makes the audience see the relationship, mechanism, contrast, or conclusion. A page made of title + paragraph + several text cards is usually not enough.

Each content page needs a real visual explanation:

- Flow: nodes, arrows, checkpoints, handoff.
- Comparison: before/after, option A/B, competitors, source/target.
- Timeline: stages, milestones, maturity path.
- Matrix: two axes, quadrants, priority map.
- Layered architecture: stack, platform, dependency, data flow.
- Evidence board: numbers, source labels, caveats.
- Dashboard mockup: metrics, status, panels.
- Image-led page: real product, site, screenshot, or generated placeholder with clear caption.
- Big-word + card matrix: designed whitespace on one side, dense supporting cards on the other.
- Four-column mechanism: equal columns with number, title, icon/diagram, and conclusion.

## Slide-Making Decision Tree

Before drawing a page, answer these five questions:

1. What is the one sentence the audience should remember?
2. What relationship must be seen: sequence, hierarchy, contrast, cause-effect, evidence, or system map?
3. What can be removed from text and converted into shape, icon, number, axis, or image?
4. Is this a designed-whitespace page or a full-content page?
5. What is the data boundary: achieved, planned, estimate, public reference, or unknown?

Then choose the page form.

| Relationship | Prefer |
|---|---|
| Sequence / process | horizontal or circular flow with arrows |
| System architecture (what it's made of) | `archLayered` (Type A): top-down layered bands + module rows |
| Scenario architecture (how it collaborates) | `archDualEngine` (Type B): dual core ✕ + wings + AI base |
| Hierarchy / org / decomposition | `orgTree` (2-level tree + grandchild chips) |
| Network / deployment topology | `topology` (cloud-edge-device nodes + links) |
| Geographic / site coverage | `coverageMap` (region + hub + plotted sites + list) |
| Vertical milestone timeline | `timelineVertical` (axis + dated cards) |
| Numbered narrative points | `numberedList` (big index + title + desc) |
| 2×2 positioning | `quadrantMatrix` (axes + quadrants + plotted dots) |
| Priority / importance tiers | `priorityPyramid` (apex = most important) |
| Conversion / narrowing | `funnel` (narrowing bands + values) |
| Percentage outcomes | `ringStats` (rings + centered %) |
| A vs B decision | `twoOptionCompare` (two columns + VS + recommended) |
| Image / screenshot showcase | `imageGallery` (framed cells + captions) |
| Annotated screenshot / diagram | `annotatedDiagram` (image + numbered markers + legend) |
| Key statement / testimonial | `quoteHighlight` (big centered pull-quote) |
| Schedule / project plan | `gantt` (tasks × periods + bars + milestones) |
| Role-based process | `swimlaneProcess` (role lanes × phase columns) |
| Value / process chain | `valueChain` (overlapping chevrons) |
| Contribution / value bridge | `waterfall` (start + deltas + end) |
| Intensity matrix (risk/priority) | `heatmap` (tinted cells + legend) |
| Multi-dim capability compare | `radar` (native chart, marker style) |
| Set overlap / intersection | `venn` (translucent circles) |
| Trend over time | `lineChart` (native) |
| Category comparison | `barChart` (native) |
| Composition / share | `pieBreakdown` (native doughnut + list) |
| Four parallel values | four-column mechanism |
| Parallel capabilities (5-6) | `featureGrid` (icon feature cards) |
| Three products / pillars | `pillarTrio` (icon circle + name + desc + sub-points) |
| Two-sided tradeoff | split comparison or before/after |
| Option / competitor comparison | `capabilityMatrix` (table: ✓ / level-dots / text, focal column) |
| Layered deployment (云-边-端 / platform tiers) | `tierStack` (tier label rail + component chips) |
| Categorized enumeration (needs / pains / capabilities) | `bulletColumns` (category columns + conclusion banner) |
| Strategic judgement | big-word + card matrix |
| Metrics / quantified evidence | metric cards + formula / caveat band |
| Quantified scale (a few headline numbers) | `statBand` (big numbers + dividers + note) |
| Product capability | system diagram + capability callouts |
| Roadmap / delivery | timeline + milestones + risks |
| Risks / gaps | heat map, priority stack, red highlight |

## Typography And Layout Rules

- Chinese font: `Microsoft YaHei` / `微软雅黑`.
- English and numbers: `Century Gothic` when available.
- Type is a **wide hierarchy**, driven by the shared `theme.type` scale: titles/numbers big (~18–25pt), but the bulk of supporting text — labels, captions, chips, table cells, in-graphic detail — genuinely small (~6.5–10.5pt). Standard body ≈ 10.5pt, dense pages ≈ 9pt, micro labels ≈ 7pt. Use ≥4 distinct sizes per page; contrast (not uniform bigness) reads as refined.
- Do not solve crowded slides by shrinking text blindly. Reduce text, split pages, or convert to diagrams.
- Keep all content inside the safe area. For 16:9 1920x1080 design, use approximately `x=96..1824`, `y=80..980`.
- Make the visual center feel centered unless the page intentionally uses left/right composition.
- Use fill for emphasis, data panels, badges, and focal blocks. Use lines and whitespace for separation and structure. Do not use all-fill or all-line pages by habit.
- Icons must carry meaning: role, action, metric, status, module, risk, or asset. Do not add icons as decoration only.

## Color Semantics — Color Must Encode Meaning

This is a hard rule. The most common AI-smell defect is color used for decoration: items differ in color, but the color difference means nothing. Reviewers must reject it.

- **Default everything to one structural color** (in Leander Base: deep navy `primary`). Peer items — four equal values, six equal metrics, sequential stages of one process — all use the same color. Sameness is correct when the things are the same.
- **Reserve the accent (red) for the single most important element on the page** — the one headline number, the focal layer, the current step, the one card you want the eye to land on. If everything is accented, nothing is. Aim for one accent focus per page.
- **Semantic colors map to fixed meanings only**: green = best / positive / success; amber = warning / caution; red = error / blocking / focal emphasis. Never use green/amber/red for a category that is not success/warning/error.
- **A second hue (e.g. blue) is allowed only for a genuine second category**, not for variety. If you cannot name what the second color *means*, delete it and use the structural color.
- **Encode real relationships with color**: emphasis (focal vs context), weight/progression (filled vs outlined, dark vs light of one hue), status (ok/warn/error). Do not rotate colors per item like a rainbow.
- Before shipping a page, for every distinct color ask "what does this color tell the audience?" If the answer is "it's just different," it fails.

## Designed Whitespace Vs Empty Space

Whitespace is valid only when it supports a focal point.

Designed whitespace usually has:

- A large keyword, number, or image.
- A short explanation.
- A clear dividing line or color bar.
- Supporting cards, diagram, or evidence on the other side.

Empty space usually has:

- Small text floating alone.
- Sparse cards with little content.
- No visual hierarchy.
- No diagram explaining the page.

Empty-space pages must be redesigned.

### Fill The Body, Or Center It

The most common whitespace defect is a content block pinned to the top of the page with a large dead gap above the footer. This reads as AI-generated. A component must do one of:

- **Fill the body safe area** (roughly `y≈210..950` below the header): size cards and spacing so content reaches the lower third. Enrich sparse pages with sub-points, a short example line, or a bottom takeaway/caveat band rather than leaving the bottom empty.
- **Or center the block vertically** so the top and bottom margins are roughly equal. Symmetric breathing room reads as designed; a big bottom-only gap reads as a bug.

When a page genuinely has only a few short items (e.g. a 4-item agenda), add real substance (sub-bullets, the chapter's contents) or center the block — do not stretch a thin row across the top and leave the rest blank. Never solve emptiness by enlarging fonts past the type scale.

## Anti AI Visual Fingerprints

Avoid:

- Generic title + paragraph + three cards on every page.
- Decorative gradient blobs, meaningless background ornaments, or fake visual complexity.
- Random icons that do not map to content.
- Huge rounded cards with little content.
- Tiny text used to hide weak structure.
- Fake data, fake logos, or claims without source/boundary.
- Overusing one layout across the whole deck.

## Universal Output Rules

Non-negotiable, theme-independent. The most common quality failures are systemic, not page-specific.

### Color must encode meaning

Color is a semantic channel, not decoration. Never vary color for visual variety.

- One structural default (Leander Base: navy `primary`) for all peer/equal elements.
- Reserve the brand accent (Leander Base: Westwell red) for the single focal element per page — at most one. If nothing is focal, use none.
- A second hue only for a genuine second category, never for alternation.
- Status colors carry fixed meaning: success/best = green, warning = amber, error/blocking = red, neutral/inactive = grey. Use only for those.
- Test: for every color difference, name what it encodes (focus, category, sequence, status, weight). If you cannot, make them the same color.
- Anti-pattern: N equal cards cycling accent/navy/blue. Equal cards = one color.

### Cards fit content; leftover space becomes symmetric margin

Meaningless internal whitespace (half-empty card, dead band at the bottom) is the top AI-smell signal.

- Size a card/panel to its content; do not fix a tall height and let content float at the top.
- Compute block height from item/row count, then vertically center the block in the body so leftover space becomes equal top/bottom breathing room.
- Symmetric margins = designed whitespace (fine). Asymmetric dead space = defect (redesign).
- If content is genuinely sparse, enrich it (sub-points, takeaway band, inline detail) rather than inflating empty boxes.
- **Line frames are not a loophole.** Switching a white fill to a line-frame/outline does not fix fill-the-page — a frame stretched over little content (sparse top, dead bottom) reads just as AI-generated. The fit-content-then-center rule applies to frames exactly as to filled cards.
- **Two sanctioned layouts for a light page:** (a) background ground + line-frame dividers, or (b) a text zone + a graphic zone split. Never stretch cards/frames to span the whole page. (See `editorial.js`.)

### Typography uses one shared scale

- Drive every text size from a single **type scale** token (`theme.type`: `hero/h1/h2/lead/h3/bodyLg/body/bodySm/cap/micro/tiny`), not ad-hoc numbers. The same role (page title, card title, body, caption) uses the same size on every page; dense pages take the smaller step, airy pages the larger — harmony comes from the shared scale, not per-page guesses.
- **Calibrated to the cactus reference deck (measured `sz` values): section/card titles ~20–22pt, lead ~15–18pt, standard body ~10.5pt, dense body ~9pt, and the MAJORITY of text — in-graphic labels, chips, table cells — 6.5–7.5pt.** (design-px = pt×2, `pxPerPt:2`, so body = 21px → 10.5pt.) Drive every size from `theme.type` (`hero/h1/h2/lead/h3/bodyLg/body/bodySm/cap/micro/tiny`); never hardcode ad-hoc point sizes.
- **Do NOT "fix small fonts" by bumping everything to one size** — that flattens the hierarchy and makes supporting text look oversized/ugly ("小字太大了实在太丑"). Detail labels are *meant* to be small (6.5–9pt); the reject is text that's unreadable for its role or disproportionate to its container, not smallness itself. When the user cites a reference for "fonts feel small/refined", open it and read the real `sz` values rather than guessing — big titles + lots of small fused detail is what reads as 精致.
- A **subtitle is the page's one-line thesis** — it summarizes the core takeaway, never a colloquial restatement of the title.

### Vary the visual form every page

- **Never reuse one component 3–4× in a deck.** Repeating the same template across pages is visual fatigue and reads as auto-generated. Give each page a different form and audit for repeats before shipping.
- Avoid "every page = a box with text inside" (死板/lifeless). Mix three registers: **line-frame structure** (`editorial.js`), **large illustrative metaphor** (`bespoke.js`: dual-circle, hub-radial, journey path, pipeline, tier ladder, resource board, action tracks, bespoke scene line-art), and the occasional white-card. Budget **≥1 large pure-graphic page per ~3 pages**. Study the reference deck's actual artwork; draw per-domain glyphs from primitives rather than dropping in stock icons.

### Every page establishes the theme ground

- Every content page sets the theme background; never rely on default white. A page whose background differs from cover/section pages is a defect.

### Brand chrome is single-sourced

- Logo size/position is one standard value in theme tokens, applied identically on cover, content, and back cover. Never hand-set logo size per page. Match the source template (Leander Base ≈ 90px wide on a 1920 canvas).

## Anchor Sample Rules

Before full-deck production, create 2-3 real editable PPTX sample pages:

1. Cover or tone-setting page.
2. A normal high-density content page.
3. The most complex diagram or mechanism page.

The sample must be good enough for the user to judge final quality. Do not make a wireframe and call it a sample.

## Page Isolation Rules

A slide page is the smallest design and repair unit.

- Give every page a stable `Page ID` from `outline.md`.
- Keep page-specific layout logic together in one named slide function or clearly marked slide block.
- Use reusable components for repeated patterns, but do not hide page-specific content inside global theme files.
- If feedback affects one page, repair that page only unless the defect comes from a shared component.
- If feedback affects a repeated component, fix the component and re-render every page that uses it.
- Do not change page order, chapter structure, or claims while doing visual repairs unless the user approves it.

## Self Check

Run this for every anchor page and after each final slide batch.

- [ ] The page ID and page number match `outline.md`.
- [ ] The page has one clear takeaway.
- [ ] The page has a real diagram or visual explanation, not just text cards.
- [ ] Text size is readable and not artificially shrunk.
- [ ] Visual weight is centered or intentionally composed.
- [ ] Whitespace is designed, not empty.
- [ ] Fills, lines, icons, and images each have a reason.
- [ ] Claims have clear boundaries.
- [ ] No element is outside the safe area or clipped.
- [ ] No text overlaps shapes, arrows, icons, or other text.
- [ ] The page would still make sense if the presenter paused on it for 20 seconds.
