## Change class

- [ ] Candidate contribution: isolated bundle under `contributions/iinnovation-products-ppt/components/<user>/<id>/`
- [ ] Component promotion: reviewed renderer, registry/index update, and promotion audit
- [ ] Skill core: workflow, agent, reference, theme, tool, or Gate behavior
- [ ] Release/governance: automation, policy, installer, or version packaging

## What changed and why

Describe the reusable problem, the affected paths, and why the change belongs in the shared repository.

## Safety boundary

- [ ] No customer, project, deck, page, credential, absolute local path, or raw feedback data is included.
- [ ] New component metadata starts as `review-required`; only a curator promotion marks it `usable`.
- [ ] Generated deck state, render evidence, and project outputs are not committed to the shared Skill.

## Verification

- [ ] `node --test team-sharing/tests/candidate.test.js`
- [ ] Candidate validation passed, if applicable.
- [ ] IInnovation-Products_ppt release hygiene and scope hygiene passed.
- [ ] Component registry/index and strict lint passed, if applicable.
- [ ] All required themes rendered for a promoted component.
- [ ] Candidate automation assessment is attached; `auto-intake` only applies to the candidate area, never production promotion.
- [ ] Agent-generated candidates include independent-review evidence and no project-local facts.

## Rollback

State the prior tag or component version to restore if this change is rejected after release.
