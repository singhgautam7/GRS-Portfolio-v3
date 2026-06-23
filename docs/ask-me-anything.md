# Ask Me Anything — assistant architecture

The assistant is **fully client-side**, offline-ready, and zero-cost. It runs in
the browser with no server, no API key, and nothing leaving the device (this is
surfaced by the on-device badge). The engine lives in `src/lib/assistant/` and is
pure data + matching, so it is unit-testable with no DOM
(`src/lib/assistant/assistant.test.ts`).

## Three layers with clean seams

```
ask(query)
  └─ Layer 1: deterministic, instant
       parametric resolvers ─► named skill / company / project (real content)
       intent registry      ─► keyword rules ─► Fuse.js fuzzy over examples
  └─ Layer 2: Orama content search (auto-adapts to new content)
  └─ Layer 3: graceful fallback (always offers a contact exit ramp)
```

- **Layer 1 (pre-step) — `parametric.ts`.** Before the fixed intents, three
  resolvers answer questions about a *named entity*: a skill ("do you know Go?"),
  a company ("what did you do at HSBC?"), or a project ("tell me about Kuber").
  Skills come from the `config/skills.ts` vocabulary; companies and projects are
  read straight from the Velite collections, so the answers stay correct as
  content changes. An entity must be named (whole-word or exact-query match)
  before anything fires, so entity-free questions fall straight through to the
  intent registry. The skill resolver **never fabricates**: unknown tech gets an
  honest "not my core stack" (see `NOT_CORE`).
- **Layer 1 — `intents.ts` + `match.ts`.** Each intent is
  `{ id, examples, keywords, handler(ctx, query) }`. Matching tries a
  deterministic keyword pass first (instant), then a Fuse.js fuzzy pass over the
  example phrasings with a confidence threshold. Intent priority is array order.
  Handlers receive a live `AssistantContext` so copy uses **derived** numbers
  (experience label, project count) rather than hardcoded values.
- **Layer 2 — `engine.ts` + `src/lib/search/`.** On a Layer-1 miss, the engine
  queries a shared Orama index built from every Velite collection (projects,
  posts, jobs, now, timeline) and answers in the first person with a link. The
  **same index powers blog search**. New `.mdx` added later is indexed on
  rebuild, with no code changes.
- **Layer 3 — `fallback.ts`.** Never a dead end: quick-pick chips plus a contact
  exit ramp ("or just email me"). This is also the in-app empty/error answer.

## Responses

`AssistantResponse = { text, cards?, buttons?, source, intentId? }`. Buttons have
actions: `resume`, `mailto`, `link`, `ask` (re-query), `route` (navigate). Route
values are section names (`Experience`), page names (`Projects`), or internal
paths (`/blog/<slug>`), resolved by `useSiteNav().goRouteValue`.

**Copy rule:** all assistant text avoids em dashes (`—`); a unit test enforces
this across every intent reply.

## Rigidity

Matching is deliberately strict so unrelated questions do not hit the wrong
handler:

- The Fuse.js fuzzy threshold is low (`0.34`), so only close paraphrases match.
- Layer 2 only answers on a clearly strong content hit (Orama BM25 score `>= 10`;
  out-of-scope queries score far lower), preferring a concrete project/post/job
  answer over a generic timeline hit.
- Anything that clears neither bar falls through to the in-character fallback,
  which always offers a real contact path.

## Parametric resolvers (named entities)

These run first (see `parametric.ts`) and read from real content/config, so they
never go stale and never invent facts.

| Resolver | Example triggers | Behaviour |
|---|---|---|
| skill (known) | "do you know Go?", "experience with Kubernetes", "redis" | curated, true blurb from `config/skills.ts` (depth-aware phrasing) |
| skill (not core) | "have you used Rust?", "do you know Java?" | honest "not my core stack" + pivot to the real stack (`NOT_CORE`) |
| company | "what did you do at HSBC?", "tell me about Fractal" | role, range, and top points from the `jobs` collection |
| project | "tell me about Kuber", "a tour of go" | project card from the `projects` collection |

## Intents and triggers

Evaluated top to bottom; earlier wins. Full copy lives in `intents.ts`.

| Intent | Example triggers | Behaviour |
|---|---|---|
| `egg-whoami` / `egg-sudo-hire` / `egg-help` | `whoami`, `sudo hire me`, `help` | terminal easter eggs |
| `reading` | "what are you reading", "what books", "what are you watching" | quirky stub; books/watchlist is a future `/offline` page. Does NOT hit `now`/`work`. |
| `affection` | "i love you", "i like you", "marry me" | playful deflection + contact pill |
| `offtopic` | "how is the weather", "how is your day" | "Is that really what you want to ask me after seeing my portfolio?" |
| `news` | "what is the news", "news today", "latest news" | redirects to the real Gautam + contact pill |
| `do-my-work` | "write a program", "write code", "design a system", "build me", "fix my code", "solve this" | "Sure, I can do that and a lot more. Let's connect first." + contact pill |
| `availability` | "are you open to work", "are you actively looking" | config-driven (`config/recruiter.ts` `openToWork`) + roles |
| `relocation` | "are you open to relocation", "do you work remotely" | relocation + location posture |
| `notice` | "what is your notice period", "how soon can you start" | soft, deflects specifics to a conversation |
| `compensation` | "expected salary", "expected CTC", "what do you charge" | **never a number**, deflects to a call/email |
| `visa` | "do you need visa sponsorship", "work authorization" | **never specifics**, deflects to a conversation |
| `freelance` | "do you freelance", "contract work", "consulting" | freelance posture |
| `hire` / `fun` / `real-ai` / `coffee` | "why should I hire you", "tell me something fun", "are you a real AI", "coffee or terminal" | playful |
| `career-journey` | "walk me through your career", "how did you get into engineering", "proudest work" | the career arc, points at the timeline |
| `experience` | "how much experience", "how senior", "how long" | dynamic years + precise mode |
| `meta` | "how does this assistant work", "is this open source", "how was this built" | explains the static, on-device build |
| `working-style` | "how do you work", "engineering philosophy", "how do you approach problems" | reliability-first philosophy |
| `location` | "where are you based", "which city", "what timezone" | location from `config/recruiter.ts` |
| `work` | "what do you work on", "at HashiCorp" | day-to-day |
| `projects` | "best projects", "what have you built", "local-first" | showcase cards |
| `now` | "what are you doing now", "what are you learning" | Now summary |
| `contact` | "how do I contact you", "your email", "your linkedin", "your github", "twitter" | email + socials (lead varies by channel) |
| `skills` | "tech stack", "languages", "tools" | grouped skills |
| `resume` | "your resume", "your CV" | resume download |
| `blog` | "do you write", "your posts" | blog link |
| `greeting` | "hello", "hi", "hey" | greeting |
| _fallback_ | anything out of scope | "That's a bit outside what I cover here..." + contact pill |

## Editable config

| File | Controls |
|---|---|
| `config/skills.ts` | The skills vocabulary, curated per-skill blurbs, and `NOT_CORE` (techs to be honest about). |
| `config/recruiter.ts` | Hiring status (`openToWork`), target roles, location/relocation, notice, freelance, and the salary/visa deflection copy. **Sensitive answers never contain numbers** by policy. |

## Special behaviours

- **Experience** is computed dynamically from the start constant
  `2019-01-13T09:00:00+05:30` (`src/lib/experience.ts`). Default phrasing is
  "7+ years"; a **precise mode** ("exactly how long…") returns years, months,
  days, hours and minutes.
- **Easter eggs:** `whoami`, `sudo hire me`, `help`.

## How to add an intent

1. Open `src/lib/assistant/intents.ts`.
2. Append an entry to the `intents` array (order = priority, more specific first):

   ```ts
   {
     id: 'speaking',
     examples: ['do you give talks?', 'are you available to speak?'],
     keywords: ['talk', 'speak', 'conference'],
     handler: () =>
       r({ text: 'I enjoy talking about reliability and on-device AI.',
           buttons: [{ label: 'Email me', kind: 'primary', action: 'mailto' }] },
         'speaking'),
   },
   ```

3. Add a test case in `assistant.test.ts` if it should match specific phrasings.
   No UI changes are needed.

## Editing the rotating chips

Edit the categorized pool in `src/lib/chips.ts` (`CHIP_POOL`). On each page load,
one chip per bucket is picked (always including a playful one), shuffled, and
shared across the hero and chat for the session (`useSessionChips`).

## Surfaces: home morph vs the `/askme` page

The same `Assistant` component powers two surfaces:

- **Home morph overlay** (`HeroChatShell`): an ephemeral, session-only chat that
  morphs in from the hero input (shared `layoutId`). Intentionally stateless.
- **Dedicated `/askme` page** (`AskClient`, passes `persist`): a shareable URL
  with extra affordances, all gated behind the `persist` prop so the home morph
  is untouched:
  - conversation persisted to `localStorage` (`grs:ama:history:v1`, capped, only
    settled messages) and restored after hydration;
  - an overflow menu with **Clear all**;
  - per-message time revealed on hover/click, and WhatsApp-style day separators
    (Today / Yesterday / date);
  - a deep-link seed (`/askme?q=…`) is consumed once, then stripped from the URL
    so a reload does not re-ask it.

Sending is bound to Enter and Cmd/Ctrl+Enter on both surfaces.

## Enabling semantic "smart mode" (architected, not enabled)

`semantic.ts` documents the seam. To enable on-device embeddings later:

1. Add a web worker that loads `@huggingface/transformers` with
   `all-MiniLM-L6-v2` and exposes `embed(text)`.
2. Add an `embedding: 'vector[384]'` field to the Orama schema in
   `src/lib/search/index.ts`; embed documents once at index build (off main
   thread).
3. Switch `searchContent` to Orama hybrid (vector + full-text) search.

It is lazy and flagged (`SEMANTIC_ENABLED = false`), so it never blocks first
paint and stays fully optional.

## LLM fallback (stub only)

`llm.ts` defines a clean `LLMFallback` interface but ships a no-op stub
(`available: false`). The static site stays offline and zero-cost by default; an
LLM is a future, opt-in seam, never bundled.
