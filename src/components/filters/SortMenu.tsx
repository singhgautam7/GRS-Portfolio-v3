'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpDown, Check } from 'lucide-react';
import type { SortOption } from '@/lib/filters/types';

const mono = 'var(--font-mono)';

/** Icon button + popover for choosing the sort (used on mobile). */
export function SortMenu<T>({
  sorts,
  active,
  onSort,
}: {
  sorts: SortOption<T>[];
  active: string;
  onSort: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Sort"
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 42,
          height: 42,
          flex: 'none',
          background: 'var(--surface-2)',
          border: `1px solid ${open ? 'var(--line-2)' : 'var(--line)'}`,
          borderRadius: 10,
          cursor: 'pointer',
          color: 'var(--ink-2)',
        }}
      >
        <ArrowUpDown size={16} />
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            top: 48,
            width: 180,
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
            {'// SORT'}
          </div>
          {sorts.map((s) => {
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => {
                  onSort(s.id);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: mono,
                  fontSize: 13,
                  borderRadius: 7,
                  color: isActive ? 'var(--accent)' : 'var(--ink-2)',
                }}
              >
                {s.label}
                {isActive && <Check size={14} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
