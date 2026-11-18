import '@fontsource/lilita-one';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './ui/styles.css';
import * as THREE from 'three';
import { SECTORS, ALL, BETS, START_BALANCE } from './math/data.js';
import { rollRound, roundCost } from './math/engine.js';
import { createWorld } from './scene/world.js';
import { AREAS, SECTOR_POS } from './scene/layout.js';
import { clock, wait } from './scene/anim.js';
import { burst } from './scene/kit.js';
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
const KEY = 'fortune-farms-v1';
const state = { balance: START_BALANCE, betIdx: 0, upgrades: {}, speed: 1, mute: false };
try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* fresh start */ }
state.betIdx = Math.min(Math.max(state.betIdx | 0, 0), BETS.length - 1);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ } };
audio.muted = state.mute;
clock.speed = state.speed;

// ---------- scene ----------
const world = createWorld(document.getElementById('scene'));
const make = { crops: createCrops, dairy: createDairy, poultry: createPoultry, slaughter: createSlaughter, orchard: createOrchard, fishery: createFishery, apiary: createApiary, vineyard: createVineyard, mycology: createMycology };
const sectors = Object.fromEntries(ALL.map((id) => [id, make[id](world.scene, AREAS[id])]));
ALL.forEach((id) => sectors[id].setUpgrade(state.upgrades[id] || 0));

let busy = false;
let selected = null;

buildIcons();
const ui = createUI(state, {
  select(id) { if (!busy) show(id); },
  bet(d) {
    state.betIdx = Math.min(Math.max(state.betIdx + d, 0), BETS.length - 1);
    save(); ui.sync(); relayout();
  },
  upgrade(id, i) {
    state.upgrades[id] = i;
    sectors[id].setUpgrade(i);
    sfx('pop', i ? 1 : 0);
    save(); ui.sync(); relayout();
  },
  speed() { state.speed = (state.speed % 3) + 1; clock.speed = state.speed; save(); },
  mute() { state.mute = !state.mute; audio.muted = state.mute; save(); },
  play(ids) { playRound(ids); },
  refill,
});

function relayout() {
  const ins = ui.setMode(busy ? 'none' : selected ? 'panel' : 'hud', selected);
  world.setInsets(ins.top, ins.bottom);
}
function show(id) {
  selected = id;
  ui.sync();
  const ins = ui.setMode(id ? 'panel' : 'hud', id);
  world.setInsets(ins.top, ins.bottom, 0);
  world.focus(id, 0.8);
}

// sector tags follow their plots
const anchor = new THREE.Vector3();
world.onFrame(() => {
  if (busy || selected) return;
  for (const id of ALL) ui.placeTag(id, world.project(anchor.set(SECTOR_POS[id][0], 3.6, SECTOR_POS[id][1])));
});

async function refill() {
  await ui.showBroke();
  state.balance += 50000;
  save(); ui.setBalance(state.balance, true); ui.sync();
}

// ---------- round flow ----------
let slowTimer = 0;
function slowMo(ms) {
  clock.speed = state.speed * 0.2;
  clearTimeout(slowTimer);
  slowTimer = setTimeout(() => { clock.speed = state.speed; }, ms);
}

async function playRound(ids) {
  if (busy) return;
  const bet = BETS[state.betIdx];
  const cost = roundCost(ids, bet, state.upgrades);
  if (state.balance < cost) {
    if (state.balance < BETS[0]) return refill();
    sfx('miss');
    return ui.toast('Not enough coins — lower your bet');
  }
  busy = true;
  const single = ids.length === 1;
  // the whole outcome is fixed here, before anything animates
  const result = rollRound(ids, bet, { ...state.upgrades });
  state.balance += result.totalWin - cost;
  save();
  ui.setBalance(state.balance - result.totalWin, true);
  sfx('start');
  ui.startRound(ids);
  const ins = ui.setMode('none');
  world.setInsets(ins.top, ins.bottom, 0);

  let total = 0;
  const ctx = {
    sfx,
    shake: world.shake,
    add(v) { total += v; ui.setWin(total); },
    popup(o) {
      if (o.add !== false) ctx.add(o.value);
      ui.popup(world.project(o.pos), o);
      sfx('pop', o.tier);
      if (o.tier >= 1) burst(world.scene, o.pos, 3 + o.tier * 5, 0.4 + o.tier * 0.1);
      if (o.tier >= 2) {
        world.shake(0.5 + (o.tier - 2) * 0.5, 0.5);
        ui.confetti(o.tier >= 3 ? 110 : 50);
        if (!o.noValue) ui.banner({ icon: o.icon, kicker: o.tier >= 3 ? 'J A C K P O T' : 'RARE FIND', title: o.label + '!', value: o.value, tier: o.tier }, o.tier >= 3 ? 2800 : 2000);
        slowMo(o.tier >= 3 ? 2200 : 1300);
      }
    },
    prize(slot, pos) { if (slot.prize) ctx.popup({ icon: slot.prize.icon, label: slot.prize.name, value: slot.value, tier: slot.tier, pos }); },
    ico: icon,
    miss(pos, key = 'puff') { ui.popup(world.project(pos), { icon: key, miss: true }); sfx('miss'); },
    label: (pos) => ui.label(world.project(pos)),
  };

  let base = 0;
  for (const res of result.sectors) {
    ui.stepRound(res.id);
    await world.focus(res.id, single && selected === res.id ? 0.3 : 0.8);
    await sectors[res.id].play(res, ctx);
    base += res.win;
    total = base;
    ui.setWin(total);
    await wait(0.35);
  }
  if (!single) {
    ui.stepRound(null);
    await world.focus(null, 0.8);
    for (const c of result.combos) {
      sfx('combo');
      ui.confetti(40);
      ui.banner({ icon: c.combo.icon, kicker: 'C O M B O', title: c.combo.name, value: c.bonus, combo: true }, 1900);
      total += c.bonus;
      ui.setWin(total);
      await new Promise((r) => setTimeout(r, 1700));
    }
  }
  ui.setWin(result.totalWin);
  if (result.totalWin > 0) sfx('collect');
  if (result.totalWin >= result.totalStake * 3) ui.confetti(80);
  ui.setBalance(state.balance, true);
  const next = await ui.summary(result, single ? SECTORS[ids[0]].name : ids.length === 5 ? 'Harvest Complete' : 'Farm Complete');
  busy = false;
  if (next === 'again') return playRound(ids);
  show(single ? ids[0] : null);
}

// ---------- boot ----------
ui.sync();
show(null);
document.fonts?.ready.then(() => relayout());
addEventListener('resize', () => setTimeout(relayout, 50));
requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById('splash').classList.add('gone')));
if (import.meta.env.PROD && 'serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
if (import.meta.env.DEV) Object.assign(window, { __ff: { state, world, sectors, playRound, clock, icon, MODEL_KEYS } });
