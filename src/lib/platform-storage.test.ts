import { describe, expect, test, beforeEach } from 'bun:test';
import { detectOS, modLabel } from './platform';
import { readStore, writeStore } from './storage';

describe('detectOS', () => {
  test('prefers userAgentData, then platform, then UA', () => {
    expect(detectOS({ userAgentData: { platform: 'macOS' }, platform: 'Win32' })).toBe('mac');
    expect(detectOS({ platform: 'MacIntel' })).toBe('mac');
    expect(detectOS({ platform: 'iPhone' })).toBe('mac');
    expect(detectOS({ userAgentData: { platform: 'Windows' } })).toBe('windows');
    expect(detectOS({ platform: 'Win32' })).toBe('windows');
    expect(detectOS({ platform: 'Linux x86_64' })).toBe('linux');
    expect(detectOS({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' })).toBe('linux');
    expect(detectOS({})).toBe('linux');
  });
  test('modifier legend', () => {
    expect(modLabel('mac')).toBe('⌘');
    expect(modLabel('windows')).toBe('Ctrl');
    expect(modLabel('linux')).toBe('Ctrl');
  });
});

describe('storage', () => {
  const mem = new Map<string, string>();
  beforeEach(() => {
    mem.clear();
    Object.assign(globalThis, {
      localStorage: {
        getItem: (k: string) => mem.get(k) ?? null,
        setItem: (k: string, v: string) => void mem.set(k, v),
      },
    });
  });
  const isNum = (d: unknown): d is number => typeof d === 'number';

  test('round-trips with the schema version', () => {
    writeStore('k', 1, 42);
    expect(readStore('k', 1, isNum)).toBe(42);
  });
  test('wrong version, bad JSON, invalid data and missing key read as null', () => {
    writeStore('k', 1, 42);
    expect(readStore('k', 2, isNum)).toBeNull();
    mem.set('k', '{not json');
    expect(readStore('k', 1, isNum)).toBeNull();
    writeStore('k', 1, 'str');
    expect(readStore('k', 1, isNum)).toBeNull();
    expect(readStore('nope', 1, isNum)).toBeNull();
  });
  test('throwing or missing storage never throws', () => {
    Object.assign(globalThis, {
      localStorage: {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('blocked');
        },
      },
    });
    expect(() => writeStore('k', 1, 1)).not.toThrow();
    expect(readStore('k', 1, isNum)).toBeNull();
    Object.assign(globalThis, { localStorage: undefined });
    expect(readStore('k', 1, isNum)).toBeNull();
  });
});
