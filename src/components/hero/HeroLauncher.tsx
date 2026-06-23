'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { AmbientField } from './AmbientField';
import type { AmbientHandle } from './AmbientField';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useSessionChips } from '@/lib/hooks/useSessionChips';
import { scrollToSection } from '@/lib/navigation';

const mono = 'var(--font-mono)';
const GREETING = "Hey, I'm Gautam.";

interface HeroLauncherProps {
  /** When the in-page chat overlay is open, the launcher hides its input bar so
   *  the shared `layoutId` element can morph into the docked chat input. */
  chatOpen?: boolean;
  /** Open the chat with a seed query. Falls back to the /askme route if absent. */
  onAsk?: (seed: string) => void;
}

/**
 * The idle hero launcher: greeting (typewriter), role line, on-device badge,
 * input + rotating chips over the ambient field. Sending (Enter / ↑) or tapping
 * a chip navigates to the chat page seeded with the query; scrolling never opens
 * chat. The hero section carries an explicit --bg so the landing texture cannot
 * bleed into it (the hero is sealed).
 */
export function HeroLauncher({ chatOpen = false, onAsk }: HeroLauncherProps) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const chips = useSessionChips();
  const ambientRef = useRef<AmbientHandle | null>(null);
  const greetRef = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState('');

  // Greeting typewriter on mount (literal text stays in markup for first paint).
  // The ambient field stays calm while typing, then plays its entrance the
  // moment the greeting completes.
  useEffect(() => {
    const el = greetRef.current;
    if (!el) return;
    if (reduced) {
      el.textContent = GREETING;
      ambientRef.current?.playEntrance();
      return;
    }
    el.textContent = '';
    let i = 0;
    let timer: number;
    const tick = () => {
      i += 1;
      el.textContent = GREETING.slice(0, i);
      if (i < GREETING.length) {
        timer = window.setTimeout(tick, 52);
      } else {
        ambientRef.current?.playEntrance();
      }
    };
    timer = window.setTimeout(tick, 260);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  const openChat = (seed: string) => {
    if (onAsk) onAsk(seed);
    else router.push(`/askme?q=${encodeURIComponent(seed)}`);
  };

  const send = () => {
    const q = value.trim();
    if (!q) return;
    ambientRef.current?.ripple();
    openChat(q);
  };

  return (
    <section
      id="home"
      style={{
        position: 'relative',
        // Theme-aware hero surface: pure black on dark, a faint tint on light so
        // the ambient motion has something to read against.
        background: 'var(--hero-surface)',
        // dvh accounts for mobile browser chrome so the hero fits one screen.
        minHeight: 'calc(100dvh - 58px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '40px clamp(18px,4vw,32px) 70px',
      }}
    >
      <AmbientField ref={ambientRef} />
      <div aria-hidden="true" className="grs-hero-grid" style={{ zIndex: 1 }} />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 680,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 60,
            height: 60,
            borderRadius: 18,
            background: 'var(--surface-2)',
            border: '1px solid var(--line-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--avatar-glow)',
            marginBottom: 22,
          }}
        >
          <span style={{ fontFamily: mono, fontWeight: 600, fontSize: 25, color: 'var(--accent)' }}>
            G
          </span>
          <span
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 15,
              height: 15,
              borderRadius: '50%',
              background: 'var(--ok)',
              border: '3px solid var(--bg)',
            }}
          />
        </div>

        <h1
          style={{
            fontWeight: 700,
            fontSize: 'clamp(34px,6vw,56px)',
            letterSpacing: '-0.03em',
            lineHeight: 1.04,
            margin: 0,
          }}
        >
          <span ref={greetRef}>{GREETING}</span>
          <span
            data-blink
            style={{
              display: 'inline-block',
              width: '0.5ch',
              height: '0.84em',
              background: 'var(--accent)',
              marginLeft: 7,
              verticalAlign: -1,
              animation: 'grsblink 1.1s steps(1) infinite',
            }}
          />
        </h1>

        <p
          style={{
            fontSize: 'clamp(16px,2.3vw,20px)',
            color: 'var(--ink-2)',
            margin: '18px 0 0',
            lineHeight: 1.5,
            maxWidth: 540,
          }}
        >
          Senior software engineer in backend, cloud infrastructure &amp; AI systems. This is my
          on-device assistant. <span style={{ color: 'var(--ink)' }}>Ask it anything.</span>
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: mono,
            fontSize: 11.5,
            color: 'var(--ink-3)',
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            borderRadius: 999,
            padding: '6px 13px',
            marginTop: 20,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)' }} />
          on-device · no server · offline-ready
        </div>

        <div style={{ width: '100%', maxWidth: 560, marginTop: 30, minHeight: 60 }}>
          {!chatOpen && (
          <motion.div
            layoutId={reduced ? undefined : 'ama-input'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              background: 'var(--surface-2)',
              border: '1px solid var(--line-2)',
              borderRadius: 16,
              padding: '8px 8px 8px 18px',
              boxShadow: 'var(--shadow)',
            }}
          >
            <input
              value={value}
              onChange={(e) => {
                ambientRef.current?.bumpTyping();
                setValue(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  send();
                }
              }}
              onFocus={() => ambientRef.current?.setFocused(true)}
              onBlur={() => ambientRef.current?.setFocused(false)}
              placeholder="Ask me anything…"
              aria-label="Ask Gautam anything"
              style={{
                flex: 1,
                minWidth: 0,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--ink)',
                fontFamily: 'var(--font-sans)',
                fontSize: 16,
              }}
            />
            <button
              onClick={send}
              aria-label="Send"
              className="grs-send"
              style={{
                flex: 'none',
                width: 42,
                height: 42,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                background: 'var(--accent)',
                color: 'var(--accent-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowUp size={18} />
            </button>
          </motion.div>
          )}

          <div className="hero-chips" style={{ minHeight: 38 }}>
            {chips.map((chip) => (
              <button
                key={chip}
                onClick={() => openChat(chip)}
                className="grs-chip"
                style={{
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: 'var(--ink-2)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                  borderRadius: 999,
                  padding: '8px 14px',
                  cursor: 'pointer',
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => scrollToSection('about')}
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: mono,
          fontSize: 11,
          letterSpacing: '0.16em',
          color: 'var(--ink-3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 5,
          zIndex: 2,
        }}
      >
        OR SCROLL TO BROWSE <ArrowDown size={14} />
      </button>
    </section>
  );
}
