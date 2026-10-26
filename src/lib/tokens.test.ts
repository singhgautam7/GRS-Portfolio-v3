import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dur, ease, spring, timing } from './tokens';

const css = readFileSync(join(import.meta.dir, '../styles/tokens.css'), 'utf8');
const cssVar = (name: string) => {
  const m = new RegExp(`${name}:\\s*([^;]+);`).exec(css);
  if (!m?.[1]) throw new Error(`${name} missing from tokens.css`);
  return m[1].trim();
};
const ms = (name: string) => parseFloat(cssVar(name));
const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

describe('tokens.ts mirrors tokens.css', () => {
  test('durations', () => {
    for (const [k, v] of Object.entries(dur)) expect(ms(`--dur-${k}`)).toBe(v);
  });
  test('easings', () => {
    for (const [k, v] of Object.entries(ease)) {
      const pts = /cubic-bezier\(([^)]+)\)/.exec(cssVar(`--ease-${kebab(k)}`))?.[1];
      expect(pts?.split(',').map(Number)).toEqual([...v]);
    }
  });
  test('springs', () => {
    for (const [k, v] of Object.entries(spring)) {
      expect(ms(`--spring-${k}-k`)).toBe(v.k);
      expect(ms(`--spring-${k}-c`)).toBe(v.c);
    }
  });
  test('timings', () => {
    for (const [k, v] of Object.entries(timing)) expect(ms(`--${kebab(k)}`)).toBe(v);
  });
});
