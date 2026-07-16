# Image Assets — Reserve-A-Slot + Prompt-Spec Workflow

Some content is better as a **generated/real image** than hand-drawn vector shapes. Forcing a realistic scene out of rectangles and lines reads stiff/AI-generated ("死板"). This file defines how the deck **reserves an image slot** in the layout and **emits a prompt-spec markdown** so the image can be produced (via `gpt-image-2` / real screenshot / photo) and dropped in later — with the deck always rendering in the meantime.

Distilled from several internal technical-deck image workflows; examples are illustrative, not a default page allocation.

## When to draw vector vs reserve an image slot

**Draw with components (vector)** — relationships and structure: flow, matrix, timeline, architecture, comparison, table, chart, simple meaning-bearing icons. Editable, on-brand, fast. This is the default.

**Reserve an image slot** — when the subject is a **scene or realistic depiction** that vector renders crudely:
- Real-world scenes that explain the current subject, installation, workflow, or operating environment.
- Sensor / point-cloud / detection visualizations ("what the output looks like" — colored point cloud, detection boxes).
- Product likenesses, textured/organic subjects, anything needing depth/perspective.
- Decorative scene strips (port skyline) for cover/closing/divider polish.
- Heuristic: *if hand-drawing it needs dozens of primitives and still looks stiff → reserve an image slot.*

A deck should **mix both** — an all-vector deck reads rigid (see `LESSONS.md` → "balance vector diagrams with real imagery").

## The workflow

1. **Outline.** In `outline.md`, mark such a page's `Component source` as `image2` (or `real-image`), and list the asset in the Asset list with its slot. Plan the page so a real rectangle is reserved for the image.
2. **Build with an image slot.** Use `ui.imageSlot(...)` (scaffold helper) for the reserved rectangle. It renders the transparent PNG if the file exists, else a **vector fallback** (glyph on a tinted ground) so the deck never breaks. Page data carries `img: "assets/<group>/<name>.png"`.
3. **Emit a prompt-spec markdown** next to the deck: `<deck>-images.gpt-image-2.md` — one entry per asset (id, page+slot, filename, size, transparency, ready-to-run prompt, shared style line). Hand it to the user (or run `gpt-image-2` if `OPENAI_API_KEY` / a host image tool is available — see `LESSONS.md` tool check).
4. **Drop in + re-render.** User saves the **transparent** PNGs to `assets/`. Re-render — images blend into the theme background. Done.

## Hard conventions

- **Transparent PNG (RGBA, colorType 6), never flattened/opaque.** Verify: a "keyed"/exported file may secretly be RGB (colorType 2) = opaque white box. The non-keyed transparent export is the one to use. (Decode/inspect alpha if unsure.)
- **No white card behind the image.** A transparent line illustration must sit directly on the theme ground and **blend**. A white/`surface` panel behind it defeats the point (the #1 mistake — "为什么是白色的底图"). If the art needs a container for contrast, use the tinted ground `surface3`, never pure white.
- **Style is a per-theme token.** Base: deep navy `#07195A`, single-weight (~3px) line or stipple, flat or light isometric, **transparent bg, no text**. Square `1:1` for spot illustrations; wide `3:1` for strips (skyline).
- **Sizing:** contain the (usually square) art inside the slot, centered; don't distort to a non-square box.
- **Naming:** kebab-case under `assets/<group>/` (e.g. `assets/scenes/p05-operating-scene.png`).
- **Boundary:** real screenshots/photos keep their source label (public-reference). Don't fabricate logos/product photos.

## `imageSlot` helper (scaffold `components/editorial.js`)

```js
// Reserve a slot. Transparent PNG → blends on theme ground (no card). Missing → vector fallback.
ui.imageSlot(slide, {
  x, y, w, h,                 // reserved rectangle (px, 1920×1080 space)
  img: "assets/scenes/p05-operating-scene.png",
  fallback: (s, cx, cy) => icon(pptx, s, U, cx, cy, "layers", { color: ink }), // any glyph if img missing
  ground: false               // false = blend on bg (default for transparent art);
                              // "surface3" = tinted ground card if the art needs contrast
});
```

## Prompt-spec markdown template

```markdown
# <Deck 名> · 待生成图清单 (gpt-image-2)
统一风格：deep navy #07195A single-weight line/stipple, flat/isometric, transparent bg, no text.
参数：size=1024x1024（条幅 1536x512），background=transparent，quality=high。

## <id> `assets/scenes/<name>.png` — P<n> <slot>, <尺寸>, 透明
> <英文 prompt……, transparent background, no text, 1:1>
```

Project-specific prompt specs belong in the project scaffold. Do not load a prior project's prompts as defaults for a new deck.
