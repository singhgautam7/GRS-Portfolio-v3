import type { SimState, TickOut } from '../engine/model';

/** Readout formatting + plain-language status for the playground UI (pure). */

export const fmtRps = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n)));
export const fmtMs = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(2)} s` : `${Math.round(n)} ms`);
export const fmtPct = (n: number) => `${n.toFixed(1)}%`;
export const fmtCost = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
export const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export type Tone = 'ok' | 'warn' | 'bad' | 'ink';
/** Fills and strokes (dots, sparklines). */
export const toneVar: Record<Tone, string> = { ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--danger)', ink: 'var(--ink-3)' };
/** Small text: ok uses the AA --ok-text. Design gap: --warn on light surfaces is ~3.3:1, so warning
 * text uses ink with the tone carried by the adjacent dot / sparkline. */
export const toneText: Record<Tone, string> = { ok: 'var(--ok-text)', warn: 'var(--ink-2)', bad: 'var(--danger)', ink: 'var(--ink-3)' };

/** SVG sparkline path (92×30, the design's metric card size). */
export function spark(values: number[]): string {
  const N = 24;
  const step = Math.max(1, Math.floor(values.length / N));
  const ys = values.filter((_, i) => i % step === 0).slice(-N);
  if (ys.length < 2) return 'M1 28 L91 28';
  const lo = Math.min(...ys), hi = Math.max(...ys), span = hi - lo || Math.max(1, hi);
  return 'M' + ys.map((y, i) => `${((i / (ys.length - 1)) * 90 + 1).toFixed(1)} ${(29 - ((y - lo) / span) * 0.8 * 27 - 2).toFixed(1)}`).join(' L');
}

const ago = (s: SimState, sec: number): TickOut => s.history[Math.max(0, s.history.length - 1 - sec * 10)] ?? s.out;

export function metrics(s: SimState) {
  const o = s.out, prev = ago(s, 10);
  const pctDelta = (a: number, b: number) => (b > 0 ? Math.round((a / b - 1) * 100) : 0);
  const dT = pctDelta(o.throughput, prev.throughput), dP = pctDelta(o.p95, prev.p95);
  const capped = o.errorPct > 1 && o.throughput < o.offered * 0.99;
  const p95Tone: Tone = o.p95 > 1000 ? 'bad' : o.p95 > 200 ? 'warn' : 'ok';
  const errTone: Tone = o.errorPct > 5 ? 'bad' : o.errorPct > 0.5 ? 'warn' : 'ok';
  const h = s.history;
  const db = 1 + s.graph.db.replicas;
  return [
    { label: 'Throughput', sub: 'requests answered each second', value: fmtRps(o.throughput), delta: capped ? 'capped' : Math.abs(dT) < 3 ? 'steady' : `${dT > 0 ? '+' : ''}${dT}%`, tone: (capped ? 'warn' : 'ok') as Tone, path: spark(h.map((x) => x.throughput)) },
    { label: 'Response time · p95', sub: 'how fast people get a response', value: fmtMs(o.p95), delta: Math.abs(dP) < 10 ? 'steady' : dP > 300 ? `×${Math.round(o.p95 / Math.max(prev.p95, 1))}` : `${dP > 0 ? '+' : ''}${dP}%`, tone: p95Tone, path: spark(h.map((x) => x.p95)) },
    { label: 'Errors', sub: 'requests that never got an answer', value: fmtPct(o.errorPct), delta: o.errorPct < 0.05 ? 'none' : o.errorPct > prev.errorPct + 0.1 ? 'rising' : o.errorPct < prev.errorPct - 0.1 ? 'falling' : `${fmtRps((o.errorPct / 100) * o.offered)}/s lost`, tone: errTone, path: spark(h.map((x) => x.errorPct)) },
    { label: 'Monthly cost', sub: 'what this setup costs to run', value: fmtCost(o.cost), delta: `${s.graph.app.instances} servers · ${db} DB${s.graph.cache ? ' · cache' : ''}`, tone: 'ink' as Tone, path: spark(h.map((x) => x.cost)) },
  ];
}
