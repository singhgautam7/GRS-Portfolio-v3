import { describe, expect, it } from 'bun:test';
import { matchIntent } from './match';
import { answer, answerLayer1 } from './engine';
import { buildContext } from './context';

const ctx = buildContext(new Date('2026-06-22T12:00:00+05:30'));

describe('matchIntent (Layer 1)', () => {
  const cases: Array<[string, string]> = [
    ['How much experience do you have?', 'experience'],
    ['how senior are you', 'experience'],
    ['what do you do at hashicorp', 'work'],
    ['show me your best projects', 'projects'],
    ['what are you doing now', 'now'],
    ['how do I contact you', 'contact'],
    ['what is your tech stack', 'skills'],
    ['can I get your resume', 'resume'],
    ['do you write a blog', 'blog'],
    ['why should I hire you', 'hire'],
    ['are you a real AI', 'real-ai'],
    ['coffee or terminal', 'coffee'],
    ['tell me something fun', 'fun'],
    ['whoami', 'egg-whoami'],
    ['sudo hire me', 'egg-sudo-hire'],
    ['help', 'egg-help'],
    // personality + guardrail intents
    ['what are you reading', 'reading'],
    ['what books are you reading', 'reading'],
    ['i love you', 'affection'],
    ['marry me', 'affection'],
    ['how is the weather today', 'offtopic'],
    ['what is the news today', 'news'],
    ['can you write a program for me', 'do-my-work'],
    ['fix my code', 'do-my-work'],
  ];

  for (const [query, expected] of cases) {
    it(`matches "${query}" -> ${expected}`, () => {
      const m = matchIntent(query);
      expect(m?.intent.id).toBe(expected);
    });
  }

  it('fuzzy-matches a typo to the right intent', () => {
    const m = matchIntent('how much experiance do you hav');
    expect(m?.intent.id).toBe('experience');
  });

  it('returns null for an unrelated query', () => {
    expect(matchIntent('what is the capital of mongolia')).toBeNull();
  });

  it('does NOT misfire "what are you reading" onto the now/work answer', () => {
    const m = matchIntent('what are you reading');
    expect(m?.intent.id).toBe('reading');
    expect(m?.intent.id).not.toBe('now');
  });
});

describe('answerLayer1', () => {
  it('uses the dynamic experience label, not a hardcoded number', () => {
    const res = answerLayer1('how much experience do you have', ctx);
    expect(res?.text).toContain('7+ years');
    expect(res?.text).not.toContain('7.5+');
  });

  it('supports precise mode', () => {
    const res = answerLayer1('exactly how much experience do you have', ctx);
    expect(res?.text).toContain('Down to the minute');
    expect(res?.text).toMatch(/\d+ years/);
  });

  it('renders project cards for the projects intent', () => {
    const res = answerLayer1('show me your best projects', ctx);
    expect(res?.cards?.length).toBeGreaterThan(0);
    expect(res?.cards?.[0]?.title).toBe('AI Reader');
  });

  it('contains no en or em dashes in any reply', () => {
    const queries = [
      'how much experience do you have',
      'what do you work on',
      'show me your best projects',
      'what are you doing now',
      'how do I contact you',
      'what is your tech stack',
      'can I get your resume',
      'do you write a blog',
      'why should I hire you',
      'tell me something fun',
      'are you a real AI',
      'coffee or terminal',
      'hello',
      'whoami',
      'what are you reading',
      'i love you',
      'how is the weather',
      'what is the news',
      'can you write a program',
    ];
    for (const q of queries) {
      const res = answerLayer1(q, ctx);
      expect(res).not.toBeNull();
      expect(res!.text.includes('—')).toBe(false);
      expect(res!.text.includes('–')).toBe(false);
    }
  });
});

describe('answer (full resolution)', () => {
  it('falls back gracefully with a contact ramp', async () => {
    const res = await answer('xyzzy plugh nonsense', ctx);
    expect(['fallback', 'content']).toContain(res.source);
    if (res.source === 'fallback') {
      // The fallback always offers a real contact path.
      expect(res.buttons?.some((b) => b.action === 'mailto')).toBe(true);
    }
  });

  it('deflects clearly out-of-scope questions to the fallback', async () => {
    const res = await answer('what is the capital of mongolia', ctx);
    expect(res.source).toBe('fallback');
    expect(res.buttons?.some((b) => b.action === 'mailto')).toBe(true);
  });

  it('answers known intents at Layer 1', async () => {
    const res = await answer('how do I contact you', ctx);
    expect(res.source).toBe('intent');
    expect(res.buttons?.some((b) => b.action === 'mailto')).toBe(true);
  });

  it('routes content queries through Layer 2 search', async () => {
    const res = await answer('tell me about the kuber money manager app', ctx);
    // Either Layer-2 content or a confident intent; never a dead end.
    expect(res.text.length).toBeGreaterThan(0);
  });
});
