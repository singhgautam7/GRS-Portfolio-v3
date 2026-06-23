'use client';

import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { FilterGroup } from './FilterGroup';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import type { ResolvedGroup } from '@/lib/filters/useArchiveFilters';

const mono = 'var(--font-mono)';

/** The collapsible facet panel: one row per filter group, plus a clear-all. */
export function FilterPanel<T>({
  open,
  groups,
  activeCount,
  onToggle,
  onClearGroup,
  onClearAll,
}: {
  open: boolean;
  groups: ResolvedGroup<T>[];
  activeCount: number;
  onToggle: (groupId: string, value: string) => void;
  onClearGroup: (groupId: string) => void;
  onClearAll: () => void;
}) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="filter-panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.24, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <div
            style={{
              marginTop: 14,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 'clamp(18px,3vw,24px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {groups.map((g) => (
              <FilterGroup
                key={g.config.id}
                group={g}
                onToggle={(v) => onToggle(g.config.id, v)}
                onClear={() => onClearGroup(g.config.id)}
              />
            ))}
            {activeCount > 0 && (
              <div style={{ display: 'flex' }}>
                <button
                  onClick={onClearAll}
                  className="grs-ghost-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: mono,
                    fontSize: 12,
                    color: 'var(--ink-3)',
                    background: 'none',
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    padding: '6px 11px',
                    cursor: 'pointer',
                  }}
                >
                  <X size={13} /> Clear all
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
