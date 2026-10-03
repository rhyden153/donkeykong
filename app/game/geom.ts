import type { Platform } from './types'

/** Surface height of a platform at x, or null when x is not over it. */
export function surfaceAt(p: Platform, x: number): number | null {
  if (p.hidden || x < p.x1 || x > p.x2) return null
  const pts = p.pts
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i]!
    const [bx, by] = pts[i + 1]!
    if (x >= ax && x <= bx) return bx === ax ? ay : ay + (by - ay) * (x - ax) / (bx - ax)
  }
  return null
}

/** Direction a round object rolls on this platform at x (+1 right, -1 left, 0 flat). */
export function slopeDir(p: Platform, x: number): number {
  const pts = p.pts
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i]!
    const [bx, by] = pts[i + 1]!
    if (x >= ax && x <= bx) return Math.sign(by - ay)
  }
  return 0
}

export interface Support { p: Platform; y: number }

/** Platform whose surface is within tol of y at x (closest wins). */
export function standingOn(plats: Platform[], x: number, y: number, tol = 3): Support | null {
  let best: Support | null = null
  for (const p of plats) {
    const s = surfaceAt(p, x)
    if (s === null) continue
    const d = Math.abs(s - y)
    if (d <= tol && (!best || d < Math.abs(best.y - y))) best = { p, y: s }
  }
  return best
}

/** First surface crossed while moving down from yPrev to yNew at x. */
export function landingBetween(plats: Platform[], x: number, yPrev: number, yNew: number): Support | null {
  let best: Support | null = null
  for (const p of plats) {
    const s = surfaceAt(p, x)
    if (s === null) continue
    if (yPrev <= s + 0.01 && yNew >= s && (!best || s < best.y)) best = { p, y: s }
  }
  return best
}

export function overlap(ax1: number, ay1: number, ax2: number, ay2: number, bx1: number, by1: number, bx2: number, by2: number): boolean {
  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1
}
