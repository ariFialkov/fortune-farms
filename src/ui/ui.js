// DOM layer: top bar, sector tags, betting HUD, round bar, popups, banners, modals.
import { SECTORS, CORE, ALL, COMBOS, BETS, RTP } from '../math/data.js';
import { sectorInfo, roundCost, MODES, stakeMultOf } from '../math/engine.js';
import { sfx } from './audio.js';
import { icon as ic } from '../scene/models.js';

const SVG = {
  on: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>',
  off: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4z"/><path stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M16.5 9.5l5 5M21.5 9.5l-5 5"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align:-2px"><path fill="currentColor" d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
};

const $ = (s) => document.querySelector(s);
const fmt = (n) => (Math.round(n * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 });
const short = (n) => (n >= 1e6 ? +(n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? +(n / 1e3).toFixed(1) + 'K' : fmt(n));
const coin = '<span class="coin"></span>';
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

export function createUI(state, on) {
  const top = $('#topbar'), hud = $('#hud'), tagsEl = $('#tags'), roundbar = $('#roundbar'), modal = $('#modal');
  const bet = () => state.bet;

  // ----- top bar -----
  top.innerHTML = `<div class="logo">Fortune<span>Farms</span></div>
    <div class="balance">${coin}<span id="bal"></span></div>
    <div class="top-btns">
      <button class="round" id="b-combo" title="Combos">${ic('book')}</button>
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
  const syncTop = () => { $('#b-sound').innerHTML = state.mute ? SVG.off : SVG.on; };
  syncTop();
  $('#b-sound').onclick = () => { on.mute(); syncTop(); sfx('click'); };
  $('#b-combo').onclick = () => { sfx('click'); showCombos(); };
  $('#b-info').onclick = () => { sfx('click'); showInfo(); };
  $('.balance').onclick = () => { if (state.balance < BETS[0]) on.refill(); };

  // ----- sector tags (with upgrade add-ons attached) -----
  const tags = {};
  for (const id of ALL) {
    const t = el('div', 'tag ' + (SECTORS[id].core ? 'core' : 'special'));
    tagsEl.append(t);
    tags[id] = t;
  }
  function syncTags() {
    for (const id of ALL) {
      const info = sectorInfo(id, state.upgrades), s = SECTORS[id], cur = state.upgrades[id] || 0;
      tags[id].classList.toggle('up', cur > 0);
      const addons = s.upgrades ? `<div class="addons">${s.upgrades.slice(1).map((u, i) => `<button class="addon ${cur === i + 1 ? 'on' : ''}" data-u="${i + 1}" title="${u.name} — ${u.desc} (stake ×${u.stake})">${ic(u.icon)}<em>×${u.stake}</em></button>`).join('')}</div>` : '';
      tags[id].innerHTML = `<div class="tag-in"><button class="tag-body">${ic(s.icon, 'ti')}<span class="tn">${s.name}</span><span class="ts"><span>${coin}${short(info.stakeMult * bet())}</span><i> · </i><span>${ic('trophy')}<b>${short(info.topMult * info.stakeMult * bet())}</b></span></span></button>${addons}</div>`;
      tags[id].querySelector('.tag-body').onclick = () => on.play([id]);
      tags[id].querySelectorAll('.addon').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); sfx('click'); on.upgrade(id, cur === +b.dataset.u ? 0 : +b.dataset.u); }; });
    }
  }
  const placeTag = (id, p) => { tags[id].style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`; };

  // ----- shared bet stepper -----
  const betHtml = () => `<div class="bet"><button class="step" data-bet="-1">−</button><div class="bv"><small>BET PER PLOT</small><b>${fmt(bet())}</b></div><button class="step" data-bet="1">+</button></div>`;
  function wireBet(root) {
    root.querySelectorAll('[data-bet]').forEach((b) => { b.onclick = () => { sfx('click'); on.bet(+b.dataset.bet); }; });
  }

  // ----- bottom HUD -----
  function syncHud() {
    const hc = roundCost(CORE, bet(), state.upgrades), fc = roundCost(ALL, bet(), state.upgrades);
    hud.innerHTML = `<div class="betrow">${betHtml()}
        <button class="big harvest ${state.balance < hc ? 'poor' : ''}" data-mode="harvest"><span class="bt stroke">${ic('wheat')} Roll Harvest</span><span class="bc">5 core plots · ${coin}${fmt(hc)}</span></button>
        <button class="big farm ${state.balance < fc ? 'poor' : ''}" data-mode="farm"><span class="bt stroke">${ic('combine_std')} Run the Farm</span><span class="bc">all 9 plots + combos · ${coin}${fmt(fc)}</span></button>
      </div>`;
    wireBet(hud);
    hud.querySelectorAll('[data-mode]').forEach((b) => { b.onclick = () => on.play(MODES[b.dataset.mode].sectors); });
  }

  // which chrome is visible: 'hud' (betting) or 'none' (a round is running)
  function setMode(mode) {
    hud.classList.toggle('off', mode !== 'hud');
    tagsEl.classList.toggle('off', mode !== 'hud');
    roundbar.hidden = mode !== 'none';
    const topH = top.offsetHeight;
    return { top: mode === 'none' ? topH + 70 : topH, bottom: mode === 'hud' ? hud.offsetHeight : 70 };
  }
  function sync() { syncTags(); syncHud(); }

  // ----- round bar: progress, running win, fast-forward -----
  let winShown = 0, stake = 0, inProfit = false;
  const ffBtn = $('#ff');
  ffBtn.onclick = () => { const fast = on.fast(); ffBtn.classList.toggle('on', fast); sfx('ff'); };
  function startRound(ids, totalStake) {
    roundbar.innerHTML = `${ids.length > 1 ? `<div class="steps">${ids.map((id) => `<span data-s="${id}">${ic(SECTORS[id].icon)}</span>`).join('')}</div>` : ''}<div class="win"><small>WIN</small><b>0</b><em>IN PROFIT</em></div>`;
    winShown = 0; stake = totalStake; inProfit = false;
    ffBtn.hidden = false; ffBtn.classList.remove('on');
  }
  function endRound() { ffBtn.hidden = true; }
  function stepRound(id) {
    roundbar.querySelectorAll('.steps span').forEach((s) => { if (s.classList.contains('now')) s.className = 'done'; if (s.dataset.s === id) s.className = 'now'; });
  }
  function setWin(v) {
    if (v === winShown) return;
    winShown = v;
    const w = roundbar.querySelector('.win'), b = w.querySelector('b');
    b.textContent = fmt(v);
    b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
    w.classList.toggle('warm', v >= stake * 0.5);
    if (!inProfit && v >= stake && stake > 0) { inProfit = true; w.classList.add('profit'); sfx('profit'); flash('#ffd23f'); }
  }
  // a big area title as the camera arrives
  function title(text, key) {
    const host = $('#title');
    host.innerHTML = `<div>${ic(key)}<span>${text}</span></div>`;
  }
  // coins fly from a prize to the win meter
  function coins(from, n, tier) {
    const target = roundbar.querySelector('.win b')?.getBoundingClientRect();
    if (!target) return;
    const tx = target.left + target.width / 2, ty = target.top + target.height / 2;
    for (let i = 0; i < n; i++) {
      const c = el('div', 'fly');
      pops.append(c);
      const sx = from.x + (Math.random() - 0.5) * 30, sy = from.y + (Math.random() - 0.5) * 20;
      const a = c.animate([
        { transform: `translate(${sx}px, ${sy}px) scale(.4)`, opacity: 0 },
        { transform: `translate(${sx + (Math.random() - 0.5) * 80}px, ${sy - 50 - Math.random() * 40}px) scale(1.1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${tx}px, ${ty}px) scale(.6)`, opacity: 1 },
      ], { duration: 520 + Math.random() * 220, delay: 120 + i * 45, easing: 'cubic-bezier(.5,0,.7,1)', fill: 'backwards' });
      a.onfinish = () => { c.remove(); sfx('coin', tier); };
    }
  }
  function flash(color) {
    const f = el('div', 'edgeflash');
    f.style.setProperty('--fc', color);
    f.addEventListener('animationend', () => f.remove());
    $('#confetti').append(f);
  }

  // ----- popups / labels / banners -----
  const pops = $('#popups'), labels = $('#labels');
  function popup(p, { icon, label, value, tier = 0, named = false, noValue = false, miss = false }) {
    const e = el('div', `pop t${tier} ${miss ? 'miss' : ''}`, `<span class="pi">${ic(icon)}</span>${miss || noValue ? '' : `<span class="pv">+${fmt(value)}</span>`}${label ? `<span class="pn">${label}</span>` : ''}`);
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
  function banner({ icon, kicker, title, value, combo = false, tier = 3 }, ms = 2000) {
    const host = $('#banner');
    host.innerHTML = '';
    const e = el('div', `bn t${tier}` + (combo ? ' combo' : ''), `<div class="rays"></div><div class="bi">${ic(icon)}</div>${kicker ? `<div class="bk">${kicker}</div>` : ''}<div class="bt">${title}</div>${value ? `<div class="bv">+${fmt(value)}</div>` : ''}`);
    e.style.animationDuration = ms + 'ms';
    host.append(e);
    setTimeout(() => e.remove(), ms);
  }
  function confetti(n = 50, cols = ['#ffd23f', '#ff5a5f', '#5cc93f', '#3fa9f5', '#9b5de5', '#fff']) {
    const host = $('#confetti');
    for (let i = 0; i < n; i++) {
      const c = el('div', 'cf');
      c.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % cols.length]};--dx:${(Math.random() - 0.5) * 200}px;--r:${Math.random() * 1400 - 700}deg;animation-duration:${1.4 + Math.random() * 1.6}s;animation-delay:${Math.random() * 0.4}s`;
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
      const rows = result.sectors.map((s) => `<div class="row"><span class="ri">${ic(SECTORS[s.id].icon)}</span><div>${SECTORS[s.id].name}${s.upgrade.stake > 1 ? `<small>${s.upgrade.name}</small>` : ''}</div><span class="rv ${s.win ? '' : 'zero'}">+${fmt(s.win)}</span></div>`).join('');
      const combos = result.combos.map((c) => `<div class="row combo"><span class="ri">${ic(c.combo.icon)}</span><div>${c.combo.name}<small>COMBO BONUS</small></div><span class="rv">+${fmt(c.bonus)}</span></div>`).join('');
      const head = net >= result.totalStake * 4 ? 'Bumper Crop!' : net > 0 ? 'Nice Harvest!' : result.totalWin > 0 ? title : 'Slim Pickings';
      const card = openModal(`<h2>${head}</h2><div class="sub">Staked ${coin}${fmt(result.totalStake)}</div>
        ${result.sectors.length > 1 ? `<div class="rows">${rows}${combos}</div>` : ''}
        <div class="total ${result.totalWin ? '' : 'lose'}"><small>TOTAL WIN</small><b>0</b></div>
        <div class="btns"><button class="big harvest" data-a="done"><span class="bt stroke">Collect</span></button><button class="big farm" data-a="again"><span class="bt stroke">Play Again</span><span class="bc">${coin}${fmt(result.totalStake)}</span></button></div>`);
      const tb = card.querySelector('.total b'), t0 = performance.now(), dur = result.totalWin > 0 ? 700 + Math.min(900, (result.totalWin / result.totalStake) * 250) : 0;
      let lastTick = 0;
      const up = (now) => {
        const k = dur ? Math.min((now - t0) / dur, 1) : 1;
        tb.textContent = fmt(k < 1 ? Math.floor(result.totalWin * (1 - (1 - k) ** 3)) : result.totalWin);
        if (k < 1) { if (now - lastTick > 55) { lastTick = now; sfx('tick'); } requestAnimationFrame(up); }
        else if (net > 0) tb.classList.add('bump');
      };
      requestAnimationFrame(up);
      card.querySelectorAll('[data-a]').forEach((b) => { b.onclick = () => { closeModal(); res(b.dataset.a); }; });
    });
  }

  function showCombos() {
    const row = (c) => `<div class="row"><span class="ri">${ic(c.icon)}</span><div>${c.name}<small>${c.desc}</small></div><span class="rv">+${c.bonus}× stake</span></div>`;
    const core = COMBOS.filter((c) => c.needs.every((n) => CORE.includes(n.sector)));
    openModal(`<button class="round x">✕</button><h2>Combo Cookbook</h2><p class="sub">Bonuses pay a multiple of your total round stake.</p>
      <h3>Roll Harvest & Run the Farm</h3><div class="rows">${core.map(row).join('')}</div>
      <h3>Run the Farm only</h3><div class="rows">${COMBOS.filter((c) => !core.includes(c)).map(row).join('')}</div>`, true);
  }
  function showInfo() {
    const secs = ALL.map((id) => {
      const info = sectorInfo(id, state.upgrades);
      return `<h3>${ic(SECTORS[id].icon)} ${SECTORS[id].name}</h3><div class="grid">${info.paytable.map((p) => `<div class="pz t${p.tier} ${p.locked ? 'locked' : ''}"><div class="zi">${ic(p.icon)}</div><div class="zn">${p.name}</div><div class="zv">×${+(p.v * info.valueMult).toFixed(2)}</div></div>`).join('')}</div>`;
    }).join('');
    openModal(`<button class="round x">✕</button><h2>How to Play</h2>
      <p>Tap an area's tag to play it on its own straight away, or use <b>Roll Harvest</b> (5 core plots) and <b>Run the Farm</b> (all 9 plots) to play a full circuit and unlock combo bonuses.</p>
      <p>The small buttons above a tag switch that area's upgrades on and off: they raise your stake for that area and improve what it can pay. Theoretical return to player is <b>${(RTP * 100).toFixed(0)}%</b> on every plot, upgrade and mode. Every round's result is decided the moment you bet.</p>
      <p>Coins are play money with no cash value. Prize values below are multiples of your bet per plot with your current upgrades.</p>${secs}`, true);
  }
  function showBroke() {
    return new Promise((res) => {
      const card = openModal(`<h2>Barn's Empty!</h2><p class="sub">You're out of coins. The bank is feeling generous.</p><div class="total"><small>FREE REFILL</small><b>50,000</b></div><div class="btns"><button class="big farm"><span class="bt stroke">Take it</span></button></div>`);
      card.querySelector('.big').onclick = () => { closeModal(); res(); };
    });
  }

  return { sync, setMode, setBalance, placeTag, startRound, endRound, stepRound, setWin, popup, label, banner, confetti, toast, summary, showBroke, fmt, title, coins, flash };
}
