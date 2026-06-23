# Architecture

GRS Portfolio v3 is a **fully static** Next.js 15 (App Router) site. There is no
database, no server runtime, and no runtime API calls. Everything resolves at
build time or client-side. The signature feature is a client-side **"Ask Me
Anything"** assistant in the hero.

## Stack

| Concern | Choice |
|---|---|
| Runtime / package manager | Bun |
| Framework | Next.js 15 (App Router) + React 19, `output: 'export'` |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`) |
| Styling | Tailwind CSS 4 + CSS-variable design tokens |
| Animation | Motion (`motion/react`) where used; bespoke canvas for the hero |
| Content | Velite (Zod schemas, MDX, image processing) |
| Markdown/MDX | remark-gfm + rehype-pretty-code (Shiki) + rehype-slug |
| Assistant search | Orama (in-browser full-text, vector-ready) |
| Assistant intents | Fuse.js fuzzy matching over example phrasings |
| Icons | Unicode mono glyphs (Lucide available) |

## Directory layout

```
content/                 # file-based content (Velite collections)
  jobs/ projects/ posts/ certifications/ now/ timeline/
.velite/                 # generated content data + types (gitignored)
public/og/               # build-time OG images (gitignored, regenerated)
scripts/generate-og.ts   # build-time OG image generation (satori + resvg)
src/
  app/                   # routes (App Router)
    page.tsx             # landing (hero + sections)
    askme/                 # full-screen chat surface (/askme)
    projects/ timeline/ blog/ blog/[slug]/
    not-found.tsx sitemap.ts robots.ts layout.tsx globals.css
  components/
    chrome/              # navbar, command palette, shortcuts, 404, SiteChrome
    hero/                # HeroLauncher + AmbientField (canvas)
    assistant/           # Assistant chat surface (typewriter, cards, buttons)
    sections/            # landing sections (About, Skills, Experience, ...)
    cards/ blog/ ui/ providers/
  lib/
    assistant/           # the 3-layer engine (intents, match, search, fallback, seams)
    search/              # shared Orama index + documents
    content.ts stats.ts experience.ts timeline.ts navigation.ts site.ts chips.ts
    hooks/
docs/                    # this folder
```

## Layering

```
content (Velite) ──► lib (content/stats/timeline/search) ──► assistant engine
                                                          └─► UI components ──► routes
```

The assistant **engine** (`src/lib/assistant`) is pure data + matching and is
unit-testable in isolation (no DOM). The UI imports only the public API from
`@/lib/assistant`.

## Routing & SPA behaviour

Routes are real Next routes (`/`, `/askme`, `/projects`, `/timeline`, `/blog`,
`/blog/[slug]`). The global chrome (navbar, command palette, shortcuts overlay,
scroll progress, active-section pill) lives in `SiteChrome` in the root layout,
so `Cmd+K` works everywhere. On the home route an IntersectionObserver tracks the
active section and syncs the URL hash via `history.replaceState`.

The hero never hijacks scroll: scrolling browses the landing; sending the input
or tapping a chip navigates to `/askme?q=...`, which seeds the chat.

## Theming

Two themes only (AMOLED dark default + light), driven by CSS variables under
`[data-theme]` on `<html>`. A blocking inline script in `layout.tsx` reads
`localStorage('grs-theme')` before first paint to avoid a flash. Motion is
governed solely by the OS `prefers-reduced-motion` query (no in-app toggle).

## Static-export pipeline

`bun run build`:

1. `velite` validates content and generates `.velite/`.
2. `scripts/generate-og.ts` renders OG PNGs to `public/og/`.
3. `next build` with `output: 'export'` emits `./out` (pure static HTML/JS).

`NEXT_PUBLIC_DEPLOYED_AT` is injected at build time for the footer timestamp.
`next/image` is configured `unoptimized` (no optimization server).

## Content-derived values

Years of experience (from the `experienceStart` constant), project/role/post
counts, PyPI packages and app counts are all computed from content at build
(`src/lib/stats.ts`, `src/lib/experience.ts`). Adding a project file bumps the
number on the next build. The assistant answers the same questions from the same
values, so the site and the assistant never disagree.
