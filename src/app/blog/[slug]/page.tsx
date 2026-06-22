import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { posts, getPost, relatedPosts, postNeighbours } from '@/lib/content';
import { PostReader } from '@/components/blog/PostReader';
import type { PostNeighbour } from '@/components/blog/PostReader';
import { SITE } from '@/lib/site';

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const ogImage = `/og/og-${post.slug}.png`;
  return {
    title: post.title,
    description: post.tldr,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.tldr,
      url: `${SITE.url}/blog/${post.slug}`,
      publishedTime: post.date,
      tags: post.tags,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.tldr,
      images: [ogImage],
    },
  };
}

const toNeighbour = (p: ReturnType<typeof getPost>): PostNeighbour | undefined =>
  p ? { slug: p.slug, title: p.title, displayDate: p.displayDate, readingTime: p.readingTime } : undefined;

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { prev, next } = postNeighbours(post.slug);
  const related = relatedPosts(post).map((p) => toNeighbour(p)!);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.tldr,
    datePublished: post.date,
    author: { '@type': 'Person', name: SITE.name, url: SITE.url },
    keywords: post.tags.join(', '),
    url: `${SITE.url}/blog/${post.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PostReader
        title={post.title}
        displayDate={post.displayDate}
        readingTime={post.readingTime}
        kind={post.kind}
        tags={post.tags}
        tldr={post.tldr}
        body={post.body}
        toc={post.toc.map((t) => ({ title: t.title, url: t.url }))}
        prev={toNeighbour(prev)}
        next={toNeighbour(next)}
        related={related}
      />
    </>
  );
}
