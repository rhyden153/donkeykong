import type { Stage, StageKind, Platform, Ladder, ConveyorGroup, ElevatorShaft, Item, Hammer, Rivet } from './types'
import { surfaceAt } from './geom'
import { PIE_SPEED } from './constants'

class Builder {
  platforms: Platform[] = []
  ladders: Ladder[] = []

  plat(pts: [number, number][], kind: Platform['kind'] = 'girder', extra: Partial<Platform> = {}): Platform {
    const p: Platform = {
      id: this.platforms.length, pts, kind, holes: [],
      x1: pts[0]![0], x2: pts[pts.length - 1]![0], ...extra,
    }
    this.platforms.push(p)
    return p
  }

  ladder(x: number, lower: Platform, upper: Platform, broken = false): Ladder {
    const l: Ladder = {
      x, yTop: surfaceAt(upper, x)!, yBottom: surfaceAt(lower, x)!,
      top: upper.id, bottom: lower.id, broken, topStub: 8, bottomStub: 10,
    }
    this.ladders.push(l)
    return l
  }
}

// hammers hang high enough that Mario has to jump for them, as in the arcade
const hammerOn = (p: Platform, x: number): Hammer => ({ x, y: surfaceAt(p, x)! - 18, taken: false })
const itemOn = (p: Platform, x: number, type: Item['type']): Item => ({ x, y: surfaceAt(p, x)!, type, taken: false })
const rivetOn = (p: Platform, x: number): Rivet => ({ x, y: surfaceAt(p, x)!, platform: p.id, removed: false })

function base(b: Builder, kind: StageKind): Omit<Stage, 'dk' | 'pauline' | 'paulinePlatform' | 'marioStart'> {
  return { kind, platforms: b.platforms, ladders: b.ladders, conveyors: [], elevators: [], rivets: [], hammers: [], items: [] }
}

/** 25m - the sloped girders and rolling barrels. */
function barrels(): Stage {
  const b = new Builder()
  const g1 = b.plat([[0, 248], [112, 248], [224, 241]])
  const g2 = b.plat([[16, 229], [224, 216]])
  const g3 = b.plat([[0, 184], [208, 197]])
  const g4 = b.plat([[16, 165], [224, 152]])
  const g5 = b.plat([[0, 120], [208, 133]])
  const g6 = b.plat([[0, 88], [112, 88], [224, 95]])
  const top = b.plat([[88, 56], [152, 56]])

  b.ladder(184, g1, g2)
  b.ladder(80, g1, g2, true)
  b.ladder(32, g2, g3)
  b.ladder(104, g2, g3)
  b.ladder(176, g2, g3, true)
  b.ladder(184, g3, g4)
  b.ladder(112, g3, g4)
  b.ladder(56, g3, g4, true)
  b.ladder(32, g4, g5)
  b.ladder(112, g4, g5, true)
  b.ladder(168, g4, g5)
  b.ladder(184, g5, g6)
  b.ladder(64, g5, g6, true)
  b.ladder(128, g6, top)

  return {
    ...base(b, 'barrels'),
    hammers: [hammerOn(g2, 160), hammerOn(g5, 20)],
    items: [itemOn(g2, 64, 'purse')],
    drum: { x: 24, y: 248, lit: false },
    dk: { x: 44, y: 88 },
    barrelStack: { x: 8, y: 88 },
    pauline: { x: 118, y: 56 },
    paulinePlatform: top.id,
    marioStart: { x: 56, y: 248 },
  }
}

/** 50m - the pie factory conveyors. */
function pies(): Stage {
  const b = new Builder()
  const conv: ConveyorGroup[] = [
    { dir: 1, speed: PIE_SPEED, timer: 420, spawnTimer: 90, role: 'bottom' },
    { dir: 1, speed: PIE_SPEED, timer: 360, spawnTimer: 150, role: 'middle' },
    { dir: -1, speed: PIE_SPEED, timer: 480, spawnTimer: 200, role: 'top' },
  ]
  const r1 = b.plat([[0, 248], [224, 248]], 'conveyor', { conveyor: 0, mirror: 1 })
  const r2l = b.plat([[0, 208], [48, 208]])
  const r2r = b.plat([[176, 208], [224, 208]])
  const r3l = b.plat([[0, 168], [104, 168]], 'conveyor', { conveyor: 1, mirror: 1 })
  const r3r = b.plat([[120, 168], [224, 168]], 'conveyor', { conveyor: 1, mirror: -1 })
  const r4l = b.plat([[0, 128], [56, 128]])
  const r4c = b.plat([[80, 128], [144, 128]])
  const r4r = b.plat([[168, 128], [224, 128]])
  const r5 = b.plat([[0, 88], [224, 88]], 'conveyor', { conveyor: 2, mirror: 1 })
  const top = b.plat([[88, 56], [152, 56]])

  b.ladder(40, r1, r2l)
  b.ladder(184, r1, r2r)
  b.ladder(8, r2l, r3l)
  b.ladder(216, r2r, r3r)
  b.ladder(40, r3l, r4l)
  b.ladder(184, r3r, r4r)
  b.ladder(88, r3l, r4c)
  b.ladder(136, r3r, r4c)
  b.ladder(48, r4l, r5)
  b.ladder(176, r4r, r5)
  b.ladder(112, r4c, r5)
  b.ladder(128, r5, top)

  return {
    ...base(b, 'pies'),
    conveyors: conv,
    hammers: [hammerOn(r4c, 100), hammerOn(r2r, 200)],
    items: [itemOn(r2l, 20, 'parasol'), itemOn(r4r, 208, 'hat')],
    drum: { x: 112, y: 168, lit: true },
    dk: { x: 40, y: 88 },
    pauline: { x: 118, y: 56 },
    paulinePlatform: top.id,
    marioStart: { x: 16, y: 248 },
  }
}

/** 75m - elevators and springs. */
function elevators(): Stage {
  const b = new Builder()
  const topG = b.plat([[0, 88], [224, 88]])
  const paul = b.plat([[96, 56], [160, 56]])
  const l1 = b.plat([[0, 248], [40, 248]])
  const l2 = b.plat([[0, 200], [40, 200]])
  const l3 = b.plat([[0, 152], [40, 152]])
  const c1 = b.plat([[76, 224], [116, 224]])
  const c2 = b.plat([[76, 176], [116, 176]])
  const c3 = b.plat([[76, 128], [116, 128]])
  const r3 = b.plat([[160, 216], [224, 216]])
  const r2 = b.plat([[160, 176], [224, 176]])
  const r1 = b.plat([[168, 136], [224, 136]])

  b.ladder(28, l1, l2)
  b.ladder(12, l2, l3)
  b.ladder(84, c1, c2)
  b.ladder(108, c2, c3)
  b.ladder(184, r3, r2)
  b.ladder(176, r2, r1)
  b.ladder(208, r1, topG)
  b.ladder(128, topG, paul)

  const shafts: ElevatorShaft[] = [
    { x: 58, w: 20, dir: -1, count: 3, spacing: 56, yMin: 96, yMax: 264 },
    { x: 134, w: 20, dir: 1, count: 3, spacing: 56, yMin: 96, yMax: 264 },
  ]

  return {
    ...base(b, 'elevators'),
    elevators: shafts,
    items: [itemOn(l3, 20, 'parasol'), itemOn(r1, 192, 'hat'), itemOn(c3, 96, 'purse')],
    dk: { x: 28, y: 88 },
    pauline: { x: 128, y: 56 },
    paulinePlatform: paul.id,
    marioStart: { x: 16, y: 248 },
    springSpawn: { x: 56, y: 88 },
    springDropX: 200,
  }
}

/** 100m - the rivet tower. */
function rivets(): Stage {
  const b = new Builder()
  const g = b.plat([[0, 248], [224, 248]], 'ground')
  const r1 = b.plat([[16, 208], [208, 208]])
  const r2 = b.plat([[32, 168], [192, 168]])
  const r3 = b.plat([[48, 128], [176, 128]])
  const r4 = b.plat([[64, 88], [160, 88]])
  const paul = b.plat([[96, 46], [136, 46]])

  b.ladder(24, g, r1)
  b.ladder(200, g, r1)
  b.ladder(112, g, r1)
  b.ladder(40, r1, r2)
  b.ladder(184, r1, r2)
  b.ladder(112, r1, r2)
  b.ladder(56, r2, r3)
  b.ladder(168, r2, r3)
  b.ladder(112, r2, r3)
  b.ladder(72, r3, r4)
  b.ladder(152, r3, r4)

  return {
    ...base(b, 'rivets'),
    rivets: [
      rivetOn(r1, 32), rivetOn(r1, 192),
      rivetOn(r2, 48), rivetOn(r2, 176),
      rivetOn(r3, 64), rivetOn(r3, 160),
      rivetOn(r4, 80), rivetOn(r4, 144),
    ],
    hammers: [hammerOn(r1, 80), hammerOn(r3, 140)],
    items: [itemOn(r2, 128, 'hat'), itemOn(g, 140, 'purse')],
    dk: { x: 112, y: 88 },
    pauline: { x: 118, y: 46 },
    paulinePlatform: paul.id,
    topPlatform: r4.id,
    marioStart: { x: 16, y: 248 },
  }
}

export function buildStage(kind: StageKind): Stage {
  switch (kind) {
    case 'barrels': return barrels()
    case 'pies': return pies()
    case 'elevators': return elevators()
    case 'rivets': return rivets()
  }
}

export const STAGE_ORDER: StageKind[] = ['barrels', 'pies', 'elevators', 'rivets']
export const STAGE_NAMES: Record<StageKind, string> = {
  barrels: '25m', pies: '50m', elevators: '75m', rivets: '100m',
}
