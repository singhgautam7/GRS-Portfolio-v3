'use client';

import { useId, useRef, useState } from 'react';
import type { Action, Graph } from '../engine/model';
import type { SceneNode } from '../scene/iso';
import { RAIL_GROUPS, railInfo } from './railInfo';
import s from './playground.module.css';

/**
 * Left component rail with an ink tooltip to its right (design 3i "Connect" tip placement) that
 * says what the key is and what a click does: add, add one more, or "already added".
 */
export function Rail({ graph, dispatch, onSelect }: { graph: Graph; dispatch: (a: Action) => void; onSelect: (n: SceneNode) => void }) {
  const [hover, setHover] = useState<{ k: string; top: number } | null>(null);
  const nav = useRef<HTMLElement>(null);
  const tipId = useId();
  const show = (k: string, el: HTMLElement) => {
    const r = el.getBoundingClientRect(), n = nav.current?.getBoundingClientRect();
    setHover({ k, top: r.top - (n?.top ?? 0) + r.height / 2 });
  };
  const tip = hover ? railInfo(hover.k, graph).tip : null;
  return (
    <nav ref={nav} className={s.rail} aria-label="Components" onPointerLeave={() => setHover(null)}>
      {RAIL_GROUPS.map((g) => (
        <div key={g.t} className={s.railGroup}>
          <span className={s.railTitle}>{g.t}</span>
          <div className={s.railGrid}>
            {g.items.map(({ k, name }) => {
              const info = railInfo(k, graph);
              return (
                <button
                  key={k}
                  type="button"
                  className={s.railKey}
                  data-state={info.state}
                  aria-label={name}
                  aria-describedby={hover?.k === k ? tipId : undefined}
                  aria-disabled={info.state === 'soon' || undefined}
                  onPointerEnter={(e) => show(k, e.currentTarget)}
                  onFocus={(e) => show(k, e.currentTarget)}
                  onBlur={() => setHover(null)}
                  onClick={() => {
                    info.actions.forEach(dispatch);
                    if (info.select) onSelect(info.select);
                  }}
                >
                  {k}
                  {info.count != null && <span className={s.railCount}>{info.count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <span className={s.railNote}>tap to add</span>
      {hover && tip && (
        <span id={tipId} role="tooltip" className={s.railTip} style={{ top: hover.top }}>
          {tip}
        </span>
      )}
    </nav>
  );
}
