export type Theme = "orchard-day" | "orchard-sunset" | "forest-dusk" | "forest-night" | "crystal-cave" | "wolf-pines" | "wolf-moon" | "boar-canopy" | "boar-storm" | "sky-pirates" | "sky-storm" | "haunted-castle" | "secret-sky" | "water-lagoon" | "dinosaur-island" | "dragon-volcano" | "giant-valley" | "ice-mountain" | "winter-snow" | "toy-factory" | "gift-warehouse" | "desert-dunes" | "desert-oasis" | "desert-ruins" | "train-station" | "train-valley" | "train-engine" | "music-garden" | "music-bells" | "music-theater" | "sky-dawn" | "sky-blue" | "sky-stars";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Platform = Rect & {
  beltSpeed?: number;
  bounceSpeed?: number;
  bounceDrift?: number;
  /** Roca que asoma: arrecife que sale del agua y es sólido de arriba abajo, sin franja de algas por encima. */
  asoma?: boolean;
  kind?: "ground" | "branch" | "stone" | "spring" | "mist" | "canopy" | "ship" | "air-plank" | "cloud-floor" | "sky-cloud" | "sky-bounce" | "sky-lift-station" | "sky-wall" | "cave-ground" | "cave-ledge" | "cave-wall" | "castle-ground" | "castle-ledge" | "castle-wall" | "sea-ground" | "sea-ledge" | "sea-wall" | "dino-ground" | "dino-ledge" | "dino-wall" | "volcano-ground" | "volcano-ledge" | "volcano-wall" | "garden-ground" | "garden-ledge" | "dew" | "ice-ground" | "ice-ledge" | "ice-wall" | "factory-ground" | "factory-ledge" | "factory-wall" | "warehouse-ground" | "warehouse-ledge" | "warehouse-wall" | "gift-spring" | "snow-ground" | "snow-ledge" | "desert-ground" | "desert-ledge" | "train-ground" | "train-roof" | "music-ground" | "music-stage" | "puzzle-block" | "puzzle-color";
};

/** Símbolo que comparten un activador y la puerta que abre. */
export type PuzzleSymbol = "paw" | "star" | "moon";
export type PuzzleColor = "pink" | "blue";
/** Activador de una sala: el botón de huella se queda pulsado, la placa abre mientras algo pesa encima y el
 * botón de color hace sólidas las plataformas de su color. `x`, `y` y `width` marcan dónde se pisa (y es el
 * suelo bajo el activador). */
export type PuzzleTrigger = { id: string; kind: "paw" | "plate" | "color"; x: number; y: number; width: number; opens?: string; color?: PuzzleColor };
/** Puerta de una sala: columna sólida desde `y` hasta el suelo mientras está cerrada. */
export type PuzzleDoor = Rect & { id: string; symbol: PuzzleSymbol };
export type ColorPlatform = Rect & { id: string; color: PuzzleColor };
/** Cajón que se empuja por el suelo `y` entre `minX` y `maxX` (borde izquierdo). Con `slides` (hielo), un
 * empujón lo lanza y resbala hasta un tope, otro cajón o Noa. */
export type PuzzleCrate = { id: string; x: number; y: number; minX: number; maxX: number; slides?: boolean };
/** Una sala de cámara fija de 960 px. `exitDoor` es la puerta de salida hacia la sala siguiente. */
export type PuzzleRoom = {
  x: number;
  entry: { x: number; y: number };
  exitDoor: string;
  triggers: PuzzleTrigger[];
  doors: PuzzleDoor[];
  colorPlatforms?: ColorPlatform[];
  startColor?: PuzzleColor;
  /** Si existe, el color activo cambia solo cada `colorBeat` segundos (al compás), empezando por `startColor`. */
  colorBeat?: number;
  crates?: PuzzleCrate[];
};

export type BeatPlatform = Platform & { id: string; interval: number; delay: number; activeDuration: number };

export type SleepCycle = {
  interval: number;
  delay: number;
  sleepDuration: number;
  warningDuration: number;
};

export type Enemy = Rect & {
  id: string;
  kind: "slime" | "beetle" | "cloud" | "wolf" | "boar" | "bird" | "pirate" | "parrot" | "bat" | "sky-unicorn" | "skeleton" | "zombie" | "ghost" | "fish" | "urchin" | "baby-t-rex" | "pterodactyl" | "baby-dragon" | "fire-salamander" | "flying-dragon" | "ant" | "snail" | "bee" | "penguin" | "snow-fox" | "snowy-owl" | "toy-elf" | "toy-robot" | "toy-bird" | "gift-box" | "gift-gnome" | "star-lantern" | "snow-scout" | "toy-reindeer" | "winter-robin" | "desert-scarab" | "fennec" | "tumbleweed" | "rolling-suitcase" | "conductor-pigeon" | "clockwork-mouse" | "walking-drum" | "note-bird" | "violin-mouse" | "puffling";
  minX: number;
  maxX: number;
  speed: number;
  sleepCycle?: SleepCycle;
};

export type LevelItem = {
  id: string;
  kind: "apple" | "cat" | "sticker";
  x: number;
  y: number;
};

export type RewardBlock = {
  id: string;
  x: number;
  y: number;
  reward: "apple" | "cat" | "secret-vine";
};

export type Cannon = {
  id: string;
  x: number;
  y: number;
  direction: -1 | 1;
  interval: number;
};

export type WaterJumper = {
  id: string;
  x: number;
  surfaceY: number;
  width: number;
  height: number;
  interval: number;
  delay: number;
  jumpHeight: number;
};

export type LavaJet = {
  id: string;
  x: number;
  baseY: number;
  width: number;
  height: number;
  interval: number;
  delay: number;
};

export type WindZone = Rect & {
  id: string;
  direction: -1 | 1;
  strength: number;
};

export type BloomBridge = Rect & {
  id: string;
  interval: number;
  delay: number;
  openDuration: number;
  warningDuration: number;
};

export type Updraft = Rect & {
  id: string;
  strength: number;
  maxRiseSpeed: number;
};

export type SkyLift = {
  id: string;
  x: number;
  bottomY: number;
  topY: number;
  width: number;
  height: number;
  speed: number;
  waitDuration: number;
  lever: Rect & { id: string };
};

export type ChainGuardian = {
  id: string;
  anchorX: number;
  groundY: number;
  leashLength: number;
  width: number;
  height: number;
  patrolSpeed: number;
  lungeSpeed: number;
  patrolDuration: number;
  warningDuration: number;
  lungeDuration: number;
  recoveryDuration: number;
  delay: number;
};

export type BossId = "bramble-king" | "mist-countess" | "great-wolf" | "great-boar" | "sky-captain" | "vampire-count" | "rainbow-queen" | "shark-captain" | "triceratops-queen" | "ruby-dragon" | "queen-bee" | "polar-bear" | "santa-claus" | "siroco" | "don-silbato" | "maestra-armonia" | "aurora-celeste";

export type ShopMatchCount = 0 | 1 | 2 | 3;
export type SecretShop = Rect & { id: string };
export type DetourId = "fireflies" | "mine" | "mill" | "library" | "garden";
export type DetourEntrance = Rect & { id: DetourId };
export type DetourMechanism = Rect & {
  id: string;
  kind: "wheel" | "cart" | "book" | "leaf" | "vine";
  travel: number;
  period: number;
  phase: number;
};

/** Cómo cambia la pantalla en su giro: combina la mecánica con otra ya vista, la invierte, presenta algo por
 * sorpresa (siluetas, gravedad baja, cámara alejada) o cambia de forma. */
export type TwistKind = "combine" | "invert" | "presentation" | "shape";

/** Gatito perdido de una exploración: `cat` es el gatito de mundo (1–17) cuyo dibujo se usa y `beat`, su tramo. */
export type LostKitten = { id: string; x: number; y: number; cat: number; beat: "presentation" | "development" | "twist" };

/** Animales que pueden hacer de animal travieso en una persecución amable. */
export type ChaseRunner = "beetle" | "parrot" | "bee" | "clockwork-mouse";
/** Parada del animal travieso: espera en (x, y) — y es la superficie bajo sus patas —, llega saltando en arco si
 * `jump`, dice `talk` y pertenece al tramo `beat`. */
export type ChaseStop = { x: number; y: number; jump?: boolean; talk: string; beat: "presentation" | "development" | "twist" | "finale" };
/** Persecución amable: el animal se lleva el ovillo, corre más que Noa y la espera en cada parada. La última
 * parada es el rincón sin salida donde se le pilla; sustituye a la bandera. */
export type Chase = { runner: ChaseRunner; carries: "yarn"; speed?: number; waitRadius?: { x: number; y: number }; stops: ChaseStop[] };

/** Cuatro tramos de una pantalla. La presentación empieza en el inicio; aquí se marca dónde empiezan el
 * desarrollo, el giro y el remate, medidos como avance desde el inicio (x en horizontal, altura subida en
 * vertical). */
export type LevelBeats = {
  development: number;
  twist: number;
  finale: number;
  twistKind: TwistKind;
};

export type Level = {
  id: string;
  world: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17;
  screen: 1 | 2 | 3;
  title: string;
  subtitle: string;
  theme: Theme;
  width: number;
  height?: number;
  /** `explore`: mundo abierto en los dos ejes (formato exploración), con `width` y `height`. */
  orientation?: "horizontal" | "vertical" | "explore";
  start: { x: number; y: number };
  goalX: number;
  goalY?: number;
  platforms: Platform[];
  spikePits?: Rect[];
  deadlyWater?: Rect[];
  waterZones?: Rect[];
  waterEntrance?: Rect;
  enemies: Enemy[];
  items: LevelItem[];
  rewardBlocks: RewardBlock[];
  cannons?: Cannon[];
  waterJumpers?: WaterJumper[];
  lavaJets?: LavaJet[];
  windZones?: WindZone[];
  beatPlatforms?: BeatPlatform[];
  bloomBridges?: BloomBridge[];
  updrafts?: Updraft[];
  sandGeysers?: Updraft[];
  skyLifts?: SkyLift[];
  chainGuardians?: ChainGuardian[];
  secretShop?: SecretShop;
  detourEntrance?: DetourEntrance;
  detour?: DetourId;
  mechanisms?: DetourMechanism[];
  detourSwitches?: Array<Rect & { id: "bell" | "books" | "water" }>;
  checkpoints: number[];
  verticalCheckpoints?: Array<{ x: number; y: number }>;
  beats?: LevelBeats;
  /** Pantalla de sala-rompecabezas: cadena de salas de 960 px, una por tramo. */
  puzzleRooms?: PuzzleRoom[];
  /** Pantalla de persecución amable. */
  chase?: Chase;
  /** Paseo de los amigos de este mundo: pantalla de descanso sin peligros, fuera de la campaña. */
  restStop?: number;
  /** Exploración: puerta de los gatitos (la meta), los tres gatitos perdidos y el atajo del remate, que se abre
   * al tenerlos a todos. */
  exploreGate?: Rect;
  lostKittens?: LostKitten[];
  exploreShortcut?: Platform[];
  boss?: BossId;
  route?: {
    next?: string;
    required?: string;
    waterExit?: string;
    secretExit?: string;
    finale?: boolean;
    nextLabel?: string;
  };
};

export type Power = "normal" | "apple" | "cat";

export type GameSnapshot = {
  apples: number;
  stickers: string[];
  power: Power;
  checkpoint: number;
  paused: boolean;
  starSeconds?: number;
  /** Exploración: gatitos perdidos encontrados de los que hay en la pantalla. */
  kittens?: { found: number; total: number };
};
