import type { ComponentPropsWithoutRef } from 'react';
import s from './ui.module.css';

interface Common {
  variant?: 'primary' | 'secondary' | 'outline' | 'accent';
  /** sm 38px (nav, dialogs) · md 48px · lg 52px (hero / teaser CTAs). */
  size?: 'sm' | 'md' | 'lg';
  shape?: 'rounded' | 'pill';
}

type ButtonProps = Common &
  (
    | ({ href: string } & ComponentPropsWithoutRef<'a'>)
    | ({ href?: undefined } & ComponentPropsWithoutRef<'button'>)
  );

/** Renders a real link when given href (every action must work without JS/3D), else a button. */
export function Button({ variant = 'secondary', size = 'sm', shape = 'rounded', className, ...rest }: ButtonProps) {
  const cls = className ? `${s.btn} ${className}` : s.btn;
  const data = { 'data-variant': variant, 'data-size': size, 'data-shape': shape };
  if (rest.href !== undefined) return <a {...rest} {...data} className={cls} />;
  const { type = 'button', ...btn } = rest as ComponentPropsWithoutRef<'button'>;
  return <button {...btn} type={type} {...data} className={cls} />;
}
