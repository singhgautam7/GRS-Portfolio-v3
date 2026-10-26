import { describe, expect, test } from 'bun:test';
import { CAL, TIERS, nodeP95 } from './calibration';
import { computeFlow, createSim, monthlyCost, resultLines } from './sim';
import { SCHEMA_VERSION } from './model';
import type { Graph, Health } from './model';
import { scenario } from '../scenarios';

const healthy: Health = { deadServers: [], cacheDownAt: null, primaryDownAt: null };
const graph = (o: Partial<Graph> = {}): Graph => ({ schemaVersion: SCHEMA_VERSION, cdn: false, app: { instances: 4, tier: 'M' }, cache: null, db: { replicas: 1 }, queue: null, ...o });
const run = (sim: ReturnType<typeof createSim>, seconds: number) => {
  for (let i = 0; i < seconds * CAL.tickHz; i++) sim.step();
  return sim.state;
};

describe('utilisation curve', () => {
  test('p95 grows as 1/(1-ρ) and is capped', () => {
    const a = nodeP95(10, 0), b = nodeP95(10, 0.5), c = nodeP95(10, 0.9);
    expect(b / a).toBeCloseTo(2, 5);
    expect(c / a).toBeCloseTo(10, 5);
    expect(nodeP95(10, 5)).toBeLessThanOrEqual(CAL.maxLatencyMs);
  });
  test('excess over app capacity is dropped', () => {
    const cap = 4 * TIERS.M.cap;
    const { out } = computeFlow(graph({ db: { replicas: 4 }, cache: { hitRatio: 0.95 } }), healthy, 0, cap * 1.5, 0);
    expect(out.nodes.app!.drops).toBeCloseTo(cap * 0.5, 3);
    expect(out.errorPct).toBeGreaterThan(30);
  });
});

describe('cache and replica maths', () => {
  test('cache serves hitRatio × reads; misses go to the DB', () => {
    const rps = 2000;
    const none = computeFlow(graph({ db: { replicas: 0 } }), healthy, 0, rps, 0).out;
    const cached = computeFlow(graph({ db: { replicas: 0 }, cache: { hitRatio: 0.8 } }), healthy, 0, rps, 0).out;
    const reads = rps * CAL.readShare, writes = rps - reads;
    expect(none.nodes.db!.util * CAL.db.cap).toBeCloseTo(reads + writes, 3);
    expect(cached.nodes.db!.util * CAL.db.cap).toBeCloseTo(reads * 0.2 + writes, 3);
  });
  test('reads spread across primary and replicas; writes only hit the primary', () => {
    const rps = 3000;
    const { out } = computeFlow(graph({ db: { replicas: 2 } }), healthy, 0, rps, 0);
    const reads = rps * CAL.readShare, writes = rps - reads;
    expect(out.nodes.replicas!.util * CAL.db.cap).toBeCloseTo(reads / 3, 3);
    expect(out.nodes.db!.util * CAL.db.cap).toBeCloseTo(reads / 3 + writes, 3);
  });
  test('CDN removes its hit share of static requests at the edge', () => {
    const { out } = computeFlow(graph({ cdn: true }), healthy, 0, 1000, 0);
    expect(out.edges['cdn-lb']!.flow).toBeCloseTo(1000 * (1 - CAL.staticShare * CAL.cdnHit), 5);
  });
  test('cost sums instance prices', () => {
    expect(monthlyCost(graph())).toBe(CAL.lb.price + 4 * TIERS.M.price + CAL.db.primaryPrice + CAL.db.replicaPrice);
  });
});

describe('queue backlog', () => {
  test('grows by (in − workerCap) × dt and drains when load falls', () => {
    const g = graph({ queue: { workers: 1 }, db: { replicas: 4 }, cache: { hitRatio: 0.9 }, app: { instances: 12, tier: 'XL' } });
    const rps = 10_000; // writes = 1000/s vs 400/s of workers
    const writes = rps * (1 - CAL.readShare);
    const one = computeFlow(g, healthy, 0, rps, 0);
    expect(one.backlog).toBeCloseTo((writes - CAL.worker.rate) / CAL.tickHz, 3);
    const drain = computeFlow(g, healthy, 0, 0, 100);
    expect(drain.backlog).toBeLessThan(100);
  });
});

describe('failures', () => {
  test('killed server drops its share until health-checked out, then traffic reroutes', () => {
    const sim = createSim(scenario('free'));
    sim.dispatch({ type: 'traffic', rps: 2000 });
    sim.dispatch({ type: 'fail', what: 'server' });
    const during = sim.step().out.errorPct;
    expect(during).toBeGreaterThan(10);
    run(sim, CAL.healthCheckS + 0.5);
    expect(sim.state.out.errorPct).toBeLessThan(1);
    run(sim, CAL.serverRestartS);
    expect(sim.state.health.deadServers).toHaveLength(0);
  });
  test('primary failure with a replica: promotion recovers; without: errors stay high', () => {
    const withReplica = createSim(scenario('db-down'));
    withReplica.dispatch({ type: 'replicas', n: 1 });
    run(withReplica, 26);
    expect(withReplica.state.out.errorPct).toBeGreaterThan(1);
    run(withReplica, 12);
    expect(withReplica.state.out.errorPct).toBeLessThan(1);
    expect(withReplica.state.goal.status).toBe('met');

    const without = createSim(scenario('db-down'));
    run(without, 60);
    expect(without.state.goal.status).toBe('failed');
  });
  test('cache offline sends every read to the database, then comes back', () => {
    const sim = createSim(scenario('viral'));
    const before = sim.step().out.nodes.db!.util;
    sim.dispatch({ type: 'fail', what: 'cache' });
    expect(sim.step().out.nodes.db!.util).toBeGreaterThan(before);
    run(sim, CAL.cacheRestoreS + 1);
    expect(sim.state.health.cacheDownAt).toBeNull();
  });
});

describe('scenarios', () => {
  test('viral: passes after scaling and holding 10k for 30s', () => {
    const sim = createSim(scenario('viral'));
    sim.dispatch({ type: 'traffic', rps: 10_000 });
    run(sim, 5);
    expect(sim.state.goal.status).not.toBe('met');
    sim.dispatch({ type: 'tier', tier: 'L' });
    sim.dispatch({ type: 'instances', n: 6 });
    sim.dispatch({ type: 'cacheHit', ratio: 0.85 });
    run(sim, 31);
    expect(sim.state.goal.status).toBe('met');
    expect(sim.state.playing).toBe(false);
    expect(resultLines(scenario('viral'), sim.state).join(' ')).toContain('6 L servers');
  });
  test('black friday: unscaled system fails during the burst; scaled passes', () => {
    const weak = createSim(scenario('black-friday'));
    run(weak, 30);
    expect(weak.state.goal.status).toBe('failed');
    expect(resultLines(scenario('black-friday'), weak.state)[0]).toContain('hit 100%');

    const strong = createSim(scenario('black-friday'));
    strong.dispatch({ type: 'tier', tier: 'XL' });
    strong.dispatch({ type: 'instances', n: 4 });
    strong.dispatch({ type: 'replicas', n: 3 });
    strong.dispatch({ type: 'workers', n: 4 });
    run(strong, 81);
    expect(strong.state.goal.status).toBe('met');
  });
  test('free build has no goal', () => {
    const sim = createSim(scenario('free'));
    run(sim, 2);
    expect(sim.state.goal.status).toBe('none');
  });
});

describe('determinism', () => {
  test('same scenario, actions and seed give identical output', () => {
    const go = (seed: number) => {
      const sim = createSim(scenario('viral'), seed);
      sim.dispatch({ type: 'traffic', rps: 8000 });
      run(sim, 3);
      sim.dispatch({ type: 'fail', what: 'server' });
      run(sim, 5);
      return sim.state.history.map((h) => [h.p95, h.throughput, h.errorPct]);
    };
    expect(go(7)).toEqual(go(7));
    expect(go(7)).not.toEqual(go(8));
  });
  test('state carries a schema version', () => {
    expect(createSim(scenario('free')).state.schemaVersion).toBe(SCHEMA_VERSION);
  });
});
