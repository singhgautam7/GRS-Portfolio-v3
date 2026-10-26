'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Search, X } from 'lucide-react';
import { useChrome } from '@/components/chrome/ChromeContext';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Dialog } from '@/components/ui/Dialog';
import { Keycap2D } from '@/components/ui/Keycap2D';
import { shortcut } from '@/input';
import { projects } from '@/lib/content';
import { useSiteNav } from '@/lib/navigation';
import { prefersReducedMotion } from '@/lib/reduced-motion';
import { dur, ease } from '@/lib/tokens';
import { SITE } from '@/lib/site';
import { getPrefs, setPrefs } from '@/features/keyboards/prefs';
import { VARIANTS, variantMeta } from '@/features/keyboards/variants';
import { KeyCombo } from './KeyCombo';
import s from './palette.module.css';

interface Row {
  group: 'GO TO' | 'PROJECTS' | 'ACTIONS';
  label: string;
  meta: string;
  keys?: string[];
  accent?: string[];
  run: () => void;
}

const bezier = (e: readonly number[]) => `cubic-bezier(${e.join(',')})`;

/** ⌘K command palette (design 2a; 4b on mobile). Emerges from the K cap or the Search button. */
export default function CommandPalette() {
  const { paletteOpen, paletteOrigin, closePalette, openShortcuts, setAskOpen, toast, goPlayground } = useChrome();
  const { toggleTheme } = useTheme();
  const { goSection } = useSiteNav();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const all = useMemo<Row[]>(() => {
    const chord = (id: Parameters<typeof shortcut>[0]) => shortcut(id).keys;
    const go = (label: string, idx: string, target: Parameters<typeof goSection>[0], keys?: string[]): Row => ({ group: 'GO TO', label, meta: `// ${idx}`, keys, run: () => goSection(target) });
    const prefs = getPrefs();
    return [
      go('About', '01', 'about', chord('go:about')),
      go('Skills', '02', 'skills'),
      go('Experience', '03', 'experience', chord('go:experience')),
      go('Projects', '04', 'projects', chord('go:projects')),
      { group: 'GO TO', label: 'Playground', meta: '// 05', run: goPlayground },
      go('Writing', '06', 'writing', chord('go:writing')),
      go('Now', '07', 'now'),
      go('Contact', '08', 'contact', chord('go:contact')),
      ...projects.map<Row>((p) => ({
        group: 'PROJECTS',
        label: p.title,
        meta: p.tech.join(' · '),
        run: () => (p.external ? window.open(p.external, '_blank', 'noopener,noreferrer') : router.push('/projects')),
      })),
      { group: 'ACTIONS', label: 'Open the playground', meta: 'Push traffic through a system', keys: shortcut('playground').keys, accent: ['↵'], run: goPlayground },
      { group: 'ACTIONS', label: 'Download resume', meta: 'GRS_resume.docx', run: () => (window.location.href = SITE.resumeUrl) },
      {
        group: 'ACTIONS',
        label: 'Copy email',
        meta: SITE.email,
        run: () => {
          void navigator.clipboard?.writeText(SITE.email).catch(() => {});
          toast('Email copied');
        },
      },
      { group: 'ACTIONS', label: 'Toggle theme', meta: 'Light / dark', run: toggleTheme },
      {
        group: 'ACTIONS',
        label: 'Switch keyboard',
        meta: `Now: ${variantMeta(prefs.variant).name}`,
        run: () => {
          const i = VARIANTS.findIndex((v) => v.id === getPrefs().variant);
          const next = VARIANTS[(i + 1) % VARIANTS.length]!;
          setPrefs({ variant: next.id });
          toast(`Keyboard: ${next.name}`);
        },
      },
      { group: 'ACTIONS', label: prefs.muted ? 'Turn sound on' : 'Mute keyboard sound', meta: 'Keyboard sound', run: () => setPrefs({ muted: !getPrefs().muted }) },
      { group: 'ACTIONS', label: 'Ask about me', meta: 'Quick answers about my work', run: () => setAskOpen(true) },
      { group: 'ACTIONS', label: 'Keyboard shortcuts', meta: 'Everything you can press', keys: ['?'], run: () => setTimeout(openShortcuts, 180) },
    ];
    // Rebuilt each time the palette opens so labels reflect current prefs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteOpen]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const match = (r: Row) => !t || r.label.toLowerCase().includes(t) || r.meta.toLowerCase().includes(t);
    const proj = all.filter((r) => r.group === 'PROJECTS');
    return [
      ...all.filter((r) => r.group === 'GO TO' && match(r)),
      ...(t ? proj.filter(match) : proj.slice(0, 4)),
      ...all.filter((r) => r.group === 'ACTIONS' && match(r)),
    ];
  }, [all, q]);

  // Open: reset, focus, and emerge from the origin (K cap / Search button), 380ms ease-out.
  useEffect(() => {
    if (!paletteOpen) return;
    setQ('');
    setSel(0);
    requestAnimationFrame(() => {
      input.current?.focus({ preventScroll: true });
      const el = panel.current?.closest('dialog');
      if (!el || !paletteOrigin || prefersReducedMotion() || innerWidth <= 640) return;
      const r = el.getBoundingClientRect();
      const dx = paletteOrigin.x + paletteOrigin.width / 2 - (r.x + r.width / 2);
      const dy = paletteOrigin.y + paletteOrigin.height / 2 - (r.y + r.height / 2);
      el.animate([{ transform: `translate(${dx}px,${dy}px) scale(.06)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: dur.slow, easing: bezier(ease.out) });
    });
  }, [paletteOpen, paletteOrigin]);

  useEffect(() => {
    document.getElementById(`${listId}-${sel}`)?.scrollIntoView({ block: 'nearest' });
  }, [sel, listId]);

  const run = (r: Row | undefined) => {
    if (!r) return;
    closePalette();
    r.run();
  };

  let lastGroup = '';
  return (
    <Dialog open={paletteOpen} onClose={closePalette} label="Search and commands" className={s.palette}>
      <div ref={panel}>
        <div className={s.head}>
          <span className={s.arrow} aria-hidden>
            →
          </span>
          <button type="button" className={s.back} aria-label="Back" onClick={closePalette}>
            <ChevronLeft size={20} />
          </button>
          <div className={s.field}>
            <Search size={17} className={s.searchIcon} aria-hidden />
            <input
              ref={input}
              className={s.input}
              value={q}
              placeholder="Where to? Try a project, or a tech like Go"
              aria-label="Search sections, projects and actions"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={rows.length ? `${listId}-${sel}` : undefined}
              onChange={(e) => {
                setQ(e.target.value);
                setSel(0);
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                  e.preventDefault();
                  closePalette();
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSel((x) => Math.min(rows.length - 1, x + 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSel((x) => Math.max(0, x - 1));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  run(rows[sel]);
                }
              }}
            />
            {q && (
              <button type="button" className={s.clear} aria-label="Clear" onClick={() => setQ('')}>
                <X size={16} />
              </button>
            )}
          </div>
          <Keycap2D className={s.escKey}>esc</Keycap2D>
        </div>
        <div id={listId} role="listbox" aria-label="Results" className={s.list}>
          {rows.map((r, i) => {
            const head = r.group !== lastGroup ? r.group : null;
            lastGroup = r.group;
            return (
              <div key={`${r.group}-${r.label}`} role="presentation">
                {head && (
                  <div className={s.group} role="presentation">
                    {head === 'PROJECTS' && q ? `PROJECTS · ${rows.filter((x) => x.group === 'PROJECTS').length}` : head}
                  </div>
                )}
                <div id={`${listId}-${i}`} role="option" aria-selected={i === sel} className={s.row} onMouseEnter={() => setSel(i)} onClick={() => run(r)}>
                  <span className={s.rowLabel}>{r.label}</span>
                  <span className={s.rowMeta}>{r.meta}</span>
                  {r.keys && <KeyCombo keys={r.keys} accent={r.accent} />}
                </div>
              </div>
            );
          })}
          {rows.length === 0 && (
            <div className={s.empty}>
              <span className={s.emptyTitle}>No matches for “{q}”.</span>
              <span className={s.emptySub}>Try a project name, or a tech like Go or Flutter.</span>
            </div>
          )}
        </div>
        <div className={s.foot} aria-hidden>
          <span>
            <Keycap2D size="sm">↑↓</Keycap2D>move
          </span>
          <span>
            <Keycap2D size="sm">↵</Keycap2D>open
          </span>
          <span>
            <Keycap2D size="sm">esc</Keycap2D>close
          </span>
        </div>
      </div>
    </Dialog>
  );
}
