# PPT Production Modes

This file is the single required guide for producing full decks after the anchor sample is approved, and for repairing generated decks after feedback.

## When To Read

Read this file only when:

- The user approved anchor sample pages and asks to continue to full production.
- The user asks to generate many slides from an approved outline.
- The user gives feedback on existing generated slides.
- The deck is long enough to need chapter, batch, or parallel work.

Do not read this file during initial brief or outline work.

## Context Entry Rule

For an existing scaffold, build a compact state packet before opening long references or many page files:

```bash
node tools/context-pack.js --mode status
```

For a page or batch repair:

```bash
node tools/context-pack.js --mode repair --pages p11,p12
```

Use the packet as the default context boundary. Open only the page files, route contracts, QA notes, and component docs named by `recommendedReads` unless the repair changes shared theme tokens, shared components, story structure, or final delivery gates.

## Artifact Label Rule

After every phase output, batch production, feedback repair, or final delivery, update the artifact manifest:

```bash
node tools/artifact-map.js --write
```

Use `artifact-manifest.md` when reporting to the user. Separate:

- `user-confirm`: files the user should inspect or approve now.
- `next-input`: files kept for the next production, repair, QA, or agent step.
- `internal-evidence`: QA/render/role evidence; useful for audit, not usually for user confirmation.
- `final-output`: deliverable PPTX or final package.
- `archive-reference`: long-term memory/history.

Do not make the user decide which generated files matter. The workflow owns that classification.

## Production Unit Model

Leander PPT has three production units:

| Unit | Use for | Isolation rule |
|---|---|---|
| Page | Single-slide creation or repair | Edit only the target slide function or slide object |
| Batch | 3-6 related pages | Keep batch pages aligned to the same chapter and component language |
| Chapter | A logical section from `outline.md` | Work from one chapter slice of the outline, not the whole deck |

Default unit:

- Small deck: page or batch.
- Long deck: chapter.
- User feedback: smallest affected page set.

## Mandatory Preflight

Before producing any PPTX page, confirm these items exist:

- `brief.md` and `outline.md`.
- `tools/artifact-map.js`, or the scaffold equivalent, so current outputs can be labeled for user confirmation and next-step handoff.
- Approved or explicitly chosen theme/template.
- Deck project scaffold with `theme/`, `components/`, `pages/`, `tools/deck.js`, `deck.config.js`, and `output/`.
- One page folder per outline page: `pages/<id>/{page.js, page.json, qa.md, out/}`.
- `page.json` for each page (the per-page contract), generated from the approved outline, including `visualSelection` and Chinese `qaProfile` for content pages.
- If agent collaboration is enabled: `agent-collaboration.json` and `agent-collaboration.md`, with role evidence or fallback/bypass reasons.
- Anchor sample PPTX and rendered PNGs, unless the user is only asking for outline/theme work.
- `checkpoint-status.json` says the anchor sample is approved or explicitly bypassed, and production mode is approved.

If any item is missing, create or request it before producing slides. Do not silently continue with a one-off script.

## Page Isolation (current model)

The isolation unit is the **per-page folder** `pages/<id>/{page.js, page.json, qa.md, out/}`. A "chapter" or "batch" is a *logical grouping* of those page folders (by outline chapter) used for production sequencing and review — not a separate folder tree. Page order = sorted folder names under `pages/`.

```text
pages/
+-- p01-cover/      page.js · page.json · qa.md · out/p01.png
+-- p02-context/    page.js · page.json · qa.md · out/p02.png
+-- p03-product/    ...
```

Each page folder is the production-control unit. `page.json` is its local contract (`id, title, component, dataBoundary, assetNeed, frameworkLayer, mechanismLayer, expressionMode, implementationStatus, screenshotSlots, visualSelection, qaProfile`); `outline.md` owns the global story and each page's takeaway/visual intent. Without per-page folders, minimum-unit repair and the `tools/deck.js` QA gate are not available.

> Legacy: chapter/batch below means a group of page folders. New scaffolds do not include a parallel chapter tree or monolithic generator.

## Local Truth Source

In the per-page model the local truth source is each page's `page.json` (plus that page's row in `outline.md` for takeaway/visual intent). It plays the role `chapter.json` did in the legacy model.

`page.json` fields:

```json
{
  "id": "p01",
  "title": "Opening",
  "component": "cover",
  "dataBoundary": "none",
  "assetNeed": "none",
  "frameworkLayer": "执行编排",
  "mechanismLayer": "阶段 Gate 与人工确认",
  "expressionMode": "mechanism-diagram",
  "implementationStatus": "implemented",
  "implementationEvidence": ["checkpoint-status.json"],
  "screenshotSlots": [],
  "visualSelection": {
    "intent": "Opening tone page",
    "relationship": "cover",
    "candidateRoutes": [],
    "selectedRoute": { "route": "theme-chrome", "name": "cover" },
    "rejectedRoutes": [],
    "reviewFocus": ["Theme fit", "Title hierarchy", "Brand chrome"]
  }
}
```

Rules:

- `outline.md` owns the global story and each page's takeaway + visual intent.
- `page.json` owns the local build contract for a page (component source, data boundary, asset need).
- `page.json.visualSelection` owns the visual route decision: component-library, external-graphic, image2/imageSlot, or page-specific custom. Read `VISUAL-SELECTION.md`.
- `page.json.qaProfile` owns the Chinese dynamic QA contract: universal checks, relationship checks, route checks, component checks, content checks, and evidence checks. Read `DYNAMIC-QA.md`.
- `frameworkLayer` and `mechanismLayer` keep first-layer concepts and concrete mechanisms separate.
- `expressionMode` decides the page's presentation mode before component selection.
- `implementationStatus` and `implementationEvidence` prevent proposed mechanisms from being presented as implemented.
- `screenshotSlots` reserve real evidence early and must be honored by blueprint and page implementation.
- `page.js` implements them; it should not silently change title, takeaway, visual intent, or data boundary.
- QA and repair reports should refer to the `pageId` (`pages/<id>/`).
- If the global outline changes, update the affected `page.json` / `page.js` before production continues.
- If a page changes visual form during implementation, update `page.json` (and the outline row) first, or record the approved reason in the page's `qa.md`.

## Visual Selection Before Drawing

Before implementing or repairing a content page:

1. Read that page's `outline.md` row: takeaway, visual intent, data boundary, and asset need.
2. Classify the relationship the audience must see: sequence, hierarchy, contrast, state, system-map, toolbox, evidence, scene, decision, or lifecycle.
3. Check `COMPONENT-CATALOG.md` and the scaffold's `components/` for matching archetypes. Prefer adapting/extending an existing component over hand-drawing.
4. Evaluate all four routes in `VISUAL-SELECTION.md`: component-library, external-graphic, image2/imageSlot, and page-specific-custom.
5. Write the decision into `page.json.visualSelection`.
6. Run `node tools/build-qa-profile.js pages/<id>/page.json --write` to generate Chinese dynamic QA checks.
7. Run `node tools/verify-design-gates.js pages` before rendered QA/build to ensure design rules reached `page.json` and `qaProfile`.
8. Only then implement or finalize `page.js`.

If the page has `expressionMode = screenshot-evidence`, do not start with a generic component. First decide the screenshot frame, crop, explanation anchor, and redaction boundary. If the page has `expressionMode = big-typography`, do not force a chart or card grid.

Page-specific composition is the default for content pages. If a close component exists (`stateFlow`, `workflowConfig`, `pipelineFlow`, `featureGrid`, `hubSpokeCapability`, etc.), use it as the body block inside the composed page; using a component verbatim as the whole page is a quality-floor violation outside covers and section dividers.

## Anchor Before Scale

The first production proof is not a wireframe. It must be a real editable PPTX sample.

1. Build 2-3 anchor pages: cover/tone, dense content page, hardest diagram page.
2. Render anchor pages to PNG.
3. Run self-check and, when enabled, record `visual-designer-zh` evidence or fallback in `agent-collaboration.json`.
4. Fix fail items.
5. Stop for user approval.

Only after approval may the skill enter full production.

Run this before any Phase 4 page production:

```bash
node tools/verify-checkpoints.js phase4
```

If the gate fails, stop at the checkpoint. Do not treat rendered QA PASS as user approval.

Anchor samples must be produced from the same scaffold, theme tokens, and component library intended for the full deck. A visually similar but separate one-off script does not count as an approved anchor.

## Full Production Modes

Choose one mode at Checkpoint Plan or before Phase 4.

Mode A/B/C only decide how pages are produced. They do not decide which specialist roles are active. Roles are triggered by `workflow.events`; anchor and full-deck render require visual-designer and reviewer evidence, while component/presenter roles depend on component confidence, shared changes, deck type, and rehearsal needs.

### Mode A - Chapter/Batch Confirmation

Use this when quality and alignment matter most.

Flow:

```text
Batch or chapter 1 -> render -> self-check -> user review
Batch or chapter 2 -> render -> self-check -> user review
...
Full integration -> full render -> event-triggered role review -> final user review
```

Use it when the user explicitly wants to inspect each chapter or when narrative/visual uncertainty remains high. It has the lowest rework risk but the highest repeated-context cost.

For each Mode A batch, use `workflow.stage = "production-batch"`, set `workflow.activePages` to only the current page folders, and set `batchFileName` to a stable batch output. Generate `output/current-batch-contact-sheet.svg` and stop for user review. Switch to `workflow.stage = "production"` only after all batches are integrated; this is when full-deck role gates and final delivery apply.

### Mode B - Sequential Full Deck

This is the recommended default after the user has approved a stable outline, blueprint, theme, and anchor style. It preserves the same final quality lock while avoiding repeated batch context and QA.

Flow:

```text
Batch/chapter 1 -> batch/chapter 2 -> ... -> full render -> full QA -> event-triggered role review -> user review
```

The main agent implements sequentially. Do not use this mode if the sample style is still unsettled.

### Mode C - Parallel Chapter Production

Use this only when subagents are available and the deck can be partitioned by chapter.

Flow:

```text
Main agent owns: outline, theme tokens, anchor sample, final integration, final QA
Subagents own: isolated chapter or batch drafts
Main agent merges, normalizes, renders, fixes, runs event-triggered role review, and reports
```

Parallel work is allowed only after anchor sample approval.

Each subagent prompt must include:

- The exact page range from `outline.md` (the batch of pages assigned).
- The page-folder paths (`pages/<id>/`) and each page's `page.json`.
- `references/SLIDE-CRAFT.md` path.
- `references/VISUAL-SELECTION.md` path.
- `references/VISUAL-COMPOSITION.md` path when visual/component decisions are needed.
- `references/QA.md` path.
- `references/DYNAMIC-QA.md` path and affected `page.json.qaProfile`.
- Current theme/template tokens.
- Approved anchor sample screenshots or PPTX path.
- Component catalog path if components are expected.
- Explicit instruction not to modify unrelated pages or global theme files.

Expected risk: chapter styles may differ. The main agent must normalize typography, spacing, component use, header/footer rhythm, and claim labels before final delivery.

Mode C hard rule: chapter/batch production workers are not role-review agents. A subagent that drafts pages or performs batch self-check does not satisfy `component-curator-zh`, `visual-designer-zh`, `reviewer-zh`, or `presenter-zh` final evidence. After Mode C integration, run those role agents again against the full rendered deck and record `phase: "post-production"` evidence.

## Capability Use Protocol

Use extra agents only where they improve isolation or review quality.

| Capability | Use when | Do not use when |
|---|---|---|
| Main agent | Anchor samples, theme choice, final integration, final QA, user-facing decisions | Never delegate final accountability |
| Planner agent | Complex source-to-outline work, story review, page intent review | When only repairing a visual defect |
| Layout architect agent | Long deck layout blueprint, visual signature review, preview-risk review | Tiny decks or no layout change |
| Visual designer agent | Anchor sample style, color semantics, visual polish, high-risk page style review | Pure content edits |
| Component curator agent | Visual route/component-library decisions, reusable component promotion | When page route is already approved and unchanged |
| Reviewer agent / Agent Teams | Independent QA of outline, sample pages, full deck, or repaired pages | Not needed for trivial text-only metadata changes |
| Presenter agent | Final rehearsal, speaker flow, internal sharing readiness | Before the deck has passed rendered QA |
| Subagent production | Mode C parallel chapter/batch production after anchor approval | Before anchor approval, or when deck style is unsettled |
| Subagent review | Reviewer teams unavailable but independent QA is valuable | When no rendered artifact exists yet |
| Current-agent self-check | Fallback when no reviewer/subagent is available | Never replace render-based QA with a glance |

The main agent must always own:

- `brief.md` and `outline.md` final structure.
- Theme/template selection.
- Anchor sample approval handoff.
- Shared component and theme changes.
- Final merge, rendered QA, and user report.

Subagents may own:

- One role-specific review or planning artifact.
- One isolated chapter.
- One batch of adjacent pages.
- One independent review pass.

Subagents must not own:

- Full-deck structure changes.
- Shared theme/token changes.
- Final deck acceptance.
- User-facing conclusion.

## Agent Collaboration Evidence

When role-based collaboration is enabled, update `agent-collaboration.json` after each role contributes:

- `planner-zh`: after outline/story review.
- `layout-architect-zh`: after layout blueprint review.
- `visual-designer-zh`: after anchor/style review.
- `component-curator-zh`: after route/component decision review.
- `reviewer-zh`: after each rendered QA pass.
- `presenter-zh`: after final rehearsal review, if used.

Run:

```bash
node tools/deck.js verify --final
```

before final build. During normal page work, use `node tools/deck.js verify` to check only page QA; final collaboration evidence is checked by `node tools/deck.js verify --final` and non-draft `node tools/deck.js build`.

If a required role was not run by a real subagent, set `status` to `fallback`, write a clear `reason`, and still provide `verdict`, `summary`, and `evidence`. Do not mark a required role as `bypassed` unless the deck config explicitly allows required bypass for a small/simple deck.

Production-stage exception: when `deck.config.js.workflow.stage = "production"` and `agentCollaboration.requirePostProductionRoleReview` is not `false`, fallback is not allowed for the final `component-curator-zh`, `visual-designer-zh`, `reviewer-zh`, or `presenter-zh` checks. These roles must be `status: "completed"`, `phase: "post-production"`, and their evidence must mention `full-deck`. Anchor-sample reviews, page-production workers, and main-agent fallback cannot satisfy this final gate.

## Minimum-Unit Repair Protocol

When feedback identifies slide problems, repair the smallest affected unit.

1. Locate the slide number(s) and page id(s) (`pages/<id>/`), and the `page.js` that produced them.
2. Classify the issue:
   - content error
   - layout/clipping/overlap
   - typography/readability
   - visual form/component mismatch
   - asset/image problem
   - claim/source boundary problem
3. Patch only the affected slide(s) unless the issue is global theme or repeated component behavior.
4. Regenerate affected PPTX.
5. Re-export affected pages, plus contact sheet when rhythm or consistency may change.
6. Run QA on repaired pages.
7. Report what changed and what was not touched.

Do not regenerate or redesign the full deck for feedback on one page unless the user asks or the root cause is a shared component/theme bug.

## Repair Scope Decision Tree

| Feedback type | Repair scope |
|---|---|
| Typo, wording, one label | Target page only |
| One page layout off-center, clipped, too small | Target page only |
| Repeated card style too small across many pages | Shared component, then affected pages |
| Font, color, safe area wrong globally | Theme token or helper, then affected pages/full preview |
| Chapter logic wrong | Chapter batch and outline checkpoint |
| Page order or storyline wrong | Outline revision checkpoint before production |
| User says "make the whole deck more like sample X" | New anchor sample or theme checkpoint, not blind full rewrite |

If scope is unclear, inspect affected pages first and choose the smallest plausible scope. Escalate only when the same root cause appears on multiple pages.

## Shared Component Repair

If a defect comes from a reusable component:

- Fix the component helper once.
- Regenerate all pages that use it.
- Inspect at least all affected pages.
- State that the fix was component-level.

## Isolation Rules

- Use per-page folders (`pages/<id>/`) for every deck; group them into batches/chapters logically for long decks.
- Keep each `page.json` in sync with `outline.md`.
- Keep page-specific logic in its `page.js` build function, not in shared files.
- Keep theme tokens separate from page content.
- Keep component helpers reusable and generic.
- Import approved theme and components from scaffold files; do not redefine a new palette or layout system inside a page script.
- Keep external-render source files next to their exported PNG/SVG stills.
- Do not let one page patch rewrite unrelated pages.
- Do not modify the outline during production unless the user approves a structure change.
- Do not let subagents change shared component files unless explicitly assigned.

## Production Self Check

Before reporting any batch/chapter/page as complete:

- [ ] The unit matches its `outline.md` slice.
- [ ] The unit matches its `page.json` contract and its `outline.md` row.
- [ ] Every content page has `page.json.visualSelection` and its implementation follows the selected route.
- [ ] Every page has Chinese `page.json.qaProfile`, and review notes answer its checks.
- [ ] Page titles and framework labels pass `node tools/verify-terminology.js` when `terminology.json` exists.
- [ ] State/memory claims pass `node tools/verify-state-memory.js` when the deck discusses state, memory, recovery, or continuation.
- [ ] Page contracts pass `node tools/verify-design-gates.js pages`; design rules are not only written in `DESIGN.md`.
- [ ] Screenshot slots, expression mode, implementation status, and evidence boundaries are reflected in page design.
- [ ] If agent collaboration is enabled, `agent-collaboration.json` has no pending required roles, no unapproved required bypasses, and `node tools/deck.js verify --final` passes.
- [ ] If `workflow.stage` is `production`, all roles triggered by current events have V2 run IDs, input/output hashes, real artifacts and valid verdicts; reviewer is always required, presenter is required for internal sharing.
- [ ] `node tools/artifact-map.js --write` was run after the latest output, and the user report separates confirmation files from next-step inputs.
- [ ] Component-library, external-graphic, and image2/imageSlot routes were considered before any page-specific custom route.
- [ ] The visual form matches the page relationship, not just the title.
- [ ] The unit uses approved theme/template and anchor style.
- [ ] The unit imports scaffold theme/components instead of using a one-off local style.
- [ ] Every page has component source, asset source/need, and data boundary traceability.
- [ ] The unit was rendered to PNG.
- [ ] Visible fail items were fixed.
- [ ] If the unit was repaired, unrelated pages were not changed unless needed.
- [ ] Remaining risks are reported clearly.
