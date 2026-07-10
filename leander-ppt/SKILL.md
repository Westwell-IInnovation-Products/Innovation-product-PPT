---
name: leander-ppt
description: "Create, redesign, standardize, or polish editable PPTX decks through the Leander PPT workflow. Use for internal presentations, management reports, project reviews, product introductions, customer demos, training materials, slide outlines, PPT review, PPT redesign, reusable PPT templates, or turning source material into a formal editable deck."
---

# Leander PPT

Produce formal, editable, presentable `.pptx` decks through a staged harness: brief -> outline -> design/theme contract -> layout blueprint -> anchor samples -> full production -> evidence-backed rendered QA -> repair/learning loop.

This `SKILL.md` is only the router. Load detailed references only for the active stage.

## Non-Negotiables

- Work in a real scaffold from `templates/leander-ppt-scaffold/` for any multi-slide deck.
- Keep one page per folder: `pages/<id>/{page.js,page.json,qa-result.json,qa.md,out/}`.
- Use editable PPT shapes/components where practical; use image slots only when images carry real explanatory value.
- Run visual selection before drawing content pages: `node tools/select-visual-route.js pages/<id>/page.json --write`.
- Run Chinese dynamic QA before render: `node tools/build-qa-profile.js pages/<id>/page.json --write`.
- Each content `page.js` must export `visualBinding: { route, name }` matching `page.json.visualSelection.selectedRoute`; component-library routes must also produce a matching real runtime trace.
- Render before reporting quality. A glance at code is not QA.
- Use a project `DESIGN.md` and `visual-direction.md` when making substantial visual, component, theme, or layout decisions; lint `DESIGN.md` when created or edited.
- Treat `visual-direction.md` as a project-level visual brief, not a new subagent role. Existing `visual-designer-zh` and the main flow read it; do not create a separate "visual direction" agent.
- Use a project `role-briefs.md` for multi-agent work. It translates the same project goal into planner/layout/designer/component/reviewer/presenter-specific guidance; it is not a new role.
- Keep skill references/templates generic. Project-specific deck titles, page IDs, current workflow states, customer names, screenshots, and feedback belong in the project scaffold or clearly marked examples, not in generic rules.
- After editing the shared Skill, run `node templates/leander-ppt-scaffold/tools/lint-scope-hygiene.js --skill-root .`.
- Run `node tools/verify-design-gates.js` at outline/blueprint/page stages to prove design rules are present in the executable artifacts, not only written in prose.
- Keep canonical terms in `terminology.json` for decks with repeated framework concepts; run `node tools/verify-terminology.js` after title/outline/blueprint changes.
- Keep lightweight task memory in `state/`; run `node tools/verify-state-memory.js` when the deck explains state, memory, recovery, or handoff.
- After every phase output or feedback round, update artifact labels with `node tools/artifact-map.js --write`; report files as user-confirm, next-input, internal-evidence, final-output, or archive-reference.
- Fix obvious overlap, clipping, crooked connectors, unreadable text, meaningless accent colors, dead space, and text-card-only pages before delivery.
- Do not invent data, customer claims, implementation status, logos, or external facts.

## Token-First Entry

For an existing scaffold, start with a compact context packet:

```bash
node tools/context-pack.js --mode status
node tools/context-pack.js --mode repair --pages p11,p12
node tools/context-pack.js --mode agent --role reviewer-zh --pages p09,p11
```

Use the packet's `recommendedReads` as the default context boundary. Expand only when changing story, theme, layout blueprint, shared components, or final delivery gates.

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
| Agents | Coordinate planner/layout/designer/component/reviewer/presenter roles | `references/AGENT-COLLABORATION.md` + `references/ROLE-GUIDANCE.md` + relevant `agents/*.md` |
| Artifacts | Distinguish what the user reviews from what the next task consumes | `references/ARTIFACTS.md`; run `tools/artifact-map.js --write` |
| Learning loop | Log, classify, promote, archive recurring lessons | `references/SELF-EVOLUTION.md` + `references/LESSONS.md` |
| Scope hygiene | Edit skill rules, templates, examples, or feedback logs without leaking project facts into generic rules | `references/SCOPE-HYGIENE.md` |

## Checkpoints And Gates

Do not skip these unless the user explicitly bypasses them and the bypass is recorded.

| Gate | Evidence | Blocks |
|---|---|---|
| Gate 1 Plan | `brief.md`, `outline.md` self-check pass | Design/theme/blueprint work |
| Gate 1.1 Design, terms, state | `DESIGN.md`, `visual-direction.md`, optional `terminology.json`, `state/run-state.json` | Layout blueprint and production |
| Gate 1.2 Design hard gate | `output/design-gate-audit.md/json` from `tools/verify-design-gates.js outline` | Layout blueprint |
| Gate 1.3 Theme | Named theme/template contract + approval | Layout blueprint and anchor samples |
| Gate 1.5 Layout blueprint | `layout-blueprint.md/json` + stable SVG previews + geometry/QA evidence + diversity audit + approval/bypass | Anchor samples and production |
| Gate 3 Scaffold | Project scaffold with `theme/`, `components/`, `pages/`, `tools/`, `deck.config.js` | PPTX generation |
| Gate 4 Page folders | `pages/<id>/{page.js,page.json,qa.md,out/}` | Production and repair |
| Gate 4.5 Visual selection | `visual-selector.v2`, ranked routes, confidence/margin, and matching `visualBinding` | Anchor/production/repair |
| Gate 4.6 Dynamic QA | Chinese compact `qa-profile.zh.v2` in every content `page.json` | Rendered QA/build |
| Gate 4.65 Page design hard gate | `output/design-gate-audit.md/json` from `tools/verify-design-gates.js pages` | Rendered QA/build |
| Gate 4.7 Runtime and QA evidence | `out/component-trace.json` + `qa-result.json` hashes and per-rule evidence | Rendered QA/build |
| Gate 4.75 Agent evidence | event-triggered `agent-collaboration.v2` + role artifact hashes | Final build |
| Gate 4.8 Artifact map | concise `artifact-manifest.v3` updated after the current output | User report and next-phase handoff |
| Gate 5 Anchor proof | Rendered editable sample slides + user approval | Full production |
| Gate 5.5 Phase transition | `checkpoint-status.json` approves plan, blueprint, theme, anchor, production mode | Phase 4 |
| Gate 6 Rendered QA | PNGs/contact sheet + QA notes + fail items fixed | Reporting completion |
| Gate 7 Change impact | Full re-render/re-review after shared theme/component edits | Reporting after shared change |

Use the scaffold gates:

```bash
node tools/lint-layout-blueprint.js
node tools/render-layout-blueprint.js
node tools/lint-blueprint-preview.js
node tools/verify-design-gates.js outline
node tools/verify-design-gates.js blueprint
node tools/verify-design-gates.js pages
node tools/verify-terminology.js
node tools/verify-state-memory.js
node tools/verify-checkpoints.js phase4
node tools/artifact-map.js --write
node tools/lint-scope-hygiene.js --skill-root <skill-root>
node tools/deck.js render
node tools/deck.js verify
node tools/deck.js verify --final
node tools/deck.js build
```

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

For production decks, page-production workers do not satisfy role review. Full-deck render always triggers reviewer; visual/component roles trigger on visual risk, shared changes, or low-confidence selection; internal sharing triggers presenter.

Every role must read the project `role-briefs.md` section for its role before producing evidence. If a real subagent is not used, the main-agent fallback must still apply that role brief and record the fallback.

## Production Rules

- Use the approved outline, theme, layout blueprint, and anchor style.
- Prefer the smallest unit: page repair -> batch -> chapter -> full deck.
- In Mode A, set `workflow.stage = "production-batch"`, whitelist only the current `activePages`, and write `batchFileName`; use `production` only for the integrated final deck.
- Before page implementation, route the visual form, inspect relationship/slots/capacity/theme/risk evidence and confidence margin, then draw.
- Do not bypass the component library with custom boxes before evaluating component-library, external-graphic, image2, and page-specific-custom routes.
- Treat component-library maintenance as a separate temporary mode. Run `enrich-component-registry`, `build-component-index`, and `lint-component-library --strict` only when evolving shared components, not during routine page production.
- Keep shared tokens/components in shared files; keep slide-specific implementation inside that page folder.
- If a shared token or component changes, trigger Gate 7.
- Do not report a pile of generated files. Use `artifact-manifest.md` to separate files that require user confirmation from files that only feed the next step.

## Feedback Loop

Every repair must:

1. Map feedback to page/component/token.
2. Patch the minimum unit.
3. Re-render affected pages; full deck if shared changes occurred.
4. Re-run QA, update `qa-result.json`, and generate the Chinese `qa.md` summary.
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
