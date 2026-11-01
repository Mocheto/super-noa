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
  kind?: "ground" | "branch" | "stone" | "spring" | "mist" | "canopy" | "ship" | "air-plank" | "cloud-floor" | "sky-cloud" | "sky-bounce" | "sky-lift-station" | "sky-wall" | "cave-ground" | "cave-ledge" | "cave-wall" | "castle-ground" | "castle-ledge" | "castle-wall" | "sea-ground" | "sea-ledge" | "sea-wall" | "dino-ground" | "dino-ledge" | "dino-wall" | "volcano-ground" | "volcano-ledge" | "volcano-wall" | "garden-ground" | "garden-ledge" | "dew" | "ice-ground" | "ice-ledge" | "ice-wall" | "factory-ground" | "factory-ledge" | "factory-wall" | "warehouse-ground" | "warehouse-ledge" | "warehouse-wall" | "gift-spring" | "snow-ground" | "snow-ledge" | "desert-ground" | "desert-ledge" | "train-ground" | "train-roof" | "music-ground" | "music-stage";
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

export type Level = {
  id: string;
  world: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17;
  screen: 1 | 2 | 3;
  title: string;
  subtitle: string;
  theme: Theme;
  width: number;
  height?: number;
  orientation?: "horizontal" | "vertical";
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
};
