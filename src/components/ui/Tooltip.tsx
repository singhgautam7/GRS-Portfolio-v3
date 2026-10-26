import { cloneElement, useId } from 'react';
import type { ReactElement, ReactNode } from 'react';
import s from './ui.module.css';

/**
 * Ink bubble above its trigger, with an arrow (the design's mute-key nudge). Shown only while
 * `open`; the trigger gets aria-describedby while it is visible.
 */
export function Tooltip({
  open,
  content,
  align = 'center',
  children,
}: {
  open: boolean;
  content: ReactNode;
  align?: 'center' | 'end';
  children: ReactElement<{ 'aria-describedby'?: string }>;
}) {
  const id = useId();
  return (
    <span className={s.tipAnchor}>
      {open ? cloneElement(children, { 'aria-describedby': id }) : children}
      {open && (
        <span id={id} role="tooltip" className={s.tip} data-align={align}>
          {content}
        </span>
      )}
    </span>
  );
}
