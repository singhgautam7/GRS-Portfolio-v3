import { CAL, TIERS, nodeP95 } from './calibration';
import { SCHEMA_VERSION } from './model';
import type { Action, EdgeOut, Goal, GoalState, Graph, Health, NodeOut, SimState, TickOut } from './model';
import type { Scenario } from '../scenarios';

/**
 * The playground simulation: pure TypeScript (no React / DOM / three), fixed 10 Hz step,
 * deterministic for the same scenario, actions and seed. Movable to a Web Worker as-is.
 *
 * Flow model (per tick):
 *  CDN serves cdnHit × the static share at the edge → the LB splits the rest over app instances
 *  (instances that died but are not yet health-checked out still get their share, which drops)
 *  → app capacity = healthy × tier capacity; excess is dropped (503). Of what the app serves,
 *  reads hit the cache (hitRatio) and misses go to the database; writes go to the primary, or
 *  into the queue when there is one (workers drain it into the primary; backlog grows by
 *  (in − workerCap) × dt). DB reads spread over the primary and replicas; each DB node drops
 *  what exceeds its capacity. A failed primary drops writes and its reads until a replica is
 *  promoted (after promotionS).
 *  p95 per node = base × ln(20) / (1 − ρ) (M/M/1, capped); the path p95 is the weighted sum of
 *  the nodes a request crosses. Cost = sum of monthly prices.
 */

const DT = 1 / CAL.tickHz;

/** mulberry32: tiny seeded PRNG for deterministic noise. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function monthlyCost(g: Graph): number {
  let c = CAL.lb.price + g.app.instances * TIERS[g.app.tier].price + CAL.db.primaryPrice + g.db.replicas * CAL.db.replicaPrice;
  if (g.cdn) c += CAL.cdn.price;
  if (g.cache) c += CAL.cache.price;
  if (g.queue) c += CAL.queue.price + g.queue.workers * CAL.worker.price;
  return c;
}

const edge = (flow: number, slowFrac: number, dropped: number): EdgeOut => {
  const total = Math.max(flow, 1e-9);
  const d = Math.min(1, dropped / total);
  const sl = Math.min(1 - d, slowFrac);
  return { flow, ok: 1 - d - sl, slow: sl, dropped: d };
};
const slowness = (p95: number, base: number) => Math.min(1, Math.max(0, (p95 / (base * CAL.p95Factor) - 2) / 6));

/** One tick of flow. Pure: returns outputs and the new queue backlog. */
export function computeFlow(g: Graph, h: Health, t: number, offered: number, backlog: number, noise = 1): { out: TickOut; backlog: number } {
  // CDN
  const edgeServed = g.cdn ? offered * CAL.staticShare * CAL.cdnHit : 0;
  const pass = offered - edgeServed;

  // LB → app instances
  const restarting = h.deadServers.filter((d) => t - d < CAL.serverRestartS);
  const detected = restarting.filter((d) => t - d >= CAL.healthCheckS).length;
  const undetected = restarting.length - detected;
  const inRotation = Math.max(0, g.app.instances - detected);
  const live = Math.max(0, inRotation - undetected);
  const deadShare = inRotation > 0 ? undetected / inRotation : 1;
  const droppedDead = pass * deadShare;
  const toApp = pass - droppedDead;
  const appCap = live * TIERS[g.app.tier].cap;
  const appServed = Math.min(toApp, appCap);
  const appDrop = toApp - appServed;
  const rhoApp = appCap > 0 ? toApp / appCap : 1;
  const lbP95 = nodeP95(CAL.lb.baseMs, pass / CAL.lb.cap);
  const appP95 = nodeP95(CAL.app.baseMs, rhoApp);

  // Reads / writes
  const reads = appServed * CAL.readShare;
  const writes = appServed - reads;
  const cacheUp = !!g.cache && h.cacheDownAt === null;
  const hits = cacheUp ? reads * g.cache!.hitRatio : 0;
  const misses = reads - hits;
  const cacheP95 = nodeP95(CAL.cache.baseMs, reads / CAL.cache.cap);

  // Queue (async writes)
  let writesToDb = writes;
  let queueDrop = 0;
  let queueOut = 0;
  let newBacklog = backlog;
  const workerCap = g.queue ? g.queue.workers * CAL.worker.rate : 0;
  if (g.queue) {
    queueOut = Math.min(workerCap, writes + backlog / DT);
    newBacklog = backlog + (writes - queueOut) * DT;
    if (newBacklog > CAL.queue.maxBacklog) {
      queueDrop = (newBacklog - CAL.queue.maxBacklog) / DT;
      newBacklog = CAL.queue.maxBacklog;
    }
    writesToDb = queueOut;
  }

  // Database: primary (+ promotion) and replicas
  const downFor = h.primaryDownAt === null ? -1 : t - h.primaryDownAt;
  const promoted = downFor >= CAL.promotionS && g.db.replicas > 0;
  const primaryUp = h.primaryDownAt === null || promoted;
  const replicas = promoted ? g.db.replicas - 1 : g.db.replicas;
  const readers = (primaryUp ? 1 : 0) + replicas;
  const perReader = readers > 0 ? misses / readers : 0;
  const readDropNoDb = readers > 0 ? 0 : misses;
  const writeDropDown = primaryUp ? 0 : writesToDb;
  const primaryLoad = primaryUp ? writesToDb + perReader : 0;
  const primaryDrop = Math.max(0, primaryLoad - CAL.db.cap);
  const replicaDrop = Math.max(0, perReader - CAL.db.cap) * replicas;
  const rhoPrimary = primaryLoad / CAL.db.cap;
  const rhoReplica = perReader / CAL.db.cap;
  const primaryP95 = nodeP95(CAL.db.baseMs, rhoPrimary);
  const readP95 = readers > 0 ? (primaryUp ? (primaryP95 + replicas * nodeP95(CAL.db.baseMs, rhoReplica)) / readers : nodeP95(CAL.db.baseMs, rhoReplica)) : CAL.maxLatencyMs;

  // Totals
  const dbDrops = primaryDrop + replicaDrop + readDropNoDb + writeDropDown;
  const dropped = droppedDead + appDrop + dbDrops + queueDrop;
  const served = Math.max(0, offered - dropped);
  const readFrac = appServed > 0 ? reads / appServed : CAL.readShare;
  const hitFrac = reads > 0 ? hits / reads : 0;
  const writeP95 = g.queue ? nodeP95(CAL.queue.baseMs, 0) : primaryP95;
  const dynP95 = lbP95 + appP95 + readFrac * (hitFrac * cacheP95 + (1 - hitFrac) * readP95) + (1 - readFrac) * writeP95;
  const edgeFrac = offered > 0 ? edgeServed / offered : 0;
  const p95 = Math.min(CAL.maxLatencyMs, (edgeFrac * nodeP95(CAL.cdn.baseMs, 0) + (1 - edgeFrac) * dynP95) * noise);

  const node = (util: number, p: number, drops: number, healthy = true): NodeOut => ({ util: Math.min(1.2, util), p95: p, drops, healthy });
  const out: TickOut = {
    t,
    offered,
    throughput: served,
    p95,
    errorPct: offered > 0 ? (dropped / offered) * 100 : 0,
    cost: monthlyCost(g),
    backlog: newBacklog,
    appCapacity: appCap,
    nodes: {
      client: node(0, 0, 0),
      lb: node(pass / CAL.lb.cap, lbP95, droppedDead),
      app: node(rhoApp, appP95, appDrop, live > 0),
      db: node(primaryUp ? rhoPrimary : 0, primaryP95, primaryDrop + writeDropDown, primaryUp),
      replicas: node(rhoReplica, nodeP95(CAL.db.baseMs, rhoReplica), replicaDrop),
      ...(g.cdn ? { cdn: node(edgeServed / Math.max(offered, 1), nodeP95(CAL.cdn.baseMs, 0), 0) } : {}),
      ...(g.cache ? { cache: node(cacheUp ? reads / CAL.cache.cap : 0, cacheP95, 0, cacheUp) } : {}),
      ...(g.queue ? { queue: node(workerCap > 0 ? writes / workerCap : 1, newBacklog / Math.max(workerCap, 1) * 1000, queueDrop) } : {}),
    },
    edges: {
      'client-cdn': edge(offered, 0, 0),
      'cdn-lb': edge(pass, 0, droppedDead),
      'lb-app': edge(toApp, slowness(appP95, CAL.app.baseMs), appDrop),
      ...(g.cache ? { 'app-cache': edge(cacheUp ? reads : 0, 0, 0) } : {}),
      'app-db': edge(misses + (g.queue ? 0 : writes), slowness(readP95, CAL.db.baseMs), dbDrops),
      'db-replicas': edge(perReader * replicas, slowness(nodeP95(CAL.db.baseMs, rhoReplica), CAL.db.baseMs), replicaDrop),
      ...(g.queue ? { 'app-queue': edge(writes, newBacklog > workerCap ? 0.6 : 0, queueDrop), 'queue-db': edge(queueOut, 0, writeDropDown) } : {}),
    },
  };
  return { out, backlog: newBacklog };
}

const metric = (o: TickOut, m: Goal['metric']) => (m === 'throughput' ? o.throughput : m === 'p95' ? o.p95 : m === 'errorPct' ? o.errorPct : o.cost);
/** Throughput targets allow the rounding a readout shows ("10.0k" for 9.8k+). */
export const goalChecks = (goals: Goal[], o: TickOut) =>
  goals.map((g) => (g.op === '>=' ? metric(o, g.metric) >= g.value * (g.metric === 'throughput' ? CAL.throughputTolerance : 1) : metric(o, g.metric) <= g.value));

function evalGoal(sc: Scenario, s: SimState): GoalState {
  const prev = s.goal;
  const checks = goalChecks(sc.goals, s.out);
  const w = sc.window;
  if (!w || !sc.goals.length) return { ...prev, status: 'none', checks };
  if (prev.status === 'met' || prev.status === 'failed') return { ...prev, checks };
  const allOk = checks.every(Boolean);
  const t = s.t;
  if (w.kind === 'sustain') {
    const held = allOk ? prev.held + DT : 0;
    const met = held >= w.seconds - 1e-9;
    return { status: met ? 'met' : allOk ? 'running' : 'waiting', held, progress: Math.min(1, held / w.seconds), checks, endedAt: met ? t : null };
  }
  if (w.kind === 'during') {
    if (t < w.from) return { status: 'waiting', held: 0, progress: 0, checks, endedAt: null };
    if (!allOk) return { status: 'failed', held: prev.held, progress: prev.held / (w.to - w.from), checks, endedAt: t };
    const held = Math.min(w.to - w.from, prev.held + DT);
    const met = t >= w.to - 1e-9;
    return { status: met ? 'met' : 'running', held, progress: held / (w.to - w.from), checks, endedAt: met ? t : null };
  }
  // recover: after the failure, errors must hold under the goal for `hold` seconds, within `within`.
  const failT = s.health.primaryDownAt ?? (sc.failAt && t >= sc.failAt.t ? sc.failAt.t : null);
  if (failT === null) return { status: 'waiting', held: 0, progress: 0, checks, endedAt: null };
  const since = t - failT;
  const held = allOk ? prev.held + DT : 0;
  if (held >= w.hold - 1e-9 && since <= w.within + 1e-9) return { status: 'met', held, progress: 1, checks, endedAt: t };
  if (since > w.within) return { status: 'failed', held, progress: 1, checks, endedAt: t };
  return { status: 'running', held, progress: Math.min(1, since / w.within), checks, endedAt: null };
}

export interface Sim {
  readonly state: SimState;
  step(): SimState;
  dispatch(a: Action): SimState;
  reset(): SimState;
  subscribe(fn: (s: SimState) => void): () => void;
}

const clampInt = (n: number, a: number, b: number) => Math.round(Math.min(b, Math.max(a, n)));

export function createSim(sc: Scenario, seed = 1): Sim {
  let rand = rng(seed);
  const subs = new Set<(s: SimState) => void>();
  const init = (): SimState => {
    const graph: Graph = structuredClone(sc.graph);
    const health: Health = { deadServers: [], cacheDownAt: null, primaryDownAt: null };
    const { out } = computeFlow(graph, health, 0, sc.rps, 0);
    return {
      schemaVersion: SCHEMA_VERSION,
      scenarioId: sc.id,
      t: 0,
      tick: 0,
      rps: sc.rps,
      playing: true,
      graph,
      health,
      backlog: 0,
      out,
      history: [out],
      goal: { status: sc.goals.length ? 'waiting' : 'none', held: 0, progress: 0, checks: goalChecks(sc.goals, out), endedAt: null },
      incidents: [],
      startCost: out.cost,
      seed,
    };
  };
  let s = init();
  const emit = () => subs.forEach((f) => f(s));
  const incident = (label: string, level: 'danger' | 'warn' | 'ok') => (s.incidents = [...s.incidents, { t: s.t, label, level }].slice(-6));

  const fail = (what: 'server' | 'cache' | 'primary') => {
    const h = s.health;
    if (what === 'server' && s.graph.app.instances > h.deadServers.filter((d) => s.t - d < CAL.serverRestartS).length) {
      s.health = { ...h, deadServers: [...h.deadServers, s.t] };
      incident('App server killed', 'danger');
    } else if (what === 'cache' && s.graph.cache && h.cacheDownAt === null) {
      s.health = { ...h, cacheDownAt: s.t };
      incident('Cache offline', 'danger');
    } else if (what === 'primary' && h.primaryDownAt === null) {
      s.health = { ...h, primaryDownAt: s.t };
      incident('Primary database failed', 'danger');
    }
  };

  return {
    get state() {
      return s;
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    reset() {
      rand = rng(seed);
      s = init();
      emit();
      return s;
    },
    dispatch(a) {
      const g = structuredClone(s.graph);
      switch (a.type) {
        case 'traffic':
          s = { ...s, rps: clampInt(a.rps, 0, 20_000) };
          break;
        case 'play':
          s = { ...s, playing: a.playing };
          break;
        case 'instances':
          g.app.instances = clampInt(a.n, 1, 12);
          break;
        case 'tier':
          g.app.tier = a.tier;
          break;
        case 'cacheHit':
          if (g.cache) g.cache.hitRatio = Math.min(0.95, Math.max(0, a.ratio));
          break;
        case 'replicas':
          g.db.replicas = clampInt(a.n, 0, 4);
          break;
        case 'workers':
          if (g.queue) g.queue.workers = clampInt(a.n, 1, 10);
          break;
        case 'toggle':
          if (a.node === 'cdn') g.cdn = !g.cdn;
          if (a.node === 'cache') g.cache = g.cache ? null : { hitRatio: 0.8 };
          if (a.node === 'queue') g.queue = g.queue ? null : { workers: 2 };
          break;
        case 'fail':
          fail(a.what);
          break;
      }
      if (a.type !== 'traffic' && a.type !== 'play' && a.type !== 'fail') s = { ...s, graph: g };
      // Recompute outputs immediately so readouts react without waiting for a tick.
      s = { ...s, out: computeFlow(s.graph, s.health, s.t, s.rps, s.backlog).out };
      emit();
      return s;
    },
    step() {
      if (!s.playing) return s;
      const t = Math.round((s.t + DT) * 1000) / 1000;
      let rps = s.rps;
      if (sc.profile) for (const p of sc.profile) if (t >= p.at) rps = p.rps;
      s = { ...s, t, tick: s.tick + 1, rps };
      if (sc.failAt && s.t >= sc.failAt.t && s.t - DT < sc.failAt.t) fail(sc.failAt.what);
      // Recoveries + promotion incidents.
      const h = s.health;
      if (h.primaryDownAt !== null && Math.abs(s.t - h.primaryDownAt - CAL.promotionS) < DT / 2) {
        if (s.graph.db.replicas > 0) incident('Replica promoted', 'warn');
      }
      if (h.primaryDownAt !== null && Math.abs(s.t - h.primaryDownAt - CAL.promotionS - 3) < DT / 2 && s.graph.db.replicas > 0) incident('Traffic rerouted', 'warn');
      if (h.cacheDownAt !== null && s.t - h.cacheDownAt >= CAL.cacheRestoreS) {
        s.health = { ...h, cacheDownAt: null };
        incident('Cache back online', 'ok');
      }
      const restarted = s.health.deadServers.filter((d) => s.t - d >= CAL.serverRestartS);
      if (restarted.length) {
        s.health = { ...s.health, deadServers: s.health.deadServers.filter((d) => s.t - d < CAL.serverRestartS) };
        incident('App server replaced', 'ok');
      }
      const noise = 1 + (rand() - 0.5) * 2 * CAL.noise;
      const { out, backlog } = computeFlow(s.graph, s.health, s.t, s.rps, s.backlog, noise);
      // Promotion is permanent: the replica that took over becomes the primary.
      if (s.health.primaryDownAt !== null && s.t - s.health.primaryDownAt >= CAL.promotionS + 3 && s.graph.db.replicas > 0) {
        s.health = { ...s.health, primaryDownAt: null };
        s.graph = { ...s.graph, db: { replicas: s.graph.db.replicas - 1 } };
        incident('Recovering…', 'ok');
      }
      const keep = CAL.historyS * CAL.tickHz;
      s = { ...s, out, backlog, history: [...s.history.slice(-(keep - 1)), out] };
      const wasEnded = s.goal.status === 'met' || s.goal.status === 'failed';
      s = { ...s, goal: evalGoal(sc, s) };
      if (!wasEnded && (s.goal.status === 'met' || s.goal.status === 'failed')) s = { ...s, playing: false };
      emit();
      return s;
    },
  };
}

/** Fill a scenario's result templates from the final state. */
export function resultLines(sc: Scenario, s: SimState): string[] {
  const { facts } = resultFacts(sc, s);
  const lines = s.goal.status === 'met' ? sc.worked : sc.broke;
  return lines.map((l) => fill(l, facts));
}
export function resultTitle(sc: Scenario, s: SimState): string {
  return fill(s.goal.status === 'met' ? sc.resultTitle.met : sc.resultTitle.failed, resultFacts(sc, s).facts);
}
const fill = (l: string, facts: Record<string, string>) => l.replace(/\{(\w+)\}/g, (_, k: string) => facts[k] ?? '');

function resultFacts(sc: Scenario, s: SimState) {
  const o = s.out, g = s.graph;
  const costPct = Math.round(Math.abs(o.cost / s.startCost - 1) * 100);
  const nodes = o.nodes;
  const hot: [string, number][] = [
    ['App servers', nodes.app?.util ?? 0],
    ['The database', nodes.db?.util ?? 0],
    ['The read replicas', nodes.replicas?.util ?? 0],
  ];
  const bottleneck = hot.sort((a, b) => b[1] - a[1])[0]![0];
  const peak = Math.max(...s.history.map((h) => h.offered));
  const recoveredAt = s.goal.endedAt;
  const failT = sc.failAt?.t ?? 0;
  const facts: Record<string, string> = {
    hit: String(Math.round((g.cache?.hitRatio ?? 0) * 100)),
    db: String(Math.round((nodes.db?.util ?? 0) * 100)),
    servers: String(g.app.instances),
    tier: g.app.tier,
    headroom: Math.max(0, Math.round(o.appCapacity - (o.offered - (g.cdn ? o.offered * CAL.staticShare * CAL.cdnHit : 0)))).toLocaleString('en-US'),
    costDir: o.cost >= s.startCost ? 'up' : 'down',
    costPct: String(costPct),
    cost: `$${o.cost.toLocaleString('en-US')}`,
    bottleneck,
    peak: Math.round(peak).toLocaleString('en-US'),
    workersRate: String((g.queue?.workers ?? 0) * CAL.worker.rate),
    promotion: String(CAL.promotionS),
    recovered: recoveredAt === null ? '?' : String(Math.round(recoveredAt - failT)),
    errors: String(Math.round(o.errorPct)),
  };
  return { facts };
}
