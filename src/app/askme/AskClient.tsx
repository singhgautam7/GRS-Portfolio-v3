'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Assistant } from '@/components/assistant/Assistant';
import { useSessionChips } from '@/lib/hooks/useSessionChips';
import { useSiteNav } from '@/lib/navigation';

export function AskClient() {
  const router = useRouter();
  const params = useSearchParams();
  const chips = useSessionChips();
  const { goRouteValue } = useSiteNav();

  // Capture the deep-link seed once. The query is then stripped from the URL so
  // a reload (with history now persisted) does not re-ask and duplicate it.
  const [seed] = useState<string | undefined>(() => params.get('q') ?? undefined);
  const strippedRef = useRef(false);
  useEffect(() => {
    if (seed && !strippedRef.current) {
      strippedRef.current = true;
      router.replace('/askme');
    }
  }, [seed, router]);

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
          persist
          onClose={close}
          onRoute={(value) => goRouteValue(value)}
        />
      </div>
    </main>
  );
}
