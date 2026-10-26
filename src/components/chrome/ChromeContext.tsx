'use client';

import { createContext, useContext } from 'react';

export interface ChromeContextValue {
  paletteOpen: boolean;
  /** Origin rect the palette emerges from (the 3D K cap or the Search button). */
  paletteOrigin: DOMRect | null;
  openPalette: (origin?: DOMRect | null) => void;
  closePalette: () => void;
  shortcutsOpen: boolean;
  openShortcuts: () => void;
  closeShortcuts: () => void;
  askOpen: boolean;
  setAskOpen: (open: boolean) => void;
  toast: (msg: string) => void;
  /** ⌘↵ / CTA: plays the keyboard transition when on the hero, then routes to /playground. */
  goPlayground: () => void;
}

export const ChromeContext = createContext<ChromeContextValue | null>(null);

export function useChrome(): ChromeContextValue {
  const ctx = useContext(ChromeContext);
  if (!ctx) throw new Error('useChrome must be used within SiteChrome');
  return ctx;
}
