import type { VariantId } from '../variants';
import type { VariantFactory } from './types';

/** Each variant is its own chunk; only the active one loads, others on hover/focus or selection. */
const LOADERS: Record<VariantId, () => Promise<{ default: VariantFactory }>> = {
  thk: () => import('../variants/thk'),
  tik: () => import('../variants/tik'),
  clk: () => import('../variants/clk'),
  pop: () => import('../variants/pop'),
  pew: () => import('../variants/pew'),
  '8bt': () => import('../variants/arcade'),
};
const loaded = new Map<VariantId, Promise<VariantFactory>>();

export function loadVariant(id: VariantId): Promise<VariantFactory> {
  let p = loaded.get(id);
  if (!p) {
    p = LOADERS[id]().then((m) => m.default);
    loaded.set(id, p);
  }
  return p;
}
