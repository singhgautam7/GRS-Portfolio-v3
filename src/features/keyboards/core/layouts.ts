import type { OS } from '@/lib/platform';

/**
 * Keyboard layouts as pure data (ported from the design rig, keyboard3d.js). Positions are in
 * key units (u). Used by the 3D rig, the audio engine (key width / row) and the contract test.
 */

export interface LayoutKey {
  code: string | null;
  kind: 'alpha' | 'mod' | 'accent';
  w: number;
  label?: string;
  main?: string;
  top?: string;
  sym?: string;
  arrow?: string;
  fkey?: boolean;
  gap?: number;
  row: number;
  cx: number;
  cz: number;
}

type Proto = Omit<LayoutKey, 'row' | 'cx' | 'cz'>;

export const ROW_Z = [-2.625, -1.375, -0.375, 0.625, 1.625, 2.625];
export const ROW_PROFILE: [number, number][] = [[0.5, 0.16], [0.5, 0.12], [0.47, 0.05], [0.45, 0], [0.47, -0.08], [0.47, -0.11]];
const CROW_Z = [-2.2, -1.1, 0, 1.1, 2.2];

const SHIFT: Record<string, [string, string]> = {
  Backquote: ['~', '`'], Digit1: ['!', '1'], Digit2: ['@', '2'], Digit3: ['#', '3'], Digit4: ['$', '4'], Digit5: ['%', '5'],
  Digit6: ['^', '6'], Digit7: ['&', '7'], Digit8: ['*', '8'], Digit9: ['(', '9'], Digit0: [')', '0'], Minus: ['_', '-'],
  Equal: ['+', '='], BracketLeft: ['{', '['], BracketRight: ['}', ']'], Semicolon: [':', ';'], Quote: ['"', "'"],
  Comma: ['<', ','], Period: ['>', '.'], Slash: ['?', '/'],
};

const A = (code: string, o: Partial<Proto> = {}): Proto => ({ code, kind: 'alpha', w: 1, ...o });
const M = (code: string | null, label: string, o: Partial<Proto> = {}): Proto => ({ code, label, kind: 'mod', w: 1, ...o });
const L = (c: string) => A('Key' + c, { main: c });
const S = (c: string) => A(c, { top: SHIFT[c]![0], main: SHIFT[c]![1] });

export function layoutFull(os: OS): LayoutKey[] {
  const mac = os === 'mac';
  const r0: Proto[] = [M('Escape', 'esc', { kind: 'accent' })];
  for (let n = 1; n <= 12; n++) r0.push(M('F' + n, 'F' + n, { fkey: true, gap: n === 1 || n === 5 || n === 9 ? 0.25 : 0 }));
  r0.push(M('PrintScreen', mac ? 'F13' : 'prt sc', { gap: 0.25 }), M('Delete', 'del'));
  const r1 = ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'].map(S);
  r1.push(M('Backspace', mac ? 'delete' : 'backspace', { w: 2 }), M('Home', 'home'));
  const r2 = [M('Tab', 'tab', { w: 1.5 }), ...'QWERTYUIOP'.split('').map(L), S('BracketLeft'), S('BracketRight'), A('Backslash', { top: '|', main: '\\', w: 1.5 }), M('PageUp', 'pg up')];
  const r3 = [M('CapsLock', 'caps lock', { w: 1.75 }), ...'ASDFGHJKL'.split('').map(L), S('Semicolon'), S('Quote'), M('Enter', mac ? 'return' : 'enter', { w: 2.25, kind: 'accent', sym: '↵' }), M('PageDown', 'pg dn')];
  const r4 = [M('ShiftLeft', 'shift', { w: 2.25, sym: '⇧' }), ...'ZXCVBNM'.split('').map(L), S('Comma'), S('Period'), S('Slash'), M('ShiftRight', 'shift', { w: 1.75, sym: '⇧' }), M('ArrowUp', '', { arrow: '↑' }), M('End', 'end')];
  const arrows = [M('ArrowLeft', '', { arrow: '←' }), M('ArrowDown', '', { arrow: '↓' }), M('ArrowRight', '', { arrow: '→' })];
  const sp = A('Space', { w: 6.25, main: '' });
  const r5 = mac
    ? [M('ControlLeft', 'control', { w: 1.25, sym: '⌃' }), M('AltLeft', 'option', { w: 1.25, sym: '⌥' }), M('MetaLeft', 'command', { w: 1.25, sym: '⌘' }), sp, M('MetaRight', 'cmd', { sym: '⌘' }), M('AltRight', 'opt', { sym: '⌥' }), M(null, 'fn'), ...arrows]
    : [M('ControlLeft', 'ctrl', { w: 1.25 }), M('MetaLeft', os === 'linux' ? 'super' : 'win', { w: 1.25 }), M('AltLeft', 'alt', { w: 1.25 }), sp, M('AltRight', 'alt'), M(null, 'fn'), M('ControlRight', 'ctrl'), ...arrows];
  const out: LayoutKey[] = [];
  [r0, r1, r2, r3, r4, r5].forEach((row, ri) => {
    let x = 0;
    row.forEach((k) => {
      x += k.gap || 0;
      out.push({ ...k, row: ri, cx: x + k.w / 2 - 8, cz: ROW_Z[ri]! });
      x += k.w;
    });
  });
  return out;
}

/** Typewriter / arcade: 5 rows with every key the shortcuts need, each row centred. */
export function layoutCompact(os: OS): LayoutKey[] {
  const mac = os === 'mac', lin = os === 'linux';
  const rows: Proto[][] = [
    [M('Escape', 'esc', { kind: 'accent' }), ...['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus'].map(S), M('Backspace', mac ? 'delete' : 'bksp', { w: 1.5 })],
    [M('Tab', 'tab', { w: 1.25 }), ...'QWERTYUIOP'.split('').map(L), S('BracketLeft')],
    [M('CapsLock', 'caps', { w: 1.5 }), ...'ASDFGHJKL'.split('').map(L), S('Semicolon'), M('Enter', mac ? 'return' : 'enter', { w: 1.75, kind: 'accent', sym: '↵' })],
    [M('ShiftLeft', 'shift', { w: 1.75, sym: '⇧' }), ...'ZXCVBNM'.split('').map(L), S('Comma'), S('Period'), S('Slash'), M('ShiftRight', 'shift', { w: 1.5, sym: '⇧' })],
    mac
      ? [M('ControlLeft', 'control', { w: 1.25, sym: '⌃' }), M('AltLeft', 'option', { w: 1.25, sym: '⌥' }), M('MetaLeft', 'command', { w: 1.5, sym: '⌘' }), A('Space', { w: 6, main: '' }), M('MetaRight', 'cmd', { w: 1.25, sym: '⌘' }), M('AltRight', 'opt', { w: 1.25, sym: '⌥' })]
      : [M('ControlLeft', 'ctrl', { w: 1.25 }), M('MetaLeft', lin ? 'super' : 'win', { w: 1.25 }), M('AltLeft', 'alt', { w: 1.25 }), A('Space', { w: 6, main: '' }), M('AltRight', 'alt', { w: 1.25 }), M('ControlRight', 'ctrl', { w: 1.25 })],
  ];
  const out: LayoutKey[] = [];
  rows.forEach((row, ri) => {
    const tw = row.reduce((s, k) => s + k.w, 0);
    let x = -tw / 2;
    row.forEach((k) => {
      out.push({ ...k, row: ri, cx: x + k.w / 2, cz: CROW_Z[ri]! });
      x += k.w;
    });
  });
  return out;
}

export const layoutFor = (kind: 'full' | 'compact', os: OS) => (kind === 'full' ? layoutFull(os) : layoutCompact(os));

/** Keys every variant must carry (shortcut contract). Mod key is per OS. */
export const requiredCodes = (os: OS) => [
  os === 'mac' ? 'MetaLeft' : 'ControlLeft',
  'KeyK', 'Enter', 'Slash', 'KeyG', 'KeyA', 'KeyE', 'KeyP', 'KeyW', 'KeyC', 'Escape',
];
