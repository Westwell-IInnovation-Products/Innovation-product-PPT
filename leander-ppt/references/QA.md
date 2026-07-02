# PPT QA Protocol

QA is mandatory. The first render is assumed to have issues.

## When To Read

Read this file before reporting any sample or full deck as done.

## Pre-Flight: Accumulated Lessons

Before the checklist below, read [`LESSONS.md`](LESSONS.md) and check the deck against every accumulated lesson. It is the deduplicated list of defects this skill has already been corrected on; re-shipping one of them is an automatic fail. This list grows over time — always re-read it, do not rely on memory.

## Hard Rule

Every generated PPTX must be rendered to images before delivery. Inspect a contact sheet and key pages at full size. Fix visible issues before reporting completion.

Use the most independent review method available:

1. **Reviewer subagent** using the shipped [`agents/reviewer.md`](../agents/reviewer.md): pass the preview PNG dir, the `outline.md` slice, and the theme. It returns pass/fail + evidence + repairs + a SHIP/FIX-FIRST verdict.
2. Self-check only if subagents are unavailable: walk the checklist item by item. A quick glance is not enough.

Fail items must be repaired before reporting completion unless the user explicitly accepts the risk.

## Definition of Done (artifact-gated)

No prose gate can *force* the agent to run QA — so make skipping it **visible** by tying "done" to artifacts the user can see:

- **`qa.md` exists and lists every page with a PASS/FAIL verdict** (use the scaffold template). A deck with no per-page qa.md is not done.
- **The final report pastes the reviewer's verdict block** (`Scope/Pass/Fail/Risk/Verdict`). If you cannot paste a reviewer verdict, you did not run the review — say so explicitly rather than implying QA happened.
- **Every render (samples, full deck, each feedback re-render) refreshes qa.md.** A qa.md older than the latest render = stale = not done.

This is the honest enforcement: not a guarantee of execution, but the absence of the artifact (or a stale one) is a visible signal to you and the user that Gate 6 was skipped.

## Required QA Artifacts

- Output `.pptx`.
- Exported slide PNGs.
- Contact sheet **or** per-slide inspection (if no montage tool is available — record which).
- `qa.md`: per-page PASS/FAIL, what was fixed, remaining risks, + the reviewer verdict block.
- For repairs: affected page IDs and what was intentionally not changed.
- Theme/template evidence: selected theme name, approved anchor sample path, and component source summary.
- Scaffold evidence: generator path, theme/component imports, and chapter/page contract location.

## Visual QA Checklist

Check every slide, then zoom into key slides.

- [ ] Page ID/page number can be traced back to `outline.md`.
- [ ] Page can be traced to its `pages/<id>/page.json` contract.
- [ ] Page uses the approved theme/template and looks consistent with approved anchor samples.
- [ ] Page uses declared component sources; custom components are justified.
- [ ] No element is outside the page or clipped.
- [ ] No overlap between text, arrows, icons, shapes, or images.
- [ ] Body and card text are readable.
- [ ] Page does not lean accidentally to one side.
- [ ] Whitespace is designed rather than empty.
- [ ] Each content page has a real diagram, image, chart, or visual explanation.
- [ ] Icons and images carry information, not decoration only.
- [ ] Fills and lines are mixed intentionally.
- [ ] Font usage follows the theme.
- [ ] Claims and numbers preserve source boundaries.
- [ ] No placeholder, fake data, or missing asset is hidden.

Template mismatch is a QA failure even if the slide has no clipping, overlap, or unreadable text.

Automatic fail conditions:

- A multi-slide deck was generated from a loose one-off script instead of a scaffold.
- A new palette, logo treatment, grid, or font system was defined inside page code after theme approval.
- The preview uses an image mockup that does not come from rendering the actual PPTX.
- Sample pages were not generated from the same theme/component system intended for full production.
- A page has no real visual explanation and is only text cards.
- A fallback toolchain was used but not recorded in `qa.md`.
- **Color carries no meaning**: a page uses two or more colors whose difference encodes nothing (decorative rainbow). See `SLIDE-CRAFT.md` → Color Semantics.
- **Asymmetric dead whitespace**: a content block is pinned to the top with a large empty band above the footer, and the block is neither filling the body nor vertically centered. See `SLIDE-CRAFT.md` → Fill The Body.
- **Background or logo inconsistency**: a content page uses a different background than the cover/section pages, or the logo size/position differs across pages instead of the single theme standard.

## Design Review Pass (Required)

Rendered-QA is not only "nothing clips." After the mechanical checks, run a dedicated **design review** specifically hunting AI-smell, using the most independent reviewer available (reviewer agent → subagent → self-check, per the methods above). The design review must answer, per page:

- Does every distinct color encode a real meaning (emphasis, category, status, progression)? Name it. Flag any decorative color.
- Is the body filled or symmetrically centered, with no asymmetric dead whitespace? Flag top-pinned blocks with empty bottoms.
- Is the background and logo (size + position) identical to the rest of the deck?
- Does any element (icon, number, shape) float alone in space without anchoring content?
- Would a designer call this intentional, or auto-generated?

Treat design-review findings with the same weight as clipping/overlap: fix them before reporting completion. Prefer fixing the **shared component** so every page using it improves at once, not the single page.

## Content QA Checklist

- [ ] Page order matches `outline.md`.
- [ ] Every page title and takeaway match the outline.
- [ ] Critical facts, numbers, names, and dates match source material.
- [ ] Achieved, planned, estimate, and public-reference claims are labeled.
- [ ] The deck type still matches the brief.
- [ ] No AI-style empty phrases have entered titles or key copy.

## Sample QA

For anchor samples, do not proceed to full production until:

- [ ] The sample PPTX is exported and inspected.
- [ ] The cover or tone page is acceptable.
- [ ] The core content page proves the density and diagram style.
- [ ] The most complex page proves the method can handle hard layouts.
- [ ] The sample was generated from the intended scaffold/theme/component files.
- [ ] Each sample page declares page ID, theme, component source, asset source, and data boundary.
- [ ] The user has approved or explicitly asked to continue despite known issues.

## Full Deck QA

After full production:

1. Export all pages to PNG.
2. Build a contact sheet.
3. Inspect the contact sheet for obvious rhythm, density, and consistency issues.
4. Compare the contact sheet against approved anchor samples and selected template rules.
5. Inspect at least all section pages, the most complex diagram pages, all dense text pages, and the closing page at full size.
6. Fix issues in the generator or source PPT, regenerate, and re-export affected pages.

## Repair QA

For feedback on existing slides:

1. Identify affected page ID(s).
2. Patch the smallest affected unit: page, component, or theme token.
3. Re-export affected pages.
4. If a shared component or theme token changed, re-export every affected page and refresh the contact sheet.
5. Confirm no unrelated pages changed unless required.
6. Report the repair scope.
7. **Log the lesson.** Append a structured entry to [`feedback/LOG.md`](feedback/LOG.md) capturing the general lesson, and if it recurs or is universal, distill it into [`LESSONS.md`](LESSONS.md). A repair is not complete until logged — see SKILL.md → Feedback & Lessons Loop.

## Reviewer Prompt Contract

When using a reviewer agent or subagent for QA, provide:

- Artifact path: PPTX and rendered PNG/contact sheet path.
- Task scope: brief/outline/sample/full deck/repair.
- Relevant checklist path: this file plus `SLIDE-CRAFT.md` or `PRODUCTION.md` as needed.
- Relevant outline slice or affected page IDs.
- Exact output format: pass/fail items, evidence, and suggested repairs.

Do not provide your own diagnosis unless the reviewer is explicitly validating a known fix. Keep the review independent.

Expected reviewer output:

```text
Scope:
Pass:
Fail:
- <item> / evidence / suggested repair
Risk:
```

After reviewer output, repair fail items first. Reporting reviewer findings without repair is not complete.

Reviewer must explicitly answer:

- Did the output use the scaffold and approved theme/component system?
- Does the rendered preview match the approved anchor/template direction?
- Are any pages one-off, off-template, or lower-confidence fallbacks?

## Reporting Format

When done, report:

- Output PPTX path.
- Preview/contact sheet path.
- What was checked.
- What was fixed after QA.
- Remaining risks or known limitations.
- For repair tasks: affected page IDs and unchanged scope.

Do not report "done" if obvious visual defects remain.
