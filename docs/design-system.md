# Design system

Derived from the Claude Design handoff (`direction-01-blueprint-foundation`),
the single source of truth. All tokens live as CSS variables in
`src/app/globals.css`; the hero is **sealed** (its approved look is final).

## Tokens (CSS variables)

AMOLED dark is the default (`:root` / `[data-theme="dark"]`); light overrides
under `[data-theme="light"]`.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#000000` | `#F3F6FB` | Page background |
| `--surface` / `-2` / `-3` | `#0b0e14` / `#11151e` / `#161b26` | `#fff` / `#eef2f9` / `#e6ecf6` | Cards, inputs, active rows |
| `--accent` / `-2` | `#5AA0FF` / `#8fc4ff` | `#2f6fe0` / `#1f63d6` | One blue only; CTAs, accents |
| `--accent-ink` | `#04162e` | `#ffffff` | Text on accent fills |
| `--ink` / `-2` / `-3` / `-faint` | `#eef2f9` → `#3a4459` | `#0d1726` → `#b6c3d8` | Text primary → faint |
| `--ok` / `--warn` | `#46d18b` / `#f5b45a` | `#16a34a` / `#c2790a` | Online/now; milestones |
| `--line` / `-2` | blue 12% / 24% | navy 13% / 22% | Hairlines |
| `--grid` / `--grid-quiet` | blue 5% / 2.2% | navy 6% / 3% | Hero grid / landing grid |

**Accent rule:** one blue only, darkened on light purely for AA contrast. No
accent variants, no third theme.

## Type

- **IBM Plex Sans** (display + body), **IBM Plex Mono** (eyebrows, labels,
  metadata, the `grs@infra:~$` prompt, code). Self-hosted via `next/font/google`,
  exposed as `--font-sans` / `--font-mono`.
- Fluid `clamp` scale: hero name `34→56`, page title `32→52`, section h2
  `24→38`, post h2 `21→27`, hero subtitle `16→20`, body 16, small 13, mono label
  11 / eyebrow 12.
- Letter-spacing: display `-0.03em`, headings `-0.02em`, mono eyebrows `0.2em`,
  mono labels `0.14em`.

## Spacing, radii, motion

- Section rhythm `clamp(56px,8vw,92px)` (first after hero `…104px`); dedicated
  page top `clamp(36px,6vw,68px)`.
- Radii: tag/chip 6, control 9, input 15, card 14, large 18, chat sheet 20, pill
  999.
- z-index: content 1 · navbar 50 · theme menu 60 · overlays 100/101.
- Breakpoints: mobile <640 · tablet 640–1023 · desktop ≥1024. Post TOC hides
  <860px. Resume button hides <560px. Layout max-widths: site 1080, reader 1000,
  chat 840.
- Easing `cubic-bezier(.2,.7,.2,1)` (`--ease`). Every animation has a
  reduced-motion fallback, governed solely by the OS query.

## Keyframes / utility classes

`grsblink`, `grsdot`, `grsup`, `grsfade`, `grsshimmer`, `grstype`. Utility
classes: `.grs-hero-grid`, `.grs-landing-grid`, `.grs-chip`, `.grs-send`,
`.grs-reveal`, `.grs-skel`, `.grs-h2/.grs-anchor`, `.grs-rail`.

## Component rules

The handoff component inventory maps to: `Navbar` + `ThemeMenu`,
`CommandPalette`, `ShortcutsOverlay`, `HeroLauncher` + `AmbientField`,
`Assistant`, `SectionEyebrow`/`Section`, `ExperienceRow`, `ProjectCard`,
`PostCard`, `PostReader` + TOC, `Timeline`, `NowSection`, `Contact`, `Footer`.

The hero ambient field is a single-`rAF` canvas of soft cyan-blue radial blooms
(`lighter` compositing): idle drift + breathing pulse, cursor parallax,
focus/typing intensify, send ripple, calm in chat, static glow under reduced
motion. Budget: ≤5 gradient fills/frame, no blur filters. It lives only on the
home route.
