'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { Section, SectionEyebrow } from './SectionEyebrow';
import { jobs } from '@/lib/content';
import type { Job } from '@/lib/content';

const mono = 'var(--font-mono)';

/**
 * Experience: collapsible rows, newest first. Each row toggles independently
 * (no accordion); the current role starts open. Expand all / Collapse all
 * controls live in the section header, not in any entry.
 */
export function Experience() {
  const [open, setOpen] = useState<Set<string>>(
    () => new Set([jobs.find((j) => j.current)?.slug ?? jobs[0]?.slug ?? '']),
  );

  const toggle = (slug: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  const expandAll = () => setOpen(new Set(jobs.map((j) => j.slug)));
  const collapseAll = () => setOpen(new Set());

  return (
    <Section id="experience">
      <SectionEyebrow index="03" label="EXPERIENCE" />
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
          A few places I&apos;ve grown.
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={expandAll} style={controlStyle} aria-label="Expand all experience entries">
            expand all <ChevronsUpDown size={13} />
          </button>
          <button onClick={collapseAll} style={controlStyle} aria-label="Collapse all experience entries">
            collapse all <ChevronsDownUp size={13} />
          </button>
        </div>
      </Reveal>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {jobs.map((job) => (
          <Reveal
            key={job.slug}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <ExperienceRow job={job} open={open.has(job.slug)} onToggle={() => toggle(job.slug)} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

const controlStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  fontFamily: mono,
  fontSize: 13,
  color: 'var(--accent)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
};

function ExperienceRow({ job, open, onToggle }: { job: Job; open: boolean; onToggle: () => void }) {
  const reduced = useReducedMotion();
  return (
    <>
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          gap: 16,
          padding: '20px 22px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--ink)',
        }}
      >
        <div
          className="grs-exp-content-wrapper"
          style={{
            display: 'flex',
            flex: 1,
            minWidth: 0,
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <span
            className="grs-exp-date"
            style={{
              fontFamily: mono,
              fontSize: 12,
              color: 'var(--ink-3)',
              paddingTop: 4,
              whiteSpace: 'nowrap',
              minWidth: 116,
            }}
          >
            {job.range}
          </span>
          <span className="grs-exp-details" style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 17, fontWeight: 600 }}>{job.title}</span>
            </span>
            <span style={{ display: 'block', color: 'var(--accent)', fontSize: 13.5, marginTop: 3 }}>
              {job.company}
            </span>
          </span>
        </div>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: reduced ? 0 : 0.22, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ color: 'var(--ink-3)', alignSelf: 'center', display: 'inline-flex', flex: 'none' }}
        >
          <ChevronRight size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 22px 22px' }}>
              <div style={{ height: 1, background: 'var(--line)', marginBottom: 16 }} />
          <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--ink-3)', marginBottom: 13 }}>
            ◍ {job.location}
          </div>
          <ul
            style={{
              margin: '0 0 16px',
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {job.points.map((pt) => (
              <li
                key={pt}
                style={{ display: 'flex', gap: 11, fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)' }}
              >
                <span style={{ color: 'var(--accent)', fontFamily: mono, flex: 'none' }}>→</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {job.stack.map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  color: 'var(--ink-3)',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  padding: '4px 9px',
                }}
              >
                {t}
              </span>
            ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
