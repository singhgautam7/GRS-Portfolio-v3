import * as THREE from 'three';
import type { InputEvent, InputLayer } from '@/input/layer';
import { CHORD_LIT_CODES, KEY_LABELS, MOD_LIT_CODES } from '@/input/registry';
import { modCodes } from '@/input/match';
import type { OS } from '@/lib/platform';
import { prefersReducedMotion } from '@/lib/reduced-motion';
import { spring, timing } from '@/lib/tokens';
import { variantMeta } from '../variants';
import type { VariantId } from '../variants';
import { layoutFor } from './layouts';
import type { LayoutKey } from './layouts';
import type { CapParts, RigKey, VariantImpl } from './types';
import { loadVariant } from './loaders';

/**
 * The hero keyboard rig: one scene, one camera, one render loop shared by every variant (same
 * desk, same staging). Ported from the design prototype (specs/design/.../keyboard3d.js); values
 * are the design's. Differences from the prototype, by the build rules:
 *  - no keyboard listeners: presses arrive from the input layer (real / pointer / ghost);
 *  - legends come from one texture atlas (single upload) instead of a canvas per key;
 *  - variants are separate chunks, loaded on demand; swap is latest-wins;
 *  - the shadow map only re-renders while something moves; the loop pauses off-screen.
 * ponytail: caps are individual meshes (~100 keys × cap/legend/glow), not InstancedMesh; switch
 * to instancing if the 60fps budget is missed on target hardware.
 */

const CAM_BOARD = { el: 0.68, az: 0, dist: 49, tx: 0, ty: 0.3, tz: 0.4, ox: -0.27, oy: -0.01 };
const CAM_PLAY = { el: 0.6155, az: 0.785, dist: 50, tx: 0, ty: 0, tz: 0, ox: 0, oy: 0.05 };
type Cam = typeof CAM_BOARD;
const BASE_RY = -0.3;
const R_OUT = 140, R_IN = 180; // reduced-motion swap fades (7c)
const MAX_RIPPLES = 6; // handoff 5e
const GHOST: [number, 'd' | 'u' | 'md' | 'mu' | 'end', string?][] = [
  [0, 'd', 'KeyH'], [110, 'u', 'KeyH'], [190, 'd', 'KeyE'], [290, 'u', 'KeyE'], [370, 'd', 'KeyL'], [460, 'u', 'KeyL'],
  [540, 'd', 'KeyL'], [630, 'u', 'KeyL'], [720, 'd', 'KeyO'], [840, 'u', 'KeyO'], [1700, 'md'], [3900, 'mu'], [4500, 'end'],
];

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const eout = (t: number) => 1 - Math.pow(1 - t, 3);

export function rrShape(w: number, d: number, r: number, path = false): THREE.Shape {
  const s = path ? (new THREE.Path() as THREE.Shape) : new THREE.Shape();
  const x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function pillShape(w: number, d: number) {
  const s = new THREE.Shape(), r = d / 2, hx = Math.max(0, w / 2 - r);
  s.moveTo(-hx, -r); s.lineTo(hx, -r); s.absarc(hx, 0, r, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-hx, r); s.absarc(-hx, 0, r, Math.PI / 2, Math.PI * 1.5, false);
  return s;
}
function gradTex(size: number, stops: [number, string][]) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function bandTex(w: number, h: number, diag: boolean) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  const gr = diag ? g.createLinearGradient(0, h, w, 0) : g.createLinearGradient(0, 0, w, 0);
  ([[0, 0], [0.4, 0], [0.47, 0.35], [0.5, 1], [0.53, 0.35], [0.6, 0], [1, 0]] as const).forEach(([o, a]) => gr.addColorStop(o, `rgba(255,255,255,${a})`));
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (!diag) {
    const v = g.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(0.5, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = v; g.fillRect(0, 0, w, h);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export interface RigOptions {
  container: HTMLElement;
  input: InputLayer;
  os: OS;
  variant: VariantId;
  autoplay: boolean;
  /** Render one settled frame and stop (poster generation). */
  still?: boolean;
  /** Called while an incoming variant chunk is still loading (show its poster). */
  onLoading?: (id: VariantId | null) => void;
}

export class KeyboardRig {
  readonly T = THREE;
  readonly input: InputLayer;
  readonly overlay: HTMLDivElement;
  readonly canvas: HTMLCanvasElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(20, 1.6, 1, 200);
  readonly clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  readonly board = new THREE.Group();
  os: OS;
  vid!: VariantId;
  V!: VariantImpl;
  vg!: THREE.Group;
  bodyG!: THREE.Group;
  keys: RigKey[] = [];
  byCode: Record<string, RigKey> = {};
  bodyMats: THREE.Material[] = [];
  keyMats: THREE.Material[] = [];
  C!: Record<'acc' | 'legAcc' | 'leg' | 'legMod' | 'accent' | 'accentText' | 'ink3', THREE.Color>;
  dark = false;
  accentStr = '#f60';
  candy: string[] = [];
  ripples: { x: number; z: number; t0: number; s: number; fall: number }[] = [];
  /** Swap visibility 0..1 (keys); case opacity during entrance. */
  sv = 1;
  caseOp = 1;
  px = 0;
  py = 0;
  readonly reduced: boolean;

  private opts: RigOptions;
  private camP: Cam = { ...CAM_BOARD };
  private hemi = new THREE.HemisphereLight(0xffffff, 0xd8d0c4, 0.55);
  private keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
  private groundMat = new THREE.ShadowMaterial({ opacity: 0.2 });
  private contactMat!: THREE.MeshBasicMaterial;
  private contact!: THREE.Mesh;
  private glowTex = gradTex(128, [[0, 'rgba(255,255,255,1)'], [0.45, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
  private dishTex = gradTex(128, [[0, 'rgba(255,255,255,1)'], [0.7, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]);
  readonly sheenTex = bandTex(512, 64, false);
  readonly padTex = bandTex(256, 256, true);
  private sheenMat!: THREE.MeshBasicMaterial;
  private sheenBase = 0.42;
  private dishMat!: THREE.MeshBasicMaterial;
  private atlas: THREE.CanvasTexture | null = null;
  private geoCache: Record<string, unknown> = {};
  private capMeshes: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private v3 = new THREE.Vector3();
  private tmpC = new THREE.Color();
  private tmpC2 = new THREE.Color();
  private trail: HTMLDivElement;
  private glowK = 0.6;
  private emisK = 0.2;
  private dimK = 0.2;
  private contactOp = 0.3;
  private cw = 1;
  private ch = 1;
  private mono = 'monospace';
  private pixelFont = 'monospace';
  private last = 0;
  private t0 = 0;
  private entering = false;
  private entShort = false;
  private sweepX: number | null = null;
  private swap: { phase: 'out' | 'in'; t0: number; p0: number } | null = null;
  private wantV: VariantId;
  private nextImpl: VariantImpl | null = null;
  private ap: { t0: number; i: number; mod?: boolean } | null = null;
  private pointer: { x: number; y: number } | null = null;
  private ptx = 0;
  private pty = 0;
  private hoverKey: RigKey | null = null;
  private mouseKey: RigKey | null = null;
  private raf = 0;
  private visible = true;
  private dead = false;
  private shadowDirty = true;
  private frameAvg = 16;
  private dpr: number;
  private lightSweep: boolean;
  private toPlay: { t0: number; resolve: () => void } | null = null;
  private off: (() => void)[] = [];
  private minZ = 0;

  constructor(opts: RigOptions) {
    this.opts = opts;
    this.input = opts.input;
    this.os = opts.os;
    this.wantV = opts.variant;
    this.reduced = prefersReducedMotion();
    const nav = navigator as Navigator & { deviceMemory?: number };
    this.lightSweep = (nav.deviceMemory ?? 8) >= 4;
    const host = opts.container;
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-hidden', 'true');
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;outline:none';
    this.overlay = document.createElement('div');
    this.overlay.setAttribute('aria-hidden', 'true');
    this.overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
    host.append(this.canvas, this.overlay);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.still });
    this.dpr = opts.still ? 1 : Math.min(2, devicePixelRatio || 1);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setClearColor(0, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.localClippingEnabled = true;
    this.trail = document.createElement('div');
    this.trail.style.cssText = 'position:absolute;left:0;top:0;display:flex;gap:1px;font-family:var(--font-mono);font-size:16px;letter-spacing:.02em;color:var(--ink-2);white-space:pre;transform:translate(-50%,-50%)';
    this.overlay.appendChild(this.trail);
  }

  /** Builds the scene for the initial variant and starts the loop. */
  async start() {
    const host = this.opts.container;
    const cs = getComputedStyle(host);
    this.mono = cs.getPropertyValue('--font-mono').trim() || 'monospace';
    this.pixelFont = cs.getPropertyValue('--font-pixel').trim() || 'monospace';
    const factory = await loadVariant(this.wantV);
    try {
      await Promise.all([document.fonts.load(`500 40px ${this.mono}`), document.fonts.load(`8px ${this.pixelFont}`), document.fonts.load(`34px ${cs.getPropertyValue('--font-type').trim()}`)]);
    } catch {
      /* fall back to whatever is loaded */
    }
    if (this.dead) return;
    this.buildStatic();
    this.rebuild(this.wantV, factory(this));
    this.readColors();
    this.resize();
    this.state0();
    if (this.opts.still) {
      this.last = performance.now();
      for (let i = 0; i < 60; i++) this.tick(this.last + i * 16, true);
      this.shadowDirty = true;
      this.render();
      return;
    }
    this.bind();
    this.loop();
  }

  /* ---------- static scene ---------- */
  private buildStatic() {
    const sc = this.scene;
    sc.environment = this.makeEnv();
    sc.add(this.hemi);
    const d = this.keyLight;
    d.position.set(-7, 13, 7); d.castShadow = true; d.shadow.mapSize.set(2048, 2048);
    Object.assign(d.shadow.camera, { left: -15, right: 15, top: 11, bottom: -11, near: 1, far: 45 });
    d.shadow.bias = -0.0004; d.shadow.normalBias = 0.025; d.shadow.radius = 5;
    sc.add(d);
    const f = new THREE.DirectionalLight(0xffffff, 0.45); f.position.set(9, 6, -5); sc.add(f);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), this.groundMat);
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; sc.add(ground);
    this.contactMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, depthWrite: false, opacity: 0.3, map: gradTex(256, [[0, 'rgba(255,255,255,1)'], [0.55, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]) });
    this.contact = new THREE.Mesh(new THREE.PlaneGeometry(21, 10.5), this.contactMat);
    this.contact.rotation.x = -Math.PI / 2; this.contact.position.y = 0.003;
    this.board.rotation.y = BASE_RY; sc.add(this.board); this.board.add(this.contact);
    this.dishMat = new THREE.MeshBasicMaterial({ color: 0x000000, map: this.dishTex, transparent: true, opacity: 0.05, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
  }
  private makeEnv() {
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.BoxGeometry(40, 40, 40), new THREE.MeshBasicMaterial({ color: 0x6a6a6a, side: THREE.BackSide })));
    const panel = (w: number, h: number, pos: [number, number, number], rot: [number, number, number], i: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(i, i, i), side: THREE.DoubleSide }));
      m.position.set(...pos); m.rotation.set(...rot); s.add(m);
    };
    panel(22, 22, [-3, 19, 2], [Math.PI / 2, 0, 0], 3.4);
    panel(10, 24, [-19, 6, 2], [0, Math.PI / 2, 0], 2.4);
    panel(34, 3, [0, 3, 19], [0, 0, 0], 2.0);
    panel(8, 18, [19, 5, -6], [0, -Math.PI / 2, 0], 1.0);
    const pm = new THREE.PMREMGenerator(this.renderer);
    const tex = pm.fromScene(s, 0.04).texture;
    pm.dispose();
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      (m.material as THREE.Material | undefined)?.dispose();
    });
    return tex;
  }

  /* ---------- helpers for variant modules ---------- */
  mk(kind: 'std' | 'phys', tok: string | null, o: THREE.MeshPhysicalMaterialParameters = {}, list: THREE.Material[] = this.bodyMats) {
    const m = kind === 'phys' ? new THREE.MeshPhysicalMaterial({ color: 0xffffff, ...o }) : new THREE.MeshStandardMaterial({ color: 0xffffff, ...(o as THREE.MeshStandardMaterialParameters) });
    m.userData = { tok, o0: m.opacity, t0: m.transparent };
    m.clippingPlanes = [this.clipPlane]; m.clipShadows = true;
    list.push(m);
    return m;
  }
  mkBasic(o: THREE.MeshBasicMaterialParameters) {
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, ...o });
    m.userData = { tok: null, o0: m.opacity, t0: m.transparent };
    m.clippingPlanes = [this.clipPlane];
    this.bodyMats.push(m);
    return m;
  }
  add(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, pos?: [number, number, number], rot?: [number, number, number], noShadow?: boolean) {
    const m = new THREE.Mesh(geo, mat);
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    if (!noShadow) { m.castShadow = true; m.receiveShadow = true; }
    parent.add(m);
    return m;
  }
  extrude(shape: THREE.Shape, H: number, bev: number, segs = 1) {
    const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.002, H - 2 * bev), bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: segs, curveSegments: 14 });
    g.rotateX(-Math.PI / 2); g.translate(0, bev, 0);
    return g;
  }
  flat(shape: THREE.Shape) {
    const g = new THREE.ShapeGeometry(shape, 14); g.rotateX(-Math.PI / 2); return g;
  }
  gc<T>(key: string, fn: () => T): T {
    return (this.geoCache[key] ??= fn()) as T;
  }
  cyl(r: number, l: number, seg = 12) {
    return this.gc(`c${r}|${l}|${seg}`, () => new THREE.CylinderGeometry(r, r, l, seg));
  }
  plane(w: number, d: number) {
    return this.gc(`pl${w.toFixed(3)}|${d.toFixed(3)}`, () => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); return g; });
  }
  /** Sculpted keycap (Mechanical, Bullet). */
  capGeo(w: number, h: number, D: number) {
    return this.gc(`cap${w}|${h}|${D}`, () => {
      const W = w - 0.17, bev = 0.055;
      const g = new THREE.ExtrudeGeometry(rrShape(W - 2 * bev, D - 2 * bev, 0.085), { depth: h - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 5 });
      g.rotateX(-Math.PI / 2); g.translate(0, bev, 0);
      const p = g.attributes.position!, tx = 0.17 / W, tz = 0.17 / D;
      for (let i = 0; i < p.count; i++) { const t = clamp(p.getY(i) / h); p.setX(i, p.getX(i) * (1 - t * tx)); p.setZ(i, p.getZ(i) * (1 - t * tz) - t * 0.015); }
      g.computeVertexNormals();
      return { g, top: { w: (W - 2 * bev) * (1 - tx) - 0.03, d: (D - 2 * bev) * (1 - tz) - 0.03 }, h };
    });
  }
  chiclet(w: number, D: number) {
    return this.gc(`chic${w}|${D}`, () => { const W = w - 0.24, bev = 0.025; return { g: this.extrude(rrShape(W - 2 * bev, D - 2 * bev, 0.085), 0.14, bev, 2), top: { w: W - 0.08, d: D - 0.08 }, h: 0.14, W, D }; });
  }
  pillGeo(W: number, D: number, H: number, bev: number, segs = 1) {
    return this.gc(`pill${W}|${D}|${H}|${bev}`, () => { const s = pillShape(Math.max(0.05, W - 2 * bev), Math.max(0.05, D - 2 * bev)); return { g: this.extrude(s, H, bev, segs), top: { w: W - 2 * bev - 0.02, d: D - 2 * bev - 0.02 }, h: H }; });
  }
  /** Assemble a cap group from a geometry + material (+ optional bezel/stem meshes). */
  capParts(G: { g: THREE.BufferGeometry; top: { w: number; d: number }; h: number }, mat: THREE.MeshStandardMaterial, o: { y0?: number; lz?: number; dish?: boolean; extras?: THREE.Object3D[] } = {}): CapParts {
    const grp = new THREE.Group();
    o.extras?.forEach((e) => grp.add(e));
    const body = new THREE.Mesh(G.g, mat);
    body.position.y = o.y0 ?? 0; body.castShadow = true; body.receiveShadow = true;
    grp.add(body);
    return { grp, body, mat, top: G.top, hTop: (o.y0 ?? 0) + G.h, lz: o.lz ?? 0, dish: !!o.dish };
  }
  now() {
    return performance.now();
  }
  get isStill() {
    return !!this.opts.still;
  }
  cssVar(name: string) {
    return getComputedStyle(this.opts.container).getPropertyValue(name).trim();
  }
  held(code: string) {
    return !!this.input.getState().pressed[code];
  }
  vgToScreen(x: number, y: number, z: number) {
    const v = this.v3.set(x, y, z); this.vg.localToWorld(v); v.project(this.camera);
    return { x: ((v.x + 1) / 2) * this.cw, y: ((1 - v.y) / 2) * this.ch };
  }
  screenOf(k: RigKey, lift = 0) {
    const v = this.v3.set(0, k.hTop + lift, 0); k.cap.localToWorld(v); v.project(this.camera);
    return { x: ((v.x + 1) / 2) * this.cw, y: ((1 - v.y) / 2) * this.ch };
  }
  /** Screen rect of a key, in viewport coordinates (palette emerges from K). */
  keyRect(code: string): DOMRect | null {
    const k = this.byCode[code];
    if (!k) return null;
    const p = this.screenOf(k);
    const r = this.canvas.getBoundingClientRect();
    return new DOMRect(r.left + p.x - 24, r.top + p.y - 24, 48, 48);
  }

  /* ---------- variant build ---------- */
  private disposeGroup(g: THREE.Object3D) {
    g.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const ms = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
      ms.forEach((mat) => {
        const mm = mat as THREE.MeshBasicMaterial;
        if (mm.map && mm.map !== this.glowTex && mm.map !== this.dishTex && mm.map !== this.sheenTex && mm.map !== this.padTex) mm.map.dispose();
        mat.dispose();
      });
    });
  }
  private rebuild(v: VariantId, impl: VariantImpl) {
    if (this.vg) {
      this.V?.dispose?.();
      this.disposeGroup(this.vg);
      this.board.remove(this.vg);
      this.keys.forEach((k) => k.labelEl?.remove());
      this.atlas?.dispose();
      Object.values(this.geoCache).forEach((g) => {
        const geo = (g as { g?: THREE.BufferGeometry }).g ?? (g as THREE.BufferGeometry);
        if (geo instanceof THREE.BufferGeometry) geo.dispose();
      });
    }
    this.vid = v; this.V = impl;
    this.opts.container.dataset.kb = v;
    const c = impl.cfg;
    this.vg = new THREE.Group(); this.vg.scale.setScalar(c.fit); this.vg.position.set(...c.pos); this.board.add(this.vg);
    this.bodyG = new THREE.Group(); this.vg.add(this.bodyG);
    this.bodyMats = []; this.keyMats = []; this.geoCache = {};
    const B = impl.body(this.bodyG);
    this.sheenMat = new THREE.MeshBasicMaterial({ map: this.sheenTex, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, opacity: 0.4 });
    this.sheenMat.clippingPlanes = [this.clipPlane];
    this.add(this.bodyG, new THREE.PlaneGeometry(B.front.w, B.front.h * 0.86), this.sheenMat, [0, B.front.y, B.front.z + 0.015], undefined, true);
    this.buildKeys();
    impl.afterKeys?.();
    this.contact.scale.set((c.foot[0] * c.fit + 4.4) / 21, (c.foot[1] * c.fit + 3.7) / 10.5, 1);
    this.contact.position.z = c.pos[2];
    this.input.set({ sequences: v === '8bt' });
    this.shadowDirty = true;
  }

  private buildKeys() {
    const v = this.vid, V = this.V, c = V.cfg;
    const layout: LayoutKey[] = layoutFor(variantMeta(v).layout, this.os);
    const pal4 = ['--kb-cap', '--kb-cap-2', '--kb-cap-3', '--kb-cap-4'];
    this.byCode = {}; this.capMeshes = [];
    const keys: RigKey[] = [];
    const caps: CapParts[] = [];
    layout.forEach((lk, i) => {
      const base = { ...lk, i, cx: lk.cx + c.kx, cz: lk.cz + c.kz };
      const prof = V.profile(base);
      const k = Object.assign(base, prof) as RigKey;
      const C = V.makeCap(k);
      caps.push(C);
      Object.assign(k, { cap: C.grp, body: C.body, mat: C.mat, hTop: C.hTop, started: true, dropping: false, delay: 0, y: 0, v: 0, lit: 0, dim: 0, self: 0, flash: 0, down: false, ghost: false, relT: -1e9, dE: 0 });
      k.ctok = k.kind === 'accent' ? 'acc' : v === 'clk' && k.code === 'Space' ? '--kb-metal' : k.kind === 'mod' ? '--kb-cap-mod' : v === 'pop' || v === '8bt' ? pal4[(i * 7 + k.row * 3) % 4]! : '--kb-cap';
      keys.push(k);
    });
    // One legend atlas for the whole board: a single texture upload; each key samples its cell.
    const cells = this.buildAtlas(keys, caps);
    keys.forEach((k, i) => {
      const C = caps[i]!, cell = cells[i]!;
      const map = this.atlas!.clone();
      map.offset.set(cell.u, cell.v); map.repeat.set(cell.w, cell.h); map.needsUpdate = true;
      k.lmat = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
      k.lmat.clippingPlanes = [this.clipPlane];
      const leg = new THREE.Mesh(this.plane(C.top.w, C.top.d), k.lmat);
      leg.position.y = C.hTop + 0.004; leg.position.z = C.lz; C.grp.add(leg);
      if (C.dish) { const dish = new THREE.Mesh(this.plane(C.top.w * 0.92, C.top.d * 0.9), this.dishMat); dish.position.y = C.hTop + 0.002; dish.position.z = C.lz; C.grp.add(dish); }
      k.gmat = new THREE.MeshBasicMaterial({ map: this.glowTex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
      const glow = new THREE.Mesh(this.plane(k.w + 0.6, 1.5), k.gmat);
      glow.position.set(k.cx, (V.glowY ? V.glowY(k) : k.by) + 0.004, k.cz); glow.renderOrder = 1;
      this.vg.add(C.grp, glow);
      C.grp.position.set(k.cx, k.by, k.cz); C.grp.rotation.x = k.pitch;
      C.body.userData.k = k;
      if (k.code) this.byCode[k.code] = k;
      this.capMeshes.push(C.body);
      const label = k.code ? KEY_LABELS[k.code] : undefined;
      if (label) { k.labelEl = this.makeLabel(label); this.overlay.appendChild(k.labelEl); }
    });
    this.keys = keys;
    const enter = this.byCode.Enter!;
    keys.forEach((k) => (k.dE = Math.hypot(k.cx - enter.cx, k.cz - enter.cz)));
    this.minZ = Math.min(...keys.map((k) => k.cz));
  }

  private buildAtlas(keys: RigKey[], caps: CapParts[]) {
    const st = this.V.legend, H = 160, PAD = 4, MAXW = 2048;
    const sizes = keys.map((_, i) => { const t = caps[i]!.top; return Math.max(40, Math.round((H * t.w) / t.d)); });
    let x = 0, y = 0;
    const pos = sizes.map((w) => { if (x + w > MAXW) { x = 0; y += H + PAD; } const p = { x, y }; x += w + PAD; return p; });
    const AH = y + H;
    const c = document.createElement('canvas'); c.width = MAXW; c.height = AH;
    const g = c.getContext('2d')!;
    g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.textBaseline = 'middle';
    const f = st.pixel ? (sz: number) => `${Math.round(sz * 0.6)}px ${this.pixelFont}` : (sz: number, wt = 500) => `${wt} ${sz}px ${this.mono}`;
    keys.forEach((k, i) => {
      const W = sizes[i]!, { x: ox, y: oy } = pos[i]!;
      g.save(); g.translate(ox, oy); g.beginPath(); g.rect(0, 0, W, H); g.clip();
      if (st.primer && k.kind === 'alpha' && k.code !== 'Space') {
        g.globalAlpha = 0.3; g.lineWidth = 6; g.beginPath(); g.arc(W / 2, H / 2, H * 0.4, 0, Math.PI * 2); g.stroke();
        g.globalAlpha = 0.16; g.lineWidth = 3; g.beginPath(); g.arc(W / 2, H / 2, H * 0.31, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1;
      }
      if (k.arrow) { g.textAlign = 'center'; g.font = f(50, 400); g.fillText(k.arrow, W / 2, H / 2 + 2); }
      else if (k.kind === 'alpha') {
        g.textAlign = 'center';
        if (k.top) { g.font = f(34, 400); g.fillText(k.top, W / 2, H * 0.31); g.font = f(40, 500); g.fillText(k.main ?? '', W / 2, H * 0.69); }
        else if (k.main) { g.font = f(52, 500); g.fillText(k.main, W / 2, H / 2 + 3); }
      } else if (k.fkey) { g.textAlign = 'center'; g.font = f(28, 500); g.fillText(k.label ?? '', W / 2, H / 2 + 2); }
      else if (st.round) {
        g.textAlign = 'center';
        if (k.sym) { g.font = f(52, 500); g.fillText(k.sym, W / 2, H * 0.4); g.font = f(24, 500); g.fillText(k.label ?? '', W / 2, H * 0.76); }
        else { g.font = f(30, 600); g.fillText(k.label ?? '', W / 2, H / 2 + 2); }
      } else {
        const big = /^(command|cmd|ctrl|control|win|super|option|opt|alt)$/.test(k.label ?? '');
        g.textAlign = 'left'; g.font = f(big ? 30 : 26, big ? 600 : 500); g.fillText(k.label ?? '', 16, H - 30);
        if (k.sym) { g.textAlign = 'right'; g.font = f(big ? 50 : 40, 500); g.fillText(k.sym, W - 16, 42); }
      }
      g.restore();
    });
    this.atlas = new THREE.CanvasTexture(c);
    this.atlas.colorSpace = THREE.SRGBColorSpace; this.atlas.anisotropy = 8;
    return keys.map((_, i) => ({ u: pos[i]!.x / MAXW, v: 1 - (pos[i]!.y + H) / AH, w: sizes[i]! / MAXW, h: H / AH }));
  }

  private makeLabel(text: string) {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;left:0;top:0;white-space:nowrap;font-family:var(--font-mono);font-size:11px;letter-spacing:.02em;color:var(--ink);background:var(--surface);border:1px solid var(--line-2);border-radius:999px;padding:5px 10px 5px 8px;box-shadow:var(--shadow-1);display:flex;align-items:center;gap:6px;opacity:0;will-change:transform,opacity';
    const dot = document.createElement('span');
    dot.style.cssText = 'width:6px;height:6px;border-radius:50%;background:var(--accent);flex:none';
    d.append(dot, document.createTextNode(text));
    return d;
  }

  /** Re-reads every colour/material token (mode change, variant change). */
  readColors() {
    if (!this.keys.length) return;
    const cs = getComputedStyle(this.opts.container), g = (n: string) => cs.getPropertyValue(n).trim();
    const num = (n: string, d: number) => { const v = parseFloat(g(n)); return isNaN(v) ? d : v; };
    const cache: Record<string, THREE.Color> = {};
    const C = (n: string) => (cache[n] ??= new THREE.Color(g(n) || '#888'));
    this.C = { acc: C('--kb-cap-accent'), legAcc: C('--kb-legend-accent'), leg: C('--kb-legend'), legMod: C('--kb-legend-mod'), accent: C('--accent'), accentText: C('--accent-text'), ink3: C('--ink-3') };
    this.accentStr = g('--accent') || '#f60';
    const env = num('--kb-env', 0.8);
    this.dark = document.documentElement.dataset.theme === 'dark';
    this.bodyMats.forEach((m) => {
      const s = m as THREE.MeshStandardMaterial;
      if (m.userData.tok) s.color.copy(C(m.userData.tok));
      if (m.userData.mr) { s.metalness = num('--kb-metalness', 0.6); s.roughness = num('--kb-roughness', 0.42); }
      if ('envMapIntensity' in s) s.envMapIntensity = env;
    });
    this.keyMats.forEach((m) => { const s = m as THREE.MeshStandardMaterial; if (m.userData.tok) s.color.copy(C(m.userData.tok)); s.envMapIntensity = env * 0.7; });
    this.groundMat.opacity = num('--kb-shadow-opacity', 0.2);
    this.contactOp = num('--kb-contact-opacity', 0.3);
    this.glowK = num('--kb-glow-strength', 0.6); this.emisK = num('--kb-emissive', 0.2); this.dimK = num('--kb-dim', 0.2);
    const additive = g('--kb-glow-mode') === 'additive', auto = this.vid === 'pop' || this.vid === '8bt';
    const INK = new THREE.Color(g('--ink') || '#1B1916'), WHITE = new THREE.Color(1, 1, 1);
    const lum = (c: THREE.Color) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    this.keys.forEach((k) => {
      k.c0 = k.ctok === 'acc' ? this.C.acc : C(k.ctok);
      k.l0 = k.kind === 'accent' ? this.C.legAcc : auto ? (lum(k.c0) > 0.3 ? INK : WHITE) : k.kind === 'mod' ? this.C.legMod : this.C.leg;
      k.gmat.blending = additive ? THREE.AdditiveBlending : THREE.NormalBlending; k.gmat.color.copy(this.C.accent); k.gmat.needsUpdate = true;
    });
    this.dishMat.opacity = this.dark ? 0.12 : 0.045;
    this.hemi.intensity = this.dark ? 0.35 : 0.6; this.keyLight.intensity = this.dark ? 2.0 : 2.3;
    this.sheenBase = this.dark ? 0.22 : 0.42;
    this.candy = ['--kb-cap', '--kb-cap-2', '--kb-cap-3', '--kb-cap-4'].map(g);
    this.V.colors?.();
    this.shadowDirty = true;
  }

  private state0() {
    this.t0 = this.now();
    this.entering = !this.reduced && !this.isStill;
    this.entShort = false;
    this.caseOp = this.entering ? 0 : 1;
    this.setEntryDelays(false);
    this.keys.forEach((k) => { k.cap.visible = !this.entering; k.started = !this.entering; });
  }
  /** Entrance: 180ms + 55ms/row + 24ms/u (--stagger-row / --stagger-key); swap-in is shortened (7c). */
  private setEntryDelays(short: boolean) {
    this.keys.forEach((k) => (k.delay = short ? 30 + k.row * 34 + (k.cx + 8) * 6 : 180 + k.row * timing.staggerRow + (k.cx + 8) * timing.staggerKey));
  }

  /* ---------- input ---------- */
  private bind() {
    const c = this.canvas, host = this.opts.container;
    const on = <K extends keyof HTMLElementEventMap>(t: HTMLElement, ev: K, fn: (e: HTMLElementEventMap[K]) => void) => {
      t.addEventListener(ev, fn as EventListener);
      this.off.push(() => t.removeEventListener(ev, fn as EventListener));
    };
    const hero = (host.closest('[data-hero]') as HTMLElement | null) ?? host;
    on(hero, 'pointermove', (e) => { const r = host.getBoundingClientRect(); this.ptx = ((e.clientX - r.left) / r.width) * 2 - 1; this.pty = ((e.clientY - r.top) / r.height) * 2 - 1; });
    on(hero, 'pointerleave', () => { this.ptx = 0; this.pty = 0; });
    on(c, 'pointermove', (e) => { this.pointer = { x: e.clientX, y: e.clientY }; });
    on(c, 'pointerenter', () => this.input.set({ pointerOverKeyboard: true }));
    on(c, 'pointerleave', () => { this.pointer = null; this.input.set({ pointerOverKeyboard: false }); });
    on(c, 'pointerdown', (e) => {
      const k = this.hoverKey;
      if (!k?.code || this.swap || this.toPlay) return;
      e.preventDefault(); c.setPointerCapture(e.pointerId); this.mouseKey = k;
      this.input.synthetic(k.code, this.charKey(k), true, 'pointer');
    });
    const up = () => { const k = this.mouseKey; if (!k?.code) return; this.mouseKey = null; this.input.synthetic(k.code, this.charKey(k), false, 'pointer'); };
    on(c, 'pointerup', up); on(c, 'pointercancel', up);
    this.off.push(this.input.on((e) => this.onInput(e)));
    // Render while any of it is on screen; the board "has the keyboard" (Space/arrows press keys
    // instead of scrolling) while most of the hero is in view, so it works from the first key.
    const io = new IntersectionObserver(
      (es) => {
        const e = es[0];
        this.visible = !!e?.isIntersecting;
        this.input.set({ keyboardVisible: !!e && e.intersectionRatio >= 0.6 });
      },
      { threshold: [0, 0.6] },
    );
    io.observe(host);
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(host);
    const mo = new MutationObserver(() => requestAnimationFrame(() => this.readColors()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    this.off.push(() => { io.disconnect(); ro.disconnect(); mo.disconnect(); this.input.set({ keyboardVisible: false, pointerOverKeyboard: false, sequences: false }); });
  }
  private charKey(k: RigKey) {
    if (k.code === 'Enter') return 'Enter';
    if (k.code === 'Escape') return 'Escape';
    if (k.code === 'Space') return ' ';
    if (k.kind === 'alpha') return (k.main ?? '').toLowerCase();
    return k.code ?? '';
  }
  private onInput(e: InputEvent) {
    if (e.type === 'down') {
      const k = this.byCode[e.code];
      if (e.repeat) { if (k) { k.self = Math.max(k.self, 0.6); k.flash = Math.max(k.flash, 0.5); } return; }
      if (k && !this.swap) this.pressKey(k, e.source === 'ghost');
      const st = this.input.getState();
      if (!st.modHeld && !this.toPlay) {
        if (e.source === 'ghost') { if (k?.main) this.addTrail(k.main.toLowerCase(), true); }
        else if (e.key.length === 1) this.addTrail(e.key === ' ' ? '·' : e.key, false);
        else if (e.key === 'Enter') this.addTrail('↵', false);
        else if (e.key === 'Backspace') this.addTrail('⌫', false);
      }
    } else if (e.type === 'up') {
      const k = this.byCode[e.code];
      if (k) this.releaseKey(k);
    } else if (e.type === 'real') {
      if (this.ap) this.stopAutoplay();
    } else if (e.type === 'shortcut' && e.id === 'palette') {
      const k = this.byCode.KeyK;
      if (k) this.ring(k);
    } else if (e.type === 'egg') {
      this.V.egg?.(e.egg);
    }
  }
  pressKey(k: RigKey, ghost = false) {
    const was = k.down;
    k.down = true; k.ghost = ghost; k.flash = ghost ? 0.5 : 1; k.self = ghost ? 0.38 : 1;
    if (!ghost && !this.reduced && !this.toPlay) {
      this.ripples.push({ x: k.cx, z: k.cz, t0: this.now(), s: 0.85, fall: 2.4 });
      if (this.ripples.length > MAX_RIPPLES) this.ripples.shift();
    }
    if (!was) this.V.feedback?.(k, ghost);
  }
  releaseKey(k: RigKey) {
    if (!k.down) return;
    k.down = false; k.ghost = false; k.relT = this.now();
  }

  private stopAutoplay() {
    if (!this.ap) return;
    Object.entries(this.input.getState().pressed).forEach(([code, src]) => src === 'ghost' && this.input.synthetic(code, '', false, 'ghost'));
    this.ap = null;
  }
  /** Idle autoplay: after --idle-delay without real input, a silent ghost sequence (design GHOST). */
  private runAutoplay(t: number) {
    const st = this.input.getState();
    if (!this.opts.autoplay || this.reduced || st.realSeen || this.entering || this.swap || this.toPlay || st.blocked) { this.stopAutoplay(); return; }
    if (!this.ap) { if (t - Math.max(st.lastReal, this.t0 + 1200) > timing.idleDelay) this.ap = { t0: t, i: 0 }; else return; }
    const el = t - this.ap.t0;
    const mod = modCodes(this.os)[0]!;
    while (this.ap && this.ap.i < GHOST.length && GHOST[this.ap.i]![0] <= el) {
      const [, a, c] = GHOST[this.ap.i++]!;
      if (a === 'd') this.input.synthetic(c!, c!.slice(3).toLowerCase(), true, 'ghost');
      else if (a === 'u') this.input.synthetic(c!, c!.slice(3).toLowerCase(), false, 'ghost');
      else if (a === 'md') this.input.synthetic(mod, 'Meta', true, 'ghost');
      else if (a === 'mu') this.input.synthetic(mod, 'Meta', false, 'ghost');
      else { this.ap = null; this.t0 = t - 1200; this.input.set({ lastReal: t }); }
    }
  }

  /* ---------- typed output ---------- */
  private addTrail(ch: string, ghost: boolean) {
    const mode = this.V.cfg.trail;
    if (mode !== 'dom') { this.V.print?.(ch, ghost); return; }
    if (ch === '⌫') { this.trail.lastChild?.remove(); return; }
    const s = document.createElement('span');
    s.textContent = ch;
    s.style.cssText = `display:inline-block;color:${ghost ? 'var(--ink-3)' : 'var(--ink)'};opacity:0`;
    this.trail.appendChild(s);
    while (this.trail.children.length > 28) this.trail.firstChild?.remove();
    if (this.reduced) { s.style.opacity = '1'; setTimeout(() => s.remove(), timing.trailLife); return; }
    s.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: ghost ? 0.7 : 1, transform: 'none' }], { duration: 140, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
    setTimeout(() => {
      const a = s.animate([{ opacity: ghost ? 0.7 : 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-18px)' }], { duration: 650, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
      a.onfinish = () => s.remove();
    }, timing.trailLife);
  }
  /** ⌘K accent ring from the K cap (560ms, scale .4 → 4). */
  private ring(k: RigKey) {
    if (this.reduced) return;
    const p = this.screenOf(k);
    const d = document.createElement('div');
    d.style.cssText = `position:absolute;left:${p.x - 24}px;top:${p.y - 24}px;width:48px;height:48px;border-radius:50%;border:2px solid var(--accent);pointer-events:none`;
    this.overlay.appendChild(d);
    d.animate([{ transform: 'scale(.4)', opacity: 1 }, { transform: 'scale(4)', opacity: 0 }], { duration: 560, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => d.remove();
  }

  /* ---------- variant swap: sink + fade + shadow shrink, then a shortened row-by-row rise ---------- */
  setVariant(v: VariantId) {
    this.wantV = v;
    void loadVariant(v); // start fetching the chunk now
    if (this.toPlay) return;
    if (this.entering && !this.entShort) { this.entering = false; this.caseOp = 1; this.keys.forEach((k) => { k.started = true; k.cap.visible = true; }); }
    if (!this.swap) { if (v !== this.vid) this.swap = { phase: 'out', t0: this.now(), p0: 0 }; }
    else if (this.swap.phase === 'in' && v !== this.vid) this.swap = { phase: 'out', t0: this.now(), p0: 1 - this.sv };
  }
  setOS(os: OS) {
    if (os === this.os) return;
    this.os = os;
    void loadVariant(this.vid).then((f) => { if (!this.dead) { this.rebuild(this.vid, f(this)); this.readColors(); } });
  }
  private updateSwap(t: number) {
    const S = this.swap;
    if (!S) return;
    const R = this.reduced;
    if (S.phase === 'out') {
      const p = clamp((t - S.t0) / (R ? R_OUT : timing.swapOut) + S.p0);
      this.sv = 1 - p;
      if (p < 1) return;
      if (this.pendingId !== this.wantV) {
        const want = (this.pendingId = this.wantV);
        this.nextImpl = null; this.loadingSince = t; this.loadingShown = false;
        void loadVariant(want).then((f) => {
          if (this.dead || this.pendingId !== want) return;
          this.nextImpl = f(this);
          if (this.loadingShown) this.opts.onLoading?.(null);
        });
      }
      if (!this.nextImpl) {
        // Hold sunk until the chunk arrives; after a beat, show the incoming variant's poster.
        if (!this.loadingShown && t - this.loadingSince > 120) { this.loadingShown = true; this.opts.onLoading?.(this.pendingId); }
        return;
      }
      this.keys.forEach((k) => this.releaseKey(k));
      this.ripples = [];
      this.rebuild(this.pendingId!, this.nextImpl);
      this.nextImpl = null; this.pendingId = null;
      this.readColors();
      S.phase = 'in'; S.t0 = t; this.sv = 0;
      if (R) this.keys.forEach((k) => { k.started = true; k.cap.visible = true; });
      else { this.entering = true; this.entShort = true; this.t0 = t; this.setEntryDelays(true); this.keys.forEach((k) => { k.started = false; k.cap.visible = false; }); }
    } else {
      const p = clamp((t - S.t0) / (R ? R_IN : timing.swapIn));
      this.sv = R ? p : clamp((t - S.t0) / 200);
      if (p >= 1) { this.swap = null; this.sv = 1; this.entering = false; if (this.wantV !== this.vid) this.setVariant(this.wantV); }
    }
  }
  private pendingId: VariantId | null = null;
  private loadingSince = 0;
  private loadingShown = false;

  /** ⌘↵ v1 transition: Enter press + pulse, camera ease toward the playground view. */
  enterPlayground(): Promise<void> {
    return new Promise((resolve) => {
      if (this.toPlay) return resolve();
      if (!this.visible || this.reduced || document.hidden) return resolve();
      const ent = this.byCode.Enter;
      if (ent) {
        this.pressKey(ent);
        setTimeout(() => this.releaseKey(ent), 140);
        this.ripples.push({ x: ent.cx, z: ent.cz, t0: this.now(), s: 1.3, fall: 9 });
      }
      this.stopAutoplay();
      this.toPlay = { t0: this.now(), resolve };
    });
  }

  /* ---------- loop ---------- */
  private resize() {
    const host = this.opts.container;
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    this.cw = w; this.ch = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.applyCam(this.camP);
    this.shadowDirty = true;
  }
  private applyCam(p: Cam) {
    const c = this.camera, ce = Math.cos(p.el);
    c.position.set(p.tx + p.dist * ce * Math.sin(p.az), p.ty + p.dist * Math.sin(p.el), p.tz + p.dist * ce * Math.cos(p.az));
    c.lookAt(p.tx, p.ty, p.tz);
    c.setViewOffset(this.cw, this.ch, p.ox * this.cw, p.oy * this.ch, this.cw, this.ch);
    c.updateProjectionMatrix();
  }
  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.visible || document.hidden) { this.last = 0; return; }
    const t = this.now();
    if (this.last) {
      // Adaptive DPR: drop resolution when frames run long (avg > 22ms), never above 2.
      this.frameAvg = this.frameAvg * 0.95 + (t - this.last) * 0.05;
      if (this.frameAvg > 22 && this.dpr > 1) { this.dpr = Math.max(1, this.dpr - 0.25); this.renderer.setPixelRatio(this.dpr); this.resize(); this.frameAvg = 16; }
    }
    this.tick(t);
    this.render();
  };
  private render() {
    if (this.shadowDirty) { this.renderer.shadowMap.needsUpdate = true; this.shadowDirty = false; }
    this.renderer.render(this.scene, this.camera);
  }

  private applyFade() {
    const kf = this.sv, bf = this.sv * this.caseOp, on = kf < 0.999 || bf < 0.999;
    if (on !== this.fadeOn) {
      this.fadeOn = on;
      [...this.bodyMats, ...this.keyMats].forEach((m) => { m.transparent = on || !!m.userData.t0; m.needsUpdate = true; });
    }
    if (on || this.fadeDirty) {
      this.bodyMats.forEach((m) => (m.opacity = m.userData.o0 * bf));
      this.keyMats.forEach((m) => (m.opacity = m.userData.o0 * kf));
      this.keys.forEach((k) => (k.lmat.opacity = kf));
      this.fadeDirty = on;
    }
    this.bodyG.visible = bf > 0.01;
  }
  private fadeOn: boolean | null = null;
  private fadeDirty = false;

  tick(t: number, noAutoplay = false) {
    const dt = this.last ? Math.min(0.05, Math.max(0, (t - this.last) / 1000)) : 0.016;
    this.last = t;
    const R = this.reduced, cfg = this.V.cfg, v = this.vid, st = this.input.getState();
    let moving = false;
    if (this.entering) {
      const el = t - this.t0, sh = this.entShort;
      if (!sh) this.caseOp = clamp(el / 320);
      this.keys.forEach((k) => {
        if (!k.started && el >= k.delay) { k.started = true; k.cap.visible = true; k.y = sh ? 0.6 : 1.1; k.v = 0; k.dropping = true; }
        if (k.dropping && el > k.delay + (sh ? 380 : 650)) k.dropping = false;
      });
      this.sweepX = !sh && this.lightSweep && el > 820 ? lerp(-10, 10, clamp((el - 820) / 420)) : null;
      if (el > (sh ? 820 : 1300)) { this.entering = false; this.sweepX = null; this.caseOp = 1; this.keys.forEach((k) => { k.started = true; k.cap.visible = true; }); }
      moving = true;
    }
    this.updateSwap(t);
    if (this.swap) moving = true;
    if (!noAutoplay && !this.isStill) this.runAutoplay(t);

    if (!this.toPlay) {
      const a = R ? 1 : 1 - Math.exp(-dt / 0.18);
      const prevY = this.board.rotation.y;
      this.px += ((R ? 0 : this.ptx) - this.px) * a; this.py += ((R ? 0 : this.pty) - this.py) * a;
      const sway = R || this.isStill ? 0 : Math.sin((t / 7000) * Math.PI * 2) * 0.014;
      this.board.rotation.y = BASE_RY + this.px * 0.05 + sway;
      this.board.rotation.x = this.py * 0.03 + (R || this.isStill ? 0 : Math.sin((t / 9000) * Math.PI * 2) * 0.004);
      if (Math.abs(this.board.rotation.y - prevY) > 1e-4) moving = true;
    } else {
      const el = t - this.toPlay.t0, ct = eio(clamp((el - 150) / 600));
      for (const n of Object.keys(CAM_BOARD) as (keyof Cam)[]) this.camP[n] = lerp(CAM_BOARD[n], CAM_PLAY[n], ct);
      this.applyCam(this.camP);
      this.board.rotation.y = lerp(BASE_RY, 0, ct);
      moving = true;
      if (el > 750) { const r = this.toPlay.resolve; this.toPlay = null; r(); }
    }
    const S = this.swap, sv = this.sv;
    const sink = S && !R ? (S.phase === 'out' ? -1.25 * eio(1 - sv) : -0.45 * (1 - eout(sv))) : 0;
    this.vg.position.set(cfg.pos[0], sink, cfg.pos[2] - this.kick * 0.06);

    let hov: RigKey | null = null;
    if (this.pointer && !S && !this.toPlay) {
      const r = this.canvas.getBoundingClientRect();
      this.ndc.set(((this.pointer.x - r.left) / r.width) * 2 - 1, -((this.pointer.y - r.top) / r.height) * 2 + 1);
      this.raycaster.setFromCamera(this.ndc, this.camera);
      const hit = this.raycaster.intersectObjects(this.capMeshes, false)[0];
      hov = hit ? (hit.object.userData.k as RigKey) : null;
    }
    if (hov !== this.hoverKey) { this.hoverKey = hov; this.canvas.style.cursor = hov ? 'pointer' : 'default'; }

    const modA = st.modHeld && !this.toPlay, chA = st.chordUntil > t && !this.toPlay;
    const la = 1 - Math.exp(-dt / 0.09), C = this.C;
    this.ripples = this.ripples.filter((rp) => t - rp.t0 < 2400);
    if (this.ripples.length) moving = true;
    const breath = 0.22 + 0.16 * Math.sin((t / timing.breathPeriod) * Math.PI * 2);
    const sub = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / sub;
    const mods = modCodes(this.os), trav = cfg.travel;
    const glowF = this.glowK * cfg.glow * sv * this.caseOp;
    for (const k of this.keys) {
      const isMod = !!k.code && mods.includes(k.code);
      const litT = (modA && !!k.code && MOD_LIT_CODES.includes(k.code)) || (modA && isMod && k.down) || (chA && !!k.code && CHORD_LIT_CODES.includes(k.code)) ? 1 : 0;
      const dimT = (modA || chA) && !litT && !(isMod && modA) ? 1 : 0;
      k.lit += (litT - k.lit) * la; k.dim += (dimT - k.dim) * la;
      let tgt = 0;
      if (!R) { if (k.down) tgt = k.ghost ? -trav * 0.7 : -trav; else tgt = k.lit * cfg.lift - k.dim * 0.03 + (k === hov ? 0.035 : 0); }
      let K: number, D: number;
      if (k.dropping) { K = spring.settle.k; D = spring.settle.c; }
      else if (k.down) { K = cfg.press.k; D = cfg.press.c; }
      else if (t - k.relT < 450) { K = cfg.release.k; D = cfg.release.c; }
      else { K = spring.reveal.k; D = spring.reveal.c; }
      if (R) { k.y = tgt; k.v = 0; }
      else if (k.started) for (let s = 0; s < sub; s++) { const acc = -K * (k.y - tgt) - D * k.v; k.v += acc * h; k.y += k.v * h; }
      if (Math.abs(k.v) > 1e-3) moving = true;
      if (!k.down) k.self *= Math.exp(-dt / 0.5);
      k.flash *= Math.exp(-dt / 0.28);
      let gl = k.self;
      for (const rp of this.ripples) {
        const d = Math.hypot(k.cx - rp.x, k.cz - rp.z); if (d < 0.2) continue;
        const lt = t - rp.t0 - d * timing.rippleStep; if (lt <= 0) continue;
        gl += rp.s * Math.exp(-d / rp.fall) * Math.exp(-lt / timing.rippleDecay) * Math.min(1, lt / 40);
      }
      if (k.code === 'Enter' && !modA && !chA && !R) gl = Math.max(gl, breath);
      gl = Math.min(1, gl);
      const sw = this.sweepX == null ? 0 : Math.exp(-Math.pow((k.cx - this.sweepX) / 1.2, 2));
      this.tmpC.copy(k.c0).lerp(C.acc, k.lit).multiplyScalar(1 - this.dimK * k.dim);
      k.mat.color.copy(this.tmpC);
      if (v === '8bt') k.mat.emissive.copy(k.lit > 0.02 ? C.acc : k.c0).multiplyScalar(gl * 1.1 * this.emisK + (this.dark ? 0.07 : 0) + k.lit * 0.2).addScalar(sw * 0.05);
      else k.mat.emissive.copy(C.accent).multiplyScalar(gl * this.emisK * (k.kind === 'accent' ? 0.5 : 1) * (v === 'tik' ? 0.4 : 1)).addScalar(sw * 0.06);
      if (v === 'tik') {
        const bl = this.dark ? Math.min(1, gl * 1.25) : gl * 0.45;
        this.tmpC2.copy(k.l0).lerp(C.legAcc, k.lit).lerp(this.dark ? C.accent : C.accentText, bl * (1 - k.lit)).lerp(k.c0, k.dim * 0.35);
        if (this.dark) this.tmpC2.multiplyScalar(1 + bl * 0.5);
      } else this.tmpC2.copy(k.l0).lerp(C.legAcc, k.lit).lerp(C.accentText, Math.min(1, k.flash * 0.75 + sw * 0.6) * (1 - k.lit) * (k.kind === 'accent' ? 0 : 1)).lerp(k.c0, k.dim * 0.35);
      k.lmat.color.copy(this.tmpC2);
      k.gmat.opacity = gl * glowF;
      k.cap.position.set(k.cx, k.by + k.y, k.cz);
      if (cfg.squash && !R) { const q = clamp(-k.y / trav, -1, 1.2); k.cap.scale.set(1 + 0.1 * q, 1 - 0.26 * q, 1 + 0.1 * q); }
      if (k.labelEl) {
        const show = this.toPlay ? 0 : k.lit * sv;
        if (show > 0.02) { const p = this.screenOf(k, 0.55); k.labelEl.style.opacity = show.toFixed(3); k.labelEl.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-100%) translateY(${((1 - show) * 8).toFixed(1)}px)`; }
        else if (k.labelEl.style.opacity !== '0') k.labelEl.style.opacity = '0';
      }
    }
    this.V.update?.(t, dt);
    this.contactMat.opacity = this.contactOp * this.caseOp * sv;
    const cs = 0.55 + 0.45 * sv;
    this.contact.scale.x = ((cfg.foot[0] * cfg.fit + 4.4) / 21) * cs; this.contact.scale.y = ((cfg.foot[1] * cfg.fit + 3.7) / 10.5) * cs;
    this.applyFade();
    this.sheenMat.opacity = this.sheenBase * this.caseOp * sv;
    this.sheenTex.offset.x = clamp(-(this.board.rotation.y - BASE_RY) * 11, -0.9, 0.9);
    if (!this.toPlay && cfg.trail === 'dom') { const p = this.vgToScreen(0.6, 2.4, this.minZ - 1.5); this.trail.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-50%)`; this.trail.style.opacity = String(sv); }
    else this.trail.style.opacity = '0';
    if (moving) this.shadowDirty = true;
  }
  /** Bullet body kick (set by the variant). */
  kick = 0;

  dispose() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.off.forEach((f) => f());
    this.off = [];
    this.V?.dispose?.();
    if (this.vg) this.disposeGroup(this.vg);
    this.scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose(); });
    [this.glowTex, this.dishTex, this.sheenTex, this.padTex, this.atlas, this.scene.environment].forEach((t) => t?.dispose());
    this.keyLight.shadow.map?.dispose();
    this.renderer.dispose();
    this.canvas.remove();
    this.overlay.remove();
  }
}
