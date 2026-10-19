import { useCallback, useEffect, useRef, useState } from "react";
import { GameAssetIcon } from "./GameAssetIcon";
import { PixelIcon } from "./PixelIcon";
import { optimizedAssetSource } from "./assets";
import { levels } from "./levels";
import { getLevelObjectives } from "./levelObjectives";
import { campaignLevels } from "./routes";
import type { Progress } from "./progress";
import { findMapJourney, mapRoutes, mapRouteState, worldArtwork, worldAvailable, worldCatalog, type WorldId } from "./worldMapData";

export type WorldSummary = {
  complete: number; total: number; stickers: number; stickerTotal: number;
  flawless: number; bossFriend: boolean; remembered: boolean;
};

type WorldMapProps = {
  progress: Progress;
  summaries: Record<number, WorldSummary>;
  isLevelUnlocked: (index: number) => boolean;
  onBeginLevel: (index: number) => void;
  reduceMotion: boolean;
};

export function WorldMap({ progress, summaries, isLevelUnlocked, onBeginLevel, reduceMotion }: WorldMapProps) {
  const [selectedWorld, setSelectedWorld] = useState<WorldId | null>(null);
  const [visibleHints, setVisibleHints] = useState<Record<string, boolean>>({});
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const currentWorld = campaignLevels[progress.unlocked]?.world ?? 1;
  const [noaWorld, setNoaWorld] = useState<WorldId>(currentWorld);
  const [noaPosition, setNoaPosition] = useState(() => {
    const world = worldCatalog.find((entry) => entry.id === currentWorld)!;
    return { x: world.x, y: world.y };
  });
  const [moving, setMoving] = useState(false);
  const animationRef = useRef<number | null>(null);
  const finishAnimationRef = useRef<(() => void) | null>(null);
  const systemReduceMotionRef = useRef(false);
  const selected = worldCatalog.find((world) => world.id === selectedWorld);
  const noaLocation = worldCatalog.find((world) => world.id === noaWorld)!;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    systemReduceMotionRef.current = preference.matches;
    const onChange = () => {
      systemReduceMotionRef.current = preference.matches;
      if (preference.matches) finishAnimationRef.current?.();
    };
    preference.addEventListener("change", onChange);
    return () => {
      preference.removeEventListener("change", onChange);
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      finishAnimationRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) finishAnimationRef.current?.();
  }, [reduceMotion]);

  const openWorld = (world: (typeof worldCatalog)[number], opener: HTMLButtonElement, animate = true) => {
    if (moving) return;
    openerRef.current = opener;
    const journey = findMapJourney(noaWorld, world.id, progress);
    if (!journey?.length || !animate || reduceMotion || systemReduceMotionRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (journey) {
        setNoaPosition({ x: world.x, y: world.y });
        setNoaWorld(world.id);
      }
      setSelectedWorld(world.id);
      return;
    }
    const legs = journey.map(({ route, reverse }) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", route.path);
      return { path, length: path.getTotalLength(), reverse };
    });
    const totalLength = legs.reduce((sum, leg) => sum + leg.length, 0);
    const duration = Math.min(2800, Math.max(650, totalLength * 3.5));
    let started: number | null = null;
    const finish = () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      finishAnimationRef.current = null;
      setNoaPosition({ x: world.x, y: world.y });
      setNoaWorld(world.id);
      setMoving(false);
      setSelectedWorld(world.id);
    };
    finishAnimationRef.current = finish;
    setMoving(true);
    const tick = (time: number) => {
      started ??= time;
      let distance = Math.min(1, (time - started) / duration) * totalLength;
      for (const leg of legs) {
        if (distance > leg.length) { distance -= leg.length; continue; }
        const point = leg.path.getPointAtLength(leg.reverse ? leg.length - distance : distance);
        setNoaPosition({ x: point.x / 10, y: point.y / 5.6 });
        break;
      }
      if (time - started < duration) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };
    animationRef.current = requestAnimationFrame(tick);
  };

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
      <p className="map-intro">Elige un mundo para ver sus pantallas. Noa puede visitar los lugares que ya conoce.</p>
      <div className="map-layout">
      <div className="map-scroll" role="region" aria-label="Mapa ilustrado de los mundos de Noa">
        <div className="map-board">
          <img className="map-landscape" src={optimizedAssetSource("./assets/worlds/noa-adventure-map-v1.png")} alt="" aria-hidden="true" />
          <svg className="map-paths" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
            {mapRoutes.map((route) => {
              const state = mapRouteState(route, progress);
              return <g className={`map-path map-path-${state} ${route.branch ? `map-path-${route.branch}` : ""}`} key={`${route.from}-${route.to}`}>
                <path className="map-path-shadow" d={route.path} />
                <path className="map-path-core" d={route.path} />
              </g>;
            })}
          </svg>
          <div className={`map-noa ${moving ? "is-moving" : ""}`} style={{ left: `${noaPosition.x}%`, top: `${noaPosition.y}%`, backgroundImage: `url('${optimizedAssetSource("./assets/sprites/noa-sprite-sheet.png")}')` }} role="img" aria-label={`Noa está en ${noaLocation.name}`} />
          {worldCatalog.map((world) => {
            const available = worldAvailable(world.id, progress);
            const summary = summaries[world.id];
            return <button
              className={`map-node map-node-${world.id} ${available ? "is-open" : "is-locked"} ${summary.remembered ? "is-remembered" : ""}`}
              style={{ left: `${world.x}%`, top: `${world.y}%` }}
              type="button"
              aria-label={`Ver ${world.name}: ${available ? `${summary.complete} de ${summary.total} pantallas completadas` : "todavía cerrado"}`}
              data-gamepad-default={world.id === noaWorld || undefined}
              onClick={(event) => openWorld(world, event.currentTarget)}
              disabled={moving}
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
      <div className="map-cards" aria-label="Mundos de Noa">
        {worldCatalog.map((world) => {
          const available = worldAvailable(world.id, progress);
          const summary = summaries[world.id];
          return <button className={`map-card ${available ? "is-open" : "is-locked"} ${world.id === noaWorld ? "is-current" : ""}`} type="button"
            aria-label={`Ver ${world.name}: ${available ? `${summary.complete} de ${summary.total} pantallas completadas` : "todavía cerrado"}`}
            data-gamepad-default={world.id === noaWorld || undefined}
            onClick={(event) => openWorld(world, event.currentTarget, false)} key={world.id}>
            <span className="map-card-art"><img src={worldArtwork(world.id)} alt="" loading="lazy" /></span>
            <span className="map-card-body">
              <span className="map-card-label">{world.id === 7 ? "Mundo secreto" : world.id === 8 ? "Mundo del agua" : `Mundo ${world.id}`}</span>
              <strong>{world.name}</strong>
              <small>{world.description}</small>
              <span className="map-card-status">{available ? `${summary.complete}/${summary.total} pantallas completadas` : "Todavía cerrado"}</span>
            </span>
            {world.id === noaWorld && <span className="map-card-here">Noa está aquí</span>}
          </button>;
        })}
      </div>
      </div>
      <p className="map-location" aria-live="polite">{moving ? "Noa va de camino…" : <>Noa está en <strong>{noaLocation.name}</strong> · {summaries[noaWorld].complete}/{summaries[noaWorld].total} pantallas completadas</>}</p>

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
            {!worldAvailable(selected.id, progress) && <p className="map-world-hint">{selected.id === 7 ? "Sigue explorando. ¡Hay sorpresas por descubrir!" : selected.id === 8 ? "Busca la poza azul en el bosque de los lobos." : "Completa las pantallas anteriores para llegar hasta aquí."}</p>}
            <div className="level-row">
              {worldLevels.map(({ level, index }) => {
                const unlocked = isLevelUnlocked(index);
                const stats = progress.levelStats[level.id];
                const objectives = getLevelObjectives(level, progress);
                const stickerObjectives = objectives.objectives.filter((objective) => objective.kind === "sticker");
                const stickerEarned = stickerObjectives.length > 0 && stickerObjectives.every((objective) => objective.completed);
                const nextHint = objectives.objectives.find((objective) => objective.kind === "sticker" && !objective.completed)
                  ?? objectives.objectives.find((objective) => !objective.completed);
                const hintVisible = visibleHints[level.id] === true;
                return <div className="level-entry" key={level.id}>
                <button className={`level-card ${stats?.completed ? "is-complete" : ""}`} type="button" disabled={!unlocked}
                  data-gamepad-default={index === suggestedLevel || undefined} onClick={() => onBeginLevel(index)}>
                  <span className="level-id">{unlocked ? level.id : <PixelIcon kind="lock" />}</span>
                  <strong>{!unlocked && level.world === 7 ? "Una sorpresa te espera" : level.title}</strong>
                  <small>{stats?.completed ? <><span>✓ Completada · <GameAssetIcon kind="apple" /> {stats.bestApples}</span><span className="level-medals" aria-label={`${1 + Number(stickerEarned) + Number(Boolean(stats.flawless))} de 3 medallas`}>{[true, stickerEarned, Boolean(stats.flawless)].map((earned, medal) => <i className={earned ? "is-earned" : ""} key={medal}>★</i>)}</span></> : unlocked ? "Lista para jugar" : level.world === 8 && !progress.waterUnlocked ? "Busca la poza azul en 3-3" : "Completa la anterior"}</small>
                </button>
                {unlocked && objectives.available && <div className="level-objectives">
                  <p className="level-objectives-status">{objectives.pendingCount === 1 ? "Falta 1" : objectives.pendingCount ? `Faltan ${objectives.pendingCount}` : "¡Todo conseguido!"}</p>
                  <ul aria-label={`Objetivos de ${level.title}`}>
                    {objectives.objectives.map((objective) => <li className={objective.completed ? "is-complete" : "is-pending"} key={objective.id}
                      aria-label={`${objective.label}: ${objective.completed ? "conseguido" : "pendiente"}`}>
                      <span aria-hidden="true">{objective.completed ? "✓" : "○"}</span> {objective.label}
                    </li>)}
                  </ul>
                  {nextHint && <>
                    <button className="level-hint-toggle" type="button" aria-expanded={hintVisible} aria-controls={`level-hint-${level.id}`}
                      onClick={() => setVisibleHints((current) => ({ ...current, [level.id]: !current[level.id] }))}>
                      {hintVisible ? "Ocultar pista" : "Mostrar pista"}
                    </button>
                    <p className="level-objective-hint" id={`level-hint-${level.id}`} hidden={!hintVisible} aria-live="polite">{nextHint.hint}</p>
                  </>}
                </div>}
                </div>;
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
