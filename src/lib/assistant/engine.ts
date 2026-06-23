import { matchIntent } from './match';
import { buildContext } from './context';
import { fallbackResponse } from './fallback';
import { resolveParametric } from './parametric';
import { searchContent } from '@/lib/search';
import type { SearchHit } from '@/lib/search';
import type { AssistantContext, AssistantResponse } from './types';

/**
 * The assistant engine. Resolves a query through three layers:
 *   1. Intent registry (deterministic, instant).
 *   2. Orama content search (auto-adapts to new content).
 *   3. Graceful fallback with a contact exit ramp.
 */

/**
 * Layer 1 only — synchronous and instant. Returns null on a miss.
 *
 * Parametric resolvers (named skill / company / project) run first: they answer
 * questions about a specific entity from real content. With no named entity they
 * return null and the deterministic intent registry takes over.
 */
export function answerLayer1(
  query: string,
  ctx: AssistantContext = buildContext(),
): AssistantResponse | null {
  const parametric = resolveParametric(query, ctx);
  if (parametric) return parametric;

  const match = matchIntent(query);
  if (!match) return null;
  return match.intent.handler(ctx, query);
}

/** Build a first-person answer from the best content-search hit. */
function contentAnswer(hit: SearchHit): AssistantResponse {
  switch (hit.type) {
    case 'post':
      return {
        source: 'content',
        text: `I wrote about that. "${hit.title}" is probably what you are after.`,
        buttons: [{ label: 'Read the post', kind: 'primary', action: 'route', value: hit.href }],
      };
    case 'project':
      return {
        source: 'content',
        text: `That sounds like one of my projects. Here is ${hit.title}:`,
        cards: [
          {
            title: hit.title,
            kind: hit.tags[0] ?? 'Project',
            desc: hit.body.slice(0, 160),
            tags: hit.tags.slice(0, 2),
            url: hit.external,
          },
        ],
        buttons: [
          { label: 'Browse all projects', kind: 'ghost', action: 'route', value: 'Projects' },
        ],
      };
    case 'job':
      return {
        source: 'content',
        text: `That maps to my time as ${hit.title}. The experience section has the details.`,
        buttons: [{ label: 'See experience', kind: 'primary', action: 'route', value: 'Experience' }],
      };
    case 'now':
      return {
        source: 'content',
        text: `Here is where that fits into what I am up to now: ${hit.body.trim()}`,
        buttons: [{ label: 'My Now page', kind: 'ghost', action: 'route', value: 'Now' }],
      };
    default:
      return {
        source: 'content',
        text: `Here is something from my timeline that might help: ${hit.title}.`,
        buttons: [{ label: 'View timeline', kind: 'ghost', action: 'route', value: 'Timeline' }],
      };
  }
}

/**
 * Full resolution: Layer 1, then Layer 2 content search, then Layer 3 fallback.
 * Async because Layer 2 queries the in-browser index (sub-millisecond, but the
 * API is async-shaped so the semantic seam can drop in later).
 */
export async function answer(
  query: string,
  ctx: AssistantContext = buildContext(),
): Promise<AssistantResponse> {
  const layer1 = answerLayer1(query, ctx);
  if (layer1) return layer1;

  try {
    const hits = await searchContent(query, { limit: 4 });
    // Only trust a clearly strong content hit; out-of-scope queries score far
    // lower (BM25 ~6-8 vs ~16+ for real matches), so this stays rigid.
    const CONTENT_THRESHOLD = 10;
    const strong = hits.filter((h) => h.score >= CONTENT_THRESHOLD);
    if (strong.length > 0) {
      // Prefer a concrete project/post/job answer over a generic timeline hit.
      const best =
        strong.find((h) => h.type === 'project' || h.type === 'post' || h.type === 'job') ??
        strong[0]!;
      return contentAnswer(best);
    }
  } catch {
    // Index failure should never dead-end the user; fall through to fallback.
  }

  return fallbackResponse();
}
