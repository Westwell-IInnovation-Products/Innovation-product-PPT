# Leander Team Sharing V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automate reusable-component discovery, candidate packaging, risk triage, review notification, release creation, and consumer updates while retaining one human approval before production promotion.

**Architecture:** The existing `component-curator-zh` role produces a structured, de-identified proposal at the end of a Leander project. Deterministic Node/PowerShell tools materialize and validate the four-file candidate bundle, calculate duplicate/risk evidence, publish a Draft PR, notify reviewers, create a release tag after an approved version bump, and safely update consumer machines with backup and rollback.

**Tech Stack:** Node.js 22-compatible CommonJS, PowerShell 5.1/7, Git, GitHub Actions, GitHub REST API, optional Feishu custom-bot webhook.

---

### Task 1: Candidate harvest contract

**Files:**
- Create: `leander-ppt/templates/leander-ppt-scaffold/tools/candidate-harvest.js`
- Modify: `leander-ppt/templates/leander-ppt-scaffold/tools/run-phase.js`
- Modify: `leander-ppt/templates/leander-ppt-scaffold/tools/regression-tests.js`

- [ ] Add regression fixtures that exercise custom-route, repeated component issue, and explicit proposal signals.
- [ ] Implement `candidate-harvest.js` to scan page contracts, component traces, issue proposals, and `state/component-candidate-proposals.json`.
- [ ] Materialize valid proposals into `%USERPROFILE%/.codex/leander-contributions` with `candidate.json`, `component.js`, `preview.svg`, and `README.md`.
- [ ] Invoke the harvest report during `run-phase.js final-verify` without allowing it to modify the shared Skill.
- [ ] Run `node tools/regression-tests.js` and confirm the harvest scenarios pass.

### Task 2: Deterministic risk and duplicate triage

**Files:**
- Create: `team-sharing/lib/candidate-risk.js`
- Create: `team-sharing/scripts/assess-candidate.js`
- Modify: `team-sharing/scripts/publish-candidate.ps1`
- Modify: `team-sharing/tests/candidate.test.js`

- [ ] Add tests for low-risk, curator-review, exact-ID block, and formal-name collision cases.
- [ ] Compare relationship primitive, slots, tags, and formal registry names; output sanitized `automation-review.json`.
- [ ] Block exact collisions before branch creation and allow safe/curator-review candidates to proceed as Draft PRs.
- [ ] Run `node --test team-sharing/tests/candidate.test.js` and confirm all lanes pass.

### Task 3: Review notification and CI summary

**Files:**
- Create: `team-sharing/lib/feishu.js`
- Create: `team-sharing/scripts/notify-feishu.js`
- Modify: `.github/workflows/leander-team-sharing.yml`
- Modify: `team-sharing/tests/candidate.test.js`

- [ ] Test Feishu card generation without making a network request.
- [ ] Write PR/CI cards containing status, risk lane, PR link, Actions link, and review link.
- [ ] Append candidate assessment to the GitHub job summary.
- [ ] Send optional success/failure notifications only when `FEISHU_WEBHOOK_URL` is configured.

### Task 4: Approved-version release automation

**Files:**
- Create: `team-sharing/lib/semver.js`
- Create: `team-sharing/scripts/bump-leander-version.js`
- Create: `.github/workflows/leander-tag-approved-version.yml`
- Modify: `.github/workflows/leander-release.yml`
- Modify: `team-sharing/tests/candidate.test.js`

- [ ] Test stable/prerelease parsing, sorting, and patch/minor bump behavior.
- [ ] Update `manifest.json`, scaffold package metadata, scaffold version metadata, and changelog in one deterministic command.
- [ ] On approved changes merged to `main`, create the missing `leander-ppt-v<manifest-version>` tag only after release/scope checks pass.
- [ ] Let the existing tag workflow build and publish the GitHub Release.

### Task 5: Consumer auto-update with rollback

**Files:**
- Create: `team-sharing/scripts/select-release.js`
- Create: `team-sharing/scripts/update-leander.ps1`
- Create: `team-sharing/scripts/team-cycle.ps1`
- Modify: `C:\西井\06AI\sync-codex-skills-to-leander.ps1`
- Modify: `team-sharing/tests/candidate.test.js`

- [ ] Test stable/beta channel selection and no-downgrade behavior.
- [ ] Fetch tags with existing Git, verify tag-to-manifest consistency, check out the selected tag in a temporary worktree, and call the safe installer.
- [ ] Compose contribution upload and consumer update into one scheduled cycle.
- [ ] Preserve the existing backup/rollback behavior and produce a machine-readable update result.

### Task 6: Agent and governance contract

**Files:**
- Modify: `leander-ppt/agents/component-curator-zh.md`
- Modify: `leander-ppt/SKILL.md`
- Modify: `leander-ppt/references/SELF-EVOLUTION.md`
- Modify: `leander-ppt/references/COMPONENT-LIBRARY-DESIGN.md`
- Modify: `docs/governance/leander-team-sharing.md`
- Modify: `.github/pull_request_template.md`

- [ ] Define extraction and independent-review modes without adding a new permanent role.
- [ ] Require de-identification, generic slots, evidence, duplicate comparison, and risk classification before materialization.
- [ ] Document the automation boundary: candidate intake can be automatic, production promotion remains human-approved, and major/core changes remain RFC-only.
- [ ] Document optional Feishu and consumer update configuration.

### Task 7: End-to-end verification and publication

**Files:**
- Modify as required by failures only.

- [ ] Run candidate unit tests and scaffold regression tests.
- [ ] Run candidate validation, release hygiene, scope hygiene, component index consistency, and strict component lint.
- [ ] Run an isolated two-contributor simulation plus stable/beta update selection tests.
- [ ] Run a local scheduled-cycle dry run without creating a new real candidate PR.
- [ ] Review `git diff --check` and confirm no generated runtime evidence is tracked.
- [ ] Commit the V2 change on a dedicated branch, push it, and open a Draft PR.
