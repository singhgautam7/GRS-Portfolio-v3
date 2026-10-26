import type * as THREE from 'three';
import { spring } from '@/lib/tokens';
import { ROW_PROFILE } from '../core/layouts';
import { rrShape } from '../core/rig';
import type { VariantFactory } from '../core/types';

/**
 * Bullet: field-equipment body (knurled grips, riveted rail, hex screws), flip-up guard over Esc,
 * brass primer-ring alphas with heavy recoil; a pooled brass casing ejects per press (max 10
 * live); Enter fires a three-shot burst.
 */
const pew: VariantFactory = (rig) => {
  type Casing = { m: THREE.Mesh; on: boolean; t0: number; p: number[]; v: number[]; rot: number[]; w: number[] };
  let casings: Casing[] = [];
  let trim: THREE.MeshStandardMaterial;
  let guard: THREE.Group | null = null;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const eject = () => {
    const c = casings.find((x) => !x.on);
    if (!c) return;
    const r = Math.random;
    Object.assign(c, { on: true, t0: rig.now(), p: [9.2, 0.58, -2.4], v: [4.5 + r() * 2.5, 5 + r() * 3, (r() - 0.5) * 2.6], rot: [r() * 6, r() * 6, r() * 6], w: [8 + r() * 10, 6 + r() * 8, 10 + r() * 10] });
    c.m.visible = true;
  };
  return {
    cfg: { travel: 0.18, glow: 0.4, press: spring.press, release: spring.release, trail: 'dom', fit: 0.9, kx: 0, kz: 0, pos: [0, 0, 0], foot: [18.6, 8], lift: 0.17 },
    legend: { round: false, pixel: false, primer: true, font: 'mono' },
    body(g) {
      const T = rig.T;
      const caseM = rig.mk('std', '--kb-case', { metalness: 0.35, roughness: 0.55 });
      caseM.userData.mr = 1;
      const plateM = rig.mk('std', '--kb-plate', { metalness: 0.5, roughness: 0.55 });
      const metal = rig.mk('std', '--kb-metal', { metalness: 0.75, roughness: 0.42 });
      trim = rig.mk('std', '--kb-trim', { metalness: 0.85, roughness: 0.35 });
      const outer = rrShape(17.8, 7.7, 0.25);
      outer.holes.push(rrShape(16.9, 6.9, 0.14, true));
      rig.add(g, rig.extrude(outer, 0.95, 0.06, 1), caseM);
      rig.add(g, new T.BoxGeometry(16.9, 0.55, 6.9), plateM, [0, 0.3, 0]);
      rig.add(g, new T.BoxGeometry(17.8, 0.3, 0.55), metal, [0, 1.1, -3.57]);
      const riv = rig.cyl(0.07, 0.06, 10);
      for (let i = 0; i < 17; i++) rig.add(g, riv, trim, [-8.2 + i * 1.025, 1.28, -3.57]);
      const hex = rig.cyl(0.17, 0.07, 6), slot = new T.BoxGeometry(0.24, 0.02, 0.045);
      ([[-8.5, 0.99, 3.45], [8.5, 0.99, 3.45]] as [number, number, number][]).forEach((p) => {
        rig.add(g, hex, trim, p);
        rig.add(g, slot, plateM, [p[0], p[1] + 0.045, p[2]], [0, 0.6, 0], true);
      });
      [-1, 1].forEach((s) => {
        rig.add(g, new T.BoxGeometry(0.24, 0.62, 4.4), metal, [s * 8.98, 0.45, 0.2]);
        for (let i = 0; i < 11; i++) rig.add(g, new T.BoxGeometry(0.08, 0.62, 0.13), metal, [s * 9.13, 0.45, -1.8 + i * 0.4]);
      });
      rig.add(g, new T.BoxGeometry(0.06, 0.32, 0.9), rig.mk('std', '--kb-void', { roughness: 0.9 }), [9.12, 0.55, -2.4], undefined, true);
      const brass = rig.mk('std', '--kb-cap', { metalness: 0.92, roughness: 0.28 });
      const cg = new T.CylinderGeometry(0.08, 0.08, 0.28, 12);
      casings = Array.from({ length: 10 }, () => {
        const m = rig.add(g, cg, brass);
        m.visible = false;
        return { m, on: false, t0: 0, p: [0, 0, 0], v: [0, 0, 0], rot: [0, 0, 0], w: [0, 0, 0] };
      });
      return { front: { w: 17.6, h: 0.95, y: 0.48, z: 3.85 } };
    },
    profile(k) {
      const [h, pitch] = ROW_PROFILE[k.row]!;
      return { h: h * 1.1, pitch, by: 0.58 };
    },
    makeCap(k) {
      const mat = k.kind === 'alpha' ? rig.mk('std', null, { metalness: 0.88, roughness: 0.3 }, rig.keyMats) : rig.mk('std', null, { metalness: 0.45, roughness: 0.55 }, rig.keyMats);
      return rig.capParts(rig.capGeo(k.w, k.h, 0.86), mat, { lz: -0.015, dish: true });
    },
    afterKeys() {
      const T = rig.T, k = rig.byCode.Escape!;
      guard = new T.Group(); guard.position.set(k.cx, k.by + k.h + 0.1, k.cz - 0.48); rig.bodyG.add(guard);
      const pb = new T.BoxGeometry(0.98, 0.05, 0.94); pb.translate(0, 0, 0.47);
      rig.add(guard, pb, trim);
      rig.add(guard, new T.CylinderGeometry(0.06, 0.06, 1.04, 12), trim, [0, 0, 0], [0, 0, Math.PI / 2]);
      guard.rotation.x = -1.18;
    },
    feedback(k, ghost) {
      if (ghost) return;
      const R = rig.reduced;
      if (!R) { eject(); rig.kick = Math.min(1.8, rig.kick + 0.55); }
      if (k.code === 'Enter' && !rig.isStill) {
        [95, 190].forEach((d) => {
          const t = setTimeout(() => {
            timers.delete(t);
            k.self = 1; k.flash = 1;
            if (!R) { eject(); rig.kick = Math.min(1.8, rig.kick + 0.6); rig.ripples.push({ x: k.cx, z: k.cz, t0: rig.now(), s: 0.6, fall: 2 }); }
          }, d);
          timers.add(t);
        });
      }
    },
    update(t, dt) {
      rig.kick *= Math.exp(-dt / 0.09);
      if (guard) guard.rotation.x = -1.18 + (rig.byCode.Escape?.down ? 0.08 : 0);
      for (const c of casings) {
        if (!c.on) continue;
        const age = (t - c.t0) / 1000;
        c.v[1]! -= 24 * dt;
        for (let i = 0; i < 3; i++) { c.p[i]! += c.v[i]! * dt; c.rot[i]! += c.w[i]! * dt; }
        c.m.position.set(c.p[0]!, c.p[1]!, c.p[2]!); c.m.rotation.set(c.rot[0]!, c.rot[1]!, c.rot[2]!);
        if (age > 1.6 || c.p[1]! < -1) { c.on = false; c.m.visible = false; }
      }
    },
    dispose() {
      timers.forEach(clearTimeout);
      rig.kick = 0;
    },
  };
};

export default pew;
