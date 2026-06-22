# GRS Portfolio v3

A production-grade, **fully static**, mobile-first personal portfolio with a
client-side **"Ask Me Anything"** assistant in the hero. No database, no server,
no runtime API calls, no API keys in the bundle. Everything resolves at build
time or in the browser.

- **Stack:** Bun · Next.js 15 (App Router, static export) · React 19 ·
  TypeScript (strict) · Tailwind CSS 4 · Velite · Orama · Fuse.js · Motion.
- **Docs:** see [`docs/`](docs/) — architecture, design system, content schema,
  assistant architecture, ADRs.

---

## 1. Running the app

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.3 (the package manager and test runner).
- Node is used only for a tiny build-time date helper.

### Install & run

```bash
bun install            # install dependencies
bun run dev            # dev server at http://localhost:3000 (Velite runs automatically)
```

### Build the static site

```bash
bun run build          # Velite -> OG images -> next build (static export to ./out)
bun run preview        # serve ./out locally to preview the production build
```

`bun run build` runs three steps: `velite` (validate content + generate types),
`scripts/generate-og.ts` (render OG images), then `next build` with
`output: 'export'`. The result is a pure static site in **`./out`**.

> First build fetches IBM Plex fonts once (for OG images) and caches them under
> `.cache/fonts`. Offline? OG generation is skipped with a warning and the build
> still succeeds. Favicons (`src/app/icon.svg`, `apple-icon.png`, `favicon.ico`)
> are committed; regenerate them from the GRS mark with `bun run icons`.

### Other scripts

```bash
bun run typecheck      # tsc --noEmit
bun run lint           # next lint (ESLint)
bun test               # unit tests (assistant matching + stat math)
bun run format         # Prettier write
```

---

## 2. Content CRUD

All content is **file-based** under [`content/`](content/) and validated at build
by Velite. The workflow is always: **drop/edit a file, rebuild.** New content is
picked up by the site, the assistant (Layer-2 search) and blog search
automatically, with no code changes. Full field reference:
[`docs/content-schema.md`](docs/content-schema.md).

> After any change run `bun run dev` (live) or `bun run build`. Velite fails the
> build loudly if front-matter is invalid.

### A job (experience)

- **Folder:** `content/jobs/<slug>/index.md`
- **Add:** create the folder + `index.md`:

  ```md
  ---
  title: 'Staff Engineer'
  company: 'Acme'
  location: 'Remote'
  range: 'Jun 2026 – Present'
  date: '2026-06-01'
  url: 'https://acme.com/'
  current: true
  stack: ['Go', 'Kubernetes']
  points:
    - 'Led the platform reliability effort.'
  timeline: true
  major: true
  ---

  One-line summary used on the timeline and by the assistant.
  ```

- **Edit / Remove:** edit the fields, or delete the folder.
- **Appears in:** the Experience section (newest first, expandable), `/timeline`
  (when `timeline: true`), the `roles` stat, and assistant answers.

### A project

- **Folder:** `content/projects/<slug>/index.md`
- **Add:**

  ```md
  ---
  title: 'My Thing'
  date: '2026-05-01'
  type: 'Personal' # Personal | Client | Product | OSS
  featured: false # true -> landing + assistant cards
  tech: ['Next.js', 'TypeScript']
  external: 'https://example.com/' # "live ↗"
  github: 'https://github.com/you/thing' # "code ↗"
  excerpt: 'One-line card description.'
  timeline: false
  major: false
  ---

  Longer summary (timeline + assistant).
  ```

- **Edit / Remove:** edit fields, or delete the folder.
- **Notes:** a `PyPI` tech tag counts toward the "PyPI packages" stat; a
  `play.google.com` `external` link counts as an "app shipped".
- **Appears in:** `/projects` (filter/search/favorites), Featured on the landing
  when `featured: true`, the `projects` stat, `/timeline` (when `timeline`),
  assistant + search.

### A blog post

- **File:** `content/posts/<slug>.mdx`
- **Add:**

  ````md
  ---
  title: 'My Post'
  date: '2026-06-15'
  displayDate: 'Jun 2026'
  tldr: 'One or two sentences shown in the TL;DR callout and cards.'
  tags: ['Cloud', 'Go']
  kind: 'case study'
  draft: false
  ---

  <Lead>Opening line, rendered larger.</Lead>

  ## A heading

  Body is full MDX + GFM (tables, lists, footnotes).

  <Callout type="tip" title="Pro tip">Admonition text.</Callout>

  ```ts title="example.ts" {2}
  const x = 1;
  const y = 2; // highlighted line
  ```
  ````

- **Images:** put them next to the post and reference relatively; Velite
  processes them at build.
- **Edit / Remove:** edit the file, set `draft: true` to hide, or delete it.
- **Appears in:** `/blog` (search + tag filter), `/blog/<slug>` (TOC, reading
  time, prev/next, related, per-post OG image), recent posts on the landing, the
  `posts` stat, assistant + search.

### A certification

- **File:** `content/certifications/<slug>.md`

  ```md
  ---
  title: 'AWS Solutions Architect'
  issuer: 'Amazon Web Services'
  date: '2026-03-01'
  url: 'https://credly.com/…'
  points:
    - 'Designed resilient multi-region systems.'
  timeline: true
  major: false
  ---

  Short description.
  ```

- **Appears in:** `/timeline` (when `timeline: true`), assistant + search.

### A timeline / life event

Career, project and cert timeline entries are **derived** automatically. Use this
folder only for **personal life events** that are not derivable.

- **File:** `content/timeline/<slug>.md`

  ```md
  ---
  date: '2026-01-01'
  title: 'Moved to Berlin'
  org: 'Germany'
  type: 'life' # job | project | life | milestone | cert
  importance: 'major' # major | minor
  body: 'Why it mattered.'
  ---
  ```

- **Appears in:** `/timeline`, merged and sorted with derived entries (major =
  weighted card, minor = plain dated line).

### The Now page

- **File:** `content/now/index.md` (single file). Edit `lastUpdated` and the
  `sections` list:

  ```yaml
  ---
  lastUpdated: 'Jun 2026'
  sections:
    - title: 'WORK'
      description: '…'
      tags: ['Infrastructure']
  ---
  ```

- **Appears in:** the Now section on the landing, assistant + search.

---

## 3. Assistant & chips

- **Add an intent:** edit `src/lib/assistant/intents.ts` (append an
  `{ id, examples, keywords, handler }`). Full guide:
  [`docs/ask-me-anything.md`](docs/ask-me-anything.md).
- **Edit the rotating chips:** edit the categorized pool in
  `src/lib/chips.ts` (`CHIP_POOL`).
- The assistant is fully client-side; semantic "smart mode" and an LLM fallback
  are architected seams that are **not enabled**.

---

## 4. Deployment (static) + domain swap

The site deploys as a **new, static** project. It does **not** assume the
production domain.

### Deploy to a new Vercel project

1. Push this repo to GitHub.
2. In Vercel, **New Project** → import the repo.
3. Settings:
   - **Framework preset:** Next.js (it respects `output: 'export'`).
   - **Build command:** `bun run build`
   - **Output directory:** `out`
   - **Install command:** `bun install`
4. Deploy. Validate everything on the auto `*.vercel.app` URL.

> Any static host works too: run `bun run build` and serve `./out`.

### Domain swap (do this manually, after validation)

`singhgautam.com` is currently on the v2 project. Once v3 is validated:

1. In the **old (v2)** Vercel project → Settings → Domains, **remove**
   `singhgautam.com` (and `www`).
2. In the **new (v3)** project → Settings → Domains, **add** `singhgautam.com`
   (and `www`), following Vercel's DNS instructions.
3. Confirm HTTPS provisions and the site resolves, then update
   `SITE.url` / `SITE.domain` in `src/lib/site.ts` if the domain ever changes.

---

## 5. Project layout

See [`docs/architecture.md`](docs/architecture.md) for the full map. In short:
`content/` (Velite) → `src/lib/` (content, stats, assistant engine, search) →
`src/components/` → `src/app/` (routes). The assistant engine in
`src/lib/assistant/` is pure and unit-tested.
