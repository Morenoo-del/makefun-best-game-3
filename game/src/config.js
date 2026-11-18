// TIDEWARDEN — balance, tower and enemy definitions.
// Every number the game tunes lives here so a single read shows the whole
// economy: costs, damage, ranges, wave pacing and the night-10 boss.

export const VIEW_W = 1280;
export const VIEW_H = 720;

// The march the creatures take from the sea (left) to the lighthouse (right).
// The whole path stays on the beach (x >= 340, y 230-680): the sky above
// y=210 and the sea left of x=340 are never walked on.
export const PATH_POINTS = [
  [340, 280], [580, 280], [580, 450], [880, 450],
  [880, 630], [1080, 630], [1130, 540],
];

export const LIGHTHOUSE = { x: 1156, y: 492, r: 34 };

// Build pads: circles of sand the player may build on. None sits on the
// path, and none sits in the sky or the sea.
export const BUILD_PADS = [
  { x: 430, y: 380 }, { x: 700, y: 330 }, { x: 700, y: 560 },
  { x: 980, y: 340 }, { x: 980, y: 540 }, { x: 1140, y: 330 },
  { x: 1140, y: 640 }, { x: 420, y: 620 }, { x: 560, y: 670 },
  { x: 760, y: 680 }, { x: 1020, y: 250 }, { x: 360, y: 480 },
  { x: 860, y: 250 }, { x: 640, y: 540 },
];

export const TOWN_MAX_HP = 20;
export const START_GOLD = 160;
export const TOTAL_NIGHTS = 10;
export const SELL_RATE = 0.7;
export const DAWN_INTEREST = 0.05; // +5% of banked gold at dawn, capped below
export const DAWN_INTEREST_CAP = 30;

// Towers: id, name, cost, range, damage, fire interval (s), colour, blurb.
export const TOWERS = {
  harpoon: {
    id: 'harpoon', name: 'Harpoon Turret', cost: 50, range: 150,
    damage: 14, rate: 0.45, color: '#ffd166', dark: '#b8860b',
    blurb: 'Fast bolts, single target.',
    upgrades: [
      { cost: 45, damage: 22, rate: 0.38, note: 'Sharpened barbs' },
      { cost: 90, damage: 34, rate: 0.30, shots: 2, note: 'Twin harpoons' },
    ],
  },
  coral: {
    id: 'coral', name: 'Coral Spire', cost: 75, range: 130,
    damage: 6, rate: 0.9, slow: 0.55, slowTime: 1.6, color: '#ff7bac',
    dark: '#a13d63', blurb: 'Chills the tide: slows all it hits.',
    upgrades: [
      { cost: 60, damage: 10, rate: 0.8, slow: 0.45, slowTime: 2.0, note: 'Deep chill' },
      { cost: 110, damage: 16, rate: 0.7, slow: 0.38, slowTime: 2.4, chain: 2, note: 'Frost chain' },
    ],
  },
  tide: {
    id: 'tide', name: 'Tide Cannon', cost: 110, range: 175,
    damage: 34, rate: 1.5, splash: 62, color: '#4cc9f0', dark: '#1d6f8f',
    blurb: 'Lobbed shells, splash damage.',
    upgrades: [
      { cost: 95, damage: 52, rate: 1.35, splash: 78, note: 'Heavy shells' },
      { cost: 160, damage: 84, rate: 1.2, splash: 100, burn: 6, note: 'Burning tide' },
    ],
  },
  moon: {
    id: 'moon', name: 'Moon Lantern', cost: 120, range: 150,
    damage: 0, rate: 0, buff: 1.25, color: '#e0aaff', dark: '#7b2fbe',
    blurb: 'Moonlight: nearby towers hit harder.',
    upgrades: [
      { cost: 100, buff: 1.45, range: 165, note: 'Full moon' },
      { cost: 150, buff: 1.7, range: 185, note: 'Eclipse glow' },
    ],
  },
};

export const TOWER_ORDER = ['harpoon', 'coral', 'tide', 'moon'];

// Enemies: id, name, hp, speed (px/s), bounty, leak damage, radius, colour.
export const ENEMIES = {
  crab: {
    id: 'crab', name: 'Skitter Crab', hp: 42, speed: 66, bounty: 6,
    leak: 1, r: 13, color: '#ff8c42', dark: '#a34d12', slowResist: 0,
  },
  eel: {
    id: 'eel', name: 'Brine Eel', hp: 64, speed: 92, bounty: 9,
    leak: 1, r: 12, color: '#7ef0c1', dark: '#2b7a58', slowResist: 0.2,
  },
  sailor: {
    id: 'sailor', name: 'Drowned Sailor', hp: 190, speed: 42, bounty: 14,
    leak: 2, r: 16, color: '#9db4c0', dark: '#4a6572', slowResist: 0,
  },
  squid: {
    id: 'squid', name: 'Ink Squid', hp: 110, speed: 58, bounty: 12,
    leak: 1, r: 14, color: '#b388ff', dark: '#5e35b1', slowResist: 0,
    splits: 'inkling',
  },
  inkling: {
    id: 'inkling', name: 'Inkling', hp: 26, speed: 84, bounty: 3,
    leak: 1, r: 8, color: '#d1c4e9', dark: '#7e57c2', slowResist: 0,
  },
  wraith: {
    id: 'wraith', name: 'Tide Wraith', hp: 150, speed: 78, bounty: 16,
    leak: 2, r: 15, color: '#80deea', dark: '#00838f', slowResist: 0.7,
  },
  kraken: {
    id: 'kraken', name: 'Dread Kraken', hp: 5200, speed: 30, bounty: 300,
    leak: 5, r: 34, color: '#ef476f', dark: '#8d1f3c', slowResist: 0.4,
    boss: true,
  },
};

// Night pacing: seconds between sub-wave spawns, and the gap before a night.
export const SPAWN_GAP = 0.85;
export const NIGHT_BONUS = (night) => 25 + 6 * night;

export const KEYS = {
  startNight: ' ',
  pause: 'p',
  mute: 'm',
  speed: 'f',
  restart: 'r',
  deselect: 'Escape',
};
