# Content schema

All content lives under `content/` and is validated at build by Velite
(`velite.config.ts`) against Zod schemas. **Validation fails the build loudly.**
Generated, typed data is emitted to `.velite/` and imported via the `#content`
alias (re-exported, sorted and derived, from `src/lib/content.ts`).

Drop a file in the right folder, fill the front-matter, rebuild. The site and the
assistant + blog search pick it up automatically (no code changes).

## `jobs/<slug>/index.md` — experience

| Field | Type | Notes |
|---|---|---|
| `title` | string | Role title (e.g. "Engineer 2") |
| `company` | string | Company name |
| `location` | string | City, country |
| `range` | string | Display range, e.g. `Apr 2025 – Present` (en dash) |
| `date` | isodate | Start date — used for ordering + timeline |
| `url` | url? | Company link |
| `current` | boolean | Shows the `CURRENT` badge; defaults open in Experience |
| `stack` | string[] | Tech tags shown when expanded |
| `points` | string[] | `→` bullet points shown when expanded |
| `timeline` | boolean | Surface on `/timeline` (default true) |
| `major` | boolean | Timeline weight (default true) |
| _body_ | markdown | One-line summary; used for timeline + assistant |

## `projects/<slug>/index.md` — project archive

| Field | Type | Notes |
|---|---|---|
| `title` | string | |
| `date` | isodate | Used for ordering; `year` derives from it |
| `year` | string? | Override display year (else derived) |
| `type` | enum | `Personal` \| `Client` \| `Product` \| `OSS` |
| `featured` | boolean | Featured on the landing + assistant cards |
| `tech` | string[] | Tech tags (`PyPI` tag counts toward the PyPI stat) |
| `external` | url? | "live ↗" link (Play Store link counts as an app shipped) |
| `github` | url? | "code ↗" link |
| `excerpt` | string | Card description |
| `timeline` | boolean | Surface on `/timeline` (default false) |
| `major` | boolean | Timeline weight (default false) |
| _body_ | markdown | One-line summary; used for timeline + assistant |

## `posts/<slug>.mdx` — blog

| Field | Type | Notes |
|---|---|---|
| `title` | string | |
| `date` | isodate | Ordering + prev/next |
| `displayDate` | string? | e.g. `Feb 2026` (else derived) |
| `tldr` | string | Shown in the TL;DR callout + cards + search |
| `tags` | string[] | Tag filter + related posts |
| `kind` | string | Meta label (default `case study`) |
| `draft` | boolean | Excluded from the static build when true |
| `timeline` | boolean | Surface on `/timeline` (default false) |

Reading time and word count are derived from the content. Body is full MDX with
GFM. Available MDX components: `<Lead>…</Lead>`, and
`<Callout type="note|tip|warning" title="…">…</Callout>`. Code fences support a
filename and highlighted lines:

````md
```ts title="adapter.ts" {6,7}
// highlighted lines 6 and 7
```
````

## `certifications/<slug>.md`

| Field | Type | Notes |
|---|---|---|
| `title` | string | |
| `issuer` | string | |
| `date` | isodate | |
| `url` | url? | |
| `points` | string[] | |
| `timeline` | boolean | default true |
| `major` | boolean | default false |

## `now/index.md` — the Now page (single)

```yaml
lastUpdated: 'Feb 2026'
sections:
  - title: 'WORK'
    description: '…'
    tags: ['Infrastructure', 'Kubernetes']
```

## `timeline/<slug>.md` — life & milestone events

Career, project and certification timeline entries are **derived** from their
collections. This folder is **only** for personal life events that are not
derivable (e.g. "Moved to Bangalore").

| Field | Type | Notes |
|---|---|---|
| `date` | isodate | |
| `displayDate` | string? | e.g. `JAN 2023` (else derived) |
| `title` | string | |
| `org` | string? | |
| `type` | enum | `job` \| `project` \| `life` \| `milestone` \| `cert` |
| `importance` | enum | `major` \| `minor` |
| `body` | string? | Description shown on major cards |

The merged, sorted timeline is built in `src/lib/timeline.ts`.

## Deferred (not built — see `docs/future/`)

A `media/` collection for a future `/offline` page (books / anime / games with
covers baked in at build).
