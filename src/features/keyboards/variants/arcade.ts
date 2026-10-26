import type * as THREE from 'three';
import { spring } from '@/lib/tokens';
import { rrShape } from '../core/rig';
import type { VariantFactory } from '../core/types';

/**
 * Arcade (8bt): control deck with candy buttons lit from inside, a joystick that tilts with the
 * arrow keys, a coin slot, and a pixel marquee that shows typed characters (replaces the trail).
 * Easter eggs (from the input layer's sequence matcher): ↑↑↓↓←→←→BA → confetti + 1UP (1.4s);
 * "gautam" → HIGH SCORE (2.6s). Original pixel art only.
 */
const arcade: VariantFactory = (rig) => {
  const Q = { W: 256, H: 32, buf: '', msg: null as string | null, until: 0, blink: -1 };
  let canvas: HTMLCanvasElement, g2: CanvasRenderingContext2D, tex: THREE.CanvasTexture;
  let stick: THREE.Group, coinM: THREE.MeshBasicMaterial;
  let jx = 0, jz = 0;
  const pixel = () => rig.cssVar('--font-pixel');

  const draw = (t: number) => {
    const { W, H } = Q;
    g2.fillStyle = rig.cssVar('--kb-marquee-bg'); g2.fillRect(0, 0, W, H);
    g2.fillStyle = 'rgba(255,255,255,.035)';
    for (let y = 0; y < H; y += 2) g2.fillRect(0, y, W, 1);
    g2.font = `8px ${pixel()}`; g2.textBaseline = 'middle';
    const on = Math.floor(t / 600) % 2 === 0;
    // Typed text stays left-aligned (only the caret blinks); messages and the idle prompt centre.
    let s: string, typed = false;
    if (Q.msg && t < Q.until) s = Q.msg;
    else if (!Q.buf.trim()) s = on ? 'PRESS ANY KEY' : '';
    else { s = Q.buf.slice(-29); typed = true; }
    g2.fillStyle = rig.accentStr;
    const w = g2.measureText(s).width, x = typed ? Math.min(8, W - 14 - w) : (W - w) / 2;
    g2.textAlign = 'left'; g2.fillText(s, Math.round(x), H / 2 + 1);
    if (typed && on) g2.fillRect(Math.round(x + w + 2), 12, 7, 9);
    tex.needsUpdate = true;
  };

  const oneUp = () => {
    Q.msg = '1UP!'; Q.until = rig.now() + 2200; Q.blink = -1;
    if (rig.reduced) return;
    const p = rig.vgToScreen(0.9, 1.75, -3.3), cols = rig.candy.length ? rig.candy : [rig.accentStr];
    for (let i = 0; i < 44; i++) {
      const d = document.createElement('div'), s = 6 + (i % 3) * 3;
      d.style.cssText = `position:absolute;left:${p.x}px;top:${p.y}px;width:${s}px;height:${s}px;background:${cols[i % cols.length]}`;
      rig.overlay.appendChild(d);
      const a = -Math.PI * Math.random(), sp = 120 + Math.random() * 260, dx = Math.cos(a) * sp, dy = Math.sin(a) * sp;
      d.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${dx * 0.7}px,${dy * 0.7}px)`, opacity: 1, offset: 0.45 }, { transform: `translate(${dx}px,${dy + 220}px)`, opacity: 0 }], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' }).onfinish = () => d.remove();
    }
    const u = document.createElement('div');
    u.textContent = '1UP';
    u.style.cssText = `position:absolute;left:${p.x}px;top:${p.y}px;font-family:var(--font-pixel);font-size:24px;color:var(--accent);text-shadow:0 3px 0 rgba(0,0,0,.35);transform:translate(-50%,-50%)`;
    rig.overlay.appendChild(u);
    u.animate([{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-140%) scale(1)', opacity: 1, offset: 0.25 }, { transform: 'translate(-50%,-260%) scale(1)', opacity: 0 }], { duration: 1400, easing: 'steps(14)', fill: 'forwards' }).onfinish = () => u.remove();
  };

  return {
    cfg: { travel: 0.08, glow: 1, press: spring.press, release: spring.release, trail: 'marquee', fit: 0.9, kx: 1.5, kz: 0.45, pos: [0, 0, 0.45], foot: [17.6, 9.4], lift: 0.17 },
    legend: { round: true, pixel: true, primer: false, font: 'pixel' },
    body(g) {
      const T = rig.T;
      const panel = rig.mk('phys', '--kb-case', { roughness: 0.35, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.3 });
      const inset = rig.mk('std', '--kb-plate', { roughness: 0.6, metalness: 0 });
      const trimM = rig.mk('phys', '--kb-trim', { roughness: 0.25, clearcoat: 1 });
      const metal = rig.mk('std', '--kb-metal', { metalness: 0.85, roughness: 0.3 });
      rig.add(g, rig.extrude(rrShape(17.4, 7.6, 0.45), 0.9, 0.06, 2), panel);
      rig.add(g, rig.flat(rrShape(16.9, 7.1, 0.3)), inset, [0, 0.903, 0], undefined, true).receiveShadow = true;
      rig.add(g, new T.BoxGeometry(17.3, 0.14, 0.06), trimM, [0, 0.8, 3.82]);
      const mq = new T.Group(); mq.position.set(0.9, 0.9, -3.55); mq.rotation.x = -0.12; g.add(mq);
      rig.add(mq, new T.BoxGeometry(12.6, 1.6, 0.34), panel, [0, 0.8, 0]);
      canvas = document.createElement('canvas'); canvas.width = Q.W; canvas.height = Q.H; g2 = canvas.getContext('2d')!;
      tex = new T.CanvasTexture(canvas); tex.colorSpace = T.SRGBColorSpace; tex.magFilter = T.NearestFilter; tex.minFilter = T.LinearFilter; tex.generateMipmaps = false;
      rig.add(mq, new T.PlaneGeometry(12.1, 1.15), rig.mkBasic({ map: tex, toneMapped: false }), [0, 0.82, 0.175], undefined, true);
      stick = new T.Group(); stick.position.set(-7.05, 0.9, 0.55); g.add(stick);
      rig.add(stick, rig.cyl(0.62, 0.04, 28), metal, [0, 0.02, 0]);
      rig.add(stick, rig.cyl(0.06, 1.0, 10), metal, [0, 0.5, 0]);
      rig.add(stick, new T.SphereGeometry(0.32, 28, 18), rig.mk('phys', '--kb-cap', { roughness: 0.18, clearcoat: 1 }), [0, 1.05, 0]);
      rig.add(g, new T.ShapeGeometry(rrShape(1.4, 0.56, 0.08), 8), metal, [6.6, 0.45, 3.805], undefined, true);
      rig.add(g, new T.BoxGeometry(0.08, 0.34, 0.05), rig.mk('std', '--kb-void', { roughness: 0.9 }), [6.42, 0.45, 3.83], undefined, true);
      coinM = rig.mkBasic({ toneMapped: false });
      rig.add(g, new T.CircleGeometry(0.07, 16), coinM, [6.92, 0.45, 3.83], undefined, true);
      draw(0);
      return { front: { w: 17.2, h: 0.9, y: 0.45, z: 3.8 } };
    },
    profile: () => ({ h: 0.2, pitch: 0, by: 0.9 }),
    makeCap(k) {
      const T = rig.T, W = k.w - 0.2, D = 0.8;
      const bm = rig.mk('std', '--kb-metal', { roughness: 0.45, metalness: 0.3 }, rig.keyMats);
      const bezel = new T.Mesh(rig.pillGeo(W + 0.14, D + 0.14, 0.06, 0.012, 1).g, bm);
      bezel.castShadow = true; bezel.receiveShadow = true;
      const mat = rig.mk('phys', null, { roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1 }, rig.keyMats);
      return rig.capParts(rig.pillGeo(W - 0.04, D - 0.04, 0.2, 0.1, 6), mat, { y0: 0.03, extras: [bezel] });
    },
    print(ch) {
      if (ch === '⌫') Q.buf = Q.buf.slice(0, -1);
      else Q.buf = (Q.buf + (ch === '↵' || ch === '·' ? ' ' : ch).toUpperCase()).slice(-60);
      Q.blink = -1;
    },
    egg(egg) {
      if (egg === 'konami') oneUp();
      else { Q.msg = 'HIGH SCORE: GAUTAM'; Q.until = rig.now() + 2600; Q.blink = -1; }
    },
    colors() {
      coinM.color.set(rig.accentStr);
      Q.blink = -1;
    },
    update(t, dt) {
      const ax = (rig.held('ArrowRight') ? 1 : 0) - (rig.held('ArrowLeft') ? 1 : 0);
      const az = (rig.held('ArrowDown') ? 1 : 0) - (rig.held('ArrowUp') ? 1 : 0);
      const a = rig.reduced ? 1 : 1 - Math.exp(-dt / 0.05);
      jx += (ax - jx) * a; jz += (az - jz) * a;
      stick.rotation.set(jz * 0.38, 0, -jx * 0.38); // ±0.38 rad
      const b = Math.floor(t / 600) + (Q.msg && t < Q.until ? 1e6 : 0);
      if (b !== Q.blink) { Q.blink = b; draw(t); }
    },
  };
};

export default arcade;
