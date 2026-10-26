'use client';

import { useSyncExternalStore } from 'react';

export type OS = 'mac' | 'windows' | 'linux';

interface NavigatorLike {
  userAgentData?: { platform?: string };
  platform?: string;
  userAgent?: string;
}

/** Same rules as the inline script in ThemeProvider (which sets html[data-os] before paint). */
export function detectOS(nav: NavigatorLike): OS {
  const p = nav.userAgentData?.platform || nav.platform || nav.userAgent || '';
  if (/mac|iphone|ipad|ipod/i.test(p)) return 'mac';
  if (/win/i.test(p)) return 'windows';
  return 'linux';
}

/** Shortcut modifier legend: ⌘ on Mac, Ctrl elsewhere (design 5b). */
export const modLabel = (os: OS) => (os === 'mac' ? '⌘' : 'Ctrl');

export function getOS(): OS {
  if (typeof document === 'undefined') return 'linux';
  const attr = document.documentElement.getAttribute('data-os');
  return attr === 'mac' || attr === 'windows' || attr === 'linux' ? attr : detectOS(navigator);
}

/** Touch-only device: no hover and a coarse pointer (phones, most tablets). */
export function isTouchOnly(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(hover: none) and (pointer: coarse)').matches;
}

const noop = () => () => {};

/**
 * OS for JS logic (shortcut matching, 3D legends). Server and hydration render use the neutral
 * default; visible legends should use <ModKey> instead, which is correct on first paint via CSS.
 */
export function useOS(): OS {
  return useSyncExternalStore(noop, getOS, () => 'linux');
}
