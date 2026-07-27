# Changelog

## 0.6.0-beta.20 - 2026-07-23

- Single-task mode: a whole deck is produced in one Codex task. `task-portfolio.js` now plans exactly one job (was 3–6 adaptive root tasks); `deck.config.js` sets `preferredRootTasks`/`maxPlannedRootTasks` to 1 and zeroes the budget thresholds.
- Retire the token budget ceiling, rotation, and active-task/observability fail-closed enforcement. `context-budget-gate.js` no longer blocks: no 260k/180k/220k limit, no rotation lock, no INACTIVE-TASK/observability block, no `[水位]` water-line. The Token ledger stays for cost measurement only.
- User-approval checkpoints (plan/blueprint/anchor/production-mode) and every quality gate (Gate 0 freshness, tool-freeze, quality baseline, geometry audit, user-feedback, source-evidence, agent receipts, final-gate pixel compare, cover/closing chrome) are unchanged — the retired stops are only the token-based task-splitting ones.
- Trim `hard-gate-contract.js` and `hard-gate-blackbox.js` to the still-active workflow contracts (drop the retired budget/rotation/task-binding assertions); update `context-budget-gate` / `task-portfolio` self-tests. Rewrite SKILL.md, README.md, TOKEN-BUDGET.md, FAST-RUN.md, HARD-GATE.md, SCAFFOLD.md accordingly.

## 0.6.0-beta.18 - 2026-07-23

- Cut the agent roster from 6 to 4. Merge `layout-architect-zh` into `planner-zh`: story/outline and the whole-deck layout blueprint are one planning decision, produced in a single pass (`planner-zh` now triggers on both `storyChanged` and `layoutChanged`).
- Remove `presenter-zh` as a role. Speaker notes (`speaker-notes.md`) become a main-agent deliverable step, so the capability is kept without spending a fresh-fork review pass; the `rehearsalRequested` event is retired.
- Update the role wiring end to end: `deck.config.js` triggers/events, `context-pack.js` role reads, `plan-agent-events.js` input digests and fresh-review scope, `artifact-map.js` speaker-notes labelling (now file-existence based), and `migrate-agent-collaboration-v3.js` active-role list. Historical evidence in existing projects is still preserved — `migrate()` copies pre-existing role entries through verbatim.
- Route `references/QUALITY-LOCK.md` from the SKILL phase map so it is reachable instead of orphaned.

## 0.6.0-beta.17 - 2026-07-23


## 0.6.0-beta.15 - 2026-07-23

- Bind delta revisions to baseline page hashes and actual diffs.
- Bind claims to hashed source snapshots and close render/runtime dependencies.
- Require approval and agent-run receipts for formal workflow evidence.
- Route formal verification through one fail-closed final gate.
- Build to staging, render and pixel-compare the final PPTX, then atomically publish.
- Isolate and watermark draft builds so they cannot overwrite canonical output.
- Distinguish `stateFlow.current/currentState` from `failed` in both renderer and registry contracts.
- Allow component-led pages to declare page-local extensions explicitly through `localExtensionSlots`; undeclared or orphan slots fail preflight.
- Require full-size visual evidence to bind semantically to the inspected PNG set while agent receipts bind the final report, removing the former circular hash dependency.
- Hash render-diversity evidence semantically so volatile generation timestamps cannot invalidate an otherwise identical render set.
- Keep component metadata overrides authoritative during registry enrichment, including `stateFlow.currentState` and the `closing` component.
- Render and geometrically lint the `tension-bridge` blueprint family so a broken governance bridge cannot bypass preview coverage.
- Bound external tool version probes in `environment-doctor` and fail closed on timeout, non-zero exit, or empty output.

## 0.6.0-beta.14 - 2026-07-23

- Require hash-bound `full-size-inspection.v1` evidence for every final reviewer page.
- Reject generic QA observations and require explicit contrast cardinality/scale evidence.
- Require final reviewer full-size coverage for every current page.

## 0.6.0-beta.13 - 2026-07-23

- Carry prior user approvals forward on a verified `delta-revision`: `workflow-gate.js init redesign` now preserves the approved `designTermsState`/`theme`/`layoutBlueprint`/`anchorSample`/`productionMode` (re-stamped under the new `runId` with a `carriedFromRunId` provenance) and reopens only `plan` for the user to confirm the revision scope, instead of resetting every checkpoint and forcing a full pipeline re-walk.
- Keep `full-rebuild` and first-time `create` resetting all checkpoints; delta reuses the existing task portfolio instead of force-replanning it.
- Add a deterministic `workflow-gate.js --self-test` (pure `planCheckpointTransition`) and register it in the regression suite; document the carry-forward and the delta short pipeline in `SKILL.md` and `references/REVISION-MODE.md`.

## 0.6.0-beta.12 - 2026-07-22

- Replace recent-call-only pacing with cumulative per-root-task accounting that includes descendant subagents; add 180K execution-stop, 220K handoff-only, 260K contract limit, and a 40K completion reserve.
- Ship the new budget policy in `report-only` mode first. Main-call and subagent counts are telemetry, not hard caps; enforced rotation is enabled only after real-deck calibration.
- Add `task-portfolio.js` for adaptive 3–6 job planning and `resume-job.js` for one-command attach/handoff/context/job continuation.
- Make context packs strict by default and auto-prune optional reads before failing required context.
- Add `qa-evidence-index.js` so reviewers consume compact per-rule digests and changed/failed page scope instead of repeatedly loading all page QA evidence.
- Update event planning to V3 delta-first reviewer scope and reject duplicate runs only when the same event digest is reviewed more than once.

## 0.6.0-beta.11 - 2026-07-21

- Add `Base2` as a fourth built-in theme for internal mechanism, evidence, status, governance, and decision decks.
- Add reusable radius, elevation, stroke, and component-style tokens while keeping Leander Base brand chrome and backward-compatible component fallbacks.
- Register `Base2` across the component library, document its semantic color and state-rail rules, and add deterministic theme-contract regression coverage.

## 0.6.0-beta.10 - 2026-07-21

Cost + design-repetition round, driven by the first complete beta.9 field run (team-skill deck, 20 pages, 1,085 calls / 115.8M input).

- Kill the SVG contact-sheet token trap: `render-contact-sheet.js` inlines every page PNG as base64, so the full-deck `.svg` is ~2.27MB (~568k text tokens). `context-pack.js` now (a) prices `.svg` as text instead of a zero-cost visual, so the budget can no longer be blind to it, and (b) points `visual-designer-zh` / `reviewer-zh` read lists at the model-readable `.png` contact sheet, not the `.svg`. `run-phase.js` now generates the `--png` sheet in-pipeline so the PNG the downstream consumers already prefer actually exists.
- `primaryShapeClass` guard against rendered-shape duplication (the p12≈p14 case: distinct `skeletonFamily` labels, identical diamond-fanout render). New controlled-vocabulary blueprint field (11 shapes); `lint-layout-blueprint.js` validates it and caps reuse (>3 same class blocks, 2-3 warns), `render-diversity.js` forces same-class page pairs into mandatory side-by-side review. Occupancy features cannot see shape gestalt; this closes that gap.
- Chapter authoring rhythm: SKILL.md Session Rhythm + PRODUCTION.md now separate the authoring/QA-fill unit (chapter — read a chapter's page.js and fill its qa-results in one pass) from the storage/digest unit (page — keep incremental re-render). Never merge a chapter into one folder or one qa-result.
- Delta re-review: reviewer-zh brief + AGENT-COLLABORATION.md require the FIX-FIRST follow-up review to read only changed pages + open findings, not the whole batch again (a top token sink in the field run).
- Threshold ladder unchanged from beta.9 (nag 120k / plan-handoff 180k / hard 260k).
- Review-budget follow-on (config + docs only, no tool change, no re-sync): the template `deck.config.js` drops `fullDeckRendered` from `visual-designer-zh`'s triggers, so final review defaults to reviewer-only — opening `fullDeckRendered` no longer pulls a redundant full-deck visual re-review (the anchor already locks style and the final reviewer covers visual/composition/shape-class). Field evidence: the team-skill deck ran a 3-role final (reviewer+visual+presenter) purely because it opened `fullDeckRendered` and `rehearsalRequested`; the visual-final alone cost ~2.78M. SKILL.md + deck.config comments now state that each opened event adds a fresh-fork review role (real token cost) and presenter is a deliverable step, not a gate.

## 0.6.0-beta.9 - 2026-07-17

- Cost round (evidence: beta8 field run, 9 threads / 683 calls / 100.65M raw input; one mixed-job thread burned 40%): pace by one-job sessions instead of thresholds.
- Auto token checkpoints inside `enforceBudget` so `deck.js render/verify/build` and `run-phase.js` phases record gate-level deltas without manual `token-ledger.js checkpoint` calls (fixes the post-blueprint accounting gap).
- Context watermark surfaced everywhere: `context-budget-gate.js --tail` advisory line after every `deck.js` verb and a `watermark` field in every `run-phase.js` summary.
- Threshold ladder rescaled: nag 80k -> 120k, plan-handoff 120k -> 180k, hard rotate 180k -> 260k (Gate 0 refusal mirrors 180k/260k); rotation stays a backstop while `SKILL.md` codifies Session Rhythm (one job per session, review offloaded to disposable subagents).
- Model-readable review evidence: `render-contact-sheet.js --png` grid sheet and new `tools/zoom-crop.js` for pixel-level overlap verification.
- `run-phase.js status` no longer hard-fails on the fixed 3k status context-pack budget (production-scale state files exceeded it; the strict exit only ever blocked its own outputs).

## 0.6.0-beta.8 - 2026-07-16

- Establish the current release-clean Codex-only IInnovation-Products_ppt baseline in the shared repository.
- Add fail-closed Gate, context rotation, rendered QA, risk-tier review, component registry V3, and release hygiene tooling from the installed Skill.
- Introduce the team contribution and curator promotion pilot without shipping project state, raw feedback, or render evidence.
