'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { MDXContent } from './MDXContent';
import '@/components/blog/blog.css';

const mono = 'var(--font-mono)';

export interface TocItem {
  title: string;
  url: string;
}

export interface PostNeighbour {
  slug: string;
  title: string;
  displayDate?: string;
  readingTime?: string;
}

export interface PostReaderProps {
  title: string;
  displayDate: string;
  readingTime: string;
  kind: string;
  tags: string[];
  tldr: string;
  body: string;
  toc: TocItem[];
  prev?: PostNeighbour;
  next?: PostNeighbour;
  related: PostNeighbour[];
}

export function PostReader({
  title,
  displayDate,
  readingTime,
  kind,
  tags,
  tldr,
  body,
  toc,
  prev,
  next,
  related,
}: PostReaderProps) {
  const [active, setActive] = useState(toc[0]?.url.replace('#', '') ?? '');

  // Scroll-spy over the rendered headings.
  useEffect(() => {
    if (toc.length === 0) return;
    const ids = toc.map((t) => t.url.replace('#', ''));
    const onScroll = () => {
      let current = ids[0] ?? '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) current = id;
      }
      setActive(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [toc]);

  const goHeading = (url: string) => {
    const el = document.getElementById(url.replace('#', ''));
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const y = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <main style={{ animation: 'grsfade .4s ease' }}>
      <div
        className="grs-reader-grid"
        style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(30px,5vw,60px) clamp(18px,4vw,32px) 110px' }}
      >
        <article style={{ minWidth: 0 }}>
          <Link
            href="/blog"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              color: 'var(--ink-2)',
              fontFamily: mono,
              fontSize: 13,
              marginBottom: 24,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} /> Back to all blogs
          </Link>
          <div style={{ fontFamily: mono, fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>
            {displayDate} · {readingTime} · {kind}
          </div>
          <h1
            style={{
              fontWeight: 700,
              fontSize: 'clamp(28px,5vw,46px)',
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              margin: '0 0 18px',
            }}
          >
            {title}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 26 }}>
            {tags.map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  color: 'var(--accent)',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  padding: '3px 9px',
                }}
              >
                #{t}
              </span>
            ))}
          </div>
          <div
            style={{
              background: 'var(--surface)',
              borderLeft: '2px solid var(--accent)',
              borderRadius: '0 12px 12px 0',
              padding: '18px 22px',
              marginBottom: 32,
            }}
          >
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.14em', color: 'var(--ink-3)', marginBottom: 8 }}>
              TL;DR
            </div>
            <p style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>{tldr}</p>
          </div>

          <div className="grs-prose">
            <MDXContent code={body} />
          </div>

          {(prev || next) && (
            <div style={{ display: 'flex', gap: 12, marginTop: 48, flexWrap: 'wrap' }}>
              {prev && (
                <Link href={`/blog/${prev.slug}`} className="grs-card-btn" style={neighbourStyle('left')}>
                  <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--ink-3)', marginBottom: 6 }}>← previous</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{prev.title}</div>
                </Link>
              )}
              {next && (
                <Link href={`/blog/${next.slug}`} className="grs-card-btn" style={neighbourStyle('right')}>
                  <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--ink-3)', marginBottom: 6 }}>next →</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{next.title}</div>
                </Link>
              )}
            </div>
          )}

          {related.length > 0 && (
            <div style={{ marginTop: 40, paddingTop: 28, borderTop: '1px solid var(--line)' }}>
              <div
                style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.16em', color: 'var(--ink-3)', marginBottom: 16 }}
              >
                {'// RELATED POSTS'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    className="grs-card-btn"
                    style={{
                      textAlign: 'left',
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      borderRadius: 12,
                      padding: 18,
                      color: 'var(--ink)',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>
                      {r.displayDate} · {r.readingTime}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{r.title}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        <nav className="grs-toc" style={{ position: 'sticky', top: 80 }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-3)', marginBottom: 13 }}>
            {'// ON THIS PAGE'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {toc.map((t) => {
              const isActive = active === t.url.replace('#', '');
              return (
                <button
                  key={t.url}
                  onClick={() => goHeading(t.url)}
                  style={{
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'var(--line)'}`,
                    cursor: 'pointer',
                    padding: '6px 0 6px 12px',
                    fontSize: 13,
                    lineHeight: 1.4,
                    color: isActive ? 'var(--accent)' : 'var(--ink-3)',
                  }}
                >
                  {t.title}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </main>
  );
}

const neighbourStyle = (align: 'left' | 'right'): React.CSSProperties => ({
  flex: '1 1 200px',
  textAlign: align,
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  padding: '16px 18px',
  color: 'var(--ink)',
  textDecoration: 'none',
});
