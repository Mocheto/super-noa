import { useCallback, useEffect, useRef, useState } from "react";
import { CAT_PARTY_LEVEL_ID } from "./catParty";
import { LevelSelectCard } from "./LevelSelectCard";
import { PixelIcon } from "./PixelIcon";
import { optimizedAssetSource } from "./assets";
import { levels } from "./levels";
import { campaignLevels } from "./routes";
import type { Progress } from "./progress";
import { getWorldSecretShopBadge } from "./secretShopProgress";
import { findMapJourney, MAP_HEIGHT, MAP_WIDTH, mapLandscape, mapRoutes, mapRouteState, shortcutRoutes, worldArtwork, worldAvailable, worldCatalog, type WorldId } from "./worldMapData";
import { detourArtwork, detourCatalog, detourLevels } from "./detours";
import { restStopCatalog, restStopUnlocked } from "./restStops";
import { TOTAL_STARS } from "./avioneta";
import type { DetourId } from "./types";
import { useMapCamera } from "./useMapCamera";
import "./detours.css";
import { puntos, t } from "../textos";
import { Boton, BotonControl, Pictograma, Texto } from "../textos/Texto";

export type WorldSummary = {
  complete: number; total: number; stickers: number; stickerTotal: number;
  flawless: number; bossFriend: boolean; remembered: boolean;
};

type WorldMapProps = {
  progress: Progress;
  startingWorld?: WorldId;
  summaries: Record<number, WorldSummary>;
  isLevelUnlocked: (index: number) => boolean;
  onBeginLevel: (index: number) => void;
  onOpenCatParty: () => void;
  reduceMotion: boolean;
  onDetourReveal: (ids: DetourId[]) => void;
  onOpenAvioneta?: () => void;
};

export function WorldMap({ progress, startingWorld, summaries, isLevelUnlocked, onBeginLevel, onOpenCatParty, reduceMotion, onDetourReveal, onOpenAvioneta }: WorldMapProps) {
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedWorld, setSelectedWorld] = useState<WorldId | null>(null);
  const [openObjectives, setOpenObjectives] = useState<{ levelId: string; pinned: boolean } | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const currentWorld = startingWorld && worldAvailable(startingWorld, progress)
    ? startingWorld : campaignLevels[progress.unlocked]?.world ?? 1;
  const [noaWorld, setNoaWorld] = useState<WorldId>(currentWorld);
  const [noaPosition, setNoaPosition] = useState(() => {
    const world = worldCatalog.find((entry) => entry.id === currentWorld)!;
    return { x: world.x, y: world.y };
  });
  const [moving, setMoving] = useState(false);
  const animationRef = useRef<number | null>(null);
  const finishAnimationRef = useRef<(() => void) | null>(null);
  const followNoa = useRef(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const camera = useMapCamera(viewportRef, noaPosition, () => { followNoa.current = false; });
  const systemReduceMotionRef = useRef(false);
  const selected = worldCatalog.find((world) => world.id === selectedWorld);
  const noaLocation = worldCatalog.find((world) => world.id === noaWorld)!;
  const discoveredDetours = detourCatalog.filter((entry) => progress.detours?.[entry.id]?.discovered);
  const newDetours = discoveredDetours.filter((entry) => !progress.detours?.[entry.id]?.revealed).map((entry) => entry.id);
  const newDetourKey = newDetours.join(",");
  useEffect(() => {
    if (!newDetourKey) return;
    const timeout = window.setTimeout(() => onDetourReveal(detourCatalog.filter((entry) => newDetourKey.split(",").includes(entry.id)).map((entry) => entry.id)), reduceMotion ? 0 : 2200);
    return () => window.clearTimeout(timeout);
  }, [newDetourKey, onDetourReveal, reduceMotion]);
  const beginDetour = (id: DetourId) => onBeginLevel(levels.length + detourLevels.findIndex((entry) => entry.detour === id));
  const detourIcon = (icon: number) => <span className="detour-icon" aria-hidden="true" style={{ backgroundImage: `url('${detourArtwork}')`, backgroundPosition: `${icon * 25}% 0%` }} />;

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
        if (animate) camera.centerOn(world);
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
    const duration = Math.min(2800, Math.max(650, totalLength * 1.1));
    let started: number | null = null;
    const finish = () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      finishAnimationRef.current = null;
      setNoaPosition({ x: world.x, y: world.y });
      setNoaWorld(world.id);
      if (followNoa.current) camera.centerOn(world);
      followNoa.current = false;
      setMoving(false);
      setSelectedWorld(world.id);
    };
    finishAnimationRef.current = finish;
    followNoa.current = true;
    setMoving(true);
    const tick = (time: number) => {
      started ??= time;
      let distance = Math.min(1, (time - started) / duration) * totalLength;
      for (const leg of legs) {
        if (distance > leg.length) { distance -= leg.length; continue; }
        const point = leg.path.getPointAtLength(leg.reverse ? leg.length - distance : distance);
        const position = { x: point.x / MAP_WIDTH * 100, y: point.y / MAP_HEIGHT * 100 };
        setNoaPosition(position);
        if (followNoa.current) camera.centerOn(position);
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
    setOpenObjectives(null);
    setSelectedWorld(null);
    requestAnimationFrame(() => openerRef.current?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    if (selectedWorld === null) return;
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>("[data-gamepad-default]") ?? panel?.querySelector<HTMLElement>("[data-gamepad-back]"))?.focus();
  }, [selectedWorld]);

  useEffect(() => {
    if (selectedWorld === null) return;
    const panel = panelRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (openObjectives) setOpenObjectives(null);
        else closeWorld();
      }
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
  }, [closeWorld, openObjectives, selectedWorld]);

  const worldLevels = selected ? levels.map((level, index) => ({ level, index })).filter(({ level }) => level.world === selected.id) : [];
  const suggestedLevel = worldLevels.find(({ level, index }) => isLevelUnlocked(index) && !progress.levelStats[level.id]?.completed)?.index
    ?? worldLevels.find(({ index }) => isLevelUnlocked(index))?.index;

  return (
    <>
      <p className="map-intro"><span className="rotulo"><Texto clave="mapa.intro.rotulo" /></span> <small className="juntos">{t("mapa.intro.juntos")}</small></p>
      <div className="map-layout">
      <div className="map-controls" inert={selectedWorld !== null} aria-label={t("mapa.controles.oculto")}>
        <div className="map-mode">
          <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")}><Texto clave="mapa.vistaMapa.rotulo" /></button>
          <button type="button" aria-pressed={view === "list"} onClick={() => { followNoa.current = false; setView("list"); }}><Texto clave="mapa.vistaLista.rotulo" /></button>
        </div>
        {view === "map" && <div className="map-zoom">
          <button type="button" aria-label={t("mapa.alejar.oculto")} disabled={camera.atMin} onClick={() => camera.zoomBy(-1)}>−</button>
          <button type="button" aria-label={t("mapa.acercar.oculto")} disabled={camera.atMax} onClick={() => camera.zoomBy(1)}>+</button>
          <button type="button" aria-pressed={camera.atMin} onClick={camera.showAll}><Texto clave="mapa.verTodo.rotulo" /></button>
          <button type="button" onClick={() => camera.showNear(noaPosition)}><Texto clave="mapa.volverANoa.rotulo" /></button>
        </div>}
      </div>
      <div className="map-scroll" inert={selectedWorld !== null} hidden={view !== "map"} role="region" aria-label={t("mapa.mapaIlustrado.oculto")}
        ref={viewportRef} {...camera.viewportEvents}>
        <div className={`map-board${camera.overview ? " is-overview" : ""}`} style={{ width: camera.frame.width, height: camera.frame.height, left: camera.frame.x, top: camera.frame.y }}>
          <img className="map-landscape" src={mapLandscape} alt="" aria-hidden="true" draggable={false} />
          <svg className="map-paths" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
            {mapRoutes.map((route) => {
              const state = mapRouteState(route, progress);
              if (state === "hidden") return null;
              return <g className={`map-path map-path-${state} ${route.branch ? `map-path-${route.branch}` : ""}`} key={`${route.from}-${route.to}`}>
                <path className="map-path-shadow" d={route.path} />
                <path className="map-path-core" d={route.path} />
              </g>;
            })}
          </svg>
          <svg className="map-detour-paths" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} preserveAspectRatio="none" aria-label={t("mapa.senderos.oculto")}>
            {discoveredDetours.map((entry) => <path key={entry.id} d={entry.path} pathLength="1"
              className={`map-detour-path ${newDetours.includes(entry.id) ? "is-new" : ""}`} role="button"
              tabIndex={moving || camera.overview ? -1 : 0} aria-label={t("mapa.explorarSendero.oculto", { titulo: entry.title })} aria-disabled={moving}
              onFocus={() => camera.ensureVisible(entry)}
              onClick={() => { if (!moving && !camera.overview) beginDetour(entry.id); }}
              onKeyDown={(event) => { if (!moving && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); beginDetour(entry.id); } }} />)}
            {shortcutRoutes.filter((route) => mapRouteState(route, progress) === "open").map((route) =>
              <path key={route.detour} className={`map-detour-path map-shortcut${route.detour === "mine" ? " is-tunnel" : ""}`} d={route.path} />)}
          </svg>
          <div className={`map-noa ${moving ? "is-moving" : ""}`} style={{ left: `${noaPosition.x}%`, top: `${noaPosition.y}%`, backgroundImage: `url('${optimizedAssetSource("./assets/sprites/noa-sprite-sheet.png")}')` }} role="img" aria-label={t("mapa.noaEsta.oculto", { lugar: noaLocation.name })} />
          {worldCatalog.map((world) => {
            if (world.id === 7 && !progress.secretUnlocked) return null;
            const available = worldAvailable(world.id, progress);
            const summary = summaries[world.id];
            const shop = getWorldSecretShopBadge(world.id, progress);
            return <button
              className={`map-node map-node-${world.id} ${available ? "is-open" : "is-locked"} ${summary.remembered ? "is-remembered" : ""}`}
              style={{ left: `${world.x}%`, top: `${world.y}%` }}
              type="button"
              aria-label={`Ver ${world.name}: ${available ? `${summary.complete} de ${summary.total} pantallas completadas` : "todavía cerrado"}${shop ? `. ${shop.label}` : ""}`}
              data-gamepad-default={world.id === noaWorld || undefined}
              onFocus={() => camera.ensureVisible(world)}
              onClick={(event) => camera.overview ? camera.showNear(world) : openWorld(world, event.currentTarget)}
              disabled={moving}
              key={world.id}
            >
              <span className="map-node-badge" aria-hidden="true">{available ? world.id === 7 ? "✦" : world.id === 8 ? "≈" : world.id : <PixelIcon kind="lock" />}</span>
              <span className="map-node-name">{world.shortName}</span>
              {available && <span className="map-node-count">{summary.complete}/{summary.total}</span>}
              {shop && <span className={`shop-visit-badge map-shop-badge is-${shop.state}`} style={{ backgroundImage: "url('./assets/sprites/secret-shop-door-v1.png')" }} role="img" aria-label={shop.label} title={shop.label} />}
            </button>;
          })}
          {discoveredDetours.map((entry) => <button key={entry.id} type="button"
            className={`map-detour map-detour-${entry.id} ${progress.detours?.[entry.id]?.completed ? "is-completed" : ""} ${newDetours.includes(entry.id) ? "is-new" : ""}`}
            style={{ left: `${entry.x}%`, top: `${entry.y}%` }} disabled={moving} onFocus={() => camera.ensureVisible(entry)} onClick={() => camera.overview ? camera.showNear(entry) : beginDetour(entry.id)}
            aria-label={`${entry.title}: ${progress.detours?.[entry.id]?.completed ? "completado, volver a visitar" : "descubierto, explorar"}`}>
            {detourIcon(entry.icon)}<span>{entry.shortName}{progress.detours?.[entry.id]?.completed ? " ✓" : ""}</span>
          </button>)}
          {onOpenAvioneta && progress.levelStats["S-1"]?.completed && (() => {
            // La avioneta de las nubes: marcador junto al reino secreto, con la mejor marca de estrellas.
            const sky = worldCatalog.find((entry) => entry.id === 7);
            if (!sky) return null;
            const spot = { ...sky, x: Math.min(95, sky.x + 9) };
            const best = progress.avioneta?.bestStars ?? 0;
            const all = best >= TOTAL_STARS;
            return <button type="button" className={`map-rest-stop map-avioneta ${all ? "is-golden" : ""}`} style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              disabled={moving} onFocus={() => camera.ensureVisible(spot)} onClick={() => camera.overview ? camera.showNear(spot) : onOpenAvioneta()}
              aria-label={t("mapa.avioneta.oculto", { n: best, total: TOTAL_STARS })}>✈<span>★ {best}</span></button>;
          })()}
        </div>
      </div>
      <div className="map-cards" inert={selectedWorld !== null} hidden={view !== "list"} aria-label={t("mapa.mundos.oculto")}>
        {worldCatalog.map((world) => {
          const available = worldAvailable(world.id, progress);
          const summary = summaries[world.id];
          return <button className={`map-card ${available ? "is-open" : "is-locked"} ${world.id === noaWorld ? "is-current" : ""}`} type="button"
            aria-label={`Ver ${world.name}: ${available ? `${summary.complete} de ${summary.total} pantallas completadas` : "todavía cerrado"}`}
            data-gamepad-default={world.id === noaWorld || undefined}
            onClick={(event) => openWorld(world, event.currentTarget, false)} key={world.id}>
            <span className="map-card-art"><img src={worldArtwork(world.id)} alt="" loading="lazy" /></span>
            <span className="map-card-body">
              <span className="map-card-label">{world.id === 7 ? <Texto clave="mapa.mundo.secreto.rotulo" /> : world.id === 8 ? <Texto clave="mapa.mundo.agua.rotulo" /> : <Texto clave="mapa.mundo.numero.rotulo" variables={{ n: world.id }} />}</span>
              <strong>{world.name}</strong>
              <small>{world.description}</small>
              <span className="map-card-status">{available ? <span aria-label={t("mapa.mundo.progreso.oculto", { n: summary.complete, total: summary.total })}><Texto clave="mapa.mundo.progreso.rotulo" variables={{ puntos: puntos(summary.complete, summary.total) }} /></span> : <Texto clave="mapa.mundo.cerrado.rotulo" />}</span>
            </span>
            {world.id === noaWorld && <span className="map-card-here"><Texto clave="mapa.mundo.aqui.rotulo" /></span>}
          </button>;
        })}
      </div>
      </div>
      <p className="map-location" aria-live="polite">{moving ? <Texto clave="mapa.ubicacion.enCamino.rotulo" /> : <><Texto clave="mapa.ubicacion.aqui.rotulo" /> <strong>{noaLocation.name}</strong> <span aria-label={t("mapa.mundo.progreso.oculto", { n: summaries[noaWorld].complete, total: summaries[noaWorld].total })}>{puntos(summaries[noaWorld].complete, summaries[noaWorld].total)}</span></>}</p>
      {newDetours.length > 0 && <p role="status"><Texto clave="mapa.caminoNuevo.rotulo" /> {discoveredDetours.filter((entry) => newDetours.includes(entry.id)).map((entry) => entry.title).join(", ")}</p>}

      {selected && (
        <div className="modal-backdrop map-detail-backdrop">
          <div className="map-world-panel" role="dialog" aria-modal="true" aria-labelledby="map-world-title" aria-describedby="map-world-description" ref={panelRef}>
            <BotonControl className="ventana-cerrar" pictograma="cerrar" etiqueta="mapa.mundo.cerrar.oculto" data-gamepad-back onClick={closeWorld} />
            <div className="map-world-hero">
              <img src={worldArtwork(selected.id)} alt="" />
              <div className="map-world-heading">
                <span className="world-number texto-noa pequeno">{selected.id === 7 ? <Texto clave="mapa.mundo.secreto.rotulo" /> : selected.id === 8 ? <Texto clave="mapa.mundo.agua.rotulo" /> : <Texto clave="mapa.mundo.numero.rotulo" variables={{ n: selected.id }} />}</span>
                <h3 id="map-world-title" className="texto-noa titulo">{selected.name}</h3>
                <p id="map-world-description" className="juntos">{selected.description}</p>
              </div>
              <strong className="mundo-avance texto-noa" aria-label={t("mapa.mundo.progreso.oculto", { n: summaries[selected.id].complete, total: summaries[selected.id].total })}><Texto clave="mapa.mundo.progreso.rotulo" variables={{ puntos: puntos(summaries[selected.id].complete, summaries[selected.id].total) }} /></strong>
            </div>
            <div className="world-summary" aria-label={t("mapa.mundo.resumen.oculto", { mundo: selected.name })}>
              <span className="mundo-chip texto-noa pequeno"><Texto clave={summaries[selected.id].remembered ? "mapa.mundo.postalLista.rotulo" : "mapa.mundo.postalBusca.rotulo"} /></span>
              <span className="mundo-chip texto-noa pequeno"><Pictograma nombre="pegatina" />{summaries[selected.id].stickers}/{summaries[selected.id].stickerTotal}</span>
              <span className="mundo-chip texto-noa pequeno"><Texto clave="mapa.mundo.sinCaer.rotulo" /> {summaries[selected.id].flawless}/{summaries[selected.id].total}</span>
              {summaries[selected.id].bossFriend && <span className="mundo-chip texto-noa pequeno"><Texto clave="mapa.mundo.amigo.rotulo" /></span>}
            </div>
            {!worldAvailable(selected.id, progress) && <p className="map-world-hint rotulo-con-frase"><span className="texto-noa"><Texto clave={selected.id === 7 ? "mapa.mundo.pistaSecreto.rotulo" : selected.id === 8 ? "mapa.mundo.pistaAgua.rotulo" : "mapa.mundo.pistaCerrado.rotulo"} /></span> <small className="juntos">{t(selected.id === 7 ? "mapa.mundo.pistaSecreto.juntos" : selected.id === 8 ? "mapa.mundo.pistaAgua.juntos" : "mapa.mundo.pistaCerrado.juntos")}</small></p>}
            <div className="level-row">
              {worldLevels.map(({ level, index }) => <LevelSelectCard key={level.id}
                level={level} index={index} unlocked={isLevelUnlocked(index)} suggested={index === suggestedLevel}
                progress={progress} onBeginLevel={onBeginLevel}
                details={openObjectives?.levelId === level.id ? openObjectives : null}
                onOpenDetails={(pinned) => setOpenObjectives((current) => !pinned && current?.pinned ? current : { levelId: level.id, pinned })}
                onCloseDetails={() => setOpenObjectives((current) => current?.levelId === level.id ? null : current)}
              />)}
            </div>
            {restStopUnlocked(selected.id, progress.levelStats) && (() => {
              // El paseo de los amigos se ofrece dentro del mundo, no como un botón más sobre el mapa.
              const index = restStopCatalog.findIndex((stop) => stop.world === selected.id);
              const visited = progress.restStops?.[selected.id]?.visited;
              return <Boton className="world-rest-stop" clave="mapa.paseo.rotulo" onClick={() => onBeginLevel(levels.length + detourLevels.length + index)}
                aria-label={t(visited ? "mapa.paseo.visitado" : "mapa.paseo.oculto", { mundo: selected.name })} />;
            })()}
            {selected.id === 2 && progress.levelStats[CAT_PARTY_LEVEL_ID]?.completed && <Boton clave="mapa.mundo.fiesta.rotulo" onClick={onOpenCatParty} />}
            <div className="detour-list" aria-label={t("mapa.mundo.desvios.oculto")}>
              {discoveredDetours.filter((entry) => entry.world === selected.id).map((entry) => <button key={entry.id} type="button" onClick={() => beginDetour(entry.id)}>
                {detourIcon(entry.icon)} {entry.title} {progress.detours?.[entry.id]?.completed ? "✓" : ""}
              </button>)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
