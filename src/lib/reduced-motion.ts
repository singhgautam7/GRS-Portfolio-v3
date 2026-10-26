'use client';

import { useSyncExternalStore } from 'react';

/**
 * `prefers-reduced-motion` is the only motion switch (no in-app toggle). The getter is for
 * non-React code (3D loop, audio, input layer); the hook re-renders when the OS setting changes.
 */
const QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia(QUERY).matches;
}

function subscribe(cb: () => void) {
  const mq = matchMedia(QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
