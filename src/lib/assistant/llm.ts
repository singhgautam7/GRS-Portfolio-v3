import type { AssistantResponse } from './types';

/**
 * Optional LLM fallback — INTERFACE/STUB ONLY (do not implement).
 *
 * If a hosted model is ever wired in (an optional, opt-in route), it would slot
 * in behind Layer 3: when the deterministic engine has no confident answer, the
 * UI could call `LLMFallback.complete()` instead of the static fallback panel.
 *
 * Keeping this a clean interface means the static site stays fully offline and
 * zero-cost by default; the LLM is a future, opt-in seam, never bundled.
 */
export interface LLMFallback {
  /** Whether a backing endpoint is configured and available. */
  readonly available: boolean;
  /** Stream or resolve a free-form answer for a query the engine could not handle. */
  complete(query: string): Promise<AssistantResponse>;
}

/** No-op stub: never available, so the engine always uses the static fallback. */
export const llmFallback: LLMFallback = {
  available: false,
  async complete(): Promise<AssistantResponse> {
    throw new Error('LLM fallback is a stub and is not implemented.');
  },
};
