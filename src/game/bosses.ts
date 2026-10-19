import type { BossId } from "./types";

export type BossChallengeId = "clean-sweep" | "no-apple" | "finish-rock" | "tie-then-win" | "finish-scissors" | "finish-paper";

export type BossDefinition = { name: string; assetPrefix: string; assetAtlas?: string; intro: string; challenge: { id: BossChallengeId; label: string } };

export const bossCatalog: Record<BossId, BossDefinition> = {
  "shark-captain": { name: "Don Aleta", assetPrefix: "./assets/sprites/boss-don-aleta", intro: "El guardián del mar quiere jugar contigo antes de abrir su palacio.", challenge: { id: "finish-paper", label: "Termina con papel para conseguir su marco de conchas." } },
  "bramble-king": { name: "Rey Zarzal", assetPrefix: "./assets/sprites/boss-rey-zarzal", intro: "El guardián de las raíces te reta a un duelo.", challenge: { id: "clean-sweep", label: "Gana 2–0 para conseguir su marco de raíces." } },
  "mist-countess": { name: "Condesa Niebla", assetPrefix: "./assets/sprites/boss-condesa-niebla", intro: "La guardiana de las grutas quiere probar tu ingenio.", challenge: { id: "no-apple", label: "Gana sin gastar una manzana para conseguir su marco de niebla." } },
  "great-wolf": { name: "Gran Lobo", assetPrefix: "./assets/sprites/boss-gran-lobo", intro: "El rey de las huellas te espera para el último duelo.", challenge: { id: "finish-rock", label: "Termina con piedra para conseguir su marco de luna." } },
  "great-boar": { name: "Gran Jabalí", assetPrefix: "./assets/sprites/boss-gran-jabali", intro: "El guardián de las bellotas protege las copas del bosque.", challenge: { id: "tie-then-win", label: "Haz un empate y gana para conseguir su marco de bellotas." } },
  "sky-captain": { name: "Capitán Celeste", assetPrefix: "./assets/sprites/boss-capitan-celeste", intro: "El capitán de la flota te reta por el tesoro de las nubes.", challenge: { id: "finish-scissors", label: "Termina con tijera para conseguir su marco de nubes." } },
  "vampire-count": { name: "Conde Vampiro", assetPrefix: "./assets/sprites/boss-conde-vampiro", intro: "El conde del castillo te reta a un duelo de ingenio.", challenge: { id: "clean-sweep", label: "Gana 2–0 para conseguir su marco lunar." } },
  "rainbow-queen": { name: "Reina Arcoíris", assetPrefix: "./assets/sprites/boss-reina-arcoiris-v2", intro: "La guardiana del cielo quiere comprobar tu magia.", challenge: { id: "finish-paper", label: "Termina con papel para conseguir su marco arcoíris." } },
  "triceratops-queen": { name: "Reina Tricera", assetPrefix: "./assets/sprites/boss-reina-tricera", intro: "La guardiana de la isla quiere jugar antes de enseñarte su nido de flores.", challenge: { id: "tie-then-win", label: "Haz un empate y gana para conseguir su marco tropical." } },
  "ruby-dragon": { name: "Dragona Rubí", assetPrefix: "", assetAtlas: "./assets/atlases/volcano-characters-v1.png", intro: "La guardiana del volcán quiere comprobar tu valor antes de calmar la lava.", challenge: { id: "finish-rock", label: "Termina con piedra para conseguir su marco de rubíes." } },
  "queen-bee": { name: "Reina Melisa", assetPrefix: "", assetAtlas: "./assets/atlases/giant-valley-characters-v1.png", intro: "La guardiana de las flores te invita a un duelo lleno de zumbidos.", challenge: { id: "finish-paper", label: "Termina con papel para conseguir su marco de flores." } },
  "polar-bear": { name: "Osa Boreal", assetPrefix: "", assetAtlas: "./assets/atlases/ice-mountain-characters-v1.png", intro: "La guardiana de la cima quiere jugar bajo la aurora.", challenge: { id: "clean-sweep", label: "Gana 2–0 para conseguir su marco de copos." } },
};
