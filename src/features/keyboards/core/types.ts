import type * as THREE from 'three';
import type { LayoutKey } from './layouts';
import type { KeyboardRig } from './rig';

/** Per-variant rig config (design VCFG + motion spec 7c). Distances in key units (u). */
export interface VariantCfg {
  /** Press travel (u). */
  travel: number;
  /** Under-key bloom factor. */
  glow: number;
  /** Press spring (k, c); release spring; Bubble uses a bouncy release. */
  press: { k: number; c: number };
  release: { k: number; c: number };
  /** Where typed characters appear: the shared DOM trail, the paper, the marquee or the screen. */
  trail: 'dom' | 'paper' | 'marquee' | 'screen';
  fit: number;
  kx: number;
  kz: number;
  pos: [number, number, number];
  foot: [number, number];
  /** Lift of live (highlighted) keys (u). */
  lift: number;
  /** Squash-and-stretch on press (Bubble). */
  squash?: boolean;
}

export interface CapParts {
  grp: THREE.Group;
  body: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  top: { w: number; d: number };
  hTop: number;
  lz: number;
  dish: boolean;
}

export interface RigKey extends LayoutKey {
  i: number;
  h: number;
  pitch: number;
  by: number;
  cap: THREE.Group;
  body: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  lmat: THREE.MeshBasicMaterial;
  gmat: THREE.MeshBasicMaterial;
  hTop: number;
  started: boolean;
  dropping: boolean;
  delay: number;
  y: number;
  v: number;
  lit: number;
  dim: number;
  self: number;
  flash: number;
  down: boolean;
  ghost: boolean;
  relT: number;
  ctok: string;
  c0: THREE.Color;
  l0: THREE.Color;
  dE: number;
  labelEl?: HTMLDivElement;
}

/** The typed contract every keyboard variant module implements. */
export interface VariantImpl {
  cfg: VariantCfg;
  /** Body geometry; returns the front face used for the drifting sheen. */
  body(g: THREE.Group): { front: { w: number; h: number; y: number; z: number } };
  profile(k: LayoutKey): { h: number; pitch: number; by: number };
  makeCap(k: RigKey & { h: number }): CapParts;
  /** Legend style. */
  legend: { round: boolean; pixel: boolean; primer: boolean; font: 'mono' | 'pixel' };
  /** Built after keys exist (e.g. the Esc guard). */
  afterKeys?(): void;
  feedback?(k: RigKey, ghost: boolean): void;
  update?(t: number, dt: number): void;
  /** Typed output when cfg.trail is not 'dom'. */
  print?(ch: string, ghost: boolean): void;
  colors?(): void;
  egg?(egg: 'konami' | 'highscore'): void;
  /** Glow-plane height for a key (Typewriter keys sit on a slope). */
  glowY?(k: RigKey): number;
  dispose?(): void;
}

export type VariantFactory = (rig: KeyboardRig) => VariantImpl;
