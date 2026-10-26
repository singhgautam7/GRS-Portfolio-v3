'use client';

import { memo, useEffect, useId, useMemo, useRef } from 'react';
import { useReducedMotion } from '@/lib/reduced-motion';
import type { Graph, Health, TickOut } from '../engine/model';
import { buildScene } from './iso';
import type { SceneModel, SceneNode, Segment } from './iso';
import s from './iso.module.css';

/** Hard cap on live particles (a visual sample, never 1:1 with requests). SVG keeps it modest. */
const MAX_PARTICLES = 320;

interface Props {
  graph: Graph;
  health: Health;
  out: TickOut;
  t: number;
  selected?: SceneNode | null;
  onSelect?: (n: SceneNode) => void;
  labels?: boolean;
  unit?: number;
  pad?: number;
  /** Particles + overload pulse. Off under reduced motion (flow shows as edge weight + colour). */
  animate?: boolean;
  label?: string;
}

/**
 * The playground scene: the design's isometric SVG (heat, labels, failures), driven by engine
 * state. Static geometry re-renders only when the model changes; particles move in their own
 * rAF loop by writing attributes on a pooled set of circles (no React render per frame).
 */
export function IsoScene({ graph, health, out, t, selected = null, onSelect, labels = true, unit = 48, pad = 30, animate = true, label }: Props) {
  const reduced = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const model = useMemo(() => buildScene({ graph, health, out, t, selected, labels, unit, pad }), [graph, health, out, t, selected, labels, unit, pad]);
  const moving = animate && !reduced;
  return (
    <svg viewBox={model.viewBox} preserveAspectRatio="xMidYMid meet" className={s.svg} role="img" aria-label={label ?? 'System diagram'}>
      <defs>
        <linearGradient id={`${uid}-top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: '#fff', stopOpacity: 'var(--iso-top)' }} />
          <stop offset=".55" style={{ stopColor: '#fff', stopOpacity: 0 }} />
          <stop offset="1" style={{ stopColor: '#000', stopOpacity: 0.07 }} />
        </linearGradient>
        <linearGradient id={`${uid}-side`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: '#fff', stopOpacity: 'var(--iso-side)' }} />
          <stop offset=".55" style={{ stopColor: '#000', stopOpacity: 0 }} />
          <stop offset="1" style={{ stopColor: '#000', stopOpacity: 'var(--iso-ao)' }} />
        </linearGradient>
        <linearGradient id={`${uid}-cyl`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: '#000', stopOpacity: 0.16 }} />
          <stop offset=".28" style={{ stopColor: '#fff', stopOpacity: 'var(--iso-spec)' }} />
          <stop offset=".42" style={{ stopColor: '#fff', stopOpacity: 0 }} />
          <stop offset="1" style={{ stopColor: '#000', stopOpacity: 0.32 }} />
        </linearGradient>
        <filter id={`${uid}-blur`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={(unit * 0.16).toFixed(1)} />
        </filter>
      </defs>
      <g filter={`url(#${uid}-blur)`}>
        {model.shadows.map((d, i) => (
          <path key={i} d={d} style={{ fill: 'var(--iso-shadow)' }} />
        ))}
      </g>
      <Edges model={model} reduced={reduced} />
      {moving && <Particles segments={model.segments} out={out} unit={unit} />}
      {model.groups.map((g, i) => (
        <g
          key={i}
          className={s.node}
          data-selectable={!!onSelect && g.selectable}
          onClick={onSelect && g.selectable ? () => onSelect(g.id) : undefined}
        >
          {g.faces.map((f, j) => (
            <g key={j}>
              <path d={f.d} style={{ fill: f.fill }} />
              {f.overlay && <path d={f.d} style={{ fill: `url(#${uid}-${f.overlay})` }} />}
              <path d={f.d} className={g.pulse && moving ? s.pulse : undefined} style={{ fill: 'none', stroke: g.stroke, strokeWidth: g.strokeWidth, strokeDasharray: g.dash, strokeLinejoin: 'round' }} />
            </g>
          ))}
          {g.lines.map((l, j) => (
            <path key={`l${j}`} d={l.d} style={{ fill: 'none', stroke: l.stroke, strokeWidth: l.stroke === 'var(--iso-hl)' ? 1.3 : 1, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
          ))}
        </g>
      ))}
      {model.labels.map((l, i) => (
        <g key={i} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)})`}>
          <foreignObject x={-l.w / 2} y={-34} width={l.w} height={40} style={{ overflow: 'visible' }}>
            <div className={s.label} data-selected={l.selected}>
              <div className={s.labelName}>{l.name}</div>
              <div className={s.labelSub} data-bad={l.bad}>
                {l.sub}
              </div>
            </div>
          </foreignObject>
        </g>
      ))}
    </svg>
  );
}

const Edges = memo(function Edges({ model, reduced }: { model: SceneModel; reduced: boolean }) {
  return (
    <>
      {model.segments.map((l, i) => {
        const col = l.reroute ? 'var(--accent)' : reduced && l.status !== 'none' ? (l.status === 'drop' ? 'var(--danger)' : l.status === 'slow' ? 'var(--warn)' : 'var(--ok)') : 'var(--line-2)';
        const w = l.thin ? 1.2 : reduced ? 1.5 + l.weight * 4 : 2;
        return (
          <g key={i}>
            <path d={`M${l.a[0].toFixed(1)} ${l.a[1].toFixed(1)} L${l.b[0].toFixed(1)} ${l.b[1].toFixed(1)}`} style={{ fill: 'none', stroke: col, strokeWidth: w, strokeDasharray: l.dashed || l.reroute ? '5 5' : undefined, strokeLinecap: 'round' }} />
            {l.status !== 'none' && !l.thin && <Arrow seg={l} />}
          </g>
        );
      })}
    </>
  );
});

function Arrow({ seg }: { seg: Segment }) {
  const [ax, ay] = seg.a, [bx, by] = seg.b;
  const dx = bx - ax, dy = by - ay, ln = Math.hypot(dx, dy) || 1, ux = dx / ln, uy = dy / ln, mx = ax + dx * 0.5, my = ay + dy * 0.5, k = 5;
  const d = `M${(mx + ux * k).toFixed(1)} ${(my + uy * k).toFixed(1)} L${(mx - ux * k - uy * k * 0.9).toFixed(1)} ${(my - uy * k + ux * k * 0.9).toFixed(1)} L${(mx - ux * k * 0.45).toFixed(1)} ${(my - uy * k * 0.45).toFixed(1)} L${(mx - ux * k + uy * k * 0.9).toFixed(1)} ${(my - uy * k - ux * k * 0.9).toFixed(1)} Z`;
  return <path d={d} style={{ fill: seg.reroute ? 'var(--accent)' : 'var(--ink-3)' }} />;
}

/** Deterministic hash → [0,1) so each particle keeps its colour/offset between frames. */
const rnd = (i: number, j: number) => {
  const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

function Particles({ segments, out, unit }: { segments: Segment[]; out: TickOut; unit: number }) {
  const g = useRef<SVGGElement>(null);
  const live = useRef({ segments, out });
  live.current = { segments, out };
  useEffect(() => {
    const root = g.current;
    if (!root) return;
    const NS = 'http://www.w3.org/2000/svg';
    const pool = Array.from({ length: MAX_PARTICLES }, () => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', '3');
      c.style.display = 'none';
      root.appendChild(c);
      return c;
    });
    let raf = 0;
    const t0 = performance.now();
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const t = (performance.now() - t0) / 1000;
      const { segments: segs, out: o } = live.current;
      let used = 0;
      segs.forEach((l, j) => {
        if (l.status === 'none' || l.thin) return;
        const e = l.id in o.edges ? o.edges[l.id as keyof typeof o.edges] : undefined;
        const len = Math.hypot(l.b[0] - l.a[0], l.b[1] - l.a[1]);
        // Spawn density is a log-scaled sample of the flow, never 1:1.
        const dens = 0.35 + l.weight * 1.4;
        const n = Math.max(2, Math.round((len / unit) * dens * 1.6));
        const slow = e?.slow ?? (l.status === 'slow' ? 0.5 : 0), drop = e?.dropped ?? (l.status === 'drop' ? 0.2 : 0);
        for (let i = 0; i < n && used < MAX_PARTICLES; i++) {
          const f = ((i + rnd(i, j) * 0.6) / n + t * (60 / len) * (1 - slow * 0.5)) % 1;
          let x = l.a[0] + (l.b[0] - l.a[0]) * f, y = l.a[1] + (l.b[1] - l.a[1]) * f, op = 1, col = 'var(--ok)';
          const r = rnd(i + 7, j + 3);
          if (r < drop) {
            col = 'var(--danger)';
            if (f > 0.55) { const k = (f - 0.55) / 0.45; y += k * k * 70; x += k * 10; op = 1 - k; }
          } else if (r < drop + slow) col = 'var(--warn)';
          const c = pool[used++]!;
          c.setAttribute('cx', x.toFixed(1));
          c.setAttribute('cy', (y - 3).toFixed(1));
          c.style.fill = col;
          c.style.opacity = op.toFixed(2);
          c.style.display = '';
        }
      });
      for (let i = used; i < MAX_PARTICLES; i++) pool[i]!.style.display = 'none';
    };
    raf = requestAnimationFrame(frame);
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      pool.forEach((c) => c.remove());
    };
  }, [unit]);
  return <g ref={g} />;
}
