import { bossCatalog } from "./bosses.ts";
import type { Progress } from "./progress.ts";
import { campaignLevels } from "./routes.ts";
import { stickerCatalog } from "./stickers.ts";
import { t } from "../textos/index.ts";
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
    { id: "complete", kind: "complete", label: t("mapa.objetivos.llegar.rotulo"), completed: stats?.completed === true,
      hint: t(level.chainGuardians?.length ? "mapa.objetivos.llegarPerrito.juntos" : "mapa.objetivos.llegar.juntos") },
    ...level.items.filter((item) => item.kind === "sticker").map((item, index, items): LevelObjective => {
      const sticker = stickerCatalog.find((entry) => entry.id === item.id);
      return {
        id: item.id, kind: "sticker", label: items.length > 1 ? t("mapa.objetivos.pegatinaNumero.rotulo", { n: index + 1 }) : t("mapa.objetivos.pegatina.rotulo"),
        completed: progress.stickers.includes(item.id),
        hint: sticker?.hint ?? t("mapa.objetivos.pegatina.juntos"),
      };
    }),
    { id: "flawless", kind: "flawless", label: t("mapa.objetivos.sinCaer.rotulo"), completed: stats?.completed === true && stats.flawless === true, hint: t("mapa.objetivos.sinCaer.juntos") },
    ...(level.boss ? [{
      id: level.boss, kind: "boss" as const, label: t("mapa.objetivos.reto.rotulo"),
      completed: progress.bossChallenges[level.boss] === true,
      hint: bossCatalog[level.boss].challenge.label,
    }] : []),
  ] : [];
  const completedCount = objectives.filter((objective) => objective.completed).length;
  return { available, objectives, completedCount, pendingCount: objectives.length - completedCount, totalCount: objectives.length };
}
