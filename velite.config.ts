import { defineConfig, defineCollection, s } from 'velite';
import rehypeSlug from 'rehype-slug';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';

/**
 * Velite content collections.
 *
 * Every content type is a "drop a Markdown/MDX file in a folder" workflow.
 * Schemas are validated at build time and fail loudly. Generated types live in
 * `.velite` and are imported via the `#content` path alias.
 *
 * Field names intentionally mirror the v2 front-matter where possible so the
 * migration is faithful. See docs/content-schema.md for the full contract.
 */

const rehypePrettyCodeOptions = {
  theme: { dark: 'github-dark-dimmed', light: 'github-light' },
  keepBackground: false,
  defaultLang: 'plaintext',
};

/** Slug computed from the file path, e.g. projects/ai-reader/index.md -> ai-reader. */
const slugFrom = (prefix: string) =>
  s
    .path()
    .transform((p) => p.replace(new RegExp(`^${prefix}/`), '').replace(/\/index$/, ''));

/** Markdown body collapsed to a single plain-text line (timeline + assistant). */
const summary = () => s.raw().transform((raw) => raw.replace(/\s+/g, ' ').trim());

const jobs = defineCollection({
  name: 'Job',
  pattern: 'jobs/**/index.md',
  schema: s
    .object({
      slug: slugFrom('jobs'),
      title: s.string(), // role
      company: s.string(),
      location: s.string().optional().default(''),
      range: s.string(), // "Apr 2025 - Present"
      date: s.isodate(), // start date, used for ordering
      url: s.string().url().optional(),
      current: s.boolean().default(false),
      stack: s.array(s.string()).default([]),
      points: s.array(s.string()).default([]),
      // Whether to surface this role on the timeline, and its importance there.
      timeline: s.boolean().default(true),
      major: s.boolean().default(true),
      summary: summary(),
    })
    .transform((data) => ({ ...data, collection: 'job' as const })),
});

const projects = defineCollection({
  name: 'Project',
  pattern: 'projects/**/index.md',
  schema: s
    .object({
      slug: slugFrom('projects'),
      title: s.string(),
      date: s.isodate(),
      year: s.string().optional(), // display year; derived from date if absent
      type: s.enum(['Personal', 'Client', 'Product', 'OSS']),
      tech: s.array(s.string()).default([]),
      external: s.string().url().optional(),
      github: s.string().url().optional(),
      excerpt: s.string(), // short card description
      timeline: s.boolean().default(false),
      major: s.boolean().default(false),
      summary: summary(),
    })
    .transform((data) => ({
      ...data,
      year: data.year ?? new Date(data.date).getFullYear().toString(),
      collection: 'project' as const,
    })),
});

const posts = defineCollection({
  name: 'Post',
  pattern: 'posts/**/*.{md,mdx}',
  schema: s
    .object({
      slug: slugFrom('posts'),
      title: s.string(),
      date: s.isodate(),
      displayDate: s.string().optional(), // "Feb 2026"; derived if absent
      tldr: s.string(),
      tags: s.array(s.string()).default([]),
      kind: s.string().default('case study'),
      draft: s.boolean().default(false),
      timeline: s.boolean().default(false),
      major: s.boolean().default(false),
      metadata: s.metadata(), // reading time + word count
      excerpt: s.excerpt(),
      content: s.markdown(),
      body: s.mdx(),
      toc: s.toc(),
    })
    .transform((data) => ({
      ...data,
      displayDate:
        data.displayDate ??
        new Date(data.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      readingTime: `${Math.max(1, Math.round(data.metadata.readingTime))} min read`,
      collection: 'post' as const,
    })),
});

const certifications = defineCollection({
  name: 'Certification',
  pattern: 'certifications/**/*.md',
  schema: s
    .object({
      slug: slugFrom('certifications'),
      title: s.string(),
      issuer: s.string(),
      date: s.isodate(),
      url: s.string().url().optional(),
      points: s.array(s.string()).default([]),
      timeline: s.boolean().default(true),
      major: s.boolean().default(false),
      summary: summary(),
    })
    .transform((data) => ({ ...data, collection: 'certification' as const })),
});

const now = defineCollection({
  name: 'Now',
  pattern: 'now/index.md',
  single: true,
  schema: s.object({
    lastUpdated: s.string(),
    sections: s
      .array(
        s.object({
          title: s.string(),
          description: s.string(),
          tags: s.array(s.string()).default([]),
        }),
      )
      .default([]),
  }),
});

/**
 * Hand-authored timeline entries — these are life/personal milestones that are
 * NOT derivable from jobs/projects/certs (e.g. "Moved to Bangalore"). Career,
 * project and cert entries are derived in the lib layer and merged with these.
 */
const timeline = defineCollection({
  name: 'TimelineEntry',
  pattern: 'timeline/**/*.md',
  schema: s
    .object({
      date: s.isodate(),
      displayDate: s.string().optional(),
      title: s.string(),
      org: s.string().optional().default(''),
      type: s.enum(['job', 'project', 'life', 'milestone', 'cert']),
      importance: s.enum(['major', 'minor']).default('major'),
      body: s.string().optional().default(''),
    })
    .transform((data) => ({ ...data, source: 'timeline' as const })),
});

export default defineConfig({
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash:6].[ext]',
    clean: true,
  },
  collections: { jobs, projects, posts, certifications, now, timeline },
  mdx: {
    remarkPlugins: [remarkGfm],
    // rehype-slug adds ids; custom MDX h2/h3 components render the hover anchor.
    rehypePlugins: [rehypeSlug, [rehypePrettyCode, rehypePrettyCodeOptions]],
  },
});
