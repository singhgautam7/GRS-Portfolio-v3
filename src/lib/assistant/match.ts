import Fuse from 'fuse.js';
import { intents } from './intents';
import type { Intent, MatchResult } from './types';

/**
 * Layer 1 matching: a deterministic keyword pass first (instant, exact), then a
 * fuzzy Fuse.js pass over every intent's example phrasings. Intent priority is
 * the array order in `intents` (earlier wins ties).
 */

interface FuseEntry {
  phrase: string;
  intentIndex: number;
}

const fuseEntries: FuseEntry[] = intents.flatMap((intent, intentIndex) =>
  intent.examples.map((phrase) => ({ phrase, intentIndex })),
);

const fuse = new Fuse(fuseEntries, {
  // Rigid on purpose: a low threshold means only close paraphrases match, so
  // near-misses and unrelated questions fall through to the in-character
  // fallback instead of a confidently wrong answer.
  keys: ['phrase'],
  includeScore: true,
  threshold: 0.34, // below this distance counts as a confident fuzzy match
  ignoreLocation: true,
  minMatchCharLength: 3,
});

/** Deterministic keyword pass, honoring intent order. */
function keywordMatch(query: string): MatchResult | null {
  const q = query.toLowerCase();
  for (const intent of intents) {
    if (
      intent.keywords.some((k) => {
        const keyword = k.trim();
        const escaped = keyword.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        return regex.test(q);
      })
    ) {
      return { intent, confidence: 1, via: 'keyword' };
    }
  }
  return null;
}

/** Fuzzy pass over example phrasings via Fuse.js. */
function fuzzyMatch(query: string): MatchResult | null {
  const results = fuse.search(query.trim());
  const best = results[0];
  if (!best || best.score === undefined) return null;
  const intent = intents[best.item.intentIndex];
  if (!intent) return null;
  // Fuse score is a distance (0 = perfect). Convert to a 0..1 confidence.
  return { intent, confidence: 1 - best.score, via: 'fuzzy' };
}

/**
 * Find the best Layer-1 intent for a query, or null if nothing is confident
 * enough (the engine then falls through to content search).
 */
export function matchIntent(query: string): MatchResult | null {
  if (!query.trim()) return null;
  return keywordMatch(query) ?? fuzzyMatch(query);
}

/** Exposed for tests + tooling. */
export function getIntents(): Intent[] {
  return intents;
}
