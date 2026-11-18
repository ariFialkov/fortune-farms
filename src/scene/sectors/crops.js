// CROPS — a combine drives back and forth through the field; prizes pop up as found.
import * as THREE from 'three';
import { rbox, cyl, at, rot, grp, plot, wp, puff, prizeModel, model, gust, mat, lerp, noShadow, cone , applyPlace, toLocal } from '../kit.js';
import { tween, wait, ease, rand, scaleTo, arcTo, ticker } from '../anim.js';

const ROWS = [6.9, 2.3, -2.3, -6.9];
const HALF = 18.5;                 // half-length of the field along the rows
const TIERS = [0xe5383b, 0x2f8fe5, 0xf5c542];
const BASE = 1.45;                 // combine size
const CUT = 15.4;                  // half-length of the planted strip (the rest is headland for turning)
const TURN_X = 16.2, TURN_R = 2.3; // U-turn centres and radius (half the row spacing)
const PER_ROW = 9;                 // prize slots per pass

export function createCrops(scene, pos) {
  const g = grp();
  applyPlace(g, pos);
  scene.add(g);
  g.add(at(rbox(HALF * 2 + 1, 0.3, 19.4, 0x9a6b3f, 0.15), 0, 0.1, 0));
  for (let i = 0; i < 16; i++) g.add(at(rbox(HALF * 2 + 0.4, 0.12, 0.34, 0x855a33, 0.06), 0, 0.28, -9 + i * 1.2));

  // sprouts: one instanced mesh, cut by zeroing an instance's scale
  const PER = 40, LINES = [-1.5, -0.5, 0.5, 1.5];
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
      sx[n] = -CUT + (i * CUT * 2) / (PER - 1) + rand(-0.12, 0.12);
      sz[n] = z + dz * 1.05 + rand(-0.08, 0.08);
      sh[n] = rand(0.8, 1.25);
      setSprout(n, 1);
      sprouts.setColorAt(n, col.setHex([0x8ccf3f, 0xe2c744, 0x6fbf3a, 0xb7d94a][(r + i) % 4]));
    }
  }));
  g.add(sprouts);
  const rowStart = (r) => r * LINES.length * PER;

  // ---------- combine harvester (faces +X) ----------
  // combine: position + heading on the ground. chassis: everything that rumbles with the engine.
  const bodyMat = mat(TIERS[0], {});
  const combine = grp(), chassis = grp();
  combine.add(chassis);
  chassis.add(at(rbox(2.3, 1.3, 1.7, bodyMat, 0.25), -0.2, 1.25, 0));
  chassis.add(at(rbox(1, 0.95, 1.3, 0xbfe9ff, 0.2), 0.45, 2.2, 0), at(rbox(1.1, 0.14, 1.4, bodyMat, 0.06), 0.45, 2.72, 0));
  chassis.add(rot(at(cyl(0.12, 0.12, 1.6, 0x4a4a55, 8), -0.9, 2.3, 0.5), 0, 0, 0.5));
  chassis.add(at(cyl(0.09, 0.09, 0.9, 0x3a3a44, 8), -0.9, 2.3, -0.55), at(cyl(0.12, 0.09, 0.14, 0x3a3a44, 8), -0.9, 2.8, -0.55));
  const reel = grp();
  for (let i = 0; i < 5; i++) {
    const bar = rbox(0.1, 0.1, 2.9, 0xf5c542, 0.04);
    bar.position.set(Math.cos((i * Math.PI * 2) / 5) * 0.5, Math.sin((i * Math.PI * 2) / 5) * 0.5, 0);
    reel.add(bar);
  }
  reel.position.set(1.75, 0.75, 0);
  chassis.add(reel, at(rbox(0.7, 0.5, 3.1, 0x4a4a55, 0.12), 1.4, 0.55, 0));
  // wheels: steer pivot -> spinner. Big driven fronts, smaller steering rears (as on a real combine).
  const wheels = [];
  for (const [x, r, steers] of [[-0.9, 0.5, true], [0.6, 0.62, false]]) for (const z of [-0.85, 0.85]) {
    const spin = grp(rot(cyl(r, r, 0.4, 0x3a3a44, 14), Math.PI / 2), rot(cyl(r * 0.45, r * 0.45, 0.42, 0xf5c542, 10), Math.PI / 2),
      rbox(r * 1.5, 0.12, 0.44, 0xd9a520, 0.04), rbox(0.12, r * 1.5, 0.44, 0xd9a520, 0.04));
    const pivot = grp(spin);
    pivot.position.set(x, r, z);
    combine.add(pivot);
    wheels.push({ pivot, spin, r, steers });
  }
  combine.scale.setScalar(BASE);
  g.add(combine);

  // ---------- the driving line: four passes joined by U-turns, then a lap of the headland back to the start ----------
  // Sampled every ~0.12 units as { x, z, heading, curvature, row } so the combine can follow it by distance.
  const path = [];
  const line = (x0, z0, x1, z1, row = -1) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(len / 0.12), h = Math.atan2(z1 - z0, x1 - x0);
    for (let i = 1; i <= n; i++) path.push({ x: x0 + ((x1 - x0) * i) / n, z: z0 + ((z1 - z0) * i) / n, h, k: 0, row });
  };
  const arc = (cx, cz, a0, sweep) => {
    const n = Math.ceil((Math.abs(sweep) * TURN_R) / 0.12), sgn = Math.sign(sweep);
    for (let i = 1; i <= n; i++) { const a = a0 + (sweep * i) / n; path.push({ x: cx + Math.cos(a) * TURN_R, z: cz + Math.sin(a) * TURN_R, h: a + (sgn * Math.PI) / 2, k: sgn / TURN_R, row: -1 }); }
  };
  const START = { x: -TURN_X, z: ROWS[0], h: 0 };
  const rowMarks = [];   // [startIndex, endIndex] of each pass along the path
  ROWS.forEach((z, r) => {
    const dir = r % 2 ? -1 : 1, i0 = path.length;
    line(-TURN_X * dir, z, TURN_X * dir, z, r);
    rowMarks.push([i0, path.length - 1]);
    if (r < 3) arc(TURN_X * dir, z - TURN_R, Math.PI / 2, -Math.PI * dir);          // U-turn onto the next pass
  });
  arc(-TURN_X, ROWS[3] + TURN_R, -Math.PI / 2, -Math.PI / 2);                        // swing onto the headland
  line(-TURN_X - TURN_R, ROWS[3] + TURN_R, -TURN_X - TURN_R, ROWS[0] - TURN_R);
  arc(-TURN_X, ROWS[0] - TURN_R, Math.PI, -Math.PI / 2);                             // and back round to the start
  const STEP = 0.12;

  const pose = { steer: 0, speed: 0, engine: 0 };
  function setPose(p) {
    combine.position.set(p.x, 0.25, p.z);
    combine.rotation.y = -p.h;
  }
  setPose(START);

  // engine rumble, exhaust and idle wobble run all the time the engine is on
  let puffT = 0;
  ticker((dt, t) => {
    const e = pose.engine;
    if (e < 0.01) { chassis.position.y = 0; chassis.rotation.set(0, 0, 0); return; }
    const load = 0.5 + Math.min(1, pose.speed / 18) * 0.5;
    chassis.position.y = (Math.sin(t * 47) * 0.012 + Math.sin(t * 31 + 1) * 0.008) * e * load;
    chassis.rotation.x = Math.sin(t * 39) * 0.006 * e * load - pose.steer * 0.05;     // slight body roll into turns
    chassis.rotation.z = Math.sin(t * 43 + 2) * 0.006 * e * load + Math.sin(t * 5) * 0.004 * e;
    if ((puffT += dt) > 0.22 - load * 0.1) {
      puffT = 0;
      const p = chassis.localToWorld(new THREE.Vector3(-0.9, 2.95, -0.55));
      g.worldToLocal(p);
      puff(g, p, { color: 0x6b6b77, n: 1, size: 0.16 + load * 0.08, up: 1.4, spread: 0.3, dur: 0.8 });
    }
  });

  function setUpgrade(i) {
    bodyMat.color.setHex(TIERS[i]);
    bodyMat.emissive.setHex(i === 2 ? 0x5a3d00 : 0);
    combine.scale.setScalar(BASE * (1 + i * 0.09));
  }

  async function play(res, ctx) {
    // each pass has PER_ROW finds at jittered points along it
    const marks = rowMarks.flatMap(([i0, i1], r) => Array.from({ length: PER_ROW }, (_, j) => ({
      idx: Math.round(i0 + (i1 - i0) * Math.min(0.98, Math.max(0.03, (j + 0.5 + rand(-0.38, 0.38)) / PER_ROW))), slot: res.slots[r * PER_ROW + j],
    }))).sort((a, b) => a.idx - b.idx);
    let next = 0, s = 0, dust = 0, regrown = false;
    const total = (path.length - 1) * STEP, harvestEnd = rowMarks[3][1] * STEP;
    const scale = combine.scale.x;
    ctx.sfx('engine');
    await tween(0.35, (k) => { pose.engine = k; });      // engine fires up
    let engineSfx = 0;
    await new Promise((done) => {
      ticker((dt) => {
        const i = Math.min(path.length - 1, Math.floor(s / STEP)), p = path[i];
        // slow for turns (look a little ahead), ease off before stopping
        const ahead = path[Math.min(path.length - 1, i + 22)];
        const vMax = Math.min(p.k || ahead.k ? 8.5 : 21, Math.sqrt(2 * 16 * Math.max(0.02, total - s)) + 0.6);
        pose.speed += (vMax - pose.speed) * Math.min(1, dt * (vMax > pose.speed ? 2.4 : 5));
        const ds = pose.speed * dt;
        s = Math.min(total, s + ds);
        const q = path[Math.min(path.length - 1, Math.floor(s / STEP))];
        setPose(q);
        // steering eases toward what the curve needs; rear wheels steer opposite to the turn
        const want = Math.atan(2.2 * q.k) * 0.9;
        pose.steer += (want - pose.steer) * Math.min(1, dt * 9);
        for (const w of wheels) {
          w.spin.rotation.z -= ds / (w.r * scale);
          if (w.steers) w.pivot.rotation.y = pose.steer;
        }
        reel.rotation.z -= dt * (3 + pose.speed * 0.7);
        if ((engineSfx += dt) > 1.3) { engineSfx = 0; ctx.sfx('engine'); }
        // the header (out front) cuts whatever it passes over
        const hx = q.x + Math.cos(q.h) * 2.4, hz = q.z + Math.sin(q.h) * 2.4;
        if (q.row >= 0) {
          let changed = false;
          for (let j = rowStart(q.row), e = rowStart(q.row + 1); j < e; j++) if (!cut[j] && Math.abs(sx[j] - hx) < 1.1) { cut[j] = 1; setSprout(j, 0.001); changed = true; }
          if (changed) sprouts.instanceMatrix.needsUpdate = true;
          if ((dust += 1) % 3 === 0) puff(g, { x: q.x - Math.cos(q.h) * 2.2, y: 0.5, z: q.z + rand(-1.7, 1.7) }, { color: 0xe8d28a, n: 2, size: 0.16, up: 1.1 });
        }
        // finds pop out behind the machine
        const idx = Math.floor(s / STEP);
        while (next < marks.length && marks[next].idx <= idx) {
          const { slot } = marks[next++];
          const px = q.x - Math.cos(q.h) * 2, pz = q.z + rand(-1.6, 1.6), dirX = Math.cos(q.h);
          if (slot.prize) {
            const sp = prizeModel(slot.prize, 1.4, -Math.PI / 4);
            sp.position.set(px, 0.8, pz);
            g.add(sp);
            arcTo(sp, { x: px - dirX * 1.2, y: 1.3, z: pz }, 0.4, 1.9).then(() => wait(0.55)).then(() => scaleTo(sp, 0.01, 0.15, ease.in)).then(() => g.remove(sp));
            ctx.prize(slot, wp(g, px, 2.4, pz));
          } else puff(g, { x: px, y: 0.4, z: pz }, { color: 0xb98a55, n: 4, size: 0.16 });
        }
        // the field starts growing back once the last pass is done
        if (!regrown && s > harvestEnd + 2) {
          regrown = true;
          cut.fill(0);
          tween(0.9, (k) => { for (let j = 0; j < N; j++) setSprout(j, Math.max(0.001, k)); sprouts.instanceMatrix.needsUpdate = true; }, ease.back);
        }
        if (s >= total) { pose.speed = 0; setPose(START); done(); return false; }
      });
    });
    for (const w of wheels) w.pivot.rotation.y = 0;
    pose.steer = 0;
    tween(0.6, (k) => { pose.engine = 1 - k; });         // engine winds down
  }

  return { group: g, setUpgrade, play };
}
