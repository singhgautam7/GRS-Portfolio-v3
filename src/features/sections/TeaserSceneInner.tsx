'use client';

import { useMemo } from 'react';
import { IsoScene } from '@/features/playground/scene/IsoScene';
import { computeFlow } from '@/features/playground/engine/sim';
import { scenario } from '@/features/playground/scenarios';

/** A healthy free-build system at 4,000 req/s (design 2a teaser: unlabelled, animated). */
export default function TeaserSceneInner() {
  const sc = scenario('free');
  const health = useMemo(() => ({ deadServers: [], cacheDownAt: null, primaryDownAt: null }), []);
  const out = useMemo(() => computeFlow(sc.graph, health, 0, 4000, 0).out, [sc.graph, health]);
  return <IsoScene graph={sc.graph} health={health} out={out} t={0} labels={false} unit={40} pad={10} label="Live preview of the playground: a healthy system at 4,000 requests per second" />;
}
