import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionEyebrow } from './SectionEyebrow';
import { SKILL_GROUPS } from '@/lib/site';

const mono = 'var(--font-mono)';

export function Skills() {
  return (
    <Section id="skills">
      <SectionEyebrow index="02" label="SKILLS" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
          gap: 14,
        }}
      >
        {SKILL_GROUPS.map((g) => (
          <Reveal
            key={g.label}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div
              style={{
                fontFamily: mono,
                fontSize: 11,
                letterSpacing: '0.14em',
                color: 'var(--accent)',
                marginBottom: 15,
              }}
            >
              {g.label}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {g.items.map((s) => (
                <span
                  key={s}
                  style={{
                    fontFamily: mono,
                    fontSize: 12.5,
                    color: 'var(--ink-2)',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    borderRadius: 7,
                    padding: '5px 10px',
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
