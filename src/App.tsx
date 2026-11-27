import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { CAT_PARTY_LEVEL_ID } from "./game/catPartyNivel";
import { vigilarAudio } from "./game/audio";
import { Dialog } from "./game/Dialog";
import { bossCatalog } from "./game/bosses";
import { GameAssetIcon } from "./game/GameAssetIcon";
import { PixelIcon } from "./game/PixelIcon";
import { nivelesCampana as levels, type NivelResumen } from "./game/nivelesIndice";
import { campaignLevels, levelIndex, nextLevelIndex } from "./game/routes";
import { testScreens } from "./game/testScreens";

/** Solo en desarrollo: `?prueba=salas` abre una pantalla de prueba de los motores de formato y `?prueba=12-2`, una
 * pantalla de la campaña, para revisarlas sin recorrer el mapa. */
const devTestName = import.meta.env.DEV ? new URLSearchParams(window.location.search).get("prueba") ?? "" : "";
/** En desarrollo, `?prueba=<pantalla>&duelo` abre directamente el duelo del guardián de esa pantalla, `?prueba=fiesta` la fiesta de los gatitos y `?prueba=casa` la casa de los gatitos (con `&paletas`, las paletas de sus gatitos, y con `&gatitos=6`, con los gatitos de los mundos 1 a 6). */
/** En desarrollo, `?prueba=vuelo` y `?prueba=nido` abren directamente los duelos de memoria de Aurora Celeste y de la Reina Tricera. */
const devMemoria = devTestName === "vuelo" ? "aurora-celeste" : devTestName === "nido" ? "triceratops-queen" : null;
const devDuel = import.meta.env.DEV && (new URLSearchParams(window.location.search).has("duelo") || devMemoria !== null);
const devTestLevel = devMemoria ? levels.find((level) => level.boss === devMemoria)
  : devTestName ? testScreens[devTestName] ?? [...levels, ...detourLevels, ...restStopLevels].find((level) => level.id === devTestName) : undefined;
import { stickerCatalog } from "./game/stickers";
import { useMandoEnMenus, usePausaAutomatica } from "./game/usePausaAutomatica";
import { musicaDePantalla } from "./game/musicaDePantalla";
import { useEfectos, useMusicaDeFondo } from "./game/useSonidoJuego";
import { lifetimeApples } from "./game/progress";
import { worldCatalog, type WorldId } from "./game/worldMapData";
import { useTablon } from "./game/useTablon";
import type { GameSnapshot, Level } from "./game/types";
import type { DetourId } from "./game/types";
import { detourLevel, detourLevels } from "./game/detours";
import { restStopFor, restStopIndex, restStopResumenes as restStopLevels, restStopUnlocked } from "./game/restStops";
import { funciones } from "./game/funciones";
import { trajePuesto } from "./game/trajes";
import { casaAbierta, conMundosCompletos, llegadasPorVer } from "./game/casaRescate";
import { completarPantalla, ganarRegaloDePantalla } from "./game/progressAcciones";
import { regaloEsperando } from "./game/regalos";
import { t } from "./textos";
import { Boton, BotonControl, Pictograma, Texto } from "./textos/Texto";
import { Medalla, Ventana } from "./game/Ventana";
import { Avisos } from "./game/Avisos";
import { HudEsquinas } from "./game/HudEsquinas";
import { PantallaInicio } from "./game/PantallaInicio";
import { DueloDelGuardian } from "./game/DueloDelGuardian";
import { VentanaAjustes } from "./game/VentanaAjustes";
import { useAjustes } from "./game/useAjustes";
import { useProgreso } from "./game/useProgreso";
import { useVentanas } from "./game/useVentanas";
import { precargarAlbum, VentanaAlbum } from "./game/VentanaAlbum";
import { VentanaTablon } from "./game/VentanaTablon";
const AvionetaGame = lazy(() => import("./game/AvionetaGame").then((module) => ({ default: module.AvionetaGame })));

const WorldMap = lazy(() => import("./game/WorldMap").then((module) => ({ default: module.WorldMap })));
// La partida recibe el resumen de la pantalla y busca su geometría completa en un bloque que se carga con ella.
const GameCanvas = lazy(() => Promise.all([import("./game/GameCanvas"), import("./game/nivelCompleto")]).then(([juego, niveles]) => ({
  default: function GameCanvasConNivel({ level, ...props }: Omit<ComponentProps<typeof juego.GameCanvas>, "level"> & { level: NivelResumen | Level }) {
    return <juego.GameCanvas {...props} level={niveles.nivelCompleto(level)} />;
  },
})));
const CasaGatitos = lazy(() => import("./game/CasaGatitos").then((module) => ({ default: module.CasaGatitos })));
const PruebaPaletas = lazy(() => import("./game/PruebaPaletas").then((module) => ({ default: module.PruebaPaletas })));
/** En desarrollo, `?prueba=casa&paletas` enseña los gatitos de la casa con su paleta, en vez de la casa. */
const devPaletas = import.meta.env.DEV && new URLSearchParams(window.location.search).has("paletas");
/** En desarrollo, `?prueba=casa&gatitos=6` abre la casa como si los mundos 1 a 6 estuvieran completos (y la casa lo guarda). */
const devGatitos = import.meta.env.DEV ? Number(new URLSearchParams(window.location.search).get("gatitos")) || 0 : 0;
const CatParty = lazy(() => import("./game/CatPartyGame").then((module) => ({ default: module.CatParty })));

type Screen = "home" | "map" | "game" | "boss" | "complete" | "gameover" | "finished" | "secret-transition" | "cat-party" | "avioneta" | "casa";
const isTimedScreen = (screen: Screen) => screen === "game" || screen === "boss" || screen === "secret-transition" || screen === "cat-party" || screen === "avioneta";


const emptySnapshot: GameSnapshot = { apples: 0, stickers: [], power: "normal", checkpoint: 0, paused: false };
const MAX_LIVES = 3;
// Los índices del guardado conservan las 18 pantallas originales y continúan con las nuevas aventuras.
const campaignLevelCount = campaignLevels.length;
const bossLevels = levels.flatMap((level, index) => level.boss ? [{ level, index, boss: bossCatalog[level.boss] }] : []);
vigilarAudio();

export default function App() {
  const [screen, setScreen] = useState<Screen>(devTestLevel ? (devDuel && devTestLevel.boss ? "boss" : "game") : devTestName === "fiesta" ? "cat-party" : devTestName === "casa" ? "casa" : "home");
  const screenRef = useRef(screen);
  const { progress, progressRef, saveError, casaVersion, acciones } = useProgreso(screenRef);
  const [activeIndex, setActiveIndex] = useState(0);
  const [levelRun, setLevelRun] = useState(0);
  const [avionetaGift, setAvionetaGift] = useState(false);
  const [lives, setLives] = useState(MAX_LIVES);
  // Menú para adultos del mapa (issue 333): ajustes, tablón, borrar progreso, lista, zoom y ayuda.
  const [menuMapa, setMenuMapa] = useState(false);
  // Cada vida perdida hace caer su corazón del chip de vidas, que tiembla (issue 338): la clave nueva reinicia la animación.
  const [latidoVidas, setLatidoVidas] = useState(0);
  const vidasAntes = useRef(lives);
  useEffect(() => {
    const perdida = lives < vidasAntes.current;
    vidasAntes.current = lives;
    if (!perdida) return;
    setLatidoVidas((latido) => latido + 1);
    // Después de la caída se quita la marca, para que un HUD nuevo (otra pantalla) no la repita al aparecer.
    const fin = window.setTimeout(() => setLatidoVidas(0), 650);
    return () => window.clearTimeout(fin);
  }, [lives]);
  const [paused, setPaused] = useState(false);
  const ventanas = useVentanas();
  const { abrir, cerrar, abrirColeccion: openCollection } = ventanas;
  const tablon = useTablon({ progress, progressRef, pantalla: screen, algunaVentana: ventanas.algunaAbierta, abrir, cerrar });
  // Avisos para adultos que ya se han ido (solos o al tocarlos); uno nuevo, con otro texto, vuelve a salir.
  const [avisosCerrados, setAvisosCerrados] = useState<ReadonlySet<string>>(() => new Set());
  const cerrarAviso = useCallback((id: string) => setAvisosCerrados((cerrados) => new Set(cerrados).add(id)), []);
  const { muted, musicVolume, effectsVolume, reduceMotion, reduceMotionAjuste, touchControls, alternarSonido, ajustarVolumen, setReduceMotion, setTouchControls } = useAjustes();
  const [mapReturnWorld, setMapReturnWorld] = useState<WorldId>();
  /** La pantalla recién superada ha traído un regalo para la casa. */
  const [regaloNuevo, setRegaloNuevo] = useState(false);
  const [showCatPartyInvite, setShowCatPartyInvite] = useState(false);
  const [bossReplay, setBossReplay] = useState(false);
  const [bossReplayReturn, setBossReplayReturn] = useState<"home" | "map">("map");
  const [snapshot, setSnapshot] = useState<GameSnapshot>(emptySnapshot);
  const [shopActive, setShopActive] = useState(false);
  const [activeDetour, setActiveDetour] = useState<DetourId | null>(null);
  const starActive = screen === "game" && (snapshot.starSeconds ?? 0) > 0;
  const secretTransitionRef = useRef({ target: -1, remaining: 1800 });
  const playScreenRef = useRef<HTMLElement | null>(null);
  const activeLevel = devTestLevel ?? levels[activeIndex] ?? detourLevels[activeIndex - levels.length] ?? restStopLevels[activeIndex - levels.length - detourLevels.length];
  const traje = trajePuesto(progress.traje, funciones.trajes);
  const forestComplete = Boolean(progress.levelStats[CAT_PARTY_LEVEL_ID]?.completed);
  const displayedLevel = activeDetour ? detourLevel(activeDetour) : activeLevel;
  const playSound = useEfectos({ muted, effectsVolume });
  const audioMessage = useMusicaDeFondo(musicaDePantalla(screen, activeLevel, { shopActive, paused, muted, musicVolume, starActive }));

  useEffect(() => { screenRef.current = screen; }, [screen]);
  // En el mapa, cuando el navegador está libre, se descargan la pestaña Amigos y las fotos para que el álbum no espere.
  useEffect(() => {
    if (screen !== "map") return;
    const precargar = precargarAlbum;
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(precargar, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(precargar, 1500);
    return () => window.clearTimeout(id);
  }, [screen]);

  usePausaAutomatica(screen, isTimedScreen(screen), setPaused);
  useMandoEnMenus(!((screen === "game" || screen === "boss") && !paused && !ventanas.ajustes && !ventanas.ayuda && !ventanas.creditos && !ventanas.album), screen, ajustarVolumen);

  useEffect(() => {
    if (screen !== "secret-transition" || paused) return;
    const transition = secretTransitionRef.current;
    const started = performance.now();
    const timeout = window.setTimeout(() => {
      setActiveIndex(transition.target);
      setLevelRun((current) => current + 1);
      setLives(MAX_LIVES);
      setSnapshot(emptySnapshot);
      setScreen("game");
    }, transition.remaining);
    return () => {
      window.clearTimeout(timeout);
      transition.remaining = Math.max(0, transition.remaining - (performance.now() - started));
    };
  }, [paused, screen]);

  const totalApples = lifetimeApples(progress);
  const albumStickers = stickerCatalog.filter((sticker) => (sticker.world !== 7 || progress.secretUnlocked) && (sticker.world !== 8 || progress.waterUnlocked));
  const knownBosses = bossLevels.filter(({ level }) => progress.levelStats[level.id]?.completed).length;
  const completedLevels = campaignLevels.filter((level) => progress.levelStats[level.id]?.completed).length;
  const worldProgress = useMemo(() => Object.fromEntries(worldCatalog.map((world) => {
    const worldLevels = levels.filter((level) => level.world === world.id);
    const complete = worldLevels.filter((level) => progress.levelStats[level.id]?.completed).length;
    const stickers = stickerCatalog.filter((sticker) => sticker.world === world.id && progress.stickers.includes(sticker.id)).length;
    const flawless = worldLevels.filter((level) => progress.levelStats[level.id]?.flawless).length;
    const bossLevel = worldLevels.find((level) => level.boss);
    const bossFriend = bossLevel ? Boolean(progress.levelStats[bossLevel.id]?.completed) : false;
    const remembered = complete === worldLevels.length && worldLevels.length > 0;
    return [world.id, { complete, total: worldLevels.length, stickers, stickerTotal: stickerCatalog.filter((sticker) => sticker.world === world.id).length, flawless, bossFriend, remembered }];
  })), [progress.levelStats, progress.stickers]);

  const isLevelUnlocked = (index: number) => {
    const level = levels[index] ?? detourLevels[index - levels.length] ?? restStopLevels[index - levels.length - detourLevels.length];
    if (!level) return false;
    if (level.detour) return progress.detours?.[level.detour]?.discovered === true;
    if (level.restStop) return funciones.paseos && restStopUnlocked(level.restStop, progress.levelStats);
    if (level.world === 7) return progress.secretUnlocked;
    if (level.world === 8) return progress.waterUnlocked && (!level.route?.required || Boolean(progress.levelStats[level.route.required]?.completed));
    return campaignLevels.findIndex((entry) => entry.id === level.id) <= progress.unlocked;
  };

  const replayBoss = (index: number) => {
    const level = levels[index];
    if (!level.boss || !progress.levelStats[level.id]?.completed) return;
    cerrar("album");
    setBossReplayReturn(screen === "home" ? "home" : "map");
    setActiveIndex(index);
    setMapReturnWorld(undefined);
    setLevelRun((current) => current + 1);
    setLives(MAX_LIVES);
    setSnapshot(emptySnapshot);
    setPaused(false);
    setBossReplay(true);
    setScreen("boss");
  };

  const finishBossReplay = (challengeCompleted = false) => {
    if (challengeCompleted && activeLevel.boss) acciones.retoDeJefe(activeLevel.boss);
    setBossReplay(false);
    openCollection("bosses");
    setScreen(bossReplayReturn);
  };

  const beginLevel = (index: number) => {
    if (!isLevelUnlocked(index)) return;
    setActiveIndex(index);
    setMapReturnWorld(undefined);
    setLevelRun((current) => current + 1);
    setLives(MAX_LIVES);
    setSnapshot(emptySnapshot);
    setPaused(false);
    setBossReplay(false);
    setScreen("game");
  };

  const handleLoseLife = useCallback(() => {
    setLives((current) => {
      if (current <= 1) {
        window.setTimeout(() => setScreen("gameover"), 0);
        return 0;
      }
      return current - 1;
    });
  }, []);

  const handleSnapshot = useCallback((next: GameSnapshot) => {
    setSnapshot(next);
    if (next.stickers.length === 0) return;
    acciones.pegatinas(next.stickers);
  }, [acciones]);

  const handleAppleCollected = acciones.manzanas;
  const handleShopVisit = acciones.visitarTienda;
  const handleShopWin = acciones.ganarTienda;
  const handleDetourVisit = acciones.visitarDesvio;
  const handleFriendGreeted = acciones.saludar;
  const handleDetourComplete = acciones.completarDesvio;
  const handleDetourReveal = acciones.revelarDesvios;

  const handleComplete = useCallback((challengeCompleted = false, finalSnapshot = snapshot) => {
    setSnapshot(finalSnapshot);
    if (activeLevel.detour) {
      acciones.completarDesvio(activeLevel.detour);
      setScreen("map");
      return;
    }
    if (activeLevel.restStop) {
      acciones.visitarPaseo(activeLevel.restStop);
      setScreen("map");
      return;
    }
    setShowCatPartyInvite(activeLevel.id === CAT_PARTY_LEVEL_ID && !forestComplete);
    const como = { sinCaer: lives === MAX_LIVES, reto: challengeCompleted };
    acciones.completarPantalla(activeLevel, finalSnapshot, como);
    if (funciones.regalos) {
      const ahora = new Date();
      const despues = completarPantalla(progress, activeLevel, finalSnapshot, como);
      setRegaloNuevo(ganarRegaloDePantalla(despues, ahora) !== despues);
      acciones.ganarRegaloDePantalla(ahora);
    }
    // La primera vez que se vence a la Reina Arcoíris, ella regala la avioneta y el vuelo empieza solo.
    if (activeLevel.world === 7 && activeLevel.boss && !progress.avioneta?.flown) {
      setAvionetaGift(true);
      setScreen("avioneta");
      return;
    }
    setScreen(activeLevel.route?.finale ? "finished" : "complete");
  }, [acciones, activeLevel, forestComplete, lives, snapshot, progress]);

  const handleCanvasComplete = useCallback((finalSnapshot: GameSnapshot) => handleComplete(false, finalSnapshot), [handleComplete]);

  const handleWaterExit = useCallback(() => {
    const target = levelIndex(activeLevel.route?.waterExit ?? "");
    if (target < 0) return;
    acciones.desbloquearAgua();
    setActiveIndex(target);
    setLevelRun((current) => current + 1);
    setLives(MAX_LIVES);
    setSnapshot(emptySnapshot);
    setPaused(false);
    setScreen("game");
  }, [acciones, activeLevel]);

  const handleBossEncounter = useCallback((finalSnapshot: GameSnapshot) => {
    handleSnapshot(finalSnapshot);
    setPaused(false);
    setBossReplay(false);
    setScreen("boss");
  }, [handleSnapshot]);

  const handleSecretExit = useCallback(() => {
    const target = levelIndex(activeLevel.route?.secretExit ?? "");
    if (target < 0) return;
    acciones.desbloquearSecreto();
    secretTransitionRef.current = { target, remaining: 1800 };
    setPaused(false);
    setScreen("secret-transition");
  }, [acciones, activeLevel]);

  const spendBossApple = useCallback(() => {
    setSnapshot((current) => {
      const apples = Math.max(0, current.apples - 1);
      return { ...current, apples, power: apples === 0 && current.power === "apple" ? "normal" : current.power };
    });
  }, []);

  const restartBossLevel = useCallback(() => {
    setLevelRun((current) => current + 1);
    setSnapshot(emptySnapshot);
    setPaused(false);
    setScreen("game");
  }, []);

  const restartCurrentLevel = useCallback(() => {
    setLevelRun((current) => current + 1);
    setLives(MAX_LIVES);
    setSnapshot(emptySnapshot);
    setActiveDetour(null);
    setPaused(false);
    setBossReplay(false);
    setScreen("game");
  }, []);

  const abandonBossBattle = useCallback(() => {
    setPaused(false);
    setScreen("map");
  }, []);

  const openCatParty = () => {
    setPaused(false);
    setShowCatPartyInvite(false);
    setScreen("cat-party");
  };

  const leaveCatParty = () => {
    setMapReturnWorld(2);
    setPaused(false);
    setScreen("map");
  };

  const nextLevel = () => {
    const nextIndex = nextLevelIndex(activeLevel);
    if (nextIndex < 0) { setScreen("map"); return; }
    beginLevel(nextIndex);
  };

  const resetProgress = () => {
    if (!window.confirm(t("adultos.app.empezar-de-nuevo-se"))) return;
    setMapReturnWorld(undefined);
    setLevelRun(0);
    acciones.borrar();
    setActiveIndex(0);
    setLives(MAX_LIVES);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void (playScreenRef.current ?? document.documentElement).requestFullscreen?.().catch(() => undefined);
  };

  const albumFound = progress.stickers.filter((id) => albumStickers.some((sticker) => sticker.id === id)).length;
  const hudEsquinas = !bossReplay && <HudEsquinas lives={lives} maxLives={MAX_LIVES} latidoVidas={latidoVidas} snapshot={snapshot} starActive={starActive}
    displayedLevel={displayedLevel} mostrarPausa={screen === "game" || screen === "boss"} onPausa={() => setPaused((value) => !value)} />;

  return (
    <main className={`app-shell ${reduceMotion ? "reduce-motion" : ""} ${touchControls === "always" ? "touch-controls-always" : ""}`}>
      <Avisos esperar={(screen === "game" || screen === "boss") && !paused} cerrados={avisosCerrados} onCerrar={cerrarAviso} avisos={[
        ...(saveError ? [{ id: "guardar", clase: "save-warning", rol: "alert" as const, contenido: t("adultos.app.no-se-pudo-guardar") }] : []),
        ...(tablon.activo && tablon.device && tablon.syncState === "pending" ? [{ id: `tablon-pendiente:${tablon.syncMessage}`, clase: "ranking-sync-warning", rol: "status" as const, contenido: <>{t("adultos.app.tus-logros-del-tablon")} {tablon.syncMessage} {saveError ? t("adultos.app.puedes-seguir-jugando-aunque") : t("adultos.app.tu-partida-sigue-guardada")} <button type="button" onClick={tablon.reintentarEnvio}>{t("adultos.app.reintentar-envio")}</button></> }] : []),
        ...(audioMessage && !muted && musicVolume > 0 ? [{ id: `musica:${audioMessage}`, clase: "audio-warning", rol: "status" as const, contenido: audioMessage }] : []),
      ]} />
      {screen === "home" && <PantallaInicio albumFound={albumFound} albumTotal={albumStickers.length} knownBosses={knownBosses} jefesTotal={bossLevels.length} muted={muted}
        partidaEmpezada={progress.unlocked > 0} secretUnlocked={progress.secretUnlocked} saveError={saveError} completedLevels={completedLevels} campaignLevelCount={campaignLevelCount}
        onJugar={() => setScreen("map")} onAyuda={() => abrir("ayuda")} onColeccion={openCollection} onSonido={alternarSonido}
        onAjustes={() => abrir("ajustes")} onTablon={tablon.activo ? tablon.abrirTablon : undefined} onCreditos={() => abrir("creditos")} />}

      {screen === "map" && (
        <section className="map-screen">
          {/* Mapa a pantalla completa (issue 333): arriba flotan los contadores, el inicio y el menú para adultos. */}
          <header className="map-header">
            <h2 className="sr-only"><Texto clave="mapa.cabecera.rotulo" /></h2>
            <div className="map-actions">
              <span className="apple-total"><GameAssetIcon kind="apple" /> {totalApples}</span>
              <button className="album-button" type="button" onClick={() => openCollection("stickers")} aria-label={t("mapa.abrirAlbum.oculto")}><PixelIcon kind="sparkle" /> {progress.stickers.filter((id) => albumStickers.some((sticker) => sticker.id === id)).length}/{albumStickers.length}</button>
              <button className="album-button" type="button" onClick={() => openCollection("bosses")} aria-label={t("mapa.abrirJefes.oculto")}>★ {knownBosses}/{bossLevels.length}</button>
            </div>
            <div className="map-actions">
              <button className="icon-button" type="button" aria-expanded={menuMapa} onClick={() => setMenuMapa((abierto) => !abierto)} aria-label={t("mapa.menuAdultos.oculto")}>⚙</button>
              <button className="icon-button" type="button" data-gamepad-back onClick={() => setScreen("home")} aria-label={t("mapa.volverInicio.oculto")}>⌂</button>
            </div>
            {menuMapa && <div className="map-menu-adultos">
              <button className="album-button" type="button" onClick={() => abrir("ajustes")}>{t("mapa.ajustes")}</button>
              {tablon.activo && <button className="album-button" type="button" onClick={tablon.abrirTablon}>{t("adultos.app.tablon")}</button>}
              <button className="text-button reset-button" type="button" onClick={resetProgress}>{t("mapa.borrarProgreso")}</button>
            </div>}
          </header>
          <Suspense fallback={<p className="lazy-loading" role="status"><Texto clave="partida.hud.cargando.rotulo" /></p>}>
            <WorldMap key={progress.unlocked === 0 ? "new-adventure" : "adventure"} progress={progress} startingWorld={mapReturnWorld ?? (levelRun > 0 ? displayedLevel.world : undefined)} summaries={worldProgress} isLevelUnlocked={isLevelUnlocked} onBeginLevel={beginLevel} onOpenCatParty={openCatParty} onOpenAvioneta={() => { setAvionetaGift(false); setPaused(false); setScreen("avioneta"); }} reduceMotion={reduceMotion} onDetourReveal={handleDetourReveal}
              onOpenCasa={funciones.casa && casaAbierta(progress.levelStats) ? () => setScreen("casa") : undefined} regaloEnCasa={funciones.regalos && regaloEsperando(progress.regalos)} menuAdultos={menuMapa} />
          </Suspense>
        </section>
      )}

      {screen === "avioneta" && <Suspense fallback={<p className="lazy-loading" role="status"><Texto clave="partida.hud.cargando.rotulo" /></p>}>
        <AvionetaGame paused={paused} muted={muted} musicVolume={musicVolume / 100} reduceMotion={reduceMotion} gift={avionetaGift}
          bestStars={progress.avioneta?.bestStars ?? 0} playSound={playSound}
          onExit={(stars) => {
            // Rendirse no pierde nada; al cruzar el arcoíris se guarda la mejor marca. El marcador queda abierto en
            // cuanto se vence a la Reina Arcoíris, aunque no se complete el vuelo.
            acciones.terminarVuelo(stars);
            setAvionetaGift(false);
            setPaused(false);
            setScreen("map");
          }} />
      </Suspense>}
      {screen === "casa" && <Suspense fallback={<p className="lazy-loading" role="status"><Texto clave="partida.hud.cargando.rotulo" /></p>}>
        {devPaletas ? <PruebaPaletas /> : <CasaGatitos key={`casa-${casaVersion}`} casa={progress.casa} levelStats={devGatitos ? conMundosCompletos(progress.levelStats, devGatitos) : progress.levelStats}reduceMotion={reduceMotion} muted={muted} effectsVolume={effectsVolume} musicVolume={musicVolume}
          onGuardar={acciones.guardarCasa} regalos={progress.regalos} onGuardarRegalos={acciones.guardarRegalos} onAmistad={acciones.amistad} onSalir={() => setScreen("map")} />}
      </Suspense>}
      {screen === "cat-party" && <Suspense fallback={<p className="lazy-loading" role="status"><Texto clave="partida.hud.cargando.rotulo" /></p>}>
        <CatParty paused={paused} muted={muted} musicVolume={musicVolume} effectsVolume={effectsVolume} reduceMotion={reduceMotion}
          onPause={() => setPaused(true)} onExit={leaveCatParty} />
      </Suspense>}

      {screen === "secret-transition" && (
        <section className="secret-transition" aria-live="polite">
          <img className="secret-vine-rise" src="./assets/sprites/secret-vine-transition-v1.webp" alt="" aria-hidden="true" />
          <p className="eyebrow texto-noa"><Texto clave="ventanas.subidaSecreta.secreto.rotulo" /></p>
          <h2 className="texto-noa titulo pictograma-doble"><Texto clave="ventanas.subidaSecreta.arriba.rotulo" /></h2>
          <p className="juntos">{t("ventanas.subidaSecreta.arriba.juntos")}</p>
          <div className="transition-clouds" aria-hidden="true">☁ ☁ ☁</div>
        </section>
      )}

      {(screen === "game" || screen === "boss" || screen === "complete" || screen === "gameover" || screen === "finished") && (
        <section className="play-screen" ref={playScreenRef}>
          {!bossReplay && <Suspense fallback={<p className="lazy-loading lazy-loading-game" role="status"><Texto clave="partida.hud.cargando.rotulo" /></p>}>
            <GameCanvas traje={traje} key={`game-${activeLevel.id}-${levelRun}`} level={activeLevel} hud={hudEsquinas} running={screen === "game" && !paused} onLoseLife={handleLoseLife} onComplete={handleCanvasComplete} onBossEncounter={handleBossEncounter} onSecretExit={handleSecretExit} onWaterExit={handleWaterExit} onSnapshot={handleSnapshot} onAppleCollected={handleAppleCollected} onShopVisit={handleShopVisit} onShopWin={handleShopWin} onShopActiveChange={setShopActive} onDetourVisit={handleDetourVisit} onDetourComplete={handleDetourComplete} onDetourActiveChange={setActiveDetour} onFriendGreeted={handleFriendGreeted} onReturn={() => setScreen("map")} reduceMotion={reduceMotion} playSound={playSound} />
          </Suspense>}

          {screen === "boss" && activeLevel.boss && <DueloDelGuardian traje={traje} level={{ id: activeLevel.id, boss: activeLevel.boss }} levelRun={levelRun} paused={paused} muted={muted}
            musicVolume={musicVolume} effectsVolume={effectsVolume} reduceMotion={reduceMotion} levelCompleted={Boolean(progress.levelStats[activeLevel.id]?.completed)}
            apples={snapshot.apples} power={snapshot.power} bossReplay={bossReplay} onSpendApple={spendBossApple} onRestartLevel={restartBossLevel}
            onAbandon={abandonBossBattle} onFinishReplay={finishBossReplay} onWin={handleComplete} playSound={playSound} />}

          {screen === "complete" && (
            <Ventana id="complete-title" titulo="ventanas.completada.titulo.rotulo" celebracion esperaMs={500} onClose={() => setScreen("map")}
              botones={<>
                {showCatPartyInvite && <Boton tipo="seguir" clave="ventanas.completada.fiesta.rotulo" data-gamepad-default onClick={openCatParty} />}
                {!showCatPartyInvite && activeLevel.world !== 7 && <Boton tipo="seguir" clave="ventanas.completada.siguiente.rotulo" data-gamepad-default onClick={nextLevel} />}
                {funciones.casa && (regaloNuevo || llegadasPorVer(progress.casa, progress.levelStats).includes(activeLevel.world)) && <Boton clave="ventanas.completada.casa.rotulo" onClick={() => setScreen("casa")} />}
                {funciones.paseos && activeLevel.boss && restStopFor(activeLevel.world) && <Boton clave="ventanas.completada.paseo.rotulo" onClick={() => beginLevel(levels.length + detourLevels.length + restStopIndex(activeLevel.world))} />}
                <Boton tipo={activeLevel.world === 7 ? "seguir" : "secundario"} clave="ventanas.completada.mapa.rotulo" data-gamepad-back onClick={() => setScreen("map")} />
              </>}>
              <div className="ventana-dibujo">{activeLevel.boss ? <img className="completion-trophy" src="./assets/sprites/completion-trophy-v1.webp" alt={t("ventanas.completada.trofeo.oculto")} /> : <img className="completion-cat" src={worldCatalog.find((world) => world.id === activeLevel.world)?.catAsset ?? "./assets/sprites/completion-cat-v1.webp"} alt={t("ventanas.completada.gatito.oculto")} />}</div>
              <div className="medallas" role="group" aria-label={t("ventanas.completada.medallas.oculto")}>
                <Medalla clave="ventanas.completada.meta.rotulo" conseguida />
                <Medalla clave="ventanas.completada.pegatina.rotulo" conseguida={snapshot.stickers.length > 0 || progress.stickers.includes(activeLevel.items.find((item) => item.kind === "sticker")?.id ?? "")} />
                <Medalla clave="ventanas.completada.sinCaer.rotulo" conseguida={lives === MAX_LIVES} />
              </div>
              {snapshot.stickers.length > 0 && <div className="rotulo-con-frase"><p className="texto-noa"><Texto clave="ventanas.completada.insignia.rotulo" /></p><p className="juntos">{t("ventanas.completada.insignia.juntos", { n: snapshot.stickers.length })}</p></div>}
              <p className="juntos">{t("ventanas.completada.manzanas.juntos", { n: snapshot.apples })} {t(activeLevel.world === 7 ? "ventanas.completada.reina.juntos" : activeLevel.boss ? "ventanas.completada.guardian.juntos" : "ventanas.completada.siguienteAventura.juntos")}</p>
              {regaloNuevo && <div className="rotulo-con-frase aviso-regalo"><i className="dibujo-regalo" aria-hidden="true" /><p className="texto-noa"><Texto clave="ventanas.completada.regalo.rotulo" /></p><p className="juntos">{t("ventanas.completada.regalo.juntos")}</p></div>}
              {showCatPartyInvite && <p className="juntos">{t("ventanas.completada.fiesta.juntos")}</p>}
              {!showCatPartyInvite && activeLevel.world !== 7 && activeLevel.route?.nextLabel && <p className="juntos">{activeLevel.route.nextLabel}</p>}
            </Ventana>
          )}

          {screen === "gameover" && (
            <Ventana id="gameover-title" titulo="ventanas.otraOportunidad.titulo.rotulo" esperaMs={500} onClose={() => setScreen("map")}
              botones={<>
                <Boton tipo="seguir" clave="ventanas.otraOportunidad.otraVez.rotulo" data-gamepad-default onClick={() => beginLevel(activeIndex)} />
                <Boton clave="ventanas.otraOportunidad.mapa.rotulo" data-gamepad-back onClick={() => setScreen("map")} />
              </>}>
              <div className="ventana-dibujo corazones" aria-hidden="true">{Array.from({ length: MAX_LIVES }, (_, vida) => <GameAssetIcon key={vida} kind="heart" />)}</div>
              <p className="juntos">{t("ventanas.otraOportunidad.vidas.juntos")}</p>
            </Ventana>
          )}

          {screen === "finished" && (
            <Ventana id="finished-title" titulo="ventanas.final.titulo.rotulo" className="finale" celebracion esperaMs={500} onClose={() => setScreen("map")}
              botones={<>
                <Boton tipo="seguir" clave="ventanas.final.mapa.rotulo" data-gamepad-default onClick={() => setScreen("map")} />
                <Boton clave="ventanas.final.inicio.rotulo" data-gamepad-back onClick={() => setScreen("home")} />
              </>}>
              <div className="ventana-dibujo cat-party" aria-hidden="true">
                <img src="./assets/sprites/world-cat-1-v1.webp" alt="" />
                <GameAssetIcon kind="apple" />
                <img src="./assets/sprites/world-cat-2-v1.webp" alt="" />
                <img className="party-yarn" src={"./assets/sprites/yarn-ball-v1.webp"} alt="" />
                <img src="./assets/sprites/world-cat-6-v1.webp" alt="" />
              </div>
              <p className="juntos">{t("ventanas.final.amigos.juntos")}</p>
            </Ventana>
          )}
        </section>
      )}

      {paused && isTimedScreen(screen) && (
        <Ventana id="pause-title" titulo="partida.pausa.titulo.rotulo" className="ventana-pausa" onClose={() => setPaused(false)}
          botones={<>
            <Boton tipo="seguir" clave="partida.pausa.seguir.rotulo" data-gamepad-default onClick={() => setPaused(false)} />
            {screen !== "cat-party" && <Boton clave="partida.pausa.otraVez.rotulo" onClick={restartCurrentLevel} />}
            <Boton clave="partida.pausa.mapa.rotulo" data-gamepad-back onClick={screen === "cat-party" ? leaveCatParty : () => { setPaused(false); setScreen("map"); }} />
            <div className="pausa-controles">
              <BotonControl pictograma={muted ? "sin-sonido" : "sonido"} etiqueta={muted ? "partida.hud.sonido.oculto" : "partida.hud.silencio.oculto"} aria-pressed={!muted} onClick={alternarSonido} />
              <BotonControl pictograma="pantalla-grande" etiqueta="partida.hud.pantallaGrande.oculto" onClick={toggleFullscreen} />
            </div>
          </>} />
      )}

      {ventanas.ajustes && <VentanaAjustes musicVolume={musicVolume} effectsVolume={effectsVolume} reduceMotion={reduceMotionAjuste} touchControls={touchControls}
        tablonActivo={tablon.activo} onTablonActivo={(activo) => { if (activo) cerrar("ajustes"); tablon.activar(activo); }}
        onMusicVolume={(volumen) => ajustarVolumen("musica", volumen)} onEffectsVolume={(volumen) => ajustarVolumen("efectos", volumen)}
        onReduceMotion={setReduceMotion} onTouchControls={setTouchControls} onClose={() => cerrar("ajustes")} />}

      {ventanas.ayuda && (
        <Ventana id="help-title" titulo="inicio.ayuda.titulo.rotulo" className="ventana-ayuda" onClose={() => cerrar("ayuda")}
          botones={<Boton tipo="seguir" clave="inicio.ayuda.lista.rotulo" data-gamepad-default onClick={() => { cerrar("ayuda"); setScreen("map"); }} />}>
          <BotonControl className="ventana-cerrar" pictograma="cerrar" etiqueta="inicio.ayuda.cerrar.oculto" data-gamepad-back onClick={() => cerrar("ayuda")} />
          <div className="ayuda-tarjetas">
              <div className="ayuda-tarjeta"><Pictograma nombre="camina" doble /><div className="rotulo-con-frase"><p className="texto-noa"><Texto clave="inicio.ayuda.camina.rotulo" /></p><p className="juntos">{t("inicio.ayuda.camina.juntos")}</p></div></div>
              <div className="ayuda-tarjeta"><Pictograma nombre="salta" doble /><div className="rotulo-con-frase"><p className="texto-noa"><Texto clave="inicio.ayuda.dobleSalto.rotulo" /></p><p className="juntos">{t("inicio.ayuda.dobleSalto.juntos")}</p></div></div>
              <div className="ayuda-tarjeta"><Pictograma nombre="caja" doble /><div className="rotulo-con-frase"><p className="texto-noa"><Texto clave="inicio.ayuda.caja.rotulo" /></p><p className="juntos">{t("inicio.ayuda.caja.juntos")}</p></div></div>
              <div className="ayuda-tarjeta"><Pictograma nombre="lana" doble /><div className="rotulo-con-frase"><p className="texto-noa"><Texto clave="inicio.ayuda.lana.rotulo" /></p><p className="juntos">{t("inicio.ayuda.lana.juntos")}</p></div></div>
              <div className="ayuda-tarjeta"><Pictograma nombre="manzana" doble /><div className="rotulo-con-frase"><p className="texto-noa"><Texto clave="inicio.ayuda.manzana.rotulo" /></p><p className="juntos">{t("inicio.ayuda.manzana.juntos")}</p></div></div>
              <div className="ayuda-tarjeta"><Pictograma nombre="reto" doble /><div className="rotulo-con-frase"><p className="texto-noa"><Texto clave="inicio.ayuda.reto.rotulo" /></p><p className="juntos">{t("inicio.ayuda.reto.juntos")}</p></div></div>
              <div className="ayuda-tarjeta"><Pictograma nombre="pegatina" doble /><div className="rotulo-con-frase"><p className="texto-noa"><Texto clave="inicio.ayuda.arriba.rotulo" /></p><p className="juntos">{t("inicio.ayuda.arriba.juntos")}</p></div></div>
          </div>
          <p className="juntos">{t("inicio.ayuda.movil.juntos")}</p>
          <p className="texto-adultos">{t("inicio.ayuda.teclado")}</p>
        </Ventana>
      )}

      {ventanas.creditos && (
        <Dialog labelledBy="credits-title" className="game-modal credits-modal" onClose={() => cerrar("creditos")}>
          <button className="modal-close" type="button" data-gamepad-back onClick={() => cerrar("creditos")} aria-label={t("adultos.app.cerrar.oculto")}>×</button>
          <p className="eyebrow">{t("adultos.app.hecho-con-carino")}</p><h2 id="credits-title">{t("adultos.app.creditos")}</h2>
          <p><strong>{t("adultos.app.super-noa")}</strong> {t("adultos.app.es-un-juego-original")}</p>
          <p>{t("adultos.app.personaje-creado-para-este")}</p>
          <p>{t("adultos.app.todas-las-aventuras-tienen")} <a href="https://opengameart.org/content/platformer-chiptunes" target="_blank" rel="noreferrer">{t("adultos.app.platformer-chiptunes")}</a>{t("adultos.app.de-guy-g-gamerson")}</p>
          <p>{t("adultos.app.los-guardianes-finales-y")}</p>
          <button className="pixel-button primary" type="button" onClick={() => cerrar("creditos")}>{t("adultos.app.cerrar-2")}</button>
        </Dialog>
      )}

      {ventanas.album && <VentanaAlbum progress={progress} collectionTab={ventanas.pestana} albumStickers={albumStickers} albumHints={ventanas.pistas} setAlbumHints={ventanas.setPistas}
        bossLevels={bossLevels} knownBosses={knownBosses} worldProgress={worldProgress} onTab={ventanas.setPestana} onReplayBoss={replayBoss}
        onHeart={acciones.amistad} onClose={() => cerrar("album")} />}
      {ventanas.tablon && <VentanaTablon tablon={tablon} campaignLevelCount={campaignLevelCount} />}
    </main>
  );
}
