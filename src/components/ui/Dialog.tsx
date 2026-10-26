'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import s from './ui.module.css';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name. */
  label: string;
  /** center: palette / shortcuts / confirm. sheet: mobile bottom sheet (Ask, keyboard picker). */
  variant?: 'center' | 'sheet';
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Native modal <dialog>: the browser provides the focus trap (inert page), Esc, top-layer
 * stacking and focus return to the trigger on close. Open state stays controlled by the parent:
 * Esc and backdrop clicks call onClose instead of closing directly.
 */
export function Dialog({ open, onClose, label, variant = 'center', className, style, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      data-variant={variant}
      className={className ? `${s.dialog} ${className}` : s.dialog}
      style={style}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // The dialog box itself only receives clicks on its ::backdrop; content sits in children.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {variant === 'sheet' && <span className={s.sheetHandle} aria-hidden />}
      {children}
    </dialog>
  );
}
