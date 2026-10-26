/**
 * Playground calibration. ILLUSTRATIVE numbers, chosen so the scenarios feel believable, not
 * benchmarks of any real system. Every tunable lives here.
 */

export type Tier = 'S' | 'M' | 'L' | 'XL';

/** App server capacity (req/s per instance) and monthly price per instance. L doubles M for 2.2× cost. */
export const TIERS: Record<Tier, { cap: number; price: number }> = {
  S: { cap: 550, price: 70 },
  M: { cap: 1100, price: 140 },
  L: { cap: 2200, price: 308 },
  XL: { cap: 4400, price: 680 },
};

export const CAL = {
  /** Fixed simulation step: 10 Hz. */
  tickHz: 10,
  /** Share of requests that are static assets, and how many of those the CDN serves at the edge. */
  staticShare: 0.3,
  cdnHit: 0.9,
  /** Of the dynamic requests reaching the app: reads vs writes. */
  readShare: 0.9,

  lb: { cap: 50_000, baseMs: 2, price: 25 },
  cdn: { baseMs: 8, price: 40 },
  app: { baseMs: 12 },
  cache: { cap: 60_000, baseMs: 1.5, price: 90 },
  db: { cap: 2500, baseMs: 6, primaryPrice: 260, replicaPrice: 180 },
  queue: { baseMs: 4, price: 30, maxBacklog: 50_000 },
  worker: { rate: 400, price: 60 },

  /** M/M/1 style: mean response = base / (1 − ρ); ρ is capped so latency stays finite. */
  rhoCap: 0.98,
  /** p95 of an exponential response time = mean × ln(20) ≈ 3. */
  p95Factor: Math.log(20),
  maxLatencyMs: 5000,

  /** Failure timings (seconds). */
  healthCheckS: 3,
  promotionS: 4,
  serverRestartS: 25,
  cacheRestoreS: 30,

  /** ± noise on per-tick latency/throughput so sparklines look alive (seeded, deterministic). */
  noise: 0.03,
  /** A throughput goal counts as met within 2% (what a "10.0k" readout rounds to). */
  throughputTolerance: 0.98,
  /** Seconds of history kept for sparklines. */
  historyS: 30,
} as const;

/** p95 latency (ms) of one node at utilisation ρ. */
export const nodeP95 = (baseMs: number, rho: number) =>
  Math.min(CAL.maxLatencyMs, (baseMs * CAL.p95Factor) / (1 - Math.min(Math.max(rho, 0), CAL.rhoCap)));
