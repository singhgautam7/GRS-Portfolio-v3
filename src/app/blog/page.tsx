import type { Metadata } from 'next';
import { BlogClient } from './BlogClient';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Deep dives on systems, AI and the things Gautam builds on weekends.',
  alternates: { canonical: '/blog' },
};

export default function BlogPage() {
  return <BlogClient />;
}
