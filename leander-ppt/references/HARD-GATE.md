# Hard Gate Contract

Leander's context-rotation Gate is a fail-closed workflow boundary, not an operating-system security sandbox.

## Enforced invariants

- Gate 0 binds the scaffold to one active Codex root task ID.
- Gate 0 refuses to establish a new baseline in an already-heavy, compacted, or unobservable root task; Token-ledger initialization is mandatory, not best-effort.
- Context-budget decisions use only timestamp-ordered calls from that active root task; subagent or inactive-root calls cannot mask or trigger rotation.
- Every protected phase, render, verify, and build command evaluates the current budget before work; direct `deck.js` use cannot bypass lock creation.
- Missing active-root rollout observability fails closed for protected commands even if historical root logs remain readable.
- Every successful mutating phase checkpoints Token usage, evaluates/creates the rotation lock, and then rewrites the compact handoff before returning control.
- A pending rotation lock blocks checkpoint approval, mutating phase execution, render, verify, final verification, and build, including draft build.
- `attach-thread` accepts the current `CODEX_THREAD_ID` only. A fabricated ID, a different historical real ID, or any task created before the lock is rejected.
- Successful attachment advances the active task generation. The previous task remains blocked after the new task clears the pending lock.
- If final workflow verification creates a lock inside `deck.js build`, the parent process rechecks the lock and refuses to write the PPTX.
- Missing task identity or Token ledger fails closed for production commands.

## Supported boundary

The contract covers the mandatory Leander entrypoints: `workflow-gate.js`, non-status `run-phase.js` commands, and `deck.js render|verify|build`. Final delivery must come from `deck.js` with a valid workflow receipt and QA evidence.

The contract cannot prevent a process with unrestricted filesystem access from deleting state files, changing the Skill code, editing page sources directly, or creating an unrelated PPTX pipeline. Those actions are workflow bypasses and invalidate Leander delivery; a local Node Skill is not an OS sandbox and cannot force the Codex host UI to terminate or create a new task.

## Regression contract

Run:

```powershell
node scripts/regression-tests.js
```

The suite must include both `hard Gate enforcement contract self-test` and the process-level `hard Gate adversarial black-box self-test` against an isolated scaffold:

| Attempt | Required result |
|---|---|
| Approve another checkpoint while pending | blocked |
| Run a mutating phase while pending | blocked |
| Direct render/verify/draft build while pending | blocked |
| Reattach the current old task | blocked |
| Attach a different historical real task ID | blocked |
| Attach a root task created after the lock | allowed |
| Resume from the old task after fresh attachment | blocked |
| Create a final lock inside `deck.js build` | build blocked; no PPTX written |
| Exceed the budget during `run-phase` | current phase artifacts finish; lock and handoff are written; next protected command is blocked |
| Add later low-token subagent calls after an over-limit root call | rotation still required |
| Direct `deck.js render` with an over-limit active root and no pre-existing lock | lock created; render blocked before quality/render work |
| Active-root rollout disappears while historical root logs remain | protected command blocked for missing Token observability |
| Initialize Gate 0 inside an already-heavy historical task | Gate 0 blocked with `FRESH TASK REQUIRED`; no new receipt is accepted |
