'use client';

import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { SortControl } from './SortControl';
import { SortMenu } from './SortMenu';
import type { SortOption } from '@/lib/filters/types';

const mono = 'var(--font-mono)';

/**
 * Archive controls. On desktop: search, a Filters text button, the
 * filtered/total count, and a segmented SORT control. On mobile: search with a
 * compact filter-icon button and a sort dropdown to its right (no count).
 */
export function FilterBar<T>({
  search,
  onSearch,
  placeholder,
  panelOpen,
  onTogglePanel,
  activeCount,
  filteredCount,
  total,
  sorts,
  sortId,
  onSort,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder: string;
  panelOpen: boolean;
  onTogglePanel: () => void;
  activeCount: number;
  filteredCount: number;
  total: number;
  sorts: SortOption<T>[];
  sortId: string;
  onSort: (id: string) => void;
}) {
  const filterBadge =
    activeCount > 0 ? (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 18,
          height: 18,
          padding: '0 5px',
          borderRadius: 999,
          background: 'var(--accent)',
          color: 'var(--accent-ink)',
          fontSize: 11,
        }}
      >
        {activeCount}
      </span>
    ) : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', rowGap: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flex: '1 1 220px',
          minWidth: 200,
          maxWidth: 340,
          background: 'var(--surface-2)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          padding: '0 13px',
          height: 42,
        }}
      >
        <Search size={15} style={{ color: 'var(--ink-3)', flex: 'none' }} />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--ink)',
            fontFamily: mono,
            fontSize: 13,
          }}
        />
      </div>

      {/* Mobile: icon controls in the search row */}
      <div className="fb-mobile">
        <button
          onClick={onTogglePanel}
          aria-label="Filters"
          aria-expanded={panelOpen}
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 42,
            height: 42,
            flex: 'none',
            background: 'var(--surface-2)',
            border: `1px solid ${activeCount > 0 || panelOpen ? 'var(--line-2)' : 'var(--line)'}`,
            borderRadius: 10,
            cursor: 'pointer',
            color: 'var(--ink-2)',
          }}
        >
          <SlidersHorizontal size={16} />
          {activeCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -5,
                right: -5,
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 999,
                background: 'var(--accent)',
                color: 'var(--accent-ink)',
                fontSize: 10,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activeCount}
            </span>
          )}
        </button>
        <SortMenu sorts={sorts} active={sortId} onSort={onSort} />
      </div>

      {/* Desktop: Filters text button + count */}
      <div className="fb-desktop">
        <button
          onClick={onTogglePanel}
          aria-expanded={panelOpen}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            height: 42,
            padding: '0 14px',
            background: 'var(--surface-2)',
            border: `1px solid ${activeCount > 0 || panelOpen ? 'var(--line-2)' : 'var(--line)'}`,
            borderRadius: 10,
            cursor: 'pointer',
            color: 'var(--ink-2)',
            fontFamily: mono,
            fontSize: 13,
          }}
        >
          <SlidersHorizontal size={15} />
          Filters
          {filterBadge}
          <ChevronDown
            size={15}
            style={{ transition: 'transform .2s', transform: panelOpen ? 'rotate(180deg)' : 'none' }}
          />
        </button>
        <span style={{ fontFamily: mono, fontSize: 13, color: 'var(--ink-3)' }}>
          {filteredCount} / {total}
        </span>
      </div>

      {/* Desktop: segmented SORT, pushed right */}
      <div className="fb-sort-desktop" style={{ marginLeft: 'auto' }}>
        <SortControl sorts={sorts} active={sortId} onSort={onSort} />
      </div>
    </div>
  );
}
