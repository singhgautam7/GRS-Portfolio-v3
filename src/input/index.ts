import { getOS } from '@/lib/platform';
import { createInputLayer } from './layer';
import type { InputLayer } from './layer';

export type { InputEvent, InputState, Source } from './layer';
export { SHORTCUTS, shortcut, KEY_LABELS, MOD_LIT_CODES, CHORD_LIT_CODES } from './registry';
export type { Shortcut, ShortcutId, SectionId } from './registry';

/** The app-wide input layer (client only), attached once by SiteChrome. Kept on globalThis so a
 * hot-reloaded module never creates a second layer (and a second set of listeners). */
export function getInput(): InputLayer {
  const g = globalThis as { __grsInput?: InputLayer };
  return (g.__grsInput ??= createInputLayer({ os: getOS() }));
}
