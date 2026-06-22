/**
 * Build-time favicon generation from the GRS "G" mark (src/app/icon.svg).
 * Produces crisp raster assets that Next App Router auto-wires:
 *   - src/app/apple-icon.png (180x180)
 *   - src/app/favicon.ico    (32 + 16, PNG-embedded ICO)
 *
 * Rendered with @resvg/resvg-js using the cached IBM Plex Mono font so the "G"
 * is on-brand and font-independent. The committed icon.svg remains the scalable
 * favicon. If the font cannot be fetched (offline), generation is skipped.
 */
import { Resvg } from '@resvg/resvg-js';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const APP_DIR = join(process.cwd(), 'src', 'app');
const CACHE_DIR = join(process.cwd(), '.cache', 'fonts');
const MONO_URL =
  'https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-600-normal.ttf';

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function monoFont(): Promise<Buffer> {
  const cached = join(CACHE_DIR, 'mono-600.ttf');
  if (await exists(cached)) return readFile(cached);
  const res = await fetch(MONO_URL);
  if (!res.ok) throw new Error(`font fetch -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cached, buf);
  return buf;
}

function renderPng(svg: string, size: number, fontPath: string): Buffer {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    font: { fontFiles: [fontPath], loadSystemFonts: false, defaultFontFamily: 'IBM Plex Mono' },
  });
  return Buffer.from(r.render().asPng());
}

/** Minimal ICO container embedding one or more PNG images. */
function buildIco(images: Array<{ size: number; png: Buffer }>): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  const entries: Buffer[] = [];
  let offset = 6 + images.length * 16;
  for (const { size, png } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // color planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}

async function main() {
  let fontBuf: Buffer;
  const fontPath = join(CACHE_DIR, 'mono-600.ttf');
  try {
    fontBuf = await monoFont();
    await writeFile(fontPath, fontBuf);
  } catch (err) {
    console.warn(`[icons] skipped (font unavailable): ${(err as Error).message}`);
    return;
  }

  const svg = await readFile(join(APP_DIR, 'icon.svg'), 'utf8');

  await writeFile(join(APP_DIR, 'apple-icon.png'), renderPng(svg, 180, fontPath));
  const ico = buildIco([
    { size: 32, png: renderPng(svg, 32, fontPath) },
    { size: 16, png: renderPng(svg, 16, fontPath) },
  ]);
  await writeFile(join(APP_DIR, 'favicon.ico'), ico);
  console.log('[icons] generated apple-icon.png + favicon.ico');
}

main().catch((err) => console.warn(`[icons] generation failed: ${(err as Error).message}`));
