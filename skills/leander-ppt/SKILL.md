---
name: leander-ppt
description: "Create, redesign, standardize, or polish editable PPTX decks through the Leander PPT workflow. Use for internal presentations, management reports, project reviews, product introductions, customer demos, training materials, slide outlines, PPT review, PPT redesign, reusable PPT templates, or turning source material into a formal editable deck."
---

# Leander PPT

Turn source material into a **formal, editable, presentable `.pptx`**. This skill borrows the staged harness from `web-video-presentation`, but adapts it to PowerPoint:

- No webpage output.
- No video, narration, audio, or recording workflow.
- No automatic HTML-to-PPT conversion as the default.
- Use editable PowerPoint shapes and PPTX generation/editing methods.

## Core Principle

This skill is a production system, not a style memo. Work through staged files, hard checkpoints, and rendered QA:

```text
Phase 1   Brief + outline
          Read BRIEF.md + OUTLINE.md + SLIDE-CRAFT.md
          Produce brief.md + outline.md
          Self-check, fix, then stop for Checkpoint Plan

Checkpoint Plan
          Align outline, deck type, theme/template, assets, and sample pages

Phase 2   Theme/template selection
          Read THEMES.md
          Confirm or choose template before samples

Phase 3   Anchor sample PPTX
          Read SLIDE-CRAFT.md + QA.md
          Produce 2-3 real editable sample pages
          Render to PNG, self-check, fix, then stop for user approval

Phase 4   Full deck production
          Read PRODUCTION.md + SLIDE-CRAFT.md + QA.md
          Implement by selected mode: A chapter/batch confirmation, B sequential full deck, C parallel chapters
          Render to PNG, run the Design Review Pass, fix, then report

Phase 5   Iteration & repair (each feedback round)
          Locate the minimum unit -> patch -> re-render -> re-run the Design Review Pass -> log the lesson
          A shared token/component change -> re-render & re-review the WHOLE deck (Gate 7)
```

Do not jump to full-deck generation when the structure, theme, or sample quality has not been approved.

## Execution Gates

These gates are mandatory. If a gate is missing, stop and complete it before moving forward.

| Gate | Required evidence | Blocks |
|---|---|---|
| Gate 1 - Plan | `brief.md` + `outline.md` pass their self-checks | Any theme or slide work |
| Gate 2 - Theme | A named theme/template contract with tokens, component style, logo/image rules, and user approval or explicit "you decide" | Anchor samples |
| Gate 3 - Scaffold | A real deck project scaffold copied from `templates/leander-ppt-scaffold/` with `theme/`, `components/`, `pages/`, `tools/deck.js`, `deck.config.js`, and `output/` | Any PPTX generation |
| Gate 4 - Page folders | One folder per page `pages/<id>/{page.js, page.json, qa.md, out/}` generated from `outline.md`; the build code lives in `page.js` (isolation enables per-page render, review, and repair) | Production and minimum-unit repair |
| Gate 5 - Anchor proof | 2-3 rendered editable sample slides, checked against theme, components, layout, and source boundaries | Full deck production |
| Gate 6 - Rendered QA | Slide PNGs (contact sheet **or** per-slide inspection if no montage tool) + the `QA.md` Design Review Pass actually walked + QA notes, fail items fixed | Reporting completion **and every re-render** |
| Gate 7 - Change impact | After changing a **shared token or component** (type scale, a color, any `components/*` function), the FULL deck is re-rendered and re-reviewed — not just the page in focus | Reporting after any shared change |

Do not create one-off slide scripts in a loose project folder unless the task is a tiny single-slide experiment. For any deck, sample deck, or multi-slide preview, instantiate the scaffold first and place scripts inside the scaffold structure.

Gate 6 fires on **every** render, including each feedback re-render — not once at the end. "Rendered then glanced" is not QA; walk the checklist. Gate 7 exists because a one-knob global change (e.g. bumping the type scale) silently alters many pages; re-render and re-review all of them.

If tool or dependency issues force a fallback, record the fallback in `qa.md`, label the affected pages as lower-confidence, and do not call the result final quality.

---

## Hard Self-Check Protocol

Every major output must go through:

```text
produce -> self-check -> fix fail items -> report or move to checkpoint
```

| Output | Required check |
|---|---|
| `brief.md` | `references/BRIEF.md` self check |
| `outline.md` | `references/OUTLINE.md` self check |
| theme/template choice | `references/THEMES.md` self check |
| anchor sample PPTX | `references/SLIDE-CRAFT.md` + `references/QA.md` |
| page/batch/chapter production | `references/PRODUCTION.md` + `references/SLIDE-CRAFT.md` + `references/QA.md` |
| page repair | `references/PRODUCTION.md` minimum-unit repair protocol + `references/QA.md` |
| full deck PPTX | `references/PRODUCTION.md` + `references/SLIDE-CRAFT.md` + `references/QA.md` |

Use the most isolated review method available:

1. Reviewer agent / Agent Teams, if available: pass the output path, relevant checklist file, and only the needed context. Require pass/fail + evidence + repair suggestions.
2. Subagent, if reviewer teams are unavailable but subagents exist: use the same review prompt shape.
3. Current-agent self-check as fallback: strictly walk each checklist item. Do not treat a quick visual glance as QA.

**Use the shipped reviewer.** [`agents/reviewer.md`](agents/reviewer.md) is a ready independent-reviewer spec — spawn a subagent (tier 2) with it after every render, passing the preview PNG dir + the `outline.md` slice + the theme. It returns pass/fail + evidence + repairs. Only if subagents are unavailable does tier-3 self-check apply — and tier-3 only counts if you render every page and walk the checklist line by line. "Rendered then glanced" is the failure mode that lets overlaps, dead space, and color-meaning lapses ship.

The rule is non-negotiable: **fix fail items before telling the user the work is done**. Do not hand over a PPTX with obvious clipping, overlap, unreadable text, accidental blankness, or text-card-only pages.

For production and repair, the main agent keeps final accountability. Subagents can draft isolated chapters or review rendered artifacts, but the main agent must integrate, normalize style, run final QA, and report.

---

## Feedback & Lessons Loop

This skill is designed to get better with use. Every correction is captured, distilled, and fed back so recurring defects stop recurring.

- **Read before producing.** Before anchor samples, before full production, and during QA, read [`references/LESSONS.md`](references/LESSONS.md) — the deduplicated pre-flight list of past mistakes — and check the deck against it. It stays short on purpose; always read it.
- **Log after fixing.** Whenever the user gives feedback and you repair it, append one structured entry to [`references/feedback/LOG.md`](references/feedback/LOG.md) (append-only; never edit past entries). Record the **general** lesson, not the project-specific symptom.
- **Distill.** When a defect `Category` has recurred (≥2×) or an entry is clearly general, promote a one-line rule into `LESSONS.md`; promote true theme-independent universals into `SLIDE-CRAFT.md` → Universal Output Rules, and tag the lesson `[graduated]`. Mark the log entry `Promoted`.
- **Taxonomy.** Tag every entry with the fixed defect categories (color-semantics, whitespace-fill, logo-brand, background-ground, architecture, typography, density, data-boundary, layout-composition, theme-fit, chrome-signature, icon-meaning, component-gap, process) so recurrence is countable.
- **Make lessons actually get checked.** The reviewer (`agents/reviewer.md`) reads `LESSONS.md` as its hunt-list every render — that's how accumulated lessons become enforced checks rather than a doc nobody re-reads. If a lesson can't be checked from a rendered PNG, sharpen it until it can.
- **Keep the loop lean (consolidate).** `LESSONS.md` must stay short — when it drifts past ~1 screen or an item is superseded, merge/prune. When `feedback/LOG.md` grows large (≳40 entries), do a consolidation pass: fold recurring categories into `LESSONS.md`, mark folded entries `Promoted`, and never edit past raw entries (append-only). An unbounded log dilutes the signal; a bloated lessons list stops being pre-flight-readable.

Logging a fix is part of "done." A repair that is not logged loses the lesson. **Honest limit:** none of this *forces* execution — a skill is instructions the agent can skip. The enforcement is indirect: artifact-gated "done" (`qa.md` + pasted reviewer verdict) makes a skipped review *visible*, and the reviewer reading LESSONS makes the accumulated rules *checked*. Reliability comes from those visible artifacts, not from the prose alone.

---

## Stage Reading Guide

Use progressive disclosure. Read only the relevant reference file(s) for the current stage.

| Stage | Required reading | Purpose |
|---|---|---|
| Phase 1 brief | [`references/BRIEF.md`](references/BRIEF.md) | Define audience, deck type, output goal, evidence boundary |
| Phase 1 outline | [`references/OUTLINE.md`](references/OUTLINE.md) + [`references/SLIDE-CRAFT.md`](references/SLIDE-CRAFT.md) | Plan storyline, pages, visual intent, assets, anchor samples |
| Phase 2 theme | [`references/THEMES.md`](references/THEMES.md) | Select or define reusable PPT theme/template contract |
| Component library | [`references/COMPONENTS.md`](references/COMPONENTS.md) + [`references/COMPONENT-CATALOG.md`](references/COMPONENT-CATALOG.md) | Reuse or extend PPT page components and icon patterns |
| Complex images | [`references/IMAGE-ASSETS.md`](references/IMAGE-ASSETS.md) | When a page needs a generated/real image (not vector): reserve an image slot (`imageSlot`, transparent PNG blends on theme ground) + emit a prompt-spec markdown |
| Accumulated lessons | [`references/LESSONS.md`](references/LESSONS.md) | Pre-flight check against past defects; read before anchor samples, before full production, and during QA |
| Scaffold design | [`references/SCAFFOLD.md`](references/SCAFFOLD.md) + `templates/leander-ppt-scaffold/` | Use the executable PPT scaffold, theme tokens, and component helpers |
| Phase 3 samples | [`references/SLIDE-CRAFT.md`](references/SLIDE-CRAFT.md) + [`references/VISUAL-COMPOSITION.md`](references/VISUAL-COMPOSITION.md) + [`references/QA.md`](references/QA.md) | Produce and verify 2-3 representative sample slides |
| Phase 4 production mode | [`references/PRODUCTION.md`](references/PRODUCTION.md) | Select chapter/batch/sequential/parallel mode and isolation strategy |
| Phase 4 full deck | [`references/PRODUCTION.md`](references/PRODUCTION.md) + [`references/SLIDE-CRAFT.md`](references/SLIDE-CRAFT.md) + [`references/VISUAL-COMPOSITION.md`](references/VISUAL-COMPOSITION.md) + [`references/QA.md`](references/QA.md) | Produce final deck and rendered visual QA |
| Feedback / repair | [`references/PRODUCTION.md`](references/PRODUCTION.md) + [`references/QA.md`](references/QA.md) + [`references/LESSONS.md`](references/LESSONS.md) | Patch the smallest affected page set, re-render, then log the lesson |

If the user provides an existing PPT as the source of truth, use `OUTLINE.md` manual-deck standardization mode before redesigning.

Do not load every reference file at task start. Load the file named for the current phase, and load component/scaffold files only when template or component work is actually needed.

---

## Phase 1 - Brief + Outline

### 1.1 Input Recognition

| User input | Action |
|---|---|
| Existing PPT to standardize | Extract source structure and produce faithful `outline.md`; do not redesign first |
| Source docs / notes / script | Produce `brief.md` and `outline.md` in one pass |
| User only says "make a PPT about X" | Ask for source material or at least audience, goal, target pages, and key points |
| User asks for review | Review against brief/outline if available; otherwise infer deck type and report risks first |

### 1.2 Produce `brief.md`

Read `references/BRIEF.md`. Create `brief.md` with:

- Source and source type.
- Audience and occasion.
- Output goal.
- Deck type.
- Constraints, data boundaries, and asset boundaries.

If required information is missing and cannot be reasonably inferred, ask the user before continuing.

### 1.3 Produce `outline.md`

Read `references/OUTLINE.md` and `references/SLIDE-CRAFT.md`. Create `outline.md` with:

- Storyline.
- Chapter structure.
- Page plan.
- Evidence pool.
- Visual intent for each page.
- Data boundary for each page.
- Asset list.
- 2-3 anchor sample pages.

The outline plans **logic + page content + visual intent**. It does not write final slide code or over-specify drawing details.

### 1.4 Checkpoint Plan

After `brief.md` and `outline.md` pass self-check, stop and ask the user to confirm:

1. Brief: audience, deck type, output goal, target pages.
2. Outline: chapter structure and page plan.
3. Theme/template direction.
4. Assets: available, missing, placeholder allowed.
5. Anchor sample pages to produce first.
6. Production mode after anchor approval:
   - A default: chapter/batch confirmation.
   - B sequential full deck.
   - C parallel chapter production with subagents.

Do not continue to sample slides until this checkpoint is resolved. If the user says "you decide", make the decision, state it briefly, and continue.

**The page-by-page outline confirmation is mandatory and is not covered by a blanket "you decide".** Even when the user delegates theme/assets/mode, you must surface the explicit page list (page → title → form) and get a clear go before producing. "you decide" lets you pick the theme and defaults — it does not authorize skipping the structure sync. Building a whole deck off an unconfirmed outline is a process failure even if the output is good. (Lesson 2026-06-25.)

---

## Phase 2 - Theme / Template

Read `references/THEMES.md`.

A PPT template is a reusable contract:

- Fonts.
- Colors.
- Grid and safe area.
- Header/footer/section style.
- Reusable components.
- Layout archetypes.
- Image/icon style.

**Ask which bundled company theme first.** Two company themes ship with this skill; pick by occasion before offering anything else:

- **Leander Base** (`leander-base`) — internal / company decks. Warm off-white ground, deep-navy + **Westwell-red** signal, solid red title rule + footer, warm right-aligned cover, `Make a Well Change.` Distilled from `岸桥自动化系统产品介绍.pptx`, `cactus产品介绍.pptx`.
- **Leander Global** (`leander-global`) — external / international / formal decks. Clean white ground, navy `#002060` + **azure `#00B0F0`** signal (red demoted to status-only), dotted azure title rule + thin footer, dark port-skyline photo cover or clean white-minimal cover, Century Gothic English-first. Distilled from `国际展会_…_ReeWell presentation`, `…FMS Clarification`, `CTN…Scheduler`.

Ask one question: **"Internal report → Leander Base, or external/international → Leander Global? (or a different style)"** Recommend by audience: internal/company = Base; customer-facing/overseas/formal = Global. Both come from one shared component library; they differ only in theme tokens + the chrome `signature`.

Only if the user declines both bundled themes, present 2-3 alternative templates based on deck type and audience (adapt from `web-video-presentation/themes/*` into PPT-safe contracts). Do not lead with the alternatives.

Confirm the theme/template before anchor samples.

When adding reusable templates or components, also read `references/COMPONENTS.md`, `references/COMPONENT-CATALOG.md`, and `references/SCAFFOLD.md`.

Theme confirmation is not optional. If the user says "continue", treat that as approval only when a concrete theme/template choice has already been stated in the previous assistant message. Otherwise stop and present the theme checkpoint.

---

## Phase 3 - Anchor Sample PPTX

Read `references/SLIDE-CRAFT.md` and `references/QA.md`.
Read `references/SCAFFOLD.md` before creating sample pages. Instantiate or reuse the deck scaffold before generating PPTX output.

Create 2-3 real editable PPTX sample pages. **Choose them to expose risk, not just to look nice:**

1. Cover or tone-setting page.
2. The **most at-risk page type for this deck** (the densest table, the busiest flow/comparison, or a small-text-in-graphic page) — not a generic easy content page.
3. The most complex diagram/mechanism page.

These are not wireframes. They must prove final quality, typography, layout density, visual explanation style, and theme fit.

**Probe visual style explicitly before, or with, the samples.** Style disagreement is the most expensive thing to discover *after* a full deck. Surface the choice and confirm: card vs line-frame vs image-led; information density; the type scale (`theme.type` — wide: titles big, body/detail small); and whether pages will use real imagery (`IMAGE-ASSETS.md`). The anchor gate validates **style fit**, not only "nothing clips" — if the user wouldn't approve this look for all 14 pages, the sample failed even when it's technically clean.

Every sample page must include slide notes or a nearby page contract that names:

- Page ID and source outline item.
- Theme/template used.
- Component source: bundled component, extracted internal component, external render, or page-specific custom component.
- Asset source and data boundary.

Render the sample PPTX to PNG, inspect it, fix visible issues, then stop for user approval.

Do not start full-deck production until the user approves the anchor sample or explicitly asks to continue despite known issues.

---

## Phase 4 - Full Deck Production

Use the approved `outline.md`, theme/template, and anchor sample style.

Read `references/PRODUCTION.md` first, then `references/SCAFFOLD.md`, `references/SLIDE-CRAFT.md`, and `references/QA.md`.
Use `references/VISUAL-COMPOSITION.md` when selecting or combining PPT components, external renders, images, and whitespace.

Implementation rules:

- Keep pages aligned with `outline.md`.
- Generate or update `chapter.json` before implementing multi-chapter decks.
- Keep page code in page files or named page functions so a single page can be repaired without rebuilding unrelated pages.
- Use the approved scaffold `theme/` and `components/` files. Do not redefine a new full theme inside page scripts.
- Each page must declare its component source and asset/data boundary.
- Work by the selected production mode:
  - Mode A: default chapter/batch confirmation.
  - Mode B: sequential full deck, then full QA.
  - Mode C: parallel chapter production with subagents, then main-agent integration and QA.
- Use existing local generation/editing patterns when available.
- Prefer editable vector shapes, text, tables, and image placeholders over flattened images.
- Use real images/screenshots when they carry product, scene, or evidence value.
- Keep data and claim boundaries visible.
- For feedback, use the minimum-unit repair protocol: patch only affected slide(s), shared component(s), or theme token(s) as needed.

### Production pipeline (per-page model + hard gate)

Each page is `pages/<id>/{page.js, page.json, qa.md, out/}`. Drive the deck with `tools/deck.js`:

- `node tools/deck.js render` — render every page to its own `pages/<id>/out/<id>.png` (isolated artifact for review).
- `node tools/deck.js verify` — the **QA gate**: each page must have `qa.md` with `Verdict: PASS`, *newer than* `page.js`, and a render *newer than* `page.js`. Exits non-zero and lists offenders otherwise. (This is what the optional `tools/stop-hook.js` runs.)
- `node tools/deck.js build` — runs the gate, then **refuses to assemble the final deck unless every page is fresh+PASS** (`--draft` overrides for work-in-progress).

This makes "edited a page but skipped re-render / re-review" a *structural* failure: the build won't ship it and the freshness check (qa.md/out vs page.js mtimes) catches staleness automatically. Workflow each round: edit a `page.js` → `render` → review its `out/<id>.png` and set its `qa.md` `Verdict: PASS` → `build`. After production, read `references/QA.md`, inspect the per-page PNGs, fix, and re-render as needed.

---

## Phase 5 - Iteration & Repair

A real deck is finished over several feedback rounds, not in one pass. Treat iteration as a first-class phase, not an afterthought — most quality is won or lost here.

Each feedback round:

1. **Locate the minimum unit** — the affected page(s), shared component(s), or theme token(s). Map every point of feedback to a concrete target before editing.
2. **Patch at that unit.** Page-only fix → that page. Shared component/token fix → expect Gate 7 (re-render all).
3. **Re-render and re-run Gate 6** (the Design Review Pass) on the affected pages — every round. Do not "glance".
4. **Resolve every listed point**; don't fix one and silently regress another. After a shared change, scan the dense/diagram pages for new overlaps.
5. **Log the lesson** (`feedback/LOG.md`), and promote recurring/general ones to `LESSONS.md`. A repair isn't done until logged.

Anti-pattern that caused churn on real decks: reacting one-knob-per-complaint (e.g. a global font bump) without re-rendering the whole deck and re-reviewing. That ships regressions and drifts quality down across rounds. One change → full re-render → full review.

---

## PPT-Specific Non-Negotiables

- Chinese font: `Microsoft YaHei` / `微软雅黑`.
- English and numbers: `Century Gothic` when available.
- Theme tokens may reuse or adapt `web-video-presentation` themes when they are converted into PPT-safe font, color, grid, and component contracts.
- Each content page needs a real visual explanation: diagram, chart, image, timeline, matrix, dashboard mockup, mechanism map, or equivalent.
- Do not treat text cards as a diagram.
- Do not shrink fonts to hide overcrowding.
- Do not leave accidental empty space.
- Do not invent data, logos, customer claims, or implementation status.
- Label achieved / planned / estimate / public-reference claims.
- Render before reporting completion.
- If rendered preview pages do not look like the approved anchor sample or selected template, QA fails even when nothing overlaps or clips.

---

## Token And Context Discipline

- Keep `SKILL.md` as the router. Put detailed rules in `references/`.
- Do not read every reference file for every task.
- Reuse source extraction, outline, and prior user feedback already in context.
- For generated PPTX code, locate target pages first and edit locally.
- For long decks, sample first, then batch.
- Stop at checkpoints; cheap checkpoints prevent expensive full-deck rework.
