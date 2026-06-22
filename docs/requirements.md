# v3 feature requirements

A production-grade, fully static, mobile-first personal portfolio. The signature
feature is a client-side **"Ask Me Anything"** assistant in the hero; below it
sits a concise portfolio with a few dedicated pages.

## Hard constraints

- Fully static site, zero runtime cost beyond the domain. Static export only: no
  database, no server, no runtime API calls, no API keys in the bundle.
- This rules out RSS, comments, view counts, contact forms, and live third-party
  fetches. Contact is `mailto:` + a copy-email button.
- The assistant runs entirely client-side.
- External data (e.g. future media covers) is baked in at build time.

## Functional requirements

- **Ask Me Anything assistant** (see `ask-me-anything.md`): 3 layers, dynamic
  experience + precise mode, easter eggs, Orama content search shared with blog
  search, graceful fallback, semantic + LLM seams (not enabled). Idle hero
  scrolls to browse; sending / tapping a chip opens the full-screen chat;
  greeting + answers typewriter; rotating chips refresh per load.
- **Landing (`/`)**: concise — Hero, About (+ content-derived stats strip),
  Skills, Experience (expandable), featured Projects, recent Posts, Now, Contact,
  Resume. Scroll-synced section nav + active-section pill + scroll progress.
- **`/timeline`**: a real two-tier timeline (major weighted cards, minor plain
  dated lines), including life events. Own mobile layout.
- **`/projects`**: full archive (~19), filterable + searchable, favorites in
  `localStorage`.
- **`/blog`** + **`/blog/[slug]`**: full MDX + GFM, Shiki code blocks with copy,
  callouts, anchored headings + sticky TOC scroll-spy, reading time, prev/next,
  related posts, tag filter, client search, per-post build-time OG image.
- **Cmd+K** command palette: navigate, copy email, download resume, toggle theme,
  open GitHub, shortcuts.
- Two themes (AMOLED dark + light), persisted. `?` shortcuts overlay. Terminal
  404. Footer with last-deployed timestamp.

## Content management

File-based via Velite (see `content-schema.md`). Drop a file in a folder, fill
front-matter, rebuild. All v2 content migrated: 6 jobs, 19 projects, posts, now,
certifications, derived + life-event timeline.

## Quality bars

- Accessibility: semantic HTML, visible focus, keyboard-operable everything,
  focus-trapped dialogs, `aria-live` answers, reduced-motion honored.
- Performance: instant Layer-1/2 answers; never block first paint on any
  model/animation.
- SEO: Open Graph + Twitter cards + sitemap + robots; page content in real,
  crawlable DOM (not only via the assistant).
- Static integrity: `bun run build` produces a clean static export with no server
  dependencies.

## Definition of done

See the project root `README.md` and the checklist in the original brief. Verified
by: clean `bun run build` static export, `bun run typecheck`, `bun run lint`, and
`bun test` (assistant intent matching + content-derived stat math).
