import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/** Consistent top-left "Back to home" link for dedicated list pages. */
export function BackToHome() {
  return (
    <Link
      href="/"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        color: 'var(--ink-2)',
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        marginBottom: 22,
        textDecoration: 'none',
      }}
    >
      <ArrowLeft size={14} /> Back to home
    </Link>
  );
}
