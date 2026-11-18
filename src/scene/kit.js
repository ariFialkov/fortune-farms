// Shared building blocks: cached materials/geometries, primitives, emoji
// sprites, signs, particles, and the cartoon cast (cow, pig, chicken, farmer).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { tween, ease, rand } from './anim.js';
import { model } from './models.js';
export { model };

const mats = new Map();
export function mat(color, opts) {
  if (opts) return new THREE.MeshLambertMaterial({ color, ...opts });
  if (!mats.has(color)) mats.set(color, new THREE.MeshLambertMaterial({ color }));
  return mats.get(color);
}
const geos = new Map();
const geo = (key, make) => { if (!geos.has(key)) geos.set(key, make()); return geos.get(key); };
const mesh = (g, color) => {
  const m = new THREE.Mesh(g, color instanceof THREE.Material ? color : mat(color));
  m.castShadow = m.receiveShadow = true;
  return m;
};

export const rbox = (w, h, d, color, r = 0.12) =>
  mesh(geo(`b${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2))), color);
export const cyl = (rt, rb, h, color, seg = 18) => mesh(geo(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), color);
export const ball = (r, color, seg = 16) => mesh(geo(`s${r},${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(8, seg - 4))), color);
export const cone = (r, h, color, seg = 16) => mesh(geo(`k${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)), color);
export const torus = (r, t, color, seg = 24) => mesh(geo(`t${r},${t},${seg}`, () => new THREE.TorusGeometry(r, t, 10, seg)), color);
export const at = (o, x = 0, y = 0, z = 0) => { o.position.set(x, y, z); return o; };
export const rot = (o, x = 0, y = 0, z = 0) => { o.rotation.set(x, y, z); return o; };
export const scl = (o, x, y = x, z = x) => { o.scale.set(x, y, z); return o; };
export const grp = (...kids) => { const g = new THREE.Group(); kids.forEach((k) => k && g.add(k)); return g; };
export const noShadow = (o) => { o.traverse((c) => { c.castShadow = false; }); return o; };

// ---------- text signs ----------
export function sign(text, w, h, { bg = '#f7e3b4', fg = '#5a3a1e', font = 'bold 60px "Baloo 2", "Comic Sans MS", "Chalkboard SE", cursive', crude = false, border = '#8a5a2b' } = {}) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = Math.round((512 * h) / w);
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
  if (border) { x.strokeStyle = border; x.lineWidth = 14; x.strokeRect(0, 0, c.width, c.height); }
  x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
  const lines = text.split('\n');
  lines.forEach((ln, i) => {
    const y = c.height / 2 + (i - (lines.length - 1) / 2) * 62;
    if (crude) {
      // wobbly hand-painted lettering
      let px = c.width / 2 - x.measureText(ln).width / 2;
      x.textAlign = 'left';
      for (const ch of ln) {
        x.save();
        x.translate(px, y + rand(-7, 7));
        x.rotate(rand(-0.16, 0.16));
        x.fillText(ch, 0, 0);
        x.restore();
        px += x.measureText(ch).width;
      }
    } else x.fillText(ln, c.width / 2, y);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: t }));
  return m;
}

// ---------- particles ----------
export function puff(parent, pos, { color = 0xffffff, n = 6, spread = 0.6, size = 0.18, up = 0.8, dur = 0.6 } = {}) {
  for (let i = 0; i < n; i++) {
    const p = noShadow(ball(size * rand(0.6, 1.2), color, 8));
    p.position.copy(pos);
    parent.add(p);
    const dx = rand(-spread, spread), dz = rand(-spread, spread), dy = rand(up * 0.4, up);
    const x0 = pos.x, y0 = pos.y, z0 = pos.z;
    tween(dur * rand(0.7, 1.2), (k) => {
      p.position.set(x0 + dx * k, y0 + dy * k, z0 + dz * k);
      p.scale.setScalar(Math.max(0.001, 1 - k * k));
    }, ease.out).then(() => parent.remove(p));
  }
}

// A shower of little gold stars.
export function burst(parent, pos, n = 8, size = 0.5) {
  for (let i = 0; i < n; i++) {
    const s = model('star', size * rand(0.6, 1.1));
    s.position.copy(pos);
    s.rotation.set(rand(6), rand(6), 0);
    parent.add(s);
    const a = rand(Math.PI * 2), r = rand(0.8, 2.4), h = rand(1.5, 3.2), s0 = s.scale.x;
    const x0 = pos.x, y0 = pos.y, z0 = pos.z;
    tween(rand(0.6, 1), (k, raw) => {
      s.position.set(x0 + Math.cos(a) * r * k, y0 + Math.sin(raw * Math.PI) * h, z0 + Math.sin(a) * r * k);
      s.rotation.y += 0.2;
      s.scale.setScalar(Math.max(0.001, s0 * (1 - raw * raw)));
    }, ease.out).then(() => parent.remove(s));
  }
}

// --- tiered prize effects ---
const fxMat = (c, op = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
const gemGeo = new THREE.OctahedronGeometry(1);
// coloured gems flung outward
export function sparks(parent, pos, color, n = 8, size = 0.16) {
  const m = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.9 });
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(gemGeo, m);
    s.position.copy(pos);
    parent.add(s);
    const a = rand(Math.PI * 2), r = rand(0.7, 2.4), h = rand(1.2, 3), sz = size * rand(0.6, 1.2);
    const x0 = pos.x, y0 = pos.y, z0 = pos.z;
    tween(rand(0.5, 0.95), (k, raw) => {
      s.position.set(x0 + Math.cos(a) * r * k, y0 + Math.sin(raw * Math.PI) * h, z0 + Math.sin(a) * r * k);
      s.rotation.x += 0.25; s.rotation.y += 0.2;
      s.scale.setScalar(Math.max(0.001, sz * (1 - raw * raw)));
    }, ease.out).then(() => parent.remove(s));
  }
}
// a ring of light racing out across the ground
export function ringPulse(parent, pos, color, radius = 3.5, dur = 0.7) {
  const m = fxMat(color, 0.9);
  const ring = new THREE.Mesh(geo('fxring', () => new THREE.RingGeometry(0.82, 1, 40)), m);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(pos.x, 0.25, pos.z);
  parent.add(ring);
  tween(dur, (k, raw) => { ring.scale.setScalar(0.2 + radius * k); m.opacity = 0.9 * (1 - raw * raw); }, ease.out).then(() => { parent.remove(ring); m.dispose(); });
}
// a pillar of light over the prize
export function lightBeam(parent, pos, color, height = 14, width = 1.1, dur = 1.6) {
  const m = fxMat(color, 0.0);
  const beam = new THREE.Mesh(geo('fxbeam', () => new THREE.CylinderGeometry(0.55, 1, 1, 20, 1, true)), m);
  beam.position.set(pos.x, height / 2, pos.z);
  parent.add(beam);
  tween(dur, (k, raw) => {
    const inn = Math.min(1, raw * 6), out = 1 - Math.max(0, (raw - 0.55) / 0.45);
    beam.scale.set(width * (0.4 + inn * 0.6) * (1 + Math.sin(raw * 40) * 0.05), height, width * (0.4 + inn * 0.6));
    m.opacity = 0.42 * inn * out;
  }, ease.linear).then(() => { parent.remove(beam); m.dispose(); });
}

// The 3D model for a prize: pops in with a spin, sized up a little for rarer tiers.
export function prizeModel(prize, size = 1, face = Math.PI / 4) {
  const m = model(prize.icon, size * (1 + prize.tier * 0.18));
  const s0 = m.scale.x;
  tween(0.5, (k, raw) => { m.scale.setScalar(Math.max(0.001, s0 * Math.min(1, raw * 2.2))); m.rotation.y = face + (1 - k) * Math.PI * 2; }, ease.out);
  return m;
}

// A white streak of wind blowing from one point to another.
const gustMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
export function gust(parent, from, to, dur, size = 1) {
  const g = grp();
  [[0, 0, 1], [-1.3, 0.25, 0.7], [-2.3, -0.15, 0.5]].forEach(([x, y, s]) => { const b = new THREE.Mesh(geo('s1,10', () => new THREE.SphereGeometry(1, 10, 8)), gustMat); b.scale.set(0.9 * s * size, 0.16 * s * size, 0.16 * s * size); b.position.set(x * size, y * size, 0); g.add(b); });
  g.position.set(from.x, from.y, from.z);
  g.rotation.y = Math.atan2(-(to.z - from.z), to.x - from.x);
  parent.add(g);
  return tween(dur, (k) => g.position.set(from.x + (to.x - from.x) * k, from.y + Math.sin(k * 9) * 0.25, from.z + (to.z - from.z) * k), ease.linear).then(() => parent.remove(g));
}

// ---------- scenery ----------
export function fence(len, color = 0xf3ead8) {
  const g = grp();
  const posts = Math.max(2, Math.round(len / 1.6) + 1);
  for (let i = 0; i < posts; i++) g.add(at(rbox(0.18, 0.9, 0.18, color, 0.06), -len / 2 + (i * len) / (posts - 1), 0.45, 0));
  g.add(at(rbox(len, 0.12, 0.08, color, 0.04), 0, 0.68, 0));
  g.add(at(rbox(len, 0.12, 0.08, color, 0.04), 0, 0.36, 0));
  return g;
}
export function fenceRect(w, d, color, gapSide) {
  const g = grp();
  if (gapSide !== 'n') g.add(at(fence(w, color), 0, 0, -d / 2));
  if (gapSide !== 's') g.add(at(fence(w, color), 0, 0, d / 2));
  if (gapSide !== 'w') g.add(rot(at(fence(d, color), -w / 2, 0, 0), 0, Math.PI / 2));
  if (gapSide !== 'e') g.add(rot(at(fence(d, color), w / 2, 0, 0), 0, Math.PI / 2));
  return g;
}

export function tree(s = 1, leaf = 0x58b84a, fruit = null) {
  const g = grp();
  g.add(at(cyl(0.22 * s, 0.32 * s, 1.6 * s, 0x8a5a2b, 10), 0, 0.8 * s, 0));
  const crown = grp(
    at(ball(1.15 * s, leaf), 0, 0, 0),
    at(ball(0.8 * s, leaf), 0.75 * s, -0.25 * s, 0.2 * s),
    at(ball(0.75 * s, leaf), -0.7 * s, -0.2 * s, -0.25 * s),
    at(ball(0.7 * s, leaf), 0.1 * s, 0.7 * s, 0),
  );
  if (fruit != null) {
    for (let i = 0; i < 7; i++) {
      const a = rand(Math.PI * 2), e = rand(-0.3, 0.9);
      crown.add(at(noShadow(ball(0.17 * s, fruit, 8)), Math.cos(a) * Math.cos(e) * 1.15 * s, Math.sin(e) * 1.0 * s, Math.sin(a) * Math.cos(e) * 1.15 * s));
    }
  }
  crown.position.y = 2.2 * s;
  g.add(crown);
  g.userData.crown = crown;
  return g;
}

export function pine(s = 1) {
  return grp(
    at(cyl(0.15 * s, 0.22 * s, 0.8 * s, 0x7a4e26, 8), 0, 0.4 * s, 0),
    at(cone(1.0 * s, 1.4 * s, 0x3f9b55, 10), 0, 1.4 * s, 0),
    at(cone(0.8 * s, 1.2 * s, 0x46a85d, 10), 0, 2.1 * s, 0),
    at(cone(0.55 * s, 1.0 * s, 0x4fb766, 10), 0, 2.75 * s, 0),
  );
}

export function bush(s = 1, c = 0x4cae4f) {
  return grp(at(ball(0.6 * s, c, 10), 0, 0.4 * s, 0), at(ball(0.45 * s, c, 10), 0.5 * s, 0.3 * s, 0.1 * s), at(ball(0.4 * s, c, 10), -0.45 * s, 0.28 * s, -0.1 * s));
}
export const rock = (s = 1) => scl(at(ball(0.5 * s, 0xb9b4ad, 7), 0, 0.25 * s, 0), 1.3, 0.8, 1);

// ---------- characters (all face +X, origin at the feet) ----------
function legs(g, xs, zs, h, r, color) {
  for (const x of xs) for (const z of zs) g.add(at(cyl(r, r * 0.9, h, color, 8), x, h / 2, z));
}

export function cow(spot = 0x3a3232) {
  const g = grp();
  legs(g, [-0.5, 0.5], [-0.25, 0.25], 0.55, 0.12, 0xfaf6ee);
  g.add(at(rbox(1.6, 0.9, 0.9, 0xfaf6ee, 0.35), 0, 0.95, 0));
  g.add(at(rbox(0.5, 0.42, 0.93, spot, 0.2), -0.2, 1.05, 0));
  g.add(at(rbox(0.36, 0.3, 0.6, spot, 0.14), 0.45, 1.27, 0.2));
  g.add(at(ball(0.22, 0xf7a8b8, 10), -0.35, 0.5, 0)); // udder
  const head = grp(
    rbox(0.6, 0.6, 0.62, 0xfaf6ee, 0.22),
    at(rbox(0.3, 0.34, 0.5, 0xf7b7c3, 0.14), 0.3, -0.1, 0),
    at(ball(0.06, 0x222222, 8), 0.3, 0.12, 0.2), at(ball(0.06, 0x222222, 8), 0.3, 0.12, -0.2),
    rot(at(cone(0.07, 0.22, 0xe9dcc0, 8), 0, 0.38, 0.22), 0.3), rot(at(cone(0.07, 0.22, 0xe9dcc0, 8), 0, 0.38, -0.22), -0.3),
    at(rbox(0.12, 0.2, 0.26, spot, 0.06), -0.05, 0.2, 0.42), at(rbox(0.12, 0.2, 0.26, spot, 0.06), -0.05, 0.2, -0.42),
  );
  g.add(at(head, 0.95, 1.35, 0));
  g.add(rot(at(cyl(0.04, 0.04, 0.6, 0xfaf6ee, 6), -0.85, 0.95, 0), 0, 0, -0.5));
  g.userData.head = head;
  return g;
}

export function pig() {
  const c = 0xf6a5b6;
  const g = grp();
  legs(g, [-0.32, 0.32], [-0.2, 0.2], 0.3, 0.1, 0xe88fa3);
  g.add(scl(at(ball(0.55, c), 0, 0.68, 0), 1.25, 0.95, 1));
  const head = grp(
    ball(0.4, c),
    at(cyl(0.16, 0.18, 0.16, 0xe88fa3, 12), 0.38, -0.04, 0),
    at(ball(0.05, 0x222222, 8), 0.3, 0.14, 0.17), at(ball(0.05, 0x222222, 8), 0.3, 0.14, -0.17),
    rot(at(cone(0.12, 0.2, 0xe88fa3, 6), 0.05, 0.36, 0.2), 0.4), rot(at(cone(0.12, 0.2, 0xe88fa3, 6), 0.05, 0.36, -0.2), -0.4),
  );
  head.children[1].rotation.z = Math.PI / 2;
  g.add(at(head, 0.72, 0.85, 0));
  g.add(at(torus(0.09, 0.035, 0xe88fa3, 10), -0.72, 0.8, 0));
  return g;
}

export function chicken(body = 0xffffff) {
  const g = grp();
  g.add(at(cyl(0.03, 0.03, 0.22, 0xf4a31c, 6), 0, 0.11, 0.09), at(cyl(0.03, 0.03, 0.22, 0xf4a31c, 6), 0, 0.11, -0.09));
  g.add(scl(at(ball(0.3, body, 12), 0, 0.45, 0), 1.15, 1, 1));
  g.add(rot(at(cone(0.16, 0.3, body, 8), -0.36, 0.56, 0), 0, 0, 0.9));
  g.add(at(ball(0.19, body, 10), 0.26, 0.78, 0));
  g.add(rot(at(cone(0.06, 0.16, 0xf4a31c, 6), 0.47, 0.76, 0), 0, 0, -Math.PI / 2));
  g.add(at(rbox(0.16, 0.12, 0.06, 0xe5383b, 0.03), 0.25, 0.98, 0));
  g.add(at(ball(0.05, 0xe5383b, 6), 0.4, 0.66, 0));
  g.add(at(ball(0.03, 0x222222, 6), 0.36, 0.82, 0.13), at(ball(0.03, 0x222222, 6), 0.36, 0.82, -0.13));
  return g;
}

export function farmer(shirt = 0xe5533d, overalls = 0x3f7fd1) {
  const g = grp();
  g.add(at(cyl(0.11, 0.11, 0.5, overalls, 8), 0, 0.25, 0.13), at(cyl(0.11, 0.11, 0.5, overalls, 8), 0, 0.25, -0.13));
  g.add(at(rbox(0.5, 0.6, 0.6, overalls, 0.16), 0, 0.75, 0));
  g.add(at(rbox(0.46, 0.3, 0.56, shirt, 0.12), 0, 1.08, 0));
  g.add(at(cyl(0.08, 0.08, 0.5, shirt, 8), 0, 0.9, 0.36), at(cyl(0.08, 0.08, 0.5, shirt, 8), 0, 0.9, -0.36));
  g.add(at(ball(0.28, 0xf6cfa3, 12), 0, 1.48, 0));
  g.add(at(ball(0.035, 0x222222, 6), 0.25, 1.52, 0.1), at(ball(0.035, 0x222222, 6), 0.25, 1.52, -0.1));
  g.add(at(cyl(0.48, 0.48, 0.05, 0xf2d16b, 16), 0, 1.68, 0), at(cyl(0.24, 0.27, 0.22, 0xf2d16b, 14), 0, 1.8, 0));
  return g;
}

// Gently idle-bob a list of creatures (returns nothing; runs forever).
export function idleBob(list, tickerFn, amp = 0.04) {
  const phase = list.map(() => rand(6.28));
  tickerFn((dt, t) => {
    list.forEach((o, i) => { if (!o.userData.busy) o.scale.y = 1 + Math.sin(t * 3 + phase[i]) * amp; });
  });
}

// Triangular roof prism: base w (along X), height h, ridge running along Z for depth d.
export function prism(w, h, d, color) {
  const g = geo(`p${w},${h},${d}`, () => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
    const e = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 });
    e.translate(0, 0, -d / 2);
    return e;
  });
  return mesh(g, color);
}

// Ground pad for a sector plot, and local->world helper for sector groups.
export const plot = (w, d, color, y = 0.03) => at(rbox(w, 0.16, d, color, 0.08), 0, y, 0);
export const wp = (group, x, y, z) => group.localToWorld(new THREE.Vector3(x, y, z));
// Place a sector group from a layout entry ({x, z, rot, scale}).
export function applyPlace(g, a) {
  g.position.set(a.x, 0, a.z);
  g.rotation.y = a.rot || 0;
  g.scale.setScalar(a.scale || 1);
  g.updateMatrixWorld(true);
}
// World [x, z] -> the group's local {x, z}.
export const toLocal = (g, [x, z]) => { const v = g.worldToLocal(new THREE.Vector3(x, 0, z)); return { x: v.x, z: v.z }; };
export const lerp = (a, b, k) => a + (b - a) * k;
