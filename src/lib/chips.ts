/**
 * Rotating suggestion chips.
 *
 * The pool is categorized into buckets. On each page load we pick one random
 * chip per bucket (always including the playful one), shuffle the order, and
 * share the resulting set across the hero and the chat surface for the session.
 *
 * To edit the chips, change the arrays below. No other code changes are needed.
 */

export type ChipBucket =
  | 'experience'
  | 'work'
  | 'projects'
  | 'now'
  | 'contact'
  | 'playful';

export const CHIP_POOL: Record<ChipBucket, string[]> = {
  experience: [
    'How much experience do you have?',
    'How senior are you?',
    'Walk me through your career',
  ],
  work: [
    'What do you work on?',
    'What is your tech stack?',
    'What do you do at HashiCorp?',
  ],
  projects: [
    'Show me your best projects',
    'What have you built?',
    'Show me something local-first',
  ],
  now: ['What are you doing now?', 'What are you learning?', 'What are you reading?'],
  contact: ['How do I contact you?', 'Are you open to work?', 'How do I reach you?'],
  playful: [
    'Why should I hire you?',
    'Tell me something fun',
    'Are you a real AI?',
    'Coffee or terminal?',
  ],
};

const BUCKET_ORDER: ChipBucket[] = [
  'experience',
  'work',
  'projects',
  'now',
  'contact',
  'playful',
];

const pick = <T>(arr: T[], rand: () => number): T => arr[Math.floor(rand() * arr.length)]!;

/**
 * Build the per-load chip set: one random chip per bucket, then Fisher-Yates
 * shuffled. `rand` is injectable so tests are deterministic.
 */
export function buildChips(rand: () => number = Math.random): string[] {
  const out = BUCKET_ORDER.map((bucket) => pick(CHIP_POOL[bucket], rand));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
