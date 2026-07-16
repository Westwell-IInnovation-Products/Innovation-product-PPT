# Leander PPT Scaffold

A scaffold is the reusable working structure that prevents each PPT task from becoming a one-off script.

## What "Real Scaffold" Means

For Leander PPT, a real scaffold is not just instructions. It is a folder structure, theme tokens, component helpers, extraction utilities, and QA utilities that can be reused across decks.

The executable Codex scaffold ships under the skill at `templates/leander-ppt-scaffold/`. It includes theme tokens, the component libraries, icon helpers, the per-page production tooling, and output dirs.

## Per-page production model (current)

A deck is a set of **per-page folders** plus a config and tools. The build code for each page lives in its own `page.js`, so a page can be rendered, reviewed, and repaired in isolation — and a **hard QA gate** in `tools/deck.js` refuses to assemble any page that lacks a current visual-selection contract, matching implementation binding, or fresh rendered review.

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
|   +-- page-digests.js     split render/selection/QA/source dependency digests
|   +-- verify-page-preflight.js  final route/capacity/slot/prompt/signature gate
|   +-- qa-batch.js         preserve current QA and apply one reviewer evidence matrix
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

Pipeline: for existing work, verify `state/phase-handoff.json`, run `node tools/context-pack.js --mode status`, and open only recommended reads. For a page slice use `node tools/run-phase.js page-cycle --pages <ids>`: route selection -> dynamic QA -> preflight -> deterministic lint -> incremental render -> contact sheet -> affected-page QA init -> split digest capture. Reviewer evidence is applied in one `qa-review-batch.v1`. Then run page verify, final collaboration/render-quality verify, gated build, and artifact mapping. Rendering freshness uses purpose-specific digests rather than whole-file mtimes: QA/source metadata never invalidates PNGs, selected render changes invalidate the page, and shared theme/component changes invalidate the full deck.

Before Phase 4, run `node tools/verify-checkpoints.js phase4`. The file `checkpoint-status.json` must record explicit approval or explicit bypass for plan, layout blueprint, theme, anchor sample, and production mode. If `deck.config.js.workflow.stage = "production"`, final verify/build runs this checkpoint gate automatically.

> Legacy note: earlier scaffolds used `chapters/<id>/chapter.json` + a monolithic generator. New scaffolds do not ship those files; "chapter/batch" only means a logical group of page folders.

## Scaffold Responsibilities

- Read theme tokens.
- Provide stable PPTX helpers.
- Provide reusable component functions.
- Provide per-page folders (`pages/<id>/page.js`) so a single page can be repaired without rebuilding the deck logic.
- Provide a `page.json` contract per page as its local truth source.
- Keep source extraction separate from final output.
- Keep external render sources together with exported PNG/SVG.
- Export slide previews for QA.
- Label generated artifacts so user review files and next-step inputs are not mixed together.
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
-- tools/            (deck.js · deck-ctx.js · context-pack.js · artifact-map.js · component-registry.json · select-visual-route.js)
-- deck.config.js
-- checkpoint-status.json
-- agent-collaboration.json
-- agent-collaboration.md
-- output/
|   +-- preview/
-- qa.md
```

Generate `artifact-manifest.md/json` with `node tools/artifact-map.js --write` after the first phase output; do not ship a stale manifest in the clean template.

The scaffold must be the working source of truth for generation. Any temporary renderer, screenshot script, chart render, or asset extraction should live inside the scaffold under `source/`, `components/external-renders/`, or a page's own folder.

## Anti-Bypass Rules

- Do not redefine a full theme inside a page file. Put global colors, fonts, grid, logo rules, and safe areas in `theme/`.
- Do not create a component that is named only for the current case when it can be a reusable pattern. Put reusable patterns in `components/`.
- Do not bypass the component library with page-specific boxes before running `tools/select-visual-route.js` and checking the ranked candidates from `component-registry.json`.
- Do not place all pages in one long generator. Each page's build code lives in its own `pages/<id>/page.js`.
- Do not deliver previews from ad hoc images if the PPTX itself has not been rendered, unless the user explicitly accepts a low-confidence preview.
- Do not call a deck "template based" unless the generator imports the template/theme/component files.
- Do not claim a role agent was used unless `agent-collaboration.json` records the role status, artifact, verdict, and any fallback/bypass reason.

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
+-- page.js      module.exports = { id, title, visualBinding, build(slide, ctx) }
+-- page.json    { id, title, component, dataBoundary, assetNeed, visualSelection, qaProfile }
+-- qa.md        per-page verdict (Verdict: PASS, newer than page.js)
+-- out/<id>.png isolated render of THIS page
```

`page.json` is the local truth source for that page; `page.js` implements it. QA and repair reports should refer to the `pageId`.

Each `page.json` must include `component` (source), `assetNeed`, `dataBoundary`, a current `visualSelection` generated by `tools/select-visual-route.js`, and a Chinese `qaProfile` generated by `tools/build-qa-profile.js`. Each content `page.js` must export `visualBinding: { route, name }` matching `visualSelection.selectedRoute`. If a page uses a custom visual form, label its `component` as `page-specific custom` and explain in `visualSelection` + `qaProfile` + `qa.md` why an existing component, external graphic, or image slot was not enough.

> Legacy: chapter/batch means a logical group of page folders. Do not reintroduce a parallel chapter folder tree or monolithic generator.

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
- [ ] `tools/deck.js` (render/verify/build), `tools/select-visual-route.js`, `tools/component-registry.json`, and `deck.config.js` are present.
- [ ] `tools/context-pack.js` is present; use it before opening long references in existing scaffold work.
- [ ] `tools/artifact-map.js` is present; run it with `--write` after each phase output or feedback round.
- [ ] `artifact-manifest.md/json` distinguish `user-confirm`, `next-input`, `internal-evidence`, `final-output`, and `archive-reference`.
- [ ] `checkpoint-status.json` and `tools/verify-checkpoints.js` are present; Phase 4 is blocked until anchor sample and production mode are explicitly approved.
- [ ] `tools/component-index.min.json` exists or can be regenerated with `tools/build-component-index.js` for compact component reads.
- [ ] `tools/build-qa-profile.js` is present, and every page has `page.json.qaProfile.version = "qa-profile.zh.v2"`.
- [ ] Every rendered page has hash-matched `qa-result.json`; `qa.md` is a generated Chinese summary rather than the source of truth.
- [ ] `tools/verify-agent-collaboration.js` is present; if `deck.config.js.agentCollaboration.enabled` is true, `agent-collaboration.json` has no pending required roles, no unapproved required bypasses, and `agent-collaboration.md` contains reviewer evidence before final build.
- [ ] Every `page.json` names component source, asset need, and data boundary.
- [ ] Every content page's `page.json` has current `visualSelection.engineVersion`, ranked candidates, and `selectedRoute`.
- [ ] Every content page's `page.js` exports matching `visualBinding`.
- [ ] The generator imports scaffold theme/components instead of redefining a new local theme.
- [ ] External render sources are retained.
- [ ] Preview export and contact sheet are part of the workflow.
