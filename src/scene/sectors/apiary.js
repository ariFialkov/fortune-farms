// APIARY — hives drain through a big funnel into a pot on a scale; value climbs while honey pours.
import * as THREE from 'three';
import { rbox, cyl, ball, at, rot, grp, plot, wp, puff, burst, mat, noShadow, bush } from '../kit.js';
import { tween, wait, ease, rand, ticker } from '../anim.js';

const HONEY = 0xf5a623, MAD = 0xb04dff;

function hive(c) {
  return grp(
    at(rbox(1.3, 0.55, 1.3, c, 0.1), 0, 0.3, 0), at(rbox(1.3, 0.55, 1.3, 0xfdf8ee, 0.1), 0, 0.85, 0), at(rbox(1.3, 0.55, 1.3, c, 0.1), 0, 1.4, 0),
    at(rbox(1.6, 0.2, 1.6, 0x8a5a2b, 0.08), 0, 1.78, 0), at(rbox(0.5, 0.14, 0.06, 0x3a2a1a, 0.03), 0, 0.2, 0.66),
  );
}

export function createApiary(scene, pos) {
  const g = grp();
  g.position.set(pos[0], 0, pos[1]);
  scene.add(g);
  g.add(plot(15, 15, 0x9bdc6b));
  for (const [x, z, s] of [[-5.5, -5.5, 1.2], [5.6, -5.2, 1], [-5.8, 4.8, 0.9], [5.2, 5.6, 1.1]]) g.add(at(bush(s, 0x5cbd4c), x, 0, z));
  for (let i = 0; i < 26; i++) g.add(at(noShadow(ball(0.14, [0xffd23f, 0xff8fb1, 0xffffff, 0xb08cff][i % 4], 6)), rand(-6.5, 6.5), 0.18, rand(-6.5, 6.5)));

  const CX = -0.6, CZ = -0.8, TOP = 4.3;
  // platform with four hives over the funnel
  for (const x of [-2.2, 2.2]) for (const z of [-2.2, 2.2]) g.add(at(cyl(0.16, 0.2, TOP, 0x8a5a2b, 8), CX + x, TOP / 2, CZ + z));
  g.add(at(rbox(5, 0.25, 5, 0xc9945a, 0.1), CX, TOP, CZ));
  [[-1.1, -1.1, 0xffd23f], [1.1, -1.1, 0xffb347], [-1.1, 1.1, 0xffb347], [1.1, 1.1, 0xffd23f]].forEach(([x, z, c]) => g.add(at(hive(c), CX + x, TOP + 0.12, CZ + z)));
  g.add(at(cyl(2.3, 0.35, 1.7, 0xc9ced6, 20), CX, TOP - 0.95, CZ));
  g.add(at(cyl(0.3, 0.24, 0.6, 0x9aa3ad, 12), CX, TOP - 2.05, CZ));
  // scale + pot
  g.add(at(rbox(3, 0.35, 3, 0xe5533d, 0.12), CX, 0.25, CZ), at(rbox(2.6, 0.12, 2.6, 0xc9ced6, 0.05), CX, 0.48, CZ));
  g.add(at(rbox(1.2, 0.8, 0.2, 0xfdf8ee, 0.08), CX, 0.55, CZ + 1.7));
  const needle = at(rbox(0.06, 0.5, 0.06, 0xe5383b, 0.02), CX, 0.62, CZ + 1.82);
  g.add(needle);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 0.95, 1.5, 20, 1, true), new THREE.MeshLambertMaterial({ color: 0xcf7a3a, side: THREE.DoubleSide }));
  pot.position.set(CX, 1.3, CZ);
  pot.castShadow = true;
  g.add(pot, at(cyl(0.95, 0.95, 0.1, 0xcf7a3a, 20), CX, 0.58, CZ));
  const honeyMat = mat(HONEY, { emissive: 0x7a4a00, emissiveIntensity: 0.35 });
  const fill = at(cyl(1.02, 0.96, 1, honeyMat, 20), CX, 0.64, CZ);
  fill.castShadow = false;
  fill.scale.y = 0.02;
  g.add(fill);
  const stream = at(cyl(0.12, 0.1, 1, honeyMat, 8), CX, 1, CZ);
  stream.castShadow = false;
  stream.visible = false;
  g.add(stream);
  const SPOUT_Y = TOP - 2.35;

  const bees = Array.from({ length: 9 }, (_, i) => {
    const b = noShadow(grp(ball(0.09, 0xffd23f, 6), at(ball(0.06, 0x3a2a1a, 6), -0.08, 0, 0)));
    b.userData = { r: rand(1.5, 3.4), s: rand(1, 2.4) * (i % 2 ? 1 : -1), y: TOP + rand(0.5, 2.6), p: rand(6.28) };
    g.add(b);
    return b;
  });
  ticker((dt, t) => bees.forEach((b) => {
    const u = b.userData;
    b.position.set(CX + Math.cos(t * u.s + u.p) * u.r, u.y + Math.sin(t * 5 + u.p) * 0.25, CZ + Math.sin(t * u.s + u.p) * u.r);
  }));

  const setFill = (l) => { fill.scale.y = Math.max(0.02, Math.min(1.35, 0.1 + l * 0.125)); fill.position.y = 0.64 + fill.scale.y / 2; };

  async function play(res, ctx) {
    const slot = res.slots[0], pz = slot.prize;
    const perL = slot.value / pz.litres;
    const baseRate = pz.mad ? perL / 10 : perL;            // value per litre before the mad reveal
    const dur = 1.3 + Math.min(pz.litres, 10) * 0.48;
    const madAt = pz.mad ? Math.min(0.9, dur * 0.35) : Infinity;
    honeyMat.color.setHex(HONEY); honeyMat.emissive.setHex(0x7a4a00); honeyMat.emissiveIntensity = 0.35;
    setFill(0);
    const label = ctx.label(wp(g, CX, 3.1, CZ + 2.2));
    stream.visible = true;
    ctx.sfx('pour');
    let shown = 0, isMad = false, drip = 0;
    // value shown = normal-rate honey until the reveal, then the remainder at mad rate
    const madStartL = pz.mad ? (madAt / dur) * pz.litres : 0;
    const valueAt = (l) => (!pz.mad ? l * perL : l <= madStartL ? l * baseRate : madStartL * baseRate + ((l - madStartL) / (pz.litres - madStartL)) * (slot.value - madStartL * baseRate));
    await tween(dur, (k, raw) => {
      const t = raw * dur, litres = pz.litres * k;
      if (!isMad && t >= madAt) {
        isMad = true;
        honeyMat.color.setHex(MAD); honeyMat.emissive.setHex(0x8a2be2); honeyMat.emissiveIntensity = 1.1;
        ctx.popup({ icon: '🔮', label: 'MAD HONEY! ×10', value: 0, tier: 3, pos: wp(g, CX, 4, CZ), add: false, named: true, noValue: true });
        burst(scene, wp(g, CX, 2.5, CZ), '✨', 12, 0.6);
      }
      const top = fill.position.y + fill.scale.y / 2;
      const wob = 1 + Math.sin(raw * 90) * 0.12;
      stream.scale.set(wob, Math.max(0.05, SPOUT_Y - top), wob);
      stream.position.y = (SPOUT_Y + top) / 2;
      setFill(litres);
      needle.rotation.z = -Math.min(1.3, litres * 0.13) + Math.sin(raw * 60) * 0.03;
      const v = Math.round(valueAt(litres));
      if (v > shown) { ctx.add(v - shown); shown = v; }
      label.set(`${isMad ? '🔮' : '🍯'} <b>${litres.toFixed(1)} L</b><i>+${shown.toLocaleString()}</i>`);
      if ((drip += 1) % 9 === 0) { ctx.sfx('tick'); puff(g, { x: CX + rand(-0.4, 0.4), y: top + 0.1, z: CZ + rand(-0.4, 0.4) }, { color: isMad ? MAD : HONEY, n: 1, size: 0.1, up: 0.5 }); }
    }, ease.linear);
    if (slot.value > shown) ctx.add(slot.value - shown);
    stream.visible = false;
    // last drips
    for (let i = 0; i < 2; i++) { puff(g, { x: CX, y: SPOUT_Y - 0.2, z: CZ }, { color: isMad ? MAD : HONEY, n: 1, size: 0.1, up: -1.2, spread: 0.05 }); await wait(0.18); }
    label.remove();
    ctx.popup({ icon: pz.icon, label: pz.name, value: slot.value, tier: slot.tier, pos: wp(g, CX, 3, CZ + 1), add: false, named: true });
    await wait(1);
  }

  return { group: g, setUpgrade() {}, play };
}
