import '@fontsource/lilita-one';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './ui/styles.css';
import * as THREE from 'three';
import { SECTORS, ALL, BETS, DEFAULT_BET, START_BALANCE } from './math/data.js';
import { rollRound, roundCost } from './math/engine.js';
import { createWorld } from './scene/world.js';
import { AREAS, SECTOR_POS } from './scene/layout.js';
import { clock, wait } from './scene/anim.js';
import { burst, sparks, ringPulse, lightBeam } from './scene/kit.js';
import { buildIcons, icon, MODEL_KEYS } from './scene/models.js';
import { createCrops } from './scene/sectors/crops.js';
import { createDairy } from './scene/sectors/dairy.js';
import { createPoultry } from './scene/sectors/poultry.js';
import { createSlaughter } from './scene/sectors/slaughter.js';
import { createOrchard } from './scene/sectors/orchard.js';
import { createFishery } from './scene/sectors/fishery.js';
import { createApiary } from './scene/sectors/apiary.js';
import { createVineyard } from './scene/sectors/vineyard.js';
import { createMycology } from './scene/sectors/mycology.js';
import { createUI } from './ui/ui.js';
import { sfx, audio } from './ui/audio.js';

// ---------- persistent state ----------
const KEY = 'fortune-farms-v2';
const state = { balance: START_BALANCE, bet: DEFAULT_BET, upgrades: {}, mute: false };
try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || localStorage.getItem('fortune-farms-v1') || '{}')); } catch { /* fresh start */ }
if (!BETS.includes(state.bet)) state.bet = DEFAULT_BET;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ } };
const money = (v) => Math.round(v * 100) / 100;
audio.muted = state.mute;
let speed = 1;          // 2 while fast-forward is on for the current round

// ---------- scene ----------
const world = createWorld(document.getElementById('scene'));
const make = { crops: createCrops, dairy: createDairy, poultry: createPoultry, slaughter: createSlaughter, orchard: createOrchard, fishery: createFishery, apiary: createApiary, vineyard: createVineyard, mycology: createMycology };
const sectors = Object.fromEntries(ALL.map((id) => [id, make[id](world.scene, AREAS[id])]));
ALL.forEach((id) => sectors[id].setUpgrade(state.upgrades[id] || 0));

let busy = false;

buildIcons();
const ui = createUI(state, {
  bet(d) {
    state.bet = BETS[Math.min(Math.max(BETS.indexOf(state.bet) + d, 0), BETS.length - 1)];
    save(); ui.sync(); relayout();
  },
  upgrade(id, i) {
    state.upgrades[id] = i;
    sectors[id].setUpgrade(i);
    sfx('pop', i ? 1 : 0);
    save(); ui.sync(); relayout();
  },
  fast() { speed = speed === 1 ? 2 : 1; clock.speed = speed; return speed > 1; },
  mute() { state.mute = !state.mute; audio.muted = state.mute; save(); },
  play(ids) { playRound(ids); },
  refill,
});

function relayout() {
  const ins = ui.setMode(busy ? 'none' : 'hud');
  world.setInsets(ins.top, ins.bottom);
}
function showFarm() {
  ui.sync();
  const ins = ui.setMode('hud');
  world.setInsets(ins.top, ins.bottom, 0);
  world.focus(null, 0.8);
}

// area tags follow their plots
const anchor = new THREE.Vector3();
world.onFrame(() => {
  if (busy) return;
  for (const id of ALL) ui.placeTag(id, world.project(anchor.set(SECTOR_POS[id][0], 3.6, SECTOR_POS[id][1])));
});

async function refill() {
  await ui.showBroke();
  state.balance = money(state.balance + 50000);
  save(); ui.setBalance(state.balance, true); ui.sync();
}

// ---------- round flow ----------
const TIER_COLOR = [0x8fe05a, 0x4db8ff, 0xc77dff, 0xffd23f];
const TIER_CSS = ['#8fe05a', '#4db8ff', '#c77dff', '#ffd23f'];
let slowTimer = 0;
function slowMo(ms) {
  clock.speed = speed * 0.2;
  clearTimeout(slowTimer);
  slowTimer = setTimeout(() => { clock.speed = speed; }, ms / speed);
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms / speed));

async function playRound(ids) {
  if (busy) return;
  const bet = state.bet;
  const cost = roundCost(ids, bet, state.upgrades);
  if (state.balance < cost) {
    if (state.balance < BETS[0]) return refill();
    sfx('miss');
    return ui.toast('Not enough coins — lower your bet');
  }
  busy = true;
  speed = 1; clock.speed = 1;
  const single = ids.length === 1;
  // the whole outcome is fixed here, before anything animates
  const result = rollRound(ids, bet, { ...state.upgrades });
  state.balance = money(state.balance + result.totalWin - cost);
  save();
  ui.setBalance(money(state.balance - result.totalWin), true);
  sfx('start');
  ui.startRound(ids, result.totalStake);
  const ins = ui.setMode('none');
  world.setInsets(ins.top, ins.bottom, 0);

  let total = 0;
  const ctx = {
    sfx,
    shake: world.shake,
    add(v) { total = money(total + v); ui.setWin(total); },
    // Every prize gets a popup, a climbing pluck and coins flying to the meter;
    // each tier above Common adds its own signature on top.
    popup(o) {
      const t = o.tier, at = world.project(o.pos), ground = { x: o.pos.x, y: 0.3, z: o.pos.z };
      if (o.add !== false) ctx.add(o.value);
      ui.popup(at, o);
      sfx('pop', t);
      if (!o.noValue) ui.coins(at, [1, 3, 7, 14][t], t);
      sparks(world.scene, o.pos, TIER_COLOR[t], [3, 9, 16, 26][t], 0.13 + t * 0.04);
      if (t >= 1) {                               // Fine: a ring of light and a star burst
        ringPulse(world.scene, ground, TIER_COLOR[t], 3 + t * 1.5, 0.7);
        burst(world.scene, o.pos, 3 + t * 4, 0.35 + t * 0.1);
      }
      if (t >= 2) {                               // Rare: light beam, second ring, edge glow, banner, slow-mo
        lightBeam(world.scene, ground, TIER_COLOR[t], 13 + t * 3, 1 + (t - 2) * 0.7, t >= 3 ? 2.6 : 1.7);
        setTimeout(() => ringPulse(world.scene, ground, 0xffffff, 6 + t * 2, 0.9), 160);
        world.shake(0.5 + (t - 2) * 0.5, 0.5);
        ui.flash(TIER_CSS[t]);
        ui.confetti(t >= 3 ? 120 : 45, t >= 3 ? undefined : ['#c77dff', '#9b5de5', '#e9d5ff', '#fff', '#ffd23f']);
        if (!o.noValue) ui.banner({ icon: o.icon, kicker: t >= 3 ? 'J A C K P O T' : 'RARE FIND', title: o.label + '!', value: o.value, tier: t }, (t >= 3 ? 2800 : 2000) / speed);
        slowMo(t >= 3 ? 2200 : 1300);
      }
      if (t >= 3) for (let i = 1; i <= 3; i++) setTimeout(() => { ringPulse(world.scene, ground, TIER_COLOR[3], 5 + i * 3, 1); ui.coins(at, 8, 3); }, i * 380);
    },
    prize(slot, pos) { if (slot.prize) ctx.popup({ icon: slot.prize.icon, label: slot.prize.name, value: slot.value, tier: slot.tier, pos }); },
    ico: icon,
    miss(pos, key = 'puff') { ui.popup(world.project(pos), { icon: key, miss: true }); sfx('miss'); },
    label: (pos) => ui.label(world.project(pos)),
  };

  let base = 0;
  for (const res of result.sectors) {
    ui.stepRound(res.id);
    sfx('whoosh');
    if (!single) ui.title(SECTORS[res.id].name, SECTORS[res.id].icon);
    await world.focus(res.id, 0.8 / speed);
    try { await sectors[res.id].play(res, ctx); } catch (err) { console.error(`${res.id} animation failed`, err); }
    base = money(base + res.win);
    total = base;
    ui.setWin(total);
    await wait(0.35);
  }
  if (!single) {
    ui.stepRound(null);
    sfx('whoosh');
    await world.focus(null, 0.8 / speed);
    for (const c of result.combos) {
      sfx('combo');
      ui.confetti(40);
      ui.flash('#c77dff');
      ui.banner({ icon: c.combo.icon, kicker: 'C O M B O', title: c.combo.name, value: c.bonus, combo: true }, 1900 / speed);
      total = money(total + c.bonus);
      ui.setWin(total);
      await pause(1700);
    }
  }
  ui.setWin(result.totalWin);
  ui.endRound();
  speed = 1; clock.speed = 1;
  const ratio = result.totalWin / result.totalStake;
  sfx(ratio >= 3 ? 'bigwin' : ratio >= 1 ? 'win' : result.totalWin > 0 ? 'collect' : 'lose');
  if (ratio >= 3) ui.confetti(90);
  ui.setBalance(state.balance, true);
  const next = await ui.summary(result, single ? SECTORS[ids[0]].name : ids.length === 5 ? 'Harvest Complete' : 'Farm Complete');
  busy = false;
  if (next === 'again') return playRound(ids);
  showFarm();
}

// ---------- boot ----------
ui.sync();
showFarm();
document.fonts?.ready.then(() => relayout());
addEventListener('resize', () => setTimeout(relayout, 50));
requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById('splash').classList.add('gone')));
if (import.meta.env.PROD && 'serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
if (import.meta.env.DEV) Object.assign(window, { __ff: { state, world, sectors, playRound, clock, icon, MODEL_KEYS, fast: (n) => { speed = n; clock.speed = n; } } });
