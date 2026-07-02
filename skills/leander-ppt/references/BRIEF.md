# PPT Brief Spec

`brief.md` is the first working file for every deck. It defines why the deck exists before any outline or slide is written.

## When To Read

Read this file in Phase 1 before writing `outline.md`.

## Required Fields

```markdown
# PPT Brief

## Source
- Materials:
- Source type: existing PPT / Word / outline / script / notes / mixed
- Source language:
- Must preserve:

## Audience And Occasion
- Audience:
- Occasion:
- Decision or action expected:
- Sensitivities:

## Output Goal
- What the audience should remember:
- What the audience should do next:
- Target page count:
- Presentation time:

## Deck Type
- Type: management report / internal sharing / product introduction / presales / customer demo / training / project review / other
- Evidence priority:
- Tone:

## Constraints
- Must use:
- Must avoid:
- Data boundary: achieved / planned / estimate / public reference
- Asset boundary: available images / missing images / placeholders allowed
```

## Scenario Guidance

Choose the deck type before choosing structure.

| Deck type | Main job | Evidence to preserve |
|---|---|---|
| Management report / resource approval | Help the audience decide | Problem position, business impact, decision request, resources, risks, milestones |
| Internal sharing | Help colleagues understand and reuse | Background, method, examples, pitfalls, reusable checklist |
| Product introduction / presales | Help the audience recognize value | Customer pain, product capability, differentiation, implementation path, proof boundary |
| Customer demo | Make value feel relevant to the customer | Customer scenario, effect, implementation mode, risk boundary, next action |
| Training | Help the audience learn | Learning goal, concepts, steps, exercises, checks, summary |
| Project review / progress sync | Align facts and next actions | Goal, progress, deviation, reason, risk, owner, date |

## Self Check

Run this check before writing `outline.md`.

- [ ] Audience, occasion, output goal, page count, and deck type are explicit.
- [ ] The deck type determines evidence priority.
- [ ] Achieved, planned, estimate, and public-reference claims are distinguishable.
- [ ] Missing assets are named instead of silently replaced with unrelated visuals.
- [ ] If required information is missing and cannot be inferred from materials, ask the user before proceeding.
