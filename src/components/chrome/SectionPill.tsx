'use client';

import { usePathname } from 'next/navigation';
import { useActiveSection } from '@/lib/hooks/useActiveSection';
import { SECTIONS } from '@/lib/navigation';

/** Bottom-right mono pill showing the active section (home only, hidden on hero). */
export function SectionPill() {
  const pathname = usePathname();
  const active = useActiveSection();

  if (pathname !== '/') return null;
  const label = SECTIONS.find((s) => s.id === active)?.label ?? 'Home';
  const visible = active !== 'home';

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        right: 18,
        bottom: 18,
        zIndex: 48,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--surface)',
        border: '1px solid var(--line-2)',
        borderRadius: 999,
        padding: '7px 14px',
        boxShadow: 'var(--shadow)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--ink-2)',
        opacity: visible ? 1 : 0,
        transition: 'opacity .3s',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}
      />
      {label}
    </div>
  );
}
