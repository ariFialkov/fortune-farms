// SLAUGHTERHOUSE — animals queue at the mysterious "free massages" door; cuts roll out on a conveyor.
import { rbox, cyl, ball, at, rot, grp, plot, wp, puff, prizeModel, model, gust, mat, cow, pig, chicken, sign, noShadow , applyPlace, toLocal } from '../kit.js';
import { tween, wait, ease, rand, walkTo, moveTo, ticker, scaleTo } from '../anim.js';

const DOOR = { x: -1.4, z: -0.6 };
const QUEUE = [[-1.4, 1.4], [-1.4, 3.0], [-1.4, 4.6], [-1.6, 6.1], [-3.2, 6.3], [-4.8, 6.3], [-6.3, 6.1], [-6.5, 4.5]];
const BELT_Z = -2.9;

export function createSlaughter(scene, pos) {
  const g = grp();
  applyPlace(g, pos);
  scene.add(g);
  g.add(at(rbox(1.8, 0.1, 7, 0xd9d4c8, 0.05), DOOR.x, 0.1, 3), at(rbox(6.6, 0.1, 1.8, 0xd9d4c8, 0.05), -4.2, 0.1, 6.2));

  const b = grp();
  b.add(at(rbox(5.6, 3.6, 4.6, 0x8f8aa8, 0.2), 0, 1.8, 0));
  b.add(at(rbox(6, 0.4, 5, 0x5b556f, 0.12), 0, 3.75, 0));
  b.add(at(cyl(0.45, 0.5, 1.8, 0x5b556f, 10), -1.6, 4.7, -1.2));
  b.add(at(rbox(1.7, 2.3, 0.12, 0xd9534f, 0.08), 0, 1.15, 2.3), at(rbox(1.4, 2.05, 0.14, 0x15101c, 0.06), 0, 1.05, 2.32));
  const door = at(rbox(1.4, 2.05, 0.1, 0x6b4425, 0.06), 0, 1.05, 2.4);
  b.add(door, at(noShadow(ball(0.08, 0xffd23f, 6)), 0.5, 1.0, 2.47));
  const sg = sign('FREE\nMASSAGES', 2.7, 1.25, { bg: '#e9d3a3', fg: '#b3261e', font: 'bold 64px "Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive', crude: true, border: '#7a5a34' });
  const board = grp(at(sg, 0, 0, 0.05), rbox(2.8, 1.35, 0.08, 0x7a5a34, 0.04));
  board.position.set(0.1, 2.95, 2.42);
  board.rotation.z = -0.06;
  b.add(board);
  // exit slot + certification plaques on the visible side walls
  b.add(at(rbox(0.12, 0.9, 1.5, 0x15101c, 0.05), 2.8, 1.45, 0));
  const halal = grp(at(sign('HALAL', 1.7, 0.6, { bg: '#1f9d55', fg: '#ffffff', font: 'bold 70px sans-serif', border: '#ffffff' }), 0, 0, 0.05), rbox(1.8, 0.7, 0.08, 0xffffff, 0.04));
  const kosher = grp(at(sign('KOSHER', 1.7, 0.6, { bg: '#2563c9', fg: '#ffffff', font: 'bold 70px sans-serif', border: '#ffffff' }), 0, 0, 0.05), rbox(1.8, 0.7, 0.08, 0xffffff, 0.04));
  halal.add(at(model('halal', 0.7), -1.25, 0, 0.12));
  kosher.add(at(model('kosher', 0.7), -1.25, 0, 0.12));
  for (const p of [halal, kosher]) { p.position.set(1.75, 1.5, 2.36); p.visible = false; b.add(p); }
  b.position.set(DOOR.x, 0, DOOR.z - 2.3);
  g.add(b);

  // conveyor
  const belt = grp(at(rbox(5.2, 0.25, 1.3, 0x3a3a44, 0.1), 0, 1.0, 0));
  for (let i = 0; i < 3; i++) belt.add(at(cyl(0.1, 0.1, 1, 0x6b6b77, 6), -2 + i * 2, 0.5, 0.45), at(cyl(0.1, 0.1, 1, 0x6b6b77, 6), -2 + i * 2, 0.5, -0.45));
  const stripes = [];
  for (let i = 0; i < 7; i++) { const s = at(rbox(0.12, 0.04, 1.2, 0x55555f, 0.02), -2.4 + i * 0.8, 1.14, 0); stripes.push(s); belt.add(s); }
  belt.add(at(rbox(1.3, 0.9, 1.5, 0xc9945a, 0.1), 3.1, 0.45, 0));
  belt.position.set(DOOR.x + 2.8 + 2.6, 0, BELT_Z - 0.6 + 0.6);
  g.add(belt);
  const beltX0 = DOOR.x + 2.9, beltX1 = DOOR.x + 7.6;

  const kinds = [pig, cow, chicken, pig, cow, pig, chicken, cow];
  const animals = kinds.map((make, i) => {
    const a = make();
    if (make === cow) a.scale.setScalar(0.78);
    if (make === chicken) a.scale.setScalar(1.25);
    a.userData.s = a.scale.x;
    g.add(a);
    return a;
  });
  const lineUp = () => animals.forEach((a, i) => {
    a.visible = true;
    a.position.set(QUEUE[i][0], 0, QUEUE[i][1]);
    const nx = i ? QUEUE[i - 1] : [DOOR.x, DOOR.z];
    a.rotation.y = Math.atan2(-(nx[1] - QUEUE[i][1]), nx[0] - QUEUE[i][0]);
  });
  lineUp();
  let steam = 0;
  ticker((dt) => { if ((steam += dt) > 1.1) { steam = 0; puff(g, { x: DOOR.x - 1.6, y: 5.7, z: DOOR.z - 3.5 }, { color: 0xf2f2f7, n: 1, size: 0.3, up: 1.6, spread: 0.3, dur: 1.4 }); } });

  function setUpgrade(i) {
    [halal, kosher].forEach((p, j) => {
      const on = i === j + 1;
      if (on && !p.visible) { p.scale.setScalar(0.01); scaleTo(p, 1, 0.4); }
      p.visible = on;
    });
  }

  async function play(res, ctx) {
    lineUp();
    await wait(0.3);
    for (let i = 0; i < animals.length; i++) {
      const a = animals[i], slot = res.slots[i];
      moveTo(door, { y: 3.0 }, 0.15);
      await walkTo(a, DOOR.x, DOOR.z - 0.7, 7);
      a.visible = false;
      moveTo(door, { y: 1.05 }, 0.12, ease.in);
      animals.slice(i + 1).forEach((o, j) => walkTo(o, QUEUE[j][0], QUEUE[j][1], 4.5));
      ctx.sfx('thump');
      await tween(0.34, (k, raw) => { const w = Math.sin(raw * Math.PI * 4) * 0.035; b.scale.set(1 + w, 1 - w, 1 + w); }, ease.linear);
      b.scale.set(1, 1, 1);
      puff(g, { x: DOOR.x - 1.6, y: 5.7, z: DOOR.z - 3.5 }, { color: 0xffffff, n: 4, size: 0.28, up: 1.6 });
      const meat = prizeModel(slot.prize, 1.15);
      meat.position.set(beltX0, 1.7, BELT_Z);
      g.add(meat);
      tween(1.3, (k) => { meat.position.x = beltX0 + (beltX1 - beltX0) * k; stripes.forEach((s) => { s.position.x = ((s.position.x + 2.4 + 0.02) % 5) - 2.4; }); }, ease.linear)
        .then(() => moveTo(meat, { y: 0.9 }, 0.15, ease.in)).then(() => g.remove(meat));
      ctx.prize(slot, wp(g, beltX0 + 0.8, 2.6, BELT_Z));
      await wait(0.36);
    }
    await wait(0.9);
    // a fresh batch of "clients" strolls in
    animals.forEach((a, i) => { a.visible = true; a.position.set(QUEUE[i][0], 0, QUEUE[i][1]); a.scale.setScalar(0.01); tween(0.35, (k) => a.scale.setScalar(Math.max(0.01, a.userData.s * k)), ease.back); });
    lineUp();
  }

  return { group: g, setUpgrade, play };
}
