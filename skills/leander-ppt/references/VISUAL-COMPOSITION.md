# Visual Composition QA

Use this file to judge whether a slide is actually designed, not merely compliant with a template.

## When To Read

Read this file when:

- Creating anchor sample pages.
- Choosing between PPT components, external renders, real images, and image2 generated images.
- Combining multiple visual sources on one page.
- Fixing pages that feel empty, crowded, decorative, or AI-generated.

Do not read this file during early brief extraction unless the user is explicitly asking about visual style.

## Source Selection Logic

Start from the page relationship.

| Relationship | Best visual source |
|---|---|
| Sequence / process | Editable PPT flow or timeline |
| Hierarchy / system | Editable PPT architecture or hub-spoke |
| Comparison / options | Editable PPT split page or matrix |
| Quantified evidence | PPT metric cards + ECharts if data shape matters |
| Dense data pattern | ECharts / external render inside PPT frame |
| Product/scene reality | Real image first, image2 if missing, 3D render if spatial relation matters |
| Spatial/3D mechanism | Three.js / Spline render plus PPT callouts |
| Geography / route | Mapbox render plus PPT explanation |
| Cover / atmosphere | Real image or image2, with minimal text and strong crop |

## Combination Rules

- Use PPT components for structure and claims.
- Use external renders for complex information that PPT shapes cannot express well.
- Use image2 for scene, mood, concept, and missing visual assets.
- Do not use image2 for exact data, product claims, UI screenshots, logos, or technical diagrams.
- Keep external render sources or prompts in the working folder.
- Label generated or placeholder visuals when the distinction matters.

## Designed Page Criteria

A page passes visual composition only if:

- It has one obvious focal point.
- The title, takeaway, and visual form reinforce the same message.
- Text and visuals explain each other, not compete.
- Whitespace is intentional and proportional to the focal point.
- The page has visual hierarchy: primary, secondary, supporting.
- Icons/images/charts carry information, not decoration only.
- The component choice matches the relationship being explained.
- The page avoids "title + paragraph + cards" as the default pattern.

## Whitespace Check

Good whitespace:

- Frames a big word, number, image, or conclusion.
- Creates contrast between focal content and supporting evidence.
- Has alignment, rule lines, or component rhythm.

Bad whitespace:

- Leaves small text floating.
- Makes cards feel sparse.
- Appears because content failed to fill the page.
- Pushes content off-center unintentionally.

## Mixed-Source QA

When a page combines PPT components, external renders, and images:

- [ ] The visual sources share one layout grid.
- [ ] The external image/render has a reason to exist.
- [ ] The editable PPT layer explains the rendered layer.
- [ ] Captions and caveats are close to the visual they explain.
- [ ] The page does not look like separate screenshots pasted together.
- [ ] Font, color, line weight, and spacing match the theme.

## Self Check

- [ ] The selected visual source is justified by the page relationship.
- [ ] The page has a designed focal point.
- [ ] Text amount is appropriate for the available space.
- [ ] Whitespace is designed, not accidental.
- [ ] Images, icons, and charts add information.
- [ ] Generated visuals are not used as fake evidence.
- [ ] The page still feels coherent after zooming out to contact-sheet size.
