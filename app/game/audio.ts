/** Tiny WebAudio synthesiser for arcade style blips. Safe to construct on the server (lazy). */
export class Sfx {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  muted = false

  /** Must be called from a user gesture before sounds will play. */
  init() {
    if (typeof window === 'undefined') return
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      if (!AC) return
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.22
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  private tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 1, slideTo?: number, delay = 0) {
    if (!this.ctx || !this.master || this.muted) return
    const t0 = this.ctx.currentTime + delay
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
    g.gain.setValueAtTime(vol, t0)
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
    osc.connect(g).connect(this.master)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  }

  private noise(dur: number, vol = 0.6, delay = 0) {
    if (!this.ctx || !this.master || this.muted) return
    const t0 = this.ctx.currentTime + delay
    const len = Math.floor(this.ctx.sampleRate * dur)
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const g = this.ctx.createGain()
    g.gain.value = vol
    src.connect(g).connect(this.master)
    src.start(t0)
  }

  jump() { this.tone(220, 0.18, 'square', 0.5, 660) }
  walk() { this.tone(110, 0.03, 'square', 0.25) }
  smash() { this.noise(0.08, 0.8); this.tone(500, 0.18, 'sawtooth', 0.5, 90) }
  score() { this.tone(988, 0.06, 'square', 0.4); this.tone(1319, 0.1, 'square', 0.4, undefined, 0.06) }
  pickup() { this.tone(523, 0.07, 'square', 0.5); this.tone(659, 0.07, 'square', 0.5, undefined, 0.07); this.tone(784, 0.12, 'square', 0.5, undefined, 0.14) }
  hammerGrab() { for (let i = 0; i < 4; i++) this.tone(392 * Math.pow(1.26, i), 0.07, 'square', 0.5, undefined, i * 0.06) }
  boing() { this.tone(180, 0.12, 'triangle', 0.6, 420) }
  rivet() { this.tone(1200, 0.05, 'square', 0.4, 300) }
  thump() { this.tone(70, 0.09, 'triangle', 0.9, 45) }
  tick() { this.tone(1600, 0.02, 'square', 0.15) }
  roll() { this.tone(160, 0.04, 'square', 0.12, 120) }

  die() {
    const notes = [392, 370, 349, 330, 311, 294, 277, 262]
    notes.forEach((f, i) => this.tone(f, 0.12, 'square', 0.5, undefined, i * 0.1))
    this.tone(200, 0.6, 'sawtooth', 0.4, 50, 0.9)
  }

  clear() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319]
    notes.forEach((f, i) => this.tone(f, 0.14, 'square', 0.5, undefined, i * 0.12))
  }

  howHigh() {
    const notes = [392, 523, 659, 784]
    notes.forEach((f, i) => this.tone(f, 0.16, 'square', 0.45, undefined, i * 0.14))
  }

  extraLife() {
    const notes = [659, 784, 1319, 1047, 1175, 1568]
    notes.forEach((f, i) => this.tone(f, 0.1, 'square', 0.5, undefined, i * 0.08))
  }

  /** One note of the hammer theme. */
  hammerNote(i: number) {
    const seq = [659, 784, 880, 784, 659, 587, 659, 523]
    this.tone(seq[i % seq.length]!, 0.09, 'square', 0.35)
    if (i % 2 === 0) this.tone(seq[i % seq.length]! / 2, 0.09, 'triangle', 0.5)
  }

  gameOver() {
    const notes = [330, 311, 294, 277, 262, 247, 233, 220]
    notes.forEach((f, i) => this.tone(f, 0.2, 'sawtooth', 0.4, undefined, i * 0.18))
  }
}
