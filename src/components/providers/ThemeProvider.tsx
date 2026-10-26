'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = 'grs-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Blocking inline script, runs before first paint:
 * - data-theme: the stored choice if any, else the OS colour scheme (two modes only).
 * - data-os: mac | windows | linux, so OS-specific legends render correctly on first paint
 *   (CSS picks the variant, see globals.css [data-os-only]). Same detection as lib/platform.ts.
 */
export const themeNoFlashScript = `(function(){var d=document.documentElement,t;try{t=localStorage.getItem('${THEME_STORAGE_KEY}')}catch(e){}if(t!=='light'&&t!=='dark')t=matchMedia('${DARK_QUERY}').matches?'dark':'light';d.setAttribute('data-theme',t);var n=navigator,p=(n.userAgentData&&n.userAgentData.platform)||n.platform||n.userAgent||'';d.setAttribute('data-os',/mac|iphone|ipad|ipod/i.test(p)?'mac':/win/i.test(p)?'windows':'linux');})();`;

function domTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function applyTheme(t: Theme, animate = false) {
  const set = () => document.documentElement.setAttribute('data-theme', t);
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  // Slow crossfade between modes (duration in globals.css) where View Transitions exist.
  if (animate && doc.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) doc.startViewTransition(set);
  else set();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Server render and first client render agree on 'light'; the real value is already on <html>.
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    setThemeState(domTheme());
    // Follow live OS changes until the visitor picks a mode themselves.
    const mq = matchMedia(DARK_QUERY);
    const onChange = (e: MediaQueryListEvent) => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(THEME_STORAGE_KEY);
      } catch {
        /* storage unavailable: keep following the OS */
      }
      if (stored === 'light' || stored === 'dark') return;
      const t: Theme = e.matches ? 'dark' : 'light';
      applyTheme(t, true);
      setThemeState(t);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t, true);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch {
      /* storage may be unavailable; the choice lasts for this page view */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(domTheme() === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
