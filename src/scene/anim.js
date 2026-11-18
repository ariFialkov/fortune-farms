// Tiny animation runtime: a scaled game clock, promise-based waits and tweens.
export const clock = { speed: 1, t: 0 };
const tickers = new Set();

export function update(dtReal) {
  const dt = Math.min(dtReal, 0.1) * clock.speed;
  clock.t += dt;
  for (const fn of tickers) if (fn(dt, clock.t) === false) tickers.delete(fn);
}
export function ticker(fn) { tickers.add(fn); return () => tickers.delete(fn); }

export const ease = {
  linear: (k) => k,
  in: (k) => k * k,
  out: (k) => 1 - (1 - k) * (1 - k),
  inOut: (k) => (k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k)),
  back: (k) => 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2),
  bounce: (k) => {
    const n = 7.5625, d = 2.75;
    if (k < 1 / d) return n * k * k;
    if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75;
    if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375;
    return n * (k -= 2.625 / d) * k + 0.984375;
  },
};

export const wait = (sec) => new Promise((res) => {
  let t = 0;
  ticker((dt) => { if ((t += dt) >= sec) { res(); return false; } });
});

// fn(easedK, rawK) is called every frame, k from 0..1
export const tween = (dur, fn, e = ease.inOut) => new Promise((res) => {
  let t = 0;
  fn(e(0), 0);
  ticker((dt) => {
    t += dt;
    const k = Math.min(t / dur, 1);
    fn(e(k), k);
    if (k >= 1) { res(); return false; }
  });
});

const lerp = (a, b, k) => a + (b - a) * k;

export function moveTo(obj, to, dur, e = ease.inOut) {
  const from = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
  const t = { ...from, ...to };
  return tween(dur, (k) => obj.position.set(lerp(from.x, t.x, k), lerp(from.y, t.y, k), lerp(from.z, t.z, k)), e);
}

export function scaleTo(obj, s, dur, e = ease.back) {
  const from = obj.scale.x;
  return tween(dur, (k) => obj.scale.setScalar(Math.max(0.0001, lerp(from, s, k))), e);
}

// Cartoon walk: face the travel direction and hop along. Models face +X.
export function walkTo(obj, x, z, speed = 4, hop = 0.18) {
  const fx = obj.position.x, fz = obj.position.z, y0 = obj.userData.baseY ?? 0;
  const dist = Math.hypot(x - fx, z - fz);
  if (dist < 0.01) return Promise.resolve();
  obj.rotation.y = Math.atan2(-(z - fz), x - fx);
  const hops = Math.max(1, Math.round(dist / 0.8));
  return tween(dist / speed, (k) => {
    obj.position.set(lerp(fx, x, k), y0 + Math.abs(Math.sin(k * hops * Math.PI)) * hop, lerp(fz, z, k));
  }, ease.linear);
}

// Parabolic toss from current position to target.
export function arcTo(obj, to, dur, height = 1.5) {
  const f = obj.position.clone();
  return tween(dur, (k) => {
    obj.position.set(lerp(f.x, to.x, k), lerp(f.y, to.y, k) + Math.sin(k * Math.PI) * height, lerp(f.z, to.z, k));
  }, ease.linear);
}

export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
