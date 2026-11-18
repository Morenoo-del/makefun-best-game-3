// TIDEWARDEN — the ten nights. Each night is a list of sub-waves; a
// sub-wave is a list of [enemyId, count, hpScale] groups that spawn in
// order, so the pressure rises night by night and the final night ends
// with the Dread Kraken. hpScale multiplies the base HP in config.js.

function wave(groups) { return groups; }

export const NIGHTS = [
  // Night 1 — a gentle first tide: crabs only, learn to build.
  wave([['crab', 6, 1.0], ['crab', 6, 1.0]]),
  // Night 2 — crabs with a few eels mixed in.
  wave([['crab', 8, 1.05], ['eel', 4, 1.0], ['crab', 8, 1.05]]),
  // Night 3 — the first sailors arrive, slow and tough.
  wave([['crab', 8, 1.1], ['eel', 6, 1.0], ['sailor', 3, 1.0], ['crab', 8, 1.1]]),
  // Night 4 — eels lead, crabs follow, sailors anchor the rear.
  wave([['eel', 8, 1.05], ['crab', 10, 1.15], ['sailor', 4, 1.0], ['eel', 6, 1.05]]),
  // Night 5 — ink squids join and split on death.
  wave([['crab', 10, 1.2], ['squid', 4, 1.0], ['eel', 8, 1.1], ['sailor', 5, 1.05], ['squid', 4, 1.0]]),
  // Night 6 — wraiths shrug off the coral slow.
  wave([['wraith', 5, 1.0], ['crab', 12, 1.25], ['squid', 5, 1.05], ['sailor', 6, 1.1], ['wraith', 5, 1.0]]),
  // Night 7 — heavy mixed tide, two sailor anchors.
  wave([['eel', 10, 1.15], ['sailor', 8, 1.15], ['squid', 6, 1.1], ['wraith', 6, 1.05], ['crab', 14, 1.3]]),
  // Night 8 — wraiths and squids in force.
  wave([['wraith', 8, 1.1], ['squid', 8, 1.15], ['eel', 12, 1.2], ['sailor', 8, 1.2], ['wraith', 6, 1.1]]),
  // Night 9 — the sea throws everything it has.
  wave([['crab', 16, 1.4], ['sailor', 10, 1.25], ['squid', 8, 1.2], ['wraith', 10, 1.15], ['eel', 14, 1.25], ['sailor', 6, 1.25]]),
  // Night 10 — the Dread Kraken, escorted by a full tide.
  wave([['crab', 12, 1.5], ['wraith', 8, 1.2], ['sailor', 8, 1.3], ['kraken', 1, 1.0], ['eel', 10, 1.3], ['squid', 6, 1.25]]),
];

// How many foes a night sends in total, for the banner and the HUD.
export function nightEnemyCount(night) {
  let n = 0;
  for (const group of NIGHTS[night - 1]) n += group[1];
  return n;
}

// A short line shown on the banner when a night begins.
export const NIGHT_TITLES = [
  'Night 1 — The First Tide',
  'Night 2 — Eels in the Surf',
  'Night 3 — The Drowned Walk',
  'Night 4 — Crosscurrents',
  'Night 5 — Ink on the Water',
  'Night 6 — Wraiths Unbound',
  'Night 7 — The Heavy Tide',
  'Night 8 — The Sea Remembers',
  'Night 9 — All Hands on Deck',
  'Night 10 — The Dread Kraken',
];

// Tip shown during the build phase of each night.
export const NIGHT_TIPS = [
  'Click a glowing pad, then pick a tower. Harpoons are cheap and fast.',
  'Eels are quick — Coral Spires slow them down for your other towers.',
  'Sailors are tough. Tide Cannons splash whole groups at once.',
  'Moon Lanterns make every tower nearby hit harder. Cluster around one.',
  'Ink Squids split into Inklings when they die. Plan for the second wave.',
  'Wraiths resist the coral chill. Raw damage beats slow against them.',
  'Sell a tower (70% back) to rebuild where the tide is thickest.',
  'Banked gold earns +5% interest at dawn, up to +30. Spend or save?',
  'Upgrade before you build wide: a level-3 tower outshoots two level-1s.',
  'The Kraken leaks 5 town health. Hold nothing back tonight.',
];
