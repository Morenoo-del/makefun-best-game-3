// TIDEWARDEN — towers, their shots and their upgrades.
// A tower sits on a build pad, picks the enemy furthest along the path
// inside its range, and fires on its own clock. Upgrades are bought in
// place: each level re-stats the tower from its definition. Moon Lanterns
// never shoot; they buff every other tower inside their glow.

import { TOWERS } from './config.js';

let nextId = 1;

export class Tower {
  constructor(typeId, pad) {
    const def = TOWERS[typeId];
    this.id = nextId++;
    this.type = typeId;
    this.def = def;
    this.pad = pad;
    this.x = pad.x;
    this.y = pad.y;
    this.level = 0; // 0, 1, 2 — index into def.upgrades for the next buy
    this.cooldown = 0;
    this.angle = -Math.PI / 2;
    this.spent = def.cost; // total gold sunk, for the sell price
    this.shotsFired = 0;
    this.kills = 0;
    this.applyLevel();
  }

  applyLevel() {
    const d = this.def;
    const up = this.level > 0 ? d.upgrades[this.level - 1] : null;
    this.damage = up?.damage ?? d.damage;
    this.rate = up?.rate ?? d.rate;
    this.range = up?.range ?? d.range;
    this.slow = up?.slow ?? d.slow;
    this.slowTime = up?.slowTime ?? d.slowTime;
    this.splash = up?.splash ?? d.splash;
    this.burn = up?.burn ?? d.burn;
    this.chain = up?.chain ?? d.chain ?? 0;
    this.shots = up?.shots ?? 1;
    this.buff = up?.buff ?? d.buff ?? 1;
  }

  get name() { return this.def.name; }
  get color() { return this.def.color; }
  get dark() { return this.def.dark; }

  nextUpgrade() {
    if (this.level >= this.def.upgrades.length) return null;
    return this.def.upgrades[this.level];
  }

  upgradeCost() {
    const up = this.nextUpgrade();
    return up ? up.cost : 0;
  }

  buyUpgrade() {
    const up = this.nextUpgrade();
    if (!up) return false;
    this.spent += up.cost;
    this.level++;
    this.applyLevel();
    return true;
  }

  sellValue() {
    return Math.floor(this.spent * 0.7);
  }

  // Damage multiplier from every Moon Lantern glowing over this tower.
  buffMultiplier(towers) {
    let m = 1;
    for (const t of towers) {
      if (t.type !== 'moon' || t === this) continue;
      const d = Math.hypot(t.x - this.x, t.y - this.y);
      if (d <= t.range) m *= t.buff;
    }
    return m;
  }

  pickTarget(enemies) {
    let best = null;
    let bestProgress = -1;
    for (const e of enemies) {
      if (e.dead || e.leaked) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d > this.range + e.r) continue;
      if (e.progress() > bestProgress) {
        bestProgress = e.progress();
        best = e;
      }
    }
    return best;
  }

  update(dt, enemies, projectiles, particles, now, sound, towers) {
    if (this.type === 'moon') return; // lanterns glow, they never shoot
    this.cooldown -= dt;
    const target = this.pickTarget(enemies);
    if (!target) return;
    this.angle = Math.atan2(target.y - this.y, target.x - this.x);
    if (this.cooldown > 0) return;
    this.cooldown = this.rate;
    this.shotsFired++;
    const buff = this.buffMultiplier(towers || []);
    for (let s = 0; s < this.shots; s++) {
      const spread = this.shots > 1 ? (s - (this.shots - 1) / 2) * 0.16 : 0;
      projectiles.push({
        x: this.x, y: this.y - 14,
        tx: target, angle: this.angle + spread,
        speed: 520, damage: this.damage * buff,
        splash: this.splash, slow: this.slow, slowTime: this.slowTime,
        burn: this.burn, chain: this.chain, kind: this.type,
        color: this.color, life: 1.2,
      });
    }
    if (sound) sound.shoot(this.type);
    particles.push({
      kind: 'muzzle', x: this.x + Math.cos(this.angle) * 16,
      y: this.y - 14 + Math.sin(this.angle) * 16,
      life: 0.12, max: 0.12, color: this.color, r: 5,
    });
  }
}

export function towerCost(typeId) {
  return TOWERS[typeId].cost;
}
