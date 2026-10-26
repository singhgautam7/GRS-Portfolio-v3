'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';
import { SITE } from '@/lib/site';
import s from './sections.module.css';

export function CopyEmail() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={s.copy}
      data-copied={copied}
      onClick={() => {
        void navigator.clipboard?.writeText(SITE.email).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
    >
      <Copy size={13} aria-hidden />
      <span aria-live="polite">{copied ? 'copied' : 'copy'}</span>
    </button>
  );
}
