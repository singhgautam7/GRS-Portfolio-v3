import type { EdgeId, Graph, Health, TickOut } from '../engine/model';

/**
 * Isometric scene geometry, ported from the design's Iso Scene (specs/design/.../Iso Scene.dc.html):
 * same block positions, sizes, projection, heat ramp, labels and shadows. Pure: engine state in,
 * SVG path data out. Colours are CSS variables (tokens), resolved by the browser.
 */

export type SceneNode = 'users' | 'cdn' | 'lb' | 'app' | 'cache' | 'db' | 'replicas' | 'queue' | 'workers';

export interface Face {
  d: string;
  fill: string;
  overlay: 'top' | 'side' | 'cyl' | null;
}
export interface NodeGroup {
  id: SceneNode;
  depth: number;
  faces: Face[];
  lines: { d: string; stroke: string }[];
  stroke: string;
  strokeWidth: number;
  dash?: string;
  pulse: boolean;
  selectable: boolean;
}
export interface Segment {
  id: EdgeId | 'users-cdn' | 'queue-workers';
  a: [number, number];
  b: [number, number];
  status: 'ok' | 'slow' | 'drop' | 'none';
  dashed: boolean;
  thin: boolean;
  reroute: boolean;
  /** Visual flow weight 0..1 (edge thickness under reduced motion). */
  weight: number;
}
export interface Label {
  x: number;
  y: number;
  name: string;
  sub: string;
  bad: boolean;
  selected: boolean;
  w: number;
}
export interface SceneModel {
  viewBox: string;
  shadows: string[];
  groups: NodeGroup[];
  segments: Segment[];
  labels: Label[];
  unit: number;
}

const f1 = (n: number) => n.toFixed(1);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const pct = (h: number) => Math.round(Math.min(h, 1.2) * 100) + '%';

/** Heat ramp: neutral → amber from 45%, → red from 75% (design heatAR). */
export function heatFill(base: string, heat: number) {
  const a = clamp01((heat - 0.45) / 0.3), r = clamp01((heat - 0.75) / 0.2);
  let c = base;
  if (a > 0) c = `color-mix(in srgb, ${c}, var(--warn) ${Math.round(a * 88)}%)`;
  if (r > 0) c = `color-mix(in srgb, ${c}, var(--danger) ${Math.round(r * 90)}%)`;
  return c;
}
const shade = (c: string, k: number) => (k ? `color-mix(in srgb, ${c}, #000 ${Math.round(k * 100)}%)` : c);

export interface SceneInput {
  graph: Graph;
  health: Health;
  out: TickOut;
  t: number;
  selected: SceneNode | null;
  labels: boolean;
  unit: number;
  pad: number;
}

export function buildScene(inp: SceneInput): SceneModel {
  const { graph, health, out, t, selected: sel, unit: u } = inp;
  const pr = (x: number, y: number, z: number): [number, number] => [(x - y) * 0.866 * u, (x + y) * 0.5 * u - z * u];
  const poly = (ps: [number, number][]) => 'M' + ps.map((p) => f1(p[0]) + ' ' + f1(p[1])).join(' L') + ' Z';
  const pts: [number, number][] = [];
  const shadows: string[] = [];
  const groups: NodeGroup[] = [];
  const n = out.nodes;

  const strokeFor = (id: SceneNode, h: number, dead: boolean) =>
    dead ? { stroke: 'var(--danger)', strokeWidth: 1.5, dash: '4 3', pulse: false } : sel === id ? { stroke: 'var(--accent)', strokeWidth: 2.5, pulse: false } : h > 0.92 ? { stroke: 'var(--danger)', strokeWidth: 2, pulse: true } : { stroke: 'var(--line-2)', strokeWidth: 1, pulse: false };

  const castBox = (x: number, y: number, w: number, d: number, h: number) => {
    const sx = h * 0.7 + 0.12, sy = h * 0.28 + 0.06;
    shadows.push(poly([pr(x, y, 0), pr(x + w, y, 0), pr(x + w + sx, y + sy, 0), pr(x + w + sx, y + d + sy, 0), pr(x + sx, y + d + sy, 0), pr(x, y + d, 0)]));
  };

  const box = (id: SceneNode, x: number, y: number, w: number, d: number, h: number, heat: number, o: { z?: number; dead?: boolean; fill?: string; units?: number; selectable?: boolean } = {}) => {
    const z0 = o.z ?? 0, z1 = z0 + h, dead = !!o.dead;
    const base = dead ? 'var(--surface-sunk)' : o.fill ?? heatFill('var(--kb-cap)', heat);
    const top = [pr(x, y, z1), pr(x + w, y, z1), pr(x + w, y + d, z1), pr(x, y + d, z1)];
    const right = [pr(x + w, y, z0), pr(x + w, y + d, z0), pr(x + w, y + d, z1), pr(x + w, y, z1)];
    const left = [pr(x, y + d, z0), pr(x + w, y + d, z0), pr(x + w, y + d, z1), pr(x, y + d, z1)];
    if (!z0) castBox(x, y, w, d, h);
    const lines: { d: string; stroke: string }[] = [];
    if (o.units) for (let i = 1; i < o.units; i++) {
      const zz = z0 + (h * i) / o.units, a = pr(x, y + d, zz), b = pr(x + w, y + d, zz), c = pr(x + w, y, zz);
      lines.push({ d: `M${f1(a[0])} ${f1(a[1])} L${f1(b[0])} ${f1(b[1])} L${f1(c[0])} ${f1(c[1])}`, stroke: 'var(--line-2)' });
    }
    if (!dead) lines.push({ d: `M${f1(top[1]![0])} ${f1(top[1]![1])} L${f1(top[2]![0])} ${f1(top[2]![1])} L${f1(top[3]![0])} ${f1(top[3]![1])}`, stroke: 'var(--iso-hl)' });
    top.concat(right, left).forEach((p) => pts.push(p));
    groups.push({
      id,
      depth: x + w / 2 + y + d / 2 + z0 * 0.01,
      faces: [
        { d: poly(right), fill: shade(base, 0.24), overlay: dead ? null : 'side' },
        { d: poly(left), fill: shade(base, 0.12), overlay: dead ? null : 'side' },
        { d: poly(top), fill: base, overlay: dead ? null : 'top' },
      ],
      lines,
      ...strokeFor(id, o.fill ? 0 : heat, dead),
      selectable: o.selectable ?? true,
    });
    return { x: x + w / 2, y: y + d / 2, top: z1 };
  };

  const cyl = (id: SceneNode, cx: number, cy: number, r: number, h: number, heat: number, dead = false) => {
    const base = dead ? 'var(--surface-sunk)' : heatFill('var(--kb-cap)', heat);
    const [px, pyB] = pr(cx, cy, 0), pyT = pyB - h * u, rx = 1.2247 * r * u, ry = 0.7071 * r * u;
    const [sx0, sy0] = pr(cx + h * 0.32 + 0.1, cy + h * 0.14 + 0.05, 0);
    shadows.push(`M${f1(sx0 - rx * 1.12)} ${f1(sy0)} A${f1(rx * 1.12)} ${f1(ry * 1.12)} 0 1 0 ${f1(sx0 + rx * 1.12)} ${f1(sy0)} A${f1(rx * 1.12)} ${f1(ry * 1.12)} 0 1 0 ${f1(sx0 - rx * 1.12)} ${f1(sy0)} Z`);
    const lines = [0.33, 0.66].map((k) => {
      const yy = pyB - h * u * k;
      return { d: `M${f1(px - rx)} ${f1(yy)} A${f1(rx)} ${f1(ry)} 0 0 0 ${f1(px + rx)} ${f1(yy)}`, stroke: 'var(--line-2)' };
    });
    if (!dead) lines.push({ d: `M${f1(px - rx)} ${f1(pyT)} A${f1(rx)} ${f1(ry)} 0 0 0 ${f1(px + rx)} ${f1(pyT)}`, stroke: 'var(--iso-hl)' });
    groups.push({
      id,
      depth: cx + cy,
      faces: [
        { d: `M${f1(px - rx)} ${f1(pyT)} L${f1(px - rx)} ${f1(pyB)} A${f1(rx)} ${f1(ry)} 0 0 0 ${f1(px + rx)} ${f1(pyB)} L${f1(px + rx)} ${f1(pyT)} Z`, fill: shade(base, 0.2), overlay: dead ? null : 'cyl' },
        { d: `M${f1(px - rx)} ${f1(pyT)} A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(px + rx)} ${f1(pyT)} A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(px - rx)} ${f1(pyT)} Z`, fill: base, overlay: dead ? null : 'top' },
      ],
      lines,
      ...strokeFor(id, heat, dead),
      selectable: true,
    });
    pts.push([px - rx, pyT - ry], [px + rx, pyB + ry]);
    return { x: cx, y: cy, top: h + r * 0.4 };
  };

  // ---- components (design positions) ----
  const devs: [number, number][] = [[0, 1.0], [0.75, 0.8], [0.2, 1.8], [0.95, 1.65], [0.4, 2.6], [1.15, 2.5]];
  devs.forEach(([x, y], i) => box('users', x, y, 0.5, 0.36, i % 2 ? 0.08 : 0.16, 0, { fill: 'var(--kb-cap-mod)', selectable: false }));
  const users = { x: 0.8, y: 1.9, top: 0.5 };
  const cdnHeat = n.cdn?.util ?? 0;
  let cdn = { x: 3.5, y: 1.9, top: 0.73 };
  if (graph.cdn) {
    box('cdn', 2.7, 1.1, 1.6, 1.6, 0.18, cdnHeat * 0.5);
    cdn = box('cdn', 3.2, 1.6, 0.6, 0.6, 0.55, cdnHeat * 0.5, { z: 0.18 });
  }
  const lb = box('lb', 5.9, 1.3, 1.2, 1.2, 0.85, n.lb?.util ?? 0);
  const tierH = { S: 2, M: 3, L: 4, XL: 5 }[graph.app.tier];
  const shown = Math.min(6, graph.app.instances);
  const restarting = health.deadServers.filter((d) => t - d < 25).length;
  const apps = [];
  for (let i = 0; i < shown; i++) {
    const yy = 1.4 + (i - (shown - 1) / 2) * 1.35;
    apps.push(box('app', 9, yy - 0.5, 1, 1, tierH * 0.3, n.app?.util ?? 0, { units: tierH, dead: i < restarting }));
  }
  const appMid = { x: 9.5, y: 1.4 };
  const cacheDead = !!graph.cache && health.cacheDownAt !== null;
  const cache = graph.cache ? box('cache', 12.4, -2.0, 1, 1, 0.45, cacheDead ? 0 : n.cache?.util ?? 0, { dead: cacheDead }) : null;
  const primaryDead = health.primaryDownAt !== null && !(n.db?.healthy ?? true);
  const db = cyl('db', 12.8, 2.2, 0.72, 1.15, n.db?.util ?? 0, primaryDead);
  const repPos: [number, number][] = [[15.2, 1.3], [15.4, 3.1], [15.6, 4.6], [15.0, -0.3]];
  const reps = repPos.slice(0, graph.db.replicas).map(([x, y]) => cyl('replicas', x, y, 0.5, 0.95, n.replicas?.util ?? 0));
  let q: { x: number; y: number; top: number } | null = null;
  let wk: { x: number; y: number; top: number }[] = [];
  if (graph.queue) {
    q = box('queue', 10.2, 5.2, 3.4, 0.6, 0.16, n.queue?.util ?? 0, { units: 1 });
    wk = Array.from({ length: Math.min(4, graph.queue.workers) }, (_, i) => box('workers', 14.4 + i * 0.75, 5.15, 0.55, 0.55, 0.45, n.queue?.util ?? 0));
  }
  groups.sort((a, b) => a.depth - b.depth);

  // ---- edges ----
  const e = out.edges;
  const status = (id: EdgeId): Segment['status'] => {
    const x = e[id];
    if (!x || x.flow <= 0) return 'none';
    return x.dropped > 0.05 ? 'drop' : x.slow > 0.25 ? 'slow' : 'ok';
  };
  const weight = (id: EdgeId) => clamp01(Math.log10(1 + (e[id]?.flow ?? 0)) / 4.3);
  const seg = (id: Segment['id'], a: { x: number; y: number }, b: { x: number; y: number }, st: Segment['status'], o: Partial<Pick<Segment, 'dashed' | 'thin' | 'reroute'>> = {}, w = 0.5): Segment => ({
    id, a: pr(a.x, a.y, 0), b: pr(b.x, b.y, 0), status: st, dashed: !!o.dashed, thin: !!o.thin, reroute: !!o.reroute, weight: w,
  });
  const segments: Segment[] = [];
  segments.push(seg('users-cdn', users, graph.cdn ? cdn : lb, 'ok', {}, weight('client-cdn')));
  if (graph.cdn) segments.push(seg('cdn-lb', cdn, lb, status('cdn-lb'), {}, weight('cdn-lb')));
  apps.forEach((a) => segments.push(seg('lb-app', lb, a, status('lb-app'), {}, weight('lb-app'))));
  if (cache && !cacheDead) segments.push(seg('app-cache', appMid, cache, status('app-cache'), {}, weight('app-cache')));
  if (primaryDead && reps[0]) {
    segments.push(seg('app-db', appMid, reps[0], 'slow', { reroute: true }, weight('app-db')));
    segments.push(seg('db-replicas', db, reps[0], 'none', { dashed: true }));
  } else {
    segments.push(seg('app-db', appMid, db, status('app-db'), {}, weight('app-db')));
    reps.forEach((r) => segments.push(seg('db-replicas', db, r, 'ok', { dashed: true, thin: true }, weight('db-replicas'))));
  }
  if (q && wk[0]) {
    segments.push(seg('app-queue', appMid, { x: 10.2, y: 5.5 }, status('app-queue'), {}, weight('app-queue')));
    segments.push(seg('queue-workers', { x: 13.6, y: 5.5 }, wk[0], (n.queue?.util ?? 0) > 0.8 ? 'slow' : 'ok', {}, weight('queue-db')));
  }

  // ---- labels ----
  const labels: Label[] = [];
  if (inp.labels) {
    const appTopY = 1.4 - ((shown - 1) / 2) * 1.35 - 0.6;
    const L: [{ x: number; y: number; top: number }, string, string, SceneNode | null, boolean][] = [
      [users, 'Users', 'visitors', null, false],
      [lb, 'Load balancer', pct(n.lb?.util ?? 0), 'lb', false],
      [{ x: 9.5, y: appTopY, top: tierH * 0.3 + 0.2 }, 'App servers', `${graph.app.instances} × ${graph.app.tier} · ${pct(n.app?.util ?? 0)}`, 'app', (n.app?.util ?? 0) > 0.92],
      [db, 'Database', primaryDead ? 'primary down' : 'primary · ' + pct(n.db?.util ?? 0), 'db', primaryDead || (n.db?.util ?? 0) > 0.92],
    ];
    if (graph.cdn) L.splice(1, 0, [cdn, 'CDN', 'edge cache', 'cdn', false]);
    if (cache) L.push([cache, 'Cache', cacheDead ? 'offline' : `${Math.round(graph.cache!.hitRatio * 100)}% hit · ${pct(n.cache?.util ?? 0)}`, 'cache', cacheDead]);
    if (reps.length) L.push([{ x: 15.3, y: 2.2, top: 1.6 }, primaryDead ? 'Replica → primary' : 'Read replicas', primaryDead ? 'promoting… ' + pct(n.replicas?.util ?? 0) : `${reps.length} · ${pct(n.replicas?.util ?? 0)}`, 'replicas', false]);
    if (q) {
      L.push([{ x: 11.9, y: 5.5, top: 0.35 }, 'Queue', `backlog ${out.backlog >= 1000 ? (out.backlog / 1000).toFixed(1) + 'k' : Math.round(out.backlog)}`, 'queue', false]);
      L.push([{ x: 15.2, y: 5.4, top: 0.7 }, 'Workers', String(graph.queue!.workers), 'queue', false]);
    }
    L.forEach(([p, name, sub, id, bad]) => {
      const [sx, sy] = pr(p.x, p.y, p.top + 0.35);
      const w = Math.max(name.length, sub.length) * 7 + 20;
      pts.push([sx - w / 2, sy - 32]);
      labels.push({ x: sx, y: sy, name, sub, bad, selected: !!id && id === sel, w });
    });
  }

  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  pts.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
  const pad = inp.pad;
  return { viewBox: `${f1(x0 - pad)} ${f1(y0 - pad)} ${f1(x1 - x0 + pad * 2)} ${f1(y1 - y0 + pad * 2 + 40)}`, shadows, groups, segments, labels, unit: u };
}
