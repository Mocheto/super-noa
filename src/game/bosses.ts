import type { BossId } from "./types";
import { conTextos } from "../textos/index.ts";

export type BossChallengeId = "clean-sweep" | "no-apple" | "finish-rock" | "tie-then-win" | "finish-scissors" | "finish-paper" | "perfect-game";

type BossDatos = { assetPrefix: string; assetAtlas?: string; challenge: { id: BossChallengeId } };
export type BossDefinition = { name: string; assetPrefix: string; assetAtlas?: string; intro: string; challenge: { id: BossChallengeId; label: string } };

/** Guardianes tal como se declaran: sin textos. Nombre, presentación y reto salen del catálogo (`guardianes.<id>.nombre.rotulo`, `.presentacion.juntos`, `.reto.juntos`). */
const datosGuardianes: Record<BossId, BossDatos> = {
  "shark-captain": { assetPrefix: "./assets/sprites/boss-don-aleta", challenge: { id: "finish-paper" } },
  "bramble-king": { assetPrefix: "./assets/sprites/boss-rey-zarzal", challenge: { id: "clean-sweep" } },
  "mist-countess": { assetPrefix: "./assets/sprites/boss-condesa-niebla", challenge: { id: "no-apple" } },
  "great-wolf": { assetPrefix: "./assets/sprites/boss-gran-lobo", challenge: { id: "finish-rock" } },
  "great-boar": { assetPrefix: "./assets/sprites/boss-gran-jabali", challenge: { id: "perfect-game" } },
  "sky-captain": { assetPrefix: "./assets/sprites/boss-capitan-celeste", challenge: { id: "perfect-game" } },
  "vampire-count": { assetPrefix: "./assets/sprites/boss-conde-vampiro", challenge: { id: "clean-sweep" } },
  "rainbow-queen": { assetPrefix: "./assets/sprites/boss-reina-arcoiris-v2", challenge: { id: "perfect-game" } },
  "triceratops-queen": { assetPrefix: "./assets/sprites/boss-reina-tricera", challenge: { id: "perfect-game" } },
  "ruby-dragon": { assetPrefix: "", assetAtlas: "./assets/atlases/volcano-characters-v1.webp", challenge: { id: "finish-rock" } },
  "queen-bee": { assetPrefix: "", assetAtlas: "./assets/atlases/giant-valley-characters-v1.webp", challenge: { id: "perfect-game" } },
  "polar-bear": { assetPrefix: "", assetAtlas: "./assets/atlases/ice-mountain-characters-v1.webp", challenge: { id: "clean-sweep" } },
  "santa-claus": { assetPrefix: "", assetAtlas: "./assets/sprites/boss-papa-noel-sheet-v2.webp", challenge: { id: "clean-sweep" } },
  "siroco": { assetPrefix: "", assetAtlas: "./assets/sprites/boss-siroco-sheet-v1.webp", challenge: { id: "clean-sweep" } },
  "don-silbato": { assetPrefix: "", assetAtlas: "./assets/sprites/boss-don-silbato-sheet-v1.webp", challenge: { id: "clean-sweep" } },
  "maestra-armonia": { assetPrefix: "", assetAtlas: "./assets/atlases/music-characters-v1.webp", challenge: { id: "perfect-game" } },
  "aurora-celeste": { assetPrefix: "", assetAtlas: "./assets/atlases/sky-kingdom-characters-v1.webp", challenge: { id: "perfect-game" } },
};

export const bossCatalog = Object.fromEntries(Object.entries(datosGuardianes).map(([id, guardian]) => [id, conTextos({ ...guardian, challenge: conTextos({ ...guardian.challenge }, { label: `guardianes.${id}.reto.juntos` }) }, {
  name: `guardianes.${id}.nombre.rotulo`, intro: `guardianes.${id}.presentacion.juntos`,
})])) as Record<BossId, BossDefinition>;
