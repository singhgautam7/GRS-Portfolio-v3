'use client';

import { useEffect, useRef, useState } from 'react';

interface RowCapOptions {
  /** Minimum card width in px (matches the grid's minmax()). */
  minColPx: number;
  /** Grid gap in px. */
  gapPx: number;
  /** Number of complete rows to show. */
  rows: number;
  /** Upper bound (e.g. total item count). */
  max: number;
}

/**
 * Caps a responsive card grid to a whole number of complete rows. Measures the
 * container width to derive the live column count, then returns columns*rows so
 * the preview always ends on a full row with no orphan card, at every
 * breakpoint. Recomputes on resize.
 */
export function useRowCap({ minColPx, gapPx, rows, max }: RowCapOptions) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Deterministic SSR / first-paint default (assume 3 columns) to avoid a
  // hydration mismatch; the effect then measures the real column count.
  const [cap, setCap] = useState(() => Math.min(max, rows * 3));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth;
      const cols = Math.max(1, Math.floor((w + gapPx) / (minColPx + gapPx)));
      setCap(Math.min(max, cols * rows));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [minColPx, gapPx, rows, max]);

  return { ref, cap };
}
