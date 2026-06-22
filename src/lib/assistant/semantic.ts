/**
 * Semantic "smart mode" seam — ARCHITECTED, NOT ENABLED.
 *
 * Layer 2 (Orama full-text) is structured so on-device embeddings can drop in
 * later via a web worker without touching the UI or the engine's public API.
 * The plan:
 *
 *   1. A web worker loads `@huggingface/transformers` with `all-MiniLM-L6-v2`
 *      and exposes `embed(text): Promise<number[]>`.
 *   2. The Orama schema gains an `embedding: 'vector[384]'` field; documents are
 *      embedded once at index build (off the main thread).
 *   3. `searchContent` switches to Orama hybrid (vector + full-text) search.
 *
 * Everything here is lazy and flagged, so it never blocks first paint and stays
 * fully optional. See docs/ask-me-anything.md → "Enabling smart mode".
 */

export const SEMANTIC_ENABLED = false;

export const SEMANTIC_MODEL = 'Xenova/all-MiniLM-L6-v2';
export const SEMANTIC_DIMENSIONS = 384;

export interface SemanticEmbedder {
  /** Embed a single string into a fixed-length vector. */
  embed(text: string): Promise<number[]>;
  /** Release the worker and any loaded weights. */
  dispose(): void;
}

/**
 * Factory placeholder. When smart mode is enabled, this returns an embedder
 * backed by a web worker. Until then it throws, so accidental use is loud.
 */
export function createSemanticEmbedder(): SemanticEmbedder {
  throw new Error(
    'Semantic smart mode is not enabled. Set SEMANTIC_ENABLED and implement the ' +
      'transformers web worker (see docs/ask-me-anything.md).',
  );
}
