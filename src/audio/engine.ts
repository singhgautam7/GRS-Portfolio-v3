import { audio as audioTokens } from '@/lib/tokens';
import type { VariantId } from '@/features/keyboards/variants';
import { SETS, roundRobin } from './sets';
import type { KeyInfo, SoundEvent, Synth } from './sets';

/**
 * One shared AudioContext, created/resumed only from a real user gesture while unmuted. Every
 * sound is a "voice" (its scheduled nodes); voices are capped per event and overall, dropping the
 * oldest first, so fast typing never piles up.
 */

export const MAX_VOICES = 24;
export const MAX_PER_EVENT = 6;

interface Voice {
  ev: SoundEvent;
  end: number;
  nodes: AudioScheduledSourceNode[];
}

export class AudioEngine {
  muted = true;
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private voices: Voice[] = [];
  private rr = 0;

  constructor(private readonly createContext: () => AudioContext | null) {}

  get context() {
    return this.ctx;
  }
  get voiceCount() {
    return this.voices.length;
  }

  /** Call only inside a real user gesture (click on unmute, a real key or pointer press). */
  unlock() {
    if (this.muted) return;
    if (!this.ctx) {
      const c = this.createContext();
      if (!c) return;
      this.ctx = c;
      const n = c.sampleRate * 0.5;
      this.noise = c.createBuffer(1, n, c.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.out = c.createGain();
      this.out.gain.value = audioTokens.master;
      this.out.connect(c.createDynamicsCompressor()).connect(c.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  suspend() {
    if (this.ctx?.state === 'running') void this.ctx.suspend();
  }
  resume() {
    if (!this.muted && this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  play(variant: VariantId, ev: SoundEvent, k: KeyInfo = { w: 1, row: 2 }) {
    const c = this.ctx;
    if (this.muted || !c || !this.out || !this.noise) return;
    const set = SETS[variant];
    const fn = set[ev] ?? ((ev === 'space' || ev === 'enter') && set.down);
    if (!fn) return;
    const now = c.currentTime;
    this.voices = this.voices.filter((v) => v.end > now);
    const same = this.voices.filter((v) => v.ev === ev);
    if (same.length >= MAX_PER_EVENT) this.drop(same[0]!);
    if (this.voices.length >= MAX_VOICES) this.drop(this.voices[0]!);

    const voice: Voice = { ev, end: now, nodes: [] };
    const out = this.out, noise = this.noise;
    const env = (g: GainNode, t: number, a: number, pk: number, dec: number) => {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(pk, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
    };
    const track = (n: AudioScheduledSourceNode, stop: number) => {
      voice.nodes.push(n);
      voice.end = Math.max(voice.end, stop);
    };
    const s: Synth = {
      N(t, type, f, q, pk, dec, f1) {
        const src = c.createBufferSource();
        src.buffer = noise;
        src.playbackRate.value = 0.8 + Math.random() * 0.4;
        const fl = c.createBiquadFilter();
        fl.type = type;
        fl.frequency.setValueAtTime(f, t);
        if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dec);
        fl.Q.value = q;
        const g = c.createGain();
        env(g, t, 0.001, pk, dec);
        src.connect(fl).connect(g).connect(out);
        src.start(t, Math.random() * 0.3);
        src.stop(t + dec + 0.05);
        track(src, t + dec + 0.05);
      },
      O(t, type, f0, f1, pk, dec, a) {
        const o = c.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(f0, t);
        if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dec);
        const g = c.createGain();
        env(g, t, a || 0.002, pk, dec);
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + dec + 0.05);
        track(o, t + dec + 0.05);
      },
      ARP(t, type, fs, step, pk, dec) {
        fs.forEach((f, i) => s.O(t + i * step, type, f, 0, pk, dec));
      },
    };
    fn(s, now + 0.002, roundRobin(this.rr++, Math.random()), k);
    this.voices.push(voice);
  }

  private drop(v: Voice) {
    v.nodes.forEach((n) => {
      try {
        n.stop();
        n.disconnect();
      } catch {
        /* already stopped */
      }
    });
    this.voices = this.voices.filter((x) => x !== v);
  }
}
