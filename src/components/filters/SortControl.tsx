import type { SortOption } from '@/lib/filters/types';

const mono = 'var(--font-mono)';

/** SORT label + segmented buttons (Newest / Oldest / A-Z). */
export function SortControl<T>({
  sorts,
  active,
  onSort,
}: {
  sorts: SortOption<T>[];
  active: string;
  onSort: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.14em', color: 'var(--ink-3)' }}>
        SORT
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        {sorts.map((s) => {
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSort(s.id)}
              aria-pressed={isActive}
              style={{
                fontFamily: mono,
                fontSize: 12.5,
                cursor: 'pointer',
                padding: '7px 13px',
                borderRadius: 8,
                whiteSpace: 'nowrap',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--line)'}`,
                background: isActive ? 'var(--accent)' : 'var(--surface-2)',
                color: isActive ? 'var(--accent-ink)' : 'var(--ink-2)',
                transition: 'border-color .15s, color .15s, background .15s',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
