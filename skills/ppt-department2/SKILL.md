---
name: ppt-department2
description: Create, redesign, review, or standardize internal department PowerPoint decks using the department-2 visual style abstracted from recent Westwell BGMH and Cactus presentations. Use when Codex needs to make or polish PPT/PPTX decks for internal reports, product introductions, solution proposals, government/enterprise-facing materials, data platform explanations, roadmap reviews, architecture diagrams, operating-analysis decks, or when the user mentions "ppt-department2", "部门PPT模板", "西井内部PPT", "国企汇报PPT", "Cactus产品介绍", "BGMH风格", or asks to follow the uploaded internal PPT style.
---

# PPT Department 2

## Overview

Use this skill to create PPT decks that match the department-2 style: restrained corporate authority, red-blue emphasis, precise bilingual titles, technical diagrams, light executive pages, and darker product-system pages when needed.

The style is derived from two recent internal source decks:

- `国企_中文BGMH 0311B.pptx`
- `cactus产品介绍202606051600.pptx`

## Workflow

1. Identify the scenario: government/enterprise proposal, product introduction, solution architecture, data platform explanation, roadmap, or value summary.
2. Choose the visual mode:
   - Use **Light Formal Mode** for government/enterprise, logistics, hub, strategy, and executive-facing pages.
   - Use **Dark Product Mode** only for product interface, data intelligence, diagnostic flow, roadmap, or technical system pages.
   - Use a light-dark-light rhythm when a deck needs both authority and product depth.
3. Build the outline with bilingual slide titles when appropriate: Chinese main title plus concise English subtitle.
4. Apply design rules from `references/design-system.md`.
5. Select page structures from `references/page-patterns.md`.
6. Check source-derived style observations in `references/source-observations.md` when calibration is needed.
7. Before delivery, run `references/review-checklist.md`.

## Default Deck Shape

For product or solution introductions, prefer:

1. Cover
2. Why now / current pain
3. Evolution or background
4. Construction goal / design target
5. Product or solution architecture
6. Core capability pages
7. Use-case or workflow pages
8. Value summary
9. Roadmap or implementation plan
10. Closing statement

For government/enterprise or hub proposals, prefer:

1. Cover
2. Pain-point conclusion
3. One-stop solution proposition
4. System framework
5. Scenario/service system
6. Capability deep dives
7. Comparative value / risk reduction
8. Operation or implementation model
9. Roadmap
10. Closing statement

## Output Requirements

When designing a new deck, provide:

- Slide-by-slide outline with page type, key message, and visual layout.
- Design token summary: colors, typography, spacing, title pattern, chart/table rules.
- Notes on which pages use Light Formal Mode versus Dark Product Mode.

When creating or editing an actual `.pptx`, use PPTX/presentation tooling after applying this skill. Render slides to images when possible and visually verify alignment, overflow, and style consistency.

When reviewing an existing deck, return issues grouped by story, template consistency, visual hierarchy, data clarity, and source-style fit.

## Reference Loading

Read `references/design-system.md` for color, typography, spacing, motif, chart, table, and component rules.

Read `references/page-patterns.md` for reusable slide layouts and scenario-specific structures.

Read `references/source-observations.md` when the user asks where the style comes from or when matching the two source decks closely.

Read `references/review-checklist.md` before final delivery or review.
