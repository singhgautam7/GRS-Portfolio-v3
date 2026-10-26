import { describe, expect, test } from 'bun:test';
import { askEntries, matchAsk } from './answers';

const ctx = { appsShipped: 12, email: 'me@example.com' };

describe('Ask matcher', () => {
  test('chip questions match themselves', () => {
    for (const e of askEntries(ctx)) expect(matchAsk(e.q, ctx)?.id).toBe(e.id);
  });
  test('free-text keywords hit the data file first', () => {
    expect(matchAsk('which android apps did you make', ctx)?.id).toBe('apps');
    expect(matchAsk('your linkedin?', ctx)?.act).toEqual({ email: true });
    expect(matchAsk('what is your stack', ctx)?.act).toEqual({ nav: 'skills' });
  });
  test('falls through to the existing intent matcher', () => {
    const r = matchAsk('whoami', ctx);
    expect(r?.a).toContain('senior software engineer');
    expect(r?.act).toEqual({ nav: 'experience' });
  });
  test('unknown questions return null, empty input too', () => {
    expect(matchAsk('qwzx plorb', ctx)).toBeNull();
    expect(matchAsk('   ', ctx)).toBeNull();
  });
  test('answers use computed numbers and contain no assistant wording', () => {
    expect(matchAsk('Show me your apps', ctx)?.a).toContain('12 shipped');
    for (const e of askEntries(ctx)) expect(e.a).not.toMatch(/assistant|on-device|\bAI\b/);
  });
});
