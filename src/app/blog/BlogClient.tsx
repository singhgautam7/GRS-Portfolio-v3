'use client';

import { useEffect, useMemo, useState } from 'react';
import { Reveal } from '@/components/ui/Reveal';
import { PostCard } from '@/components/cards/PostCard';
import { BackToHome } from '@/components/ui/BackToHome';
import { posts, postTags } from '@/lib/content';
import { searchContent } from '@/lib/search';

const mono = 'var(--font-mono)';

export function BlogClient() {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('All');
  // null = no active text query; otherwise an ordered list of matching slugs.
  const [hitSlugs, setHitSlugs] = useState<string[] | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHitSlugs(null);
      return;
    }
    let cancelled = false;
    searchContent(q, { type: 'post', limit: 20 }).then((hits) => {
      if (!cancelled) setHitSlugs(hits.map((h) => h.id.replace('post:', '')));
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const tags = ['All', ...postTags];

  const visible = useMemo(() => {
    let list = posts.filter((p) => tag === 'All' || p.tags.includes(tag));
    if (hitSlugs) {
      const order = new Map(hitSlugs.map((s, i) => [s, i] as const));
      list = list.filter((p) => order.has(p.slug)).sort((a, b) => order.get(a.slug)! - order.get(b.slug)!);
    }
    return list;
  }, [tag, hitSlugs]);

  return (
    <main
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: 'clamp(36px,6vw,68px) clamp(18px,4vw,32px) 90px',
        animation: 'grsfade .4s ease',
      }}
    >
      <BackToHome />
      <h1
        style={{
          fontWeight: 700,
          fontSize: 'clamp(32px,6vw,52px)',
          letterSpacing: '-0.03em',
          lineHeight: 1.02,
          margin: '0 0 16px',
        }}
      >
        The <span style={{ color: 'var(--accent)' }}>Blog</span>
      </h1>
      <p style={{ fontSize: 'clamp(15px,2.2vw,19px)', lineHeight: 1.55, color: 'var(--ink-2)', margin: '0 0 30px', maxWidth: 560 }}>
        Deep dives on systems, AI and the things I build on weekends.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 26 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flex: 1,
            minWidth: 230,
            maxWidth: 340,
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '0 13px',
            height: 42,
          }}
        >
          <span style={{ color: 'var(--ink-3)' }}>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts…"
            aria-label="Search posts"
            style={{
              flex: 1,
              minWidth: 0,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--ink)',
              fontFamily: mono,
              fontSize: 13,
            }}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tags.map((t) => {
            const active = tag === t;
            return (
              <button
                key={t}
                onClick={() => setTag(t)}
                style={{
                  fontFamily: mono,
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: '7px 13px',
                  borderRadius: 8,
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                  background: active ? 'var(--accent)' : 'var(--surface-2)',
                  color: active ? 'var(--accent-ink)' : 'var(--ink-2)',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {visible.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {visible.map((p) => (
            <Reveal key={p.slug}>
              <PostCard post={p} big />
            </Reveal>
          ))}
        </div>
      ) : (
        <div
          style={{
            fontFamily: mono,
            fontSize: 13,
            color: 'var(--ink-3)',
            padding: 30,
            border: '1px dashed var(--line)',
            borderRadius: 12,
          }}
        >
          {'// no posts match that filter'}
        </div>
      )}
    </main>
  );
}
