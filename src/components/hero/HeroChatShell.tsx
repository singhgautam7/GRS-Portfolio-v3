'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { HeroLauncher } from './HeroLauncher';
import { Assistant } from '@/components/assistant/Assistant';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useSessionChips } from '@/lib/hooks/useSessionChips';
import { useSiteNav } from '@/lib/navigation';

/**
 * Hosts the idle hero and the in-page chat overlay so the transition from the
 * hero to the full-screen chat is a shared-element morph (the input bar carries
 * a `layoutId` across both). Scrolling never opens chat; sending or tapping a
 * chip does. The /ask route remains for deep links and the command palette.
 * Reduced motion gets an instant switch (no morph, no fade).
 */
export function HeroChatShell() {
  const reduced = useReducedMotion();
  const chips = useSessionChips();
  const { goRouteValue } = useSiteNav();
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState<string | undefined>(undefined);

  const openWith = (q: string) => {
    setSeed(q);
    setOpen(true);
  };

  return (
    <>
      <HeroLauncher chatOpen={open} onAsk={openWith} />
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-overlay"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            style={{
              position: 'fixed',
              top: 58,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 90,
              background: 'var(--bg)',
            }}
          >
            <div style={{ maxWidth: 840, margin: '0 auto', height: '100%' }}>
              <Assistant
                morph
                chips={chips}
                seed={seed}
                onClose={() => setOpen(false)}
                onRoute={(value) => {
                  setOpen(false);
                  goRouteValue(value);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
