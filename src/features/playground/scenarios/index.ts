import { SCHEMA_VERSION } from '../engine/model';
import type { Goal, GoalWindow, Graph } from '../engine/model';

/**
 * Scenarios are data only: starting graph, traffic profile, goals, copy, hints and result lines.
 * Result lines are templates; the engine fills {placeholders} from the final state.
 */
export interface Scenario {
  id: 'viral' | 'black-friday' | 'db-down' | 'free';
  tag: string;
  meta: string;
  title: string;
  goalText: string;
  graph: Graph;
  /** Starting traffic; `profile` overrides the slider over time (s → req/s). */
  rps: number;
  profile?: { at: number; rps: number }[];
  /** Automatic failure injected at a time (seconds). */
  failAt?: { t: number; what: 'server' | 'cache' | 'primary' };
  goals: Goal[];
  window?: GoalWindow;
  /** Plain-language hints, picked by what is wrong. */
  hints: { slow: string; errors: string; idle: string };
  worked: string[];
  broke: string[];
  resultTitle: { met: string; failed: string };
  desktopOnly?: boolean;
}

const g = (o: Partial<Graph>): Graph => ({
  schemaVersion: SCHEMA_VERSION,
  cdn: true,
  app: { instances: 4, tier: 'M' },
  cache: { hitRatio: 0.82 },
  db: { replicas: 1 },
  queue: null,
  ...o,
});

export const SCENARIOS: Scenario[] = [
  {
    id: 'viral',
    tag: 'SCENARIO 01',
    meta: 'guided · ~3 min',
    title: 'Your app goes viral',
    goalText: 'Handle 10k requests/sec. Keep it fast (under 200ms) and drop under 1%.',
    graph: g({ cache: { hitRatio: 0.5 } }),
    rps: 4000,
    goals: [
      { metric: 'throughput', op: '>=', value: 10_000, label: '10k requests/sec' },
      { metric: 'p95', op: '<=', value: 200, label: 'p95 under 200ms' },
      { metric: 'errorPct', op: '<=', value: 1, label: 'Drop under 1%' },
    ],
    window: { kind: 'sustain', seconds: 30 },
    hints: {
      idle: 'Push traffic to 10k to start the 30s clock.',
      slow: 'Response time is over 200ms. Tap the app servers to add more.',
      errors: 'Requests are being dropped. Something is at 100%: add capacity or raise the cache hit ratio.',
    },
    resultTitle: { met: 'Your app survived going viral.', failed: '{errors}% of requests were dropped.' },
    worked: ['A {hit}% cache hit ratio kept the database at {db}%.', '{servers} {tier} servers gave {headroom} req/s of headroom.', 'Cost went {costDir} {costPct}%, to {cost} a month.'],
    broke: ['{bottleneck} hit 100% and started dropping requests.', 'Try: add servers, pick a bigger size, or raise the cache hit ratio.'],
  },
  {
    id: 'black-friday',
    tag: 'SCENARIO 02',
    meta: 'guided · ~3 min',
    title: 'Black Friday spike',
    goalText: 'Survive a 5× burst for 60 seconds without dropping orders.',
    graph: g({ queue: { workers: 2 } }),
    rps: 3000,
    profile: [
      { at: 0, rps: 3000 },
      { at: 20, rps: 15_000 },
      { at: 80, rps: 3000 },
    ],
    goals: [
      { metric: 'errorPct', op: '<=', value: 1, label: 'No dropped orders' },
      { metric: 'p95', op: '<=', value: 200, label: 'p95 under 200ms' },
    ],
    window: { kind: 'during', from: 20, to: 80 },
    hints: {
      idle: 'The burst starts at 0:20. Scale up before it hits.',
      slow: 'Response time is climbing. Add servers or pick a bigger size.',
      errors: 'Orders are being dropped. The app servers are full.',
    },
    resultTitle: { met: 'Your store survived Black Friday.', failed: '{errors}% of orders were dropped at the peak.' },
    worked: ['{servers} {tier} servers carried the 15k req/s peak.', 'The queue kept order writes flowing at {workersRate} req/s.', 'Cost went {costDir} {costPct}%, to {cost} a month.'],
    broke: ['{bottleneck} hit 100% at {peak} req/s and started dropping requests.', 'Try: add a queue so the burst waits instead of failing, or add 3 servers.'],
  },
  {
    id: 'db-down',
    tag: 'SCENARIO 03',
    meta: 'guided · ~2 min',
    title: 'The database goes down',
    goalText: 'Fail over to a replica and recover in under 30 seconds.',
    graph: g({ db: { replicas: 0 } }),
    rps: 6000,
    failAt: { t: 25, what: 'primary' },
    goals: [{ metric: 'errorPct', op: '<=', value: 1, label: 'Drop under 1%' }],
    window: { kind: 'recover', within: 30, hold: 5 },
    hints: {
      idle: 'The primary database fails at 0:25. Add a read replica before then.',
      slow: 'Reads are slow. More replicas spread the load.',
      errors: 'Writes have nowhere to go. A replica can be promoted to primary.',
    },
    resultTitle: { met: 'You failed over in {recovered} seconds.', failed: 'The database never came back.' },
    worked: ['A replica was promoted to primary in {promotion}s.', 'Errors were back under 1% {recovered}s after the failure.'],
    broke: ['With no replica to promote, writes stopped and errors stayed high.', 'Try again with at least one read replica.'],
  },
  {
    id: 'free',
    tag: 'FREE BUILD',
    meta: 'open-ended',
    title: 'Free build',
    goalText: 'No goal. Add components and push traffic until something breaks.',
    graph: g({ queue: { workers: 2 }, db: { replicas: 2 } }),
    rps: 4000,
    goals: [],
    hints: { idle: 'Change anything. Break something.', slow: 'Something is slow. Find the hottest block.', errors: 'Requests are failing. Find the red block.' },
    worked: [],
    broke: [],
    resultTitle: { met: '', failed: '' },
    desktopOnly: true,
  },
];

export const scenario = (id: string) => SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0]!;
