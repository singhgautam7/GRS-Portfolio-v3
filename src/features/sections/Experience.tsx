'use client';

import { useState } from 'react';
import { Chip } from '@/components/ui/Chip';
import type { Job } from '@/lib/content';
import s from './sections.module.css';

/** Expandable timeline; entries toggle independently, with expand / collapse all. */
export function Experience({ jobs }: { jobs: Job[] }) {
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(jobs.filter((j) => j.current).map((j) => j.slug)),
  );
  const toggle = (slug: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(slug)) n.delete(slug);
      else n.add(slug);
      return n;
    });
  return (
    <>
      <div className={s.titleRow}>
        <h2 id="exp-h" className={s.h2}>
          A few places I’ve grown.
        </h2>
        <div style={{ display: 'flex', gap: 18 }}>
          <button
            type="button"
            className={s.linkBtn}
            onClick={() => setOpen(new Set(jobs.map((j) => j.slug)))}
          >
            expand all
          </button>
          <button type="button" className={s.linkBtn} onClick={() => setOpen(new Set())}>
            collapse all
          </button>
        </div>
      </div>
      <div className={s.timeline}>
        <div className={s.rail} aria-hidden />
        {jobs.map((j) => {
          const isOpen = open.has(j.slug);
          return (
            <div key={j.slug} className={s.job} data-open={isOpen} data-current={j.current}>
              <span className={s.jobDot} aria-hidden />
              <button
                type="button"
                className={s.jobHead}
                aria-expanded={isOpen}
                aria-controls={`job-${j.slug}`}
                onClick={() => toggle(j.slug)}
              >
                <span className={s.range}>{j.range.replace(/\s+-\s+/, ' to ')}</span>
                <span className={s.jobTitles}>
                  <span className={s.jobTitle}>
                    {j.title}
                    {j.current && <span className={s.nowBadge}>NOW</span>}
                  </span>
                  <span className={s.company}>{j.company}</span>
                </span>
                <span className={s.chev} aria-hidden>
                  ›
                </span>
              </button>
              <div className={s.collapse} data-open={isOpen} inert={!isOpen}>
                <div className={s.collapseInner}>
                  <div id={`job-${j.slug}`} className={s.jobBody}>
                    <div className={s.jobRule} />
                    {j.location && <span className={s.loc}>{j.location}</span>}
                    <ul className={s.points}>
                      {j.points.map((p) => (
                        <li key={p} className={s.point}>
                          <span className={s.arrow} aria-hidden>
                            →
                          </span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                    <div className={s.tags}>
                      {j.stack.map((t) => (
                        <Chip key={t} variant="tag">
                          {t}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
