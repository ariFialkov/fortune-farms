// DAIRY — cows queue single-file for the Milk-o-matic 3000; products pop out of the packager.
import { rbox, cyl, ball, at, rot, grp, plot, wp, puff, emojiSprite, mat, cow, fence, sign, idleBob, noShadow } from '../kit.js';
import { tween, wait, ease, rand, walkTo, moveTo, ticker, scaleTo } from '../anim.js';

const LANE = 2.6;
const ENTRY = 1.0, EXIT = 5.6;

export function createDairy(scene, pos) {
  const g = grp();
  g.position.set(pos[0], 0, pos[1]);
  scene.add(g);
  g.add(plot(15, 15, 0x86d15c));
  g.add(at(rbox(8.4, 0.1, 6.6, 0xa7dc6e, 0.05), -2.9, 0.1, -3.4));
  // pen fence (gap on the east side for the gate)
  g.add(at(fence(8.6), -2.9, 0, -6.8), at(fence(8.6), -2.9, 0, 0), rot(at(fence(6.8), -7.2, 0, -3.4), 0, Math.PI / 2));
  g.add(rot(at(fence(3.2), 1.4, 0, -5.2), 0, Math.PI / 2));
  g.add(at(rbox(1.6, 0.5, 0.8, 0x9aa3ad, 0.12), -5.8, 0.25, -6), at(rbox(1.4, 0.1, 0.6, 0x6ec6f0, 0.04), -5.8, 0.5, -6));

  const spots = [0x3a3232, 0x6b4a36, 0x3a3232, 0x8a8a8a, 0x3a3232, 0x6b4a36, 0x2b2b2b, 0x3a3232];
  const cows = spots.map((c, i) => {
    const k = cow(c);
    k.scale.setScalar(0.82);
    k.userData.home = { x: -6 + (i % 4) * 2, z: -5 + Math.floor(i / 4) * 2.6 };
    k.position.set(k.userData.home.x, 0, k.userData.home.z);
    k.rotation.y = rand(-0.6, 0.6);
    g.add(k);
    return k;
  });
  idleBob(cows, ticker, 0.025);

  // Milk-o-matic 3000
  const machine = grp();
  machine.add(at(rbox(3.2, 2.5, 2.3, 0x6ec6f0, 0.3), 0, 1.25, 0));
  machine.add(at(rbox(0.12, 1.9, 1.5, 0x26303d, 0.08), -1.58, 1.0, 0), at(rbox(0.12, 1.9, 1.5, 0x26303d, 0.08), 1.58, 1.0, 0));
  machine.add(at(rbox(3.3, 0.25, 2.4, 0xfdf8ee, 0.1), 0, 2.55, 0));
  const tank = at(cyl(0.7, 0.7, 1.1, 0xffffff, 16), -0.6, 3.2, 0);
  machine.add(tank, at(ball(0.7, 0xdfe6ee, 16), -0.6, 3.75, 0));
  machine.add(rot(at(cyl(0.12, 0.12, 1.5, 0xc9ced6, 8), 0.75, 3.0, 0.3), 0, 0, 0), at(cyl(0.12, 0.12, 2.6, 0xc9ced6, 8), 0.75, 2.4, 1.5).rotateX(Math.PI / 2));
  const lights = [0xff5a5f, 0xffd23f, 0x5ad36b].map((c, i) => at(noShadow(ball(0.13, mat(c, { emissive: c, emissiveIntensity: 0.2 }), 8)), 0.5 + i * 0.4, 2.2, 1.17));
  machine.add(...lights);
  const s3000 = at(sign('MILK-O-MATIC\n3000', 2.3, 0.95, { bg: '#fdf8ee', fg: '#2a6fb0', font: 'bold 54px "Lilita One", "Arial Rounded MT Bold", sans-serif', border: '#2a6fb0' }), -0.35, 1.25, 1.17);
  const s4000 = at(sign('MILK-O-MATIC\n4000', 2.3, 0.95, { bg: '#2b1055', fg: '#ffd23f', font: 'bold 54px "Lilita One", "Arial Rounded MT Bold", sans-serif', border: '#ffd23f' }), -0.35, 1.25, 1.17);
  s4000.visible = false;
  machine.add(s3000, s4000);
  machine.position.set(3.3, 0, LANE);
  g.add(machine);

  // packager with exit slot + tray
  const pack = grp();
  pack.add(at(rbox(2, 1.6, 1.6, 0xf5a742, 0.22), 0, 0.8, 0));
  pack.add(at(rbox(0.9, 0.5, 0.1, 0x26303d, 0.05), 0, 0.75, 0.8), at(rbox(1.1, 0.1, 1.3, 0xc9ced6, 0.04), 0, 0.46, 1.4));
  pack.add(at(rbox(1.5, 0.3, 1.1, 0xfdf8ee, 0.08), 0, 1.7, 0));
  pack.position.set(3.3, 0, LANE + 1.95);
  g.add(pack);
  // 4000 processing attachment
  const m4000 = grp(
    at(rbox(1.7, 1.1, 1.3, 0x9b5de5, 0.2), 0, 0.55, 0),
    at(rbox(1.8, 0.14, 1.4, 0xffd23f, 0.05), 0, 1.15, 0),
    at(cyl(0.05, 0.05, 0.8, 0xffd23f, 6), 0.5, 1.6, 0), at(noShadow(ball(0.14, mat(0xff5a5f, { emissive: 0xff2222, emissiveIntensity: 0.6 }), 8)), 0.5, 2.05, 0),
  );
  const cheese = emojiSprite('🧀', 0.9);
  cheese.position.set(-0.3, 1.75, 0);
  m4000.add(cheese);
  m4000.position.set(3.3, 1.85, LANE + 1.95);
  m4000.visible = false;
  g.add(m4000);
  ticker((dt, t) => { cheese.position.y = 1.75 + Math.sin(t * 3) * 0.1; });

  function setUpgrade(i) {
    const on = i === 1;
    if (on && !m4000.visible) { m4000.scale.setScalar(0.01); scaleTo(m4000, 1, 0.4); }
    m4000.visible = on; s4000.visible = on; s3000.visible = !on;
  }

  const qx = (i) => ENTRY - 1.3 - i * 1.75;

  async function goHome(c) {
    await walkTo(c, 6.9, LANE, 5);
    await walkTo(c, 6.9, -3.6, 6);
    await walkTo(c, 2.2, -3.6, 6);
    await walkTo(c, c.userData.home.x, c.userData.home.z, 6);
    c.rotation.y = rand(-0.6, 0.6);
    c.userData.busy = false;
  }

  async function play(res, ctx) {
    cows.forEach((c) => { c.userData.busy = true; });
    // line up single file (walk out the gate, then down the lane)
    await Promise.all(cows.map(async (c, i) => {
      await wait(i * 0.07);
      await walkTo(c, 2.3, -1.6 - (i % 2) * 0.01, 9);
      await walkTo(c, 0.3, 1.2, 9);
      await walkTo(c, qx(i), LANE, 9);
      c.rotation.y = 0;
    }));
    for (let i = 0; i < cows.length; i++) {
      const c = cows[i], slot = res.slots[i];
      await walkTo(c, 3.3, LANE, 7.5);
      // queue shuffles forward
      cows.slice(i + 1).forEach((o, j) => walkTo(o, qx(j), LANE, 5));
      ctx.sfx('pump');
      lights.forEach((l, j) => { l.material.emissiveIntensity = 1.5; });
      await tween(0.42, (k, raw) => {
        const w = Math.sin(raw * Math.PI * 5) * 0.05;
        machine.scale.set(1 + w, 1 - w, 1 + w);
        tank.scale.y = 1 + Math.sin(raw * Math.PI * 3) * 0.12;
      }, ease.linear);
      machine.scale.set(1, 1, 1);
      lights.forEach((l) => { l.material.emissiveIntensity = 0.2; });
      puff(g, { x: 2.7, y: 4.4, z: LANE }, { color: 0xffffff, n: 3, size: 0.2 });
      goHome(c);
      // product slides out of the packager slot
      const item = slot.prize.product
        ? grp(rbox(0.5, 0.4, 0.5, 0xffe08a, 0.1), at(rbox(0.52, 0.1, 0.52, 0xe5383b, 0.04), 0, 0, 0))
        : grp(at(cyl(0.2, 0.22, 0.55, 0xffffff, 12), 0, 0, 0), at(cyl(0.1, 0.14, 0.2, 0xffffff, 10), 0, 0.36, 0), at(cyl(0.11, 0.11, 0.08, slot.prize.id === 'chocmilk' ? 0x7b4a2a : 0x2f8fe5, 10), 0, 0.5, 0));
      item.position.set(3.3, 0.8, LANE + 2.6);
      g.add(item);
      const ico = emojiSprite(slot.prize.icon, 0.7 + slot.tier * 0.2);
      ico.position.set(0, 0.95, 0);
      item.add(ico);
      moveTo(item, { z: LANE + 3.7 }, 0.25, ease.out).then(() => wait(0.7)).then(() => scaleTo(item, 0.01, 0.2, ease.in)).then(() => g.remove(item));
      ctx.prize(slot, wp(g, 3.3, 2.2, LANE + 3.5));
      await wait(0.38);
    }
    await wait(0.4);
  }

  return { group: g, setUpgrade, play };
}
