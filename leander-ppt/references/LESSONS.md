# Lessons - Active Defect Checklist

This is the short active checklist for pre-flight and QA. Keep it readable in one screen. Full historical lessons are archived in `LESSONS-ARCHIVE.md`; raw feedback remains append-only in `feedback/LOG.md`.

Read this file before anchor samples, production, and rendered QA. Read the archive only when a defect category is unclear or a recurring issue needs consolidation.

## Active Rules

### Color Semantics

- Peer or equal items use one structural color. Accent color marks only the current focus, risk, exception, or decision point.
- Red/azure are theme-relative semantic accents, not decoration. If a color cannot be named as logic, remove it.
- Avoid multi-color diagrams unless each color encodes a distinct category that the page explicitly explains.

### Layout And Whitespace

- Do not leave accidental dead space at the bottom or pin all content to the top. Center or fill the body deliberately.
- Do not stretch empty frames/cards to “fill” a page. Size zones to content, then center the group.
- Sparse pages need stronger substance, a visual metaphor, or a simpler designed layout; never inflate fonts/cards to hide weak content.

### Typography

- Same role uses the same type size across the deck. Dense labels can be small; titles and key numbers can be large.
- Do not fix small text by making everything larger. Preserve hierarchy: big title/focus, medium body, small labels/captions.
- Subtitles should state the page thesis, not repeat the title or list body categories.

### Text And Graphic Fusion

- Fuse labels, numbers, and captions into the visual when possible. Avoid “diagram on one side, paragraph block on the other” unless the split is intentional.
- Every content page needs a real visual explanation: mechanism, process, map, timeline, matrix, chart, dashboard, image, or equivalent.
- Text cards alone are not a diagram.

### Connectors And Geometry

- Orthogonal diagrams must use straight horizontal/vertical connectors. If straight lines become awkward, use intentional curves instead of accidental diagonal drift.
- Text, labels, and chips must clear lines, nodes, icons, and page chrome.
- Icons must represent the actual concept. If an icon cannot be explained, replace it with a simpler shape or image slot.

### Component Selection

- Every content page needs a `visualSelection` contract before drawing.
- Select by relationship primitive and expression capability, not by keyword. Components should be reusable across different semantic topics.
- Check `component-index.min.json` before opening the full catalog. Page-specific custom is last resort.
- Prefer variants/slots on existing components over near-duplicate components.

### Image Use

- Use real images, screenshots, renders, maps, or generated images when they carry explanatory value.
- Do not force images into pages where a diagram is clearer.
- Image2 prompts should stay simple and compositional. Avoid complex busy generated scenes that compete with slide content.

### QA Process

- Rendering plus a quick glance is not QA. Walk the page-specific checks and fix fail items before reporting.
- Page `qa.md` must be fresh after `page.js/page.json` changes.
- After shared theme/component changes, re-render and re-review the full deck.
- Reviewer must fail obvious defects immediately, not label them as later polish.

### Evidence Boundary

- Numbers, status, and external claims must be labeled as achieved, planned, estimate, or public-reference.
- Do not invent data, implementation maturity, customer status, or source-backed facts.

## Consolidation Rule

When `feedback/LOG.md` grows or a category repeats, distill only the reusable rule here. Move obsolete or overly specific items to `LESSONS-ARCHIVE.md`. The active list should stay short enough to read every run.
