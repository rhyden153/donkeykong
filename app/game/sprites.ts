/**
 * Hand-authored pixel art for the 1981 look. Each sprite is a list of rows; each
 * character picks a palette colour, '.' is transparent.
 */
export type PixelMap = string[]

export const PAL: Record<string, string> = {
  R: '#ff2a2a', // red (cap / overalls)
  B: '#2a5cff', // blue shirt
  S: '#ffb98c', // skin
  H: '#8b3a1e', // brown hair / shoes
  Y: '#ffd83a', // yellow
  W: '#ffffff',
  K: '#000000',
  O: '#ff7a1a', // orange
  P: '#ff8ad0', // pink
  M: '#d85a9a', // magenta pink
  C: '#1ee7f5', // cyan
  G: '#9a9a9a', // grey
  D: '#5a5a5a', // dark grey
  L: '#d8d8d8', // light grey
  A: '#d07838', // barrel wood
  E: '#7a3a10', // barrel dark
  F: '#f0a860', // barrel light
  N: '#2850d8', // barrel blue
  T: '#7fb0ff', // barrel blue light
  Q: '#4ae04a', // green
}

export const MARIO_STAND: PixelMap = [
  '....RRRRR...',
  '...RRRRRRRRR',
  '...HHHSSHS..',
  '..HSHSSSHSSS',
  '..HSHHSSSHSS',
  '..HHSSSSHHHH',
  '....SSSSSSS.',
  '...BBRBBB...',
  '..BBBRBBRBBB',
  '.BBBBRRRRBBB',
  '.SSBBRYRRBSS',
  '.SSSRRRRRRSS',
  '.SSRRRRRRRRS',
  '...RRR..RRR.',
  '..HHH....HHH',
  '.HHHH....HHH',
]

export const MARIO_WALK1: PixelMap = [
  ...MARIO_STAND.slice(0, 12),
  '..RRRRRRRRR.',
  '..RRR..RRRR.',
  '.HHHH...HHH.',
  'HHHH.....HHH',
]

export const MARIO_WALK2: PixelMap = [
  ...MARIO_STAND.slice(0, 12),
  '...RRRRRRR..',
  '...RRRRRR...',
  '....HHHHH...',
  '...HHHH.....',
]

export const MARIO_JUMP: PixelMap = [
  '....RRRRR...',
  '...RRRRRRRRR',
  '...HHHSSHS..',
  '..HSHSSSHSSS',
  '..HSHHSSSHSS',
  '..HHSSSSHHHH',
  'SS..SSSSSSS.',
  'SSBBBRBBB...',
  '.BBBBRBBRBBB',
  '..BBBRRRRBBB',
  '....RRYRRRSS',
  '...RRRRRRRSS',
  '..RRRRRRRRR.',
  '.RRRR...RRRR',
  'HHHH.....HHH',
  'HHH.......HH',
]

export const MARIO_CLIMB: PixelMap = [
  '....RRRRR...',
  '...RRRRRRR..',
  '...HHHHHHH..',
  '...HHHHHHH..',
  '..SHHHHHHHS.',
  '..S.BBBBB.S.',
  '..SBBBBBBBS.',
  '...BBRRRBB..',
  '...BBRRRBB..',
  '....RRRRR...',
  '....RRRRR...',
  '....RRRRR...',
  '...RRR.RRR..',
  '...HHH.HHH..',
  '...HHH.HHH..',
  '............',
]

export const HAMMER_UP: PixelMap = [
  '.YYYYYY.',
  'YYYYYYYY',
  'YYYYYYYY',
  '.YYYYYY.',
  '...HH...',
  '...HH...',
  '...HH...',
  '...HH...',
  '...HH...',
]

export const HAMMER_SIDE: PixelMap = [
  '.....YYYY',
  '....YYYYY',
  'HHHHYYYYY',
  'HHHHYYYYY',
  '....YYYYY',
  '.....YYYY',
]

export const BARREL_ROLL: PixelMap[] = [
  [
    '..AAAAAAAA..',
    '.AFAAAAAAFA.',
    'AFAEEEEEEAFA',
    'AAEFAAAAFEAA',
    'AAEAFAAFAEAA',
    'AAEAAFFAAEAA',
    'AAEAAFFAAEAA',
    'AAEAFAAFAEAA',
    'AAEFAAAAFEAA',
    '.AEEEEEEEEA.',
  ],
  [
    '..AAAAAAAA..',
    '.AAAAFFAAAA.',
    'AAEEEFFEEEAA',
    'AAEAAFFAAEAA',
    'AAEAAFFAAEAA',
    'AFEFFFFFFEFA',
    'AFEFFFFFFEFA',
    'AAEAAFFAAEAA',
    'AAEAAFFAAEAA',
    '.AEEEFFEEEA.',
  ],
]

export const BARREL_SIDE: PixelMap = [
  '.AAAAAAAA.',
  'AEAFAAFAEA',
  'AEAFAAFAEA',
  'EEEEEEEEEE',
  'AEAFAAFAEA',
  'AEAFAAFAEA',
  'AEAFAAFAEA',
  'AEAFAAFAEA',
  'AEAFAAFAEA',
  'AEAFAAFAEA',
  'EEEEEEEEEE',
  'AEAFAAFAEA',
  'AEAFAAFAEA',
  '.AAAAAAAA.',
]

export const FIREBALL: PixelMap[] = [
  [
    '......R.......',
    '.....RR...R...',
    '....ROR..RR...',
    '...ROOR.ROR...',
    '..ROOYORROOR..',
    '..ROYYOOOYOR..',
    '.ROYYWYYYWYOR.',
    '.ROYYKYYYKYOR.',
    '.ROYYYYYYYYOR.',
    '.ROYYYYYYYYOR.',
    '..ROYYYYYYOR..',
    '..RROOYYOORR..',
    '...RRROORRR...',
    '.....RRRR.....',
  ],
  [
    '..........R...',
    '...R.....RR...',
    '...RR...ROR...',
    '..ROR..ROOR...',
    '..ROORROOYOR..',
    '..ROYOOOYYOR..',
    '.ROYWYYYWYYOR.',
    '.ROYKYYYKYYOR.',
    '.ROYYYYYYYYOR.',
    '.ROYYYYYYYYOR.',
    '..ROYYYYYYOR..',
    '..RROOYYOORR..',
    '...RRROORRR...',
    '.....RRRR.....',
  ],
]

export const PIE: PixelMap = [
  '..LLLLLLLLLLLL..',
  '.LGGGGGGGGGGGGL.',
  'LGGGGGGGGGGGGGGL',
  'LDGGGGGGGGGGGGDL',
  '.DDDDDDDDDDDDDD.',
  '..DDDDDDDDDDDD..',
]

export const SPRING: PixelMap = [
  '..OOOOOOOOOOOO..',
  '.O............O.',
  '..YYYYYYYYYYYY..',
  '.Y............Y.',
  '..YYYYYYYYYYYY..',
  '.Y............Y.',
  '..YYYYYYYYYYYY..',
  '.Y............Y.',
  '..OOOOOOOOOOOO..',
]

export const SPRING_SQUASH: PixelMap = [
  '.OOOOOOOOOOOOOO.',
  'O..............O',
  '.YYYYYYYYYYYYYY.',
  'Y..............Y',
  '.OOOOOOOOOOOOOO.',
]

export const RIVET: PixelMap = [
  'YYYYYY',
  'YKKKKY',
  'YKYYKY',
  'YKYYKY',
  'YKKKKY',
  'YYYYYY',
]

export const HAT: PixelMap = [
  '...PPPPPP...',
  '..PPPPPPPP..',
  '..PWWWWWWP..',
  'PPPPPPPPPPPP',
  'PPPPPPPPPPPP',
]

export const PURSE: PixelMap = [
  '...PPPP...',
  '..P....P..',
  '.PPPPPPPP.',
  'PPPPPPPPPP',
  'PPPPWWPPPP',
  'PPPPPPPPPP',
  'PPPPPPPPPP',
  '.PPPPPPPP.',
]

export const PARASOL: PixelMap = [
  '.....PP.....',
  '...PPPPPP...',
  '..PPWPPWPP..',
  '.PPPWPPWPPP.',
  'PPPPPPPPPPPP',
  'P.P.P.P.P.P.',
  '.....HH.....',
  '.....HH.....',
  '.....HH.....',
  '.....HH.....',
  '.....HH.....',
  '....HHH.....',
  '....HH......',
]

export const HEART: PixelMap = [
  '.RRR..RRR.',
  'RRRRRRRRRR',
  'RRRRRRRRRR',
  'RRRRRRRRRR',
  '.RRRRRRRR.',
  '..RRRRRR..',
  '...RRRR...',
  '....RR....',
]

export const HEART_BROKEN: PixelMap = [
  '.RRR..RRR.',
  'RRRR.RRRRR',
  'RRRR.RRRRR',
  'RRRR..RRRR',
  '.RRR..RRR.',
  '..RR.RRR..',
  '...R.RR...',
  '....R.....',
]

export const OIL_DRUM: PixelMap = [
  'NNNNNNNNNNNNNNNN',
  'NTTTTTTTTTTTTTTN',
  'NNNNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNNNN',
  'NNNWWWNWNWNNNNNN',
  'NNNWNWNWNWNNNNNN',
  'NNNWNWNWNWNNNNNN',
  'NNNWWWNWNWWWNNNN',
  'NNNNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNNNN',
  'NTTTTTTTTTTTTTTN',
  'NNNNNNNNNNNNNNNN',
]

export const FLAME: PixelMap[] = [
  [
    '....R...........',
    '...RR....R......',
    '...ROR..RR......',
    '..ROOR.ROR..R...',
    '..ROYRRROR.RR...',
    '.ROYYOOOYORROR..',
    '.ROYYYYYYOROOR..',
    'ROYYWWYYYYOYOR..',
    'ROYYWWYYYYYYOR..',
    '.ROYYYYYYYYYOR..',
    '..ROOYYYYYOOR...',
    '...RRRRRRRRR....',
  ],
  [
    '..........R.....',
    '....R....RR.....',
    '....RR..ROR.....',
    '...ROR.ROOR.....',
    '..R.ROROOYR.....',
    '..RROYOOYYOR....',
    '.ROOYYYYYYYOR...',
    '.ROYYYYWWYYOR...',
    'ROYYYYYWWYYYOR..',
    'ROYYYYYYYYYYOR..',
    '.ROOYYYYYYOOR...',
    '...RRRRRRRRR....',
  ],
]

export const GEAR: PixelMap[] = [
  [
    '..Y..Y..',
    '.YYYYYY.',
    'YYYKKYYY',
    '.YYKKYY.',
    '.YYKKYY.',
    'YYYKKYYY',
    '.YYYYYY.',
    '..Y..Y..',
  ],
  [
    '.Y....Y.',
    'YYYYYYYY',
    '.YYKKYY.',
    '.YKKKKY.',
    '.YKKKKY.',
    '.YYKKYY.',
    'YYYYYYYY',
    '.Y....Y.',
  ],
]

/** 5x7 pixel font, 6px advance. */
export const FONT: Record<string, string[]> = {
  '0': [' ### ', '#   #', '#  ##', '# # #', '##  #', '#   #', ' ### '],
  '1': ['  #  ', ' ##  ', '  #  ', '  #  ', '  #  ', '  #  ', ' ### '],
  '2': [' ### ', '#   #', '    #', '   # ', '  #  ', ' #   ', '#####'],
  '3': ['#####', '   # ', '  #  ', '   # ', '    #', '#   #', ' ### '],
  '4': ['   # ', '  ## ', ' # # ', '#  # ', '#####', '   # ', '   # '],
  '5': ['#####', '#    ', '#### ', '    #', '    #', '#   #', ' ### '],
  '6': ['  ## ', ' #   ', '#    ', '#### ', '#   #', '#   #', ' ### '],
  '7': ['#####', '    #', '   # ', '  #  ', ' #   ', ' #   ', ' #   '],
  '8': [' ### ', '#   #', '#   #', ' ### ', '#   #', '#   #', ' ### '],
  '9': [' ### ', '#   #', '#   #', ' ####', '    #', '   # ', ' ##  '],
  'A': [' ### ', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
  'B': ['#### ', '#   #', '#   #', '#### ', '#   #', '#   #', '#### '],
  'C': [' ### ', '#   #', '#    ', '#    ', '#    ', '#   #', ' ### '],
  'D': ['###  ', '#  # ', '#   #', '#   #', '#   #', '#  # ', '###  '],
  'E': ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#####'],
  'F': ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#    '],
  'G': [' ### ', '#   #', '#    ', '# ###', '#   #', '#   #', ' ####'],
  'H': ['#   #', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
  'I': [' ### ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', ' ### '],
  'J': ['  ###', '   # ', '   # ', '   # ', '   # ', '#  # ', ' ##  '],
  'K': ['#   #', '#  # ', '# #  ', '##   ', '# #  ', '#  # ', '#   #'],
  'L': ['#    ', '#    ', '#    ', '#    ', '#    ', '#    ', '#####'],
  'M': ['#   #', '## ##', '# # #', '# # #', '#   #', '#   #', '#   #'],
  'N': ['#   #', '#   #', '##  #', '# # #', '#  ##', '#   #', '#   #'],
  'O': [' ### ', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  'P': ['#### ', '#   #', '#   #', '#### ', '#    ', '#    ', '#    '],
  'Q': [' ### ', '#   #', '#   #', '#   #', '# # #', '#  # ', ' ## #'],
  'R': ['#### ', '#   #', '#   #', '#### ', '# #  ', '#  # ', '#   #'],
  'S': [' ####', '#    ', '#    ', ' ### ', '    #', '    #', '#### '],
  'T': ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  '],
  'U': ['#   #', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  'V': ['#   #', '#   #', '#   #', '#   #', '#   #', ' # # ', '  #  '],
  'W': ['#   #', '#   #', '#   #', '# # #', '# # #', '## ##', '#   #'],
  'X': ['#   #', '#   #', ' # # ', '  #  ', ' # # ', '#   #', '#   #'],
  'Y': ['#   #', '#   #', ' # # ', '  #  ', '  #  ', '  #  ', '  #  '],
  'Z': ['#####', '    #', '   # ', '  #  ', ' #   ', '#    ', '#####'],
  '=': ['     ', '     ', '#####', '     ', '#####', '     ', '     '],
  '!': ['  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '     ', '  #  '],
  '?': [' ### ', '#   #', '    #', '   # ', '  #  ', '     ', '  #  '],
  '.': ['     ', '     ', '     ', '     ', '     ', '     ', '  #  '],
  ':': ['     ', '  #  ', '     ', '     ', '     ', '  #  ', '     '],
  '-': ['     ', '     ', '     ', '#####', '     ', '     ', '     '],
  '/': ['    #', '    #', '   # ', '  #  ', ' #   ', '#    ', '#    '],
  '<': ['   # ', '  #  ', ' #   ', '#    ', ' #   ', '  #  ', '   # '],
  '>': [' #   ', '  #  ', '   # ', '    #', '   # ', '  #  ', ' #   '],
  ',': ['     ', '     ', '     ', '     ', '     ', '  #  ', ' #   '],
  "'": ['  #  ', '  #  ', '     ', '     ', '     ', '     ', '     '],
  '(': ['   # ', '  #  ', ' #   ', ' #   ', ' #   ', '  #  ', '   # '],
  ')': [' #   ', '  #  ', '   # ', '   # ', '   # ', '  #  ', ' #   '],
  '+': ['     ', '  #  ', '  #  ', '#####', '  #  ', '  #  ', '     '],
}
