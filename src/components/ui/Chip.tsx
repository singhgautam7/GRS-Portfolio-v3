import type { ComponentPropsWithoutRef } from 'react';
import s from './ui.module.css';

type ChipProps =
  | ({ variant: 'pill' } & ComponentPropsWithoutRef<'button'>)
  | ({ variant: 'tag' | 'tagFilled' | 'cap' } & ComponentPropsWithoutRef<'span'>);

/**
 * pill: tappable question / suggestion (a button). tag: outlined mono label. tagFilled: tech
 * stack label. cap: skill keycap. Only `pill` is interactive.
 */
export function Chip({ className, ...rest }: ChipProps) {
  const cls = className ? `${s.chip} ${className}` : s.chip;
  if (rest.variant === 'pill') {
    const { variant, ...btn } = rest;
    return <button type="button" {...btn} data-variant={variant} className={cls} />;
  }
  const { variant, ...span } = rest;
  return <span {...span} data-variant={variant} className={cls} />;
}
