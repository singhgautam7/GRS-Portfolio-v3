'use client';

import type { ReactNode } from 'react';
import { Reveal } from '@/components/ui/Reveal';
import { Pagination } from '@/components/ui/Pagination';
import { FilterBar } from './FilterBar';
import { FilterPanel } from './FilterPanel';
import { useArchiveFilters } from '@/lib/filters/useArchiveFilters';
import type { ArchiveConfig } from '@/lib/filters/types';

const mono = 'var(--font-mono)';

/**
 * A complete filtered + sorted + paginated archive: the filter bar, the
 * collapsible facet panel, the results (grid or list), an empty state and
 * pagination. Pages supply the items, a config and a per-item renderer.
 */
export function ArchiveView<T extends { slug: string }>({
  items,
  config,
  layout,
  renderItem,
}: {
  items: T[];
  config: ArchiveConfig<T>;
  layout: 'grid' | 'list';
  renderItem: (item: T) => ReactNode;
}) {
  const f = useArchiveFilters(items, config);

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <FilterBar
          search={f.search}
          onSearch={f.setSearch}
          placeholder={f.searchPlaceholder}
          panelOpen={f.panelOpen}
          onTogglePanel={() => f.setPanelOpen(!f.panelOpen)}
          activeCount={f.activeCount}
          filteredCount={f.filteredCount}
          total={f.total}
          sorts={f.sorts}
          sortId={f.sortId}
          onSort={f.setSortId}
        />
        <FilterPanel
          open={f.panelOpen}
          groups={f.groups}
          activeCount={f.activeCount}
          onToggle={f.toggle}
          onClearGroup={f.clearGroup}
          onClearAll={f.clearAll}
        />
      </div>

      {f.results.length > 0 ? (
        <div
          style={
            layout === 'grid'
              ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 14 }
              : { display: 'flex', flexDirection: 'column', gap: 13 }
          }
        >
          {f.results.map((item) => (
            <Reveal key={item.slug}>{renderItem(item)}</Reveal>
          ))}
        </div>
      ) : (
        <div
          style={{
            fontFamily: mono,
            fontSize: 13,
            color: 'var(--ink-3)',
            padding: 30,
            border: '1px dashed var(--line)',
            borderRadius: 12,
          }}
        >
          {`// no ${f.noun}s match those filters`}
        </div>
      )}

      <Pagination page={f.page} pageCount={f.pageCount} onPage={f.setPage} />
    </>
  );
}
