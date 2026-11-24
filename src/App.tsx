import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { CAT_PARTY_LEVEL_ID } from "./game/catPartyNivel";
import { busDeZona, contextoAudio, pistaDeMusica, vigilarAudio } from "./game/audio";
import { Dialog } from "./game/Dialog";
import { bossCatalog } from "./game/bosses";
import { GameAssetIcon } from "./game/GameAssetIcon";
import { PixelIcon } from "./game/PixelIcon";
import type { SoundKind } from "./game/GameCanvas";
import { nivelesCampana as levels, type NivelResumen } from "./game/nivelesIndice";
import { campaignLevels, campaignUnlockIndex, levelIndex, nextLevelIndex } from "./game/routes";
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
import { firstConnectedGamepad } from "./game/gamepad";
import { menuDirection, readMenuPad } from "./game/menuGamepad";
import { createMusicPlayer, musicTracks } from "./game/music";
import { adoptarProgreso, collectLifetimeApples, completeSecretShop, lifetimeApples, parseProgress, progressMilestone, readProgress, resetCampaignProgress, serializeProgress, STORAGE_KEY, textoNormalizado, visitSecretShop, type Progress } from "./game/progress";
import { readStorage, writeStorage } from "./game/storage";
import { worldCatalog, type WorldId } from "./game/worldMapData";
import { checkRankingAvailability, loadRanking, rankingConnectionMessage, rankingProgress, readRankingDevice, registerRankingDevice, syncRanking, type RankingDevice, type RankingPlayer } from "./game/ranking";
import { createEnrollmentRecovery, ENROLLMENT_RETRY_MS, enrollmentFailure, isEnrolled, safeEnrollmentMoment } from "./game/rankingOnboarding";
import type { GameSnapshot, Level } from "./game/types";
import type { DetourId } from "./game/types";
import { detourLevel, detourLevels } from "./game/detours";
import { restStopFor, restStopIndex, restStopResumenes as restStopLevels, restStopUnlocked } from "./game/restStops";
import { greetFriend, visitRestStop } from "./game/restStopProgress";
import { addHeart } from "./game/friendProgress";
import { funciones } from "./game/funciones";
import { casaAbierta, conMundosCompletos, llegadasPorVer } from "./game/casaRescate";
import { recordFlight } from "./game/avioneta";
import { t } from "./textos";
import { Boton, BotonControl, Pictograma, Texto } from "./textos/Texto";
import { Medalla, Ventana } from "./game/Ventana";
import { Avisos } from "./game/Avisos";
import { HudEsquinas } from "./game/HudEsquinas";
import { PantallaInicio } from "./game/PantallaInicio";
import { DueloDelGuardian } from "./game/DueloDelGuardian";
import { VentanaAjustes } from "./game/VentanaAjustes";
import { useAjustes } from "./game/useAjustes";
import { precargarAlbum, VentanaAlbum, type CollectionTab } from "./game/VentanaAlbum";
import { VentanaTablon } from "./game/VentanaTablon";
const AvionetaGame = lazy(() => import("./game/AvionetaGame").then((module) => ({ default: module.AvionetaGame })));
import { visitDetour } from "./game/detourProgress";

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

function rankingErrorMessage(error: unknown, fallback: string) {
  return error instanceof TypeError || (error instanceof DOMException && error.name === "TimeoutError")
    ? rankingConnectionMessage
    : error instanceof Error ? error.message : fallback;
}

export default function App() {
  const [progress, setProgress] = useState<Progress>(readProgress);
  const [screen, setScreen] = useState<Screen>(devTestLevel ? (devDuel && devTestLevel.boss ? "boss" : "game") : devTestName === "fiesta" ? "cat-party" : devTestName === "casa" ? "casa" : "home");
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
  const [saveError, setSaveError] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [rankingDevice, setRankingDevice] = useState<RankingDevice | null>(readRankingDevice);
  const [rankingAlias, setRankingAlias] = useState("");
  const [rankingPlayers, setRankingPlayers] = useState<RankingPlayer[]>([]);
  const [rankingMessage, setRankingMessage] = useState("");
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingJoining, setRankingJoining] = useState(false);
  const [rankingSyncState, setRankingSyncState] = useState<"idle" | "syncing" | "saved" | "pending">("idle");
  const [rankingSyncMessage, setRankingSyncMessage] = useState("");
  const [rankingRetry, setRankingRetry] = useState(0);
  const [enrollmentRequired, setEnrollmentRequired] = useState(false);
  const [enrollmentChecking, setEnrollmentChecking] = useState(false);
  const [enrollmentDeferred, setEnrollmentDeferred] = useState(() => Boolean(readRankingDevice()?.registrationPending));
  const [enrollmentMessage, setEnrollmentMessage] = useState("");
  const [enrollmentStorageBlocked, setEnrollmentStorageBlocked] = useState(false);
  const [audioMessage, setAudioMessage] = useState("");
  // Avisos para adultos que ya se han ido (solos o al tocarlos); uno nuevo, con otro texto, vuelve a salir.
  const [avisosCerrados, setAvisosCerrados] = useState<ReadonlySet<string>>(() => new Set());
  const cerrarAviso = useCallback((id: string) => setAvisosCerrados((cerrados) => new Set(cerrados).add(id)), []);
  const [collectionTab, setCollectionTab] = useState<CollectionTab>("stickers");
  const [albumHints, setAlbumHints] = useState<string[]>([]);
  const { muted, musicVolume, effectsVolume, reduceMotion, reduceMotionAjuste, touchControls, alternarSonido, ajustarVolumen, setReduceMotion, setTouchControls } = useAjustes();
  const [mapReturnWorld, setMapReturnWorld] = useState<WorldId>();
  const [showCatPartyInvite, setShowCatPartyInvite] = useState(false);
  const [bossReplay, setBossReplay] = useState(false);
  const [bossReplayReturn, setBossReplayReturn] = useState<"home" | "map">("map");
  const [snapshot, setSnapshot] = useState<GameSnapshot>(emptySnapshot);
  const [shopActive, setShopActive] = useState(false);
  const [activeDetour, setActiveDetour] = useState<DetourId | null>(null);
  const starActive = screen === "game" && (snapshot.starSeconds ?? 0) > 0;
  const musicRef = useRef<ReturnType<typeof createMusicPlayer> | null>(null);
  const starMusicRef = useRef<ReturnType<typeof createMusicPlayer> | null>(null);
  const rankingJoiningRef = useRef(false);
  const rankingAliasRef = useRef<HTMLInputElement | null>(null);
  const enrollmentBusyRef = useRef(false);
  const enrollmentRequiredRef = useRef(false);
  const enrollmentRetryAtRef = useRef(0);
  const adventureActionRef = useRef<(() => void) | null>(null);
  const secretTransitionRef = useRef({ target: -1, remaining: 1800 });
  const effectsBusRef = useRef<GainNode | null>(null);
  const playScreenRef = useRef<HTMLElement | null>(null);
  const screenRef = useRef(screen);
  const activeLevel = devTestLevel ?? levels[activeIndex] ?? detourLevels[activeIndex - levels.length] ?? restStopLevels[activeIndex - levels.length - detourLevels.length];
  const forestComplete = Boolean(progress.levelStats[CAT_PARTY_LEVEL_ID]?.completed);
  const displayedLevel = activeDetour ? detourLevel(activeDetour) : activeLevel;

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

  const finishEnrollment = useCallback(() => {
    enrollmentRequiredRef.current = false;
    setEnrollmentRequired(false);
    setShowRanking(false);
    const action = adventureActionRef.current;
    adventureActionRef.current = null;
    action?.();
  }, []);

  const deferEnrollment = useCallback((message: string) => {
    enrollmentRetryAtRef.current = Date.now() + ENROLLMENT_RETRY_MS;
    setEnrollmentDeferred(true);
    setEnrollmentMessage(t("adultos.app.message-puedes-seguir-jugando", { message }));
    finishEnrollment();
  }, [finishEnrollment]);

  const requestAdventure = useCallback(async (action?: () => void) => {
    action?.();
    if (enrollmentBusyRef.current || enrollmentRequiredRef.current || rankingJoiningRef.current) return;
    if (isEnrolled(readRankingDevice() ?? rankingDevice)) return;
    if (enrollmentDeferred && Date.now() < enrollmentRetryAtRef.current) return;
    enrollmentBusyRef.current = true;
    adventureActionRef.current = null;
    setEnrollmentChecking(true);
    try {
      await checkRankingAvailability();
      const pending = readRankingDevice();
      if (pending?.registrationPending) {
        const device = await registerRankingDevice(pending.alias);
        setRankingDevice(device);
        setEnrollmentDeferred(false);
        setEnrollmentMessage("");
        finishEnrollment();
      } else {
        if (!safeEnrollmentMoment(screenRef.current, false)) {
          enrollmentRetryAtRef.current = 0;
          setEnrollmentDeferred(true);
          finishEnrollment();
          return;
        }
        setShowHelp(false);
        setShowAlbum(false);
        setShowSettings(false);
        setShowCredits(false);
        setPaused(false);
        setRankingDevice(pending);
        setRankingAlias(pending?.alias ?? "");
        setRankingMessage("");
        setEnrollmentStorageBlocked(false);
        enrollmentRequiredRef.current = true;
        setEnrollmentRequired(true);
        setShowRanking(true);
        window.requestAnimationFrame(() => rankingAliasRef.current?.focus());
      }
    } catch (error) {
      const message = rankingErrorMessage(error, t("adultos.app.el-tablon-no-esta"));
      if (enrollmentFailure(error) === "validate" || enrollmentFailure(error) === "storage") {
        setRankingDevice(readRankingDevice());
        setRankingAlias(readRankingDevice()?.alias ?? "");
        setRankingMessage(message);
        setEnrollmentStorageBlocked(enrollmentFailure(error) === "storage");
        if (!safeEnrollmentMoment(screenRef.current, false)) {
          enrollmentRetryAtRef.current = 0;
          setEnrollmentDeferred(true);
          finishEnrollment();
          return;
        }
        setShowHelp(false);
        setShowAlbum(false);
        setShowSettings(false);
        setShowCredits(false);
        setScreen((current) => safeEnrollmentMoment(current, false) ? current : "map");
        enrollmentRequiredRef.current = true;
        setEnrollmentRequired(true);
        setShowRanking(true);
        window.requestAnimationFrame(() => rankingAliasRef.current?.focus());
      } else if (!safeEnrollmentMoment(screenRef.current, false)) {
        enrollmentRetryAtRef.current = Date.now() + ENROLLMENT_RETRY_MS;
        setEnrollmentDeferred(true);
        finishEnrollment();
      } else deferEnrollment(message);
    } finally {
      enrollmentBusyRef.current = false;
      setEnrollmentChecking(false);
    }
  }, [deferEnrollment, enrollmentDeferred, finishEnrollment, rankingDevice]);

  useEffect(() => {
    if (!enrollmentDeferred || isEnrolled(rankingDevice)) return;
    const { retry, online } = createEnrollmentRecovery(
      enrollmentRetryAtRef,
      () => document.visibilityState !== "hidden"
        && safeEnrollmentMoment(screen, showRanking || showHelp || showAlbum || showCredits || showSettings),
      () => { void requestAdventure(); },
    );
    const timeout = window.setTimeout(retry, Math.max(0, enrollmentRetryAtRef.current - Date.now()));
    const interval = window.setInterval(retry, ENROLLMENT_RETRY_MS);
    window.addEventListener("online", online);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      window.removeEventListener("online", online);
    };
  }, [enrollmentDeferred, rankingDevice, requestAdventure, screen, showRanking, showHelp, showAlbum, showCredits, showSettings]);

  useEffect(() => {
    if (!enrollmentRequired) return;
    let cancelled = false;
    let checking = false;
    const check = async () => {
      if (checking || rankingJoiningRef.current || document.visibilityState === "hidden") return;
      checking = true;
      try { await checkRankingAvailability(); }
      catch (error) {
        if (!cancelled && !rankingJoiningRef.current) deferEnrollment(rankingErrorMessage(error, t("adultos.app.el-tablon-no-esta")));
      } finally { checking = false; }
    };
    const interval = window.setInterval(() => void check(), ENROLLMENT_RETRY_MS);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [deferEnrollment, enrollmentRequired]);

  // Lo último que se sabe que hay guardado: lo que escribió esta pestaña o lo que leyó de otra.
  const guardadoRef = useRef<string | null | undefined>(undefined);
  const progressRef = useRef(progress);
  /** Cambia al adoptar una casa de otra pestaña con la casa abierta: vuelve a montarla con los datos nuevos. */
  const [casaVersion, setCasaVersion] = useState(0);

  useEffect(() => {
    progressRef.current = progress;
    const texto = serializeProgress(progress);
    // Una cadena idéntica a la guardada no se vuelve a escribir (tampoco la que se acaba de leer de otra pestaña).
    if (texto === guardadoRef.current) return;
    const saved = writeStorage(STORAGE_KEY, texto);
    if (saved) guardadoRef.current = texto;
    const timeout = window.setTimeout(() => setSaveError(!saved), 0);
    return () => window.clearTimeout(timeout);
  }, [progress]);

  // Otra pestaña ha guardado (o se vuelve a esta pestaña): se adopta su progreso en lugar de pisarlo en la siguiente escritura.
  useEffect(() => {
    const adoptar = (remoto: string | null) => {
      const normal = textoNormalizado(remoto);
      if (normal === guardadoRef.current) return;
      const conocida = guardadoRef.current ?? null;
      // Adoptado tal cual, se serializa igual que `normal` y no se vuelve a escribir; fusionado, sí.
      guardadoRef.current = normal;
      const casaRemota = parseProgress(remoto).casa;
      if (screenRef.current === "casa" && JSON.stringify(casaRemota) !== JSON.stringify(progressRef.current.casa)) setCasaVersion((version) => version + 1);
      setProgress((actual) => adoptarProgreso(actual, remoto, conocida));
    };
    const alGuardarOtra = (event: StorageEvent) => { if (event.key === STORAGE_KEY) adoptar(event.newValue); };
    const releer = () => { if (document.visibilityState === "visible") adoptar(readStorage(STORAGE_KEY)); };
    const alVolver = (event: PageTransitionEvent) => { if (event.persisted) adoptar(readStorage(STORAGE_KEY)); };
    window.addEventListener("storage", alGuardarOtra);
    document.addEventListener("visibilitychange", releer);
    window.addEventListener("pageshow", alVolver);
    return () => {
      window.removeEventListener("storage", alGuardarOtra);
      document.removeEventListener("visibilitychange", releer);
      window.removeEventListener("pageshow", alVolver);
    };
  }, []);

  // El tablón solo recibe lo que le importa: cuidar la casa o mirar fotos no lo vuelve a enviar.
  const rankingClave = useMemo(() => JSON.stringify(rankingProgress(progress)), [progress]);

  useEffect(() => {
    if (!rankingDevice || rankingDevice.registrationPending) return;
    let cancelled = false;
    let attempt = 0;
    const publish = async () => {
      const currentAttempt = ++attempt;
      setRankingSyncState("syncing");
      try {
        await syncRanking(rankingDevice, progressRef.current);
        if (!cancelled && currentAttempt === attempt) {
          const confirmedDevice = readRankingDevice();
          if (confirmedDevice?.id === rankingDevice.id && confirmedDevice.token === rankingDevice.token
            && (confirmedDevice.alias !== rankingDevice.alias || Boolean(confirmedDevice.registrationPending) !== Boolean(rankingDevice.registrationPending))) {
            setRankingDevice(confirmedDevice);
          }
          setRankingSyncState("saved");
          setRankingSyncMessage("");
        }
      } catch (error) {
        if (!cancelled && currentAttempt === attempt) {
          setRankingSyncState("pending");
          setRankingSyncMessage(rankingErrorMessage(error, t("adultos.app.no-pude-enviar-tus")));
        }
      }
    };
    const retryOnline = () => { void publish(); };
    const timeout = window.setTimeout(() => void publish(), 250);
    window.addEventListener("online", retryOnline);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.removeEventListener("online", retryOnline);
    };
  }, [rankingClave, rankingDevice, rankingRetry]);

  useEffect(() => {
    const createPlayer = () => createMusicPlayer(
      pistaDeMusica,
      (error) => {
        console.warn("No se pudo reproducir la música.", error);
        setAudioMessage(t("adultos.app.la-musica-no-ha"));
      },
      () => setAudioMessage(""),
    );
    musicRef.current ??= createPlayer();
    starMusicRef.current ??= createPlayer();
    // La abeja ninja, el tambor de Armonía y la merienda de los jabatos traen su propia canción: la música del mundo calla mientras duran.
    const beeNinjaDuel = screen === "boss" && activeLevel.boss === "queen-bee";
    const armoniaDrumDuel = screen === "boss" && activeLevel.boss === "maestra-armonia";
    const meriendaDuel = screen === "boss" && activeLevel.boss === "great-boar";
    // Los duelos de memoria tienen su canción propia mientras la guardiana enseña.
    const memoriaDuel = screen === "boss" && (activeLevel.boss === "aurora-celeste" || activeLevel.boss === "triceratops-queen");
    const playing = (screen === "game" || screen === "boss") && !beeNinjaDuel && !armoniaDrumDuel && !meriendaDuel && !memoriaDuel && !shopActive && !paused && !muted && musicVolume > 0;
    musicRef.current.update({
      source: musicTracks[activeLevel.world],
      // En el paseo de los amigos la música del mundo suena más suave.
      volume: activeLevel.restStop ? musicVolume * .6 : musicVolume,
      playing: playing && !starActive,
    });
    starMusicRef.current.update({ source: "./assets/music/noa-estelar.mp3", volume: musicVolume, playing: playing && starActive });
  }, [activeLevel.boss, activeLevel.restStop, activeLevel.world, musicVolume, muted, paused, screen, shopActive, starActive]);

  useEffect(() => () => { musicRef.current?.pause(); starMusicRef.current?.pause(); }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.defaultPrevented && event.code === "Escape" && !event.repeat && isTimedScreen(screen)) setPaused((value) => !value);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen]);

  useEffect(() => {
    if (!isTimedScreen(screen)) return;
    const pauseWhenHidden = () => {
      if (document.visibilityState === "hidden") setPaused(true);
    };
    const pauseWhenBlurred = () => setPaused(true);
    document.addEventListener("visibilitychange", pauseWhenHidden);
    window.addEventListener("blur", pauseWhenBlurred);
    const timeout = window.setTimeout(pauseWhenHidden, 0);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener("visibilitychange", pauseWhenHidden);
      window.removeEventListener("blur", pauseWhenBlurred);
    };
  }, [screen]);

  useEffect(() => {
    if (!isTimedScreen(screen)) return;
    let animationId = 0;
    let previous = readMenuPad(firstConnectedGamepad())[6];
    const poll = () => {
      const start = readMenuPad(firstConnectedGamepad())[6];
      if (start && !previous) setPaused((value) => !value);
      previous = start;
      animationId = requestAnimationFrame(poll);
    };
    animationId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animationId);
  }, [screen]);

  useEffect(() => {
    if ((screen === "game" || screen === "boss") && !paused && !showSettings && !showHelp && !showCredits && !showAlbum) return;
    let animationId = 0;
    let previous = readMenuPad(firstConnectedGamepad());
    let previousPadIndex = firstConnectedGamepad()?.index ?? -1;
    const poll = () => {
      const pad = firstConnectedGamepad();
      const current = readMenuPad(pad);
      if (pad?.index !== previousPadIndex) {
        previous = current;
        previousPadIndex = pad?.index ?? -1;
      } else if (pad) {
        const overlays = document.querySelectorAll<HTMLElement>(".modal-backdrop");
        const container = overlays.item(overlays.length - 1) ?? document.querySelector<HTMLElement>(screen === "home" ? ".home-screen" : screen === "cat-party" ? ".cat-party-screen" : ".map-screen");
        if (container && container.dataset.gamepadManaged !== "true") {
          const focusables = Array.from(container.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), a[href]"))
            .filter((element) => element.getClientRects().length > 0);
          const focused = document.activeElement instanceof HTMLElement && container.contains(document.activeElement) ? document.activeElement : null;
          const selected = focused && focusables.includes(focused) ? focused : focusables.find((element) => element.hasAttribute("data-gamepad-default")) ?? focusables[0];
          const focusFromPad = (element: HTMLElement) => {
            container.querySelectorAll(".gamepad-focus").forEach((item) => item.classList.remove("gamepad-focus"));
            element.classList.add("gamepad-focus");
            element.focus();
          };
          const direction = menuDirection(current, previous);
          const horizontal = (current[3] && !previous[3]) || (current[4] && !previous[4]);
          if (direction && selected instanceof HTMLInputElement && selected.type === "range" && horizontal) {
            const value = Math.max(0, Math.min(100, Number(selected.value) + direction * 5));
            if (selected.id === "music-volume") ajustarVolumen("musica", value);
            else if (selected.id === "effects-volume") ajustarVolumen("efectos", value);
          } else if (direction && selected) {
            const index = focusables.indexOf(selected);
            const next = focusables[(index + direction + focusables.length) % focusables.length];
            if (next) focusFromPad(next);
          }
          if (current[0] && !previous[0] && selected && !(selected instanceof HTMLInputElement && selected.type === "range")) {
            focusFromPad(selected);
            selected.click();
          }
          if (current[5] && !previous[5]) container.querySelector<HTMLElement>("[data-gamepad-back]")?.click();
        }
      }
      previous = current;
      animationId = requestAnimationFrame(poll);
    };
    animationId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animationId);
  }, [ajustarVolumen, screen, paused, showSettings, showHelp, showCredits, showAlbum]);

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

  const playSound = useCallback((kind: SoundKind) => {
    if (muted || effectsVolume === 0) return;
    const audioContext = contextoAudio();
    if (!audioContext) return;
    effectsBusRef.current ??= busDeZona(audioContext);
    if (audioContext.state === "suspended") void audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    const notes: Record<SoundKind, [number, number, OscillatorType]> = {
      apple: [660, 0.11, "square"], block: [410, 0.12, "square"], cat: [523, 0.28, "triangle"], jump: [360, 0.12, "square"],
      hurt: [145, 0.22, "sawtooth"], stomp: [210, 0.09, "square"], yarn: [760, 0.08, "triangle"],
      checkpoint: [880, 0.18, "triangle"], goal: [1046, 0.42, "square"], sticker: [1174, 0.32, "triangle"],
      howl: [196, 0.48, "sawtooth"], snort: [110, 0.22, "square"], countdown: [330, 0.08, "square"],
      cannon: [92, 0.3, "sawtooth"],
    };
    const [frequency, duration, type] = notes[kind];
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(kind === "hurt" || kind === "howl" || kind === "snort" ? 70 : frequency * 1.35, now + duration);
    gain.gain.setValueAtTime(0.075 * Math.min(1, Math.max(0, effectsVolume / 100)), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(effectsBusRef.current);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }, [effectsVolume, muted]);

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

  const openCollection = (tab: CollectionTab) => {
    setCollectionTab(tab);
    setShowAlbum(true);
  };

  const refreshRanking = async () => {
    setRankingMessage("");
    setRankingLoading(true);
    try {
      if (rankingDevice) setRankingRetry((current) => current + 1);
      setRankingPlayers(await loadRanking());
    } catch (error) {
      setRankingMessage(rankingErrorMessage(error, t("adultos.app.no-pude-actualizar-el")));
    } finally {
      setRankingLoading(false);
    }
  };

  const openRanking = () => {
    setShowRanking(true);
    void refreshRanking();
  };

  const joinRanking = async () => {
    if (rankingJoiningRef.current) return;
    rankingJoiningRef.current = true;
    setRankingJoining(true);
    setRankingMessage("");
    try {
      const device = await registerRankingDevice(readRankingDevice()?.registrationPending ? readRankingDevice()!.alias : rankingAlias);
      setRankingDevice(device);
      setEnrollmentDeferred(false);
      setEnrollmentMessage("");
      setEnrollmentStorageBlocked(false);
      setRankingMessage(t("adultos.app.hola-alias-tu-tarjeta", { alias: device.alias }));
      if (enrollmentRequiredRef.current) finishEnrollment();
      else void refreshRanking();
    } catch (error) {
      const pendingDevice = readRankingDevice();
      setRankingDevice(pendingDevice);
      const message = rankingErrorMessage(error, t("adultos.app.no-pude-guardar-ese"));
      setRankingMessage(message);
      setEnrollmentStorageBlocked(enrollmentFailure(error) === "storage");
      if (enrollmentRequiredRef.current && enrollmentFailure(error) === "defer") deferEnrollment(message);
    } finally {
      rankingJoiningRef.current = false;
      setRankingJoining(false);
      window.requestAnimationFrame(() => rankingAliasRef.current?.focus());
    }
  };

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
    setShowAlbum(false);
    void requestAdventure(() => {
      setBossReplayReturn(screen === "home" ? "home" : "map");
      setActiveIndex(index);
      setMapReturnWorld(undefined);
      setLevelRun((current) => current + 1);
      setLives(MAX_LIVES);
      setSnapshot(emptySnapshot);
      setPaused(false);
      setBossReplay(true);
      setScreen("boss");
    });
  };

  const finishBossReplay = (challengeCompleted = false) => {
    if (challengeCompleted && activeLevel.boss) setProgress((current) => progressMilestone(current, { ...current, bossChallenges: { ...current.bossChallenges, [activeLevel.boss!]: true } }));
    setBossReplay(false);
    openCollection("bosses");
    setScreen(bossReplayReturn);
  };

  const beginLevel = (index: number) => {
    if (!isLevelUnlocked(index)) return;
    void requestAdventure(() => {
      setActiveIndex(index);
      setMapReturnWorld(undefined);
      setLevelRun((current) => current + 1);
      setLives(MAX_LIVES);
      setSnapshot(emptySnapshot);
      setPaused(false);
      setBossReplay(false);
      setScreen("game");
    });
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
    setProgress((current) => {
      const newStickers = next.stickers.filter((id) => !current.stickers.includes(id));
      return newStickers.length > 0 ? progressMilestone(current, { ...current, stickers: [...current.stickers, ...newStickers] }) : current;
    });
  }, []);

  const handleAppleCollected = useCallback((count: number) => {
    setProgress((current) => collectLifetimeApples(current, count));
  }, []);
  const handleShopVisit = useCallback((id: string) => setProgress((current) => visitSecretShop(current, id)), []);
  const handleShopWin = useCallback((id: string) => setProgress((current) => completeSecretShop(current, id)), []);
  const handleDetourVisit = useCallback((id: DetourId) => setProgress((current) => visitDetour(current, id)), []);
  const handleFriendGreeted = useCallback((world: number, kind: string) => setProgress((current) => greetFriend(current, world, kind)), []);
  const handleDetourComplete = useCallback((id: DetourId) => setProgress((current) => visitDetour(current, id, true)), []);
  const handleDetourReveal = useCallback((ids: DetourId[]) => setProgress((current) => {
    const detours = { ...current.detours };
    let changed = false;
    for (const id of ids) {
      const previous = detours[id];
      if (!previous || previous.revealed) continue;
      detours[id] = { ...previous, revealed: true };
      changed = true;
    }
    return changed ? { ...current, detours } : current;
  }), []);

  const handleComplete = useCallback((challengeCompleted = false, finalSnapshot = snapshot) => {
    setSnapshot(finalSnapshot);
    if (activeLevel.detour) {
      setProgress((current) => visitDetour(current, activeLevel.detour!, true));
      setScreen("map");
      return;
    }
    if (activeLevel.restStop) {
      setProgress((current) => visitRestStop(current, activeLevel.restStop!));
      setScreen("map");
      return;
    }
    setShowCatPartyInvite(activeLevel.id === CAT_PARTY_LEVEL_ID && !forestComplete);
    setProgress((current) => {
      const previous = current.levelStats[activeLevel.id];
      return progressMilestone(current, {
        ...current,
        stickers: [...new Set([...current.stickers, ...finalSnapshot.stickers])],
        unlocked: Math.max(current.unlocked, campaignUnlockIndex(activeLevel)),
        levelStats: {
          ...current.levelStats,
          [activeLevel.id]: { completed: true, bestApples: Math.max(previous?.bestApples ?? 0, finalSnapshot.apples), flawless: previous?.flawless || lives === MAX_LIVES },
        },
        bossChallenges: activeLevel.boss && challengeCompleted ? { ...current.bossChallenges, [activeLevel.boss]: true } : current.bossChallenges,
      });
    });
    // La primera vez que se vence a la Reina Arcoíris, ella regala la avioneta y el vuelo empieza solo.
    if (activeLevel.world === 7 && activeLevel.boss && !progress.avioneta?.flown) {
      setAvionetaGift(true);
      setScreen("avioneta");
      return;
    }
    setScreen(activeLevel.route?.finale ? "finished" : "complete");
  }, [activeLevel, forestComplete, lives, snapshot, progress.avioneta?.flown]);

  const handleCanvasComplete = useCallback((finalSnapshot: GameSnapshot) => handleComplete(false, finalSnapshot), [handleComplete]);

  const handleWaterExit = useCallback(() => {
    const target = levelIndex(activeLevel.route?.waterExit ?? "");
    if (target < 0) return;
    setProgress((current) => progressMilestone(current, { ...current, waterUnlocked: true }));
    setActiveIndex(target);
    setLevelRun((current) => current + 1);
    setLives(MAX_LIVES);
    setSnapshot(emptySnapshot);
    setPaused(false);
    setScreen("game");
  }, [activeLevel]);

  const handleBossEncounter = useCallback((finalSnapshot: GameSnapshot) => {
    handleSnapshot(finalSnapshot);
    setPaused(false);
    setBossReplay(false);
    setScreen("boss");
  }, [handleSnapshot]);

  const handleSecretExit = useCallback(() => {
    const target = levelIndex(activeLevel.route?.secretExit ?? "");
    if (target < 0) return;
    setProgress((current) => progressMilestone(current, { ...current, secretUnlocked: true }));
    secretTransitionRef.current = { target, remaining: 1800 };
    setPaused(false);
    setScreen("secret-transition");
  }, [activeLevel]);

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
    setProgress(resetCampaignProgress);
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
        ...(enrollmentChecking ? [{ id: "tablon-conectando", clase: "ranking-sync-warning", rol: "status" as const, contenido: t("adultos.app.conectando-el-tablon-en") }] : []),
        ...(enrollmentMessage ? [{ id: `tablon:${enrollmentMessage}`, clase: "ranking-sync-warning", rol: "status" as const, contenido: enrollmentMessage }] : []),
        ...(rankingDevice && rankingSyncState === "pending" ? [{ id: `tablon-pendiente:${rankingSyncMessage}:${rankingRetry}`, clase: "ranking-sync-warning", rol: "status" as const, contenido: <>{t("adultos.app.tus-logros-del-tablon")} {rankingSyncMessage} {saveError ? t("adultos.app.puedes-seguir-jugando-aunque") : t("adultos.app.tu-partida-sigue-guardada")} <button type="button" onClick={() => setRankingRetry((current) => current + 1)}>{t("adultos.app.reintentar-envio")}</button></> }] : []),
        ...(audioMessage && !muted && musicVolume > 0 ? [{ id: `musica:${audioMessage}`, clase: "audio-warning", rol: "status" as const, contenido: audioMessage }] : []),
      ]} />
      {screen === "home" && <PantallaInicio albumFound={albumFound} albumTotal={albumStickers.length} knownBosses={knownBosses} jefesTotal={bossLevels.length} muted={muted}
        partidaEmpezada={progress.unlocked > 0} secretUnlocked={progress.secretUnlocked} saveError={saveError} completedLevels={completedLevels} campaignLevelCount={campaignLevelCount}
        onJugar={() => void requestAdventure(() => setScreen("map"))} onAyuda={() => setShowHelp(true)} onColeccion={openCollection} onSonido={alternarSonido}
        onAjustes={() => setShowSettings(true)} onTablon={openRanking} onCreditos={() => setShowCredits(true)} />}

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
              <button className="album-button" type="button" onClick={() => setShowSettings(true)}>{t("mapa.ajustes")}</button>
              <button className="album-button" type="button" onClick={openRanking}>{t("adultos.app.tablon")}</button>
              <button className="text-button reset-button" type="button" onClick={resetProgress}>{t("mapa.borrarProgreso")}</button>
            </div>}
          </header>
          <Suspense fallback={<p className="lazy-loading" role="status"><Texto clave="partida.hud.cargando.rotulo" /></p>}>
            <WorldMap key={progress.unlocked === 0 ? "new-adventure" : "adventure"} progress={progress} startingWorld={mapReturnWorld ?? (levelRun > 0 ? displayedLevel.world : undefined)} summaries={worldProgress} isLevelUnlocked={isLevelUnlocked} onBeginLevel={beginLevel} onOpenCatParty={openCatParty} onOpenAvioneta={() => void requestAdventure(() => { setAvionetaGift(false); setPaused(false); setScreen("avioneta"); })} reduceMotion={reduceMotion} onDetourReveal={handleDetourReveal}
              onOpenCasa={funciones.casa && casaAbierta(progress.levelStats) ? () => setScreen("casa") : undefined} menuAdultos={menuMapa} />
          </Suspense>
        </section>
      )}

      {screen === "avioneta" && <Suspense fallback={<p className="lazy-loading" role="status"><Texto clave="partida.hud.cargando.rotulo" /></p>}>
        <AvionetaGame paused={paused} muted={muted} musicVolume={musicVolume / 100} reduceMotion={reduceMotion} gift={avionetaGift}
          bestStars={progress.avioneta?.bestStars ?? 0} playSound={playSound}
          onExit={(stars) => {
            // Rendirse no pierde nada; al cruzar el arcoíris se guarda la mejor marca. El marcador queda abierto en
            // cuanto se vence a la Reina Arcoíris, aunque no se complete el vuelo.
            setProgress((current) => stars === null ? { ...current, avioneta: { bestStars: current.avioneta?.bestStars ?? 0, flown: true } } : recordFlight(current, stars));
            setAvionetaGift(false);
            setPaused(false);
            setScreen("map");
          }} />
      </Suspense>}
      {screen === "casa" && <Suspense fallback={<p className="lazy-loading" role="status"><Texto clave="partida.hud.cargando.rotulo" /></p>}>
        {devPaletas ? <PruebaPaletas /> : <CasaGatitos key={`casa-${casaVersion}`} casa={progress.casa} levelStats={devGatitos ? conMundosCompletos(progress.levelStats, devGatitos) : progress.levelStats}reduceMotion={reduceMotion} muted={muted} effectsVolume={effectsVolume} musicVolume={musicVolume}
          onGuardar={(casa) => setProgress((current) => ({ ...current, casa }))} onAmistad={(kind) => setProgress((current) => addHeart(current, kind))} onSalir={() => setScreen("map")} />}
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
            <GameCanvas key={`game-${activeLevel.id}-${levelRun}`} level={activeLevel} hud={hudEsquinas} running={screen === "game" && !paused} onLoseLife={handleLoseLife} onComplete={handleCanvasComplete} onBossEncounter={handleBossEncounter} onSecretExit={handleSecretExit} onWaterExit={handleWaterExit} onSnapshot={handleSnapshot} onAppleCollected={handleAppleCollected} onShopVisit={handleShopVisit} onShopWin={handleShopWin} onShopActiveChange={setShopActive} onDetourVisit={handleDetourVisit} onDetourComplete={handleDetourComplete} onDetourActiveChange={setActiveDetour} onFriendGreeted={handleFriendGreeted} onReturn={() => setScreen("map")} reduceMotion={reduceMotion} playSound={playSound} />
          </Suspense>}

          {screen === "boss" && activeLevel.boss && <DueloDelGuardian level={{ id: activeLevel.id, boss: activeLevel.boss }} levelRun={levelRun} paused={paused} muted={muted}
            musicVolume={musicVolume} effectsVolume={effectsVolume} reduceMotion={reduceMotion} levelCompleted={Boolean(progress.levelStats[activeLevel.id]?.completed)}
            apples={snapshot.apples} power={snapshot.power} bossReplay={bossReplay} onSpendApple={spendBossApple} onRestartLevel={restartBossLevel}
            onAbandon={abandonBossBattle} onFinishReplay={finishBossReplay} onWin={handleComplete} playSound={playSound} />}

          {screen === "complete" && (
            <Ventana id="complete-title" titulo="ventanas.completada.titulo.rotulo" celebracion esperaMs={500} onClose={() => setScreen("map")}
              botones={<>
                {showCatPartyInvite && <Boton tipo="seguir" clave="ventanas.completada.fiesta.rotulo" data-gamepad-default onClick={openCatParty} />}
                {!showCatPartyInvite && activeLevel.world !== 7 && <Boton tipo="seguir" clave="ventanas.completada.siguiente.rotulo" data-gamepad-default onClick={nextLevel} />}
                {funciones.casa && llegadasPorVer(progress.casa, progress.levelStats).includes(activeLevel.world) && <Boton clave="ventanas.completada.casa.rotulo" onClick={() => setScreen("casa")} />}
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

      {showSettings && <VentanaAjustes musicVolume={musicVolume} effectsVolume={effectsVolume} reduceMotion={reduceMotionAjuste} touchControls={touchControls}
        onMusicVolume={(volumen) => ajustarVolumen("musica", volumen)} onEffectsVolume={(volumen) => ajustarVolumen("efectos", volumen)}
        onReduceMotion={setReduceMotion} onTouchControls={setTouchControls} onClose={() => setShowSettings(false)} />}

      {showHelp && (
        <Ventana id="help-title" titulo="inicio.ayuda.titulo.rotulo" className="ventana-ayuda" onClose={() => setShowHelp(false)}
          botones={<Boton tipo="seguir" clave="inicio.ayuda.lista.rotulo" data-gamepad-default disabled={enrollmentChecking} onClick={() => { setShowHelp(false); void requestAdventure(() => setScreen("map")); }} />}>
          <BotonControl className="ventana-cerrar" pictograma="cerrar" etiqueta="inicio.ayuda.cerrar.oculto" data-gamepad-back onClick={() => setShowHelp(false)} />
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

      {showCredits && (
        <Dialog labelledBy="credits-title" className="game-modal credits-modal" onClose={() => setShowCredits(false)}>
          <button className="modal-close" type="button" data-gamepad-back onClick={() => setShowCredits(false)} aria-label={t("adultos.app.cerrar.oculto")}>×</button>
          <p className="eyebrow">{t("adultos.app.hecho-con-carino")}</p><h2 id="credits-title">{t("adultos.app.creditos")}</h2>
          <p><strong>{t("adultos.app.super-noa")}</strong> {t("adultos.app.es-un-juego-original")}</p>
          <p>{t("adultos.app.personaje-creado-para-este")}</p>
          <p>{t("adultos.app.todas-las-aventuras-tienen")} <a href="https://opengameart.org/content/platformer-chiptunes" target="_blank" rel="noreferrer">{t("adultos.app.platformer-chiptunes")}</a>{t("adultos.app.de-guy-g-gamerson")}</p>
          <p>{t("adultos.app.los-guardianes-finales-y")}</p>
          <button className="pixel-button primary" type="button" onClick={() => setShowCredits(false)}>{t("adultos.app.cerrar-2")}</button>
        </Dialog>
      )}

      {showAlbum && <VentanaAlbum progress={progress} collectionTab={collectionTab} albumStickers={albumStickers} albumHints={albumHints} setAlbumHints={setAlbumHints}
        bossLevels={bossLevels} knownBosses={knownBosses} worldProgress={worldProgress} onTab={setCollectionTab} onReplayBoss={replayBoss}
        onHeart={(kind) => setProgress((current) => addHeart(current, kind))} onClose={() => setShowAlbum(false)} />}
      {showRanking && <VentanaTablon enrollmentRequired={enrollmentRequired} enrollmentStorageBlocked={enrollmentStorageBlocked} rankingDevice={rankingDevice}
        rankingAlias={rankingAlias} rankingAliasRef={rankingAliasRef} rankingJoining={rankingJoining} rankingSyncState={rankingSyncState} rankingSyncMessage={rankingSyncMessage}
        rankingMessage={rankingMessage} rankingPlayers={rankingPlayers} rankingLoading={rankingLoading} campaignLevelCount={campaignLevelCount}
        onAliasChange={setRankingAlias} onJoin={() => void joinRanking()} onDefer={deferEnrollment} onRefresh={() => void refreshRanking()} onClose={() => setShowRanking(false)} />}
    </main>
  );
}
