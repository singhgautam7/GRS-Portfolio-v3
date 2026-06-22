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

type Phase = 'calm' | 'entrance' | 'pulse' | 'static';

const EASE = [0.2, 0.7, 0.2, 1];

/**
 * The hero ambient "living" field, rebuilt as DOM compositor layers. The glow
 * is a pre-rasterized blurred radial-gradient that only ever animates
 * `transform` (scale) and `opacity`, so the pulse stays smooth (no animated
 * blur/shadow, no per-frame React state). Sequence: calm while the greeting
 * types, a bounce + converge entrance on completion, then a steady centered
 * pulse (2s in / 2s out, 4s cycle). Cursor parallax, focus/typing brighten and
 * a send ripple stay reactive. Reduced motion shows a static centered glow.
 */
export const AmbientField = forwardRef<AmbientHandle>(function AmbientField(_props, ref) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
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
      setPhase(reduced ? 'static' : 'entrance');
    },
  }));

  // Cursor parallax: smoothed pointer drives a translate on the wrapper only
  // (compositor transform, no React state per frame).
  useEffect(() => {
    if (reduced) return;
    const cursor = cursorRef.current;
    const sec = rootRef.current?.parentElement;
    if (!cursor || !sec) return;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = sec.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.42) * 2;
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
    };
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      cursor.style.transform = `translate3d(${(cx * 26).toFixed(2)}px, ${(cy * 22).toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    sec.addEventListener('mousemove', onMove);
    sec.addEventListener('mouseleave', onLeave);
    loop();
    return () => {
      cancelAnimationFrame(raf);
      sec.removeEventListener('mousemove', onMove);
      sec.removeEventListener('mouseleave', onLeave);
    };
  }, [reduced]);

  const glowAnim: Record<Phase, Record<string, number | number[]>> = {
    calm: { opacity: 0.28, scale: 1, x: 0, y: 0 },
    entrance: {
      opacity: [0.2, 0.9, 0.55, 0.85, 0.62],
      scale: [0.55, 1.3, 0.92, 1.1, 1],
      x: [42, -24, 12, -4, 0],
      y: [-34, 14, -6, 2, 0],
    },
    pulse: { opacity: [0.32, 0.8, 0.32], scale: [0.9, 1.1, 0.9] },
    static: { opacity: 0.55, scale: 1, x: 0, y: 0 },
  };
  const glowTransition: Record<Phase, object> = {
    calm: { duration: 0.6, ease: EASE },
    entrance: { duration: 1.35, ease: EASE },
    // 4s cycle: 2s fade-in, 2s fade-out.
    pulse: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    static: { duration: 0 },
  };

  return (
    <div ref={rootRef} className="ambient-root" aria-hidden="true" data-active="0">
      <div ref={cursorRef} className="ambient-cursor">
        <motion.div
          className="ambient-glow"
          animate={glowAnim[phase]}
          transition={glowTransition[phase]}
          onAnimationComplete={() => {
            if (phase === 'entrance') setPhase('pulse');
          }}
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
