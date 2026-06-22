/**
 * Ask Me Anything — engine types.
 *
 * The engine is fully client-side and built in three layers with clean seams:
 *  - Layer 1: deterministic intent registry (keyword rules + Fuse.js fuzzy).
 *  - Layer 2: content search over a shared Orama index (auto-adapts to new MDX).
 *  - Layer 3: graceful fallback that always offers a contact exit ramp.
 *
 * UI concerns (typewriter, bubbles, dialog) live in the components; this module
 * is pure data + matching and is unit-testable in isolation.
 */

export type ButtonKind = 'primary' | 'ghost';

/**
 * Button actions handled by the chat UI:
 *  - resume : open the resume document
 *  - mailto : open the user's mail client
 *  - link   : open an external URL
 *  - ask    : re-query the assistant with `value`
 *  - route  : navigate. `value` is a section/page name (e.g. "Projects") or an
 *             internal path (e.g. "/blog/ai-reader-case-study").
 */
export type ButtonAction = 'resume' | 'mailto' | 'link' | 'ask' | 'route';

export interface AssistantButton {
  label: string;
  kind: ButtonKind;
  action: ButtonAction;
  value?: string;
}

export interface AssistantCard {
  title: string;
  kind: string; // small mono tag, e.g. "Next.js"
  desc: string;
  tags: string[];
  /** External "open ↗" link, when present. */
  url?: string;
}

export type ResponseSource = 'intent' | 'content' | 'fallback';

export interface AssistantResponse {
  text: string;
  cards?: AssistantCard[];
  buttons?: AssistantButton[];
  /** Which layer produced this answer (useful for tests + analytics). */
  source: ResponseSource;
  /** The matched intent id, when source === 'intent'. */
  intentId?: string;
}

/**
 * Live, content-derived context handed to every intent handler so copy can use
 * real numbers (experience, project counts) without hardcoding.
 */
export interface AssistantContext {
  /** "now" is injectable so experience math is deterministic in tests. */
  now: Date;
  experienceLabel: string; // "7+"
  experiencePreciseSentence: string;
  projectCount: number;
  roleCount: number;
  postCount: number;
  pypiPackages: number;
  email: string;
  resumeUrl: string;
  /** Curated local-first showcase (AI Reader + PostPurush), for the projects reply. */
  showcase: AssistantCard[];
}

/** A single intent in the Layer-1 registry. */
export interface Intent {
  id: string;
  /** Natural-language example phrasings, matched fuzzily with Fuse.js. */
  examples: string[];
  /** Lowercase keyword/substring rules for instant deterministic matching. */
  keywords: string[];
  /** Produces the reply from the live context. */
  handler: (ctx: AssistantContext, query: string) => AssistantResponse;
}

export interface MatchResult {
  intent: Intent;
  /** 0..1 confidence; 1 = exact keyword hit, lower = fuzzier. */
  confidence: number;
  via: 'keyword' | 'fuzzy';
}
