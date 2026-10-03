<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { Game } from '~/game/engine'
import { drawScene } from '~/game/render'
import { retroArt } from '~/game/artRetro'
import { modernArt } from '~/game/artModern'
import { W, H } from '~/game/constants'
import type { Gfx } from '~/game/types'

const canvas = ref<HTMLCanvasElement | null>(null)
const wrap = ref<HTMLDivElement | null>(null)
const gfx = ref<Gfx>('retro')
const muted = ref(false)

let game: Game | null = null
let raf = 0
let scale = 3
let dpr = 1
let off: HTMLCanvasElement | null = null

function setGfx(g: Gfx) {
  if (!game) return
  game.setGfx(g)
  gfx.value = g
  applySize()
}

function toggleMute() {
  if (!game) return
  game.sfx.init()
  game.sfx.muted = !game.sfx.muted
  muted.value = game.sfx.muted
}

function applySize() {
  const c = canvas.value
  if (!c) return
  const availW = Math.max(224, window.innerWidth - 24)
  const availH = Math.max(256, window.innerHeight - 96)
  scale = Math.max(1, Math.floor(Math.min(availW / W, availH / H)))
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  c.style.width = `${W * scale}px`
  c.style.height = `${H * scale}px`
  if (game?.gfx === 'retro') {
    c.width = W * scale
    c.height = H * scale
  } else {
    c.width = Math.round(W * scale * dpr)
    c.height = Math.round(H * scale * dpr)
  }
}

function render() {
  const c = canvas.value
  if (!c || !game || !off) return
  const ctx = c.getContext('2d')!
  if (game.gfx === 'retro') {
    const octx = off.getContext('2d')!
    octx.setTransform(1, 0, 0, 1, 0, 0)
    octx.imageSmoothingEnabled = false
    drawScene(octx, game, retroArt)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(off, 0, 0, c.width, c.height)
  } else {
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0)
    ctx.imageSmoothingEnabled = true
    drawScene(ctx, game, modernArt)
  }
}

const keyMap: Record<string, keyof Game['input'] | 'start' | 'gfx' | 'mute'> = {
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ' ': 'jump', z: 'jump', Z: 'jump', x: 'jump', X: 'jump',
  Enter: 'start', p: 'start', P: 'start',
  g: 'gfx', G: 'gfx',
  m: 'mute', M: 'mute',
}

function onKey(e: KeyboardEvent, down: boolean) {
  if (!game) return
  const k = keyMap[e.key]
  if (!k) return
  e.preventDefault()
  if (e.repeat) return
  game.sfx.init()
  if (k === 'start') { if (down) game.input.startPressed = true; return }
  if (k === 'gfx') { if (down) setGfx(game.gfx === 'retro' ? 'modern' : 'retro'); return }
  if (k === 'mute') { if (down) toggleMute(); return }
  if (k === 'jump') {
    if (down && !game.input.jump) game.input.jumpPressed = true
    game.input.jump = down
    return
  }
  if (game.scene === 'title' && down && (k === 'left' || k === 'right')) {
    setGfx(game.gfx === 'retro' ? 'modern' : 'retro')
    return
  }
  game.input[k] = down
}

const keyDown = (e: KeyboardEvent) => onKey(e, true)
const keyUp = (e: KeyboardEvent) => onKey(e, false)

// touch / pointer buttons
function press(k: 'left' | 'right' | 'up' | 'down' | 'jump' | 'start', down: boolean) {
  if (!game) return
  game.sfx.init()
  if (k === 'start') { if (down) game.input.startPressed = true; return }
  if (k === 'jump') { if (down && !game.input.jump) game.input.jumpPressed = true; game.input.jump = down; return }
  game.input[k] = down
}

onMounted(() => {
  game = new Game()
  ;(window as any).__dk = game // handy for debugging from the console
  gfx.value = game.gfx
  off = document.createElement('canvas')
  off.width = W
  off.height = H
  applySize()
  window.addEventListener('resize', applySize)
  window.addEventListener('keydown', keyDown)
  window.addEventListener('keyup', keyUp)

  const STEP = 1000 / 60
  let last = performance.now()
  let acc = 0
  const loop = (now: number) => {
    acc += Math.min(now - last, 120)
    last = now
    while (acc >= STEP) {
      game!.step()
      acc -= STEP
    }
    render()
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', applySize)
  window.removeEventListener('keydown', keyDown)
  window.removeEventListener('keyup', keyUp)
})
</script>

<template>
  <div ref="wrap" class="dk-root" :class="gfx">
    <div class="dk-bar">
      <span class="dk-title">DONKEY KONG</span>
      <div class="dk-seg">
        <button type="button" :class="{ on: gfx === 'retro' }" @click="setGfx('retro')">Original 1981</button>
        <button type="button" :class="{ on: gfx === 'modern' }" @click="setGfx('modern')">Modern</button>
      </div>
      <button type="button" class="dk-mute" @click="toggleMute">{{ muted ? 'Sound off' : 'Sound on' }}</button>
    </div>

    <canvas ref="canvas" class="dk-canvas" :width="W" :height="H" />

    <div class="dk-touch">
      <div class="dk-dpad">
        <button type="button" class="u" @pointerdown.prevent="press('up', true)" @pointerup="press('up', false)" @pointerleave="press('up', false)" @pointercancel="press('up', false)">▲</button>
        <button type="button" class="l" @pointerdown.prevent="press('left', true)" @pointerup="press('left', false)" @pointerleave="press('left', false)" @pointercancel="press('left', false)">◀</button>
        <button type="button" class="r" @pointerdown.prevent="press('right', true)" @pointerup="press('right', false)" @pointerleave="press('right', false)" @pointercancel="press('right', false)">▶</button>
        <button type="button" class="d" @pointerdown.prevent="press('down', true)" @pointerup="press('down', false)" @pointerleave="press('down', false)" @pointercancel="press('down', false)">▼</button>
      </div>
      <div class="dk-actions">
        <button type="button" class="start" @pointerdown.prevent="press('start', true)">START / PAUSE</button>
        <button type="button" class="jump" @pointerdown.prevent="press('jump', true)" @pointerup="press('jump', false)" @pointerleave="press('jump', false)" @pointercancel="press('jump', false)">JUMP</button>
      </div>
    </div>

    <p class="dk-help">Arrows / WASD move and climb · Space jumps · Enter or P pauses · G switches graphics · M mutes</p>
  </div>
</template>

<style scoped>
.dk-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 24px;
  box-sizing: border-box;
  background: #05060c;
  color: #cfd3e0;
  font-family: "Segoe UI", system-ui, sans-serif;
  user-select: none;
}
.dk-root.modern {
  background: radial-gradient(ellipse at top, #1b1538 0%, #07070f 70%);
}
.dk-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
}
.dk-title {
  font-weight: 800;
  letter-spacing: 0.18em;
  color: #ff3a5e;
  font-size: 14px;
}
.dk-seg {
  display: inline-flex;
  border: 1px solid #3a3f55;
  border-radius: 999px;
  overflow: hidden;
}
.dk-seg button,
.dk-mute {
  background: transparent;
  border: 0;
  color: #cfd3e0;
  padding: 6px 14px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.dk-seg button.on {
  background: #ff3a5e;
  color: #fff;
  font-weight: 700;
}
.dk-mute {
  border: 1px solid #3a3f55;
  border-radius: 999px;
}
.dk-canvas {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  background: #000;
  box-shadow: 0 0 0 2px #22263a, 0 20px 60px rgba(0, 0, 0, 0.7);
  outline: none;
}
.dk-root.modern .dk-canvas {
  image-rendering: auto;
  border-radius: 6px;
}
.dk-help {
  margin: 0;
  font-size: 12px;
  color: #7f879f;
  text-align: center;
}
.dk-touch {
  display: none;
  width: 100%;
  max-width: 480px;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.dk-dpad {
  display: grid;
  grid-template-columns: repeat(3, 44px);
  grid-template-rows: repeat(3, 44px);
  gap: 4px;
}
.dk-dpad button,
.dk-actions button {
  border: 1px solid #3a3f55;
  background: #151827;
  color: #e5e8f3;
  border-radius: 8px;
  font-size: 16px;
  touch-action: none;
}
.dk-dpad .u { grid-column: 2; grid-row: 1; }
.dk-dpad .l { grid-column: 1; grid-row: 2; }
.dk-dpad .r { grid-column: 3; grid-row: 2; }
.dk-dpad .d { grid-column: 2; grid-row: 3; }
.dk-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dk-actions .jump {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: #ff3a5e;
  color: #fff;
  font-weight: 800;
}
.dk-actions .start {
  padding: 8px 10px;
  font-size: 11px;
}
@media (pointer: coarse) {
  .dk-touch { display: flex; }
  .dk-help { display: none; }
}
</style>
