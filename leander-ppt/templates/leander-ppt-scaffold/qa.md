# QA — <deck name>

> Refresh this file on EVERY render (samples, full deck, each feedback re-render). A stale or missing qa.md = Gate 6 not done. See `references/QA.md`.

## Run
- Runtime: `tools/deck.js` · Theme: `<leander-base|leander-global>`
- Render: `<soffice → pdf → pdftoppm>` → `output/preview/slide-*.png`
- Review tier used: `<reviewer-zh subagent | self-check fallback>`  (prefer the subagent via `agents/reviewer-zh.md`)
- Agent collaboration gate: `<PASS | disabled | fallback reason>` (`node tools/verify-agent-collaboration.js`)

## Per-page verdict (every page must appear)
| Page | Component | Verdict | Notes / fixes |
|---|---|---|---|
| p01 | cover | PASS / FAIL | |
| … | | | |

## Reviewer verdict (paste the subagent output; also paste into the final report)
```
检查范围：
通过项：
问题项：
- p__ / P0-P3 / <问题类别> / <证据> / <修复建议>
视觉路线检查：
动态 QA 检查：
剩余风险：
结论：SHIP / FIX-FIRST
```

## Fixed after this render
- …

## Remaining risks / known limitations
- …

## Boundaries
- Theme/anchor evidence: <theme name, approved sample path, component sources>
- Data boundaries preserved (achieved/planned/estimate/public-reference): <yes/notes>
- Fallbacks used (record per SKILL.md): <none | …>
