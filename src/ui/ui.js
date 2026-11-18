// DOM layer: top bar, sector tags, betting HUD, sector panel, round bar, popups, banners, modals.
import { SECTORS, CORE, ALL, COMBOS, BETS, RTP } from '../math/data.js';
import { sectorInfo, roundCost, MODES, stakeMultOf } from '../math/engine.js';
import { sfx } from './audio.js';

const $ = (s) => document.querySelector(s);
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const short = (n) => (n >= 1e6 ? +(n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? +(n / 1e3).toFixed(1) + 'K' : fmt(n));
const coin = '<span class="coin"></span>';
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

export function createUI(state, on) {
  const top = $('#topbar'), hud = $('#hud'), panel = $('#panel'), tagsEl = $('#tags'), roundbar = $('#roundbar'), modal = $('#modal');
  const bet = () => BETS[state.betIdx];
  let panelSector = null;

  // ----- top bar -----
  top.innerHTML = `<div class="logo">Fortune<span>Farms</span></div>
    <div class="balance">${coin}<span id="bal"></span></div>
    <div class="top-btns">
      <button class="round" id="b-combo" title="Combos">📖</button>
      <button class="round" id="b-speed" title="Speed"></button>
      <button class="round" id="b-sound" title="Sound"></button>
      <button class="round" id="b-info" title="Info">i</button>
    </div>`;
  let shownBal = state.balance;
  const balEl = $('#bal');
  balEl.textContent = fmt(shownBal);
  function setBalance(v, animate = false) {
    const from = shownBal;
    shownBal = v;
    if (!animate) { balEl.textContent = fmt(v); return; }
    const t0 = performance.now();
    balEl.parentElement.classList.remove('bump'); void balEl.offsetWidth; balEl.parentElement.classList.add('bump');
    const step = (now) => {
      const k = Math.min((now - t0) / 700, 1);
      balEl.textContent = fmt(from + (v - from) * (1 - (1 - k) ** 3));
      if (k < 1 && shownBal === v) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const syncTop = () => { $('#b-speed').textContent = state.speed + '×'; $('#b-sound').textContent = state.mute ? '🔇' : '🔊'; };
  syncTop();
  $('#b-speed').onclick = () => { on.speed(); syncTop(); sfx('click'); };
  $('#b-sound').onclick = () => { on.mute(); syncTop(); sfx('click'); };
  $('#b-combo').onclick = () => { sfx('click'); showCombos(); };
  $('#b-info').onclick = () => { sfx('click'); showInfo(); };
  $('.balance').onclick = () => { if (state.balance < roundCost(['crops'], BETS[0], {})) on.refill(); };

  // ----- sector tags -----
  const tags = {};
  for (const id of ALL) {
    const t = el('button', 'tag ' + (SECTORS[id].core ? 'core' : 'special'));
    t.onclick = () => { sfx('click'); on.select(id); };
    tagsEl.append(t);
    tags[id] = t;
  }
  function syncTags() {
    for (const id of ALL) {
      const info = sectorInfo(id, state.upgrades), s = SECTORS[id];
      tags[id].classList.toggle('up', (state.upgrades[id] || 0) > 0);
      tags[id].innerHTML = `<span class="ti">${s.icon}</span><span class="tn">${s.name}</span><span class="ts"><span>${coin}${short(info.stakeMult * bet())}</span><i> · </i><span>🏆 <b>${short(info.topMult * info.stakeMult * bet())}</b></span></span>`;
    }
  }
  const placeTag = (id, p) => { tags[id].style.transform = `translate(calc(${p.x}px - 50%), calc(${p.y}px - 100% - 10px))`; };

  // ----- shared bet stepper -----
  const betHtml = () => `<div class="bet"><button class="step" data-bet="-1">−</button><div class="bv"><small>BET PER PLOT</small><b>${fmt(bet())}</b></div><button class="step" data-bet="1">+</button></div>`;
  function wireBet(root) {
    root.querySelectorAll('[data-bet]').forEach((b) => { b.onclick = () => { sfx('click'); on.bet(+b.dataset.bet); }; });
  }

  // ----- bottom HUD -----
  function syncHud() {
    const chips = CORE.map((id) => {
      const s = SECTORS[id], i = state.upgrades[id] || 0, u = s.upgrades[i];
      return `<button class="chip ${i ? 'on' : ''}" data-up="${id}"><span class="ci">${i ? u.icon : s.icon}</span><span class="cn">${u.name}</span><em>×${u.stake}</em></button>`;
    }).join('');
    const hc = roundCost(CORE, bet(), state.upgrades), fc = roundCost(ALL, bet(), state.upgrades);
    hud.innerHTML = `<div class="upgrades">${chips}</div>
      <div class="betrow">${betHtml()}
        <button class="big harvest ${state.balance < hc ? 'poor' : ''}" data-mode="harvest"><span class="bt stroke">🌾 Roll Harvest</span><span class="bc">5 core plots · ${coin}${fmt(hc)}</span></button>
        <button class="big farm ${state.balance < fc ? 'poor' : ''}" data-mode="farm"><span class="bt stroke">🚜 Run the Farm</span><span class="bc">all 9 plots + combos · ${coin}${fmt(fc)}</span></button>
      </div>`;
    wireBet(hud);
    hud.querySelectorAll('[data-up]').forEach((b) => { b.onclick = () => { sfx('click'); on.upgrade(b.dataset.up, ((state.upgrades[b.dataset.up] || 0) + 1) % SECTORS[b.dataset.up].upgrades.length); }; });
    hud.querySelectorAll('[data-mode]').forEach((b) => { b.onclick = () => on.play(MODES[b.dataset.mode].sectors); });
  }

  // ----- sector panel -----
  function syncPanel() {
    if (!panelSector) return;
    const id = panelSector, s = SECTORS[id], info = sectorInfo(id, state.upgrades), cur = state.upgrades[id] || 0;
    const cost = info.stakeMult * bet();
    const ups = s.upgrades ? `<div class="ups">${s.upgrades.map((u, i) => `<button class="up ${i === cur ? 'on' : ''}" data-u="${i}">${u.stake > 1 ? `<span class="um">stake ×${u.stake}</span>` : ''}<span class="ui">${u.icon}</span><b>${u.name}</b><small>${u.desc}</small></button>`).join('')}</div>` : '';
    const pay = info.paytable.map((p) => `<div class="pz t${p.tier} ${p.locked ? 'locked' : ''}"><div class="zi">${p.locked ? '🔒' : p.icon}</div><div class="zn">${p.name}</div><div class="zv">${fmt(p.v * info.valueMult * bet())}</div></div>`).join('');
    panel.innerHTML = `<button class="round close">✕</button>
      <div class="ph"><span class="ico">${s.icon}</span><div><h2>${s.name}</h2><p>${s.blurb}</p></div>${s.core ? '' : '<span class="tagline">SPECIAL PLOT</span>'}</div>
      ${ups}<div class="pay">${pay}</div>
      <div class="betrow">${betHtml()}
        <button class="big play ${state.balance < cost ? 'poor' : ''}"><span class="bt">▶ Play ${s.name}</span><span class="bc">${coin}${fmt(cost)} · win up to ${fmt(info.topMult * cost)}${id === 'fishery' ? '' : ' per prize'}</span></button>
      </div>`;
    wireBet(panel);
    panel.querySelector('.close').onclick = () => { sfx('click'); on.select(null); };
    panel.querySelector('.play').onclick = () => on.play([id]);
    panel.querySelectorAll('[data-u]').forEach((b) => { b.onclick = () => { sfx('click'); on.upgrade(id, +b.dataset.u); }; });
  }

  // which bottom sheet is visible: 'hud' | 'panel' | 'none'
  function setMode(mode, sector = null) {
    panelSector = mode === 'panel' ? sector : null;
    panel.hidden = false;
    if (mode === 'panel') syncPanel();
    hud.classList.toggle('off', mode !== 'hud');
    panel.classList.toggle('off', mode !== 'panel');
    tagsEl.classList.toggle('off', mode !== 'hud');
    roundbar.hidden = mode !== 'none';
    const topH = top.offsetHeight;
    return { top: mode === 'none' ? topH + 70 : topH, bottom: mode === 'hud' ? hud.offsetHeight : mode === 'panel' ? panel.offsetHeight : 16 };
  }
  function sync() { syncTags(); syncHud(); syncPanel(); }

  // ----- round bar -----
  let winShown = 0;
  function startRound(ids) {
    roundbar.innerHTML = `${ids.length > 1 ? `<div class="steps">${ids.map((id) => `<span data-s="${id}">${SECTORS[id].icon}</span>`).join('')}</div>` : ''}<div class="win"><small>WIN</small><b>0</b></div>`;
    winShown = 0;
  }
  function stepRound(id) {
    roundbar.querySelectorAll('.steps span').forEach((s) => { if (s.classList.contains('now')) s.className = 'done'; if (s.dataset.s === id) s.className = 'now'; });
  }
  function setWin(v) {
    if (v === winShown) return;
    winShown = v;
    const b = roundbar.querySelector('.win b');
    b.textContent = fmt(v);
    b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  }

  // ----- popups / labels / banners -----
  const pops = $('#popups'), labels = $('#labels');
  function popup(p, { icon, label, value, tier = 0, named = false, noValue = false, miss = false }) {
    const e = el('div', `pop t${tier} ${miss ? 'miss' : ''}`, `<span class="pi">${icon}</span>${miss || noValue ? '' : `<span class="pv">+${fmt(value)}</span>`}${label && (tier >= 1 || named) ? `<span class="pn">${label}</span>` : ''}`);
    e.style.left = p.x + 'px'; e.style.top = p.y + 'px';
    e.addEventListener('animationend', (ev) => { if (ev.target === e) e.remove(); });
    pops.append(e);
    if (pops.childElementCount > 40) pops.firstElementChild.remove();
  }
  function label(p) {
    const e = el('div', 'wlabel');
    e.style.left = p.x + 'px'; e.style.top = p.y + 'px';
    labels.append(e);
    return { set: (h) => { e.innerHTML = h; }, remove: () => e.remove() };
  }
  function banner({ icon, kicker, title, value, combo = false }, ms = 2000) {
    const host = $('#banner');
    host.innerHTML = '';
    const e = el('div', 'bn' + (combo ? ' combo' : ''), `<div class="rays"></div><div class="bi">${icon}</div>${kicker ? `<div class="bk">${kicker}</div>` : ''}<div class="bt">${title}</div>${value ? `<div class="bv">+${fmt(value)}</div>` : ''}`);
    e.style.animationDuration = ms + 'ms';
    host.append(e);
    setTimeout(() => e.remove(), ms);
  }
  function confetti(n = 50) {
    const host = $('#confetti'), cols = ['#ffd23f', '#ff5a5f', '#5cc93f', '#3fa9f5', '#9b5de5', '#fff'];
    for (let i = 0; i < n; i++) {
      const c = el('div', 'cf');
      c.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % 6]};--dx:${(Math.random() - 0.5) * 200}px;--r:${Math.random() * 1400 - 700}deg;animation-duration:${1.4 + Math.random() * 1.6}s;animation-delay:${Math.random() * 0.4}s`;
      c.addEventListener('animationend', () => c.remove());
      host.append(c);
    }
    const f = el('div', 'flash');
    f.addEventListener('animationend', () => f.remove());
    host.append(f);
  }
  function toast(text) { $('#toast').innerHTML = `<div>${text}</div>`; }

  // ----- modals -----
  function openModal(html, wide = false) {
    modal.innerHTML = `<div class="card ${wide ? 'wide' : ''}">${html}</div>`;
    modal.hidden = false;
    const x = modal.querySelector('.x');
    if (x) x.onclick = closeModal;
    return modal.firstElementChild;
  }
  function closeModal() { modal.hidden = true; modal.innerHTML = ''; }
  modal.onclick = (e) => { if (e.target === modal && modal.querySelector('.x')) closeModal(); };

  function summary(result, title) {
    return new Promise((res) => {
      const net = result.totalWin - result.totalStake;
      const rows = result.sectors.map((s) => `<div class="row"><span class="ri">${SECTORS[s.id].icon}</span><div>${SECTORS[s.id].name}${s.upgrade.stake > 1 ? `<small>${s.upgrade.name}</small>` : ''}</div><span class="rv ${s.win ? '' : 'zero'}">+${fmt(s.win)}</span></div>`).join('');
      const combos = result.combos.map((c) => `<div class="row combo"><span class="ri">${c.combo.icon}</span><div>${c.combo.name}<small>COMBO BONUS</small></div><span class="rv">+${fmt(c.bonus)}</span></div>`).join('');
      const head = net >= result.totalStake * 4 ? 'Bumper Crop!' : net > 0 ? 'Nice Harvest!' : result.totalWin > 0 ? title : 'Slim Pickings';
      const card = openModal(`<h2>${head}</h2><div class="sub">Staked ${coin}${fmt(result.totalStake)}</div>
        ${result.sectors.length > 1 ? `<div class="rows">${rows}${combos}</div>` : ''}
        <div class="total ${result.totalWin ? '' : 'lose'}"><small>TOTAL WIN</small><b>${fmt(result.totalWin)}</b></div>
        <div class="btns"><button class="big harvest" data-a="done"><span class="bt stroke">Collect</span></button><button class="big farm" data-a="again"><span class="bt stroke">Play Again</span><span class="bc">${coin}${fmt(result.totalStake)}</span></button></div>`);
      card.querySelectorAll('[data-a]').forEach((b) => { b.onclick = () => { closeModal(); res(b.dataset.a); }; });
    });
  }

  function showCombos() {
    const row = (c) => `<div class="row"><span class="ri">${c.icon}</span><div>${c.name}<small>${c.desc}</small></div><span class="rv">+${c.bonus}× stake</span></div>`;
    const core = COMBOS.filter((c) => c.needs.every((n) => CORE.includes(n.sector)));
    openModal(`<button class="round x">✕</button><h2>Combo Cookbook</h2><p class="sub">Bonuses pay a multiple of your total round stake.</p>
      <h3>🌾 Roll Harvest & Run the Farm</h3><div class="rows">${core.map(row).join('')}</div>
      <h3>🚜 Run the Farm only</h3><div class="rows">${COMBOS.filter((c) => !core.includes(c)).map(row).join('')}</div>`, true);
  }
  function showInfo() {
    const secs = ALL.map((id) => {
      const info = sectorInfo(id, state.upgrades);
      return `<h3>${SECTORS[id].icon} ${SECTORS[id].name}</h3><div class="grid">${info.paytable.map((p) => `<div class="pz t${p.tier} ${p.locked ? 'locked' : ''}"><div class="zi">${p.icon}</div><div class="zn">${p.name}</div><div class="zv">×${+(p.v * info.valueMult).toFixed(2)}</div></div>`).join('')}</div>`;
    }).join('');
    openModal(`<button class="round x">✕</button><h2>How to Play</h2>
      <p>Tap a plot to play it on its own, or use <b>Roll Harvest</b> (5 core plots) and <b>Run the Farm</b> (all 9 plots) to play a full circuit and unlock combo bonuses.</p>
      <p>Upgrades raise your stake for that plot and improve what it can pay. Theoretical return to player is <b>${(RTP * 100).toFixed(0)}%</b> on every plot, upgrade and mode. Every round's result is decided the moment you bet.</p>
      <p>Coins are play money with no cash value. Prize values below are multiples of your bet per plot with your current upgrades.</p>${secs}`, true);
  }
  function showBroke() {
    return new Promise((res) => {
      const card = openModal(`<h2>Barn's Empty!</h2><p class="sub">You're out of coins. The bank is feeling generous.</p><div class="total"><small>FREE REFILL</small><b>50,000</b></div><div class="btns"><button class="big farm"><span class="bt stroke">Take it</span></button></div>`);
      card.querySelector('.big').onclick = () => { closeModal(); res(); };
    });
  }

  return { sync, setMode, setBalance, placeTag, startRound, stepRound, setWin, popup, label, banner, confetti, toast, summary, showBroke, fmt };
}
