# ADR 0003 — Layered assistant engine + build-time OG

## Status

Accepted.

## Context

The design prototype implements the assistant as a single keyword `match()`
with exact copy. The brief requires a 3-layer architecture (Fuse.js intent
registry, Orama content search, fallback) with semantic + LLM seams, and an
engine that is unit-testable in isolation. The handoff also notes the matcher is
"plain data, easy to extend with a richer NLU later".

## Decision

- Implement Layer 1 with the prototype's **exact approved copy** (em-dash-free),
  but structured as an intent registry (`intents.ts`) matched by keyword rules
  then Fuse.js fuzzy (`match.ts`). The visible behaviour matches the handoff; the
  internals follow the brief.
- Layer 2 is an Orama index over all collections, shared with blog search.
- Layer 3 is a graceful fallback with a contact ramp.
- Semantic smart mode and the LLM fallback are clean seams, not enabled.

OG images: a static export has no runtime OG route, so images are generated at
**build time** with satori + resvg (`scripts/generate-og.ts`) into `public/og/`.
Fonts are fetched once from the jsDelivr fontsource CDN and cached under
`.cache/fonts`; if unavailable, OG generation is skipped with a warning so the
build never breaks.

## Consequences

- The assistant engine has no DOM dependency and is covered by unit tests.
- Adding content auto-indexes for Layer 2 + blog search on rebuild.
- OG generation needs network access on the first build only (then cached).
