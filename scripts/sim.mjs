// RTP verification: analytic checks for every variant + Monte Carlo confirmation.
import { RTP, SECTORS, CORE, ALL } from '../src/math/data.js';
import { plan, resolve, rollRound, MODES } from '../src/math/engine.js';

let seed = 0x9e3779b9;
const rng = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const verbose = process.argv.includes('-v');
let failed = false;
const check = (ok, msg) => { if (!ok) { failed = true; console.error('FAIL', msg); } };

// 1. every sector/upgrade standalone: analytic EV == RTP * stake
for (const sid of ALL) {
  const ups = SECTORS[sid].upgrades || [{}];
  ups.forEach((u, ui) => {
    const m = resolve(sid, { [sid]: ui });
    const ev = m.groups.reduce((s, g) => s + g.n * g.entries.reduce((a, e) => a + e.p * (e.prize?.v || 0), 0), 0) * m.valueMult;
    check(Math.abs(ev / m.stake - RTP) < 1e-9, `${sid}/${u.id} analytic RTP ${ev / m.stake}`);
    if (verbose) console.log(sid.padEnd(10), (u.id || '-').padEnd(7), 'q=' + m.groups.map((g) => g.q.toFixed(3)).join(','), 'rtp=' + (ev / m.stake).toFixed(4));
  });
}

// 2. every upgrade combination in both circuit modes: analytic total RTP == RTP
const upCounts = CORE.map((s) => SECTORS[s].upgrades.length);
const allUps = [];
(function rec(i, cur) {
  if (i === CORE.length) return allUps.push({ ...cur });
  for (let u = 0; u < upCounts[i]; u++) rec(i + 1, { ...cur, [CORE[i]]: u });
})(0, {});
let kMin = 1, kMax = 0;
for (const mode of Object.values(MODES)) {
  for (const ups of allUps) {
    const pl = plan(mode.sectors, ups);
    check(Math.abs(pl.rtp - RTP) < 1e-6, `${mode.id} ${JSON.stringify(ups)} rtp=${pl.rtp}`);
    kMin = Math.min(kMin, pl.k); kMax = Math.max(kMax, pl.k);
  }
}
check(kMin > 0.75, `combo share too large (k min ${kMin})`);
console.log(`circuit k range: ${kMin.toFixed(4)} .. ${kMax.toFixed(4)} (combos carry ${((1 - kMax) * 96).toFixed(1)}%..${((1 - kMin) * 96).toFixed(1)}% of RTP)`);
if (verbose) {
  for (const [label, ups] of [['all std', {}], ['all max', { crops: 2, dairy: 1, poultry: 1, slaughter: 2, orchard: 1 }]]) {
    const pl = plan(ALL, ups);
    console.log(`farm ${label}: k=${pl.k.toFixed(4)}`);
    pl.combos.forEach((c, i) => console.log('  ', c.name.padEnd(18), 'P=' + pl.probs[i].toFixed(5), 'rtp=' + (pl.probs[i] * c.bonus * 100).toFixed(2) + '%'));
  }
}

// 3. Monte Carlo confirmation
const N = +(process.env.N || 400000);
const mc = (label, ids, ups) => {
  let stake = 0, win = 0, hits = 0, max = 0;
  for (let i = 0; i < N; i++) {
    const r = rollRound(ids, 100, ups, rng);
    stake += r.totalStake; win += r.totalWin;
    if (r.totalWin >= r.totalStake) hits++;
    max = Math.max(max, r.totalWin / r.totalStake);
  }
  const rtp = win / stake;
  console.log(`${label.padEnd(28)} MC RTP ${(rtp * 100).toFixed(2)}%  win>=stake ${(hits / N * 100).toFixed(1)}%  max x${max.toFixed(0)}`);
  check(Math.abs(rtp - RTP) < 0.03, `${label} MC RTP ${rtp}`);
};
for (const sid of ALL) mc(sid, [sid], {});
mc('harvest (std)', CORE, {});
mc('farm (std)', ALL, {});
mc('farm (all upgrades)', ALL, { crops: 2, dairy: 1, poultry: 1, slaughter: 2, orchard: 1 });

console.log(failed ? 'RTP CHECKS FAILED' : 'All RTP checks passed');
process.exit(failed ? 1 : 0);
