'use client';

import { useSyncExternalStore } from 'react';
import { getInput } from '@/input';
import { Keycap2D, ModKey } from '@/components/ui/Keycap2D';
import s from './hero.module.css';

const subscribe = (fn: () => void) => getInput().subscribe(fn);
const realSeen = () => getInput().getState().realSeen;

/** OS-aware invitation that becomes "There you go." after the first real input. */
export function HintLine() {
  const real = useSyncExternalStore(subscribe, realSeen, () => false);
  return (
    <div className={s.hint} data-kbd-hint aria-hidden>
      {real ? (
        <span className={s.hintOn}>
          <span className={s.hintDot} />
          There you go.
        </span>
      ) : (
        <span className={s.hintOff}>
          Go on, press a key. Hold{' '}
          <Keycap2D>
            <ModKey />
          </Keycap2D>{' '}
          to see what it can do.
        </span>
      )}
    </div>
  );
}
