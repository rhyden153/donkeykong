// Logical arcade resolution (the original ran a vertical 224x256 raster)
export const W = 224
export const H = 256

// Mario physics (units: px / frame at 60 fps)
export const MARIO_SPEED = 0.95
export const MARIO_JUMP_VY = -2.5
export const GRAVITY = 0.15
export const CLIMB_SPEED = 0.8
export const FALL_KILL = 26           // falling further than this is fatal
export const HAMMER_FRAMES = 600      // ~10 seconds of hammer time

// Hazards
export const BARREL_GRAVITY = 0.2
export const FIREBALL_SPEED = 0.42
export const PIE_SPEED = 0.55
export const ELEV_SPEED = 0.75
export const SPRING_VX = 1.55
export const SPRING_VY = -2.3
export const SPRING_G = 0.147

// Scoring (arcade values)
export const SCORE_JUMP = [100, 300, 500]
export const SCORE_SMASH = [300, 500, 800]
export const SCORE_RIVET = 100
export const EXTRA_LIFE_AT = 7000
export const START_LIVES = 3
