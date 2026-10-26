'use client';

import { useChrome } from '@/components/chrome/ChromeContext';
import { Keycap2D } from '@/components/ui/Keycap2D';
import { SITE, SOCIALS } from '@/lib/site';
import s from './chrome.module.css';

/** Footer (design 2a): name + "No tracking.", socials, shortcuts sheet, deploy status. */
export function Footer() {
  const { openShortcuts } = useChrome();
  return (
    <footer className={s.footer}>
      <div className={s.footCol}>
        <span className={s.copy}>
          © {new Date().getFullYear()} <span>{SITE.name}</span>
        </span>
        <span className={s.small}>
          Built with Next.js &amp; TypeScript.
          <br />
          No tracking.
        </span>
      </div>
      <div className={s.footCol} style={{ gap: 10 }}>
        <span className={s.label}>CONNECT</span>
        <div className={s.socials}>
          {SOCIALS.map((so) => (
            <a key={so.name} href={so.url} target="_blank" rel="noopener noreferrer" className={s.social}>
              {so.name} ↗
            </a>
          ))}
        </div>
      </div>
      <div className={s.footCol} data-end="true">
        <button type="button" className={s.shortcutsBtn} onClick={openShortcuts} data-kbd-hint>
          shortcuts <Keycap2D size="sm">?</Keycap2D>
        </button>
        <span className={s.deployed}>
          <span className={s.dot} aria-hidden />
          deployed · v3
        </span>
      </div>
    </footer>
  );
}
