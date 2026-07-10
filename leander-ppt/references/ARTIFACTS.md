# Artifact Labels

Use this file when a phase produces many files, or before reporting progress to the user.

## Goal

Every output must have a clear audience. Do not ask the user to inspect internal machine inputs, QA evidence, and final deliverables as one undifferentiated pile.

Run after every phase output, batch production, feedback repair, or final delivery:

```bash
node tools/artifact-map.js --write
```

This creates:

- `artifact-manifest.md`: human-readable report for the user and main agent.
- `artifact-manifest.json`: machine-readable handoff for the next step.

## Labels

| Label | Meaning | Typical examples |
|---|---|---|
| `user-confirm` | The user should review or approve before the next major phase. | `outline.md`, `layout-blueprint.md`, contact sheets, preview PNGs |
| `next-input` | Input for the next production, repair, QA, or agent step. | `page.json`, `page.js`, `checkpoint-status.json`, `agent-collaboration.json` |
| `internal-evidence` | Render, QA, or role evidence used to debug and audit quality. | `pages/*/qa.md`, `pages/*/out/*.png`, `agent-reviews/*.md` |
| `final-output` | Deliverable artifact. | `.pptx`, final exported preview package |
| `archive-reference` | Long-term memory or raw history. Read only when needed. | `LESSONS-ARCHIVE.md`, feedback logs |

## Reporting Rule

When reporting to the user, lead with:

1. What needs user confirmation now.
2. What is final output, if any.
3. What is being kept as next-step input.
4. What was generated only as internal evidence.

Avoid listing every per-page file unless the user asks. Give the manifest path instead.

## Handoff Rule

Before the next task step, read `artifact-manifest.json` or `artifact-manifest.md` first. Use it with `context-pack.js` to decide which files to open.

For example:

- Layout review: read only `layout-blueprint.md`, preview images, and any risk-page notes.
- Page repair: read affected `page.json/page.js/qa.md`, affected render PNGs, and shared component files only if the manifest or context pack shows a shared dependency.
- Final QA: read final output preview, deck-level QA, role review evidence, and page evidence only for failed or risky pages.

## PPT Explanation

When the deck itself explains the Leander-PPT harness, include this mechanism as a small but concrete example:

- "输出不是一堆文件，而是被标记为确认物、下一步输入、内部证据、最终交付、长期记忆。"
- Put a real `artifact-manifest.md` screenshot near the QA/observability or team collaboration section.
- Use the manifest to explain why each phase can stop for user confirmation without losing machine-readable state.
