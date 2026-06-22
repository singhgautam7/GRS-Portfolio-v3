'use client';

import { useEffect, useState } from 'react';
import { buildChips } from '@/lib/chips';

/**
 * Module-level cache: the chip set is built once per full page load and shared
 * across the hero and the chat surface for the session (client navigations
 * reuse it). A full reload re-executes the module, refreshing the chips.
 */
let cachedChips: string[] | null = null;

export function useSessionChips(): string[] {
  // Render empty on the server and the first client paint (matches), then fill.
  const [chips, setChips] = useState<string[]>(() => cachedChips ?? []);

  useEffect(() => {
    if (!cachedChips) cachedChips = buildChips();
    setChips(cachedChips);
  }, []);

  return chips;
}
