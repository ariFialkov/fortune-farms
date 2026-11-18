// WebAudio synth — every sound is generated, no audio assets.
let ac = null, master = null, echo = null;
export const audio = { muted: false };

function ctx() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    master.gain.value = 0.9;
    master.connect(ac.destination);
    // a short feedback delay gives chimes a bit of sparkle and space
    const d = ac.createDelay(), fb = ac.createGain();
    d.delayTime.value = 0.14; fb.gain.value = 0.3;
    echo = ac.createGain(); echo.gain.value = 0.4;
    echo.connect(d); d.connect(fb); fb.connect(d); d.connect(master);
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function tone(type, f0, f1, dur, vol, when = 0, wet = false) {
  const t = ac.currentTime + when;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(master);
  if (wet) g.connect(echo);
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  o.connect(g);
  o.start(t); o.stop(t + dur + 0.03);
}
function noise(dur, vol, when = 0, f0 = 1400, f1 = f0, type = 'lowpass') {
  const t = ac.currentTime + when;
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource(); src.buffer = buf;
  const f = ac.createBiquadFilter(); f.type = type; f.Q.value = type === 'bandpass' ? 1.4 : 0.7;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t); src.stop(t + dur + 0.03);
}
const hz = (semi, base = 523.25) => base * 2 ** (semi / 12);
const LADDER = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];   // pentatonic: quick wins climb the scale
let ladder = 0, lastPop = 0, lastCoin = 0;

const SIMPLE = {
  click: () => tone('square', 520, 520, 0.04, 0.05),
  tick: () => tone('sine', 1200, 1500, 0.04, 0.035),
  miss: () => tone('sine', 220, 110, 0.14, 0.07),
  crack: () => { tone('sawtooth', 300, 80, 0.1, 0.06); noise(0.08, 0.06, 0, 3000, 800); },
  thud: () => tone('sine', 160, 70, 0.1, 0.1),
  thump: () => { tone('sine', 110, 50, 0.22, 0.14); noise(0.12, 0.04, 0, 500, 200); },
  pump: () => { tone('square', 180, 320, 0.3, 0.035); noise(0.25, 0.03, 0.05, 900, 2400, 'bandpass'); },
  cluck: () => { tone('square', 700, 420, 0.07, 0.03); tone('square', 820, 500, 0.06, 0.025, 0.08); },
  oink: () => tone('sawtooth', 240, 150, 0.14, 0.045),
  splash: () => noise(0.35, 0.1, 0, 2600, 500),
  wind: () => noise(1.7, 0.07, 0, 500, 1800, 'bandpass'),
  rumble: () => { tone('sawtooth', 55, 40, 1.8, 0.13); noise(1.6, 0.06, 0, 220, 120); },
  squish: () => noise(0.13, 0.07, 0, 900, 400),
  pour: () => tone('sine', 500, 300, 0.5, 0.04),
  engine: () => { tone('sawtooth', 62, 74, 1.4, 0.045); tone('square', 31, 37, 1.4, 0.03); },
  whoosh: () => noise(0.45, 0.07, 0, 300, 3200, 'bandpass'),
  start: () => { [0, 4, 7, 12].forEach((s, i) => tone('triangle', hz(s, 392), hz(s, 392), 0.16, 0.09, i * 0.06, true)); noise(0.4, 0.05, 0, 400, 4000, 'bandpass'); },
  ff: () => { tone('square', 660, 990, 0.08, 0.05); tone('square', 880, 1320, 0.08, 0.05, 0.07); },
  profit: () => { [0, 7, 12, 16].forEach((s, i) => tone('triangle', hz(s, 659), hz(s, 659), 0.22, 0.1, i * 0.07, true)); tone('sine', 1975, 2637, 0.3, 0.04, 0.28, true); },
  combo: () => { [0, 5, 9, 12, 17, 21].forEach((s, i) => tone('square', hz(s), hz(s), 0.2, 0.045, i * 0.07, true)); noise(0.5, 0.04, 0, 600, 5000, 'bandpass'); },
  collect: () => { tone('triangle', 660, 660, 0.18, 0.09, 0, true); tone('triangle', 880, 880, 0.25, 0.09, 0.1, true); },
  lose: () => { tone('triangle', 330, 311, 0.25, 0.07); tone('triangle', 262, 233, 0.4, 0.07, 0.2); },
  win: () => [0, 4, 7, 12, 16].forEach((s, i) => tone('triangle', hz(s), hz(s), 0.3, 0.1, i * 0.09, true)),
  bigwin: () => { [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone('triangle', hz(s), hz(s), 0.4, 0.1, i * 0.08, true)); [0, 4, 7].forEach((s) => tone('sawtooth', hz(s, 261), hz(s, 261), 1.0, 0.035, 0.56)); tone('sine', 65, 45, 0.7, 0.16, 0.56); },
};

export function sfx(name, tier = 0) {
  if (audio.muted) return;
  try {
    ctx();
    const now = ac.currentTime;
    if (name === 'pop') {
      // every prize: a pluck that climbs the scale while wins keep coming
      ladder = now - lastPop < 0.75 ? Math.min(ladder + 1, LADDER.length - 1) : 0;
      lastPop = now;
      const f = hz(LADDER[ladder]);
      if (tier === 0) { tone('triangle', f, f * 1.01, 0.13, 0.085); tone('sine', f * 4, f * 4, 0.05, 0.02, 0.01); }
      else if (tier === 1) {            // Fine: glassy two-note chime with a sparkle tail
        tone('sine', f, f, 0.5, 0.11, 0, true); tone('sine', f * 1.5, f * 1.5, 0.55, 0.09, 0.09, true);
        [24, 28, 31].forEach((s, i) => tone('sine', hz(s), hz(s), 0.12, 0.03, 0.2 + i * 0.05, true));
      } else if (tier === 2) {          // Rare: riser, arpeggio and a low hit
        noise(0.5, 0.07, 0, 500, 6000, 'bandpass');
        [0, 3, 7, 10, 12, 15, 19].forEach((s, i) => tone('triangle', hz(s, 440), hz(s, 440), 0.3, 0.09, 0.12 + i * 0.07, true));
        tone('sine', 90, 50, 0.6, 0.18, 0.1);
        [0, 7].forEach((s) => tone('sawtooth', hz(s, 220), hz(s, 220), 0.9, 0.03, 0.6));
      } else {                          // Legendary: full fanfare
        noise(0.7, 0.08, 0, 300, 8000, 'bandpass');
        tone('sine', 70, 40, 1.0, 0.22, 0.05);
        [0, 4, 7, 12, 16, 19, 24, 28, 31, 36].forEach((s, i) => tone('triangle', hz(s, 392), hz(s, 392), 0.45, 0.1, 0.1 + i * 0.075, true));
        [0, 4, 7, 12].forEach((s) => tone('sawtooth', hz(s, 196), hz(s, 196), 1.6, 0.035, 0.85));
        [36, 40, 43, 48].forEach((s, i) => tone('sine', hz(s, 392), hz(s, 392), 0.25, 0.03, 1.0 + i * 0.11, true));
      }
    } else if (name === 'coin') {       // coins landing in the win meter (rate-limited)
      if (now - lastCoin < 0.045) return;
      lastCoin = now;
      tone('square', 1568 + tier * 180, 2093 + tier * 180, 0.05, 0.022);
    } else SIMPLE[name]?.();
  } catch { /* audio unavailable */ }
}
