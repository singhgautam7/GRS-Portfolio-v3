'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Download, Moon, Search, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useChrome } from './ChromeContext';
import { useSiteNav } from '@/lib/navigation';
import { SITE } from '@/lib/site';

const mono = "var(--font-mono)";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { openPalette } = useChrome();
  const { goSection } = useSiteNav();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--line)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: '0 clamp(18px,4vw,32px)',
          height: 58,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <button
          onClick={() => goSection('home')}
          aria-label="Home"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              border: '1.5px solid var(--accent)',
              borderRadius: 8,
              color: 'var(--accent)',
              fontFamily: mono,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            G
          </span>
          <span
            style={{
              fontFamily: mono,
              fontWeight: 600,
              fontSize: 15,
              letterSpacing: '0.13em',
              color: 'var(--ink)',
            }}
          >
            {SITE.shortName}
          </span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <button
            onClick={openPalette}
            className="grs-nav-btn"
            style={{ ...navBtnStyle, gap: 10 }}
            aria-label="Open command palette"
          >
            <Search size={14} style={{ color: 'var(--ink-3)' }} /> Jump to{' '}
            <span
              style={{
                border: '1px solid var(--line)',
                borderRadius: 5,
                padding: '1px 6px',
                fontSize: 11,
                color: 'var(--ink-3)',
              }}
            >
              ⌘K
            </span>
          </button>
          <a
            href={SITE.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="grs-resume-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              height: 36,
              padding: '0 15px',
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              border: 'none',
              borderRadius: 9,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            <Download size={14} /> Resume
          </a>
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Theme"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="grs-nav-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                borderRadius: 9,
                cursor: 'pointer',
                color: 'var(--ink-2)',
              }}
            >
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            {menuOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 44,
                  width: 228,
                  background: 'var(--surface)',
                  border: '1px solid var(--line-2)',
                  borderRadius: 11,
                  boxShadow: 'var(--shadow)',
                  padding: 8,
                  zIndex: 60,
                }}
              >
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    color: 'var(--ink-3)',
                    padding: '6px 8px',
                  }}
                >
                  {'// MODE'}
                </div>
                <ThemeRow
                  icon={<Moon size={15} />}
                  label="AMOLED Dark"
                  active={theme === 'dark'}
                  onClick={() => {
                    setTheme('dark');
                    setMenuOpen(false);
                  }}
                />
                <ThemeRow
                  icon={<Sun size={15} />}
                  label="Light"
                  active={theme === 'light'}
                  onClick={() => {
                    setTheme('light');
                    setMenuOpen(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

const navBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  height: 36,
  padding: '0 13px',
  background: 'var(--surface-2)',
  border: '1px solid var(--line)',
  borderRadius: 9,
  cursor: 'pointer',
  color: 'var(--ink-2)',
  fontFamily: mono,
  fontSize: 12.5,
};

function ThemeRow({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="menuitemradio"
      aria-checked={active}
      onClick={onClick}
      style={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 8px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 13,
        borderRadius: 7,
        color: active ? 'var(--accent)' : 'var(--ink-2)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        {icon}
        {label}
      </span>
      {active && <Check size={14} />}
    </button>
  );
}
