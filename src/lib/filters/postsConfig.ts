import type { Post } from '@/lib/content';
import type { ArchiveConfig } from './types';

const year = (iso: string) => new Date(iso).getFullYear().toString();
const byDate = (dir: 1 | -1) => (a: Post, b: Post) =>
  dir * (new Date(a.date).getTime() - new Date(b.date).getTime());

export const postsArchiveConfig: ArchiveConfig<Post> = {
  noun: 'post',
  searchPlaceholder: 'Search posts…',
  pageSize: 6,
  searchText: (p) => `${p.title} ${p.tldr} ${p.tags.join(' ')}`,
  groups: [
    {
      id: 'tag',
      label: 'TAG',
      mode: 'multi',
      match: 'any',
      scroll: true,
      order: 'countDesc',
      values: (p) => p.tags,
    },
    {
      id: 'year',
      label: 'YEAR',
      mode: 'multi',
      match: 'any',
      scroll: true,
      order: 'desc',
      values: (p) => [year(p.date)],
    },
  ],
  sorts: [
    { id: 'newest', label: 'Newest', compare: byDate(-1) },
    { id: 'oldest', label: 'Oldest', compare: byDate(1) },
    { id: 'az', label: 'A-Z', compare: (a, b) => a.title.localeCompare(b.title) },
  ],
  defaultSortId: 'newest',
};
