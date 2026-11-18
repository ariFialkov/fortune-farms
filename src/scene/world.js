// Renderer, isometric camera rig, lighting, the island and its decor.
import * as THREE from 'three';
import { rbox, cyl, ball, cone, prism, at, rot, grp, mat, tree, pine, bush, rock, sign, noShadow } from './kit.js';
import { update as animUpdate, tween, ticker, ease } from './anim.js';

export const GRID = 18;
export const SECTOR_POS = {
  crops: [0, 0], dairy: [-GRID, 0], slaughter: [GRID, 0], orchard: [0, -GRID], poultry: [0, GRID],
  vineyard: [-GRID, -GRID], fishery: [GRID, GRID], apiary: [-GRID, GRID], mycology: [GRID, -GRID],
};

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
  g.add(at(rbox(4, 2.6, 3.4, 0xfff3d6, 0.15), 0, 1.3, 0));
  const roof = rot(at(prism(3.8, 1.6, 4.4, 0x3f7fd1), 0, 2.55, 0), 0, Math.PI / 2, 0);
  g.add(roof);
  g.add(at(rbox(0.8, 1.5, 0.12, 0x8a5a2b, 0.05), 0.6, 0.75, 1.72), at(rbox(0.9, 0.9, 0.12, 0x9fd8f0, 0.05), -0.9, 1.5, 1.72));
  g.add(at(rbox(0.12, 0.9, 0.9, 0x9fd8f0, 0.05), 2.02, 1.5, 0.6), at(rbox(0.12, 0.9, 0.9, 0x9fd8f0, 0.05), 2.02, 1.5, -0.7));
  g.add(at(rbox(0.6, 1.4, 0.6, 0xc96f4a, 0.06), -1.1, 3.6, -0.6));
  return g;
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
  Object.assign(sun.shadow.camera, { left: -52, right: 52, top: 52, bottom: -52, near: 1, far: 160 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);

  // --- island ---
  const water = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat(0x63cfe9));
  water.rotation.x = -Math.PI / 2;
  water.position.y = -1.6;
  scene.add(water);
  const shallows = at(rbox(72, 1, 72, 0x8fe3f2, 0.5), 0, -2.05, 0);
  shallows.geometry = shallows.geometry.clone();
  scene.add(noShadow(shallows));
  scene.add(at(rbox(66, 3, 66, 0xf5e2a8, 1.4), 0, -1.75, 0));
  scene.add(at(rbox(62, 3, 62, 0x8fd65a, 1.4), 0, -1.5, 0));

  // dirt paths between the plots
  const pathMat = mat(0xecd49a);
  for (const p of [-GRID / 2, GRID / 2]) {
    scene.add(at(rbox(57, 0.1, 2.2, pathMat, 0.05), 0, 0.0, p));
    scene.add(at(rbox(2.2, 0.1, 57, pathMat, 0.05), p, 0.0, 0));
  }

  // --- decor around the rim ---
  const rnd = seeded(7);
  const rim = [];
  for (let i = 0; i < 84; i++) {
    const side = Math.floor(rnd() * 4), t = rnd() * 58 - 29, d = 27 + rnd() * 2.8;
    const [x, z] = side === 0 ? [t, -d] : side === 1 ? [t, d] : side === 2 ? [-d, t] : [d, t];
    rim.push([x, z]);
  }
  const blocked = (x, z) => Math.hypot(x + 27.5, z + 27.5) < 4.5 || Math.hypot(x - 8, z + 28.5) < 6.5 || Math.hypot(x + 28.5, z - 9) < 4.5 || Math.hypot(x - 9, z - 28.5) < 4;
  for (const [x, z] of rim) {
    if (blocked(x, z)) continue;
    const r = rnd();
    const o = r < 0.4 ? tree(0.75 + rnd() * 0.4, [0x58b84a, 0x4fae52, 0x6cc24a][Math.floor(rnd() * 3)]) : r < 0.6 ? pine(0.9 + rnd() * 0.4) : r < 0.85 ? bush(0.8 + rnd() * 0.6) : rock(0.8 + rnd());
    scene.add(at(o, x, 0, z));
  }
  // flowers
  const flowerCols = [0xffffff, 0xffd84d, 0xff8fb1, 0xb08cff];
  for (let i = 0; i < 90; i++) {
    const x = rnd() * 58 - 29, z = rnd() * 58 - 29;
    const onPlot = Math.abs(((x + 9 + 180) % 18) - 9) < 7.6 && Math.abs(((z + 9 + 180) % 18) - 9) < 7.6 && Math.abs(x) < 27 && Math.abs(z) < 27;
    if (onPlot) continue;
    if (Math.abs(Math.abs(x) - 9) < 1.4 || Math.abs(Math.abs(z) - 9) < 1.4) continue;
    scene.add(at(noShadow(ball(0.12, flowerCols[i % 4], 6)), x, 0.1, z));
  }
  scene.add(at(windmill(), -27.8, 0, -27.8));
  scene.add(rot(at(barn(), 9, 0, -28.4), 0, 0, 0));
  scene.add(rot(at(farmhouse(), -28.4, 0, 9), 0, Math.PI / 2, 0));
  scene.add(at(hayBale(), 13, 0, -27.6), at(hayBale(), 14.2, 0, -28.6), at(hayBale(), 3.6, 0, -27.8));
  // welcome sign at the bottom tip
  const s = sign('Fortune Farms', 4.4, 1.1, { bg: '#fff3d6', fg: '#d9534f' });
  const welcome = grp(at(s, 0, 1.6, 0.06), at(rbox(4.6, 1.3, 0.1, 0x8a5a2b, 0.05), 0, 1.6, 0), at(cyl(0.1, 0.1, 1.2, 0x8a5a2b, 8), -1.6, 0.6, 0), at(cyl(0.1, 0.1, 1.2, 0x8a5a2b, 8), 1.6, 0.6, 0));
  welcome.rotation.y = YAW;
  scene.add(at(welcome, 9, 0, 28.6));

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
    if (!id) return { target: new THREE.Vector3(0, 0, 0), dist: fit(portrait ? 37 : 39, 4) };
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
