# Leander Feishu Lifecycle V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route every actionable Leander review, local automation block, merge result, and release result to Feishu without exposing the Feishu webhook to pull-request code.

**Architecture:** The existing validation workflow becomes secret-free. A new trusted notification workflow runs from `main` after validation completes, on review/close events, on release workflow completion, and on sanitized `repository_dispatch` alerts from contributor computers. Pure event-classification code creates typed cards; the final merge remains a GitHub-only human action.

**Tech Stack:** GitHub Actions, Node.js 22 CommonJS, GitHub REST API, PowerShell 5.1/7, Feishu custom-bot V2 webhook.

---

### Task 1: Build Typed Lifecycle Notifications

**Files:**
- Create: `team-sharing/lib/feishu-events.js`
- Modify: `team-sharing/lib/feishu.js`
- Modify: `team-sharing/tests/candidate.test.js`

- [ ] **Step 1: Add failing tests for event classification**

```js
const { classifyPullRequest, buildLifecycleNotification } = require("../lib/feishu-events");

test("classifies contributor branches as candidate intake", () => {
  assert.equal(classifyPullRequest({ head: { ref: "contrib/alice/card" } }, []), "candidate-intake");
});

test("builds a curator card from candidate assessment", () => {
  const result = buildLifecycleNotification({
    eventName: "workflow_run",
    workflowName: "Leander Team Sharing",
    conclusion: "success",
    pullRequest: { number: 8, html_url: "https://github.com/acme/repo/pull/8", user: { login: "alice" }, head: { ref: "contrib/alice/card" } },
    assessment: { lane: "curator-review", score: 58, reasons: ["possible-semantic-overlap:metricBand"] }
  });
  assert.equal(result.status, "review-required");
  assert.match(result.details, /curator-review/);
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

```powershell
node --test team-sharing/tests/candidate.test.js
```

Expected: module-not-found or missing-export failures for `feishu-events`.

- [ ] **Step 3: Implement pure classification and card inputs**

```js
function classifyPullRequest(pr = {}, files = []) {
  const branch = String(pr.head?.ref || "");
  if (branch.startsWith("contrib/")) return "candidate-intake";
  if (branch.startsWith("promote/")) return "component-promotion";
  if (files.some(file => /(?:SKILL\.md|\/agents\/|\/theme\/|\.github\/|team-sharing\/)/.test(file.filename || file))) return "core-change";
  return "governance-change";
}
```

Implement `buildLifecycleNotification` for validation success/failure, review approved/changes-requested, PR merged/closed, release success/failure, local alert, and smoke test. Return `null` for review comments that do not require action.

- [ ] **Step 4: Add red, orange, green, and grey card headers**

```js
const normalized = status.toLowerCase();
const template = ["failed", "blocked", "changes-requested"].includes(normalized)
  ? "red"
  : ["review-required", "warning", "closed"].includes(normalized) ? "orange" : "green";
```

- [ ] **Step 5: Run focused tests**

```powershell
node --test team-sharing/tests/candidate.test.js
```

Expected: all typed-card and existing candidate tests pass.

### Task 2: Send Notifications Only From Trusted Main Code

**Files:**
- Create: `team-sharing/scripts/notify-feishu-event.js`
- Modify: `team-sharing/scripts/notify-feishu.js`
- Create: `.github/workflows/leander-feishu-notifications.yml`
- Modify: `.github/workflows/leander-team-sharing.yml`
- Test: `team-sharing/tests/candidate.test.js`

- [ ] **Step 1: Export the existing webhook sender**

```js
async function sendFeishu(payload, webhook = process.env.FEISHU_WEBHOOK_URL) {
  if (!webhook) throw new Error("FEISHU_WEBHOOK_URL is not configured");
  const response = await fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const result = await response.json();
  if (!response.ok || (result.code && result.code !== 0)) throw new Error("Feishu webhook rejected the card");
}
module.exports = { sendFeishu };
```

- [ ] **Step 2: Add the trusted event adapter**

`notify-feishu-event.js` must read `GITHUB_EVENT_PATH`, use `GITHUB_TOKEN` only for read-only PR/file/blob metadata, parse `automation-review.json` as data, call `buildLifecycleNotification`, and then call `sendFeishu`. It must never checkout, import, or execute code from a PR head.

- [ ] **Step 3: Create the trusted workflow**

```yaml
on:
  workflow_run:
    workflows: [Leander Team Sharing, Tag Approved Leander Version, Release Leander PPT Skill]
    types: [completed]
  pull_request_target:
    types: [closed]
  pull_request_review:
    types: [submitted]
  repository_dispatch:
    types: [leander_local_alert]
  workflow_dispatch:
permissions:
  actions: read
  contents: read
  pull-requests: read
```

The only checkout must be `ref: main` with `persist-credentials: false`. Pass `FEISHU_WEBHOOK_URL` and `GITHUB_TOKEN` only to `notify-feishu-event.js`.

- [ ] **Step 4: Remove webhook steps from PR validation**

Delete both `Notify Feishu...` steps from `leander-team-sharing.yml`, leaving validation and rendering unchanged and secret-free.

- [ ] **Step 5: Test dry-run event fixtures**

```powershell
node team-sharing/scripts/notify-feishu-event.js --dry-run --event-name workflow_dispatch
```

Expected: one safe interactive smoke-test card and no network request.

### Task 3: Forward Local Blocks Through GitHub

**Files:**
- Create: `team-sharing/scripts/send-github-alert.js`
- Modify: `team-sharing/scripts/team-cycle.ps1`
- Modify: `team-sharing/tests/safety.test.js`

- [ ] **Step 1: Add failing sanitization tests**

```js
const { sanitizeAlert, buildDispatch } = require("../scripts/send-github-alert");
test("local alerts redact paths and tokens", () => {
  const value = sanitizeAlert("C:\\private\\deck.pptx ghp_12345678901234567890");
  assert.doesNotMatch(value, /private|ghp_/i);
});
```

- [ ] **Step 2: Implement the dispatch sender**

The script must allow only `candidate-cycle-blocked`, `consumer-update-failed`, and `automation-disabled`; derive `owner/repo` from `origin`; obtain the existing Git credential without printing it; POST `event_type=leander_local_alert`; and support `--dry-run` before credential lookup.

- [ ] **Step 3: Add PowerShell alert boundaries**

```powershell
try {
  & $sync @arguments
  if ($LASTEXITCODE -ne 0) { throw 'Candidate upload cycle failed.' }
} catch {
  Send-TeamAlert 'candidate-cycle-blocked' '候选处理被安全规则阻断' '请检查本机 Leander 审计日志。'
  throw
}
```

Add equivalent fixed-text alerts for consumer update failure and an active kill switch. Do not transmit raw exceptions, local paths, candidate content, or credentials.

- [ ] **Step 4: Run local dry-run tests**

```powershell
node team-sharing/scripts/send-github-alert.js --repo-root . --kind candidate-cycle-blocked --title "候选处理被阻断" --details "请检查本机日志" --dry-run
node --test team-sharing/tests/safety.test.js
```

Expected: safe dispatch JSON and all safety tests pass without a network request.

### Task 4: Document Coverage and Security Boundaries

**Files:**
- Modify: `docs/governance/leander-team-sharing.md`

- [ ] **Step 1: Document the notification matrix**

Add candidate validation, curator review, promotion, core change, review result, merge result, release result, local block, consumer update failure, and kill-switch rows. State that routine successful local runs do not notify to avoid spam.

- [ ] **Step 2: Document trusted-workflow constraints**

State that the Feishu secret is available only to the notification workflow on `main`, that it never checks out PR head code, and that local machines dispatch sanitized events through GitHub rather than storing the Feishu webhook.

- [ ] **Step 3: Run all checks**

```powershell
node --test team-sharing/tests/*.test.js
git diff --check
```

Expected: all tests pass and the worktree contains no webhook URL value.

### Task 5: Publish for Human Review

**Files:**
- Review: all files from Tasks 1-4

- [ ] **Step 1: Commit the scoped change**

```powershell
git add -- .github team-sharing docs/governance docs/superpowers/plans/2026-07-20-leander-feishu-lifecycle-v2.md
git commit -m "Add trusted Feishu lifecycle notifications"
```

- [ ] **Step 2: Push only the agent branch**

```powershell
git push -u origin agent/leander-feishu-lifecycle-v2
```

- [ ] **Step 3: Create a Draft PR**

Create a Draft PR titled `Add trusted Feishu lifecycle notifications`. The PR must remain unmerged until tests pass and a maintainer reviews the workflow permission boundary.

- [ ] **Step 4: Validate after human merge**

Run the new `workflow_dispatch` smoke test, create one sanitized `repository_dispatch` test, and confirm two corresponding Feishu cards. Do not delete branches automatically.
