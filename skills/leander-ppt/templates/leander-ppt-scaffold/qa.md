# QA — <deck name>

> Refresh this file on EVERY render (samples, full deck, each feedback re-render). A stale or missing qa.md = Gate 6 not done. See `references/QA.md`.

## Run
- Generator: `<deck.gen.js>` · Theme: `<leander-base|leander-global>`
- Render: `<soffice → pdf → pdftoppm>` → `output/preview/slide-*.png`
- Review tier used: `<reviewer subagent | self-check>`  (prefer the subagent via `agents/reviewer.md`)

## Per-page verdict (every page must appear)
| Page | Component | Verdict | Notes / fixes |
|---|---|---|---|
| p01 | cover | PASS / FAIL | |
| … | | | |

## Reviewer verdict (paste the subagent output; also paste into the final report)
```
Scope:
Pass:
Fail:
- p__ / <category> / <evidence> / <repair>
Risk:
Verdict: SHIP / FIX-FIRST
```

## Fixed after this render
- …

## Remaining risks / known limitations
- …

## Boundaries
- Theme/anchor evidence: <theme name, approved sample path, component sources>
- Data boundaries preserved (achieved/planned/estimate/public-reference): <yes/notes>
- Fallbacks used (record per SKILL.md): <none | …>
