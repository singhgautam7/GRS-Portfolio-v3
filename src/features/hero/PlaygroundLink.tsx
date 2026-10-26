'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useChrome } from '@/components/chrome/ChromeContext';

/** A real link to /playground; with JS it plays the ⌘↵ transition first. */
export function PlaygroundLink({ className, children }: { className?: string; children: ReactNode }) {
  const { goPlayground } = useChrome();
  return (
    <Link
      href="/playground"
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        goPlayground();
      }}
    >
      {children}
    </Link>
  );
}
