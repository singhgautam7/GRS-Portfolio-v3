import { beforeEach, describe, expect, test } from 'bun:test';

const mem = new Map<string, string>();
beforeEach(() => {
  mem.clear();
  Object.assign(globalThis, { localStorage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) } });
});

describe('keyboard prefs persistence', () => {
  test('stored choice is applied on hydrate; bad data falls back to defaults', async () => {
    const p = await import('./prefs');
    p.setPrefs({ variant: 'clk', muted: false });
    expect(JSON.parse(mem.get('grs:kb')!)).toEqual({ v: 1, data: { variant: 'clk', muted: false } });
    p.setPrefs({ variant: 'thk', muted: true });
    mem.set('grs:kb', JSON.stringify({ v: 1, data: { variant: 'pew', muted: false } }));
    p.hydratePrefs();
    expect(p.getPrefs()).toEqual({ variant: 'pew', muted: false });
    p.setPrefs(p.DEFAULT_PREFS);
    mem.set('grs:kb', JSON.stringify({ v: 1, data: { variant: 'nope', muted: 'x' } }));
    p.hydratePrefs();
    expect(p.getPrefs()).toEqual(p.DEFAULT_PREFS);
  });
});
