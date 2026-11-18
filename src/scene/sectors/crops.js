// CROPS — a combine drives back and forth through the field; prizes pop up as found.
import { rbox, cyl, at, rot, grp, plot, wp, puff, emojiSprite, mat, lerp, noShadow, cone } from '../kit.js';
import { tween, wait, ease, rand, scaleTo, arcTo, moveTo } from '../anim.js';

const ROWS = [-3.75, -1.25, 1.25, 3.75];
const TIERS = [0xe5383b, 0x2f8fe5, 0xf5c542];

export function createCrops(scene, pos) {
  const g = grp();
  g.position.set(pos[0], 0, pos[1]);
  scene.add(g);
  g.add(plot(15, 13, 0x7fcb52));
  g.add(at(rbox(13.6, 0.3, 10.6, 0x9a6b3f, 0.15), 0, 0.12, 0));
  for (let i = 0; i < 9; i++) g.add(at(rbox(13.2, 0.12, 0.34, 0x855a33, 0.06), 0, 0.3, -4.8 + i * 1.2));

  const sprouts = [];
  ROWS.forEach((z, r) => {
    for (let i = 0; i < 15; i++) {
      for (const dz of [-0.55, 0.55]) {
        const s = grp(at(cone(0.16, 0.7, r % 2 ? 0xe2c744 : 0x8ccf3f, 6), 0, 0.6, 0), at(cone(0.12, 0.5, 0x6fbf3a, 6), 0.12, 0.5, 0.08));
        s.position.set(-6.1 + i * 0.87 + rand(-0.1, 0.1), 0, z + dz);
        s.userData.r = r;
        sprouts.push(s);
        g.add(s);
      }
    }
  });

  // combine harvester (faces +X)
  const bodyMat = mat(TIERS[0], {});
  const combine = grp();
  const body = rbox(2.3, 1.3, 1.7, bodyMat, 0.25);
  combine.add(at(body, -0.2, 1.25, 0));
  combine.add(at(rbox(1, 0.95, 1.3, 0xbfe9ff, 0.2), 0.45, 2.2, 0), at(rbox(1.1, 0.14, 1.4, bodyMat, 0.06), 0.45, 2.72, 0));
  combine.add(rot(at(cyl(0.12, 0.12, 1.6, 0x4a4a55, 8), -0.9, 2.3, 0.5), 0, 0, 0.5));
  for (const [x, r] of [[-0.9, 0.5], [0.6, 0.62]]) for (const z of [-0.85, 0.85]) {
    combine.add(rot(at(cyl(r, r, 0.4, 0x3a3a44, 14), x, r, z), Math.PI / 2), rot(at(cyl(r * 0.45, r * 0.45, 0.42, 0xf5c542, 10), x, r, z), Math.PI / 2));
  }
  const reel = grp();
  for (let i = 0; i < 5; i++) {
    const bar = rbox(0.1, 0.1, 2.9, 0xf5c542, 0.04);
    bar.position.set(Math.cos((i * Math.PI * 2) / 5) * 0.5, Math.sin((i * Math.PI * 2) / 5) * 0.5, 0);
    reel.add(bar);
  }
  reel.position.set(1.75, 0.75, 0);
  combine.add(reel, at(rbox(0.7, 0.5, 3.1, 0x4a4a55, 0.12), 1.4, 0.55, 0));
  const PARK = { x: -5.4, y: 0.25, z: -6.6 };
  combine.position.set(PARK.x, PARK.y, PARK.z);
  g.add(combine);

  function setUpgrade(i) {
    bodyMat.color.setHex(TIERS[i]);
    bodyMat.emissive.setHex(i === 2 ? 0x5a3d00 : 0);
    combine.scale.setScalar(1 + i * 0.12);
  }

  async function play(res, ctx) {
    const slots = res.slots;
    await moveTo(combine, { x: -7.6, z: ROWS[0] }, 0.5);
    for (let r = 0; r < 4; r++) {
      const dir = r % 2 ? -1 : 1;
      combine.rotation.y = dir > 0 ? 0 : Math.PI;
      const ks = [0.14, 0.37, 0.6, 0.83].map((k) => k + rand(-0.09, 0.09));
      const rowSlots = slots.slice(r * 4, r * 4 + 4);
      const mine = sprouts.filter((s) => s.userData.r === r);
      let next = 0, dust = 0;
      ctx.sfx('engine');
      await tween(1.55, (k, raw) => {
        const x = lerp(-7.6 * dir, 7.6 * dir, k);
        combine.position.x = x;
        combine.position.y = PARK.y + Math.sin(raw * 60) * 0.03;
        reel.rotation.z -= 0.35;
        for (const s of mine) if (!s.userData.cut && (dir > 0 ? s.position.x < x + 1.6 : s.position.x > x - 1.6)) { s.userData.cut = true; s.scale.setScalar(0.001); }
        if ((dust += 1) % 5 === 0 && Math.abs(x) < 6.5) puff(g, { x: x - dir * 1.4, y: 0.5, z: ROWS[r] + rand(-0.6, 0.6) }, { color: 0xe8d28a, n: 2, size: 0.14, up: 1 });
        while (next < 4 && raw >= ks[next]) {
          const slot = rowSlots[next++];
          const px = x - dir * 1.2, pz = ROWS[r] + rand(-0.7, 0.7);
          if (slot.prize) {
            const sp = emojiSprite(slot.prize.icon, 0.9 + slot.tier * 0.25);
            sp.position.set(px, 0.5, pz);
            g.add(sp);
            arcTo(sp, { x: px - dir * 0.6, y: 1.6, z: pz }, 0.35, 1.4).then(() => wait(0.5)).then(() => g.remove(sp));
            ctx.prize(slot, wp(g, px, 1.8, pz));
          } else puff(g, { x: px, y: 0.4, z: pz }, { color: 0xb98a55, n: 5, size: 0.16 });
        }
      }, ease.linear);
      if (r < 3) await moveTo(combine, { z: ROWS[r + 1] }, 0.28);
    }
    // drive home while the field regrows
    combine.rotation.y = 0;
    moveTo(combine, PARK, 0.8);
    await wait(0.5);
    sprouts.forEach((s) => { s.userData.cut = false; scaleTo(s, 1, 0.5 + rand(0.4)); });
  }

  return { group: g, setUpgrade, play };
}
