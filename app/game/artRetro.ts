import type { Art, Ctx } from './render'
import type { Game, Mario, Barrel, Fireball, Pie, Spring, DkPose } from './engine'
import type { Platform, Ladder, Item, Rivet, ElevatorShaft } from './types'
import { surfaceAt } from './geom'
import { W, H } from './constants'
import {
  PAL, FONT, type PixelMap,
  MARIO_STAND, MARIO_WALK1, MARIO_WALK2, MARIO_JUMP, MARIO_CLIMB, HAMMER_UP, HAMMER_SIDE,
  BARREL_ROLL, BARREL_SIDE, FIREBALL, PIE, SPRING, SPRING_SQUASH, RIVET, HAT, PURSE, PARASOL,
  HEART, HEART_BROKEN, OIL_DRUM, FLAME, GEAR,
} from './sprites'

const GIRDER = '#f55a8a'
const GIRDER_DARK = '#3a0c22'
const LADDER = '#1ee7f5'
const BLUE_PAL: Record<string, string> = { ...PAL, A: '#2850d8', F: '#7fb0ff', E: '#102878' }

const cache = new Map<string, HTMLCanvasElement>()

function sprite(map: PixelMap, key: string, flip = false, pal: Record<string, string> = PAL): HTMLCanvasElement {
  const k = key + (flip ? '|f' : '') + (pal === PAL ? '' : '|b')
  let c = cache.get(k)
  if (c) return c
  const w = map[0]!.length
  const h = map.length
  c = document.createElement('canvas')
  c.width = w
  c.height = h
  const cx = c.getContext('2d')!
  for (let y = 0; y < h; y++) {
    const row = map[y]!
    for (let x = 0; x < w; x++) {
      const ch = row[x]!
      if (ch === '.' || ch === ' ') continue
      cx.fillStyle = pal[ch] ?? '#fff'
      cx.fillRect(flip ? w - 1 - x : x, y, 1, 1)
    }
  }
  cache.set(k, c)
  return c
}

function blit(ctx: Ctx, map: PixelMap, key: string, x: number, y: number, flip = false, pal?: Record<string, string>) {
  ctx.drawImage(sprite(map, key, flip, pal), Math.round(x), Math.round(y))
}

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

function girderColumn(ctx: Ctx, x: number, s: number) {
  const y0 = Math.round(s)
  rect(ctx, x, y0, 1, 8, GIRDER_DARK)
  rect(ctx, x, y0, 1, 2, GIRDER)
  rect(ctx, x, y0 + 6, 1, 2, GIRDER)
  const d = (x >> 1) & 3
  rect(ctx, x, y0 + 2 + d, 1, 1, GIRDER)
  rect(ctx, x, y0 + 5 - d, 1, 1, GIRDER)
}

function drawText(ctx: Ctx, s: string, x: number, y: number, color: string, align: 'left' | 'center' | 'right' = 'left', scale = 1) {
  const adv = 6 * scale
  const width = s.length * adv - scale
  let sx = Math.round(align === 'center' ? x - width / 2 : align === 'right' ? x - width : x)
  ctx.fillStyle = color
  for (const ch of s.toUpperCase()) {
    const gl = FONT[ch]
    if (gl) {
      for (let r = 0; r < 7; r++) {
        const row = gl[r]!
        for (let c = 0; c < 5; c++) if (row[c] === '#') ctx.fillRect(sx + c * scale, Math.round(y) + r * scale, scale, scale)
      }
    }
    sx += adv
  }
}

function drawDK(ctx: Ctx, x: number, y: number, pose: DkPose, beat: number, g: Game) {
  const B = '#b0582a', D = '#6a2e10', T = '#f8c890', K = '#000', Wt = '#fff'
  x = Math.round(x)
  y = Math.round(y)
  ctx.save()
  if (pose === 'down') { ctx.translate(x, y - 16); ctx.rotate(Math.PI); ctx.translate(-x, -(y - 16)) }
  if (pose === 'fall') { ctx.translate(x, y - 16); ctx.rotate(((g.frame % 48) / 48) * Math.PI * 2); ctx.translate(-x, -(y - 16)) }
  const left = (xx: number) => x - xx, right = (xx: number) => x + xx
  // legs & feet
  rect(ctx, left(18), y - 6, 12, 6, B)
  rect(ctx, right(6), y - 6, 12, 6, B)
  rect(ctx, left(20), y - 3, 14, 3, D)
  rect(ctx, right(6), y - 3, 14, 3, D)
  // body and belly
  rect(ctx, left(16), y - 24, 32, 19, B)
  rect(ctx, left(10), y - 14, 20, 9, T)
  rect(ctx, left(6), y - 12, 12, 5, '#e8b078')
  // head
  rect(ctx, left(13), y - 33, 26, 12, B)
  rect(ctx, left(2), y - 35, 4, 2, B)
  rect(ctx, left(11), y - 30, 22, 8, T)
  rect(ctx, left(10), y - 31, 8, 2, D)
  rect(ctx, right(2), y - 31, 8, 2, D)
  rect(ctx, left(8), y - 29, 4, 3, Wt)
  rect(ctx, left(6), y - 28, 2, 2, K)
  rect(ctx, right(4), y - 29, 4, 3, Wt)
  rect(ctx, right(4), y - 28, 2, 2, K)
  rect(ctx, left(3), y - 25, 2, 1, D)
  rect(ctx, right(1), y - 25, 2, 1, D)
  rect(ctx, left(7), y - 23, 14, 2, D)
  // arms
  const beatUp = Math.floor(beat / 18) % 2 === 0
  const armDown = (side: -1 | 1) => {
    const ax = side < 0 ? left(24) : right(16)
    rect(ctx, ax, y - 22, 8, 16, B)
    rect(ctx, ax, y - 7, 8, 5, D)
  }
  const armUp = (side: -1 | 1) => {
    const ax = side < 0 ? left(24) : right(16)
    rect(ctx, ax, y - 34, 8, 14, B)
    rect(ctx, ax, y - 21, 8, 5, D)
  }
  switch (pose) {
    case 'idle':
    case 'fall':
    case 'down':
      if (pose === 'idle' && beatUp) { armUp(-1); armDown(1) } else if (pose === 'idle') { armDown(-1); armUp(1) } else { armUp(-1); armUp(1) }
      break
    case 'grab':
      rect(ctx, left(36), y - 22, 20, 7, B)
      rect(ctx, left(38), y - 23, 6, 9, D)
      armDown(1)
      break
    case 'hold':
      rect(ctx, left(22), y - 22, 8, 10, B)
      rect(ctx, right(14), y - 22, 8, 10, B)
      blit(ctx, BARREL_SIDE, 'bside', x - 5, y - 26)
      break
    case 'throw':
      armDown(-1)
      rect(ctx, right(16), y - 22, 20, 7, B)
      rect(ctx, right(32), y - 23, 6, 9, D)
      break
    case 'carry':
      rect(ctx, left(20), y - 46, 8, 24, B)
      rect(ctx, right(12), y - 46, 8, 24, B)
      drawPauline(ctx, x, y - 36, beat, false)
      break
  }
  ctx.restore()
}

function drawPauline(ctx: Ctx, x: number, y: number, frame: number, help: boolean) {
  const Hh = '#6b3a1e', S = '#ffb98c', P = '#ff8ad0', K = '#000', R = '#ff2a2a', Wt = '#fff'
  x = Math.round(x)
  y = Math.round(y)
  rect(ctx, x - 6, y - 24, 12, 6, Hh)
  rect(ctx, x - 6, y - 20, 2, 9, Hh)
  rect(ctx, x + 4, y - 20, 2, 9, Hh)
  rect(ctx, x - 4, y - 20, 8, 6, S)
  rect(ctx, x - 3, y - 18, 1, 1, K)
  rect(ctx, x + 2, y - 18, 1, 1, K)
  rect(ctx, x - 1, y - 16, 2, 1, R)
  for (let i = 0; i < 11; i++) {
    const w = 6 + Math.floor(i * 0.7) * 2
    rect(ctx, x - w / 2, y - 14 + i, w, 1, i % 3 === 2 ? Wt : P)
  }
  rect(ctx, x - 3, y - 3, 2, 3, S)
  rect(ctx, x + 1, y - 3, 2, 3, S)
  const wave = Math.floor(frame / 20) % 2 === 0
  rect(ctx, x - 8, wave ? y - 20 : y - 13, 2, 6, S)
  rect(ctx, x + 6, wave ? y - 13 : y - 20, 2, 6, S)
  if (help) drawText(ctx, 'HELP!', x + 10, y - 32, Wt)
}

export const retroArt: Art = {
  clear(ctx) {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)
  },

  platform(ctx, p, g) {
    const x1 = Math.round(p.x1), x2 = Math.round(p.x2)
    for (let x = x1; x < x2; x++) {
      const s = surfaceAt(p, x) ?? surfaceAt(p, x + 0.5)
      if (s !== null) girderColumn(ctx, x, s)
    }
    if (p.kind === 'conveyor' && p.conveyor !== undefined) {
      const grp = g.stage.conveyors[p.conveyor]!
      const dir = grp.dir * (p.mirror ?? 1)
      const y0 = Math.round(p.pts[0]![1])
      const off = Math.floor(g.frame * grp.speed * dir)
      for (let x = x1; x < x2; x++) {
        const on = (((x - off) >> 1) & 1) === 0
        rect(ctx, x, y0, 1, 2, on ? '#ffd83a' : '#7a5a10')
      }
      const gf = GEAR[Math.floor(g.frame / 8) % 2]!
      blit(ctx, gf, 'gear' + (Math.floor(g.frame / 8) % 2), x1, y0, false)
      blit(ctx, gf, 'gear' + (Math.floor(g.frame / 8) % 2), x2 - 8, y0, false)
    }
    for (const h of p.holes) rect(ctx, h - 4, Math.round(surfaceAt(p, h) ?? p.pts[0]![1]), 8, 8, '#000')
  },

  ladder(ctx, l) {
    const x = Math.round(l.x)
    const draw = (y1: number, y2: number) => {
      rect(ctx, x - 4, y1, 1, y2 - y1, LADDER)
      rect(ctx, x + 3, y1, 1, y2 - y1, LADDER)
      for (let y = y1 + 2; y < y2; y += 4) rect(ctx, x - 3, y, 6, 1, LADDER)
    }
    const top = Math.round(l.yTop), bot = Math.round(l.yBottom)
    if (!l.broken) draw(top, bot)
    else { draw(top, top + l.topStub); draw(bot - l.bottomStub, bot) }
  },

  elevatorShaft(ctx, s) {
    rect(ctx, s.x, s.yMin - 6, 1, H - s.yMin, LADDER)
    rect(ctx, s.x - 5, s.yMin - 10, 10, 6, '#ffd83a')
    rect(ctx, s.x - 5, H - 8, 10, 6, '#ffd83a')
  },

  elevatorCar(ctx, p) {
    const y = Math.round(p.pts[0]![1])
    const x = Math.round(p.x1)
    rect(ctx, x, y, Math.round(p.x2 - p.x1), 2, GIRDER)
    rect(ctx, x, y + 2, Math.round(p.x2 - p.x1), 4, GIRDER_DARK)
    for (let i = x; i < p.x2; i += 4) rect(ctx, i, y + 2 + (i >> 2) % 3, 1, 1, GIRDER)
    rect(ctx, x, y + 6, Math.round(p.x2 - p.x1), 1, GIRDER)
  },

  mario(ctx, m, g) {
    const x = Math.round(m.x), y = Math.round(m.y)
    const flip = m.facing < 0
    if (m.state === 'dead') {
      const t = m.deadTimer
      ctx.save()
      ctx.translate(x, y - 8)
      if (t < 120) ctx.rotate((Math.floor(t / 8) % 4) * Math.PI / 2)
      else ctx.rotate(-Math.PI / 2)
      ctx.drawImage(sprite(MARIO_STAND, 'm0', flip), -6, -8)
      ctx.restore()
      if (t >= 120) {
        rect(ctx, x - 4, y - 24, 8, 1, '#fff')
        rect(ctx, x - 5, y - 23, 1, 2, '#fff')
        rect(ctx, x + 4, y - 23, 1, 2, '#fff')
        rect(ctx, x - 4, y - 21, 8, 1, '#fff')
      }
      return
    }
    if (m.state === 'climb') {
      blit(ctx, MARIO_CLIMB, 'mc', x - 6, y - 16, m.climbFrame === 1)
      return
    }
    let map = MARIO_STAND, key = 'm0'
    if (m.state === 'air') { map = MARIO_JUMP; key = 'mj' }
    else if (m.moving) {
      const f = m.walkFrame
      map = f === 1 ? MARIO_WALK1 : f === 2 ? MARIO_WALK2 : MARIO_STAND
      key = 'm' + f
    }
    blit(ctx, map, key, x - 6, y - 16, flip)
    if (m.hammer > 0) {
      const flash = m.hammer < 150 && (g.frame % 8) < 4
      if (flash) return
      if (m.hammerSwing < 8) blit(ctx, HAMMER_UP, 'hu', x - 4, y - 26)
      else if (!flip) blit(ctx, HAMMER_SIDE, 'hs', x + 5, y - 14)
      else blit(ctx, HAMMER_SIDE, 'hs', x - 14, y - 14, true)
    }
  },

  dk: drawDK,
  pauline: drawPauline,

  barrel(ctx, b) {
    const pal = b.blue ? BLUE_PAL : PAL
    if (b.state === 'wild') { blit(ctx, BARREL_SIDE, 'bside', b.x - 5, b.y - 14, false, pal); return }
    const f = Math.floor(b.frame / 6) % 2
    blit(ctx, BARREL_ROLL[f]!, 'br' + f, b.x - 6, b.y - 10, false, pal)
  },

  barrelStack(ctx, x, y) {
    blit(ctx, BARREL_SIDE, 'bside', x - 8, y - 14)
    blit(ctx, BARREL_SIDE, 'bside', x + 2, y - 14)
    blit(ctx, BARREL_SIDE, 'bside', x - 8, y - 28)
    blit(ctx, BARREL_SIDE, 'bside', x + 2, y - 28)
  },

  fireball(ctx, f) {
    const fr = Math.floor(f.frame / 7) % 2
    blit(ctx, FIREBALL[fr]!, 'fb' + fr, f.x - 7, f.y - 14, f.dir < 0)
  },

  pie(ctx, p) { blit(ctx, PIE, 'pie', p.x - 8, p.y - 6) },

  spring(ctx, s, squash) {
    if (squash) blit(ctx, SPRING_SQUASH, 'sq', s.x - 8, s.y - 5)
    else blit(ctx, SPRING, 'sp', s.x - 8, s.y - 9)
  },

  hammer(ctx, x, y) { blit(ctx, HAMMER_UP, 'hu', x - 4, y - 4) },

  item(ctx, it) {
    if (it.type === 'hat') blit(ctx, HAT, 'hat', it.x - 6, it.y - 5)
    else if (it.type === 'purse') blit(ctx, PURSE, 'purse', it.x - 5, it.y - 8)
    else blit(ctx, PARASOL, 'parasol', it.x - 6, it.y - 13)
  },

  rivet(ctx, r) {
    if (r.removed) return
    blit(ctx, RIVET, 'rivet', r.x - 3, r.y + 1)
  },

  drum(ctx, x, y, lit, frame) {
    rect(ctx, x - 8, y - 16, 16, 16, '#2850d8')
    blit(ctx, OIL_DRUM, 'drum', x - 8, y - 14)
    if (lit) {
      const f = Math.floor(frame / 6) % 2
      blit(ctx, FLAME[f]!, 'flame' + f, x - 8, y - 27, f === 1)
    }
  },

  heart(ctx, x, y, broken) { blit(ctx, broken ? HEART_BROKEN : HEART, broken ? 'hb' : 'h', x - 5, y - 8) },

  text: drawText,

  box(ctx, x, y, w, h, color) {
    rect(ctx, x, y, w, h, '#000')
    rect(ctx, x, y, w, 1, color)
    rect(ctx, x, y + h - 1, w, 1, color)
    rect(ctx, x, y, 1, h, color)
    rect(ctx, x + w - 1, y, 1, h, color)
  },

  lifeIcon(ctx, x, y) {
    rect(ctx, x + 1, y, 4, 2, '#ff2a2a')
    rect(ctx, x, y + 2, 6, 2, '#ffb98c')
    rect(ctx, x + 1, y + 4, 4, 3, '#2a5cff')
  },

  overlay(ctx, alpha) {
    ctx.fillStyle = `rgba(0,0,0,${alpha})`
    ctx.fillRect(0, 0, W, H)
  },
}

export type { Mario, Barrel, Fireball, Pie, Spring, Platform, Ladder, Item, Rivet, ElevatorShaft }
