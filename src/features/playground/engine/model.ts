import type { Tier } from './calibration';

/** Typed graph + state for the playground simulation. Persisted/shared shapes carry schemaVersion. */

export const SCHEMA_VERSION = 1;

export type NodeKind = 'client' | 'cdn' | 'lb' | 'app' | 'cache' | 'db' | 'queue';

/** The system under test. Optional nodes are null when absent. v2 (drag-to-build, share via URL
 * hash) serialises this object as-is. */
export interface Graph {
  schemaVersion: typeof SCHEMA_VERSION;
  cdn: boolean;
  app: { instances: number; tier: Tier };
  cache: { hitRatio: number } | null;
  db: { replicas: number };
  queue: { workers: number } | null;
}

export type EdgeId = 'client-cdn' | 'cdn-lb' | 'lb-app' | 'app-cache' | 'app-db' | 'db-replicas' | 'app-queue' | 'queue-db';

export interface NodeOut {
  util: number;
  p95: number;
  drops: number;
  healthy: boolean;
}

export interface EdgeOut {
  /** req/s on this edge, split into shares that were fine, slow (> 2× base) and dropped. */
  flow: number;
  ok: number;
  slow: number;
  dropped: number;
}

export interface TickOut {
  t: number;
  offered: number;
  throughput: number;
  p95: number;
  errorPct: number;
  cost: number;
  backlog: number;
  nodes: Partial<Record<NodeKind | 'replicas', NodeOut>>;
  edges: Partial<Record<EdgeId, EdgeOut>>;
  /** App capacity now (req/s), for the inspector. */
  appCapacity: number;
}

export interface Health {
  /** Times (s) at which app instances died; each restarts after serverRestartS. */
  deadServers: number[];
  cacheDownAt: number | null;
  primaryDownAt: number | null;
}

export type GoalMetric = 'throughput' | 'p95' | 'errorPct' | 'cost';
export interface Goal {
  metric: GoalMetric;
  op: '>=' | '<=';
  value: number;
  label: string;
}
export type GoalWindow =
  | { kind: 'sustain'; seconds: number }
  | { kind: 'during'; from: number; to: number }
  | { kind: 'recover'; within: number; hold: number };

export type GoalStatus = 'none' | 'waiting' | 'running' | 'met' | 'failed';

export interface GoalState {
  status: GoalStatus;
  held: number;
  /** 0..1 for the progress bar. */
  progress: number;
  checks: boolean[];
  endedAt: number | null;
}

export interface Incident {
  t: number;
  label: string;
  level: 'danger' | 'warn' | 'ok';
}

export interface SimState {
  schemaVersion: typeof SCHEMA_VERSION;
  scenarioId: string;
  t: number;
  tick: number;
  rps: number;
  playing: boolean;
  graph: Graph;
  health: Health;
  backlog: number;
  out: TickOut;
  history: TickOut[];
  goal: GoalState;
  incidents: Incident[];
  /** Cost when the scenario started, for "cost went up X%". */
  startCost: number;
  seed: number;
}

export type Action =
  | { type: 'traffic'; rps: number }
  | { type: 'play'; playing: boolean }
  | { type: 'instances'; n: number }
  | { type: 'tier'; tier: Tier }
  | { type: 'cacheHit'; ratio: number }
  | { type: 'replicas'; n: number }
  | { type: 'workers'; n: number }
  | { type: 'toggle'; node: 'cdn' | 'cache' | 'queue' }
  | { type: 'fail'; what: 'server' | 'cache' | 'primary' };
