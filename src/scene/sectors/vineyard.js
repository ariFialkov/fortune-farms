// VINEYARD — a gust knocks grapes into the tubs, farmers stomp, bottles (maybe) pop out.
import { rbox, cyl, ball, at, rot, grp, plot, wp, puff, emojiSprite, mat, farmer, noShadow , applyPlace, toLocal } from '../kit.js';
import { tween, wait, ease, rand, moveTo, arcTo, ticker, walkTo } from '../anim.js';

const TUB_Z = 2.6;
const tubX = (i) => -5.5 + i * 2.2;

export function createVineyard(scene, pos) {
  const g = grp();
  applyPlace(g, pos);
  scene.add(g);
  // terraced hill at the back with three vine rows
  g.add(at(rbox(30.6, 0.5, 6.4, 0x7cc653, 0.25), 0, 0.25, -3.8), at(rbox(30.2, 0.5, 3.6, 0x6fbd4b, 0.25), 0, 0.7, -5));
  const vines = [];
  [[-6, 0.95], [-4, 0.95], [-2, 0.5]].forEach(([z, y]) => {
    g.add(at(rbox(29.6, 0.08, 0.08, 0x8a5a2b, 0.03), 0, y + 1.25, z));
    for (let i = 0; i < 15; i++) {
      const x = -14.7 + i * 2.1;
      g.add(at(cyl(0.08, 0.08, 1.4, 0x8a5a2b, 6), x, y + 0.7, z));
      if (i < 14) {
        const v = grp(at(ball(0.6, 0x4a9e45, 10), 0, 0, 0), at(ball(0.45, 0x5cb04c, 10), 0.5, 0.15, 0), at(ball(0.42, 0x5cb04c, 10), -0.5, 0.1, 0));
        for (let k = 0; k < 3; k++) v.add(at(noShadow(grp(ball(0.13, 0x7b2d8e, 6), at(ball(0.11, 0x8e3aa3, 6), 0.1, -0.12, 0), at(ball(0.1, 0x7b2d8e, 6), -0.05, -0.22, 0))), rand(-0.7, 0.7), -0.25, 0.5));
        v.position.set(x + 1.05, y + 0.95, z);
        vines.push(v);
        g.add(v);
      }
    }
  });

  const wineMat = mat(0x8e1f4d, { emissive: 0x3a0018, emissiveIntensity: 0.4 });
  const tubs = [], farmers = [];
  for (let i = 0; i < 6; i++) {
    const x = tubX(i);
    const tub = grp(at(cyl(0.95, 0.8, 0.9, 0xb9824a, 16), 0, 0.45, 0), at(cyl(0.97, 0.97, 0.1, 0x7a5a34, 16), 0, 0.75, 0), at(cyl(0.83, 0.83, 0.08, 0x8a5a2b, 16), 0, 0.2, 0));
    const must = at(noShadow(cyl(0.84, 0.84, 0.06, 0x7b2d8e, 16)), 0, 0.5, 0);
    must.visible = false;
    const spout = rot(at(cyl(0.07, 0.07, 0.4, 0x8d99ae, 6), 0, 0.3, 0.95), Math.PI / 2);
    const pour = at(noShadow(cyl(0.045, 0.045, 0.32, wineMat, 6)), 0, 0.15, 1.15);
    pour.visible = false;
    tub.add(must, spout, pour);
    tub.position.set(x, 0, TUB_Z);
    tub.userData = { must, pour };
    g.add(tub);
    tubs.push(tub);
    const f = farmer([0xe5533d, 0x2ec4b6, 0xffb347, 0x9b5de5, 0xe5533d, 0x2ec4b6][i], 0x3f6fb5);
    f.scale.setScalar(0.85);
    f.userData.spot = { x, y: 0, z: 0.6 };
    f.userData.yard = toLocal(g, [-16.2 + i * 1.5, 2.6 + (i % 2) * 1.3]);
    f.position.set(f.userData.yard.x, 0, f.userData.yard.z);
    f.rotation.y = -Math.PI / 2;
    g.add(f);
    farmers.push(f);
  }
  // route between the farmhouse forecourt and the vineyard (around the house)
  const ROUTE = [toLocal(g, [-19.5, 1.5]), toLocal(g, [-19.5, -17]), { x: 8.6, z: 4.4 }, { x: 7.4, z: 0.6 }];
  ticker((dt, t) => vines.forEach((v, i) => { v.rotation.z = Math.sin(t * 1.3 + i) * 0.03 * (1 + gust * 8); }));
  let gust = 0;

  async function play(res, ctx) {
    // the stompers jog over from the farmhouse while the gust does its work
    const arrive = Promise.all(farmers.map(async (f, i) => {
      await wait((5 - i) * 0.07);
      for (const p of ROUTE) await walkTo(f, p.x, p.z, 21, 0.14);
      await walkTo(f, f.userData.spot.x, f.userData.spot.z, 16, 0.14);
    }));
    // gust knocks the grapes off the vines and into the tubs
    ctx.sfx('wind');
    tween(0.4, (k) => { gust = k; });
    for (let i = 0; i < 6; i++) {
      const s = emojiSprite('💨', rand(1, 1.6));
      s.position.set(-9, rand(1.5, 3.5), rand(-6.5, -1));
      g.add(s);
      moveTo(s, { x: 9 }, rand(0.7, 1), ease.linear).then(() => g.remove(s));
    }
    await wait(0.35);
    await Promise.all(Array.from({ length: 30 }, async (_, k) => {
      await wait(rand(0.6));
      const v = vines[Math.floor(rand(vines.length))], tub = tubs[k % 6];
      const b = noShadow(ball(0.14, 0x7b2d8e, 6));
      b.position.copy(v.position);
      g.add(b);
      await arcTo(b, { x: tub.position.x + rand(-0.4, 0.4), y: 0.8, z: TUB_Z + rand(-0.4, 0.4) }, rand(0.45, 0.65), 2.4);
      g.remove(b);
      tub.userData.must.visible = true;
    }));
    tween(0.4, (k) => { gust = 1 - k; });
    await arrive;
    // farmers hop in and stomp
    await Promise.all(farmers.map(async (f, i) => { await wait(i * 0.05); await arcTo(f, { x: tubX(i), y: 0.45, z: TUB_Z }, 0.35, 1.3); }));
    let stomping = true;
    const stompers = farmers.map((f, i) => ({ f, on: true, p: rand(6.28) }));
    const stop = ticker((dt, t) => {
      stompers.forEach((s, i) => {
        if (!s.on) return;
        const h = Math.abs(Math.sin(t * 11 + s.p));
        s.f.position.y = 0.45 + h * 0.4;
        s.f.rotation.y = -Math.PI / 2 + Math.sin(t * 5.5 + s.p) * 0.5;
        if (h < 0.1 && Math.random() < 0.3) puff(g, { x: tubX(i) + rand(-0.6, 0.6), y: 0.9, z: TUB_Z + rand(-0.5, 0.5) }, { color: 0x8e3aa3, n: 1, size: 0.09, up: 0.9 });
      });
      return stomping;
    });
    ctx.sfx('squish');
    await wait(0.7);
    for (let i = 0; i < 6; i++) {
      const slot = res.slots[i], tub = tubs[i], x = tubX(i);
      tub.userData.pour.visible = true;
      ctx.sfx('squish');
      await wait(0.42 + rand(0.2));
      tub.userData.pour.visible = false;
      stompers[i].on = false;
      farmers[i].position.y = 0.45;
      if (slot.prize) {
        const bottle = emojiSprite(slot.prize.icon, 1 + slot.tier * 0.25);
        bottle.position.set(x, 0.4, TUB_Z + 1.3);
        g.add(bottle);
        arcTo(bottle, { x, y: 0.75, z: TUB_Z + 1.6 }, 0.3, 1).then(() => wait(1.6)).then(() => g.remove(bottle));
        ctx.prize(slot, wp(g, x, 2, TUB_Z + 1.4));
      } else {
        puff(g, { x, y: 0.4, z: TUB_Z + 1.2 }, { color: 0xd9c7e0, n: 5, size: 0.13 });
        ctx.miss(wp(g, x, 1.3, TUB_Z + 1.2), '💧');
      }
      await wait(0.22);
    }
    stomping = false;
    await wait(0.5);
    tubs.forEach((t) => { t.userData.must.visible = false; });
    await Promise.all(farmers.map((f) => arcTo(f, { x: f.userData.spot.x, y: 0, z: 4.6 }, 0.35, 1.2)));
    farmers.forEach(async (f, i) => {
      await wait(i * 0.1);
      await walkTo(f, 8.6, 4.4, 10, 0.12);
      await walkTo(f, ROUTE[1].x, ROUTE[1].z, 10, 0.12);
      await walkTo(f, ROUTE[0].x, ROUTE[0].z, 10, 0.12);
      await walkTo(f, f.userData.yard.x, f.userData.yard.z, 9, 0.12);
      f.rotation.y = -Math.PI / 2;
    });
  }

  return { group: g, setUpgrade() {}, play };
}
