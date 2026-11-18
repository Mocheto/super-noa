import { conTextos, existeClave } from "../textos/index.ts";
import type { Cannon, ChainGuardian, Chase, ChaseStop, Enemy, Level, LevelItem, Platform, RewardBlock, Theme } from "./types";

/** Pantalla tal como se declara: sin textos. Su título, pista, botón «siguiente» y frases de persecución salen del catálogo por identificador. */
type PantallaDatos = Omit<Level, "title" | "subtitle" | "chase"> & { chase?: Omit<Chase, "stops"> & { stops: Array<Omit<ChaseStop, "talk">> } };

/** Conecta una pantalla con su texto: `pantallas.<id>.titulo.rotulo`, `.pista.rotulo`, `.siguiente.juntos` y `.habla.paradaN.rotulo`. */
function conTextosDePantalla(datos: PantallaDatos): Level {
  const pantalla = conTextos(datos, { title: `pantallas.${datos.id}.titulo.rotulo`, subtitle: `pantallas.${datos.id}.pista.rotulo` }) as unknown as Level;
  if (pantalla.route && existeClave(`pantallas.${datos.id}.siguiente.juntos`)) conTextos(pantalla.route, { nextLabel: `pantallas.${datos.id}.siguiente.juntos` });
  pantalla.chase?.stops.forEach((parada, indice) => conTextos(parada, { talk: `pantallas.${datos.id}.habla.parada${indice + 1}.rotulo` }));
  return pantalla;
}

const ground = (segments: Array<[number, number]>): Platform[] =>
  segments.map(([x, width]) => ({ x, y: 456, width, height: 120, kind: "ground" }));

const caveGround = (segments: Array<[number, number]>): Platform[] =>
  segments.map(([x, width]) => ({ x, y: 456, width, height: 120, kind: "cave-ground" }));

const ledge = (x: number, y: number, width: number, kind: Platform["kind"] = "branch"): Platform => ({
  x,
  y,
  width,
  height: 22,
  kind,
});
const spring = (x: number): Platform => ({ x, y: 398, width: 100, height: 58, kind: "spring" });

const caveLedge = (x: number, y: number, width: number): Platform => ({ x, y, width, height: 24, kind: "cave-ledge" });
const caveWall = (x: number, y: number, width: number, height: number): Platform => ({ x, y, width, height, kind: "cave-wall" });
const castleGround = (segments: Array<[number, number]>): Platform[] => segments.map(([x, width]) => ({ x, y: 456, width, height: 120, kind: "castle-ground" }));
const castleLedge = (x: number, y: number, width: number): Platform => ({ x, y, width, height: 24, kind: "castle-ledge" });
const castleWall = (x: number, y: number, width: number, height: number): Platform => ({ x, y, width, height, kind: "castle-wall" });
const spikePits = (segments: Array<[number, number]>) => segments.slice(0, -1).map(([x, width], index) => ({ x: x + width, y: 454, width: segments[index + 1][0] - x - width, height: 90 }));
const dinoGround = (segments: Array<[number, number]>): Platform[] => segments.map(([x, width]) => ({ x, y: 456, width, height: 120, kind: "dino-ground" }));
const dinoLedge = (x: number, y: number, width: number): Platform => ({ x, y, width, height: 24, kind: "dino-ledge" });
const dinoWall = (x: number, y: number, width: number, height: number): Platform => ({ x, y, width, height, kind: "dino-wall" });
const themedGround = (segments: Array<[number, number]>, kind: "volcano-ground" | "garden-ground" | "ice-ground" | "factory-ground" | "warehouse-ground" | "snow-ground" | "desert-ground" | "train-ground" | "music-ground"): Platform[] => segments.map(([x, width]) => ({ x, y: 456, width, height: 120, kind }));
const themedLedge = (x: number, y: number, width: number, kind: "volcano-ledge" | "garden-ledge" | "ice-ledge" | "factory-ledge" | "warehouse-ledge" | "snow-ledge" | "desert-ledge" | "train-roof" | "music-stage"): Platform => ({ x, y, width, height: 24, kind });
const themedWall = (x: number, y: number, width: number, height: number, kind: "volcano-wall" | "ice-wall" | "factory-wall" | "warehouse-wall"): Platform => ({ x, y, width, height, kind });
const dew = (x: number, width = 110): Platform => ({ x, y: 418, width, height: 38, kind: "dew" });
const deadlyWaterPits = (segments: Array<[number, number]>) => segments.slice(0, -1).map(([x, width], index) => ({ x: x + width, y: 448, width: segments[index + 1][0] - x - width, height: 128 }));

const ship = (x: number, y: number, width: number): Platform => ({ x, y, width, height: 26, kind: "ship" });
const airPlank = (x: number, y: number, width: number): Platform => ({ x, y, width, height: 18, kind: "air-plank" });
const cloudFloor = (x: number, y: number, width: number): Platform => ({ x, y, width, height: 28, kind: "cloud-floor" });

const enemy = (
  id: string,
  kind: Enemy["kind"],
  x: number,
  y: number,
  minX: number,
  maxX: number,
  speed = 34,
): Enemy => ({
  id,
  kind,
  x,
  y,
  width: kind === "boar" ? 60 : kind === "wolf" ? 56 : kind === "sky-unicorn" || kind === "baby-t-rex" ? 58 : kind === "pterodactyl" || kind === "flying-dragon" ? 54 : kind === "bird" || kind === "parrot" || kind === "pirate" || kind === "bat" || kind === "ghost" ? 46 : 42,
  height: kind === "boar" ? 42 : kind === "wolf" || kind === "fire-salamander" ? 40 : kind === "flying-dragon" ? 38 : kind === "sky-unicorn" ? 42 : kind === "baby-t-rex" || kind === "baby-dragon" ? 46 : kind === "pterodactyl" ? 36 : kind === "pirate" || kind === "zombie" ? 50 : kind === "bird" || kind === "parrot" || kind === "bat" || kind === "ghost" ? 32 : 36,
  minX,
  maxX,
  speed,
});

const giantEnemy = (
  id: string,
  kind: "ant" | "snail" | "bee",
  x: number,
  y: number,
  minX: number,
  maxX: number,
  speed: number,
): Enemy => {
  const base = enemy(id, kind, x, y, minX, maxX, speed);
  const size = kind === "snail" ? { width: 82, height: 64 } : kind === "bee" ? { width: 78, height: 72 } : { width: 76, height: 74 };
  return {
    ...base,
    x: base.x - (size.width - base.width) / 2,
    y: base.y + base.height - size.height,
    width: size.width,
    height: size.height,
  };
};

const sleepyWolf = (
  id: string, x: number, minX: number, maxX: number, speed: number,
  sleepCycle: NonNullable<Enemy["sleepCycle"]>,
): Enemy => ({ ...enemy(id, "wolf", x, 416, minX, maxX, speed), sleepCycle });

const apple = (id: string, x: number, y: number): LevelItem => ({ id, kind: "apple", x, y });
const sticker = (id: string, x: number, y: number): LevelItem => ({ id, kind: "sticker", x, y });
const reward = (id: string, x: number, y = 330, kind: RewardBlock["reward"] = "cat"): RewardBlock => ({
  id,
  x,
  y,
  reward: kind,
});
const cannon = (id: string, x: number, y: number, direction: Cannon["direction"], interval = 2.4): Cannon => ({ id, x, y, direction, interval });
const chainGuardian = (id: string, anchorX: number, screen: 1 | 2 | 3, delay = 0): ChainGuardian => ({
  id, anchorX, groundY: 456, leashLength: screen === 1 ? 170 : 180, width: 80, height: 56,
  patrolSpeed: 70 + screen * 8, lungeSpeed: 310 + screen * 30,
  patrolDuration: 3.2 - screen * .2, warningDuration: 1.25 - screen * .1,
  lungeDuration: .85, recoveryDuration: 1.4 - screen * .1, delay,
});
const jumpingFish = (id: string, x: number, interval: number, delay: number, jumpHeight = 345) => ({
  id, x, surfaceY: 448, width: 56, height: 52, interval, delay, jumpHeight,
});
const lavaJet = (id: string, x: number, interval: number, delay: number, height = 285) => ({ id, x, baseY: 456, width: 54, height, interval, delay });
const iceWind = (id: string, x: number, width: number, direction: -1 | 1, strength = 310) => ({ id, x, y: 70, width, height: 386, direction, strength });

/** Nombre de cada decorado, leído del catálogo (`temas.<tema>.rotulo`). */
export const themeNames = conTextos({} as Record<Theme, string>, {
  "orchard-day": "temas.orchard-day.rotulo",
  "orchard-sunset": "temas.orchard-sunset.rotulo",
  "forest-dusk": "temas.forest-dusk.rotulo",
  "forest-night": "temas.forest-night.rotulo",
  "crystal-cave": "temas.crystal-cave.rotulo",
  "wolf-pines": "temas.wolf-pines.rotulo",
  "wolf-moon": "temas.wolf-moon.rotulo",
  "boar-canopy": "temas.boar-canopy.rotulo",
  "boar-storm": "temas.boar-storm.rotulo",
  "sky-pirates": "temas.sky-pirates.rotulo",
  "sky-storm": "temas.sky-storm.rotulo",
  "haunted-castle": "temas.haunted-castle.rotulo",
  "secret-sky": "temas.secret-sky.rotulo",
  "water-lagoon": "temas.water-lagoon.rotulo",
  "dinosaur-island": "temas.dinosaur-island.rotulo",
  "dragon-volcano": "temas.dragon-volcano.rotulo",
  "giant-valley": "temas.giant-valley.rotulo",
  "ice-mountain": "temas.ice-mountain.rotulo",
  "winter-snow": "temas.winter-snow.rotulo",
  "toy-factory": "temas.toy-factory.rotulo",
  "gift-warehouse": "temas.gift-warehouse.rotulo",
  "desert-dunes": "temas.desert-dunes.rotulo",
  "desert-oasis": "temas.desert-oasis.rotulo",
  "desert-ruins": "temas.desert-ruins.rotulo",
  "train-station": "temas.train-station.rotulo",
  "train-valley": "temas.train-valley.rotulo",
  "train-engine": "temas.train-engine.rotulo",
  "music-garden": "temas.music-garden.rotulo",
  "music-bells": "temas.music-bells.rotulo",
  "music-theater": "temas.music-theater.rotulo",
  "sky-dawn": "temas.sky-dawn.rotulo",
  "sky-blue": "temas.sky-blue.rotulo",
  "sky-stars": "temas.sky-stars.rotulo",
});

const skyCloud = (x: number, y: number, width = 190): Platform => ({ x, y, width, height: 30, kind: "sky-cloud" });
const skyLevelPlatforms = (height: number, offset = 0): Platform[] => {
  const platforms: Platform[] = [skyCloud(40, height - 90, 880)];
  for (let index = 0, y = height - 245; y > 105; index += 1, y -= 145) {
    const pattern = (index + offset) % 4;
    // Zigzag corto: entre una nube y la siguiente nunca hay más de 80 px en horizontal.
    const x = pattern === 0 ? 100 : pattern === 1 ? 470 : pattern === 2 ? 260 : 450;
    platforms.push(skyCloud(x, y, pattern === 0 ? 290 : pattern === 1 ? 220 : 240));
    if (index >= 3 && index % 7 === 3) platforms.push({
      x: x < 400 ? 740 : 45, y, width: 145, height: 34, kind: "sky-bounce",
      bounceSpeed: 1450, bounceDrift: 330,
    });
  }
  platforms.push(skyCloud(330, 90, 300));
  return platforms;
};

const skyLiftLevelPlatforms = (height: number, offset: number, bottomY: number, topY: number): Platform[] => [
  ...skyLevelPlatforms(height, offset).map((platform) =>
    platform.kind === "sky-cloud" && platform.x === 100 && platform.y > topY && platform.y < bottomY
      ? { ...platform, x: 240 }
      : platform),
  { x: 210, y: topY, width: 250, height: 30, kind: "sky-lift-station" },
];

// Identificadores estables: A es el desvío acuático entre los mundos 3 y 4.
const seaFloor = (width: number): Platform => ({ x: 0, y: 490, width, height: 90, kind: "sea-ground" });
const reef = (x: number, y: number, width: number, height: number): Platform => ({ x, y, width, height, kind: "sea-wall" });
const seaLedge = (x: number, y: number, width: number): Platform => ({ x, y, width, height: 24, kind: "sea-ledge" });
const water = (width: number) => [{ x: 0, y: 120, width, height: 430 }];

const datosAgua: PantallaDatos[] = [
  {
    id: "A-1", world: 8, screen: 1,
    theme: "water-lagoon", width: 3300, start: { x: 80, y: 70 }, goalX: 3080,
    waterZones: water(3300),
    platforms: [seaFloor(3300), seaLedge(0, 110, 280), seaLedge(630, 285, 230), seaLedge(1180, 165, 220), reef(1550, 365, 150, 125), seaLedge(2040, 255, 230), seaLedge(2600, 165, 200), seaLedge(2990, 250, 310)],
    enemies: [enemy("a1-f1", "fish", 920, 240, 880, 1120, 44), enemy("a1-f2", "fish", 1770, 220, 1710, 1970, 50), enemy("a1-f3", "fish", 2420, 350, 2300, 2540, 46), enemy("a1-u1", "urchin", 1080, 454, 1080, 1080, 0), enemy("a1-u2", "urchin", 2230, 454, 2230, 2230, 0)],
    items: [apple("a1-apple1", 400, 175), apple("a1-apple2", 720, 235), apple("a1-apple3", 1460, 430), apple("a1-apple4", 2150, 205), sticker("sticker-a-1", 2670, 290)],
    rewardBlocks: [reward("a1-cat", 510, 320), reward("a1-armor", 1900, 360, "apple")], checkpoints: [400, 1450, 2400],
  },
  {
    id: "A-2", world: 8, screen: 2,
    theme: "water-lagoon", width: 4200, start: { x: 80, y: 70 }, goalX: 3980,
    waterZones: water(4200),
    platforms: [seaFloor(4200), seaLedge(0, 110, 260), reef(750, 330, 160, 160), reef(1250, 120, 180, 170), seaLedge(1660, 240, 260), reef(2220, 330, 170, 160), reef(2740, 120, 180, 170), seaLedge(3200, 245, 230), seaLedge(3880, 250, 320)],
    enemies: [enemy("a2-f1", "fish", 460, 230, 340, 630, 54), enemy("a2-f2", "fish", 1520, 360, 1450, 1940, 60), enemy("a2-f3", "fish", 2510, 220, 2410, 2680, 57), enemy("a2-f4", "fish", 3470, 330, 3440, 3780, 60), enemy("a2-u1", "urchin", 1030, 454, 1030, 1030, 0), enemy("a2-u2", "urchin", 1990, 454, 1990, 1990, 0), enemy("a2-u3", "urchin", 3080, 454, 3080, 3080, 0)],
    items: [apple("a2-apple1", 810, 275), apple("a2-apple2", 1560, 420), apple("a2-apple3", 2310, 275), apple("a2-apple4", 3370, 190), sticker("sticker-a-2", 2820, 370)],
    rewardBlocks: [reward("a2-cat", 530, 325), reward("a2-armor", 2540, 365, "apple")], checkpoints: [520, 1630, 2580, 3540], route: { required: "A-1" },
  },
  {
    id: "A-3", world: 8, screen: 3,
    theme: "water-lagoon", width: 5100, start: { x: 80, y: 70 }, goalX: 4880,
    waterZones: water(5100),
    platforms: [seaFloor(5100), seaLedge(0, 110, 260), reef(700, 310, 180, 180), reef(1130, 90, 180, 200), seaLedge(1550, 285, 220), reef(2090, 320, 180, 170), reef(2590, 100, 180, 200), seaLedge(3120, 250, 250), reef(3640, 310, 180, 180), reef(4100, 105, 170, 190), seaLedge(4770, 250, 330)],
    enemies: [enemy("a3-f1", "fish", 460, 240, 320, 610, 62), enemy("a3-f2", "fish", 1430, 365, 1350, 1900, 65), enemy("a3-f3", "fish", 2400, 200, 2300, 2510, 68), enemy("a3-f4", "fish", 2900, 370, 2820, 3080, 65), enemy("a3-f5", "fish", 4390, 330, 4320, 4670, 72), enemy("a3-u1", "urchin", 990, 454, 990, 990, 0), enemy("a3-u2", "urchin", 1950, 454, 1950, 1950, 0), enemy("a3-u3", "urchin", 3470, 454, 3470, 3470, 0), enemy("a3-u4", "urchin", 4540, 454, 4540, 4540, 0)],
    items: [apple("a3-apple1", 790, 255), apple("a3-apple2", 1670, 230), apple("a3-apple3", 2180, 265), apple("a3-apple4", 3230, 195), apple("a3-apple5", 4630, 180), sticker("sticker-a-3", 4160, 375)],
    rewardBlocks: [reward("a3-cat", 500, 330), reward("a3-armor", 2990, 350, "apple")], checkpoints: [510, 1600, 2870, 3920, 4630], boss: "shark-captain",
    route: { required: "A-2", next: "4-1" },
  },
];

const castleFloor1: Array<[number, number]> = [[0, 760], [900, 950], [1990, 900], [3030, 1040], [4210, 990]];
const castleFloor3: Array<[number, number]> = [[0, 760], [900, 920], [1960, 950], [3050, 950], [4130, 1000], [5260, 1240]];
const dinoFloor1: Array<[number, number]> = [[0, 1250], [1390, 820], [2350, 760], [3250, 600], [3990, 610]];
const dinoFloor3: Array<[number, number]> = [[0, 1180], [1320, 700], [2160, 840], [3140, 680], [3960, 840], [4940, 680], [5760, 740]];
const world10Floor1: Array<[number, number]> = [[0, 1720], [1860, 640], [2640, 720], [3500, 660], [4300, 700], [5140, 460]];
const world10Floor3: Array<[number, number]> = [[0, 1300], [1440, 700], [2280, 760], [3180, 820], [4140, 660], [4940, 760], [5840, 660]];
const world11Floor1: Array<[number, number]> = [[0, 1720], [1880, 700], [2740, 640], [3540, 620], [4320, 520], [5000, 600]];
const world11Floor2: Array<[number, number]> = [[0, 1500], [1660, 900], [2730, 800], [3700, 700], [4570, 1230]];
const world11Floor3: Array<[number, number]> = [[0, 860], [1020, 760], [1940, 700], [2800, 620], [3580, 640], [4380, 560], [5100, 1400]];
const world12Floor1: Array<[number, number]> = [[0, 1880], [2020, 500], [2660, 470], [3270, 640], [4050, 520], [4710, 890]];
const world12Floor3: Array<[number, number]> = [[0, 860], [1000, 780], [1930, 620], [2690, 700], [3540, 560], [4250, 640], [5040, 1460]];

export const waterLevels: Level[] = datosAgua.map(conTextosDePantalla);

/** Todas las pantallas de campaña y secretas, con sus textos leídos del catálogo. */
const datosPantallas: PantallaDatos[] = [
  {
    id: "1-1",
    detourEntrance: { id: "mill", x: 1545, y: 220, width: 80, height: 80 },
    world: 1,
    screen: 1,
    theme: "orchard-day",
    width: 3600,
    start: { x: 80, y: 380 },
    goalX: 3440,
    // Presentación: paseo sin huecos con el muelle a la vista. Giro (invertido): el segundo muelle está detrás
    // de una rama y hay que volver hacia él.
    beats: { development: 1000, twist: 1850, finale: 2700, twistKind: "invert" },
    platforms: [
      ...ground([[0, 3600]]),
      ledge(330, 370, 180), ledge(590, 315, 150), ledge(1030, 370, 190),
      ledge(1510, 300, 180), ledge(1980, 365, 170), ledge(2310, 310, 190),
      ledge(2790, 350, 190), ledge(3150, 325, 180),
      ledge(820, 80, 180), ledge(2915, 90, 180),
      spring(850), spring(2960),
    ],
    enemies: [
      enemy("e1", "slime", 560, 420, 520, 720, 26),
      enemy("e2", "beetle", 1110, 420, 970, 1320, 32),
      enemy("e3", "slime", 2050, 420, 1880, 2220, 28),
      enemy("e4", "beetle", 2630, 420, 2500, 2860, 34),
      enemy("e5", "slime", 3220, 420, 3060, 3360, 30),
    ],
    items: [
      apple("a1", 250, 410), apple("a2", 635, 265), apple("a3", 1100, 320),
      apple("a4", 1540, 250), apple("a5", 2380, 260), apple("a6", 3210, 245),
      apple("spring-apple-1", 900, 30), apple("spring-apple-2", 2990, 40),
      sticker("sticker-1-1", 1635, 250),
    ],
    rewardBlocks: [reward("r1", 1370)],
    checkpoints: [1120, 2350],
  },
  {
    id: "1-2",
    world: 1,
    screen: 2,
    theme: "orchard-sunset",
    width: 5200,
    start: { x: 80, y: 380 },
    goalX: 5050,
    // Persecución amable: el escarabajo salta los huecos, sube por las ramas en el giro y espera en el rincón.
    beats: { development: 1900, twist: 3150, finale: 4400, twistKind: "shape" },
    platforms: [
      ...ground([[0, 1500], [1640, 1300], [3080, 1100], [4320, 880]]),
      ledge(300, 370, 180), ledge(540, 305, 170), ledge(2050, 300, 170), ledge(2400, 370, 180),
      ledge(3100, 330, 180), ledge(3550, 250, 170),
      ledge(1080, 80, 180), ledge(3480, 90, 180),
      spring(1100), spring(3500),
    ],
    chase: {
      runner: "beetle", carries: "yarn",
      stops: [
        { x: 700, y: 456,beat: "presentation" },
        { x: 1250, y: 456,beat: "presentation" },
        { x: 1900, y: 456, jump: true,beat: "development" },
        { x: 2490, y: 370, jump: true,beat: "development" },
        { x: 3150, y: 330, jump: true,beat: "twist" },
        { x: 3620, y: 250, jump: true,beat: "twist" },
        { x: 4400, y: 456, jump: true,beat: "finale" },
        { x: 5050, y: 456,beat: "finale" },
      ],
    },
    enemies: [
      enemy("e2", "slime", 900, 420, 820, 1050, 28),
      enemy("e3", "cloud", 2200, 250, 2000, 2400, 22),
      enemy("e5", "slime", 3800, 420, 3700, 3950, 30),
      enemy("e6", "cloud", 4600, 255, 4450, 4800, 24),
    ],
    items: [
      apple("a1", 230, 410), apple("a2", 585, 255), apple("a3", 2450, 320), apple("a4", 3150, 280),
      apple("a5", 3600, 200), sticker("sticker-1-2", 2100, 250), apple("a6", 4700, 410),
      apple("spring-apple-1", 1130, 30), apple("spring-apple-2", 3530, 40),
    ],
    rewardBlocks: [reward("r1", 900), reward("r2", 4000, 325, "apple")],
    checkpoints: [1300, 1700, 3150, 4400],
  },
  {
    id: "1-3",
    secretShop: { id: "shop-1-2", x: 2240, y: 200, width: 64, height: 80 },
    world: 1,
    screen: 3,
    theme: "orchard-sunset",
    width: 6500,
    start: { x: 80, y: 380 },
    goalX: 6320,
    // Giro (combina): muelle, nubes y escarabajos juntos antes del Rey Zarzal.
    beats: { development: 650, twist: 3450, finale: 5000, twistKind: "combine" },
    platforms: [
      ...ground([[0, 1420], [1520, 1420], [3060, 1520], [4700, 1800]]),
      ledge(320, 360, 190), ledge(720, 300, 180), ledge(1120, 350, 210),
      ledge(1740, 345, 200), ledge(2180, 280, 190), ledge(2670, 350, 200),
      ledge(3290, 360, 210), ledge(3730, 295, 180), ledge(4230, 345, 210),
      ledge(4940, 350, 200), ledge(5400, 325, 190), ledge(5860, 350, 210),
      ledge(1580, 95, 180), ledge(5550, 95, 180),
      spring(1700), spring(5570),
    ],
    enemies: [
      enemy("e1", "beetle", 590, 420, 450, 850, 34),
      enemy("e2", "slime", 1120, 420, 970, 1340, 30),
      enemy("e3", "cloud", 1900, 240, 1740, 2050, 24),
      enemy("e4", "beetle", 2580, 420, 2390, 2860, 36),
      enemy("e5", "slime", 3420, 420, 3240, 3650, 30),
      enemy("e6", "cloud", 4160, 235, 3950, 4400, 25),
      enemy("e7", "beetle", 5150, 420, 4950, 5400, 38),
      enemy("e8", "slime", 5900, 420, 5700, 6140, 32),
    ],
    items: [
      apple("a1", 250, 410), apple("a2", 780, 250), apple("a3", 1810, 295),
      apple("a4", 2240, 230), sticker("sticker-1-3", 2700, 300),
      apple("a5", 2720, 300), apple("a6", 3780, 245), apple("a7", 4990, 300),
      apple("a8", 5450, 235), apple("a9", 5940, 300),
      apple("spring-apple-1", 1750, 45), apple("spring-apple-2", 5620, 45),
    ],
    rewardBlocks: [reward("r1", 930), reward("r2", 3910, 325, "apple")],
    checkpoints: [1560, 3100, 4740, 5740],
    boss: "bramble-king",
  },
  {
    id: "2-1",
    detourEntrance: { id: "fireflies", x: 1365, y: 225, width: 80, height: 80 },
    world: 2,
    screen: 1,
    theme: "forest-dusk",
    width: 4000,
    start: { x: 80, y: 380 },
    goalX: 3840,
    // Presentación: niebla suave sin huecos. Giro (invertido): las repisas de niebla van hacia abajo.
    beats: { development: 1130, twist: 2070, finale: 3010, twistKind: "invert" },
    platforms: [
      ...ground([[0, 4000]]),
      ledge(290, 350, 210, "stone"), ledge(910, 375, 190, "stone"),
      ledge(1320, 305, 190, "mist"), ledge(1810, 365, 180, "stone"),
      ledge(2180, 295, 210, "mist"), ledge(2720, 350, 190, "stone"),
      ledge(3180, 290, 200, "mist"), ledge(3510, 360, 180, "stone"),
    ],
    enemies: [
      enemy("e1", "slime", 520, 420, 430, 650, 28),
      enemy("e2", "cloud", 1060, 250, 930, 1180, 22),
      enemy("e3", "beetle", 1880, 420, 1710, 2100, 34),
      enemy("e4", "slime", 2610, 420, 2460, 2870, 28),
      enemy("e5", "cloud", 3260, 235, 3100, 3420, 24),
      enemy("e6", "beetle", 3600, 420, 3480, 3740, 34),
    ],
    items: [
      apple("a1", 760, 410), apple("a2", 1345, 255), apple("a3", 2240, 245),
      sticker("sticker-2-1", 2325, 245), apple("a4", 3260, 240),
    ],
    rewardBlocks: [reward("r1", 1530)],
    checkpoints: [1180, 2460, 3380],
  },
  {
    id: "2-2",
    world: 2,
    screen: 2,
    theme: "crystal-cave",
    width: 3840,
    start: { x: 60, y: 398 },
    goalX: 3790,
    // Sala-rompecabezas: la niebla vuelve en el giro, con repisas que casi no se ven.
    beats: { development: 960, twist: 1920, finale: 2880, twistKind: "shape" },
    platforms: [
      ...caveGround([[0, 3840]]),
      caveWall(872, -400, 64, 716), caveWall(1832, -400, 64, 716), caveWall(2792, -400, 64, 716), caveWall(3592, -400, 64, 716), caveWall(3692, -400, 64, 716),
      ledge(2150, 350, 130, "mist"), ledge(2300, 260, 120, "mist"),
      caveLedge(2460, 170, 170), caveLedge(3300, 175, 130),
    ],
    enemies: [],
    items: [
      apple("a1", 150, 300), apple("a2", 760, 300), apple("a3", 1400, 300), apple("a4", 2200, 300),
      sticker("sticker-2-2", 2470, 116), apple("a5", 3100, 300), apple("a6", 3550, 300),
    ],
    rewardBlocks: [reward("r1", 500, 300), reward("r2", 1600, 300, "apple")],
    checkpoints: [],
    puzzleRooms: [
      {
        x: 0, entry: { x: 60, y: 398 }, exitDoor: "g2-d1",
        triggers: [{ id: "g2-t1", kind: "paw", x: 650, y: 456, width: 72, opens: "g2-d1" }],
        doors: [{ id: "g2-d1", symbol: "paw", x: 880, y: 316, width: 48, height: 140 }],
      },
      {
        x: 960, entry: { x: 1000, y: 398 }, exitDoor: "g2-d2",
        triggers: [{ id: "g2-t2", kind: "plate", x: 1180, y: 456, width: 92, opens: "g2-d2" }],
        doors: [{ id: "g2-d2", symbol: "star", x: 1840, y: 316, width: 48, height: 140 }],
        crates: [{ id: "g2-c2", x: 1020, y: 456, minX: 1000, maxX: 1250 }],
      },
      {
        x: 1920, entry: { x: 1960, y: 398 }, exitDoor: "g2-d3",
        triggers: [{ id: "g2-t3", kind: "paw", x: 2500, y: 170, width: 72, opens: "g2-d3" }],
        doors: [{ id: "g2-d3", symbol: "moon", x: 2800, y: 316, width: 48, height: 140 }],
      },
      {
        x: 2880, entry: { x: 2920, y: 398 }, exitDoor: "g2-d4", startColor: "blue",
        triggers: [
          { id: "g2-t4-plate", kind: "plate", x: 3240, y: 456, width: 92, opens: "g2-d4" },
          { id: "g2-t4-pink", kind: "color", color: "pink", x: 3480, y: 456, width: 72 },
          { id: "g2-t4", kind: "paw", x: 3320, y: 175, width: 72, opens: "g2-d5" },
        ],
        doors: [
          { id: "g2-d4", symbol: "star", x: 3600, y: 316, width: 48, height: 140 },
          { id: "g2-d5", symbol: "paw", x: 3700, y: 316, width: 48, height: 140 },
        ],
        colorPlatforms: [
          { id: "g2-p4-1", color: "pink", x: 3150, y: 330, width: 100, height: 24 },
          { id: "g2-p4-2", color: "pink", x: 3200, y: 250, width: 90, height: 24 },
        ],
        crates: [{ id: "g2-c4", x: 2980, y: 456, minX: 2960, maxX: 3320 }],
      },
    ],
  },
  {
    id: "2-3",
    detourEntrance: { id: "mine", x: 2900, y: 290, width: 80, height: 80 },
    world: 2,
    screen: 3,
    theme: "crystal-cave",
    width: 6800,
    start: { x: 80, y: 380 },
    goalX: 6630,
    // Giro (combina): murciélagos, niebla de la cueva y paredes de cristal juntos antes de la Condesa.
    beats: { development: 700, twist: 3600, finale: 5240, twistKind: "combine" },
    platforms: [
      ...caveGround([[0, 720], [880, 760], [1810, 760], [2740, 780], [3700, 760], [4630, 760], [5560, 1240]]),
      caveWall(0, 0, 720, 145),
      caveWall(880, 0, 200, 225), caveWall(1180, 305, 170, 151), caveWall(1420, 0, 220, 260),
      caveLedge(990, 375, 105), caveLedge(1080, 320, 85),
      caveWall(1810, 0, 170, 190), caveWall(2080, 255, 200, 201), caveWall(2380, 0, 190, 275),
      caveLedge(1880, 365, 110), caveLedge(1980, 305, 85),
      caveWall(2740, 0, 240, 255), caveWall(3080, 285, 190, 171), caveWall(3270, 0, 250, 210),
      caveLedge(2880, 370, 105), caveLedge(2980, 315, 85),
      caveWall(3700, 0, 160, 205), caveWall(3960, 240, 200, 216), caveWall(4260, 0, 200, 280),
      caveLedge(3780, 365, 105), caveLedge(3870, 300, 80),
      caveWall(4630, 0, 230, 260), caveWall(4960, 275, 190, 181), caveWall(5240, 0, 150, 220),
      caveLedge(4770, 370, 105), caveLedge(4870, 310, 80),
      caveWall(5560, 0, 160, 190), caveWall(5820, 250, 190, 206), caveWall(6110, 0, 110, 270), caveWall(6320, 315, 150, 141),
      caveLedge(5650, 370, 105), caveLedge(5740, 305, 70), caveLedge(6200, 360, 100),
    ],
    enemies: [
      enemy("e1", "slime", 430, 420, 300, 670, 32),
      enemy("b1", "bat", 1020, 255, 920, 1150, 34),
      enemy("b2", "bat", 1500, 285, 1390, 1590, 36),
      enemy("e2", "beetle", 1900, 420, 1850, 2030, 38),
      enemy("b3", "bat", 2400, 300, 2320, 2520, 38),
      enemy("e3", "slime", 3350, 420, 3290, 3480, 34),
      enemy("b4", "bat", 3410, 250, 3310, 3480, 40),
      enemy("e4", "beetle", 3780, 420, 3740, 3910, 40),
      enemy("b5", "bat", 4320, 300, 4200, 4420, 40),
      enemy("e5", "slime", 4710, 420, 4680, 4910, 36),
      enemy("b6", "bat", 5280, 260, 5190, 5360, 42),
      enemy("e6", "beetle", 5650, 420, 5600, 5780, 40),
      enemy("b7", "bat", 6150, 300, 6060, 6280, 43),
    ],
    items: [
      apple("a1", 580, 410), apple("a2", 1230, 255), apple("a3", 2140, 205),
      apple("a4", 3140, 235), apple("a5", 4020, 190), apple("a6", 5020, 225),
      apple("a7", 5880, 200), sticker("sticker-2-3", 5940, 200), apple("a8", 6370, 265),
    ],
    rewardBlocks: [reward("r1", 1420, 300), reward("r2", 3350, 330, "apple"), reward("r3", 5230, 330)],
    checkpoints: [900, 1830, 2760, 4650, 5580],
    boss: "mist-countess",
  },
  {
    id: "3-1",
    world: 3,
    screen: 1,
    theme: "wolf-pines",
    width: 4500,
    start: { x: 80, y: 380 },
    goalX: 4330,
    beats: { development: 1275, twist: 2338, finale: 3400, twistKind: "invert" },
    platforms: [
      ...ground([[0, 1100], [1190, 1300], [2590, 1910]]),
      ledge(320, 355, 200, "stone"), ledge(700, 295, 180),
      ledge(1420, 350, 210, "stone"), ledge(1880, 285, 200),
      ledge(2830, 350, 210, "stone"), ledge(3300, 290, 190), ledge(3810, 350, 200, "stone"),
    ],
    enemies: [
      sleepyWolf("w1", 570, 460, 880, 38, { interval: 12, delay: 0, sleepDuration: 8, warningDuration: 1.5 }),
      sleepyWolf("w2", 1510, 1350, 1780, 40, { interval: 12, delay: 1, sleepDuration: 8, warningDuration: 1.5 }),
      enemy("w3", "cloud", 2130, 235, 1970, 2340, 24),
      sleepyWolf("w4", 2920, 2760, 3190, 42, { interval: 12, delay: 2, sleepDuration: 8, warningDuration: 1.5 }),
      sleepyWolf("w5", 3850, 3690, 4170, 42, { interval: 12, delay: 0.5, sleepDuration: 8, warningDuration: 1.5 }),
    ],
    items: [
      apple("a1", 1000, 410), apple("a2", 1960, 235), apple("a3", 3315, 240),
      sticker("sticker-3-1", 3410, 240), apple("a4", 3910, 300),
    ],
    rewardBlocks: [reward("r1", 920)],
    checkpoints: [1220, 2620, 3650],
  },
  {
    id: "3-2",
    secretShop: { id: "shop-3-2", x: 1150, y: 230, width: 64, height: 80 },
    world: 3,
    screen: 2,
    theme: "wolf-moon",
    width: 3200, height: 1000, orientation: "explore",
    start: { x: 80, y: 398 },
    goalX: 830, goalY: 456,
    // Exploración: un gatito casi a la vista, otro en la copa del árbol y el tercero en el túnel, tras los lobos
    // dormidos; la pared junto al hueco se abre con los tres. La tienda es un hallazgo opcional.
    beats: { development: 200, twist: 2050, finale: 760, twistKind: "shape" },
    platforms: [
      { x: 0, y: 456, width: 1400, height: 80, kind: "ground" }, { x: 1560, y: 456, width: 1640, height: 80, kind: "ground" }, { x: 1300, y: 820, width: 900, height: 100, kind: "ground" },
      ledge(300, 360, 160), ledge(120, 270, 160), ledge(320, 180, 160), ledge(140, 90, 180),
      ledge(1100, 310, 200, "stone"), ledge(2150, 730, 120), ledge(2650, 350, 180, "stone"),
    ],
    enemies: [
      { ...enemy("w1", "wolf", 650, 416, 560, 680, 40), sleepCycle: { interval: 10.5, delay: 0, sleepDuration: 6.5, warningDuration: 1.5 } },
      { ...enemy("w2", "wolf", 1800, 416, 1700, 2000, 42), sleepCycle: { interval: 11, delay: 1, sleepDuration: 7, warningDuration: 1.5 } },
      { ...enemy("w4", "wolf", 2400, 416, 2300, 2600, 44), sleepCycle: { interval: 10.5, delay: 2, sleepDuration: 6.5, warningDuration: 1.5 } },
      { ...enemy("w5", "wolf", 2850, 416, 2750, 3000, 45), sleepCycle: { interval: 11, delay: 0.5, sleepDuration: 7, warningDuration: 1.5 } },
      { ...enemy("w7", "wolf", 1550, 780, 1450, 1750, 46), sleepCycle: { interval: 10.5, delay: 1.5, sleepDuration: 6.5, warningDuration: 1.5 } },
      { ...enemy("w8", "wolf", 1900, 780, 1850, 2000, 48), sleepCycle: { interval: 11, delay: 2.5, sleepDuration: 7, warningDuration: 1.5 } },
    ],
    items: [
      apple("a1", 180, 410), apple("a2", 350, 310), apple("a3", 170, 220), apple("a4", 1700, 770),
      apple("a5", 2700, 300), sticker("sticker-3-2", 2720, 300), apple("a6", 3050, 410),
    ],
    rewardBlocks: [reward("r1", 300, 330), reward("r2", 2500, 330, "apple")],
    checkpoints: [],
    verticalCheckpoints: [{ x: 1700, y: 456 }, { x: 1350, y: 820 }],
    exploreGate: { x: 760, y: 296, width: 140, height: 160 },
    lostKittens: [
      { id: "w3-k1", x: 430, y: 456, cat: 3, beat: "presentation" },
      { id: "w3-k2", x: 200, y: 90, cat: 4, beat: "development" },
      { id: "w3-k3", x: 2050, y: 820, cat: 8, beat: "twist" },
    ],
    exploreShortcut: [{ x: 1560, y: 216, width: 40, height: 240, kind: "puzzle-block" }],
  },
  {
    id: "3-3",
    route: { next: "4-1", waterExit: "A-1" },
    world: 3,
    screen: 3,
    theme: "wolf-moon",
    width: 7200,
    start: { x: 80, y: 380 },
    goalX: 7030,
    beats: { development: 730, twist: 3823, finale: 5560, twistKind: "combine" },
    platforms: [
      ...ground([[0, 1300], [1420, 1500], [3055, 1600], [4800, 2400]]),
      ledge(320, 355, 200, "stone"), ledge(760, 290, 180), ledge(1110, 350, 180, "stone"),
      ledge(1680, 345, 210), ledge(2160, 280, 190, "stone"), ledge(2630, 345, 200),
      ledge(3330, 350, 210, "stone"), ledge(3810, 280, 190), ledge(4310, 345, 210, "stone"),
      ledge(5100, 350, 210), ledge(5590, 280, 190, "stone"), ledge(6080, 345, 210),
      ledge(6510, 285, 190, "stone"),
    ],
    enemies: [
      sleepyWolf("w1", 520, 400, 790, 42, { interval: 10, delay: 0, sleepDuration: 6, warningDuration: 1.5 }),
      sleepyWolf("w2", 1060, 900, 1240, 44, { interval: 10.5, delay: 1, sleepDuration: 6.5, warningDuration: 1.5 }),
      sleepyWolf("w3", 1730, 1560, 2010, 44, { interval: 10, delay: 2, sleepDuration: 6, warningDuration: 1.5 }),
      enemy("w4", "cloud", 2450, 225, 2250, 2740, 26),
      sleepyWolf("w5", 3420, 3240, 3720, 46, { interval: 10.5, delay: 0.5, sleepDuration: 6.5, warningDuration: 1.5 }),
      sleepyWolf("w6", 4200, 3980, 4490, 46, { interval: 10, delay: 1.5, sleepDuration: 6, warningDuration: 1.5 }),
      enemy("w7", "cloud", 5310, 225, 5090, 5540, 27),
      sleepyWolf("w8", 5830, 5650, 6120, 48, { interval: 10.5, delay: 2.5, sleepDuration: 6.5, warningDuration: 1.5 }),
      sleepyWolf("w9", 6550, 6350, 6840, 50, { interval: 10, delay: 0.75, sleepDuration: 6, warningDuration: 1.5 }),
    ],
    items: [
      apple("a1", 250, 410), apple("a2", 810, 240), apple("a3", 1730, 295),
      apple("a4", 2210, 230), apple("a5", 3380, 300), apple("a6", 4360, 295),
      apple("a7", 5600, 230), sticker("sticker-3-3", 5700, 230),
      apple("a8", 6130, 295), apple("a9", 6570, 235),
    ],
    rewardBlocks: [reward("r1", 880), reward("r2", 4550, 325, "apple")],
    checkpoints: [1460, 3100, 4840, 5740, 6500],
    boss: "great-wolf",
    waterEntrance: { x: 4655, y: 470, width: 145, height: 110 },
  },
  ...waterLevels,
  {
    id: "4-1",
    world: 4,
    screen: 1,
    theme: "boar-canopy",
    width: 5000,
    start: { x: 80, y: 380 },
    goalX: 4820,
    beats: { development: 1422, twist: 2607, finale: 3792, twistKind: "invert" },
    platforms: [
      ...ground([[0, 720], [1040, 460], [1880, 430], [2700, 460], [3630, 420], [4480, 520]]),
      ledge(250, 360, 190, "canopy"), ledge(530, 300, 180, "canopy"), ledge(790, 240, 190, "canopy"),
      ledge(1120, 350, 190, "canopy"), ledge(1400, 285, 180, "canopy"), ledge(1650, 230, 190, "canopy"),
      ledge(1950, 350, 190, "canopy"), ledge(2240, 285, 180, "canopy"), ledge(2510, 230, 190, "canopy"),
      ledge(2780, 350, 190, "canopy"), ledge(3070, 285, 180, "canopy"), ledge(3340, 225, 190, "canopy"), ledge(3540, 320, 170, "canopy"),
      ledge(3710, 350, 190, "canopy"), ledge(3990, 280, 180, "canopy"), ledge(4250, 220, 190, "canopy"), ledge(4430, 320, 170, "canopy"),
    ],
    enemies: [
      enemy("b1", "boar", 390, 414, 250, 650, 52), enemy("b2", "boar", 1160, 414, 1080, 1420, 54),
      enemy("b3", "boar", 1980, 414, 1920, 2250, 54), enemy("b4", "boar", 2800, 414, 2740, 3100, 56),
      enemy("b5", "boar", 3730, 414, 3670, 3980, 58), enemy("b6", "boar", 4580, 414, 4520, 4740, 58),
    ],
    items: [
      apple("a1", 500, 410), apple("a2", 835, 190), apple("a3", 1450, 235), apple("a4", 2050, 410),
      apple("a5", 2550, 180), apple("a6", 3000, 410), sticker("sticker-4-1", 3395, 175), apple("a7", 4300, 170),
    ],
    rewardBlocks: [reward("r1", 1210, 225), reward("r2", 3820, 225, "apple")],
    checkpoints: [1060, 1900, 2720, 3650, 4500],
  },
  {
    id: "4-2",
    world: 4,
    screen: 2,
    theme: "boar-canopy",
    width: 960, height: 2600, orientation: "vertical",
    start: { x: 120, y: 2482 },
    goalX: 480, goalY: 175,
    // Subida: de copa en copa, con jabalíes paseando por las ramas y pájaros entre las hojas.
    beats: { development: 250, twist: 1270, finale: 1850, twistKind: "shape" },
    platforms: [
      { x: 0, y: 2540, width: 960, height: 120, kind: "ground" },
      ledge(100, 2430, 240, "canopy"), ledge(440, 2320, 220, "canopy"), ledge(700, 2210, 220, "canopy"),
      ledge(400, 2100, 240, "canopy"), ledge(120, 1990, 220, "canopy"), ledge(420, 1880, 240, "canopy"),
      ledge(690, 1770, 220, "canopy"), ledge(400, 1660, 220, "canopy"), ledge(120, 1550, 240, "canopy"),
      ledge(430, 1440, 220, "canopy"), ledge(700, 1330, 220, "canopy"), ledge(410, 1220, 240, "canopy"),
      ledge(130, 1110, 220, "canopy"), ledge(430, 1000, 240, "canopy"), ledge(700, 890, 220, "canopy"),
      ledge(410, 780, 220, "canopy"), ledge(120, 670, 240, "canopy"), ledge(420, 560, 220, "canopy"),
      ledge(690, 450, 220, "canopy"), ledge(410, 340, 220, "canopy"), ledge(330, 230, 300, "canopy"),
    ],
    enemies: [
      enemy("b1", "boar", 440, 1838, 430, 600, 50), enemy("b2", "boar", 450, 1178, 420, 590, 54), enemy("b3", "boar", 460, 958, 440, 610, 56),
      enemy("p1", "bird", 500, 1600, 200, 800, 68), enemy("p2", "bird", 500, 800, 250, 750, 72),
    ],
    items: [
      apple("a1", 480, 2270), apple("a2", 160, 1940), apple("a3", 740, 1720), apple("a4", 470, 1390), apple("a5", 170, 1060),
      apple("a6", 750, 840), apple("a7", 170, 620), apple("a8", 460, 500), apple("a9", 740, 400), sticker("sticker-4-2", 480, 170),
    ],
    rewardBlocks: [reward("r1", 500, 2164), reward("r2", 480, 1284, "apple"), reward("r3", 470, 404)],
    checkpoints: [],
    verticalCheckpoints: [{ x: 440, y: 1880 }, { x: 460, y: 1000 }, { x: 450, y: 560 }],
  },
  {
    id: "4-3",
    route: { secretExit: "S-1" },
    world: 4,
    screen: 3,
    theme: "boar-storm",
    width: 7600,
    start: { x: 80, y: 380 },
    goalX: 7420,
    beats: { development: 771, twist: 4037, finale: 5872, twistKind: "combine" },
    platforms: [
      ...ground([[0, 640], [980, 380], [1760, 380], [2570, 400], [3070, 280], [3480, 400], [4450, 380], [5430, 400], [6420, 1180]]),
      ledge(220, 360, 190, "canopy"), ledge(490, 295, 180, "canopy"), ledge(750, 225, 190, "canopy"),
      ledge(1040, 350, 190, "canopy"), ledge(1300, 280, 180, "canopy"), ledge(1540, 215, 190, "canopy"),
      ledge(1820, 350, 190, "canopy"), ledge(2080, 280, 180, "canopy"), ledge(2320, 210, 190, "canopy"), ledge(2490, 320, 170, "canopy"),
      ledge(2640, 350, 190, "canopy"), ledge(3150, 190, 200, "canopy"),
      ledge(3820, 280, 180, "canopy"), ledge(4080, 205, 190, "canopy"), ledge(4350, 295, 180, "canopy"),
      ledge(4510, 350, 190, "canopy"), ledge(4780, 280, 180, "canopy"), ledge(5040, 205, 190, "canopy"), ledge(5310, 295, 180, "canopy"),
      ledge(5500, 350, 190, "canopy"), ledge(5770, 280, 180, "canopy"), ledge(6030, 205, 190, "canopy"), ledge(6300, 295, 180, "canopy"),
      ledge(6500, 350, 190, "canopy"), ledge(6780, 280, 190, "canopy"), ledge(7060, 215, 200, "canopy"),
      spring(3185),
    ],
    enemies: [
      enemy("b1", "boar", 360, 414, 210, 580, 56), enemy("b2", "boar", 1040, 414, 1010, 1280, 58),
      enemy("b3", "boar", 1830, 414, 1790, 2070, 60), enemy("b4", "boar", 2640, 414, 2610, 2910, 60),
      enemy("b5", "boar", 3560, 414, 3520, 3810, 62), enemy("b6", "boar", 4520, 414, 4480, 4760, 62),
      enemy("b7", "boar", 5500, 414, 5470, 5770, 64), enemy("b8", "boar", 6510, 414, 6460, 6880, 66),
      enemy("b9", "boar", 7080, 414, 6930, 7310, 66),
      enemy("p1", "bird", 1440, 145, 1240, 1760, 70),
      enemy("p2", "bird", 3250, 140, 3040, 3500, 74),
      enemy("p3", "bird", 5000, 140, 4800, 5420, 76),
      enemy("p4", "bird", 6170, 145, 5900, 6500, 78),
    ],
    items: [
      apple("a1", 500, 410), apple("a2", 800, 175), apple("a3", 1350, 230), apple("a4", 2000, 410),
      apple("a5", 2960, 230), apple("a6", 3220, 160), apple("a7", 3700, 410), apple("a8", 4130, 155),
      apple("a9", 4700, 410), apple("a10", 5090, 155), sticker("sticker-4-3", 6080, 155),
      apple("a11", 6750, 410), apple("a12", 7120, 165),
    ],
    rewardBlocks: [
      reward("r1", 1080, 225), reward("r2", 3650, 225, "apple"), reward("r3", 6570, 225),
      reward("bloque-secreto", 3205, 70, "secret-vine"),
    ],
    checkpoints: [1000, 1780, 2590, 3500, 4470, 5450, 6440, 7040],
    boss: "great-boar",
  },
  {
    id: "5-1",
    world: 5,
    screen: 1,
    theme: "sky-pirates",
    width: 5200,
    start: { x: 80, y: 350 },
    goalX: 5040,
    beats: { development: 1488, twist: 2728, finale: 3968, twistKind: "invert" },
    platforms: [
      ship(0, 440, 450), airPlank(520, 350, 130), ship(720, 405, 390), airPlank(1180, 315, 150),
      ship(1410, 430, 370), airPlank(1860, 345, 140), ship(2070, 395, 410), airPlank(2550, 295, 150),
      ship(2790, 430, 410), airPlank(3280, 340, 140), ship(3490, 400, 390), airPlank(3950, 300, 150),
      ship(4200, 430, 390), airPlank(4660, 345, 130), ship(4840, 410, 360),
    ],
    enemies: [
      enemy("pi1", "pirate", 190, 390, 110, 360, 38), enemy("pi2", "pirate", 830, 355, 770, 1010, 40),
      enemy("pi3", "pirate", 2170, 345, 2120, 2370, 42), enemy("pi4", "pirate", 2910, 380, 2840, 3100, 44),
      enemy("pi5", "pirate", 4300, 380, 4250, 4480, 46),
      enemy("lo1", "parrot", 1260, 205, 1120, 1510, 52), enemy("lo2", "parrot", 2640, 190, 2480, 2920, 56),
      enemy("lo3", "parrot", 4050, 195, 3880, 4320, 58),
    ],
    items: [
      apple("a1", 330, 390), apple("a2", 565, 300), apple("a3", 970, 355), apple("a4", 1230, 265),
      apple("a5", 1650, 380), apple("a6", 2600, 245), sticker("sticker-5-1", 2655, 245),
      apple("a7", 3100, 380), apple("a8", 4000, 250), apple("a9", 4960, 360),
    ],
    rewardBlocks: [reward("r1", 1510, 300), reward("r2", 3580, 270, "apple")],
    checkpoints: [1430, 2810, 4210],
  },
  {
    id: "5-2",
    world: 5,
    screen: 2,
    theme: "sky-pirates",
    width: 5600,
    start: { x: 80, y: 300 },
    goalX: 5450,
    // Persecución amable: el loro vuela de cubierta en cubierta, sube a los tablones en el giro y espera en el
    // rincón del último barco.
    beats: { development: 1500, twist: 2470, finale: 3450, twistKind: "shape" },
    platforms: [
      ship(0, 440, 420), airPlank(500, 360, 130), ship(700, 420, 340), airPlank(1120, 320, 130),
      ship(1330, 380, 360), airPlank(1770, 300, 140), ship(1990, 420, 340), airPlank(2410, 330, 130),
      ship(2620, 360, 360), airPlank(3060, 280, 130), ship(3270, 400, 360), airPlank(3700, 320, 130),
      ship(3910, 430, 340), airPlank(4330, 330, 130), ship(4540, 410, 360), airPlank(4980, 320, 130),
      ship(5190, 420, 410),
    ],
    chase: {
      runner: "parrot", carries: "yarn",
      stops: [
        { x: 400, y: 440,beat: "presentation" },
        { x: 850, y: 420, jump: true,beat: "presentation" },
        { x: 1500, y: 380, jump: true,beat: "development" },
        { x: 2150, y: 420, jump: true,beat: "development" },
        { x: 2470, y: 330, jump: true,beat: "twist" },
        { x: 2800, y: 360, jump: true,beat: "twist" },
        { x: 3450, y: 400, jump: true,beat: "finale" },
        { x: 4700, y: 410, jump: true,beat: "finale" },
        { x: 5450, y: 420,beat: "finale" },
      ],
    },
    enemies: [
      enemy("pi1", "pirate", 4100, 380, 4050, 4200, 44), enemy("pi2", "pirate", 3300, 350, 3290, 3370, 46),
    ],
    items: [
      apple("a1", 150, 390), apple("a2", 560, 310), apple("a3", 950, 370), apple("a4", 1180, 270),
      apple("a5", 1400, 330), apple("a6", 1830, 250), apple("a7", 2050, 370), apple("a8", 3120, 230),
      sticker("sticker-5-2", 2470, 280), apple("a9", 3760, 270), apple("a10", 4380, 280), apple("a11", 5030, 270),
    ],
    rewardBlocks: [reward("r1", 1450, 234), reward("r2", 3550, 254, "apple"), reward("r3", 5300, 274)],
    checkpoints: [1350, 2650, 3930, 4560],
  },
  {
    id: "5-3",
    world: 5,
    screen: 3,
    theme: "sky-storm",
    width: 8000,
    start: { x: 80, y: 330 },
    goalX: 7820,
    beats: { development: 813, twist: 4257, finale: 6192, twistKind: "combine" },
    platforms: [
      ship(0, 440, 410), airPlank(480, 340, 120), ship(680, 390, 350), airPlank(1110, 275, 130),
      ship(1320, 425, 350), airPlank(1750, 325, 120), ship(1950, 380, 360), airPlank(2390, 260, 140),
      ship(2710, 430, 360), airPlank(3150, 320, 120), ship(3350, 380, 360), airPlank(3790, 255, 140),
      ship(4110, 425, 360), airPlank(4550, 315, 120), ship(4750, 375, 360), airPlank(5190, 250, 140),
      ship(5510, 425, 360), airPlank(5950, 310, 120), ship(6150, 375, 360), airPlank(6590, 245, 140),
      ship(6900, 420, 360), airPlank(7340, 305, 120), ship(7540, 390, 460),
    ],
    enemies: [
      enemy("pi1", "pirate", 170, 390, 100, 320, 46), enemy("pi2", "pirate", 760, 340, 720, 950, 48),
      enemy("pi3", "pirate", 1400, 375, 1360, 1580, 50), enemy("pi4", "pirate", 2030, 330, 1990, 2220, 52),
      enemy("pi5", "pirate", 3430, 330, 3390, 3620, 54), enemy("pi6", "pirate", 4830, 325, 4790, 5020, 56),
      enemy("pi7", "pirate", 6230, 325, 6190, 6420, 58), enemy("pi8", "pirate", 7670, 340, 7620, 7880, 60),
      enemy("lo1", "parrot", 1160, 175, 1000, 1370, 62), enemy("lo2", "parrot", 2450, 165, 2290, 2700, 66),
      enemy("lo3", "parrot", 3860, 160, 3690, 4110, 68), enemy("lo4", "parrot", 5250, 155, 5080, 5510, 70),
      enemy("lo5", "parrot", 6010, 205, 5840, 6230, 72), enemy("lo6", "parrot", 6650, 155, 6480, 6910, 74),
      enemy("lo7", "parrot", 7410, 210, 7240, 7600, 76),
    ],
    items: [
      apple("a1", 300, 390), apple("a2", 520, 290), apple("a3", 850, 340), apple("a4", 1150, 225),
      apple("a5", 1500, 375), apple("a6", 2440, 210), apple("a7", 2890, 380), apple("a8", 3830, 205),
      apple("a9", 4300, 375), apple("a10", 5230, 200), apple("a11", 5680, 375), apple("a12", 6630, 195),
      sticker("sticker-5-3", 6690, 195), apple("a13", 7130, 370), apple("a14", 7700, 340),
    ],
    rewardBlocks: [reward("r1", 1410, 295), reward("r2", 3450, 250, "apple"), reward("r3", 6250, 245)],
    cannons: [
      cannon("c1", 930, 358, -1, 2.7), cannon("c2", 1570, 393, -1, 2.5), cannon("c3", 3610, 348, -1, 2.3),
      cannon("c4", 5010, 343, -1, 2.1), cannon("c5", 7130, 388, -1, 1.9),
    ],
    checkpoints: [1340, 2730, 4130, 5530, 6920, 7560],
    boss: "sky-captain",
  },
  {
    id: "6-1", world: 6, screen: 1,
    detourEntrance: { id: "library", x: 1765, y: 265, width: 80, height: 80 },
    theme: "haunted-castle", width: 5200, start: { x: 80, y: 380 }, goalX: 5020,
    // Presentación: perrito que avisa antes de morder, con la ruta alta a la vista. Giro (invertido): el camino
    // de arriba se corta y hay que pasar por abajo mientras el perrito descansa.
    beats: { development: 1500, twist: 2750, finale: 3950, twistKind: "invert" },
    platforms: [
      ...castleGround(castleFloor1),
      castleLedge(310, 350, 190), castleLedge(610, 280, 170), castleLedge(920, 350, 180),
      castleLedge(1370, 300, 180), castleLedge(1730, 345, 180), castleLedge(2050, 330, 180),
      castleLedge(1200, 285, 180), castleLedge(2520, 290, 170), castleLedge(2850, 350, 180),
      castleLedge(3150, 350, 145), castleLedge(3320, 300, 190), castleLedge(3600, 285, 190),
      castleLedge(3870, 350, 170), castleLedge(4350, 350, 180), castleLedge(4680, 280, 190),
      castleWall(1150, 0, 180, 170), castleWall(2350, 0, 210, 180), castleWall(3230, 0, 150, 150),
      castleWall(1520, 400, 34, 56),
    ],
    spikePits: spikePits(castleFloor1),
    chainGuardians: [chainGuardian("c1-hound-1", 1290, 1), chainGuardian("c1-hound-2", 3610, 1, 1.3)],
    enemies: [enemy("sk1", "skeleton", 420, 420, 300, 610, 34), enemy("gh1", "ghost", 1140, 245, 1000, 1430, 52), enemy("zo1", "zombie", 2240, 406, 2070, 2670, 30), enemy("gh2", "ghost", 2800, 220, 2600, 3020, 55), enemy("gh-c1-tower", "ghost", 4440, 225, 4320, 4600, 54), enemy("sk2", "skeleton", 4850, 420, 4700, 4940, 37)],
    items: [apple("c1a1", 350, 290), apple("c1a2", 990, 295), apple("c1a3", 1780, 285), apple("c1a4", 2600, 235), apple("c1a5", 3480, 245), apple("c1a6", 4750, 225), apple("c1a7", 4410, 295), sticker("sticker-6-1", 1460, 245)],
    rewardBlocks: [reward("c1r1", 1100, 295), reward("c1r2", 2740, 310, "apple"), reward("c1r3", 4610, 310)], checkpoints: [950, 2100, 3110, 4260],
  },
  {
    id: "6-2", world: 6, screen: 2,
    theme: "haunted-castle", width: 3840, start: { x: 60, y: 398 }, goalX: 3790,
    // Sala-rompecabezas: los perritos encadenados son piezas de las salas 2 y 3; siempre hay ruta por arriba.
    beats: { development: 960, twist: 1920, finale: 2880, twistKind: "shape" },
    platforms: [
      ...castleGround([[0, 3840]]),
      castleWall(872, -400, 64, 716), castleWall(1832, -400, 64, 716), castleWall(2792, -400, 64, 716), castleWall(3592, -400, 64, 716), castleWall(3692, -400, 64, 716),
      castleLedge(1350, 330, 420), castleLedge(2200, 350, 140), castleLedge(2560, 190, 210), castleLedge(3470, 190, 120),
    ],
    spikePits: [],
    chainGuardians: [chainGuardian("c2-hound-1", 1560, 2), chainGuardian("c2-hound-2", 2350, 2, 1.5)],
    enemies: [],
    items: [apple("c2a1", 150, 300), apple("c2a2", 700, 300), apple("c2a3", 1500, 280), apple("c2a4", 2470, 220), sticker("sticker-6-2", 2572, 136), apple("c2a5", 3520, 300)],
    rewardBlocks: [reward("c2r1", 300, 300), reward("c2r2", 1250, 300, "apple"), reward("c2r3", 3060, 300)],
    checkpoints: [],
    puzzleRooms: [
      {
        x: 0, entry: { x: 60, y: 398 }, exitDoor: "c2-d1",
        triggers: [{ id: "c2-t1", kind: "paw", x: 450, y: 456, width: 72, opens: "c2-d1" }],
        doors: [{ id: "c2-d1", symbol: "paw", x: 880, y: 316, width: 48, height: 140 }],
      },
      {
        x: 960, entry: { x: 1000, y: 398 }, exitDoor: "c2-d2",
        triggers: [{ id: "c2-t2", kind: "plate", x: 1150, y: 456, width: 92, opens: "c2-d2" }],
        doors: [{ id: "c2-d2", symbol: "star", x: 1840, y: 316, width: 48, height: 140 }],
        crates: [{ id: "c2-c2", x: 1020, y: 456, minX: 1000, maxX: 1200 }],
      },
      {
        x: 1920, entry: { x: 1960, y: 398 }, exitDoor: "c2-d3", startColor: "pink",
        triggers: [
          { id: "c2-t3-blue", kind: "color", color: "blue", x: 2000, y: 456, width: 72 },
          { id: "c2-t3-pink", kind: "color", color: "pink", x: 2090, y: 456, width: 72 },
          { id: "c2-t3", kind: "paw", x: 2650, y: 190, width: 72, opens: "c2-d3" },
        ],
        doors: [{ id: "c2-d3", symbol: "moon", x: 2800, y: 316, width: 48, height: 140 }],
        colorPlatforms: [
          { id: "c2-p3-1", color: "blue", x: 2400, y: 270, width: 120, height: 24 },
          { id: "c2-p3-2", color: "pink", x: 2330, y: 220, width: 100, height: 24 },
        ],
      },
      {
        x: 2880, entry: { x: 2920, y: 398 }, exitDoor: "c2-d4", startColor: "blue",
        triggers: [
          { id: "c2-t4-plate", kind: "plate", x: 3300, y: 456, width: 92, opens: "c2-d4" },
          { id: "c2-t4-pink", kind: "color", color: "pink", x: 3480, y: 456, width: 72 },
          { id: "c2-t4", kind: "paw", x: 3490, y: 190, width: 72, opens: "c2-d5" },
        ],
        doors: [
          { id: "c2-d4", symbol: "star", x: 3600, y: 316, width: 48, height: 140 },
          { id: "c2-d5", symbol: "paw", x: 3700, y: 316, width: 48, height: 140 },
        ],
        colorPlatforms: [
          { id: "c2-p4-1", color: "pink", x: 3180, y: 350, width: 120, height: 24 },
          { id: "c2-p4-2", color: "pink", x: 3260, y: 270, width: 100, height: 24 },
        ],
        crates: [{ id: "c2-c4", x: 2980, y: 456, minX: 2960, maxX: 3320 }],
      },
    ],
  },
  {
    id: "6-3", world: 6, screen: 3,
    route: { next: "9-1" },
    theme: "haunted-castle", width: 6500, start: { x: 80, y: 380 }, goalX: 6320,
    secretShop: { id: "shop-6-2", x: 1400, y: 195, width: 64, height: 80 },
    // Giro (combina): perritos y fantasmas juntos en los pasadizos antes del salón del Conde.
    beats: { development: 650, twist: 3450, finale: 5000, twistKind: "combine" },
    platforms: [
      ...castleGround(castleFloor3),
      castleLedge(420, 295, 190), castleLedge(720, 230, 170), castleLedge(1000, 290, 180),
      castleLedge(1350, 275, 180), castleLedge(1680, 295, 180), castleLedge(2070, 325, 190),
      castleLedge(2520, 260, 180), castleLedge(2870, 335, 180), castleLedge(3200, 270, 190),
      castleLedge(3650, 200, 185), castleLedge(4000, 285, 180), castleLedge(4250, 270, 190),
      castleLedge(4720, 245, 190), castleLedge(5150, 325, 180), castleLedge(5480, 260, 190), castleLedge(5950, 205, 180),
      castleLedge(2300, 335, 160), castleLedge(4520, 335, 160),
      castleWall(1120, 0, 190, 180), castleWall(2250, 0, 195, 175), castleWall(3410, 0, 180, 185), castleWall(4550, 0, 200, 170), castleWall(5710, 0, 170, 165),
      castleWall(1570, 396, 34, 60), castleWall(3780, 396, 34, 60), castleWall(5560, 396, 34, 60),
    ],
    spikePits: spikePits(castleFloor3),
    chainGuardians: [chainGuardian("c3-hound-1", 2480, 3), chainGuardian("c3-hound-2", 4860, 3, 1.6)],
    enemies: [enemy("sk5", "skeleton", 390, 420, 230, 680, 40), enemy("gh6", "ghost", 1000, 215, 930, 1150, 62), enemy("zo4", "zombie", 2140, 406, 2060, 2200, 36), enemy("gh7", "ghost", 2860, 195, 2590, 3050, 65), enemy("sk6", "skeleton", 3330, 420, 3170, 3660, 43), enemy("gh8", "ghost", 4260, 205, 4030, 4500, 68), enemy("zo5", "zombie", 4370, 406, 4320, 4460, 39), enemy("gh9", "ghost", 5450, 185, 5250, 5700, 70), enemy("sk7", "skeleton", 5940, 420, 5770, 6200, 46)],
    items: [apple("c3a1", 420, 285), apple("c3a2", 1450, 220), apple("c3a3", 2580, 205), apple("c3a4", 3650, 190), apple("c3a5", 4800, 195), apple("c3a6", 5960, 195), sticker("sticker-6-3", 4780, 185)],
    rewardBlocks: [reward("c3r1", 1050, 170), reward("c3r2", 2980, 210, "apple"), reward("c3r3", 5280, 200)], checkpoints: [940, 2010, 3120, 4210, 5350, 5890], boss: "vampire-count",
  },
  {
    id: "9-1", world: 9, screen: 1,
    theme: "dinosaur-island", width: 4600, start: { x: 80, y: 380 }, goalX: 4420,
    // Presentación: una playa larga sin huecos. Giro (invertido): los saltadores salen justo donde hay que caer.
    beats: { development: 1300, twist: 2390, finale: 3470, twistKind: "invert" },
    platforms: [
      ...dinoGround(dinoFloor1),
      dinoLedge(330, 330, 170), dinoLedge(700, 255, 160), dinoLedge(1450, 320, 170), dinoLedge(1800, 250, 160),
      dinoLedge(2420, 330, 170), dinoLedge(2750, 250, 160), dinoLedge(3300, 320, 170), dinoLedge(3600, 250, 160),
      dinoLedge(4050, 330, 170), dinoLedge(4250, 250, 150),
      dinoWall(900, 350, 70, 106),
    ],
    deadlyWater: deadlyWaterPits(dinoFloor1),
    waterJumpers: [jumpingFish("d1-f1", 1292, 2.9, 0.4), jumpingFish("d1-f2", 2252, 2.6, 1.1), jumpingFish("d1-f3", 3152, 2.5, 0.7), jumpingFish("d1-f4", 3892, 2.7, 1.5)],
    enemies: [enemy("d1-t1", "baby-t-rex", 500, 408, 350, 800, 37), enemy("d1-p1", "pterodactyl", 1500, 205, 1400, 1900, 62), enemy("d1-t2", "baby-t-rex", 2600, 408, 2400, 3000, 41), enemy("d1-p2", "pterodactyl", 3400, 175, 3270, 3800, 68), enemy("d1-t3", "baby-t-rex", 4200, 408, 4050, 4400, 44)],
    items: [apple("d1a1", 380, 280), apple("d1a2", 750, 205), sticker("sticker-9-1", 1850, 200), apple("d1a3", 2800, 200), apple("d1a4", 3650, 200), apple("d1a5", 4100, 280)],
    rewardBlocks: [reward("d1r1", 1200, 285), reward("d1r2", 3460, 300, "apple")], checkpoints: [1000, 2400, 3300],
  },
  {
    id: "9-2", world: 9, screen: 2,
    theme: "dinosaur-island", width: 3200, height: 1300, orientation: "explore",
    start: { x: 80, y: 942 }, goalX: 1070, goalY: 1000,
    // Exploración: un gatito en la playa, otro en lo alto del acantilado y el tercero tras la laguna de los
    // saltadores; el puente alto de vuelta se abre con los tres.
    beats: { development: 480, twist: 2800, finale: 1000, twistKind: "shape" },
    platforms: [
      { x: 0, y: 1000, width: 1300, height: 300, kind: "dino-ground" }, { x: 1500, y: 1000, width: 700, height: 300, kind: "dino-ground" }, { x: 2600, y: 1000, width: 600, height: 300, kind: "dino-ground" },
      dinoLedge(200, 880, 160), dinoLedge(400, 770, 160), dinoLedge(200, 660, 160), dinoLedge(420, 550, 160),
      dinoLedge(2280, 930, 90), dinoLedge(2430, 930, 90),
      dinoLedge(3000, 880, 150), dinoLedge(2800, 770, 150), dinoLedge(3000, 660, 150), dinoLedge(2650, 620, 150), dinoLedge(1600, 600, 1000),
    ],
    deadlyWater: [{ x: 1300, y: 1008, width: 200, height: 292 }, { x: 2200, y: 1008, width: 400, height: 292 }],
    waterJumpers: [{ id: "d2-f1", x: 1372, surfaceY: 1008, width: 56, height: 52, interval: 2.6, delay: 0.4, jumpHeight: 300 }, { id: "d2-f2", x: 2360, surfaceY: 1008, width: 56, height: 52, interval: 2.4, delay: 1.0, jumpHeight: 300 }, { id: "d2-f3", x: 2510, surfaceY: 1008, width: 56, height: 52, interval: 2.8, delay: 0.2, jumpHeight: 300 }],
    enemies: [enemy("d2-t1", "baby-t-rex", 800, 952, 650, 950, 43), enemy("d2-p1", "pterodactyl", 1800, 820, 1550, 2150, 68), enemy("d2-t2", "baby-t-rex", 2900, 952, 2650, 3150, 47), enemy("d2-p2", "pterodactyl", 2400, 700, 2200, 2600, 74)],
    items: [apple("d2a1", 240, 830), apple("d2a2", 440, 720), apple("d2a3", 250, 610), apple("d2a4", 1650, 550), apple("d2a5", 2000, 550), sticker("sticker-9-2", 2200, 550), apple("d2a6", 3050, 830)],
    rewardBlocks: [reward("d2r1", 700, 844), reward("d2r2", 1800, 844, "apple"), reward("d2r3", 2850, 844)],
    checkpoints: [],
    verticalCheckpoints: [{ x: 1600, y: 1000 }, { x: 2700, y: 1000 }, { x: 2050, y: 600 }],
    exploreGate: { x: 1000, y: 840, width: 140, height: 160 },
    lostKittens: [
      { id: "d2-k1", x: 520, y: 1000, cat: 9, beat: "presentation" },
      { id: "d2-k2", x: 480, y: 550, cat: 10, beat: "development" },
      { id: "d2-k3", x: 2800, y: 1000, cat: 8, beat: "twist" },
    ],
    exploreShortcut: [{ x: 1560, y: 320, width: 40, height: 280, kind: "puzzle-block" }],
  },
  {
    id: "9-3", world: 9, screen: 3,
    route: { next: "10-1" },
    theme: "dinosaur-island", width: 6500, start: { x: 80, y: 380 }, goalX: 6320,
    // Giro (combina): saltadores en cada bahía con terodáctilos encima y rocas que cortan el paso.
    beats: { development: 650, twist: 3450, finale: 5000, twistKind: "combine" },
    platforms: [
      ...dinoGround(dinoFloor3),
      dinoLedge(350, 330, 170), dinoLedge(680, 250, 160), dinoLedge(1150, 330, 170), dinoLedge(1500, 250, 160),
      dinoLedge(2100, 330, 170), dinoLedge(2450, 250, 160), dinoLedge(3000, 330, 170), dinoLedge(3350, 250, 160),
      dinoLedge(3950, 330, 170), dinoLedge(4250, 250, 160), dinoLedge(4800, 330, 170), dinoLedge(5150, 250, 160),
      dinoLedge(5700, 330, 170), dinoLedge(6000, 250, 160),
      dinoWall(1700, 338, 76, 118), dinoWall(4400, 320, 78, 136),
    ],
    deadlyWater: deadlyWaterPits(dinoFloor3),
    waterJumpers: [jumpingFish("d3-f1", 1222, 2.4, 0.5), jumpingFish("d3-f2", 2062, 2.75, 1.35), jumpingFish("d3-f3", 3042, 2.3, 0.8), jumpingFish("d3-f4", 3862, 2.85, 1.7), jumpingFish("d3-f5", 4842, 2.5, 1.05), jumpingFish("d3-f6", 5662, 2.6, 0.3)],
    enemies: [enemy("d3-t1", "baby-t-rex", 500, 408, 300, 900, 46), enemy("d3-p1", "pterodactyl", 1300, 175, 1100, 1700, 76), enemy("d3-t2", "baby-t-rex", 2300, 408, 2050, 2700, 50), enemy("d3-p2", "pterodactyl", 3200, 135, 2950, 3600, 82), enemy("d3-t3", "baby-t-rex", 4100, 408, 3900, 4350, 53), enemy("d3-p3", "pterodactyl", 5000, 145, 4750, 5400, 86), enemy("d3-t4", "baby-t-rex", 6000, 408, 5700, 6200, 56)],
    items: [apple("d3a1", 400, 280), apple("d3a2", 730, 200), apple("d3a3", 1200, 280), apple("d3a4", 2150, 280), apple("d3a5", 2500, 200), sticker("sticker-9-3", 5200, 200), apple("d3a6", 3050, 280), apple("d3a7", 4300, 200)],
    rewardBlocks: [reward("d3r1", 1400, 300), reward("d3r2", 2700, 300, "apple"), reward("d3r3", 5400, 300)], checkpoints: [1100, 1900, 2900, 3700, 4600, 5500], boss: "triceratops-queen",
  },
  {
    id: "10-1", world: 10, screen: 1,
    secretShop: { id: "shop-10-2", x: 1300, y: 230, width: 64, height: 80 },
    theme: "dragon-volcano", width: 5600, start: { x: 80, y: 380 }, goalX: 5420,
    // Presentación: un chorro sobre suelo seguro. Giro (invertido): los chorros salen de los huecos a contratiempo.
    beats: { development: 1650, twist: 3000, finale: 4350, twistKind: "invert" },
    platforms: [
      ...themedGround(world10Floor1, "volcano-ground"),
      themedLedge(300, 330, 180, "volcano-ledge"), themedLedge(560, 250, 170, "volcano-ledge"), themedLedge(900, 330, 170, "volcano-ledge"), themedLedge(1250, 310, 200, "volcano-ledge"),
      themedLedge(1600, 250, 160, "volcano-ledge"), themedLedge(1950, 330, 170, "volcano-ledge"), themedLedge(2250, 250, 160, "volcano-ledge"), themedLedge(2700, 330, 170, "volcano-ledge"),
      themedLedge(3000, 250, 160, "volcano-ledge"), themedLedge(3550, 330, 170, "volcano-ledge"), themedLedge(3850, 250, 160, "volcano-ledge"), themedLedge(4350, 330, 170, "volcano-ledge"),
      themedLedge(4650, 250, 160, "volcano-ledge"), themedLedge(5200, 330, 170, "volcano-ledge"),
      themedWall(1100, 350, 70, 106, "volcano-wall"),
    ],
    deadlyWater: deadlyWaterPits(world10Floor1),
    lavaJets: [lavaJet("v1-j1", 700, 2.6, 0, 260), lavaJet("v1-j2", 1763, 2.8, .8, 320), lavaJet("v1-j3", 2543, 2.4, 1.4), lavaJet("v1-j4", 3403, 2.2, .45, 335), lavaJet("v1-j5", 4203, 2.3, 1.1), lavaJet("v1-j6", 5043, 2.25, .3, 330)],
    enemies: [enemy("v1-d1", "baby-dragon", 450, 410, 320, 650, 44), enemy("v1-s1", "fire-salamander", 1550, 416, 1480, 1700, 48), enemy("v1-d2", "baby-dragon", 2300, 410, 1900, 2480, 50), enemy("v1-s2", "fire-salamander", 3700, 416, 3550, 4100, 52), enemy("v1-d3", "baby-dragon", 5300, 410, 5150, 5400, 56),
      enemy("v1-f1", "flying-dragon", 650, 155, 540, 820, 44), enemy("v1-f2", "flying-dragon", 3600, 145, 3500, 3900, 52)],
    items: [apple("v1a1", 350, 280), apple("v1a2", 610, 200), sticker("sticker-10-1", 1650, 200), apple("v1a3", 2300, 200), apple("v1a4", 3050, 200), apple("v1a5", 4700, 200), apple("v1a6", 5250, 280)],
    rewardBlocks: [reward("v1r1", 800, 300), reward("v1r2", 3200, 300, "apple")], checkpoints: [1000, 2000, 2700, 4400],
  },
  {
    id: "10-2", world: 10, screen: 2,
    theme: "dragon-volcano", width: 960, height: 2600, orientation: "vertical",
    start: { x: 120, y: 2482 }, goalX: 480, goalY: 175,
    // Subida: chorros de lava al compás que salen de las repisas, cada vez más seguidos.
    beats: { development: 250, twist: 1270, finale: 1850, twistKind: "shape" },
    platforms: [
      { x: 0, y: 2540, width: 960, height: 120, kind: "volcano-ground" },
      themedLedge(80, 2430, 220, "volcano-ledge"), themedLedge(420, 2320, 200, "volcano-ledge"), themedLedge(700, 2210, 200, "volcano-ledge"), themedLedge(380, 2100, 220, "volcano-ledge"),
      themedLedge(100, 1990, 200, "volcano-ledge"), themedLedge(400, 1880, 200, "volcano-ledge"), themedLedge(680, 1770, 220, "volcano-ledge"), themedLedge(380, 1660, 200, "volcano-ledge"),
      themedLedge(110, 1550, 220, "volcano-ledge"), themedLedge(420, 1440, 200, "volcano-ledge"), themedLedge(700, 1330, 200, "volcano-ledge"), themedLedge(400, 1220, 200, "volcano-ledge"),
      themedLedge(120, 1110, 220, "volcano-ledge"), themedLedge(420, 1000, 200, "volcano-ledge"), themedLedge(700, 890, 200, "volcano-ledge"), themedLedge(400, 780, 200, "volcano-ledge"),
      themedLedge(100, 670, 220, "volcano-ledge"), themedLedge(400, 560, 200, "volcano-ledge"), themedLedge(690, 450, 200, "volcano-ledge"), themedLedge(400, 340, 200, "volcano-ledge"),
      themedLedge(330, 230, 300, "volcano-ledge"),
    ],
    lavaJets: [{ id: "v2-j1", x: 640, baseY: 2540, width: 54, height: 240, interval: 2.6, delay: 0 }, { id: "v2-j2", x: 470, baseY: 2100, width: 54, height: 200, interval: 2.6, delay: 0.8 }, { id: "v2-j3", x: 470, baseY: 1440, width: 54, height: 200, interval: 2.3, delay: 0.3 }, { id: "v2-j4", x: 450, baseY: 1220, width: 54, height: 190, interval: 2.3, delay: 1.4 }, { id: "v2-j5", x: 450, baseY: 560, width: 54, height: 190, interval: 2.1, delay: 0.6 }, { id: "v2-j6", x: 450, baseY: 340, width: 54, height: 180, interval: 2.0, delay: 1.5 }],
    enemies: [enemy("v2-d1", "baby-dragon", 440, 1834, 410, 560, 46), enemy("v2-s1", "fire-salamander", 460, 960, 430, 580, 50), enemy("v2-f1", "flying-dragon", 500, 1500, 200, 800, 50), enemy("v2-f2", "flying-dragon", 500, 700, 250, 750, 56)],
    items: [apple("v2a1", 480, 2270), apple("v2a2", 160, 1940), apple("v2a3", 720, 1720), apple("v2a4", 470, 1390), apple("v2a5", 180, 1060), apple("v2a6", 740, 840), apple("v2a7", 180, 620), sticker("sticker-10-2", 740, 400)],
    rewardBlocks: [reward("v2r1", 470, 2164), reward("v2r2", 470, 1284, "apple"), reward("v2r3", 470, 404)],
    checkpoints: [],
    verticalCheckpoints: [{ x: 440, y: 1880 }, { x: 460, y: 1000 }, { x: 440, y: 560 }],
  },
  {
    id: "10-3", world: 10, screen: 3,
    route: { next: "11-1" },
    theme: "dragon-volcano", width: 6500, start: { x: 80, y: 380 }, goalX: 6320,
    // Giro (combina): chorros en cada hueco con dragones voladores encima.
    beats: { development: 650, twist: 3450, finale: 5000, twistKind: "combine" },
    platforms: [
      ...themedGround(world10Floor3, "volcano-ground"),
      themedLedge(350, 285, 170, "volcano-ledge"), themedLedge(700, 195, 160, "volcano-ledge"), themedLedge(1050, 285, 170, "volcano-ledge"), themedLedge(1500, 195, 160, "volcano-ledge"),
      themedLedge(1850, 285, 170, "volcano-ledge"), themedLedge(2350, 195, 160, "volcano-ledge"), themedLedge(2700, 285, 170, "volcano-ledge"), themedLedge(3250, 195, 160, "volcano-ledge"),
      themedLedge(3600, 285, 170, "volcano-ledge"), themedLedge(4200, 195, 160, "volcano-ledge"), themedLedge(4500, 285, 170, "volcano-ledge"), themedLedge(5000, 195, 160, "volcano-ledge"),
      themedLedge(5350, 285, 170, "volcano-ledge"), themedLedge(5900, 195, 160, "volcano-ledge"),
      themedWall(1150, 338, 76, 118, "volcano-wall"), themedWall(4300, 320, 78, 136, "volcano-wall"),
    ],
    deadlyWater: deadlyWaterPits(world10Floor3),
    lavaJets: [lavaJet("v3-j0", 600, 2.6, 0, 260), lavaJet("v3-j1", 1343, 2.3, .1), lavaJet("v3-j2", 2183, 2.6, .8, 320), lavaJet("v3-j3", 3083, 2.2, 1.4, 340), lavaJet("v3-j4", 4043, 2.5, .45), lavaJet("v3-j5", 4843, 2.15, 1.75, 355), lavaJet("v3-j6", 5743, 2.45, 1.05, 340)],
    enemies: [enemy("v3-d1", "baby-dragon", 500, 410, 300, 900, 52), enemy("v3-s1", "fire-salamander", 1600, 416, 1450, 1900, 56), enemy("v3-d2", "baby-dragon", 2500, 410, 2300, 2950, 56), enemy("v3-s2", "fire-salamander", 3400, 416, 3200, 3900, 60), enemy("v3-d3", "baby-dragon", 4500, 410, 4400, 4750, 62), enemy("v3-s3", "fire-salamander", 5200, 416, 4950, 5650, 64), enemy("v3-d4", "baby-dragon", 6000, 410, 5850, 6200, 66),
      enemy("v3-f1", "flying-dragon", 700, 100, 550, 900, 48), enemy("v3-f2", "flying-dragon", 2600, 80, 2400, 2900, 56), enemy("v3-f3", "flying-dragon", 4500, 100, 4200, 4700, 60), enemy("v3-f4", "flying-dragon", 6000, 110, 5850, 6150, 64)],
    items: [apple("v3a1", 400, 235), apple("v3a2", 750, 145), apple("v3a3", 1100, 235), apple("v3a4", 1550, 145), apple("v3a5", 2400, 145), sticker("sticker-10-3", 5950, 145), apple("v3a6", 3300, 145), apple("v3a7", 4250, 145), apple("v3a8", 5050, 145)],
    rewardBlocks: [reward("v3r1", 900, 300), reward("v3r2", 2900, 300, "apple"), reward("v3r3", 5550, 300)], checkpoints: [1000, 1500, 2300, 3200, 4150, 5000], boss: "ruby-dragon",
  },
  {
    id: "11-1", world: 11, screen: 1,
    detourEntrance: { id: "garden", x: 1515, y: 165, width: 80, height: 80 },
    theme: "giant-valley", width: 5600, start: { x: 80, y: 380 }, goalX: 5420,
    // Presentación: rocío y flores sobre suelo seguro. Giro (invertido): las gotas llevan arriba, sobre el agua.
    beats: { development: 1650, twist: 3000, finale: 4350, twistKind: "invert" },
    platforms: [
      ...themedGround(world11Floor1, "garden-ground"), themedLedge(500, 330, 180, "garden-ledge"), themedLedge(820, 250, 170, "garden-ledge"), themedLedge(1470, 245, 180, "garden-ledge"),
      themedLedge(1950, 320, 180, "garden-ledge"), themedLedge(2300, 240, 170, "garden-ledge"), themedLedge(2850, 320, 180, "garden-ledge"), themedLedge(3150, 240, 160, "garden-ledge"), themedLedge(3800, 250, 170, "garden-ledge"),
      themedLedge(4400, 320, 170, "garden-ledge"), themedLedge(4650, 240, 160, "garden-ledge"), themedLedge(5100, 320, 180, "garden-ledge"),
      dew(300), dew(1200), dew(3600), dew(4500),
    ],
    deadlyWater: deadlyWaterPits(world11Floor1),
    bloomBridges: [
      { id: "g1-flower1", x: 2570, y: 430, width: 180, height: 18, interval: 12, delay: 0, openDuration: 8, warningDuration: 2 },
    ],
    enemies: [giantEnemy("g1-a1", "ant", 600, 420, 350, 1000, 46), giantEnemy("g1-s1", "snail", 2000, 420, 1900, 2500, 30), giantEnemy("g1-b1", "bee", 2900, 190, 2750, 3300, 70), giantEnemy("g1-a2", "ant", 3700, 420, 3560, 4100, 52), giantEnemy("g1-b2", "bee", 5100, 175, 5020, 5500, 76)],
    items: [apple("g1a1", 550, 280), apple("g1a2", 870, 200), sticker("sticker-11-1", 1520, 195), apple("g1a3", 2000, 270), apple("g1a4", 2350, 190), apple("g1a5", 3850, 200), apple("g1a6", 4700, 190)],
    rewardBlocks: [reward("g1r1", 1020, 300), reward("g1r2", 3300, 300, "apple")], checkpoints: [1100, 2000, 2900, 4400],
  },
  {
    id: "11-2", world: 11, screen: 2,
    theme: "giant-valley", width: 5800, start: { x: 80, y: 380 }, goalX: 5650,
    // Persecución amable: la abeja vuela de flor en flor; en el giro sube por el rocío y en el remate espera en
    // el rincón del jardín.
    beats: { development: 1900, twist: 3100, finale: 3950, twistKind: "shape" },
    platforms: [
      ...themedGround(world11Floor2, "garden-ground"), themedLedge(400, 330, 180, "garden-ledge"), themedLedge(760, 250, 170, "garden-ledge"), themedLedge(1750, 320, 180, "garden-ledge"), themedLedge(2100, 240, 170, "garden-ledge"),
      themedLedge(3050, 200, 190, "garden-ledge"), themedLedge(3300, 250, 170, "garden-ledge"), themedLedge(4000, 320, 180, "garden-ledge"), themedLedge(4240, 240, 140, "garden-ledge"), themedLedge(5250, 320, 180, "garden-ledge"),
      dew(1100), dew(2900), dew(3900), dew(4800),
    ],
    deadlyWater: deadlyWaterPits(world11Floor2),
    bloomBridges: [
      { id: "g2-flower1", x: 2550, y: 430, width: 186, height: 18, interval: 11, delay: 0, openDuration: 7, warningDuration: 1.8 },
      { id: "g2-flower2", x: 3520, y: 430, width: 186, height: 18, interval: 12, delay: 2, openDuration: 8, warningDuration: 2 },
      { id: "g2-flower3", x: 4390, y: 430, width: 186, height: 18, interval: 11, delay: 1, openDuration: 7, warningDuration: 1.8 },
    ],
    chase: {
      runner: "bee", carries: "yarn",
      stops: [
        { x: 700, y: 456,beat: "presentation" },
        { x: 1300, y: 456,beat: "presentation" },
        { x: 1900, y: 456, jump: true,beat: "development" },
        { x: 2800, y: 456, jump: true,beat: "development" },
        { x: 3100, y: 200, jump: true,beat: "twist" },
        { x: 3350, y: 250, jump: true,beat: "twist" },
        { x: 3950, y: 456, jump: true,beat: "finale" },
        { x: 4700, y: 456, jump: true,beat: "finale" },
        { x: 5650, y: 456,beat: "finale" },
      ],
    },
    // Las patrullas quedan entre paradas para no tapar a la abeja mientras espera.
    enemies: [giantEnemy("g2-a1", "ant", 1000, 420, 880, 1150, 50), giantEnemy("g2-s1", "snail", 2200, 420, 2050, 2500, 34), giantEnemy("g2-a2", "ant", 3100, 420, 2950, 3450, 56), giantEnemy("g2-s2", "snail", 5000, 420, 4850, 5400, 38)],
    items: [apple("g2a1", 450, 280), apple("g2a2", 800, 200), apple("g2a3", 1800, 270), apple("g2a4", 2150, 190), sticker("sticker-11-2", 3080, 130), apple("g2a5", 3360, 200), apple("g2a6", 4050, 270), apple("g2a7", 5300, 270)],
    rewardBlocks: [reward("g2r1", 1000, 300), reward("g2r2", 2450, 300, "apple"), reward("g2r3", 4200, 300)], checkpoints: [1200, 1800, 2780, 3750, 4650],
  },
  {
    id: "11-3", world: 11, screen: 3,
    route: { next: "12-1" },
    theme: "giant-valley", width: 6500, start: { x: 80, y: 380 }, goalX: 6320,
    // Giro (combina): rocío y flores seguidas sobre el agua; remate con dos flores antes de la colmena.
    beats: { development: 650, twist: 3450, finale: 5000, twistKind: "combine" },
    platforms: [
      ...themedGround(world11Floor3, "garden-ground"), themedLedge(480, 275, 180, "garden-ledge"), themedLedge(680, 185, 160, "garden-ledge"), themedLedge(1100, 275, 180, "garden-ledge"), themedLedge(1480, 185, 170, "garden-ledge"),
      themedLedge(2000, 275, 170, "garden-ledge"), themedLedge(2400, 185, 160, "garden-ledge"), themedLedge(2850, 275, 180, "garden-ledge"), themedLedge(3200, 185, 170, "garden-ledge"), themedLedge(3650, 275, 170, "garden-ledge"), themedLedge(4000, 185, 160, "garden-ledge"),
      themedLedge(4450, 275, 170, "garden-ledge"), themedLedge(4750, 185, 160, "garden-ledge"), themedLedge(5250, 275, 180, "garden-ledge"), themedLedge(5700, 185, 170, "garden-ledge"),
      dew(300), dew(1300), dew(2200), dew(3000), dew(3800), dew(4600), dew(5500),
    ],
    deadlyWater: deadlyWaterPits(world11Floor3),
    bloomBridges: [
      { id: "g3-flower1", x: 1770, y: 430, width: 180, height: 18, interval: 11, delay: 0, openDuration: 7, warningDuration: 1.8 },
      { id: "g3-flower2", x: 2630, y: 430, width: 180, height: 18, interval: 12, delay: 1.5, openDuration: 8, warningDuration: 2 },
      { id: "g3-flower3", x: 4210, y: 430, width: 180, height: 18, interval: 11, delay: 2.5, openDuration: 7, warningDuration: 1.8 },
      { id: "g3-flower4", x: 4930, y: 430, width: 180, height: 18, interval: 12, delay: 0.5, openDuration: 8, warningDuration: 2 },
    ],
    enemies: [giantEnemy("g3-a1", "ant", 500, 420, 350, 830, 54), giantEnemy("g3-b1", "bee", 1200, 175, 1050, 1600, 82), giantEnemy("g3-s1", "snail", 2100, 420, 1960, 2600, 38), giantEnemy("g3-b2", "bee", 3300, 135, 2850, 3400, 88), giantEnemy("g3-a2", "ant", 3700, 420, 3600, 4180, 60), giantEnemy("g3-b3", "bee", 4800, 145, 4400, 4900, 94), giantEnemy("g3-a3", "ant", 5600, 420, 5150, 6100, 66)],
    items: [apple("g3a1", 530, 225), apple("g3a2", 720, 135), apple("g3a3", 1150, 225), apple("g3a4", 2050, 225), apple("g3a5", 2900, 225), sticker("sticker-11-3", 4790, 135), apple("g3a6", 3250, 135), apple("g3a7", 4500, 225), apple("g3a8", 5300, 225)],
    rewardBlocks: [reward("g3r1", 1650, 300), reward("g3r2", 3100, 300, "apple"), reward("g3r3", 4650, 300)], checkpoints: [1050, 1960, 2830, 3600, 4400, 5150], boss: "queen-bee",
  },
  {
    id: "12-1", world: 12, screen: 1,
    secretShop: { id: "shop-12-2", x: 1660, y: 230, width: 64, height: 80 },
    theme: "ice-mountain", width: 5600, start: { x: 80, y: 380 }, goalX: 5420,
    // Presentación: el viento empuja sobre suelo seguro. Desarrollo: ráfaga a favor hacia los huecos.
    // Giro (invertido): viento de cara sobre los huecos. Remate: ráfaga fuerte a favor hasta la bandera.
    beats: { development: 1650, twist: 3000, finale: 4350, twistKind: "invert" },
    platforms: [
      ...themedGround(world12Floor1, "ice-ground"), themedLedge(430, 335, 180, "ice-ledge"), themedLedge(780, 262, 170, "ice-ledge"), themedWall(1250, 350, 70, 106, "ice-wall"),
      themedLedge(1610, 310, 190, "ice-ledge"), themedLedge(2240, 250, 170, "ice-ledge"), themedLedge(2600, 300, 170, "ice-ledge"), themedLedge(2780, 215, 160, "ice-ledge"),
      themedLedge(3080, 330, 170, "ice-ledge"), themedLedge(3420, 262, 170, "ice-ledge"), themedLedge(3700, 330, 170, "ice-ledge"), themedLedge(3960, 250, 160, "ice-ledge"),
      themedLedge(4480, 320, 180, "ice-ledge"), themedLedge(4900, 240, 170, "ice-ledge"), themedLedge(5150, 330, 180, "ice-ledge"),
    ],
    deadlyWater: deadlyWaterPits(world12Floor1),
    windZones: [iceWind("i1-w1", 620, 900, 1, 240), iceWind("i1-w2", 1950, 1000, 1, 285), iceWind("i1-w3", 3000, 1050, -1, 320), iceWind("i1-w4", 4350, 950, 1, 330)],
    enemies: [enemy("i1-p1", "penguin", 520, 420, 300, 1100, 54), enemy("i1-f1", "snow-fox", 2100, 420, 2030, 2500, 52), enemy("i1-o1", "snowy-owl", 2900, 180, 2700, 3200, 74), enemy("i1-p2", "penguin", 3400, 420, 3290, 3880, 60), enemy("i1-f2", "snow-fox", 4900, 420, 4720, 5300, 58)],
    items: [apple("i1a1", 480, 285), apple("i1a2", 830, 212), apple("i1a3", 2290, 200), sticker("sticker-12-1", 2820, 165), apple("i1a4", 3470, 212), apple("i1a5", 4010, 200), apple("i1a6", 4950, 190)],
    rewardBlocks: [reward("i1r1", 1080, 300), reward("i1r2", 3330, 300, "apple")], checkpoints: [1150, 2700, 3300, 4760],
  },
  {
    id: "12-2", world: 12, screen: 2,
    theme: "ice-mountain", width: 3840, start: { x: 60, y: 398 }, goalX: 3790,
    // Sala-rompecabezas: una sala por tramo. Los cajones resbalan sobre el hielo hasta un tope u otro cajón.
    beats: { development: 960, twist: 1920, finale: 2880, twistKind: "shape" },
    platforms: [
      ...themedGround([[0, 3840]], "ice-ground"),
      ...[880, 1840, 2800, 3600, 3700].map((doorX) => themedWall(doorX - 8, -60, 64, 376, "ice-wall")),
      themedLedge(2560, 190, 210, "ice-ledge"), themedLedge(3380, 190, 150, "ice-ledge"),
    ],
    windZones: [iceWind("i2-w1", 200, 600, 1, 220), iceWind("i2-w2", 1500, 300, -1, 260), iceWind("i2-w3", 2250, 450, 1, 240), iceWind("i2-w4", 3000, 250, 1, 220)],
    enemies: [],
    items: [apple("i2a1", 150, 300), apple("i2a2", 760, 300), apple("i2a3", 1200, 280), apple("i2a4", 1650, 300), apple("i2a5", 2200, 300), apple("i2a6", 2480, 215), sticker("sticker-12-2", 2572, 136), apple("i2a7", 3520, 300)],
    rewardBlocks: [reward("i2r1", 420, 300), reward("i2r2", 1750, 300, "apple"), reward("i2r3", 3060, 300)],
    checkpoints: [],
    puzzleRooms: [
      {
        x: 0, entry: { x: 60, y: 398 }, exitDoor: "i2-d1",
        triggers: [{ id: "i2-t1", kind: "plate", x: 600, y: 456, width: 92, opens: "i2-d1" }],
        doors: [{ id: "i2-d1", symbol: "paw", x: 880, y: 316, width: 48, height: 140 }],
        crates: [{ id: "i2-c1", x: 240, y: 456, minX: 200, maxX: 600, slides: true }],
      },
      {
        x: 960, entry: { x: 1000, y: 398 }, exitDoor: "i2-d2",
        triggers: [{ id: "i2-t2", kind: "plate", x: 1400, y: 456, width: 92, opens: "i2-d2" }],
        doors: [{ id: "i2-d2", symbol: "star", x: 1840, y: 316, width: 48, height: 140 }],
        crates: [
          { id: "i2-c2", x: 1060, y: 456, minX: 1000, maxX: 1700, slides: true },
          { id: "i2-c3", x: 1464, y: 456, minX: 1464, maxX: 1700, slides: true },
        ],
      },
      {
        x: 1920, entry: { x: 1960, y: 398 }, exitDoor: "i2-d3", startColor: "pink",
        triggers: [
          { id: "i2-t3-blue", kind: "color", color: "blue", x: 2060, y: 456, width: 72 },
          { id: "i2-t3-pink", kind: "color", color: "pink", x: 2160, y: 456, width: 72 },
          { id: "i2-t3", kind: "paw", x: 2650, y: 190, width: 72, opens: "i2-d3" },
        ],
        doors: [{ id: "i2-d3", symbol: "moon", x: 2800, y: 316, width: 48, height: 140 }],
        colorPlatforms: [
          { id: "i2-p3-1", color: "blue", x: 2280, y: 360, width: 140, height: 24 },
          { id: "i2-p3-2", color: "blue", x: 2450, y: 270, width: 120, height: 24 },
          { id: "i2-p3-3", color: "pink", x: 2330, y: 250, width: 120, height: 24 },
        ],
      },
      {
        x: 2880, entry: { x: 2920, y: 398 }, exitDoor: "i2-d4", startColor: "blue",
        triggers: [
          { id: "i2-t4-plate", kind: "plate", x: 3300, y: 456, width: 92, opens: "i2-d4" },
          { id: "i2-t4-pink", kind: "color", color: "pink", x: 3480, y: 456, width: 72 },
          { id: "i2-t4", kind: "paw", x: 3420, y: 190, width: 72, opens: "i2-d5" },
        ],
        doors: [
          { id: "i2-d4", symbol: "star", x: 3600, y: 316, width: 48, height: 140 },
          { id: "i2-d5", symbol: "paw", x: 3700, y: 316, width: 48, height: 140 },
        ],
        colorPlatforms: [
          { id: "i2-p4-1", color: "pink", x: 3180, y: 350, width: 120, height: 24 },
          { id: "i2-p4-2", color: "pink", x: 3260, y: 270, width: 100, height: 24 },
        ],
        crates: [{ id: "i2-c4", x: 2980, y: 456, minX: 2960, maxX: 3300, slides: true }],
      },
    ],
  },
  {
    id: "12-3", world: 12, screen: 3,
    route: { next: "13-1" },
    theme: "ice-mountain", width: 6500, start: { x: 80, y: 380 }, goalX: 6320,
    // Giro (combina): ráfagas que cambian de sentido entre paredes de hielo. Remate: ráfaga fuerte hasta la Osa.
    beats: { development: 700, twist: 3450, finale: 5000, twistKind: "combine" },
    platforms: [
      ...themedGround(world12Floor3, "ice-ground"), themedLedge(420, 335, 180, "ice-ledge"), themedLedge(760, 255, 170, "ice-ledge"), themedLedge(1180, 325, 180, "ice-ledge"),
      themedLedge(1560, 240, 170, "ice-ledge"), themedLedge(2050, 320, 180, "ice-ledge"), themedLedge(2420, 245, 170, "ice-ledge"), themedLedge(2760, 320, 170, "ice-ledge"),
      themedLedge(3100, 240, 170, "ice-ledge"), themedLedge(3600, 330, 180, "ice-ledge"), themedLedge(3980, 250, 170, "ice-ledge"), themedLedge(4350, 320, 180, "ice-ledge"),
      themedLedge(4700, 240, 170, "ice-ledge"), themedLedge(5150, 320, 190, "ice-ledge"), themedLedge(5560, 235, 170, "ice-ledge"),
      themedWall(1500, 338, 76, 118, "ice-wall"), themedWall(3800, 320, 78, 136, "ice-wall"),
    ],
    deadlyWater: deadlyWaterPits(world12Floor3),
    windZones: [iceWind("i3-w1", 300, 500, 1, 300), iceWind("i3-w2", 1100, 1300, -1, 350), iceWind("i3-w3", 3450, 900, 1, 380), iceWind("i3-w4", 4400, 500, -1, 380), iceWind("i3-w5", 5000, 1000, 1, 400)],
    enemies: [enemy("i3-p1", "penguin", 500, 420, 300, 820, 62), enemy("i3-o1", "snowy-owl", 1150, 165, 1000, 1450, 86), enemy("i3-f1", "snow-fox", 2200, 420, 1950, 2530, 62), enemy("i3-o2", "snowy-owl", 3200, 125, 3000, 3380, 92), enemy("i3-p2", "penguin", 3700, 420, 3560, 4080, 68), enemy("i3-o3", "snowy-owl", 4800, 135, 4300, 4880, 98), enemy("i3-f2", "snow-fox", 5600, 420, 5100, 6000, 72)],
    items: [apple("i3a1", 470, 285), apple("i3a2", 810, 205), apple("i3a3", 1230, 275), apple("i3a4", 2100, 270), apple("i3a5", 2810, 270), sticker("sticker-12-3", 4750, 190), apple("i3a6", 3650, 280), apple("i3a7", 4400, 270), apple("i3a8", 5200, 270)],
    rewardBlocks: [reward("i3r1", 1400, 300), reward("i3r2", 3000, 300, "apple"), reward("i3r3", 4600, 300)], checkpoints: [1050, 2000, 2750, 3600, 4300, 5100], boss: "polar-bear",
  },
  {
    id: "13-1", world: 13, screen: 1,
    theme: "winter-snow", width: 5600, start: { x: 80, y: 380 }, goalX: 5420,
    // Presentación: el regalo saltarín y una nevada suave sobre suelo seguro. Giro (invertido): la nevada
    // empuja en contra sobre los huecos.
    beats: { development: 1650, twist: 3000, finale: 4350, twistKind: "invert" },
    platforms: [
      ...themedGround([[0, 1100], [1250, 900], [2300, 820], [3270, 880], [4300, 700], [5150, 450]], "snow-ground"),
      themedLedge(50, 345, 150, "snow-ledge"),
      themedLedge(315, 190, 150, "snow-ledge"),
      themedLedge(580, 345, 150, "snow-ledge"),
      themedLedge(845, 190, 150, "snow-ledge"),
      themedLedge(1300, 345, 150, "snow-ledge"),
      themedLedge(1565, 190, 150, "snow-ledge"),
      themedLedge(1830, 345, 150, "snow-ledge"),
      themedLedge(2350, 190, 150, "snow-ledge"),
      themedLedge(2615, 345, 150, "snow-ledge"),
      themedLedge(2880, 190, 150, "snow-ledge"),
      themedLedge(3320, 345, 150, "snow-ledge"),
      themedLedge(3585, 190, 150, "snow-ledge"),
      themedLedge(3850, 345, 150, "snow-ledge"),
      themedLedge(4350, 190, 150, "snow-ledge"),
      themedLedge(4615, 345, 150, "snow-ledge"),
      themedLedge(5200, 190, 150, "snow-ledge"),
      themedLedge(4840, 190, 130, "snow-ledge"),
      { x: 700, y: 414, width: 84, height: 42, kind: "gift-spring" },
    ],
    deadlyWater: deadlyWaterPits([[0, 1100], [1250, 900], [2300, 820], [3270, 880], [4300, 700], [5150, 450]]),
    windZones: [iceWind("santa-snow-1", 600, 300, 1, 180), iceWind("santa-snow-2", 3000, 900, -1, 220), iceWind("santa-snow-3", 4350, 600, 1, 220)],
    enemies: [enemy("s13-p1", "snow-scout", 350, 420, 150, 550, 48), enemy("s13-f1", "toy-reindeer", 1500, 420, 1300, 1800, 50), enemy("s13-o1", "winter-robin", 2700, 180, 2400, 3000, 65), enemy("s13-p2", "snow-scout", 3500, 420, 3300, 4000, 54)],
    items: [apple("s13a1", 360, 140), apple("s13a2", 890, 140), sticker("sticker-13-1", 1610, 140), apple("s13a3", 2395, 140), apple("s13a4", 3630, 140), apple("s13a5", 5245, 140)],
    rewardBlocks: [reward("s13r1", 1350, 130), reward("s13r2", 3370, 130, "apple")], checkpoints: [1000, 2000, 2400, 3400, 4400],
  },
  {
    id: "13-2", world: 13, screen: 2,
    theme: "toy-factory", width: 960, height: 2600, orientation: "vertical",
    start: { x: 120, y: 2482 }, goalX: 480, goalY: 175,
    // Subida: cintas en los dos sentidos y regalos saltarines. Tramos medidos en altura subida.
    beats: { development: 250, twist: 1270, finale: 1850, twistKind: "shape" },
    platforms: [
      { x: 0, y: 2540, width: 960, height: 120, kind: "factory-ground" },
      { x: 100, y: 2430, width: 220, height: 28, kind: "factory-ledge", beltSpeed: 70 },
      themedLedge(420, 2320, 200, "factory-ledge"),
      themedLedge(700, 2210, 200, "factory-ledge"),
      { x: 400, y: 2100, width: 220, height: 28, kind: "factory-ledge", beltSpeed: -70 },
      themedLedge(100, 1990, 200, "factory-ledge"),
      themedLedge(380, 1880, 200, "factory-ledge"),
      { x: 660, y: 1770, width: 220, height: 28, kind: "factory-ledge", beltSpeed: 80 },
      themedLedge(380, 1660, 200, "factory-ledge"),
      themedLedge(100, 1550, 220, "factory-ledge"),
      themedLedge(400, 1440, 200, "factory-ledge"),
      themedLedge(690, 1330, 200, "factory-ledge"),
      { x: 420, y: 1220, width: 200, height: 28, kind: "factory-ledge", beltSpeed: -80 },
      themedLedge(140, 1110, 200, "factory-ledge"),
      themedLedge(430, 1000, 200, "factory-ledge"),
      { x: 700, y: 890, width: 200, height: 28, kind: "factory-ledge", beltSpeed: 85 },
      themedLedge(420, 780, 200, "factory-ledge"),
      themedLedge(130, 670, 220, "factory-ledge"),
      { x: 420, y: 560, width: 200, height: 28, kind: "factory-ledge", beltSpeed: -90 },
      themedLedge(700, 450, 200, "factory-ledge"),
      themedLedge(420, 340, 200, "factory-ledge"),
      themedLedge(330, 230, 300, "factory-ledge"),
      { x: 460, y: 1398, width: 84, height: 42, kind: "gift-spring" },
      { x: 180, y: 628, width: 84, height: 42, kind: "gift-spring" },
    ],
    enemies: [enemy("s13-e1", "toy-bird", 500, 1920, 300, 800, 70), enemy("s13-e2", "toy-elf", 420, 1844, 390, 540, 40), enemy("s13-e3", "toy-robot", 460, 964, 440, 590, 44), enemy("s13-e4", "toy-bird", 500, 700, 300, 760, 76)],
    items: [apple("s13b1", 480, 2270), apple("s13b2", 160, 1940), apple("s13b3", 720, 1500), sticker("sticker-13-2", 740, 400), apple("s13b4", 470, 950), apple("s13b5", 180, 620)],
    rewardBlocks: [reward("s13r3", 480, 2150), reward("s13r4", 440, 1494, "apple")],
    checkpoints: [],
    verticalCheckpoints: [{ x: 440, y: 1880 }, { x: 460, y: 1000 }],
  },
  {
    id: "13-3", world: 13, screen: 3, route: { next: "14-1" },
    theme: "gift-warehouse", width: 6500, start: { x: 80, y: 380 }, goalX: 6320,
    // Giro (combina): cintas en sentidos contrarios y el regalo saltarín antes de Papá Noel.
    beats: { development: 650, twist: 3450, finale: 5000, twistKind: "combine" },
    platforms: [
      ...themedGround([[0, 860], [1010, 820], [1980, 760], [2890, 800], [3840, 700], [4690, 740], [5580, 920]], "warehouse-ground"),
      themedLedge(60, 345, 150, "warehouse-ledge"),
      themedLedge(350, 190, 150, "warehouse-ledge"),
      themedLedge(640, 345, 150, "warehouse-ledge"),
      themedLedge(1070, 190, 150, "warehouse-ledge"),
      { x: 1360, y: 345, width: 150, height: 28, kind: "warehouse-ledge", beltSpeed: 85 },
      themedLedge(1650, 190, 150, "warehouse-ledge"),
      themedLedge(2040, 345, 150, "warehouse-ledge"),
      themedLedge(2330, 190, 150, "warehouse-ledge"),
      themedLedge(2950, 345, 150, "warehouse-ledge"),
      themedLedge(3240, 190, 150, "warehouse-ledge"),
      { x: 3900, y: 345, width: 150, height: 28, kind: "warehouse-ledge", beltSpeed: -85 },
      themedLedge(4190, 190, 150, "warehouse-ledge"),
      themedLedge(4750, 345, 150, "warehouse-ledge"),
      themedLedge(5040, 190, 150, "warehouse-ledge"),
      themedLedge(5640, 345, 150, "warehouse-ledge"),
      themedLedge(5930, 190, 150, "warehouse-ledge"),
      themedLedge(6220, 345, 150, "warehouse-ledge"),
      { x: 4800, y: 414, width: 84, height: 42, kind: "gift-spring" },
    ],
    deadlyWater: deadlyWaterPits([[0, 860], [1010, 820], [1980, 760], [2890, 800], [3840, 700], [4690, 740], [5580, 920]]),
    enemies: [enemy("s13c-e1", "gift-box", 400, 420, 200, 800, 58), enemy("s13c-e2", "star-lantern", 1300, 160, 1100, 1570, 78), enemy("s13c-e3", "gift-gnome", 2300, 420, 2000, 2700, 60), enemy("s13c-e4", "star-lantern", 4200, 150, 3900, 4500, 82), enemy("s13c-e5", "gift-box", 5100, 420, 4950, 5400, 64), enemy("s13c-e6", "gift-gnome", 6000, 420, 5700, 6200, 62)],
    items: [apple("s13c1", 395, 140), apple("s13c2", 1115, 140), apple("s13c3", 1695, 140), apple("s13c4", 3285, 140), sticker("sticker-13-3", 5975, 140), apple("s13c5", 4235, 140)],
    rewardBlocks: [reward("s13r5", 690, 130), reward("s13r6", 4800, 130, "apple")], checkpoints: [1050, 2000, 2950, 3900, 5100, 5650], boss: "santa-claus",
  },
  {
    id: "14-1", world: 14, screen: 1,
    theme: "desert-dunes", width: 5900, start: { x: 80, y: 380 }, goalX: 5710,
    // Presentación: géiser sobre suelo seguro. Giro (invertido): el remolino sopla en contra sobre los huecos.
    beats: { development: 1650, twist: 3000, finale: 4350, twistKind: "invert" },
    platforms: [
      ...themedGround([[0, 1700], [1850, 800], [2800, 760], [3710, 820], [4680, 600], [5430, 470]], "desert-ground"),
      themedLedge(110, 290, 160, "desert-ledge"), themedLedge(440, 175, 160, "desert-ledge"), themedLedge(770, 290, 160, "desert-ledge"),
      themedLedge(1100, 175, 160, "desert-ledge"), themedLedge(1430, 290, 160, "desert-ledge"), themedLedge(1960, 175, 160, "desert-ledge"),
      themedLedge(2290, 290, 160, "desert-ledge"), themedLedge(2910, 175, 160, "desert-ledge"), themedLedge(3240, 290, 160, "desert-ledge"),
      themedLedge(3820, 175, 160, "desert-ledge"), themedLedge(4150, 290, 160, "desert-ledge"), themedLedge(4790, 175, 160, "desert-ledge"),
      themedLedge(5540, 290, 160, "desert-ledge"),
    ],
    deadlyWater: deadlyWaterPits([[0, 1700], [1850, 800], [2800, 760], [3710, 820], [4680, 600], [5430, 470]]),
    sandGeysers: [{ id: "sand-1", x: 620, y: 105, width: 130, height: 351, strength: 1850, maxRiseSpeed: 150 }, { id: "sand-2", x: 3050, y: 90, width: 150, height: 366, strength: 1950, maxRiseSpeed: 155 }],
    windZones: [iceWind("dune-wind-1", 1900, 330, 1, 190), iceWind("dune-wind-2", 4100, 360, -1, 210)],
    enemies: [enemy("d14-s1", "desert-scarab", 300, 420, 60, 560, 52), enemy("d14-f1", "fennec", 1300, 420, 1150, 1650, 58), enemy("d14-t1", "tumbleweed", 2500, 420, 2300, 2600, 72), enemy("d14-s2", "desert-scarab", 4000, 420, 3750, 4450, 62)],
    items: [apple("d14a1", 490, 125), apple("d14a2", 1150, 125), sticker("sticker-14-1", 2010, 125), apple("d14a3", 2960, 125), apple("d14a4", 3870, 125), apple("d14a5", 4840, 125)],
    rewardBlocks: [reward("d14r1", 1250, 300), reward("d14r2", 4400, 300, "apple")], checkpoints: [1000, 1900, 2850, 3760, 4720],
  },
  {
    id: "14-2", world: 14, screen: 2,
    theme: "desert-oasis", width: 3200, height: 1300, orientation: "explore",
    start: { x: 80, y: 942 }, goalX: 1070, goalY: 1000,
    // Exploración: un gatito casi a la vista, otro en la cueva bajo las dunas y el tercero en las ruinas altas,
    // a las que lleva un géiser; el puente de vuelta se abre con los tres.
    beats: { development: 1800, twist: 2600, finale: 1000, twistKind: "shape" },
    platforms: [
      { x: 0, y: 1000, width: 1500, height: 60, kind: "desert-ground" }, { x: 1700, y: 1000, width: 1500, height: 60, kind: "desert-ground" }, { x: 1450, y: 1200, width: 800, height: 100, kind: "desert-ground" },
      themedLedge(200, 880, 160, "desert-ledge"), themedLedge(260, 620, 180, "desert-ledge"), themedLedge(2150, 1110, 140, "desert-ledge"),
      themedLedge(2750, 880, 150, "desert-ledge"), themedLedge(2950, 770, 150, "desert-ledge"), themedLedge(2750, 660, 150, "desert-ledge"), themedLedge(2950, 550, 150, "desert-ledge"),
      themedLedge(2500, 440, 400, "desert-ledge"), themedLedge(1400, 520, 1100, "desert-ledge"),
    ],
    sandGeysers: [{ id: "oasis-1", x: 300, y: 640, width: 140, height: 360, strength: 1950, maxRiseSpeed: 155 }, { id: "oasis-2", x: 2300, y: 460, width: 150, height: 540, strength: 2100, maxRiseSpeed: 165 }],
    enemies: [enemy("d14b-s", "desert-scarab", 800, 964, 650, 950, 58), enemy("d14b-f", "fennec", 2000, 964, 1750, 2250, 64), enemy("d14b-t1", "tumbleweed", 1650, 1164, 1500, 2100, 70)],
    items: [apple("d14b1", 240, 830), apple("d14b2", 320, 570), apple("d14b3", 1600, 1150), apple("d14b4", 2200, 1060), sticker("sticker-14-2", 2050, 470), apple("d14b5", 3000, 500), apple("d14b6", 1800, 470)],
    rewardBlocks: [reward("d14rb1", 600, 844), reward("d14rb2", 3100, 844, "apple")],
    checkpoints: [],
    verticalCheckpoints: [{ x: 1800, y: 1000 }, { x: 1900, y: 1200 }, { x: 2700, y: 440 }],
    exploreGate: { x: 1000, y: 840, width: 140, height: 160 },
    lostKittens: [
      { id: "d14-k1", x: 520, y: 1000, cat: 14, beat: "presentation" },
      { id: "d14-k2", x: 1800, y: 1200, cat: 13, beat: "development" },
      { id: "d14-k3", x: 2600, y: 440, cat: 9, beat: "twist" },
    ],
    exploreShortcut: [{ x: 1400, y: 240, width: 40, height: 280, kind: "puzzle-block" }],
  },
  {
    id: "14-3", world: 14, screen: 3, route: { next: "15-1" },
    theme: "desert-ruins", width: 6500, start: { x: 80, y: 380 }, goalX: 6320,
    // Giro (combina): géiser y remolinos seguidos entre las columnas.
    beats: { development: 650, twist: 3450, finale: 5000, twistKind: "combine" },
    platforms: [
      ...themedGround([[0, 880], [1030, 760], [1940, 820], [2910, 720], [3780, 780], [4710, 700], [5560, 940]], "desert-ground"),
      themedLedge(110, 290, 160, "desert-ledge"), themedLedge(440, 175, 160, "desert-ledge"), themedLedge(1140, 290, 160, "desert-ledge"),
      themedLedge(1470, 175, 160, "desert-ledge"), themedLedge(2050, 290, 160, "desert-ledge"), themedLedge(2380, 175, 160, "desert-ledge"),
      themedLedge(3020, 290, 160, "desert-ledge"), themedLedge(3350, 175, 160, "desert-ledge"), themedLedge(3890, 290, 160, "desert-ledge"),
      themedLedge(4220, 175, 160, "desert-ledge"), themedLedge(4820, 290, 160, "desert-ledge"), themedLedge(5150, 175, 160, "desert-ledge"),
      themedLedge(5670, 290, 160, "desert-ledge"), themedLedge(6000, 175, 160, "desert-ledge"),
    ],
    deadlyWater: deadlyWaterPits([[0, 880], [1030, 760], [1940, 820], [2910, 720], [3780, 780], [4710, 700], [5560, 940]]),
    sandGeysers: [{ id: "ruins-1", x: 600, y: 80, width: 150, height: 376, strength: 2000, maxRiseSpeed: 160 }, { id: "ruins-2", x: 3400, y: 70, width: 150, height: 386, strength: 2100, maxRiseSpeed: 165 }, { id: "ruins-3", x: 6000, y: 70, width: 160, height: 386, strength: 2150, maxRiseSpeed: 170 }],
    windZones: [iceWind("ruins-w1", 1500, 450, 1, 230), iceWind("ruins-w2", 4100, 480, -1, 250), iceWind("ruins-w3", 5600, 300, 1, 260)],
    enemies: [enemy("d14c-f1", "fennec", 430, 420, 260, 730, 64), enemy("d14c-t1", "tumbleweed", 1500, 420, 1300, 1750, 84), enemy("d14c-s1", "desert-scarab", 2300, 420, 2000, 2700, 68), enemy("d14c-f2", "fennec", 4200, 420, 3900, 4500, 72), enemy("d14c-t2", "tumbleweed", 5000, 420, 4750, 5350, 90), enemy("d14c-s2", "desert-scarab", 6000, 420, 5700, 6150, 74)],
    items: [apple("d14c1", 490, 125), apple("d14c2", 1520, 125), apple("d14c3", 2430, 125), sticker("sticker-14-3", 3400, 125), apple("d14c4", 4270, 125), apple("d14c5", 6050, 125)],
    rewardBlocks: [reward("d14rc1", 1300, 300), reward("d14rc2", 4400, 300, "apple")], checkpoints: [1050, 1960, 2930, 3800, 4730, 5600], boss: "siroco",
  },
  {
    id: "15-1", world: 15, screen: 1,
    theme: "train-station", width: 6000, start: { x: 80, y: 380 }, goalX: 5810,
    // Presentación: un vagón largo a favor sobre suelo seguro. Giro (invertido): las cintas van hacia atrás.
    beats: { development: 1720, twist: 3150, finale: 4600, twistKind: "invert" },
    platforms: [
      ...themedGround([[0, 1750], [1900, 800], [2850, 760], [3760, 800], [4710, 1290]], "train-ground"),
      { ...themedLedge(300, 320, 520, "train-roof"), beltSpeed: 80 }, themedLedge(900, 215, 180, "train-roof"), { ...themedLedge(1250, 300, 400, "train-roof"), beltSpeed: 90 },
      { ...themedLedge(1950, 330, 300, "train-roof"), beltSpeed: -85 }, themedLedge(2350, 220, 180, "train-roof"), { ...themedLedge(2900, 300, 420, "train-roof"), beltSpeed: 100 },
      { ...themedLedge(3800, 320, 360, "train-roof"), beltSpeed: -95 }, themedLedge(4250, 215, 180, "train-roof"), { ...themedLedge(4750, 300, 520, "train-roof"), beltSpeed: 105 },
      themedLedge(5400, 200, 190, "train-roof"),
    ],
    deadlyWater: deadlyWaterPits([[0, 1750], [1900, 800], [2850, 760], [3760, 800], [4710, 1290]]),
    enemies: [enemy("t15-s1", "rolling-suitcase", 500, 420, 200, 800, 58), enemy("t15-p1", "conductor-pigeon", 1500, 160, 1200, 1700, 76), enemy("t15-m1", "clockwork-mouse", 2500, 420, 2000, 2650, 66), enemy("t15-s2", "rolling-suitcase", 4100, 420, 3800, 4500, 68)],
    items: [apple("t15a1", 400, 270), sticker("sticker-15-1", 950, 165), apple("t15a2", 1400, 250), apple("t15a3", 2400, 170), apple("t15a4", 4300, 165), apple("t15a5", 5450, 150)],
    rewardBlocks: [reward("t15r1", 1100, 300), reward("t15r2", 3500, 300, "apple")], checkpoints: [1000, 1950, 2900, 3800, 4750],
  },
  {
    id: "15-2", world: 15, screen: 2,
    theme: "train-valley", width: 5800, start: { x: 80, y: 380 }, goalX: 5650,
    // Persecución amable: el ratón corre de vagón en vagón entre el vapor y espera en el rincón del puente.
    beats: { development: 1800, twist: 2850, finale: 4000, twistKind: "shape" },
    platforms: [
      ...themedGround([[0, 1500], [1650, 900], [2700, 800], [3650, 750], [4550, 1250]], "train-ground"),
      { ...themedLedge(300, 320, 400, "train-roof"), beltSpeed: 80 }, { ...themedLedge(1700, 300, 360, "train-roof"), beltSpeed: -90 }, { ...themedLedge(2750, 320, 380, "train-roof"), beltSpeed: 95 },
      themedLedge(3150, 200, 180, "train-roof"), { ...themedLedge(4600, 320, 380, "train-roof"), beltSpeed: 100 },
    ],
    deadlyWater: deadlyWaterPits([[0, 1500], [1650, 900], [2700, 800], [3650, 750], [4550, 1250]]),
    lavaJets: [lavaJet("steam-1", 1520, 4.2, 0, 250), lavaJet("steam-2", 2570, 4.4, 1.2, 290), lavaJet("steam-3", 3520, 4.1, 2.1, 270), lavaJet("steam-4", 4420, 4.5, .8, 300)],
    chase: {
      runner: "clockwork-mouse", carries: "yarn",
      stops: [
        { x: 700, y: 456,beat: "presentation" },
        { x: 1300, y: 456,beat: "presentation" },
        { x: 1800, y: 300, jump: true,beat: "development" },
        { x: 2400, y: 456, jump: true,beat: "development" },
        { x: 2850, y: 320, jump: true,beat: "twist" },
        { x: 3250, y: 200, jump: true,beat: "twist" },
        { x: 4000, y: 456, jump: true,beat: "finale" },
        { x: 4900, y: 456, jump: true,beat: "finale" },
        { x: 5650, y: 456,beat: "finale" },
      ],
    },
    enemies: [enemy("t15b-s", "rolling-suitcase", 950, 420, 850, 1150, 62), enemy("t15b-p", "conductor-pigeon", 2000, 150, 1700, 2300, 82), enemy("t15b-s2", "rolling-suitcase", 4200, 420, 4100, 4380, 72), enemy("t15b-p2", "conductor-pigeon", 5100, 150, 4700, 5400, 88)],
    items: [apple("t15b1", 450, 270), apple("t15b2", 1850, 250), apple("t15b3", 2900, 270), sticker("sticker-15-2", 3200, 140), apple("t15b4", 4700, 270), apple("t15b5", 5300, 300)],
    rewardBlocks: [reward("t15rb1", 1100, 300), reward("t15rb2", 3800, 300, "apple")], checkpoints: [1000, 1700, 2750, 3700, 4600],
  },
  {
    id: "15-3", world: 15, screen: 3, route: { next: "16-1" },
    theme: "train-engine", width: 6500, start: { x: 80, y: 380 }, goalX: 6320,
    // Giro (combina): cintas en sentidos alternos con el vapor en cada hueco.
    beats: { development: 650, twist: 3450, finale: 5000, twistKind: "combine" },
    platforms: [
      ...themedGround([[0, 1000], [1150, 760], [2060, 820], [3030, 700], [3880, 840], [4870, 640], [5660, 840]], "train-ground"),
      { ...themedLedge(300, 320, 380, "train-roof"), beltSpeed: 90 }, { ...themedLedge(1100, 300, 360, "train-roof"), beltSpeed: -95 }, themedLedge(1500, 210, 180, "train-roof"),
      { ...themedLedge(2000, 320, 380, "train-roof"), beltSpeed: 100 }, themedLedge(2450, 215, 180, "train-roof"), { ...themedLedge(2950, 300, 360, "train-roof"), beltSpeed: -105 },
      themedLedge(3350, 210, 180, "train-roof"), { ...themedLedge(3850, 320, 380, "train-roof"), beltSpeed: 110 }, themedLedge(4300, 215, 180, "train-roof"),
      { ...themedLedge(4800, 300, 380, "train-roof"), beltSpeed: -115 }, { ...themedLedge(5650, 320, 420, "train-roof"), beltSpeed: 110 }, themedLedge(6050, 215, 170, "train-roof"),
    ],
    deadlyWater: deadlyWaterPits([[0, 1000], [1150, 760], [2060, 820], [3030, 700], [3880, 840], [4870, 640], [5660, 840]]),
    lavaJets: [lavaJet("engine-steam-1", 1020, 4, 0, 270), lavaJet("engine-steam-2", 1930, 4.3, 1.1, 300), lavaJet("engine-steam-3", 2900, 4.1, 2, 290), lavaJet("engine-steam-4", 3750, 4.4, .6, 310), lavaJet("engine-steam-5", 4740, 4.2, 1.7, 280), lavaJet("engine-steam-6", 5530, 4.0, .3, 300)],
    enemies: [enemy("t15c-s1", "rolling-suitcase", 450, 420, 250, 800, 68), enemy("t15c-p1", "conductor-pigeon", 1450, 145, 1100, 1700, 88), enemy("t15c-m1", "clockwork-mouse", 2300, 420, 2000, 2700, 76), enemy("t15c-s2", "rolling-suitcase", 4200, 420, 3850, 4550, 78), enemy("t15c-p2", "conductor-pigeon", 5000, 140, 4750, 5300, 94), enemy("t15c-m2", "clockwork-mouse", 5900, 420, 5650, 6200, 80)],
    items: [apple("t15c1", 400, 270), apple("t15c2", 1550, 160), apple("t15c3", 2500, 165), sticker("sticker-15-3", 3400, 160), apple("t15c4", 4350, 165), apple("t15c5", 5700, 270)],
    rewardBlocks: [reward("t15rc1", 1700, 300), reward("t15rc2", 4500, 300, "apple")], checkpoints: [1200, 2100, 3050, 3900, 4900, 5700], boss: "don-silbato",
  },
  {
    id: "16-1", world: 16, screen: 1,
    theme: "music-garden", width: 6000, start: { x: 80, y: 380 }, goalX: 5810,
    // Presentación: paseo sin huecos con una onda suave. Giro (invertido): las ondas soplan en contra sobre los
    // huecos y el compás se acelera. Remate: onda fuerte a favor hasta la bandera.
    beats: { development: 1720, twist: 3150, finale: 4600, twistKind: "invert" },
    platforms: [
      ...themedGround([[0, 1780], [1920, 760], [2820, 690], [3650, 560], [4350, 620], [5110, 890]], "music-ground"),
      themedLedge(380, 320, 200, "music-stage"), themedLedge(720, 230, 170, "music-stage"), themedLedge(1150, 300, 190, "music-stage"), themedLedge(1480, 215, 170, "music-stage"),
      themedLedge(2050, 320, 190, "music-stage"), themedLedge(2400, 240, 170, "music-stage"), themedLedge(2950, 320, 190, "music-stage"),
      themedLedge(3250, 250, 170, "music-stage"), themedLedge(3700, 320, 190, "music-stage"), themedLedge(4020, 235, 170, "music-stage"), themedLedge(4450, 320, 190, "music-stage"),
      themedLedge(4750, 240, 170, "music-stage"), themedLedge(5250, 320, 190, "music-stage"), themedLedge(5560, 230, 170, "music-stage"),
    ],
    deadlyWater: deadlyWaterPits([[0, 1780], [1920, 760], [2820, 690], [3650, 560], [4350, 620], [5110, 890]]),
    windZones: [iceWind("beat-1", 900, 650, 1, 170), iceWind("beat-2", 2000, 700, 1, 190), iceWind("beat-3", 3150, 1300, -1, 230), iceWind("beat-4", 4600, 700, 1, 240)],
    beatPlatforms: [
      { id: "compas-1a", x: 1790, y: 350, width: 120, height: 24, kind: "music-stage", interval: 2.4, delay: 0, activeDuration: 1.65 },
      { id: "compas-1b", x: 2690, y: 330, width: 120, height: 24, kind: "music-stage", interval: 2.4, delay: 0.8, activeDuration: 1.65 },
      { id: "compas-1c", x: 3520, y: 345, width: 120, height: 24, kind: "music-stage", interval: 2.0, delay: 0.4, activeDuration: 1.3 },
      { id: "compas-1d", x: 4220, y: 330, width: 120, height: 24, kind: "music-stage", interval: 2.0, delay: 1.2, activeDuration: 1.3 },
      { id: "compas-1e", x: 4980, y: 345, width: 120, height: 24, kind: "music-stage", interval: 2.0, delay: 0.6, activeDuration: 1.3 },
    ],
    enemies: [enemy("m16-d1", "walking-drum", 500, 420, 280, 900, 56), enemy("m16-n1", "note-bird", 1500, 155, 1200, 1700, 78), enemy("m16-v1", "violin-mouse", 2300, 420, 1960, 2650, 62), enemy("m16-d2", "walking-drum", 4500, 420, 4370, 4950, 66)],
    items: [apple("m16a1", 430, 270), sticker("sticker-16-1", 760, 180), apple("m16a2", 1530, 165), apple("m16a3", 2450, 190), apple("m16a4", 4060, 185), apple("m16a5", 5600, 180)],
    rewardBlocks: [reward("m16r1", 1000, 300), reward("m16r2", 3900, 300, "apple")], checkpoints: [1100, 2000, 2900, 3700, 5200],
  },
  {
    id: "16-2", world: 16, screen: 2,
    theme: "music-bells", width: 3840, start: { x: 60, y: 398 }, goalX: 3790,
    // Sala-rompecabezas: el color de las plataformas cambia al compás en vez de con botones.
    beats: { development: 960, twist: 1920, finale: 2880, twistKind: "shape" },
    platforms: [
      ...themedGround([[0, 3840]], "music-ground"),
      { x: 872, y: -400, width: 64, height: 716, kind: "puzzle-block" }, { x: 1832, y: -400, width: 64, height: 716, kind: "puzzle-block" }, { x: 2792, y: -400, width: 64, height: 716, kind: "puzzle-block" }, { x: 3592, y: -400, width: 64, height: 716, kind: "puzzle-block" }, { x: 3692, y: -400, width: 64, height: 716, kind: "puzzle-block" },
      themedLedge(560, 200, 200, "music-stage"), themedLedge(2560, 140, 210, "music-stage"), themedLedge(3380, 140, 150, "music-stage"),
    ],
    windZones: [iceWind("bell-1", 2250, 450, 1, 200)],
    beatPlatforms: [{ id: "compas-2a", x: 1560, y: 330, width: 120, height: 24, kind: "music-stage", interval: 2.1, delay: 0, activeDuration: 1.35 }],
    enemies: [],
    items: [apple("m16b1", 150, 300), apple("m16b2", 1200, 280), apple("m16b3", 1600, 270), apple("m16b4", 2200, 300), sticker("sticker-16-2", 2572, 86), apple("m16b5", 3520, 300)],
    rewardBlocks: [reward("m16rb1", 790, 300), reward("m16rb2", 3060, 300, "apple")],
    checkpoints: [],
    puzzleRooms: [
      {
        x: 0, entry: { x: 60, y: 398 }, exitDoor: "m16-d1", startColor: "blue", colorBeat: 2.4,
        triggers: [{ id: "m16-t1", kind: "paw", x: 620, y: 200, width: 72, opens: "m16-d1" }],
        doors: [{ id: "m16-d1", symbol: "paw", x: 880, y: 316, width: 48, height: 140 }],
        colorPlatforms: [
          { id: "m16-p1-1", color: "blue", x: 250, y: 350, width: 140, height: 24 },
          { id: "m16-p1-2", color: "pink", x: 410, y: 270, width: 130, height: 24 },
        ],
      },
      {
        x: 960, entry: { x: 1000, y: 398 }, exitDoor: "m16-d2",
        triggers: [{ id: "m16-t2", kind: "plate", x: 1460, y: 456, width: 92, opens: "m16-d2" }],
        doors: [{ id: "m16-d2", symbol: "star", x: 1840, y: 316, width: 48, height: 140 }],
        crates: [{ id: "m16-c2", x: 1150, y: 456, minX: 1100, maxX: 1500 }],
      },
      {
        x: 1920, entry: { x: 1960, y: 398 }, exitDoor: "m16-d3", startColor: "pink", colorBeat: 2.1,
        triggers: [{ id: "m16-t3", kind: "paw", x: 2650, y: 140, width: 72, opens: "m16-d3" }],
        doors: [{ id: "m16-d3", symbol: "moon", x: 2800, y: 316, width: 48, height: 140 }],
        colorPlatforms: [
          { id: "m16-p3-1", color: "pink", x: 2120, y: 360, width: 140, height: 24 },
          { id: "m16-p3-2", color: "blue", x: 2290, y: 290, width: 130, height: 24 },
          { id: "m16-p3-3", color: "pink", x: 2440, y: 230, width: 110, height: 24 },
        ],
      },
      {
        x: 2880, entry: { x: 2920, y: 398 }, exitDoor: "m16-d4", startColor: "blue", colorBeat: 1.8,
        triggers: [
          { id: "m16-t4-plate", kind: "plate", x: 3300, y: 456, width: 92, opens: "m16-d4" },
          { id: "m16-t4", kind: "paw", x: 3420, y: 140, width: 72, opens: "m16-d5" },
        ],
        doors: [
          { id: "m16-d4", symbol: "star", x: 3600, y: 316, width: 48, height: 140 },
          { id: "m16-d5", symbol: "paw", x: 3700, y: 316, width: 48, height: 140 },
        ],
        colorPlatforms: [
          { id: "m16-p4-1", color: "blue", x: 3180, y: 350, width: 120, height: 24 },
          { id: "m16-p4-2", color: "pink", x: 3260, y: 270, width: 100, height: 24 },
        ],
        crates: [{ id: "m16-c4", x: 2980, y: 456, minX: 2960, maxX: 3320 }],
      },
    ],
  },
  {
    id: "16-3", world: 16, screen: 3, route: { next: "17-1" },
    theme: "music-theater", width: 6500, start: { x: 80, y: 380 }, goalX: 6320,
    // Giro (combina): ondas que cambian de sentido sobre puentes al compás cada vez más rápidos.
    beats: { development: 650, twist: 3450, finale: 5000, twistKind: "combine" },
    platforms: [
      ...themedGround([[0, 820], [960, 700], [1800, 640], [2580, 760], [3480, 600], [4220, 580], [4940, 1560]], "music-ground"),
      themedLedge(420, 315, 190, "music-stage"), themedLedge(720, 225, 170, "music-stage"), themedLedge(1050, 320, 190, "music-stage"), themedLedge(1380, 230, 170, "music-stage"),
      themedLedge(1880, 320, 190, "music-stage"), themedLedge(2200, 235, 170, "music-stage"), themedLedge(2650, 315, 190, "music-stage"), themedLedge(3000, 230, 170, "music-stage"),
      themedLedge(3550, 320, 190, "music-stage"), themedLedge(3880, 235, 170, "music-stage"), themedLedge(4300, 320, 190, "music-stage"), themedLedge(4600, 235, 170, "music-stage"),
      themedLedge(5100, 315, 200, "music-stage"), themedLedge(5500, 225, 170, "music-stage"), themedLedge(5850, 315, 190, "music-stage"),
    ],
    deadlyWater: deadlyWaterPits([[0, 820], [960, 700], [1800, 640], [2580, 760], [3480, 600], [4220, 580], [4940, 1560]]),
    windZones: [iceWind("show-1", 300, 450, 1, 205), iceWind("show-2", 1000, 700, -1, 220), iceWind("show-3", 3450, 700, 1, 235), iceWind("show-4", 4200, 600, -1, 240), iceWind("show-5", 5000, 900, 1, 245)],
    beatPlatforms: [
      { id: "compas-3a", x: 830, y: 350, width: 120, height: 24, kind: "music-stage", interval: 1.8, delay: 0, activeDuration: 1.18 },
      { id: "compas-3b", x: 1670, y: 320, width: 120, height: 24, kind: "music-stage", interval: 1.8, delay: 0.6, activeDuration: 1.18 },
      { id: "compas-3c", x: 2450, y: 345, width: 120, height: 24, kind: "music-stage", interval: 1.8, delay: 1.2, activeDuration: 1.18 },
      { id: "compas-3d", x: 3350, y: 320, width: 120, height: 24, kind: "music-stage", interval: 1.6, delay: 0.3, activeDuration: 1.0 },
      { id: "compas-3e", x: 4090, y: 345, width: 120, height: 24, kind: "music-stage", interval: 1.6, delay: 0.9, activeDuration: 1.0 },
      { id: "compas-3f", x: 4810, y: 320, width: 120, height: 24, kind: "music-stage", interval: 1.6, delay: 0.5, activeDuration: 1.0 },
    ],
    enemies: [enemy("m16c-d1", "walking-drum", 480, 420, 260, 800, 68), enemy("m16c-n1", "note-bird", 1450, 145, 1000, 1640, 90), enemy("m16c-v1", "violin-mouse", 2300, 420, 1820, 2420, 74), enemy("m16c-d2", "walking-drum", 3700, 420, 3500, 4060, 78), enemy("m16c-n2", "note-bird", 5000, 140, 4300, 5200, 96), enemy("m16c-v2", "violin-mouse", 5600, 420, 4960, 6000, 80)],
    items: [apple("m16c1", 470, 265), apple("m16c2", 770, 175), apple("m16c3", 2250, 185), sticker("sticker-16-3", 3920, 185), apple("m16c4", 4640, 185), apple("m16c5", 5550, 175)],
    rewardBlocks: [reward("m16rc1", 1260, 300), reward("m16rc2", 4500, 300, "apple")], checkpoints: [1000, 1850, 2650, 3550, 4300, 5000], boss: "maestra-armonia",
  },
  {
    id: "17-1", world: 17, screen: 1,
    theme: "sky-dawn", width: 960, height: 3500, orientation: "vertical", start: { x: 110, y: 3352 }, goalX: 480, goalY: 175,
    // Subida: el ascensor de nubes y las nubes de rebote hacen falta en el giro y en el remate.
    beats: { development: 953, twist: 1747, finale: 2542, twistKind: "invert" },
    platforms: skyLiftLevelPlatforms(3500, 0, 2385, 1950),
    enemies: [
      enemy("c17a-p1", "puffling", 700, 2875, 640, 880, 48), enemy("c17a-p2", "puffling", 767, 2295, 640, 880, 52), enemy("c17a-p3", "puffling", 834, 1425, 640, 880, 56), enemy("c17a-p4", "puffling", 721, 990, 640, 880, 60),
    ],
    items: [apple("c17a1", 555, 2770), apple("c17a2", 555, 2190), sticker("sticker-17-1", 555, 1610), apple("c17a3", 230, 885)],
    rewardBlocks: [], checkpoints: [], verticalCheckpoints: [{ x: 559, y: 2530 }, { x: 224, y: 1515 }, { x: 359, y: 645 }],
    skyLifts: [{ id: "sky-lift-17-1", x: 40, bottomY: 2385, topY: 1950, width: 170, height: 30, speed: 92, waitDuration: 1.6,
      lever: { id: "sky-lever-17-1", x: 300, y: 2305, width: 68, height: 80 } }],
  },
  {
    id: "17-2", world: 17, screen: 2,
    theme: "sky-blue", width: 960, height: 3900, orientation: "vertical", start: { x: 110, y: 3752 }, goalX: 480, goalY: 175,
    // Subida: el ascensor de nubes y las nubes de rebote hacen falta en el giro y en el remate.
    beats: { development: 429, twist: 1967, finale: 2862, twistKind: "combine" },
    platforms: skyLiftLevelPlatforms(3900, 1, 2350, 1915),
    enemies: [
      enemy("c17b-p1", "puffling", 700, 2840, 640, 880, 54), enemy("c17b-p2", "puffling", 767, 2550, 640, 880, 58), enemy("c17b-p3", "puffling", 834, 1970, 640, 880, 62), enemy("c17b-p4", "puffling", 721, 1535, 640, 880, 66), enemy("c17b-p5", "puffling", 788, 665, 640, 880, 68),
    ],
    items: [apple("c17b1", 230, 3170), apple("c17b2", 230, 2590), sticker("sticker-17-2", 370, 2010), apple("c17b3", 230, 1430), apple("c17b4", 565, 705)],
    rewardBlocks: [], checkpoints: [], verticalCheckpoints: [{ x: 359, y: 2930 }, { x: 559, y: 1915 }, { x: 224, y: 900 }],
    skyLifts: [{ id: "sky-lift-17-2", x: 40, bottomY: 2350, topY: 1915, width: 170, height: 30, speed: 88, waitDuration: 1.8,
      lever: { id: "sky-lever-17-2", x: 300, y: 2270, width: 68, height: 80 } }],
  },
  {
    id: "17-3", world: 17, screen: 3, route: { finale: true },
    theme: "sky-stars", width: 960, height: 4300, orientation: "vertical", start: { x: 110, y: 4152 }, goalX: 480, goalY: 175,
    // Subida: el ascensor de nubes y las nubes de rebote hacen falta en el giro y en el remate.
    beats: { development: 477, twist: 2187, finale: 3182, twistKind: "presentation" },
    platforms: skyLiftLevelPlatforms(4300, 2, 2315, 1880),
    enemies: [
      enemy("c17c-p1", "puffling", 700, 3530, 640, 880, 58), enemy("c17c-p2", "puffling", 767, 2950, 640, 880, 62), enemy("c17c-p3", "puffling", 834, 2225, 640, 880, 66), enemy("c17c-p4", "puffling", 721, 1790, 640, 880, 70), enemy("c17c-p5", "puffling", 788, 1210, 640, 880, 74), enemy("c17c-p6", "puffling", 855, 920, 640, 880, 76),
    ],
    items: [apple("c17c1", 565, 3570), apple("c17c2", 565, 2990), sticker("sticker-17-3", 565, 2410), apple("c17c3", 565, 1830), apple("c17c4", 565, 1250)],
    rewardBlocks: [], checkpoints: [], verticalCheckpoints: [{ x: 549, y: 3330 }, { x: 359, y: 2315 }, { x: 559, y: 1300 }, { x: 359, y: 575 }],
    skyLifts: [{ id: "sky-lift-17-3", x: 40, bottomY: 2315, topY: 1880, width: 170, height: 30, speed: 84, waitDuration: 2,
      lever: { id: "sky-lever-17-3", x: 300, y: 2235, width: 68, height: 80 } }], boss: "aurora-celeste",
  },
  {
    id: "S-1",
    world: 7,
    screen: 1,
    theme: "secret-sky",
    width: 5900,
    start: { x: 80, y: 340 },
    goalX: 5700,
    platforms: [
      cloudFloor(0, 438, 520), cloudFloor(650, 390, 390), cloudFloor(1160, 325, 320),
      cloudFloor(1580, 420, 430), cloudFloor(2130, 345, 300), cloudFloor(2540, 260, 310),
      cloudFloor(2960, 410, 430), cloudFloor(3500, 330, 330), cloudFloor(3940, 245, 300),
      cloudFloor(4350, 405, 380), cloudFloor(4840, 315, 330), cloudFloor(5280, 420, 620),
      cloudFloor(330, 310, 170), cloudFloor(840, 235, 165), cloudFloor(1780, 255, 170),
      cloudFloor(3200, 235, 170), cloudFloor(4530, 220, 170), cloudFloor(5140, 180, 170),
    ],
    updrafts: [
      { id: "sky-lift1", x: 835, y: 120, width: 150, height: 270, strength: 1950, maxRiseSpeed: 140 },
      { id: "sky-lift2", x: 3180, y: 110, width: 170, height: 300, strength: 1950, maxRiseSpeed: 140 },
      { id: "sky-lift3", x: 5110, y: 90, width: 170, height: 225, strength: 1950, maxRiseSpeed: 140 },
    ],
    enemies: [
      enemy("ave-c1", "bird", 720, 220, 610, 1080, 70),
      enemy("uni-c1", "sky-unicorn", 1690, 378, 1610, 1940, 46),
      enemy("ave-c2", "bird", 2220, 165, 2060, 2500, 76),
      enemy("uni-c2", "sky-unicorn", 3010, 368, 2980, 3320, 50),
      enemy("ave-c3", "bird", 3630, 160, 3450, 3890, 80),
      enemy("uni-c3", "sky-unicorn", 4420, 363, 4380, 4680, 54),
      enemy("ave-c4", "bird", 4960, 145, 4770, 5260, 84),
      enemy("uni-c4", "sky-unicorn", 5380, 378, 5330, 5620, 58),
    ],
    items: [
      apple("cs-a1", 350, 260), apple("cs-a2", 900, 185),
      sticker("sticker-s-1", 1250, 275), apple("cs-a3", 1835, 205),
      apple("cs-a4", 2600, 210), sticker("sticker-s-2", 3255, 185),
      apple("cs-a5", 4030, 195), apple("cs-a6", 4585, 170),
      sticker("sticker-s-3", 5195, 130), apple("cs-a7", 5500, 370),
    ],
    rewardBlocks: [reward("cs-r1", 2240, 225, "apple"), reward("cs-r2", 4920, 195)],
    checkpoints: [680, 1600, 2980, 4370, 5300],
    boss: "rainbow-queen",
  },
];

export const levels: Level[] = datosPantallas.map(conTextosDePantalla);

export const getLevel = (id: string) => levels.find((level) => level.id === id) ?? levels[0];
