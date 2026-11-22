import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { CAT_PARTY_LEVEL_ID } from "./game/catPartyNivel";
import { busDeZona, contextoAudio, pistaDeMusica, vigilarAudio } from "./game/audio";
import { Dialog } from "./game/Dialog";
import { bossCatalog } from "./game/bosses";
import { isGuardianGameId } from "./game/guardianGames";
import { GameAssetIcon } from "./game/GameAssetIcon";
import { PixelIcon } from "./game/PixelIcon";
import type { SoundKind } from "./game/GameCanvas";
import { nivelesCampana as levels, type NivelResumen } from "./game/nivelesIndice";
import { campaignLevels, campaignUnlockIndex, levelIndex, nextLevelIndex } from "./game/routes";
import { testScreens } from "./game/testScreens";

/** Solo en desarrollo: `?prueba=salas` abre una pantalla de prueba de los motores de formato y `?prueba=12-2`, una
 * pantalla de la campaña, para revisarlas sin recorrer el mapa. */
const devTestName = import.meta.env.DEV ? new URLSearchParams(window.location.search).get("prueba") ?? "" : "";
/** En desarrollo, `?prueba=<pantalla>&duelo` abre directamente el duelo del guardián de esa pantalla, `?prueba=fiesta` la fiesta de los gatitos y `?prueba=casa` la casa de los gatitos (con `&paletas`, las paletas de sus gatitos). */
const devDuel = import.meta.env.DEV && new URLSearchParams(window.location.search).has("duelo");
const devTestLevel = devTestName ? testScreens[devTestName] ?? [...levels, ...detourLevels, ...restStopLevels].find((level) => level.id === devTestName) : undefined;
import { getStickerSprite, stickerCatalog } from "./game/stickers";
import { firstConnectedGamepad } from "./game/gamepad";
import { menuDirection, readMenuPad } from "./game/menuGamepad";
import { createMusicPlayer, musicTracks } from "./game/music";
import { getLevelObjectives } from "./game/levelObjectives";
import { collectLifetimeApples, completeSecretShop, lifetimeApples, progressMilestone, readProgress, resetCampaignProgress, saveProgress, visitSecretShop, type Progress } from "./game/progress";
import { readSavedPercentage, readStorage, writeStorage } from "./game/storage";
import { worldArtwork, worldCatalog, type WorldId } from "./game/worldMapData";
import { checkRankingAvailability, loadRanking, rankingConnectionMessage, readRankingDevice, registerRankingDevice, syncRanking, type RankingDevice, type RankingPlayer } from "./game/ranking";
import { createEnrollmentRecovery, ENROLLMENT_RETRY_MS, enrollmentFailure, isEnrolled, safeEnrollmentMoment } from "./game/rankingOnboarding";
import type { GameSnapshot, Level } from "./game/types";
import type { DetourId } from "./game/types";
import { detourLevel, detourLevels } from "./game/detours";
import { restStopFor, restStopIndex, restStopResumenes as restStopLevels, restStopUnlocked } from "./game/restStops";
import { greetFriend, visitRestStop } from "./game/restStopProgress";
import { addHeart } from "./game/friendProgress";
import { funciones } from "./game/funciones";
import { casaAbierta, llegadasPorVer } from "./game/casaRescate";
import { recordFlight } from "./game/avioneta";
import { puntos, sinPictogramas, t } from "./textos";
import { Boton, BotonControl, PalabraConDibujo, Pictograma, Texto } from "./textos/Texto";
import { Medalla, Ventana } from "./game/Ventana";
const AvionetaGame = lazy(() => import("./game/AvionetaGame").then((module) => ({ default: module.AvionetaGame })));
import { visitDetour } from "./game/detourProgress";

// La pestaña Amigos (que arrastra rendering.ts) y las fotos de la casa van en su propio bloque; se precargan en reposo
// desde el mapa para que el álbum las abra sin espera.
const cargarFriendsTab = () => import("./game/FriendsTab");
const cargarFotosCasa = () => import("./game/FotosCasa");
const FriendsTab = lazy(() => cargarFriendsTab().then((module) => ({ default: module.FriendsTab })));
const FotosCasa = lazy(() => cargarFotosCasa().then((module) => ({ default: module.FotosCasa })));
const WorldMap = lazy(() => import("./game/WorldMap").then((module) => ({ default: module.WorldMap })));
// La partida recibe el resumen de la pantalla y busca su geometría completa en un bloque que se carga con ella.
const GameCanvas = lazy(() => Promise.all([import("./game/GameCanvas"), import("./game/nivelCompleto")]).then(([juego, niveles]) => ({
  default: function GameCanvasConNivel({ level, ...props }: Omit<ComponentProps<typeof juego.GameCanvas>, "level"> & { level: NivelResumen | Level }) {
    return <juego.GameCanvas {...props} level={niveles.nivelCompleto(level)} />;
  },
})));
const BossBattle = lazy(() => import("./game/BossBattle").then((module) => ({ default: module.BossBattle })));
const GuardianMiniGame = lazy(() => import("./game/GuardianMiniGame").then((module) => ({ default: module.GuardianMiniGame })));
const ArmoniaDrumGame = lazy(() => import("./game/ArmoniaDrumGame").then((module) => ({ default: module.ArmoniaDrumGame })));
const MeriendaJabatosGame = lazy(() => import("./game/MeriendaJabatosGame").then((module) => ({ default: module.MeriendaJabatosGame })));
const BeeNinjaGame = lazy(() => import("./game/BeeNinjaGame").then((module) => ({ default: module.BeeNinjaGame })));
const CasaGatitos = lazy(() => import("./game/CasaGatitos").then((module) => ({ default: module.CasaGatitos })));
const PruebaPaletas = lazy(() => import("./game/PruebaPaletas").then((module) => ({ default: module.PruebaPaletas })));
/** En desarrollo, `?prueba=casa&paletas` enseña los gatitos de la casa con su paleta, en vez de la casa. */
const devPaletas = import.meta.env.DEV && new URLSearchParams(window.location.search).has("paletas");
const CatParty = lazy(() => import("./game/CatPartyGame").then((module) => ({ default: module.CatParty })));
const SantaBossBattle = lazy(() => import("./game/SantaBossBattle").then((module) => ({ default: module.SantaBossBattle })));

const MUSIC_VOLUME_KEY = "super-noa-music-volume";
const EFFECTS_VOLUME_KEY = "super-noa-effects-volume";

type Screen = "home" | "map" | "game" | "boss" | "complete" | "gameover" | "finished" | "secret-transition" | "cat-party" | "avioneta" | "casa";
const isTimedScreen = (screen: Screen) => screen === "game" || screen === "boss" || screen === "secret-transition" || screen === "cat-party" || screen === "avioneta";

type CollectionTab = "stickers" | "bosses" | "memories" | "friends" | "photos";
type TouchControlsMode = "auto" | "always";

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
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(() => readStorage("super-noa-muted") === "true");
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
  const [collectionTab, setCollectionTab] = useState<CollectionTab>("stickers");
  const [albumHints, setAlbumHints] = useState<string[]>([]);
  const [musicVolume, setMusicVolume] = useState(() => readSavedPercentage(MUSIC_VOLUME_KEY, 100));
  const [effectsVolume, setEffectsVolume] = useState(() => readSavedPercentage(EFFECTS_VOLUME_KEY, 100));
  const [reduceMotion, setReduceMotion] = useState(() => readStorage("super-noa-reduce-motion") === "true");
  const [touchControls, setTouchControls] = useState<TouchControlsMode>(() => readStorage("super-noa-touch-controls") === "always" ? "always" : "auto");
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
    const precargar = () => { void cargarFriendsTab().catch(() => {}); void cargarFotosCasa().catch(() => {}); };
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

  useEffect(() => {
    const saved = saveProgress(progress);
    const timeout = window.setTimeout(() => setSaveError(!saved), 0);
    return () => window.clearTimeout(timeout);
  }, [progress]);

  useEffect(() => {
    if (!rankingDevice || rankingDevice.registrationPending) return;
    let cancelled = false;
    let attempt = 0;
    const publish = async () => {
      const currentAttempt = ++attempt;
      setRankingSyncState("syncing");
      try {
        await syncRanking(rankingDevice, progress);
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
  }, [progress, rankingDevice, rankingRetry]);

  useEffect(() => {
    writeStorage("super-noa-muted", String(muted));
  }, [muted]);

  useEffect(() => {
    writeStorage(MUSIC_VOLUME_KEY, String(musicVolume));
    writeStorage(EFFECTS_VOLUME_KEY, String(effectsVolume));
    writeStorage("super-noa-reduce-motion", String(reduceMotion));
    writeStorage("super-noa-touch-controls", touchControls);
  }, [effectsVolume, musicVolume, reduceMotion, touchControls]);

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
    const playing = (screen === "game" || screen === "boss") && !beeNinjaDuel && !armoniaDrumDuel && !meriendaDuel && !shopActive && !paused && !muted && musicVolume > 0;
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
            if (selected.id === "music-volume") {
              writeStorage(`${MUSIC_VOLUME_KEY}-configured`, "true");
              setMusicVolume(value);
            } else if (selected.id === "effects-volume") {
              writeStorage(`${EFFECTS_VOLUME_KEY}-configured`, "true");
              setEffectsVolume(value);
            }
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
  }, [screen, paused, showSettings, showHelp, showCredits, showAlbum]);

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
  /** HUD de esquinas sobre el escenario (decisión «El HUD de la partida»): vidas y contadores a la izquierda, pantalla y banderas en el centro y la pausa a la derecha. */
  const hudEsquinas = !bossReplay && <div className="hud-esquinas">
    <div className="hud-izquierda">
      <span className="hud-chip hud-vidas" role="img" aria-label={t("partida.hud.vidas.oculto", { n: lives })}>{Array.from({ length: MAX_LIVES }, (_, vida) => <GameAssetIcon key={vida} kind="heart" className={vida < lives ? "" : "vida-perdida"} />)}</span>
      <span className="hud-contadores">
        <span className="hud-chip" role="img" aria-label={t("partida.hud.manzanas.oculto", { n: snapshot.apples })}><GameAssetIcon kind="apple" /> {snapshot.apples}</span>
        <span className="hud-chip" role="img" aria-label={t("partida.hud.pegatinas.oculto", { n: snapshot.stickers.length })}><Pictograma nombre="pegatina" />{snapshot.stickers.length}</span>
        {(starActive || snapshot.power === "cat" || snapshot.power === "apple") && <span className={`hud-chip power-chip power-${snapshot.power} ${starActive ? "star-power-chip" : ""}`} role="img" aria-label={t(starActive ? "partida.hud.poder.estrella.oculto" : snapshot.power === "cat" ? "partida.hud.poder.gata.oculto" : "partida.hud.poder.manzana.oculto")}><Texto clave={starActive ? "partida.hud.poder.estrella.rotulo" : snapshot.power === "cat" ? "partida.hud.poder.gata.rotulo" : "partida.hud.poder.manzana.rotulo"} /></span>}
      </span>
    </div>
    <div className="hud-centro">
      {displayedLevel.detour ? <span className="hud-chip hud-pantalla"><Texto clave="partida.hud.secreto.rotulo" /></span>
        : displayedLevel.restStop ? <span className="hud-chip hud-pantalla"><Texto clave="partida.hud.paseo.rotulo" /></span>
          : <span className="hud-chip hud-pantalla">{displayedLevel.id}</span>}
      {!displayedLevel.detour && !displayedLevel.restStop && <span className="hud-chip hud-banderas" role="img" aria-label={displayedLevel.puzzleRooms
        ? t("partida.hud.salas.oculto", { n: snapshot.checkpoint + 1, total: displayedLevel.puzzleRooms.length })
        : t("partida.hud.banderas.oculto", { n: snapshot.checkpoint, total: displayedLevel.verticalCheckpoints?.length ?? displayedLevel.checkpoints.length })}>
        {displayedLevel.puzzleRooms ? <Texto clave="partida.hud.sala.rotulo" variables={{ puntos: puntos(snapshot.checkpoint + 1, displayedLevel.puzzleRooms.length) }} /> : <Texto clave="partida.hud.bandera.rotulo" variables={{ puntos: puntos(snapshot.checkpoint, displayedLevel.verticalCheckpoints?.length ?? displayedLevel.checkpoints.length) }} />}
      </span>}
    </div>
    <div className="hud-derecha">
      {(screen === "game" || screen === "boss") && <BotonControl className="hud-pausa" pictograma="pausa" etiqueta="partida.hud.pausa.oculto" onClick={() => setPaused((value) => !value)} />}
    </div>
  </div>;

  return (
    <main className={`app-shell ${reduceMotion ? "reduce-motion" : ""} ${touchControls === "always" ? "touch-controls-always" : ""}`}>
      {saveError && <p className="save-warning" role="alert">{t("adultos.app.no-se-pudo-guardar")}</p>}
      {enrollmentChecking && <p className="ranking-sync-warning" role="status">{t("adultos.app.conectando-el-tablon-en")}</p>}
      {enrollmentMessage && <p className="ranking-sync-warning" role="status">{enrollmentMessage}</p>}
      {rankingDevice && rankingSyncState === "pending" && <p className="ranking-sync-warning" role="status">{t("adultos.app.tus-logros-del-tablon")} {rankingSyncMessage} {saveError ? t("adultos.app.puedes-seguir-jugando-aunque") : t("adultos.app.tu-partida-sigue-guardada")} <button type="button" onClick={() => setRankingRetry((current) => current + 1)}>{t("adultos.app.reintentar-envio")}</button></p>}
      {audioMessage && !muted && musicVolume > 0 && <p className="audio-warning" role="status">{audioMessage}</p>}
      {screen === "home" && (
        <section className="home-screen" aria-labelledby="game-title">
          <div className="home-copy">
            <h1 id="game-title" className="inicio-titulo"><span><Texto clave="inicio.titulo.super.rotulo" /></span> <Texto clave="inicio.titulo.noa.rotulo" /></h1>
            <div className="rotulo-con-frase inicio-lema"><p className="texto-noa"><Texto clave="inicio.corre.rotulo" /></p><p className="juntos">{t("inicio.corre.juntos")}</p></div>
            <div className="rotulo-con-frase inicio-novedades"><p className="texto-noa pequeno"><Texto clave="inicio.mundosNuevos.rotulo" /></p><p className="juntos">{t("inicio.mundosNuevos.juntos")}</p></div>
            <div className="home-actions">
              <Boton tipo="jugar" className="home-play" clave="inicio.jugar.rotulo" data-gamepad-default onClick={() => void requestAdventure(() => setScreen("map"))} />
              <Boton clave="inicio.comoSeJuega.rotulo" onClick={() => setShowHelp(true)} />
            </div>
          </div>
          <div className="inicio-arte">
            <div className="hero-scene" aria-hidden="true">
              <img className="hero-backdrop" src={"./assets/home-adventure-v3.webp"} alt="" />
            </div>
            <div className="inicio-baldosas">
              <button type="button" className="baldosa" aria-label={t("inicio.album.oculto", { n: albumFound, total: albumStickers.length })} onClick={() => openCollection("stickers")}><span className="texto-noa pictograma-doble"><Texto clave="inicio.album.rotulo" /></span><span className="baldosa-cuenta">{albumFound}/{albumStickers.length}</span></button>
              <button type="button" className="baldosa" aria-label={t("inicio.jefes.oculto", { n: knownBosses, total: bossLevels.length })} onClick={() => openCollection("bosses")}><span className="texto-noa pictograma-doble"><Texto clave="inicio.jefes.rotulo" /></span><span className="baldosa-cuenta">{knownBosses}/{bossLevels.length}</span></button>
            </div>
          </div>
          <BotonControl className="inicio-sonido" pictograma={muted ? "sin-sonido" : "sonido"} etiqueta={muted ? "partida.hud.sonido.oculto" : "partida.hud.silencio.oculto"} aria-pressed={!muted} onClick={() => setMuted((value) => !value)} />
          <nav className="inicio-adultos" aria-label={t("inicio.opciones.oculto")}>
            {progress.unlocked > 0 && !saveError && <span>{t(progress.secretUnlocked ? "inicio.partidaGuardadaConSecreto" : "inicio.partidaGuardada", { hechas: completedLevels, total: campaignLevelCount })}</span>}
            <button type="button" onClick={() => setShowSettings(true)}>{t("adultos.app.ajustes")}</button>
            <button type="button" onClick={openRanking}>{t("adultos.app.tablon-mundial")}</button>
            <button type="button" onClick={() => setShowCredits(true)}>{t("adultos.app.creditos")}</button>
          </nav>
        </section>
      )}

      {screen === "map" && (
        <section className="map-screen">
          <header className="map-header">
            <div><h2 className="rotulo"><Texto clave="mapa.cabecera.rotulo" /></h2><p className="eyebrow juntos">{t("mapa.cabecera.juntos")}</p></div>
            <div className="map-actions">
              <span className="apple-total"><GameAssetIcon kind="apple" /> {totalApples}</span>
              <button className="album-button" type="button" onClick={() => openCollection("stickers")} aria-label={t("mapa.abrirAlbum.oculto")}><PixelIcon kind="sparkle" /> {progress.stickers.filter((id) => albumStickers.some((sticker) => sticker.id === id)).length}/{albumStickers.length}</button>
              <button className="album-button" type="button" onClick={() => openCollection("bosses")} aria-label={t("mapa.abrirJefes.oculto")}>★ {knownBosses}/{bossLevels.length}</button>
              <button className="album-button" type="button" onClick={openRanking}>{t("adultos.app.tablon")}</button>
              <button className="icon-button" type="button" onClick={() => setShowSettings(true)} aria-label={t("mapa.abrirAjustes.oculto")}>⚙</button>
              <button className="icon-button" type="button" data-gamepad-back onClick={() => setScreen("home")} aria-label={t("mapa.volverInicio.oculto")}>⌂</button>
            </div>
          </header>
          <Suspense fallback={<p className="lazy-loading" role="status"><Texto clave="partida.hud.cargando.rotulo" /></p>}>
            <WorldMap key={progress.unlocked === 0 ? "new-adventure" : "adventure"} progress={progress} startingWorld={mapReturnWorld ?? (levelRun > 0 ? displayedLevel.world : undefined)} summaries={worldProgress} isLevelUnlocked={isLevelUnlocked} onBeginLevel={beginLevel} onOpenCatParty={openCatParty} onOpenAvioneta={() => void requestAdventure(() => { setAvionetaGift(false); setPaused(false); setScreen("avioneta"); })} reduceMotion={reduceMotion} onDetourReveal={handleDetourReveal}
              onOpenCasa={funciones.casa && casaAbierta(progress.levelStats) ? () => setScreen("casa") : undefined} />
          </Suspense>
          <button className="text-button reset-button" type="button" onClick={resetProgress}>{t("mapa.borrarProgreso")}</button>
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
        {devPaletas ? <PruebaPaletas /> : <CasaGatitos casa={progress.casa} levelStats={progress.levelStats} reduceMotion={reduceMotion} muted={muted} effectsVolume={effectsVolume} musicVolume={musicVolume}
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

          {screen === "boss" && activeLevel.boss && <Suspense fallback={<p className="lazy-loading lazy-loading-game" role="status"><Texto clave="partida.hud.cargando.rotulo" /></p>}>
            {
            (activeLevel.boss === "santa-claus" || activeLevel.boss === "siroco" || activeLevel.boss === "don-silbato") ? <SantaBossBattle
              key={`santa-boss-${activeLevel.id}-${levelRun}`}
              bossId={activeLevel.boss}
              paused={paused} apples={snapshot.apples} onSpendApple={spendBossApple} onRestartLevel={restartBossLevel}
              onAbandon={abandonBossBattle} onWin={handleComplete} playSound={playSound}
            /> : activeLevel.boss === "queen-bee" ? <BeeNinjaGame
              key={`bee-ninja-${activeLevel.id}-${levelRun}`}
              paused={paused}
              muted={muted}
              musicVolume={musicVolume}
              effectsVolume={effectsVolume}
              reduceMotion={reduceMotion}
              levelCompleted={Boolean(progress.levelStats[activeLevel.id]?.completed)}
              onAbandon={bossReplay ? finishBossReplay : abandonBossBattle}
              onWin={bossReplay ? finishBossReplay : handleComplete}
              playSound={playSound}
              friendlyReplay={bossReplay}
            /> : activeLevel.boss === "maestra-armonia" ? <ArmoniaDrumGame
              key={`armonia-drum-${activeLevel.id}-${levelRun}`}
              paused={paused}
              muted={muted}
              musicVolume={musicVolume}
              effectsVolume={effectsVolume}
              reduceMotion={reduceMotion}
              levelCompleted={Boolean(progress.levelStats[activeLevel.id]?.completed)}
              onAbandon={bossReplay ? finishBossReplay : abandonBossBattle}
              onWin={bossReplay ? finishBossReplay : handleComplete}
              playSound={playSound}
              friendlyReplay={bossReplay}
            /> : activeLevel.boss === "great-boar" ? <MeriendaJabatosGame
              key={`merienda-jabatos-${activeLevel.id}-${levelRun}`}
              paused={paused}
              muted={muted}
              musicVolume={musicVolume}
              effectsVolume={effectsVolume}
              reduceMotion={reduceMotion}
              levelCompleted={Boolean(progress.levelStats[activeLevel.id]?.completed)}
              onAbandon={bossReplay ? finishBossReplay : abandonBossBattle}
              onWin={bossReplay ? finishBossReplay : handleComplete}
              playSound={playSound}
              friendlyReplay={bossReplay}
            /> : isGuardianGameId(activeLevel.boss) ? <GuardianMiniGame
              key={`guardian-game-${activeLevel.id}-${levelRun}`}
              bossId={activeLevel.boss}
              paused={paused}
              apples={bossReplay ? 0 : snapshot.apples}
              protectedByApple={!bossReplay && snapshot.power === "apple"}
              onSpendApple={spendBossApple}
              onRestartLevel={restartBossLevel}
              onAbandon={bossReplay ? finishBossReplay : abandonBossBattle}
              onWin={bossReplay ? finishBossReplay : handleComplete}
              playSound={playSound}
              friendlyReplay={bossReplay}
            /> : <BossBattle
              key={`boss-${activeLevel.id}-${levelRun}`}
              bossId={activeLevel.boss}
              paused={paused}
              apples={bossReplay ? 0 : snapshot.apples}
              protectedByApple={!bossReplay && snapshot.power === "apple"}
              onSpendApple={spendBossApple}
              onRestartLevel={restartBossLevel}
              onAbandon={bossReplay ? finishBossReplay : abandonBossBattle}
              onWin={bossReplay ? finishBossReplay : handleComplete}
              playSound={playSound}
              friendlyReplay={bossReplay}
            />}
          </Suspense>}

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
              <BotonControl pictograma={muted ? "sin-sonido" : "sonido"} etiqueta={muted ? "partida.hud.sonido.oculto" : "partida.hud.silencio.oculto"} aria-pressed={!muted} onClick={() => setMuted((value) => !value)} />
              <BotonControl pictograma="pantalla-grande" etiqueta="partida.hud.pantallaGrande.oculto" onClick={toggleFullscreen} />
            </div>
          </>} />
      )}

      {showSettings && (
        <Dialog labelledBy="settings-title" className="game-modal settings-modal" onClose={() => setShowSettings(false)}>
          <button className="modal-close" type="button" data-gamepad-back onClick={() => setShowSettings(false)} aria-label={t("adultos.app.cerrar.oculto")}>×</button>
          <p className="eyebrow">{t("adultos.app.a-tu-manera")}</p><h2 id="settings-title">{t("adultos.app.ajustes-de-juego")}</h2>
          <p>{t("adultos.app.estos-ajustes-se-guardan")}</p>
          <div className="settings-group">
            <label htmlFor="music-volume">{t("adultos.app.musica")} <output>{Math.round(musicVolume)}%</output></label>
            <input id="music-volume" type="range" min="0" max="100" value={musicVolume} onChange={(event) => { writeStorage(`${MUSIC_VOLUME_KEY}-configured`, "true"); setMusicVolume(Number(event.target.value)); }} />
            <label htmlFor="effects-volume">{t("adultos.app.efectos")} <output>{Math.round(effectsVolume)}%</output></label>
            <input id="effects-volume" type="range" min="0" max="100" value={effectsVolume} onChange={(event) => { writeStorage(`${EFFECTS_VOLUME_KEY}-configured`, "true"); setEffectsVolume(Number(event.target.value)); }} />
          </div>
          <div className="settings-toggle"><input id="reduce-motion" type="checkbox" checked={reduceMotion} onChange={(event) => setReduceMotion(event.target.checked)} /><label htmlFor="reduce-motion"><strong>{t("adultos.app.movimiento-tranquilo")}</strong><small>{t("adultos.app.reduce-destellos-y-animaciones")}</small></label></div>
          <fieldset className="settings-controls"><legend>{t("adultos.app.controles-tactiles")}</legend>
            <label><input type="radio" name="touch-controls" checked={touchControls === "auto"} onChange={() => setTouchControls("auto")} /> {t("adultos.app.automaticos-en-movil")}</label>
            <label><input type="radio" name="touch-controls" checked={touchControls === "always"} onChange={() => setTouchControls("always")} /> {t("adultos.app.siempre-visibles")}</label>
          </fieldset>
          <p className="settings-help"><strong>{t("adultos.app.teclado")}</strong> {t("adultos.app.flechas-o-a-d")} <strong>{t("adultos.app.mando")}</strong> {t("adultos.app.cruceta-o-palanca-para")}</p>
          <button className="pixel-button primary" type="button" onClick={() => setShowSettings(false)}>{t("adultos.app.listo")}</button>
        </Dialog>
      )}

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

      {showAlbum && (
        <Dialog labelledBy="album-title" className="game-modal album-modal ventana-coleccion" onClose={() => setShowAlbum(false)}>
          <BotonControl className="ventana-cerrar" pictograma="cerrar" etiqueta="coleccion.cerrar.oculto" data-gamepad-back onClick={() => setShowAlbum(false)} />
          <h2 id="album-title" className="ventana-cinta texto-noa titulo pictograma-doble"><Texto clave={collectionTab === "stickers" ? "coleccion.titulo.pegatinas.rotulo" : collectionTab === "bosses" ? "coleccion.titulo.jefes.rotulo" : collectionTab === "friends" ? "coleccion.titulo.amigos.rotulo" : collectionTab === "photos" ? "coleccion.titulo.fotos.rotulo" : "coleccion.titulo.postales.rotulo"} /></h2>
          <div className="collection-tabs" aria-label={t("coleccion.grupo.oculto")}>
            <button className={`pestana texto-noa ${collectionTab === "stickers" ? "is-active" : ""}`} type="button" aria-pressed={collectionTab === "stickers"} aria-label={sinPictogramas(t("coleccion.pestana.pegatinas.rotulo"))} onClick={() => setCollectionTab("stickers")}><PalabraConDibujo clave="coleccion.pestana.pegatinas.rotulo" /></button>
            <button className={`pestana texto-noa ${collectionTab === "bosses" ? "is-active" : ""}`} type="button" aria-pressed={collectionTab === "bosses"} aria-label={sinPictogramas(t("coleccion.pestana.jefes.rotulo"))} onClick={() => setCollectionTab("bosses")}><PalabraConDibujo clave="coleccion.pestana.jefes.rotulo" /></button>
            {funciones.amigos && <button className={`pestana texto-noa ${collectionTab === "friends" ? "is-active" : ""}`} type="button" aria-pressed={collectionTab === "friends"} aria-label={sinPictogramas(t("coleccion.pestana.amigos.rotulo"))} onClick={() => setCollectionTab("friends")}><PalabraConDibujo clave="coleccion.pestana.amigos.rotulo" /></button>}
            <button className={`pestana texto-noa ${collectionTab === "memories" ? "is-active" : ""}`} type="button" aria-pressed={collectionTab === "memories"} aria-label={sinPictogramas(t("coleccion.pestana.postales.rotulo"))} onClick={() => setCollectionTab("memories")}><PalabraConDibujo clave="coleccion.pestana.postales.rotulo" /></button>
            {funciones.casa && progress.casa && <button className={`pestana texto-noa ${collectionTab === "photos" ? "is-active" : ""}`} type="button" aria-pressed={collectionTab === "photos"} aria-label={sinPictogramas(t("coleccion.pestana.fotos.rotulo"))} onClick={() => setCollectionTab("photos")}><PalabraConDibujo clave="coleccion.pestana.fotos.rotulo" /></button>}
          </div>
          {collectionTab === "photos" ? <Suspense fallback={<p className="lazy-loading" role="status"><Texto clave="partida.hud.cargando.rotulo" /></p>}><FotosCasa fotos={progress.casa?.fotos ?? []} /></Suspense> : funciones.amigos && collectionTab === "friends" ? <Suspense fallback={<p className="lazy-loading" role="status"><Texto clave="partida.hud.cargando.rotulo" /></p>}><FriendsTab progress={progress} onHeart={(kind) => setProgress((current) => addHeart(current, kind))} /></Suspense> : collectionTab === "stickers" ? <>
            <p className="juntos">{t(progress.secretUnlocked ? "coleccion.pegatinas.introConSecreto.juntos" : "coleccion.pegatinas.introSinSecreto.juntos")}</p>
            <div className="sticker-grid">
              {albumStickers.map((sticker) => {
                const found = progress.stickers.includes(sticker.id);
                const sprite = getStickerSprite(sticker.id);
                const stickerLevel = levels.find((level) => level.items.some((item) => item.id === sticker.id));
                const available = stickerLevel && getLevelObjectives(stickerLevel, progress).available;
                const hintVisible = albumHints.includes(sticker.id);
                return (
                  <article className={`sticker-card ${found ? "is-found" : "is-locked"}`} key={sticker.id}>
                    <span className="sticker-frame" aria-hidden="true">{found && sprite ? <span className="sticker-sprite" style={{ backgroundImage: `url(${sprite.src})`, backgroundPosition: `${sprite.column * 50}% center` }} /> : "?"}</span>
                    <strong className="texto-noa pequeno">{found ? sticker.name : <Texto clave="mapa.mundo.numero.rotulo" variables={{ n: sticker.world }} />}</strong>
                    <small>{stickerLevel ? stickerLevel.id : ""} · <Texto clave={found ? "coleccion.pegatinas.encontrada.rotulo" : "coleccion.pegatinas.pendiente.rotulo"} /></small>
                    {!found && available && <><button className="level-hint-toggle" type="button" aria-expanded={hintVisible} aria-controls={`album-hint-${sticker.id}`} onClick={() => setAlbumHints((current) => hintVisible ? current.filter((id) => id !== sticker.id) : [...current, sticker.id])}><Texto clave="coleccion.pegatinas.pista.rotulo" /></button><p className="album-sticker-hint" id={`album-hint-${sticker.id}`} hidden={!hintVisible}>{sticker.hint}</p></>}
                    {!found && !available && <small><Texto clave="coleccion.pegatinas.abrirPantalla.rotulo" /> <span className="juntos">{t("coleccion.pegatinas.abrirPantalla.juntos")}</span></small>}
                  </article>
                );
              })}
            </div>
            <p className="album-progress texto-noa pequeno" aria-label={t("coleccion.pegatinas.progreso.oculto", { n: progress.stickers.filter((id) => albumStickers.some((sticker) => sticker.id === id)).length, total: albumStickers.length })}><Texto clave="coleccion.pegatinas.progreso.rotulo" variables={{ n: progress.stickers.filter((id) => albumStickers.some((sticker) => sticker.id === id)).length, total: albumStickers.length }} /></p>
          </> : collectionTab === "bosses" ? <>
            <p className="juntos">{t("coleccion.jefes.intro.juntos")}</p>
            <div className="boss-friends-grid">
              {bossLevels.map(({ level, index, boss }) => {
                const known = Boolean(progress.levelStats[level.id]?.completed);
                const challengeDone = Boolean(progress.bossChallenges[level.boss ?? ""]);
                return (
                  <article className={`boss-friend-card ${known ? "is-friend" : "is-mystery"} ${challengeDone ? "has-challenge-frame" : ""}`} key={level.id}>
                    <span className="boss-friend-world">{level.world === 7 ? (progress.secretUnlocked ? <Texto clave="mapa.mundo.secreto.rotulo" /> : <Texto clave="coleccion.jefes.misterioso.rotulo" />) : level.world === 8 ? <Texto clave="mapa.mundo.agua.rotulo" /> : <Texto clave="mapa.mundo.numero.rotulo" variables={{ n: level.world }} />}</span>
                    <div className="boss-friend-portrait" aria-hidden="true">
                      {known ? boss.assetAtlas
                        ? <span className={`boss-friend-atlas ${level.boss === "santa-claus" ? "boss-friend-atlas-santa" : ""}`} style={{ backgroundImage: `url("${boss.assetAtlas}")` }} />
                        : <img src={`${boss.assetPrefix}-0.webp`} alt="" />
                        : <span className="boss-mystery-shape">?</span>}
                    </div>
                    <strong className="texto-noa pequeno" aria-label={known ? undefined : t("coleccion.jefes.porDescubrir.oculto")}>{known ? boss.name : <Texto clave="coleccion.jefes.porDescubrir.rotulo" />}</strong>
                    {known ? <>{challengeDone ? <small className="challenge-frame-label"><Texto clave="coleccion.jefes.marco.rotulo" /></small> : <small><Texto clave="coleccion.jefes.retoPendiente.rotulo" /> {boss.challenge.label}</small>}<Boton tipo="seguir" className="boton-pequeno" clave="coleccion.jefes.jugarOtraVez.rotulo" onClick={() => replayBoss(index)} /></> : <small className="juntos">{t("coleccion.jefes.conocer.juntos")}</small>}
                  </article>
                );
              })}
            </div>
            <p className="album-progress texto-noa pequeno" aria-label={t("coleccion.jefes.progreso.oculto", { n: knownBosses, total: bossLevels.length })}><Texto clave="coleccion.jefes.progreso.rotulo" variables={{ n: knownBosses, total: bossLevels.length }} /></p>
          </> : <>
            <p className="juntos">{t("coleccion.postales.intro.juntos")}</p>
            <div className="memory-grid">
              {worldCatalog.map((world) => {
                const memory = worldProgress[world.id];
                return (
                  <article className={`memory-card world-${world.id} ${memory.remembered ? "is-remembered" : "is-locked"}`} key={world.id}>
                    <img className="memory-world-art" src={worldArtwork(world.id)} alt="" aria-hidden="true" />
                    <div className="memory-content">
                      <span>{world.id === 7 ? <Texto clave="mapa.mundo.secreto.rotulo" /> : world.id === 8 ? <Texto clave="mapa.mundo.agua.rotulo" /> : <Texto clave="mapa.mundo.numero.rotulo" variables={{ n: world.id }} />}</span>
                      {memory.remembered ? <><img className="memory-cat" src={world.catAsset} alt={t("coleccion.postales.gatito.oculto", { gato: world.cat, mundo: world.name })} /><strong>{world.cat}</strong><small>{world.name}</small><em aria-label={t("coleccion.postales.medallas.oculto", { n: memory.complete + memory.stickers + memory.flawless })}><Texto clave="coleccion.postales.medallas.rotulo" variables={{ n: memory.complete + memory.stickers + memory.flawless }} /></em></> : <><b className="memory-lock">?</b><strong aria-label={t("coleccion.postales.porDescubrir.oculto")}><Texto clave="coleccion.postales.porDescubrir.rotulo" /></strong><small aria-label={t("mapa.mundo.progreso.oculto", { n: memory.complete, total: memory.total })}><Texto clave="mapa.mundo.progreso.rotulo" variables={{ puntos: puntos(memory.complete, memory.total) }} /></small></>}
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="album-progress texto-noa pequeno" aria-label={t("coleccion.postales.progreso.oculto", { n: Object.values(worldProgress).filter((world) => world.remembered).length, total: worldCatalog.length })}><Texto clave="coleccion.postales.progreso.rotulo" variables={{ n: Object.values(worldProgress).filter((world) => world.remembered).length, total: worldCatalog.length }} /></p>
          </>}
          <Boton tipo="seguir" className="coleccion-seguir" clave="coleccion.seguir.rotulo" onClick={() => setShowAlbum(false)} />
        </Dialog>
      )}
      {showRanking && (
        <Dialog labelledBy="ranking-title" className="game-modal ranking-modal" onClose={enrollmentRequired ? undefined : () => setShowRanking(false)}>
          {!enrollmentRequired && <button className="modal-close" type="button" data-gamepad-back onClick={() => setShowRanking(false)} aria-label={t("adultos.app.cerrar.oculto")}>×</button>}
          <div className="ranking-heading">
            <span className="ranking-trophy" aria-hidden="true">★</span>
            <div><p className="eyebrow">{t("adultos.app.aventureras-y-aventureros")}</p><h2 id="ranking-title">{enrollmentRequired ? t("adultos.app.tu-alias-para-la") : t("adultos.app.tablon-mundial-2")}</h2></div>
          </div>
          {enrollmentRequired && <p>{t("adultos.app.antes-de-jugar-elige")}</p>}
          {!isEnrolled(rankingDevice) ? <form className="ranking-join" onSubmit={(event) => { event.preventDefault(); void joinRanking(); }}><label htmlFor="ranking-alias">{t("adultos.app.tu-alias-de-aventura")}</label><input ref={rankingAliasRef} data-gamepad-default id="ranking-alias" value={rankingDevice?.registrationPending ? rankingDevice.alias : rankingAlias} onChange={(event) => setRankingAlias(event.target.value)} readOnly={Boolean(rankingDevice?.registrationPending)} maxLength={16} disabled={rankingJoining} placeholder={t("adultos.app.por-ejemplo-moche")} autoComplete="off" aria-describedby="ranking-alias-help" /><button className="pixel-button primary" type="submit" disabled={rankingJoining}>{rankingJoining ? t("adultos.app.preparando-tu-tarjeta") : rankingDevice?.registrationPending ? t("adultos.app.reintentar-mi-tarjeta") : enrollmentRequired ? t("adultos.app.guardar-alias-y-jugar") : t("adultos.app.salir-al-tablon")}</button><small id="ranking-alias-help">{t("adultos.app.solo-compartimos-tu-alias")}{rankingDevice?.registrationPending ? t("adultos.app.recuperaremos-tu-tarjeta-pendiente") : ""}</small></form> : <><p className="ranking-welcome">{t("adultos.app.hola")} {rankingDevice!.alias}!</p><p className="ranking-sync-status" role="status">{rankingSyncState === "saved" ? t("adultos.app.tus-logros-ya-estan") : rankingSyncState === "pending" ? t("adultos.app.envio-pendiente-rankingsyncmessage", { rankingSyncMessage }) : t("adultos.app.enviando-tus-logros")}</p></>}
          {rankingMessage && <p className="ranking-message" role="status">{rankingMessage}</p>}
          {enrollmentRequired && enrollmentStorageBlocked && <><p>{t("adultos.app.no-podemos-guardar-tu")}</p><button className="pixel-button" type="button" disabled={rankingJoining} onClick={() => deferEnrollment(t("adultos.app.el-navegador-no-permite"))}>{t("adultos.app.jugar-sin-guardar-tarjeta")}</button></>}
          {!enrollmentRequired && <><ol className="ranking-list">{rankingPlayers.map((player, index) => {
            const position = index + 1;
            const isCurrentPlayer = rankingDevice?.alias.toLocaleLowerCase("es") === player.alias.toLocaleLowerCase("es");
            return <li className={`${position <= 3 ? `ranking-podium ranking-place-${position}` : ""} ${isCurrentPlayer ? "is-current-player" : ""}`} key={`${player.alias}-${index}`}>
              <span className="ranking-position" aria-label={t("adultos.app.puesto-position.oculto", { position })}>{position}</span>
              <div className="ranking-player">
                <div className="ranking-player-name"><strong>{player.alias}</strong>{isCurrentPlayer && <em>{t("adultos.app.tu")}</em>}</div>
                <div className="ranking-stats">{player.campaignWorld != null && player.campaignWorld > 0 && <span>{t("adultos.app.etapa")} {player.campaignWorld}/15</span>}<span>🚩 {player.completedLevels}/{campaignLevelCount} {t("adultos.app.pantallas")}</span><span>★ {player.stickers}{t("adultos.app.51-pegatinas")}</span><span>🤝 {player.bossChallenges}{t("adultos.app.17-retos-de-amistad")}</span><span>🍎 {player.totalApples === null ? t("adultos.app.total-sin-datos") : t("adultos.app.v-en-toda-la", { v: player.totalApples.toLocaleString("es-ES") })}</span><span>{player.achievedAt === null ? t("adultos.app.fecha-del-progreso-sin") : t("adultos.app.progreso-logrado-el-v", { v: new Date(player.achievedAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) })}</span></div>
              </div>
            </li>;
          })}</ol>
          {rankingPlayers.length === 0 && !rankingMessage && <p className="ranking-empty">{t("adultos.app.aun-no-hay-nadie")}</p>}
          <div className="ranking-footer"><button className="pixel-button ranking-refresh" type="button" disabled={rankingLoading} onClick={() => void refreshRanking()}><span aria-hidden="true">↻</span> {rankingLoading ? t("adultos.app.actualizando") : t("adultos.app.actualizar-tablon")}</button></div></>}
        </Dialog>
      )}
    </main>
  );
}
