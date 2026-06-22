'use client';

import { ArrowUpRight, Keyboard } from 'lucide-react';
import { useChrome } from '@/components/chrome/ChromeContext';
import { SOCIALS, DEPLOYED_AT } from '@/lib/site';

const mono = 'var(--font-mono)';

export function Footer() {
  const { openShortcuts } = useChrome();
  return (
    <footer style={{ borderTop: '1px solid var(--line)', marginTop: 'clamp(72px,12vw,128px)' }}>
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: '34px clamp(18px,4vw,32px) 30px',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 26,
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div style={{ fontFamily: mono, fontSize: 13, color: 'var(--ink-2)' }}>
            grs@infra:~$ <span style={{ color: 'var(--ink)' }}>echo &quot;© 2026 Gautam Singh&quot;</span>
            <span
              data-blink
              style={{
                display: 'inline-block',
                width: 7,
                height: 13,
                background: 'var(--accent)',
                marginLeft: 6,
                verticalAlign: 'middle',
                animation: 'grsblink 1.1s steps(1) infinite',
              }}
            />
          </div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 11.5,
              color: 'var(--ink-3)',
              marginTop: 10,
              lineHeight: 1.6,
            }}
          >
            Built with Next.js, TypeScript &amp; an on-device assistant.
            <br />
            No tracking. Runs offline.
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 10.5,
              letterSpacing: '0.14em',
              color: 'var(--ink-3)',
              marginBottom: 11,
            }}
          >
            CONNECT
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: mono,
                  fontSize: 12,
                  color: 'var(--ink-2)',
                  textDecoration: 'none',
                  border: '1px solid var(--line)',
                  borderRadius: 7,
                  padding: '5px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {s.name} <ArrowUpRight size={12} />
              </a>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <button
            onClick={openShortcuts}
            style={{
              fontFamily: mono,
              fontSize: 12,
              color: 'var(--ink-2)',
              background: 'none',
              border: '1px solid var(--line)',
              borderRadius: 7,
              padding: '6px 11px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Keyboard size={13} /> shortcuts <span style={{ color: 'var(--ink-3)' }}>?</span>
          </button>
          <span
            style={{
              fontFamily: mono,
              fontSize: 11,
              color: 'var(--ink-faint)',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)' }} />
            deployed {DEPLOYED_AT} · v3
          </span>
        </div>
      </div>
    </footer>
  );
}
