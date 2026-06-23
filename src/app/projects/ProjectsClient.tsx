'use client';

import { BackToHome } from '@/components/ui/BackToHome';
import { ProjectCard } from '@/components/cards/ProjectCard';
import { ArchiveView } from '@/components/filters/ArchiveView';
import { projects } from '@/lib/content';
import { projectsArchiveConfig } from '@/lib/filters/projectsConfig';

export function ProjectsClient() {
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
      <p
        style={{
          fontSize: 'clamp(15px,2.2vw,19px)',
          lineHeight: 1.55,
          color: 'var(--ink-2)',
          margin: '0 0 30px',
          maxWidth: 560,
        }}
      >
        Everything I&apos;ve built worth showing. Products, client work, open-source packages and
        experiments.
      </p>

      <ArchiveView
        items={projects}
        config={projectsArchiveConfig}
        layout="grid"
        renderItem={(p) => <ProjectCard project={p} />}
      />
    </main>
  );
}
