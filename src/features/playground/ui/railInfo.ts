import { CAL, TIERS } from '../engine/calibration';
import type { Action, Graph } from '../engine/model';
import type { SceneNode } from '../scene/iso';

/**
 * Component rail (design 3b–3i left rail): what each key means for the current system. Pure, so
 * the copy and actions are unit-tested. Every key does something: adds a component, adds one more
 * of a scalable one, or selects one that is already there (singletons). Components the engine does
 * not model yet say so.
 */

export const RAIL_GROUPS: { t: string; items: { k: string; name: string }[] }[] = [
  { t: 'EDGE', items: [{ k: 'DNS', name: 'DNS' }, { k: 'CDN', name: 'CDN' }, { k: 'GW', name: 'API gateway' }, { k: 'LB', name: 'Load balancer' }] },
  { t: 'COMPUTE', items: [{ k: 'APP', name: 'App servers' }, { k: 'λ', name: 'Functions' }, { k: 'WRK', name: 'Workers' }] },
  { t: 'DATA', items: [{ k: '$', name: 'Cache' }, { k: 'DB', name: 'Database' }, { k: 'REP', name: 'Read replicas' }, { k: 'OBJ', name: 'Object storage' }] },
  { t: 'ASYNC', items: [{ k: 'Q', name: 'Queue' }, { k: 'PUB', name: 'Pub/sub' }] },
];

export type RailState = 'added' | 'available' | 'soon';

export interface RailInfo {
  state: RailState;
  /** Count for scalable components (servers, replicas, workers). */
  count?: number;
  tip: string;
  /** Engine actions to run on click, then the block to select (opens its inspector). */
  actions: Action[];
  select?: SceneNode;
}

const money = (n: number) => `$${n.toLocaleString('en-US')}/mo`;
const num = (n: number) => n.toLocaleString('en-US');

export function railInfo(k: string, g: Graph): RailInfo {
  const tier = TIERS[g.app.tier];
  switch (k) {
    case 'CDN':
      return g.cdn
        ? { state: 'added', tip: 'CDN · already added. Click to tune or remove it.', actions: [], select: 'cdn' }
        : { state: 'available', tip: `Add a CDN: serves images and scripts near your users, before they reach you (+${money(CAL.cdn.price)}).`, actions: [{ type: 'toggle', node: 'cdn' }], select: 'cdn' };
    case 'LB':
      return { state: 'added', tip: 'Load balancer · already in the system (one is enough here). Click to see it.', actions: [], select: 'lb' };
    case 'APP':
      return g.app.instances >= 12
        ? { state: 'added', count: g.app.instances, tip: 'App servers · at the 12-server maximum. Try a bigger size instead.', actions: [], select: 'app' }
        : { state: 'added', count: g.app.instances, tip: `App servers · ${g.app.instances} × ${g.app.tier}. Click to add one (+${num(tier.cap)} req/s · +${money(tier.price)}).`, actions: [{ type: 'instances', n: g.app.instances + 1 }], select: 'app' };
    case 'WRK':
      return g.queue
        ? g.queue.workers >= 10
          ? { state: 'added', count: g.queue.workers, tip: 'Workers · at the 10-worker maximum.', actions: [], select: 'queue' }
          : { state: 'added', count: g.queue.workers, tip: `Workers · ${g.queue.workers}. Click to add one (+${CAL.worker.rate} writes/s · +${money(CAL.worker.price)}).`, actions: [{ type: 'workers', n: g.queue.workers + 1 }], select: 'queue' }
        : { state: 'available', tip: `Workers need a queue. Click to add a queue with 2 workers (+${money(CAL.queue.price + 2 * CAL.worker.price)}).`, actions: [{ type: 'toggle', node: 'queue' }], select: 'queue' };
    case '$':
      return g.cache
        ? { state: 'added', tip: `Cache · already added (${Math.round(g.cache.hitRatio * 100)}% hit). Click to tune or remove it.`, actions: [], select: 'cache' }
        : { state: 'available', tip: `Add a cache: keeps popular answers in memory so the database looks them up less (+${money(CAL.cache.price)}).`, actions: [{ type: 'toggle', node: 'cache' }], select: 'cache' };
    case 'DB':
      return { state: 'added', tip: 'Database · already added (one primary takes every write). Click to tune it, or add read replicas.', actions: [], select: 'db' };
    case 'REP':
      return g.db.replicas >= 4
        ? { state: 'added', count: g.db.replicas, tip: 'Read replicas · at the 4-replica maximum.', actions: [], select: 'db' }
        : { state: g.db.replicas ? 'added' : 'available', count: g.db.replicas || undefined, tip: `${g.db.replicas ? `Read replicas · ${g.db.replicas}. Click to add one` : 'Add a read replica: answers reads and can take over if the primary fails'} (+${num(CAL.db.cap)} reads/s · +${money(CAL.db.replicaPrice)}).`, actions: [{ type: 'replicas', n: g.db.replicas + 1 }], select: 'db' };
    case 'Q':
      return g.queue
        ? { state: 'added', tip: 'Queue · already added. Click to tune its workers or remove it.', actions: [], select: 'queue' }
        : { state: 'available', tip: `Add a queue: writes wait their turn during a burst instead of failing (+${money(CAL.queue.price + 2 * CAL.worker.price)} with 2 workers).`, actions: [{ type: 'toggle', node: 'queue' }], select: 'queue' };
    default: {
      const name = RAIL_GROUPS.flatMap((x) => x.items).find((i) => i.k === k)?.name ?? k;
      return { state: 'soon', tip: `${name} isn’t in the simulation yet.`, actions: [] };
    }
  }
}
