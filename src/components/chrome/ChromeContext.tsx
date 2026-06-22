'use client';

import { createContext, useContext } from 'react';

export interface ChromeContextValue {
  paletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  shortcutsOpen: boolean;
  openShortcuts: () => void;
  closeShortcuts: () => void;
}

export const ChromeContext = createContext<ChromeContextValue | null>(null);

export function useChrome(): ChromeContextValue {
  const ctx = useContext(ChromeContext);
  if (!ctx) throw new Error('useChrome must be used within SiteChrome');
  return ctx;
}
