import type { Art, Ctx } from './render'
import type { Game, Mario, DkPose } from './engine'
import type { Platform } from './types'
import { surfaceAt } from './geom'
import { W, H } from './constants'

const FONT = '"Trebuchet MS", "Segoe UI", Arial, sans-serif'

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.arcTo(x + w, y, x + w, y + h, rad)
  ctx.arcTo(x + w, y + h, x, y + h, rad)
  ctx.arcTo(x, y + h, x, y, rad)
  ctx.arcTo(x, y, x + w, y, rad)
  ctx.closePath()
}

function circle(ctx: Ctx, x: number, y: number, r: number, fill: string) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
}

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string) {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
}

function shadow(ctx: Ctx, x: number, y: number, rx: number) {
  ctx.save()
  ctx.globalAlpha = 0.3
  ellipse(ctx, x, y + 0.5, rx, 1.6, '#000')
  ctx.restore()
}

function girderGradient(ctx: Ctx, y: number) {
  const gr = ctx.createLinearGradient(0, y, 0, y + 8)
  gr.addColorStop(0, '#ff8fb8')
  gr.addColorStop(0.25, '#e8407a')
  gr.addColorStop(1, '#8e1646')
  return gr
}

/** One continuous beam body for a whole polyline, so slope changes show no seam. */
function drawGirderBody(ctx: Ctx, pts: [number, number][]) {
  ctx.beginPath()
  ctx.moveTo(pts[0]![0], pts[0]![1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]![0], pts[i]![1])
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i]![0], pts[i]![1] + 8)
  ctx.closePath()
  let minY = Infinity
  for (const p of pts) minY = Math.min(minY, p[1])
  ctx.fillStyle = girderGradient(ctx, minY)
  ctx.fill()
}

function drawGirderSegment(ctx: Ctx, ax: number, ay: number, bx: number, by: number) {
  // top highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(ax, ay + 0.5)
  ctx.lineTo(bx, by + 0.5)
  ctx.stroke()
  // truss diagonals
  ctx.strokeStyle = 'rgba(60,0,30,0.45)'
  ctx.lineWidth = 1
  ctx.beginPath()
  const len = bx - ax
  const slope = (by - ay) / (len || 1)
  for (let x = ax + 4; x < bx - 4; x += 12) {
    const y = ay + (x - ax) * slope
    ctx.moveTo(x, y + 2)
    ctx.lineTo(x + 6, y + 6 + 6 * slope)
    ctx.moveTo(x + 6, y + 2 + 6 * slope)
    ctx.lineTo(x, y + 6)
  }
  ctx.stroke()
  // bolts
  for (let x = ax + 6; x < bx - 2; x += 16) {
    const y = ay + (x - ax) * slope
    circle(ctx, x, y + 4, 1.1, 'rgba(255,220,235,0.8)')
  }
}

function drawMarioBody(ctx: Ctx, m: Mario, g: Game, x: number, y: number) {
  const f = m.facing
  const t = g.frame
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(f, 1)

  if (m.state === 'climb') {
    // back view
    const swing = m.climbFrame === 1 ? 1 : -1
    ctx.fillStyle = '#2d55e0'
    rr(ctx, -4, -9, 8, 7, 1.5)
    ctx.fill()
    ctx.fillStyle = '#d61e1e'
    rr(ctx, -5, -14, 10, 6, 2)
    ctx.fill()
    circle(ctx, 0, -11.5, 4, '#d61e1e')
    ctx.fillStyle = '#7a3a1e'
    rr(ctx, -4, -10, 8, 3, 1)
    ctx.fill()
    // arms
    ctx.fillStyle = '#ffcfa6'
    rr(ctx, -7, -16 + swing * 2, 2.5, 7, 1)
    ctx.fill()
    rr(ctx, 4.5, -16 - swing * 2, 2.5, 7, 1)
    ctx.fill()
    // legs
    ctx.fillStyle = '#2d55e0'
    rr(ctx, -4, -3 + swing, 3, 3.5, 1)
    ctx.fill()
    rr(ctx, 1, -3 - swing, 3, 3.5, 1)
    ctx.fill()
    ctx.restore()
    return
  }

  const walking = m.state === 'walk' && m.moving
  const phase = walking ? Math.sin(t * 0.55) : 0
  const jumping = m.state === 'air'
  // legs & shoes
  const legA = jumping ? -3 : phase * 2.5
  const legB = jumping ? 3 : -phase * 2.5
  ctx.fillStyle = '#2d55e0'
  rr(ctx, -4 + legA * 0.6, -6, 3.4, 5, 1)
  ctx.fill()
  rr(ctx, 0.6 + legB * 0.6, -6, 3.4, 5, 1)
  ctx.fill()
  ctx.fillStyle = '#5b2a10'
  ellipse(ctx, -2 + legA * 0.8, -0.8, 2.6, 1.4, '#5b2a10')
  ellipse(ctx, 2.4 + legB * 0.8, -0.8, 2.6, 1.4, '#5b2a10')
  // overalls
  ctx.fillStyle = '#2d55e0'
  rr(ctx, -4.5, -10, 9, 5.5, 2)
  ctx.fill()
  // shirt
  ctx.fillStyle = '#d61e1e'
  rr(ctx, -4.5, -12, 9, 3, 1)
  ctx.fill()
  // straps and button
  ctx.fillStyle = '#2d55e0'
  ctx.fillRect(-3, -12, 1.5, 3)
  ctx.fillRect(1.5, -12, 1.5, 3)
  circle(ctx, -2.2, -9.4, 0.6, '#ffd83a')
  circle(ctx, 2.2, -9.4, 0.6, '#ffd83a')
  // arms
  ctx.fillStyle = '#d61e1e'
  const armSwing = jumping ? -4 : phase * 1.5
  rr(ctx, -6.5, -11 + armSwing * 0.3, 2.6, 5, 1.2)
  ctx.fill()
  rr(ctx, 3.9, -11 - armSwing * 0.3, 2.6, 5, 1.2)
  ctx.fill()
  circle(ctx, -5.2, -6 + armSwing * 0.3, 1.4, '#ffcfa6')
  circle(ctx, 5.2, -6 - armSwing * 0.3, 1.4, '#ffcfa6')
  // head
  circle(ctx, 0.5, -14.5, 4.2, '#ffcfa6')
  // hair / sideburn
  ctx.fillStyle = '#5b2a10'
  rr(ctx, -4, -15.5, 2, 3.5, 1)
  ctx.fill()
  // cap
  ctx.fillStyle = '#d61e1e'
  ctx.beginPath()
  ctx.arc(0.5, -15, 4.6, Math.PI, 0)
  ctx.closePath()
  ctx.fill()
  rr(ctx, -2, -16, 8.5, 2, 1)
  ctx.fill()
  // eye, nose, moustache
  circle(ctx, 2.4, -14.6, 0.7, '#111')
  circle(ctx, 4.4, -13.2, 1.3, '#ffb98c')
  ctx.fillStyle = '#5b2a10'
  rr(ctx, 1.2, -12.2, 4, 1.3, 0.6)
  ctx.fill()

  // hammer
  if (m.hammer > 0 && !(m.hammer < 150 && (t % 8) < 4)) {
    ctx.save()
    if (m.hammerSwing < 8) { ctx.translate(0, -19); ctx.rotate(-0.1) }
    else { ctx.translate(9, -8); ctx.rotate(Math.PI / 2) }
    ctx.fillStyle = '#8b5a2b'
    rr(ctx, -0.9, -2, 1.8, 8, 0.8)
    ctx.fill()
    const gr = ctx.createLinearGradient(-5, -6, 5, -2)
    gr.addColorStop(0, '#ffe680')
    gr.addColorStop(1, '#d99a1c')
    ctx.fillStyle = gr
    rr(ctx, -5, -7, 10, 5, 1.5)
    ctx.fill()
    ctx.restore()
  }
  ctx.restore()
}

function drawDK(ctx: Ctx, x: number, y: number, pose: DkPose, beat: number, g: Game) {
  ctx.save()
  if (pose === 'down') { ctx.translate(x, y - 16); ctx.rotate(Math.PI); ctx.translate(-x, -(y - 16)) }
  if (pose === 'fall') { ctx.translate(x, y - 16); ctx.rotate(((g.frame % 48) / 48) * Math.PI * 2); ctx.translate(-x, -(y - 16)) }
  const fur = ctx.createLinearGradient(0, y - 36, 0, y)
  fur.addColorStop(0, '#a8562a')
  fur.addColorStop(1, '#5e2a0e')
  const tan = '#f3c38f'
  const dark = '#3f1a08'
  const beatUp = Math.floor(beat / 18) % 2 === 0

  // legs
  ctx.fillStyle = fur
  rr(ctx, x - 19, y - 9, 13, 9, 4)
  ctx.fill()
  rr(ctx, x + 6, y - 9, 13, 9, 4)
  ctx.fill()
  ctx.fillStyle = dark
  ellipse(ctx, x - 14, y - 1, 7, 2, dark)
  ellipse(ctx, x + 13, y - 1, 7, 2, dark)

  const arm = (side: -1 | 1, mode: 'down' | 'up' | 'out' | 'raise' | 'front') => {
    ctx.save()
    const sx = x + side * 17
    ctx.translate(sx, y - 22)
    ctx.scale(side, 1)
    let ang = 0.15
    if (mode === 'up') ang = Math.PI * 0.85
    if (mode === 'out') ang = Math.PI / 2
    if (mode === 'raise') ang = Math.PI * 0.95
    if (mode === 'front') ang = Math.PI * 0.55
    ctx.rotate(-ang)
    ctx.fillStyle = fur
    rr(ctx, -4, -2, 8, mode === 'out' ? 20 : 17, 4)
    ctx.fill()
    circle(ctx, 0, mode === 'out' ? 19 : 16, 4.5, '#4a2008')
    ctx.restore()
  }

  // body
  ctx.fillStyle = fur
  rr(ctx, x - 18, y - 27, 36, 22, 9)
  ctx.fill()
  // chest
  const chest = ctx.createRadialGradient(x, y - 14, 2, x, y - 14, 12)
  chest.addColorStop(0, '#ffe0b8')
  chest.addColorStop(1, tan)
  ctx.fillStyle = chest
  ellipse(ctx, x, y - 14, 11, 8, tan)
  ctx.fillStyle = chest
  ctx.fill()
  // head
  ctx.fillStyle = fur
  rr(ctx, x - 14, y - 38, 28, 16, 7)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(x - 3, y - 38)
  ctx.quadraticCurveTo(x, y - 43, x + 3, y - 38)
  ctx.fill()
  // face
  ctx.fillStyle = tan
  rr(ctx, x - 11, y - 34, 22, 11, 5)
  ctx.fill()
  // brow
  ctx.fillStyle = dark
  rr(ctx, x - 10, y - 35.5, 20, 2.5, 1)
  ctx.fill()
  // eyes
  ellipse(ctx, x - 5, y - 31, 3, 2.4, '#fff')
  ellipse(ctx, x + 5, y - 31, 3, 2.4, '#fff')
  circle(ctx, x - 4.2, y - 30.6, 1.3, '#111')
  circle(ctx, x + 5.8, y - 30.6, 1.3, '#111')
  // nostrils & mouth
  circle(ctx, x - 2, y - 27.5, 0.9, dark)
  circle(ctx, x + 2, y - 27.5, 0.9, dark)
  ctx.strokeStyle = dark
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(x - 6, y - 25)
  ctx.quadraticCurveTo(x, y - 22.5, x + 6, y - 25)
  ctx.stroke()

  switch (pose) {
    case 'idle': arm(-1, beatUp ? 'up' : 'down'); arm(1, beatUp ? 'down' : 'up'); break
    case 'fall': case 'down': arm(-1, 'raise'); arm(1, 'raise'); break
    case 'grab': arm(-1, 'out'); arm(1, 'down'); break
    case 'hold': arm(-1, 'front'); arm(1, 'front'); drawBarrelSide(ctx, x, y - 22); break
    case 'throw': arm(-1, 'down'); arm(1, 'out'); break
    case 'carry': arm(-1, 'raise'); arm(1, 'raise'); drawPauline(ctx, x, y - 36, beat, false); break
  }
  ctx.restore()
}

function drawBarrelSide(ctx: Ctx, x: number, y: number) {
  const gr = ctx.createLinearGradient(x - 5, 0, x + 5, 0)
  gr.addColorStop(0, '#7a3a10')
  gr.addColorStop(0.4, '#d99a4a')
  gr.addColorStop(1, '#8a4616')
  ctx.fillStyle = gr
  rr(ctx, x - 5, y - 14, 10, 14, 3)
  ctx.fill()
  ctx.fillStyle = 'rgba(40,20,5,0.7)'
  ctx.fillRect(x - 5, y - 11, 10, 1.4)
  ctx.fillRect(x - 5, y - 4.4, 10, 1.4)
}

function drawPauline(ctx: Ctx, x: number, y: number, frame: number, help: boolean) {
  const wave = Math.floor(frame / 20) % 2 === 0
  // dress
  const gr = ctx.createLinearGradient(0, y - 14, 0, y)
  gr.addColorStop(0, '#ff9ad6')
  gr.addColorStop(1, '#d63a8e')
  ctx.fillStyle = gr
  ctx.beginPath()
  ctx.moveTo(x - 3.5, y - 14)
  ctx.lineTo(x + 3.5, y - 14)
  ctx.lineTo(x + 7, y - 2)
  ctx.quadraticCurveTo(x, y + 0.5, x - 7, y - 2)
  ctx.closePath()
  ctx.fill()
  // legs
  ctx.fillStyle = '#ffcfa6'
  ctx.fillRect(x - 3, y - 3, 2, 3)
  ctx.fillRect(x + 1, y - 3, 2, 3)
  // arms
  ctx.strokeStyle = '#ffcfa6'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x - 4, y - 13)
  ctx.lineTo(x - 8, wave ? y - 20 : y - 9)
  ctx.moveTo(x + 4, y - 13)
  ctx.lineTo(x + 8, wave ? y - 9 : y - 20)
  ctx.stroke()
  // hair & head
  circle(ctx, x, y - 19, 5.2, '#5a2a12')
  rr(ctx, x - 5.5, y - 20, 11, 9, 3)
  ctx.fillStyle = '#5a2a12'
  ctx.fill()
  circle(ctx, x, y - 18, 3.8, '#ffcfa6')
  circle(ctx, x - 1.4, y - 18.4, 0.6, '#111')
  circle(ctx, x + 1.4, y - 18.4, 0.6, '#111')
  ctx.fillStyle = '#e0245e'
  rr(ctx, x - 1.2, y - 16.4, 2.4, 1, 0.5)
  ctx.fill()
  if (help) {
    ctx.save()
    ctx.font = `bold 6px ${FONT}`
    ctx.fillStyle = '#fff'
    ctx.fillText('HELP!', x + 8, y - 26)
    ctx.restore()
  }
}

function drawFlame(ctx: Ctx, x: number, y: number, frame: number, scale = 1) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  const t = frame * 0.25
  const layer = (r: number, col: string, phase: number) => {
    ctx.beginPath()
    ctx.moveTo(-r, 0)
    for (let i = 0; i <= 6; i++) {
      const px = -r + (2 * r * i) / 6
      const h = -r * (1.3 + 0.5 * Math.sin(t + i * 1.7 + phase)) * (1 - Math.abs(px) / (r * 1.1))
      ctx.lineTo(px, h)
    }
    ctx.lineTo(r, 0)
    ctx.closePath()
    ctx.fillStyle = col
    ctx.fill()
  }
  layer(7, 'rgba(255,80,20,0.9)', 0)
  layer(5, 'rgba(255,170,30,0.95)', 1.5)
  layer(3, 'rgba(255,245,160,1)', 3)
  ctx.restore()
}

export const modernArt: Art = {
  clear(ctx) {
    const gr = ctx.createLinearGradient(0, 0, 0, H)
    gr.addColorStop(0, '#0c1024')
    gr.addColorStop(0.6, '#150f2c')
    gr.addColorStop(1, '#1b0d22')
    ctx.fillStyle = gr
    ctx.fillRect(0, 0, W, H)
    const glow = ctx.createRadialGradient(W / 2, 40, 10, W / 2, 40, 180)
    glow.addColorStop(0, 'rgba(255,120,200,0.12)')
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)
  },

  platform(ctx, p, g) {
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 3
    ctx.shadowOffsetY = 2
    if (p.kind === 'conveyor' && p.conveyor !== undefined) {
      const grp = g.stage.conveyors[p.conveyor]!
      const dir = grp.dir * (p.mirror ?? 1)
      const y = p.pts[0]![1]
      // belt housing
      ctx.fillStyle = '#3c4256'
      rr(ctx, p.x1, y, p.x2 - p.x1, 8, 3)
      ctx.fill()
      ctx.shadowColor = 'transparent'
      // moving belt
      ctx.save()
      ctx.beginPath()
      rr(ctx, p.x1 + 1, y + 1, p.x2 - p.x1 - 2, 6, 2.5)
      ctx.clip()
      ctx.fillStyle = '#232634'
      ctx.fillRect(p.x1, y, p.x2 - p.x1, 8)
      ctx.strokeStyle = '#ffcf4a'
      ctx.lineWidth = 1.2
      ctx.setLineDash([3, 5])
      ctx.lineDashOffset = -g.frame * grp.speed * dir
      ctx.beginPath()
      ctx.moveTo(p.x1, y + 4)
      ctx.lineTo(p.x2, y + 4)
      ctx.stroke()
      ctx.restore()
      // rollers
      for (const rx of [p.x1 + 4, p.x2 - 4]) {
        ctx.save()
        ctx.translate(rx, y + 4)
        ctx.rotate(g.frame * 0.08 * dir)
        circle(ctx, 0, 0, 4.5, '#ffd84a')
        circle(ctx, 0, 0, 2.2, '#3c4256')
        ctx.strokeStyle = '#3c4256'
        ctx.lineWidth = 1
        for (let i = 0; i < 4; i++) {
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(Math.cos(i * Math.PI / 2) * 4.5, Math.sin(i * Math.PI / 2) * 4.5)
          ctx.stroke()
        }
        ctx.restore()
      }
      ctx.restore()
      return
    }
    const pts = p.pts
    drawGirderBody(ctx, pts)
    ctx.shadowColor = 'transparent'
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i]!
      const [bx, by] = pts[i + 1]!
      drawGirderSegment(ctx, ax, ay, bx, by)
    }
    for (const h of p.holes) {
      const y = surfaceAt(p, h) ?? pts[0]![1]
      ctx.fillStyle = '#0c1024'
      rr(ctx, h - 4, y - 0.5, 8, 9, 1.5)
      ctx.fill()
    }
    ctx.restore()
  },

  ladder(ctx, l) {
    ctx.save()
    ctx.strokeStyle = '#4fe3f2'
    ctx.lineWidth = 1.4
    ctx.lineCap = 'round'
    ctx.shadowColor = 'rgba(79,227,242,0.5)'
    ctx.shadowBlur = 3
    const seg = (y1: number, y2: number) => {
      ctx.beginPath()
      ctx.moveTo(l.x - 4, y1)
      ctx.lineTo(l.x - 4, y2)
      ctx.moveTo(l.x + 4, y1)
      ctx.lineTo(l.x + 4, y2)
      for (let y = y1 + 3; y < y2 - 1; y += 4) { ctx.moveTo(l.x - 4, y); ctx.lineTo(l.x + 4, y) }
      ctx.stroke()
    }
    if (!l.broken) seg(l.yTop, l.yBottom)
    else { seg(l.yTop, l.yTop + l.topStub); seg(l.yBottom - l.bottomStub, l.yBottom) }
    ctx.restore()
  },

  elevatorShaft(ctx, s) {
    ctx.save()
    ctx.strokeStyle = 'rgba(200,210,230,0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(s.x, s.yMin - 8)
    ctx.lineTo(s.x, H)
    ctx.stroke()
    for (const py of [s.yMin - 8, H - 4]) {
      circle(ctx, s.x, py, 5, '#ffd84a')
      circle(ctx, s.x, py, 2, '#3c4256')
    }
    ctx.restore()
  },

  elevatorCar(ctx, p) {
    const y = p.pts[0]![1]
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = 3
    ctx.shadowOffsetY = 2
    ctx.fillStyle = girderGradient(ctx, y)
    rr(ctx, p.x1, y, p.x2 - p.x1, 6, 2)
    ctx.fill()
    ctx.restore()
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fillRect(p.x1 + 1, y + 0.5, p.x2 - p.x1 - 2, 0.8)
  },

  mario(ctx, m, g) {
    const x = m.x, y = m.y
    if (m.state === 'dead') {
      const t = m.deadTimer
      ctx.save()
      ctx.translate(x, y - 8)
      if (t < 120) ctx.rotate((t / 8) * Math.PI / 2)
      else ctx.rotate(-Math.PI / 2)
      ctx.translate(-x, -(y - 8))
      drawMarioBody(ctx, { ...m, state: 'walk', moving: false, hammer: 0 }, g, x, y)
      ctx.restore()
      if (t >= 120) {
        ctx.save()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.2
        ctx.shadowColor = '#fff'
        ctx.shadowBlur = 4
        ctx.beginPath()
        ctx.ellipse(x, y - 20, 5, 1.8, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }
      return
    }
    if (m.state !== 'climb') shadow(ctx, x, m.state === 'air' ? y + 2 : y, 5)
    drawMarioBody(ctx, m, g, x, y)
  },

  dk: drawDK,
  pauline: drawPauline,

  barrel(ctx, b) {
    const x = b.x, y = b.y
    if (b.state === 'wild') {
      if (b.blue) {
        const gr = ctx.createLinearGradient(x - 5, 0, x + 5, 0)
        gr.addColorStop(0, '#1b2e8a')
        gr.addColorStop(0.4, '#5a86ff')
        gr.addColorStop(1, '#1b2e8a')
        ctx.fillStyle = gr
        rr(ctx, x - 5, y - 14, 10, 14, 3)
        ctx.fill()
        ctx.fillStyle = 'rgba(10,20,60,0.7)'
        ctx.fillRect(x - 5, y - 11, 10, 1.4)
        ctx.fillRect(x - 5, y - 4.4, 10, 1.4)
      } else drawBarrelSide(ctx, x, y)
      return
    }
    shadow(ctx, x, y, 5)
    const cx = x, cy = y - 5
    const gr = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, 6)
    if (b.blue) { gr.addColorStop(0, '#8fb0ff'); gr.addColorStop(1, '#1b2e8a') }
    else { gr.addColorStop(0, '#e9b06a'); gr.addColorStop(1, '#6d3410') }
    circle(ctx, cx, cy, 5.5, '#000')
    ctx.fillStyle = gr
    ctx.beginPath()
    ctx.arc(cx, cy, 5.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(b.frame * 0.18 * b.dir)
    ctx.strokeStyle = b.blue ? 'rgba(10,20,70,0.8)' : 'rgba(60,25,5,0.8)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(0, 0, 3.4, 0, Math.PI * 2)
    ctx.moveTo(-3.4, 0)
    ctx.lineTo(3.4, 0)
    ctx.moveTo(0, -3.4)
    ctx.lineTo(0, 3.4)
    ctx.stroke()
    ctx.restore()
  },

  barrelStack(ctx, x, y) {
    drawBarrelSide(ctx, x - 3, y)
    drawBarrelSide(ctx, x + 7, y)
    drawBarrelSide(ctx, x - 3, y - 14)
    drawBarrelSide(ctx, x + 7, y - 14)
  },

  fireball(ctx, f) {
    ctx.save()
    ctx.shadowColor = 'rgba(255,120,0,0.8)'
    ctx.shadowBlur = 6
    drawFlame(ctx, f.x, f.y, f.frame, 1)
    ctx.restore()
    const ex = f.x + f.dir * 1.5
    ellipse(ctx, ex - 2, f.y - 6, 1.1, 1.4, '#fff')
    ellipse(ctx, ex + 2, f.y - 6, 1.1, 1.4, '#fff')
    circle(ctx, ex - 2 + f.dir * 0.4, f.y - 6, 0.5, '#111')
    circle(ctx, ex + 2 + f.dir * 0.4, f.y - 6, 0.5, '#111')
  },

  pie(ctx, p) {
    shadow(ctx, p.x, p.y, 7)
    const gr = ctx.createLinearGradient(0, p.y - 6, 0, p.y)
    gr.addColorStop(0, '#d9dde8')
    gr.addColorStop(1, '#6e7385')
    ctx.fillStyle = gr
    rr(ctx, p.x - 8, p.y - 6, 16, 6, 2.5)
    ctx.fill()
    ctx.fillStyle = '#b9bfcf'
    ellipse(ctx, p.x, p.y - 5.5, 7, 1.6, '#b9bfcf')
  },

  spring(ctx, s, squash) {
    const h = squash ? 5 : 9
    ctx.save()
    ctx.strokeStyle = '#ffb02e'
    ctx.lineWidth = 1.6
    ctx.lineCap = 'round'
    ctx.shadowColor = 'rgba(255,170,40,0.6)'
    ctx.shadowBlur = 3
    ctx.beginPath()
    ctx.moveTo(s.x - 7, s.y)
    const coils = 4
    for (let i = 0; i <= coils; i++) {
      const yy = s.y - (h * i) / coils
      ctx.lineTo(i % 2 === 0 ? s.x + 7 : s.x - 7, yy)
    }
    ctx.stroke()
    ctx.restore()
  },

  hammer(ctx, x, y) {
    ctx.save()
    ctx.translate(x, y)
    ctx.shadowColor = 'rgba(255,220,100,0.6)'
    ctx.shadowBlur = 4
    ctx.fillStyle = '#8b5a2b'
    rr(ctx, -0.9, -1, 1.8, 8, 0.8)
    ctx.fill()
    const gr = ctx.createLinearGradient(-5, -5, 5, -1)
    gr.addColorStop(0, '#ffe680')
    gr.addColorStop(1, '#d99a1c')
    ctx.fillStyle = gr
    rr(ctx, -5, -5, 10, 5, 1.5)
    ctx.fill()
    ctx.restore()
  },

  item(ctx, it) {
    const x = it.x, y = it.y
    ctx.save()
    ctx.shadowColor = 'rgba(255,140,220,0.7)'
    ctx.shadowBlur = 4
    if (it.type === 'hat') {
      ellipse(ctx, x, y - 1.5, 7, 1.8, '#ff7ccf')
      ctx.fillStyle = '#ff9ad6'
      ctx.beginPath()
      ctx.arc(x, y - 2, 4, Math.PI, 0)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.fillRect(x - 4, y - 3.2, 8, 1)
    } else if (it.type === 'purse') {
      ctx.fillStyle = '#ff7ccf'
      rr(ctx, x - 4.5, y - 6, 9, 6, 2)
      ctx.fill()
      ctx.strokeStyle = '#ff9ad6'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x, y - 6, 2.6, Math.PI, 0)
      ctx.stroke()
      circle(ctx, x, y - 3.5, 0.8, '#fff')
    } else {
      ctx.fillStyle = '#ff9ad6'
      ctx.beginPath()
      ctx.arc(x, y - 8, 6, Math.PI, 0)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(x, y - 8, 6, Math.PI * 1.15, Math.PI * 1.45)
      ctx.lineTo(x, y - 8)
      ctx.fill()
      ctx.strokeStyle = '#8b5a2b'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(x, y - 8)
      ctx.lineTo(x, y - 1)
      ctx.arc(x - 1.5, y - 1, 1.5, 0, Math.PI)
      ctx.stroke()
    }
    ctx.restore()
  },

  rivet(ctx, r) {
    if (r.removed) return
    const gr = ctx.createRadialGradient(r.x - 1, r.y + 3, 0.5, r.x, r.y + 4, 3.2)
    gr.addColorStop(0, '#fff2a8')
    gr.addColorStop(1, '#c8891a')
    ctx.fillStyle = gr
    ctx.beginPath()
    ctx.arc(r.x, r.y + 4, 3.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(80,40,0,0.6)'
    ctx.lineWidth = 0.8
    ctx.stroke()
  },

  drum(ctx, x, y, lit, frame) {
    const gr = ctx.createLinearGradient(x - 8, 0, x + 8, 0)
    gr.addColorStop(0, '#13246b')
    gr.addColorStop(0.45, '#3f6dff')
    gr.addColorStop(1, '#13246b')
    ctx.fillStyle = gr
    rr(ctx, x - 8, y - 16, 16, 16, 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.fillRect(x - 8, y - 13, 16, 1)
    ctx.fillRect(x - 8, y - 4, 16, 1)
    ctx.font = `bold 5px ${FONT}`
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.fillText('OIL', x, y - 7)
    ctx.textAlign = 'left'
    if (lit) {
      ctx.save()
      ctx.shadowColor = 'rgba(255,140,0,0.9)'
      ctx.shadowBlur = 8
      drawFlame(ctx, x, y - 16, frame, 1.3)
      ctx.restore()
    }
  },

  heart(ctx, x, y, broken) {
    ctx.save()
    ctx.translate(x, y)
    ctx.shadowColor = 'rgba(255,60,120,0.8)'
    ctx.shadowBlur = 5
    ctx.fillStyle = '#ff3d6e'
    const half = (sx: number) => {
      ctx.beginPath()
      ctx.moveTo(0, -2)
      ctx.bezierCurveTo(sx * 0.5, -7, sx * 7, -5, sx * 0.5 * (broken ? 1.5 : 0.01), 5)
      ctx.lineTo(0, 5)
      ctx.closePath()
      ctx.fill()
    }
    if (broken) { ctx.save(); ctx.translate(-1, 0); half(-1); ctx.restore(); ctx.save(); ctx.translate(1, 0); half(1); ctx.restore() }
    else {
      ctx.beginPath()
      ctx.moveTo(0, 5)
      ctx.bezierCurveTo(-7, -1, -5, -8, 0, -3)
      ctx.bezierCurveTo(5, -8, 7, -1, 0, 5)
      ctx.fill()
    }
    ctx.restore()
  },

  text(ctx, s, x, y, color, align = 'left', scale = 1) {
    ctx.save()
    ctx.font = `bold ${7.5 * scale}px ${FONT}`
    ctx.textBaseline = 'top'
    ctx.textAlign = align
    ctx.shadowColor = 'rgba(0,0,0,0.8)'
    ctx.shadowBlur = 2
    ctx.shadowOffsetY = 1
    ctx.fillStyle = color
    ctx.fillText(s, x, y - 0.5 * scale)
    ctx.restore()
  },

  box(ctx, x, y, w, h, color) {
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    rr(ctx, x, y, w, h, 3)
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()
  },

  lifeIcon(ctx, x, y) {
    ctx.fillStyle = '#d61e1e'
    rr(ctx, x, y, 6, 2.5, 1)
    ctx.fill()
    circle(ctx, x + 3, y + 3.5, 2.4, '#ffcfa6')
    ctx.fillStyle = '#2d55e0'
    rr(ctx, x + 0.5, y + 5.5, 5, 2.5, 1)
    ctx.fill()
  },

  overlay(ctx, alpha) {
    ctx.fillStyle = `rgba(5,5,15,${alpha})`
    ctx.fillRect(0, 0, W, H)
  },
}

export type { Platform }
