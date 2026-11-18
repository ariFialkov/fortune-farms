// ORCHARDS — a gust (or an earthquake) shakes the trees; fruit rains down at random.
import { rbox, at, grp, plot, wp, puff, prizeModel, model, gust, tree, noShadow , applyPlace, toLocal } from '../kit.js';
import { tween, wait, ease, rand, pick, moveTo, ticker } from '../anim.js';

const FRUIT_COLS = [0xe5383b, 0xff9f1c, 0xffd23f, 0xff8fa3, 0xe5383b, 0xb5179e, 0xffd23f, 0xff9f1c, 0xe5383b];

export function createOrchard(scene, pos) {
  const g = grp();
  applyPlace(g, pos);
  scene.add(g);
  const trees = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
    const t = tree(1.05, [0x4fb04a, 0x5cbd4c, 0x49a84f][(r + c) % 3], FRUIT_COLS[(r * 3 + c) % 9]);
    t.position.set(-4.7 + c * 4.7 + rand(-0.35, 0.35), 0, -9.4 + r * 4.7 + rand(-0.35, 0.35));
    t.scale.setScalar(rand(0.9, 1.12));
    g.add(t);
    trees.push(t);
  }
  let quake = false;
  let shakeAmp = 0;
  const phase = trees.map(() => rand(6.28));
  ticker((dt, t) => {
    trees.forEach((tr, i) => {
      const idle = Math.sin(t * 1.2 + phase[i]) * 0.02;
      const f = quake ? 26 : 9;
      tr.userData.crown.rotation.z = idle + Math.sin(t * f + phase[i]) * shakeAmp * (quake ? 0.2 : 0.16) - (quake ? 0 : shakeAmp * 0.12);
      tr.userData.crown.rotation.x = Math.cos(t * f * 0.8 + phase[i]) * shakeAmp * 0.1;
      tr.rotation.z = quake ? Math.sin(t * 31 + phase[i]) * shakeAmp * 0.05 : -shakeAmp * 0.04;
      tr.position.y = quake ? Math.abs(Math.sin(t * 24 + phase[i])) * shakeAmp * 0.15 : 0;
    });
  });

  function setUpgrade(i) { quake = i === 1; }

  function gustStreak() {
    const z = rand(-11, 11);
    if (quake) puff(g, { x: rand(-6, 6), y: 0.3, z }, { color: 0xc9a063, n: 5, size: 0.3, up: 1.6, spread: 1.2 });
    else gust(g, { x: -9, y: rand(1.5, 4.5), z }, { x: 9, y: rand(1.5, 4.5), z: z + rand(-1, 1) }, rand(0.7, 1.1), rand(0.8, 1.3));
  }

  async function play(res, ctx) {
    const dur = quake ? 4.8 : 4.2;
    ctx.sfx(quake ? 'rumble' : 'wind');
    tween(0.5, (k) => { shakeAmp = k; });
    let gusts = true;
    (async () => { while (gusts) { gustStreak(); if (quake) ctx.shake(0.35, 0.25); await wait(quake ? 0.16 : 0.22); } })();
    const times = res.slots.map(() => rand(0.35, dur - 0.5));
    await Promise.all(res.slots.map(async (slot, i) => {
      await wait(times[i]);
      const tr = pick(trees);
      const a = rand(6.28), r = rand(0.9, 1.9);
      const x = tr.position.x + Math.cos(a) * r, z = tr.position.z + Math.sin(a) * r;
      const sp = slot.prize ? prizeModel(slot.prize, 1.1) : model('leaf', 0.45);
      sp.position.set(x, 2.6, z);
      g.add(sp);
      if (!slot.prize) {
        await tween(0.9, (k) => { sp.position.set(x + Math.sin(k * 9) * 0.5 + k * 1.5, 2.6 - k * 2.4, z); sp.rotation.z = k * 7; sp.scale.setScalar(Math.max(0.01, 0.45 * (1 - k * k))); }, ease.linear);
        return g.remove(sp);
      }
      await moveTo(sp, { y: 0.6 }, 0.42, ease.in);
      ctx.sfx('thud');
      puff(g, { x, y: 0.3, z }, { color: 0xcdeaa0, n: 4, size: 0.12 });
      ctx.prize(slot, wp(g, x, 1.5, z));
      await tween(0.3, (k, raw) => { sp.position.y = 0.6 + Math.sin(raw * Math.PI) * 0.5; }, ease.linear);
      await wait(0.6);
      g.remove(sp);
    }));
    gusts = false;
    await tween(0.5, (k) => { shakeAmp = 1 - k; });
    await wait(0.3);
  }

  return { group: g, setUpgrade, play };
}
