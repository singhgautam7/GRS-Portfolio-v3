import { describe, expect, test } from 'bun:test';
import { createSim } from '../engine/sim';
import { scenario } from '../scenarios';
import { RAIL_GROUPS, railInfo } from './railInfo';

const viral = () => scenario('viral').graph; // CDN, cache, 4 × M, 1 replica, no queue

describe('component rail', () => {
  test('every key does something or says why not', () => {
    for (const { k } of RAIL_GROUPS.flatMap((g) => g.items)) {
      const i = railInfo(k, viral());
      expect(i.tip.length).toBeGreaterThan(10);
      if (i.state !== 'soon') expect(i.select || i.actions.length).toBeTruthy();
    }
  });
  test('singletons that exist say "already" and select instead of duplicating', () => {
    for (const k of ['CDN', 'LB', 'DB', '$']) {
      const i = railInfo(k, viral());
      expect(i.state).toBe('added');
      expect(i.tip).toMatch(/already/);
      expect(i.actions).toEqual([]);
    }
  });
  test('missing components can be added; scalable ones add one more', () => {
    expect(railInfo('Q', viral()).actions).toEqual([{ type: 'toggle', node: 'queue' }]);
    expect(railInfo('WRK', viral()).actions).toEqual([{ type: 'toggle', node: 'queue' }]);
    expect(railInfo('APP', viral()).actions).toEqual([{ type: 'instances', n: 5 }]);
    expect(railInfo('REP', viral()).actions).toEqual([{ type: 'replicas', n: 2 }]);
  });
  test('clicking through the engine actually changes the system', () => {
    const sim = createSim(scenario('viral'));
    railInfo('Q', sim.state.graph).actions.forEach((a) => sim.dispatch(a));
    expect(sim.state.graph.queue).not.toBeNull();
    expect(railInfo('Q', sim.state.graph).tip).toMatch(/already/);
  });
  test('unmodelled components are honest about it', () => {
    for (const k of ['DNS', 'GW', 'λ', 'OBJ', 'PUB']) expect(railInfo(k, viral())).toMatchObject({ state: 'soon', actions: [] });
  });
});
