import { Fragment } from 'react';
import { Keycap2D, ModKey } from '@/components/ui/Keycap2D';
import type { KeycapSize } from '@/components/ui/Keycap2D';
import s from './palette.module.css';

/** Renders registry legend tokens: 'mod' → ⌘/Ctrl, 'then' → chord separator. */
export function KeyCombo({ keys, accent = [], size = 'md' }: { keys: string[]; accent?: string[]; size?: KeycapSize }) {
  return (
    <span className={s.rowKeys} aria-hidden>
      {keys.map((k, i) =>
        k === 'then' ? (
          <span key={i} className={s.then}>
            then
          </span>
        ) : (
          <Fragment key={i}>
            <Keycap2D size={size} tone={accent.includes(k) ? 'accent' : 'plain'}>
              {k === 'mod' ? <ModKey /> : k}
            </Keycap2D>
          </Fragment>
        ),
      )}
    </span>
  );
}
