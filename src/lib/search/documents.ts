import { projects, posts, jobs, now } from '@/lib/content';
import { timeline } from '@/lib/timeline';

/**
 * A single searchable document. The same documents power both the assistant's
 * Layer-2 content search and the blog search box. New `.mdx`/content added later
 * is indexed automatically on rebuild, with no code changes.
 */
export interface SearchDoc {
  id: string;
  type: 'project' | 'post' | 'job' | 'now' | 'timeline';
  title: string;
  body: string;
  tags: string[];
  /** Internal route or named section for navigation. */
  href: string;
  /** External link, when the best action is to open off-site. */
  external?: string;
}

/** Build the full document set from every Velite collection (pure, isomorphic). */
export function buildDocuments(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const p of projects) {
    docs.push({
      id: `project:${p.slug}`,
      type: 'project',
      title: p.title,
      body: `${p.excerpt} ${p.summary} ${p.tech.join(' ')} ${p.type}`,
      tags: [...p.tech, p.type],
      href: '/projects/',
      external: p.external ?? p.github,
    });
  }

  for (const post of posts) {
    docs.push({
      id: `post:${post.slug}`,
      type: 'post',
      title: post.title,
      body: `${post.tldr} ${post.excerpt} ${post.tags.join(' ')}`,
      tags: post.tags,
      href: `/blog/${post.slug}/`,
    });
  }

  for (const job of jobs) {
    docs.push({
      id: `job:${job.slug}`,
      type: 'job',
      title: `${job.title} at ${job.company}`,
      body: `${job.summary} ${job.points.join(' ')} ${job.stack.join(' ')}`,
      tags: job.stack,
      href: '/#experience',
    });
  }

  for (const section of now.sections) {
    docs.push({
      id: `now:${section.title}`,
      type: 'now',
      title: `Now: ${section.title}`,
      body: `${section.description} ${section.tags.join(' ')}`,
      tags: section.tags,
      href: '/#now',
    });
  }

  for (const item of timeline) {
    docs.push({
      id: `timeline:${item.id}`,
      type: 'timeline',
      title: item.title,
      body: `${item.org} ${item.desc}`,
      tags: [item.kind],
      href: '/timeline/',
    });
  }

  return docs;
}
