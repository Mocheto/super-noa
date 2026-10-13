import { useCallback, useEffect, useRef, useState } from "react";
import { GameAssetIcon } from "./GameAssetIcon";
import { PixelIcon } from "./PixelIcon";
import { levels } from "./levels";
import { campaignLevels } from "./routes";
import type { Progress } from "./progress";
import { mapRoutes, mapRouteState, worldArtwork, worldAvailable, worldCatalog, type WorldId } from "./worldMapData";

export type WorldSummary = {
  complete: number; total: number; stickers: number; stickerTotal: number;
  flawless: number; bossFriend: boolean; remembered: boolean;
};

type WorldMapProps = {
  progress: Progress;
  summaries: Record<number, WorldSummary>;
  isLevelUnlocked: (index: number) => boolean;
  onBeginLevel: (index: number) => void;
};

export function WorldMap({ progress, summaries, isLevelUnlocked, onBeginLevel }: WorldMapProps) {
  const [selectedWorld, setSelectedWorld] = useState<WorldId | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const currentWorld = campaignLevels[progress.unlocked]?.world ?? 1;
  const selected = worldCatalog.find((world) => world.id === selectedWorld);

  const closeWorld = useCallback(() => {
    setSelectedWorld(null);
    requestAnimationFrame(() => openerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (selectedWorld === null) return;
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>("[data-gamepad-default]") ?? panel?.querySelector<HTMLElement>("[data-gamepad-back]"))?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeWorld(); }
      if (event.key !== "Tab" || !panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>("button:not(:disabled)"));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeWorld, selectedWorld]);

  const worldLevels = selected ? levels.map((level, index) => ({ level, index })).filter(({ level }) => level.world === selected.id) : [];
  const suggestedLevel = worldLevels.find(({ level, index }) => isLevelUnlocked(index) && !progress.levelStats[level.id]?.completed)?.index
    ?? worldLevels.find(({ index }) => isLevelUnlocked(index))?.index;

  return (
    <>
      <p className="map-intro">Elige un lugar del paisaje para ver sus pantallas. El camino dorado muestra hasta dónde ha llegado Noa.</p>
      <div className="map-scroll" role="region" aria-label="Mapa ilustrado de los mundos de Noa">
        <div className="map-board">
          <img className="map-landscape" src="./assets/worlds/noa-adventure-map-v1.png" alt="" aria-hidden="true" />
          <svg className="map-paths" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
            {mapRoutes.map((route) => {
              const state = mapRouteState(route, progress);
              return <g className={`map-path map-path-${state} ${route.branch ? `map-path-${route.branch}` : ""}`} key={`${route.from}-${route.to}`}>
                <path className="map-path-shadow" d={route.path} />
                <path className="map-path-core" d={route.path} />
              </g>;
            })}
          </svg>
          {worldCatalog.map((world) => {
            const available = worldAvailable(world.id, progress);
            const summary = summaries[world.id];
            return <button
              className={`map-node map-node-${world.id} ${available ? "is-open" : "is-locked"} ${summary.remembered ? "is-remembered" : ""}`}
              style={{ left: `${world.x}%`, top: `${world.y}%` }}
              type="button"
              aria-label={`Ver ${world.name}: ${available ? `${summary.complete} de ${summary.total} pantallas completadas` : "todavía cerrado"}`}
              data-gamepad-default={world.id === currentWorld || undefined}
              onClick={(event) => { openerRef.current = event.currentTarget; setSelectedWorld(world.id); }}
              key={world.id}
            >
              <span className="map-node-badge" aria-hidden="true">{available ? world.id === 7 ? "✦" : world.id === 8 ? "≈" : world.id : <PixelIcon kind="lock" />}</span>
              <span className="map-node-name">{world.shortName}</span>
              {available && <span className="map-node-count">{summary.complete}/{summary.total}</span>}
            </button>;
          })}
          <div className="map-compass" aria-hidden="true">✦ N</div>
        </div>
      </div>
      <p className="map-pan-tip">En pantallas pequeñas, desliza el mapa para explorar.</p>

      {selected && (
        <div className="modal-backdrop map-detail-backdrop">
          <div className="map-world-panel" role="dialog" aria-modal="true" aria-labelledby="map-world-title" aria-describedby="map-world-description" ref={panelRef}>
            <button className="modal-close" type="button" data-gamepad-back onClick={closeWorld} aria-label="Cerrar mundo">×</button>
            <div className="map-world-hero">
              <img src={worldArtwork(selected.id)} alt="" />
              <div className="map-world-heading">
                <span className="world-number">{selected.id === 7 ? "Mundo secreto" : selected.id === 8 ? "Mundo del agua" : `Mundo ${selected.id}`}</span>
                <h3 id="map-world-title">{selected.name}</h3>
                <p id="map-world-description">{selected.description}</p>
              </div>
            </div>
            <div className="world-summary" aria-label={`Progreso de ${selected.name}`}>
              <div className="world-summary-top"><strong>{summaries[selected.id].complete}/{summaries[selected.id].total} pantallas</strong><span>{summaries[selected.id].remembered ? "✉ Postal lista" : "✉ Busca su recuerdo"}</span></div>
              <div className="world-progress-bar" aria-hidden="true"><span style={{ width: `${summaries[selected.id].complete / summaries[selected.id].total * 100}%` }} /></div>
              <small><PixelIcon kind="sparkle" /> {summaries[selected.id].stickers}/{summaries[selected.id].stickerTotal} · ★ {summaries[selected.id].flawless}/{summaries[selected.id].total} sin perder vidas{summaries[selected.id].bossFriend ? " · Amigo" : ""}</small>
            </div>
            {!worldAvailable(selected.id, progress) && <p className="map-world-hint">{selected.id === 7 ? "Busca una enredadera secreta entre los jabalíes." : selected.id === 8 ? "Busca la poza azul en el bosque de los lobos." : "Completa las pantallas anteriores para llegar hasta aquí."}</p>}
            <div className="level-row">
              {worldLevels.map(({ level, index }) => {
                const unlocked = isLevelUnlocked(index);
                const stats = progress.levelStats[level.id];
                const stickerEarned = progress.stickers.includes(level.items.find((item) => item.kind === "sticker")?.id ?? "");
                return <button className={`level-card ${stats?.completed ? "is-complete" : ""}`} type="button" disabled={!unlocked}
                  data-gamepad-default={index === suggestedLevel || undefined} onClick={() => onBeginLevel(index)} key={level.id}>
                  <span className="level-id">{unlocked ? level.id : <PixelIcon kind="lock" />}</span>
                  <strong>{level.title}</strong>
                  <small>{stats?.completed ? <><span>✓ Completada · <GameAssetIcon kind="apple" /> {stats.bestApples}</span><span className="level-medals" aria-label={`${1 + Number(stickerEarned) + Number(Boolean(stats.flawless))} de 3 medallas`}>{[true, stickerEarned, Boolean(stats.flawless)].map((earned, medal) => <i className={earned ? "is-earned" : ""} key={medal}>★</i>)}</span></> : unlocked ? "Lista para jugar" : level.world === 8 && !progress.waterUnlocked ? "Busca la poza azul en 3-3" : "Completa la anterior"}</small>
                </button>;
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
