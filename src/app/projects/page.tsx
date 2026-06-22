import type { Metadata } from 'next';
import { ProjectsClient } from './ProjectsClient';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'The full archive of Gautam Singh’s projects: products, client work, OSS and experiments.',
  alternates: { canonical: '/projects' },
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}
