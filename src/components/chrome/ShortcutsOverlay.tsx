'use client';

import { X } from 'lucide-react';
import { useChrome } from './ChromeContext';

const mono = 'var(--font-mono)';

const SHORTCUTS: Array<{ label: string; keys: string[] }> = [
  { label: 'Open command palette', keys: ['⌘', 'K'] },
  { label: 'Ask me anything', keys: ['Enter'] },
  { label: 'Keyboard shortcuts', keys: ['?'] },
  { label: 'Close any overlay', keys: ['Esc'] },
  { label: 'Navigate palette', keys: ['↑', '↓'] },
];

export function ShortcutsOverlay() {
  const { shortcutsOpen, closeShortcuts } = useChrome();
  if (!shortcutsOpen) return null;

  return (
    <div
      onClick={closeShortcuts}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 101,
        background: 'var(--scrim)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'grsfade .18s ease',
      }}
    >
      <div
        role="dialog"
        aria-label="Keyboard shortcuts"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(460px,100%)',
          background: 'var(--surface)',
          border: '1px solid var(--line-2)',
          borderRadius: 16,
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
          animation: 'grsup .24s cubic-bezier(.2,.7,.2,1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 18px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 15 }}>Keyboard shortcuts</span>
          <button
            onClick={closeShortcuts}
            aria-label="Close"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: '1px solid var(--line)',
              background: 'var(--surface-2)',
              color: 'var(--ink-2)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '10px 18px 18px' }}>
          {SHORTCUTS.map((s) => (
            <div
              key={s.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14,
                padding: '11px 0',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{s.label}</span>
              <span style={{ display: 'flex', gap: 5 }}>
                {s.keys.map((k) => (
                  <span
                    key={k}
                    style={{
                      fontFamily: mono,
                      fontSize: 11.5,
                      color: 'var(--ink)',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--line-2)',
                      borderRadius: 6,
                      padding: '3px 9px',
                      minWidth: 24,
                      textAlign: 'center',
                    }}
                  >
                    {k}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
