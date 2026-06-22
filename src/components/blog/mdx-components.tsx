'use client';

import { useRef, useState } from 'react';
import type { ReactNode } from 'react';

const mono = 'var(--font-mono)';

/**
 * Larger lead paragraph for the opening line of a post. Rendered as a div (not a
 * p) because MDX wraps the inner text in its own <p>, and <p><p> is invalid.
 */
function Lead({ children }: { children: ReactNode }) {
  return (
    <div
      className="grs-lead"
      style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--ink)', fontWeight: 500, margin: '0 0 18px' }}
    >
      {children}
    </div>
  );
}

const CALLOUTS = {
  note: { label: 'Note', icon: '◆', accent: 'var(--accent)', bg: 'rgba(90,160,255,0.07)' },
  tip: { label: 'Tip', icon: '✦', accent: 'var(--ok)', bg: 'rgba(70,209,139,0.07)' },
  warning: { label: 'Warning', icon: '▲', accent: 'var(--warn)', bg: 'rgba(245,180,90,0.08)' },
} as const;

type CalloutVariant = keyof typeof CALLOUTS;

/** Admonition block: note / tip / warning. */
function Callout({
  type = 'note',
  title,
  children,
}: {
  type?: CalloutVariant;
  title?: string;
  children: ReactNode;
}) {
  const c = CALLOUTS[type] ?? CALLOUTS.note;
  return (
    <div
      style={{
        background: c.bg,
        border: '1px solid var(--line)',
        borderLeft: `2.5px solid ${c.accent}`,
        borderRadius: '0 12px 12px 0',
        padding: '16px 20px',
        margin: '8px 0 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
        <span style={{ fontSize: 15 }}>{c.icon}</span>
        <span
          style={{
            fontFamily: mono,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: c.accent,
            fontWeight: 600,
          }}
        >
          {c.label}
        </span>
      </div>
      {title && <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{title}</div>}
      <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>{children}</div>
    </div>
  );
}

/** Heading with id (from rehype-slug) and a faint hover `#` anchor that copies the section URL. */
function H2({ id, children }: { id?: string; children?: ReactNode }) {
  const copy = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!id) return;
    navigator.clipboard?.writeText(`${location.href.split('#')[0]}#${id}`).catch(() => undefined);
  };
  return (
    <h2
      id={id}
      className="grs-h2"
      style={{
        position: 'relative',
        fontWeight: 700,
        fontSize: 'clamp(21px,3vw,27px)',
        letterSpacing: '-0.01em',
        margin: '38px 0 13px',
        scrollMarginTop: 80,
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        color: 'var(--ink)',
      }}
    >
      {children}
      {id && (
        <a
          href={`#${id}`}
          onClick={copy}
          className="grs-anchor"
          aria-label="Link to this section"
          style={{ color: 'var(--accent)', textDecoration: 'none', fontFamily: mono, fontSize: '0.62em', cursor: 'pointer' }}
        >
          #
        </a>
      )}
    </h2>
  );
}

function H3({ id, children }: { id?: string; children?: ReactNode }) {
  return (
    <h3
      id={id}
      style={{ fontWeight: 600, fontSize: 'clamp(18px,2.4vw,22px)', margin: '28px 0 10px', scrollMarginTop: 80, color: 'var(--ink)' }}
    >
      {children}
    </h3>
  );
}

/** Code block figure with a copy button that reads its own rendered code text. */
function CodeFigure(props: React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);

  // Only enhance rehype-pretty-code figures; pass others through untouched.
  const isCode = 'data-rehype-pretty-code-figure' in props;
  if (!isCode) return <figure {...props} />;

  const copy = () => {
    const code = ref.current?.querySelector('code');
    if (!code) return;
    navigator.clipboard
      ?.writeText(code.textContent ?? '')
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => undefined);
  };

  return (
    <figure {...props} ref={ref as React.Ref<HTMLElement>}>
      <button className="grs-code-copy" data-copied={copied ? '1' : '0'} onClick={copy} aria-label="Copy code">
        {copied ? '✓ copied' : '⧉ copy'}
      </button>
      {props.children}
    </figure>
  );
}

export const mdxComponents = {
  Lead,
  Callout,
  h2: H2,
  h3: H3,
  figure: CodeFigure,
};
