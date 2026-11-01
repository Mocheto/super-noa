export const santaBattleAssets = {
  background: "./assets/worlds/santa-boss-courtyard-v1.webp",
  characters: "./assets/sprites/boss-papa-noel-sheet-v2.png",
  terrain: "./assets/atlases/santa-boss-terrain-v1.png",
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
