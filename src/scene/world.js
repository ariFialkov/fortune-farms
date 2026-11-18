// Renderer, isometric camera rig, lighting, the island and its decor.
import * as THREE from 'three';
import { rbox, cyl, ball, cone, prism, at, rot, grp, mat, tree, pine, bush, rock, sign, noShadow, fence, puff } from './kit.js';
import { update as animUpdate, tween, ticker, ease } from './anim.js';

import { SECTOR_POS, SECTOR_ANGLE, BARN_POS, BARN_ANGLE, ring } from './layout.js';
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

// Flat ribbon along a smooth curve through `pts` ([x,z] pairs).
function dirtPath(pts, width, material) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  const n = Math.max(8, Math.round(curve.getLength() / 1.2));
  const pos = [], idx = [], samples = [];
  for (let i = 0; i <= n; i++) {
    const p = curve.getPoint(i / n), t = curve.getTangent(i / n);
    const w = (width / 2) * (1 + 0.12 * Math.sin(i * 1.7));
    pos.push(p.x - t.z * w, 0.045, p.z + t.x * w, p.x + t.z * w, 0.045, p.z - t.x * w);
    if (i < n) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
    samples.push([p.x, p.z]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  m.receiveShadow = true;
  return { mesh: m, samples };
}

const islandR = (a) => 49 + 2.6 * Math.sin(3 * a + 0.6) + 1.7 * Math.sin(5 * a + 2.1) + 1.1 * Math.sin(8 * a);
function islandLayer(scale, depth, color, y) {
  const sh = new THREE.Shape();
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2, r = islandR(a) * scale;
    i ? sh.lineTo(Math.cos(a) * r, -Math.sin(a) * r) : sh.moveTo(r, 0);
  }
  const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelSize: 0.9, bevelThickness: 0.9, bevelSegments: 4, curveSegments: 4 });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, y - depth - 0.9, 0);
  const m = new THREE.Mesh(geo, mat(color));
  m.receiveShadow = true;
  return m;
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
  scene.background = new THREE.Color(0x63cfe9);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 500);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xa6d98a, 1.15));
  const sun = new THREE.DirectionalLight(0xfff1d0, 1.9);
  sun.position.set(-38, 60, 22);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 2048 : 4096, mobile ? 2048 : 4096);
  Object.assign(sun.shadow.camera, { left: -66, right: 66, top: 66, bottom: -66, near: 1, far: 200 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);

  // --- island ---
  const water = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), mat(0x63cfe9));
  water.rotation.x = -Math.PI / 2;
  water.position.y = -1.6;
  scene.add(water);
  scene.add(islandLayer(1.13, 0.4, 0x8fe3f2, -1.45), islandLayer(1.055, 2.4, 0xf5e2a8, -0.35), islandLayer(1, 2.6, 0x8fd65a, 0));

  const rnd = seeded(11);
  const deg = (d) => (d * Math.PI) / 180;
  // soft patches of lighter / darker grass so the lawn isn't one flat colour
  const patchGeo = new THREE.CircleGeometry(1, 20);
  for (let i = 0; i < 46; i++) {
    const a = rnd() * 6.283, r = 4 + rnd() * 41;
    const m = new THREE.Mesh(patchGeo, mat([0x9bdc64, 0x86cf55, 0x97d95f, 0x82cb52][i % 4]));
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = rnd() * 3;
    m.scale.set(2.5 + rnd() * 4.5, 1.8 + rnd() * 3, 1);
    m.position.set(Math.cos(a) * r, 0.012 + (i % 5) * 0.002, Math.sin(a) * r);
    m.receiveShadow = true;
    scene.add(m);
  }

  // --- farmhouse and yard at the heart of the farm ---
  const house = farmhouse();
  house.rotation.y = Math.PI / 4;
  house.position.set(-1.2, 0, -1.2);
  scene.add(house);
  const pathMat = mat(0xecd49a);
  scene.add(at(cyl(7.6, 7.6, 0.08, pathMat, 36), 0.6, 0.0, 0.6));
  scene.add(at(well(), -6.2, 0, 5.2), at(tree(1.1, 0x58b84a), -6.4, 0, -6.8), at(bush(1), 5.6, 0, -5.4), at(bush(0.8), 6.6, 0, -4.2));
  let smoke = 0;
  ticker((dt) => { if ((smoke += dt) > 0.9) { smoke = 0; puff(scene, { x: -0.6, y: 5.9, z: -0.7 }, { color: 0xf4f4f4, n: 1, size: 0.3, up: 2, spread: 0.4, dur: 2 }); } });

  // --- winding dirt paths: yard -> every area ---
  const pathPts = [];
  const spoke = (angle, r0, r1, width, bend) => {
    const pts = [];
    for (let i = 0; i <= 4; i++) {
      const r = r0 + ((r1 - r0) * i) / 4, a = deg(angle) + Math.sin((i / 4) * Math.PI) * bend;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    const p = dirtPath(pts, width, pathMat);
    scene.add(p.mesh);
    pathPts.push(...p.samples);
  };
  const coreIds = ['crops', 'poultry', 'dairy', 'orchard', 'slaughter'];
  for (const id of Object.keys(SECTOR_POS)) {
    const core = coreIds.includes(id);
    spoke(SECTOR_ANGLE[id], 7, core ? 13.5 : 29.5, core ? 2.4 : 1.9, core ? 0 : (id === 'apiary' || id === 'mycology' ? -0.09 : 0.09));
  }
  spoke(BARN_ANGLE, 7, 28.5, 1.9, -0.08);

  // --- barnyard on the outer ring ---
  const [bx, bz] = BARN_POS;
  scene.add(rot(at(barn(), bx, 0, bz - 1), 0, Math.PI / 2, 0));
  scene.add(at(windmill(), bx + 5.5, 0, bz + 7));
  scene.add(at(hayBale(), bx - 4.6, 0, bz + 4.4), at(hayBale(), bx - 5.6, 0, bz + 5.6), at(hayBale(), bx - 4.2, 0, bz + 6.2), at(hayBale(), bx - 5, 0.95, bz + 5.3));
  scene.add(rot(at(fence(6), bx - 6.2, 0, bz - 1), 0, Math.PI / 2));
  const [cx, cz] = SECTOR_POS.crops;
  scene.add(rot(at(scarecrow(), cx + 8.2, 0, cz - 4), 0, -0.7, 0));

  // --- trees, bushes, rocks and flowers fill the gaps and the rim ---
  const areas = [...Object.values(SECTOR_POS).map(([x, z]) => [x, z, 9.4]), [0, 0, 9.5], [bx, bz, 7.5], [bx + 5.5, bz + 7, 4]];
  const free = (x, z, pad = 0) => {
    const r = Math.hypot(x, z);
    if (r > islandR(Math.atan2(z, x)) - 2.2 - pad) return false;
    if (areas.some(([ax, az, ar]) => Math.hypot(x - ax, z - az) < ar + pad)) return false;
    return !pathPts.some(([px, pz]) => Math.hypot(x - px, z - pz) < 2 + pad);
  };
  const leafs = [0x58b84a, 0x4fae52, 0x6cc24a];
  let placed = 0;
  for (let i = 0; i < 900 && placed < 150; i++) {
    const a = rnd() * 6.283, r = 11 + Math.pow(rnd(), 0.6) * 37, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const big = r > 40 || rnd() < 0.3;
    if (!free(x, z, big ? 0.8 : 0)) continue;
    const k = rnd();
    const o = !big ? (k < 0.6 ? bush(0.7 + rnd() * 0.6) : rock(0.7 + rnd() * 0.8)) : k < 0.6 ? tree(0.8 + rnd() * 0.45, leafs[placed % 3]) : pine(0.9 + rnd() * 0.45);
    scene.add(at(o, x, 0, z));
    placed++;
  }
  const flowerCols = [0xffffff, 0xffd84d, 0xff8fb1, 0xb08cff];
  for (let i = 0; i < 160; i++) {
    const a = rnd() * 6.283, r = 8 + rnd() * 40, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (free(x, z, -0.6)) scene.add(at(noShadow(ball(0.12, flowerCols[i % 4], 6)), x, 0.1, z));
  }
  // welcome sign by the front shore
  const s = sign('Fortune Farms', 4.4, 1.1, { bg: '#fff3d6', fg: '#d9534f' });
  const welcome = grp(at(s, 0, 1.6, 0.06), at(rbox(4.6, 1.3, 0.1, 0x8a5a2b, 0.05), 0, 1.6, 0), at(cyl(0.1, 0.1, 1.2, 0x8a5a2b, 8), -1.6, 0.6, 0), at(cyl(0.1, 0.1, 1.2, 0x8a5a2b, 8), 1.6, 0.6, 0));
  welcome.rotation.y = YAW;
  scene.add(at(welcome, ...[ring(43, 45)[0], 0, ring(43, 45)[1]]));

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
    if (!id) return { target: new THREE.Vector3(0, 0, 0), dist: fit(portrait ? 40 : 45, 4) };
    const [x, z] = SECTOR_POS[id];
    return { target: new THREE.Vector3(x, 0, z), dist: fit(portrait ? 10.5 : 10.5, 2.5) };
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
