import { create, insertMultiple, search } from '@orama/orama';
import type { Orama } from '@orama/orama';
import { buildDocuments } from './documents';
import type { SearchDoc } from './documents';

export type { SearchDoc };
export { buildDocuments };

const schema = {
  id: 'string',
  type: 'string',
  title: 'string',
  body: 'string',
  tags: 'string[]',
  href: 'string',
  external: 'string',
} as const;

export type SearchIndex = Orama<typeof schema>;

let indexPromise: Promise<SearchIndex> | null = null;

/**
 * Lazily build the in-browser Orama index from the bundled content and memoize
 * it for the session. Vector-ready: the schema can later add an embedding field
 * fed by the semantic seam (see ./semantic placeholder in the assistant engine).
 */
export function getSearchIndex(): Promise<SearchIndex> {
  if (!indexPromise) {
    indexPromise = (async () => {
      const db = create({ schema }) as SearchIndex;
      const docs = buildDocuments().map((d) => ({ ...d, external: d.external ?? '' }));
      await insertMultiple(db, docs);
      return db;
    })();
  }
  return indexPromise;
}

export interface SearchHit extends SearchDoc {
  score: number;
}

/** Full-text search over the shared index, optionally scoped to a doc type. */
export async function searchContent(
  term: string,
  opts: { type?: SearchDoc['type']; limit?: number } = {},
): Promise<SearchHit[]> {
  const db = await getSearchIndex();
  const trimmed = term.trim();
  if (!trimmed) return [];

  const results = await search(db, {
    term: trimmed,
    properties: ['title', 'body', 'tags'],
    limit: opts.limit ?? 8,
    boost: { title: 2.5, tags: 1.5 },
    ...(opts.type ? { where: { type: opts.type } } : {}),
  });

  return results.hits.map((h) => {
    const doc = h.document as unknown as SearchDoc;
    return { ...doc, external: doc.external || undefined, score: h.score };
  });
}
