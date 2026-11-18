// TIDEWARDEN — deterministic screenshot scenes for ?shot=<scene>&seed=<n>.
// Each scene builds a fixed game state from the seed, then the loop runs
// it forward a fixed number of seconds so projectiles, particles and the
// lighthouse beam are caught mid-motion. Nothing here is random at run
// time: the same seed always renders the same shot.

import { BUILD_PADS, PATH_POINTS } from './config.js';
import { Tower } from './towers.js';
import { spawnEnemy } from './enemies.js';
import { makeRng } from './random.js';

function pathPointAt(distance) {
  let remaining = distance;
  for (let i = 1; i < PATH_POINTS.length; i++) {
    const [x0, y0] = PATH_POINTS[i - 1];
    const [x1, y1] = PATH_POINTS[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (remaining <= seg) {
      const f = remaining / seg;
      return { x: x0 + (x1 - x0) * f, y: y0 + (y1 - y0) * f, waypoint: i };
    }
    remaining -= seg;
  }
  const last = PATH_POINTS[PATH_POINTS.length - 1];
  return { x: last[0], y: last[1], waypoint: PATH_POINTS.length - 1 };
}

function placeEnemy(world, type, hpScale, distance, rng) {
  const e = spawnEnemy(type, hpScale, rng);
  const pos = pathPointAt(distance);
  e.x = pos.x;
  e.y = pos.y;
  e.waypoint = pos.waypoint;
  e.distance = distance;
  world.enemies.push(e);
  return e;
}

function placeTower(world, typeId, padIndex, level) {
  const pad = BUILD_PADS[padIndex];
  const t = new Tower(typeId, pad);
  t.level = level;
  t.applyLevel();
  t.spent = t.def.cost + t.def.upgrades.slice(0, level).reduce((s, u) => s + u.cost, 0);
  world.towers.push(t);
  return t;
}

export function setupShotScene(world, scene, seed) {
  const rng = makeRng(seed * 1000 + 11);
  world.rng = rng;
  world.banner = '';
  world.bannerUntil = 0;

  if (scene === 'start') {
    // Title screen over a quiet dusk cove.
    world.phase = 'title';
    world.time = 1.5;
    world.shotTime = 0.2;
    return;
  }

  if (scene === 'play') {
    // Night 4 in full swing: a tidy defence, foes mid-path, HUD live.
    // A short sim (5 s) keeps the placed foes on the field for the shot.
    world.phase = 'night';
    world.night = 4;
    world.gold = 342;
    world.townHp = 18;
    world.kills = 47;
    world.earned = 512;
    world.towersBuilt = 6;
    world.time = 0;
    world.shotTime = 5;
    placeTower(world, 'harpoon', 0, 1);
    placeTower(world, 'harpoon', 2, 0);
    placeTower(world, 'coral', 3, 1);
    placeTower(world, 'tide', 6, 0);
    placeTower(world, 'moon', 7, 0);
    placeTower(world, 'harpoon', 10, 0);
    const coral = world.towers[2];
    world.selectedTower = coral; // show its range ring, fully on screen
    placeEnemy(world, 'crab', 1.15, 120, rng);
    placeEnemy(world, 'crab', 1.15, 200, rng);
    placeEnemy(world, 'eel', 1.05, 300, rng);
    placeEnemy(world, 'eel', 1.05, 380, rng);
    placeEnemy(world, 'sailor', 1.0, 480, rng);
    placeEnemy(world, 'crab', 1.15, 560, rng);
    placeEnemy(world, 'eel', 1.05, 640, rng);
    placeEnemy(world, 'sailor', 1.0, 720, rng);
    return;
  }

  if (scene === 'action') {
    // Night 9 at its thickest: a levelled defence against a heavy tide.
    world.phase = 'night';
    world.night = 9;
    world.gold = 688;
    world.townHp = 11;
    world.kills = 214;
    world.earned = 1980;
    world.towersBuilt = 12;
    world.time = 0;
    world.shotTime = 4;
    placeTower(world, 'harpoon', 0, 2);
    placeTower(world, 'harpoon', 2, 2);
    placeTower(world, 'coral', 3, 2);
    placeTower(world, 'tide', 6, 2);
    placeTower(world, 'tide', 8, 1);
    placeTower(world, 'moon', 7, 2);
    placeTower(world, 'coral', 9, 1);
    placeTower(world, 'harpoon', 10, 1);
    placeTower(world, 'moon', 4, 1);
    placeEnemy(world, 'wraith', 1.15, 100, rng);
    placeEnemy(world, 'squid', 1.2, 180, rng);
    placeEnemy(world, 'sailor', 1.25, 260, rng);
    placeEnemy(world, 'eel', 1.25, 340, rng);
    placeEnemy(world, 'wraith', 1.15, 420, rng);
    placeEnemy(world, 'crab', 1.4, 500, rng);
    placeEnemy(world, 'squid', 1.2, 580, rng);
    placeEnemy(world, 'sailor', 1.25, 660, rng);
    placeEnemy(world, 'eel', 1.25, 740, rng);
    placeEnemy(world, 'wraith', 1.15, 820, rng);
    placeEnemy(world, 'crab', 1.4, 900, rng);
    placeEnemy(world, 'squid', 1.2, 980, rng);
    return;
  }

  // 'end' and anything else: the victory screen with a full run summary.
  world.phase = 'victory';
  world.night = 10;
  world.gold = 412;
  world.townHp = 12;
  world.kills = 318;
  world.earned = 2840;
  world.towersBuilt = 13;
  world.time = 0;
  world.shotTime = 0.2;
}
