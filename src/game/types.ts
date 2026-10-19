export type Theme = "orchard-day" | "orchard-sunset" | "forest-dusk" | "forest-night" | "crystal-cave" | "wolf-pines" | "wolf-moon" | "boar-canopy" | "boar-storm" | "sky-pirates" | "sky-storm" | "haunted-castle" | "secret-sky" | "water-lagoon" | "dinosaur-island" | "dragon-volcano" | "giant-valley" | "ice-mountain";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Platform = Rect & {
  kind?: "ground" | "branch" | "stone" | "spring" | "mist" | "canopy" | "ship" | "air-plank" | "cloud-floor" | "cave-ground" | "cave-ledge" | "cave-wall" | "castle-ground" | "castle-ledge" | "castle-wall" | "sea-ground" | "sea-ledge" | "sea-wall" | "dino-ground" | "dino-ledge" | "dino-wall" | "volcano-ground" | "volcano-ledge" | "volcano-wall" | "garden-ground" | "garden-ledge" | "dew" | "ice-ground" | "ice-ledge" | "ice-wall";
};

export type Enemy = Rect & {
  id: string;
  kind: "slime" | "beetle" | "cloud" | "wolf" | "boar" | "bird" | "pirate" | "parrot" | "bat" | "sky-unicorn" | "skeleton" | "zombie" | "ghost" | "fish" | "urchin" | "baby-t-rex" | "pterodactyl" | "baby-dragon" | "fire-salamander" | "ant" | "snail" | "bee" | "penguin" | "snow-fox" | "snowy-owl";
  minX: number;
  maxX: number;
  speed: number;
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

export type BossId = "bramble-king" | "mist-countess" | "great-wolf" | "great-boar" | "sky-captain" | "vampire-count" | "rainbow-queen" | "shark-captain" | "triceratops-queen" | "ruby-dragon" | "queen-bee" | "polar-bear";

export type Level = {
  id: string;
  world: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  screen: 1 | 2 | 3;
  title: string;
  subtitle: string;
  theme: Theme;
  width: number;
  start: { x: number; y: number };
  goalX: number;
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
  checkpoints: number[];
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
};
