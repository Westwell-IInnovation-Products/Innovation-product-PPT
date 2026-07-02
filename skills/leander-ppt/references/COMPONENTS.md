# PPT Component Library

Reusable components prevent every deck from being redesigned from zero.

## When To Read

Read this file when creating anchor samples, extending a template, or extracting reusable patterns from existing PPT materials.

After reading this file, use `COMPONENT-CATALOG.md` as the current menu of reusable page components extracted from internal decks. The catalog is intentionally generic: source PPTs are references, not one-off case rules.

## Component Types

Leander PPT should accumulate components in three layers.

### 1. Editable PPT Components

Preferred for final deck output.

- Cover hero.
- Section divider.
- Big-word + card matrix.
- Four-column mechanism.
- Three metric cards.
- Timeline / roadmap.
- Flow / process.
- Layered architecture.
- Hub-and-spoke system map.
- Evidence board with caveat band.
- Dashboard mockup.
- Before/after comparison.
- Risk / priority stack.
- Image-led product page.

These should be built from PowerPoint text, shapes, lines, icons, tables, and images wherever possible.

### 2. Static Render Components

Use when the visual is too complex for editable PPT shapes or when fidelity matters more than editability.

- ECharts charts.
- Mapbox maps.
- Three.js / Spline 3D scenes.
- Rive animation still frames.
- Canvas / SVG diagrams.
- Complex simulation renderings.

Render them to high-resolution PNG/SVG, insert into PPT, and keep source files in the working folder. Label the component as non-editable or partially editable.

### 3. Reference Mock Components

Use only during design exploration.

- HTML/CSS mockups.
- Spline scene previews.
- Rive animation previews.
- Three.js prototypes.

Do not treat reference mocks as final PPT unless exported and QA checked.

## External Library Policy

| Library | Best use in PPT workflow | Final output |
|---|---|---|
| ECharts | Charts, dashboards, trend comparisons, sankey, radar | PNG/SVG; sometimes editable via reconstructed PPT shapes |
| Three.js | 3D product, spatial scene, port/yard simulation, camera perspective | PNG sequence/still; source retained |
| Spline | Polished 3D object/scene mockup | PNG still; source retained |
| Rive | Animated icon/state machine concept | still frame or exported video/gif only if PPT context supports it |
| Matter.js | Physics-style explanatory mockups | mostly reference; still frame if useful |
| Mapbox | Geographic route, network, port map | PNG; attribution and map style retained |

Rule: external components are welcome when they add information. They are not a substitute for PPT structure, hierarchy, or claim boundaries.

## Component Source Decision

Choose the component source based on the page relationship, not on what is easiest to draw.

| Page need | Prefer | Final PPT form |
|---|---|---|
| Logic, mechanism, comparison, process, roadmap | Existing PPT component | Editable PPT shapes/text |
| Data pattern, dashboard, trend, sankey, radar | ECharts or data render | PNG/SVG plus source retained |
| Spatial scene, device, port/yard system, 3D product relation | Three.js / Spline / image2 | High-resolution image plus source/prompt retained |
| Geographic route, network, region, port map | Mapbox | PNG with attribution/source retained |
| State transition or motion concept | Rive or frame sequence | Still frame unless animation is explicitly needed |
| Missing cover/scene/product visual | image2/generated image | Image with prompt and usage note |

Use mixed sources when useful: for example, an editable PPT architecture frame plus an image2 scene thumbnail, or an ECharts chart inside a PPT evidence board.

Before finalizing a mixed-source page, run `VISUAL-COMPOSITION.md`. The page must look designed, not assembled.

## Icon Library Policy

Build an icon language from existing internal decks and reusable vector patterns:

- Keep one stroke style per deck.
- Prefer simple line or filled vector icons.
- Every icon must map to a concrete concept: role, action, metric, module, risk, status, asset, location.
- Do not mix emoji, stock icons, and hand-drawn icons in one deck.
- Store reusable icons as SVG or as pptxgenjs shape helper functions.

## Extracting Components From Existing PPTX

For each source deck, inspect exported thumbnails and collect:

- Repeated page layouts.
- Header / section styles.
- Card styles.
- Number badges.
- Diagrams.
- Icon treatment.
- Chart styles.
- Image placement.
- Color and font usage.

Then classify each pattern:

| Status | Meaning |
|---|---|
| `adopt` | Good enough to become a reusable component |
| `adapt` | Useful idea, needs cleanup or generalization |
| `avoid` | Too case-specific, visually weak, or unstable |

## Component Spec Format

```markdown
## <component-name>

- Purpose:
- Best for:
- Structure:
- Required inputs:
- Optional inputs:
- Theme tokens used:
- Editable: yes / partial / no
- Source inspiration:
- QA risks:
```

## Self Check

- [ ] Component solves a recurring slide problem.
- [ ] Component is not tied to one case or one page title.
- [ ] Inputs are clear enough for another agent to reuse.
- [ ] Editable/non-editable status is explicit.
- [ ] External assets or source files are retained when needed.
- [ ] QA risks are known before production.
