import type { ReactNode } from 'react';
import { Reveal } from '@/components/ui/Reveal';

const mono = 'var(--font-mono)';

/** Numbered mono eyebrow: dot · `// NN · LABEL` · flex hairline, with an optional right slot. */
export function SectionEyebrow({
  index,
  label,
  pulse = false,
  right,
}: {
  index: string;
  label: string;
  pulse?: boolean;
  right?: ReactNode;
}) {
  return (
    <Reveal
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        rowGap: 10,
        flexWrap: 'wrap',
        marginBottom: right ? 18 : 30,
      }}
    >
      <span
        style={{
          width: pulse ? 8 : 7,
          height: pulse ? 8 : 7,
          borderRadius: '50%',
          background: pulse ? 'var(--ok)' : 'var(--accent)',
          animation: pulse ? 'grsdot 2.4s ease-in-out infinite' : undefined,
        }}
      />
      <span style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.2em', color: 'var(--ink-3)' }}>
        {`// ${index} · ${label}`}
      </span>
      <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
      {right}
    </Reveal>
  );
}

/** Standard landing section wrapper: centered max-width container with rhythm padding. */
export function Section({
  id,
  first = false,
  children,
}: {
  id: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: first
          ? 'clamp(60px,9vw,104px) clamp(18px,4vw,32px) 0'
          : 'clamp(56px,8vw,92px) clamp(18px,4vw,32px) 0',
      }}
    >
      {children}
    </section>
  );
}
