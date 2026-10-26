# Design system

Source of truth: the Claude Design handoff in `specs/design/` (prototypes, `tokens.css`, the
`keyboard3d.js` reference rig, component and motion sheets, handoff notes). It supersedes the
earlier `direction-01-blueprint-foundation` handoff and its blue/crimson palette.

- Tokens: `src/styles/tokens.css` (verbatim copy of the design's file), mirrored for JS in
  `src/lib/tokens.ts` (checked by `tokens.test.ts`).
- Two modes only: light (warm ceramic + signal orange) and dark (graphite + neon phosphor green).
- Type: Host Grotesk (sans), Martian Mono (mono), Young Serif (wordmark only), Special Elite
  (typewriter paper), Press Start 2P (arcade marquee); bundled in `src/styles/fonts/`.
- Primitives: `src/components/ui/` (Keycap2D, Button, Chip, Dialog, Tooltip, SectionMarker).

Rules for using them are in `CLAUDE.md`.
