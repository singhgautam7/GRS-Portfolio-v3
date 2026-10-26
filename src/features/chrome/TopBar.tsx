'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Download, Moon, Search, Sun } from 'lucide-react';
import { useChrome } from '@/components/chrome/ChromeContext';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Keycap2D, ModKey } from '@/components/ui/Keycap2D';
import { Button } from '@/components/ui/Button';
import { prefersReducedMotion } from '@/lib/reduced-motion';
import { ease } from '@/lib/tokens';
import { SITE } from '@/lib/site';
import s from './chrome.module.css';

/** Site top bar (design 2a). Overlays the hero on the landing; a plain bar elsewhere. */
export function TopBar({ overlay }: { overlay: boolean }) {
  const { openPalette } = useChrome();
  const { theme, setTheme, toggleTheme } = useTheme();
  const thumb = useRef<HTMLSpanElement>(null);
  const dark = theme === 'dark';

  const pick = (t: 'light' | 'dark') => {
    if (t === theme) return;
    // Thumb squash on the way across (design: 460ms, spring easing).
    const from = t === 'dark' ? 0 : 32, to = 32 - from;
    if (thumb.current && !prefersReducedMotion())
      thumb.current.animate(
        [{ transform: `translateX(${from}px) scaleX(1)` }, { transform: `translateX(${(from + to) / 2}px) scaleX(1.32)`, offset: 0.42 }, { transform: `translateX(${to}px) scaleX(1)` }],
        { duration: 460, easing: `cubic-bezier(${ease.spring.join(',')})` },
      );
    setTheme(t);
  };

  return (
    <header className={s.bar} data-overlay={overlay}>
      <Link href="/" className={s.brand} aria-label={`${SITE.name}, home`}>
        <span className={s.mark}>GRS</span>
        <span className={s.wordmark}>
          <span className={s.full}>{SITE.name}</span>
          <span className={s.short}>{SITE.name.split(' ')[0]}</span>
        </span>
      </Link>
      <div className={s.actions}>
        <button type="button" className={s.search} onClick={(e) => openPalette(e.currentTarget.getBoundingClientRect())}>
          <span>Search</span>
          <span className={s.keys} aria-hidden>
            <Keycap2D>
              <ModKey />
            </Keycap2D>
            <Keycap2D>K</Keycap2D>
          </span>
        </button>
        <div role="radiogroup" aria-label="Colour mode" className={s.mode} data-dark={dark}>
          <span ref={thumb} className={s.thumb} aria-hidden />
          <button type="button" role="radio" aria-checked={!dark} aria-label="Light mode" title="Light" data-kind="sun" className={s.modeBtn} onClick={() => pick('light')}>
            <span className={s.modeIcon}>
              <Sun size={16} strokeWidth={2} />
            </span>
          </button>
          <button type="button" role="radio" aria-checked={dark} aria-label="Dark mode" title="Dark" data-kind="moon" className={s.modeBtn} onClick={() => pick('dark')}>
            <span className={s.modeIcon}>
              <Moon size={15} strokeWidth={2} />
            </span>
          </button>
        </div>
        <Button href={SITE.resumeUrl} variant="outline" shape="pill" className={s.resume} title="Download resume">
          <Download size={15} />
          Resume
        </Button>
        <button type="button" className={s.iconBtn} aria-label="Search" onClick={(e) => openPalette(e.currentTarget.getBoundingClientRect())}>
          <Search size={18} />
        </button>
        <button type="button" className={s.iconBtn} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme}>
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
