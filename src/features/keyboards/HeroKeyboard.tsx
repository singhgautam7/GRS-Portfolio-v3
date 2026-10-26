'use client';

import { useEffect, useRef, useState } from 'react';
import { getInput } from '@/input';
import { getOS } from '@/lib/platform';
import { usePrefs, getPrefs } from './prefs';
import { setKeyboardBridge } from './bridge';
import { isVariantId } from './variants';
import type { VariantId } from './variants';
import type { KeyboardRig } from './core/rig';
import s from '@/features/hero/hero.module.css';

/** Full 3D keyboard only on wide, hover-capable screens with WebGL (phones get the keycap cluster). */
export const DESKTOP_QUERY = '(min-width: 1024px) and (hover: hover)';

function canRun3D(): boolean {
  if (!matchMedia(DESKTOP_QUERY).matches) return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return false;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

declare global {
  interface Window {
    /** Poster generation (scripts/generate-posters.ts): the rendered still, as a data URL. */
    __kbStill?: string;
  }
}

/**
 * The hero keyboard island. A keycap loader shows where the board will sit while three.js and the
 * active variant chunk load (after the hero text paints), and again while a swapped-in variant's
 * chunk is still arriving. The static poster is only for no-WebGL / low-power devices (and no-JS).
 */
export function HeroKeyboard() {
  const { variant } = usePrefs();
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef<KeyboardRig | null>(null);
  // loading: 3D on its way (loader) · ready: canvas shown · poster: no WebGL / low power, for good.
  const [phase, setPhase] = useState<'loading' | 'ready' | 'poster'>('loading');
  const [loadingV, setLoadingV] = useState<VariantId | null>(null);

  useEffect(() => {
    const still = new URLSearchParams(location.search).get('kbStill');
    if (!canRun3D() && !still) {
      setPhase('poster');
      return;
    }
    let cancelled = false;
    const start = async () => {
      const { KeyboardRig } = await import('./core/rig');
      if (cancelled || !host.current) return;
      const r = new KeyboardRig({
        container: host.current,
        input: getInput(),
        os: getOS(),
        variant: isVariantId(still) ? still : getPrefs().variant,
        autoplay: !still,
        still: !!still,
        onLoading: setLoadingV,
      });
      rig.current = r;
      await r.start();
      if (cancelled) return;
      if (still) {
        window.__kbStill = r.canvas.toDataURL('image/webp', 0.9);
        return;
      }
      setKeyboardBridge({ keyRect: (c) => r.keyRect(c), enterPlayground: () => r.enterPlayground() });
      setPhase('ready');
    };
    const ric = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200));
    ric(() => void start());
    return () => {
      cancelled = true;
      setKeyboardBridge(null);
      rig.current?.dispose();
      rig.current = null;
    };
  }, []);

  useEffect(() => {
    rig.current?.setVariant(variant);
  }, [variant]);

  const loading = phase === 'loading' || !!loadingV;
  return (
    <div className={s.stage} data-phase={phase} data-loading={loading} aria-hidden>
      {phase === 'poster' && (
        <div className={s.posters}>
          {(['light', 'dark'] as const).map((m) => (
            // eslint-disable-next-line @next/next/no-img-element -- static export: no image optimizer
            <img key={m} src={`/posters/${variant}-${m}.webp`} alt="" data-theme-only={m} className={s.poster} decoding="async" />
          ))}
        </div>
      )}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- no-JS fallback */}
        <img src={`/posters/${variant}-light.webp`} alt="" className={s.poster} />
      </noscript>
      <div className={s.loader}>
        <span className={s.loaderKeys}>
          {['G', 'R', 'S'].map((k) => (
            <span key={k} className={s.loaderKey}>
              {k}
            </span>
          ))}
        </span>
        <span className={s.loaderText}>Loading keyboard</span>
      </div>
      <div ref={host} className={s.canvasHost} data-kb={variant} />
    </div>
  );
}
