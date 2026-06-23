import type { Project } from '@/lib/content';
import type { ArchiveConfig } from './types';

const byDate = (dir: 1 | -1) => (a: Project, b: Project) =>
  dir * (new Date(a.date).getTime() - new Date(b.date).getTime());

export const projectsArchiveConfig: ArchiveConfig<Project> = {
  noun: 'project',
  searchPlaceholder: 'Search projects…',
  pageSize: 9,
  paginate: false,
  searchText: (p) => `${p.title} ${p.excerpt} ${p.tech.join(' ')} ${p.type}`,
  groups: [
    {
      id: 'type',
      label: 'TYPE',
      mode: 'single',
      hasAll: true,
      order: 'fixed',
      fixedOrder: ['Personal', 'Client', 'Product', 'OSS'],
      values: (p) => [p.type],
    },
    {
      id: 'tech',
      label: 'TECH',
      mode: 'multi',
      match: 'any',
      scroll: true,
      order: 'countDesc',
      values: (p) => p.tech,
    },
    {
      id: 'year',
      label: 'YEAR',
      mode: 'multi',
      match: 'any',
      scroll: true,
      order: 'desc',
      values: (p) => [p.year],
    },
    {
      id: 'links',
      label: 'LINKS',
      mode: 'multi',
      match: 'all',
      withCounts: false,
      order: 'fixed',
      fixedOrder: ['demo', 'code'],
      optionLabel: (v) => (v === 'demo' ? 'Has demo' : 'Has code'),
      values: (p) => [...(p.external ? ['demo'] : []), ...(p.github ? ['code'] : [])],
    },
  ],
  sorts: [
    { id: 'newest', label: 'Newest', compare: byDate(-1) },
    { id: 'oldest', label: 'Oldest', compare: byDate(1) },
    { id: 'az', label: 'A-Z', compare: (a, b) => a.title.localeCompare(b.title) },
  ],
  defaultSortId: 'newest',
};
