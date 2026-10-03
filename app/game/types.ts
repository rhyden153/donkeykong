export type Gfx = 'retro' | 'modern'
export type StageKind = 'barrels' | 'pies' | 'elevators' | 'rivets'
export type ItemType = 'hat' | 'parasol' | 'purse'

export interface Pt { x: number; y: number }

export interface Platform {
  id: number
  pts: [number, number][]          // polyline, left -> right, surface coordinates
  kind: 'girder' | 'conveyor' | 'elevator' | 'ground'
  x1: number
  x2: number
  holes: number[]                  // x centres of removed rivets (visual)
  conveyor?: number                // conveyor group index
  mirror?: 1 | -1                  // belt direction multiplier for this segment
  shaft?: number                   // elevator shaft index
  idx?: number                     // elevator car index
  hidden?: boolean                 // collapsed (100m finale)
}

export interface Ladder {
  x: number
  yTop: number
  yBottom: number
  top: number                      // upper platform id
  bottom: number                   // lower platform id
  broken: boolean
  topStub: number                  // climbable length from the top when broken
  bottomStub: number               // climbable length from the bottom when broken
}

export interface ConveyorGroup {
  dir: 1 | -1
  speed: number
  timer: number
  spawnTimer: number
  role: 'bottom' | 'middle' | 'top'
}

export interface ElevatorShaft {
  x: number
  w: number
  dir: 1 | -1                      // -1 = cars move up, 1 = cars move down
  count: number
  spacing: number
  yMin: number
  yMax: number
}

export interface Hammer { x: number; y: number; taken: boolean }
export interface Item { x: number; y: number; type: ItemType; taken: boolean }
export interface Rivet { x: number; y: number; platform: number; removed: boolean }

export interface Stage {
  kind: StageKind
  platforms: Platform[]
  ladders: Ladder[]
  conveyors: ConveyorGroup[]
  elevators: ElevatorShaft[]
  rivets: Rivet[]
  hammers: Hammer[]
  items: Item[]
  drum?: { x: number; y: number; lit: boolean }
  dk: Pt
  pauline: Pt
  paulinePlatform: number
  marioStart: Pt
  barrelStack?: Pt
  springSpawn?: Pt
  springDropX?: number
  topPlatform?: number             // 100m: the row that collapses
}
