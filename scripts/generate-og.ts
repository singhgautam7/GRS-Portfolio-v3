/**
 * Build-time OG image generation. Renders the site share image and one image
 * per blog post (1200x630, dark theme) with satori + resvg, writing static PNGs
 * to public/og/. No runtime generation. Run before `next build`.
 *
 * Fonts (IBM Plex) are fetched once from the jsDelivr fontsource CDN and cached
 * under .cache/fonts. If fonts cannot be fetched (offline), OG generation is
 * skipped with a warning so the build never breaks.
 */
import { createElement as h } from 'react';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { posts } from '../.velite/index.js';

const OUT_DIR = join(process.cwd(), 'public', 'og');
const CACHE_DIR = join(process.cwd(), '.cache', 'fonts');

const ACCENT = '#5AA0FF';
const INK = '#eef2f9';
const INK2 = '#a4b0c4';
const INK3 = '#69748a';
const SURF2 = '#13161d';
const LINE = 'rgba(150,180,225,0.14)';
const LINE2 = 'rgba(150,180,225,0.26)';

interface FontSpec {
  name: string;
  weight: 400 | 600 | 700;
  url: string;
  family: 'IBM Plex Sans' | 'IBM Plex Mono';
}

const FONTS: FontSpec[] = [
  { name: 'sans-400', weight: 400, family: 'IBM Plex Sans', url: 'https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans@latest/latin-400-normal.ttf' },
  { name: 'sans-600', weight: 600, family: 'IBM Plex Sans', url: 'https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans@latest/latin-600-normal.ttf' },
  { name: 'sans-700', weight: 700, family: 'IBM Plex Sans', url: 'https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans@latest/latin-700-normal.ttf' },
  { name: 'mono-400', weight: 400, family: 'IBM Plex Mono', url: 'https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-400-normal.ttf' },
  { name: 'mono-600', weight: 600, family: 'IBM Plex Mono', url: 'https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-600-normal.ttf' },
];

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function loadFont(
  spec: FontSpec,
): Promise<{ name: string; data: Buffer; weight: 400 | 600 | 700; style: 'normal' }> {
  const cached = join(CACHE_DIR, `${spec.name}.ttf`);
  if (await exists(cached)) {
    return { name: spec.family, data: await readFile(cached), weight: spec.weight, style: 'normal' };
  }
  const res = await fetch(spec.url);
  if (!res.ok) throw new Error(`font fetch ${spec.url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cached, buf);
  return { name: spec.family, data: buf, weight: spec.weight, style: 'normal' };
}

const mono = (extra: Record<string, unknown> = {}) => ({ fontFamily: 'IBM Plex Mono', ...extra });

function chip(text: string) {
  return h(
    'div',
    {
      style: {
        ...mono({ fontSize: 16, color: INK2 }),
        background: SURF2,
        border: `1px solid ${LINE}`,
        borderRadius: 8,
        padding: '9px 16px',
        display: 'flex',
      },
    },
    text,
  );
}

function lockup(label: string, right: ReturnType<typeof h>) {
  return h(
    'div',
    { style: { display: 'flex', alignItems: 'center', gap: 14 } },
    h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          border: `2px solid ${ACCENT}`,
          borderRadius: 12,
          color: ACCENT,
          ...mono({ fontWeight: 600, fontSize: 20 }),
        },
      },
      'G',
    ),
    h('div', { style: { ...mono({ fontWeight: 600, fontSize: 21, color: INK, letterSpacing: 3 }) } }, label),
    right,
  );
}

function bloom(pos: { right?: number; left?: number; top?: number; bottom?: number }) {
  return h('div', {
    style: {
      position: 'absolute',
      width: 560,
      height: 560,
      borderRadius: 9999,
      background: 'radial-gradient(circle, rgba(90,160,255,0.22), rgba(40,90,205,0.05) 45%, rgba(0,0,0,0) 70%)',
      ...pos,
    },
  });
}

function frame(children: ReturnType<typeof h>, bloomEl: ReturnType<typeof h>) {
  return h(
    'div',
    {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        position: 'relative',
        background: '#000000',
        fontFamily: 'IBM Plex Sans',
        overflow: 'hidden',
      },
    },
    bloomEl,
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: '74px 80px',
        },
      },
      children,
    ),
  );
}

function siteTemplate() {
  const badge = h(
    'div',
    {
      style: {
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        ...mono({ fontSize: 14, color: INK3 }),
        background: SURF2,
        border: `1px solid ${LINE}`,
        borderRadius: 999,
        padding: '8px 16px',
      },
    },
    h('div', { style: { width: 8, height: 8, borderRadius: 9999, background: '#46d18b', display: 'flex' } }),
    'on-device · no server',
  );

  return frame(
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' } },
      lockup('GRS', badge),
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column' } },
        h('div', { style: { ...mono({ fontSize: 18, color: ACCENT }), marginBottom: 18, display: 'flex' } }, 'grs@infra:~$ whoami'),
        h('div', { style: { fontSize: 78, fontWeight: 700, color: INK, letterSpacing: -2, lineHeight: 1, marginBottom: 22, display: 'flex' } }, 'Gautam Singh'),
        h('div', { style: { fontSize: 30, color: INK2, lineHeight: 1.3, display: 'flex', maxWidth: 820 } }, 'Senior software engineer in backend, cloud infrastructure & AI systems.'),
      ),
      h(
        'div',
        { style: { display: 'flex', alignItems: 'flex-end', gap: 10 } },
        chip('Go'),
        chip('Kubernetes'),
        chip('Terraform'),
        chip('AI Systems'),
        h('div', { style: { marginLeft: 'auto', ...mono({ fontSize: 16, color: INK3 }), display: 'flex' } }, 'singhgautam.com'),
      ),
    ),
    bloom({ right: -120, top: -90 }),
  );
}

function postTemplate(post: { title: string; displayDate: string; readingTime: string; tags: string[] }) {
  const meta = h('div', { style: { marginLeft: 'auto', ...mono({ fontSize: 15, color: INK3 }), display: 'flex' } }, `${post.displayDate} · ${post.readingTime}`);
  return frame(
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' } },
      lockup('GRS · BLOG', meta),
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column' } },
        h(
          'div',
          { style: { display: 'flex', gap: 9, marginBottom: 22 } },
          ...post.tags.slice(0, 3).map((t) =>
            h('div', { style: { ...mono({ fontSize: 15, color: ACCENT }), border: `1px solid ${LINE2}`, borderRadius: 7, padding: '5px 12px', display: 'flex' } }, `#${t}`),
          ),
        ),
        h('div', { style: { fontSize: 60, fontWeight: 700, color: INK, lineHeight: 1.05, letterSpacing: -1.5, display: 'flex', maxWidth: 1000 } }, post.title),
      ),
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 13 } },
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 9999, background: SURF2, border: `1px solid ${LINE2}`, color: ACCENT, ...mono({ fontWeight: 600, fontSize: 16 }) } }, 'G'),
        h('div', { style: { fontSize: 19, color: INK2, display: 'flex' } }, 'Gautam Singh'),
        h('div', { style: { marginLeft: 'auto', ...mono({ fontSize: 16, color: INK3 }), display: 'flex' } }, 'singhgautam.com/blog'),
      ),
    ),
    bloom({ left: -130, bottom: -150 }),
  );
}

async function render(el: ReturnType<typeof h>, fonts: Awaited<ReturnType<typeof loadFont>>[], out: string) {
  const svg = await satori(el, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  await writeFile(out, png);
  console.log(`  og: ${out.replace(process.cwd() + '/', '')}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  let fonts: Awaited<ReturnType<typeof loadFont>>[];
  try {
    fonts = await Promise.all(FONTS.map(loadFont));
  } catch (err) {
    console.warn(`[og] skipped (fonts unavailable): ${(err as Error).message}`);
    return;
  }

  await render(siteTemplate(), fonts, join(OUT_DIR, 'og-default.png'));
  for (const post of posts) {
    await render(postTemplate(post), fonts, join(OUT_DIR, `og-${post.slug}.png`));
  }
  console.log(`[og] generated ${1 + posts.length} images`);
}

main().catch((err) => {
  console.warn(`[og] generation failed: ${(err as Error).message}`);
});
