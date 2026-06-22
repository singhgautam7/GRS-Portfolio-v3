'use client';

import { useEffect } from 'react';
import { scrollToSection } from '@/lib/navigation';

/**
 * On the home route, scroll to the section named in the URL hash on load (so
 * deep links like /#now and assistant navigations land in the right place).
 */
export function HashScroll() {
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      // Wait a frame for sections to mount, then scroll.
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToSection(hash)));
    }
  }, []);
  return null;
}
