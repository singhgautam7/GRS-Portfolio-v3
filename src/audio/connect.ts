import type { InputEvent, InputLayer } from '@/input/layer';
import { getOS } from '@/lib/platform';
import { layoutFor } from '@/features/keyboards/core/layouts';
import { variantMeta } from '@/features/keyboards/variants';
import type { VariantId } from '@/features/keyboards/variants';
import type { KbPrefs } from '@/features/keyboards/prefs';
import { timing } from '@/lib/tokens';
import { AudioEngine } from './engine';
import type { KeyInfo } from './sets';

/**
 * Wires the audio engine to the input layer and the keyboard prefs. Rendering never calls audio:
 * sounds come only from input events. Ghost input is always silent.
 */
export function connectAudio(
  input: InputLayer,
  prefs: { get: () => KbPrefs; subscribe: (fn: () => void) => () => void },
  engine = new AudioEngine(() => {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    return C ? new C() : null;
  }),
  doc: Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'> = document,
) {
  const keyInfo = new Map<string, KeyInfo>();
  let infoFor: VariantId | null = null;
  const info = (v: VariantId, code: string): KeyInfo => {
    if (infoFor !== v) {
      keyInfo.clear();
      layoutFor(variantMeta(v).layout, getOS()).forEach((k) => k.code && keyInfo.set(k.code, { w: k.w, row: k.row }));
      infoFor = v;
    }
    return keyInfo.get(code) ?? { w: 1, row: 2 };
  };

  let variant = prefs.get().variant;
  engine.muted = prefs.get().muted;

  const onInput = (e: InputEvent) => {
    if (engine.muted) return;
    if ('source' in e && e.source === 'ghost') return;
    if (e.type !== 'chord' && e.type !== 'real') engine.unlock(); // inside the gesture's event dispatch
    switch (e.type) {
      case 'down':
        if (e.repeat) return;
        engine.play(variant, e.code === 'Space' ? 'space' : e.code === 'Enter' ? 'enter' : 'down', info(variant, e.code));
        if (variant === '8bt' && e.code.startsWith('Arrow')) engine.play(variant, 'joy');
        return;
      case 'up':
        return engine.play(variant, 'up', info(variant, e.code));
      case 'mod':
        if (e.held) engine.play(variant, 'mod');
        return;
      case 'shortcut':
        if (e.id !== 'escape') engine.play(variant, 'fire');
        return;
      case 'egg':
        return engine.play(variant, e.egg === 'konami' ? 'oneup' : 'hiscore');
    }
  };

  let swapT: ReturnType<typeof setTimeout> | null = null;
  const onPrefs = () => {
    const p = prefs.get();
    const wasMuted = engine.muted;
    engine.muted = p.muted;
    if (wasMuted && !p.muted) {
      // The unmute click is a user gesture: create the context and preview the keyboard.
      engine.unlock();
      engine.play(p.variant, 'down', info(p.variant, 'KeyJ'));
    }
    if (p.variant !== variant) {
      variant = p.variant;
      if (swapT) clearTimeout(swapT);
      // The swap sound plays when the incoming board starts to rise (after --swap-out).
      swapT = setTimeout(() => engine.play(variant, 'swap'), timing.swapOut);
    }
  };
  const onVis = () => (doc.visibilityState === 'hidden' ? engine.suspend() : engine.resume());

  const offInput = input.on(onInput);
  const offPrefs = prefs.subscribe(onPrefs);
  doc.addEventListener('visibilitychange', onVis);
  return {
    engine,
    disconnect() {
      offInput();
      offPrefs();
      doc.removeEventListener('visibilitychange', onVis);
    },
  };
}
