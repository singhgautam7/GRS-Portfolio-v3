/**
 * Typed mirror of the motion tokens in src/styles/tokens.css, for JS that cannot read CSS
 * (springs in the 3D loop, Motion transitions, timers). tokens.test.ts fails if these drift
 * from the CSS. Colours are never mirrored here: 3D and canvas code read computed CSS variables.
 */

/** Durations in ms (--dur-*). */
export const dur = { instant: 70, fast: 140, base: 220, slow: 380, xslow: 900 } as const;

/** Cubic-bezier control points (--ease-*), in the array form Motion accepts. */
export const ease = {
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
  press: [0.2, 0.9, 0.3, 1],
  spring: [0.34, 1.56, 0.64, 1],
} as const;

/** Spring stiffness k and damping c (--spring-*-k / -c). */
export const spring = {
  press: { k: 2400, c: 98 },
  release: { k: 900, c: 40 },
  settle: { k: 460, c: 22 },
  reveal: { k: 320, c: 26 },
} as const;

/** Keyboard choreography timings in ms. */
export const timing = {
  staggerKey: 24,
  staggerRow: 55,
  rippleStep: 30,
  rippleDecay: 500,
  trailLife: 1500,
  chordTimeout: 1500,
  idleDelay: 4000,
  breathPeriod: 3200,
  swapOut: 240,
  swapIn: 440,
} as const;

/**
 * Audio levels. Design gap: tokens.css has no sound tokens; 0.5 is the master gain in the
 * design prototype (keyboard3d.js), feeding a DynamicsCompressor.
 */
export const audio = { master: 0.5 } as const;
