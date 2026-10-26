import localFont from 'next/font/local';

/**
 * Bundled fonts (latin subsets from Fontsource, OFL, see fonts/LICENSES.txt). No runtime font
 * fetches. Each exposes a CSS variable that src/styles/tokens.css puts first in its stack. The
 * classes go on <html> so the variables resolve where the tokens are defined (:root).
 * Typewriter and pixel faces are only used by keyboard variants, so they are not preloaded.
 */
const sans = localFont({
  src: './fonts/host-grotesk.woff2',
  weight: '300 800',
  variable: '--ff-host-grotesk',
  display: 'swap',
});
const mono = localFont({
  src: './fonts/martian-mono.woff2',
  weight: '100 800',
  variable: '--ff-martian-mono',
  display: 'swap',
});
const display = localFont({
  src: './fonts/young-serif.woff2',
  weight: '400',
  variable: '--ff-young-serif',
  display: 'swap',
});
const type = localFont({
  src: './fonts/special-elite.woff2',
  weight: '400',
  variable: '--ff-special-elite',
  display: 'swap',
  preload: false,
});
const pixel = localFont({
  src: './fonts/press-start-2p.woff2',
  weight: '400',
  variable: '--ff-press-start',
  display: 'swap',
  preload: false,
});

export const fontVariables = [sans, mono, display, type, pixel].map((f) => f.variable).join(' ');
