---
name: leander-ppt
description: "Create, redesign, standardize, review, or polish editable PPTX decks through the mandatory Leander PPT gated workflow. Use for internal presentations, management reports, project reviews, product introductions, customer demos, training materials, slide outlines, PPT review, PPT redesign, reusable PPT templates, or turning source material into a formal editable deck. When invoked, initialize Gate 0 first and never render, build, or deliver a deck by skipping user checkpoints."
---

# Leander PPT

Produce formal, editable, presentable `.pptx` decks through a staged harness: brief -> outline -> design/theme contract -> layout blueprint -> anchor samples -> full production -> evidence-backed rendered QA -> repair/learning loop.

This `SKILL.md` is only the router. Load detailed references only for the active stage.

## Mandatory Entry Contract

This is executable workflow policy, not optional guidance.

1. For every new Leander task, initialize a clean scaffold with `node <skill-root>/scripts/init-scaffold.js <project-root> <create|redesign|review>`. This copies the release-clean template, installs locked dependencies, runs the environment doctor, and creates Gate 0. Gate 0 must reject a root task whose existing recent-call average is at least 120k input tokens, any prior call is at least 180k, the task has compacted, or the active rollout is unreadable. If the scaffold already exists, run `npm ci`, `node tools/environment-doctor.js`, then `node tools/workflow-gate.js init <create|redesign|review>` before producing slides.
2. For every resumed project, first run `node <skill-root>/scripts/sync-scaffold-tools.js <project-root>` and then `node tools/workflow-gate.js status`. The sync updates only managed workflow/QA tools, migrates legacy agent-collaboration evidence to V3 with an audit backup, and preserves project pages, theme, components, config, content, state, and approvals. Migration never fabricates fresh-review evidence: missing V3 event digests or anchor/final independent runs remain blocking. Continue from the reported gate; never infer approval from old files or conversation tone.
   - For a legacy Leander scaffold created before workflow receipts existed, run `node tools/workflow-gate.js migrate <outline|blueprint|anchor|production|final> --note "<explicit migration confirmation>"` once. Never use migration for a new task.
3. A full-deck request must follow: brief -> page outline -> design/terminology/state -> theme -> layout blueprint -> anchor samples -> production mode -> batches/full production -> rendered QA -> final build.
4. Stop for explicit user approval at `plan`, `layoutBlueprint`, `anchorSample`, and `productionMode`. Record it with `node tools/workflow-gate.js approve <checkpoint> [A|B|C] --note "<user confirmation>"`; never hand-edit approval state. `pending` is never approval, and approvals from another `runId` are invalid.
5. Partial requests stop at their natural gate. An outline request does not authorize blueprint or production. A preview request does not authorize final PPTX.
6. Use only `tools/deck.js` for page render, verification, and build. Its workflow guard must pass even with `--draft`; never create a parallel ungated PPTX path.
7. Before reporting completion, run `node tools/workflow-gate.js status`, `node tools/run-phase.js render-review`, complete any candidate-harvest curator event, then run `node tools/run-phase.js final-verify` and `node tools/deck.js build`. `final-verify` materializes independently reviewed component proposals into the user's contribution inbox; it never promotes them into the shared Skill. Report the current gate and the user-facing artifact from `artifact-manifest.md`.
8. Start every new deck in a new Codex task. Before every protected phase/render/verify/build command and after every successful mutating `run-phase` boundary, calculate the context budget only from chronologically ordered calls of the active root task. When its recent-call average reaches 120k input tokens, one call reaches 180k, or it has compacted, create `state/context-rotation-lock.json`; if that active rollout is unreadable, fail closed. At each approved Gate and phase boundary, write `state/phase-handoff.json`. Historical IDs cannot clear the lock, a new task must have been created after the lock, and the old task remains blocked after the new task attaches. Continue only in the active fresh task and read the handoff packet instead of replaying task history.
9. Treat [`references/HARD-GATE.md`](references/HARD-GATE.md) as the exact enforcement boundary. A final artifact produced by another script, after deleting Gate state, or without the scaffold receipt is not a Leander delivery.

If the task has not entered a Leander scaffold yet, the correct next action is Gate 0 initialization, not slide production.

## Non-Negotiables

- A valid `workflow-receipt.json` is required for every render, verify, or build operation. Do not hand-edit it to bypass Gate 0.
- The scaffold stabilizes process and evidence, not page appearance. Derive every deck's story, density, layout signatures, image mix, and component choices from the current brief/theme/assets; never copy a previous deck's page allocation by default.
- Content richness is adaptive. Dense mechanism/evidence pages may carry more detail; focus, transition, image-led, and big-typography pages may preserve substantial designed whitespace when `whitespaceIntent` and `densityRationale` explain why.
- Work in a real scaffold from `templates/leander-ppt-scaffold/` for any multi-slide deck.
- Keep one page per folder: `pages/<id>/{page.js,page.json,qa-result.json,qa.md,out/}`.
- Components are building blocks, not page templates: every content page composes a title band, 2-3 information zones, and a takeaway band; single-component pages are limited to covers and section dividers. Use image slots only when images carry real explanatory value.
- Run visual selection before drawing content pages: `node tools/select-visual-route.js pages/<id>/page.json --write`.
- Run Chinese dynamic QA before render: `node tools/build-qa-profile.js pages/<id>/page.json --write`.
- Enforce the reusable content/visual quality floor with `node tools/verify-quality-baseline.js`; field-complete but substantively weak pages must fail.
- Token saving is allowed only after the quality lock passes. Never remove outline, blueprint, anchor, rendered visual review, high-risk full-size review, or final contact-sheet review to save context.
- Freeze scaffold workflow tools at Gate 0. If a managed tool changes during deck production, stop the deck run, write `state/skill-defect.json`, fix/test the shared Skill separately, then resync before continuing.
- Each content `page.js` must export `visualBinding: { route, name }` matching `page.json.visualSelection.selectedRoute`. A component-library route whose bound component is absent from the runtime trace raises a review warning (confirm intentional hand-composition), not a blocker.
- Render before reporting quality. A glance at code is not QA.
- Use a project `DESIGN.md` and `visual-direction.md` when making substantial visual, component, theme, or layout decisions; lint `DESIGN.md` when created or edited.
- Treat `visual-direction.md` as a project-level visual brief, not a new subagent role. Existing `visual-designer-zh` and the main flow read it; do not create a separate "visual direction" agent.
- Use a project `role-briefs.md` for multi-agent work. It translates the same project goal into planner/layout/designer/component/reviewer/presenter-specific guidance; it is not a new role.
- Keep skill references/templates generic. Project-specific deck titles, page IDs, current workflow states, customer names, screenshots, and feedback belong in the project scaffold or clearly marked examples, not in generic rules.
- After editing the shared Skill, run `node templates/leander-ppt-scaffold/tools/lint-scope-hygiene.js --skill-root .`.
- Before distributing the shared Skill, run `node scripts/release-hygiene.js` and do not ship generated state, render evidence, private feedback logs, or project-specific examples.
- Run `node tools/verify-design-gates.js` at outline/blueprint/page stages to prove design rules are present in the executable artifacts, not only written in prose.
- Keep canonical terms in `terminology.json` for decks with repeated framework concepts; run `node tools/verify-terminology.js` after title/outline/blueprint changes.
- Keep lightweight task memory in `state/`; run `node tools/verify-state-memory.js` when the deck explains state, memory, recovery, or handoff.
- After every phase output or feedback round, update artifact labels with `node tools/artifact-map.js --write`; report files as user-confirm, next-input, internal-evidence, final-output, or archive-reference.
- At final render review, use the existing `component-curator-zh` extraction mode for candidate-harvest signals. Do not add a new permanent role, and never let the generating Agent self-approve production promotion.
- Write `state/decision-log.md`, `state/conversation-summary.md`, and `state/run-state.json` once per approved gate or phase boundary, not per step. `run-phase.js` already keeps per-step logs in `output/phase-run.log`.
- Fix obvious overlap, clipping, crooked connectors, unreadable text, meaningless accent colors, dead space, and text-card-only pages before delivery.
- Reject generic QA evidence reused across unrelated rules. Every PASS check must name its rule, artifact/source, specific location, method, and observation or numeric result.
- Do not invent data, customer claims, implementation status, logos, or external facts.

## Token-First Entry

For an existing scaffold, start with a compact context packet:

```bash
node tools/context-pack.js --mode status
node tools/context-pack.js --mode repair --pages p11,p12
node tools/context-pack.js --mode agent --role reviewer-zh --pages p09,p11
node tools/phase-handoff.js verify
node tools/environment-doctor.js
```

Use the packet's `recommendedReads` as the default context boundary. Expand only when changing story, theme, layout blueprint, shared components, or final delivery gates.

Prefer one deterministic phase call over many model-visible tool turns:

```bash
node tools/run-phase.js status
node tools/run-phase.js prepare-pages --pages p01,p02
node tools/run-phase.js page-cycle --pages p01,p02
node tools/run-phase.js render-review
node tools/run-phase.js final-verify
```

`page-cycle` combines route validation, dynamic QA, design/quality lint, preflight, incremental render, contact sheet, affected-page QA initialization, digest capture, artifact mapping, Token checkpoint, context-budget lock decision, and handoff. `run-phase.js` keeps full logs in `output/phase-run.log` and returns one compact pass/fail/rotate summary. Do not ask the model to restate successful checks.
It also runs render-level occupancy, dead-space, and adjacent-geometry similarity checks. Treat warnings as full-size-review escalations, not automatic aesthetic approval.
Use `prepare-pages` only before implementing the selected pages. It preserves `selectionLocked` and overridden routes; do not force re-routing after user or curator approval unless the route itself is intentionally reopened.

Gate 0 automatically starts `state/token-ledger.json`. Gate approvals record actual deltas from local Codex rollout JSONL when available. Use `node tools/token-ledger.js attach-thread` after a Gate-boundary task rotation and `node tools/token-ledger.js report` for the Chinese report. Missing logs must remain labeled `estimated`; never replace them with invented exact values.

## Phase Map

| Phase | Action | Required reading |
|---|---|---|
| Fast run / repair | Continue or patch an existing deck with minimal context | `references/FAST-RUN.md`, then `tools/context-pack.js` |
| 1. Brief | Define source, audience, goal, deck type, boundaries | `references/BRIEF.md` |
| 1. Outline | Plan story, pages, visual intent, evidence, anchors | `references/OUTLINE.md` + `references/NARRATIVE-FRAMEWORK.md` + `references/SLIDE-CRAFT.md` |
| 1.1 Design / Terms / State | Establish project design system, visual direction, canonical terms, run memory | `references/DESIGN-SYSTEM.md` + `references/VISUAL-COMPOSITION.md` + `references/TERMINOLOGY.md` + `references/STATE-MEMORY.md` |
| 1.3 Theme | Choose Leander Base / Global or another PPT-safe theme and define color semantics | `references/THEMES.md` |
| 1.5 Layout blueprint | Whole-deck rhythm, visual signatures, layout contracts within the approved theme semantics | `references/LAYOUT-BLUEPRINT.md` |
| 3. Anchor samples | Build 2-3 real editable sample pages and render PNGs | `references/SLIDE-CRAFT.md` + `references/VISUAL-COMPOSITION.md` + `references/QA.md` |
| 4. Production | Build active pages by batch or full deck, route visuals, render, review, assemble | `references/PRODUCTION.md` + `references/SCAFFOLD.md` |
| Components | Select/reuse/extend visual components | `references/COMPONENTS.md` + `references/COMPONENT-LIBRARY-DESIGN.md`; use `tools/component-index.min.json` before `COMPONENT-CATALOG.md` |
| Images | Reserve generated/real image slots and prompt specs | `references/IMAGE-ASSETS.md` |
| Dynamic QA | Build page-specific Chinese QA checks | `references/DYNAMIC-QA.md` |
| Quality floor | Check content sufficiency, truth boundaries, visual variety, and talkability | `references/QUALITY-BASELINE.md` + `tools/verify-quality-baseline.js` |
| Agents | Coordinate planner/layout/designer/component/reviewer/presenter roles | `references/AGENT-COLLABORATION.md` + `references/ROLE-GUIDANCE.md` + relevant `agents/*.md` |
| Artifacts | Distinguish what the user reviews from what the next task consumes | `references/ARTIFACTS.md`; run `tools/artifact-map.js --write` |
| Learning loop | Log, classify, promote, archive recurring lessons | `references/SELF-EVOLUTION.md` + `references/LESSONS.md` |
| Scope hygiene | Edit skill rules, templates, examples, or feedback logs without leaking project facts into generic rules | `references/SCOPE-HYGIENE.md` |

## Checkpoints And Gates

User checkpoints stop the workflow for explicit approval; record each with `node tools/workflow-gate.js approve <checkpoint> [A|B|C] --note "<user confirmation>"`. Do not skip them unless the user explicitly bypasses and the bypass is recorded.

| User checkpoint | Evidence | Blocks |
|---|---|---|
| `plan` (Gate 1) | `brief.md`, `outline.md` self-check pass | Design/theme/blueprint work |
| `layoutBlueprint` (Gate 1.5) | compact `layout-blueprint.md/json` + lint pass + optional risk-page previews | Anchor samples and production |
| `anchorSample` (Gate 5) | rendered editable sample slides | Full production |
| `productionMode` (Gate 5.5) | recorded production mode A/B/C | Production batches and final build |

`designTermsState` and `theme` receipts are recorded en route — normally presented together with the outline or blueprint for confirmation. They still require a real `DESIGN.md`, `visual-direction.md`, and theme contract before blueprint work.

Everything else is an automated verification executed inside `run-phase.js` and `deck.js verify/build`: design hard gates, visual selection, dynamic QA, production preflight, quality baseline, runtime/QA evidence digests, render quality lock, agent evidence, artifact map, rendered QA freshness, and change impact. When they pass, report one summary line; never restate individual passing checks. When one fails, fix it and re-run the phase command; open the specific tool's reference only if the failure message is not actionable.

```bash
node tools/run-phase.js status                       # workflow + context pack + artifact map
node tools/run-phase.js prepare-pages --pages p01,p02
node tools/run-phase.js page-cycle --pages p01,p02   # route + QA + render + audits + digests
node tools/run-phase.js render-review
node tools/run-phase.js final-verify
node tools/deck.js build
```

Individual tools (`render-quality-gate.js record`, `verify-terminology.js`, `verify-state-memory.js`, `token-ledger.js report`, release/lint scripts) are invoked on demand; see the stage references.

## Agent Collaboration

Use event-triggered multi-agent roles. Production Mode A/B/C does not enable or disable roles; open workflow events do. The main agent owns final integration and user communication.

Default roles:

- `agents/planner-zh.md`: story, outline, page intent.
- `agents/layout-architect-zh.md`: whole-deck rhythm and layout contracts.
- `agents/visual-designer-zh.md`: anchor style, color meaning, typography, image simplicity.
- `agents/component-curator-zh.md`: relationship-first component reuse, visual route, route rejection reasons.
- `agents/reviewer-zh.md`: rendered QA, dynamic QA, SHIP/FIX-FIRST.
- `agents/presenter-zh.md`: rehearsal flow, transition notes, audience confusion, supplementary knowledge.

For subagents, pass a context pack, role spec, affected PNG/page.json paths, and the exact decision needed. Do not pass full outline, full catalog, full QA, and all historical reports by default.

For production decks, page-production workers do not satisfy role review. Standard Mode B uses two review runs: the visual designer once at anchor, the reviewer once at final (contact sheet plus risk-tier full-size pages). The layout blueprint is checked by the main agent against `LAYOUT-BLUEPRINT.md`; no subagent review by default. Component curator runs only for shared component changes, an explicitly ambiguous selection, or a final candidate-harvest signal. Presenter runs only on explicit rehearsal request. Use `node tools/plan-agent-events.js --write`; reuse only an unchanged event in the same phase.

Every role must read the project `role-briefs.md` section for its role before producing evidence. If a real subagent is not used, the main-agent fallback must still apply that role brief and record the fallback.

## Production Rules

- Use the approved outline, theme, layout blueprint, and anchor style.
- Prefer the smallest unit: page repair -> batch -> chapter -> full deck.
- In Mode A, set `workflow.stage = "production-batch"`, whitelist only the current `activePages`, and write `batchFileName`; use `production` only for the integrated final deck.
- Recommend Mode B for a standard deck when the user does not need batch-by-batch visual approval. Mode A is reserved for deliberate chapter review; Mode C is reserved for genuinely independent chapters. The user still approves the production mode.
- Before page implementation, route the visual form, inspect relationship/slots/capacity/theme/risk evidence and confidence margin, then draw.
- Run `verify-page-preflight.js` before implementation/rendering; a missing Image2 prompt file or lost blueprint signature is a production blocker.
- Treat 100% component-library selection across content pages as a blocker unless an explicit generic override and per-page justifications are recorded.
- Do not bypass the component library with custom boxes before evaluating component-library, external-graphic, image2, and page-specific-custom routes.
- Treat component-library maintenance as a separate temporary mode. Run `enrich-component-registry`, `build-component-index`, and `lint-component-library --strict` only when evolving shared components, not during routine page production.
- Keep shared tokens/components in shared files; keep slide-specific implementation inside that page folder.
- If a shared token or component changes, trigger Gate 7.
- Do not report a pile of generated files. Use `artifact-manifest.md` to separate files that require user confirmation from files that only feed the next step.

## Feedback Loop

Every repair must:

1. Map feedback to page/component/token.
2. Patch the minimum unit.
3. Let `renderDigest` re-render affected pages; only shared theme/component digest changes re-render the full deck.
4. Re-run QA only for affected pages. Candidate-route evidence changes with an unchanged selected outcome do not invalidate rendering; QA/source changes invalidate only their own evidence.
5. Record reusable issues through `tools/issue-registry.js`; keep project facts in the project.
6. Generate promotion candidates; only manually promote de-identified, abstracted, regression-tested rules.

Keep `LESSONS.md` short and active. Do not let an unbounded lesson list become another token sink.

## PPT Defaults

- Chinese font: Microsoft YaHei.
- English/numbers: Century Gothic when available.
- Internal/company decks: start with `leander-base`.
- External/international/customer-facing decks: start with `leander-global`.
- Red/azure are semantic accent colors, not decoration.
- Each content page needs a real visual explanation: diagram, chart, image, timeline, matrix, dashboard mockup, mechanism map, or equivalent.

## When Unsure

- New deck or new phase: read the phase reference.
- Existing project: run `tools/context-pack.js` first.
- Component choice: read `component-index.min.json` first; open `COMPONENT-CATALOG.md` only after shortlisting.
- Many output files: run `tools/artifact-map.js --write` and report from `artifact-manifest.md`.
- Repair: read `FAST-RUN.md` and affected page files only.
- Final delivery: run `node tools/deck.js verify --final` and `node tools/deck.js build`.
