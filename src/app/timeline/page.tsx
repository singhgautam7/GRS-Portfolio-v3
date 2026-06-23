import type { Metadata } from 'next';
import { Reveal } from '@/components/ui/Reveal';
import { timeline } from '@/lib/timeline';
import type { TimelineKind } from '@/lib/timeline';

const mono = 'var(--font-mono)';

export const metadata: Metadata = {
  title: 'Timeline',
  description: 'A chronological journey through Gautam Singh’s roles, projects and milestones.',
  alternates: { canonical: '/timeline' },
};

const KIND_COLOR: Record<TimelineKind, string> = {
  ROLE: 'var(--accent)',
  PROJECT: 'var(--accent-2)',
  CERT: 'var(--ok)',
  LIFE: 'var(--warn)',
};

const KIND_BG: Record<TimelineKind, string> = {
  ROLE: 'rgba(90,160,255,0.12)',
  PROJECT: 'rgba(143,196,255,0.12)',
  CERT: 'rgba(70,209,139,0.12)',
  LIFE: 'rgba(245,180,90,0.14)',
};

const LEGEND: Array<{ color: string; label: string }> = [
  { color: 'var(--accent)', label: 'Role' },
  { color: 'var(--accent-2)', label: 'Project' },
  { color: 'var(--ok)', label: 'Certification' },
  { color: 'var(--warn)', label: 'Milestone' },
];

export default function TimelinePage() {
  return (
    <main
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: 'clamp(36px,6vw,68px) clamp(18px,4vw,32px) 90px',
        animation: 'grsfade .4s ease',
      }}
    >
      <h1
        style={{
          fontWeight: 700,
          fontSize: 'clamp(32px,6vw,52px)',
          letterSpacing: '-0.03em',
          lineHeight: 1.02,
          margin: '0 0 16px',
        }}
      >
        Career <span style={{ color: 'var(--accent)' }}>Timeline</span>
      </h1>
      <p
        style={{
          fontSize: 'clamp(15px,2.2vw,19px)',
          lineHeight: 1.55,
          color: 'var(--ink-2)',
          margin: '0 0 18px',
          maxWidth: 560,
        }}
      >
        A chronological journey through my roles, projects and certifications. Growth, impact, and a
        habit of building.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 44 }}>
        {LEGEND.map((l) => (
          <span
            key={l.label}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: mono, fontSize: 11.5, color: 'var(--ink-3)' }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${l.color}` }} />
            {l.label}
          </span>
        ))}
      </div>

      <div style={{ position: 'relative', paddingLeft: 34 }}>
        <div
          style={{
            position: 'absolute',
            left: 6,
            top: 8,
            bottom: 8,
            width: 2,
            background: 'linear-gradient(var(--line-2),var(--line))',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {timeline.map((ev) =>
            ev.major ? (
              <Reveal key={ev.id} style={{ position: 'relative', padding: '14px 0' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: -33.5,
                    top: 19,
                    width: 15,
                    height: 15,
                    borderRadius: '50%',
                    background: KIND_COLOR[ev.kind],
                    boxShadow: `0 0 0 4px var(--bg), 0 0 14px -1px ${KIND_COLOR[ev.kind]}`,
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 9, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: mono, fontSize: 11.5, color: 'var(--ink-2)', letterSpacing: '0.06em', fontWeight: 500 }}>
                    {ev.displayDate}
                  </span>
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      padding: '2px 8px',
                      borderRadius: 5,
                      color: KIND_COLOR[ev.kind],
                      background: KIND_BG[ev.kind],
                      border: '1px solid var(--line)',
                    }}
                  >
                    {ev.kind}
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '0.14em', color: 'var(--ink-faint)' }}>
                    MILESTONE
                  </span>
                </div>
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line-2)',
                    borderRadius: 14,
                    padding: '18px 20px',
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>{ev.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--accent)', marginTop: 3 }}>{ev.org}</div>
                  {ev.points.length > 0 ? (
                    <ul
                      style={{
                        margin: '12px 0 0',
                        padding: 0,
                        listStyle: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      {ev.points.map((pt) => (
                        <li
                          key={pt}
                          style={{ display: 'flex', gap: 10, fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)' }}
                        >
                          <span style={{ color: 'var(--accent)', fontFamily: mono, flex: 'none' }}>→</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    ev.desc && (
                      <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)', margin: '11px 0 0' }}>
                        {ev.desc}
                      </p>
                    )
                  )}
                </div>
              </Reveal>
            ) : (
              <Reveal
                key={ev.id}
                style={{
                  position: 'relative',
                  padding: '9px 0',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 13,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: -31,
                    top: 14,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--bg)',
                    border: `1.5px solid ${KIND_COLOR[ev.kind]}`,
                    boxShadow: '0 0 0 4px var(--bg)',
                  }}
                />
                <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.06em', minWidth: 64 }}>
                  {ev.displayDate}
                </span>
                <span style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--ink)' }}>{ev.title}</span>
                <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{ev.org}</span>
              </Reveal>
            ),
          )}
        </div>
      </div>
    </main>
  );
}
