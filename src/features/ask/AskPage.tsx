'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MoreVertical, Trash2 } from 'lucide-react';
import { answer } from '@/lib/assistant/engine';
import type { AssistantButton, AssistantCard } from '@/lib/assistant/types';
import { useChrome } from '@/components/chrome/ChromeContext';
import { Dialog } from '@/components/ui/Dialog';
import { Keycap2D } from '@/components/ui/Keycap2D';
import { useSiteNav } from '@/lib/navigation';
import { prefersReducedMotion } from '@/lib/reduced-motion';
import { readStore, writeStore } from '@/lib/storage';
import { SITE } from '@/lib/site';
import s from './askpage.module.css';

interface Msg {
  id: number;
  user: boolean;
  text: string;
  shown: string;
  time: number;
  pending?: boolean;
  cards?: AssistantCard[];
  buttons?: AssistantButton[];
  fallback?: boolean;
}

const KEY = 'grs:ask';
const SCHEMA = 1;
const CHIPS = ['How much experience do you have?', 'What do you work on?', 'Show me something local-first', 'What are you learning?', 'How do I contact you?', 'How was this built?'];
const isMsgs = (d: unknown): d is Msg[] => Array.isArray(d) && d.every((m) => typeof m === 'object' && m !== null && typeof (m as Msg).text === 'string');
const clock = (ts: number) => new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

/** /askme (design 8a): the full Ask page, answers from the existing intent + content engine. */
export function AskPage() {
  const router = useRouter();
  const { toast } = useChrome();
  const { goRouteValue } = useSiteNav();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [sendingChip, setSendingChip] = useState<string | null>(null);
  const busy = useRef(false);
  const thread = useRef<HTMLDivElement>(null);
  const iv = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = readStore(KEY, SCHEMA, isMsgs);
    if (saved) setMsgs(saved.map((m) => ({ ...m, shown: m.text, pending: false })));
    const q = new URLSearchParams(location.search).get('q');
    if (q) {
      history.replaceState(null, '', '/askme/');
      void ask(q);
    }
    return () => {
      if (iv.current) clearInterval(iv.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (msgs.every((m) => !m.pending && m.shown === m.text)) writeStore(KEY, SCHEMA, msgs.slice(-40));
    thread.current?.scrollTo({ top: thread.current.scrollHeight });
  }, [msgs]);

  const patchLast = (p: Partial<Msg>) => setMsgs((ms) => ms.map((m, i) => (i === ms.length - 1 ? { ...m, ...p } : m)));

  async function ask(raw: string) {
    const q = raw.trim();
    if (!q || busy.current) return;
    busy.current = true;
    setInput('');
    const r = await answer(q);
    const now = Date.now(), reduced = prefersReducedMotion();
    const bot: Msg = { id: now + 1, user: false, text: r.text, shown: reduced ? r.text : '', time: now, pending: !reduced, cards: r.cards, buttons: r.buttons, fallback: r.source === 'fallback' };
    setMsgs((ms) => [...ms, { id: now, user: true, text: q, shown: q, time: now }, bot]);
    if (reduced) {
      busy.current = false;
      return;
    }
    // "thinking" dots for 480ms, then type 4 characters every 14ms (design).
    setTimeout(() => {
      patchLast({ pending: false });
      let n = 0;
      iv.current = setInterval(() => {
        n = Math.min(r.text.length, n + 4);
        patchLast({ shown: r.text.slice(0, n) });
        if (n >= r.text.length) {
          if (iv.current) clearInterval(iv.current);
          busy.current = false;
        }
      }, 14);
    }, 480);
  }

  const run = (b: AssistantButton) => {
    if (b.action === 'mailto') window.location.href = `mailto:${SITE.email}`;
    else if (b.action === 'resume') window.location.href = SITE.resumeUrl;
    else if (b.action === 'link' && b.value) window.open(b.value, '_blank', 'noopener,noreferrer');
    else if (b.action === 'ask' && b.value) void ask(b.value);
    else if (b.action === 'route' && b.value) goRouteValue(b.value);
  };
  const last = [...msgs].reverse().find((m) => !m.user);
  const lastDone = !!last && !last.pending && last.shown === last.text;
  const showChips = !last || !lastDone || !(last.buttons?.length) || last.fallback;
  const close = () => (history.length > 1 ? router.back() : router.push('/'));

  const onChipClick = (q: string) => {
    if (busy.current || sendingChip) return;
    if (prefersReducedMotion()) {
      void ask(q);
      return;
    }
    setSendingChip(q);
    setTimeout(() => {
      void ask(q);
      setTimeout(() => setSendingChip(null), 140);
    }, 140);
  };

  return (
    <main id="main" className={s.page}>
      <div className={s.column}>
        <div className={s.head}>
          <span className={s.avatar} aria-hidden>
            G<span className={s.online} />
          </span>
          <div className={s.headText}>
            <h1 className={s.title}>Ask Me Anything</h1>
            <span className={s.status}>
              <span className={s.okDot} aria-hidden />
              no server · works offline
            </span>
          </div>
          <div className={s.menuAnchor}>
            <button type="button" className={s.iconBtn} aria-label="More options" aria-haspopup="menu" aria-expanded={menu} data-open={menu} onClick={() => setMenu((m) => !m)}>
              <MoreVertical size={16} />
            </button>
            {menu && (
              <div role="menu" className={s.menu}>
                <button
                  type="button"
                  role="menuitem"
                  className={s.menuItem}
                  disabled={!msgs.length}
                  onClick={() => {
                    setMenu(false);
                    setConfirm(true);
                  }}
                >
                  <Trash2 size={15} className={s.accentIcon} />
                  Clear all
                </button>
              </div>
            )}
          </div>
          <button type="button" className={s.closeBtn} onClick={close} aria-label="Close">
            <ChevronLeft size={14} className={s.hideDesktop} />
            Close <Keycap2D>esc</Keycap2D>
          </button>
        </div>

        <div ref={thread} className={s.thread} aria-live="polite">
          {!msgs.length ? (
            <div className={s.empty}>
              <span className={s.bigAvatar} aria-hidden>
                G
              </span>
              <span className={s.emptyTitle}>Ask me anything about Gautam.</span>
              <span className={s.emptySub}>Experience, what I work on, my projects, what I’m up to now, or something off the wall. Answers run right here in your browser.</span>
            </div>
          ) : (
            <div className={s.today}>
              <span>Today</span>
            </div>
          )}
          {msgs.map((m) => (
            <div key={m.id} className={s.msg}>
              {m.user ? (
                <div className={s.user}>{m.text}</div>
              ) : (
                <div className={s.bot}>
                  <span className={s.botAvatar} aria-hidden>
                    G
                  </span>
                  <div className={s.botBody}>
                    {m.pending ? (
                      <span className={s.dots} aria-label="Thinking">
                        <span />
                        <span />
                        <span />
                      </span>
                    ) : (
                      <span className={s.botText}>
                        {m.shown}
                        {m.shown !== m.text && <span className={s.caret} aria-hidden />}
                      </span>
                    )}
                    {!m.pending && m.shown === m.text && (
                      <>
                        {m.cards?.map((c) => (
                          <div key={c.title} className={s.card}>
                            <div className={s.cardHead}>
                              <span className={s.cardTitle}>{c.title}</span>
                              <span className={s.cardKind}>{c.kind.toUpperCase()}</span>
                            </div>
                            <span className={s.cardDesc}>{c.desc}</span>
                            <div className={s.cardTags}>
                              {c.tags.map((t) => (
                                <span key={t}>{t}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                        {!!m.buttons?.length && (
                          <div className={s.buttons}>
                            {m.buttons.map((b) => (
                              <button key={b.label} type="button" className={s.btn} data-primary={b.kind === 'primary'} onClick={() => run(b)}>
                                {b.label} <span className={s.mono}>{b.action === 'mailto' ? '@' : b.action === 'resume' ? '↓' : b.action === 'ask' ? '' : '→'}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
              <span className={s.time} data-user={m.user}>
                {clock(m.time)}
              </span>
            </div>
          ))}
        </div>

        {showChips && (
          <div className={s.chips}>
            {CHIPS.map((q, idx) => (
              <button
                key={q}
                type="button"
                className={s.chip}
                data-sending={q === sendingChip}
                style={{ '--i': idx } as React.CSSProperties}
                disabled={busy.current && q !== sendingChip}
                onClick={() => onChipClick(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <form
          className={s.inputArea}
          onSubmit={(e) => {
            e.preventDefault();
            void ask(input);
          }}
        >
          <div className={s.prompt} aria-hidden>
            <span>
              grs@infra:~$ <span className={s.ink2}>ask</span>
            </span>
            <span className={s.send}>
              <Keycap2D size="sm">↵</Keycap2D>send
            </span>
          </div>
          <div className={s.field}>
            <input className={s.input} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything…" aria-label="Ask Gautam anything" onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()} />
            <button type="submit" className={s.sendBtn} aria-label="Send">
              ↵
            </button>
          </div>
        </form>
      </div>

      <Dialog open={confirm} onClose={() => setConfirm(false)} label="Clear chat history" className={s.confirm}>
        <div className={s.confirmInner}>
          <span className={s.confirmTitle}>Clear conversation history?</span>
          <span className={s.confirmText}>This deletes every message on this device. It can’t be undone.</span>
          <div className={s.confirmBtns}>
            <button type="button" className={s.cancel} onClick={() => setConfirm(false)}>
              Cancel
            </button>
            <button
              type="button"
              className={s.clear}
              onClick={() => {
                if (iv.current) clearInterval(iv.current);
                busy.current = false;
                setMsgs([]);
                writeStore(KEY, SCHEMA, []);
                setConfirm(false);
                toast('Conversation cleared');
              }}
            >
              Clear all
            </button>
          </div>
        </div>
      </Dialog>
    </main>
  );
}
