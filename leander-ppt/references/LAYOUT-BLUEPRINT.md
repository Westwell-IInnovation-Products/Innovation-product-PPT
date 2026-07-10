# Layout Blueprint Gate

The layout blueprint is a low-cost checkpoint between outline approval and detailed slide production.

It answers: "Will the deck's page structure and visual rhythm work before we spend tokens and time drawing full slides?"

## When To Use

Use after the user approves the page-by-page outline and before anchor sample or full production.

Required for:
- decks longer than 8 pages
- decks with many mechanism/architecture/process slides
- decks where the user is actively shaping visual style
- any deck where previous iterations showed layout/visual-route churn

Optional for:
- small repairs
- one-page experiments
- existing PPT standardization when layout must remain faithful

## Output

Create a low-fidelity `layout-blueprint.md` or `layout-blueprint.png/contact-sheet`.

Start with a **story-level layout pass** before page-level skeletons. A deck is not a pile of pages; each page has a narrative job. For internal sharing decks, start from the broader frame in `NARRATIVE-FRAMEWORK.md`: big problem -> current environment -> target problem -> proposed solution -> solution detail -> implementation/effect. Then adapt the arc to the specific project.

Add a story rhythm table for decks longer than 8 pages:

- chapter / page range
- narrative stage: big problem, current environment, target problem, solution, solution detail, implementation/effect, or a deck-specific variant
- narrative job: hook, evidence, definition, diagnosis, framework, mechanism, plan, effect, transfer, close
- layout register: quiet cover, contrast, evidence map, transition, framework map, process, state, toolbox, decision, roadmap, closing
- why this register changes from the previous section
- pages that must visually echo or contrast each other

Then produce a **Blueprint-to-Production contract**. The preview stage may overlap with component selection, but it must overlap deliberately: it defines the search boundary for later component selection, not the final component implementation.

### 1. Story Rhythm Matrix

For each chapter or story segment, define:

- `storySegment`: big-problem, environment, target-problem, solution, solution-detail, implementation-effect, close
- `narrativeJob`: hook, define, prove, transition, diagnose, explain, plan, effect, transfer, close
- `rhythm`: quiet, tension, explanatory, evidence, transition, dense mechanism, synthesis, closing
- `visualTone`: calm, sharp, systematic, proof-oriented, lightweight, governance, aspirational
- `handoff`: how the segment connects to the previous and next segment

### 2. Page Intent Cards

Each page gets an intent card before any layout is drawn:

```json
{
  "page": "p12",
  "message": "Each page folder turns a complex task into a locatable repair unit.",
  "storyRole": "mechanism detail",
  "handoff": "p11 context routing -> p13 tool system",
  "relationship": "state",
  "relationshipSubtype": "state.folder-zoom",
  "risk": ["too much detail", "must match real folder structure"]
}
```

### 3. Layout Signature Matrix

Every page must have a **visual signature**. A signature is more specific than a relationship. For example:

| Coarse relationship | Bad shortcut | Better visual signatures |
|---|---|---|
| `contrast` | generic two-column compare | `problem-tension`, `concept-boundary`, `before-after-benefit` |
| `ecosystem` | hub with surrounding nodes | `domestic-landscape`, `method-transfer-map`, `platform-convergence` |
| `state` | generic state boxes | `folder-zoom`, `version-lifecycle`, `local-memory-unit` |
| `toolbox` | generic cards | `tool-tree-with-call-engine`, `asset-pool-routing` |

The matrix must include:

- `visualSignature`
- `relationshipSubtype`
- `layoutArchetype`
- `skeletonFamily`: the coarse preview family used for rhythm auditing, such as contrast / process / map / state / tool-decision / evidence-role / lifecycle
- `previewPattern`: the low-fi renderer shape that the user will actually see, such as split-compare / linear-timeline / hub-map / folder-zoom / evidence-board / center-loop
- `candidateFamilies`
- `avoidSignatures`
- `complexityBudget`: low / medium / high
- `expressionMode`: mechanism-diagram, screenshot-evidence, big-typography, case-evidence, human-ai-swimlane, artifact-map, simple-image2-illustration, or component-composite
- `screenshotSlots`: explicit slots with source, crop rule, explanation anchor, and redaction status
- `implementationStatus`: implemented, partial, proposed, public-reference, or unknown
- `bodyBox` / `visualCenterY`: body-region contract when a page has shown centering risk
- `echoWith`: pages that intentionally mirror this page
- `mustDifferFrom`: pages that must not use the same skeleton

### 4. Blueprint-to-Component Contract

For every content page, output a contract that later visual selection can read:

```json
{
  "page": "p13",
  "visualSignature": "tool-tree-with-call-engine",
  "relationshipSubtype": "toolbox.tool-tree",
  "layoutArchetype": "left-root-middle-branches-right-engine",
  "skeletonFamily": "tool-decision",
  "previewPattern": "tool-tree",
  "routePreference": ["component-library"],
  "candidateFamilies": ["toolSystemTree", "hubSpokeCapability", "zoneGrid"],
  "avoidSignatures": ["plain-card-grid", "generic-tree"],
  "complexityBudget": "medium",
  "expressionMode": "mechanism-diagram",
  "screenshotSlots": [],
  "implementationStatus": "implemented",
  "qaFocus": ["orthogonal connectors", "right engine aligned to tool tree"]
}
```

This contract narrows component-library search. It does not hard-lock the final component. The visual selection engine may override the suggested family only if it records a reason.

### 5. Color Semantics Contract

The layout blueprint must also define **color meaning**, not only positions. Theme colors are not decoration; they are semantic markers that help the audience follow the story.

Add a deck-level color semantics block:

```json
{
  "colorSemantics": {
    "red": "focus, conflict, risk, current selection, gate, or key change only",
    "navy": "stable structure, normal system path, baseline state, reusable asset",
    "lightBlue": "supporting context, inactive peer, neutral evidence",
    "lightRed": "selected focus background, problem highlight, changed result",
    "gray": "secondary connector, inactive boundary, scaffold line",
    "cyan": "brand marker only, not a logic color"
  }
}
```

For each content page, add or infer:

- `colorIntent`: which element deserves red / navy / neutral treatment
- `accentTarget`: the single most important object to emphasize
- `neutralElements`: supporting objects that must not compete with the focal point
- `forbiddenColorUsage`: where red, cyan, or decorative multi-color should not appear

The blueprint stage should decide **role and emphasis**. The later slide-production stage may tune exact shade, opacity, and local balance, but it should not invent a new color logic from scratch.

Each page should show:

- page ID and title
- narrative role in the whole story
- previous/next handoff
- one-sentence page message
- relationship type and subtype
- visual signature
- rough layout zones using large blocks
- planned visual route: component / external graphic / image2 / mixed / custom
- candidate component families or pattern families
- avoid signatures / repeated skeletons
- risk note

Do not write final slide copy. Do not draw detailed icons. Do not tune typography.

## Page Blueprint Format

```markdown
| Page | Story role | Handoff | Message | Relationship subtype | Visual signature | Skeleton family | Preview pattern | Layout skeleton | Candidate families | Avoid | Risk |
|---|---|---|---|---|---|---|---|---|---|---|---|
| p11 | Mechanism detail | p10 orchestration -> p12 state | Context should be routed by phase | `contrast.problem-vs-route` | context-overload-vs-router | contrast | split-compare | left failure scene / center divider / right vertical route | imageSlot, pipelineFlow | generic two-column compare | image must stay simple; right route must not overlap |
```

For screenshot-evidence pages, add a short slot table below the matrix:

```markdown
| Page | Slot | Source | Crop rule | Explanation anchor | Redaction |
|---|---|---|---|---|---|
| p13 | skill-md | `.codex/skills/leander-ppt/SKILL.md` | first screen only | left callout | no secrets |
```

For visual previews, use simple colored blocks:

- title/header band
- primary graphic zone
- text/support zone
- image slot
- evidence/result band
- conclusion/caveat band

The preview is allowed to be low fidelity, but it must still obey the color semantics contract. For example, if red marks the current version or selected page folder, do not also use red on unrelated peer blocks. If a page needs no conflict/current-state emphasis, keep body structures mostly navy / neutral and reserve red for the title rule or one focal marker.

For decks longer than 8 pages, produce at least two preview views:

- contact sheet: all pages, used to inspect story rhythm and repetition
- risk-page enlarged preview: high-risk pages only, used to inspect layout feasibility

If time allows, also produce a story-strip preview showing how chapters connect.

## Low-Fi Preview QA

Low fidelity does not mean geometry can be wrong. Before showing a layout preview, run a quick geometry pass:

- no shape/text zone may overlap another zone unless the overlap is the explicit visual relationship being tested
- every page skeleton must stay inside the slide safe area
- connector lines must be straight or deliberately curved; accidental diagonal/crossing lines fail
- connectors must not visually cut through unrelated boxes, labels, screenshot slots, or pseudo-text lines
- internal component marks must not look like broken real content; if the preview symbol is too detailed to remain clean at contact-sheet scale, simplify it
- a preview component that looks misaligned, tangled, or ambiguous at contact-sheet scale fails even if the coordinate checker reports PASS
- repeated peer blocks must share the same size, baseline, and spacing
- key mechanism pages must remain readable at contact-sheet scale
- if the preview renderer creates an artifact, re-render it with a simpler skeleton instead of explaining it away
- produce a `preview-qa.md` or equivalent note that separates: user-facing preview files, downstream contract files, and internal renderer/debug files
- check screenshot slots: they must have enough real estate, a source, and a nearby explanation anchor
- check implementation truth: implemented/partial/proposed claims must match real files, scripts, or public sources
- check color semantics: red has one clear role on the page, cyan is brand-only, and neutral elements do not compete with the focal marker
- write machine-readable preview QA such as `layout-blueprint-preview-qa.json`; keep the filename stable and store the mechanism version plus source hash inside the file
- run a layout diversity audit: repeated visual signatures, repeated layout archetypes, or adjacent pages with the same skeleton must be counted before user review
- if the preview renderer maps different signatures to the same generic drawing, that is a renderer coverage defect, not a valid design decision

### Layout Diversity Audit

Gate 1.5 must check not only "is every page valid alone" but also "does the whole deck have a designed rhythm".

Before asking the user to approve a blueprint, run both hard gates:

```bash
node tools/render-layout-blueprint.js
node tools/verify-design-gates.js blueprint
node tools/lint-layout-blueprint.js
node tools/lint-blueprint-preview.js
```

The renderer must produce stable artifacts: `layout-blueprint-preview.svg`, `layout-blueprint-risk-preview.svg`, `layout-blueprint-geometry.json`, and `layout-blueprint-preview-qa.json/md`. A PASS is valid only when the recorded source hash matches the current blueprint.

`verify-design-gates.js blueprint` checks whether project design rules are present in the blueprint contract: expression mode, story role, color intent, screenshot slots, body area, and bottom-summary rationale. `lint-layout-blueprint.js` checks deck rhythm and preview-pattern repetition. `lint-blueprint-preview.js` checks whether the user-facing preview is safe to use as a production contract: poster pages must not become radial wiring, concept-boundary pages must not become a fake middle component, filter pages must have input/filter/output structure, loop pages must avoid wiring through the center, and preview QA must have machine-readable evidence. If any returns `FIX-FIRST` / non-zero exit, do not show the blueprint as approval evidence.

Before showing a blueprint preview, audit these items:

- **Adjacent repetition**: neighboring pages must not use the same `layoutArchetype` unless the blueprint marks the second page as an intentional echo with `echoWith`.
- **Run repetition**: a 3-page run must not share the same coarse skeleton family, for example three consecutive horizontal process rows or three consecutive left/right compare pages.
- **Deck repetition**: the same `visualSignature` should normally appear once. If repeated, it must be explicitly justified as an echo, recurrence, or before/after callback.
- **Renderer repetition**: if two different signatures render to the same low-fi geometry, split the renderer preview pattern or simplify one page to a distinct skeleton before approval.
- **Preview-pattern repetition**: every content page must explicitly declare `previewPattern`. The same preview pattern should not appear multiple times across the deck unless the pages are intentional echoes with a written rationale.
- **Mechanism-section rhythm**: for long mechanism chapters, alternate registers deliberately: overview -> flow -> contrast -> state -> toolbox -> decision -> evidence -> role/evidence -> lifecycle -> synthesis. Do not allow every mechanism page to become boxes plus arrows.

Suggested threshold:

| Check | Fails Gate 1.5 when |
|---|---|
| Same `layoutArchetype` on adjacent pages | no `echoWith` or explicit rationale |
| Same `visualSignature` repeated | no echo/callback rationale |
| Same coarse skeleton family appears 3 times in a row | no intentional rhythm note |
| One skeleton family exceeds about 25% of content pages | not balanced by visual register changes |
| Same `previewPattern` appears multiple times | no echo/callback rationale |
| Any content page has no `previewPattern` | always |
| Renderer fallback/generic pattern appears | any occurrence in user-facing preview |

The diversity audit should produce a short Chinese report such as `layout-blueprint-diversity-audit.md`. If it reports `FIX-FIRST`, do not ask the user to approve the blueprint yet.

If a low-fi preview has obvious overlaps, off-center structures, or misleading connectors, Gate 1.5 is **not approved**. Fix the blueprint or the preview renderer before anchor samples. A broken preview is allowed only as an internal diagnostic artifact, not as approval evidence.

### Blueprint Preview Pattern Safety

The preview renderer is part of the mechanism, not a disposable sketch. Do not approve low-fidelity drawings that would teach production the wrong structure.

Use these hard rules:

| Page intent | Failing preview pattern | Safer pattern |
|---|---|---|
| Big typography / keyword tension | center block with radial spokes, orbit lines, or accidental diagonals | center word / surrounding keyword blocks / bottom shift band |
| Concept boundary | a red middle chip that looks like a third concept or bridge component | two concept planes with a clean divider and a small relation marker |
| Tool tree / component routing | tangled tree, diagonal connectors, preview panels crossing branches | left root / vertical trunk / orthogonal branches / right preview column |
| Agent or evidence handoff | many tiny role boxes all connected to one node | compact handoff stages + evidence screenshot slot |
| Feedback loop / lifecycle | wires crossing the center or unclear loop direction | outer loop cue, staged ring, or left-to-right lifecycle with clear recurrence |
| Share / public-private filter | decorative funnel with ambiguous lines | input -> filter -> output pipeline, with one selected outcome |

These are generic safety rules. If a project needs a different pattern, record the reason in the blueprint contract and prove it with a clean enlarged preview.

## Preview Versus Production

The blueprint preview is not the final slide implementation and should not be treated as final coordinates. It is a contract for story rhythm, layout family, preview pattern, emphasis, and component-search boundaries.

However, preview defects can still propagate downstream in three ways:

- they can make the user approve a weak or confusing page structure
- they can route visual selection toward an unsuitable component family
- they can hide real layout risks until expensive page production

Therefore, any visible preview disorder must be classified before moving forward:

| Defect type | Meaning | Action |
|---|---|---|
| Renderer artifact | The idea is sound, but the low-fi renderer drew it badly | simplify or fix the preview renderer, then re-render |
| Blueprint contract defect | The page's layout idea is unclear or too dense | revise `visualSignature`, `previewPattern`, layout skeleton, or split the page |
| Component risk | The preview reveals that likely component families may not fit | mark the page as high-risk and require anchor/sample proof before full production |

Do not proceed from Gate 1.5 to anchor samples if user-facing preview components look tangled, crooked, or semantically misleading.

## Approval Criteria

Before detailed slide production, confirm:

- the story arc is visible across the whole deck, not only inside each page
- the story arc stays broad enough to fit the deck type instead of copying a previous project's detailed sequence
- page order still works
- each page has a clear narrative job and handoff to the next page
- each page has a visual signature more specific than the coarse relationship
- same-signature pages are intentional echoes, not accidental template reuse
- blueprint-to-component contracts exist for content pages and are specific enough to narrow component search
- expression mode, screenshot slots, and implementation status exist for pages that need them
- the layout rhythm changes when the story changes, and visually echoes when the story intentionally refers back
- neighboring pages do not repeat the same layout too often
- repeated skeletons across the whole deck are counted and justified
- repeated skeletons are either intentionally echoed or redesigned before approval
- dense pages are split or simplified
- image2/external graphic needs are identified early
- high-risk pages are selected as anchor samples
- component choices feel reasonable before detailed drawing
- low-fi previews are centered and structurally legible; roughness is acceptable, but chaotic connectors or obviously off-center skeletons fail the blueprint
- color roles are meaningful across the story: red identifies tension/current/gate/change, navy identifies stable structure, and decorative color is not used as filler

## What This Gate Prevents

- building a full deck from a structurally weak outline
- building pages that are locally correct but do not form a coherent story
- discovering too late that many pages use the same card layout
- overusing image2 for logic that should be editable
- forcing a full-page component onto a page that only needs a layout block
- expensive redesign after full PPT generation
- discovering in production that color emphasis contradicts the story or makes every object look equally important

## Minimal Blueprint Loop

```text
outline approved -> generate layout blueprint -> user confirms structural rhythm -> anchor samples -> production
```

If the user rejects a layout skeleton, change the blueprint first, not the finished slide.
