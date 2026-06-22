# ADR 0002 — Dynamic experience number vs the design snapshot

## Status

Accepted.

## Context

The design prototype hardcodes "7.5+ yrs" in the hero/About and the assistant.
The brief requires content-derived stats computed at build ("never hardcode"),
from the start constant `2019-01-13T09:00:00+05:30`, and gives the default
phrasing as "7+ years". As of mid-2026 the computed value is ~7.44 years, which
floors to "7+", not "7.5+".

## Decision

Compute experience dynamically (`src/lib/experience.ts`) and display
`{floor-to-nearest-0.5}+` (`experienceLabel`). It reads "7+" now and auto-bumps
to "7.5+", "8+" over time. The assistant uses the same value, so the site and
assistant never disagree. A precise mode ("exactly how long…") returns
years/months/days/hours/minutes.

The brief's "never hardcode" rule and its own "7+ years" example take precedence
over the design's static snapshot (a point-in-time render). This is the one
numeric place the implementation intentionally differs from the prototype.

## Consequences

- The hero/About show "7+ yrs" today; this is correct and self-updating.
- Unit tests pin the math at fixed dates (`experience.test.ts`,
  `stats.test.ts`).
