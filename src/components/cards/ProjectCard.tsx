import { ArrowUpRight } from 'lucide-react';
import type { Project } from '@/lib/content';

const mono = 'var(--font-mono)';

/**
 * Project card: TYPE badge + year, title, excerpt, tech tags, and `live ↗` /
 * `code ↗` links (each hidden when its URL is absent).
 */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span
          style={{
            fontFamily: mono,
            fontSize: 11,
            color: 'var(--accent)',
            border: '1px solid var(--line-2)',
            borderRadius: 6,
            padding: '3px 8px',
          }}
        >
          {project.type}
        </span>
        <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--ink-3)' }}>{project.year}</span>
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 9px' }}>{project.title}</h3>
      <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 16px', flex: 1 }}>
        {project.excerpt}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {project.tech.map((t) => (
          <span
            key={t}
            style={{
              fontFamily: mono,
              fontSize: 11,
              color: 'var(--ink-3)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '3px 8px',
            }}
          >
            {t}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, fontFamily: mono, fontSize: 12 }}>
        {project.external && (
          <a
            href={project.external}
            target="_blank"
            rel="noopener noreferrer"
            className="grs-link"
            style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}
          >
            live <ArrowUpRight size={12} />
          </a>
        )}
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="grs-link"
            style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}
          >
            code <ArrowUpRight size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
