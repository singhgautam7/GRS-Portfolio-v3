'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Assistant } from '@/components/assistant/Assistant';
import { useSessionChips } from '@/lib/hooks/useSessionChips';
import { useSiteNav } from '@/lib/navigation';

export function AskClient() {
  const router = useRouter();
  const params = useSearchParams();
  const chips = useSessionChips();
  const { goRouteValue } = useSiteNav();
  const seed = params.get('q') ?? undefined;

  const close = () => {
    if (window.history.length > 1) router.back();
    else router.push('/');
  };

  return (
    <main
      style={{ height: 'calc(100vh - 58px)', animation: 'grsfade .3s ease' }}
      data-screen-label="Ask Me Anything"
    >
      <div style={{ maxWidth: 840, margin: '0 auto', height: '100%' }}>
        <Assistant
          chips={chips}
          seed={seed}
          onClose={close}
          onRoute={(value) => goRouteValue(value)}
        />
      </div>
    </main>
  );
}
