'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUp, ArrowUpRight, Download, Mail, X } from 'lucide-react';
import { answer, buildContext } from '@/lib/assistant';
import type { AssistantButton, AssistantCard } from '@/lib/assistant';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { SITE } from '@/lib/site';

const mono = 'var(--font-mono)';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  full: string;
  shown: string;
  done: boolean;
  pending: boolean;
  cards: AssistantCard[];
  buttons: AssistantButton[];
}

let nextId = 0;

export interface AssistantProps {
  chips: string[];
  seed?: string;
  onClose: () => void;
  /** Navigate to an assistant route value (section name, page name, or path). */
  onRoute: (value: string) => void;
  /** When true, the docked input shares a `layoutId` with the hero input so it
   *  morphs in from the hero (in-page overlay on the home route). */
  morph?: boolean;
}

/**
 * The full-screen chat surface (also reachable as Cmd+K → "Ask me anything").
 * Accessible focus-trapped dialog with aria-live answers, Esc to close, a
 * typewriter stream and a "thinking" pending state. Conversation persists within
 * the session and resets on reload.
 */
export function Assistant({ chips, seed, onClose, onRoute, morph = false }: AssistantProps) {
  const reduced = useReducedMotion();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');

  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const busyRef = useRef(false);
  const streamRef = useRef<number | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef(buildContext());

  const scrollBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = threadRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const startStream = useCallback(() => {
    if (streamRef.current) window.clearInterval(streamRef.current);
    streamRef.current = window.setInterval(() => {
      setMessages((prev) => {
        const msgs = prev.slice();
        const m = msgs[msgs.length - 1];
        if (!m || m.done) {
          if (streamRef.current) window.clearInterval(streamRef.current);
          streamRef.current = null;
          busyRef.current = false;
          return prev;
        }
        const next = Math.min(m.full.length, m.shown.length + 4);
        msgs[msgs.length - 1] = { ...m, shown: m.full.slice(0, next), done: next >= m.full.length };
        if (next >= m.full.length) busyRef.current = false;
        return msgs;
      });
      scrollBottom();
    }, 12);
  }, [scrollBottom]);

  const ask = useCallback(
    async (qRaw: string) => {
      const q = qRaw.trim();
      if (!q || busyRef.current) return;
      busyRef.current = true;
      setInput('');

      const resp = await answer(q, ctxRef.current);
      const isReduced = reducedRef.current;

      const userMsg: ChatMessage = {
        id: nextId++,
        role: 'user',
        full: q,
        shown: q,
        done: true,
        pending: false,
        cards: [],
        buttons: [],
      };
      const botMsg: ChatMessage = {
        id: nextId++,
        role: 'assistant',
        full: resp.text,
        shown: isReduced ? resp.text : '',
        done: isReduced,
        pending: !isReduced,
        cards: resp.cards ?? [],
        buttons: resp.buttons ?? [],
      };

      setMessages((m) => [...m, userMsg, botMsg]);
      scrollBottom();

      if (isReduced) {
        busyRef.current = false;
        return;
      }

      window.setTimeout(() => {
        setMessages((prev) => {
          const msgs = prev.slice();
          const i = msgs.length - 1;
          if (msgs[i]) msgs[i] = { ...msgs[i]!, pending: false };
          return msgs;
        });
        startStream();
      }, 480);
    },
    [scrollBottom, startStream],
  );

  // Seed the conversation (deep link / hero / chip) once on mount.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seed && !seededRef.current) {
      seededRef.current = true;
      void ask(seed);
    }
  }, [seed, ask]);

  // Autofocus input on open.
  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, []);

  // Esc to close + focus trap within the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const root = dialogRef.current;
        if (!root) return;
        const focusable = root.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  useEffect(() => () => {
    if (streamRef.current) window.clearInterval(streamRef.current);
  }, []);

  const runButton = (b: AssistantButton) => {
    switch (b.action) {
      case 'resume':
        window.open(SITE.resumeUrl, '_blank', 'noopener');
        break;
      case 'mailto':
        window.location.href = `mailto:${SITE.email}`;
        break;
      case 'link':
        if (b.value) window.open(b.value, '_blank', 'noopener');
        break;
      case 'ask':
        if (b.value) void ask(b.value);
        break;
      case 'route':
        if (b.value) onRoute(b.value);
        break;
    }
  };

  const empty = messages.length === 0;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Ask Me Anything, Gautam's assistant"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        fontFamily: 'var(--font-sans)',
        color: 'var(--ink)',
        background: 'var(--bg)',
      }}
    >
      {/* header */}
      <div
        style={{
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 18px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <Avatar size={34} dot />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.1 }}>Ask Me Anything</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: mono,
              fontSize: 10.5,
              color: 'var(--ink-3)',
              marginTop: 2,
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ok)' }} />
            on-device · no server · offline-ready
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            flex: 'none',
            width: 34,
            height: 34,
            borderRadius: 10,
            border: '1px solid var(--line)',
            background: 'var(--surface-2)',
            color: 'var(--ink-2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* thread */}
      <div ref={threadRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '22px 18px 8px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          {empty && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 10,
                padding: '34px 10px 26px',
              }}
            >
              <Avatar size={52} glow />
              <div style={{ fontWeight: 600, fontSize: 21, letterSpacing: '-0.02em' }}>
                Ask me anything about Gautam.
              </div>
              <div style={{ fontSize: 14, color: 'var(--ink-2)', maxWidth: 380, lineHeight: 1.5 }}>
                Experience, what I work on, my projects, what I&apos;m up to now, or something off the
                wall. Answers run right here in your browser.
              </div>
            </div>
          )}

          <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {messages.map((m) => (
              <Message key={m.id} message={m} onButton={runButton} />
            ))}
          </div>
        </div>
      </div>

      {/* chips rail */}
      <div style={{ flex: 'none', padding: '6px 0 2px' }}>
        <div
          className="grs-rail"
          style={{
            display: 'flex',
            gap: 9,
            overflowX: 'auto',
            padding: '8px 18px',
            maxWidth: 716,
            margin: '0 auto',
          }}
        >
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => void ask(chip)}
              className="grs-chip"
              style={{
                flex: 'none',
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

      {/* docked input */}
      <div
        style={{
          flex: 'none',
          padding: '8px 18px 18px',
          borderTop: '1px solid var(--line)',
          background: 'var(--bg)',
          paddingBottom: 'max(18px, env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div
            style={{
              fontFamily: mono,
              fontSize: 10.5,
              color: 'var(--ink-3)',
              margin: '0 4px 7px',
              opacity: 0.85,
            }}
          >
            grs@infra:~$ <span style={{ color: 'var(--ink-2)' }}>ask</span>
          </div>
          <motion.div
            layoutId={morph && !reduced ? 'ama-input' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              background: 'var(--surface-2)',
              border: '1px solid var(--line-2)',
              borderRadius: 15,
              padding: '7px 7px 7px 16px',
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void ask(input);
                }
              }}
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
                fontSize: 15,
              }}
            />
            <button
              onClick={() => void ask(input)}
              aria-label="Send"
              className="grs-send"
              style={{
                flex: 'none',
                width: 38,
                height: 38,
                borderRadius: 11,
                border: 'none',
                cursor: 'pointer',
                background: 'var(--accent)',
                color: 'var(--accent-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowUp size={17} />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/** Small leading icon for an assistant button, chosen by its action. */
function buttonIcon(action: AssistantButton['action']) {
  switch (action) {
    case 'mailto':
      return <Mail size={14} />;
    case 'resume':
      return <Download size={14} />;
    case 'link':
      return <ArrowUpRight size={14} />;
    default:
      return null;
  }
}

function Avatar({ size, dot, glow }: { size: number; dot?: boolean; glow?: boolean }) {
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: size >= 50 ? 16 : 11,
        background: 'var(--surface-2)',
        border: '1px solid var(--line-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        boxShadow: glow ? 'var(--avatar-glow)' : undefined,
      }}
    >
      <span style={{ fontFamily: mono, fontWeight: 600, fontSize: size * 0.4, color: 'var(--accent)' }}>
        G
      </span>
      {dot && (
        <span
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--ok)',
            border: '2px solid var(--bg)',
          }}
        />
      )}
    </div>
  );
}

function Message({
  message: m,
  onButton,
}: {
  message: ChatMessage;
  onButton: (b: AssistantButton) => void;
}) {
  const isUser = m.role === 'user';
  const reduced = useReducedMotion();
  // Suggestion pills are revealed only after the typewriter for this answer
  // completes (assistant messages flip `done` when streaming finishes).
  const showButtons = (isUser || m.done) && m.buttons.length > 0;
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      {!isUser && (
        <span
          style={{
            flex: 'none',
            width: 27,
            height: 27,
            borderRadius: 9,
            background: 'var(--surface-2)',
            border: '1px solid var(--line-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: mono,
            fontSize: 12,
            color: 'var(--accent)',
            marginTop: 1,
          }}
        >
          G
        </span>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: isUser ? '82%' : '100%',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          minWidth: 0,
          flex: isUser ? 'none' : 1,
        }}
      >
        <div
          style={
            isUser
              ? {
                  background: 'var(--bubble-user)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                  borderRadius: '14px 14px 4px 14px',
                  padding: '10px 14px',
                  fontSize: 14.5,
                  lineHeight: 1.5,
                }
              : { color: 'var(--ink)', fontSize: 15, lineHeight: 1.6, paddingTop: 3 }
          }
        >
          {m.pending ? (
            <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
              {[0, 0.15, 0.3].map((d) => (
                <span
                  key={d}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--ink-3)',
                    animation: `grstype 1s ease-in-out ${d}s infinite`,
                  }}
                />
              ))}
            </span>
          ) : (
            <>
              {m.shown}
              {!isUser && !m.done && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 7,
                    height: '1.05em',
                    background: 'var(--accent)',
                    marginLeft: 2,
                    verticalAlign: -2,
                    animation: 'grsblink 1s steps(1) infinite',
                  }}
                />
              )}
            </>
          )}
        </div>

        {m.cards.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 13, width: '100%' }}>
            {m.cards.map((c) => (
              <div
                key={c.title}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 13,
                  padding: '15px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{c.title}</span>
                  <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--ink-3)' }}>{c.kind}</span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink-2)', margin: '7px 0 12px' }}>
                  {c.desc}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {c.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontFamily: mono,
                        fontSize: 10,
                        color: 'var(--ink-3)',
                        border: '1px solid var(--line)',
                        borderRadius: 5,
                        padding: '3px 7px',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grs-link"
                      style={{
                        fontFamily: mono,
                        fontSize: 11,
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        marginLeft: 'auto',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      open <ArrowUpRight size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showButtons && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 13 }}>
            {m.buttons.map((b, i) => (
              <motion.button
                key={b.label}
                onClick={() => onButton(b)}
                className={b.kind === 'primary' ? 'grs-send' : 'grs-ghost-btn'}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0 : 0.2, delay: reduced ? 0 : i * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  fontWeight: b.kind === 'primary' ? 600 : 500,
                  cursor: 'pointer',
                  padding: '9px 15px',
                  borderRadius: 10,
                  border: b.kind === 'primary' ? 'none' : '1px solid var(--line-2)',
                  background: b.kind === 'primary' ? 'var(--accent)' : 'transparent',
                  color: b.kind === 'primary' ? 'var(--accent-ink)' : 'var(--ink-2)',
                }}
              >
                {buttonIcon(b.action)}
                {b.label}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
