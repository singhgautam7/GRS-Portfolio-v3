'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { getInput } from '@/input';
import { Dialog } from '@/components/ui/Dialog';
import { Keycap2D } from '@/components/ui/Keycap2D';
import { Tooltip } from '@/components/ui/Tooltip';
import { usePrefs, setPrefs, getPrefs } from '../prefs';
import { VARIANTS, variantMeta } from '../variants';
import type { VariantId } from '../variants';
import { DESKTOP_QUERY } from '../HeroKeyboard';
import s from './selector.module.css';

/** Prefetch a variant chunk on hover/focus (desktop only: phones never load three.js). */
function prefetch(id: VariantId) {
  if (matchMedia(DESKTOP_QUERY).matches) void import('../core/loaders').then((m) => m.loadVariant(id));
}
/** Audio code is fetched ahead of the unmute click so the click itself can start the context. */
const prefetchAudio = () => void import('@/audio/connect');

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d={on ? 'M15.54 8.46a5 5 0 0 1 0 7.07' : 'M22 9l-6 6'} />
      <path d={on ? 'M19.07 4.93a10 10 0 0 1 0 14.14' : 'M16 9l6 6'} />
    </svg>
  );
}

/** Mute keycap. Muted by default; one nudge after the visitor's first real key press. */
function MuteKey({ big = false }: { big?: boolean }) {
  const { muted } = usePrefs();
  const [nudge, setNudge] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (big) return; // the nudge belongs to the desktop board
    const timers: ReturnType<typeof setTimeout>[] = [];
    const off = getInput().on((e) => {
      if (e.type !== 'real' || !getPrefs().muted) return;
      timers.push(
        setTimeout(() => {
          if (!getPrefs().muted) return;
          setNudge(true);
          btn.current?.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(9deg)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(0)' }], { duration: 560, easing: 'ease-in-out' });
        }, 450),
        setTimeout(() => setNudge(false), 4200),
      );
    });
    return () => {
      off();
      timers.forEach(clearTimeout);
    };
  }, [big]);
  const label = muted ? 'Turn keyboard sound on' : 'Mute keyboard sound';
  return (
    <Tooltip open={nudge && muted} content="Sound is off. Tap to hear it." align="end">
      <button
        ref={btn}
        type="button"
        className={s.mute}
        data-big={big}
        data-nudge={nudge && muted}
        aria-pressed={!muted}
        aria-label={label}
        title={label}
        onPointerEnter={prefetchAudio}
        onFocus={prefetchAudio}
        onClick={() => {
          setNudge(false);
          setPrefs({ muted: !muted });
        }}
      >
        <SoundIcon on={!muted} />
      </button>
    </Tooltip>
  );
}

/**
 * Keyboard selector (design 7d): a compact listbox that opens upward over the desk, plus a
 * separate mute key. ↑↓ move, ↵ / Space pick, Esc closes and returns focus.
 */
export function Selector() {
  const { variant } = usePrefs();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const meta = variantMeta(variant);

  useEffect(() => {
    if (!open) return;
    const i = VARIANTS.findIndex((v) => v.id === variant);
    setActive(i);
    list.current?.focus();
    const onDoc = (e: PointerEvent) => {
      if (!list.current?.contains(e.target as Node) && !trigger.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open, variant]);

  const pick = (v: VariantId) => {
    setPrefs({ variant: v });
    setOpen(false);
    trigger.current?.focus();
  };

  return (
    <div className={s.row}>
      <div className={s.anchor}>
        <button
          ref={trigger}
          type="button"
          className={s.trigger}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={id}
          aria-label={`Keyboard: ${meta.name}`}
          title="Change keyboard"
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
            }
          }}
        >
          <Keycap2D size="chip">{meta.chip}</Keycap2D>
          <span>{meta.name}</span>
          <ChevronUp size={12} strokeWidth={2.4} className={s.chev} data-open={open} />
        </button>
        {open && (
          <div
            ref={list}
            id={id}
            role="listbox"
            aria-label="Keyboard"
            tabIndex={-1}
            aria-activedescendant={`${id}-${active}`}
            className={s.menu}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(VARIANTS.length - 1, a + 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(VARIANTS[active]!.id); }
              else if (e.key === 'Escape' || e.key === 'Tab') { setOpen(false); trigger.current?.focus(); }
            }}
          >
            <div className={s.menuLabel} aria-hidden>
              KEYBOARD
            </div>
            {VARIANTS.map((v, i) => {
              const on = v.id === variant;
              return (
                <div
                  key={v.id}
                  id={`${id}-${i}`}
                  role="option"
                  aria-selected={on}
                  data-active={i === active}
                  className={s.option}
                  onPointerEnter={() => { setActive(i); prefetch(v.id); }}
                  onClick={() => pick(v.id)}
                >
                  <Keycap2D size="chip" tone={on ? 'pressed' : 'plain'} className={s.optCap}>
                    {v.chip}
                  </Keycap2D>
                  <span className={s.optText}>
                    <span className={s.optName}>{v.name}</span>
                    <span className={s.optSub}>{v.subtitle}</span>
                  </span>
                  <span className={s.check} aria-hidden>
                    {on ? '✓' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <MuteKey />
    </div>
  );
}

/** Mobile selector (7e): a 44px row that opens a bottom sheet with all six, plus the mute key. */
export function MobileSelector() {
  const { variant } = usePrefs();
  const [open, setOpen] = useState(false);
  const meta = variantMeta(variant);
  return (
    <div className={s.mobile}>
      <div className={s.mobileRow}>
        <button type="button" className={s.mobileTrigger} aria-haspopup="dialog" aria-label={`Keyboard: ${meta.name}`} onClick={() => setOpen(true)}>
          <Keycap2D size="chip">{meta.chip}</Keycap2D>
          <span className={s.grow}>{meta.name}</span>
          <ChevronDown size={14} strokeWidth={2.4} className={s.chevMobile} />
        </button>
        <MuteKey big />
      </div>
      <span className={s.mobileSub}>{meta.subtitle}</span>
      <Dialog open={open} onClose={() => setOpen(false)} label="Choose a keyboard" variant="sheet">
        <div role="radiogroup" aria-label="Keyboard" className={s.sheetList}>
          <div className={s.menuLabel}>KEYBOARD</div>
          {VARIANTS.map((v) => {
            const on = v.id === variant;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={on}
                className={s.option}
                data-active={on}
                onClick={() => {
                  setPrefs({ variant: v.id });
                  setOpen(false);
                }}
              >
                <Keycap2D size="chip" tone={on ? 'pressed' : 'plain'} className={s.optCap}>
                  {v.chip}
                </Keycap2D>
                <span className={s.optText}>
                  <span className={s.optName}>{v.name}</span>
                  <span className={s.optSub}>{v.subtitle}</span>
                </span>
                <span className={s.check} aria-hidden>
                  {on ? '✓' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </Dialog>
    </div>
  );
}
