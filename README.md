# Donkey Kong (arcade recreation)

A browser recreation of the 1981 Donkey Kong arcade game, built with Nuxt 4 and the HTML canvas. All four classic stages, arcade scoring, and a switchable look: pixel-art in the spirit of the original cabinet, or a modern vector style.

## Play

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, pick a graphics style and push Space.

| Action | Keys |
| --- | --- |
| Move / climb | Arrow keys or WASD |
| Jump | Space, Z or X |
| Start / pause | Enter or P |
| Switch graphics | G (or the buttons above the screen) |
| Mute | M |

On touch devices an on-screen d-pad and jump button appear.

## Stages

Each level runs the four stages in order, then the level counter goes up and everything gets faster.

1. **25m – Barrels.** Sloped girders, rolling barrels that sometimes take ladders, the blue barrel that lights the oil drum and releases a fireball, broken ladders, two hammers.
2. **50m – Pie factory.** Conveyor belts that reverse direction, cement pies, a burning oil drum in the middle of the centre belt, fireballs.
3. **75m – Elevators.** Two elevator shafts (up and down), springs bouncing along the top girder and dropping down the right shaft, a wandering fireball.
4. **100m – Rivets.** Remove all eight rivets by walking or jumping over them while fireballs climb the tower. When the last rivet goes, the top collapses and Donkey Kong falls.

## Scoring

| Event | Points |
| --- | --- |
| Jump over a barrel, fireball, pie or spring | 100 (300 for two at once, 500 for three) |
| Smash something with the hammer | 300, 500 or 800 |
| Remove a rivet | 100 |
| Pauline's hat, parasol or purse | 300 / 500 / 800 on levels 1 / 2 / 3+ |
| Finish a stage | the remaining bonus timer |

The bonus timer starts at 5000 on level 1 and rises 1000 per level up to 8000. It counts down 100 at a time and kills Mario when it hits zero. You start with three lives and earn one extra at 7000 points. The high score is kept in `localStorage`.

## Code layout

- `app/game/engine.ts` – game state, physics, enemies, scoring and scene flow (title, "how high", play, death, stage clear, game over).
- `app/game/levels.ts` – the four stage layouts (platforms, ladders, conveyors, elevators, hammers, items, rivets).
- `app/game/render.ts` – the scene compositor and HUD; it draws through the `Art` interface.
- `app/game/artRetro.ts` + `app/game/sprites.ts` – the 1981 look: 224×256 pixel canvas, hand-drawn sprites and a 5×7 pixel font, scaled with nearest-neighbour.
- `app/game/artModern.ts` – the modern look: vector shapes, gradients and glow drawn at device resolution.
- `app/game/audio.ts` – a small WebAudio synthesiser for the blips, jingles and the hammer theme.
- `app/components/DonkeyKongGame.vue` – canvas hosting, fixed 60 fps loop, keyboard and touch input, graphics toggle.

## Build

```bash
npm run build      # production build
npm run preview    # serve the production build
npm run generate   # static site
```
