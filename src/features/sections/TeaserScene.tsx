'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const Inner = dynamic(() => import('./TeaserSceneInner'), { ssr: false });

/** Playground teaser: the live iso preview, loaded only when it scrolls near the viewport. */
export function TeaserScene() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es[0]?.isIntersecting && setShow(true), { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }} aria-hidden>
      {show && <Inner />}
    </div>
  );
}
