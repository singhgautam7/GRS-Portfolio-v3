'use client';

import { useEffect, useRef } from 'react';

/** A 2px accent gradient bar fixed under the navbar tracking page scroll. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const se = document.scrollingElement || document.documentElement;
      const max = se.scrollHeight - se.clientHeight;
      const top = se.scrollTop || window.scrollY || 0;
      const p = max > 0 ? Math.min(100, (top / max) * 100) : 0;
      el.style.width = `${p.toFixed(1)}%`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 58,
        left: 0,
        height: 2,
        width: '0%',
        background: 'linear-gradient(90deg,var(--accent),var(--accent-2))',
        zIndex: 49,
        boxShadow: '0 0 8px -1px var(--accent)',
      }}
    />
  );
}
