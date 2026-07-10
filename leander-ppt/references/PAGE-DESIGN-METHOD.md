# Page Design Method

Use this method before drawing or repairing a slide. It is distilled from repeated repairs on mechanism pages where the first draft looked tidy but still failed because the visual form, artifact truth, image choice, or alignment was wrong.

## 1. Start From The Message, Not The Component

Write the one sentence the page must prove. Then classify the relationship the audience must see:

- `sequence`: steps, route, stage handoff.
- `state`: memory, lifecycle, isolation, current/next status.
- `toolbox`: tool pool, asset library, selectable capability set.
- `evidence`: data, proof, render result, source comparison.
- `contrast`: before/after, problem/solution, wrong/right.
- `system-map`: modules, dependencies, architecture.
- `scene`: product, real-world situation, metaphor, or visual sample.

Do not choose a graphic because it looks convenient. Choose it because it makes the relationship visible.

After the coarse relationship, classify a **relationship subtype** and **visual signature**. Coarse relationships are not enough for layout decisions. For example, three pages may all be `contrast`, but one may need problem tension, one may need concept boundary, and one may need before/after benefit.

Use these starter subtypes:

| Coarse relationship | Relationship subtype | Visual signature | Use when |
|---|---|---|---|
| `contrast` | `compare.problem-tension` | `problem-tension` | The page creates urgency or explains why the old way fails |
| `contrast` | `compare.concept-boundary` | `concept-boundary` | The page distinguishes two concepts or shows containment / dependency |
| `contrast` | `compare.before-after-benefit` | `before-after-benefit` | The page shows improvement after adopting a method |
| `sequence` | `sequence.orchestration` | `stage-gate-flow` | The page explains ordered execution and human checkpoints |
| `sequence` | `sequence.end-to-end` | `full-process-spine` | The page summarizes the whole production flow |
| `state` | `state.folder-zoom` | `selected-folder-expansion` | The page explains page isolation, local memory, or file-based state |
| `state` | `state.lifecycle` | `state-lifecycle` | The page explains version/status changes over time |
| `toolbox` | `toolbox.tool-tree` | `tool-tree-with-call-engine` | The page explains a tool pool and how a page selects tools |
| `system-map` | `system.module-map` | `module-correspondence-map` | The page explains modules, responsibilities, and outputs |
| `ecosystem` | `ecosystem.landscape` | `domestic-landscape` | The page maps a market / industry / implementation landscape |
| `ecosystem` | `ecosystem.method-transfer` | `method-transfer-map` | The page shows one method expanding into multiple scenarios |
| `evidence` | `evidence.convergence` | `platform-convergence` | The page shows multiple external moves converging to one direction |
| `decision` | `decision.boundary` | `share-boundary-filter` | The page explains what enters / does not enter a shared pool |
| `lifecycle` | `lifecycle.feedback-loop` | `learning-flywheel` | The page explains repeated learning and self-evolution |

If no subtype fits, create a new one in the page contract and later consider whether it should become a reusable component tag.

## 2. Choose The Route With A Four-Way Gate

For every content page, evaluate the four production routes in this order:

1. **Component library**: best for editable structure and repeated relationships.
2. **External graphic**: best for real evidence, screenshots, maps, existing PPT assets, product renders.
3. **image2 / imageSlot**: best for realistic scenes or simple metaphors that look crude as vector.
4. **Page-specific custom**: last resort, only after the first three are considered.

When using image2, keep the image simple. Prefer one subject, 3-5 objects, one clear direction, and no text. A busy image with many cables/documents/details weakens a PPT page even if it is technically good art.

## 3. Match The Real Artifact

If the page explains files, folders, tools, components, versions, or repositories, inspect the actual artifact first.

- Show only files/folders that exist.
- If a memory is inside a file, label it as a field, not a separate file.
- If a mechanism is planned but not implemented, label it as planned.
- Do not mix conceptual architecture and actual scaffold structure unless the page explicitly separates them.

## 4. Compose Before Decorating

Decide the layout skeleton before drawing details:

- Split: problem vs solution, before vs after, text zone vs graphic zone.
- Tree: root -> branches -> details.
- Flow: start -> stages -> evidence/result.
- Folder/asset view: collection -> selected item -> expanded contents.
- Evidence board: claim -> proof -> boundary.

Then place text into the graphic, not beside it. Use labels, chips, stage numbers, folder tabs, and callouts as part of the visual structure.

If a layout blueprint contract exists, start from it:

```text
blueprint visualSignature -> candidateFamilies -> selected component/layout block -> page composition
```

Do not reset the page to a generic component just because the component has a high score. The component must serve the approved visual signature, or the override must be recorded.

## 5. Assign Color Roles Before Styling

Before drawing final components, convert the blueprint's `colorIntent` into page-level color roles:

- Red = focus, conflict, risk, current selection, gate, or key change. Use it sparingly and make the reason visible.
- Navy = stable structure, baseline system, reusable asset, normal path.
- Light blue / neutral gray = support, inactive peers, secondary evidence, scaffolding.
- Light red = selected or changed background, not a decorative fill.
- Cyan = brand marker only unless the theme explicitly says otherwise.

For every page, name:

- `accentTarget`: the one object or relationship that gets the strongest red emphasis.
- `neutralElements`: peer objects that must stay quiet.
- `colorReason`: why the accent color helps the story.

If everything is red, nothing is important. If color does not explain logic, remove it or demote it.

## 6. Use Image2 Sparingly And Simply

Use image2 when vector drawing becomes stiff, but constrain it:

- Simple composition: one focal object, few supporting objects, low line density.
- No text, no labels, no logo, no UI microcopy.
- Transparent PNG preferred; verify alpha channel before placing.
- If the generated image looks visually busy, regenerate with a stricter prompt or fall back to a simpler vector metaphor.

## 7. QA The Geometry And Typography

Before marking PASS:

- Connector lines intended to be straight must be horizontal/vertical or intentionally curved.
- Peer cards use the same title/body size and baseline.
- Paired result boxes align and use the same role-based type scale.
- Text clears strokes, arrows, icons, and image edges.
- White space is symmetric or intentionally assigned to a visual focal point.
- Icons must visually communicate the represented asset type; do not add circular icon backgrounds unless they carry meaning.

## 8. Repair Pattern

When feedback arrives:

1. Map each comment to content, route, artifact truth, layout, typography, geometry, or asset quality.
2. Fix the route or component first if the same issue can recur.
3. Patch the smallest page set.
4. Re-render before judging.
5. Log the generalizable lesson.
