'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

/** Imperative controls the hero launcher calls to react to user input. */
export interface AmbientHandle {
  setFocused: (focused: boolean) => void;
  bumpTyping: () => void;
  ripple: () => void;
  /** Play the entrance (bounce, converge to center) then settle into the pulse. */
  playEntrance: () => void;
}

type Phase = 'calm' | 'pulse' | 'static';

const EASE = [0.2, 0.7, 0.2, 1];

/**
 * The hero ambient "living" field, rebuilt as DOM compositor layers. The glow
 * is a pre-rasterized blurred radial-gradient that only ever animates
 * `transform` (scale) and `opacity`, so the pulse stays smooth (no animated
 * blur/shadow, no per-frame React state). Sequence: calm while the greeting
 * types, transitions directly to a steady centered pulse (2s in / 2s out, 4s cycle)
 * on completion. Cursor parallax, focus/typing brighten and a send ripple stay reactive.
 * Reduced motion shows a static centered glow.
 */
export const AmbientField = forwardRef<AmbientHandle>(function AmbientField(_props, ref) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<HTMLDivElement | null>(null);
  const activeTimer = useRef<number | undefined>(undefined);
  const rippleId = useRef(0);
  const [phase, setPhase] = useState<Phase>('calm');
  const [ripples, setRipples] = useState<number[]>([]);

  useEffect(() => {
    if (reduced) setPhase('static');
  }, [reduced]);

  const setActive = (on: boolean) => {
    rootRef.current?.setAttribute('data-active', on ? '1' : '0');
  };

  useImperativeHandle(ref, () => ({
    setFocused: (f) => {
      window.clearTimeout(activeTimer.current);
      setActive(f);
    },
    bumpTyping: () => {
      setActive(true);
      window.clearTimeout(activeTimer.current);
      activeTimer.current = window.setTimeout(() => setActive(false), 700);
    },
    ripple: () => {
      if (reduced) return;
      rippleId.current += 1;
      const id = rippleId.current;
      setRipples((r) => [...r, id]);
    },
    playEntrance: () => {
      setPhase(reduced ? 'static' : 'pulse');
    },
  }));

  // Cursor reaction (handoff §6.5): the smoothed pointer drives two compositor
  // transforms (no React state per frame):
  //  1) the centered glow group parallaxes gently toward the pointer, and
  //  2) a dedicated bloom tracks the pointer DIRECTLY across the hero (the
  //     prominent, clearly-visible cursor effect).
  // Normalized against the hero section's measured rect (never divides by a
  // possibly-zero innerWidth). The bloom only shows while the pointer is over
  // the hero.
  useEffect(() => {
    if (reduced) return;
    const cursor = cursorRef.current;
    const pointer = pointerRef.current;
    const sec = rootRef.current?.parentElement;
    if (!cursor || !pointer || !sec) return;

    const clamp = (v: number) => Math.max(-1.4, Math.min(1.4, v));
    // Normalized parallax target/current (-1..1) for the glow group.
    let tnx = 0;
    let tny = 0;
    let nx = 0;
    let ny = 0;
    // Pointer-bloom target/current in px, relative to the hero.
    const r0 = sec.getBoundingClientRect();
    let tmx = r0.width / 2;
    let tmy = r0.height * 0.42;
    let mx = tmx;
    let my = tmy;
    let inside = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const r = sec.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const within = x >= 0 && x <= r.width && y >= 0 && y <= r.height;
      if (within) {
        const w = r.width || 1;
        const h = r.height || 1;
        tnx = clamp((x / w - 0.5) * 2);
        tny = clamp((y / h - 0.5) * 2);
        tmx = x;
        tmy = y;
        if (!inside) {
          inside = true;
          pointer.style.opacity = '1';
        }
      } else if (inside) {
        inside = false;
        pointer.style.opacity = '0';
        tnx = 0;
        tny = 0;
      }
    };
    const onLeave = () => {
      if (!inside) return;
      inside = false;
      pointer.style.opacity = '0';
      tnx = 0;
      tny = 0;
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    const loop = () => {
      nx += (tnx - nx) * 0.09;
      ny += (tny - ny) * 0.09;
      mx += (tmx - mx) * 0.12;
      my += (tmy - my) * 0.12;
      cursor.style.transform = `translate3d(${(nx * 30).toFixed(2)}px, ${(ny * 26).toFixed(2)}px, 0)`;
      pointer.style.transform = `translate3d(${mx.toFixed(2)}px, ${my.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [reduced]);

  const glowAnim: Record<Phase, Record<string, number | number[]>> = {
    calm: { opacity: 0.28, scale: 1, x: 0, y: 0 },
    pulse: { opacity: [0.32, 0.8, 0.32], scale: [0.9, 1.1, 0.9] },
    static: { opacity: 0.55, scale: 1, x: 0, y: 0 },
  };
  const glowTransition: Record<Phase, object> = {
    calm: { duration: 0.6, ease: EASE },
    // 4s cycle: 2s fade-in, 2s fade-out.
    pulse: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    static: { duration: 0 },
  };

  return (
    <div ref={rootRef} className="ambient-root" aria-hidden="true" data-active="0">
      <div ref={pointerRef} className="ambient-pointer" />
      <div ref={cursorRef} className="ambient-cursor">
        <motion.div
          className="ambient-glow"
          animate={glowAnim[phase]}
          transition={glowTransition[phase]}
        />
        <div className="ambient-boost" />
      </div>
      <AnimatePresence>
        {ripples.map((id) => (
          <motion.div
            key={id}
            className="ambient-ripple"
            initial={{ scale: 0.3, opacity: 0.5 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
            onAnimationComplete={() => setRipples((r) => r.filter((x) => x !== id))}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});
