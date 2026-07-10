# Terminology Contract

Use this reference when a deck repeats framework concepts, product modules, capability names, or mechanism labels.

## Goal

One concept should have one name inside one deck. If a deck calls the same concept "QA system", "quality system", and "evaluation mechanism", the audience has to translate instead of follow the story.

## Project File

Use a project-level `terminology.json`:

```json
{
  "version": "leander-terminology.v1",
  "canonicalTerms": [
    "执行编排",
    "上下文管理",
    "状态和记忆",
    "工具系统",
    "约束与恢复",
    "评估与观测",
    "自进化机制"
  ],
  "forbiddenAliases": {
    "工具链": "工具系统",
    "质量系统": "评估与观测"
  }
}
```

## Rules

- Use canonical terms in page titles, framework maps, section labels, and summaries.
- Aliases may appear only as explanatory text, not as the primary label.
- When a page title uses a first-layer framework name, its body must actually explain that framework or a second-layer mechanism under it.
- If the deck introduces second-layer mechanisms, make their parent framework explicit in the title or subtitle.

## Check

Run:

```bash
node tools/verify-terminology.js
```

If the tool reports `FIX-FIRST`, update the outline, layout blueprint, page contracts, or page text before production continues.
