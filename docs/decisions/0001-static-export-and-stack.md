# ADR 0001 — Fully static export on Next.js 15 + Bun

## Status

Accepted.

## Context

The brief mandates a fully static site with zero runtime cost beyond the domain:
no database, server, runtime API calls, or API keys in the bundle. The stack is
pinned by the brief (Bun, Next.js 15 App Router + React 19, TypeScript strict,
Tailwind 4, Motion, Velite, Orama, Fuse.js).

## Decision

- `output: 'export'` in `next.config.mjs`; emit `./out`. `next/image` is
  `unoptimized` (no optimization server).
- Velite runs via the async-config hook so it works under both Turbopack dev and
  the export build.
- Next 16 is now the latest, but the brief explicitly specifies Next **15**, so
  we pin `15.5.19`. ESLint is pinned to `^9` and TypeScript to `^5.7` for
  guaranteed compatibility with `eslint-config-next@15` and Velite, rather than
  the brand-new ESLint 10 / TS 6.
- Velite bundles its own Zod-based schema helper (`s`), so no separate `zod`
  install is needed for content.

## Consequences

- No server features (ISR, route handlers, runtime OG). OG images are generated
  at build time (ADR 0003). Search and the assistant run client-side.
- Deploys as a plain static site to any static host (Vercel static, etc.).
