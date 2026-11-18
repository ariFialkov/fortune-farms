// POULTRY — hens queue for the "chicken outhouse"; eggs drop into the nest (and sometimes break).
import { rbox, cyl, ball, at, rot, scl, grp, plot, wp, puff, prizeModel, model, gust, mat, chicken, prism, torus, idleBob, noShadow , applyPlace, toLocal } from '../kit.js';
import { tween, wait, ease, rand, walkTo, moveTo, ticker, scaleTo, arcTo } from '../anim.js';

const OUT = { x: 3.6, z: 2.2 };   // outhouse position
const FLOOR = 1.5;                 // outhouse floor height
const ROW_Z = 5.6;

const makeEgg = (id) => model(id, id === 'egg' ? 0.5 : id === 'quailegg' ? 0.36 : id === 'ostrichegg' ? 0.85 : id === 'goldenegg' ? 0.75 : 0.6);

export function createPoultry(scene, pos) {
  const g = grp();
  applyPlace(g, pos);
  scene.add(g);
  g.add(at(rbox(13, 0.1, 1.5, 0xd9d4c8, 0.05), 0, 0.1, ROW_Z));

  // coop
  const coop = grp(
    at(rbox(5.4, 2.4, 3, 0xf28c4b, 0.18), 0, 1.5, 0),
    at(prism(3.6, 1.5, 5.8, 0x9b4a3a), 0, 2.7, 0).rotateY(Math.PI / 2),
    at(rbox(1, 1.2, 0.1, 0x5a3a1e, 0.2), 0, 1.0, 1.52),
    at(rbox(0.8, 0.8, 0.1, 0xfff3d6, 0.3), -1.7, 1.9, 1.52), at(rbox(0.8, 0.8, 0.1, 0xfff3d6, 0.3), 1.7, 1.9, 1.52),
  );
  for (const x of [-2.3, 2.3]) for (const z of [-1.2, 1.2]) coop.add(at(cyl(0.12, 0.12, 0.4, 0x8a5a2b, 6), x, 0.2, z));
  coop.add(rot(at(rbox(0.9, 0.08, 1.4, 0xc9945a, 0.03), 0, 0.2, 2.1), 0.3));
  coop.position.set(-3.6, 0, -5);
  g.add(coop);

  // nests + hens
  const hens = [];
  for (let i = 0; i < 10; i++) {
    const home = { x: -6.4 + (i % 5) * 1.5, z: -2.4 + Math.floor(i / 5) * 1.5 };
    g.add(at(cyl(0.5, 0.4, 0.3, 0xe8c56a, 10), home.x, 0.15, home.z));
    const h = chicken([0xffffff, 0xfff0d0, 0xd98a4a][i % 3]);
    h.userData.home = home;
    h.userData.sitY = 0.02;
    h.position.set(home.x, 0.05, home.z);
    h.rotation.y = -Math.PI / 4;
    g.add(h);
    hens.push(h);
  }
  idleBob(hens, ticker, 0.05);

  // the chicken outhouse on stilts
  const out = grp();
  for (const x of [-0.6, 0.6]) for (const z of [-0.6, 0.6]) out.add(at(cyl(0.08, 0.08, FLOOR, 0x8a5a2b, 6), x, FLOOR / 2, z));
  const hut = grp(
    at(rbox(1.5, 2.1, 1.5, 0xb9824a, 0.1), 0, 1.05, 0),
    at(rbox(0.06, 2, 1.56, 0x9a6b3f, 0.02), -0.35, 1.05, 0), at(rbox(0.06, 2, 1.56, 0x9a6b3f, 0.02), 0.35, 1.05, 0),
    rot(at(rbox(1.9, 0.14, 1.9, 0x7b4a3a, 0.05), 0, 2.25, 0), 0, 0, -0.18),
    at(rbox(0.1, 1.3, 0.8, 0x6b4425, 0.04), -0.76, 0.8, 0),
  );
  const moon = model('moon', 0.5);
  moon.position.set(0, 1.45, 0.78);
  hut.add(moon);
  hut.position.y = FLOOR;
  out.add(hut);
  out.add(rot(at(rbox(2.6, 0.1, 0.7, 0xc9945a, 0.04), -1.9, FLOOR / 2, 0), 0, 0, 0.56));
  out.position.set(OUT.x, 0, OUT.z);
  g.add(out);
  // landing nest + optional pillow
  g.add(at(cyl(0.75, 0.6, 0.3, 0xe8c56a, 12), OUT.x, 0.15, OUT.z), at(torus(0.62, 0.14, 0xd9b24f, 14), OUT.x, 0.3, OUT.z).rotateX(Math.PI / 2));
  const pillow = grp(at(rbox(1.1, 0.34, 0.9, 0xff9ec4, 0.17), 0, 0, 0), at(noShadow(ball(0.07, 0xffffff, 6)), 0, 0.17, 0));
  pillow.position.set(OUT.x, 0.5, OUT.z);
  pillow.visible = false;
  g.add(pillow);

  function setUpgrade(i) {
    if (i === 1 && !pillow.visible) { pillow.scale.setScalar(0.01); scaleTo(pillow, 1, 0.4); }
    pillow.visible = i === 1;
  }

  const qx = (i) => OUT.x - 3.4 - i * 0.85;
  let laid = [];

  async function goHome(h) {
    h.position.set(OUT.x + 1.2, 0, OUT.z);
    h.visible = true;
    await walkTo(h, 6.6, OUT.z - 0.5, 6, 0.3);
    await walkTo(h, 6.6, -4, 7, 0.25);
    await walkTo(h, h.userData.home.x + 0.01, h.userData.home.z, 8, 0.25);
    h.rotation.y = -Math.PI / 4;
    h.userData.busy = false;
  }

  async function play(res, ctx) {
    laid.forEach((e) => g.remove(e));
    laid = [];
    const soft = pillow.visible;
    hens.forEach((h) => { h.userData.busy = true; });
    // pop out of the nests into single file
    await Promise.all(hens.map(async (h, i) => {
      await wait(i * 0.06);
      ctx.sfx('cluck');
      await arcTo(h, { x: h.position.x, y: 0, z: h.position.z + 0.6 }, 0.22, 0.9);
      await walkTo(h, qx(i), OUT.z, 8, 0.25);
      h.rotation.y = 0;
    }));
    for (let i = 0; i < hens.length; i++) {
      const h = hens[i], slot = res.slots[i];
      await walkTo(h, OUT.x - 3.1, OUT.z, 7, 0.2);
      await moveTo(h, { x: OUT.x - 0.8, y: FLOOR }, 0.22, ease.linear);
      h.visible = false;
      h.position.y = 0;
      hens.slice(i + 1).forEach((o, j) => walkTo(o, qx(j), OUT.z, 5, 0.2));
      ctx.sfx('cluck');
      await tween(0.3, (k, raw) => { hut.rotation.z = Math.sin(raw * Math.PI * 4) * 0.07; hut.scale.y = 1 + Math.sin(raw * Math.PI * 2) * 0.06; }, ease.linear);
      hut.rotation.z = 0;
      goHome(h);
      // the drop
      const egg = makeEgg(slot.prize ? slot.prize.id : 'egg');
      egg.userData.r = egg.scale.x * 0.5;
      const landY = (soft ? 0.72 : 0.4) + egg.userData.r * 0.6;
      egg.position.set(OUT.x, FLOOR, OUT.z);
      g.add(egg);
      await moveTo(egg, { y: landY }, 0.24, ease.in);
      if (!slot.prize) {
        g.remove(egg);
        ctx.sfx('crack');
        puff(g, { x: OUT.x, y: 0.5, z: OUT.z }, { color: 0xffd23f, n: 6, size: 0.14, up: 0.9 });
        puff(g, { x: OUT.x, y: 0.5, z: OUT.z }, { color: 0xffffff, n: 5, size: 0.1, up: 1.2 });
        ctx.miss(wp(g, OUT.x, 1.2, OUT.z), 'brokenegg');
        await wait(0.12);
      } else {
        if (soft) tween(0.25, (k, raw) => { pillow.scale.y = 1 - Math.sin(raw * Math.PI) * 0.45; }, ease.linear);
        ctx.prize(slot, wp(g, OUT.x, 1.6, OUT.z));
        const n = laid.length;
        laid.push(egg);
        const dest = { x: 6.3 - n * 0.95, y: 0.16 + egg.userData.r * 0.75, z: ROW_Z };
        (async () => {
          await arcTo(egg, { x: OUT.x + 0.3, y: dest.y, z: OUT.z + 1.5 }, 0.2, 0.5);
          await tween(0.35, (k) => { egg.position.x = OUT.x + 0.3 + (dest.x - OUT.x - 0.3) * k; egg.position.z = OUT.z + 1.5 + (ROW_Z - OUT.z - 1.5) * k; egg.rotation.z = -k * 6.28; }, ease.out);
        })();
        await wait(0.12);
      }
    }
    await wait(0.6);
  }

  return { group: g, setUpgrade, play };
}
