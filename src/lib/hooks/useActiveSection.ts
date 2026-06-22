'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SECTION_IDS } from '@/lib/navigation';

/**
 * Tracks the active landing section via IntersectionObserver and keeps the URL
 * hash in sync (history.replaceState) as sections cross the mid-viewport band.
 * Only active on the home route.
 *
 * The hash update and setState happen in the observer callback body (an async
 * event), NOT inside a state-updater function. Calling history.replaceState
 * inside an updater can run during render, and Next patches replaceState to
 * update the Router, which would update Router-during-render.
 */
export function useActiveSection(): string {
  const pathname = usePathname();
  const [active, setActive] = useState('home');
  const activeRef = useRef('home');

  useEffect(() => {
    if (pathname !== '/') return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const id = e.target.id;
            if (id !== activeRef.current) {
              activeRef.current = id;
              setActive(id);
              try {
                history.replaceState(null, '', id === 'home' ? '/' : `#${id}`);
              } catch {
                /* ignore */
              }
            }
          }
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );

    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [pathname]);

  return pathname === '/' ? active : 'home';
}
