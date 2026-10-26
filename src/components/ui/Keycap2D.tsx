import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import s from './ui.module.css';

export type KeycapSize = 'sm' | 'md' | 'lg' | 'chip';
export type KeycapTone = 'plain' | 'accent' | 'pressed';

interface Keycap2DProps extends ComponentPropsWithoutRef<'span'> {
  size?: KeycapSize;
  /** accent: live keys (↵, Esc in sheets). pressed: active selector chip / sound on. */
  tone?: KeycapTone;
  children: ReactNode;
}

/**
 * The one 2D keycap used everywhere: palette rows, shortcuts sheet, hint lines, CTA hints,
 * section markers, selector chips. Decorative by default (a legend next to visible text);
 * render it inside a real button when it is the control.
 */
export function Keycap2D({ size = 'md', tone = 'plain', className, children, ...rest }: Keycap2DProps) {
  return (
    <span
      {...rest}
      className={className ? `${s.cap} ${className}` : s.cap}
      data-size={size}
      data-tone={tone}
    >
      {children}
    </span>
  );
}

/**
 * The shortcut modifier legend: ⌘ on Mac, Ctrl elsewhere. Both are rendered and CSS shows the
 * one matching html[data-os] (set before first paint), so there is no hydration swap or shift.
 */
export function ModKey() {
  return (
    <>
      <span data-os-only="mac">⌘</span>
      <span data-os-only="other">Ctrl</span>
    </>
  );
}
