import type * as THREE from 'three';
import { spring } from '@/lib/tokens';
import { eout, rrShape } from '../core/rig';
import type { VariantFactory } from '../core/types';

/** Bubble: pillowy body, round pastel caps, squash-and-stretch, a pooled bubble ring per press. */
const pop: VariantFactory = (rig) => {
  type Ring = { mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>; on: boolean; t0: number; base: number; peak: number; w: number };
  let rings: Ring[] = [];
  return {
    cfg: { travel: 0.12, glow: 0.8, press: spring.press, release: { k: 700, c: 13 }, trail: 'dom', fit: 0.94, kx: 0, kz: 0, pos: [0, 0, 0], foot: [17.2, 7.6], lift: 0.17, squash: true },
    legend: { round: true, pixel: false, primer: false, font: 'mono' },
    body(g) {
      const m = rig.mk('phys', '--kb-case', { roughness: 0.5, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.4 });
      rig.add(g, rig.extrude(rrShape(16.3, 6.7, 0.9), 0.62, 0.3, 6), m);
      return { front: { w: 15.6, h: 0.5, y: 0.31, z: 3.66 } };
    },
    profile: (k) => ({ h: 0.42, pitch: [0.07, 0.05, 0.025, 0, -0.03, -0.05][k.row] ?? 0, by: 0.6 }),
    makeCap(k) {
      const mat = rig.mk('phys', null, { roughness: 0.5, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.4 }, rig.keyMats);
      return rig.capParts(rig.pillGeo(k.w - 0.16, 0.84, k.h, 0.14, 5), mat);
    },
    afterKeys() {
      const T = rig.T, rg = new T.RingGeometry(0.36, 0.45, 40);
      rg.rotateX(-Math.PI / 2);
      rings = Array.from({ length: 10 }, () => {
        const mesh = new T.Mesh(rg, new T.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
        mesh.visible = false; rig.vg.add(mesh);
        return { mesh, on: false, t0: 0, base: 0, peak: 0, w: 1 };
      });
    },
    feedback(k, ghost) {
      if (rig.reduced) return;
      const r = rings.find((x) => !x.on) ?? rings[0]!;
      Object.assign(r, { on: true, t0: rig.now(), base: k.by + k.hTop + 0.06, peak: ghost ? 0.45 : 0.9, w: Math.max(1, k.w * 0.55) });
      r.mesh.material.color.copy(k.c0).lerp(new rig.T.Color(1, 1, 1), rig.dark ? 0.15 : 0.55);
      r.mesh.position.set(k.cx, r.base, k.cz); r.mesh.scale.setScalar(r.w); r.mesh.visible = true;
    },
    update(t) {
      for (const r of rings) {
        if (!r.on) continue;
        const e = (t - r.t0) / 440; // rises 0.6u, scales 1 → 2.1, fades over 440ms (7c)
        if (e >= 1) { r.on = false; r.mesh.visible = false; continue; }
        r.mesh.position.y = r.base + eout(e) * 0.6;
        r.mesh.scale.setScalar(r.w * (1 + eout(e) * 1.1 + (e > 0.82 ? (e - 0.82) * 3 : 0)));
        r.mesh.material.opacity = r.peak * Math.pow(1 - e, 1.4) * rig.sv;
      }
    },
    dispose() {
      rings[0]?.mesh.geometry.dispose();
    },
  };
};

export default pop;
