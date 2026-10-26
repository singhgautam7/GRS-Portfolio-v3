import type { VariantId } from '@/features/keyboards/variants';

/**
 * Per-keyboard sound sets, synthesised with Web Audio. Ported 1:1 from the design rig
 * (specs/design/.../keyboard3d.js, AUDIO.SETS): same oscillators, filters, envelopes, pitches.
 * N = filtered noise burst, O = oscillator sweep, ARP = oscillator arpeggio. `j` is the
 * round-robin pitch factor; `k` carries the key's width and row.
 */

export type SoundEvent = 'down' | 'up' | 'space' | 'enter' | 'mod' | 'fire' | 'swap' | 'joy' | 'oneup' | 'hiscore';

export interface Synth {
  N(t: number, type: BiquadFilterType, f: number, q: number, pk: number, dec: number, f1?: number): void;
  O(t: number, type: OscillatorType, f0: number, f1: number, pk: number, dec: number, a?: number): void;
  ARP(t: number, type: OscillatorType, fs: number[], step: number, pk: number, dec: number): void;
}

export interface KeyInfo {
  w: number;
  row: number;
}

type SoundFn = (s: Synth, t: number, j: number, k: KeyInfo) => void;
export type SoundSet = Partial<Record<SoundEvent, SoundFn>>;

const ROWF = [1046.5, 880, 783.99, 659.25, 587.33, 523.25];

export const SETS: Record<VariantId, SoundSet> = {
  thk: {
    down: (s, t, j, k) => {
      const b = k.w >= 2;
      s.N(t, 'bandpass', (b ? 1100 : 1700) * j, 1.2, 0.3, 0.045);
      s.O(t, 'sine', (b ? 120 : 170) * j, b ? 70 : 95, 0.26, 0.07);
      s.N(t + 0.004, 'highpass', 5200, 0.7, 0.05, 0.02);
    },
    up: (s, t, j) => s.N(t, 'bandpass', 2400 * j, 1.5, 0.1, 0.03),
    space: (s, t, j) => {
      s.N(t, 'bandpass', 900 * j, 1, 0.3, 0.06);
      s.O(t, 'sine', 110 * j, 65, 0.28, 0.09);
      s.N(t + 0.012, 'bandpass', 3000, 2, 0.05, 0.05);
    },
    enter: (s, t, j) => {
      s.N(t, 'bandpass', 1100 * j, 1.1, 0.32, 0.05);
      s.O(t, 'sine', 130 * j, 72, 0.3, 0.08);
      s.N(t + 0.006, 'highpass', 4800, 0.7, 0.06, 0.02);
    },
    mod: (s, t) => {
      s.O(t, 'sine', 220, 330, 0.05, 0.12);
      s.O(t + 0.05, 'sine', 330, 440, 0.035, 0.1);
    },
    fire: (s, t, j) => {
      s.O(t, 'triangle', 660 * j, 990, 0.06, 0.09);
      s.N(t, 'highpass', 4000, 0.7, 0.04, 0.02);
    },
    swap: (s, t) => {
      s.N(t, 'lowpass', 1400, 0.7, 0.16, 0.22, 300);
      s.O(t + 0.16, 'sine', 95, 58, 0.26, 0.16);
    },
  },
  tik: {
    down: (s, t, j) => {
      s.N(t, 'highpass', 3600 * j, 0.8, 0.14, 0.018);
      s.O(t, 'sine', 2600 * j, 1900, 0.035, 0.02);
    },
    space: (s, t, j) => {
      s.N(t, 'highpass', 2400 * j, 0.7, 0.16, 0.03);
      s.O(t, 'sine', 900 * j, 600, 0.04, 0.03);
    },
    enter: (s, t, j) => {
      s.N(t, 'highpass', 3000 * j, 0.7, 0.16, 0.025);
      s.O(t, 'sine', 1800 * j, 1400, 0.04, 0.03);
    },
    mod: (s, t) => s.O(t, 'sine', 1320, 1760, 0.03, 0.08),
    fire: (s, t, j) => {
      s.O(t, 'sine', 1760 * j, 2640, 0.05, 0.07);
      s.O(t + 0.04, 'sine', 2640, 0, 0.03, 0.09);
    },
    swap: (s, t) => {
      s.N(t, 'highpass', 3000, 0.5, 0.1, 0.12);
      s.O(t + 0.02, 'sine', 1200, 1800, 0.04, 0.1);
    },
  },
  clk: {
    down: (s, t, j) => {
      s.N(t, 'bandpass', 2600 * j, 2, 0.4, 0.05);
      s.O(t, 'triangle', 340 * j, 160, 0.15, 0.05);
      s.N(t + 0.028, 'bandpass', 1800 * j, 2, 0.1, 0.03);
    },
    up: (s, t) => s.N(t, 'bandpass', 3200, 2, 0.05, 0.02),
    space: (s, t, j) => {
      s.N(t, 'bandpass', 1400 * j, 1.5, 0.28, 0.05);
      s.O(t, 'triangle', 200 * j, 120, 0.13, 0.06);
    },
    // carriage return + bell
    enter: (s, t) => {
      s.N(t, 'bandpass', 900, 3, 0.18, 0.34, 2600);
      s.O(t + 0.1, 'sine', 2093, 0, 0.16, 0.9, 0.003);
      s.O(t + 0.1, 'sine', 3136, 0, 0.06, 0.6, 0.003);
    },
    mod: (s, t) => [0, 0.03, 0.06].forEach((d) => s.N(t + d, 'bandpass', 3800, 4, 0.07, 0.02)),
    fire: (s, t, j) => {
      s.N(t, 'bandpass', 2400 * j, 2, 0.3, 0.04);
      s.O(t + 0.03, 'sine', 2637, 0, 0.07, 0.4, 0.003);
    },
    swap: (s, t) => {
      s.N(t, 'bandpass', 700, 3, 0.14, 0.3, 2200);
      s.O(t + 0.26, 'sine', 2093, 0, 0.1, 0.6, 0.003);
    },
  },
  pop: {
    down: (s, t, j) => s.O(t, 'sine', 260 * j, 900 * j, 0.24, 0.07, 0.004),
    up: (s, t, j) => s.O(t, 'sine', 700 * j, 1100 * j, 0.05, 0.03, 0.003),
    space: (s, t, j) => s.O(t, 'sine', 180 * j, 600 * j, 0.26, 0.1, 0.005),
    enter: (s, t, j) => {
      s.O(t, 'sine', 240 * j, 820, 0.22, 0.07, 0.004);
      s.O(t + 0.07, 'sine', 320 * j, 1100, 0.18, 0.07, 0.004);
    },
    mod: (s, t) => {
      s.O(t, 'sine', 400, 700, 0.07, 0.14, 0.01);
      s.O(t + 0.06, 'sine', 600, 900, 0.05, 0.1, 0.01);
    },
    fire: (s, t) => {
      s.O(t, 'sine', 520, 1040, 0.11, 0.08, 0.004);
      s.O(t + 0.03, 'sine', 660, 1320, 0.09, 0.08, 0.004);
    },
    swap: (s, t) => s.O(t, 'sine', 900, 200, 0.18, 0.22, 0.005),
  },
  pew: {
    down: (s, t, j) => {
      s.O(t, 'sawtooth', 1900 * j, 160, 0.085, 0.13);
      s.N(t, 'highpass', 2000, 0.6, 0.12, 0.04);
    },
    up: (s, t) => s.N(t, 'bandpass', 1200, 1, 0.04, 0.02),
    space: (s, t, j) => {
      s.O(t, 'sawtooth', 1300 * j, 110, 0.09, 0.18);
      s.N(t, 'highpass', 1500, 0.6, 0.13, 0.05);
    },
    // three-shot burst at 0 / 95 / 190 ms
    enter: (s, t, j) =>
      [0, 0.095, 0.19].forEach((d, i) => {
        s.O(t + d, 'sawtooth', (1900 - i * 140) * j, 160, 0.08, 0.12);
        s.N(t + d, 'highpass', 2000, 0.6, 0.1, 0.035);
      }),
    mod: (s, t) => s.O(t, 'triangle', 200, 800, 0.05, 0.25, 0.02),
    fire: (s, t, j) => s.O(t, 'triangle', 2400 * j, 600, 0.07, 0.1),
    swap: (s, t) => {
      s.O(t, 'sawtooth', 150, 900, 0.04, 0.22, 0.02);
      s.O(t + 0.24, 'sawtooth', 900, 150, 0.035, 0.18);
    },
  },
  '8bt': {
    // per-row pitch
    down: (s, t, j, k) => {
      const f = ROWF[Math.min(5, k.row)]! * (j > 1.02 ? 1.122 : j < 0.97 ? 0.891 : 1);
      s.O(t, 'square', f, 0, 0.05, 0.07);
      s.O(t + 0.03, 'square', f * 1.5, 0, 0.025, 0.03);
    },
    space: (s, t) => {
      s.N(t, 'highpass', 1000, 0.5, 0.08, 0.05);
      s.O(t, 'square', 220, 0, 0.04, 0.06);
    },
    enter: (s, t) => s.ARP(t, 'square', [523.25, 659.25, 783.99, 1046.5], 0.05, 0.05, 0.06),
    mod: (s, t) => {
      s.O(t, 'square', 392, 0, 0.04, 0.05);
      s.O(t + 0.06, 'square', 523.25, 0, 0.04, 0.06);
    },
    fire: (s, t) => {
      s.O(t, 'square', 987.77, 0, 0.05, 0.07);
      s.O(t + 0.07, 'square', 1318.5, 0, 0.05, 0.25);
    },
    swap: (s, t) => s.O(t, 'square', 200, 1200, 0.04, 0.2),
    joy: (s, t) => s.O(t, 'triangle', 330, 0, 0.04, 0.03),
    oneup: (s, t) => s.ARP(t, 'square', [659.25, 783.99, 1318.5, 1046.5, 1174.66, 1567.98], 0.07, 0.05, 0.09),
    hiscore: (s, t) => s.ARP(t, 'square', [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5], 0.06, 0.045, 0.08),
  },
};

/** 4-step round-robin pitch from the design, plus ±1.5% random so fast typing never repeats. */
const RR = [1, 1.045, 0.955, 1.02];
export const roundRobin = (i: number, rand: number) => RR[i % 4]! * (1 + (rand - 0.5) * 0.03);
