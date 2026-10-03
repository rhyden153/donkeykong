import type { Stage, StageKind, Platform, Ladder, Gfx, Pt } from './types'
import { buildStage, STAGE_ORDER } from './levels'
import { surfaceAt, slopeDir, standingOn, landingBetween, overlap } from './geom'
import { Sfx } from './audio'
import {
  W, H, MARIO_SPEED, MARIO_JUMP_VY, GRAVITY, CLIMB_SPEED, FALL_KILL, HAMMER_FRAMES,
  BARREL_GRAVITY, FIREBALL_SPEED, ELEV_SPEED, SPRING_VX, SPRING_VY, SPRING_G,
  SCORE_JUMP, SCORE_SMASH, SCORE_RIVET, EXTRA_LIFE_AT, START_LIVES,
} from './constants'

export type Scene = 'title' | 'howhigh' | 'play' | 'dying' | 'clear' | 'rivetclear' | 'gameover'
export type DkPose = 'idle' | 'grab' | 'hold' | 'throw' | 'fall' | 'down' | 'carry'

export interface Input {
  left: boolean; right: boolean; up: boolean; down: boolean
  jump: boolean; jumpPressed: boolean; startPressed: boolean
}

export interface Mario {
  x: number; y: number; vx: number; vy: number; facing: 1 | -1
  state: 'walk' | 'air' | 'climb' | 'dead'
  moving: boolean; walkFrame: number; walkTick: number
  onPlatform: Platform | null
  ladder: Ladder | null; climbTick: number; climbFrame: number
  hammer: number; hammerSwing: number
  airStartY: number; jumped: Set<object>
  deadTimer: number
}

export interface Barrel {
  x: number; y: number; vx: number; vy: number; dir: 1 | -1
  state: 'roll' | 'fall' | 'ladder' | 'wild'
  blue: boolean; platform: Platform | null; ladder: Ladder | null
  frame: number; bounces: number
}

export interface Fireball {
  x: number; y: number; dir: 1 | -1; speed: number
  state: 'walk' | 'climb' | 'emerge'
  platform: Platform | null; ladder: Ladder | null; climbDir: number
  decide: number; cooldown: number; frame: number; vy: number
}

export interface Pie { x: number; y: number; platform: Platform; group: number }
export interface Spring { x: number; y: number; vx: number; vy: number; drop: boolean }
export interface Popup { x: number; y: number; text: string; t: number }

const HI_KEY = 'dk-hiscore'
const GFX_KEY = 'dk-gfx'

export class Game {
  scene: Scene = 'title'
  gfx: Gfx = 'retro'
  input: Input = { left: false, right: false, up: false, down: false, jump: false, jumpPressed: false, startPressed: false }
  sfx = new Sfx()
  paused = false

  level = 1
  stageIdx = 0
  score = 0
  hi = 0
  lives = START_LIVES
  bonus = 0
  bonusTick = 0
  extraLifeGiven = false

  frame = 0
  sceneTimer = 0
  stage: Stage = buildStage('barrels')
  mario: Mario = this.newMario()
  barrels: Barrel[] = []
  fireballs: Fireball[] = []
  pies: Pie[] = []
  springs: Spring[] = []
  popups: Popup[] = []
  dk = { pose: 'idle' as DkPose, timer: 0, nextThrow: 90, thrown: 0, y: 0, vy: 0, beat: 0 }
  elevT = 0
  springTimer = 0
  fireSpawnTimer = 0
  hammerNoteIdx = 0
  showHeart = false
  titleTick = 0

  constructor() {
    if (typeof localStorage !== 'undefined') {
      this.hi = Number(localStorage.getItem(HI_KEY) || 0) || 0
      const g = localStorage.getItem(GFX_KEY)
      if (g === 'retro' || g === 'modern') this.gfx = g
    }
  }

  // ---------------------------------------------------------------- helpers
  get difficulty() { return Math.min(this.level, 5) }
  get stageKind(): StageKind { return STAGE_ORDER[this.stageIdx]! }
  /** Height label as shown on the "how high" screen. */
  get heightMeters() { return (this.level - 1) * 100 + (this.stageIdx + 1) * 25 }

  setGfx(g: Gfx) {
    this.gfx = g
    if (typeof localStorage !== 'undefined') localStorage.setItem(GFX_KEY, g)
  }

  private newMario(): Mario {
    return {
      x: 0, y: 0, vx: 0, vy: 0, facing: 1, state: 'walk', moving: false, walkFrame: 0, walkTick: 0,
      onPlatform: null, ladder: null, climbTick: 0, climbFrame: 0, hammer: 0, hammerSwing: 0,
      airStartY: 0, jumped: new Set(), deadTimer: 0,
    }
  }

  addScore(n: number) {
    this.score += n
    if (!this.extraLifeGiven && this.score >= EXTRA_LIFE_AT) {
      this.extraLifeGiven = true
      this.lives++
      this.sfx.extraLife()
    }
    if (this.score > this.hi) {
      this.hi = this.score
      if (typeof localStorage !== 'undefined') localStorage.setItem(HI_KEY, String(this.hi))
    }
  }

  popup(x: number, y: number, text: string) {
    this.popups.push({ x, y, text, t: 60 })
  }

  elevY(shaft: number, k: number): number {
    const s = this.stage.elevators[shaft]!
    const range = s.yMax - s.yMin
    const t = (((this.elevT + k * s.spacing) % range) + range) % range
    return s.dir < 0 ? s.yMax - t : s.yMin + t
  }

  elevPlatform(shaft: number, k: number): Platform {
    const s = this.stage.elevators[shaft]!
    const y = this.elevY(shaft, k)
    return {
      id: 1000 + shaft * 10 + k, kind: 'elevator', holes: [], shaft, idx: k,
      pts: [[s.x - s.w / 2, y], [s.x + s.w / 2, y]], x1: s.x - s.w / 2, x2: s.x + s.w / 2,
    }
  }

  /** All platforms including the moving elevator cars for this frame. */
  plats(): Platform[] {
    const out = this.stage.platforms.slice()
    this.stage.elevators.forEach((s, si) => {
      for (let k = 0; k < s.count; k++) out.push(this.elevPlatform(si, k))
    })
    return out
  }

  // ---------------------------------------------------------------- flow
  startGame() {
    this.level = 1
    this.stageIdx = 0
    this.score = 0
    this.lives = START_LIVES
    this.extraLifeGiven = false
    this.gotoHowHigh()
  }

  gotoHowHigh() {
    this.loadStage()
    this.scene = 'howhigh'
    this.sceneTimer = 160
    this.sfx.howHigh()
  }

  loadStage() {
    this.stage = buildStage(this.stageKind)
    this.resetEntities()
  }

  resetEntities() {
    const st = this.stage
    this.mario = this.newMario()
    this.mario.x = st.marioStart.x
    this.mario.y = st.marioStart.y
    this.mario.onPlatform = standingOn(st.platforms, st.marioStart.x, st.marioStart.y, 4)?.p ?? null
    this.barrels = []
    this.fireballs = []
    this.pies = []
    this.springs = []
    this.popups = []
    this.dk = { pose: 'idle', timer: 0, nextThrow: 90, thrown: 0, y: st.dk.y, vy: 0, beat: 0 }
    for (const h of st.hammers) h.taken = false
    for (const it of st.items) it.taken = false
    if (st.drum) st.drum.lit = st.kind !== 'barrels'
    for (const c of st.conveyors) { c.timer = 300 + Math.random() * 300; c.spawnTimer = 60 + Math.random() * 60 }
    this.elevT = 0
    this.springTimer = 90
    this.fireSpawnTimer = 120
    this.showHeart = false
    this.bonus = Math.min(5000 + 1000 * (this.level - 1), 8000)
    this.bonusTick = 0
    if (st.kind === 'elevators') this.spawnFireballAt(96, 224)
  }

  private bonusInterval() { return Math.max(60, 120 - 12 * (this.level - 1)) }

  private nextStage() {
    this.stageIdx++
    if (this.stageIdx >= STAGE_ORDER.length) {
      this.stageIdx = 0
      this.level++
    }
    this.gotoHowHigh()
  }

  // ---------------------------------------------------------------- main step
  step() {
    const inp = this.input
    this.frame++
    if (inp.startPressed && (this.scene === 'play' || this.scene === 'dying')) {
      this.paused = !this.paused
    }
    if (this.paused) { inp.jumpPressed = false; inp.startPressed = false; return }

    switch (this.scene) {
      case 'title':
        this.titleTick++
        if (inp.startPressed || inp.jumpPressed) { this.sfx.init(); this.startGame() }
        break
      case 'howhigh':
        if (--this.sceneTimer <= 0) this.scene = 'play'
        break
      case 'play':
        this.updatePlay()
        break
      case 'dying':
        this.updateDying()
        break
      case 'clear':
        this.updateClear()
        break
      case 'rivetclear':
        this.updateRivetClear()
        break
      case 'gameover':
        if (--this.sceneTimer <= 0 || inp.startPressed) this.scene = 'title'
        break
    }
    inp.jumpPressed = false
    inp.startPressed = false
  }

  // ---------------------------------------------------------------- play
  private updatePlay() {
    this.updateConveyors()
    if (this.stage.elevators.length) this.elevT += ELEV_SPEED
    this.updateMario()
    if (this.scene !== 'play') return
    this.updateDK()
    this.updateBarrels()
    this.updateFireballs()
    this.updatePies()
    this.updateSprings()
    this.checkHazards()
    if (this.scene !== 'play') return
    this.updateBonus()
    this.updatePopups()
    this.checkGoal()
    // ambient beat / hammer theme
    if (this.mario.hammer > 0) {
      if (this.frame % 9 === 0) this.sfx.hammerNote(this.hammerNoteIdx++)
    } else if (this.frame % 40 === 0) {
      this.sfx.thump()
    }
  }

  private updateBonus() {
    if (++this.bonusTick >= this.bonusInterval()) {
      this.bonusTick = 0
      this.bonus = Math.max(0, this.bonus - 100)
      if (this.bonus === 0) this.killMario()
    }
  }

  private updatePopups() {
    for (const p of this.popups) { p.t--; p.y -= 0.15 }
    this.popups = this.popups.filter(p => p.t > 0)
  }

  private checkGoal() {
    const m = this.mario
    if (this.stage.kind === 'rivets') return
    if (m.state === 'walk' && m.onPlatform && m.onPlatform.id === this.stage.paulinePlatform) {
      this.scene = 'clear'
      this.sceneTimer = 200
      this.showHeart = true
      this.sfx.clear()
    }
  }

  // ---------------------------------------------------------------- Mario
  private updateMario() {
    const m = this.mario
    const inp = this.input
    const plats = this.plats()
    const st = this.stage

    if (m.hammer > 0) {
      m.hammer--
      m.hammerSwing = (m.hammerSwing + 1) % 16
    }

    if (m.state === 'climb') {
      const l = m.ladder!
      let dy = 0
      if (inp.up) dy = -CLIMB_SPEED
      else if (inp.down) dy = CLIMB_SPEED
      if (dy !== 0) {
        m.y += dy
        if (++m.climbTick % 8 === 0) m.climbFrame ^= 1
        const topLimit = l.broken && m.y > l.yTop + l.topStub + 1 ? l.yBottom - l.bottomStub : l.yTop
        const botLimit = l.broken && m.y < l.yBottom - l.bottomStub - 1 ? l.yTop + l.topStub : l.yBottom
        if (m.y <= topLimit) {
          m.y = topLimit
          if (topLimit === l.yTop) this.leaveLadder(plats)
        } else if (m.y >= botLimit) {
          m.y = botLimit
          if (botLimit === l.yBottom) this.leaveLadder(plats)
        }
      }
      return
    }

    if (m.state === 'air') {
      m.x += m.vx
      m.x = Math.max(6, Math.min(W - 6, m.x))
      const prevY = m.y
      m.vy += GRAVITY
      const newY = m.y + m.vy
      const land = m.vy > 0 ? landingBetween(plats, m.x, prevY, newY) : null
      if (land) {
        m.y = land.y
        m.onPlatform = land.p
        m.state = 'walk'
        m.vx = 0
        m.vy = 0
        if (m.y - m.airStartY > FALL_KILL) { this.killMario(); return }
        const n = m.jumped.size
        if (n > 0) {
          const pts = SCORE_JUMP[Math.min(n, 3) - 1]!
          this.addScore(pts)
          this.popup(m.x, m.y - 20, String(pts))
          this.sfx.score()
        }
        m.jumped.clear()
      } else {
        m.y = newY
        // count hazards passing under Mario
        for (const b of this.barrels) this.noteJumped(b, b.x, b.y)
        for (const f of this.fireballs) this.noteJumped(f, f.x, f.y)
        for (const p of this.pies) this.noteJumped(p, p.x, p.y)
        for (const s of this.springs) this.noteJumped(s, s.x, s.y)
        if (m.y > H + 20) { this.killMario(); return }
      }
      this.checkRivets()
      this.checkPickups()
      return
    }

    // ---- walking
    // carried by the platform we stand on
    if (m.onPlatform) {
      const p = m.onPlatform
      if (p.kind === 'conveyor' && p.conveyor !== undefined) {
        const g = st.conveyors[p.conveyor]!
        m.x += g.dir * (p.mirror ?? 1) * g.speed
      }
      if (p.kind === 'elevator' && p.shaft !== undefined && p.idx !== undefined) {
        const np = this.elevPlatform(p.shaft, p.idx)
        m.onPlatform = np
        m.y = np.pts[0]![1]
        const s = st.elevators[p.shaft]!
        if (s.dir < 0 && m.y <= s.yMin + 4) { this.killMario(); return }
        if (s.dir > 0 && m.y >= H - 4) { this.killMario(); return }
      }
    }

    m.moving = false
    if (inp.left !== inp.right) {
      const dir = inp.left ? -1 : 1
      m.facing = dir
      m.x += dir * MARIO_SPEED
      m.moving = true
      if (++m.walkTick % 6 === 0) {
        m.walkFrame = (m.walkFrame + 1) % 3
        if (m.walkFrame === 1) this.sfx.walk()
      }
    } else {
      m.walkFrame = 0
    }
    m.x = Math.max(6, Math.min(W - 6, m.x))

    // ladders
    if (m.hammer === 0 && (inp.up || inp.down)) {
      for (const l of st.ladders) {
        if (Math.abs(m.x - l.x) > 4) continue
        if (inp.up && Math.abs(m.y - l.yBottom) <= 2) { this.enterLadder(l); return }
        if (inp.down && Math.abs(m.y - l.yTop) <= 2) { this.enterLadder(l); m.y += 0.5; return }
      }
    }

    // support
    const sup = standingOn(plats, m.x, m.y, 4)
    if (sup) {
      m.y = sup.y
      m.onPlatform = sup.p
    } else {
      m.state = 'air'
      m.vx = 0
      m.vy = 0
      m.airStartY = m.y
      m.onPlatform = null
      m.jumped.clear()
      return
    }

    // jump
    if (inp.jumpPressed && m.hammer === 0) {
      m.state = 'air'
      m.vy = MARIO_JUMP_VY
      m.vx = m.moving ? m.facing * MARIO_SPEED : 0
      m.airStartY = m.y
      m.onPlatform = null
      m.jumped.clear()
      this.sfx.jump()
    }

    this.checkRivets()
    this.checkPickups()
  }

  private enterLadder(l: Ladder) {
    const m = this.mario
    m.state = 'climb'
    m.ladder = l
    m.x = l.x
    m.vx = 0
    m.vy = 0
    m.onPlatform = null
    m.climbTick = 0
  }

  private leaveLadder(plats: Platform[]) {
    const m = this.mario
    m.state = 'walk'
    m.ladder = null
    const sup = standingOn(plats, m.x, m.y, 4)
    if (sup) { m.y = sup.y; m.onPlatform = sup.p }
  }

  private noteJumped(obj: object, x: number, y: number) {
    const m = this.mario
    if (Math.abs(x - m.x) < 7 && y > m.y && y - m.y < 34) m.jumped.add(obj)
  }

  private checkRivets() {
    const m = this.mario
    if (this.stage.kind !== 'rivets') return
    for (const r of this.stage.rivets) {
      if (r.removed) continue
      if (Math.abs(m.x - r.x) < 2.6 && m.y <= r.y + 1 && m.y >= r.y - 26) {
        r.removed = true
        const p = this.stage.platforms[r.platform]!
        p.holes.push(r.x)
        this.addScore(SCORE_RIVET)
        this.popup(r.x, r.y - 16, String(SCORE_RIVET))
        this.sfx.rivet()
        if (this.stage.rivets.every(x => x.removed)) {
          this.scene = 'rivetclear'
          this.sceneTimer = 330
          this.dk.pose = 'idle'
          this.dk.vy = 0
          this.sfx.clear()
        }
      }
    }
  }

  private checkPickups() {
    const m = this.mario
    const st = this.stage
    for (const h of st.hammers) {
      if (h.taken || m.hammer > 0) continue
      if (Math.abs(m.x - h.x) < 7 && m.y - 14 < h.y + 4 && m.y > h.y - 6) {
        h.taken = true
        m.hammer = HAMMER_FRAMES
        m.hammerSwing = 0
        this.hammerNoteIdx = 0
        this.sfx.hammerGrab()
      }
    }
    for (const it of st.items) {
      if (it.taken) continue
      if (Math.abs(m.x - it.x) < 8 && Math.abs(m.y - it.y) < 10) {
        it.taken = true
        const pts = this.level === 1 ? 300 : this.level === 2 ? 500 : 800
        this.addScore(pts)
        this.popup(it.x, it.y - 16, String(pts))
        this.sfx.pickup()
      }
    }
  }

  killMario() {
    if (this.scene !== 'play') return
    const m = this.mario
    m.state = 'dead'
    m.deadTimer = 0
    m.hammer = 0
    this.scene = 'dying'
    this.sceneTimer = 190
    this.sfx.die()
  }

  private updateDying() {
    this.mario.deadTimer++
    if (--this.sceneTimer <= 0) {
      this.lives--
      if (this.lives <= 0) {
        this.scene = 'gameover'
        this.sceneTimer = 240
        this.sfx.gameOver()
      } else {
        this.resetEntities()
        this.scene = 'play'
      }
    }
  }

  private updateClear() {
    this.sceneTimer--
    if (this.sceneTimer === 150) this.dk.pose = 'carry'
    if (this.sceneTimer === 100) {
      this.addScore(this.bonus)
      this.popup(this.mario.x, this.mario.y - 24, String(this.bonus))
      this.bonus = 0
    }
    this.updatePopups()
    if (this.sceneTimer <= 0) this.nextStage()
  }

  private updateRivetClear() {
    const st = this.stage
    this.sceneTimer--
    const top = st.platforms[st.topPlatform!]!
    if (this.sceneTimer === 260) {
      top.hidden = true
      this.dk.pose = 'fall'
      this.dk.vy = 0
    }
    if (this.dk.pose === 'fall') {
      this.dk.vy += 0.12
      this.dk.y += this.dk.vy
      if (this.dk.y >= 248) {
        this.dk.y = 248
        this.dk.pose = 'down'
        this.sfx.smash()
        this.showHeart = true
      }
    }
    if (this.sceneTimer === 90) {
      this.addScore(this.bonus)
      this.popup(this.mario.x, this.mario.y - 24, String(this.bonus))
      this.bonus = 0
    }
    this.updatePopups()
    if (this.sceneTimer <= 0) this.nextStage()
  }

  // ---------------------------------------------------------------- Donkey Kong
  private updateDK() {
    const d = this.dk
    d.beat++
    if (this.stage.kind !== 'barrels') return
    d.timer++
    switch (d.pose) {
      case 'idle':
        if (d.timer >= d.nextThrow) { d.pose = 'grab'; d.timer = 0 }
        break
      case 'grab':
        if (d.timer >= 18) { d.pose = 'hold'; d.timer = 0 }
        break
      case 'hold':
        if (d.timer >= 18) {
          d.timer = 0
          if (d.thrown === 0) {
            this.spawnWildBarrel(true)
            d.pose = 'idle'
            d.nextThrow = this.throwInterval()
          } else if (this.level >= 2 && Math.random() < 0.12) {
            this.spawnWildBarrel(false)
            d.pose = 'idle'
            d.nextThrow = this.throwInterval()
          } else {
            d.pose = 'throw'
          }
        }
        break
      case 'throw':
        if (d.timer === 6) this.spawnBarrel()
        if (d.timer >= 16) { d.pose = 'idle'; d.timer = 0; d.nextThrow = this.throwInterval() }
        break
    }
  }

  private throwInterval() {
    const base = Math.max(55, 130 - 14 * (this.difficulty - 1))
    return base + Math.random() * base * 0.6
  }

  private barrelSpeed() { return 1.0 + 0.09 * (this.difficulty - 1) }

  private spawnBarrel() {
    const st = this.stage
    const d = this.dk
    d.thrown++
    const top = st.platforms[5]!
    const x = st.dk.x + 22
    this.barrels.push({
      x, y: surfaceAt(top, x) ?? st.dk.y, vx: 0, vy: 0, dir: 1, state: 'roll',
      blue: d.thrown % 8 === 0, platform: top, ladder: null, frame: 0, bounces: 0,
    })
    this.sfx.roll()
  }

  private spawnWildBarrel(first: boolean) {
    const st = this.stage
    this.dk.thrown++
    if (first) {
      this.barrels.push({ x: 22, y: st.dk.y, vx: 0, vy: 0, dir: -1, state: 'wild', blue: true, platform: null, ladder: null, frame: 0, bounces: 0 })
    } else {
      this.barrels.push({ x: st.dk.x + 22, y: st.dk.y, vx: 0.9, vy: -1, dir: 1, state: 'wild', blue: false, platform: null, ladder: null, frame: 0, bounces: 0 })
    }
  }

  // ---------------------------------------------------------------- barrels
  private updateBarrels() {
    const st = this.stage
    const plats = st.platforms
    const speed = this.barrelSpeed()
    const m = this.mario
    const keep: Barrel[] = []
    for (const b of this.barrels) {
      b.frame++
      if (b.state === 'wild') {
        const prevY = b.y
        b.vy += BARREL_GRAVITY
        b.y += b.vy
        b.x += b.vx
        if (b.x < 6 || b.x > W - 6) { b.vx = -b.vx; b.x = Math.max(6, Math.min(W - 6, b.x)) }
        const land = b.vy > 0 ? landingBetween(plats, b.x, prevY, b.y) : null
        if (land) {
          b.y = land.y
          b.bounces++
          if (st.drum && land.p.id === 0 && b.x < 40) {
            this.igniteDrum()
            continue
          }
          b.vy = b.vx === 0 ? -1.4 : -2.0
        }
        if (b.y > H + 10) continue
        keep.push(b)
        continue
      }

      if (b.state === 'ladder') {
        const l = b.ladder!
        b.y += speed
        if (b.y >= l.yBottom) {
          b.y = l.yBottom
          b.platform = plats[l.bottom]!
          b.state = 'roll'
          b.dir = (slopeDir(b.platform, b.x) || b.dir) as 1 | -1
        }
        keep.push(b)
        continue
      }

      if (b.state === 'fall') {
        const prevY = b.y
        b.vy += BARREL_GRAVITY
        b.y += b.vy
        b.x += b.vx
        const land = landingBetween(plats, b.x, prevY, b.y)
        if (land) {
          b.y = land.y
          b.platform = land.p
          b.state = 'roll'
          b.vy = 0
          b.vx = 0
          const sd = slopeDir(land.p, b.x)
          b.dir = (sd || -b.dir) as 1 | -1
        } else if (b.y > H + 10) {
          continue
        }
        keep.push(b)
        continue
      }

      // rolling
      const p = b.platform!
      const sp = speed * (slopeDir(p, b.x) === b.dir ? 1.12 : 1)
      const prevX = b.x
      b.x += b.dir * sp
      const s = surfaceAt(p, b.x)
      if (s === null) {
        b.state = 'fall'
        b.vx = b.dir * 0.35
        b.vy = 0
        keep.push(b)
        continue
      }
      b.y = s
      // bottom girder: roll into the oil drum
      if (st.drum && p.id === 0 && b.x <= st.drum.x + 10) {
        if (b.blue) this.igniteDrum()
        continue
      }
      // take a ladder down?
      for (const l of st.ladders) {
        if (l.top !== p.id) continue
        if ((prevX - l.x) * (b.x - l.x) > 0) continue
        let chance = 0.22 + 0.06 * (this.difficulty - 1)
        if (m.y > b.y + 8 && Math.abs(m.x - l.x) < 40) chance += 0.35
        if (m.y < b.y - 8) chance -= 0.1
        if (Math.random() < chance) {
          b.state = 'ladder'
          b.ladder = l
          b.x = l.x
          break
        }
      }
      keep.push(b)
    }
    this.barrels = keep
  }

  private igniteDrum() {
    const st = this.stage
    if (!st.drum) return
    st.drum.lit = true
    const max = Math.min(1 + Math.floor((this.difficulty - 1) / 2) + (this.level >= 4 ? 1 : 0), 3)
    if (this.fireballs.length < max) this.spawnFireballAt(st.drum.x + 10, st.drum.y, 1)
  }

  // ---------------------------------------------------------------- fireballs
  private spawnFireballAt(x: number, y: number, dir: 1 | -1 = 1) {
    const plats = this.stage.platforms
    const sup = standingOn(plats, x, y, 6)
    this.fireballs.push({
      x, y: sup ? sup.y : y, dir, speed: FIREBALL_SPEED + 0.05 * (this.difficulty - 1),
      state: 'emerge', platform: sup?.p ?? null, ladder: null, climbDir: 0,
      decide: 60, cooldown: 60, frame: 0, vy: -1.6,
    })
  }

  private updateFireballs() {
    const st = this.stage
    const plats = st.platforms
    const m = this.mario
    // periodic spawns on the pie factory and rivet stages
    if (st.kind === 'pies' || st.kind === 'rivets') {
      const max = st.kind === 'pies' ? Math.min(2 + Math.floor(this.difficulty / 2), 4) : Math.min(2 + Math.floor(this.difficulty / 2), 5)
      if (this.fireballs.length < max && --this.fireSpawnTimer <= 0) {
        this.fireSpawnTimer = 300
        if (st.kind === 'pies' && st.drum) {
          const dir = Math.random() < 0.5 ? -1 : 1
          this.spawnFireballAt(st.drum.x + dir * 14, st.drum.y, dir)
        } else {
          const left = this.fireballs.length % 2 === 0
          this.spawnFireballAt(left ? 10 : W - 10, 248, left ? 1 : -1)
        }
      }
    }
    if (st.kind === 'elevators' && this.level >= 3 && this.fireballs.length < 2 && --this.fireSpawnTimer <= 0) {
      this.fireSpawnTimer = 600
      this.spawnFireballAt(190, 176, -1)
    }

    for (const f of this.fireballs) {
      f.frame++
      if (f.state === 'emerge') {
        f.vy += 0.1
        f.y += f.vy
        f.x += f.dir * 0.5
        if (f.vy > 0) {
          const sup = standingOn(plats, f.x, f.y, 4)
          if (sup) { f.y = sup.y; f.platform = sup.p; f.state = 'walk' }
          else if (f.y > 250) { f.y = 248; f.platform = standingOn(plats, f.x, 248, 4)?.p ?? null; f.state = 'walk' }
        }
        continue
      }
      if (f.state === 'climb') {
        const l = f.ladder!
        f.y += f.climbDir * f.speed
        if ((f.climbDir < 0 && f.y <= l.yTop) || (f.climbDir > 0 && f.y >= l.yBottom)) {
          f.y = f.climbDir < 0 ? l.yTop : l.yBottom
          f.platform = plats[f.climbDir < 0 ? l.top : l.bottom]!
          f.state = 'walk'
          f.cooldown = 120
          f.dir = (Math.random() < 0.5 ? -1 : 1)
        }
        continue
      }
      // walking
      if (!f.platform || f.platform.hidden) {
        const sup = standingOn(plats, f.x, f.y, 6)
        if (!sup) continue
        f.platform = sup.p
      }
      const p = f.platform
      const sp = f.speed * (this.bonus <= 1000 ? 1.5 : 1)
      const nx = f.x + f.dir * sp
      const s = surfaceAt(p, nx)
      if (s === null || nx < 6 || nx > W - 6) {
        f.dir = -f.dir as 1 | -1
      } else {
        f.x = nx
        f.y = s
      }
      if (st.kind === 'pies' && st.drum && Math.abs(f.x - st.drum.x) < 14 && Math.abs(f.y - st.drum.y) < 4) {
        f.dir = (f.x < st.drum.x ? -1 : 1)
        f.x += f.dir * 2
      }
      if (--f.decide <= 0) {
        f.decide = 50 + Math.random() * 90
        if (Math.random() < 0.55) f.dir = (m.x < f.x ? -1 : 1)
        else if (Math.random() < 0.5) f.dir = -f.dir as 1 | -1
      }
      if (f.cooldown > 0) { f.cooldown--; continue }
      for (const l of st.ladders) {
        if (l.broken || Math.abs(f.x - l.x) > 1.2) continue
        const atBottom = l.bottom === p.id && Math.abs(f.y - l.yBottom) < 3
        const atTop = l.top === p.id && Math.abs(f.y - l.yTop) < 3
        if (!atBottom && !atTop) continue
        if (l.top === st.paulinePlatform) continue
        const wantUp = m.y < f.y - 8
        const wantDown = m.y > f.y + 8
        let chance = 0.18
        if (atBottom && wantUp) chance = 0.6
        if (atTop && wantDown) chance = 0.6
        if (Math.random() < chance) {
          f.state = 'climb'
          f.ladder = l
          f.climbDir = atBottom ? -1 : 1
          f.x = l.x
          break
        }
      }
    }
  }

  // ---------------------------------------------------------------- conveyors / pies
  private updateConveyors() {
    const st = this.stage
    if (st.kind !== 'pies') return
    for (const g of st.conveyors) {
      if (--g.timer <= 0) {
        g.dir = (g.dir === 1 ? -1 : 1)
        g.timer = 360 + Math.random() * 360
      }
    }
  }

  private updatePies() {
    const st = this.stage
    if (st.kind !== 'pies') return
    const spawnEvery = Math.max(110, 230 - 25 * (this.difficulty - 1))
    st.conveyors.forEach((g, gi) => {
      if (--g.spawnTimer > 0) return
      g.spawnTimer = spawnEvery + Math.random() * 60
      const segs = st.platforms.filter(p => p.conveyor === gi)
      if (g.role === 'middle') {
        for (const p of segs) {
          const mv = g.dir * (p.mirror ?? 1)                 // actual movement of this segment
          const inward = (p.mirror ?? 1) === 1 ? mv > 0 : mv < 0
          const x = inward ? (mv > 0 ? p.x1 - 6 : p.x2 + 6) : (mv > 0 ? p.x1 + 2 : p.x2 - 2)
          this.pies.push({ x, y: p.pts[0]![1], platform: p, group: gi })
        }
      } else {
        const p = segs[0]!
        const x = g.dir > 0 ? p.x1 - 6 : p.x2 + 6
        this.pies.push({ x, y: p.pts[0]![1], platform: p, group: gi })
      }
    })
    const keep: Pie[] = []
    for (const pie of this.pies) {
      const g = st.conveyors[pie.group]!
      const p = pie.platform
      const mv = g.dir * (p.mirror ?? 1) * g.speed
      pie.x += mv
      if (pie.x < p.x1 - 8 || pie.x > p.x2 + 8) continue
      if (g.role === 'middle' && st.drum && Math.abs(pie.x - st.drum.x) < 10) continue
      keep.push(pie)
    }
    this.pies = keep
  }

  // ---------------------------------------------------------------- springs
  private updateSprings() {
    const st = this.stage
    if (st.kind !== 'elevators' || !st.springSpawn) return
    if (--this.springTimer <= 0) {
      this.springTimer = Math.max(80, 170 - 16 * (this.difficulty - 1)) + Math.random() * 40
      this.springs.push({ x: st.springSpawn.x, y: st.springSpawn.y, vx: SPRING_VX, vy: SPRING_VY, drop: false })
      this.sfx.boing()
    }
    const keep: Spring[] = []
    for (const s of this.springs) {
      s.vy += SPRING_G
      s.y += s.vy
      s.x += s.vx
      if (!s.drop && s.vy > 0 && s.y >= st.springSpawn.y) {
        s.y = st.springSpawn.y
        s.vy = SPRING_VY
        this.sfx.boing()
        if (s.x >= st.springDropX!) { s.drop = true; s.vx = 0; s.vy = 0 }
      }
      if (s.y > H + 16) continue
      keep.push(s)
    }
    this.springs = keep
  }

  // ---------------------------------------------------------------- collisions
  private checkHazards() {
    const m = this.mario
    const st = this.stage
    const mx1 = m.x - 5, mx2 = m.x + 5, my1 = m.y - 14, my2 = m.y - 1

    let hx1 = 0, hx2 = 0, hy1 = 0, hy2 = 0
    const hammering = m.hammer > 0
    if (hammering) {
      if (m.hammerSwing < 8) { hx1 = m.x - 6; hx2 = m.x + 6; hy1 = m.y - 28; hy2 = m.y - 16 }
      else if (m.facing > 0) { hx1 = m.x + 3; hx2 = m.x + 17; hy1 = m.y - 13; hy2 = m.y - 1 }
      else { hx1 = m.x - 17; hx2 = m.x - 3; hy1 = m.y - 13; hy2 = m.y - 1 }
    }
    const smash = (x: number, y: number): boolean => {
      const r = Math.random()
      const pts = SCORE_SMASH[r < 0.6 ? 0 : r < 0.9 ? 1 : 2]!
      this.addScore(pts)
      this.popup(x, y - 14, String(pts))
      this.sfx.smash()
      return true
    }

    this.barrels = this.barrels.filter(b => {
      const bx1 = b.x - 5, bx2 = b.x + 5, by1 = b.y - 9, by2 = b.y - 1
      if (hammering && overlap(hx1, hy1, hx2, hy2, bx1, by1, bx2, by2)) return !smash(b.x, b.y)
      if (overlap(mx1, my1, mx2, my2, bx1, by1, bx2, by2)) this.killMario()
      return true
    })
    if (this.scene !== 'play') return
    this.fireballs = this.fireballs.filter(f => {
      const fx1 = f.x - 5, fx2 = f.x + 5, fy1 = f.y - 11, fy2 = f.y - 1
      if (hammering && overlap(hx1, hy1, hx2, hy2, fx1, fy1, fx2, fy2)) return !smash(f.x, f.y)
      if (overlap(mx1, my1, mx2, my2, fx1, fy1, fx2, fy2)) this.killMario()
      return true
    })
    if (this.scene !== 'play') return
    this.pies = this.pies.filter(p => {
      const px1 = p.x - 7, px2 = p.x + 7, py1 = p.y - 6, py2 = p.y - 1
      if (hammering && overlap(hx1, hy1, hx2, hy2, px1, py1, px2, py2)) return !smash(p.x, p.y)
      if (overlap(mx1, my1, mx2, my2, px1, py1, px2, py2)) this.killMario()
      return true
    })
    if (this.scene !== 'play') return
    for (const s of this.springs) {
      if (overlap(mx1, my1, mx2, my2, s.x - 6, s.y - 9, s.x + 6, s.y - 1)) { this.killMario(); return }
    }
    if (st.drum && st.drum.lit && st.kind === 'pies') {
      if (overlap(mx1, my1, mx2, my2, st.drum.x - 8, st.drum.y - 24, st.drum.x + 8, st.drum.y)) { this.killMario(); return }
    }
    if (st.drum && st.kind === 'barrels') {
      if (overlap(mx1, my1, mx2, my2, st.drum.x - 7, st.drum.y - 16, st.drum.x + 7, st.drum.y)) {
        if (st.drum.lit) { this.killMario(); return }
        m.x = st.drum.x + 13
      }
    }
  }
}

export type { Stage, Platform, Ladder, Pt }
