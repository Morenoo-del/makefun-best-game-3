// TIDEWARDEN — the world: one object holding the whole game state.
// Phases: title -> build -> night -> (build ... ) -> victory | defeat.
// The world owns gold, town health, towers, enemies, projectiles and
// particles, spawns each night's sub-waves on a timer, and pays bounties.

import {
  BUILD_PADS, DAWN_INTEREST, DAWN_INTEREST_CAP, ENEMIES,
  NIGHT_BONUS, PATH_POINTS, SPAWN_GAP, START_GOLD, TOTAL_NIGHTS,
  TOWN_MAX_HP, TOWERS, LIGHTHOUSE,
} from './config.js';
import { NIGHTS, NIGHT_TITLES, NIGHT_TIPS, nightEnemyCount } from './levels.js';
import { spawnEnemy } from './enemies.js';
import { Tower } from './towers.js';
import { makeRng } from './random.js';

export class World {
  constructor(sound) {
    this.sound = sound;
    this.rng = makeRng((Date.now() % 100000) + 7);
    this.reset();
  }

  reset() {
    this.phase = 'title'; // title | build | night | paused | victory | defeat
    this.phaseBeforePause = 'build';
    this.gold = START_GOLD;
    this.townHp = TOWN_MAX_HP;
    this.night = 1;
    this.kills = 0;
    this.leaks = 0;
    this.earned = 0;
    this.towersBuilt = 0;
    this.time = 0;
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.floaters = []; // damage numbers
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.subWave = 0;
    this.shake = 0;
    this.banner = '';
    this.bannerUntil = 0;
    this.selectedPad = null;
    this.selectedTower = null;
    this.speed = 1;
    this.bestNight = 0;
    try {
      this.bestNight = Number(localStorage.getItem('tidewarden-best') || 0);
    } catch (_e) { /* storage unavailable */ }
  }

  startGame() {
    this.reset();
    this.phase = 'build';
    this.showBanner('Build your defences — then sound the horn', 3.2);
    if (this.sound) this.sound.startMusic();
  }

  showBanner(text, seconds) {
    this.banner = text;
    this.bannerUntil = this.time + seconds;
  }

  padAt(x, y) {
    for (const pad of BUILD_PADS) {
      if (Math.hypot(pad.x - x, pad.y - y) <= 26) return pad;
    }
    return null;
  }

  towerAtPad(pad) {
    return this.towers.find((t) => t.pad === pad) || null;
  }

  towerAt(x, y) {
    for (const t of this.towers) {
      if (Math.hypot(t.x - x, t.y - y) <= 26) return t;
    }
    return null;
  }

  buildTower(typeId) {
    if (this.phase !== 'build' || !this.selectedPad) return false;
    if (this.towerAtPad(this.selectedPad)) return false;
    const cost = TOWERS[typeId].cost;
    if (this.gold < cost) return false;
    this.gold -= cost;
    const tower = new Tower(typeId, this.selectedPad);
    this.towers.push(tower);
    this.towersBuilt++;
    this.selectedTower = tower;
    this.selectedPad = null;
    this.burst(tower.x, tower.y - 10, 14, '#ffe66d');
    if (this.sound) this.sound.build();
    return true;
  }

  upgradeSelected() {
    const t = this.selectedTower;
    if (!t || this.phase !== 'build') return false;
    const cost = t.upgradeCost();
    if (!cost || this.gold < cost) return false;
    this.gold -= cost;
    t.buyUpgrade();
    this.burst(t.x, t.y - 10, 16, t.color);
    if (this.sound) this.sound.upgrade();
    return true;
  }

  sellSelected() {
    const t = this.selectedTower;
    if (!t || this.phase !== 'build') return false;
    this.gold += t.sellValue();
    this.towers = this.towers.filter((o) => o !== t);
    this.burst(t.x, t.y - 10, 10, '#cccccc');
    this.selectedTower = null;
    if (this.sound) this.sound.coin();
    return true;
  }

  startNight() {
    if (this.phase !== 'build') return false;
    this.phase = 'night';
    this.subWave = 0;
    this.spawnQueue = [];
    for (const group of NIGHTS[this.night - 1]) {
      for (let i = 0; i < group[1]; i++) {
        this.spawnQueue.push({ type: group[0], hpScale: group[2] });
      }
    }
    this.spawnTimer = 1.2;
    this.showBanner(`${NIGHT_TITLES[this.night - 1]} — ${nightEnemyCount(this.night)} foes`, 3.0);
    if (this.sound) this.sound.horn();
    return true;
  }

  enemiesRemaining() {
    return this.spawnQueue.length + this.enemies.length;
  }

  burst(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      const a = this.rng() * Math.PI * 2;
      const sp = 40 + this.rng() * 120;
      this.particles.push({
        kind: 'spark', x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
        life: 0.4 + this.rng() * 0.4, max: 0.8,
        color, r: 2 + this.rng() * 3,
      });
    }
  }

  floater(x, y, text, color) {
    this.floaters.push({ x, y, text, color, life: 0.9, max: 0.9 });
  }

  onEnemyKilled(e) {
    this.kills++;
    this.gold += e.def.bounty;
    this.earned += e.def.bounty;
    this.floater(e.x, e.y - e.r - 6, `+${e.def.bounty}g`, '#ffe66d');
    this.burst(e.x, e.y, e.def.boss ? 40 : 10, e.def.color);
    if (this.sound) this.sound.coin();
    if (e.def.splits) {
      for (let i = 0; i < 2; i++) {
        const child = spawnEnemy(e.def.splits, 1, this.rng);
        child.x = e.x + (i === 0 ? -14 : 14);
        child.y = e.y + (i === 0 ? 6 : -6);
        child.waypoint = e.waypoint;
        child.distance = e.distance;
        this.enemies.push(child);
      }
    }
    if (e.isBoss) {
      this.shake = 0.6;
      this.showBanner('The Dread Kraken is sunk!', 3.0);
    }
  }

  onEnemyLeaked(e) {
    this.leaks++;
    this.townHp -= e.def.leak;
    this.shake = Math.max(this.shake, e.def.boss ? 0.8 : 0.35);
    this.floater(LIGHTHOUSE.x - 20, LIGHTHOUSE.y - 50, `-${e.def.leak} ♥`, '#ff5964');
    if (this.sound) this.sound.leak();
    if (this.townHp <= 0) {
      this.townHp = 0;
      this.phase = 'defeat';
      if (this.sound) { this.sound.defeat(); this.sound.stopMusic(); }
      this.saveBest();
    }
  }

  saveBest() {
    const reached = this.phase === 'victory' ? TOTAL_NIGHTS : this.night;
    if (reached > this.bestNight) {
      this.bestNight = reached;
      try { localStorage.setItem('tidewarden-best', String(reached)); } catch (_e) { /* ignore */ }
    }
  }

  endNight() {
    const bonus = NIGHT_BONUS(this.night);
    const interest = Math.min(Math.floor(this.gold * DAWN_INTEREST), DAWN_INTEREST_CAP);
    this.gold += bonus + interest;
    if (this.night >= TOTAL_NIGHTS) {
      this.phase = 'victory';
      if (this.sound) { this.sound.victory(); this.sound.stopMusic(); }
      this.saveBest();
      return;
    }
    this.night++;
    this.phase = 'build';
    this.showBanner(`Dawn breaks — +${bonus}g bounty, +${interest}g interest`, 3.4);
    if (this.sound) this.sound.dawn();
  }

  update(rawDt) {
    const dt = Math.min(rawDt, 0.05) * this.speed;
    this.time += dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - rawDt * 1.4);

    // Particles and floaters always animate, even on menus.
    for (const p of this.particles) {
      p.life -= rawDt;
      p.x += p.vx * rawDt;
      p.y += p.vy * rawDt;
      p.vy += 160 * rawDt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floaters) { f.life -= rawDt; f.y -= 34 * rawDt; }
    this.floaters = this.floaters.filter((f) => f.life > 0);

    if (this.phase !== 'night') return;

    // Spawn the queued sub-wave on a timer.
    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = SPAWN_GAP;
        const next = this.spawnQueue.shift();
        const e = spawnEnemy(next.type, next.hpScale, this.rng);
        this.enemies.push(e);
        if (next.type === 'kraken' && this.sound) this.sound.bossRoar();
      }
    }

    for (const t of this.towers) {
      t.update(dt, this.enemies, this.projectiles, this.particles, this.time, this.sound, this.towers);
    }

    // Projectiles: fly straight at their target's last spot, hit on arrival.
    for (const pr of this.projectiles) {
      pr.life -= dt;
      const target = pr.tx;
      if (target && !target.dead && !target.leaked) {
        const dx = target.x - pr.x;
        const dy = target.y - pr.y;
        const dist = Math.hypot(dx, dy);
        const step = pr.speed * dt;
        if (dist <= step + target.r) {
          this.hitEnemy(target, pr);
          pr.life = 0;
          continue;
        }
        pr.x += (dx / dist) * step;
        pr.y += (dy / dist) * step;
        pr.angle = Math.atan2(dy, dx);
      } else {
        pr.x += Math.cos(pr.angle) * pr.speed * dt;
        pr.y += Math.sin(pr.angle) * pr.speed * dt;
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.life > 0);

    // Enemies walk, burn, and leak.
    for (const e of this.enemies) e.update(dt, this.time);
    for (const e of this.enemies) {
      if (e.dead) this.onEnemyKilled(e);
      else if (e.leaked) this.onEnemyLeaked(e);
    }
    this.enemies = this.enemies.filter((e) => !e.dead && !e.leaked);

    // Night ends when the queue and the field are both empty.
    if (this.spawnQueue.length === 0 && this.enemies.length === 0) this.endNight();
  }

  hitEnemy(target, pr) {
    const now = this.time;
    if (pr.splash) {
      for (const e of this.enemies) {
        if (e.dead || e.leaked) continue;
        const d = Math.hypot(e.x - target.x, e.y - target.y);
        if (d <= pr.splash + e.r) {
          e.takeDamage(pr.damage, now);
          if (pr.slow) e.applySlow(pr.slow, pr.slowTime, now);
          if (pr.burn) e.applyBurn(pr.burn, 3, now);
          if (e === target) this.floater(e.x, e.y - e.r - 4, `${Math.round(pr.damage)}`, '#ffffff');
        }
      }
      this.burst(target.x, target.y, 8, '#9bf6ff');
    } else if (pr.chain) {
      let remaining = pr.chain + 1;
      let from = target;
      const hitSet = new Set();
      while (from && remaining > 0) {
        from.takeDamage(pr.damage, now);
        if (pr.slow) from.applySlow(pr.slow, pr.slowTime, now);
        hitSet.add(from);
        this.floater(from.x, from.y - from.r - 4, `${Math.round(pr.damage)}`, '#ffffff');
        remaining--;
        let next = null;
        let bestD = 130;
        for (const e of this.enemies) {
          if (e.dead || e.leaked || hitSet.has(e)) continue;
          const d = Math.hypot(e.x - from.x, e.y - from.y);
          if (d < bestD) { bestD = d; next = e; }
        }
        from = next;
      }
    } else {
      target.takeDamage(pr.damage, now);
      if (pr.slow) target.applySlow(pr.slow, pr.slowTime, now);
      if (pr.burn) target.applyBurn(pr.burn, 3, now);
      this.floater(target.x, target.y - target.r - 4, `${Math.round(pr.damage)}`, '#ffffff');
    }
    if (this.sound) this.sound.hit();
  }
}
