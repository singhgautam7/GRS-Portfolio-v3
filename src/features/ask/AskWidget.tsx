'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';
import { useChrome } from '@/components/chrome/ChromeContext';
import { Dialog } from '@/components/ui/Dialog';
import { useSiteNav } from '@/lib/navigation';
import { stats } from '@/lib/stats';
import { SITE } from '@/lib/site';
import { prefersReducedMotion } from '@/lib/reduced-motion';
import { askEntries, matchAsk } from './answers';
import type { AskAction, AskAnswer } from './answers';
import s from './ask.module.css';

interface WidgetThreadItem extends AskAnswer {
  key: string;
  shown?: string;
  pending?: boolean;
}

const ctx = { appsShipped: stats.appsShipped, email: SITE.email };
const MOBILE = '(max-width: 1023px), (hover: none) and (pointer: coarse)';

/** Floating "Ask about me": a panel on desktop, a bottom sheet on mobile. */
export default function AskWidget() {
  const { askOpen, setAskOpen, toast } = useChrome();
  const { goSection } = useSiteNav();
  const router = useRouter();
  const [thread, setThread] = useState<WidgetThreadItem[]>([]);
  const [fallback, setFallback] = useState(false);
  const [text, setText] = useState('');
  const [mobile, setMobile] = useState(false);
  const [fabVisible, setFabVisible] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const panel = useRef<HTMLDivElement>(null);
  const fab = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const everOpen = useRef(false);
  const busy = useRef(false);
  const iv = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (askOpen) everOpen.current = true;

  const close = useCallback(() => {
    setAskOpen(false);
    if (!mobile) fab.current?.focus();
  }, [mobile, setAskOpen]);

  // Mobile detection
  useEffect(() => {
    const mq = matchMedia(MOBILE);
    setMobile(mq.matches);
    const on = () => setMobile(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // Focus trap / initial focus on desktop
  useEffect(() => {
    if (askOpen && !mobile) panel.current?.querySelector<HTMLElement>('button, input')?.focus();
  }, [askOpen, mobile]);

  // Click outside to close on desktop
  useEffect(() => {
    if (!askOpen || mobile) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (panel.current?.contains(target) || fab.current?.contains(target)) return;
      close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [askOpen, mobile, close]);

  // Hide FAB when scrolling down, show FAB when scrolling up (only when chat is closed)
  useEffect(() => {
    if (askOpen) {
      setFabVisible(true);
      return;
    }
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const diff = currentY - lastY;
        if (currentY < 50) {
          setFabVisible(true);
        } else if (diff > 8) {
          setFabVisible(false);
        } else if (diff < -8) {
          setFabVisible(true);
        }
        lastY = currentY;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [askOpen]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (sendTimer.current) clearTimeout(sendTimer.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (iv.current) clearInterval(iv.current);
    };
  }, []);

  // Auto-scroll body to bottom when thread updates
  useEffect(() => {
    bodyRef.current?.scrollTo({
      top: bodyRef.current.scrollHeight,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, [thread]);

  const askItem = (hit: AskAnswer, isFallback = false) => {
    busy.current = true;
    setText('');
    setFallback(isFallback);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (iv.current) clearInterval(iv.current);

    const reduced = prefersReducedMotion();
    const item: WidgetThreadItem = {
      ...hit,
      key: `${hit.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      shown: reduced ? hit.a : '',
      pending: !reduced,
    };

    setThread((t) => [...t, item].slice(-3));

    if (reduced) {
      busy.current = false;
      return;
    }

    // "thinking" dots for 480ms, then type 4 characters every 14ms (design matching /askme)
    timeoutRef.current = setTimeout(() => {
      setThread((ms) => ms.map((m, i) => (i === ms.length - 1 ? { ...m, pending: false } : m)));
      const start = performance.now();
      iv.current = setInterval(() => {
        const elapsed = performance.now() - start;
        const n = Math.min(hit.a.length, Math.max(4, Math.floor(elapsed * (4 / 14))));
        setThread((ms) => ms.map((m, i) => (i === ms.length - 1 ? { ...m, shown: hit.a.slice(0, n) } : m)));
        if (n >= hit.a.length) {
          if (iv.current) clearInterval(iv.current);
          iv.current = null;
          busy.current = false;
        }
      }, 16);
    }, 480);
  };

  const onChipClick = (c: AskAnswer) => {
    if (busy.current || sendingId) return;
    busy.current = true;

    if (prefersReducedMotion()) {
      askItem(c);
      return;
    }

    setSendingId(c.id);

    // Pill glides up over 140ms, then commits message to thread and collapses width
    sendTimer.current = setTimeout(() => {
      askItem(c);
      sendTimer.current = setTimeout(() => {
        setSendingId(null);
      }, 140);
    }, 140);
  };

  const ask = () => {
    const q = text.trim();
    if (!q || busy.current || sendingId) return;
    const hit = matchAsk(q, ctx);
    if (hit) {
      const matched = chips.find((c) => c.id === hit.id);
      if (matched && !prefersReducedMotion()) {
        onChipClick(matched);
        return;
      }
      askItem(hit, false);
    } else {
      askItem({ id: 'unknown', q, a: 'I don’t know that one yet.' }, true);
    }
  };

  const run = (act: AskAction) => {
    if ('nav' in act) {
      setAskOpen(false);
      goSection(act.nav);
    } else if ('email' in act) {
      void navigator.clipboard?.writeText(SITE.email).catch(() => {});
      toast('Email copied');
    } else if ('resume' in act) window.location.href = SITE.resumeUrl;
    else if ('link' in act) window.open(act.link, '_blank', 'noopener,noreferrer');
    else {
      setAskOpen(false);
      router.push(act.route);
    }
  };

  const chips = askEntries(ctx).filter((e) => e.id === sendingId || !thread.some((t) => t.q === e.q));
  const content = (
    <>
      <div className={s.head}>
        <div className={s.titles}>
          <h2 className={s.title}>Ask about me</h2>
          <span className={s.sub}>Tap a question. Quick answers about my work.</span>
        </div>
        {mobile ? (
          <button type="button" className={s.close} aria-label="Close" onClick={close}>
            <X size={18} />
          </button>
        ) : (
          <div className={s.headActions}>
            <Link href="/askme" className={s.full} onClick={() => setAskOpen(false)}>
              full page ↗
            </Link>
            <button type="button" className={s.close} aria-label="Close" onClick={close}>
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      <div ref={bodyRef} className={s.body} aria-live="polite">
        {thread.map((t) => {
          const isDone = !t.pending && t.shown === t.a;
          return (
            <div key={t.key} style={{ display: 'contents' }}>
              <div className={s.q}>{t.q}</div>
              <div className={s.a}>
                {t.pending ? (
                  <span className={s.dots} aria-label="Thinking">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  <span className={s.aText}>
                    {t.shown ?? t.a}
                    {t.shown !== t.a && <span className={s.caret} aria-hidden />}
                  </span>
                )}
                {isDone && t.cta && t.act && (
                  <button type="button" className={s.cta} onClick={() => run(t.act!)}>
                    {t.cta} <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>→</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {fallback && <span className={s.tryThese}>Try one of these instead:</span>}
        <div className={s.chips}>
          {chips.map((c, idx) => (
            <button
              key={c.id}
              type="button"
              className={s.chip}
              data-sending={c.id === sendingId}
              style={{ '--i': idx } as React.CSSProperties}
              disabled={busy.current && c.id !== sendingId}
              onClick={() => onChipClick(c)}
            >
              {c.q}
            </button>
          ))}
        </div>
      </div>
      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
      >
        <input
          className={s.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Or type a question…"
          aria-label="Type a question"
          disabled={busy.current}
        />
        <button type="submit" className={s.askBtn} disabled={busy.current || !text.trim()}>
          Ask
        </button>
      </form>
    </>
  );

  return (
    <>
      <button
        ref={fab}
        type="button"
        className={s.fab}
        aria-expanded={askOpen}
        aria-controls="ask-panel"
        data-hidden={!fabVisible && !askOpen}
        onClick={() => setAskOpen(!askOpen)}
      >
        {askOpen ? <X size={16} /> : <MessageCircle size={16} />}
        {askOpen ? 'Close' : 'Ask about me'}
      </button>
      {mobile ? (
        <Dialog open={askOpen} onClose={close} label="Ask about me" variant="sheet" className={s.sheet}>
          {content}
        </Dialog>
      ) : (
        // Stays mounted once opened so closing can ease out too.
        (askOpen || everOpen.current) && (
          <div
            ref={panel}
            id="ask-panel"
            role="dialog"
            aria-label="Ask about me"
            aria-hidden={!askOpen}
            inert={!askOpen}
            data-open={askOpen}
            className={s.panel}
            onKeyDown={(e) => {
              if (e.key === 'Escape') close();
            }}
          >
            {content}
          </div>
        )
      )}
    </>
  );
}
