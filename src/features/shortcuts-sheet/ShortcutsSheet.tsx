'use client';

import { useChrome } from '@/components/chrome/ChromeContext';
import { Dialog } from '@/components/ui/Dialog';
import { Keycap2D } from '@/components/ui/Keycap2D';
import { SHORTCUTS } from '@/input';
import { KeyCombo } from '@/features/command-palette/KeyCombo';
import s from '@/features/command-palette/palette.module.css';

/** `?` sheet, rendered from the shortcut registry (OS-aware via ModKey). */
export default function ShortcutsSheet() {
  const { shortcutsOpen, closeShortcuts } = useChrome();
  const groups = (['GENERAL', 'GO TO'] as const).map((g) => ({ g, rows: SHORTCUTS.filter((x) => x.group === g) }));
  return (
    <Dialog open={shortcutsOpen} onClose={closeShortcuts} label="Keyboard shortcuts" className={s.sheet}>
      <div className={s.sheetHead}>
        <div className={s.sheetTitle}>
          <span className={s.eyebrow}>{'// SHORTCUTS'}</span>
          <h2 className={s.h}>Keyboard shortcuts</h2>
        </div>
        <button type="button" onClick={closeShortcuts} aria-label="Close" className={s.closeKey} style={{ padding: 0, background: 'none' }}>
          <Keycap2D>esc</Keycap2D>
        </button>
      </div>
      <div className={s.cols}>
        {groups.map(({ g, rows }) => (
          <div key={g} className={s.col}>
            <span className={s.colTitle}>{g}</span>
            {rows.map((r) => (
              <div key={r.id} className={s.sRow}>
                <span>{r.label}</span>
                <KeyCombo keys={r.keys} accent={r.accent} size="lg" />
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className={s.note}>Shortcuts pause while you’re typing in a field.</p>
    </Dialog>
  );
}
