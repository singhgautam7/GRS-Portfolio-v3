import type { Metadata } from 'next';
import { Playground } from '@/features/playground/ui/Playground';

export const metadata: Metadata = {
  title: 'System Design Playground',
  description: 'Push traffic through load balancers, servers, caches and databases you can scale, break and fix. No system-design knowledge needed.',
  alternates: { canonical: '/playground/' },
};

/** Its own route: the engine, scene and UI never ship in the landing bundle. */
export default function PlaygroundPage() {
  return <Playground />;
}
