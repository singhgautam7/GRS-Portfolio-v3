import { describe, expect, test } from 'bun:test';
import { createInputLayer } from './layer';
import type { InputEvent } from './layer';
import { createSequences, isTypingTarget, matchShortcut } from './match';
import type { OS } from '@/lib/platform';

const k = (key: string, code: string, m: Partial<{ metaKey: boolean; ctrlKey: boolean; altKey: boolean }> = {}) => ({
  key,
  code,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  ...m,
});

describe('matchShortcut per OS', () => {
  test('⌘K on mac, Ctrl+K elsewhere', () => {
    expect(matchShortcut(k('k', 'KeyK', { metaKey: true }), 'mac', false)).toBe('palette');
    expect(matchShortcut(k('k', 'KeyK', { ctrlKey: true }), 'mac', false)).toBeNull();
    expect(matchShortcut(k('k', 'KeyK', { ctrlKey: true }), 'windows', false)).toBe('palette');
    expect(matchShortcut(k('K', 'KeyK', { ctrlKey: true }), 'linux', false)).toBe('palette');
    expect(matchShortcut(k('k', 'KeyK', { metaKey: true }), 'windows', false)).toBeNull();
  });
  test('mod+Enter, ? on any layout, Esc', () => {
    expect(matchShortcut(k('Enter', 'Enter', { metaKey: true }), 'mac', false)).toBe('playground');
    expect(matchShortcut(k('?', 'Minus'), 'linux', false)).toBe('sheet'); // e.g. AZERTY
    expect(matchShortcut(k('/', 'Slash', { ctrlKey: true }), 'windows', false)).toBe('sheet');
    expect(matchShortcut(k('Escape', 'Escape'), 'mac', false)).toBe('escape');
  });
  test('chords only when armed and unmodified', () => {
    expect(matchShortcut(k('a', 'KeyA'), 'mac', false)).toBeNull();
    expect(matchShortcut(k('a', 'KeyA'), 'mac', true)).toBe('go:about');
    expect(matchShortcut(k('c', 'KeyC', { altKey: true }), 'mac', true)).toBeNull();
    expect(matchShortcut(k('x', 'KeyX'), 'mac', true)).toBeNull();
  });
});

describe('isTypingTarget', () => {
  test('fields and contenteditable', () => {
    expect(isTypingTarget({ tagName: 'INPUT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isTypingTarget({ tagName: 'SELECT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'BUTTON' })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe('sequences', () => {
  test('konami and gautam on rolling buffers', () => {
    const seq = createSequences();
    const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    seq('KeyX', 'x');
    const out = konami.map((c) => seq(c, c.startsWith('Key') ? c.slice(3).toLowerCase() : c));
    expect(out.at(-1)).toBe('konami');
    const seq2 = createSequences();
    const typed = 'xxgautam'.split('').map((ch) => seq2('Key' + ch.toUpperCase(), ch));
    expect(typed.at(-1)).toBe('highscore');
  });
});

/** Fake window: dispatches plain Events carrying KeyboardEvent fields. */
function rig(os: OS) {
  let t = 1000;
  const layer = createInputLayer({ os, now: () => t });
  const win = new EventTarget();
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  layer.attach(win, doc);
  const events: InputEvent[] = [];
  layer.on((e) => events.push(e));
  const fired: string[] = [];
  for (const id of ['palette', 'playground', 'sheet', 'escape', 'go:about'] as const) layer.handle(id, () => fired.push(id));
  const send = (type: 'keydown' | 'keyup', key: string, code: string, extra: Record<string, unknown> = {}) => {
    const { target = null, ...rest } = extra;
    const ev = Object.assign(new Event(type, { cancelable: true }), { key, code, metaKey: false, ctrlKey: false, altKey: false, repeat: false, isComposing: false, ...rest });
    Object.defineProperty(ev, 'target', { value: target });
    win.dispatchEvent(ev);
    return ev;
  };
  return { layer, win, doc, events, fired, send, advance: (ms: number) => (t += ms) };
}

describe('input layer', () => {
  test('fires palette and prevents default only for bound combos', () => {
    const r = rig('mac');
    const ev = r.send('keydown', 'k', 'KeyK', { metaKey: true });
    expect(r.fired).toEqual(['palette']);
    expect(ev.defaultPrevented).toBe(true);
    const tab = r.send('keydown', 'Tab', 'Tab');
    expect(tab.defaultPrevented).toBe(false);
  });

  test('ignores input in fields and during IME composition', () => {
    const r = rig('windows');
    r.send('keydown', 'k', 'KeyK', { ctrlKey: true, target: { tagName: 'INPUT' } });
    r.send('keydown', 'k', 'KeyK', { ctrlKey: true, isComposing: true });
    expect(r.fired).toEqual([]);
    expect(r.layer.getState().pressed).toEqual({});
  });

  test('chord: G then A navigates after the commit delay; times out', async () => {
    const r = rig('linux');
    r.send('keydown', 'g', 'KeyG');
    expect(r.layer.getState().chordUntil).toBeGreaterThan(0);
    r.send('keydown', 'a', 'KeyA');
    await new Promise((res) => setTimeout(res, 320));
    expect(r.fired).toEqual(['go:about']);

    r.send('keydown', 'g', 'KeyG');
    r.advance(1600); // past --chord-timeout
    r.send('keydown', 'a', 'KeyA');
    await new Promise((res) => setTimeout(res, 320));
    expect(r.fired).toEqual(['go:about']);
  });

  test('chord does not arm while a modifier is held', () => {
    const r = rig('mac');
    r.send('keydown', 'g', 'KeyG', { metaKey: true });
    expect(r.layer.getState().chordUntil).toBe(0);
  });

  test('macOS: releasing ⌘ releases keys whose keyup never came', () => {
    const r = rig('mac');
    r.send('keydown', 'Meta', 'MetaLeft', { metaKey: true });
    r.send('keydown', 'j', 'KeyJ', { metaKey: true });
    expect(Object.keys(r.layer.getState().pressed).sort()).toEqual(['KeyJ', 'MetaLeft']);
    r.send('keyup', 'Meta', 'MetaLeft');
    expect(r.layer.getState().pressed).toEqual({});
    expect(r.layer.getState().modHeld).toBe(false);
  });

  test('blur and hidden tab release everything', () => {
    const r = rig('windows');
    r.send('keydown', 'Control', 'ControlLeft', { ctrlKey: true });
    r.send('keydown', 'a', 'KeyA', { ctrlKey: true });
    r.win.dispatchEvent(new Event('blur'));
    expect(r.layer.getState().pressed).toEqual({});
    expect(r.layer.getState().modHeld).toBe(false);
    r.send('keydown', 'a', 'KeyA');
    r.doc.visibilityState = 'hidden';
    r.doc.dispatchEvent(new Event('visibilitychange'));
    expect(r.layer.getState().pressed).toEqual({});
  });

  test('repeat is a re-pulse, not a new press or shortcut', () => {
    const r = rig('windows');
    r.send('keydown', 'k', 'KeyK', { ctrlKey: true });
    r.send('keydown', 'k', 'KeyK', { ctrlKey: true, repeat: true });
    expect(r.fired).toEqual(['palette']);
    expect(r.events.filter((e) => e.type === 'down' && e.repeat)).toHaveLength(1);
  });

  test('space/arrows press the board instead of scrolling while it is in view (from the first key)', () => {
    const r = rig('mac');
    expect(r.send('keydown', ' ', 'Space').defaultPrevented).toBe(false); // scrolled away: native scroll
    r.layer.set({ keyboardVisible: true }); // no pointer movement needed
    expect(r.send('keydown', ' ', 'Space').defaultPrevented).toBe(true);
    expect(r.send('keydown', 'ArrowDown', 'ArrowDown').defaultPrevented).toBe(true);
    r.layer.set({ keyboardVisible: false, pointerOverKeyboard: true });
    expect(r.send('keydown', ' ', 'Space').defaultPrevented).toBe(true);
  });

  test('space on a focused button or listbox keeps its native behaviour', () => {
    const r = rig('mac');
    r.layer.set({ keyboardVisible: true });
    expect(r.send('keydown', ' ', 'Space', { target: { tagName: 'BUTTON' } }).defaultPrevented).toBe(false);
    expect(r.send('keydown', 'ArrowDown', 'ArrowDown', { target: { tagName: 'DIV', getAttribute: () => 'listbox' } }).defaultPrevented).toBe(false);
    expect(r.send('keydown', ' ', 'Space', { target: { tagName: 'BODY', getAttribute: () => null } }).defaultPrevented).toBe(true);
  });

  test('sequences only when enabled (Arcade)', () => {
    const r = rig('mac');
    const type = (w: string) => w.split('').forEach((c) => r.send('keydown', c, 'Key' + c.toUpperCase()));
    type('gautam');
    expect(r.events.some((e) => e.type === 'egg')).toBe(false);
    r.layer.set({ sequences: true });
    type('gautam');
    expect(r.events.some((e) => e.type === 'egg' && e.egg === 'highscore')).toBe(true);
  });

  test('ghost input never fires shortcuts or counts as real', () => {
    const r = rig('mac');
    r.layer.synthetic('MetaLeft', 'Meta', true, 'ghost');
    r.layer.synthetic('KeyK', 'k', true, 'ghost');
    expect(r.fired).toEqual([]);
    expect(r.layer.getState().realSeen).toBe(false);
    r.layer.synthetic('KeyK', 'k', false, 'ghost');
    r.layer.synthetic('KeyK', 'k', true, 'pointer');
    expect(r.fired).toEqual(['palette']);
    expect(r.layer.getState().realSeen).toBe(true);
  });
});
