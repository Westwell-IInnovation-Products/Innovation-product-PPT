# Leander PPT Scaffold

A scaffold is the reusable working structure that prevents each PPT task from becoming a one-off script.

## What "Real Scaffold" Means

For Leander PPT, a real scaffold is not just instructions. It is a folder structure, theme tokens, component helpers, extraction utilities, and QA utilities that can be reused across decks.

The executable scaffold ships under the skill at `templates/leander-ppt-scaffold/` (mirrored in both `.claude` and `.codex` skill dirs). It includes theme tokens, the component libraries, icon helpers, the per-page production tooling, and output dirs.

## Per-page production model (current)

A deck is a set of **per-page folders** plus a config and a tool. The build code for each page lives in its own `page.js`, so a page can be rendered, reviewed, and repaired in isolation — and a **hard QA gate** in `tools/deck.js` refuses to assemble any page that isn't freshly rendered + reviewed.

```text
<deck-project>/
+-- source/                 original.docx / notes / extracted
+-- brief.md
+-- outline.md
+-- deck.config.js          { name, theme, fileName }
+-- theme/                  tokens.js (+ leander-global.js), assets/
+-- components/             ppt-components.js · editorial.js · bespoke.js · icons.js
+-- examples/               domain-specific bespoke graphics (copy & adapt; not core)
+-- pages/
|   +-- p01-cover/
|   |   +-- page.js         module.exports = { id, title, build(slide, ctx) }
|   |   +-- page.json       contract { id, title, component, dataBoundary, assetNeed }
|   |   +-- qa.md           per-page verdict — "Verdict: PASS" required, newer than page.js
|   |   +-- out/p01.png     isolated render of THIS page
|   +-- p02-.../ ...
+-- tools/
|   +-- deck.js             render | verify (gate) | build (gated assemble)
|   +-- deck-ctx.js         builds { ui, ed, bp, theme, pptx }
|   +-- stop-hook.js        optional Claude Code Stop-hook guard (runs the gate)
+-- output/                 <deck>.pptx + preview/
+-- qa.md                   deck-level QA summary (per-page table + reviewer verdict)
```

Pipeline: `node tools/deck.js render` → review each `pages/<id>/out/<id>.png`, set its `qa.md` `Verdict: PASS` → `node tools/deck.js verify` (gate) → `node tools/deck.js build` (assembles only fresh+PASS pages; refuses otherwise). The gate compares mtimes, so editing a `page.js` without re-render/re-review is caught automatically. Optionally wire `tools/stop-hook.js` into `.claude/settings.json` `hooks.Stop` to run the gate at completion.

> Legacy note: earlier scaffolds used `chapters/<id>/chapter.json` + a monolithic `deck.gen.js`. That is superseded by the per-page model above; "chapter/batch" in `PRODUCTION.md` now means a *group of page folders*.

## Scaffold Responsibilities

- Read theme tokens.
- Provide stable PPTX helpers.
- Provide reusable component functions.
- Provide per-page folders (`pages/<id>/page.js`) so a single page can be repaired without rebuilding the deck logic.
- Provide a `page.json` contract per page as its local truth source.
- Keep source extraction separate from final output.
- Keep external render sources together with exported PNG/SVG.
- Export slide previews for QA.
- Make it easy to regenerate after feedback.

## Scaffold Is Mandatory For Deck Output

For any multi-slide PPTX, preview deck, anchor sample, or full deck, first create a deck project scaffold. Do not generate PPTX from a loose one-off script in the working folder.

Allowed exceptions:

- A tiny one-slide experiment that the user explicitly treats as disposable.
- Inspecting or repairing an existing PPTX where no generator exists yet. In that case, create a repair note that maps the edited slide number to the source file and affected elements.

When creating a new scaffold, copy or mirror:

```text
-- theme/
-- components/
-- pages/            (one folder per page: page.js · page.json · qa.md · out/)
-- tools/            (deck.js · deck-ctx.js · stop-hook.js)
-- deck.config.js
-- output/
|   +-- preview/
-- qa.md
```

The scaffold must be the working source of truth for generation. Any temporary renderer, screenshot script, chart render, or asset extraction should live inside the scaffold under `source/`, `components/external-renders/`, or a page's own folder.

## Anti-Bypass Rules

- Do not redefine a full theme inside a page file. Put global colors, fonts, grid, logo rules, and safe areas in `theme/`.
- Do not create a component that is named only for the current case when it can be a reusable pattern. Put reusable patterns in `components/`.
- Do not place all pages in one long generator. Each page's build code lives in its own `pages/<id>/page.js`.
- Do not deliver previews from ad hoc images if the PPTX itself has not been rendered, unless the user explicitly accepts a low-confidence preview.
- Do not call a deck "template based" unless the generator imports the template/theme/component files.

## Minimal Theme Tokens

```js
export const theme = {
  fonts: { cn: "Microsoft YaHei", en: "Century Gothic" },
  colors: { bg: "...", surface: "...", text: "...", mute: "...", line: "...", primary: "...", accent: "..." },
  grid: { w: 1920, h: 1080, safe: { l: 96, t: 80, r: 1824, b: 980 } }
}
```

## Bundled Component Helpers

The bundled scaffold currently implements:

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

The next components to add should come from `COMPONENT-CATALOG.md`, especially flow/process, pyramid, positioning matrix, dashboard mockup, and image-led product pages.

## Per-Page Contract

Each page folder is the production-control boundary and the smallest repair unit.

```text
pages/<id>-<name>/
+-- page.js      module.exports = { id, title, build(slide, ctx) }
+-- page.json    { id, title, component, dataBoundary, assetNeed }
+-- qa.md        per-page verdict (Verdict: PASS, newer than page.js)
+-- out/<id>.png isolated render of THIS page
```

`page.json` is the local truth source for that page; `page.js` implements it. QA and repair reports should refer to the `pageId`.

Each `page.json` must include `component` (source), `assetNeed`, and `dataBoundary`. If a page uses a custom visual form, label its `component` as `page-specific custom` and explain in `qa.md` why an existing component was not enough.

> Legacy: earlier scaffolds used `chapters/<id>/chapter.json` + a monolithic `deck.gen.js`; that is superseded by the per-page model above. "Chapter/batch" now means a logical group of page folders.

## What Examples Are For

Example pages are not decoration samples. They are executable proof that a component works.

Each example page should show:

- What input the component expects.
- How it behaves with realistic text length.
- Whether it remains readable.
- Where images/icons/charts go.
- What QA risks to watch.

Good examples become regression tests for future decks.

## External Render Slot

External visual tools are allowed when they add information:

- ECharts for charts and dashboards.
- Three.js / Spline for 3D product or spatial scenes.
- Rive for motion-state references.
- Matter.js for simulation references.
- Mapbox for geographic or route views.

Final PPT output should insert high-resolution PNG/SVG stills and retain the external source under `components/external-renders/`.

## Self Check

- [ ] The scaffold can regenerate the PPTX from source files.
- [ ] Theme tokens are separate from slide content.
- [ ] Components are reusable and named by purpose, not case.
- [ ] Each page is its own folder `pages/<id>/` with `page.js`, `page.json`, `qa.md`, `out/`.
- [ ] `tools/deck.js` (render/verify/build) + `deck.config.js` are present.
- [ ] Every `page.json` names component source, asset need, and data boundary.
- [ ] The generator imports scaffold theme/components instead of redefining a new local theme.
- [ ] External render sources are retained.
- [ ] Preview export and contact sheet are part of the workflow.
