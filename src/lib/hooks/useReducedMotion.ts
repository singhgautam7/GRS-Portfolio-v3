'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks the OS `prefers-reduced-motion` query. Motion is governed solely by
 * this query (there is no in-app motion toggle), per the handoff.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
