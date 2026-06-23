'use client';

import { useRouter } from 'next/navigation';
import { HeroLauncher } from './HeroLauncher';

/**
 * Renders the idle hero launcher. When a query or chip is submitted,
 * it redirects directly to the dedicated /askme page seeded with the query
 * so that it opens with full chat history and persistence.
 */
export function HeroChatShell() {
  const router = useRouter();

  const openWith = (q: string) => {
    router.push(`/askme?q=${encodeURIComponent(q)}`);
  };

  return <HeroLauncher onAsk={openWith} />;
}
