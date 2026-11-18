// Farm layout, in world units. The property is a 100 x 100 square: x runs along
// the road (left -> right), z runs from the back of the farm (-50) to the road (+).
// Each area: centre, optional rotation/scale of its model, and camera framing radius.
export const AREAS = {
  dairy:     { x: -29,   z: 25,    scale: 1,    view: 11 },
  poultry:   { x: -30,   z: 9,     scale: 0.8,  view: 9 },
  slaughter: { x: -28.5, z: -8,    scale: 1,    view: 11 },
  apiary:    { x: -44.5, z: -2,    scale: 1,    view: 12 },
  orchard:   { x: -11,   z: 20.5,  scale: 1,    view: 14.5 },
  crops:     { x: 13.5,  z: 13,    scale: 1,    view: 24.5, rot: Math.PI / 2 },
  fishery:   { x: 39.5,    z: 19,    scale: 1.4,  view: 15 },
  vineyard:  { x: -24,   z: -29,   scale: 1.12, view: 19 },
  mycology:  { x: 15,    z: -31,   scale: 1.3,  view: 14 },
};
export const SECTOR_POS = Object.fromEntries(Object.entries(AREAS).map(([k, a]) => [k, [a.x, a.z]]));

export const PLOT = 50;                       // half-size of the property
export const ROAD = { z0: 37, z1: 45 };       // public road along the front
export const HOUSE = { x: -11, z: -6 };
export const DRIVE = { x0: -2.6, x1: 1.6, z0: 1, z1: ROAD.z0 };   // driveway strip
export const COURT = { x0: -17, x1: 1.6, z0: -1.4, z1: 4.6 };     // gravel forecourt
export const OVERVIEW = { x: 5, z: 1.5 };

// Stone walking paths (world polylines).
export const WALKS = [
  [[-17, 2.2], [-24, 2.2], [-38, 2.2]],                 // forecourt -> poultry / slaughterhouse -> apiary
  [[-20, 2.2], [-20, 14], [-20.4, 27]],                 // -> dairy & orchard
  [[-19.5, 1], [-19.5, -12], [-21, -19.5]],             // -> vineyard
  [[-3, -1.6], [-1, -9], [5, -17], [8, -22]],           // -> mycology woods
  [[1.6, -3], [3, -9.2], [24, -9.2], [26, -2], [27.5, 8]], // behind the field -> fishery
];
