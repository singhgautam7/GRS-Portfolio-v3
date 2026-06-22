'use client';

import { useMemo, useState } from 'react';
import { Reveal } from '@/components/ui/Reveal';
import { ProjectCard } from '@/components/cards/ProjectCard';
import { BackToHome } from '@/components/ui/BackToHome';
import { projects, projectTypes } from '@/lib/content';

const mono = 'var(--font-mono)';

export function ProjectsClient() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const filters = ['All', ...projectTypes];

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return projects.filter(
      (p) =>
        (filter === 'All' || p.type === filter) &&
        (!q || `${p.title} ${p.excerpt} ${p.tech.join(' ')}`.toLowerCase().includes(q)),
    );
  }, [query, filter]);

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
        Project <span style={{ color: 'var(--accent)' }}>Archive</span>
      </h1>
      <p style={{ fontSize: 'clamp(15px,2.2vw,19px)', lineHeight: 1.55, color: 'var(--ink-2)', margin: '0 0 30px', maxWidth: 560 }}>
        Everything I&apos;ve built worth showing. Products, client work, open-source packages and
        experiments.
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
            placeholder="Search projects…"
            aria-label="Search projects"
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
          {filters.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
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
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {visible.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 14 }}>
          {visible.map((p) => (
            <Reveal key={p.slug}>
              <ProjectCard project={p} />
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
            marginTop: 6,
          }}
        >
          {'// no projects match that filter'}
        </div>
      )}
    </main>
  );
}
