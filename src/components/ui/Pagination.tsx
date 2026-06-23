'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

const mono = 'var(--font-mono)';

/** Page-number pagination with prev/next. Renders nothing for a single page. */
export function Pagination({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
}) {
  if (pageCount <= 1) return null;

  const go = (p: number) => {
    onPage(Math.min(pageCount, Math.max(1, p)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cell = (active: boolean): React.CSSProperties => ({
    minWidth: 38,
    height: 38,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 10px',
    borderRadius: 9,
    cursor: 'pointer',
    fontFamily: mono,
    fontSize: 13,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
    background: active ? 'var(--accent)' : 'var(--surface-2)',
    color: active ? 'var(--accent-ink)' : 'var(--ink-2)',
  });

  return (
    <nav
      aria-label="Pagination"
      style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40, flexWrap: 'wrap' }}
    >
      <button
        onClick={() => go(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        style={{ ...cell(false), opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'default' : 'pointer' }}
      >
        <ChevronLeft size={16} />
      </button>
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => go(p)} aria-current={p === page} style={cell(p === page)}>
          {p}
        </button>
      ))}
      <button
        onClick={() => go(page + 1)}
        disabled={page === pageCount}
        aria-label="Next page"
        style={{
          ...cell(false),
          opacity: page === pageCount ? 0.4 : 1,
          cursor: page === pageCount ? 'default' : 'pointer',
        }}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
