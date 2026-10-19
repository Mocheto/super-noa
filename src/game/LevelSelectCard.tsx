import { useEffect, useRef, type KeyboardEvent } from "react";
import { GameAssetIcon } from "./GameAssetIcon";
import { PixelIcon } from "./PixelIcon";
import { getLevelObjectives } from "./levelObjectives";
import type { Progress } from "./progress";
import type { Level } from "./types";

type LevelSelectCardProps = {
  level: Level;
  index: number;
  unlocked: boolean;
  suggested: boolean;
  progress: Progress;
  details: { pinned: boolean } | null;
  onBeginLevel: (index: number) => void;
  onOpenDetails: (pinned: boolean) => void;
  onCloseDetails: () => void;
};

export function LevelSelectCard({ level, index, unlocked, suggested, progress, details, onBeginLevel, onOpenDetails, onCloseDetails }: LevelSelectCardProps) {
  const entryRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stats = progress.levelStats[level.id];
  const objectives = getLevelObjectives(level, progress);
  const available = unlocked && objectives.available;
  const stickers = objectives.objectives.filter((objective) => objective.kind === "sticker");
  const stickerEarned = stickers.length > 0 && stickers.every((objective) => objective.completed);
  const medals = [stats?.completed === true, stickerEarned, Boolean(stats?.completed && stats.flawless)];
  const nextHint = objectives.objectives.find((objective) => objective.kind === "sticker" && !objective.completed)
    ?? objectives.objectives.find((objective) => !objective.completed);
  const expanded = details !== null;
  const panelId = `level-objectives-${level.id}`;

  const cancelHover = () => {
    if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  };

  const dismissOnEscape = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Escape" || !expanded) return;
    event.preventDefault();
    event.stopPropagation();
    cancelHover();
    onCloseDetails();
  };

  useEffect(() => () => {
    if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const closeOutside = (event: MouseEvent) => {
      if (event.target instanceof Node && !entryRef.current?.contains(event.target)) onCloseDetails();
    };
    document.addEventListener("click", closeOutside);
    return () => document.removeEventListener("click", closeOutside);
  }, [expanded, onCloseDetails]);

  return <div className="level-entry" ref={entryRef}
    onPointerEnter={(event) => {
      if (!available || expanded || event.pointerType !== "mouse") return;
      cancelHover();
      hoverTimer.current = setTimeout(() => {
        hoverTimer.current = null;
        onOpenDetails(false);
      }, 900);
    }}
    onPointerLeave={() => {
      cancelHover();
      if (!details?.pinned) onCloseDetails();
    }}>
    <div className={`level-card-row ${stats?.completed ? "is-complete" : ""}`}>
      <button className={`level-card ${available ? "has-objectives" : ""} ${stats?.completed ? "is-complete" : ""}`} type="button" disabled={!unlocked}
        data-gamepad-default={suggested || undefined} onKeyDown={dismissOnEscape} onClick={() => onBeginLevel(index)}>
        <span className="level-id">{unlocked ? level.id : <PixelIcon kind="lock" />}</span>
        <strong>{!unlocked && level.world === 7 ? "Una sorpresa te espera" : level.title}</strong>
        <small>{stats?.completed ? <span>✓ Completada · <GameAssetIcon kind="apple" /> {stats.bestApples}</span>
          : unlocked ? "Lista para jugar" : level.world === 8 && !progress.waterUnlocked ? "Busca la poza azul en 3-3" : "Completa la anterior"}</small>
      </button>
      {available && <button className="level-objectives-trigger" type="button"
        aria-label={`${expanded ? "Ocultar" : "Ver"} objetivos y pista de ${level.title}: ${medals.filter(Boolean).length} de 3 medallas`}
        aria-expanded={expanded} aria-controls={panelId} onKeyDown={dismissOnEscape}
        onClick={() => {
          cancelHover();
          if (details?.pinned) onCloseDetails();
          else onOpenDetails(true);
        }}>
        <span className="level-medals" aria-hidden="true">{medals.map((earned, medal) => <i className={earned ? "is-earned" : ""} key={medal}>★</i>)}</span>
      </button>}
    </div>
    {available && <div className={`level-objectives ${expanded && !details.pinned ? "is-preview" : ""}`} id={panelId} hidden={!expanded}>
      <p className="level-objectives-status">{objectives.pendingCount === 1 ? "Falta 1" : objectives.pendingCount ? `Faltan ${objectives.pendingCount}` : "¡Todo conseguido!"}</p>
      <ul aria-label={`Objetivos de ${level.title}`}>
        {objectives.objectives.map((objective) => <li className={objective.completed ? "is-complete" : "is-pending"} key={objective.id}
          aria-label={`${objective.label}: ${objective.completed ? "conseguido" : "pendiente"}`}>
          <span aria-hidden="true">{objective.completed ? "✓" : "○"}</span> {objective.label}
        </li>)}
      </ul>
      {nextHint && <p className="level-objective-hint">{nextHint.hint}</p>}
    </div>}
  </div>;
}
