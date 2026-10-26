import type { ReactNode } from 'react';
import s from './ui.module.css';

/**
 * `// 01 · ABOUT` eyebrow with a hairline and an optional right slot (G-chord keycaps, NEW,
 * "updated …"). `live` adds the pulsing ok dot used by Now.
 */
export function SectionMarker({
  index,
  label,
  live = false,
  right,
}: {
  index: string;
  label: string;
  live?: boolean;
  right?: ReactNode;
}) {
  return (
    <div className={s.marker}>
      {live && <span className={s.liveDot} aria-hidden />}
      <span className={s.markerLabel}>{`// ${index} · ${label.toUpperCase()}`}</span>
      <span className={s.markerLine} aria-hidden />
      {right != null && <span className={s.markerRight}>{right}</span>}
    </div>
  );
}
