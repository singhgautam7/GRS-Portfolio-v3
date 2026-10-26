# singhgautam.com v3

Fully static Next.js 15 (App Router, `output: 'export'`) + Bun + React 19 + TypeScript strict.
Content is file-based (Velite, `content/`). Zero runtime cost beyond the domain: no server, DB,
runtime API calls or keys in the bundle.

## Commands

- `bun run dev` · `bun run build` (Velite, OG images, static export to `out/`)
- `bun run lint` · `bun run typecheck` · `bun test` (unit, `src/` only via bunfig.toml)
- `bun run e2e` (Playwright against `out/`: E2E, axe, visual; `--update-snapshots` to rebase)
- `bun run posters` (after a build: re-renders `public/posters/*.webp` from the real rig;
  rerun whenever a keyboard's look or the tokens change)
- Run lint, typecheck, unit tests and build after every change set.

## Design is the source of truth

- The Claude Design handoff lives in `specs/design/` (HTML prototypes, `tokens.css`,
  `keyboard3d.js` reference rig with sound synthesis, component/motion sheets, handoff notes).
- **Visuals, motion and sound: the design wins.** Use its exact values; never invent, "improve" or
  approximate. Numbers in prompts are fallbacks only when the design is silent.
- **Behaviour, architecture, performance, accessibility, testing: the build prompt wins.**
- Newer handoff beats older: two modes only (light = signal orange, dark = neon green). No palette
  picker. Older screenshots in `specs/design/**/shots/` are superseded.
- Gaps: pick what is most consistent with the design and list it under "Design gaps" in the phase
  summary. Conflicts in behaviour or scope: stop and ask.
- UI phases end with screenshots (light + dark, 1440 + 390) compared against the design frames.

## Tokens and theming

- `src/styles/tokens.css` is the design's token file, copied verbatim (font stacks lead with the
  next/font variables; a marked block at the end adds named values the frames repeat inline).
- `src/lib/tokens.ts` mirrors motion values for JS; `tokens.test.ts` fails if they drift.
- No hardcoded colours, durations, easings or volumes in components. Literal design measurements
  live only in `tokens.css` and the primitives' `components/ui/ui.module.css`; feature code uses
  tokens and primitives. 3D/canvas read colours from computed CSS variables and re-read on mode
  change.
- Use `--accent` for fills only; text/icons on surfaces use `--accent-text` (AA in both modes).
- `<html data-theme data-os>` is set before first paint by the inline script in
  `components/providers/ThemeProvider.tsx` (OS scheme by default, stored toggle overrides).
- The legacy token aliases block in `globals.css` exists only for pre-refresh components; delete
  it once they are restyled.
- Fonts are bundled via `next/font/local` (`src/styles/fonts.ts`). No runtime asset fetches of any
  kind: fonts, env maps, textures, models and sounds are all bundled.

## Structure (feature-first)

- `src/lib/`: `tokens.ts`, `platform.ts` (OS + touch), `reduced-motion.ts`, `storage.ts` (guarded
  localStorage with `schemaVersion`), content/assistant/search modules.
- `src/components/ui/`: shared primitives, built first, used by every feature: `Keycap2D` (+
  `ModKey`), `Button`, `Chip`, `Dialog` (native `<dialog>`, center or sheet), `Tooltip`,
  `SectionMarker`. `Keycap2D` is the only 2D keycap.
- OS legends: render `<ModKey />`, never branch on OS in render (CSS picks via `html[data-os]`).
- `src/input/` global keyboard layer · `src/audio/` sound engine · `src/features/`: `chrome`
  (top bar, footer, toast), `hero`, `keyboards` (`core/rig.ts`, `core/layouts.ts`,
  `core/loaders.ts`, `variants/*`, `selector/`), `command-palette`, `shortcuts-sheet`, `ask`,
  `sections`, `playground` (`engine/` pure TS, `scenarios/` data, `scene/` SVG, `ui/`).
- `components/chrome/SiteChrome.tsx` is the only place the input layer is attached and shortcut
  ids get their meaning.

## Deliberate deviations from the build prompt (owner may reverse)

- 3D uses plain three.js (the design rig ported to TS), not React Three Fiber + drei.
- Caps are per-key meshes with one shared legend atlas, not InstancedMesh (~25 draw calls).
- The playground scene is the design's isometric SVG, not an R3F orthographic scene.
- Keyboard selector is the design's dropdown listbox + mute key (7d), not a chip radio group.

## Input layer rules

- One module (`src/input/`) owns every `keydown`/`keyup` listener. Nothing else attaches its own.
- State in a vanilla store read via `subscribe`/`getState`; no React re-render per keypress.
- `event.code` drives 3D key lighting; `event.key` + modifiers drives shortcut matching.
- The shortcut registry is data, in one place, and feeds the palette, shortcuts sheet and labels.
- Ignore input in fields, during IME composition, and while a typing dialog is open.
  `preventDefault` only bound combos; never Tab or browser-reserved shortcuts. Space/arrows press
  the board (no page scroll) while most of the hero is in view or the pointer is over it, except
  when a control (button, link, list, slider) has focus (owner decision, 2026-10-26).
- macOS: release non-modifier keys on Meta keyup (plus a safety timeout). Release all on blur and
  visibilitychange. `event.repeat` is a light re-pulse.
- Idle autoplay and pointer presses go through the same pipeline, flagged `ghost` / `pointer`.

## Keyboard variants

- Each variant (`thk` Mechanical default, `tik` Laptop, `clk` Typewriter, `pop` Bubble, `pew`
  Bullet, `8bt` Arcade) is a self-contained module implementing one typed contract: id/chip/name,
  layout (must include ⌘/Ctrl, K, Enter, `/`, G, A, E, P, W, C, Esc; unit-tested), build, motion,
  feedback, specials, sounds, dispose.
- Shared behaviour lives in `keyboards/core`. One `useFrame` loop, typed arrays, hand-rolled
  springs, InstancedMesh with per-instance attributes, legend texture atlas, ~25 draw calls max.
- Live keys always use the mode accent. Each variant is its own dynamic chunk; only the active one
  loads. Swap is latest-wins, at most two mounted, outgoing disposed.

## Audio

- Web Audio, one shared `AudioContext`, created/resumed only after a real gesture and only when
  unmuted. Muted by default. Ghost input is always silent. Suspend when the tab is hidden.
- Sounds are synthesised in code (port from `specs/design/**/keyboard3d.js`). Round-robin pitch,
  polyphony caps (drop oldest). Audio subscribes to the input store; rendering never calls audio.

## Performance budgets

- Landing first-paint JS excludes three.js/R3F, every keyboard variant and every sound.
- LCP is the server-rendered headline, not the canvas. CLS = 0 (posters at the canvas aspect).
- 60fps per variant on a mid-range laptop; pause off-screen/hidden; DPR ≤ 2, adaptive.
- No long tasks from input or audio. Playground is its own route, never in the landing bundle.

## Testing

- Unit (bun test): playground engine, input matching/quirks, variant contract, audio rules,
  selector persistence, platform detection, Ask matcher, token mirror.
- E2E + axe + visual regression (Playwright) in light and dark; these screenshots double as the
  design comparison.

## Never

- No analytics, telemetry, crash reporting or third-party scripts. "No tracking." is a promise.
- No `any` without a comment saying why. ESLint and `tsc` clean.
- No "AI" / "assistant" / "on-device assistant" wording in user-facing copy or metadata.
- No coloured emoji (lucide icons in currentColor); no en/em dashes in user-facing strings.
- Experience years are computed from `SITE.experienceStart`, never hardcoded.
- `content.ts` imports Velite JSON directly (`#content/x.json`), not through the index re-export.
