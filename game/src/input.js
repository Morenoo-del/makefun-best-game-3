// TIDEWARDEN — mouse and keyboard input.
// Clicks first hit the canvas-drawn buttons (start, build cards, upgrade,
// sell, pause, resume, restart); a click on the map selects a build pad
// or a tower. Keys: Space starts a night, F toggles speed, P pauses,
// M mutes, R restarts from an end screen, 1-4 build from a selected pad.

import { KEYS, TOWER_ORDER } from './config.js';

export class Input {
  constructor(canvas, world, renderer, sound) {
    this.canvas = canvas;
    this.world = world;
    this.renderer = renderer;
    this.sound = sound;
    this.mouse = { x: 0, y: 0 };
    canvas.addEventListener('mousemove', (ev) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (ev.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (ev.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('click', (ev) => {
      const r = canvas.getBoundingClientRect();
      const x = (ev.clientX - r.left) * (canvas.width / r.width);
      const y = (ev.clientY - r.top) * (canvas.height / r.height);
      // Shift-click a tower sells it at once (70% back).
      if (ev.shiftKey) {
        const tower = this.world.towerAt(x, y);
        if (tower && this.world.phase === 'build') {
          this.world.selectedTower = tower;
          this.world.sellSelected();
          return;
        }
      }
      this.handleClick(x, y);
    });
    window.addEventListener('keydown', (ev) => this.handleKey(ev));
  }

  handleClick(x, y) {
    const world = this.world;
    if (this.sound) this.sound.unlock();
    const btn = this.renderer.buttonAt(x, y);
    if (btn) {
      this.activate(btn.action);
      return;
    }
    if (world.phase === 'title') { world.startGame(); return; }
    if (world.phase !== 'build' && world.phase !== 'night') return;
    // Map click: prefer a tower, then a pad.
    const tower = world.towerAt(x, y);
    if (tower) {
      world.selectedTower = tower;
      world.selectedPad = null;
      return;
    }
    const pad = world.padAt(x, y);
    if (pad) {
      if (world.phase === 'build') {
        world.selectedPad = pad;
        world.selectedTower = null;
      }
      return;
    }
    world.selectedPad = null;
    world.selectedTower = null;
  }

  activate(action) {
    const world = this.world;
    const sound = this.sound;
    if (action === 'start-game') { world.startGame(); return; }
    if (action === 'restart') { world.startGame(); return; }
    if (action === 'start-night') { world.startNight(); return; }
    if (action === 'resume') { this.togglePause(); return; }
    if (action === 'pause') { this.togglePause(); return; }
    if (action === 'mute') {
      if (sound) sound.setMuted(!sound.muted);
      return;
    }
    if (action === 'speed') {
      world.speed = world.speed === 1 ? 2 : 1;
      return;
    }
    if (action === 'upgrade') { world.upgradeSelected(); return; }
    if (action === 'sell') { world.sellSelected(); return; }
    if (action.startsWith('build:')) {
      world.buildTower(action.slice(6));
    }
  }

  togglePause() {
    const world = this.world;
    if (world.phase === 'paused') {
      world.phase = world.phaseBeforePause;
    } else if (world.phase === 'build' || world.phase === 'night') {
      world.phaseBeforePause = world.phase;
      world.phase = 'paused';
    }
  }

  handleKey(ev) {
    const world = this.world;
    const k = ev.key;
    if (k === ' ' || k === 'Spacebar') {
      ev.preventDefault();
      if (this.sound) this.sound.unlock();
      if (world.phase === 'title') world.startGame();
      else if (world.phase === 'build') world.startNight();
      return;
    }
    if (k === KEYS.pause || k === 'P') { this.togglePause(); return; }
    if (k === KEYS.mute || k === 'M') {
      if (this.sound) this.sound.setMuted(!this.sound.muted);
      return;
    }
    if (k === KEYS.speed || k === 'F') {
      world.speed = world.speed === 1 ? 2 : 1;
      return;
    }
    if (k === KEYS.restart || k === 'R') {
      if (world.phase === 'victory' || world.phase === 'defeat') world.startGame();
      return;
    }
    if (k === KEYS.deselect) {
      world.selectedPad = null;
      world.selectedTower = null;
      return;
    }
    // Number keys build from a selected pad.
    const idx = ['1', '2', '3', '4'].indexOf(k);
    if (idx >= 0 && world.selectedPad && world.phase === 'build') {
      world.buildTower(TOWER_ORDER[idx]);
    }
  }
}
