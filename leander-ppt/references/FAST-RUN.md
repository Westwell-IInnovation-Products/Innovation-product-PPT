# Fast Run And Token Discipline

Use this file when the task is a repair, iteration, QA pass, or small extension. The goal is to preserve final slide quality while avoiding full-context rereads.

## First Move In Existing Projects

When a scaffold already exists, do not start by rereading every reference file. Run the compact status phase first:

```bash
node <skill-root>/scripts/sync-scaffold-tools.js <project-root>
node tools/run-phase.js status
node tools/phase-handoff.js verify
node tools/context-pack.js --mode status
node tools/context-pack.js --mode repair --pages p11,p12
node tools/context-pack.js --mode agent --role reviewer-zh --pages p09,p11
```

`run-phase.js` writes the context packet and artifact map while keeping successful mechanical logs out of the model response. Use direct `context-pack.js` commands for a targeted repair or role packet.

## Heavy History Boundary

- Use one new Codex task per new deck. Do not run a Token A/B deck inside the task used to modify the Skill.
- Gate 0 checks pre-existing root-task usage before creating its baseline. It refuses an already-heavy, compacted, or unobservable task instead of hiding old history behind a new baseline.
- At every approved Gate and successful mutating `run-phase` boundary, refresh `state/phase-handoff.json` after recording the Token checkpoint and context-budget decision.
- Compute rotation only from chronologically ordered calls of the active root task; subagent and inactive historical-root calls remain in the Token report but cannot mask or trigger the active task's budget.
- Re-evaluate the current budget before every protected `run-phase` and `deck.js render|verify|build` command. Direct deck entrypoints are not a bypass.
- If the currently active root rollout is unreadable or its Gate 0 baseline cannot be reconstructed, block protected commands instead of treating missing usage as zero.
- If the active root's recent-call average reaches 120k input tokens, one call reaches 180k, or the active root compacts, write a pending `state/context-rotation-lock.json`. The old task cannot render, verify, build, approve another checkpoint, or run another production phase.
- Open a fresh task, run `node tools/token-ledger.js attach-thread`, then read only `state/phase-handoff.json` and its `recommendedReads`. The attached rollout must be the current `CODEX_THREAD_ID` and must have been created after the lock. Historical real IDs, fabricated IDs, and the previous root are rejected. After attachment, the old task remains blocked because every production command must match the ledger's active root task.
- Do not paste or summarize the entire old conversation into the new task. The project artifacts and their hashes are the continuation contract.
- Do not treat `context-pack.js` as host-history deletion. It limits project-file reads; only a fresh task removes repeated host conversation history.
- A task rotation never carries approval by prose: the same workflow receipt and checkpoint hashes remain mandatory.

Use the packet to decide which files to open. Treat `recommendedReads` as the default context boundary; expand only when the packet shows a stale route, missing QA, changed story, changed theme, or shared component impact.

Before reporting results from any continuation or repair, update the artifact labels:

```bash
node tools/artifact-map.js --write
```

Then report only the important groups: what the user should confirm, what is final output, and what remains as next-step input.

## Operating Modes

### Full Mode

Use for a new deck, a new theme, or a major component-library change.

Read:
- `SKILL.md`
- current phase reference files
- `PAGE-DESIGN-METHOD.md`
- `VISUAL-SELECTION.md`
- `QA.md`
- compact component index first, full catalog only when needed

Expected work:
- outline
- layout blueprint
- anchor samples
- full production
- full render and review

### Compact Continuation Mode

Use when continuing an existing deck after checkpoints already exist.

Start with:
- `node tools/context-pack.js --mode status`
- `checkpoint-status.json` only if the pack shows missing approvals
- affected `page.json/page.js/qa.md` files only
- `layout-blueprint.json` only when layout rhythm or visual signatures change
- `outline.md` only when page story, claims, or page count change

Do not reread:
- full `COMPONENT-CATALOG.md`
- full `LESSONS.md`
- all page files
- all role reports

unless the current packet exposes a mismatch that needs those files.

### Repair Mode

Use for page feedback, small wording/layout repairs, or one component fix.

Read only:
- affected `pages/<id>/page.json`
- affected `pages/<id>/page.js`
- affected `pages/<id>/qa.md`
- the component function used by that page
- relevant active lessons
- `QA.md` only if the repair changes visual quality or delivery status

Do not reread the full component catalog or whole deck unless:
- the fix changes shared theme tokens or shared components
- the page route is wrong
- the user asks for a full-deck review

### Fast QA Mode

Use before showing an iteration preview.

Check:
- render freshness
- page visual route binding
- visible overlap/clipping
- peer text size consistency
- connector geometry
- theme chrome consistency
- affected user feedback items

Inspect only affected pages plus any pages touched by a shared component.

### Deep QA Mode

Use before final delivery, after global theme/component edits, or when the user says the deck still feels wrong.

Check the full contact sheet and full-size key pages. Run the complete QA checklist and read the relevant active lessons.

## Context Budget Rules

- Default to compact continuation mode after Gate 1.5, unless the user asks to rebuild the whole story or theme.
- Use `tools/context-pack.js` as the first read surface for existing scaffold projects.
- Keep status reads near 3k estimated text tokens, repair packets near 10k, and role packets near 16k; exceed them only for a named missing decision.
- Prefer `component-index.min.json` over `COMPONENT-CATALOG.md` for routine selection.
- Read full component docs only after a candidate component is shortlisted.
- Read `LESSONS.md` by active category, not as a memory dump. If no category is known, read only the top active section or use the reviewer agent to check rendered artifacts.
- For long decks, inspect only the page slice being repaired unless a shared component changed.
- Use layout blueprint previews before full production to catch structural issues cheaply.
- Use `artifact-manifest.md` to avoid asking the user to inspect next-step inputs or internal evidence as if they were review artifacts.
- Do not paste large generated code or full registry content into reasoning when a file path and candidate name is enough.
- For subagents, pass a context pack, role spec, affected PNG/page.json paths, and the exact question. Do not pass full outline, full catalog, full QA, and all prior reports by default.
- For component work, shortlist from `component-index.min.json` first; open `COMPONENT-CATALOG.md` only for the selected component family or when the index lacks the needed relationship primitive.

## Minimal Repair Loop

```text
map feedback -> locate page/component/token -> patch -> render affected pages -> fast QA -> update qa.md -> update artifact-manifest -> log lesson if general
```

If the fix touches `theme/` or `components/`, switch to Gate 7: render and review the full deck.

Use `node tools/change-impact.js inspect` before repairs. QA/source/route-candidate evidence can change without a PNG render; selected route outcome or render inputs invalidate only that page; theme/component changes invalidate all pages. Use `node tools/qa-batch.js init --pages <ids>` so still-current QA work is preserved.
