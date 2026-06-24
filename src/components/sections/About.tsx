import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionEyebrow } from './SectionEyebrow';
import { stats } from '@/lib/stats';

const mono = 'var(--font-mono)';

const statCard = (label: string, body: React.ReactNode) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
    <div
      style={{
        fontFamily: mono,
        fontSize: 11,
        letterSpacing: '0.14em',
        color: 'var(--ink-3)',
        marginBottom: 9,
      }}
    >
      {label}
    </div>
    {body}
  </div>
);

export function About() {
  return (
    <Section id="about" first>
      <SectionEyebrow index="01" label="ABOUT" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))',
          gap: 'clamp(26px,5vw,56px)',
          alignItems: 'start',
        }}
      >
        <Reveal>
          <h2
            style={{
              fontWeight: 700,
              fontSize: 'clamp(26px,4vw,38px)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              margin: '0 0 18px',
            }}
          >
            I build systems that stay up, and tools that make teams faster.
          </h2>
          <p style={{ fontSize: 16.5, lineHeight: 1.65, color: 'var(--ink-2)', margin: '0 0 15px' }}>
            {stats.experienceLabel} years across backend development, cloud infrastructure and
            scalable systems. At HashiCorp (IBM) I engineer and operate high-availability HVD
            clusters in Go, automate operations with Terraform and Kubernetes, and build developer
            tooling that drives efficiency.
          </p>
          <p style={{ fontSize: 16.5, lineHeight: 1.65, color: 'var(--ink-2)', margin: 0 }}>
            I care about practical impact: reducing operational risk, improving performance, and
            making infrastructure safer so products ship with confidence.
          </p>
        </Reveal>

        <Reveal as="div" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
          {statCard(
            'EXPERIENCE',
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {stats.experienceLabel.replace('+', '')}
              <span style={{ color: 'var(--accent)', fontSize: 18 }}>+ yrs</span>
            </div>,
          )}
          {statCard(
            'ROLES',
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {stats.roleCount}
            </div>,
          )}
          {statCard(
            'PROJECTS',
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {stats.projectCount}
            </div>,
          )}
          {statCard(
            'PyPI PACKAGES',
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {stats.pypiPackages}
            </div>,
          )}
          {statCard(
            'APPS SHIPPED',
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {stats.appsShipped}
            </div>,
          )}
          {statCard(
            'NOW',
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, marginTop: 5 }}>
              HVD clusters
              <br />
              <span style={{ color: 'var(--ink-3)', fontWeight: 400, fontSize: 12.5 }}>
                Go · K8s · Terraform
              </span>
            </div>,
          )}
        </Reveal>
      </div>


    </Section>
  );
}
