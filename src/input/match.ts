import { SHORTCUTS, KONAMI, HIGHSCORE_WORD } from './registry';
import type { ShortcutId } from './registry';
import type { OS } from '@/lib/platform';

/** Pure matching helpers (no DOM), unit-tested in input.test.ts. */

export interface KeyLike {
  key: string;
  code: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey?: boolean;
}

/** The shortcut modifier: ⌘ on Mac, Ctrl on Windows/Linux. */
export const modDown = (e: KeyLike, os: OS) => (os === 'mac' ? e.metaKey : e.ctrlKey);
export const modCodes = (os: OS) => (os === 'mac' ? ['MetaLeft', 'MetaRight'] : ['ControlLeft', 'ControlRight']);
export const isModifierCode = (code: string) =>
  /^(Meta|Control|Alt|Shift)(Left|Right)$/.test(code) || code === 'CapsLock';

/** Should the layer ignore this event entirely (typing in a field, IME composition)? */
export function isTypingTarget(target: unknown): boolean {
  const el = target as { tagName?: string; isContentEditable?: boolean } | null;
  if (!el || typeof el.tagName !== 'string') return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || !!el.isContentEditable;
}

/** A focused control where Space/arrows already mean something (button, link, list, slider…). */
export function isControlTarget(target: unknown): boolean {
  const el = target as { tagName?: string; getAttribute?: (n: string) => string | null } | null;
  if (!el || typeof el.tagName !== 'string') return false;
  if (['BUTTON', 'A', 'SUMMARY', 'DETAILS'].includes(el.tagName)) return true;
  const role = el.getAttribute?.('role') ?? '';
  return /^(button|link|option|listbox|radio|radiogroup|menuitem|menu|checkbox|switch|slider|tab|combobox)$/.test(role);
}

export function matchShortcut(e: KeyLike, os: OS, chordArmed: boolean): ShortcutId | null {
  const mod = modDown(e, os);
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (mod && key === 'k') return 'palette';
  if (mod && key === 'Enter') return 'playground';
  if ((mod && e.code === 'Slash') || e.key === '?') return 'sheet';
  if (key === 'Escape') return 'escape';
  if (mod || e.altKey || e.ctrlKey || e.metaKey) return null;
  if (chordArmed) return SHORTCUTS.find((s) => s.chord === key)?.id ?? null;
  return null;
}

/** G (no modifiers) arms the chord. */
export const armsChord = (e: KeyLike) =>
  e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey;

/** Rolling-buffer sequence matcher; never blocks normal input. */
export function createSequences() {
  let codes: string[] = [];
  let word = '';
  return (code: string, key: string): 'konami' | 'highscore' | null => {
    codes = [...codes, code].slice(-KONAMI.length);
    if (key.length === 1 && /[a-z]/i.test(key)) word = (word + key.toLowerCase()).slice(-HIGHSCORE_WORD.length);
    if (codes.length === KONAMI.length && codes.every((c, i) => c === KONAMI[i])) {
      codes = [];
      return 'konami';
    }
    if (word === HIGHSCORE_WORD) {
      word = '';
      return 'highscore';
    }
    return null;
  };
}
