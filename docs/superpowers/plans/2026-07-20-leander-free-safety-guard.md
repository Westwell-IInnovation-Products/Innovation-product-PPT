# Leander Free-Tier Automation Safety Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Leander candidate automation usable on GitHub Free while preventing unattended pushes to protected refs, limiting each run, requiring independent review, and preserving an audit trail.

**Architecture:** A shared Node policy module enforces branch, ref, batch, review, and staged-path rules. A tracked Git pre-push hook and every publishing script call the same policy so the safety boundary is duplicated. The scheduled cycle defaults to stable updates, honors a local kill-switch file, and records sanitized JSONL audit events.

**Tech Stack:** Git hooks, Node.js 22 built-ins, PowerShell, GitHub Actions, `node:test`.

---

### Task 1: Write safety policy tests

**Files:**
- Create: `team-sharing/tests/safety.test.js`
- Create: `team-sharing/lib/automation-policy.js`

- [ ] Add failing tests that reject `main`, `master`, tags, release refs, deletions, unknown branch prefixes, batches above three, candidates without independent review, and staged paths outside the selected candidate directory.
- [ ] Implement pure policy functions for push refs, batch validation, review evidence, and staged-path allowlists.
- [ ] Run `node --test team-sharing/tests/safety.test.js` and require all cases to pass.

### Task 2: Install a tracked pre-push guard

**Files:**
- Create: `.gitattributes`
- Create: `.githooks/pre-push`
- Create: `team-sharing/scripts/pre-push-guard.js`
- Create: `team-sharing/scripts/install-safety-guard.ps1`

- [ ] Keep the hook in LF format and delegate stdin parsing to the shared Node policy.
- [ ] Configure the local repository with `core.hooksPath=.githooks` without installing software.
- [ ] Verify an allowed `agent/*` dry-run succeeds and simulated `main`, tag, deletion, and unknown-branch pushes fail.

### Task 3: Harden scheduled candidate publishing

**Files:**
- Create: `team-sharing/scripts/check-automation-batch.js`
- Create: `team-sharing/scripts/audit-event.js`
- Modify: `team-sharing/scripts/sync-scheduled.ps1`
- Modify: `team-sharing/scripts/publish-candidate.ps1`

- [ ] Reject the complete cycle before any upload when more than three unpublished candidates exist or any candidate lacks passing independent-review evidence.
- [ ] Confirm the publishing branch matches `contrib/<login>/<candidate-id>-<timestamp>` and the staged diff is confined to its candidate directory.
- [ ] Append sanitized start, blocked, published, and completed events to `%USERPROFILE%\.codex\leander-logs\team-sharing-audit.jsonl`.
- [ ] Run PowerShell parser validation and candidate tests.

### Task 4: Add kill switch and stable-by-default updates

**Files:**
- Modify: `team-sharing/scripts/team-cycle.ps1`
- Modify outside repository: `C:\西井\06AI\sync-codex-skills-to-leander.ps1`

- [ ] Stop safely when `%USERPROFILE%\.codex\leander-automation.disabled` exists.
- [ ] Pass the maximum candidate count to scheduled publishing.
- [ ] Keep `stable` as the scheduled consumer channel; beta remains a manual pilot choice.
- [ ] Run a disabled-cycle test and a normal dry run without creating remote state.

### Task 5: Make the future required check safe and document operations

**Files:**
- Modify: `.github/workflows/leander-team-sharing.yml`
- Modify: `docs/governance/leander-team-sharing.md`
- Modify: `README.md`

- [ ] Make the `validate` job appear on every pull request so a future required check cannot remain Pending because of path filters.
- [ ] Document the two-key model, allowed AI actions, kill switch, audit log, three-candidate cap, hook installation, and stable/beta split.
- [ ] Run all safety, candidate, release hygiene, scope hygiene, and regression checks.
- [ ] Commit and push the guard changes to the existing Draft PR branch, then require GitHub Actions success.
