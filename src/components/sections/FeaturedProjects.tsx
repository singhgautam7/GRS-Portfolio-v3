'use client';

import Link from 'next/link';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionEyebrow } from './SectionEyebrow';
import { ProjectCard } from '@/components/cards/ProjectCard';
import { projects } from '@/lib/content';
import { stats } from '@/lib/stats';
import { useRowCap } from '@/lib/hooks/useRowCap';

const mono = 'var(--font-mono)';

/**
 * Landing projects preview: newest projects, capped to a whole number of
 * complete rows (max 2) at the current breakpoint. "View all" links to the
 * full archive.
 */
export function FeaturedProjects() {
  const { ref, cap } = useRowCap({ minColPx: 280, gapPx: 14, rows: 2, max: projects.length });
  const shown = projects.slice(0, cap);

  return (
    <Section id="projects">
      <SectionEyebrow index="04" label="PROJECTS" />
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
          A few things I&apos;ve shipped.
        </h2>
        <Link
          href="/projects"
          style={{ fontFamily: mono, fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}
        >
          view all {stats.projectCount} →
        </Link>
      </Reveal>
      <div
        ref={ref}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}
      >
        {shown.map((p) => (
          <Reveal key={p.slug}>
            <ProjectCard project={p} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
