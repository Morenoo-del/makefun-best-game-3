// TIDEWARDEN — the creatures that rise from the deep.
// An enemy walks the path waypoint by waypoint, takes damage, slow and
// burn effects, and either dies (paying its bounty) or leaks into the
// town, costing town health. Squids split into inklings on death.

import { ENEMIES, PATH_POINTS } from './config.js';

let nextId = 1;

export class Enemy {
  constructor(typeId, hpScale, rng) {
    const def = ENEMIES[typeId];
    this.id = nextId++;
    this.type = typeId;
    this.def = def;
    this.maxHp = Math.round(def.hp * hpScale);
    this.hp = this.maxHp;
    this.speed = def.speed;
    this.r = def.r;
    this.x = PATH_POINTS[0][0] - 30 - rng() * 40;
    this.y = PATH_POINTS[0][1] + (rng() - 0.5) * 18;
    this.waypoint = 1;
    this.slowUntil = 0;
    this.slowFactor = 1;
    this.burnUntil = 0;
    this.burnDps = 0;
    this.wobble = rng() * Math.PI * 2;
    this.flash = 0; // hit flash timer
    this.dead = false;
    this.leaked = false;
    this.distance = 0; // total distance walked, for targeting
  }

  applySlow(factor, duration, now) {
    if (this.def.slowResist >= 1) return;
    const f = 1 - (1 - factor) * (1 - this.def.slowResist);
    if (f < this.slowFactor || now > this.slowUntil) {
      this.slowFactor = f;
      this.slowUntil = now + duration;
    }
  }

  applyBurn(dps, duration, now) {
    this.burnDps = Math.max(this.burnDps, dps);
    this.burnUntil = Math.max(this.burnUntil, now + duration);
  }

  takeDamage(amount, now) {
    this.hp -= amount;
    this.flash = 0.09;
    if (this.hp <= 0) this.dead = true;
  }

  update(dt, now) {
    if (this.dead || this.leaked) return;
    if (this.flash > 0) this.flash -= dt;
    if (now < this.burnUntil) {
      this.hp -= this.burnDps * dt;
      if (this.hp <= 0) { this.dead = true; return; }
    }
    const slow = now < this.slowUntil ? this.slowFactor : 1;
    let remaining = this.speed * slow * dt;
    while (remaining > 0) {
      const target = PATH_POINTS[this.waypoint];
      if (!target) { this.leaked = true; return; }
      const dx = target[0] - this.x;
      const dy = target[1] - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= remaining) {
        this.x = target[0];
        this.y = target[1];
        this.distance += dist;
        remaining -= dist;
        this.waypoint++;
      } else {
        this.x += (dx / dist) * remaining;
        this.y += (dy / dist) * remaining;
        this.distance += remaining;
        remaining = 0;
      }
    }
    this.wobble += dt * 6;
  }

  // How far along the path this enemy is, for "first" targeting.
  progress() {
    return this.distance;
  }

  get isBoss() {
    return !!this.def.boss;
  }
}

export function spawnEnemy(typeId, hpScale, rng) {
  return new Enemy(typeId, hpScale, rng);
}
