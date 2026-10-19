import { bossCatalog } from "./bosses.ts";
import type { Progress } from "./progress.ts";
import { campaignLevels } from "./routes.ts";
import { stickerCatalog } from "./stickers.ts";
import type { Level } from "./types.ts";

export type LevelObjective = {
  id: string;
  kind: "complete" | "sticker" | "flawless" | "boss";
  label: string;
  completed: boolean;
  hint: string;
};

export type LevelObjectives = {
  available: boolean;
  objectives: LevelObjective[];
  completedCount: number;
  pendingCount: number;
  totalCount: number;
};

export function getLevelObjectives(level: Level, progress: Progress): LevelObjectives {
  const campaignIndex = campaignLevels.findIndex((candidate) => candidate.id === level.id);
  const available = level.world === 7 ? progress.secretUnlocked
    : level.world === 8 ? progress.waterUnlocked && (!level.route?.required || progress.levelStats[level.route.required]?.completed === true)
    : campaignIndex >= 0 && campaignIndex <= progress.unlocked;
  const stats = progress.levelStats[level.id];
  const objectives: LevelObjective[] = available ? [
    { id: "complete", kind: "complete", label: "Llegar al final", completed: stats?.completed === true, hint: "Sigue el camino hasta la meta." },
    ...level.items.filter((item) => item.kind === "sticker").map((item, index, items): LevelObjective => {
      const sticker = stickerCatalog.find((entry) => entry.id === item.id);
      return {
        id: item.id, kind: "sticker", label: items.length > 1 ? `Pegatina ${index + 1}` : "Pegatina",
        completed: progress.stickers.includes(item.id),
        hint: sticker?.hint ?? "Explora las plataformas de esta pantalla.",
      };
    }),
    { id: "flawless", kind: "flawless", label: "Sin perder vidas", completed: stats?.completed === true && stats.flawless === true, hint: "Llega a la meta sin perder ninguna vida. Puedes intentarlo otra vez." },
    ...(level.boss ? [{
      id: level.boss, kind: "boss" as const, label: "Reto del guardián",
      completed: progress.bossChallenges[level.boss] === true,
      hint: bossCatalog[level.boss].challenge.label,
    }] : []),
  ] : [];
  const completedCount = objectives.filter((objective) => objective.completed).length;
  return { available, objectives, completedCount, pendingCount: objectives.length - completedCount, totalCount: objectives.length };
}
