'use client';

import { BackToHome } from '@/components/ui/BackToHome';
import { PostCard } from '@/components/cards/PostCard';
import { ArchiveView } from '@/components/filters/ArchiveView';
import { posts } from '@/lib/content';
import { postsArchiveConfig } from '@/lib/filters/postsConfig';

export function BlogClient() {
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
      <p
        style={{
          fontSize: 'clamp(15px,2.2vw,19px)',
          lineHeight: 1.55,
          color: 'var(--ink-2)',
          margin: '0 0 30px',
          maxWidth: 560,
        }}
      >
        Deep dives on systems, AI and the things I build on weekends.
      </p>

      <ArchiveView
        items={posts}
        config={postsArchiveConfig}
        layout="list"
        renderItem={(p) => <PostCard post={p} big />}
      />
    </main>
  );
}
