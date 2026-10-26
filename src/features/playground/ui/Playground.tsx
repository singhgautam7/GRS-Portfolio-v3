'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getInput } from '@/input';
import { Keycap2D } from '@/components/ui/Keycap2D';
import { Dialog } from '@/components/ui/Dialog';
import { CAL, TIERS } from '../engine/calibration';
import type { Tier } from '../engine/calibration';
import { createSim, resultLines, resultTitle } from '../engine/sim';
import type { Sim } from '../engine/sim';
import type { Action, SimState } from '../engine/model';
import { SCENARIOS, scenario } from '../scenarios';
import type { Scenario } from '../scenarios';
import { IsoScene } from '../scene/IsoScene';
import { Rail } from './Rail';
import type { SceneNode } from '../scene/iso';
import { fmtClock, fmtCost, fmtMs, fmtPct, fmtRps, metrics, toneText, toneVar } from './format';
import s from './playground.module.css';

const UI_HZ = 6; // UI readouts refresh at ~5–10 Hz; the engine ticks at 10 Hz, the scene animates per frame
const MOBILE = '(max-width: 1023px), (hover: none) and (pointer: coarse)';

function useMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = matchMedia(MOBILE);
    setM(mq.matches);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}

/** Runs the engine outside React and exposes a throttled snapshot. */
function useSim(sc: Scenario | null) {
  const sim = useRef<Sim | null>(null);
  const [snap, setSnap] = useState<SimState | null>(null);
  useEffect(() => {
    if (!sc) return;
    const x = createSim(sc, 7);
    sim.current = x;
    setSnap(x.state);
    const tick = setInterval(() => x.step(), 1000 / CAL.tickHz);
    const ui = setInterval(() => setSnap(x.state), 1000 / UI_HZ);
    return () => {
      clearInterval(tick);
      clearInterval(ui);
      sim.current = null;
    };
  }, [sc]);
  const dispatch = useCallback((a: Action) => {
    const x = sim.current;
    if (x) setSnap(x.dispatch(a));
  }, []);
  const reset = useCallback(() => {
    const x = sim.current;
    if (x) setSnap(x.reset());
  }, []);
  return { snap, dispatch, reset };
}

const STATUS: Record<string, { text: string; tone: keyof typeof toneVar }> = {
  met: { text: 'goal met', tone: 'ok' },
  failed: { text: 'failed', tone: 'bad' },
  recovering: { text: 'recovering', tone: 'warn' },
  holding: { text: 'holding', tone: 'ok' },
  failing: { text: 'failing', tone: 'bad' },
  notyet: { text: 'not yet', tone: 'warn' },
  warming: { text: 'warming up', tone: 'ink' },
};

function goalView(sc: Scenario, st: SimState) {
  const o = st.out, g = st.goal, w = sc.window;
  let key: keyof typeof STATUS = 'warming';
  if (g.status === 'met') key = 'met';
  else if (g.status === 'failed') key = 'failed';
  else if (g.status === 'running') key = w?.kind === 'recover' ? 'recovering' : 'holding';
  else if (o.errorPct > 1) key = 'failing';
  else if (o.p95 > 200) key = 'notyet';
  let progress = '';
  if (g.status === 'met' && w?.kind !== 'recover') progress = `Held for ${Math.round(g.held)}s`;
  else if (w?.kind === 'sustain') progress = g.status === 'running' ? `Held for ${Math.floor(g.held)}s of ${w.seconds}s` : o.errorPct > 1 ? 'Servers at 100%. Requests are being dropped' : o.p95 > 200 ? 'Response time is over 200ms' : sc.hints.idle;
  else if (w?.kind === 'during') progress = st.t < w.from ? `The burst starts in ${Math.ceil(w.from - st.t)}s` : `Held for ${Math.floor(g.held)}s of ${w.to - w.from}s`;
  else if (w?.kind === 'recover') progress = st.incidents.length ? st.incidents.slice(-2).map((i) => i.label).join(' · ') : sc.hints.idle;
  const values = sc.goals.map((gl) => (gl.metric === 'throughput' ? fmtRps(o.throughput) : gl.metric === 'p95' ? fmtMs(o.p95) : gl.metric === 'errorPct' ? fmtPct(o.errorPct) : fmtCost(o.cost)));
  return { ...STATUS[key]!, progress, values };
}

function hint(sc: Scenario, st: SimState) {
  if (st.out.errorPct > 1) return { text: sc.hints.errors, tone: 'bad' as const };
  if (st.out.p95 > 200) return { text: sc.hints.slow, tone: 'warn' as const };
  return { text: sc.hints.idle, tone: 'ok' as const };
}

const DESC: Record<SceneNode, { name: string; desc: string }> = {
  users: { name: 'Users', desc: 'People hitting your site.' },
  cdn: { name: 'CDN', desc: 'Serves images and scripts from servers near your users, before they reach you.' },
  lb: { name: 'Load balancer', desc: 'Spreads requests across the app servers that are healthy.' },
  app: { name: 'App servers', desc: 'Run your code. More of them answer more requests at once.' },
  cache: { name: 'Cache', desc: 'Keeps popular answers in memory so the database doesn’t have to look them up again.' },
  db: { name: 'Database', desc: 'Stores everything. Writes go to the primary; reads can use replicas.' },
  replicas: { name: 'Read replicas', desc: 'Copies of the database that answer reads and can take over if the primary fails.' },
  queue: { name: 'Queue', desc: 'Holds writes so a burst waits its turn instead of failing.' },
  workers: { name: 'Workers', desc: 'Take writes off the queue and save them.' },
};

function Stepper({ label, value, onChange, min, max }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number }) {
  return (
    <span className={s.stepper} role="group" aria-label={label}>
      <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </span>
  );
}

function Inspector({ node, st, dispatch, onClose }: { node: SceneNode; st: SimState; dispatch: (a: Action) => void; onClose: () => void }) {
  const g = st.graph, o = st.out;
  const id = node === 'workers' ? 'queue' : node === 'replicas' ? 'db' : node;
  const d = DESC[id];
  const tier = TIERS[g.app.tier];
  const pass = o.offered * (g.cdn ? 1 - CAL.staticShare * CAL.cdnHit : 1);
  const rows: { label: string; control?: React.ReactNode; value?: string; effect: string }[] = [];
  if (id === 'app') {
    rows.push(
      { label: 'Instances', control: <Stepper label="Instances" value={g.app.instances} min={1} max={12} onChange={(n) => dispatch({ type: 'instances', n })} />, effect: `+1 server → +${tier.cap.toLocaleString('en-US')} req/s capacity · +$${tier.price}/mo` },
      {
        label: 'Size per server',
        control: (
          <span className={s.tiers} role="radiogroup" aria-label="Size per server">
            {(Object.keys(TIERS) as Tier[]).map((t) => (
              <button key={t} type="button" role="radio" aria-checked={g.app.tier === t} onClick={() => dispatch({ type: 'tier', tier: t })}>
                {t}
              </button>
            ))}
          </span>
        ),
        effect: `${g.app.tier}: ${tier.cap.toLocaleString('en-US')} req/s each · $${tier.price}/mo. L doubles capacity for 2.2× cost.`,
      },
      { label: 'Capacity now', value: `${Math.round(o.appCapacity).toLocaleString('en-US')} req/s`, effect: `At ${Math.round(pass).toLocaleString('en-US')} req/s you’re at ${Math.round((pass / Math.max(o.appCapacity, 1)) * 100)}%${pass > o.appCapacity ? ' → the rest is dropped.' : '.'}` },
    );
  } else if (id === 'cache' && g.cache) {
    const hit = Math.round(g.cache.hitRatio * 100);
    rows.push({
      label: 'Hit ratio',
      value: `${hit}%`,
      control: <input type="range" className={s.range} min={0} max={95} value={hit} aria-label="Cache hit ratio" onChange={(e) => dispatch({ type: 'cacheHit', ratio: +e.target.value / 100 })} style={{ ['--fill' as string]: `${hit / 0.95}%` }} />,
      effect: `${hit}% of reads never reach the database → DB load −${hit}% · +$${CAL.cache.price}/mo`,
    });
  } else if (id === 'db') {
    rows.push(
      { label: 'Read replicas', control: <Stepper label="Read replicas" value={g.db.replicas} min={0} max={4} onChange={(n) => dispatch({ type: 'replicas', n })} />, effect: `+1 replica → +${CAL.db.cap.toLocaleString('en-US')} reads/s · can take over if the primary fails · +$${CAL.db.replicaPrice}/mo` },
      { label: 'Primary load', value: `${Math.round((o.nodes.db?.util ?? 0) * 100)}%`, effect: 'Every write lands here. A cache or a queue takes pressure off.' },
    );
  } else if (id === 'queue' && g.queue) {
    rows.push(
      { label: 'Workers', control: <Stepper label="Workers" value={g.queue.workers} min={1} max={10} onChange={(n) => dispatch({ type: 'workers', n })} />, effect: `+1 worker → +${CAL.worker.rate} writes/s · +$${CAL.worker.price}/mo` },
      { label: 'Backlog', value: Math.round(o.backlog).toLocaleString('en-US'), effect: `Waiting about ${fmtMs((o.backlog / (g.queue.workers * CAL.worker.rate)) * 1000)} to be saved.` },
    );
  } else if (id === 'lb') {
    rows.push({ label: 'Load', value: `${Math.round((o.nodes.lb?.util ?? 0) * 100)}%`, effect: `Handles up to ${CAL.lb.cap.toLocaleString('en-US')} req/s · $${CAL.lb.price}/mo. Stops sending to a dead server after ${CAL.healthCheckS}s.` });
  } else if (id === 'cdn') {
    rows.push({ label: 'Served at the edge', value: `${Math.round(CAL.staticShare * CAL.cdnHit * 100)}%`, effect: `${Math.round(CAL.cdnHit * 100)}% of images and scripts never reach your servers · $${CAL.cdn.price}/mo` });
  }
  return (
    <div className={s.inspector} role="region" aria-label={`${d.name} settings`}>
      <div className={s.inspHead}>
        <div className={s.inspTitles}>
          <span className={s.tag}>SELECTED</span>
          <span className={s.inspName}>{d.name}</span>
          <span className={s.inspDesc}>{d.desc}</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Close settings" className={s.bare}>
          <Keycap2D>esc</Keycap2D>
        </button>
      </div>
      {rows.map((r) => (
        <div key={r.label} className={s.inspRow}>
          <div className={s.inspRowHead}>
            <span className={s.inspLabel}>{r.label}</span>
            {r.control && r.label !== 'Hit ratio' ? r.control : r.value && <span className={s.inspValue}>{r.value}</span>}
          </div>
          {r.label === 'Hit ratio' && r.control}
          <span className={s.effect}>{r.effect}</span>
        </div>
      ))}
      {(id === 'cdn' || id === 'cache' || id === 'queue') && (
        <button
          type="button"
          className={s.remove}
          onClick={() => {
            dispatch({ type: 'toggle', node: id });
            onClose();
          }}
        >
          Remove {d.name.toLowerCase()}
        </button>
      )}
    </div>
  );
}

function Picker({ onPick, mobile }: { onPick: (sc: Scenario) => void; mobile: boolean }) {
  return (
    <div className={s.pickerWrap}>
      <div className={s.pickerHead}>
        <span className={s.pickTag}>PICK A SCENARIO</span>
        <h1 className={s.pickTitle}>Push traffic through a system and see what breaks.</h1>
      </div>
      <div className={s.pickGrid}>
        {SCENARIOS.map((sc, i) => (
          <button key={sc.id} type="button" className={s.pickCard} data-first={i === 0} onClick={() => onPick(sc)}>
            <span className={s.pickRow}>
              <span className={s.tag}>{sc.tag}</span>
              <span className={s.meta}>{mobile && sc.desktopOnly ? 'Best on desktop' : sc.meta}</span>
            </span>
            <span className={s.pickName}>{sc.title}</span>
            <span className={s.pickGoal}>{sc.goalText}</span>
            <span className={s.start}>
              Start <span className={s.mono}>→</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}


/**
 * System Design Playground (design 3a–3i, mobile 4d). Engine runs outside React; the UI reads a
 * throttled snapshot; metrics + goal are announced through a throttled polite live region.
 */
export function Playground() {
  const router = useRouter();
  const mobile = useMobile();
  const [sc, setSc] = useState<Scenario | null>(null);
  const [picked, setPicked] = useState(false);
  const { snap, dispatch, reset } = useSim(sc);
  const [sel, setSel] = useState<SceneNode | null>(null);
  const [breakOpen, setBreakOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [announce, setAnnounce] = useState('');
  const lastAnnounce = useRef({ t: 0, status: '' });

  // Deep link: /playground#viral (static export: the hash survives without a server).
  useEffect(() => {
    const id = location.hash.slice(1);
    const found = SCENARIOS.find((x) => x.id === id);
    setSc(found ?? scenario('viral'));
    setPicked(!!found);
  }, []);
  const pick = (x: Scenario) => {
    history.replaceState(null, '', `#${x.id}`);
    setSel(null);
    setDismissed(false);
    if (x === sc) reset();
    else setSc(x);
    setPicked(true);
  };

  // Esc: close the top thing, else back to the portfolio.
  useEffect(
    () =>
      getInput().handle('escape', () => {
        if (breakOpen) setBreakOpen(false);
        else if (sel) setSel(null);
        else router.push('/');
      }),
    [breakOpen, sel, router],
  );

  // Throttled polite announcements: on goal status change, else at most every 8s.
  useEffect(() => {
    if (!snap || !sc || !picked) return;
    const now = performance.now();
    const status = snap.goal.status;
    if (status === lastAnnounce.current.status && now - lastAnnounce.current.t < 8000) return;
    lastAnnounce.current = { t: now, status };
    const gv = goalView(sc, snap);
    setAnnounce(`${sc.goals.length ? `Goal ${gv.text}. ` : ''}Throughput ${fmtRps(snap.out.throughput)} per second, p95 ${fmtMs(snap.out.p95)}, errors ${fmtPct(snap.out.errorPct)}.`);
  }, [snap, sc, picked]);

  const ms = useMemo(() => (snap ? metrics(snap) : []), [snap]);
  if (!sc || !snap) return <main id="main" className={s.page} />;
  const gv = goalView(sc, snap);
  const ended = (snap.goal.status === 'met' || snap.goal.status === 'failed') && !dismissed;
  const sliderPct = (snap.rps / 20_000) * 100;
  const sliderTone = snap.out.errorPct > 1 ? 'var(--danger)' : snap.out.p95 > 200 ? 'var(--warn)' : 'var(--ok)';
  const h = hint(sc, snap);

  const breakItems = [
    { what: 'server' as const, label: 'Kill a server', sub: 'One app server stops. The rest take its load.', off: false },
    { what: 'cache' as const, label: 'Take the cache offline', sub: 'Every read goes to the database.', off: !snap.graph.cache },
    { what: 'primary' as const, label: 'Fail the database primary', sub: 'Writes stop until a replica takes over.', off: snap.health.primaryDownAt !== null },
  ];
  const breakMenu = (
    <div className={s.breakMenu} role="menu">
      {breakItems.map((b) => (
        <button key={b.what} type="button" role="menuitem" disabled={b.off} className={s.breakItem} onClick={() => { dispatch({ type: 'fail', what: b.what }); setBreakOpen(false); }}>
          <span className={s.breakLabel}>
            <span className={s.dangerDot} aria-hidden />
            {b.label}
          </span>
          <span className={s.breakSub}>{b.sub}</span>
        </button>
      ))}
    </div>
  );

  const slider = (
    <input
      type="range"
      className={s.traffic}
      min={0}
      max={20_000}
      step={250}
      value={snap.rps}
      disabled={!!sc.profile}
      aria-label="Traffic, requests per second"
      aria-valuetext={`${snap.rps.toLocaleString('en-US')} requests per second`}
      onChange={(e) => dispatch({ type: 'traffic', rps: +e.target.value })}
      style={{ ['--fill' as string]: `${sliderPct}%`, ['--tone' as string]: sliderTone }}
    />
  );

  const result = ended && (
    <Dialog open onClose={() => setDismissed(true)} label="Scenario result" className={s.result}>
      <div className={s.resultInner}>
        <span className={s.resultTag}>
          <span className={s.bigDot} style={{ background: snap.goal.status === 'met' ? 'var(--ok)' : 'var(--danger)' }} aria-hidden />
          {snap.goal.status === 'met' ? `GOAL MET · ${fmtClock(snap.t)}` : sc.window?.kind === 'during' ? `NOT QUITE · HELD ${Math.round(snap.goal.held)}s OF ${sc.window.to - sc.window.from}s` : 'NOT QUITE'}
        </span>
        <h2 className={s.resultTitle}>{resultTitle(sc, snap)}</h2>
        <div className={s.resultStats}>
          {[
            ['Throughput', `${fmtRps(snap.out.throughput)}/s`, false],
            ['p95', fmtMs(snap.out.p95), snap.out.p95 > 200],
            ['Dropped', fmtPct(snap.out.errorPct), snap.out.errorPct > 1],
          ].map(([l, v, bad]) => (
            <div key={l as string} className={s.resultStat}>
              <span>{l}</span>
              <strong style={{ color: bad ? 'var(--danger)' : 'var(--ink)' }}>{v}</strong>
            </div>
          ))}
        </div>
        <div className={s.resultList}>
          <span className={s.label}>{snap.goal.status === 'met' ? 'WHAT WORKED' : 'WHAT BROKE · WHAT TO TRY'}</span>
          {resultLines(sc, snap).map((l) => (
            <div key={l} className={s.point}>
              <span className={s.arrow} aria-hidden>
                →
              </span>
              <span>{l}</span>
            </div>
          ))}
        </div>
        <div className={s.resultBtns}>
          {snap.goal.status === 'met' ? (
            <>
              <button type="button" className={s.primary} onClick={() => setPicked(false)}>
                Try another scenario
              </button>
              <button type="button" className={s.secondary} onClick={() => { setDismissed(true); dispatch({ type: 'play', playing: true }); }}>
                Keep playing
              </button>
            </>
          ) : (
            <>
              <button type="button" className={s.primary} onClick={() => { setDismissed(false); reset(); }}>
                Try again
              </button>
              <button type="button" className={s.secondary} onClick={() => setPicked(false)}>
                Try another scenario
              </button>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );

  const live = (
    <div className="sr-only" role="status" aria-live="polite">
      {announce}
    </div>
  );

  if (mobile) {
    return (
      <main id="main" className={s.mPage}>
        <div className={s.mTop}>
          <Link href="/" className={s.mBack}>
            ← Portfolio
          </Link>
          <span className={s.mTitle}>
            <span className={s.mTag}>{sc.tag}</span>
            <span>{sc.title}</span>
          </span>
        </div>
        {!picked ? (
          <Picker onPick={pick} mobile />
        ) : (
          <>
            <div className={s.mMetrics}>
              {ms.map((m) => (
                <div key={m.label} className={s.mMetric}>
                  <span>{m.label.replace('Response time · ', '').replace('Monthly cost', 'Cost').replace('Errors', 'Dropped')}</span>
                  <strong style={{ color: m.tone === 'ok' || m.tone === 'ink' ? 'var(--ink)' : toneText[m.tone] }}>{m.label === 'Throughput' ? `${m.value}/s` : m.value}</strong>
                </div>
              ))}
            </div>
            <div className={s.mScene}>
              <IsoScene graph={snap.graph} health={snap.health} out={snap.out} t={snap.t} labels={false} unit={24} pad={8} label={`${sc.title}: system diagram`} />
            </div>
            <div className={s.mHint}>
              <span className={s.bigDot} style={{ background: toneVar[h.tone] }} aria-hidden />
              <span>{h.text}</span>
            </div>
            <div className={s.mControls}>
              <div className={s.mTraffic}>
                <span>Traffic</span>
                <strong>
                  {snap.rps.toLocaleString('en-US')} <span className={s.unit}>req/s</span>
                </strong>
              </div>
              {slider}
              <div className={s.mBtns}>
                <button type="button" className={s.mPlay} aria-label={snap.playing ? 'Pause' : 'Play'} aria-pressed={!snap.playing} onClick={() => dispatch({ type: 'play', playing: !snap.playing })}>
                  {snap.playing ? '❚❚' : '▶'}
                </button>
                <button type="button" className={s.mBreak} onClick={() => setBreakOpen(true)}>
                  <span className={s.dangerDot} aria-hidden />
                  Break something
                </button>
              </div>
            </div>
            <Dialog open={breakOpen} onClose={() => setBreakOpen(false)} label="Break something" variant="sheet">
              <div style={{ padding: '12px 12px 32px' }}>{breakMenu}</div>
            </Dialog>
          </>
        )}
        {result}
        {live}
      </main>
    );
  }

  return (
    <main id="main" className={s.page}>
      <div className={s.scene} data-dim={!picked}>
        <IsoScene graph={snap.graph} health={snap.health} out={snap.out} t={snap.t} selected={sel} onSelect={picked ? setSel : undefined} labels={picked} unit={48} label={`${sc.title}: system diagram. Select a block to tune it.`} />
      </div>

      <header className={s.top}>
        <Link href="/" className={s.back}>
          <span>← Back to portfolio</span>
          <Keycap2D>esc</Keycap2D>
        </Link>
        <div className={s.topMid}>
          <span className={s.marker}>{'// 05 · PLAYGROUND'}</span>
          <span className={s.topTitle}>{picked ? sc.title : 'Choose a scenario'}</span>
        </div>
        <div className={s.topRight}>
          {picked && (
            <div className={s.breakAnchor}>
              <button type="button" className={s.breakBtn} data-open={breakOpen} aria-haspopup="menu" aria-expanded={breakOpen} onClick={() => setBreakOpen((o) => !o)}>
                <span className={s.dangerDot} aria-hidden />
                Break something <span className={s.caret}>▾</span>
              </button>
              {breakOpen && breakMenu}
            </div>
          )}
          {picked && (
            <button type="button" className={s.reset} onClick={() => { setSel(null); setDismissed(false); reset(); }}>
              Reset
            </button>
          )}
        </div>
      </header>

      {picked && (
        <Rail graph={snap.graph} dispatch={dispatch} onSelect={setSel} />
      )}

      {picked && !sel && (
        <aside className={s.side} aria-label="Goal and metrics">
          {sc.goals.length > 0 && (
            <div className={s.goal}>
              <div className={s.rowBetween}>
                <span className={s.label}>GOAL</span>
                <span className={s.goalStatus} style={{ color: toneText[gv.tone] }}>
                  {gv.text}
                </span>
              </div>
              <span className={s.goalText}>{sc.goalText}</span>
              <div className={s.checks}>
                {sc.goals.map((gl, i) => (
                  <div key={gl.label} className={s.check}>
                    <span className={s.mark} data-pass={snap.goal.checks[i]}>
                      {snap.goal.checks[i] ? '✓' : '×'}
                    </span>
                    <span className={s.grow}>{gl.label}</span>
                    <span className={s.checkVal}>{gv.values[i]}</span>
                  </div>
                ))}
              </div>
              <div className={s.bar}>
                <div style={{ width: `${Math.round(snap.goal.progress * 100)}%` }} />
              </div>
              <span className={s.progress}>{gv.progress}</span>
            </div>
          )}
          {ms.map((m) => (
            <div key={m.label} className={s.metric}>
              <span className={s.metricLabel}>{m.label}</span>
              <span className={s.sparkWrap} style={{ color: toneVar[m.tone] }} aria-hidden>
                <svg width="92" height="30" viewBox="0 0 92 30">
                  <path d={m.path} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className={s.metricSub}>{m.sub}</span>
              <span className={s.metricValue}>
                <span>{m.value}</span>
                <span className={s.delta} style={{ color: toneText[m.tone] }}>
                  {m.delta}
                </span>
              </span>
            </div>
          ))}
        </aside>
      )}
      {picked && sel && <Inspector node={sel} st={snap} dispatch={dispatch} onClose={() => setSel(null)} />}

      {picked && snap.incidents.length > 0 && (
        <div className={s.incidents} aria-label="Incident timeline">
          {snap.incidents.slice(-4).map((ev, i) => (
            <span key={i} className={s.incident}>
              <span className={s.meta}>{fmtClock(ev.t)}</span>
              <span className={s.bigDot} style={{ background: ev.level === 'danger' ? 'var(--danger)' : ev.level === 'warn' ? 'var(--warn)' : 'var(--ok)' }} aria-hidden />
              <span>{ev.label}</span>
            </span>
          ))}
        </div>
      )}

      {picked && (
        <div className={s.trafficCard}>
          <button type="button" className={s.play} aria-label={snap.playing ? 'Pause' : 'Play'} aria-pressed={!snap.playing} onClick={() => dispatch({ type: 'play', playing: !snap.playing })}>
            {snap.playing ? '❚❚' : '▶'}
          </button>
          <div className={s.trafficBody}>
            <div className={s.rowBetween}>
              <span className={s.trafficLabel}>
                Traffic <span className={s.muted}>· people hitting your site each second</span>
              </span>
              <span className={s.trafficValue}>
                {snap.rps.toLocaleString('en-US')} <span className={s.unit}>req/s</span>
              </span>
            </div>
            <div className={s.sliderWrap}>
              <span className={s.goalMark} aria-hidden />
              {slider}
            </div>
            <div className={s.ticks} aria-hidden>
              <span>0</span>
              <span>5k</span>
              <span className={s.goalTick}>10k · goal</span>
              <span>15k</span>
              <span>20k</span>
            </div>
          </div>
        </div>
      )}

      {!picked && (
        <>
          <div className={s.scrim} />
          <Picker onPick={pick} mobile={false} />
        </>
      )}
      {result}
      {live}
    </main>
  );
}
