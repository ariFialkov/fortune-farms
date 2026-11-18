// Prize tables and sector definitions.
// Every prize value `v` is a multiple of the BASE BET (before upgrade multipliers).
// `w` is the relative weight inside the sector's "premium" table. The engine
// solves the hit-rate so each sector returns exactly RTP on its stake.

export const RTP = 0.96;
export const BETS = [5, 10, 25, 50, 100, 200, 500, 1000, 2500, 5000];
export const DEFAULT_BET = 100;
export const START_BALANCE = 100000;

// four value tiers: 0 common, 1 fine, 2 rare, 3 legendary
export const tierOf = (v) => (v >= 50 ? 3 : v >= 5 ? 2 : v >= 0.5 ? 1 : 0);
export const TIER_NAMES = ['Common', 'Fine', 'Rare', 'Legendary'];
// `icon` is the key of the prize's 3D model / symbol (defaults to its id)
const P = (id, name, v, w, extra = {}) => ({ id, name, icon: id, v, w, tier: tierOf(v), ...extra });

// Low-value crops are deliberately common so the field pays out constantly while it is mown.
const CROPS = [
  P('wheat', 'Wheat', 0.01, 600),
  P('corn', 'Corn', 0.02, 380),
  P('carrot', 'Carrot', 0.03, 240),
  P('potato', 'Potato', 0.04, 150),
  P('cabbage', 'Cabbage', 0.05, 95),
  P('onion', 'Onion', 0.06, 62),
  P('radish', 'Radish', 0.08, 40),
  P('strawberry', 'Strawberry', 0.1, 26),
  P('chilli', 'Chilli Pepper', 0.15, 16),
  P('pumpkin', 'Pumpkin', 0.25, 9),
  P('sugarbeet', 'Sugar Beet', 0.4, 5),
  P('watermelon', 'Watermelon', 0.75, 2.6),
  P('ginger', 'Ginger', 1.5, 1.1),
  P('lavender', 'Lavender', 5, 0.38),
  P('wasabi', 'Wasabi', 15, 0.1),
  P('saffron', 'Saffron', 100, 0.016),
];

const MILK = P('milk', 'Milk', 0.04, 0);
const MILKS = [
  P('goatmilk', 'Goat Milk', 0.08, 100),
  P('sheepmilk', 'Sheep Milk', 0.12, 60),
  P('buffalomilk', 'Buffalo Milk', 0.2, 35),
  P('yakmilk', 'Yak Milk', 0.4, 15),
  P('chocmilk', 'Chocolate Milk', 0.8, 6),
];
const DAIRY_PRODUCTS = [
  P('butter', 'Butter', 1.2, 8, { product: true }),
  P('cream', 'Cream', 2, 5, { product: true }),
  P('goatcheese', 'Goat Cheese', 3, 3, { product: true }),
  P('feta', 'Feta Cheese', 5, 1.5, { product: true }),
  P('mozzarella', 'Mozzarella', 10, 0.6, { product: true }),
  P('yaktea', 'Yak Butter Tea', 50, 0.1, { product: true }),
];

const EGG = P('egg', 'Egg', 0.05, 250);
const FANCY_EGGS = [
  P('quailegg', 'Quail Egg', 0.1, 60),
  P('duckegg', 'Duck Egg', 0.2, 30),
  P('ostrichegg', 'Ostrich Egg', 0.5, 12),
  P('easteregg', 'Easter Egg', 1.5, 4),
  P('faberge', 'Fabergé Egg', 10, 0.5),
  P('goldenegg', 'Golden Egg', 100, 0.04),
];

const DRUMSTICK = P('drumstick', 'Chicken Drumstick', 0.04, 0);
const MEATS = [
  P('bacon', 'Bacon Strips', 0.08, 100),
  P('chickenbreast', 'Chicken Breast', 0.12, 70),
  P('porkchop', 'Pork Chop', 0.2, 45),
  P('groundbeef', 'Ground Beef', 0.3, 30),
  P('ribeye', 'Ribeye', 0.6, 15),
  P('ribs', 'Baby Back Ribs', 1, 8),
  P('cornishhen', 'Cornish Hen', 2, 4),
  P('porkbelly', 'Pork Belly', 4, 2),
  P('brisket', 'Beef Brisket', 10, 0.7),
  P('filet', 'Filet Mignon', 40, 0.12),
];

const FRUITS = [
  P('apple', 'Apple', 0.1, 100),
  P('pear', 'Pear', 0.15, 80),
  P('banana', 'Banana', 0.2, 65),
  P('peach', 'Peach', 0.3, 50),
  P('orange', 'Orange', 0.4, 40),
  P('cherry', 'Cherry', 0.6, 28),
  P('lemon', 'Lemon', 0.8, 20),
  P('avocado', 'Avocado', 1.2, 13),
  P('mango', 'Mango', 2, 8),
  P('passionfruit', 'Passionfruit', 5, 3),
  P('pomegranate', 'Pomegranate', 15, 0.8),
  P('forbidden', 'Forbidden Fruit', 200, 0.03),
];

const FISH = [
  P('catfish', 'Catfish', 0.01, 1),
  P('perch', 'Perch', 0.03, 1),
  P('trout', 'Trout', 0.08, 1),
  P('sturgeon', 'Sturgeon', 1, 1),
];

const HONEY_PER_L = 0.5;
const MAD_PER_L = 5;
// Honey pours a random amount inside a band [lo, hi] litres; the table entry carries the
// band's mean so RTP is solved exactly, and the engine draws the actual litres per round.
const pour = (madHoney, lo, hi, w) => {
  const rate = madHoney ? MAD_PER_L : HONEY_PER_L, mean = (lo + hi) / 2;
  return P(`${madHoney ? 'mad' : 'honey'}_${lo}`, madHoney ? 'Mad Honey' : 'Honey', mean * rate, w,
    { litres: mean, range: [lo, hi], rate, vmax: hi * rate, mad: madHoney, icon: madHoney ? 'madhoney' : 'honey' });
};
const HONEY_TRICKLE = pour(false, 0.08, 0.3, 0);
const HONEYS = [
  pour(false, 0.3, 0.99, 15), pour(false, 1, 1.5, 30), pour(false, 1.5, 2.3, 22), pour(false, 2.3, 3.4, 16), pour(false, 3.4, 4.8, 10), pour(false, 4.8, 6.6, 6), pour(false, 6.6, 8.5, 3), pour(false, 8.5, 10, 1),
  pour(true, 0.3, 0.99, 1.2), pour(true, 1, 1.7, 0.8), pour(true, 1.7, 3, 0.4), pour(true, 3, 5.5, 0.15), pour(true, 5.5, 10, 0.03),
];

const WINES = [
  P('merlot', 'Merlot', 0.1, 100),
  P('pinotgrigio', 'Pinot Grigio', 0.15, 80),
  P('rose', 'Rosé', 0.2, 64),
  P('pinotnoir', 'Pinot Noir', 0.3, 50),
  P('cabernet', 'Cabernet Sauvignon', 0.4, 40),
  P('malbec', 'Malbec', 0.6, 30),
  P('shiraz', 'Shiraz', 0.8, 22),
  P('riesling', 'Riesling', 1.2, 15),
  P('rioja', 'Rioja', 2, 9),
  P('chianti', 'Chianti', 4, 4),
  P('bordeaux', 'Bordeaux', 10, 1.5),
  P('champagne', 'Champagne', 30, 0.4),
  P('domperignon', 'Dom Pérignon', 150, 0.04),
];

const SHROOMS = [
  P('button', 'Button Mushroom', 0.04, 100),
  P('cremini', 'Cremini', 0.06, 80),
  P('portobello', 'Portobello', 0.1, 64),
  P('oyster', 'Oyster Mushroom', 0.15, 50),
  P('shiitake', 'Shiitake', 0.25, 38),
  P('chanterelle', 'Chanterelle', 0.4, 28),
  P('porcini', 'Porcini', 0.6, 20),
  P('lionsmane', "Lion's Mane", 1, 13),
  P('morel', 'Morel', 2, 7),
  P('blacktruffle', 'Black Truffle', 5, 3),
  P('whitetruffle', 'White Truffle', 15, 1),
  P('goldenteacher', 'Golden Teacher', 50, 0.2),
  P('bluemeanies', 'Blue Meanies', 150, 0.04),
];

// A sector model is a list of independent slot groups. Each slot in a group is
// an i.i.d. draw: `filler` (null = nothing) with prob 1-q, else a draw from `table`.
// stake = stake multiplier on the base bet; valueMult scales every prize value.
export const SECTORS = {
  crops: {
    id: 'crops', name: 'Crops', icon: 'wheat', core: true, blurb: 'The combine plows the field for buried bounty.',
    upgrades: [
      { id: 'std', name: 'Old Reliable', icon: 'combine_std', stake: 1, desc: 'Standard combine' },
      { id: 'turbo', name: 'Turbo Combine', icon: 'combine_turbo', stake: 2, desc: 'Every crop worth ×2' },
      { id: 'mega', name: 'Golden Harvester', icon: 'combine_mega', stake: 4, desc: 'Every crop worth ×4' },
    ],
    model: (u) => ({ valueMult: u.stake, groups: [{ n: 36, filler: null, table: CROPS }] }),
  },
  dairy: {
    id: 'dairy', name: 'Dairy', icon: 'milk', core: true, blurb: 'Cows queue for the Milk-o-matic 3000.',
    upgrades: [
      { id: 'std', name: 'Milk-o-matic 3000', icon: 'machine', stake: 1, desc: 'Straight milks only' },
      { id: 'm4000', name: 'Milk-o-matic 4000', icon: 'machine4000', stake: 2, desc: 'Unlocks butter, cream & cheese' },
    ],
    model: (u) => ({ valueMult: 1, groups: [{ n: 8, filler: MILK, table: u.id === 'm4000' ? [...MILKS, ...DAIRY_PRODUCTS] : MILKS }] }),
    paytable: [MILK, ...MILKS, ...DAIRY_PRODUCTS],
  },
  poultry: {
    id: 'poultry', name: 'Poultry', icon: 'egg', core: true, blurb: 'Hens take turns in the outhouse. Mind the drop!',
    upgrades: [
      { id: 'std', name: 'Bare Nest', icon: 'nest', stake: 1, desc: 'Eggs may break' },
      { id: 'pillow', name: 'Comfy Pillow', icon: 'pillow', stake: 2, desc: 'No egg ever breaks' },
    ],
    model: (u) => ({ valueMult: 1, groups: [u.id === 'pillow' ? { n: 10, filler: EGG, table: FANCY_EGGS } : { n: 10, filler: null, table: [EGG, ...FANCY_EGGS] }] }),
    paytable: [EGG, ...FANCY_EGGS],
  },
  slaughter: {
    id: 'slaughter', name: 'Slaughterhouse', icon: 'ribeye', core: true, blurb: '"Free massages" — step right in.',
    upgrades: [
      { id: 'std', name: 'Standard', icon: 'cleaver', stake: 1, desc: 'Regular cuts' },
      { id: 'halal', name: 'Halal', icon: 'halal', stake: 2, desc: 'Double down: every cut ×2' },
      { id: 'kosher', name: 'Kosher', icon: 'kosher', stake: 3, desc: 'Triple down: every cut ×3' },
    ],
    model: (u) => ({ valueMult: u.stake, groups: [{ n: 8, filler: DRUMSTICK, table: MEATS }] }),
    paytable: [DRUMSTICK, ...MEATS],
  },
  orchard: {
    id: 'orchard', name: 'Orchards', icon: 'apple', core: true, blurb: 'A gust shakes the trees — fruit rains down.',
    upgrades: [
      { id: 'std', name: 'Wind Gust', icon: 'wind', stake: 1, desc: 'A stiff breeze' },
      { id: 'quake', name: 'Earthquake', icon: 'quake', stake: 2, desc: 'Twice the shaking, twice the drops' },
    ],
    model: (u) => ({ valueMult: 1, groups: [{ n: u.id === 'quake' ? 24 : 12, filler: null, table: FRUITS }] }),
  },
  fishery: {
    id: 'fishery', name: 'Fishery', icon: 'trout', core: false, blurb: 'Four nets, one tube, count the haul.',
    model: () => ({
      valueMult: 1,
      groups: [
        { n: 20, share: 0.16 / 0.96, filler: null, table: [FISH[0]] },
        { n: 15, share: 0.2475 / 0.96, filler: null, table: [FISH[1]] },
        { n: 10, share: 0.32 / 0.96, filler: null, table: [FISH[2]] },
        { n: 6, share: 0.2325 / 0.96, filler: null, table: [FISH[3]] },
      ],
    }),
    paytable: FISH,
  },
  apiary: {
    id: 'apiary', name: 'Apiary', icon: 'honey', core: false, blurb: 'Open the spout and watch the scale climb.',
    model: () => ({ valueMult: 1, groups: [{ n: 1, filler: HONEY_TRICKLE, table: HONEYS }] }),
    paytable: [
      P('honey', 'Honey (per litre)', HONEY_PER_L, 0),
      P('madhoney', 'Mad Honey (per litre)', MAD_PER_L, 0),
    ],
  },
  vineyard: {
    id: 'vineyard', name: 'Vineyard', icon: 'merlot', core: false, blurb: 'Stomp the grapes, pop the bottles.',
    model: () => ({ valueMult: 1, groups: [{ n: 6, filler: null, table: WINES }] }),
  },
  mycology: {
    id: 'mycology', name: 'Mycology', icon: 'button', core: false, blurb: 'Truffle pigs sniff out the good stuff.',
    model: () => ({ valueMult: 1, groups: [{ n: 9, filler: null, table: SHROOMS }] }),
  },
};

export const CORE = ['crops', 'dairy', 'poultry', 'slaughter', 'orchard'];
export const SPECIAL = ['fishery', 'apiary', 'vineyard', 'mycology'];
export const ALL = [...CORE, ...SPECIAL];

// Combos: bonus is a multiple of the TOTAL round stake. Each `need` is
// "at least `min` slots in sector (group g) whose prize matches `ids`/`test`".
const need = (sector, ids, min = 1, g = 0) => ({ sector, g, min, test: typeof ids === 'function' ? ids : (p) => ids.includes(p.id) });
const anyPrize = () => true;
const CHEESE = ['goatcheese', 'feta', 'mozzarella'];

export const COMBOS = [
  { id: 'bacon_eggs', name: 'Bacon & Eggs', icon: 'bacon_eggs', bonus: 0.2, desc: '8+ unbroken eggs and 2+ Bacon Strips',
    needs: [need('poultry', anyPrize, 8), need('slaughter', ['bacon'], 2)] },
  { id: 'steak_frites', name: 'Steak Frites', icon: 'steak_frites', bonus: 0.5, desc: 'Ribeye or Filet Mignon with 3+ Potatoes',
    needs: [need('slaughter', ['ribeye', 'filet']), need('crops', ['potato'], 3)] },
  { id: 'guacamole', name: 'Guacamole', icon: 'guacamole', bonus: 1, desc: 'Avocado, Onion and Chilli Pepper',
    needs: [need('orchard', ['avocado']), need('crops', ['onion']), need('crops', ['chilli'])] },
  { id: 'cheeseburger', name: 'Cheeseburger', icon: 'cheeseburger', bonus: 1, desc: 'Ground Beef and any Cheese (needs Milk-o-matic 4000)',
    needs: [need('slaughter', ['groundbeef']), need('dairy', CHEESE)] },
  { id: 'banana_split', name: 'Banana Split', icon: 'banana_split', bonus: 3, desc: 'Banana, Cherry and Cream (needs Milk-o-matic 4000)',
    needs: [need('orchard', ['banana']), need('orchard', ['cherry']), need('dairy', ['cream'])] },
  { id: 'honey_ham', name: 'Honey-Baked Ham', icon: 'honey_ham', bonus: 0.5, desc: '1+ litre of honey and 2+ Pork Chops or Pork Belly',
    needs: [need('apiary', (p) => p.litres >= 1), need('slaughter', ['porkchop', 'porkbelly'], 2)] },
  { id: 'wine_cheese', name: 'Wine & Cheese', icon: 'wine_cheese', bonus: 0.5, desc: '2+ bottles of wine and any Cheese (needs Milk-o-matic 4000)',
    needs: [need('vineyard', anyPrize, 2), need('dairy', CHEESE)] },
  { id: 'surf_turf', name: 'Surf & Turf', icon: 'surf_turf', bonus: 1, desc: 'A Sturgeon with Ribeye, Brisket or Filet Mignon',
    needs: [need('fishery', anyPrize, 1, 3), need('slaughter', ['ribeye', 'brisket', 'filet'])] },
  { id: 'truffle_omelette', name: 'Truffle Omelette', icon: 'truffle_omelette', bonus: 1.5, desc: 'A Black or White Truffle and 8+ unbroken eggs',
    needs: [need('mycology', ['blacktruffle', 'whitetruffle']), need('poultry', anyPrize, 8)] },
  { id: 'fish_chips', name: 'Fish & Chips', icon: 'fish_chips', bonus: 0.3, desc: '9+ Perch and 3+ Potatoes',
    needs: [need('fishery', anyPrize, 9, 1), need('crops', ['potato'], 3)] },
  { id: 'mad_tea', name: 'Mad Tea Party', icon: 'mad_tea', bonus: 50, desc: 'Mad Honey with Golden Teacher or Blue Meanies',
    needs: [need('apiary', (p) => p.mad), need('mycology', ['goldenteacher', 'bluemeanies'])] },
];
