# PPT Outline Spec

`outline.md` is the cheap control point. It plans structure, information density, page intent, and visual direction, but it must not lock down final drawing details.

## When To Read

Read this file in Phase 1 after `brief.md` and before sample slide production. Also read `NARRATIVE-FRAMEWORK.md` before deciding chapter structure, and read `SLIDE-CRAFT.md` before assigning layout archetypes.

## Core Rule

The outline plans **logic + page content + visual intent**. It does not write final slide code and does not pretend text cards are diagrams.

## Output Format

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

## Page Plan Rules

- Every page must have one clear takeaway.
- Every page should have a stable `Page ID` such as `p01`, `p02`, `p14`. Use the ID in generation code, QA notes, and repair reports.
- Every production chapter should have a stable `Chapter ID` such as `ch01-background`.
- Production chapters are control units for isolation, QA, and repair. They do not have to appear as visible PPT chapter pages.
- Every internal-sharing outline should map pages to a broad narrative stage before detailed page titles. Do not overfit the generic narrative to one project's exact chapter names.
- Every content page must declare a `Visual intent`: flow, comparison, timeline, matrix, layered architecture, evidence board, dashboard mockup, process map, icon mechanism, image-led page, or big-word + card matrix.
- Every content page must declare `Component source`: reusable PPT component, external render, image2/generated image, real asset, or mixed.
- For `image2` / `real-image` pages (a scene/realistic depiction vector renders crudely — see [`IMAGE-ASSETS.md`](IMAGE-ASSETS.md)): plan the page to **reserve an image slot** (`imageSlot`, transparent PNG blends on the theme ground, vector fallback until it arrives), and add the asset to the prompt-spec list so a `<deck>-images.gpt-image-2.md` can be emitted. Default to vector for relationships/structure; reserve images for scenes/evidence/decorative strips.
- `Content / evidence pool` must include the facts, figures, examples, or claims that justify the page.
- `Data boundary` must label achieved, planned, estimate, public reference, or unknown.
- `Asset need` must name images, icons, screenshots, product visuals, or placeholders needed.
- Mechanism decks should distinguish `frameworkLayer` from `mechanismLayer`. The first is the general Harness capability; the second is the concrete project mechanism under it.
- Pages that explain files, folders, agents, QA records, tools, or state must plan `screenshotSlots` during outline, including source, crop rule, and explanation purpose.
- Pages that explain implementation must label `implementationStatus`: implemented, partial, proposed, or public-reference.
- Declare `expressionMode` before choosing components: mechanism-diagram, screenshot-evidence, big-typography, case-evidence, human-ai-swimlane, artifact-map, simple-image2-illustration, or component-composite.
- If the deck repeats framework terms, create `terminology.json` and keep page titles aligned to canonical names.

## Manual Deck Standardization Mode

When the user says an existing PPT is the source of truth, first standardize it instead of redesigning it.

Required sections:

1. Full storyline faithful to the source deck.
2. Chapter structure based on source page order.
3. Page-by-page table with page title, takeaway, display form, source/boundary, and notes.
4. Structure observations: deck type, strengths, gaps, and possible later variants.
5. Reusable rules learned from the source, phrased generically.

Do not reorder pages unless the user explicitly asks for restructuring.

## Self Check

Run this before Checkpoint Plan.

- [ ] Page count matches the target or the mismatch is explained.
- [ ] Every chapter has Chapter ID, page range, production role, and visible/non-visible status.
- [ ] Internal-sharing decks have a broad narrative mapping, normally covering big problem, environment, target problem, solution, solution detail, and implementation/effect.
- [ ] Every page has Page ID, Chapter ID, title, takeaway, evidence pool, visual intent, component source, data boundary, and asset need.
- [ ] Visual intent is executable and not vague, e.g. "four-column mechanism with icons" instead of "nice layout".
- [ ] Pages with weak evidence or missing assets are flagged.
- [ ] Screenshot/evidence pages declare screenshot slots, source, crop rule, and explanation purpose.
- [ ] Mechanism pages distinguish framework layer, mechanism layer, and implementation status.
- [ ] Repeated framework names match `terminology.json`.
- [ ] At least 2 representative anchor pages are selected for sample production.
- [ ] No final slide drawing details are over-specified in a way that prevents better design later.

## Next Checkpoint

After the user confirms the outline, produce a low-fidelity layout blueprint for decks longer than 8 pages or decks with complex mechanism/process/architecture pages. See `LAYOUT-BLUEPRINT.md`.
