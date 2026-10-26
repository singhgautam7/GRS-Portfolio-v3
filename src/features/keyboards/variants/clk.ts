import type * as THREE from 'three';
import { spring } from '@/lib/tokens';
import type { VariantFactory } from '../core/types';

/**
 * Typewriter: enamel body, glass-topped round keys on stems, typebar basket, carriage with paper.
 * Typed characters print on the paper (replaces the shared trail); the carriage steps per
 * character and returns on Enter; a new sheet after 6 lines (7c). The bell is in its sound set.
 */
const PRE_LINE = 'Gautam Rajeev Singh, software engineer';

const clk: VariantFactory = (rig) => {
  const slope = (z: number) => 0.5 + ((3.6 - z) / 5.5) * 0.95;
  type Ink = { ch: string; dy: number; a: number };
  const ink = (ch: string): Ink => ({ ch, dy: (Math.random() - 0.5) * 2.4, a: 0.72 + Math.random() * 0.28 });
  const P = { W: 1024, H: 666, m: 64, cw: 22.4, lh: 50, base: 46, fs: 34, lines: [PRE_LINE.split('').map(ink), []] as Ink[][] };
  let canvas: HTMLCanvasElement, g2: CanvasRenderingContext2D, tex: THREE.CanvasTexture;
  let carriage: THREE.Group, lever: THREE.Group, bar: THREE.Group, pins: THREE.Mesh[] = [];
  const colX = (col: number) => ((P.W / 2 - (P.m + col * P.cw + P.cw / 2)) / P.W) * 8;
  let carX = colX(0), carT = carX, carTau = 0.03, lev = 0, barT0: number | null = null, barAmp = 1;

  const draw = () => {
    g2.fillStyle = rig.cssVar('--kb-paper'); g2.fillRect(0, 0, P.W, P.H);
    g2.fillStyle = 'rgba(0,0,0,.05)'; g2.fillRect(0, 0, P.W, 3);
    g2.font = `${P.fs}px ${rig.cssVar('--font-type')}`; g2.textBaseline = 'alphabetic'; g2.textAlign = 'left';
    const n = P.lines.length, inkCol = rig.cssVar('--kb-ink');
    P.lines.forEach((ln, i) => {
      const y = P.H - P.base - (n - 1 - i) * P.lh;
      ln.forEach((c, j) => { g2.globalAlpha = c.a; g2.fillStyle = inkCol; g2.fillText(c.ch, P.m + j * P.cw, y + c.dy); });
    });
    g2.globalAlpha = 1; tex.needsUpdate = true;
  };
  const newLine = () => { P.lines.push([]); if (P.lines.length > 6) P.lines = [[]]; };

  return {
    cfg: { travel: 0.24, glow: 0.3, press: { k: 1500, c: 72 }, release: spring.release, trail: 'paper', fit: 0.86, kx: 0, kz: 0.7, pos: [0, 0, 0.55], foot: [16.4, 9.8], lift: 0.17 },
    legend: { round: true, pixel: false, primer: false, font: 'mono' },
    body(g) {
      const T = rig.T;
      const enamel = rig.mk('phys', '--kb-case', { roughness: 0.3, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.25 });
      const dark = rig.mk('std', '--kb-plate', { roughness: 0.75, metalness: 0.1 });
      const nickel = rig.mk('std', '--kb-metal', { metalness: 1, roughness: 0.22 });
      const gold = rig.mk('std', '--kb-trim', { metalness: 0.9, roughness: 0.3 });
      const s = new T.Shape();
      s.moveTo(3.9, 0); s.lineTo(3.9, 0.3); s.quadraticCurveTo(3.9, 0.48, 3.6, 0.5); s.lineTo(-1.9, 1.45); s.lineTo(-2.45, 1.55);
      s.quadraticCurveTo(-2.75, 1.6, -2.75, 1.85); s.lineTo(-2.75, 1.98); s.quadraticCurveTo(-2.75, 2.15, -3.0, 2.15); s.lineTo(-4.75, 2.15);
      s.quadraticCurveTo(-5.0, 2.15, -5.0, 1.9); s.lineTo(-5.0, 0); s.lineTo(3.9, 0);
      const W = 15.4, sg = new T.ExtrudeGeometry(s, { depth: W - 0.16, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 2, curveSegments: 10 });
      sg.rotateY(-Math.PI / 2); sg.translate((W - 0.16) / 2, 0, 0);
      rig.add(g, sg, enamel);
      const ang = Math.atan2(0.95, 5.5), len = 5.9, mz = 0.85;
      rig.add(g, new T.PlaneGeometry(13.9, len), dark, [0, slope(mz) + 0.012, mz], [-Math.PI / 2 + ang, 0, 0], true).receiveShadow = true;
      pins = [rig.add(g, new T.BoxGeometry(15.2, 0.028, 0.02), gold, [0, 0.36, 3.99], undefined, true), rig.add(g, new T.BoxGeometry(15.2, 0.028, 0.02), gold, [0, 1.9, -2.83], undefined, true)];
      [-1, 1].forEach((k) => {
        rig.add(g, new T.CylinderGeometry(0.62, 0.62, 0.1, 32), nickel, [k * 5.3, 2.2, -3.05]);
        rig.add(g, new T.CylinderGeometry(0.2, 0.2, 0.14, 16), dark, [k * 5.3, 2.24, -3.05]);
      });
      rig.add(g, new T.BoxGeometry(0.5, 0.32, 0.06), nickel, [0, 2.24, -3.28]);
      carriage = new T.Group(); g.add(carriage);
      rig.add(carriage, new T.CylinderGeometry(0.55, 0.55, 13.8, 32), dark, [0, 2.72, -3.9], [0, 0, Math.PI / 2]);
      [-1, 1].forEach((k) => {
        rig.add(carriage, new T.CylinderGeometry(0.72, 0.72, 0.4, 32), dark, [k * 7.1, 2.72, -3.9], [0, 0, Math.PI / 2]);
        rig.add(carriage, new T.CylinderGeometry(0.26, 0.26, 0.46, 20), nickel, [k * 7.22, 2.72, -3.9], [0, 0, Math.PI / 2]);
      });
      rig.add(carriage, new T.BoxGeometry(14.6, 0.12, 0.5), nickel, [0, 2.2, -4.5]);
      rig.add(carriage, new T.CylinderGeometry(0.035, 0.035, 7.6, 10), nickel, [0, 3.3, -3.5], [0, 0, Math.PI / 2]);
      [-2.2, 2.2].forEach((x) => rig.add(carriage, new T.CylinderGeometry(0.09, 0.09, 0.3, 14), dark, [x, 3.3, -3.5], [0, 0, Math.PI / 2]));
      canvas = document.createElement('canvas'); canvas.width = P.W; canvas.height = P.H; g2 = canvas.getContext('2d')!;
      tex = new T.CanvasTexture(canvas); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
      const pg = new T.PlaneGeometry(8, 5.2); pg.translate(0, 2.6, 0);
      const pm = rig.mk('std', null, { map: tex, roughness: 0.92, metalness: 0, side: T.DoubleSide });
      rig.add(carriage, pg, pm, [0, 3.12, -4.12], [-0.2, 0, 0]).castShadow = false;
      lever = new T.Group(); lever.position.set(-7.2, 3.05, -3.7); carriage.add(lever);
      const lg = new T.CylinderGeometry(0.05, 0.05, 1.7, 10); lg.rotateX(Math.PI / 2); lg.translate(0, 0, 0.85);
      rig.add(lever, lg, nickel); rig.add(lever, new T.SphereGeometry(0.13, 14, 10), nickel, [0, 0, 1.7]);
      bar = new T.Group(); bar.position.set(0, 1.62, -2.55); g.add(bar);
      const bb = new T.BoxGeometry(0.05, 0.035, 1.3); bb.translate(0, 0, 0.65); rig.add(bar, bb, nickel); bar.rotation.x = 0.9;
      carX = carT = colX(P.lines.at(-1)!.length);
      draw();
      return { front: { w: 15.2, h: 0.4, y: 0.22, z: 3.98 } };
    },
    profile: (k) => ({ h: 0.14, pitch: 0.17, by: slope(k.cz) + 0.44 }),
    glowY: (k) => slope(k.cz) + 0.02,
    makeCap(k) {
      const T = rig.T, sp = k.code === 'Space';
      const W = sp ? k.w - 0.4 : Math.max(0.62, k.w - 0.38), D = sp ? 0.3 : 0.62;
      const metal = rig.mk('std', '--kb-metal', { metalness: 1, roughness: 0.22 }, rig.keyMats);
      const extras: THREE.Object3D[] = [];
      if (!sp) { const rim = new T.Mesh(rig.pillGeo(W + 0.13, D + 0.13, 0.07, 0.015, 1).g, metal); rim.castShadow = true; extras.push(rim); }
      const stem = new T.Mesh(rig.cyl(0.04, 0.5, 8), metal); stem.position.set(0, -0.25, 0.05); stem.rotation.x = -0.35; stem.castShadow = true; extras.push(stem);
      const mat = sp ? rig.mk('std', null, { metalness: 1, roughness: 0.25 }, rig.keyMats) : rig.mk('phys', null, { roughness: 0.1, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 }, rig.keyMats);
      return rig.capParts(rig.pillGeo(W, D, 0.1, 0.03, 3), mat, { y0: 0.045, extras });
    },
    feedback(_k, ghost) {
      if (rig.reduced) return;
      barT0 = rig.now(); barAmp = ghost ? 0.35 : 1; // typebar strike
    },
    print(ch) {
      const line = P.lines.at(-1)!;
      if (ch === '↵') { newLine(); carT = colX(0); carTau = 0.12; lev = 1; draw(); return; }
      if (ch === '⌫') { line.pop(); carT = colX(line.length); carTau = 0.04; draw(); return; }
      if (line.length >= 40) { newLine(); lev = 1; }
      P.lines.at(-1)!.push(ink(ch === '·' ? ' ' : ch));
      carT = colX(P.lines.at(-1)!.length); carTau = 0.028; draw();
    },
    colors() {
      pins.forEach((p) => (p.visible = rig.dark));
      draw();
    },
    update(t, dt) {
      const R = rig.reduced;
      carX += (carT - carX) * (R ? 1 : 1 - Math.exp(-dt / carTau)); carriage.position.x = carX;
      lev *= Math.exp(-dt / 0.2); lever.rotation.set(-0.4 - lev * 0.5, -0.55 + lev * 0.35, 0);
      if (barT0 != null) {
        const e = t - barT0;
        let a: number;
        if (e < 55) a = e / 55; else if (e < 170) a = 1 - (e - 55) / 115; else { a = 0; barT0 = null; }
        bar.rotation.x = 0.9 - 3.18 * a * barAmp;
      }
    },
  };
};

export default clk;
