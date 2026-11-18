// A small 3D model for every prize, upgrade and symbol in the game. The same
// models are used in the world (prizes popping out) and rendered to images for
// the UI, so the 2D symbols always match the 3D art.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const mats = new Map();
const M = (c, glow = 0) => {
  const k = c + ':' + glow;
  if (!mats.has(k)) mats.set(k, new THREE.MeshLambertMaterial({ color: c, emissive: glow ? c : 0, emissiveIntensity: glow }));
  return mats.get(k);
};
const G = { sphere: new THREE.SphereGeometry(1, 16, 12), cyl: new THREE.CylinderGeometry(1, 1, 1, 16), cone: new THREE.ConeGeometry(1, 1, 14), box: new RoundedBoxGeometry(1, 1, 1, 2, 0.14) };
const geos = new Map();
const geo = (k, f) => { if (!geos.has(k)) geos.set(k, f()); return geos.get(k); };
const mk = (g, c, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], glow = 0) => {
  const m = new THREE.Mesh(g, M(c, glow));
  m.position.set(...p); m.scale.set(...s); m.rotation.set(...r);
  m.castShadow = true;
  return m;
};
// primitives: colour first, then size, position, rotation
const B = (c, s, p, r, glow) => mk(G.sphere, c, p, typeof s === 'number' ? [s, s, s] : s, r, glow);            // ball / ellipsoid (radii)
const C = (c, rad, h, p, r, glow) => mk(G.cyl, c, p, [rad, h, rad], r, glow);                                   // cylinder
const T = (c, rt, rb, h, p, r) => mk(geo(`t${rt},${rb}`, () => new THREE.CylinderGeometry(rt, rb, 1, 16)), c, p, [1, h, 1], r); // tapered cylinder
const K = (c, rad, h, p, r, glow) => mk(G.cone, c, p, [rad, h, rad], r, glow);                                  // cone (point up)
const X = (c, s, p, r, glow) => mk(G.box, c, p, s, r, glow);                                                    // rounded box
const R = (c, rad, tube, p, r, arc = Math.PI * 2, glow) => mk(geo(`r${rad},${tube},${arc}`, () => new THREE.TorusGeometry(rad, tube, 8, 20, arc)), c, p, [1, 1, 1], r, glow);
const grp = (...k) => { const g = new THREE.Group(); k.flat().forEach((o) => o && g.add(o)); return g; };
const at = (o, p, r, s) => { if (p) o.position.set(...p); if (r) o.rotation.set(...r); if (s) o.scale.setScalar(s); return o; };
const leaf = (p, r, s = 0.22, c = 0x4caf50) => B(c, [s, s * 0.22, s * 0.55], p, r);
const flat = (shape, depth, c, glow = 0) => {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
  g.center();
  return mk(g, c, [0, 0, 0], [1, 1, 1], [0, 0, 0], glow);
};
const PI = Math.PI;

// ---------- families ----------
const milkBottle = (cap, label, liquid = 0xffffff) => grp(
  T(liquid, 0.3, 0.32, 0.7, [0, 0.35, 0]), B(liquid, [0.3, 0.2, 0.3], [0, 0.7, 0]), C(liquid, 0.14, 0.24, [0, 0.92, 0]),
  C(cap, 0.17, 0.1, [0, 1.07, 0]), C(label, 0.33, 0.3, [0, 0.36, 0]), B(0xffffff, [0.12, 0.09, 0.03], [0, 0.36, 0.32]),
);
const EGGS = { egg: [0.3, 0xfffaf0], quailegg: [0.2, 0xd9c7a0], duckegg: [0.32, 0xcfeee6], ostrichegg: [0.45, 0xfff3d6], easteregg: [0.33, 0xff8fb1], faberge: [0.36, 0x1fb5a8], goldenegg: [0.4, 0xffc928] };
const egg = (id) => {
  const [r, c] = EGGS[id];
  const g = grp(B(c, [r, r * 1.3, r], [0, 0, 0], undefined, id === 'goldenegg' ? 0.55 : 0));
  if (id === 'easteregg') g.add(R(0x7ad3ff, r * 0.99, 0.04, [0, 0, 0], [PI / 2, 0, 0]), R(0xfff27a, r * 0.82, 0.035, [0, r * 0.6, 0], [PI / 2, 0, 0]), R(0xb08cff, r * 0.82, 0.035, [0, -r * 0.6, 0], [PI / 2, 0, 0]));
  if (id === 'faberge') g.add(R(0xffd23f, r, 0.045, [0, 0, 0], [PI / 2, 0, 0]), R(0xffd23f, r * 1.14, 0.035, [0, 0, 0]), B(0xff5a8a, 0.08, [0, r * 1.3, 0]), B(0xff5a8a, 0.06, [0, 0, r]), C(0xffd23f, r * 0.5, 0.1, [0, -r * 1.3, 0]));
  if (id === 'quailegg') [[0.4, 0.3], [-0.5, 0.1], [0.1, -0.5], [-0.2, 0.7], [0.6, -0.3], [-0.6, -0.5]].forEach(([x, y]) => g.add(B(0x6b4a36, 0.035, [x * r, y * r, r * Math.sqrt(Math.max(0.1, 1 - x * x - (y * y) / 1.7)) * 0.98])));
  if (id === 'duckegg') g.add(B(0xe9fbf6, [r * 0.3, r * 0.4, 0.02], [-r * 0.3, r * 0.4, r * 0.82]));
  if (id === 'goldenegg') g.add(B(0xfff3a6, [r * 0.25, r * 0.36, 0.02], [-r * 0.3, r * 0.45, r * 0.8], undefined, 0.8));
  g.userData.r = r * 1.3;
  return g;
};
const fish = (body, belly, fin, len = 1, extra = []) => flatFins([
  B(body, [0.62 * len, 0.3, 0.16], [0, 0, 0]), B(belly, [0.5 * len, 0.2, 0.15], [0.02, -0.1, 0.02]),
  K(fin, 0.26, 0.34, [-0.72 * len, 0, 0], [0, 0, -PI / 2]), K(fin, 0.14, 0.2, [0, 0.3, 0], [0, 0, 0.3]), K(fin, 0.1, 0.16, [0.1, -0.25, 0.1], [PI, 0, 0.3]),
  B(0xffffff, 0.06, [0.42 * len, 0.06, 0.13]), B(0x222222, 0.035, [0.44 * len, 0.06, 0.17]), ...extra,
]);
function flatFins(parts) { parts.forEach((m) => { if (m.geometry === G.cone) m.scale.z = 0.25 * m.scale.x; }); return grp(parts); }
const wine = (glass, label, foil, o = {}) => {
  const w = o.fat || 1, h = o.tall || 1;
  const g = grp(C(glass, 0.24 * w, 0.75 * h, [0, 0.375 * h, 0]), B(glass, [0.24 * w, 0.2, 0.24 * w], [0, 0.75 * h, 0]), C(glass, 0.085, 0.38, [0, 0.75 * h + 0.3, 0]),
    C(foil, 0.095, o.bigFoil ? 0.3 : 0.14, [0, 0.75 * h + 0.47 - (o.bigFoil ? 0.07 : 0), 0], undefined, o.glow || 0),
    C(label, 0.25 * w, 0.32 * h, [0, 0.36 * h, 0]));
  if (o.crest) g.add(B(o.crest, [0.1, 0.12, 0.03], [0, 0.38 * h, 0.25 * w], undefined, o.glow || 0));
  if (o.band) g.add(C(o.band, 0.255 * w, 0.05, [0, 0.58 * h, 0]));
  if (o.basket) g.add(B(0xd9b56b, [0.34, 0.3, 0.34], [0, 0.26, 0]), R(0xb98a45, 0.33, 0.03, [0, 0.3, 0], [PI / 2, 0, 0]), R(0xb98a45, 0.3, 0.03, [0, 0.14, 0], [PI / 2, 0, 0]));
  if (o.net) for (let i = 0; i < 3; i++) g.add(R(0xffd23f, 0.25 * w, 0.015, [0, 0.2 + i * 0.2, 0], [PI / 2, 0, 0]));
  if (o.cork) g.add(B(0xd9b98a, [0.13, 0.09, 0.13], [0, 0.75 * h + 0.64, 0]));
  return g;
};
const shroom = (cap, stem, o = {}) => {
  const r = o.r || 0.4, f = o.flat || 0.6, sh = o.stemH || 0.5, sr = o.stemR || 0.13;
  const g = grp(T(stem, sr * 0.85, sr * 1.15, sh, [0, sh / 2, 0]), B(cap, [r, r * f, r], [0, sh + r * f * 0.25, 0], undefined, o.glow || 0), C(o.gill || 0xf3e6cf, r * 0.9, 0.04, [0, sh + 0.01, 0]));
  (o.spots || []).forEach(([a, e]) => g.add(B(o.spotC || 0xffffff, o.spotR || 0.06, [Math.cos(a) * Math.cos(e) * r, sh + r * f * 0.25 + Math.sin(e) * r * f, Math.sin(a) * Math.cos(e) * r])));
  if (o.tip) g.add(B(cap, [r * 0.3, r * 0.3, r * 0.3], [0, sh + r * f * 1.15, 0], undefined, o.glow || 0));
  return g;
};
const lump = (c, c2, glow = 0) => grp(B(c, [0.42, 0.34, 0.38], [0, 0, 0], undefined, glow), B(c, 0.24, [0.3, 0.1, 0.12], undefined, glow), B(c, 0.22, [-0.28, 0.14, -0.1], undefined, glow), B(c, 0.2, [0.05, 0.26, 0.2], undefined, glow), B(c, 0.18, [-0.1, -0.12, 0.3], undefined, glow),
  ...[[0.2, 0.3, 0.2], [-0.3, 0.3, 0.1], [0.4, 0, 0.25], [-0.1, 0.1, 0.42], [0.1, 0.42, 0]].map((p) => B(c2, 0.05, p)));
const honeyJar = (c, glow) => grp(C(c, 0.36, 0.6, [0, 0.3, 0], undefined, glow), B(c, [0.36, 0.14, 0.36], [0, 0.6, 0], undefined, glow), C(0xd9b56b, 0.3, 0.12, [0, 0.74, 0]), C(0xfff3d6, 0.37, 0.24, [0, 0.3, 0]),
  B(c, [0.1, 0.08, 0.03], [0, 0.3, 0.36], undefined, glow), C(0xb98a45, 0.035, 0.6, [0.2, 1.0, 0], [0, 0, -0.5]), B(0xb98a45, [0.1, 0.13, 0.1], [0.06, 0.78, 0]));
const tractor = (c, glow = 0) => grp(X(c, [0.9, 0.5, 0.6], [0, 0.5, 0], undefined, glow), X(0xbfe9ff, [0.4, 0.4, 0.5], [-0.15, 0.92, 0]), X(c, [0.46, 0.07, 0.56], [-0.15, 1.15, 0], undefined, glow),
  ...[[-0.3, 0.26], [0.32, 0.2]].flatMap(([x, r]) => [C(0x3a3a44, r, 0.16, [x, r, 0.32], [PI / 2, 0, 0]), C(0x3a3a44, r, 0.16, [x, r, -0.32], [PI / 2, 0, 0]), C(0xf5c542, r * 0.45, 0.18, [x, r, 0.32], [PI / 2, 0, 0])]),
  X(0x4a4a55, [0.2, 0.2, 1.1], [0.62, 0.22, 0]), C(0xf5c542, 0.16, 1.05, [0.74, 0.3, 0], [PI / 2, 0, 0]), C(0x4a4a55, 0.05, 0.4, [0.25, 0.95, 0.2]));
const star = (pts, c, glow, inner = 0.45) => { const s = new THREE.Shape(); for (let i = 0; i < pts * 2; i++) { const a = (i / (pts * 2)) * PI * 2 + PI / 2, r = i % 2 ? inner : 1; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } return flat(s, 0.2, c, glow); };
const crescent = (c, glow) => { const s = new THREE.Shape(); s.absarc(0, 0, 1, PI * 0.3, PI * 1.7, false); s.absarc(0.45, 0, 0.78, PI * 1.62, PI * 0.38, true); return flat(s, 0.2, c, glow); };
const half = (c, r, h, p, rot) => mk(geo(`h${r},${h}`, () => new THREE.CylinderGeometry(r, r, h, 20, 1, false, 0, PI)), c, p, [1, 1, 1], rot);

// ---------- the catalogue ----------
const DEF = {
  // crops
  wheat: () => grp([-0.3, 0, 0.3].map((a, i) => at(grp(C(0xd9b24f, 0.03, 0.9, [0, 0.45, 0]), B(0xf2c94c, [0.09, 0.26, 0.09], [0, 1.0, 0]), ...[0, 1, 2, 3].map((k) => B(0xe0b23a, [0.05, 0.1, 0.05], [k % 2 ? 0.09 : -0.09, 0.85 + k * 0.09, 0], [0, 0, k % 2 ? -0.5 : 0.5]))), [a * 0.4, 0, 0], [0, 0, -a * 0.9])), R(0xb98a45, 0.09, 0.03, [0, 0.3, 0], [PI / 2, 0, 0])),
  corn: () => grp(B(0xffd23f, [0.24, 0.55, 0.24], [0, 0.6, 0]), ...[0, 1, 2, 3, 4, 5].flatMap((i) => [0.2, 0.45, 0.7, 0.95].map((y) => B(0xffe27a, 0.045, [Math.cos(i * 1.05) * 0.22, y, Math.sin(i * 1.05) * 0.22]))), B(0x6fbf3a, [0.2, 0.42, 0.1], [-0.2, 0.36, 0.05], [0, 0, 0.35]), B(0x5aa832, [0.2, 0.42, 0.1], [0.2, 0.36, 0.05], [0, 0, -0.35]), C(0x8ccf3f, 0.07, 0.16, [0, 0, 0])),
  carrot: () => grp(K(0xff8a2b, 0.22, 0.95, [0, 0.47, 0], [PI, 0, 0]), ...[0.75, 0.55, 0.35].map((y, i) => R(0xe8741a, 0.2 * (y + 0.1), 0.012, [0, y, 0], [PI / 2, 0, 0])), K(0x4caf50, 0.08, 0.4, [0, 1.12, 0]), K(0x5cbd4c, 0.07, 0.34, [0.12, 1.08, 0], [0, 0, -0.5]), K(0x5cbd4c, 0.07, 0.34, [-0.12, 1.08, 0], [0, 0, 0.5])),
  potato: () => grp(B(0xc9a063, [0.5, 0.36, 0.38], [0, 0, 0]), B(0xc9a063, 0.26, [0.3, 0.06, 0.05]), ...[[0.2, 0.2, 0.3], [-0.25, 0.1, 0.3], [0.4, -0.05, 0.22], [-0.05, -0.15, 0.36], [-0.35, 0.2, 0.1]].map((p) => B(0x8a6a3e, 0.04, p))),
  cabbage: () => grp(B(0xa8de6a, 0.42, [0, 0.42, 0]), B(0x7cc653, [0.46, 0.4, 0.2], [0, 0.36, 0.18], [0.3, 0, 0]), B(0x6fbd4b, [0.2, 0.4, 0.46], [-0.24, 0.34, 0], [0, 0, 0.35]), B(0x6fbd4b, [0.2, 0.4, 0.46], [0.24, 0.34, 0], [0, 0, -0.35]), B(0x5aa832, [0.5, 0.1, 0.5], [0, 0.06, 0])),
  onion: () => grp(B(0xe6a04a, [0.4, 0.36, 0.4], [0, 0.36, 0]), K(0xd98e3a, 0.16, 0.34, [0, 0.82, 0]), K(0x7cc653, 0.04, 0.26, [0, 1.05, 0]), ...[0, 1, 2, 3].map((i) => R(0xcf8a36, 0.4, 0.012, [0, 0.36, 0], [0, (i * PI) / 4, 0])), C(0xf3e6cf, 0.07, 0.06, [0, 0.0, 0])),
  radish: () => grp(B(0xe5386b, [0.34, 0.36, 0.34], [0, 0.45, 0]), K(0xffffff, 0.14, 0.34, [0, 0.08, 0], [PI, 0, 0]), leaf([0, 1.0, 0], [0, 0, PI / 2], 0.3), leaf([-0.2, 0.95, 0], [0, 0, PI / 2 + 0.6], 0.26), leaf([0.2, 0.95, 0], [0, 0, PI / 2 - 0.6], 0.26)),
  strawberry: () => grp(B(0xe5383b, [0.36, 0.3, 0.36], [0, 0.55, 0]), K(0xe5383b, 0.34, 0.55, [0, 0.27, 0], [PI, 0, 0]), ...[0, 1, 2, 3, 4].map((i) => leaf([Math.cos(i * 1.26) * 0.16, 0.82, Math.sin(i * 1.26) * 0.16], [0, -i * 1.26, 0.3], 0.18)), C(0x4caf50, 0.03, 0.14, [0, 0.9, 0]),
    ...[[0.2, 0.55, 0.28], [-0.2, 0.5, 0.28], [0, 0.35, 0.27], [0.12, 0.2, 0.17], [-0.12, 0.22, 0.17], [0, 0.66, 0.34]].map((p) => B(0xffe27a, 0.03, p))),
  chilli: () => grp(R(0xe5383b, 0.5, 0.13, [0, 0.1, 0], [0, 0, 0.3], PI * 0.55), K(0xe5383b, 0.13, 0.36, [-0.33, 0.62, 0], [0, 0, 1.25]), C(0x4caf50, 0.05, 0.2, [0.52, 0.24, 0], [0, 0, -0.3]), B(0x4caf50, [0.15, 0.06, 0.15], [0.5, 0.18, 0])),
  pumpkin: () => grp(...[-0.3, -0.15, 0, 0.15, 0.3].map((x) => B(x === 0 ? 0xff9a2e : 0xf5861f, [0.26, 0.4, 0.42], [x, 0.4, 0])), C(0x7a5a34, 0.06, 0.2, [0, 0.86, 0], [0, 0, 0.2]), leaf([0.2, 0.84, 0], [0, 0, 0.2], 0.2)),
  sugarbeet: () => grp(K(0xf3e6cf, 0.36, 0.8, [0, 0.4, 0], [PI, 0, 0]), B(0xf3e6cf, [0.36, 0.18, 0.36], [0, 0.8, 0]), B(0xb04d8a, [0.2, 0.06, 0.2], [0, 0.95, 0]), leaf([0, 1.3, 0], [0, 0, PI / 2], 0.4), leaf([-0.3, 1.2, 0], [0, 0, PI / 2 + 0.7], 0.36), leaf([0.3, 1.2, 0], [0, 0, PI / 2 - 0.7], 0.36)),
  watermelon: () => grp(half(0x3f9b3f, 0.6, 0.24, [0, 0, 0], [PI / 2, -PI / 2, 0]), half(0xf3f8d8, 0.53, 0.26, [0, 0.005, 0], [PI / 2, -PI / 2, 0]), half(0xf0445a, 0.48, 0.28, [0, 0.01, 0], [PI / 2, -PI / 2, 0]),
    ...[[-0.25, 0.14], [0, 0.2], [0.25, 0.14], [-0.12, 0.34], [0.12, 0.34]].flatMap(([x, y]) => [B(0x2b1b12, [0.03, 0.045, 0.02], [x, y, 0.145]), B(0x2b1b12, [0.03, 0.045, 0.02], [x, y, -0.145])])),
  ginger: () => grp(B(0xd9b57a, [0.36, 0.2, 0.2], [0, 0, 0]), B(0xd9b57a, [0.16, 0.26, 0.16], [0.3, 0.2, 0]), B(0xd9b57a, [0.15, 0.22, 0.15], [-0.28, 0.16, 0.04]), B(0xd9b57a, [0.14, 0.18, 0.14], [0.02, 0.22, -0.02]), B(0xcda468, 0.12, [0.46, 0.02, 0.02]), B(0xf0d9a8, 0.07, [0.3, 0.44, 0]), B(0xf0d9a8, 0.06, [-0.28, 0.37, 0.04])),
  lavender: () => grp([-0.35, 0, 0.35].map((a) => at(grp(C(0x6fae5a, 0.025, 0.8, [0, 0.4, 0]), ...[0, 1, 2, 3, 4, 5].map((k) => B(k % 2 ? 0x9b6de5 : 0xb08cff, 0.085 - k * 0.006, [k % 2 ? 0.04 : -0.04, 0.72 + k * 0.1, 0]))), [a * 0.3, 0, 0], [0, 0, -a * 0.8])), R(0xffffff, 0.08, 0.03, [0, 0.22, 0], [PI / 2, 0, 0])),
  wasabi: () => grp(T(0x8fc45a, 0.2, 0.13, 0.75, [0, 0.38, 0], [0, 0, 0.15]), ...[0.15, 0.32, 0.5, 0.66].map((y, i) => B(0x7ab04a, 0.06, [(i % 2 ? 0.17 : -0.15) + y * 0.05, y, 0.08])), C(0x6fae5a, 0.03, 0.34, [-0.14, 0.9, 0], [0, 0, 0.35]), C(0x6fae5a, 0.03, 0.34, [0.06, 0.92, 0], [0, 0, -0.3]),
    B(0x4caf50, [0.2, 0.04, 0.2], [-0.22, 1.08, 0], [0, 0, 0.3]), B(0x4caf50, [0.18, 0.04, 0.18], [0.14, 1.1, 0], [0, 0, -0.3])),
  saffron: () => grp(C(0x6fae5a, 0.04, 0.4, [0, 0.2, 0]), ...[0, 1, 2, 3, 4, 5].map((i) => at(grp(B(0x9b5de5, [0.15, 0.34, 0.07], [0, 0.3, 0.12], [0.45, 0, 0], 0.25)), [0, 0.36, 0], [0, i * 1.047, 0])),
    ...[-0.3, 0, 0.3].map((a) => K(0xff4a1c, 0.035, 0.42, [a * 0.3, 0.72, 0], [0, 0, -a], 0.8)), B(0xffd23f, 0.07, [0, 0.5, 0], undefined, 0.6)),
  // dairy
  milk: () => milkBottle(0x2f8fe5, 0x9fd8f0), goatmilk: () => milkBottle(0x3fae5a, 0xbfe8b0), sheepmilk: () => milkBottle(0xff8fb1, 0xffd6e2), buffalomilk: () => milkBottle(0x4a4a55, 0xb9b4ad),
  yakmilk: () => milkBottle(0xf5a742, 0xffe0a8), chocmilk: () => milkBottle(0x5a3a1e, 0xf2d9a0, 0x9a6b3f),
  butter: () => grp(X(0xfdf8ee, [1.0, 0.06, 0.7], [0, 0.03, 0]), X(0xffe27a, [0.8, 0.34, 0.46], [0, 0.23, 0]), X(0xffe27a, [0.18, 0.34, 0.46], [0.6, 0.2, 0.08], [0, 0.3, 0.25])),
  cream: () => grp(T(0xff7fa0, 0.34, 0.26, 0.42, [0, 0.21, 0]), C(0xffffff, 0.36, 0.06, [0, 0.43, 0]), B(0xfffaf0, [0.32, 0.16, 0.32], [0, 0.52, 0]), B(0xfffaf0, [0.24, 0.14, 0.24], [0, 0.68, 0]), B(0xfffaf0, [0.15, 0.12, 0.15], [0, 0.82, 0]), K(0xfffaf0, 0.07, 0.16, [0.02, 0.96, 0]), B(0xe5383b, 0.09, [0.05, 1.02, 0.02])),
  goatcheese: () => grp(C(0xfffaf0, 0.26, 0.9, [0, 0.26, 0], [0, 0, PI / 2]), ...[[-0.3, 0.45, 0.14], [0, 0.5, 0.08], [0.25, 0.44, 0.16], [-0.1, 0.36, 0.24], [0.33, 0.3, 0.24], [-0.36, 0.26, 0.26]].map((p) => B(0x5aa832, 0.04, p)), C(0xf3e6cf, 0.262, 0.04, [0.46, 0.26, 0], [0, 0, PI / 2])),
  feta: () => grp(X(0xfffdf5, [0.5, 0.42, 0.5], [-0.2, 0.21, 0]), X(0xfffdf5, [0.42, 0.36, 0.42], [0.3, 0.18, 0.1], [0, 0.4, 0]), X(0xfffdf5, [0.38, 0.34, 0.38], [0, 0.6, 0.02], [0, 0.25, 0]), leaf([0.2, 0.44, 0.3], [0, 0.5, 0.2], 0.16), B(0x2b2b33, 0.07, [-0.35, 0.07, 0.36]), B(0x2b2b33, 0.07, [0.45, 0.07, -0.25])),
  mozzarella: () => grp(B(0xfffdf5, 0.38, [0, 0.36, 0]), B(0xfffdf5, 0.24, [0.44, 0.22, 0.14]), K(0xfffdf5, 0.12, 0.2, [0, 0.76, 0]), leaf([-0.3, 0.14, 0.3], [0, 0.6, 0], 0.24), leaf([-0.12, 0.12, 0.42], [0, -0.4, 0], 0.2), B(0xe5383b, 0.13, [-0.42, 0.13, 0.0])),
  yaktea: () => grp(T(0xc96f4a, 0.42, 0.26, 0.4, [0, 0.26, 0]), C(0xc96f4a, 0.2, 0.08, [0, 0.04, 0]), R(0xffd23f, 0.42, 0.03, [0, 0.46, 0], [PI / 2, 0, 0], PI * 2, 0.5), C(0xd9a86a, 0.39, 0.03, [0, 0.45, 0]), R(0x3fa9f5, 0.36, 0.025, [0, 0.28, 0], [PI / 2, 0, 0]),
    B(0xffffff, 0.09, [-0.1, 0.72, 0]), B(0xffffff, 0.12, [0.06, 0.92, 0]), B(0xffffff, 0.08, [-0.04, 1.12, 0]), B(0xffe27a, [0.09, 0.03, 0.09], [0.12, 0.47, 0.1])),
  // eggs
  ...Object.fromEntries(Object.keys(EGGS).map((k) => [k, () => egg(k)])),
  // meats
  drumstick: () => grp(B(0xc9772b, [0.36, 0.42, 0.34], [0, 0.62, 0]), K(0xc9772b, 0.26, 0.4, [0, 0.3, 0], [PI, 0, 0]), C(0xfff3d6, 0.07, 0.36, [0, 0.06, 0]), B(0xfff3d6, 0.09, [-0.07, -0.12, 0]), B(0xfff3d6, 0.09, [0.07, -0.12, 0]), B(0xe09a4a, [0.14, 0.2, 0.04], [-0.12, 0.72, 0.3])),
  bacon: () => grp(...[-0.22, 0.22].map((z, j) => grp(...[0, 1, 2, 3, 4].map((i) => grp(X(0xc9353a, [0.26, 0.06, 0.3], [-0.5 + i * 0.25, i % 2 ? 0.08 : 0, z], [0, 0, i % 2 ? -0.35 : 0.35]), X(0xfbe3d0, [0.26, 0.065, 0.08], [-0.5 + i * 0.25, i % 2 ? 0.085 : 0.005, z + 0.02], [0, 0, i % 2 ? -0.35 : 0.35])))))),
  chickenbreast: () => grp(B(0xf7c9b0, [0.5, 0.2, 0.36], [0, 0.2, 0]), B(0xf7c9b0, [0.26, 0.16, 0.24], [0.4, 0.17, 0.04]), B(0xfbdccb, [0.26, 0.06, 0.16], [-0.1, 0.36, 0.06])),
  porkchop: () => grp(B(0xf2a0a0, [0.46, 0.14, 0.38], [0, 0.14, 0]), R(0xfff3e6, 0.4, 0.07, [0.02, 0.14, 0], [PI / 2, 0, 0], PI * 1.2), C(0xfff3d6, 0.07, 0.5, [-0.5, 0.14, 0.1], [PI / 2, 0, 0.5]), B(0xfff3d6, 0.1, [-0.62, 0.14, 0.32]), B(0xf7b7b7, [0.2, 0.03, 0.14], [0.1, 0.27, 0])),
  groundbeef: () => grp(X(0xfdf8ee, [1.0, 0.1, 0.7], [0, 0.05, 0]), ...[[-0.25, 0.18, 0.1], [0, 0.2, -0.1], [0.25, 0.18, 0.1], [-0.1, 0.3, 0], [0.14, 0.3, -0.04], [0.02, 0.2, 0.2], [-0.3, 0.17, -0.14], [0.3, 0.17, -0.16]].map((p, i) => B(i % 2 ? 0xb04040 : 0xc9504a, 0.17, p)), ...[[-0.2, 0.36, 0.1], [0.2, 0.34, 0.05], [0, 0.42, -0.05]].map((p) => B(0xf7d6c8, 0.04, p))),
  ribeye: () => grp(B(0xc9353a, [0.54, 0.12, 0.4], [0, 0.12, 0]), R(0xfff3e6, 0.44, 0.06, [0, 0.12, 0], [PI / 2, 0, 0.3], PI * 1.1), X(0xfbe3d0, [0.36, 0.03, 0.05], [-0.05, 0.235, 0.05], [0, 0.5, 0]), X(0xfbe3d0, [0.24, 0.03, 0.04], [0.14, 0.235, -0.12], [0, -0.4, 0]), X(0xfbe3d0, [0.16, 0.03, 0.04], [-0.22, 0.23, -0.14], [0, 0.9, 0])),
  ribs: () => grp(X(0xa8452e, [1.0, 0.24, 0.6], [0, 0.16, 0]), ...[-0.36, -0.12, 0.12, 0.36].flatMap((x) => [C(0xfff3d6, 0.045, 0.84, [x, 0.14, 0], [PI / 2, 0, 0]), X(0x8a3423, [0.05, 0.25, 0.6], [x + 0.12, 0.16, 0])]), B(0xc96a3a, [0.42, 0.04, 0.2], [0, 0.28, 0])),
  cornishhen: () => grp(B(0xd98a3a, [0.46, 0.36, 0.4], [0, 0.36, 0]), B(0xd98a3a, [0.2, 0.2, 0.2], [0.34, 0.42, 0.26]), B(0xd98a3a, [0.2, 0.2, 0.2], [0.34, 0.42, -0.26]), C(0xfff3d6, 0.045, 0.24, [0.56, 0.5, 0.3], [0, 0, -1]), C(0xfff3d6, 0.045, 0.24, [0.56, 0.5, -0.3], [0, 0, -1]),
    B(0xc9772b, [0.16, 0.08, 0.26], [-0.2, 0.5, 0.3]), B(0xc9772b, [0.16, 0.08, 0.26], [-0.2, 0.5, -0.3]), B(0xf0b060, [0.2, 0.05, 0.16], [-0.05, 0.7, 0]), C(0xfdf8ee, 0.62, 0.06, [0, 0.03, 0])),
  porkbelly: () => grp(X(0xf2a0a0, [1.0, 0.16, 0.56], [0, 0.08, 0]), X(0xfff3e6, [1.0, 0.1, 0.56], [0, 0.2, 0]), X(0xe88080, [1.0, 0.12, 0.56], [0, 0.3, 0]), X(0xfff3e6, [1.0, 0.07, 0.56], [0, 0.39, 0]), X(0xb9692e, [1.0, 0.1, 0.56], [0, 0.46, 0]), ...[-0.3, 0, 0.3].map((x) => X(0x8a4a1e, [0.04, 0.11, 0.56], [x, 0.47, 0]))),
  brisket: () => grp(B(0x5a2e1e, [0.56, 0.26, 0.36], [0, 0.26, 0]), X(0x6b3423, [0.2, 0.42, 0.62], [0.42, 0.24, 0], [0, 0, 0.15]), X(0xd9665a, [0.03, 0.3, 0.5], [0.535, 0.25, 0], [0, 0, 0.15]), X(0xf2a59a, [0.035, 0.16, 0.34], [0.54, 0.25, 0], [0, 0, 0.15]), ...[[-0.2, 0.5, 0.1], [0.05, 0.52, -0.1], [-0.3, 0.46, -0.12]].map((p) => B(0x2b1b12, 0.04, p))),
  filet: () => grp(C(0xc9353a, 0.4, 0.44, [0, 0.22, 0]), C(0xe86a5a, 0.34, 0.03, [0, 0.445, 0]), C(0x8a3423, 0.42, 0.2, [0, 0.2, 0]), X(0xfbe3d0, [0.86, 0.05, 0.03], [0, 0.26, 0.4]), B(0xffe27a, [0.16, 0.06, 0.16], [0.05, 0.5, 0], undefined, 0.3),
    C(0x4caf50, 0.02, 0.4, [-0.12, 0.5, 0.12], [PI / 2, 0, 0.6]), ...[0, 1, 2, 3].map((i) => K(0x4caf50, 0.03, 0.14, [-0.22 + i * 0.07, 0.53, 0.2 - i * 0.05], [0.4, 0, 0.6]))),
  // fruit
  apple: () => grp(B(0xe5383b, [0.42, 0.4, 0.42], [0, 0.4, 0]), B(0xf06a5a, [0.14, 0.2, 0.03], [-0.16, 0.5, 0.36]), C(0x7a5a34, 0.03, 0.2, [0, 0.84, 0], [0, 0, 0.2]), leaf([0.16, 0.86, 0], [0, 0, 0.4], 0.2)),
  pear: () => grp(B(0xc8d84a, [0.38, 0.36, 0.38], [0, 0.36, 0]), B(0xc8d84a, [0.24, 0.3, 0.24], [0, 0.7, 0]), C(0x7a5a34, 0.03, 0.2, [0, 1.04, 0], [0, 0, 0.2]), leaf([0.14, 1.04, 0], [0, 0, 0.4], 0.18), B(0xdde87a, [0.1, 0.16, 0.03], [-0.14, 0.44, 0.33])),
  banana: () => grp(R(0xffd23f, 0.6, 0.15, [0, 0.62, 0], [0, 0, PI * 1.2], PI * 0.62), R(0xffe27a, 0.6, 0.11, [0, 0.62, 0.07], [0, 0, PI * 1.24], PI * 0.55), B(0x5a3a1e, 0.07, [-0.49, 0.27, 0]), C(0x8a6a2e, 0.06, 0.16, [0.6, 0.6, 0], [0, 0, 0.1])),
  peach: () => grp(B(0xffa66b, 0.4, [-0.05, 0.4, 0]), B(0xff8a70, 0.38, [0.1, 0.4, 0]), B(0xffc49a, [0.12, 0.16, 0.03], [-0.2, 0.52, 0.32]), C(0x7a5a34, 0.03, 0.12, [0, 0.82, 0]), leaf([0.18, 0.8, 0], [0, 0, 0.3], 0.22)),
  orange: () => grp(B(0xff9a1f, 0.42, [0, 0.42, 0]), C(0x4caf50, 0.06, 0.05, [0, 0.84, 0]), leaf([0.14, 0.86, 0], [0, 0, 0.3], 0.18), ...[[0.2, 0.5, 0.33], [-0.15, 0.3, 0.37], [0.05, 0.62, 0.34], [-0.25, 0.55, 0.27]].map((p) => B(0xe8860f, 0.025, p))),
  cherry: () => grp(B(0xd9203a, 0.26, [-0.26, 0.26, 0]), B(0xd9203a, 0.26, [0.26, 0.3, 0]), B(0xf06a7a, [0.07, 0.1, 0.02], [-0.34, 0.36, 0.22]), B(0xf06a7a, [0.07, 0.1, 0.02], [0.18, 0.4, 0.22]), C(0x5aa832, 0.025, 0.66, [-0.13, 0.78, 0], [0, 0, -0.4]), C(0x5aa832, 0.025, 0.62, [0.14, 0.82, 0], [0, 0, 0.4]), leaf([0.14, 1.08, 0], [0, 0, 0.2], 0.24)),
  lemon: () => grp(B(0xffe03a, [0.46, 0.34, 0.34], [0, 0.34, 0]), K(0xffe03a, 0.12, 0.16, [0.48, 0.34, 0], [0, 0, -PI / 2]), K(0xffe03a, 0.1, 0.12, [-0.48, 0.34, 0], [0, 0, PI / 2]), leaf([-0.3, 0.64, 0], [0, 0, -0.5], 0.2), B(0xfff3a6, [0.14, 0.1, 0.03], [-0.1, 0.46, 0.29])),
  avocado: () => grp(B(0x3f6b2e, [0.36, 0.34, 0.2], [0, 0.34, -0.03]), B(0x3f6b2e, [0.24, 0.3, 0.18], [0, 0.66, -0.03]), B(0xc8d86a, [0.31, 0.3, 0.12], [0, 0.34, 0.05]), B(0xc8d86a, [0.2, 0.26, 0.1], [0, 0.66, 0.05]), B(0x8a5a2b, 0.17, [0, 0.32, 0.12])),
  mango: () => grp(B(0xffb52e, [0.46, 0.36, 0.32], [0, 0.36, 0], [0, 0, 0.25]), B(0xf0503a, [0.3, 0.3, 0.3], [0.2, 0.46, -0.02], [0, 0, 0.25]), B(0x8ccf3f, [0.2, 0.2, 0.26], [-0.3, 0.26, 0]), C(0x7a5a34, 0.03, 0.1, [0.2, 0.78, 0]), leaf([0.36, 0.8, 0], [0, 0, 0.2], 0.2)),
  passionfruit: () => grp(B(0x6b2d8e, 0.38, [-0.2, 0.38, 0]), half(0x6b2d8e, 0.36, 0.3, [0.42, 0.3, 0.1], [0, -PI / 2, 0]), C(0xffd23f, 0.3, 0.04, [0.42, 0.3, 0.26], [PI / 2, 0, 0]), ...[[0.3, 0.3], [0.52, 0.36], [0.42, 0.18], [0.36, 0.44], [0.54, 0.22]].map(([x, y]) => B(0x2b1b12, 0.035, [x, y, 0.28]))),
  pomegranate: () => grp(B(0xc9203a, 0.42, [0, 0.42, 0]), T(0xc9203a, 0.16, 0.1, 0.16, [0, 0.88, 0]), ...[0, 1, 2, 3, 4].map((i) => K(0xa81830, 0.05, 0.12, [Math.cos(i * 1.26) * 0.13, 1.0, Math.sin(i * 1.26) * 0.13])), B(0xe85a6a, [0.12, 0.18, 0.03], [-0.16, 0.54, 0.36])),
  forbidden: () => grp(B(0xffc928, [0.42, 0.4, 0.42], [0, 0.42, 0], undefined, 0.5), B(0xfff3a6, [0.12, 0.18, 0.03], [-0.18, 0.54, 0.36], undefined, 0.8), C(0x7a5a34, 0.03, 0.2, [0, 0.86, 0]), leaf([0.16, 0.88, 0], [0, 0, 0.4], 0.2),
    R(0x2e9e4a, 0.46, 0.07, [0, 0.3, 0], [PI / 2 - 0.3, 0, 0]), R(0x2e9e4a, 0.4, 0.07, [0, 0.56, 0], [PI / 2 + 0.25, 0, 0], PI * 1.3), B(0x2e9e4a, [0.12, 0.09, 0.14], [0.38, 0.74, 0.16]), B(0xe5383b, 0.025, [0.44, 0.76, 0.26]), B(0xffe27a, 0.025, [0.34, 0.78, 0.27])),
  // fish
  catfish: () => fish(0x7a8088, 0xd9d4c8, 0x5b6068, 1, [C(0x3a3a44, 0.012, 0.3, [0.66, 0.02, 0.1], [0, 0, -1.1]), C(0x3a3a44, 0.012, 0.3, [0.66, -0.06, 0.1], [0, 0, -1.9]), C(0x3a3a44, 0.012, 0.24, [0.62, 0.1, 0.1], [0, 0, -0.6])]),
  perch: () => fish(0xb7c43a, 0xfff3d6, 0xf5861f, 0.95, [-0.25, -0.05, 0.15].map((x) => X(0x4a5a1e, [0.06, 0.4, 0.3], [x, 0.05, 0]))),
  trout: () => fish(0xc9a0a8, 0xf3e6e0, 0xb86a7a, 1.05, [X(0xe86a8a, [0.9, 0.06, 0.34], [0, 0, 0]), ...[[-0.3, 0.14], [-0.1, 0.18], [0.12, 0.16], [0, 0.08], [-0.2, 0.04]].map(([x, y]) => B(0x3a3a44, 0.03, [x, y, 0.15]))]),
  sturgeon: () => fish(0x4a5560, 0xc9ced6, 0x39424c, 1.25, [K(0x4a5560, 0.12, 0.44, [0.92, 0, 0], [0, 0, -PI / 2]), ...[-0.5, -0.3, -0.1, 0.1, 0.3, 0.5].map((x) => K(0xb9c0c9, 0.05, 0.1, [x, 0.3, 0]))]),
  // honey
  honey: () => honeyJar(0xf5a623, 0.3), madhoney: () => honeyJar(0xb04dff, 0.9),
  // wine
  merlot: () => wine(0x2e5a3a, 0xfff3d6, 0xc9353a), pinotgrigio: () => wine(0xd8e8a0, 0xffffff, 0xc9ced6), rose: () => wine(0xff9eb8, 0xffffff, 0xff6f9a), pinotnoir: () => wine(0x2b3a2e, 0x7a1f3a, 0x7a1f3a),
  cabernet: () => wine(0x24302a, 0x2b2b33, 0xffd23f, { crest: 0xffd23f }), malbec: () => wine(0x3a2452, 0x9b5de5, 0x9b5de5), shiraz: () => wine(0x2b3a2e, 0xf5861f, 0x2b2b33, { band: 0xf5861f }),
  riesling: () => wine(0x6fae5a, 0x3fa9f5, 0xffd23f, { tall: 1.25, fat: 0.82 }), rioja: () => wine(0x2b3a2e, 0xc9353a, 0xffd23f, { net: true }), chianti: () => wine(0x3f6b2e, 0xfff3d6, 0xc9353a, { basket: true }),
  bordeaux: () => wine(0x1f2a24, 0xfff3d6, 0xa8281e, { crest: 0xffd23f, bigFoil: true, band: 0xffd23f }), champagne: () => wine(0x3f7a3a, 0xffd23f, 0xffd23f, { fat: 1.15, bigFoil: true, cork: true, glow: 0.35 }),
  domperignon: () => wine(0x15181c, 0xffc928, 0xffc928, { fat: 1.15, bigFoil: true, cork: true, crest: 0xfff3a6, glow: 0.7, band: 0xffc928 }),
  // mushrooms
  button: () => shroom(0xfdf8ee, 0xfdf8ee, { r: 0.36, flat: 0.75, stemH: 0.34, stemR: 0.16 }),
  cremini: () => shroom(0xa9794a, 0xf3e6cf, { r: 0.38, flat: 0.75, stemH: 0.36, stemR: 0.16 }),
  portobello: () => shroom(0x7a5a3a, 0xf3e6cf, { r: 0.6, flat: 0.36, stemH: 0.34, stemR: 0.15, gill: 0x5a3a2a }),
  oyster: () => grp(...[[0, 0.2, 0, 0.5], [-0.3, 0.45, 0.05, 0.42], [0.28, 0.62, -0.02, 0.4], [0, 0.85, 0.04, 0.3]].flatMap(([x, y, z, r]) => [B(0xc9c4b8, [r, r * 0.22, r * 0.8], [x, y, z + 0.1], [0.5, 0, 0]), B(0xf3efe6, [r * 0.85, r * 0.16, r * 0.7], [x, y - 0.05, z + 0.12], [0.5, 0, 0])]), T(0xf3efe6, 0.14, 0.2, 0.9, [0, 0.4, -0.22])),
  shiitake: () => shroom(0x6b4425, 0xe9d9b8, { r: 0.5, flat: 0.5, stemH: 0.4, stemR: 0.11, spots: [[0, 0.9], [1.2, 0.5], [2.5, 0.6], [3.8, 0.5], [5.1, 0.6], [0.6, 0.2], [3.1, 0.2]], spotC: 0xf3e6cf, spotR: 0.05 }),
  chanterelle: () => grp(T(0xffa62e, 0.5, 0.12, 0.6, [0, 0.55, 0]), T(0xf59a1f, 0.12, 0.1, 0.3, [0, 0.15, 0]), R(0xffb84a, 0.48, 0.07, [0, 0.85, 0], [PI / 2, 0, 0]), C(0xffc86a, 0.42, 0.03, [0, 0.84, 0]), ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => X(0xe88a1a, [0.02, 0.5, 0.05], [Math.cos(i * 0.785) * 0.28, 0.56, Math.sin(i * 0.785) * 0.28], [Math.sin(i * 0.785) * 0.55, 0, -Math.cos(i * 0.785) * 0.55]))),
  porcini: () => shroom(0x9a5a2a, 0xf3e6cf, { r: 0.46, flat: 0.62, stemH: 0.5, stemR: 0.26 }),
  lionsmane: () => grp(B(0xfffaf0, 0.4, [0, 0.5, 0]), ...Array.from({ length: 26 }, (_, i) => { const a = i * 2.4, e = -0.5 + (i / 26) * 1.6; return K(0xf3e6cf, 0.05, 0.3, [Math.cos(a) * Math.cos(e) * 0.4, 0.5 + Math.sin(e) * 0.36 - 0.12, Math.sin(a) * Math.cos(e) * 0.4], [PI, 0, 0]); }), C(0x8a5a2b, 0.2, 0.12, [0, 0.03, 0])),
  morel: () => grp(T(0xf3e6cf, 0.13, 0.17, 0.4, [0, 0.2, 0]), B(0xb98a55, [0.28, 0.46, 0.28], [0, 0.78, 0]), ...Array.from({ length: 18 }, (_, i) => { const a = i * 2.1, y = -0.34 + (i / 18) * 0.7, r = 0.27 * Math.sqrt(Math.max(0.05, 1 - (y * y) / 0.21)); return B(0x7a5a34, 0.05, [Math.cos(a) * r, 0.78 + y, Math.sin(a) * r]); })),
  blacktruffle: () => lump(0x2b2b33, 0x4a4a55), whitetruffle: () => lump(0xe9d6a8, 0xc9b078),
  goldenteacher: () => shroom(0xffc928, 0xfff3d6, { r: 0.42, flat: 0.5, stemH: 0.75, stemR: 0.07, tip: true, glow: 0.55, gill: 0x8a5a9a }),
  bluemeanies: () => grp(...[[-0.26, 0, 0.8, 0.2], [0.04, 0.05, 1.0, 0], [0.3, -0.03, 0.7, -0.25]].map(([x, z, s, tilt]) => at(shroom(0x4a8fe5, 0xbfd8ff, { r: 0.24, flat: 0.7, stemH: 0.7, stemR: 0.05, tip: true, glow: 0.6, gill: 0x2a3a7a }), [x, 0, z], [0, 0, tilt], s))),
  // upgrades & misc symbols
  combine_std: () => tractor(0xe5383b), combine_turbo: () => tractor(0x2f8fe5), combine_mega: () => tractor(0xf5c542, 0.4),
  machine: () => grp(X(0x6ec6f0, [0.9, 0.7, 0.7], [0, 0.35, 0]), X(0xfdf8ee, [0.94, 0.08, 0.74], [0, 0.72, 0]), C(0xffffff, 0.2, 0.34, [-0.18, 0.92, 0]), B(0xdfe6ee, 0.2, [-0.18, 1.1, 0]), X(0x26303d, [0.4, 0.4, 0.04], [0.14, 0.32, 0.36]), ...[0xff5a5f, 0xffd23f, 0x5ad36b].map((c, i) => B(c, 0.05, [-0.3 + i * 0.13, 0.56, 0.36], undefined, 0.6))),
  machine4000: () => grp(X(0x9b5de5, [0.9, 0.6, 0.7], [0, 0.3, 0]), X(0xffd23f, [0.94, 0.08, 0.74], [0, 0.62, 0], undefined, 0.3), at(DEF.cheesewedge(), [0, 0.66, 0], null, 0.62), C(0xffd23f, 0.02, 0.4, [0.34, 0.86, 0.2]), B(0xff5a5f, 0.06, [0.34, 1.08, 0.2], undefined, 0.8)),
  cheesewedge: () => { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0.5, 0.5); s.closePath(); const w = flat(s, 0.5, 0xffc93a); return grp(at(w, [0, 0.28, 0]), B(0xe8a41a, 0.06, [0.25, 0.25, 0.29]), B(0xe8a41a, 0.08, [0.05, 0.14, 0.29]), B(0xe8a41a, 0.05, [0.36, 0.42, 0.29]), B(0xe8a41a, 0.05, [-0.22, 0.1, 0.29])); },
  nest: () => grp(T(0xe8c56a, 0.5, 0.36, 0.26, [0, 0.13, 0]), R(0xd9b24f, 0.44, 0.1, [0, 0.26, 0], [PI / 2, 0, 0]), at(egg('egg'), [0, 0.4, 0], null, 0.75)),
  pillow: () => grp(T(0xe8c56a, 0.5, 0.36, 0.2, [0, 0.1, 0]), X(0xff9ec4, [0.84, 0.28, 0.64], [0, 0.34, 0]), B(0xffffff, 0.05, [0, 0.49, 0]), ...[[-0.4, -0.3], [0.4, -0.3], [-0.4, 0.3], [0.4, 0.3]].map(([x, z]) => B(0xffc2da, 0.07, [x, 0.34, z]))),
  cleaver: () => grp(X(0xc9ced6, [0.62, 0.5, 0.05], [0.12, 0.6, 0]), X(0xeef2f6, [0.62, 0.08, 0.055], [0.12, 0.38, 0]), B(0x8d99ae, 0.05, [0.34, 0.76, 0.03]), C(0x8a5a2b, 0.07, 0.46, [-0.4, 0.74, 0], [0, 0, PI / 2])),
  halal: () => grp(at(crescent(0x1f9d55, 0.25), [0, 0.5, 0], null, 0.5), at(star(5, 0xffd23f, 0.5), [0.2, 0.52, 0.02], null, 0.16)),
  kosher: () => at(star(6, 0x2563c9, 0.25, 0.58), [0, 0.5, 0], null, 0.5),
  wind: () => grp(R(0xffffff, 0.34, 0.07, [-0.15, 0.62, 0], [0, 0, 0.4], PI * 1.5), R(0xe6f4ff, 0.22, 0.06, [0.38, 0.34, 0], [0, 0, 2.6], PI * 1.4), C(0xffffff, 0.07, 0.6, [-0.42, 0.3, 0], [0, 0, PI / 2]), C(0xe6f4ff, 0.06, 0.4, [0.1, 0.1, 0], [0, 0, PI / 2]), leaf([0.6, 0.72, 0], [0, 0, 0.5], 0.14)),
  quake: () => grp(X(0x8a5a2b, [0.52, 0.2, 0.7], [-0.3, 0.1, 0], [0, 0, 0.12]), X(0x8a5a2b, [0.52, 0.2, 0.7], [0.3, 0.14, 0], [0, 0, -0.16]), X(0x7cc653, [0.52, 0.07, 0.7], [-0.3, 0.22, 0], [0, 0, 0.12]), X(0x7cc653, [0.52, 0.07, 0.7], [0.3, 0.26, 0], [0, 0, -0.16]),
    at(star(4, 0xffd23f, 0.7, 0.3), [0, 0.6, 0], null, 0.24), B(0xb9b4ad, 0.09, [-0.1, 0.5, 0.2]), B(0xb9b4ad, 0.07, [0.2, 0.7, -0.1]), B(0xb9b4ad, 0.06, [-0.3, 0.72, 0])),
  puff: () => grp(B(0xdfe4ea, 0.3, [-0.22, 0.3, 0]), B(0xeef2f6, 0.36, [0.1, 0.38, 0]), B(0xdfe4ea, 0.24, [0.42, 0.26, 0]), B(0xeef2f6, 0.2, [-0.05, 0.62, 0])),
  brokenegg: () => grp(B(0xffffff, [0.5, 0.06, 0.4], [0, 0.06, 0]), B(0xffffff, [0.26, 0.05, 0.24], [0.36, 0.05, 0.2]), B(0xffc928, [0.18, 0.12, 0.18], [-0.04, 0.12, 0]), at(half(0xfffaf0, 0.24, 0.3, [0, 0, 0], [0, 0, PI / 2]), [-0.46, 0.2, -0.2], [0.4, 0.6, 0.3])),
  drop: () => grp(B(0x9b2d5a, [0.3, 0.3, 0.3], [0, 0.3, 0]), K(0x9b2d5a, 0.25, 0.46, [0, 0.66, 0]), B(0xd96a9a, [0.07, 0.1, 0.03], [-0.12, 0.36, 0.26])),
  leaf: () => leaf([0, 0, 0], [0, 0, 0], 0.5, 0x6cc24a),
  moon: () => crescent(0xffd23f, 0.4),
  star: () => star(5, 0xffd23f, 0.9),
  trophy: () => grp(T(0xffc928, 0.36, 0.2, 0.44, [0, 0.72, 0]), C(0xffc928, 0.06, 0.2, [0, 0.42, 0]), C(0xffc928, 0.22, 0.08, [0, 0.3, 0]), X(0x7a5a34, [0.5, 0.2, 0.36], [0, 0.14, 0]), R(0xffc928, 0.16, 0.04, [-0.38, 0.76, 0], [0, 0, 0]), R(0xffc928, 0.16, 0.04, [0.38, 0.76, 0], [0, 0, 0])),
  book: () => grp(X(0xc9353a, [0.5, 0.74, 0.14], [-0.27, 0.4, 0], [0, 0.25, 0]), X(0xc9353a, [0.5, 0.74, 0.14], [0.27, 0.4, 0], [0, -0.25, 0]), X(0xfffaf0, [0.44, 0.66, 0.1], [-0.25, 0.42, 0.05], [0, 0.25, 0]), X(0xfffaf0, [0.44, 0.66, 0.1], [0.25, 0.42, 0.05], [0, -0.25, 0]), at(star(5, 0xffd23f, 0.5), [0.26, 0.44, 0.13], [0, -0.25, 0], 0.13)),
  lock: () => grp(X(0x8d99ae, [0.66, 0.5, 0.26], [0, 0.26, 0]), R(0x6b7686, 0.22, 0.06, [0, 0.52, 0], [0, 0, 0], PI), B(0x39424c, 0.07, [0, 0.3, 0.14])),
};
const COMBO = { bacon_eggs: ['bacon', 'egg'], steak_frites: ['ribeye', 'potato'], guacamole: ['avocado', 'chilli'], cheeseburger: ['groundbeef', 'cheesewedge'], banana_split: ['banana', 'cherry'], honey_ham: ['honey', 'porkchop'],
  wine_cheese: ['merlot', 'cheesewedge'], surf_turf: ['sturgeon', 'ribeye'], truffle_omelette: ['blacktruffle', 'egg'], fish_chips: ['perch', 'potato'], mad_tea: ['madhoney', 'goldenteacher'] };

const norm = new Map();
function raw(key) {
  if (COMBO[key]) { const [a, b] = COMBO[key]; return grp(at(model(a), [-0.36, 0, -0.1]), at(model(b), [0.36, -0.08, 0.2], null, 0.85)); }
  const k = DEF[key] ? key : key.startsWith('mad_') ? 'madhoney' : key.startsWith('honey_') ? 'honey' : 'puff';
  return DEF[k]();
}

// A model normalised to fit a unit cube, centred on its origin, scaled by `size`.
export function model(key, size = 1) {
  const inner = raw(key);
  if (!norm.has(key)) {
    const box = new THREE.Box3().setFromObject(inner), s = new THREE.Vector3(), c = new THREE.Vector3();
    box.getSize(s); box.getCenter(c);
    norm.set(key, { k: 1 / Math.max(s.x, s.y, s.z), c });
  }
  const { k, c } = norm.get(key);
  inner.position.sub(c.clone());
  const fit = new THREE.Group();
  fit.add(inner);
  fit.scale.setScalar(k);
  const outer = new THREE.Group();
  outer.add(fit);
  outer.scale.setScalar(size);
  if (inner.userData.r) outer.userData.r = inner.userData.r * k * size;
  return outer;
}
export const eggModel = egg;
export const MODEL_KEYS = [...Object.keys(DEF), ...Object.keys(COMBO)];

// ---------- 2D symbols rendered from the models ----------
const ICONS = new Map();
export function buildIcons(px = 128) {
  const canvas = document.createElement('canvas');
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setSize(px, px, false);
  r.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c8a0, 1.5));
  const key = new THREE.DirectionalLight(0xfff1d6, 2.2);
  key.position.set(-2, 3, 2.5);
  scene.add(key);
  const cam = new THREE.OrthographicCamera(-0.66, 0.66, 0.66, -0.66, 0.1, 10);
  cam.position.set(0.9, 1.1, 2.4);
  cam.lookAt(0, 0, 0);
  for (const k of MODEL_KEYS) {
    const m = model(k);
    m.rotation.y = k.startsWith('combine') ? -0.5 : 0;
    scene.add(m);
    r.render(scene, cam);
    ICONS.set(k, canvas.toDataURL('image/png'));
    scene.remove(m);
  }
  r.dispose();
  r.forceContextLoss?.();
}
export const iconUrl = (key) => ICONS.get(key) || ICONS.get(key.startsWith('mad_') ? 'madhoney' : key.startsWith('honey_') ? 'honey' : 'puff');
export const icon = (key, cls = '') => `<img class="ic ${cls}" src="${iconUrl(key)}" alt="" draggable="false">`;
