import type { Game, Mario, Barrel, Fireball, Pie, Spring, Popup, DkPose } from './engine'
import type { Platform, Ladder, Item, Rivet, ElevatorShaft } from './types'
import { W, H } from './constants'
import { STAGE_NAMES } from './levels'

export type Ctx = CanvasRenderingContext2D

/** The set of primitives a visual style must provide. The compositor below decides what to draw where. */
export interface Art {
  clear(ctx: Ctx, g: Game): void
  platform(ctx: Ctx, p: Platform, g: Game): void
  ladder(ctx: Ctx, l: Ladder): void
  elevatorShaft(ctx: Ctx, s: ElevatorShaft, g: Game): void
  elevatorCar(ctx: Ctx, p: Platform): void
  mario(ctx: Ctx, m: Mario, g: Game): void
  dk(ctx: Ctx, x: number, y: number, pose: DkPose, beat: number, g: Game): void
  pauline(ctx: Ctx, x: number, y: number, frame: number, help: boolean): void
  barrel(ctx: Ctx, b: Barrel): void
  barrelStack(ctx: Ctx, x: number, y: number): void
  fireball(ctx: Ctx, f: Fireball): void
  pie(ctx: Ctx, p: Pie): void
  spring(ctx: Ctx, s: Spring, squash: boolean): void
  hammer(ctx: Ctx, x: number, y: number): void
  item(ctx: Ctx, it: Item): void
  rivet(ctx: Ctx, r: Rivet): void
  drum(ctx: Ctx, x: number, y: number, lit: boolean, frame: number): void
  heart(ctx: Ctx, x: number, y: number, broken: boolean): void
  text(ctx: Ctx, s: string, x: number, y: number, color: string, align?: 'left' | 'center' | 'right', scale?: number): void
  box(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void
  lifeIcon(ctx: Ctx, x: number, y: number): void
  overlay(ctx: Ctx, alpha: number): void
}

const pad = (n: number, w = 6) => String(Math.floor(n)).padStart(w, '0')

export function drawScene(ctx: Ctx, g: Game, art: Art) {
  art.clear(ctx, g)
  switch (g.scene) {
    case 'title': drawTitle(ctx, g, art); return
    case 'howhigh': drawHowHigh(ctx, g, art); drawHud(ctx, g, art); return
    default: break
  }
  drawStage(ctx, g, art)
  drawHud(ctx, g, art)
  if (g.scene === 'gameover') {
    art.box(ctx, 56, 112, 112, 24, '#000')
    art.text(ctx, 'GAME OVER', W / 2, 121, '#4de3ff', 'center')
  }
  if (g.paused) {
    art.overlay(ctx, 0.5)
    art.text(ctx, 'PAUSE', W / 2, 124, '#fff', 'center', 2)
  }
}

function drawStage(ctx: Ctx, g: Game, art: Art) {
  const st = g.stage
  for (const p of st.platforms) if (!p.hidden) art.platform(ctx, p, g)
  for (const l of st.ladders) {
    if (st.platforms[l.top]?.hidden) continue
    art.ladder(ctx, l)
  }
  st.elevators.forEach((s, si) => {
    art.elevatorShaft(ctx, s, g)
    for (let k = 0; k < s.count; k++) art.elevatorCar(ctx, g.elevPlatform(si, k))
  })
  for (const r of st.rivets) if (!st.platforms[r.platform]?.hidden) art.rivet(ctx, r)
  if (st.drum) art.drum(ctx, st.drum.x, st.drum.y, st.drum.lit, g.frame)
  for (const h of st.hammers) if (!h.taken) art.hammer(ctx, h.x, h.y)
  for (const it of st.items) if (!it.taken) art.item(ctx, it)
  if (st.barrelStack) art.barrelStack(ctx, st.barrelStack.x, st.barrelStack.y)

  // Donkey Kong and Pauline
  art.dk(ctx, st.dk.x, g.dk.y, g.dk.pose, g.dk.beat, g)
  if (g.dk.pose !== 'carry') {
    const help = g.scene === 'play' && (g.frame % 150) < 70
    art.pauline(ctx, st.pauline.x, st.pauline.y, g.frame, help)
  }

  for (const p of g.pies) art.pie(ctx, p)
  for (const b of g.barrels) art.barrel(ctx, b)
  for (const f of g.fireballs) art.fireball(ctx, f)
  for (const s of g.springs) art.spring(ctx, s, !s.drop && s.vy < 0 && s.y > (st.springSpawn?.y ?? 0) - 5)
  art.mario(ctx, g.mario, g)

  if (g.showHeart) {
    if (g.scene === 'clear') art.heart(ctx, (st.pauline.x + g.mario.x) / 2, Math.min(st.pauline.y, g.mario.y) - 24, g.sceneTimer < 150)
    else art.heart(ctx, g.mario.x + 10, g.mario.y - 26, false)
  }
  for (const p of g.popups) drawPopup(ctx, p, art)
}

function drawPopup(ctx: Ctx, p: Popup, art: Art) {
  art.text(ctx, p.text, p.x, p.y, '#fff', 'center')
}

export function drawHud(ctx: Ctx, g: Game, art: Art) {
  art.text(ctx, '1UP', 20, 1, '#ff3a3a')
  art.text(ctx, pad(g.score), 8, 9, '#fff')
  art.text(ctx, 'HIGH SCORE', 82, 1, '#ff3a3a')
  art.text(ctx, pad(g.hi), 94, 9, '#fff')
  for (let i = 0; i < Math.min(g.lives - 1, 6); i++) art.lifeIcon(ctx, 8 + i * 8, 18)
  // bonus box
  art.box(ctx, 172, 22, 48, 24, '#4a6cff')
  art.text(ctx, 'BONUS', 196, 25, '#4de3ff', 'center')
  art.text(ctx, String(g.bonus).padStart(4, ' '), 196, 35, '#ffd83a', 'center')
  art.text(ctx, 'L=' + String(g.level).padStart(2, '0'), 174, 50, '#4a9cff')
}

function drawTitle(ctx: Ctx, g: Game, art: Art) {
  art.text(ctx, 'HIGH SCORE', 82, 1, '#ff3a3a')
  art.text(ctx, pad(g.hi), 94, 9, '#fff')
  art.text(ctx, 'DONKEY', W / 2, 36, '#ff3a3a', 'center', 3)
  art.text(ctx, 'KONG', W / 2, 62, '#ff3a3a', 'center', 3)
  art.text(ctx, 'ARCADE RECREATION', W / 2, 90, '#4de3ff', 'center')

  // preview of the chosen look
  const previewTop: Platform = { id: 900, kind: 'girder', holes: [], pts: [[40, 150], [184, 150]], x1: 40, x2: 184 }
  art.platform(ctx, previewTop, g)
  art.dk(ctx, 80, 150, (g.titleTick % 240) < 120 ? 'idle' : 'hold', g.titleTick, g)
  const m = g.mario
  const preview: Mario = { ...m, x: 150, y: 150, state: 'walk', facing: -1, walkFrame: Math.floor(g.titleTick / 8) % 3, hammer: 0, moving: true }
  art.mario(ctx, preview, g)
  const b: Barrel = { x: 120, y: 150, vx: 0, vy: 0, dir: 1, state: 'roll', blue: false, platform: null, ladder: null, frame: g.titleTick, bounces: 0 }
  art.barrel(ctx, b)

  const gfxLabel = g.gfx === 'retro' ? '< ORIGINAL 1981 >' : '< MODERN >'
  art.text(ctx, 'GRAPHICS', W / 2, 170, '#ffd83a', 'center')
  art.text(ctx, gfxLabel, W / 2, 180, '#fff', 'center')
  if ((g.titleTick % 60) < 40) art.text(ctx, 'PUSH SPACE TO START', W / 2, 200, '#4de3ff', 'center')
  art.text(ctx, 'ARROWS/WASD MOVE  SPACE JUMP', W / 2, 222, '#9aa', 'center')
  art.text(ctx, 'G GRAPHICS  M MUTE  P PAUSE', W / 2, 232, '#9aa', 'center')
  art.text(ctx, '1 PLAYER   3 LIVES   7000 BONUS LIFE', W / 2, 244, '#9aa', 'center')
}

function drawHowHigh(ctx: Ctx, g: Game, art: Art) {
  art.text(ctx, 'HOW HIGH CAN YOU GET?', W / 2, 60, '#4de3ff', 'center')
  const stages = g.stageIdx + 1
  for (let i = 0; i < stages; i++) {
    const y = 232 - i * 40
    const p: Platform = { id: 800 + i, kind: 'girder', holes: [], pts: [[72, y], [152, y]], x1: 72, x2: 152 }
    art.platform(ctx, p, g)
    art.dk(ctx, 100, y, 'idle', g.frame + i * 7, g)
    const meters = (g.level - 1) * 100 + (i + 1) * 25
    art.text(ctx, meters + ' m', 160, y - 14, '#ffd83a')
  }
  art.text(ctx, STAGE_NAMES[g.stageKind].toUpperCase() + '  LEVEL ' + g.level, W / 2, 80, '#fff', 'center')
}
