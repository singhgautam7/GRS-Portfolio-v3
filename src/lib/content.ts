// Import the generated JSON collections DIRECTLY rather than through Velite's
// `index.js` re-export. That re-export uses `with { type: 'json' }` import
// attributes, which webpack's dev resolver handles inconsistently (especially
// while Velite's watcher rewrites the files), causing intermittent
// "X is not exported from '#content'" errors and broken page renders. Plain JSON
// imports are resolved natively and reliably. Types still come from `#content`.
import rawJobs from '#content/jobs.json';
import rawProjects from '#content/projects.json';
import rawPosts from '#content/posts.json';
import rawCerts from '#content/certifications.json';
import rawNow from '#content/now.json';
import rawTimeline from '#content/timeline.json';
import type { Job, Project, Post, Certification, Now, TimelineEntry } from '#content';

export type { Job, Project, Post, Certification, Now, TimelineEntry };

const byDateDesc = <T extends { date: string }>(a: T, b: T) =>
  new Date(b.date).getTime() - new Date(a.date).getTime();

/** All roles, newest first. */
export const jobs: Job[] = [...(rawJobs as Job[])].sort(byDateDesc);

/** All projects, newest first. */
export const projects: Project[] = [...(rawProjects as Project[])].sort(byDateDesc);

/** Published posts, newest first (drafts excluded from the static build). */
export const posts: Post[] = [...(rawPosts as Post[])]
  .filter((p) => !p.draft)
  .sort(byDateDesc);

export const certifications: Certification[] = [...(rawCerts as Certification[])].sort(
  byDateDesc,
);

export const now: Now = rawNow as Now;

export const rawTimelineEntries: TimelineEntry[] = rawTimeline as TimelineEntry[];

/** Distinct project types, for the archive filter chips. */
export const projectTypes: string[] = Array.from(new Set(projects.map((p) => p.type)));

/** Distinct post tags, for blog filter chips. */
export const postTags: string[] = Array.from(new Set(posts.flatMap((p) => p.tags)));

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** Posts sharing at least one tag with the given post (excluding itself). */
export function relatedPosts(post: Post, limit = 2): Post[] {
  return posts
    .filter((p) => p.slug !== post.slug && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, limit);
}

/** Previous (older) and next (newer) post relative to a slug, in display order. */
export function postNeighbours(slug: string): { prev?: Post; next?: Post } {
  const i = posts.findIndex((p) => p.slug === slug);
  if (i === -1) return {};
  return { next: i > 0 ? posts[i - 1] : undefined, prev: posts[i + 1] };
}
