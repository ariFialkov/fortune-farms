// Renderer, isometric camera rig, lighting, the island and its decor.
import * as THREE from 'three';
import { rbox, cyl, ball, cone, prism, at, rot, grp, mat, tree, pine, bush, rock, sign, noShadow, fence, puff } from './kit.js';
import { update as animUpdate, tween, ticker, ease } from './anim.js';

import { AREAS, SECTOR_POS, PLOT, ROAD, HOUSE, DRIVE, COURT, WALKS, OVERVIEW } from './layout.js';
export { SECTOR_POS };

const FOV = 30;
const YAW = Math.PI / 4;

function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function windmill() {
  const g = grp();
  g.add(at(cyl(1.1, 1.7, 5, 0xf6efe2, 10), 0, 2.5, 0));
  g.add(at(cone(1.5, 1.6, 0xd9534f, 10), 0, 5.8, 0));
  g.add(at(rbox(0.7, 1.2, 0.2, 0x8a5a2b, 0.08), 1.2, 0.6, 1.2));
  const blades = grp();
  for (let i = 0; i < 4; i++) {
    const b = grp(at(rbox(0.5, 3.4, 0.08, 0xfdf8ee, 0.04), 0, 1.9, 0), at(rbox(0.12, 3.8, 0.12, 0x8a5a2b, 0.04), 0, 1.7, -0.05));
    b.rotation.z = (i * Math.PI) / 2;
    blades.add(b);
  }
  const hub = grp(blades, at(ball(0.3, 0x8a5a2b, 8), 0, 0, 0));
  hub.position.set(1.0, 4.6, 1.0);
  hub.rotation.y = Math.PI / 4;
  g.add(hub);
  ticker((dt) => { blades.rotation.z += dt * 0.9; });
  return g;
}

function barn() {
  const g = grp();
  g.add(at(rbox(5, 3, 4, 0xd9534f, 0.15), 0, 1.5, 0));
  const roof = rot(at(prism(4.4, 1.9, 5.2, 0x7b4a3a), 0, 2.95, 0), 0, Math.PI / 2, 0);
  g.add(roof);
  g.add(at(rbox(1.6, 2, 0.12, 0xfdf8ee, 0.05), 0, 1, 2.02), at(rbox(1.3, 1.7, 0.14, 0xb8433f, 0.05), 0, 1, 2.04));
  g.add(at(rbox(0.12, 2, 1.6, 0xfdf8ee, 0.05), 2.52, 1, 0), at(rbox(0.14, 1.7, 1.3, 0xb8433f, 0.05), 2.54, 1, 0));
  g.add(at(cyl(1, 1, 4.5, 0xd8dde3, 14), -3.6, 2.25, 0.5), at(ball(1, 0xb8c0c9, 14), -3.6, 4.5, 0.5));
  return g;
}

function farmhouse() {
  const g = grp();
  const wall = 0xfff3d6, roofC = 0x3f7fd1, trim = 0xffffff;
  g.add(at(rbox(7, 3.4, 4.6, wall, 0.18), 0, 1.7, -0.6));
  g.add(rot(at(prism(5.4, 2.3, 7.6, roofC), 0, 3.3, -0.6), 0, Math.PI / 2, 0));
  // front wing with the door
  g.add(at(rbox(3.2, 3.2, 2.6, wall, 0.16), -1.2, 1.6, 2.4));
  g.add(at(prism(3.8, 1.8, 3.4, roofC), -1.2, 3.1, 2.2));
  g.add(at(rbox(1.1, 1.9, 0.12, 0x8a5a2b, 0.08), -1.2, 0.95, 3.72), at(noShadow(ball(0.08, 0xffd23f, 6)), -0.85, 0.95, 3.82));
  g.add(at(rbox(0.8, 0.8, 0.1, 0x9fd8f0, 0.2), -1.2, 2.6, 3.72));
  g.add(at(rbox(2.2, 0.16, 1.1, 0xc9945a, 0.05), -1.2, 0.08, 4.2));
  // porch on the right of the wing
  g.add(at(rbox(3.4, 0.2, 1.8, 0xc9945a, 0.06), 2, 0.1, 2.5), at(rbox(3.6, 0.16, 2, roofC, 0.06), 2, 2.5, 2.5));
  for (const x of [0.6, 3.5]) g.add(at(cyl(0.1, 0.1, 2.4, trim, 8), x, 1.3, 3.3));
  for (const x of [1.3, 2.7]) g.add(at(rbox(0.9, 1.1, 0.1, 0x9fd8f0, 0.08), x, 1.6, 1.72), at(rbox(1.1, 0.12, 0.3, 0xe5533d, 0.04), x, 0.95, 1.85));
  // side windows + chimney
  for (const z of [-1.6, 0.4]) g.add(at(rbox(0.1, 1.1, 1, 0x9fd8f0, 0.08), 3.52, 1.8, z), at(rbox(0.3, 0.12, 1.2, 0xe5533d, 0.04), 3.62, 1.15, z));
  g.add(at(rbox(0.8, 2, 0.8, 0xc96f4a, 0.08), 2.2, 4.6, -1.4), at(rbox(1, 0.2, 1, 0x9a4f34, 0.05), 2.2, 5.6, -1.4));
  return g;
}

function well() {
  return grp(at(cyl(0.8, 0.85, 0.8, 0xb9b4ad, 12), 0, 0.4, 0), at(cyl(0.62, 0.62, 0.06, 0x45b5e8, 12), 0, 0.72, 0),
    at(cyl(0.07, 0.07, 1.8, 0x8a5a2b, 6), -0.7, 0.9, 0), at(cyl(0.07, 0.07, 1.8, 0x8a5a2b, 6), 0.7, 0.9, 0), at(prism(2, 0.7, 1.4, 0xd9534f), 0, 1.75, 0));
}

function scarecrow() {
  const g = grp(at(cyl(0.07, 0.07, 2, 0x8a5a2b, 6), 0, 1, 0), rot(at(cyl(0.06, 0.06, 1.6, 0x8a5a2b, 6), 0, 1.45, 0), 0, 0, Math.PI / 2),
    at(rbox(0.7, 0.8, 0.35, 0xe5533d, 0.12), 0, 1.3, 0), at(ball(0.3, 0xf2d9a0, 10), 0, 2.05, 0), at(cone(0.45, 0.45, 0xf2d16b, 10), 0, 2.45, 0));
  return g;
}

// Many trees in a handful of draw calls. add(x, z, scale, pine?) then build().
function forest(scene, rnd) {
  const leafy = [], pines = [];
  const leafCols = [0x58b84a, 0x4fae52, 0x6cc24a, 0x49a84f], pineCols = [0x3f9b55, 0x46a85d, 0x378f4f];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const inst = (geo, list, fn, colored) => {
    const im = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: colored ? 0xffffff : 0x8a5a2b }), list.length);
    list.forEach((t, i) => { fn(t); im.setMatrixAt(i, m4.compose(v, q, sc)); if (colored) im.setColorAt(i, col.setHex(t.c)); });
    im.castShadow = im.receiveShadow = true;
    scene.add(im);
  };
  return {
    add(x, z, s, pine) { (pine ? pines : leafy).push({ x, z, s, c: (pine ? pineCols : leafCols)[Math.floor(rnd() * (pine ? 3 : 4))], r: rnd() * 6.28 }); },
    build() {
      const trunk = new THREE.CylinderGeometry(0.24, 0.34, 1.7, 8), ball = new THREE.SphereGeometry(1, 12, 9), cone = new THREE.ConeGeometry(1, 1, 9);
      inst(trunk, [...leafy, ...pines], (t) => { v.set(t.x, 0.8 * t.s, t.z); sc.setScalar(t.s); });
      [[0, 2.3, 0, 1.2], [0.75, 2.0, 0.2, 0.85], [-0.7, 2.05, -0.3, 0.8], [0.1, 3.0, 0, 0.72]].forEach(([dx, dy, dz, r]) =>
        inst(ball, leafy, (t) => { v.set(t.x + (dx * Math.cos(t.r) - dz * Math.sin(t.r)) * t.s, dy * t.s, t.z + (dx * Math.sin(t.r) + dz * Math.cos(t.r)) * t.s); sc.setScalar(r * t.s); }, true));
      [[1.6, 1.05, 1.5], [2.35, 0.82, 1.3], [3.0, 0.56, 1.05]].forEach(([y, r, h]) =>
        inst(cone, pines, (t) => { v.set(t.x, y * t.s, t.z); sc.set(r * t.s, h * t.s, r * t.s); }, true));
    },
  };
}

// Flat stepping stones along world polylines (one instanced mesh).
function steppingStones(scene, walks, rnd) {
  const spots = [];
  for (const line of walks) {
    for (let i = 0; i < line.length - 1; i++) {
      const [x0, z0] = line[i], [x1, z1] = line[i + 1], len = Math.hypot(x1 - x0, z1 - z0), n = Math.round(len / 1.05);
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n, side = (k % 2 ? 0.34 : -0.34) + (rnd() - 0.5) * 0.25;
        spots.push([x0 + (x1 - x0) * t - ((z1 - z0) / len) * side, z0 + (z1 - z0) * t + ((x1 - x0) / len) * side]);
      }
    }
  }
  const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.5, 0.56, 0.1, 7), new THREE.MeshLambertMaterial({ color: 0xffffff }), spots.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), e = new THREE.Euler();
  spots.forEach(([x, z], i) => {
    const w = 0.8 + rnd() * 0.5;
    im.setMatrixAt(i, m4.compose(new THREE.Vector3(x, 0.05, z), q.setFromEuler(e.set(0, rnd() * 3, 0)), new THREE.Vector3(w, 1, 0.75 + rnd() * 0.4)));
    im.setColorAt(i, col.setHex([0xd6d0c4, 0xc7c1b6, 0xddd8ce][i % 3]));
  });
  im.receiveShadow = true;
  scene.add(im);
  return spots;
}

// Post-and-rail fence between two points (instanced posts).
function railFence(scene, x0, z0, x1, z1, color = 0xf3ead8) {
  const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 2.4)), ang = Math.atan2(-(z1 - z0), x1 - x0);
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 1, 0.22), mat(color), n + 1);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i <= n; i++) posts.setMatrixAt(i, m4.makeTranslation(x0 + ((x1 - x0) * i) / n, 0.5, z0 + ((z1 - z0) * i) / n));
  posts.castShadow = true;
  scene.add(posts);
  for (const y of [0.42, 0.78]) scene.add(rot(at(rbox(len, 0.12, 0.09, color, 0.04), (x0 + x1) / 2, y, (z0 + z1) / 2), 0, ang, 0));
}

function hayBale() {
  const b = cyl(0.6, 0.6, 0.9, 0xf0cf63, 14);
  b.rotation.z = Math.PI / 2;
  b.position.y = 0.6;
  return b;
}

export function createWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const mobile = matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.75 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fd65a);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 900);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xa6d98a, 1.15));
  const sun = new THREE.DirectionalLight(0xfff1d0, 1.9);
  sun.position.set(-60, 95, 35);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 2048 : 4096, mobile ? 2048 : 4096);
  Object.assign(sun.shadow.camera, { left: -105, right: 105, top: 105, bottom: -105, near: 1, far: 260 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);

  // --- ground: one big lawn, no water in sight ---
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), mat(0x8fd65a));
  lawn.rotation.x = -Math.PI / 2;
  lawn.receiveShadow = true;
  scene.add(lawn);
  const rnd = seeded(23);
  const patchGeo = new THREE.CircleGeometry(1, 20);
  for (let i = 0; i < 90; i++) {
    const m = new THREE.Mesh(patchGeo, mat([0x9bdc64, 0x86cf55, 0x97d95f, 0x82cb52][i % 4]));
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = rnd() * 3;
    m.scale.set(3 + rnd() * 6, 2 + rnd() * 4, 1);
    m.position.set(rnd() * 190 - 95, 0.012 + (i % 5) * 0.002, rnd() * 190 - 95);
    m.receiveShadow = true;
    scene.add(m);
  }

  // --- the road out front, the driveway and the farmhouse forecourt ---
  const roadMid = (ROAD.z0 + ROAD.z1) / 2, roadW = ROAD.z1 - ROAD.z0;
  scene.add(at(rbox(420, 0.08, roadW + 1.6, 0xd9cfb4, 0.03), 0, 0.0, roadMid), at(rbox(420, 0.1, roadW, 0x8f96a0, 0.03), 0, 0.01, roadMid));
  for (let x = -200; x < 200; x += 5) scene.add(noShadow(at(rbox(2.4, 0.04, 0.28, 0xf4f1e6, 0.01), x, 0.06, roadMid)));
  const dirt = mat(0xe3c98f);
  scene.add(at(rbox(DRIVE.x1 - DRIVE.x0, 0.1, DRIVE.z1 - DRIVE.z0 + 1, dirt, 0.04), (DRIVE.x0 + DRIVE.x1) / 2, 0.0, (DRIVE.z0 + DRIVE.z1) / 2 + 0.5));
  scene.add(at(rbox(COURT.x1 - COURT.x0, 0.1, COURT.z1 - COURT.z0, dirt, 0.04), (COURT.x0 + COURT.x1) / 2, 0.002, (COURT.z0 + COURT.z1) / 2));
  for (let z = DRIVE.z0 + 3; z < DRIVE.z1; z += 2.2) for (const x of [DRIVE.x0 + 1.1, DRIVE.x1 - 1.1]) scene.add(noShadow(at(rbox(0.5, 0.03, 1.5, 0xd6bb80, 0.01), x + (rnd() - 0.5) * 0.15, 0.055, z)));

  // --- farmhouse ---
  const house = farmhouse();
  house.position.set(HOUSE.x, 0, HOUSE.z);
  scene.add(house);
  scene.add(at(well(), HOUSE.x + 8, 0, HOUSE.z - 4), at(tree(1.15, 0x58b84a), HOUSE.x - 6, 0, HOUSE.z - 4), at(bush(1), HOUSE.x + 5.4, 0, HOUSE.z + 2), at(bush(0.8), HOUSE.x - 5, 0, HOUSE.z + 2.6));
  let smoke = 0;
  ticker((dt) => { if ((smoke += dt) > 0.9) { smoke = 0; puff(scene, { x: HOUSE.x + 2.2, y: 5.9, z: HOUSE.z - 1.4 }, { color: 0xf4f4f4, n: 1, size: 0.3, up: 2, spread: 0.4, dur: 2 }); } });

  // --- stone walking paths ---
  const stones = steppingStones(scene, WALKS, rnd);

  // --- property fence, gate and sign ---
  const F = PLOT, fz = ROAD.z0 - 1.6;
  railFence(scene, -F, -F, F, -F); railFence(scene, -F, -F, -F, fz); railFence(scene, F, -F, F, fz);
  railFence(scene, -F, fz, DRIVE.x0 - 1.2, fz); railFence(scene, DRIVE.x1 + 1.2, fz, F, fz);
  for (const x of [DRIVE.x0 - 1.2, DRIVE.x1 + 1.2]) scene.add(at(rbox(0.5, 1.9, 0.5, 0xb9b4ad, 0.1), x, 0.95, fz), at(ball(0.34, 0xffd23f, 10), x, 2.1, fz));
  const sg = sign('Fortune Farms', 4.4, 1.1, { bg: '#fff3d6', fg: '#d9534f' });
  scene.add(at(grp(at(sg, 0, 1.7, 0.06), at(rbox(4.6, 1.3, 0.1, 0x8a5a2b, 0.05), 0, 1.7, 0), at(cyl(0.1, 0.1, 1.3, 0x8a5a2b, 8), -1.6, 0.65, 0), at(cyl(0.1, 0.1, 1.3, 0x8a5a2b, 8), 1.6, 0.65, 0)), DRIVE.x1 + 5, 0, fz + 0.9));

  // --- barnyard in the quiet back corner ---
  const bx = 39, bz = -20;
  scene.add(rot(at(barn(), bx, 0, bz), 0, 0, 0), at(windmill(), bx + 3, 0, bz - 14));
  scene.add(at(hayBale(), bx - 5, 0, bz + 5), at(hayBale(), bx - 6.2, 0, bz + 6), at(hayBale(), bx - 4.6, 0, bz + 6.6), at(hayBale(), bx - 5.4, 0.95, bz + 5.8));
  scene.add(rot(at(scarecrow(), AREAS.crops.x + 11.5, 0, AREAS.crops.z - 21.5), 0, -0.9, 0));

  // --- trees: woods around the mushroom clearing, scattered shade trees, and forest beyond the fence ---
  const woods = forest(scene, rnd);
  const boxes = [[-37, 17, -21, 33], [-36, 3, -24, 15], [-37, -16, -20, 1], [-50, -13, -39, 9], [-19, 8, -3, 33], [2.5, -7.5, 24.5, 33], [27, 2, 50, 34], [-42, -37.5, -6, -20],
    [HOUSE.x - 7, HOUSE.z - 5, HOUSE.x + 7, HOUSE.z + 6], [COURT.x0, COURT.z0, COURT.x1, COURT.z1], [DRIVE.x0 - 1, DRIVE.z0, DRIVE.x1 + 1, 60], [bx - 8, bz - 5, bx + 6, bz + 8], [bx - 1, bz - 18, bx + 7, bz - 10]];
  const myc = AREAS.mycology;
  const free = (x, z, pad = 0) => !boxes.some(([x0, z0, x1, z1]) => x > x0 - pad && x < x1 + pad && z > z0 - pad && z < z1 + pad)
    && Math.hypot(x - myc.x, z - myc.z) > 11.6 + pad && !stones.some(([px, pz]) => Math.hypot(x - px, z - pz) < 1.5 + pad);
  const inPlot = (x, z) => Math.abs(x) < F - 1.5 && z > -F + 1.5 && z < fz - 1.5;
  // dense woods wrapped around the clearing
  for (let i = 0; i < 400; i++) {
    const a = rnd() * 6.283, r = 12.5 + rnd() * 10, x = myc.x + Math.cos(a) * r * 1.15, z = myc.z + Math.sin(a) * r * 0.85;
    if (inPlot(x, z) && free(x, z, 0.6) && !(Math.abs(a - 2.3) < 0.3) && !(Math.abs(a - 0.78) < 0.7 && r < 19)) woods.add(x, z, 0.85 + rnd() * 0.55, rnd() < 0.55);
  }
  // a few shade trees dotted about the property
  for (let i = 0, n = 0; i < 600 && n < 34; i++) {
    const x = rnd() * 96 - 48, z = rnd() * 84 - 48;
    if (inPlot(x, z) && free(x, z, 1.6)) { woods.add(x, z, 0.8 + rnd() * 0.4, rnd() < 0.25); boxes.push([x - 2.5, z - 2.5, x + 2.5, z + 2.5]); n++; }
  }
  // the countryside beyond the fence
  for (let i = 0; i < 520; i++) {
    const x = rnd() * 300 - 150, z = rnd() * 300 - 150;
    if (Math.abs(x) < F + 2.5 && z > -F - 2.5 && z < fz + 1) continue;
    if (z > fz - 1 && z < ROAD.z1 + 3) continue;
    woods.add(x, z, 0.9 + rnd() * 0.7, rnd() < 0.4);
  }
  woods.build();
  for (let i = 0, n = 0; i < 500 && n < 60; i++) {
    const x = rnd() * 96 - 48, z = rnd() * 84 - 48;
    if (!free(x, z, 0.4)) continue;
    scene.add(at(rnd() < 0.7 ? bush(0.6 + rnd() * 0.6) : rock(0.6 + rnd() * 0.8), x, 0, z));
    n++;
  }
  const flowerGeo = new THREE.SphereGeometry(0.12, 6, 5), fl = [];
  for (let i = 0; i < 700; i++) { const x = rnd() * 150 - 75, z = rnd() * 150 - 75; if (free(x, z, -0.4) && !(z > fz && z < ROAD.z1 + 1)) fl.push([x, z]); }
  const flowers = new THREE.InstancedMesh(flowerGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), fl.length);
  const fm = new THREE.Matrix4(), fc = new THREE.Color();
  fl.forEach(([x, z], i) => { flowers.setMatrixAt(i, fm.makeTranslation(x, 0.1, z)); flowers.setColorAt(i, fc.setHex([0xffffff, 0xffd84d, 0xff8fb1, 0xb08cff][i % 4])); });
  scene.add(flowers);

  // --- camera rig ---
  const rig = { target: new THREE.Vector3(0, 0, 0), dist: 120, radius: 40, focus: null };
  const insets = { top: 60, bottom: 180 };
  let elev = 0.72;
  let shakeAmt = 0;
  const size = { w: 1, h: 1 };

  function fit(radius, tall = 5) {
    const v = THREE.MathUtils.degToRad(FOV) / 2;
    const usableH = Math.max(0.35, (size.h - insets.top - insets.bottom) / size.h);
    const tanH = Math.tan(v) * camera.aspect;
    const dH = (radius * 1.04) / tanH;
    const dV = (radius * Math.sin(elev) + tall * Math.cos(elev)) / (Math.tan(v) * usableH);
    return Math.max(dH, dV);
  }
  function goal(id) {
    const portrait = size.h > size.w;
    elev = portrait ? 0.9 : 0.72;
    if (!id) return { target: new THREE.Vector3(OVERVIEW.x, 0, OVERVIEW.z), dist: fit(portrait ? 44 : 47, 4) };
    const [x, z] = SECTOR_POS[id];
    return { target: new THREE.Vector3(x, 0, z), dist: fit(AREAS[id].view, 2.5) };
  }
  function place() {
    const v = THREE.MathUtils.degToRad(FOV) / 2;
    // shift the look-at point so the subject is centred in the area not covered by HUD
    const px = (insets.bottom - insets.top) / 2;
    const shift = ((px / size.h) * 2 * rig.dist * Math.tan(v)) / Math.sin(elev);
    const tx = rig.target.x + (Math.sin(YAW) * shift), tz = rig.target.z + (Math.cos(YAW) * shift);
    const sx = shakeAmt ? (Math.random() - 0.5) * shakeAmt : 0, sy = shakeAmt ? (Math.random() - 0.5) * shakeAmt : 0;
    const ce = Math.cos(elev), se = Math.sin(elev);
    camera.position.set(tx + Math.sin(YAW) * ce * rig.dist + sx, se * rig.dist + sy, tz + Math.cos(YAW) * ce * rig.dist);
    camera.lookAt(tx + sx, sy, tz);
    camera.updateMatrixWorld();
  }
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    size.w = w; size.h = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const g = goal(rig.focus);
    rig.target.copy(g.target); rig.dist = g.dist;
  }
  let camAnim = 0;
  function focus(id, dur = 0.9) {
    rig.focus = id;
    const g = goal(id), from = { t: rig.target.clone(), d: rig.dist }, my = ++camAnim;
    // camera moves use real time so they feel the same at any game speed
    if (dur <= 0) { rig.target.copy(g.target); rig.dist = g.dist; return Promise.resolve(); }
    const t0 = performance.now();
    return new Promise((res) => {
      const step = () => {
        if (my !== camAnim) return res();
        const k = Math.min((performance.now() - t0) / (dur * 1000), 1), e = ease.inOut(k);
        rig.target.lerpVectors(from.t, g.target, e);
        rig.dist = from.d + (g.dist - from.d) * e;
        if (k < 1) requestAnimationFrame(step); else res();
      };
      step();
    });
  }
  function setInsets(top, bottom, dur = 0.4) {
    if (insets.top === top && insets.bottom === bottom) return;
    insets.top = top; insets.bottom = bottom;
    focus(rig.focus, dur);
  }

  const v3 = new THREE.Vector3();
  function project(pos) {
    v3.copy(pos).project(camera);
    return { x: (v3.x * 0.5 + 0.5) * size.w, y: (-v3.y * 0.5 + 0.5) * size.h };
  }
  function shake(amount = 0.5, dur = 0.4) {
    shakeAmt = Math.max(shakeAmt, amount);
    tween(dur, (k) => { shakeAmt = amount * (1 - k); }, ease.linear).then(() => { shakeAmt = 0; });
  }

  const frameFns = [];
  let last = performance.now();
  function frame(now) {
    const dt = (now - last) / 1000;
    last = now;
    animUpdate(dt);
    place();
    for (const fn of frameFns) fn(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();
  requestAnimationFrame(frame);

  return { scene, camera, renderer, rig, focus, setInsets, project, shake, onFrame: (fn) => frameFns.push(fn), size };
}
