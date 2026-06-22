# Future — `/offline` media page (deferred)

**Not built now.** Captured here so it is not lost.

A future `/offline` page showcasing books, anime and games, with cover images
**baked in at build time** (never fetched at runtime, per the static constraint).

## Sketch

- New Velite collection `media/` with entries like:

  ```yaml
  title: 'Designing Data-Intensive Applications'
  type: 'book' # book | anime | game
  status: 'reading' # reading | finished | watching | playing | backlog
  rating: 5
  cover: './cover.jpg' # processed by Velite image pipeline at build
  link: 'https://…'
  ```

- A `/offline` route rendering grouped, filterable cards (reuse the
  projects/blog filter-chip pattern).
- Covers are imported as static assets through Velite's image processing
  (`s.image()`), so nothing is fetched at runtime. If covers must come from an
  external source, fetch them in a **build script** (like `generate-og.ts`) and
  commit/cache them as static files.
- Index the collection into the shared Orama documents so the assistant can
  answer "what are you reading / watching / playing".

## Why deferred

Out of scope for v3's launch; the content pipeline and search are already
structured to absorb it without rework.
