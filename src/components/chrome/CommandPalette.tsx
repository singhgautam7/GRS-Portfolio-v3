'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Briefcase,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Home,
  Keyboard,
  LayoutGrid,
  Layers,
  Mail,
  PenLine,
  Route,
  Search,
  Sparkles,
  Star,
  SunMoon,
  User,
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useChrome } from './ChromeContext';
import { useSiteNav } from '@/lib/navigation';
import { SITE, SOCIALS } from '@/lib/site';

type PaletteKind =
  | 'section'
  | 'page'
  | 'chat'
  | 'resume'
  | 'theme'
  | 'shortcuts'
  | 'github'
  | 'copyEmail';

const GITHUB_URL = SOCIALS.find((s) => s.name === 'GitHub')?.url ?? 'https://github.com/singhgautam7';

interface PaletteItem {
  group: 'NAVIGATION' | 'PAGES' | 'ACTIONS';
  label: string;
  icon: ReactNode;
  hint: string;
  kind: PaletteKind;
  value?: string;
}

const ICON = 15;

const mono = 'var(--font-mono)';

export function CommandPalette() {
  const { paletteOpen, closePalette, openShortcuts } = useChrome();
  const { goSection, goPage } = useSiteNav();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const items = useMemo<PaletteItem[]>(
    () => [
      { group: 'NAVIGATION', label: 'Home', icon: <Home size={ICON} />, hint: 'top', kind: 'section', value: 'home' },
      { group: 'NAVIGATION', label: 'About', icon: <User size={ICON} />, hint: 'jump', kind: 'section', value: 'about' },
      { group: 'NAVIGATION', label: 'Skills', icon: <Layers size={ICON} />, hint: 'jump', kind: 'section', value: 'skills' },
      { group: 'NAVIGATION', label: 'Experience', icon: <Briefcase size={ICON} />, hint: 'jump', kind: 'section', value: 'experience' },
      { group: 'NAVIGATION', label: 'Featured Projects', icon: <Star size={ICON} />, hint: 'jump', kind: 'section', value: 'projects' },
      { group: 'NAVIGATION', label: 'Writing', icon: <PenLine size={ICON} />, hint: 'jump', kind: 'section', value: 'posts' },
      { group: 'NAVIGATION', label: 'Now', icon: <Clock size={ICON} />, hint: 'jump', kind: 'section', value: 'now' },
      { group: 'NAVIGATION', label: 'Contact', icon: <Mail size={ICON} />, hint: 'jump', kind: 'section', value: 'contact' },
      { group: 'PAGES', label: 'Projects Archive', icon: <LayoutGrid size={ICON} />, hint: 'all', kind: 'page', value: '/projects' },
      { group: 'PAGES', label: 'Timeline', icon: <Route size={ICON} />, hint: 'career', kind: 'page', value: '/timeline' },
      { group: 'PAGES', label: 'Blog', icon: <BookOpen size={ICON} />, hint: 'posts', kind: 'page', value: '/blog' },
      { group: 'ACTIONS', label: 'Ask me anything', icon: <Sparkles size={ICON} />, hint: 'assistant', kind: 'chat' },
      { group: 'ACTIONS', label: 'Download Resume', icon: <Download size={ICON} />, hint: '.docx', kind: 'resume' },
      { group: 'ACTIONS', label: 'Open GitHub', icon: <ExternalLink size={ICON} />, hint: 'profile', kind: 'github' },
      { group: 'ACTIONS', label: 'Copy email', icon: <Copy size={ICON} />, hint: 'clipboard', kind: 'copyEmail' },
      { group: 'ACTIONS', label: 'Keyboard shortcuts', icon: <Keyboard size={ICON} />, hint: '?', kind: 'shortcuts' },
      { group: 'ACTIONS', label: 'Toggle theme', icon: <SunMoon size={ICON} />, hint: theme === 'dark' ? 'to light' : 'to dark', kind: 'theme' },
    ],
    [theme],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((it) => !q || it.label.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    if (paletteOpen) {
      setQuery('');
      setIndex(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(t);
    }
  }, [paletteOpen]);

  const run = (it: PaletteItem) => {
    closePalette();
    switch (it.kind) {
      case 'section':
        goSection(it.value!);
        break;
      case 'page':
        goPage(it.value!);
        break;
      case 'chat':
        router.push('/ask');
        break;
      case 'resume':
        window.open(SITE.resumeUrl, '_blank', 'noopener');
        break;
      case 'github':
        window.open(GITHUB_URL, '_blank', 'noopener');
        break;
      case 'copyEmail':
        navigator.clipboard?.writeText(SITE.email).catch(() => undefined);
        break;
      case 'theme':
        toggleTheme();
        break;
      case 'shortcuts':
        openShortcuts();
        break;
    }
  };

  useEffect(() => {
    if (!paletteOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const it = filtered[index];
        if (it) run(it);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!paletteOpen) return null;

  const groups: PaletteItem['group'][] = ['NAVIGATION', 'PAGES', 'ACTIONS'];
  let flatIndex = -1;

  return (
    <div
      onClick={closePalette}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'var(--scrim)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '11vh 16px 16px',
        animation: 'grsfade .18s ease',
      }}
    >
      <div
        role="dialog"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(620px,100%)',
          maxHeight: '74vh',
          background: 'var(--bg)',
          border: '1px solid var(--line-2)',
          borderRadius: 16,
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'grsup .24s cubic-bezier(.2,.7,.2,1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: '15px 18px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <Search size={16} style={{ color: 'var(--accent)', flex: 'none' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            placeholder="Search sections, pages, actions…"
            aria-label="Command palette search"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--ink)',
              fontFamily: mono,
              fontSize: 15,
            }}
          />
          <span
            style={{
              border: '1px solid var(--line)',
              borderRadius: 5,
              padding: '2px 7px',
              fontFamily: mono,
              fontSize: 11,
              color: 'var(--ink-3)',
            }}
          >
            esc
          </span>
        </div>

        <div style={{ overflowY: 'auto', padding: 9 }}>
          {groups.map((g) => {
            const groupItems = filtered.filter((it) => it.group === g);
            if (!groupItems.length) return null;
            return (
              <div key={g}>
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    color: 'var(--ink-3)',
                    padding: '10px 10px 6px',
                  }}
                >
                  {`// ${g}`}
                </div>
                {groupItems.map((it) => {
                  flatIndex += 1;
                  const selected = flatIndex === index;
                  return (
                    <button
                      key={it.label}
                      onClick={() => run(it)}
                      style={{
                        display: 'flex',
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '11px 12px',
                        border: 'none',
                        borderRadius: 9,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 14,
                        color: 'var(--ink)',
                        background: selected ? 'var(--surface-3)' : 'transparent',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                        <span
                          style={{
                            color: 'var(--accent)',
                            width: 17,
                            display: 'inline-flex',
                            justifyContent: 'center',
                            flex: 'none',
                          }}
                        >
                          {it.icon}
                        </span>
                        {it.label}
                      </span>
                      <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--ink-3)' }}>
                        {it.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ fontFamily: mono, fontSize: 13, color: 'var(--ink-3)', padding: '18px 12px' }}>
              {'// nothing matches'}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
            padding: '11px 16px',
            borderTop: '1px solid var(--line)',
            fontFamily: mono,
            fontSize: 11,
            color: 'var(--ink-3)',
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
