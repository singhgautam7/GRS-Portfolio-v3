/**
 * The shortcut registry: the single data source for matching, the shortcuts sheet, palette
 * hints and the 3D key labels. Matching uses event.key (+ the OS modifier); `code` is the
 * physical key that lights up / carries the floating label on the 3D board.
 */

export type SectionId =
  | 'about'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'playground'
  | 'writing'
  | 'now'
  | 'contact';

export type ShortcutId =
  | 'palette'
  | 'playground'
  | 'sheet'
  | 'escape'
  | 'go:about'
  | 'go:experience'
  | 'go:projects'
  | 'go:writing'
  | 'go:contact';

export interface Shortcut {
  id: ShortcutId;
  /** Shortcuts-sheet row label. */
  label: string;
  group: 'GENERAL' | 'GO TO';
  /** Legend tokens for Keycap2D rows. 'mod' renders ⌘/Ctrl; 'then' is the chord separator. */
  keys: string[];
  /** Keys rendered in the accent (live keys). */
  accent?: string[];
  /** Physical key on the 3D board and its floating label (modifier reveal / chord). */
  code?: string;
  keyLabel?: string;
  /** Chord second key (after G). */
  chord?: string;
  target?: SectionId;
}

export const SHORTCUTS: Shortcut[] = [
  { id: 'palette', label: 'Search', group: 'GENERAL', keys: ['mod', 'K'], code: 'KeyK', keyLabel: 'Search' },
  {
    id: 'playground',
    label: 'Open the playground',
    group: 'GENERAL',
    keys: ['mod', '↵'],
    accent: ['↵'],
    code: 'Enter',
    keyLabel: 'Playground',
  },
  { id: 'sheet', label: 'This sheet', group: 'GENERAL', keys: ['?'], code: 'Slash', keyLabel: 'Shortcuts' },
  { id: 'escape', label: 'Close / exit playground', group: 'GENERAL', keys: ['esc'], accent: ['esc'] },
  { id: 'go:about', label: 'About', group: 'GO TO', keys: ['G', 'then', 'A'], code: 'KeyA', keyLabel: 'About', chord: 'a', target: 'about' },
  { id: 'go:experience', label: 'Experience', group: 'GO TO', keys: ['G', 'then', 'E'], code: 'KeyE', keyLabel: 'Experience', chord: 'e', target: 'experience' },
  { id: 'go:projects', label: 'Projects', group: 'GO TO', keys: ['G', 'then', 'P'], code: 'KeyP', keyLabel: 'Projects', chord: 'p', target: 'projects' },
  { id: 'go:writing', label: 'Writing', group: 'GO TO', keys: ['G', 'then', 'W'], code: 'KeyW', keyLabel: 'Writing', chord: 'w', target: 'writing' },
  { id: 'go:contact', label: 'Contact', group: 'GO TO', keys: ['G', 'then', 'C'], code: 'KeyC', keyLabel: 'Contact', chord: 'c', target: 'contact' },
];

export const shortcut = (id: ShortcutId) => SHORTCUTS.find((s) => s.id === id)!;

/** Keys that rise and glow while the modifier is held (design: K, ↵ and /). */
export const MOD_LIT_CODES = SHORTCUTS.filter((s) => s.group === 'GENERAL' && s.code).map((s) => s.code!);
/** Keys lit while the G chord is armed. */
export const CHORD_LIT_CODES = ['KeyG', ...SHORTCUTS.filter((s) => s.chord).map((s) => s.code!)];
/** Floating label text per physical key. */
export const KEY_LABELS: Record<string, string> = Object.fromEntries([
  ['KeyG', 'Go to…'],
  ...SHORTCUTS.filter((s) => s.code && s.keyLabel).map((s) => [s.code!, s.keyLabel!]),
]);

export const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
export const HIGHSCORE_WORD = 'gautam';
