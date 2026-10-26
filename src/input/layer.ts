import { timing } from '@/lib/tokens';
import type { OS } from '@/lib/platform';
import { armsChord, createSequences, isControlTarget, isModifierCode, isTypingTarget, matchShortcut, modCodes, modDown } from './match';
import type { KeyLike } from './match';
import { SHORTCUTS } from './registry';
import type { ShortcutId } from './registry';

/**
 * The global keyboard input layer. The only module that listens to keydown/keyup. State lives in
 * a tiny vanilla store read with getState/subscribe (no React render per keypress); discrete
 * events go to `on` listeners (3D board, audio, overlays). Idle autoplay and pointer presses
 * enter through `synthetic`, flagged 'ghost' / 'pointer'.
 */

export type Source = 'real' | 'ghost' | 'pointer';

export interface InputState {
  /** Pressed physical keys (event.code) → who pressed them. */
  pressed: Record<string, Source>;
  modHeld: boolean;
  /** performance.now() deadline of the armed G chord, 0 when idle. */
  chordUntil: number;
  lastReal: number;
  realSeen: boolean;
  /** Set by overlays that own typing (palette, sheet, ask): shortcuts pause. */
  blocked: boolean;
  /** Pointer is over the 3D board. */
  pointerOverKeyboard: boolean;
  /** Most of the hero keyboard is on screen: Space/arrows press keys instead of scrolling, and
   * Firefox quick-find keys are claimed. */
  keyboardVisible: boolean;
  /** Easter-egg sequences (Arcade only). */
  sequences: boolean;
}

export type InputEvent =
  | { type: 'down'; code: string; key: string; source: Source; repeat: boolean }
  | { type: 'up'; code: string; source: Source }
  | { type: 'mod'; held: boolean; source: Source }
  | { type: 'chord'; armed: boolean }
  | { type: 'shortcut'; id: ShortcutId; source: Source }
  | { type: 'egg'; egg: 'konami' | 'highscore' }
  | { type: 'real' };

type Handler = (source: Source) => void;

export interface InputLayer {
  getState(): InputState;
  subscribe(fn: (s: InputState) => void): () => void;
  on(fn: (e: InputEvent) => void): () => void;
  set(patch: Partial<InputState>): void;
  /** UI registers what a shortcut does; the layer only decides that it fired. */
  handle(id: ShortcutId, fn: Handler): () => void;
  synthetic(code: string, key: string, down: boolean, source: Exclude<Source, 'real'>): void;
  fire(id: ShortcutId, source?: Source): void;
  attach(target: EventTarget, doc?: { visibilityState: string; addEventListener: EventTarget['addEventListener']; removeEventListener: EventTarget['removeEventListener'] }): () => void;
  releaseAll(): void;
}

const MAC_SAFETY_RELEASE_MS = 260;
/** Typing on right after G+letter means a word, not a shortcut (design prototype). */
const CHORD_COMMIT_MS = 280;

export function createInputLayer(opts: { os: OS; now?: () => number }): InputLayer {
  const os = opts.os;
  const now = opts.now ?? (() => performance.now());
  let state: InputState = {
    pressed: {},
    modHeld: false,
    chordUntil: 0,
    lastReal: 0,
    realSeen: false,
    blocked: false,
    pointerOverKeyboard: false,
    keyboardVisible: false,
    sequences: false,
  };
  const subs = new Set<(s: InputState) => void>();
  const evs = new Set<(e: InputEvent) => void>();
  const handlers = new Map<ShortcutId, Set<Handler>>();
  const sequences = createSequences();
  const safety = new Map<string, ReturnType<typeof setTimeout>>();
  let pendingNav: ReturnType<typeof setTimeout> | null = null;

  const set = (patch: Partial<InputState>) => {
    state = { ...state, ...patch };
    subs.forEach((f) => f(state));
  };
  const emit = (e: InputEvent) => evs.forEach((f) => f(e));
  const fire = (id: ShortcutId, source: Source = 'real') => {
    emit({ type: 'shortcut', id, source });
    handlers.get(id)?.forEach((h) => h(source));
  };
  const chordArmed = () => state.chordUntil > now();
  const disarm = () => {
    if (state.chordUntil) {
      set({ chordUntil: 0 });
      emit({ type: 'chord', armed: false });
    }
  };

  const press = (code: string, key: string, source: Source, repeat: boolean) => {
    if (!repeat) set({ pressed: { ...state.pressed, [code]: source } });
    emit({ type: 'down', code, key, source, repeat });
  };
  const release = (code: string) => {
    const t = safety.get(code);
    if (t) clearTimeout(t);
    safety.delete(code);
    const source = state.pressed[code];
    if (!source) return;
    const pressed = { ...state.pressed };
    delete pressed[code];
    set({ pressed });
    emit({ type: 'up', code, source });
  };
  const releaseAll = () => {
    Object.keys(state.pressed).forEach(release);
    if (state.modHeld) {
      set({ modHeld: false });
      emit({ type: 'mod', held: false, source: 'real' });
    }
  };
  const realInput = () => {
    const first = !state.realSeen;
    set({ lastReal: now(), realSeen: true });
    if (first) emit({ type: 'real' });
  };

  /** Shared by real keys and pointer presses: returns true when a bound combo fired. */
  const logic = (e: KeyLike, source: Source): boolean => {
    if (pendingNav) {
      clearTimeout(pendingNav);
      pendingNav = null;
    }
    if (isModifierCode(e.code)) return false;
    const armed = chordArmed();
    const id = matchShortcut(e, os, armed);
    if (armed && !modDown(e, os)) disarm();
    if (id?.startsWith('go:')) {
      pendingNav = setTimeout(() => {
        pendingNav = null;
        fire(id, source);
      }, CHORD_COMMIT_MS);
      return true;
    }
    if (id) {
      fire(id, source);
      return id !== 'escape';
    }
    if (armsChord(e) && !armed) {
      set({ chordUntil: now() + timing.chordTimeout });
      emit({ type: 'chord', armed: true });
    }
    return false;
  };

  const onKeyDown = (ev: Event) => {
    const e = ev as KeyboardEvent;
    if (e.isComposing || isTypingTarget(e.target) || state.blocked) return;
    realInput();
    const isMod = modCodes(os).includes(e.code);
    if (isMod && !state.modHeld) {
      set({ modHeld: true });
      emit({ type: 'mod', held: true, source: 'real' });
    }
    press(e.code, e.key, 'real', e.repeat);
    // macOS drops keyup for keys pressed while ⌘ is held: auto-release as a safety net.
    if (os === 'mac' && e.metaKey && !isMod) {
      const t = safety.get(e.code);
      if (t) clearTimeout(t);
      safety.set(e.code, setTimeout(() => release(e.code), MAC_SAFETY_RELEASE_MS));
    }
    if (e.repeat) return;
    if (state.sequences) {
      const egg = sequences(e.code, e.key);
      if (egg) emit({ type: 'egg', egg });
    }
    const bound = logic(e, 'real');
    const plain = !e.metaKey && !e.ctrlKey && !e.altKey;
    const scrollKey = e.code === 'Space' || e.key.startsWith('Arrow');
    const quickFind = plain && (e.key === '/' || e.key === "'");
    // Space/arrows on a focused control keep their native job (activate a button, move in a list).
    const boardOwnsKey = (state.pointerOverKeyboard || state.keyboardVisible) && !isControlTarget(e.target);
    if (bound || (scrollKey && plain && boardOwnsKey) || (quickFind && state.keyboardVisible)) e.preventDefault();
  };

  const onKeyUp = (ev: Event) => {
    const e = ev as KeyboardEvent;
    release(e.code);
    if (modCodes(os).includes(e.code)) {
      if (state.modHeld) {
        set({ modHeld: false });
        emit({ type: 'mod', held: false, source: 'real' });
      }
      if (os === 'mac') Object.keys(state.pressed).filter((c) => !isModifierCode(c)).forEach(release);
    }
  };

  return {
    getState: () => state,
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    on(fn) {
      evs.add(fn);
      return () => evs.delete(fn);
    },
    set,
    handle(id, fn) {
      const s = handlers.get(id) ?? new Set();
      s.add(fn);
      handlers.set(id, s);
      return () => s.delete(fn);
    },
    fire,
    releaseAll,
    synthetic(code, key, down, source) {
      const isMod = modCodes(os).includes(code);
      if (!down) {
        release(code);
        if (isMod && state.modHeld) {
          set({ modHeld: false });
          emit({ type: 'mod', held: false, source });
        }
        return;
      }
      if (source === 'pointer') realInput();
      if (isMod) {
        if (!state.modHeld) {
          set({ modHeld: true });
          emit({ type: 'mod', held: true, source });
        }
        press(code, key, source, false);
        return;
      }
      press(code, key, source, false);
      if (source === 'pointer' && !state.blocked) {
        const mac = os === 'mac';
        logic({ key, code, metaKey: mac && state.modHeld, ctrlKey: !mac && state.modHeld, altKey: false }, source);
      }
    },
    attach(target, doc) {
      const onBlur = () => releaseAll();
      const onVis = () => {
        if (doc?.visibilityState === 'hidden') releaseAll();
      };
      target.addEventListener('keydown', onKeyDown);
      target.addEventListener('keyup', onKeyUp);
      target.addEventListener('blur', onBlur);
      doc?.addEventListener('visibilitychange', onVis);
      return () => {
        target.removeEventListener('keydown', onKeyDown);
        target.removeEventListener('keyup', onKeyUp);
        target.removeEventListener('blur', onBlur);
        doc?.removeEventListener('visibilitychange', onVis);
      };
    },
  };
}

/** Shortcuts that navigate to a landing section, with their target. */
export const NAV_TARGETS = SHORTCUTS.filter((s) => s.target).map((s) => [s.id, s.target!] as const);
