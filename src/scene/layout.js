// Where everything sits on the island. The farmhouse is at the origin; the five
// core areas ring it, the four specials (and the barnyard) sit further out.
const ring = (r, deg) => [+(r * Math.cos((deg * Math.PI) / 180)).toFixed(2), +(r * Math.sin((deg * Math.PI) / 180)).toFixed(2)];

export const SECTOR_POS = {
  crops: ring(21, 45), poultry: ring(20, 119), dairy: ring(20.5, 190), orchard: ring(21, 262), slaughter: ring(20, 332),
  fishery: ring(36.5, 82), apiary: ring(35.5, 154), vineyard: ring(37, 225), mycology: ring(36.5, 298),
};
export const SECTOR_ANGLE = { crops: 45, poultry: 119, dairy: 190, orchard: 262, slaughter: 332, fishery: 82, apiary: 154, vineyard: 225, mycology: 298 };
export const BARN_POS = ring(35, 12);
export const BARN_ANGLE = 12;

// Farmers idle in the farmhouse yard; `yardSpot` is in world coords, `gate` is
// the first waypoint on the way out toward a sector.
export const yardSpot = (deg, r) => ring(r, deg);
export const gate = (id) => ring(9.5, SECTOR_ANGLE[id]);
export { ring };
