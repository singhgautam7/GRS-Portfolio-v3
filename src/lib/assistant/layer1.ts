import { matchIntent } from './match';
import { buildContext } from './context';
import { resolveParametric } from './parametric';
import type { AssistantContext, AssistantResponse } from './types';

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
