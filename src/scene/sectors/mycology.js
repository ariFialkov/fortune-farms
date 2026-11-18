// MYCOLOGY — farmers walk truffle pigs on leashes; prizes pop up as each pig finds them.
import * as THREE from 'three';
import { yardSpot, gate } from '../layout.js';
import { rbox, cyl, ball, cone, at, rot, grp, plot, wp, puff, emojiSprite, farmer, pig, pine, tree, prism, noShadow } from '../kit.js';
import { tween, wait, ease, rand, walkTo, ticker, arcTo } from '../anim.js';

function shroom(s, cap) {
  return grp(at(cyl(0.08 * s, 0.1 * s, 0.3 * s, 0xfdf8ee, 8), 0, 0.15 * s, 0), at(ball(0.22 * s, cap, 10), 0, 0.32 * s, 0)).add(at(noShadow(ball(0.05 * s, 0xffffff, 6)), 0.1 * s, 0.45 * s, 0.08 * s));
}

export function createMycology(scene, pos) {
  const g = grp();
  g.position.set(pos[0], 0, pos[1]);
  scene.add(g);
  g.add(at(cyl(8.2, 8.2, 0.1, 0x7a6248, 28), 0.4, 0.06, 0.4), at(cyl(7.4, 7.4, 0.1, 0x6b8f4a, 28), 0.6, 0.09, 0.6));
  // forest backdrop
  [[-6.2, -6.3, 1.25], [-3.4, -6.6, 1.05], [-0.4, -6.4, 1.3], [2.6, -6.6, 1.0], [5.6, -6.2, 1.2], [-6.5, -3.2, 1.1], [-6.4, 0.2, 0.95], [-6.6, 3.4, 1.15]].forEach(([x, z, s], i) => g.add(at(i % 3 === 1 ? tree(s * 0.9, 0x3f9b55) : pine(s), x, 0, z)));
  // logs, stumps and decorative mushrooms
  g.add(rot(at(cyl(0.45, 0.45, 2.6, 0x7a4e26, 10), 3.8, 0.5, -3.2), 0, 0.5, Math.PI / 2), at(cyl(0.5, 0.6, 0.6, 0x8a5a2b, 10), -2.2, 0.35, 3.6), at(cyl(0.42, 0.42, 0.06, 0xd9b98a, 10), -2.2, 0.66, 3.6));
  const caps = [0xe5383b, 0xc98a4a, 0xf2e2c4, 0xe5383b, 0x9b5de5, 0xc98a4a];
  for (let i = 0; i < 26; i++) g.add(at(shroom(rand(0.8, 1.7), caps[i % 6]), rand(-4.8, 6.2), 0.15, rand(-4.6, 6.2)));
  // forager's hut
  g.add(at(rbox(2.4, 1.8, 2.2, 0xc9945a, 0.15), -4.6, 0.9, -4.4), rot(at(prism(3, 1.3, 2.8, 0x3f7a4a), -4.6, 1.75, -4.4), 0, 0, 0), at(rbox(0.7, 1.2, 0.1, 0x6b4425, 0.06), -4.6, 0.6, -3.28));

  const ZONES = [[-3.5, 1.5, -2.5, 0.5], [0, 6, -2, 2.5], [-3.5, 4, 2.5, 6]];
  const teams = ZONES.map((zone, i) => {
    const p = pig();
    p.scale.setScalar(0.8);
    const f = farmer([0x2ec4b6, 0xffb347, 0xe5533d][i], 0x5a7d3a);
    f.scale.setScalar(0.85);
    const home = { x: -2.6 + i * 1.5, z: -3.4 + i * 0.5 };
    p.position.set(home.x + 1.2, 0, home.z + 0.9);
    const [yx, yz] = yardSpot(304 + i * 17, 6.2 + (i % 2) * 1.2), [gx, gz] = gate('mycology');
    const yard = { x: yx - pos[0], z: yz - pos[1] }, out = { x: gx - pos[0], z: gz - pos[1] };
    f.position.set(yard.x, 0, yard.z);
    f.rotation.y = -Math.PI / 4;
    p.rotation.y = -0.6;
    const leash = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0x5a3a1e }));
    leash.frustumCulled = false;
    leash.visible = false;
    g.add(p, f, leash);
    return { p, f, leash, zone, home, yard, out };
  });
  ticker(() => teams.forEach(({ p, f, leash }) => {
    const a = leash.geometry.attributes.position;
    a.setXYZ(0, f.position.x, f.position.y + 0.8, f.position.z);
    a.setXYZ(1, p.position.x, p.position.y + 0.65, p.position.z);
    a.needsUpdate = true;
  }));

  const follow = (t, x, z, speed) => {
    const dx = x - t.f.position.x, dz = z - t.f.position.z, d = Math.hypot(dx, dz) || 1;
    return walkTo(t.f, x - (dx / d) * 1.5, z - (dz / d) * 1.5, speed * 0.95, 0.1);
  };

  async function play(res, ctx) {
    // the foragers jog over from the farmhouse to collect their pigs
    await Promise.all(teams.map(async (t, ti) => {
      await wait(ti * 0.12);
      await walkTo(t.f, t.out.x, t.out.z, 15, 0.14);
      await walkTo(t.f, t.home.x, t.home.z, 17, 0.14);
      t.leash.visible = true;
    }));
    await Promise.all(teams.map(async (t, ti) => {
      await wait(ti * 0.35 + rand(0.3));
      for (let j = 0; j < 3; j++) {
        const slot = res.slots[ti * 3 + j];
        const x = rand(t.zone[0], t.zone[1]), z = rand(t.zone[2], t.zone[3]);
        const sp = rand(4.2, 6);
        follow(t, x, z, sp);
        await walkTo(t.p, x, z, sp, 0.14);
        // sniff sniff
        await tween(rand(0.3, 0.7), (k, raw) => { t.p.rotation.z = -0.18 + Math.sin(raw * 30) * 0.05; t.p.rotation.y += Math.sin(raw * 12) * 0.02; }, ease.linear);
        t.p.rotation.z = 0;
        const fx = x + Math.cos(t.p.rotation.y) * 0.9, fz = z - Math.sin(t.p.rotation.y) * 0.9;
        if (slot.prize) {
          ctx.sfx('oink');
          arcTo(t.p, { x, y: 0, z }, 0.3, 0.7);
          puff(g, { x: fx, y: 0.3, z: fz }, { color: 0x7a6248, n: 6, size: 0.14, up: 1 });
          const m = emojiSprite(slot.prize.icon, 0.9 + slot.tier * 0.25);
          m.position.set(fx, 0.3, fz);
          g.add(m);
          arcTo(m, { x: fx, y: 0.7, z: fz }, 0.35, 1.2).then(() => wait(0.9)).then(() => g.remove(m));
          ctx.prize(slot, wp(g, fx, 1.8, fz));
          await wait(0.4);
        } else {
          ctx.miss(wp(g, x, 1.6, z), '❔');
          await wait(0.15);
        }
      }
    }));
    await wait(0.4);
    await Promise.all(teams.map(async (t) => {
      await walkTo(t.p, t.home.x + 1.2, t.home.z + 0.9, 7, 0.14);
      t.p.rotation.y = -0.6;
      t.leash.visible = false;
      walkTo(t.f, t.out.x, t.out.z, 11, 0.12).then(() => walkTo(t.f, t.yard.x, t.yard.z, 9, 0.12)).then(() => { t.f.rotation.y = -Math.PI / 4; });
    }));
  }

  return { group: g, setUpgrade() {}, play };
}
