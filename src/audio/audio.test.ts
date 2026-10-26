import { describe, expect, test } from 'bun:test';
import { AudioEngine, MAX_PER_EVENT, MAX_VOICES } from './engine';
import { connectAudio } from './connect';
import { createInputLayer } from '@/input/layer';
import { DEFAULT_PREFS } from '@/features/keyboards/prefs';
import type { KbPrefs } from '@/features/keyboards/prefs';

/** Minimal AudioContext fake: counts started source nodes. */
function fakeContext() {
  const started: { stopped: boolean }[] = [];
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ connect: (n: unknown) => n, disconnect() {} });
  const source = () => {
    const s = { ...node(), stopped: false, start() { started.push(s); }, stop() { s.stopped = true; }, buffer: null, playbackRate: param(), frequency: param(), type: '' };
    return s;
  };
  const ctx = {
    state: 'running',
    sampleRate: 8000,
    currentTime: 0,
    destination: {},
    createBuffer: (_c: number, n: number) => ({ getChannelData: () => new Float32Array(n) }),
    createGain: () => ({ ...node(), gain: param() }),
    createDynamicsCompressor: () => node(),
    createBiquadFilter: () => ({ ...node(), type: '', frequency: param(), Q: param() }),
    createBufferSource: source,
    createOscillator: source,
    resume: async () => {},
    suspend: async () => {},
  };
  return { ctx: ctx as unknown as AudioContext, started };
}

function setup(initial: Partial<KbPrefs> = {}) {
  const fake = fakeContext();
  let created = 0;
  const engine = new AudioEngine(() => {
    created++;
    return fake.ctx;
  });
  let prefs: KbPrefs = { ...DEFAULT_PREFS, ...initial };
  const subs = new Set<() => void>();
  const store = { get: () => prefs, subscribe: (f: () => void) => (subs.add(f), () => subs.delete(f)) };
  const input = createInputLayer({ os: 'mac' });
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' as DocumentVisibilityState });
  connectAudio(input, store, engine, doc);
  const setPrefs = (p: Partial<KbPrefs>) => {
    prefs = { ...prefs, ...p };
    subs.forEach((f) => f());
  };
  return { engine, input, fake, setPrefs, created: () => created };
}

describe('audio', () => {
  test('unmuted by default: nothing plays before a gesture, gesture unlocks and plays', () => {
    const r = setup();
    expect(r.created()).toBe(0);
    r.engine.play('thk', 'down');
    expect(r.fake.started).toHaveLength(0);
    r.input.synthetic('KeyJ', 'j', true, 'pointer'); // the gesture
    expect(r.created()).toBe(1);
    expect(r.fake.started.length).toBeGreaterThan(0);
  });

  test('when muted: input makes no context and no sound', () => {
    const r = setup({ muted: true });
    r.input.synthetic('KeyJ', 'j', true, 'pointer');
    expect(r.created()).toBe(0);
    expect(r.fake.started).toHaveLength(0);
  });

  test('unmute (a click) unlocks and previews', () => {
    const r = setup({ muted: true });
    r.setPrefs({ muted: false });
    expect(r.created()).toBe(1);
    expect(r.fake.started.length).toBeGreaterThan(0);
  });

  test('ghost input stays silent', () => {
    const r = setup();
    r.setPrefs({ muted: false });
    const before = r.fake.started.length;
    r.input.synthetic('KeyH', 'h', true, 'ghost');
    r.input.synthetic('MetaLeft', 'Meta', true, 'ghost');
    expect(r.fake.started.length).toBe(before);
  });

  test('polyphony caps hold (per event and overall)', () => {
    const r = setup();
    r.setPrefs({ muted: false });
    for (let i = 0; i < 40; i++) r.engine.play('tik', 'down');
    expect(r.engine.voiceCount).toBeLessThanOrEqual(MAX_PER_EVENT + 1); // + the unmute preview
    for (let i = 0; i < 10; i++) for (const ev of ['up', 'space', 'enter', 'mod', 'fire', 'swap'] as const) r.engine.play('thk', ev);
    expect(r.engine.voiceCount).toBeLessThanOrEqual(MAX_VOICES);
  });

  test('re-muting silences immediately', () => {
    const r = setup();
    r.setPrefs({ muted: false });
    r.setPrefs({ muted: true });
    const before = r.fake.started.length;
    r.input.synthetic('KeyJ', 'j', true, 'pointer');
    expect(r.fake.started.length).toBe(before);
  });
});
