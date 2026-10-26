'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Download } from 'lucide-react';
import { getInput } from '@/input';
import { SITE } from '@/lib/site';
import { usePrefs } from '@/features/keyboards/prefs';
import s from './hero.module.css';

/** Presses go through the input layer as pointer input (sound when unmuted, never shortcuts). */
function press(code: string, key: string) {
  return {
    onPointerDown: () => getInput().synthetic(code, key, true, 'pointer'),
    onPointerUp: () => getInput().synthetic(code, key, false, 'pointer'),
    onPointerLeave: () => getInput().synthetic(code, key, false, 'pointer'),
  };
}

function Key({ href, cls, code, k, children, external }: { href: string; cls: string; code: string; k: string; children: ReactNode; external?: boolean }) {
  return external ? (
    <a href={href} className={cls} {...press(code, k)}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls} {...press(code, k)}>
      {children}
    </Link>
  );
}

/**
 * Mobile hero (4a / 7e): oversized keycaps that act as buttons, styled in the active keyboard's
 * look through [data-kb] (pure CSS, no three.js on phones).
 */
export function MobileCluster() {
  const { variant } = usePrefs();
  return (
    <div className={s.cluster} data-kb={variant}>
      <Key href="#projects" cls={`${s.ck} ${s.ckA}`} code="KeyP" k="p">
        <span className={s.ckLeg}>P</span>
        <span className={s.ckLabel}>
          Projects <span className={s.mono}>→</span>
        </span>
      </Key>
      <Key href={SITE.resumeUrl} cls={`${s.ck} ${s.ckM}`} code="KeyR" k="r" external>
        <Download size={16} />
        <span className={s.ckLabel}>Resume</span>
      </Key>
      <Key href="/playground" cls={`${s.ck} ${s.ckC}`} code="Enter" k="Enter">
        <span className={s.ckRun}>
          <span className={s.ckLeg}>run</span>
          <span className={s.ckBig}>Open the playground</span>
        </span>
        <span className={s.ckEnter}>↵</span>
      </Key>
    </div>
  );
}
