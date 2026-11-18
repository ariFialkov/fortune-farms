// CROPS — a combine drives back and forth through the field; prizes pop up as found.
import * as THREE from 'three';
import { rbox, cyl, at, rot, grp, plot, wp, puff, emojiSprite, mat, lerp, noShadow, cone , applyPlace, toLocal } from '../kit.js';
import { tween, wait, ease, rand, scaleTo, arcTo, moveTo } from '../anim.js';

const ROWS = [-6.9, -2.3, 2.3, 6.9];
const HALF = 18.5;                 // half-length of the field along the rows
const TIERS = [0xe5383b, 0x2f8fe5, 0xf5c542];
const BASE = 1.45;                 // combine size

export function createCrops(scene, pos) {
  const g = grp();
  applyPlace(g, pos);
  scene.add(g);
  g.add(at(rbox(HALF * 2 + 1, 0.3, 19.4, 0x9a6b3f, 0.15), 0, 0.1, 0));
  for (let i = 0; i < 16; i++) g.add(at(rbox(HALF * 2 + 0.4, 0.12, 0.34, 0x855a33, 0.06), 0, 0.28, -9 + i * 1.2));

  // sprouts: one instanced mesh, cut by zeroing an instance's scale
  const PER = 46, LINES = [-1.5, -0.5, 0.5, 1.5];
  const N = ROWS.length * LINES.length * PER;
  const sproutGeo = new THREE.ConeGeometry(0.17, 0.75, 6);
  sproutGeo.translate(0, 0.62, 0);
  const sprouts = new THREE.InstancedMesh(sproutGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), N);
  sprouts.castShadow = true;
  const sx = new Float32Array(N), sz = new Float32Array(N), sh = new Float32Array(N), cut = new Uint8Array(N);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  const setSprout = (i, k) => { m4.makeScale(k, k * sh[i], k).setPosition(sx[i], 0, sz[i]); sprouts.setMatrixAt(i, m4); };
  let n = 0;
  ROWS.forEach((z, r) => LINES.forEach((dz) => {
    for (let i = 0; i < PER; i++, n++) {
      sx[n] = -HALF + 0.6 + (i * (HALF * 2 - 1.2)) / (PER - 1) + rand(-0.12, 0.12);
      sz[n] = z + dz * 1.05 + rand(-0.08, 0.08);
      sh[n] = rand(0.8, 1.25);
      setSprout(n, 1);
      sprouts.setColorAt(n, col.setHex([0x8ccf3f, 0xe2c744, 0x6fbf3a, 0xb7d94a][(r + i) % 4]));
    }
  }));
  g.add(sprouts);
  const rowStart = (r) => r * LINES.length * PER;

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
  const PARK = { x: -14, y: 0.25, z: 11.4 };
  combine.scale.setScalar(BASE);
  combine.position.set(PARK.x, PARK.y, PARK.z);
  g.add(combine);

  function setUpgrade(i) {
    bodyMat.color.setHex(TIERS[i]);
    bodyMat.emissive.setHex(i === 2 ? 0x5a3d00 : 0);
    combine.scale.setScalar(BASE * (1 + i * 0.09));
  }

  async function play(res, ctx) {
    const slots = res.slots, END = HALF + 2.5;
    combine.rotation.y = 0;
    await moveTo(combine, { x: -END, z: ROWS[0] }, 0.6);
    for (let r = 0; r < 4; r++) {
      const dir = r % 2 ? -1 : 1;
      combine.rotation.y = dir > 0 ? 0 : Math.PI;
      const ks = [0.16, 0.38, 0.6, 0.82].map((k) => k + rand(-0.08, 0.08));
      const rowSlots = slots.slice(r * 4, r * 4 + 4);
      const i0 = rowStart(r), i1 = rowStart(r + 1);
      let next = 0, dust = 0;
      ctx.sfx('engine');
      await tween(1.75, (k, raw) => {
        const x = lerp(-END * dir, END * dir, k);
        combine.position.x = x;
        combine.position.y = PARK.y + Math.sin(raw * 60) * 0.03;
        reel.rotation.z -= 0.35;
        let changed = false;
        for (let i = i0; i < i1; i++) if (!cut[i] && (dir > 0 ? sx[i] < x + 2.3 : sx[i] > x - 2.3)) { cut[i] = 1; setSprout(i, 0.001); changed = true; }
        if (changed) sprouts.instanceMatrix.needsUpdate = true;
        if ((dust += 1) % 4 === 0 && Math.abs(x) < HALF) puff(g, { x: x - dir * 2, y: 0.5, z: ROWS[r] + rand(-1.6, 1.6) }, { color: 0xe8d28a, n: 2, size: 0.16, up: 1.1 });
        while (next < 4 && raw >= ks[next]) {
          const slot = rowSlots[next++];
          const px = x - dir * 1.8, pz = ROWS[r] + rand(-1.4, 1.4);
          if (slot.prize) {
            const sp = emojiSprite(slot.prize.icon, 1.2 + slot.tier * 0.3);
            sp.position.set(px, 0.5, pz);
            g.add(sp);
            arcTo(sp, { x: px - dir * 0.8, y: 1.9, z: pz }, 0.35, 1.6).then(() => wait(0.5)).then(() => g.remove(sp));
            ctx.prize(slot, wp(g, px, 2.2, pz));
          } else puff(g, { x: px, y: 0.4, z: pz }, { color: 0xb98a55, n: 5, size: 0.18 });
        }
      }, ease.linear);
      if (r < 3) await moveTo(combine, { z: ROWS[r + 1] }, 0.3);
    }
    // drive home while the field regrows
    combine.rotation.y = 0;
    moveTo(combine, PARK, 0.9);
    await wait(0.5);
    cut.fill(0);
    tween(0.7, (k) => { for (let i = 0; i < N; i++) setSprout(i, Math.max(0.001, k)); sprouts.instanceMatrix.needsUpdate = true; }, ease.back);
  }

  return { group: g, setUpgrade, play };
}
