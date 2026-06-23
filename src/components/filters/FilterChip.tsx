const mono = 'var(--font-mono)';

/** A single filter chip: label, optional global count, active state. */
export function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        fontFamily: mono,
        fontSize: 12.5,
        cursor: 'pointer',
        padding: '7px 13px',
        borderRadius: 8,
        whiteSpace: 'nowrap',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
        background: active ? 'var(--accent)' : 'var(--surface-2)',
        color: active ? 'var(--accent-ink)' : 'var(--ink-2)',
        transition: 'border-color .15s, color .15s, background .15s',
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{ fontSize: 11, color: active ? 'var(--accent-ink)' : 'var(--ink-3)', opacity: 0.85 }}>
          {count}
        </span>
      )}
    </button>
  );
}
