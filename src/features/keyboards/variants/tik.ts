import type * as THREE from 'three';
import { spring } from '@/lib/tokens';
import { rrShape } from '../core/rig';
import type { VariantFactory } from '../core/types';

/**
 * Laptop: aluminium deck, chiclet keys in wells, glass trackpad with a parallax sheen, backlit
 * legends. Design gap (owner request): the lid stands open behind the hinge and its screen shows
 * a terminal with what is typed, the way the Typewriter prints and the Arcade marquee scrolls.
 */
const PROMPT = 'grs@infra:~$ ';
const COLS = 62;
const ROWS = 6;

const tik: VariantFactory = (rig) => {
  let wellM: THREE.MeshStandardMaterial;
  let padSheen: THREE.MeshBasicMaterial;
  let canvas: HTMLCanvasElement, g2: CanvasRenderingContext2D, tex: THREE.CanvasTexture;
  let lines: string[] = [PROMPT];
  let blink = -1;

  const draw = (t: number) => {
    const W = canvas.width, H = canvas.height;
    g2.fillStyle = rig.cssVar('--kb-marquee-bg');
    g2.fillRect(0, 0, W, H);
    g2.font = `500 26px ${rig.cssVar('--font-mono')}`;
    g2.textBaseline = 'top';
    g2.fillStyle = rig.accentStr;
    const shown = lines.slice(-ROWS);
    shown.forEach((l, i) => g2.fillText(l, 28, 22 + i * 38));
    if (Math.floor(t / 600) % 2 === 0) {
      const last = shown[shown.length - 1] ?? '';
      g2.fillRect(28 + g2.measureText(last).width + 3, 22 + (shown.length - 1) * 38, 14, 28);
    }
    tex.needsUpdate = true;
  };

  return {
    cfg: { travel: 0.065, glow: 0, press: spring.press, release: spring.release, trail: 'screen', fit: 0.8, kx: 0, kz: -1.9, pos: [0, 0, 0.3], foot: [19.4, 11.6], lift: 0.1 },
    legend: { round: false, pixel: false, primer: false, font: 'mono' },
    body(g) {
      const T = rig.T;
      const deckM = rig.mk('std', '--kb-metal', { metalness: 0.6, roughness: 0.5 });
      deckM.userData.mr = 1;
      const darkM = rig.mk('std', '--kb-trim', { metalness: 0.5, roughness: 0.6 });
      wellM = rig.mk('std', '--kb-plate', { metalness: 0.1, roughness: 0.85 });
      rig.add(g, rig.extrude(rrShape(19.4, 11.6, 0.7), 0.4, 0.05, 2), deckM);
      // Hinge bar. Its top sat exactly on the deck top (y 0.4) in the prototype and z-fought as the
      // board swayed; lifted 0.01u.
      rig.add(g, new T.BoxGeometry(19.0, 0.3, 0.5), darkM, [0, 0.26, -5.65]);
      const chamM = rig.mk('std', '--kb-metal', { metalness: 0.7, roughness: 0.32 });
      rig.add(g, rig.flat(rrShape(7.9, 3.7, 0.4)), chamM, [0, 0.401, 3.65], undefined, true).receiveShadow = true;
      const glassM = rig.mk('phys', '--kb-glass', { metalness: 0, roughness: 0.62, clearcoat: 0.2, clearcoatRoughness: 0.6 });
      rig.add(g, rig.flat(rrShape(7.76, 3.56, 0.34)), glassM, [0, 0.404, 3.65], undefined, true).receiveShadow = true;
      padSheen = rig.mkBasic({ map: rig.padTex, transparent: true, depthWrite: false, toneMapped: false, blending: T.AdditiveBlending, opacity: 0.18 });
      rig.add(g, rig.plane(7.6, 3.4), padSheen, [0, 0.408, 3.65], undefined, true);

      // Lid: open about 105°, leaning back from the hinge; only its lower part needs to read.
      const LH = 5.2;
      const lid = new T.Group();
      lid.position.set(0, 0.42, -5.78);
      lid.rotation.x = -0.26;
      g.add(lid);
      const shell = new T.BoxGeometry(19.2, LH, 0.22);
      shell.translate(0, LH / 2, 0);
      rig.add(lid, shell, deckM);
      const bezel = new T.PlaneGeometry(18.6, LH - 0.3);
      bezel.translate(0, LH / 2 + 0.05, 0.112);
      rig.add(lid, bezel, rig.mk('std', '--kb-void', { roughness: 0.4, metalness: 0.2 }), undefined, undefined, true);
      canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = Math.round((1024 * (LH - 1)) / 17.6);
      g2 = canvas.getContext('2d')!;
      tex = new T.CanvasTexture(canvas);
      tex.colorSpace = T.SRGBColorSpace;
      tex.anisotropy = 8;
      const display = new T.PlaneGeometry(17.6, LH - 1);
      display.translate(0, (LH - 1) / 2 + 0.55, 0.114);
      rig.add(lid, display, rig.mkBasic({ map: tex, toneMapped: false }), undefined, undefined, true);
      draw(0);
      return { front: { w: 19.2, h: 0.4, y: 0.2, z: 5.8 } };
    },
    profile: () => ({ h: 0.14, pitch: 0, by: 0.37 }),
    makeCap(k) {
      const G = rig.chiclet(k.w, k.row === 0 ? 0.46 : 0.76);
      const mat = rig.mk('std', null, { roughness: 0.55, metalness: 0 }, rig.keyMats);
      const well = new rig.T.Mesh(rig.gc(`well${k.w}|${k.row === 0}`, () => rig.flat(rrShape(G.W + 0.1, G.D + 0.1, 0.13))), wellM);
      well.position.set(k.cx, 0.402, k.cz);
      well.receiveShadow = true;
      rig.vg.add(well);
      return rig.capParts(G, mat);
    },
    print(ch) {
      const i = lines.length - 1;
      if (ch === '↵') lines.push(PROMPT);
      else if (ch === '⌫') {
        if (lines[i]!.length > PROMPT.length) lines[i] = lines[i]!.slice(0, -1);
      } else {
        if (lines[i]!.length >= COLS) lines.push('');
        lines[lines.length - 1] += ch === '·' ? ' ' : ch;
      }
      lines = lines.slice(-ROWS * 4);
      blink = -1;
    },
    colors() {
      padSheen.userData.o0 = rig.dark ? 0.07 : 0.16;
      padSheen.opacity = padSheen.userData.o0;
      blink = -1;
    },
    update(t) {
      // Trackpad sheen follows cursor parallax (±0.32 x, ±0.22 y) and the board's yaw (7c).
      rig.padTex.offset.set(-rig.px * 0.32 - (rig.board.rotation.y + 0.3) * 2, rig.py * 0.22);
      const b = Math.floor(t / 600);
      if (b !== blink) {
        blink = b;
        draw(t);
      }
    },
  };
};

export default tik;
