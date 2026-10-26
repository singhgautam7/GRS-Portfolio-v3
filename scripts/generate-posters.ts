/**
 * Renders the static hero posters (one per keyboard × mode) from the real rig, at the hero's
 * 1440×900 canvas size, into public/posters/<variant>-<mode>.webp. Run after `bun run build`:
 *   bun run posters
 * Serves ./out locally, loads /?kbStill=<variant> (the rig renders one settled frame and exposes
 * it as a data URL), and writes the file. No network beyond localhost.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const VARIANTS = ['thk', 'tik', 'clk', 'pop', 'pew', '8bt'];
const MODES = ['light', 'dark'] as const;
const ROOT = join(import.meta.dir, '..', 'out');
const OUT = join(import.meta.dir, '..', 'public', 'posters');
const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url ?? '/').split('?')[0]!);
  if (p.endsWith('/')) p += 'index.html';
  try {
    const body = await readFile(join(ROOT, p));
    res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(4174);

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const mode of MODES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: mode, deviceScaleFactor: 1 });
  await ctx.addInitScript((m) => localStorage.setItem('grs-theme', m), mode);
  for (const v of VARIANTS) {
    const page = await ctx.newPage();
    await page.goto(`http://localhost:4174/?kbStill=${v}`);
    const url = await page.waitForFunction(() => window.__kbStill, null, { timeout: 60_000 }).then((h) => h.jsonValue() as Promise<string>);
    writeFileSync(join(OUT, `${v}-${mode}.webp`), Buffer.from(url.split(',')[1]!, 'base64'));
    console.log(`poster ${v}-${mode}.webp`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
server.close();
