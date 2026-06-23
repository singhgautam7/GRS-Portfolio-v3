/**
 * Generic, config-driven archive filtering. The same engine powers the Projects
 * and Blog archives; each supplies its own groups + sort options. Keeping this
 * content-agnostic means the UI components and the hook never reference a
 * specific collection.
 */

export type FilterMode = 'single' | 'multi';

/** How a group's option chips are ordered. */
export type OptionOrder = 'countDesc' | 'desc' | 'fixed';

export interface FilterGroupConfig<T> {
  id: string;
  label: string;
  /** single = radio with an explicit "All"; multi = independent toggles. */
  mode: FilterMode;
  /** For multi groups: match an item if it has any / all of the selected values. */
  match?: 'any' | 'all';
  /** Render an explicit "All" chip (single mode). */
  hasAll?: boolean;
  /** Show per-value counts on chips (default true). */
  withCounts?: boolean;
  /** Horizontally scroll long option lists instead of wrapping. */
  scroll?: boolean;
  order: OptionOrder;
  /** Option order for `order: 'fixed'`. */
  fixedOrder?: string[];
  /** The values an item contributes to this group. */
  values: (item: T) => string[];
  /** Display label for a value (defaults to the value). */
  optionLabel?: (value: string) => string;
}

export interface SortOption<T> {
  id: string;
  label: string;
  compare: (a: T, b: T) => number;
}

export interface ArchiveConfig<T> {
  groups: FilterGroupConfig<T>[];
  sorts: SortOption<T>[];
  defaultSortId: string;
  searchText: (item: T) => string;
  searchPlaceholder: string;
  /** Items per page. */
  pageSize: number;
  /** Paginate results (default true). When false, all results render at once. */
  paginate?: boolean;
  /** Singular/plural noun for the count + empty state, e.g. "project". */
  noun: string;
}
