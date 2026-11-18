import { useEffect, useRef, type KeyboardEvent } from "react";
import { PixelIcon } from "./PixelIcon";
import { getLevelObjectives } from "./levelObjectives";
import type { Progress } from "./progress";
import { getSecretShopBadge } from "./secretShopProgress";
import type { Level } from "./types";
import { puntos, sinPictogramas, t, tClave } from "../textos";
import { Pictograma, Pictogramas, Texto } from "../textos/Texto";

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
  const shop = available ? getSecretShopBadge(level, progress) : null;
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
    <div className={`level-card-row ${stats?.completed ? "is-complete" : ""} ${unlocked ? "" : "is-locked"}`}>
      <span className="level-id">{unlocked ? level.id : <PixelIcon kind="lock" />}
        {shop && <span className={`shop-visit-badge level-shop-badge is-${shop.state}`} style={{ backgroundImage: "url('./assets/sprites/secret-shop-door-v1.png')" }} role="img" aria-label={shop.label} title={shop.label} />}
      </span>
      <span className="tarjeta-nombre">
        <span className="texto-noa">{!unlocked && level.world === 7 ? <Texto clave="mapa.tarjeta.sorpresa.rotulo" /> : level.title}</span>
        {unlocked ? <span className="juntos tarjeta-largo">{tClave(`pantallas.${level.id}.titulo.juntos`)}</span>
          : <span className="texto-noa pequeno"><Texto clave={level.world === 8 && !progress.waterUnlocked ? "mapa.tarjeta.pozaAzul.rotulo" : "mapa.tarjeta.cerrada.rotulo"} /></span>}
      </span>
      {available && <button className="level-objectives-trigger" type="button"
        aria-label={t(expanded ? "mapa.tarjeta.ocultar.oculto" : "mapa.tarjeta.ver.oculto", { titulo: level.title, n: medals.filter(Boolean).length })}
        aria-expanded={expanded} aria-controls={panelId} onKeyDown={dismissOnEscape}
        onClick={() => {
          cancelHover();
          if (details?.pinned) onCloseDetails();
          else onOpenDetails(true);
        }}>
        <span className="level-medals" aria-hidden="true">{(["meta", "pegatina", "vidas"] as const).map((dibujo, medal) => <i className={medals[medal] ? "is-earned" : ""} key={medal}><Pictograma nombre={dibujo} /></i>)}</span>
      </button>}
      <button className={`level-card boton boton-seguir ${available ? "has-objectives" : ""} ${stats?.completed ? "is-complete" : ""}`} type="button" disabled={!unlocked}
        aria-label={t(unlocked ? "mapa.tarjeta.jugarPantalla.oculto" : "mapa.tarjeta.cerradaPantalla.oculto", { titulo: level.title })}
        data-gamepad-default={suggested || undefined} onKeyDown={dismissOnEscape} onClick={() => onBeginLevel(index)}>
        <Pictograma nombre={unlocked ? "jugar" : "cerrado"} />
      </button>
    </div>
    {available && <div className={`level-objectives ${expanded && !details.pinned ? "is-preview" : ""}`} id={panelId} hidden={!expanded}>
      <p className="level-objectives-status">{objectives.pendingCount ? <span aria-label={t("mapa.tarjeta.faltan.oculto", { n: objectives.pendingCount })}><Texto clave="mapa.tarjeta.faltan.rotulo" variables={{ puntos: puntos(objectives.completedCount, objectives.totalCount) }} /></span> : <Texto clave="mapa.tarjeta.todo.rotulo" />}</p>
      <ul aria-label={t("mapa.tarjeta.objetivos.oculto", { titulo: level.title })}>
        {objectives.objectives.map((objective) => <li className={objective.completed ? "is-complete" : "is-pending"} key={objective.id}
          aria-label={t(objective.completed ? "mapa.tarjeta.conseguido.oculto" : "mapa.tarjeta.pendiente.oculto", { objetivo: sinPictogramas(objective.label) })}>
          <span aria-hidden="true">{objective.completed ? "✓" : "○"}</span> <Pictogramas texto={objective.label} />
        </li>)}
      </ul>
      {nextHint && <p className="level-objective-hint">{nextHint.hint}</p>}
      {shop && <p className="level-shop-hint">{shop.label}. {t("mapa.tarjeta.tienda.juntos")}</p>}
    </div>}
  </div>;
}
