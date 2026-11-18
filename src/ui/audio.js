// Tiny WebAudio synth — no audio assets needed.
let ac = null;
export const audio = { muted: false };
const S = {
  click: ['square', 520, 520, 0.04, 0.05], start: ['triangle', 330, 660, 0.25, 0.12], tick: ['sine', 1200, 1500, 0.04, 0.04],
  miss: ['sine', 220, 110, 0.14, 0.08], crack: ['sawtooth', 300, 80, 0.1, 0.07], thud: ['sine', 160, 70, 0.1, 0.1],
  thump: ['sine', 110, 50, 0.22, 0.14], pump: ['square', 180, 320, 0.3, 0.04], cluck: ['square', 700, 420, 0.07, 0.035],
  oink: ['sawtooth', 240, 150, 0.14, 0.05], splash: ['noise', 0, 0, 0.3, 0.1], wind: ['noise', 0, 0, 1.6, 0.07],
  rumble: ['sawtooth', 55, 40, 1.8, 0.14], squish: ['noise', 0, 0, 0.12, 0.07], pour: ['sine', 500, 300, 0.5, 0.04],
  engine: ['sawtooth', 70, 85, 1.4, 0.04], collect: ['triangle', 660, 1320, 0.22, 0.1],
};
function tone(type, f0, f1, dur, vol, when = 0) {
  const t = ac.currentTime + when;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(ac.destination);
  let src;
  if (type === 'noise') {
    const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1400;
    src.connect(f); f.connect(g);
  } else {
    src = ac.createOscillator();
    src.type = type;
    src.frequency.setValueAtTime(f0, t);
    src.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    src.connect(g);
  }
  src.start(t); src.stop(t + dur + 0.02);
}
export function sfx(name, tier = 0) {
  if (audio.muted) return;
  try {
    ac ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    if (name === 'pop') {
      const base = [660, 784, 988, 1175, 1319][tier];
      tone('triangle', base, base * 1.5, 0.12, 0.09);
      if (tier >= 2) [0, 4, 7, 12, 16].slice(0, tier + 2).forEach((s, i) => tone('triangle', base * 2 ** (s / 12), base * 2 ** (s / 12), 0.22, 0.09, 0.08 + i * 0.08));
    } else if (name === 'combo') [0, 5, 9, 12, 17].forEach((s, i) => tone('square', 523 * 2 ** (s / 12), 523 * 2 ** (s / 12), 0.2, 0.05, i * 0.07));
    else if (S[name]) tone(...S[name]);
  } catch { /* audio unavailable */ }
}
