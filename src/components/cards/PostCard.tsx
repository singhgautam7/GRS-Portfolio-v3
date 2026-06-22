import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Post } from '@/lib/content';

const mono = 'var(--font-mono)';

/** Blog post card — links to the reader. `big` is used on the blog index. */
export function PostCard({ post, big = false }: { post: Post; big?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="grs-card-btn"
      style={{
        textAlign: 'left',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: big ? 26 : 24,
        cursor: 'pointer',
        color: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        gap: big ? 13 : 12,
        textDecoration: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          fontFamily: mono,
          fontSize: 11,
          color: 'var(--ink-3)',
        }}
      >
        <span>{post.displayDate}</span>
        <span>·</span>
        <span>{post.readingTime}</span>
      </div>
      <h3 style={{ fontSize: big ? 22 : 21, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
        {post.title}
      </h3>
      <p style={{ fontSize: big ? 15 : 14.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>
        {post.tldr}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
        {post.tags.map((t) => (
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
        {!big && (
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: mono,
              fontSize: 12,
              color: 'var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            read <ArrowUpRight size={12} />
          </span>
        )}
      </div>
    </Link>
  );
}
