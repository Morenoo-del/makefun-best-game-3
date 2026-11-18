// TIDEWARDEN — the entry point: creates the world, renderer, input and
// sound, runs the fixed-step loop, and drives deterministic screenshot
// scenes when the page opens with ?shot=<scene>&seed=<n>.

import { VIEW_H, VIEW_W } from './config.js';
import { World } from './world.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { setupShotScene } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const sound = new SoundBank();
const world = new World(sound);
const renderer = new Renderer(canvas);
new Input(canvas, world, renderer, sound);

// Exposed for automated play-testing only; the game never reads it.
window.__world = world;
window.__sound = sound;

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 7);

// In screenshot mode the scene is pre-built and rendered deterministically;
// the loop still runs so particles and the beam animate to a fixed time.
let shotMode = false;
if (shot) {
  shotMode = true;
  setupShotScene(world, shot, seed);
}

let last = performance.now();
let acc = 0;
const STEP = 1 / 60;

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (shotMode) {
    // Advance the world in fixed steps to its scene time, then hold.
    if (!world.shotSettled) {
      acc += dt;
      let guard = 0;
      while (acc >= STEP && guard < 600) {
        world.update(STEP);
        if (sound) sound.tickMusic(STEP);
        acc -= STEP;
        guard++;
      }
      if (world.shotTime !== undefined && world.time >= world.shotTime) {
        world.shotSettled = true;
      }
    }
    renderer.draw(world);
    if (world.shotSettled) window.__shotReady = true;
  } else {
    acc += dt;
    let guard = 0;
    while (acc >= STEP && guard < 5) {
      world.update(STEP);
      if (sound) sound.tickMusic(STEP);
      acc -= STEP;
      guard++;
    }
    if (guard >= 5) acc = 0;
    renderer.draw(world);
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
