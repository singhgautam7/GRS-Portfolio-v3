import Link from 'next/link';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionEyebrow } from './SectionEyebrow';
import { PostCard } from '@/components/cards/PostCard';
import { posts } from '@/lib/content';

const mono = 'var(--font-mono)';

export function RecentPosts() {
  const recent = posts.slice(0, 2);
  return (
    <Section id="posts">
      <SectionEyebrow index="05" label="WRITING" />
      <Reveal
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 22,
        }}
      >
        <h2 style={{ fontWeight: 700, fontSize: 'clamp(24px,3.4vw,34px)', letterSpacing: '-0.02em', margin: 0 }}>
          Notes &amp; case studies.
        </h2>
        <Link
          href="/blog"
          style={{ fontFamily: mono, fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}
        >
          all posts →
        </Link>
      </Reveal>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {recent.map((p) => (
          <Reveal key={p.slug}>
            <PostCard post={p} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
