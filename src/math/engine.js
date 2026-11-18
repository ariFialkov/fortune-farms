// Outcome engine. A round's full result is determined up-front (before any
// animation plays) from probability tables that are solved analytically so that
// expected return == RTP * stake, for every sector, upgrade and bet mode.
import { RTP, SECTORS, COMBOS, CORE, ALL, tierOf } from './data.js';

export const cryptoRng = () => {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] / 4294967296;
};

export const upgradeOf = (sid, upgrades) => (SECTORS[sid].upgrades ? SECTORS[sid].upgrades[upgrades?.[sid] ?? 0] : { id: 'std', stake: 1 });
export const stakeMultOf = (sid, upgrades) => upgradeOf(sid, upgrades).stake;

// Resolve a sector into per-slot probabilities. k scales the sector's return
// (k < 1 in circuit modes, where combos carry the remaining share of RTP).
export function resolve(sid, upgrades, k = 1) {
  const u = upgradeOf(sid, upgrades);
  const m = SECTORS[sid].model(u);
  const groups = m.groups.map((g) => {
    const target = (RTP * k * u.stake * (g.share ?? 1)) / (m.valueMult * g.n);
    const W = g.table.reduce((s, p) => s + p.w, 0);
    const E = g.table.reduce((s, p) => s + p.w * p.v, 0) / W;
    const f = g.filler ? g.filler.v : 0;
    const q = (target - f) / (E - f);
    if (!(q > 0 && q <= 1)) throw new Error(`Unsolvable table for ${sid}/${u.id}: q=${q}`);
    const entries = g.table.map((p) => ({ prize: p, p: (q * p.w) / W }));
    entries.push({ prize: g.filler, p: 1 - q });
    return { n: g.n, q, entries };
  });
  return { id: sid, upgrade: u, stake: u.stake, valueMult: m.valueMult, groups };
}

function rollSector(model, bet, rng) {
  const slots = [];
  let win = 0;
  model.groups.forEach((g, gi) => {
    for (let i = 0; i < g.n; i++) {
      let r = rng();
      let prize = g.entries[g.entries.length - 1].prize;
      for (const e of g.entries) {
        if ((r -= e.p) < 0) { prize = e.prize; break; }
      }
      let value = prize ? Math.round(prize.v * model.valueMult * bet) : 0, tier = prize ? prize.tier : 0, litres;
      if (prize?.range) {
        // continuous prize: draw the amount inside its band (mean == table value, so RTP is unchanged)
        litres = Math.round((prize.range[0] + rng() * (prize.range[1] - prize.range[0])) * 100) / 100;
        value = Math.round(litres * prize.rate * model.valueMult * bet);
        tier = tierOf(litres * prize.rate);
      }
      win += value;
      slots.push({ g: gi, prize, value, tier, litres });
    }
  });
  return { id: model.id, upgrade: model.upgrade, stake: model.stake * bet, slots, win };
}

// Exact probability that every need of a combo is met, given resolved models.
// Needs on different (sector, group) pairs are independent; needs sharing a
// group are handled jointly with a small DP over capped counts.
function comboProb(combo, models) {
  const byGroup = new Map();
  for (const nd of combo.needs) {
    const key = nd.sector + ':' + nd.g;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(nd);
  }
  let prob = 1;
  for (const needs of byGroup.values()) {
    const g = models[needs[0].sector].groups[needs[0].g];
    // collapse entries into categories by which needs they satisfy (bitmask)
    const cat = new Map();
    for (const e of g.entries) {
      let mask = 0;
      if (e.prize) needs.forEach((nd, i) => { if (nd.test(e.prize)) mask |= 1 << i; });
      cat.set(mask, (cat.get(mask) || 0) + e.p);
    }
    let states = new Map([[needs.map(() => 0).join(','), 1]]);
    for (let s = 0; s < g.n; s++) {
      const next = new Map();
      for (const [key, pr] of states) {
        const counts = key.split(',').map(Number);
        for (const [mask, p] of cat) {
          const c = counts.map((v, i) => (mask & (1 << i) ? Math.min(v + 1, needs[i].min) : v)).join(',');
          next.set(c, (next.get(c) || 0) + pr * p);
        }
      }
      states = next;
    }
    prob *= states.get(needs.map((nd) => nd.min).join(',')) || 0;
  }
  return prob;
}

const comboMet = (combo, bySector) =>
  combo.needs.every((nd) => bySector[nd.sector].slots.filter((s) => s.g === nd.g && s.prize && nd.test(s.prize)).length >= nd.min);

const planCache = new Map();

// Build the probability plan for a set of sectors with given upgrades.
export function plan(sectorIds, upgrades = {}) {
  const key = sectorIds.join(',') + '|' + sectorIds.map((s) => upgrades[s] ?? 0).join('');
  if (planCache.has(key)) return planCache.get(key);
  const combos = sectorIds.length > 1 ? COMBOS.filter((c) => c.needs.every((n) => sectorIds.includes(n.sector))) : [];
  const build = (k) => {
    const models = Object.fromEntries(sectorIds.map((s) => [s, resolve(s, upgrades, k)]));
    const probs = combos.map((c) => comboProb(c, models));
    const comboRtp = probs.reduce((s, p, i) => s + p * combos[i].bonus, 0);
    return { k, models, probs, comboRtp };
  };
  let res = build(1);
  if (combos.length) {
    // solve k*RTP + comboRtp(k) == RTP by bisection
    let lo = 0.6, hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      res = build(mid);
      if (mid * RTP + res.comboRtp > RTP) hi = mid; else lo = mid;
    }
  }
  const stakeMult = sectorIds.reduce((s, id) => s + stakeMultOf(id, upgrades), 0);
  const out = { ...res, sectorIds, combos, stakeMult, rtp: res.k * RTP + res.comboRtp };
  planCache.set(key, out);
  return out;
}

export const MODES = {
  harvest: { id: 'harvest', name: 'Roll Harvest', sectors: CORE },
  farm: { id: 'farm', name: 'Run the Farm', sectors: ALL },
};

export const roundCost = (sectorIds, bet, upgrades) => sectorIds.reduce((s, id) => s + stakeMultOf(id, upgrades), 0) * bet;

// Determine the complete outcome of a round.
export function rollRound(sectorIds, bet, upgrades = {}, rng = cryptoRng) {
  const pl = plan(sectorIds, upgrades);
  const sectors = sectorIds.map((id) => rollSector(pl.models[id], bet, rng));
  const bySector = Object.fromEntries(sectors.map((s) => [s.id, s]));
  const totalStake = pl.stakeMult * bet;
  const combos = pl.combos.filter((c) => comboMet(c, bySector)).map((c) => ({ combo: c, bonus: Math.round(c.bonus * totalStake) }));
  const sectorWin = sectors.reduce((s, x) => s + x.win, 0);
  const comboWin = combos.reduce((s, x) => s + x.bonus, 0);
  return { sectorIds, bet, sectors, combos, totalStake, sectorWin, comboWin, totalWin: sectorWin + comboWin };
}

// Info for UI: paytable and headline numbers for a sector under an upgrade.
export function sectorInfo(sid, upgrades = {}) {
  const sec = SECTORS[sid];
  const model = resolve(sid, upgrades, 1);
  const u = model.upgrade;
  const live = new Set(model.groups.flatMap((g) => g.entries.map((e) => e.prize?.id)));
  const table = sec.paytable || sec.model(u).groups.flatMap((g) => g.table);
  let top;
  if (model.groups.length > 1) top = model.groups.reduce((s, g) => s + g.n * Math.max(...g.entries.map((e) => e.prize?.v || 0)), 0);
  else top = Math.max(...model.groups[0].entries.map((e) => e.prize?.vmax ?? e.prize?.v ?? 0));
  return {
    stakeMult: u.stake,
    valueMult: model.valueMult,
    topMult: (top * model.valueMult) / u.stake, // best headline payout as a multiple of the stake
    hitRate: model.groups[0].q,
    paytable: table.map((p) => ({ ...p, locked: sid !== 'apiary' && !live.has(p.id) })),
  };
}
