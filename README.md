# TIDEWARDEN — Hold the Lighthouse

A coastal tower defence for make.fun's "Make the best game" bounty ($1,000 in USDC). Creatures rise from the deep each night and march on Saltspire Cove — build harpoon turrets, coral spires, tide cannons and moon lanterns on the glowing sand pads, earn gold for every creature sunk, and keep the lighthouse standing through all ten nights, ending with the Dread Kraken.

[![best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Morenoo-del/makefun-best-game-3/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Morenoo-del/makefun-best-game-3/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

## How it plays

- **Build phase (dusk):** click a glowing `+` pad, pick a tower (keys 1–4 work too). Click a tower to upgrade it twice or sell it back for 70%.
- **Night phase:** sound the horn (or press Space) and the tide comes. Towers fire on their own; gold lands per kill, plus a dawn bonus and +5% interest on banked gold.
- **Win:** survive Night 10 and sink the Dread Kraken. **Lose:** the town's 20 health runs out.
- **Depth:** four tower kinds with distinct roles (fast single-target, slowing aura, splash, damage buff), three levels each, six enemy kinds with different speeds, resistances and a splitter, and a boss that spawns escorts.
- **Feel:** particles, damage numbers, screen shake, a sweeping lighthouse beam, and fully synthesised WebAudio sound effects plus a generative sea-shanty loop. Pause (P), mute (M), 1×/2× speed (F), restart (R).

## Screenshots

The four screenshots in `screenshots/` are real renders of the game in a headless browser: the title screen, a night in progress with the HUD, the thick of Night 9 with damage numbers flying, and the victory screen with the run summary and a Play Again button.

## Run it

Serve `game/` with any static server and open `game/index.html`, or:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

No dependencies, no build step, no network requests — all art is drawn on canvas and all sound is synthesised in code.

---

<sub>Entered on [make.fun](https://make.fun/?ref=w6xj1ecj&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
