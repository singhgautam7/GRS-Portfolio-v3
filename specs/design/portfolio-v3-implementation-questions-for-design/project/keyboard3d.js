/* <hero-keyboard> — three.js keyboard for the singhgautam.com v3 hero. Six variants share one rig (staging, camera, logic).
   Attributes: ab (id), theme, os (auto|mac|windows|linux), variant (thk|tik|clk|pop|pew|8bt), muted (true|false, default true),
   reduced (auto|true), autoplay (true|false), still (rest|mod|press|chord|sink:0..1|rise:0..1) → renders ONE frame into an <img>
   through a shared renderer (for spec boards; no live WebGL context per frame).
   Colours/materials come from tokens.css: the element gets data-kb="<variant>" so [data-kb] blocks re-skin the --kb-* tokens.
   Emits window 'hero-kb' CustomEvents: {ab, type: real|palette|shortcuts|escape|nav|playground-start|playground|playground-exit|board|egg}. */
(() => {
if (customElements.get('hero-keyboard')) return;
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
let threeP; const loadThree = () => threeP || (threeP = import(THREE_URL));

const ROW_Z = [-2.625, -1.375, -0.375, 0.625, 1.625, 2.625];
const ROW_PROFILE = [[0.5, 0.16], [0.5, 0.12], [0.47, 0.05], [0.45, 0], [0.47, -0.08], [0.47, -0.11]];
const CROW_Z = [-2.2, -1.1, 0, 1.1, 2.2];
const LABELS = { KeyK: 'Search', Enter: 'Playground', Slash: 'Shortcuts', KeyG: 'Go to…', KeyA: 'About', KeyE: 'Experience', KeyP: 'Projects', KeyW: 'Writing', KeyC: 'Contact' };
const MOD_LIT = ['KeyK', 'Enter', 'Slash'];
const CHORD_LIT = ['KeyG', 'KeyA', 'KeyE', 'KeyP', 'KeyW', 'KeyC'];
const NAV = { KeyA: 'about', KeyE: 'experience', KeyP: 'projects', KeyW: 'writing', KeyC: 'contact' };
const SHIFT = { Backquote: ['~', '`'], Digit1: ['!', '1'], Digit2: ['@', '2'], Digit3: ['#', '3'], Digit4: ['$', '4'], Digit5: ['%', '5'], Digit6: ['^', '6'], Digit7: ['&', '7'], Digit8: ['*', '8'], Digit9: ['(', '9'], Digit0: [')', '0'], Minus: ['_', '-'], Equal: ['+', '='], BracketLeft: ['{', '['], BracketRight: ['}', ']'], Semicolon: [':', ';'], Quote: ['"', "'"], Comma: ['<', ','], Period: ['>', '.'], Slash: ['?', '/'] };
const GHOST = [[0, 'd', 'KeyH'], [110, 'u', 'KeyH'], [190, 'd', 'KeyE'], [290, 'u', 'KeyE'], [370, 'd', 'KeyL'], [460, 'u', 'KeyL'], [540, 'd', 'KeyL'], [630, 'u', 'KeyL'], [720, 'd', 'KeyO'], [840, 'u', 'KeyO'], [1700, 'md'], [3900, 'mu'], [4500, 'end']];
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
const CAM_BOARD = { el: 0.68, az: 0, dist: 49, tx: 0, ty: 0.3, tz: 0.4, ox: -0.27, oy: -0.01 };
const CAM_PLAY = { el: 0.6155, az: 0.785, dist: 50, tx: 0, ty: 0, tz: 0, ox: 0, oy: 0.05 };
const BASE_RY = -0.3;
const OUT_MS = 240, IN_MS = 440, R_OUT = 140, R_IN = 180;
const PRE_LINE = 'Gautam Rajeev Singh — software engineer';
/* per-variant rig config: layout, press travel (u), bloom factor, trail surface, fit scale, key offsets, body offset, footprint */
const VCFG = {
  thk: { lay: 'full', travel: .13, glow: 1, trail: 'dom', fit: 1, kx: 0, kz: 0, pos: [0, 0, 0], foot: [16.6, 6.8] },
  tik: { lay: 'full', travel: .065, glow: 0, trail: 'dom', fit: .8, kx: 0, kz: -1.9, pos: [0, 0, .3], foot: [19.4, 11.6] },
  clk: { lay: 'compact', travel: .24, glow: .3, trail: 'paper', fit: .86, kx: 0, kz: .7, pos: [0, 0, .55], foot: [16.4, 9.8] },
  pop: { lay: 'full', travel: .12, glow: .8, trail: 'dom', fit: .94, kx: 0, kz: 0, pos: [0, 0, 0], foot: [17.2, 7.6] },
  pew: { lay: 'full', travel: .18, glow: .4, trail: 'dom', fit: .9, kx: 0, kz: 0, pos: [0, 0, 0], foot: [18.6, 8] },
  '8bt': { lay: 'compact', travel: .08, glow: 1, trail: 'marquee', fit: .9, kx: 1.5, kz: .45, pos: [0, 0, .45], foot: [17.6, 9.4] },
};

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eout = t => 1 - Math.pow(1 - t, 3);
function detectOS() { const p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || ''; return /mac|iphone|ipad/i.test(p) ? 'mac' : /win/i.test(p) ? 'windows' : 'linux'; }

const A = (code, o) => Object.assign({ code, kind: 'alpha', w: 1 }, o);
const M = (code, label, o) => Object.assign({ code, label, kind: 'mod', w: 1 }, o);
const L = c => A('Key' + c, { main: c });
const S = c => A(c, { top: SHIFT[c][0], main: SHIFT[c][1] });

function layoutFull(os) {
  const mac = os === 'mac';
  const r0 = [M('Escape', 'esc', { kind: 'accent' })];
  for (let n = 1; n <= 12; n++) r0.push(M('F' + n, 'F' + n, { fkey: true, gap: (n === 1 || n === 5 || n === 9) ? 0.25 : 0 }));
  r0.push(M('PrintScreen', mac ? 'F13' : 'prt sc', { gap: 0.25 }), M('Delete', 'del'));
  const r1 = ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'].map(S);
  r1.push(M('Backspace', mac ? 'delete' : 'backspace', { w: 2 }), M('Home', 'home'));
  const r2 = [M('Tab', 'tab', { w: 1.5 }), ...'QWERTYUIOP'.split('').map(L), S('BracketLeft'), S('BracketRight'), A('Backslash', { top: '|', main: '\\', w: 1.5 }), M('PageUp', 'pg up')];
  const r3 = [M('CapsLock', 'caps lock', { w: 1.75 }), ...'ASDFGHJKL'.split('').map(L), S('Semicolon'), S('Quote'), M('Enter', mac ? 'return' : 'enter', { w: 2.25, kind: 'accent', sym: '↵' }), M('PageDown', 'pg dn')];
  const r4 = [M('ShiftLeft', 'shift', { w: 2.25, sym: '⇧' }), ...'ZXCVBNM'.split('').map(L), S('Comma'), S('Period'), S('Slash'), M('ShiftRight', 'shift', { w: 1.75, sym: '⇧' }), M('ArrowUp', '', { arrow: '↑' }), M('End', 'end')];
  const arrows = [M('ArrowLeft', '', { arrow: '←' }), M('ArrowDown', '', { arrow: '↓' }), M('ArrowRight', '', { arrow: '→' })];
  const sp = A('Space', { w: 6.25, main: '' });
  const r5 = mac
    ? [M('ControlLeft', 'control', { w: 1.25, sym: '⌃' }), M('AltLeft', 'option', { w: 1.25, sym: '⌥' }), M('MetaLeft', 'command', { w: 1.25, sym: '⌘' }), sp, M('MetaRight', 'cmd', { sym: '⌘' }), M('AltRight', 'opt', { sym: '⌥' }), M(null, 'fn'), ...arrows]
    : [M('ControlLeft', 'ctrl', { w: 1.25 }), M('MetaLeft', os === 'linux' ? 'super' : 'win', { w: 1.25 }), M('AltLeft', 'alt', { w: 1.25 }), sp, M('AltRight', 'alt'), M(null, 'fn'), M('ControlRight', 'ctrl'), ...arrows];
  const out = [];
  [r0, r1, r2, r3, r4, r5].forEach((row, ri) => { let x = 0; row.forEach(k => { x += k.gap || 0; k.row = ri; k.cx = x + k.w / 2 - 8; k.cz = ROW_Z[ri]; x += k.w; out.push(k); }); });
  return out;
}
/* typewriter / arcade: 5 rows, every key the shortcuts need, each row centred */
function layoutCompact(os) {
  const mac = os === 'mac', lin = os === 'linux';
  const rows = [
    [M('Escape', 'esc', { kind: 'accent' }), ...['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus'].map(S), M('Backspace', mac ? 'delete' : 'bksp', { w: 1.5 })],
    [M('Tab', 'tab', { w: 1.25 }), ...'QWERTYUIOP'.split('').map(L), S('BracketLeft')],
    [M('CapsLock', 'caps', { w: 1.5 }), ...'ASDFGHJKL'.split('').map(L), S('Semicolon'), M('Enter', mac ? 'return' : 'enter', { w: 1.75, kind: 'accent', sym: '↵' })],
    [M('ShiftLeft', 'shift', { w: 1.75, sym: '⇧' }), ...'ZXCVBNM'.split('').map(L), S('Comma'), S('Period'), S('Slash'), M('ShiftRight', 'shift', { w: 1.5, sym: '⇧' })],
    mac ? [M('ControlLeft', 'control', { w: 1.25, sym: '⌃' }), M('AltLeft', 'option', { w: 1.25, sym: '⌥' }), M('MetaLeft', 'command', { w: 1.5, sym: '⌘' }), A('Space', { w: 6, main: '' }), M('MetaRight', 'cmd', { w: 1.25, sym: '⌘' }), M('AltRight', 'opt', { w: 1.25, sym: '⌥' })]
      : [M('ControlLeft', 'ctrl', { w: 1.25 }), M('MetaLeft', lin ? 'super' : 'win', { w: 1.25 }), M('AltLeft', 'alt', { w: 1.25 }), A('Space', { w: 6, main: '' }), M('AltRight', 'alt', { w: 1.25 }), M('ControlRight', 'ctrl', { w: 1.25 })],
  ];
  const out = [];
  rows.forEach((row, ri) => { const tw = row.reduce((s, k) => s + k.w, 0); let x = -tw / 2; row.forEach(k => { k.row = ri; k.cx = x + k.w / 2; k.cz = CROW_Z[ri]; x += k.w; out.push(k); }); });
  return out;
}

function rrShape(T, w, d, r, Cls) {
  const s = new (Cls || T.Shape)(); const x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
function pillShape(T, w, d) { const s = new T.Shape(), r = d / 2, hx = Math.max(0, w / 2 - r); s.moveTo(-hx, -r); s.lineTo(hx, -r); s.absarc(hx, 0, r, -Math.PI / 2, Math.PI / 2, false); s.lineTo(-hx, r); s.absarc(-hx, 0, r, Math.PI / 2, Math.PI * 1.5, false); return s; }
function gradTex(T, size, stops) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.userData.keep = true; return t;
}
function bandTex(T, w, h, diag) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const gr = diag ? g.createLinearGradient(0, h, w, 0) : g.createLinearGradient(0, 0, w, 0);
  [[0, 0], [.4, 0], [.47, .35], [.5, 1], [.53, .35], [.6, 0], [1, 0]].forEach(([o, a]) => gr.addColorStop(o, `rgba(255,255,255,${a})`));
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (!diag) { const v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(.5, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = v; g.fillRect(0, 0, w, h); }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.userData.keep = true; return t;
}

/* ---------- sound: one synthesised set per variant, round-robin pitch, calm master ---------- */
const AUDIO = (() => {
  let ctx = null, nb = null, out = null, rr = 0;
  const ac = () => {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C();
      const n = ctx.sampleRate * 0.5; nb = ctx.createBuffer(1, n, ctx.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      out = ctx.createGain(); out.gain.value = 0.5; const comp = ctx.createDynamicsCompressor(); out.connect(comp).connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume(); return ctx;
  };
  const env = (g, t, a, pk, dec) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); };
  const N = (t, type, f, q, pk, dec, f1) => { const s = ctx.createBufferSource(); s.buffer = nb; s.playbackRate.value = 0.8 + Math.random() * 0.4; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dec); fl.Q.value = q; const g = ctx.createGain(); env(g, t, 0.001, pk, dec); s.connect(fl).connect(g).connect(out); s.start(t, Math.random() * 0.3); s.stop(t + dec + 0.05); };
  const O = (t, type, f0, f1, pk, dec, a) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dec); const g = ctx.createGain(); env(g, t, a || 0.002, pk, dec); o.connect(g).connect(out); o.start(t); o.stop(t + dec + 0.05); };
  const ARP = (t, type, fs, step, pk, dec) => fs.forEach((f, i) => O(t + i * step, type, f, 0, pk, dec));
  const ROWF = [1046.5, 880, 783.99, 659.25, 587.33, 523.25];
  const SETS = {
    thk: {
      down: (t, j, k) => { const b = k.w >= 2; N(t, 'bandpass', (b ? 1100 : 1700) * j, 1.2, .3, .045); O(t, 'sine', (b ? 120 : 170) * j, b ? 70 : 95, .26, .07); N(t + .004, 'highpass', 5200, .7, .05, .02); },
      up: (t, j) => N(t, 'bandpass', 2400 * j, 1.5, .1, .03),
      space: (t, j) => { N(t, 'bandpass', 900 * j, 1, .3, .06); O(t, 'sine', 110 * j, 65, .28, .09); N(t + .012, 'bandpass', 3000, 2, .05, .05); },
      enter: (t, j) => { N(t, 'bandpass', 1100 * j, 1.1, .32, .05); O(t, 'sine', 130 * j, 72, .3, .08); N(t + .006, 'highpass', 4800, .7, .06, .02); },
      mod: t => { O(t, 'sine', 220, 330, .05, .12); O(t + .05, 'sine', 330, 440, .035, .1); },
      fire: (t, j) => { O(t, 'triangle', 660 * j, 990, .06, .09); N(t, 'highpass', 4000, .7, .04, .02); },
      swap: t => { N(t, 'lowpass', 1400, .7, .16, .22, 300); O(t + .16, 'sine', 95, 58, .26, .16); },
    },
    tik: {
      down: (t, j) => { N(t, 'highpass', 3600 * j, .8, .14, .018); O(t, 'sine', 2600 * j, 1900, .035, .02); },
      up: () => {},
      space: (t, j) => { N(t, 'highpass', 2400 * j, .7, .16, .03); O(t, 'sine', 900 * j, 600, .04, .03); },
      enter: (t, j) => { N(t, 'highpass', 3000 * j, .7, .16, .025); O(t, 'sine', 1800 * j, 1400, .04, .03); },
      mod: t => O(t, 'sine', 1320, 1760, .03, .08),
      fire: (t, j) => { O(t, 'sine', 1760 * j, 2640, .05, .07); O(t + .04, 'sine', 2640, 0, .03, .09); },
      swap: t => { N(t, 'highpass', 3000, .5, .1, .12); O(t + .02, 'sine', 1200, 1800, .04, .1); },
    },
    clk: {
      down: (t, j) => { N(t, 'bandpass', 2600 * j, 2, .4, .05); O(t, 'triangle', 340 * j, 160, .15, .05); N(t + .028, 'bandpass', 1800 * j, 2, .1, .03); },
      up: (t) => N(t, 'bandpass', 3200, 2, .05, .02),
      space: (t, j) => { N(t, 'bandpass', 1400 * j, 1.5, .28, .05); O(t, 'triangle', 200 * j, 120, .13, .06); },
      enter: (t) => { N(t, 'bandpass', 900, 3, .18, .34, 2600); O(t + .1, 'sine', 2093, 0, .16, .9, .003); O(t + .1, 'sine', 3136, 0, .06, .6, .003); },
      mod: t => { [0, .03, .06].forEach(d => N(t + d, 'bandpass', 3800, 4, .07, .02)); },
      fire: (t, j) => { N(t, 'bandpass', 2400 * j, 2, .3, .04); O(t + .03, 'sine', 2637, 0, .07, .4, .003); },
      swap: t => { N(t, 'bandpass', 700, 3, .14, .3, 2200); O(t + .26, 'sine', 2093, 0, .1, .6, .003); },
    },
    pop: {
      down: (t, j) => O(t, 'sine', 260 * j, 900 * j, .24, .07, .004),
      up: (t, j) => O(t, 'sine', 700 * j, 1100 * j, .05, .03, .003),
      space: (t, j) => O(t, 'sine', 180 * j, 600 * j, .26, .1, .005),
      enter: (t, j) => { O(t, 'sine', 240 * j, 820, .22, .07, .004); O(t + .07, 'sine', 320 * j, 1100, .18, .07, .004); },
      mod: t => { O(t, 'sine', 400, 700, .07, .14, .01); O(t + .06, 'sine', 600, 900, .05, .1, .01); },
      fire: t => { O(t, 'sine', 520, 1040, .11, .08, .004); O(t + .03, 'sine', 660, 1320, .09, .08, .004); },
      swap: t => O(t, 'sine', 900, 200, .18, .22, .005),
    },
    pew: {
      down: (t, j) => { O(t, 'sawtooth', 1900 * j, 160, .085, .13); N(t, 'highpass', 2000, .6, .12, .04); },
      up: t => N(t, 'bandpass', 1200, 1, .04, .02),
      space: (t, j) => { O(t, 'sawtooth', 1300 * j, 110, .09, .18); N(t, 'highpass', 1500, .6, .13, .05); },
      enter: (t, j) => { [0, .095, .19].forEach((d, i) => { O(t + d, 'sawtooth', (1900 - i * 140) * j, 160, .08, .12); N(t + d, 'highpass', 2000, .6, .1, .035); }); },
      mod: t => O(t, 'triangle', 200, 800, .05, .25, .02),
      fire: (t, j) => O(t, 'triangle', 2400 * j, 600, .07, .1),
      swap: t => { O(t, 'sawtooth', 150, 900, .04, .22, .02); O(t + .24, 'sawtooth', 900, 150, .035, .18); },
    },
    '8bt': {
      down: (t, j, k) => { const f = ROWF[Math.min(5, k.row || 0)] * (j > 1.02 ? 1.122 : j < .97 ? .891 : 1); O(t, 'square', f, 0, .05, .07); O(t + .03, 'square', f * 1.5, 0, .025, .03); },
      up: () => {},
      space: t => { N(t, 'highpass', 1000, .5, .08, .05); O(t, 'square', 220, 0, .04, .06); },
      enter: t => ARP(t, 'square', [523.25, 659.25, 783.99, 1046.5], .05, .05, .06),
      mod: t => { O(t, 'square', 392, 0, .04, .05); O(t + .06, 'square', 523.25, 0, .04, .06); },
      fire: t => { O(t, 'square', 987.77, 0, .05, .07); O(t + .07, 'square', 1318.5, 0, .05, .25); },
      swap: t => O(t, 'square', 200, 1200, .04, .2),
      joy: t => O(t, 'triangle', 330, 0, .04, .03),
      oneup: t => ARP(t, 'square', [659.25, 783.99, 1318.5, 1046.5, 1174.66, 1567.98], .07, .05, .09),
      hiscore: t => ARP(t, 'square', [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5], .06, .045, .08),
    },
  };
  return {
    play(v, ev, k) {
      const c = ac(); if (!c) return; const set = SETS[v] || SETS.thk; const f = set[ev] || ((ev === 'space' || ev === 'enter') && set.down); if (!f) return;
      const j = [1, 1.045, .955, 1.02][rr++ % 4] * (1 + (Math.random() - .5) * .03);
      f(c.currentTime + .002, j, k || { w: 1, row: 2 });
    },
  };
})();

/* ---------- shared renderer for still frames ---------- */
let SHARED = null, STILLQ = Promise.resolve();
function cfgRenderer(r, T) { r.setClearColor(0, 0); r.outputColorSpace = T.SRGBColorSpace; r.toneMapping = T.NeutralToneMapping || T.ACESFilmicToneMapping; r.toneMappingExposure = 1; r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap; r.localClippingEnabled = true; }
function sharedRenderer(T) { if (SHARED) return SHARED; const c = document.createElement('canvas'); const r = new T.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setPixelRatio(1); cfgRenderer(r, T); return (SHARED = r); }

class HeroKeyboard extends HTMLElement {
  static get observedAttributes() { return ['theme', 'os', 'reduced', 'autoplay', 'ab', 'variant', 'muted', 'still']; }
  constructor() { super(); this._p = {}; }
  attr(n, d) { const v = this._p[n] ?? this.getAttribute(n); return v == null || v === '' ? d : String(v); }
  attributeChangedCallback(n) {
    if (n === 'ab') this.dataset.kbAb = this.attr('ab', 'a');
    if (!this.ready) return;
    if (n === 'theme') requestAnimationFrame(() => this.readColors());
    if (n === 'os') { const o = this.resolveOS(); if (o !== this.os) { this.os = o; this.rebuild(this.vid); } }
    if (n === 'variant') this.requestVariant(this.vAttr());
  }
  vAttr() { const v = this.attr('variant', 'thk'); return VCFG[v] ? v : 'thk'; }
  resolveOS() { const o = this.attr('os', 'auto'); return o === 'auto' ? detectOS() : o; }
  get isReduced() { return this.attr('reduced', 'auto') === 'true' || (!this.isStill && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  get abId() { return this.attr('ab', 'a'); }
  now() { return this.vt != null ? this.vt : performance.now(); }

  connectedCallback() {
    if (this._init) return; this._init = true; this._dead = false;
    this.dataset.kbAb = this.abId;
    Object.assign(this.style, { display: 'block', position: 'relative', width: '100%', height: '100%' });
    this.setup().catch(e => console.error('hero-keyboard', e));
  }
  disconnectedCallback() {
    this._dead = true; this._init = false; this.ready = false; cancelAnimationFrame(this._raf);
    (this._off || []).forEach(f => f()); this._off = [];
    this.ro && this.ro.disconnect(); this.io && this.io.disconnect();
    if (this.renderer && this.renderer !== SHARED) { this.renderer.dispose(); this.renderer.forceContextLoss && this.renderer.forceContextLoss(); }
    if (this.scene && this.isStill) this.disposeScene();
    this.innerHTML = '';
  }
  on(t, ev, fn, opt) { t.addEventListener(ev, fn, opt); (this._off = this._off || []).push(() => t.removeEventListener(ev, fn, opt)); }

  async setup() {
    const T = this.T = await loadThree(); if (this._dead) return;
    this.isStill = !!this.attr('still', '');
    if (!this.isStill && !window.__heroKbFirst) window.__heroKbFirst = this.abId;
    const cs = getComputedStyle(this); this.mono = cs.getPropertyValue('--font-mono').trim() || 'monospace';
    try { await Promise.all([document.fonts.load(`500 40px ${this.mono}`), document.fonts.load('34px "Special Elite"'), document.fonts.load('8px "Press Start 2P"')]); await document.fonts.ready; } catch (e) {}
    if (this._dead) return;
    const ov = this.overlay = document.createElement('div');
    ov.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
    if (this.isStill) {
      const img = this.img = document.createElement('img'); img.alt = ''; img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      this.append(img, ov); this.renderer = sharedRenderer(T); this.canvas = img;
    } else {
      const canvas = this.canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;outline:none';
      this.append(canvas, ov);
      const r = this.renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      r.setPixelRatio(Math.min(2, devicePixelRatio || 1)); cfgRenderer(r, T);
    }
    if (this.isStill) { STILLQ = STILLQ.then(() => this._dead ? null : (this.buildScene(), this.ready = true, this.renderStill())).catch(e => console.error('hero-keyboard still', e)); return; }
    this.buildScene();
    this.bind();
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this); this.resize();
    this.io = new IntersectionObserver(es => { this.visible = es[0].isIntersecting; }); this.io.observe(this);
    this.visible = true; this.ready = true; this.last = this.now();
    const loop = () => { this._raf = requestAnimationFrame(loop); if (this.visible) this.tick(); };
    loop();
  }

  buildScene() {
    const T = this.T;
    this.scene = new T.Scene();
    this.scene.environment = this.renderer.__env || (this.renderer.__env = this.makeEnv());
    this.camera = new T.PerspectiveCamera(20, 1.6, 1, 200);
    this.camP = Object.assign({}, CAM_BOARD);
    this.clipPlane = new T.Plane(new T.Vector3(0, 1, 0), 0);
    this.sv = 1; this.held = {}; this.kIdx = 0; this.eggBuf = '';
    this.buildStatic();
    this.os = this.resolveOS();
    this.trail = document.createElement('div');
    this.trail.style.cssText = 'position:absolute;left:0;top:0;display:flex;gap:1px;font-family:var(--font-mono);font-size:16px;letter-spacing:.02em;color:var(--ink-2);white-space:pre;transform:translate(-50%,-50%)';
    this.overlay.appendChild(this.trail);
    this.rebuild(this.vAttr());
    this.buildPlay();
    this.readColors();
    this.state0();
  }
  makeEnv() {
    const T = this.T, s = new T.Scene();
    s.add(new T.Mesh(new T.BoxGeometry(40, 40, 40), new T.MeshBasicMaterial({ color: 0x6a6a6a, side: T.BackSide })));
    const panel = (w, h, pos, rot, i) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(i, i, i), side: T.DoubleSide })); m.position.set(...pos); m.rotation.set(...rot); s.add(m); };
    panel(22, 22, [-3, 19, 2], [Math.PI / 2, 0, 0], 3.4);
    panel(10, 24, [-19, 6, 2], [0, Math.PI / 2, 0], 2.4);
    panel(34, 3, [0, 3, 19], [0, 0, 0], 2.0);
    panel(8, 18, [19, 5, -6], [0, -Math.PI / 2, 0], 1.0);
    const pm = new T.PMREMGenerator(this.renderer); const tex = pm.fromScene(s, 0.04).texture; pm.dispose(); return tex;
  }

  buildStatic() {
    const T = this.T, sc = this.scene;
    this.hemi = new T.HemisphereLight(0xffffff, 0xd8d0c4, 0.55); sc.add(this.hemi);
    const d = this.key = new T.DirectionalLight(0xffffff, 2.3); d.position.set(-7, 13, 7); d.castShadow = true;
    d.shadow.mapSize.set(2048, 2048); Object.assign(d.shadow.camera, { left: -15, right: 15, top: 11, bottom: -11, near: 1, far: 45 });
    d.shadow.bias = -0.0004; d.shadow.normalBias = 0.025; d.shadow.radius = 5; sc.add(d);
    const f = this.fill = new T.DirectionalLight(0xffffff, 0.45); f.position.set(9, 6, -5); sc.add(f);
    this.groundMat = new T.ShadowMaterial({ opacity: 0.2 });
    const ground = new T.Mesh(new T.PlaneGeometry(120, 120), this.groundMat); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; sc.add(ground);
    this.contactMat = new T.MeshBasicMaterial({ color: 0x000000, transparent: true, depthWrite: false, opacity: 0.3, map: gradTex(T, 256, [[0, 'rgba(255,255,255,1)'], [0.55, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]) });
    this.contact = new T.Mesh(new T.PlaneGeometry(21, 10.5), this.contactMat); this.contact.rotation.x = -Math.PI / 2; this.contact.position.y = 0.003;
    const bg = this.board = new T.Group(); bg.rotation.y = BASE_RY; sc.add(bg);
    bg.add(this.contact);
    this.glowTex = gradTex(T, 128, [[0, 'rgba(255,255,255,1)'], [0.45, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
    this.dishTex = gradTex(T, 128, [[0, 'rgba(255,255,255,1)'], [0.7, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]);
    this.sheenTex = bandTex(T, 512, 64, false);
    this.padTex = bandTex(T, 256, 256, true);
    this.raycaster = new T.Raycaster(); this.ndc = new T.Vector2(); this.v3 = new T.Vector3();
    this.tmpC = new T.Color(); this.tmpC2 = new T.Color();
  }

  /* ---------- material + mesh helpers ---------- */
  mk(kind, tok, o, list) {
    const T = this.T, Cls = kind === 'phys' ? T.MeshPhysicalMaterial : kind === 'basic' ? T.MeshBasicMaterial : T.MeshStandardMaterial;
    const m = new Cls(Object.assign({ color: 0xffffff }, o || {})); m.userData.tok = tok; m.userData.o0 = m.opacity; m.userData.t0 = m.transparent;
    m.clippingPlanes = [this.clipPlane]; m.clipShadows = true; (list || this.bodyMats).push(m); return m;
  }
  add(parent, geo, mat, pos, rot, noShadow) { const m = new this.T.Mesh(geo, mat); if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); if (!noShadow) { m.castShadow = true; m.receiveShadow = true; } parent.add(m); return m; }
  extrude(shape, H, bev, segs) { const T = this.T; const g = new T.ExtrudeGeometry(shape, { depth: Math.max(.002, H - 2 * bev), bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: segs || 1, curveSegments: 14 }); g.rotateX(-Math.PI / 2); g.translate(0, bev, 0); return g; }
  flat(shape) { const g = new this.T.ShapeGeometry(shape, 14); g.rotateX(-Math.PI / 2); return g; }
  gc(key, fn) { return this.geoCache[key] || (this.geoCache[key] = fn()); }
  cyl(r, l, seg) { return this.gc(`c${r}|${l}|${seg || 12}`, () => new this.T.CylinderGeometry(r, r, l, seg || 12)); }

  capGeo(w, h, D) {
    return this.gc(`cap${w}|${h}|${D}`, () => {
      const T = this.T, W = w - 0.17, bev = 0.055;
      const g = new T.ExtrudeGeometry(rrShape(T, W - 2 * bev, D - 2 * bev, 0.085), { depth: h - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 5 });
      g.rotateX(-Math.PI / 2); g.translate(0, bev, 0);
      const p = g.attributes.position, tx = 0.17 / W, tz = 0.17 / D;
      for (let i = 0; i < p.count; i++) { const t = clamp(p.getY(i) / h); p.setX(i, p.getX(i) * (1 - t * tx)); p.setZ(i, p.getZ(i) * (1 - t * tz) - t * 0.015); }
      g.computeVertexNormals();
      return { g, top: { w: (W - 2 * bev) * (1 - tx) - 0.03, d: (D - 2 * bev) * (1 - tz) - 0.03 }, h };
    });
  }
  chiclet(w, D) { return this.gc(`chic${w}|${D}`, () => { const W = w - 0.24, bev = .025; return { g: this.extrude(rrShape(this.T, W - 2 * bev, D - 2 * bev, .085), .14, bev, 2), top: { w: W - .08, d: D - .08 }, h: .14, W, D }; }); }
  pillGeo(W, D, H, bev, segs) { return this.gc(`pill${W}|${D}|${H}|${bev}`, () => { const s = pillShape(this.T, Math.max(.05, W - 2 * bev), Math.max(.05, D - 2 * bev)); return { g: this.extrude(s, H, bev, segs), top: { w: W - 2 * bev - .02, d: D - 2 * bev - .02 }, h: H }; }); }
  plane(w, d) { return this.gc(`pl${w.toFixed(3)}|${d.toFixed(3)}`, () => { const g = new this.T.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); return g; }); }

  legendTex(k, tw, td, st) {
    const T = this.T, H = 160, W = Math.max(40, Math.round(H * tw / td));
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.textBaseline = 'middle';
    const f = st.pixel ? (sz) => `${Math.round(sz * .6)}px "Press Start 2P", ${this.mono}` : (sz, wt) => `${wt || 500} ${sz}px ${this.mono}`;
    if (st.primer && k.kind === 'alpha' && k.code !== 'Space') { g.globalAlpha = .3; g.lineWidth = 6; g.beginPath(); g.arc(W / 2, H / 2, H * .4, 0, Math.PI * 2); g.stroke(); g.globalAlpha = .16; g.lineWidth = 3; g.beginPath(); g.arc(W / 2, H / 2, H * .31, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
    if (k.arrow) { g.textAlign = 'center'; g.font = f(50, 400); g.fillText(k.arrow, W / 2, H / 2 + 2); }
    else if (k.kind === 'alpha') {
      g.textAlign = 'center';
      if (k.top) { g.font = f(34, 400); g.fillText(k.top, W / 2, H * 0.31); g.font = f(40, 500); g.fillText(k.main, W / 2, H * 0.69); }
      else if (k.main) { g.font = f(52, 500); g.fillText(k.main, W / 2, H / 2 + 3); }
    } else if (k.fkey) { g.textAlign = 'center'; g.font = f(28, 500); g.fillText(k.label, W / 2, H / 2 + 2); }
    else if (st.round) {
      g.textAlign = 'center';
      if (k.sym) { g.font = f(52, 500); g.fillText(k.sym, W / 2, H * .4); g.font = f(24, 500); g.fillText(k.label, W / 2, H * .76); }
      else { g.font = f(30, 600); g.fillText(k.label, W / 2, H / 2 + 2); }
    } else {
      const big = /^(command|cmd|ctrl|control|win|super|option|opt|alt)$/.test(k.label);
      g.textAlign = 'left'; g.font = f(big ? 30 : 26, big ? 600 : 500); g.fillText(k.label, 16, H - 30);
      if (k.sym) { g.textAlign = 'right'; g.font = f(big ? 50 : 40, 500); g.fillText(k.sym, W - 16, 42); }
    }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
  }

  /* ---------- variant build ---------- */
  disposeGroup(g) {
    g.traverse(o => {
      if (o.geometry && !o.geometry.userData.keep) o.geometry.dispose();
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      ms.forEach(m => { if (m.map && !m.map.userData.keep) m.map.dispose(); m.dispose(); });
    });
  }
  rebuild(v) {
    const T = this.T;
    if (this.vg) { this.disposeGroup(this.vg); this.board.remove(this.vg); (this.keys || []).forEach(k => k.labelEl && k.labelEl.remove()); (this.X && this.X.dom || []).forEach(e => e.remove()); }
    this.vid = v; this.cfg = VCFG[v]; this.dataset.kb = v;
    const c = this.cfg, vg = this.vg = new T.Group(); vg.scale.setScalar(c.fit); vg.position.set(...c.pos); this.board.add(vg);
    this.bodyG = new T.Group(); vg.add(this.bodyG);
    this.bodyMats = []; this.keyMats = []; this.X = { dom: [] }; this.geoCache = {}; this._fadeOn = null;
    const B = this['body_' + (v === '8bt' ? 'arc' : v)](this.bodyG);
    this.addSheen(B.front);
    this.buildKeys();
    if (v === 'pew') this.pewGuard();
    this.contact.scale.set((c.foot[0] * c.fit + 4.4) / 21, (c.foot[1] * c.fit + 3.7) / 10.5, 1); this.contact.position.z = c.pos[2];
    if (this.ready) { this.readColors(); this.assignPlay(); }
  }
  addSheen(f) {
    const T = this.T; this.sheenMat = new T.MeshBasicMaterial({ map: this.sheenTex, transparent: true, depthWrite: false, toneMapped: false, blending: T.AdditiveBlending, opacity: .4 });
    this.sheenMat.clippingPlanes = [this.clipPlane];
    this.sheen = this.add(this.bodyG, new T.PlaneGeometry(f.w, f.h * .86), this.sheenMat, [0, f.y, f.z + .015], null, true);
  }

  body_thk(g) {
    const T = this.T, caseM = this.mk('std', '--kb-case', { metalness: .6, roughness: .42 }); caseM.userData.mr = 1;
    const plateM = this.mk('std', '--kb-plate', { metalness: .35, roughness: .6 });
    const outer = rrShape(T, 16.62, 6.82, 0.42); outer.holes.push(rrShape(T, 16.36, 6.56, 0.16, T.Path));
    this.add(g, this.extrude(outer, .8, .07, 1), caseM);
    this.add(g, new T.BoxGeometry(16.4, .45, 6.6), plateM, [0, .275, 0]);
    return { front: { w: 16.5, h: .8, y: .4, z: 3.41 } };
  }
  body_tik(g) {
    const T = this.T, deckM = this.mk('std', '--kb-metal', { metalness: .6, roughness: .5 }); deckM.userData.mr = 1;
    const darkM = this.mk('std', '--kb-trim', { metalness: .5, roughness: .6 });
    this.X.wellM = this.mk('std', '--kb-plate', { metalness: .1, roughness: .85 });
    this.add(g, this.extrude(rrShape(T, 19.4, 11.6, .7), .4, .05, 2), deckM);
    this.add(g, new T.BoxGeometry(19.0, .3, .5), darkM, [0, .25, -5.65]);
    const chamM = this.mk('std', '--kb-metal', { metalness: .7, roughness: .32 });
    this.add(g, this.flat(rrShape(T, 7.9, 3.7, .4)), chamM, [0, .401, 3.65], null, true).receiveShadow = true;
    const glassM = this.mk('phys', '--kb-glass', { metalness: 0, roughness: .62, clearcoat: .2, clearcoatRoughness: .6 });
    this.add(g, this.flat(rrShape(T, 7.76, 3.56, .34)), glassM, [0, .404, 3.65], null, true).receiveShadow = true;
    const sm = this.mk('basic', null, { map: this.padTex, transparent: true, depthWrite: false, toneMapped: false, blending: T.AdditiveBlending, opacity: .18 });
    this.X.padSheen = sm; this.add(g, this.plane(7.6, 3.4), sm, [0, .408, 3.65], null, true);
    return { front: { w: 19.2, h: .4, y: .2, z: 5.8 } };
  }
  clkSlope(z) { return .5 + (3.6 - z) / 5.5 * .95; }
  body_clk(g) {
    const T = this.T, X = this.X;
    const enamel = this.mk('phys', '--kb-case', { roughness: .3, metalness: .05, clearcoat: .8, clearcoatRoughness: .25 });
    const dark = this.mk('std', '--kb-plate', { roughness: .75, metalness: .1 });
    const nickel = this.mk('std', '--kb-metal', { metalness: 1, roughness: .22 });
    const gold = this.mk('std', '--kb-trim', { metalness: .9, roughness: .3 });
    const s = new T.Shape();
    s.moveTo(3.9, 0); s.lineTo(3.9, .3); s.quadraticCurveTo(3.9, .48, 3.6, .5); s.lineTo(-1.9, 1.45); s.lineTo(-2.45, 1.55);
    s.quadraticCurveTo(-2.75, 1.6, -2.75, 1.85); s.lineTo(-2.75, 1.98); s.quadraticCurveTo(-2.75, 2.15, -3.0, 2.15); s.lineTo(-4.75, 2.15); s.quadraticCurveTo(-5.0, 2.15, -5.0, 1.9); s.lineTo(-5.0, 0); s.lineTo(3.9, 0);
    const W = 15.4, sg = new T.ExtrudeGeometry(s, { depth: W - .16, bevelEnabled: true, bevelThickness: .08, bevelSize: .06, bevelSegments: 2, curveSegments: 10 });
    sg.rotateY(-Math.PI / 2); sg.translate((W - .16) / 2, 0, 0);
    this.add(g, sg, enamel);
    // dark key well on the slope, where the key levers come through
    const ang = Math.atan2(.95, 5.5), len = 5.9, mz = .85;
    const well = this.add(g, new T.PlaneGeometry(13.9, len), dark, [0, this.clkSlope(mz) + .012, mz], [-Math.PI / 2 + ang, 0, 0], true); well.receiveShadow = true;
    X.pins = [this.add(g, new T.BoxGeometry(15.2, .028, .02), gold, [0, .36, 3.99], null, true), this.add(g, new T.BoxGeometry(15.2, .028, .02), gold, [0, 1.9, -2.83], null, true)];
    // ribbon spools + type guide
    [-1, 1].forEach(k => { this.add(g, new T.CylinderGeometry(.62, .62, .1, 32), nickel, [k * 5.3, 2.2, -3.05]); this.add(g, new T.CylinderGeometry(.2, .2, .14, 16), dark, [k * 5.3, 2.24, -3.05]); });
    this.add(g, new T.BoxGeometry(.5, .32, .06), nickel, [0, 2.24, -3.28]);
    // carriage
    const car = X.carriage = new T.Group(); g.add(car);
    this.add(car, new T.CylinderGeometry(.55, .55, 13.8, 32), dark, [0, 2.72, -3.9], [0, 0, Math.PI / 2]);
    [-1, 1].forEach(k => { this.add(car, new T.CylinderGeometry(.72, .72, .4, 32), dark, [k * 7.1, 2.72, -3.9], [0, 0, Math.PI / 2]); this.add(car, new T.CylinderGeometry(.26, .26, .46, 20), nickel, [k * 7.22, 2.72, -3.9], [0, 0, Math.PI / 2]); });
    this.add(car, new T.BoxGeometry(14.6, .12, .5), nickel, [0, 2.2, -4.5]);
    this.add(car, new T.CylinderGeometry(.035, .035, 7.6, 10), nickel, [0, 3.3, -3.5], [0, 0, Math.PI / 2]);
    [-2.2, 2.2].forEach(x => this.add(car, new T.CylinderGeometry(.09, .09, .3, 14), dark, [x, 3.3, -3.5], [0, 0, Math.PI / 2]));
    const P = X.paper = { W: 1024, H: 666, m: 64, cw: 22.4, lh: 50, base: 46, fs: 34 };
    P.c = document.createElement('canvas'); P.c.width = P.W; P.c.height = P.H; P.g = P.c.getContext('2d');
    P.tex = new T.CanvasTexture(P.c); P.tex.colorSpace = T.SRGBColorSpace; P.tex.anisotropy = 8;
    P.lines = [PRE_LINE.split('').map(ch => this.inkChar(ch)), []];
    const pg = new T.PlaneGeometry(8, 5.2); pg.translate(0, 2.6, 0);
    const pm = this.mk('std', null, { map: P.tex, roughness: .92, metalness: 0, side: T.DoubleSide });
    const paper = this.add(car, pg, pm, [0, 3.12, -4.12], [-.2, 0, 0]); paper.castShadow = false;
    const lev = X.lever = new T.Group(); lev.position.set(-7.2, 3.05, -3.7); car.add(lev);
    const lg = new T.CylinderGeometry(.05, .05, 1.7, 10); lg.rotateX(Math.PI / 2); lg.translate(0, 0, .85);
    this.add(lev, lg, nickel); this.add(lev, new T.SphereGeometry(.13, 14, 10), nickel, [0, 0, 1.7]);
    // striking typebar (rests inside the body)
    const bar = X.bar = new T.Group(); bar.position.set(0, 1.62, -2.55); g.add(bar);
    const bb = new T.BoxGeometry(.05, .035, 1.3); bb.translate(0, 0, .65); this.add(bar, bb, nickel); bar.rotation.x = .9;
    X.carX = X.carT = this.colX(0); X.carTau = .03; X.lev = 0; X.barT0 = null;
    this.paperDraw();
    return { front: { w: 15.2, h: .4, y: .22, z: 3.98 } };
  }
  body_pop(g) {
    const T = this.T, m = this.mk('phys', '--kb-case', { roughness: .5, metalness: 0, clearcoat: .4, clearcoatRoughness: .4 });
    this.add(g, this.extrude(rrShape(T, 16.3, 6.7, .9), .62, .3, 6), m);
    return { front: { w: 15.6, h: .5, y: .31, z: 3.66 } };
  }
  body_pew(g) {
    const T = this.T, X = this.X;
    const caseM = this.mk('std', '--kb-case', { metalness: .35, roughness: .55 }); caseM.userData.mr = 1;
    const plateM = this.mk('std', '--kb-plate', { metalness: .5, roughness: .55 });
    const metal = this.mk('std', '--kb-metal', { metalness: .75, roughness: .42 });
    const trim = this.mk('std', '--kb-trim', { metalness: .85, roughness: .35 });
    X.trimM = trim;
    const outer = rrShape(T, 17.8, 7.7, .25); outer.holes.push(rrShape(T, 16.9, 6.9, .14, T.Path));
    this.add(g, this.extrude(outer, .95, .06, 1), caseM);
    this.add(g, new T.BoxGeometry(16.9, .55, 6.9), plateM, [0, .3, 0]);
    this.add(g, new T.BoxGeometry(17.8, .3, .55), metal, [0, 1.1, -3.57]);
    const riv = this.cyl(.07, .06, 10); for (let i = 0; i < 17; i++) this.add(g, riv, trim, [-8.2 + i * 1.025, 1.28, -3.57]);
    const hex = this.cyl(.17, .07, 6), slot = new T.BoxGeometry(.24, .02, .045);
    [[-8.5, .99, 3.45], [8.5, .99, 3.45]].forEach(p => { this.add(g, hex, trim, p); this.add(g, slot, plateM, [p[0], p[1] + .045, p[2]], [0, .6, 0], true); });
    [-1, 1].forEach(s => { this.add(g, new T.BoxGeometry(.24, .62, 4.4), metal, [s * 8.98, .45, .2]); for (let i = 0; i < 11; i++) this.add(g, new T.BoxGeometry(.08, .62, .13), metal, [s * 9.13, .45, -1.8 + i * .4]); });
    this.add(g, new T.BoxGeometry(.06, .32, .9), this.mk('std', null, { color: 0x0a0a0a, roughness: .9 }), [9.12, .55, -2.4], null, true);
    const brass = this.mk('std', '--kb-cap', { metalness: .92, roughness: .28 });
    const cg = new T.CylinderGeometry(.08, .08, .28, 12);
    X.casings = []; for (let i = 0; i < 10; i++) { const m = this.add(g, cg, brass); m.visible = false; X.casings.push({ m, on: false }); }
    X.kick = 0;
    return { front: { w: 17.6, h: .95, y: .48, z: 3.85 } };
  }
  pewGuard() {
    const T = this.T, k = this.byCode.Escape, trim = this.X.trimM;
    const grp = new T.Group(); grp.position.set(k.cx, k.by + k.h + .1, k.cz - .48); this.bodyG.add(grp);
    const pb = new T.BoxGeometry(.98, .05, .94); pb.translate(0, 0, .47); this.add(grp, pb, trim);
    this.add(grp, new T.CylinderGeometry(.06, .06, 1.04, 12), trim, [0, 0, 0], [0, 0, Math.PI / 2]);
    grp.rotation.x = -1.18; this.X.guard = grp;
  }
  body_arc(g) {
    const T = this.T, X = this.X;
    const panel = this.mk('phys', '--kb-case', { roughness: .35, metalness: .05, clearcoat: .5, clearcoatRoughness: .3 });
    const inset = this.mk('std', '--kb-plate', { roughness: .6, metalness: 0 });
    const trim = this.mk('phys', '--kb-trim', { roughness: .25, clearcoat: 1 });
    const metal = this.mk('std', '--kb-metal', { metalness: .85, roughness: .3 });
    this.add(g, this.extrude(rrShape(T, 17.4, 7.6, .45), .9, .06, 2), panel);
    this.add(g, this.flat(rrShape(T, 16.9, 7.1, .3)), inset, [0, .903, 0], null, true).receiveShadow = true;
    this.add(g, new T.BoxGeometry(17.3, .14, .06), trim, [0, .8, 3.82]);
    // marquee
    const mq = new T.Group(); mq.position.set(.9, .9, -3.55); mq.rotation.x = -.12; g.add(mq);
    this.add(mq, new T.BoxGeometry(12.6, 1.6, .34), panel, [0, .8, 0]);
    const Q = X.mq = { W: 256, H: 32, buf: '', msg: null, until: 0, blink: -1 };
    Q.c = document.createElement('canvas'); Q.c.width = Q.W; Q.c.height = Q.H; Q.g = Q.c.getContext('2d');
    Q.tex = new T.CanvasTexture(Q.c); Q.tex.colorSpace = T.SRGBColorSpace; Q.tex.magFilter = T.NearestFilter; Q.tex.minFilter = T.LinearFilter; Q.tex.generateMipmaps = false;
    const sm = this.mk('basic', null, { map: Q.tex, toneMapped: false });
    this.add(mq, new T.PlaneGeometry(12.1, 1.15), sm, [0, .82, .175], null, true);
    // joystick
    const st = X.stick = new T.Group(); st.position.set(-7.05, .9, .55); g.add(st);
    this.add(st, this.cyl(.62, .04, 28), metal, [0, .02, 0]);
    this.add(st, this.cyl(.06, 1.0, 10), metal, [0, .5, 0]);
    this.add(st, new T.SphereGeometry(.32, 28, 18), this.mk('phys', '--kb-cap', { roughness: .18, clearcoat: 1 }), [0, 1.05, 0]);
    X.jx = 0; X.jz = 0;
    // coin slot (front face)
    const cp = rrShape(T, 1.4, .56, .08), cpg = new T.ShapeGeometry(cp, 8);
    this.add(g, cpg, metal, [6.6, .45, 3.805], null, true);
    this.add(g, new T.BoxGeometry(.08, .34, .05), this.mk('std', null, { color: 0x050505, roughness: .9 }), [6.42, .45, 3.83], null, true);
    X.coinM = this.mk('basic', null, { toneMapped: false });
    this.add(g, new T.CircleGeometry(.07, 16), X.coinM, [6.92, .45, 3.83], null, true);
    this.mqDraw(0);
    return { front: { w: 17.2, h: .9, y: .45, z: 3.8 } };
  }

  profile(k, n) {
    const v = this.vid, r = k.row;
    if (v === 'thk') { const [h, p] = ROW_PROFILE[r]; return { h, pitch: p, by: .5 }; }
    if (v === 'pew') { const [h, p] = ROW_PROFILE[r]; return { h: h * 1.1, pitch: p, by: .58 }; }
    if (v === 'tik') return { h: .14, pitch: 0, by: .37 };
    if (v === 'pop') return { h: .42, pitch: [.07, .05, .025, 0, -.03, -.05][r], by: .6 };
    if (v === 'clk') return { h: .14, pitch: .17, by: this.clkSlope(k.cz) + .44 };
    return { h: .2, pitch: 0, by: .9 };
  }
  makeCap(k) {
    const T = this.T, v = this.vid, grp = new T.Group();
    const KM = (kind, o, tok) => this.mk(kind, tok || null, o, this.keyMats);
    let body, mat, G, lz = 0, dish = false, y0 = 0;
    if (v === 'thk' || v === 'pew') {
      G = this.capGeo(k.w, k.h, v === 'pew' ? .86 : .83);
      mat = v === 'pew' ? (k.kind === 'alpha' ? KM('std', { metalness: .88, roughness: .3 }) : KM('std', { metalness: .45, roughness: .55 })) : KM('phys', { roughness: .58, metalness: 0, clearcoat: .22, clearcoatRoughness: .5 });
      lz = -.015; dish = true;
    } else if (v === 'tik') {
      G = this.chiclet(k.w, k.row === 0 ? .46 : .76); mat = KM('std', { roughness: .55, metalness: 0 });
      const well = new T.Mesh(this.gc(`well${k.w}|${k.row === 0}`, () => this.flat(rrShape(T, G.W + .1, G.D + .1, .13))), this.X.wellM); well.position.set(k.cx, .402, k.cz); well.receiveShadow = true; this.vg.add(well);
    } else if (v === 'clk') {
      const sp = k.code === 'Space', W = sp ? k.w - .4 : Math.max(.62, k.w - .38), D = sp ? .3 : .62, metal = KM('std', { metalness: 1, roughness: .22 }, '--kb-metal');
      if (!sp) grp.add(Object.assign(new T.Mesh(this.pillGeo(W + .13, D + .13, .07, .015, 1).g, metal), { castShadow: true }));
      const stem = new T.Mesh(this.cyl(.04, .5, 8), metal); stem.position.set(0, -.25, .05); stem.rotation.x = -.35; stem.castShadow = true; grp.add(stem);
      G = this.pillGeo(W, D, sp ? .1 : .1, .03, 3); mat = sp ? KM('std', { metalness: 1, roughness: .25 }) : KM('phys', { roughness: .1, metalness: 0, clearcoat: 1, clearcoatRoughness: .06 }); y0 = .045;
    } else if (v === 'pop') {
      G = this.pillGeo(k.w - .16, .84, k.h, .14, 5); mat = KM('phys', { roughness: .5, metalness: 0, clearcoat: .35, clearcoatRoughness: .4 });
    } else {
      const W = k.w - .2, D = .8, bm = KM('std', { roughness: .45, metalness: .3 }, '--kb-metal');
      grp.add(Object.assign(new T.Mesh(this.pillGeo(W + .14, D + .14, .06, .012, 1).g, bm), { castShadow: true, receiveShadow: true }));
      G = this.pillGeo(W - .04, D - .04, .2, .1, 6); mat = KM('phys', { roughness: .2, metalness: 0, clearcoat: 1, clearcoatRoughness: .1 }); y0 = .03;
    }
    body = new T.Mesh(G.g, mat); body.position.y = y0; body.castShadow = true; body.receiveShadow = true; body.userData.k = k; grp.add(body);
    return { grp, body, mat, top: G.top, hTop: y0 + G.h, lz, dish };
  }

  buildKeys() {
    const T = this.T, v = this.vid, c = this.cfg;
    this.keys = (c.lay === 'compact' ? layoutCompact : layoutFull)(this.os);
    const nrows = c.lay === 'compact' ? 5 : 6, pal4 = ['--kb-cap', '--kb-cap-2', '--kb-cap-3', '--kb-cap-4'];
    const st = { round: v === 'clk' || v === 'pop' || v === '8bt', pixel: v === '8bt', primer: v === 'pew' };
    this.byCode = {}; this.capMeshes = [];
    if (!this.dishMat) this.dishMat = new T.MeshBasicMaterial({ color: 0x000000, map: this.dishTex, transparent: true, opacity: 0.05, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
    this.keys.forEach((k, i) => {
      k.i = i; k.cx += c.kx; k.cz += c.kz;
      Object.assign(k, this.profile(k, nrows));
      const C = this.makeCap(k);
      const lmat = new T.MeshBasicMaterial({ map: this.legendTex(k, C.top.w, C.top.d, st), transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
      lmat.clippingPlanes = [this.clipPlane];
      const leg = new T.Mesh(this.plane(C.top.w, C.top.d), lmat); leg.position.y = C.hTop + 0.004; leg.position.z = C.lz;
      C.grp.add(leg);
      if (C.dish) { const dish = new T.Mesh(this.plane(C.top.w * 0.92, C.top.d * 0.9), this.dishMat); dish.position.y = C.hTop + 0.002; dish.position.z = C.lz; C.grp.add(dish); }
      const gmat = new T.MeshBasicMaterial({ map: this.glowTex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
      const glow = new T.Mesh(this.plane(k.w + 0.6, 1.5), gmat); glow.position.set(k.cx, (v === 'clk' ? this.clkSlope(k.cz) + .02 : k.by) + 0.004, k.cz); glow.renderOrder = 1;
      this.vg.add(C.grp, glow);
      k.ctok = k.kind === 'accent' ? 'acc' : (v === 'clk' && k.code === 'Space') ? '--kb-metal' : k.kind === 'mod' ? '--kb-cap-mod' : (v === 'pop' || v === '8bt') ? pal4[(i * 7 + k.row * 3) % 4] : '--kb-cap';
      Object.assign(k, { cap: C.grp, body: C.body, mat: C.mat, lmat, glow, gmat, hTop: C.hTop, started: true, y: 0, v: 0, lit: 0, dim: 0, self: 0, glowV: 0, flash: 0, down: false, ghost: false, relT: -1e9 });
      C.grp.position.set(k.cx, k.by, k.cz); C.grp.rotation.x = k.pitch;
      if (k.code) this.byCode[k.code] = k;
      this.capMeshes.push(C.body);
      if (LABELS[k.code]) { k.labelEl = this.makeLabel(LABELS[k.code]); this.overlay.appendChild(k.labelEl); }
    });
    const enter = this.byCode.Enter;
    this.keys.forEach(k => { k.dE = Math.hypot(k.cx - enter.cx, k.cz - enter.cz); });
    [...this.keys].sort((a, b) => a.dE - b.dE).forEach((k, i) => k.order = i);
    this.minZ = Math.min(...this.keys.map(k => k.cz));
  }

  makeLabel(text, plain) {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;left:0;top:0;white-space:nowrap;font-family:var(--font-mono);font-size:11px;letter-spacing:.02em;color:var(--ink);background:var(--surface);border:1px solid var(--line-2);border-radius:999px;padding:5px 10px 5px 8px;box-shadow:var(--shadow-1);display:flex;align-items:center;gap:6px;opacity:0;will-change:transform,opacity';
    if (!plain) { const dot = document.createElement('span'); dot.style.cssText = 'width:6px;height:6px;border-radius:50%;background:var(--accent);flex:none'; d.appendChild(dot); }
    else d.style.padding = '5px 10px';
    d.appendChild(document.createTextNode(text)); return d;
  }

  buildPlay() {
    const T = this.T; this.playGroup = new T.Group(); this.board.add(this.playGroup); this.playGroup.visible = false;
    this.lineMat = new T.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0, depthWrite: false });
    const targets = [], blocks = [], off = { x: 1.3, z: -0.7 };
    const add = (cx, cz, cols, rows, layers, s, label) => {
      const x0 = cx + off.x, z0 = cz + off.z;
      for (let l = 0; l < layers; l++) for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
        targets.push({ x: x0 + (c - (cols - 1) / 2) * s, z: z0 + (r - (rows - 1) / 2) * s, y: l * 0.48 * s, s });
      const b = { x: x0, z: z0, y: layers * 0.48 * s + 0.35, label }; blocks.push(b); return b;
    };
    const ring = (cx, cz, n, rad, s, label) => {
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; targets.push({ x: cx + off.x + Math.cos(a) * rad, z: cz + off.z + Math.sin(a) * rad, y: 0, s }); }
      const b = { x: cx + off.x, z: cz + off.z, y: 0.9, label }; blocks.push(b); return b;
    };
    const users = add(-9.6, 0, 2, 3, 1, 0.72, 'Users');
    const cdn = ring(-6.3, 0, 8, 1.2, 0.68, 'CDN');
    const lb = add(-3.1, 0, 2, 2, 2, 0.95, 'Load balancer');
    const a1 = add(0.2, -2.6, 2, 1, 4, 0.9, null), a2 = add(0.2, 0, 2, 1, 4, 0.9, 'App servers'), a3 = add(0.2, 2.6, 2, 1, 4, 0.9, null);
    const cache = add(3.6, -2.6, 2, 2, 1, 0.9, 'Cache');
    const db = add(3.8, 0.9, 2, 2, 3, 0.95, 'Database');
    const r1 = add(6.4, 0.1, 1, 1, 3, 0.85, 'Read replicas'), r2 = add(6.4, 1.9, 1, 1, 3, 0.85, null);
    const q = add(1.8, 4.7, 6, 1, 1, 0.62, 'Queue');
    const wk = add(5.4, 4.7, 3, 1, 1, 0.8, 'Workers');
    [[users, cdn], [cdn, lb], [lb, a1], [lb, a2], [lb, a3], [a1, cache], [a2, db], [a3, db], [db, r1], [db, r2], [a3, q], [q, wk]].forEach(([a, b]) => {
      const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz);
      const m = new T.Mesh(new T.BoxGeometry(len, 0.02, 0.05), this.lineMat); m.position.set((a.x + b.x) / 2, 0.012, (a.z + b.z) / 2); m.rotation.y = -Math.atan2(dz, dx); this.playGroup.add(m);
    });
    this.playTargets = targets;
    this.playBlocks = blocks.filter(b => b.label).map(b => { const el = this.makeLabel(b.label, true); this.overlay.appendChild(el); return Object.assign(b, { el }); });
    this.assignPlay();
  }
  assignPlay() {
    if (!this.playTargets || !this.keys) return;
    const s = this.cfg.fit, bp = this.cfg.pos;
    const sorted = [...this.keys].sort((a, b) => a.cx - b.cx || a.row - b.row);
    sorted.forEach((k, i) => {
      const t = this.playTargets[i];
      k.play = t ? { x: (t.x - bp[0]) / s, y: t.y / s, z: (t.z - bp[2]) / s, sx: t.s / k.w * 0.95 / s, sy: t.s * .47 / Math.max(.12, k.hTop) / s, sz: t.s / s } : { x: k.cx * 0.6, y: -1.2, z: k.cz * 0.6, sx: 0.001, sy: 0.001, sz: 0.001, hide: true };
    });
  }

  readColors() {
    if (!this.T || !this.keys) return;
    const T = this.T, cs = getComputedStyle(this), g = n => cs.getPropertyValue(n).trim(), num = (n, d) => { const v = parseFloat(g(n)); return isNaN(v) ? d : v; };
    const cache = {}, C = n => cache[n] || (cache[n] = new T.Color(g(n) || '#888'));
    this.C = { acc: C('--kb-cap-accent'), legAcc: C('--kb-legend-accent'), leg: C('--kb-legend'), legMod: C('--kb-legend-mod'), accent: C('--accent'), accentText: C('--accent-text'), ink3: C('--ink-3') };
    this.accentStr = g('--accent') || '#f60';
    const env = num('--kb-env', .8), dark = this.dark = this.attr('theme', 'light') === 'dark';
    this.bodyMats.forEach(m => { if (m.userData.tok) m.color.copy(C(m.userData.tok)); if (m.userData.mr) { m.metalness = num('--kb-metalness', .6); m.roughness = num('--kb-roughness', .42); } if ('envMapIntensity' in m) m.envMapIntensity = env; });
    this.keyMats.forEach(m => { if (m.userData.tok) m.color.copy(C(m.userData.tok)); m.envMapIntensity = env * .7; });
    this.groundMat.opacity = num('--kb-shadow-opacity', .2); this.contactOp = num('--kb-contact-opacity', .3);
    this.glowK = num('--kb-glow-strength', .6); this.emisK = num('--kb-emissive', .2); this.dimK = num('--kb-dim', .2);
    const add = g('--kb-glow-mode') === 'additive', auto = this.vid === 'pop' || this.vid === '8bt';
    const INK = new T.Color('#1B1916'), WHITE = new T.Color('#FFFFFF'), lum = c => .2126 * c.r + .7152 * c.g + .0722 * c.b;
    this.keys.forEach(k => {
      k.c0 = k.ctok === 'acc' ? this.C.acc : C(k.ctok);
      k.l0 = k.kind === 'accent' ? this.C.legAcc : auto ? (lum(k.c0) > .3 ? INK : WHITE) : k.kind === 'mod' ? this.C.legMod : this.C.leg;
      k.gmat.blending = add ? T.AdditiveBlending : T.NormalBlending; k.gmat.color.copy(this.C.accent); k.gmat.needsUpdate = true;
    });
    this.lineMat.color.copy(this.C.ink3);
    this.dishMat.opacity = dark ? 0.12 : 0.045;
    this.hemi.intensity = dark ? 0.35 : 0.6; this.key.intensity = dark ? 2.0 : 2.3;
    this.sheenBase = dark ? .22 : .42;
    const X = this.X;
    if (X.pins) X.pins.forEach(p => p.visible = dark);
    if (X.coinM) X.coinM.color.copy(this.C.accent);
    if (X.padSheen) { X.padSheen.userData.o0 = dark ? .07 : .16; X.padSheen.opacity = X.padSheen.userData.o0; }
    if (X.paper) this.paperDraw();
    if (X.mq) { X.mq.blink = -1; }
    this.candy = ['--kb-cap', '--kb-cap-2', '--kb-cap-3', '--kb-cap-4'].map(g);
  }

  state0() {
    this.mode = 'board'; this.t0 = this.now(); this.entering = !this.isReduced && !this.isStill; this.entShort = false; this.ripples = []; this.modHeld = false; this.chord = null;
    this.lastInput = this.now() + 1200; this.realSeen = false; this.ap = null; this.px = 0; this.py = 0; this.ptx = 0; this.pty = 0; this.pointer = null;
    this.caseOp = this.entering ? 0 : 1;
    this.setEntryDelays(false);
    this.keys.forEach(k => { k.cap.visible = !this.entering; k.started = !this.entering; });
  }
  setEntryDelays(short) { this.keys.forEach(k => k.delay = short ? 30 + k.row * 34 + (k.cx + 8) * 6 : 180 + k.row * 55 + (k.cx + 8) * 24); }

  isActive() { return (window.__heroKbActive || window.__heroKbFirst) === this.abId; }
  modCodes() { return this.os === 'mac' ? ['MetaLeft', 'MetaRight'] : ['ControlLeft', 'ControlRight']; }
  emit(type, extra) { window.dispatchEvent(new CustomEvent('hero-kb', { detail: Object.assign({ ab: this.abId, type }, extra || {}) })); }
  snd(ev, k) { if (this.isStill || this.attr('muted', 'true') !== 'false') return; AUDIO.play(this.vid, ev, k); }

  bind() {
    const art = this.closest('[data-artboard]') || this.parentElement;
    const setActive = () => { window.__heroKbActive = this.abId; };
    this.on(art, 'pointerenter', setActive); this.on(art, 'pointerdown', setActive);
    this.on(art, 'pointermove', e => { const r = this.getBoundingClientRect(); this.ptx = ((e.clientX - r.left) / r.width) * 2 - 1; this.pty = ((e.clientY - r.top) / r.height) * 2 - 1; });
    this.on(art, 'pointerleave', () => { this.ptx = 0; this.pty = 0; });
    const c = this.canvas;
    this.on(c, 'pointermove', e => { this.pointer = { x: e.clientX, y: e.clientY }; });
    this.on(c, 'pointerleave', () => { this.pointer = null; });
    this.on(c, 'pointerdown', e => {
      const k = this.hoverKey; if (!k || this.mode !== 'board' || this.swap) return;
      e.preventDefault(); c.setPointerCapture(e.pointerId); this.mouseKey = k;
      this.realInput();
      if (this.modCodes().includes(k.code)) { if (!this.modHeld) this.snd('mod'); this.modHeld = true; this.pressKey(k); return; }
      this.pressKey(k);
      const ch = this.charOf(k);
      this.logic(k.code, ch, this.modHeld);
      if (ch && !this.modHeld) this.addTrail(ch);
    });
    const up = () => { const k = this.mouseKey; if (!k) return; this.mouseKey = null; this.releaseKey(k); if (this.modCodes().includes(k.code)) this.modHeld = false; };
    this.on(c, 'pointerup', up); this.on(c, 'pointercancel', up);
    this.on(window, 'keydown', e => this.onKeyDown(e));
    this.on(window, 'keyup', e => this.onKeyUp(e));
    this.on(window, 'blur', () => { this.modHeld = false; this.held = {}; this.keys.forEach(k => k.down && this.releaseKey(k)); });
  }
  charOf(k) { return k.kind === 'alpha' ? (k.code === 'Space' ? '·' : (k.main || '').toLowerCase()) : k.code === 'Enter' ? '↵' : ''; }
  typing(e) { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); }

  onKeyDown(e) {
    if (!this.ready || !this.isActive() || this.typing(e)) return;
    const mod = this.os === 'mac' ? e.metaKey : e.ctrlKey;
    this.realInput();
    this.held[e.code] = true;
    const k = this.byCode[e.code];
    const isMod = this.modCodes().includes(e.code);
    if (isMod) { if (!this.modHeld && !e.repeat) this.snd('mod'); this.modHeld = true; } else if (!mod) this.modHeld = false;
    if (k && !e.repeat && !this.swap) this.pressKey(k);
    if (k && mod && this.os === 'mac' && !isMod) setTimeout(() => k.down && !k.ghost && this.releaseKey(k), 260);
    if (e.repeat) return;
    if (this.vid === '8bt') {
      if (/^Arrow/.test(e.code)) this.snd('joy');
      if (e.code === KONAMI[this.kIdx]) { this.kIdx++; if (this.kIdx === KONAMI.length) { this.kIdx = 0; this.oneUp(); } } else this.kIdx = e.code === KONAMI[0] ? 1 : 0;
    }
    const handled = this.logic(e.code, e.key, mod);
    if (handled || e.code === 'Space' || e.key === '/' || e.key === "'") e.preventDefault();
    if (!mod && !e.altKey && this.mode === 'board') {
      if (e.key.length === 1) this.addTrail(e.key === ' ' ? '·' : e.key);
      else if (e.key === 'Enter') this.addTrail('↵');
      else if (e.key === 'Backspace') this.popTrail();
    }
  }
  onKeyUp(e) {
    if (!this.ready) return;
    delete this.held[e.code];
    const k = this.byCode[e.code]; if (k && !k.ghost) this.releaseKey(k);
    if (this.modCodes().includes(e.code)) { this.modHeld = false; if (this.os === 'mac') this.keys.forEach(x => x.down && !x.ghost && this.releaseKey(x)); }
  }

  logic(code, key, mod) {
    if (this.mode !== 'board') { if (code === 'Escape' && this.mode === 'play') { this.exitPlayground(); return true; } return false; }
    if (this.modCodes().includes(code)) return false;
    if (this._navT) { clearTimeout(this._navT); this._navT = null; } // typing on after G+letter = a word, not a shortcut
    if (mod && code === 'KeyK') { this.ring(this.byCode.KeyK); this.snd('fire'); this.emit('palette', this.screenOf(this.byCode.KeyK)); return true; }
    if (mod && code === 'Enter') { this.snd('fire'); this.enterPlayground(); return true; }
    if ((mod && code === 'Slash') || key === '?') { this.snd('fire'); this.emit('shortcuts'); return true; }
    if (code === 'Escape') { this.chord = null; this.emit('escape'); return false; }
    if (mod) return false;
    if (this.chord) { const nav = NAV[code]; this.chord = null; if (nav) { this._navT = setTimeout(() => { this._navT = null; this.snd('fire'); this.emit('nav', { target: nav }); }, 280); return true; } }
    else if (code === 'KeyG') { this.chord = { t0: this.now() }; return false; }
    return false;
  }

  realInput() {
    this.lastInput = this.now();
    if (this.ap) this.stopAutoplay();
    if (!this.realSeen) { this.realSeen = true; this.emit('real'); }
  }
  pressKey(k, ghost) {
    if (!k) return;
    const was = k.down;
    if (!ghost && !was) this.snd(k.code === 'Space' ? 'space' : k.code === 'Enter' ? 'enter' : 'down', k);
    k.down = true; k.ghost = !!ghost; k.flash = ghost ? 0.5 : 1; k.self = ghost ? 0.38 : 1;
    if (!ghost && !this.isReduced && this.mode === 'board') this.ripples.push({ x: k.cx, z: k.cz, t0: this.now(), s: 0.85, fall: 2.4 });
    if (!was && this.mode === 'board') this.feedback(k, ghost);
  }
  releaseKey(k) { if (!k || !k.down) return; if (!k.ghost) this.snd('up', k); k.down = false; k.ghost = false; k.relT = this.now(); }
  feedback(k, ghost) {
    const v = this.vid, X = this.X, R = this.isReduced, t = this.now();
    if (v === 'pop' && !R) this.popRing(k, ghost);
    if (v === 'clk' && !R) { X.barT0 = t; X.barAmp = ghost ? .35 : 1; }
    if (v === 'pew' && !ghost) {
      if (!R) { this.eject(); X.kick = Math.min(1.8, X.kick + .55); }
      if (k.code === 'Enter' && !this.isStill) [95, 190].forEach(d => setTimeout(() => { if (this.X !== X) return; k.self = 1; k.flash = 1; if (!R) { this.eject(); X.kick = Math.min(1.8, X.kick + .6); } this.ripples.push({ x: k.cx, z: k.cz, t0: this.now(), s: .6, fall: 2 }); }, d));
    }
  }
  stopAutoplay() { this.keys.forEach(k => k.ghost && this.releaseKey(k)); if (this.ap && this.ap.mod) this.modHeld = false; this.ap = null; }
  runAutoplay(t) {
    if (this.isStill || this.attr('autoplay', 'true') === 'false' || this.realSeen || this.mode !== 'board' || this.entering || this.swap) { if (this.ap) this.stopAutoplay(); return; }
    if (!this.ap) { if (t - this.lastInput > 4000) this.ap = { t0: t, i: 0 }; else return; }
    const el = t - this.ap.t0;
    while (this.ap && this.ap.i < GHOST.length && GHOST[this.ap.i][0] <= el) {
      const [, a, c] = GHOST[this.ap.i++];
      if (a === 'd') { const k = this.byCode[c]; this.pressKey(k, true); this.addTrail(k.main.toLowerCase(), true); }
      else if (a === 'u') this.releaseKey(this.byCode[c]);
      else if (a === 'md') { this.pressKey(this.byCode[this.modCodes()[0]], true); this.modHeld = true; this.ap.mod = true; }
      else if (a === 'mu') { this.releaseKey(this.byCode[this.modCodes()[0]]); this.modHeld = false; this.ap.mod = false; }
      else if (a === 'end') { this.ap = null; this.lastInput = t; }
    }
  }

  /* ---------- typed output: floating trail / paper / marquee ---------- */
  addTrail(ch, ghost) {
    const m = this.cfg.trail;
    if (m === 'paper') { if (!ghost) this.printChar(ch); return; }
    if (m === 'marquee') { this.mqAdd(ch); return; }
    const s = document.createElement('span'); s.textContent = ch;
    s.style.cssText = `display:inline-block;color:${ghost ? 'var(--ink-3)' : 'var(--ink)'};opacity:0`;
    this.trail.appendChild(s);
    while (this.trail.children.length > 28) this.trail.firstChild.remove();
    if (this.isStill) { s.style.opacity = 1; return; }
    if (this.isReduced) { s.style.opacity = 1; setTimeout(() => s.remove(), 1500); return; }
    s.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: ghost ? .7 : 1, transform: 'none' }], { duration: 140, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
    setTimeout(() => { const a = s.animate([{ opacity: ghost ? .7 : 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-18px)' }], { duration: 650, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }); a.onfinish = () => s.remove(); }, 1500);
  }
  popTrail() { const m = this.cfg.trail; if (m === 'paper') return this.printChar('⌫'); if (m === 'marquee') return this.mqAdd('⌫'); const l = this.trail.lastChild; if (l) l.remove(); }
  inkChar(ch) { return { ch, dy: (Math.random() - .5) * 2.4, a: .72 + Math.random() * .28 }; }
  colX(col) { const P = this.X.paper; return (P.W / 2 - (P.m + col * P.cw + P.cw / 2)) / P.W * 8; }
  printChar(ch) {
    const X = this.X, P = X.paper; if (!P) return; let line = P.lines[P.lines.length - 1];
    if (ch === '↵') { P.lines.push([]); if (P.lines.length > 6) P.lines = [[]]; X.carT = this.colX(0); X.carTau = .12; X.lev = 1; this.paperDraw(); return; }
    if (ch === '⌫') { line.pop(); X.carT = this.colX(line.length); X.carTau = .04; this.paperDraw(); return; }
    if (line.length >= 40) { P.lines.push([]); if (P.lines.length > 6) P.lines = [[]]; line = P.lines[P.lines.length - 1]; X.lev = 1; }
    line.push(this.inkChar(ch === '·' ? ' ' : ch)); X.carT = this.colX(line.length); X.carTau = .028; this.paperDraw();
  }
  paperDraw() {
    const P = this.X.paper; if (!P) return; const g = P.g;
    g.fillStyle = getComputedStyle(this).getPropertyValue('--kb-paper').trim() || '#FBF8F1'; g.fillRect(0, 0, P.W, P.H);
    g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(0, 0, P.W, 3);
    g.font = `${P.fs}px "Special Elite", "Courier New", monospace`; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    const n = P.lines.length;
    P.lines.forEach((ln, i) => { const y = P.H - P.base - (n - 1 - i) * P.lh; ln.forEach((c, j) => { g.globalAlpha = c.a; g.fillStyle = '#2B2723'; g.fillText(c.ch, P.m + j * P.cw, y + c.dy); }); });
    g.globalAlpha = 1; P.tex.needsUpdate = true;
  }
  mqAdd(ch) {
    const Q = this.X.mq; if (!Q) return;
    if (ch === '⌫') Q.buf = Q.buf.slice(0, -1); else Q.buf = (Q.buf + (ch === '↵' || ch === '·' ? ' ' : ch).toUpperCase()).slice(-60);
    Q.blink = -1;
    if (ch.length === 1 && /[a-z]/i.test(ch)) { this.eggBuf = (this.eggBuf + ch.toLowerCase()).slice(-6); if (this.eggBuf === 'gautam') { this.eggBuf = ''; this.hiScore(); } }
  }
  mqDraw(t) {
    const Q = this.X.mq; if (!Q) return; const g = Q.g, W = Q.W, H = Q.H;
    g.fillStyle = '#060607'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.035)'; for (let y = 0; y < H; y += 2) g.fillRect(0, y, W, 1);
    g.font = '8px "Press Start 2P", monospace'; g.textBaseline = 'middle';
    const on = Math.floor(t / 600) % 2 === 0; let s, caret = false;
    if (Q.msg && t < Q.until) s = Q.msg; else if (!Q.buf.trim()) s = on ? 'PRESS ANY KEY' : ''; else { s = Q.buf.slice(-29); caret = on; }
    g.fillStyle = this.accentStr || '#f60';
    const w = g.measureText(s).width; const x = caret ? Math.min(8, W - 14 - w) : (W - w) / 2;
    g.textAlign = 'left'; g.fillText(s, Math.round(x), H / 2 + 1);
    if (caret) g.fillRect(Math.round(x + w + 2), 12, 7, 9);
    Q.tex.needsUpdate = true;
  }
  hiScore() { const Q = this.X.mq; this.snd('hiscore'); Q.msg = 'HIGH SCORE: GAUTAM'; Q.until = this.now() + 2600; Q.blink = -1; this.emit('egg', { egg: 'highscore' }); }
  oneUp() {
    const Q = this.X.mq; if (!Q) return; this.snd('oneup'); Q.msg = '1UP!'; Q.until = this.now() + 2200; Q.blink = -1; this.emit('egg', { egg: 'konami' });
    if (this.isReduced) return;
    const p = this.vgToScreen(.9, 1.75, -3.3), cols = this.candy || ['#f60'];
    for (let i = 0; i < 44; i++) {
      const d = document.createElement('div'), s = 6 + (i % 3) * 3; d.style.cssText = `position:absolute;left:${p.x}px;top:${p.y}px;width:${s}px;height:${s}px;background:${cols[i % cols.length]}`;
      this.overlay.appendChild(d);
      const a = -Math.PI * Math.random(), sp = 120 + Math.random() * 260, dx = Math.cos(a) * sp, dy = Math.sin(a) * sp;
      d.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${dx * .7}px,${dy * .7}px)`, opacity: 1, offset: .45 }, { transform: `translate(${dx}px,${dy + 220}px)`, opacity: 0 }], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' }).onfinish = () => d.remove();
    }
    const u = document.createElement('div'); u.textContent = '1UP'; u.style.cssText = `position:absolute;left:${p.x}px;top:${p.y}px;font-family:var(--font-pixel);font-size:24px;color:var(--accent);text-shadow:0 3px 0 rgba(0,0,0,.35);transform:translate(-50%,-50%)`;
    this.overlay.appendChild(u);
    u.animate([{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-140%) scale(1)', opacity: 1, offset: .25 }, { transform: 'translate(-50%,-260%) scale(1)', opacity: 0 }], { duration: 1400, easing: 'steps(14)', fill: 'forwards' }).onfinish = () => u.remove();
  }

  /* ---------- variant feedback ---------- */
  popRing(k, ghost) {
    const T = this.T, X = this.X;
    if (!X.rings) { X.rings = []; const rg = new T.RingGeometry(.36, .45, 40); rg.rotateX(-Math.PI / 2); for (let i = 0; i < 10; i++) { const m = new T.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }); const mesh = new T.Mesh(rg, m); mesh.visible = false; this.vg.add(mesh); X.rings.push({ mesh, on: false }); } }
    const r = X.rings.find(r => !r.on) || X.rings[0];
    r.on = true; r.t0 = this.now(); r.k = k; r.base = k.by + k.hTop + .06; r.peak = ghost ? .45 : .9;
    r.mesh.material.color.copy(k.c0).lerp(new T.Color('#ffffff'), this.dark ? .15 : .55);
    r.mesh.position.set(k.cx, r.base, k.cz); r.mesh.scale.setScalar(Math.max(1, k.w * .55)); r.w = Math.max(1, k.w * .55); r.mesh.visible = true;
  }
  eject() {
    const X = this.X, c = X.casings.find(c => !c.on); if (!c) return;
    const r = Math.random; Object.assign(c, { on: true, t0: this.now(), p: [9.2, .58, -2.4], v: [4.5 + r() * 2.5, 5 + r() * 3, (r() - .5) * 2.6], rot: [r() * 6, r() * 6, r() * 6], w: [8 + r() * 10, 6 + r() * 8, 10 + r() * 10] });
    c.m.visible = true;
  }
  vUpdate(t, dt) {
    const X = this.X, v = this.vid, R = this.isReduced;
    if (X.padSheen) { X.padSheen.map.offset.set(-this.px * .32 - (this.board.rotation.y - BASE_RY) * 2, this.py * .22); }
    if (v === 'clk') {
      X.carX += (X.carT - X.carX) * (R ? 1 : 1 - Math.exp(-dt / X.carTau)); X.carriage.position.x = X.carX;
      X.lev *= Math.exp(-dt / .2); X.lever.rotation.set(-.4 - X.lev * .5, -.55 + X.lev * .35, 0);
      if (X.barT0 != null) { const e = t - X.barT0; let a; if (e < 55) a = e / 55; else if (e < 170) a = 1 - (e - 55) / 115; else { a = 0; X.barT0 = null; } X.bar.rotation.x = .9 - 3.18 * a * X.barAmp; }
    }
    if (v === 'pew') {
      X.kick *= Math.exp(-dt / .09);
      for (const c of X.casings) {
        if (!c.on) continue; const age = (t - c.t0) / 1000;
        c.v[1] -= 24 * dt; for (let i = 0; i < 3; i++) { c.p[i] += c.v[i] * dt; c.rot[i] += c.w[i] * dt; }
        c.m.position.set(...c.p); c.m.rotation.set(...c.rot);
        if (age > 1.6 || c.p[1] < -1) { c.on = false; c.m.visible = false; }
      }
    }
    if (v === '8bt') {
      const ax = (this.held.ArrowRight ? 1 : 0) - (this.held.ArrowLeft ? 1 : 0), az = (this.held.ArrowDown ? 1 : 0) - (this.held.ArrowUp ? 1 : 0), a = R ? 1 : 1 - Math.exp(-dt / .05);
      X.jx += (ax - X.jx) * a; X.jz += (az - X.jz) * a; X.stick.rotation.set(X.jz * .38, 0, -X.jx * .38);
      const Q = X.mq, b = Math.floor(t / 600) + (Q.msg && t < Q.until ? 1e6 : 0); if (b !== Q.blink) { Q.blink = b; this.mqDraw(t); }
    }
    if (X.rings) for (const r of X.rings) {
      if (!r.on) continue; const e = (t - r.t0) / 440; if (e >= 1) { r.on = false; r.mesh.visible = false; continue; }
      r.mesh.position.y = r.base + eout(e) * .6; r.mesh.scale.setScalar(r.w * (1 + eout(e) * 1.1 + (e > .82 ? (e - .82) * 3 : 0))); r.mesh.material.opacity = r.peak * Math.pow(1 - e, 1.4) * this.sv;
    }
  }

  ring(k) {
    if (this.isReduced) return; const p = this.screenOf(k); const d = document.createElement('div');
    d.style.cssText = `position:absolute;left:${p.x - 24}px;top:${p.y - 24}px;width:48px;height:48px;border-radius:50%;border:2px solid var(--accent);pointer-events:none`;
    this.overlay.appendChild(d);
    d.animate([{ transform: 'scale(.4)', opacity: 1 }, { transform: 'scale(4)', opacity: 0 }], { duration: 560, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => d.remove();
  }
  screenOf(k, lift) { const v = this.v3; v.set(0, k.hTop + (lift || 0), 0); k.cap.localToWorld(v); v.project(this.camera); return { x: (v.x + 1) / 2 * this.cw, y: (1 - v.y) / 2 * this.ch }; }
  worldToScreen(x, y, z) { const v = this.v3; v.set(x, y, z); this.board.localToWorld(v); v.project(this.camera); return { x: (v.x + 1) / 2 * this.cw, y: (1 - v.y) / 2 * this.ch }; }
  vgToScreen(x, y, z) { const v = this.v3; v.set(x, y, z); this.vg.localToWorld(v); v.project(this.camera); return { x: (v.x + 1) / 2 * this.cw, y: (1 - v.y) / 2 * this.ch }; }

  /* ---------- variant swap: sink + fade + shadow shrink, then shortened row-by-row settle ---------- */
  requestVariant(v) {
    if (!this.ready || !VCFG[v]) return;
    this.wantV = v;
    if (this.isStill) { this.rebuild(v); return; }
    if (this.mode !== 'board') return;
    if (this.entering && !this.entShort) { this.entering = false; this.caseOp = 1; }
    if (!this.swap) { if (v !== this.vid) this.swap = { phase: 'out', t0: this.now(), p0: 0 }; }
    else if (this.swap.phase === 'in' && v !== this.vid) this.swap = { phase: 'out', t0: this.now(), p0: 1 - this.sv };
  }
  updateSwap(t, R) {
    const S = this.swap; if (!S) return;
    if (S.phase === 'out') {
      const p = clamp((t - S.t0) / (R ? R_OUT : OUT_MS) + S.p0); this.sv = 1 - p;
      if (p >= 1 && !this._noRebuild) {
        this.keys.forEach(k => k.down && this.releaseKey(k)); this.ripples = [];
        this.rebuild(this.wantV); this.readColors(); this.assignPlay();
        S.phase = 'in'; S.t0 = t; this.sv = 0; this.snd('swap');
        this.beginRise(t, R);
      }
    } else {
      const p = clamp((t - S.t0) / (R ? R_IN : IN_MS)); this.sv = R ? p : clamp((t - S.t0) / 200);
      if (p >= 1) { this.swap = null; this.sv = 1; this.entering = false; if (this.wantV !== this.vid) this.requestVariant(this.wantV); }
    }
  }
  beginRise(t, R) {
    if (R) { this.keys.forEach(k => { k.started = true; k.cap.visible = true; }); return; }
    this.entering = true; this.entShort = true; this.t0 = t; this.setEntryDelays(true);
    this.keys.forEach(k => { k.started = false; k.cap.visible = false; });
  }
  previewSound() { this.snd('down', this.byCode && this.byCode.KeyJ || { w: 1, row: 3 }); }
  simulate(kind) {
    if (!this.ready || this.mode !== 'board') { if (kind === 'play' && this.mode === 'play') this.exitPlayground(); return; }
    window.__heroKbActive = this.abId; this.realInput();
    const mk = this.byCode[this.modCodes()[0]], K = this.byCode;
    clearTimeout(this._simT);
    const hold = (ms) => { this.pressKey(mk); if (!this.modHeld) this.snd('mod'); this.modHeld = true; this._simT = setTimeout(() => { this.releaseKey(mk); this.modHeld = false; }, ms); };
    if (kind === 'mod') hold(2600);
    else if (kind === 'chord') { this.pressKey(K.KeyG); this.chord = { t0: this.now() }; setTimeout(() => this.releaseKey(K.KeyG), 160); }
    else if (kind === 'palette') { hold(700); setTimeout(() => { this.pressKey(K.KeyK); this.logic('KeyK', 'k', true); setTimeout(() => this.releaseKey(K.KeyK), 140); }, 420); }
    else if (kind === 'play') { hold(900); setTimeout(() => this.enterPlayground(), 450); }
    else if (kind === 'type') { 'hello world'.split('').forEach((c, i) => setTimeout(() => { const key = c === ' ' ? K.Space : K['Key' + c.toUpperCase()]; this.pressKey(key); this.addTrail(c === ' ' ? '·' : c); setTimeout(() => this.releaseKey(key), 90); }, i * 120)); }
    else if (kind === 'konami' && this.vid === '8bt') this.oneUp();
  }
  enterPlayground() {
    if (this.mode !== 'board' || this.swap) return;
    const ent = this.byCode.Enter; this.pressKey(ent); setTimeout(() => this.releaseKey(ent), 140);
    this.stopAutoplay(); this.modHeld = false; this.chord = null; this.entering = false; this.caseOp = 1; this.keys.forEach(k => { k.started = true; k.cap.visible = true; });
    this.ripples.push({ x: ent.cx, z: ent.cz, t0: this.now(), s: 1.3, fall: 9 });
    this.keys.forEach(k => { k.from = { x: k.cx, y: k.by + k.y, z: k.cz, rx: k.pitch }; });
    this.gFrom = { ry: this.board.rotation.y, rx: this.board.rotation.x };
    this.mode = 'toPlay'; this.mT0 = this.now(); this.sentPlay = false; this.playGroup.visible = true;
    this.emit('playground-start');
  }
  exitPlayground() { if (this.mode !== 'play') return; this.keys.forEach(k => { k.y = 0; k.v = 0; }); this.mode = 'toBoard'; this.mT0 = this.now(); this.emit('playground-exit'); }

  resize() {
    const w = this.clientWidth || 1, h = this.clientHeight || 1; this.cw = w; this.ch = h;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.applyCam(this.camP);
  }
  applyCam(p) {
    const c = this.camera, ce = Math.cos(p.el);
    c.position.set(p.tx + p.dist * ce * Math.sin(p.az), p.ty + p.dist * Math.sin(p.el), p.tz + p.dist * ce * Math.cos(p.az));
    c.lookAt(p.tx, p.ty, p.tz);
    c.setViewOffset(this.cw, this.ch, p.ox * this.cw, p.oy * this.ch, this.cw, this.ch); c.updateProjectionMatrix();
  }

  applyFade() {
    const kf = this.sv, bf = this.sv * this.caseOp, on = kf < .999 || bf < .999;
    if (on !== this._fadeOn) { this._fadeOn = on; [...this.bodyMats, ...this.keyMats].forEach(m => { m.transparent = on || m.userData.t0; m.needsUpdate = true; }); }
    if (on || this._fadeDirty) {
      this.bodyMats.forEach(m => m.opacity = m.userData.o0 * bf); this.keyMats.forEach(m => m.opacity = m.userData.o0 * kf);
      this.keys.forEach(k => k.lmat.opacity = kf); this._fadeDirty = on;
    }
    this.bodyG.visible = bf > .01;
  }

  tick(noRender) {
    if (!this.scene) return;
    const t = this.now(); const dt = Math.min(0.05, Math.max(0, (t - this.last) / 1000)); this.last = t;
    const R = this.isReduced, cfg = this.cfg, v = this.vid;
    if (this.entering) {
      const el = t - this.t0, sh = this.entShort;
      if (!sh) this.caseOp = clamp(el / 320);
      this.keys.forEach(k => { if (!k.started && el >= k.delay) { k.started = true; k.cap.visible = true; k.y = sh ? .6 : 1.1; k.v = 0; k.dropping = true; } if (k.dropping && el > k.delay + (sh ? 380 : 650)) k.dropping = false; });
      this.sweepX = !sh && el > 820 ? lerp(-10, 10, clamp((el - 820) / 420)) : null;
      if (el > (sh ? 820 : 1300)) { this.entering = false; this.sweepX = null; this.caseOp = 1; this.keys.forEach(k => { k.started = true; k.cap.visible = true; }); }
    }
    this.updateSwap(t, R);
    this.runAutoplay(t);
    if (this.chord && t - this.chord.t0 > 1500) this.chord = null;

    if (this.mode === 'board') {
      const a = R ? 0 : 1 - Math.exp(-dt / 0.18);
      this.px += ((R ? 0 : this.ptx) - this.px) * a; this.py += ((R ? 0 : this.pty) - this.py) * a;
      const sway = R || this.isStill ? 0 : Math.sin(t / 7000 * Math.PI * 2) * .014;
      this.board.rotation.y = BASE_RY + this.px * 0.05 + sway; this.board.rotation.x = this.py * 0.03 + (R || this.isStill ? 0 : Math.sin(t / 9000 * Math.PI * 2) * .004);
    }
    const S = this.swap, sv = this.sv;
    const sink = S && !R ? (S.phase === 'out' ? -1.25 * eio(1 - sv) : -.45 * (1 - eout(sv))) : 0;
    this.vg.position.set(cfg.pos[0], sink, cfg.pos[2] - (this.X.kick || 0) * .06);

    let hov = null;
    if (this.pointer && this.mode === 'board' && !S) {
      const r = this.canvas.getBoundingClientRect();
      this.ndc.set(((this.pointer.x - r.left) / r.width) * 2 - 1, -((this.pointer.y - r.top) / r.height) * 2 + 1);
      this.raycaster.setFromCamera(this.ndc, this.camera);
      const hit = this.raycaster.intersectObjects(this.capMeshes, false)[0]; hov = hit ? hit.object.userData.k : null;
    }
    if (hov !== this.hoverKey) { this.hoverKey = hov; if (!this.isStill) this.canvas.style.cursor = hov ? 'pointer' : 'default'; }

    const modA = this.modHeld && this.mode === 'board', chA = !!this.chord && this.mode === 'board';
    const la = 1 - Math.exp(-dt / 0.09), C = this.C;
    this.ripples = this.ripples.filter(rp => t - rp.t0 < 2400);
    const breath = 0.22 + 0.16 * Math.sin((t / 3200) * Math.PI * 2);
    const sub = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / sub;
    const morph = this.mode !== 'board', mods = this.modCodes(), trav = cfg.travel, bouncy = v === 'pop';
    const glowF = this.glowK * cfg.glow * sv * this.caseOp;
    for (const k of this.keys) {
      const isMod = mods.includes(k.code);
      const litT = ((modA && MOD_LIT.includes(k.code)) || (modA && isMod && k.down) || (chA && CHORD_LIT.includes(k.code))) ? 1 : 0;
      const dimT = (modA || chA) && !litT && !(isMod && modA) ? 1 : 0;
      k.lit += (litT - k.lit) * la; k.dim += (dimT - k.dim) * la;
      let tgt = 0;
      if (!R) { if (k.down) tgt = k.ghost ? -trav * .7 : -trav; else tgt = k.lit * (v === 'tik' ? .1 : .17) - k.dim * 0.03 + (k === hov ? 0.035 : 0); }
      let K, D;
      if (k.dropping) { K = 460; D = 22; } else if (k.down) { K = v === 'clk' ? 1500 : 2400; D = v === 'clk' ? 72 : 98; } else if (t - k.relT < 450) { K = bouncy ? 700 : 900; D = bouncy ? 13 : 40; } else { K = 320; D = 26; }
      if (R) { k.y = tgt; k.v = 0; } else if (k.started) for (let s = 0; s < sub; s++) { const acc = -K * (k.y - tgt) - D * k.v; k.v += acc * h; k.y += k.v * h; }
      if (!k.down) k.self *= Math.exp(-dt / 0.5);
      k.flash *= Math.exp(-dt / 0.28);
      let gl = k.self;
      for (const rp of this.ripples) {
        const d = Math.hypot(k.cx - rp.x, k.cz - rp.z); if (d < 0.2) continue;
        const lt = (t - rp.t0) - d * 30; if (lt <= 0) continue;
        gl += rp.s * Math.exp(-d / rp.fall) * Math.exp(-lt / 500) * Math.min(1, lt / 40);
      }
      if (k.code === 'Enter' && !modA && !chA && !R) gl = Math.max(gl, breath);
      gl = Math.min(1, gl); k.glowV = gl;
      const sw = this.sweepX == null ? 0 : Math.exp(-Math.pow((k.cx - this.sweepX) / 1.2, 2));
      this.tmpC.copy(k.c0).lerp(C.acc, k.lit).multiplyScalar(1 - this.dimK * k.dim);
      k.mat.color.copy(this.tmpC);
      if (v === '8bt') k.mat.emissive.copy(k.lit > .02 ? C.acc : k.c0).multiplyScalar(gl * 1.1 * this.emisK + (this.dark ? .07 : 0) + k.lit * .2).addScalar(sw * .05);
      else k.mat.emissive.copy(C.accent).multiplyScalar(gl * this.emisK * (k.kind === 'accent' ? 0.5 : 1) * (v === 'tik' ? .4 : 1)).addScalar(sw * 0.06);
      if (v === 'tik') {
        const bl = this.dark ? Math.min(1, gl * 1.25) : gl * .45;
        this.tmpC2.copy(k.l0).lerp(C.legAcc, k.lit).lerp(this.dark ? C.accent : C.accentText, bl * (1 - k.lit)).lerp(k.c0, k.dim * .35);
        if (this.dark) this.tmpC2.multiplyScalar(1 + bl * .5);
      } else this.tmpC2.copy(k.l0).lerp(C.legAcc, k.lit).lerp(C.accentText, Math.min(1, k.flash * 0.75 + sw * 0.6) * (1 - k.lit) * (k.kind === 'accent' ? 0 : 1)).lerp(k.c0, k.dim * 0.35);
      k.lmat.color.copy(this.tmpC2);
      k.gmat.opacity = gl * glowF;
      if (!morph) {
        k.cap.position.set(k.cx, k.by + k.y, k.cz); k.cap.rotation.set(k.pitch, 0, 0);
        if (bouncy && !R) { const q = clamp(-k.y / trav, -1, 1.2); k.cap.scale.set(1 + .1 * q, 1 - .26 * q, 1 + .1 * q); } else k.cap.scale.set(1, 1, 1);
      }
      if (k.labelEl) {
        const show = morph ? 0 : k.lit * sv;
        if (show > 0.02) { const p = this.screenOf(k, 0.55); k.labelEl.style.opacity = show.toFixed(3); k.labelEl.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-100%) translateY(${((1 - show) * 8).toFixed(1)}px)`; }
        else if (k.labelEl.style.opacity !== '0') k.labelEl.style.opacity = '0';
      }
    }
    if (this.X.guard) this.X.guard.rotation.x = -1.18 + (this.byCode.Escape.down ? .08 : 0);
    if (morph) this.updateMorph(t, R);
    this.vUpdate(t, dt);
    this.contactMat.opacity = this.contactOp * this.caseOp * sv; const cs = .55 + .45 * sv; this.contact.scale.x = (cfg.foot[0] * cfg.fit + 4.4) / 21 * cs; this.contact.scale.y = (cfg.foot[1] * cfg.fit + 3.7) / 10.5 * cs;
    this.applyFade();
    this.sheenMat.opacity = this.sheenBase * this.caseOp * sv; this.sheenMat.map.offset.x = clamp(-(this.board.rotation.y - BASE_RY) * 11, -.9, .9);
    if (this.mode === 'board' && cfg.trail === 'dom') { const p = this.vgToScreen(0.6, 2.4, this.minZ - 1.5); this.trail.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-50%)`; this.trail.style.opacity = String(sv); }
    else this.trail.style.opacity = '0';
    if (!noRender) this.renderer.render(this.scene, this.camera);
  }

  updateMorph(t, R) {
    const el = R ? 1e6 : t - this.mT0, toPlay = this.mode === 'toPlay' || this.mode === 'play';
    const ct = eio(clamp((el - 150) / 1150));
    const A0 = toPlay ? CAM_BOARD : CAM_PLAY, B0 = toPlay ? CAM_PLAY : CAM_BOARD;
    if (this.mode === 'toPlay' || this.mode === 'toBoard') {
      for (const n in A0) this.camP[n] = lerp(A0[n], B0[n], ct);
      this.applyCam(this.camP);
      this.board.rotation.y = toPlay ? lerp(this.gFrom.ry, 0, ct) : lerp(0, BASE_RY, ct);
      this.board.rotation.x = toPlay ? lerp(this.gFrom.rx, 0, ct) : 0;
      this.caseOp = toPlay ? 1 - clamp((el - 200) / 500) : clamp((el - 1250) / 450);
    }
    const lineA = toPlay ? clamp((el - 1450) / 380) : 1 - clamp(el / 220);
    this.lineMat.opacity = lineA * 0.55;
    for (const k of this.keys) {
      const p = this.mode === 'play' ? 1 : eio(clamp((el - (260 + k.order * 8)) / 820));
      const e = toPlay ? p : 1 - p;
      const back = { x: k.cx, y: k.by, z: k.cz, rx: k.pitch }, a0 = toPlay ? (k.from || back) : back, to = k.play;
      const arc = Math.sin(Math.PI * e) * 2.2 * (R ? 0 : 1);
      k.cap.position.set(lerp(a0.x, to.x, e), lerp(a0.y, to.y, e) + arc, lerp(a0.z, to.z, e));
      k.cap.rotation.set(lerp(a0.rx, 0, e), 0, 0);
      k.cap.scale.set(lerp(1, to.sx, e), lerp(1, to.sy, e), lerp(1, to.sz, e));
      k.cap.visible = !(to.hide && e > 0.97);
    }
    for (const b of this.playBlocks) {
      if (lineA > 0.01) { const s = this.worldToScreen(b.x, b.y, b.z); b.el.style.opacity = lineA.toFixed(3); b.el.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-100%)`; }
      else b.el.style.opacity = '0';
    }
    const total = 260 + this.keys.length * 8 + 820;
    if (this.mode === 'toPlay' && !this.sentPlay && el > 1350) { this.sentPlay = true; this.emit('playground'); }
    if (el >= total + 60) {
      if (this.mode === 'toPlay') this.mode = 'play';
      else if (this.mode === 'toBoard') {
        this.mode = 'board'; this.caseOp = 1; this.playGroup.visible = false; Object.assign(this.camP, CAM_BOARD); this.applyCam(this.camP);
        this.keys.forEach(k => { k.from = null; k.cap.visible = true; }); this.lastInput = this.now(); this.emit('board');
        if (this.wantV && this.wantV !== this.vid) this.requestVariant(this.wantV);
      }
    }
  }

  /* ---------- still frames ---------- */
  async renderStill() {
    if (this._dead || !this.scene) return;
    const T = this.T; this.vt = 0; this.last = 0;
    if (this.vAttr() !== this.vid) this.rebuild(this.vAttr());
    this.readColors(); this.assignPlay();
    const pose = this.attr('still', 'rest');
    this.cw = this.clientWidth || 1440; this.ch = this.clientHeight || 900;
    this.camera.aspect = this.cw / this.ch; this.applyCam(this.camP);
    this.entering = false; this.caseOp = 1; this.keys.forEach(k => { k.started = true; k.cap.visible = true; });
    const adv = ms => { const end = this.vt + ms; while (this.vt < end) { this.vt += 16; this.tick(true); } };
    const K = this.byCode, mk = K[this.modCodes()[0]];
    const tap = (k, hold) => { this.pressKey(k); this.addTrail(this.charOf(k)); adv(hold || 70); this.releaseKey(k); adv(55); };
    adv(500);
    if (pose === 'mod') { this.pressKey(mk); this.modHeld = true; adv(700); }
    else if (pose === 'chord') { tap(K.KeyG); this.chord = { t0: this.vt }; adv(400); }
    else if (pose === 'press') { ['KeyH', 'KeyE', 'KeyL', 'KeyL'].forEach(c => tap(K[c])); this.pressKey(K.KeyO); this.addTrail('o'); adv(this.vid === 'pew' ? 70 : 110); }
    else if (pose.startsWith('sink:')) { const p = clamp(parseFloat(pose.slice(5)) || 0, 0, .999); this._noRebuild = true; this.swap = { phase: 'out', t0: this.vt, p0: 0 }; adv(Math.max(16, p * OUT_MS)); }
    else if (pose.startsWith('rise:')) { const p = clamp(parseFloat(pose.slice(5)) || 0); this.swap = { phase: 'in', t0: this.vt }; this.sv = 0; this.beginRise(this.vt, false); adv(Math.max(16, p * IN_MS)); }
    else adv(200);
    const R = this.renderer; R.setPixelRatio(1); R.setSize(this.cw, this.ch, false);
    R.setClearColor(new T.Color(getComputedStyle(this).getPropertyValue('--bg').trim() || '#000'), 1);
    R.render(this.scene, this.camera);
    const blob = await new Promise(r => R.domElement.toBlob(r, 'image/jpeg', .9));
    R.setClearColor(0, 0);
    if (blob && !this._dead) this.img.src = URL.createObjectURL(blob);
    this.disposeScene();
  }
  disposeScene() {
    if (!this.scene) return;
    this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); });
    if (this.key && this.key.shadow && this.key.shadow.map) this.key.shadow.map.dispose();
    this.scene = null;
  }
}
['theme', 'os', 'reduced', 'autoplay', 'ab', 'variant', 'muted', 'still'].forEach(n => Object.defineProperty(HeroKeyboard.prototype, n, { configurable: true, get() { return this._p[n]; }, set(v) { this._p[n] = v; this.attributeChangedCallback(n); } }));
customElements.define('hero-keyboard', HeroKeyboard);
})();
