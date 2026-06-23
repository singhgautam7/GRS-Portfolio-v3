'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChromeContext } from './ChromeContext';
import { Navbar } from './Navbar';
import { ScrollProgress } from './ScrollProgress';
import { SectionPill } from './SectionPill';
import { CommandPalette } from './CommandPalette';
import { ShortcutsOverlay } from './ShortcutsOverlay';
import { Footer } from '@/components/sections/Footer';

/**
 * Global UI shell present on every route: navbar, command palette, shortcuts
 * overlay, scroll-progress bar and active-section pill, plus the global key
 * handlers (⌘K palette, ? shortcuts, Esc close).
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), []);

  // The /askme page is a full-screen chat surface; it hides the global pill/progress.
  // Normalize the trailing slash added by `trailingSlash: true`.
  const isChat = pathname.replace(/\/+$/, '') === '/askme';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShortcutsOpen(false);
        setPaletteOpen((o) => !o);
        return;
      }
      const tag = (e.target as HTMLElement | null)?.tagName ?? '';
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.key === '?' && !typing) {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
        return;
      }
      if (e.key === 'Escape') {
        if (shortcutsOpen) setShortcutsOpen(false);
        else if (paletteOpen) setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, shortcutsOpen]);

  return (
    <ChromeContext.Provider
      value={{ paletteOpen, openPalette, closePalette, shortcutsOpen, openShortcuts, closeShortcuts }}
    >
      <div
        style={{
          position: 'relative',
          minHeight: '100vh',
          background: 'var(--bg)',
          color: 'var(--ink)',
        }}
      >
        <Navbar />
        {!isChat && <ScrollProgress />}
        {children}
        {!isChat && <Footer />}
        {!isChat && <SectionPill />}
        <CommandPalette />
        <ShortcutsOverlay />
      </div>
    </ChromeContext.Provider>
  );
}
