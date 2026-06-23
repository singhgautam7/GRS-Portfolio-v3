import { FilterChip } from './FilterChip';
import type { ResolvedGroup } from '@/lib/filters/useArchiveFilters';

const mono = 'var(--font-mono)';

/**
 * A labeled filter row: a mono group label and its option chips. Single-mode
 * groups get an explicit "All" chip; long lists scroll horizontally.
 */
export function FilterGroup<T>({
  group,
  onToggle,
  onClear,
}: {
  group: ResolvedGroup<T>;
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  const { config, options, selected, allActive, allCount } = group;
  const withCounts = config.withCounts !== false;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0 }}>
      <span
        style={{
          fontFamily: mono,
          fontSize: 11,
          letterSpacing: '0.14em',
          color: 'var(--ink-3)',
          flex: 'none',
          width: 52,
          paddingTop: 8,
        }}
      >
        {config.label}
      </span>
      <div
        className={config.scroll ? 'grs-rail' : undefined}
        style={{
          display: 'flex',
          gap: 8,
          minWidth: 0,
          flexWrap: config.scroll ? 'nowrap' : 'wrap',
          overflowX: config.scroll ? 'auto' : 'visible',
          paddingBottom: config.scroll ? 4 : 0,
        }}
      >
        {config.hasAll && (
          <FilterChip
            label="All"
            count={withCounts ? allCount : undefined}
            active={allActive}
            onClick={onClear}
          />
        )}
        {options.map((opt) => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            count={withCounts ? opt.count : undefined}
            active={selected.includes(opt.value)}
            onClick={() => onToggle(opt.value)}
          />
        ))}
      </div>
    </div>
  );
}
