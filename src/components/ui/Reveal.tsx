'use client';

import { useEffect, useRef } from 'react';
import type { ElementType, ReactNode } from 'react';

/**
 * Lifts a block into view once (opacity + 16px translateY) when it crosses the
 * viewport. A 1500ms safety timer force-reveals anything still hidden. Honors
 * reduced motion via the .grs-reveal CSS rules.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  className = '',
  style,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.revealed = '1';
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);

    const safety = window.setTimeout(() => {
      if (el.dataset.revealed !== '1') el.dataset.revealed = '1';
    }, 1500);

    return () => {
      io.disconnect();
      window.clearTimeout(safety);
    };
  }, []);

  return (
    <Tag ref={ref} className={`grs-reveal ${className}`} style={style}>
      {children}
    </Tag>
  );
}
