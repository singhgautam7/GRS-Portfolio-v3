'use client';

import { useState } from 'react';
import { ArrowUpRight, Check, Copy, Mail } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionEyebrow } from './SectionEyebrow';
import { SITE, SOCIALS } from '@/lib/site';

const mono = 'var(--font-mono)';

export function Contact() {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard
      ?.writeText(SITE.email)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => undefined);
  };

  return (
    <Section id="contact">
      <SectionEyebrow index="07" label="CONTACT" />
      <Reveal
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 18,
          padding: 'clamp(28px,5vw,52px)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily: mono, fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 13 }}>
          grs@infra:~$ ./connect.sh
        </div>
        <h2
          style={{
            fontWeight: 700,
            fontSize: 'clamp(26px,4.4vw,44px)',
            letterSpacing: '-0.02em',
            margin: '0 0 16px',
          }}
        >
          Let&apos;s build reliable systems.
        </h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 26,
          }}
        >
          <a
            href={`mailto:${SITE.email}`}
            className="grs-link"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              fontSize: 'clamp(15px,2.2vw,21px)',
              color: 'var(--accent)',
              textDecoration: 'none',
              fontFamily: mono,
            }}
          >
            <Mail size={18} /> {SITE.email}
          </a>
          <button
            onClick={copyEmail}
            aria-label="Copy email address"
            className="grs-ghost-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 34,
              padding: '0 12px',
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: mono,
              fontSize: 12,
              color: copied ? 'var(--ok)' : 'var(--ink-3)',
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'copied' : 'copy'}
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {SOCIALS.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="grs-ghost-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                height: 42,
                padding: '0 17px',
                border: '1px solid var(--line-2)',
                borderRadius: 10,
                color: 'var(--ink-2)',
                textDecoration: 'none',
                fontFamily: mono,
                fontSize: 13,
              }}
            >
              {s.name} <ArrowUpRight size={13} />
            </a>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
