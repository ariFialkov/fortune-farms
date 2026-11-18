// FISHERY — four net pens dump their fish into a tube that counts them into the processor.
import * as THREE from 'three';
import { SECTORS } from '../../math/data.js';
import { rbox, cyl, ball, at, rot, grp, plot, wp, puff, emojiSprite, mat, torus, noShadow, sign } from '../kit.js';
import { tween, wait, ease, rand, moveTo, ticker, arcTo } from '../anim.js';

const PENS = [[-4.2, -3.6], [-0.4, -4.4], [-4.6, 0.4], [-0.8, -0.4]];
const BUOY = [0x8d99ae, 0xffd23f, 0xff7f50, 0x9b5de5];
const FUNNEL = new THREE.Vector3(2.2, 3.0, 1.6);
const MACHINE = new THREE.Vector3(4.6, 0, 4.4);

export function createFishery(scene, pos) {
  const g = grp();
  g.position.set(pos[0], 0, pos[1]);
  scene.add(g);
  g.add(at(cyl(6.6, 6.6, 0.2, 0xf5e2a8, 40), -2, 0.06, -1.8));
  const pond = at(cyl(6.1, 6.1, 0.2, mat(0x45b5e8, { transparent: true, opacity: 0.92 }), 40), -2, 0.12, -1.8);
  pond.castShadow = false;
  g.add(pond);
  g.add(at(rbox(3.4, 0.2, 1.2, 0xc9945a, 0.06), 2.6, 0.35, -1.2));

  const pens = PENS.map(([x, z], i) => {
    const p = grp();
    p.add(rot(torus(1.35, 0.14, 0xfdf8ee, 20), Math.PI / 2));
    for (let k = 0; k < 4; k++) p.add(at(ball(0.2, BUOY[i], 8), Math.cos(k * 1.57) * 1.35, 0.1, Math.sin(k * 1.57) * 1.35));
    const net = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1.1, 12, 3, true), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.8 }));
    net.rotation.x = Math.PI;
    net.position.y = -0.5;
    p.add(net);
    p.userData.net = net;
    p.position.set(x, 0.3, z);
    g.add(p);
    return p;
  });

  // fish tube from the funnel over the pond to the processing machine
  const curve = new THREE.CatmullRomCurve3([FUNNEL.clone(), new THREE.Vector3(3, 3.9, 2.4), new THREE.Vector3(4.2, 3.6, 3.6), new THREE.Vector3(4.6, 2.2, 4.3)]);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.32, 10), new THREE.MeshLambertMaterial({ color: 0xbfefff, transparent: true, opacity: 0.45 }));
  g.add(tube);
  g.add(at(cyl(0.9, 0.3, 0.8, 0xc9ced6, 14), FUNNEL.x, FUNNEL.y - 0.1, FUNNEL.z));
  g.add(at(cyl(0.08, 0.08, 2.9, 0x8a5a2b, 6), FUNNEL.x, 1.45, FUNNEL.z));
  const machine = grp(
    at(rbox(2.8, 2.1, 2.6, 0x2ec4b6, 0.25), 0, 1.05, 0),
    at(rbox(3, 0.25, 2.8, 0xfdf8ee, 0.1), 0, 2.2, 0),
    at(cyl(0.3, 0.3, 0.9, 0x8d99ae, 10), -0.8, 2.7, -0.7),
    at(rbox(1.6, 0.9, 0.1, 0x14323a, 0.06), 0, 1.25, 1.32),
    at(sign('FISH-O-COUNT', 2.2, 0.42, { bg: '#fdf8ee', fg: '#167a70', font: 'bold 52px "Lilita One", sans-serif', border: '' }), 0, 0.5, 1.32),
  );
  machine.position.copy(MACHINE);
  g.add(machine);
  const screenIcon = emojiSprite('🐟', 0.8);
  screenIcon.position.set(MACHINE.x, 1.25, MACHINE.z + 1.5);
  g.add(screenIcon);

  // ambient: an occasional jumping fish
  let jump = 0;
  ticker((dt) => {
    if ((jump += dt) > 2.4) {
      jump = rand(0.8);
      const [x, z] = PENS[Math.floor(rand(4))];
      const s = emojiSprite('🐟', 0.5);
      s.position.set(x, 0.3, z);
      g.add(s);
      arcTo(s, { x: x + rand(-0.6, 0.6), y: 0.3, z: z + rand(-0.6, 0.6) }, 0.6, 1.1).then(() => g.remove(s));
    }
  });

  async function play(res, ctx) {
    const labelPos = wp(g, MACHINE.x, 4.2, MACHINE.z);
    const label = ctx.label(labelPos);
    let haul = 0;
    for (let gi = 0; gi < 4; gi++) {
      const pen = pens[gi], net = pen.userData.net;
      const slots = res.slots.filter((s) => s.g === gi);
      const info = SECTORS.fishery.paytable[gi];
      let count = 0, sub = 0;
      const show = () => label.set(`${info.icon} ${info.name} <b>×${count}</b><i>+${sub.toLocaleString()}</i>`);
      screenIcon.material.map = emojiSprite(info.icon).material.map;
      show();
      ctx.sfx('splash');
      puff(g, { x: pen.position.x, y: 0.5, z: pen.position.z }, { color: 0xdff6ff, n: 8, size: 0.16, up: 1.4, spread: 1.2 });
      await Promise.all([moveTo(pen, { y: 1.7 }, 0.4, ease.out), moveTo(net, { y: -0.2 }, 0.4)]);
      const jobs = [];
      for (const slot of slots) {
        if (!slot.prize) { await wait(0.025); continue; }
        jobs.push((async () => {
          const s = emojiSprite(slot.prize.icon, 0.7 + slot.tier * 0.5);
          s.position.set(pen.position.x + rand(-0.5, 0.5), 1.6, pen.position.z + rand(-0.5, 0.5));
          g.add(s);
          await arcTo(s, FUNNEL, 0.3, 1.6);
          await tween(0.3, (k) => s.position.copy(curve.getPoint(k)), ease.in);
          g.remove(s);
          count++; sub += slot.value; haul += slot.value;
          show();
          machine.scale.y = 1.06; tween(0.12, (k) => { machine.scale.y = 1.06 - 0.06 * k; });
          if (slot.tier > 0) ctx.prize(slot, wp(g, MACHINE.x, 3.2, MACHINE.z));
          else { ctx.add(slot.value); ctx.sfx('tick'); }
        })());
        await wait(gi === 3 ? 0.28 : 0.085 + gi * 0.02);
      }
      await Promise.all(jobs);
      if (!count) ctx.miss(wp(g, pen.position.x, 2.4, pen.position.z), '🕸️');
      else if (gi < 3) ctx.popup({ icon: info.icon, label: `${info.name} ×${count}`, value: sub, tier: sub >= res.stake * 0.5 ? 1 : 0, pos: wp(g, MACHINE.x, 3.2, MACHINE.z), add: false, named: true });
      await wait(0.3);
      moveTo(pen, { y: 0.3 }, 0.3, ease.in);
      moveTo(net, { y: -0.5 }, 0.3);
      await wait(0.2);
    }
    label.set(`🎣 Total haul <i>+${haul.toLocaleString()}</i>`);
    await wait(1);
    label.remove();
  }

  return { group: g, setUpgrade() {}, play };
}
