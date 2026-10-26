'use client';

import { useSyncExternalStore } from 'react';
import { readStore, writeStore } from '@/lib/storage';
import { isVariantId } from './variants';
import type { VariantId } from './variants';

/**
 * Keyboard choice + mute. Defaults (Mechanical, muted) render on the server and first client
 * pass; stored values are applied by hydratePrefs() after hydration so the poster matches.
 */
export interface KbPrefs {
  variant: VariantId;
  muted: boolean;
}

const KEY = 'grs:kb';
const SCHEMA = 1;
export const DEFAULT_PREFS: KbPrefs = { variant: 'thk', muted: true };

const isPrefs = (d: unknown): d is KbPrefs =>
  typeof d === 'object' && d !== null && isVariantId((d as KbPrefs).variant) && typeof (d as KbPrefs).muted === 'boolean';

let prefs: KbPrefs = DEFAULT_PREFS;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const getPrefs = () => prefs;
export function subscribePrefs(fn: () => void) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}
export function setPrefs(patch: Partial<KbPrefs>) {
  prefs = { ...prefs, ...patch };
  writeStore(KEY, SCHEMA, prefs);
  emit();
}
export function hydratePrefs() {
  const stored = readStore(KEY, SCHEMA, isPrefs);
  if (stored) {
    prefs = stored;
    emit();
  }
}

export function usePrefs(): KbPrefs {
  return useSyncExternalStore(subscribePrefs, getPrefs, () => DEFAULT_PREFS);
}
