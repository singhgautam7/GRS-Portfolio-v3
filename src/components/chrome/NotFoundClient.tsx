'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, Sparkles } from 'lucide-react';
import { useChrome } from './ChromeContext';

const mono = 'var(--font-mono)';

/** Terminal-card 404: a faux `cd: No such file or directory` transcript + exits. */
export function NotFoundClient() {
  const pathname = usePathname();
  const router = useRouter();
  const { openPalette } = useChrome();
  const badPath = pathname && pathname !== '/' ? pathname : '/somewhere';

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 58px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px clamp(18px,4vw,32px)',
        animation: 'grsfade .3s ease',
      }}
    >
      <div style={{ width: '100%', maxWidth: 620 }}>
        <div
          style={{
            border: '1px solid var(--line-2)',
            borderRadius: 14,
            overflow: 'hidden',
            background: 'var(--surface)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 15px',
              borderBottom: '1px solid var(--line)',
              background: 'var(--surface-2)',
            }}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--line-2)' }} />
            ))}
            <span style={{ fontFamily: mono, fontSize: 11.5, color: 'var(--ink-3)', marginLeft: 8 }}>
              grs@infra ~ 404
            </span>
          </div>
          <div style={{ padding: '26px 24px', fontFamily: mono, fontSize: 13.5, lineHeight: 1.8, color: 'var(--ink-2)' }}>
            <div>
              <span style={{ color: 'var(--ink-3)' }}>grs@infra:~$</span> cd{' '}
              <span style={{ color: 'var(--ink)' }}>{badPath}</span>
            </div>
            <div style={{ color: 'var(--warn)' }}>bash: cd: {badPath}: No such file or directory</div>
            <div style={{ marginTop: 14 }}>
              <span style={{ color: 'var(--ink-3)' }}>grs@infra:~$</span>{' '}
              <span style={{ color: 'var(--ink)' }}>whereis page</span>
            </div>
            <div>
              page: <span style={{ color: 'var(--accent)' }}>not found</span>, but the good stuff is one
              command away.
            </div>
            <div style={{ marginTop: 14, color: 'var(--ink-3)' }}># try one of these:</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 42,
              padding: '0 18px',
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            <Home size={16} /> Home
          </Link>
          <button
            onClick={openPalette}
            className="grs-ghost-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 42,
              padding: '0 18px',
              background: 'var(--surface-2)',
              color: 'var(--ink-2)',
              border: '1px solid var(--line-2)',
              borderRadius: 10,
              cursor: 'pointer',
              fontFamily: mono,
              fontSize: 13,
            }}
          >
            <Search size={15} /> Jump to ⌘K
          </button>
          <button
            onClick={() => router.push('/ask')}
            className="grs-ghost-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 42,
              padding: '0 18px',
              background: 'var(--surface-2)',
              color: 'var(--ink-2)',
              border: '1px solid var(--line-2)',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            <Sparkles size={15} /> Ask me anything
          </button>
        </div>
      </div>
    </main>
  );
}
