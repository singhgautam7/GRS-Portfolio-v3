import { spring } from '@/lib/tokens';
import { ROW_PROFILE } from '../core/layouts';
import { rrShape } from '../core/rig';
import type { VariantFactory } from '../core/types';

/** Mechanical (default): sculpted caps, under-key bloom + ripple, front-edge sheen. */
const thk: VariantFactory = (rig) => ({
  cfg: { travel: 0.13, glow: 1, press: spring.press, release: spring.release, trail: 'dom', fit: 1, kx: 0, kz: 0, pos: [0, 0, 0], foot: [16.6, 6.8], lift: 0.17 },
  legend: { round: false, pixel: false, primer: false, font: 'mono' },
  body(g) {
    const T = rig.T;
    const caseM = rig.mk('std', '--kb-case', { metalness: 0.6, roughness: 0.42 });
    caseM.userData.mr = 1;
    const plateM = rig.mk('std', '--kb-plate', { metalness: 0.35, roughness: 0.6 });
    const outer = rrShape(16.62, 6.82, 0.42);
    outer.holes.push(rrShape(16.36, 6.56, 0.16, true));
    rig.add(g, rig.extrude(outer, 0.8, 0.07, 1), caseM);
    rig.add(g, new T.BoxGeometry(16.4, 0.45, 6.6), plateM, [0, 0.275, 0]);
    return { front: { w: 16.5, h: 0.8, y: 0.4, z: 3.41 } };
  },
  profile(k) {
    const [h, pitch] = ROW_PROFILE[k.row]!;
    return { h, pitch, by: 0.5 };
  },
  makeCap(k) {
    const mat = rig.mk('phys', null, { roughness: 0.58, metalness: 0, clearcoat: 0.22, clearcoatRoughness: 0.5 }, rig.keyMats);
    return rig.capParts(rig.capGeo(k.w, k.h, 0.83), mat, { lz: -0.015, dish: true });
  },
});

export default thk;
