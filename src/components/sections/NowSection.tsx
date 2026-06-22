import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionEyebrow } from './SectionEyebrow';
import { now } from '@/lib/content';

const mono = 'var(--font-mono)';

export function NowSection() {
  return (
    <Section id="now">
      <SectionEyebrow
        index="06"
        label="NOW"
        pulse
        right={
          <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--ink-3)' }}>
            updated {now.lastUpdated}
          </span>
        }
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }}>
        {now.sections.map((n) => (
          <Reveal
            key={n.title}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 22,
            }}
          >
            <div
              style={{
                fontFamily: mono,
                fontSize: 11,
                letterSpacing: '0.14em',
                color: 'var(--accent)',
                marginBottom: 13,
              }}
            >
              {n.title}
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 13px' }}>
              {n.description}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {n.tags.map((t) => (
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
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
