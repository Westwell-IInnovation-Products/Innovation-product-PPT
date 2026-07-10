# Fast Run And Token Discipline

Use this file when the task is a repair, iteration, QA pass, or small extension. The goal is to preserve final slide quality while avoiding full-context rereads.

## First Move In Existing Projects

When a scaffold already exists, do not start by rereading every reference file. Build a compact state packet first:

```bash
node tools/context-pack.js --mode status
node tools/context-pack.js --mode repair --pages p11,p12
node tools/context-pack.js --mode agent --role reviewer-zh --pages p09,p11
```

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
