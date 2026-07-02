# PPT Theme And Template System

PPT themes must be reusable style modules, not one-off slide decoration.

## Contents

- [When To Read](#when-to-read)
- [Theme Definition](#theme-definition)
- [Required Theme Tokens](#required-theme-tokens)
- [Built-In Template Guidance](#built-in-template-guidance)
- [Template Selection Checkpoint](#template-selection-checkpoint)
- [Component Rules](#component-rules)
- [Self Check](#self-check)

## When To Read

Read this file in Phase 2 before selecting or creating a template.

## Theme Definition

A PPT theme is a stable design contract:

- Color tokens.
- Font tokens.
- Page grid and safe area.
- Header, footer, and section page style.
- Reusable components.
- Layout archetypes.
- Asset rules.

Leander PPT can reuse `web-video-presentation` theme ideas, but it must translate them into PPT-safe contracts: font names available in PowerPoint, hex color tokens, page grid, component shapes, and export QA. Do not copy webpage-only animation or CSS assumptions directly into PPT.

## Required Theme Tokens

```js
const THEME = {
  fonts: {
    cn: "Microsoft YaHei",
    en: "Century Gothic",
    fallback: "Arial"
  },
  colors: {
    bg: "...",
    surface: "...",      // white
    surface2: "...",     // very light tint (subtle)
    surface3: "...",     // a CLEARER ground tint — must visibly contrast with bg (filled panels/chips). Don't reuse surface2 ≈ bg.
    text: "...",
    mute: "...",
    line: "...",
    primary: "...",
    accent: "...",
    accentSoft: "..."
  },
  // Type scale (design-px; actual pt = px / 2). WIDE on purpose: titles big, the bulk of body/detail small.
  // Same role = same size on every page. Derive these per theme by MEASURING the reference deck (see below).
  type: {
    hero: 50, h1: 40, h2: 40, lead: 30, h3: 27,    // 25 / 20 / 20 / 15 / 13.5 pt
    bodyLg: 24, body: 21, bodySm: 18,              // 12 / 10.5 / 9 pt  (body is small — most text)
    cap: 16, micro: 14, tiny: 13                   // 8 / 7 / 6.5 pt   (labels / chips / in-graphic / legend)
  },
  grid: {
    canvas: "16:9",
    safeX: [96, 1824],
    safeY: [80, 980],
    columns: 12,
    gutter: 24
  },
  components: [
    "cover",
    "header",
    "section",
    "metricCard",
    "textCard",
    "iconBadge",
    "flowNode",
    "timeline",
    "calloutBand",
    "imageFrame"
  ]
}
```

### Deriving the type scale (measure, don't guess)

The type scale is a **per-theme signature**, not a constant. Generic "body ≥ 11pt" guidance once caused a real regression (body pushed to a uniform 15pt, blowing up small/label text). Derive it from the reference deck:

1. Unzip the reference `.pptx` and read `ppt/slides/slideN.xml`; extract `sz="..."` values (hundredths of a point → divide by 100). Tally frequency.
2. You'll see a **wide range**, e.g. titles ~20–22pt, lead ~16–18pt, and a large mass of small label/detail text at ~6–9pt. Map those onto `type.h2 / lead / … / micro / tiny`.
3. The aesthetic comes from the **contrast** (big titles, small dense detail), not from enlarging everything. Make supporting text genuinely small; reserve large sizes for titles, lead lines, and hero numbers.

## Theme Sources

Use three types of theme sources:

1. **Imported web-video theme tokens**: adapt color, mood, typography intent, and spacing from `web-video-presentation/themes/*`. Convert CSS tokens into PPT constants.
2. **Internal PPT-derived themes**: extract recurring layouts, typography, colors, spacing, chart treatment, and icon style from approved internal decks.
3. **Project-specific overrides**: apply only when the audience or brand context requires it; keep overrides small and document them in the deck generator or outline.

Internal source decks can be used to derive:

- Layout archetypes.
- Section and cover treatment.
- Color and line rhythm.
- Data panel styling.
- Icon and diagram language.
- Image placement and caption conventions.

## Bundled Company Themes — Ask Which First

Two company themes ship with this skill. Both are real, distilled from approved Westwell decks. **Phase 2 must open by picking between them by occasion**, before offering any alternative:

| | Leander Base | Leander Global |
|---|---|---|
| Use for | internal / company decks | external / international / formal decks |
| Ground | warm off-white `#F5F5F0` | clean white `#FFFFFF` |
| Signal color | **Westwell red** `#C51516` | **azure** `#00B0F0` (red = status-only) |
| Structure | navy `#07195A` | navy `#002060` + mid-blue `#0070C0` |
| Title rule | solid red bar, title in red | dotted azure, title in navy |
| Footer | red bar | thin azure line |
| Cover | warm ground, right-aligned red title | dark port-skyline photo, or clean white-minimal |
| Font | YaHei + Century Gothic | Century Gothic English-first + YaHei |
| Source decks | 岸桥自动化系统产品介绍, cactus产品介绍 | ReeWell international, FMS Clarification, CTN Scheduler |

Ask: **"Internal report → Leander Base, or external/international → Leander Global? (or a different style)"** Recommend by audience. Only present the alternatives below if the user declines both. Do not lead with alternatives.

### Leander Base (`leander-base`)

- Warm off-white ground `#F5F5F0`, deep navy `#07195A`, Westwell red `#C51516` as the signal color. Microsoft YaHei / Century Gothic.
- Signature: red title rule + red footer bar; white cards with a red / navy top bar; header title in Westwell red.
- WESTWELL logo top-right on content pages, **one standard size** for every page from `theme.brand` (`logoW`/`logoMarginR`/`logoTop`, ~89px). Never override per page.
- Every content page sets the theme background (`C.bg`); `ui.header()` does this automatically.
- Cover (`ui.cover`) right-aligned red title; back cover (`ui.closing`) centered navy+red slogan; `Make a Well Change.` tagline.

### Leander Global (`leander-global`)

- Clean white ground `#FFFFFF`, navy `#002060` (structure/titles), azure `#00B0F0` (the single signal color), mid-blue `#0070C0` (genuine second category). **Red is demoted to status-only** (`colors.danger`, ✗/error) — never a structural highlight.
- Century Gothic English-first; CJK via YaHei (the chrome auto-detects CJK before choosing the face).
- Title size + subtitle color follow the **FMS 技术介绍** reference (measured): big navy title **~38–40pt** (`signature.titleSize: 76`, vs Base 40→20pt) + **light-blue `#539ED4` subtitle** (`signature.subtitleColor`).
- **The two recurring rules are copied 1:1 from the CTN reference, not redrawn** (user instruction): (a) the title/sub rule is CTN's exact connector — **`#0070C0` mid-blue, `lgDash` large-dash, 0.25pt**, width tracking the title (`signature.headerRule: {style:"dash", color:"blue", dash:"lgDash", weight:0.25, track:true}`); (b) the page-bottom strip is **CTN's own footer PNG** (`theme/assets/footer-westwell.png` = grey WESTWELL wordmark + `FROM HUMAN TO HUMAN` + line baked in), placed full-width at the bottom (`signature.footer: {style:"image", img, x,y,w,h}`) — `footer()` just drops the image, it does not draw the line/wordmark.
- `header()` returns its content-bottom Y; top-aligned components (`archLayered`, `archDualEngine`) start content below it, so the larger title never collides with the diagram.
- Divider page = **white-underline** (`sectionDivider`, per the **FMS** reference): left-aligned (x≈120) navy bold title + solid navy underline + light-blue subtitle + wordmark footer.
- Covers (both ship; pick per occasion): `cover` default = **white-minimal** (clean white, big navy title, dotted navy rule, light-blue subtitle, `Make a Well Change.` azure tagline, wordmark footer); `coverStyle: "photo-dark"` = full-bleed dark port-skyline line-art (`theme/assets/cover-port-dark.png`, supersampled; pass `data.image` to swap in a real photo). Back cover (`closing`) default = **white-minimal** (centered navy+azure slogan + dotted navy rule), matching the white cover; `closingStyle: "photo-dark"` for the dark variant.
- The dark-cover image is a bundled placeholder — replace with a real port/logistics photo via `data.image` or by overwriting `theme.signature.coverPhoto`.

## One Shared Component Library + Per-Theme Signature

There is **one** component library (`components/ppt-components.js`, the `makeComponents(pptx, theme)` closure), shared by all themes — not a library per theme.

- **Content components auto-reskin.** Every content component reads `theme.colors` / `theme.fonts`, so selecting a theme re-colors the whole deck with no component changes. Add components once; they work in every theme.
- **Chrome follows the theme `signature`.** Only the chrome (`cover` / `header` / `footer` / `closing`) varies by theme, driven by a `signature` block in the theme tokens (`titleColor`, `headerRule`, `footer`, `divider`, `cover`, `closing`, `coverPhoto`). This is why Base and Global look genuinely different without forking the library. `footer` supports `bar` / `thin` / `wordmark` / `none`; `divider` supports `big-number` / `white-underline`. To add a new theme: add tokens + a `signature`; do not duplicate components.
- **Selecting a theme:** `const { getTheme } = require("./theme/tokens"); const theme = getTheme("leander-global");` then `makeComponents(pptx, theme)`. The registry lives in `theme/tokens.js` (`themes`, `getTheme`); `theme/leander-global.js` holds the Global tokens. Default (`theme`) stays Leander Base for backward compatibility.

## Built-In Template Guidance

After Leander Base is declined, recommend 2-3 alternatives based on deck type and audience.

| Deck type | Visual temperament |
|---|---|
| Management report | restrained, high contrast, decision-oriented |
| Internal sharing | clear, friendly, method-oriented |
| Product introduction / presales | polished, visual, capability-oriented |
| Customer demo | scenario-first, image-led, practical |
| Training | readable, step-by-step, spacious |
| Project review | factual, status-driven, risk-aware |

## Template Selection Checkpoint

Step 0 — pick between the two bundled themes by occasion before anything else: internal → Leander Base, external/international/formal → Leander Global. If a bundled theme is chosen, the checkpoint below is mostly pre-filled; just confirm logo, cover, and back-cover treatment (for Global: photo-dark vs white-minimal cover, and whether a real cover photo will replace the bundled placeholder). Only if the user declines both, run the full checkpoint for the chosen alternative.

Before sample slide production, confirm:

- Theme/template name.
- Reason it fits the deck type.
- Fonts.
- Primary/accent colors.
- Whether logo and brand assets are available. For Leander Base, the WESTWELL logo ships at `theme/assets/logo-westwell.png` and renders top-right via `ui.logo()` / `ui.header()`.
- Cover and back-cover treatment. For Leander Base, use `ui.cover()` (right-aligned red title + `Make a Well Change.`) and `ui.closing()` (centered navy+red slogan + tagline), matching the Westwell reference decks.
- Whether image style is real-photo, screenshot, vector diagram, placeholder, or generated image.
- Which scaffold theme files will hold the tokens.
- Which component library is approved for the anchor sample.

If the user says "you decide", choose the best fit and state the choice before making samples.

The word "continue" is not theme approval unless the assistant has already stated a concrete theme/template choice in the immediately previous response. If theme choice is still implicit, stop and run this checkpoint.

Record the selected theme in the deck project, normally as:

```text
theme/theme.json
theme/tokens.js
qa.md
```

Do not define a separate full theme inside generated page code. Page code may use page-level accents only when they reference existing theme tokens.

## Component Rules

- Components must be editable PowerPoint shapes where possible.
- Images are allowed and encouraged when they carry real product, scene, or evidence value.
- Generated images are optional and should be used sparingly.
- Icons should come from a consistent style and map to concrete meaning.
- Do not create a new color palette for each page.
- Do not mix fonts outside the theme contract.
- If an external rendering library is used, decide whether the result is exported as an image, converted to editable shapes, or kept as a reference mockup.
- Every sample or produced page must declare its component source: bundled scaffold component, extracted internal PPT component, external-render component, or page-specific custom component.
- If using a page-specific custom component, document why the existing component library was insufficient and whether the pattern should be promoted into `components/`.

## Self Check

- [ ] Theme choice matches deck type and audience.
- [ ] Font and color tokens are explicit.
- [ ] Components are reusable across the deck.
- [ ] Page grid and safe area are defined.
- [ ] Image/icon style is defined.
- [ ] Theme is written to scaffold files, not only described in chat.
- [ ] Component source rules are explicit.
- [ ] If a new template is introduced, sample pages prove it before full production.
