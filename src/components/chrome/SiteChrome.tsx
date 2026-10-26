'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { ChromeContext } from './ChromeContext';
import { getInput } from '@/input';
import { NAV_TARGETS } from '@/input/layer';
import { useSiteNav } from '@/lib/navigation';
import { prefersReducedMotion } from '@/lib/reduced-motion';
import { getPrefs, hydratePrefs, subscribePrefs } from '@/features/keyboards/prefs';
import { getKeyboardBridge } from '@/features/keyboards/bridge';
import { TopBar } from '@/features/chrome/TopBar';
import { Footer } from '@/features/chrome/Footer';
import { Toast } from '@/features/chrome/Toast';
import { dur } from '@/lib/tokens';

// Overlays are not needed for first paint: their code loads on demand.
const CommandPalette = dynamic(() => import('@/features/command-palette/CommandPalette'), { ssr: false });
const ShortcutsSheet = dynamic(() => import('@/features/shortcuts-sheet/ShortcutsSheet'), { ssr: false });
const AskWidget = dynamic(() => import('@/features/ask/AskWidget'), { ssr: false });

/**
 * Global shell: top bar, footer, overlays, and the one place the input layer is attached and its
 * shortcuts are given meaning. Also lazily connects audio once sound is turned on.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname().replace(/\/+$/, '') || '/';
  const router = useRouter();
  const { goSection } = useSiteNav();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteOrigin, setPaletteOrigin] = useState<DOMRect | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  // Overlays mount on first use and stay mounted so their close animations can play.
  const [used, setUsed] = useState({ palette: false, sheet: false });
  useEffect(() => {
    if (paletteOpen || shortcutsOpen) setUsed((u) => ({ palette: u.palette || paletteOpen, sheet: u.sheet || shortcutsOpen }));
  }, [paletteOpen, shortcutsOpen]);
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playing = useRef(false);

  const isPlayground = pathname === '/playground';
  const isAsk = pathname === '/askme';

  const openPalette = useCallback((origin?: DOMRect | null) => {
    setShortcutsOpen(false);
    setPaletteOrigin(origin ?? null);
    setPaletteOpen(true);
  }, []);
  const toast = useCallback((msg: string) => {
    if (toastT.current) clearTimeout(toastT.current);
    setToastMsg(msg);
    toastT.current = setTimeout(() => setToastMsg(null), 1900);
  }, []);

  const goPlayground = useCallback(async () => {
    if (playing.current) return;
    playing.current = true;
    setPaletteOpen(false);
    setShortcutsOpen(false);
    try {
      const bridge = pathname === '/' ? getKeyboardBridge() : null;
      if (bridge) {
        await Promise.race([
          bridge.enterPlayground(),
          new Promise((r) => setTimeout(r, 850)),
        ]);
      }
      // v1 transition: crossfade out, then the playground fades in on mount.
      const main = document.querySelector('main');
      if (main && !prefersReducedMotion()) {
        await main.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur.base, fill: 'forwards' }).finished;
      }
      router.push('/playground');
    } finally {
      playing.current = false;
    }
  }, [pathname, router]);

  // The input layer: attached once for the whole app.
  useEffect(() => {
    const detach = getInput().attach(window, document);
    return () => detach();
  }, []);
  useEffect(() => {
    hydratePrefs();
    // Audio code loads only once sound is on (muted by default). One connection per page, even
    // when effects run twice (dev Strict Mode) or modules hot-reload: two engines would play every
    // sound twice, slightly offset.
    const maybeConnect = () => {
      const g = globalThis as { __grsAudio?: boolean };
      if (g.__grsAudio || getPrefs().muted) return;
      g.__grsAudio = true;
      void import('@/audio/connect').then(({ connectAudio }) => connectAudio(getInput(), { get: getPrefs, subscribe: subscribePrefs }));
    };
    maybeConnect();
    return subscribePrefs(maybeConnect);
  }, []);

  // Give shortcuts their meaning.
  useEffect(() => {
    const input = getInput();
    const offs = [
      input.handle('palette', () => {
        setShortcutsOpen(false);
        setPaletteOpen((open) => {
          if (open) return false;
          setPaletteOrigin(getKeyboardBridge()?.keyRect('KeyK') ?? null);
          return true;
        });
      }),
      input.handle('sheet', () => {
        setPaletteOpen(false);
        setShortcutsOpen((o) => !o);
      }),
      input.handle('playground', () => void goPlayground()),
      input.handle('escape', () => {
        if (!isPlayground) setAskOpen(false);
      }),
      ...NAV_TARGETS.map(([id, target]) => input.handle(id, () => goSection(target))),
    ];
    return () => offs.forEach((f) => f());
  }, [goPlayground, goSection, isPlayground]);

  // Overlays that own typing pause the keyboard mirroring and shortcuts.
  useEffect(() => {
    getInput().set({ blocked: paletteOpen || shortcutsOpen });
  }, [paletteOpen, shortcutsOpen]);

  return (
    <ChromeContext.Provider
      value={{
        paletteOpen,
        paletteOrigin,
        openPalette,
        closePalette: () => setPaletteOpen(false),
        shortcutsOpen,
        openShortcuts: () => {
          setPaletteOpen(false);
          setShortcutsOpen(true);
        },
        closeShortcuts: () => setShortcutsOpen(false),
        askOpen,
        setAskOpen,
        toast,
        goPlayground: () => void goPlayground(),
      }}
    >
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {!isPlayground && <TopBar overlay={pathname === '/'} />}
      {children}
      {!isPlayground && !isAsk && <Footer />}
      {!isPlayground && !isAsk && <AskWidget />}
      {used.palette && <CommandPalette />}
      {used.sheet && <ShortcutsSheet />}
      <Toast message={toastMsg} />
    </ChromeContext.Provider>
  );
}
