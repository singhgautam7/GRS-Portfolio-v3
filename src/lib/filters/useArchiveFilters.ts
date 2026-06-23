'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ArchiveConfig, FilterGroupConfig } from './types';

export interface GroupOption {
  value: string;
  label: string;
  count: number;
}

export interface ResolvedGroup<T> {
  config: FilterGroupConfig<T>;
  options: GroupOption[];
  selected: string[];
  /** "All" is active (single-mode groups with hasAll, nothing selected). */
  allActive: boolean;
  allCount: number;
}

/**
 * The archive filtering engine: search + per-group facets + sort + pagination.
 * Counts are global (per value across all items), matching the design. Changing
 * any filter, the query, or the sort resets to page 1.
 */
export function useArchiveFilters<T>(items: T[], config: ArchiveConfig<T>) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [sortId, setSortId] = useState(config.defaultSortId);
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search, selected, sortId]);

  // Global counts: group id -> value -> number of items with that value.
  const counts = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const g of config.groups) {
      const c: Record<string, number> = {};
      for (const item of items) for (const v of g.values(item)) c[v] = (c[v] ?? 0) + 1;
      map[g.id] = c;
    }
    return map;
  }, [items, config.groups]);

  const orderValues = (g: FilterGroupConfig<T>): string[] => {
    const c = counts[g.id] ?? {};
    const present = Object.keys(c);
    if (g.order === 'fixed') return (g.fixedOrder ?? present).filter((v) => present.includes(v));
    if (g.order === 'desc') return present.sort((a, b) => b.localeCompare(a));
    // countDesc: by count desc, ties alphabetical
    return present.sort((a, b) => c[b]! - c[a]! || a.localeCompare(b));
  };

  const groups: ResolvedGroup<T>[] = useMemo(
    () =>
      config.groups.map((g) => {
        const sel = selected[g.id] ?? [];
        return {
          config: g,
          options: orderValues(g).map((value) => ({
            value,
            label: g.optionLabel ? g.optionLabel(value) : value,
            count: counts[g.id]?.[value] ?? 0,
          })),
          selected: sel,
          allActive: Boolean(g.hasAll) && sel.length === 0,
          allCount: items.length,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.groups, selected, counts, items.length],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (q && !config.searchText(item).toLowerCase().includes(q)) return false;
      for (const g of config.groups) {
        const sel = selected[g.id] ?? [];
        if (sel.length === 0) continue;
        const vals = g.values(item);
        if (g.mode === 'single') {
          if (!sel.some((s) => vals.includes(s))) return false;
        } else if ((g.match ?? 'any') === 'all') {
          if (!sel.every((s) => vals.includes(s))) return false;
        } else if (!sel.some((s) => vals.includes(s))) {
          return false;
        }
      }
      return true;
    });
  }, [items, search, selected, config]);

  const sorted = useMemo(() => {
    const s = config.sorts.find((x) => x.id === sortId) ?? config.sorts[0];
    return s ? [...filtered].sort(s.compare) : filtered;
  }, [filtered, sortId, config.sorts]);

  const paginate = config.paginate !== false;
  const pageCount = paginate ? Math.max(1, Math.ceil(sorted.length / config.pageSize)) : 1;
  const currentPage = Math.min(page, pageCount);
  const results = paginate
    ? sorted.slice((currentPage - 1) * config.pageSize, currentPage * config.pageSize)
    : sorted;

  const activeCount = Object.values(selected).reduce((n, vs) => n + vs.length, 0);

  const toggle = (groupId: string, value: string) => {
    const g = config.groups.find((x) => x.id === groupId);
    if (!g) return;
    setSelected((prev) => {
      const cur = prev[groupId] ?? [];
      if (g.mode === 'single') {
        return { ...prev, [groupId]: cur.includes(value) ? [] : [value] };
      }
      return {
        ...prev,
        [groupId]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
      };
    });
  };

  const clearGroup = (groupId: string) =>
    setSelected((prev) => ({ ...prev, [groupId]: [] }));

  const clearAll = () => {
    setSelected({});
    setSearch('');
  };

  return {
    search,
    setSearch,
    groups,
    toggle,
    clearGroup,
    clearAll,
    activeCount,
    sortId,
    setSortId,
    sorts: config.sorts,
    page: currentPage,
    setPage,
    pageCount,
    panelOpen,
    setPanelOpen,
    results,
    total: items.length,
    filteredCount: sorted.length,
    noun: config.noun,
    searchPlaceholder: config.searchPlaceholder,
  };
}

export type ArchiveFilters<T> = ReturnType<typeof useArchiveFilters<T>>;
