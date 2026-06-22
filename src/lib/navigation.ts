'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/** Landing section ids, in order, with their human labels (for nav + scroll-spy). */
export const SECTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Featured Projects' },
  { id: 'posts', label: 'Writing' },
  { id: 'now', label: 'Now' },
  { id: 'contact', label: 'Contact' },
] as const;

export const SECTION_IDS = SECTIONS.map((s) => s.id);

/** Assistant `route` values that map to a landing-section id. */
const SECTION_BY_NAME: Record<string, string> = {
  Home: 'home',
  About: 'about',
  Skills: 'skills',
  Experience: 'experience',
  'Featured Projects': 'projects',
  Writing: 'posts',
  Now: 'now',
  Contact: 'contact',
};

/** Assistant `route` values that map to a dedicated page path. */
const PAGE_BY_NAME: Record<string, string> = {
  Projects: '/projects',
  Timeline: '/timeline',
  Blog: '/blog',
};

const REDUCED = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Smooth-scroll to a landing section, accounting for the 58px sticky navbar. */
export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 50;
  window.scrollTo({ top: y, behavior: REDUCED() ? 'auto' : 'smooth' });
}

export function useSiteNav() {
  const router = useRouter();

  const goSection = useCallback(
    (id: string) => {
      if (window.location.pathname === '/') {
        if (id === 'home') {
          window.scrollTo({ top: 0, behavior: REDUCED() ? 'auto' : 'smooth' });
        } else {
          scrollToSection(id);
        }
        history.replaceState(null, '', id === 'home' ? '/' : `/#${id}`);
      } else {
        router.push(id === 'home' ? '/' : `/#${id}`);
      }
    },
    [router],
  );

  const goPage = useCallback((path: string) => router.push(path), [router]);

  /**
   * Resolve an assistant `route` value: a named section, a named page, or a raw
   * internal path (starting with "/").
   */
  const goRouteValue = useCallback(
    (value: string) => {
      if (value.startsWith('/')) {
        const [path, hash] = value.split('#');
        if (path === '/' && hash) {
          goSection(hash);
        } else {
          router.push(value);
        }
        return;
      }
      if (SECTION_BY_NAME[value]) {
        goSection(SECTION_BY_NAME[value]);
      } else if (PAGE_BY_NAME[value]) {
        router.push(PAGE_BY_NAME[value]);
      }
    },
    [goSection, router],
  );

  return { goSection, goPage, goRouteValue };
}
