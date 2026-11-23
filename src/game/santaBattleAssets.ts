export const santaBattleAssets = {
  background: "./assets/worlds/santa-boss-courtyard-v1.webp",
  characters: "./assets/sprites/boss-papa-noel-sheet-v2.webp",
  terrain: "./assets/atlases/santa-boss-terrain-v1.webp",
} as const;

// Las tres salas de acción necesitan fondos propios: son panoramas separados
// del escenario para que los sprites y las plataformas sigan siendo legibles.
export const actionBossBackgrounds = {
  "santa-claus": santaBattleAssets.background,
  siroco: "./assets/worlds/desert-boss-arena-v1.webp",
  "don-silbato": "./assets/worlds/train-boss-arena-v1.webp",
} as const;

// Tight alpha bounds, with each pose anchored to the middle of its boots.
// The stunned pose includes stars above the hat without reducing Santa's body.
export const santaSpriteFrames = [
  { source: [77, 17, 328, 467], anchorX: 218, bodyHeight: 467 },
  { source: [578, 35, 359, 449], anchorX: 768, bodyHeight: 449 },
  { source: [1010, 27, 501, 457], anchorX: 1330, bodyHeight: 457 },
  { source: [82, 510, 345, 490], anchorX: 245, bodyHeight: 457 },
  { source: [591, 530, 369, 471], anchorX: 770, bodyHeight: 471 },
] as const;
export const santaGiftSource = [1154, 641, 249, 248] as const;
export const santaTerrainSources = {
  ground: [80, 360, 1090, 231],
  ledge: [38, 874, 1180, 179],
} as const;

// Terreno y proyectil propios de Siroco y Don Silbato (issue 355, docs/art/batalla-saltos-v1.md): un atlas por
// guardián con el suelo, la repisa y el proyectil apilados, recortado con prototypes/tools/batalla-saltos-recorte.py.
export const bossTerrains = {
  siroco: {
    atlas: "./assets/atlases/siroco-boss-terrain-v1.webp",
    // Sin los bloques de los extremos, para que los tramos repetidos empalmen sin juntas.
    ground: [80, 0, 992, 222],
    ledge: [0, 230, 768, 193],
    projectile: [4, 435, 120, 120],
  },
  "don-silbato": {
    atlas: "./assets/atlases/don-silbato-boss-terrain-v1.webp",
    // Sin las esquinas biseladas, que al repetir dejaban una muesca en cada unión.
    ground: [70, 0, 1012, 189],
    ledge: [0, 197, 768, 157],
    projectile: [4, 377, 120, 97],
  },
} as const;

// Las cinco poses de Siroco y Don Silbato en pixel art (issue 355): cuadrícula común de 5 × 2 casillas de 256 px, con
// las poses en la fila de abajo y los pies a 248 px de su casilla (prototypes/tools/batalla-saltos-recorte.py).
export const bossPoseSheets = {
  siroco: "./assets/sprites/boss-siroco-sheet-v2.webp",
  "don-silbato": "./assets/sprites/boss-don-silbato-sheet-v2.webp",
} as const;
/** Lado al que se dibuja la casilla en la arena (la pose más alta mide unos 135 px, como Papá Noel) y dónde van los pies. */
export const BOSS_POSE_DRAWN = 146;
export const BOSS_POSE_FEET = 248 / 256;
