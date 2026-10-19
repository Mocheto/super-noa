import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BossBattle } from "./game/BossBattle";
import { Dialog } from "./game/Dialog";
import { optimizedAssetSource } from "./game/assets";
import { bossCatalog } from "./game/bosses";
import { GameAssetIcon } from "./game/GameAssetIcon";
import { PixelIcon } from "./game/PixelIcon";
import { WorldMap } from "./game/WorldMap";
import { GameCanvas, type SoundKind } from "./game/GameCanvas";
import { levels, themeNames } from "./game/levels";
import { campaignLevels, campaignUnlockIndex, levelIndex, nextLevelIndex } from "./game/routes";
import { getStickerSprite, stickerCatalog } from "./game/stickers";
import { firstConnectedGamepad } from "./game/gamepad";
import { menuDirection, readMenuPad } from "./game/menuGamepad";
import { createMusicPlayer, musicTracks } from "./game/music";
import { getLevelObjectives } from "./game/levelObjectives";
import { emptyProgress, readProgress, saveProgress, type Progress } from "./game/progress";
import { readSavedPercentage, readStorage, writeStorage } from "./game/storage";
import { worldArtwork, worldCatalog } from "./game/worldMapData";
import { loadRanking, rankingConnectionMessage, readRankingDevice, registerRankingDevice, syncRanking, type RankingDevice, type RankingPlayer } from "./game/ranking";
import type { GameSnapshot } from "./game/types";

const MUSIC_VOLUME_KEY = "super-noa-music-volume";
const EFFECTS_VOLUME_KEY = "super-noa-effects-volume";

type Screen = "home" | "map" | "game" | "boss" | "complete" | "gameover" | "finished" | "secret-transition";
type CollectionTab = "stickers" | "bosses" | "memories";
type TouchControlsMode = "auto" | "always";

const emptySnapshot: GameSnapshot = { apples: 0, stickers: [], power: "normal", checkpoint: 0, paused: false };
const MAX_LIVES = 3;
// Los índices del guardado conservan las 18 pantallas originales y continúan con las nuevas aventuras.
const campaignLevelCount = campaignLevels.length;
const bossLevels = levels.flatMap((level, index) => level.boss ? [{ level, index, boss: bossCatalog[level.boss] }] : []);
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function createAudioContext() {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  return AudioContextClass ? new AudioContextClass() : null;
}

function rankingErrorMessage(error: unknown, fallback: string) {
  return error instanceof TypeError || (error instanceof DOMException && error.name === "TimeoutError")
    ? rankingConnectionMessage
    : error instanceof Error ? error.message : fallback;
}

export default function App() {
  const [progress, setProgress] = useState<Progress>(readProgress);
  const [screen, setScreen] = useState<Screen>("home");
  const [activeIndex, setActiveIndex] = useState(0);
  const [levelRun, setLevelRun] = useState(0);
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
  const [audioMessage, setAudioMessage] = useState("");
  const [collectionTab, setCollectionTab] = useState<CollectionTab>("stickers");
  const [albumHints, setAlbumHints] = useState<string[]>([]);
  const [musicVolume, setMusicVolume] = useState(() => readSavedPercentage(MUSIC_VOLUME_KEY, 100));
  const [effectsVolume, setEffectsVolume] = useState(() => readSavedPercentage(EFFECTS_VOLUME_KEY, 100));
  const [reduceMotion, setReduceMotion] = useState(() => readStorage("super-noa-reduce-motion") === "true");
  const [touchControls, setTouchControls] = useState<TouchControlsMode>(() => readStorage("super-noa-touch-controls") === "always" ? "always" : "auto");
  const [bossReplay, setBossReplay] = useState(false);
  const [bossReplayReturn, setBossReplayReturn] = useState<"home" | "map">("map");
  const [snapshot, setSnapshot] = useState<GameSnapshot>(emptySnapshot);
  const musicRef = useRef<ReturnType<typeof createMusicPlayer> | null>(null);
  const rankingJoiningRef = useRef(false);
  const secretTransitionRef = useRef({ target: -1, remaining: 1800 });
  const audioContextRef = useRef<AudioContext | null>(null);
  const playScreenRef = useRef<HTMLElement | null>(null);
  const activeLevel = levels[activeIndex];

  useEffect(() => {
    const saved = saveProgress(progress);
    const timeout = window.setTimeout(() => setSaveError(!saved), 0);
    return () => window.clearTimeout(timeout);
  }, [progress]);

  useEffect(() => {
    if (!rankingDevice) return;
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
          setRankingSyncMessage(rankingErrorMessage(error, "No pude enviar tus logros."));
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
    musicRef.current ??= createMusicPlayer(
      (source) => new Audio(source),
      (error) => {
        console.warn("No se pudo reproducir la música.", error);
        setAudioMessage("La música no ha podido sonar. Prueba a activar el sonido otra vez.");
      },
      () => setAudioMessage(""),
    );
    musicRef.current.update({
      source: musicTracks[activeLevel.world],
      volume: musicVolume,
      playing: (screen === "game" || screen === "boss") && !paused && !muted && musicVolume > 0,
    });
  }, [activeLevel.world, musicVolume, muted, paused, screen]);

  useEffect(() => () => musicRef.current?.pause(), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.defaultPrevented && event.code === "Escape" && !event.repeat && (screen === "game" || screen === "boss" || screen === "secret-transition")) setPaused((value) => !value);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen]);

  useEffect(() => {
    if (screen !== "game" && screen !== "boss" && screen !== "secret-transition") return;
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
    if (screen !== "game" && screen !== "boss" && screen !== "secret-transition") return;
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
        const container = overlays.item(overlays.length - 1) ?? document.querySelector<HTMLElement>(screen === "home" ? ".home-screen" : ".map-screen");
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
    const audioContext = audioContextRef.current ?? createAudioContext();
    if (!audioContext) return;
    audioContextRef.current = audioContext;
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
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }, [effectsVolume, muted]);

  const totalApples = useMemo(
    () => Object.values(progress.levelStats).reduce((total, stat) => total + (Number(stat.bestApples) || 0), 0),
    [progress.levelStats],
  );
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
      setRankingMessage(rankingErrorMessage(error, "No pude actualizar el tablón."));
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
      const device = await registerRankingDevice(rankingAlias);
      setRankingDevice(device);
      setRankingMessage(`¡Hola, ${device.alias}! Tu tarjeta está lista.`);
      setRankingPlayers(await loadRanking());
    } catch (error) {
      const pendingDevice = readRankingDevice();
      if (pendingDevice?.registrationPending) setRankingDevice(pendingDevice);
      setRankingMessage(rankingErrorMessage(error, "No pude guardar ese alias."));
    } finally {
      rankingJoiningRef.current = false;
      setRankingJoining(false);
    }
  };

  const isLevelUnlocked = (index: number) => {
    const level = levels[index];
    if (level.world === 7) return progress.secretUnlocked;
    if (level.world === 8) return progress.waterUnlocked && (!level.route?.required || Boolean(progress.levelStats[level.route.required]?.completed));
    return campaignLevels.findIndex((entry) => entry.id === level.id) <= progress.unlocked;
  };

  const replayBoss = (index: number) => {
    const level = levels[index];
    if (!level.boss || !progress.levelStats[level.id]?.completed) return;
    setBossReplayReturn(screen === "home" ? "home" : "map");
    setActiveIndex(index);
    setLevelRun((current) => current + 1);
    setLives(MAX_LIVES);
    setSnapshot(emptySnapshot);
    setPaused(false);
    setShowAlbum(false);
    setBossReplay(true);
    setScreen("boss");
  };

  const finishBossReplay = (challengeCompleted = false) => {
    if (challengeCompleted && activeLevel.boss) setProgress((current) => ({ ...current, bossChallenges: { ...current.bossChallenges, [activeLevel.boss!]: true } }));
    setBossReplay(false);
    openCollection("bosses");
    setScreen(bossReplayReturn);
  };

  const beginLevel = (index: number) => {
    if (!isLevelUnlocked(index)) return;
    setActiveIndex(index);
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
    setProgress((current) => {
      const newStickers = next.stickers.filter((id) => !current.stickers.includes(id));
      return newStickers.length > 0 ? { ...current, stickers: [...current.stickers, ...newStickers] } : current;
    });
  }, []);

  const handleComplete = useCallback((challengeCompleted = false, finalSnapshot = snapshot) => {
    setSnapshot(finalSnapshot);
    setProgress((current) => {
      const previous = current.levelStats[activeLevel.id];
      return {
        ...current,
        stickers: [...new Set([...current.stickers, ...finalSnapshot.stickers])],
        unlocked: Math.max(current.unlocked, campaignUnlockIndex(activeLevel)),
        levelStats: {
          ...current.levelStats,
          [activeLevel.id]: { completed: true, bestApples: Math.max(previous?.bestApples ?? 0, finalSnapshot.apples), flawless: previous?.flawless || lives === MAX_LIVES },
        },
        bossChallenges: activeLevel.boss && challengeCompleted ? { ...current.bossChallenges, [activeLevel.boss]: true } : current.bossChallenges,
      };
    });
    setScreen(activeLevel.route?.finale ? "finished" : "complete");
  }, [activeLevel, lives, snapshot]);

  const handleCanvasComplete = useCallback((finalSnapshot: GameSnapshot) => handleComplete(false, finalSnapshot), [handleComplete]);

  const handleWaterExit = useCallback(() => {
    const target = levelIndex(activeLevel.route?.waterExit ?? "");
    if (target < 0) return;
    setProgress((current) => ({ ...current, waterUnlocked: true }));
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
    setProgress((current) => ({ ...current, secretUnlocked: true }));
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

  const abandonBossBattle = useCallback(() => {
    setPaused(false);
    setScreen("map");
  }, []);

  const nextLevel = () => {
    const nextIndex = nextLevelIndex(activeLevel);
    if (nextIndex < 0) { setScreen("map"); return; }
    setActiveIndex(nextIndex);
    setLevelRun((current) => current + 1);
    setLives(MAX_LIVES);
    setSnapshot(emptySnapshot);
    setPaused(false);
    setScreen("game");
  };

  const resetProgress = () => {
    if (!window.confirm("¿Empezar de nuevo? Se borrarán las pantallas, las manzanas, las pegatinas y los jefes amigos guardados.")) return;
    setProgress(emptyProgress);
    setActiveIndex(0);
    setLives(MAX_LIVES);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void (playScreenRef.current ?? document.documentElement).requestFullscreen?.().catch(() => undefined);
  };

  return (
    <main className={`app-shell ${reduceMotion ? "reduce-motion" : ""} ${touchControls === "always" ? "touch-controls-always" : ""}`}>
      {saveError && <p className="save-warning" role="alert">No se pudo guardar la partida en este dispositivo. Puedes seguir jugando, pero el progreso podría perderse al cerrar.</p>}
      {rankingDevice && rankingSyncState === "pending" && <p className="ranking-sync-warning" role="status">Tus logros del tablón están pendientes. {rankingSyncMessage} {saveError ? "Puedes seguir jugando, aunque este navegador no pudo guardar la partida." : "Tu partida sigue guardada en este dispositivo."} <button type="button" onClick={() => setRankingRetry((current) => current + 1)}>Reintentar envío</button></p>}
      {audioMessage && !muted && musicVolume > 0 && <p className="audio-warning" role="status">{audioMessage}</p>}
      {screen === "home" && (
        <section className="home-screen" aria-labelledby="game-title">
          <div className="home-copy">
            <p className="eyebrow home-eyebrow"><PixelIcon kind="sparkle" /> Una aventura pixel art</p>
            <h1 id="game-title"><span>SUPER</span> NOA</h1>
            <p className="home-lead">Corre, salta y explora castillos, volcanes de dragones, flores gigantes y montañas de hielo. ¡Los gatitos te esperan!</p>
            <p className="home-invite"><PixelIcon kind="heart" /> Una gran aventura para pequeñas heroínas</p>
            <p className="coming-adventures"><strong>Próximas aventuras:</strong> El desierto de los deseos · La fábrica de juguetes · El bosque de los sueños</p>
            <div className="home-actions">
              <button className="pixel-button primary home-play" type="button" data-gamepad-default onClick={() => setScreen("map")}>▶ ¡Jugar ahora!</button>
              <button className="pixel-button" type="button" onClick={() => setShowHelp(true)}>¿Cómo se juega?</button>
            </div>
            {progress.unlocked > 0 && !saveError && <p className="save-note">Partida guardada · {completedLevels}/{campaignLevelCount}{progress.secretUnlocked ? " + secreto" : ""}</p>}
          </div>
          <div className="hero-scene" aria-hidden="true">
            <img className="hero-backdrop" src={optimizedAssetSource("./assets/home-adventure-v3.png")} alt="" />
          </div>
          <nav className="home-footer" aria-label="Opciones">
            <button type="button" onClick={() => setMuted((value) => !value)}><PixelIcon kind={muted ? "mute" : "sound"} /> {muted ? "Activar sonido" : "Sonido"}</button>
            <button type="button" onClick={() => openCollection("stickers")}>Álbum {progress.stickers.filter((id) => albumStickers.some((sticker) => sticker.id === id)).length}/{albumStickers.length}</button>
            <button type="button" onClick={() => openCollection("bosses")}>Jefes amigos {knownBosses}/{bossLevels.length}</button>
            <button type="button" onClick={openRanking}>🌍 Tablón mundial</button>
            <button type="button" onClick={() => setShowSettings(true)}>⚙ Ajustes</button>
            <button type="button" onClick={() => setShowCredits(true)}>Créditos</button>
          </nav>
        </section>
      )}

      {screen === "map" && (
        <section className="map-screen">
          <header className="map-header">
            <div><p className="eyebrow">Elige una pantalla</p><h2>El mapa de Noa</h2></div>
            <div className="map-actions">
              <span className="apple-total"><GameAssetIcon kind="apple" /> {totalApples}</span>
              <button className="album-button" type="button" onClick={() => openCollection("stickers")} aria-label="Abrir álbum de pegatinas"><PixelIcon kind="sparkle" /> {progress.stickers.filter((id) => albumStickers.some((sticker) => sticker.id === id)).length}/{albumStickers.length}</button>
              <button className="album-button" type="button" onClick={() => openCollection("bosses")} aria-label="Abrir jefes amigos">★ {knownBosses}/{bossLevels.length}</button>
              <button className="album-button" type="button" onClick={openRanking}>🌍 Tablón</button>
              <button className="icon-button" type="button" onClick={() => setShowSettings(true)} aria-label="Abrir ajustes">⚙</button>
              <button className="icon-button" type="button" data-gamepad-back onClick={() => setScreen("home")} aria-label="Volver al inicio">⌂</button>
            </div>
          </header>
          <WorldMap progress={progress} summaries={worldProgress} isLevelUnlocked={isLevelUnlocked} onBeginLevel={beginLevel} reduceMotion={reduceMotion} />
          <button className="text-button reset-button" type="button" onClick={resetProgress}>Borrar progreso</button>
        </section>
      )}

      {screen === "secret-transition" && (
        <section className="secret-transition" aria-live="polite">
          <img className="secret-vine-rise" src="./assets/sprites/secret-vine-transition-v1.png" alt="" aria-hidden="true" />
          <p className="eyebrow">¡Pasadizo secreto!</p>
          <h2>Subiendo al Reino de las Nubes…</h2>
          <p>La enredadera mágica lleva a Noa por encima del bosque.</p>
          <div className="transition-clouds" aria-hidden="true">☁ ☁ ☁</div>
        </section>
      )}

      {(screen === "game" || screen === "boss" || screen === "complete" || screen === "gameover" || screen === "finished") && (
        <section className="play-screen" ref={playScreenRef}>
          {!bossReplay && <header className="game-hud">
            <div className="hud-level"><span>{activeLevel.id}</span><strong>{activeLevel.title}</strong></div>
            <div className="hud-stats">
              <span aria-label={`${lives} vidas`}><GameAssetIcon kind="heart" /> × {lives}</span>
              <span aria-label={`${snapshot.apples} manzanas`}><GameAssetIcon kind="apple" /> × {snapshot.apples}</span>
              <span aria-label={`${snapshot.stickers.length} pegatinas encontradas`}><PixelIcon kind="sparkle" /> × {snapshot.stickers.length}</span>
              <span className={`power-chip power-${snapshot.power}`}>{snapshot.power === "cat" ? <><PixelIcon kind="yarn" /> Gato</> : snapshot.power === "apple" ? <><GameAssetIcon kind="apple" /> Protegida</> : "Noa"}</span>
            </div>
            <div className="hud-actions">
              <button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? "Activar sonido" : "Silenciar"}><PixelIcon kind={muted ? "mute" : "sound"} /></button>
              <button type="button" onClick={toggleFullscreen} aria-label="Pantalla completa">⛶</button>
              {(screen === "game" || screen === "boss") && <button type="button" onClick={() => setPaused((value) => !value)} aria-label="Pausa">Ⅱ</button>}
            </div>
          </header>}
          {!bossReplay && <GameCanvas key={`game-${activeLevel.id}-${levelRun}`} level={activeLevel} running={screen === "game" && !paused} onLoseLife={handleLoseLife} onComplete={handleCanvasComplete} onBossEncounter={handleBossEncounter} onSecretExit={handleSecretExit} onWaterExit={handleWaterExit} onSnapshot={handleSnapshot} playSound={playSound} />}
          {!bossReplay && <div className="level-caption"><span>{themeNames[activeLevel.theme]}</span><span>Bandera {snapshot.checkpoint}/{activeLevel.checkpoints.length}</span><small>{activeLevel.subtitle}</small></div>}

          {screen === "boss" && activeLevel.boss && (
            <BossBattle
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
            />
          )}

          {screen === "complete" && (
            <Dialog labelledBy="complete-title" backdropClassName="celebration" onClose={() => setScreen("map")}>
              <div className="big-icon">{activeLevel.boss ? <img className="completion-trophy" src="./assets/sprites/completion-trophy-v1.png" alt="Trofeo dorado con una huella de gato" /> : <img className="completion-cat" src={worldCatalog.find((world) => world.id === activeLevel.world)?.catAsset ?? "./assets/sprites/completion-cat-v1.png"} alt="Gatito feliz rescatado" />}</div><p className="eyebrow">{activeLevel.boss ? "¡Duelo ganado!" : "¡Gatito encontrado!"}</p>
              <h2 id="complete-title">Pantalla {activeLevel.id} completada</h2>
              <p>Noa ha recogido {snapshot.apples} {snapshot.apples === 1 ? "manzana" : "manzanas"}. {activeLevel.world === 7 ? "La Reina Arcoíris guarda para siempre las insignias encontradas." : activeLevel.boss ? "El monstruo guardián ha dejado libre el camino." : "La siguiente aventura ya está abierta."}</p>
              <div className="completion-medals" aria-label="Medallas de esta pantalla"><span className="is-earned">★ Pantalla</span><span className={snapshot.stickers.length > 0 || progress.stickers.includes(activeLevel.items.find((item) => item.kind === "sticker")?.id ?? "") ? "is-earned" : ""}>★ Pegatina</span><span className={lives === MAX_LIVES ? "is-earned" : ""}>★ Sin perder vida</span></div>
              {snapshot.stickers.length > 0 && <p className="sticker-found"><PixelIcon kind="sparkle" /> {snapshot.stickers.length === 1 ? "Insignia guardada" : `${snapshot.stickers.length} insignias guardadas`} en el álbum.</p>}
              {activeLevel.world !== 7 && <button className="pixel-button primary" type="button" onClick={nextLevel}>{activeLevel.route?.nextLabel ?? "Siguiente pantalla ▶"}</button>}
              {activeLevel.world === 7 && <button className="pixel-button primary" type="button" data-gamepad-back onClick={() => setScreen("map")}>Volver al mapa secreto</button>}
              {activeLevel.world !== 7 && <button className="pixel-button" type="button" data-gamepad-back onClick={() => setScreen("map")}>Volver al mapa</button>}
            </Dialog>
          )}

          {screen === "gameover" && (
            <Dialog labelledBy="gameover-title" onClose={() => setScreen("map")}>
              <div className="big-icon"><GameAssetIcon kind="apple" /></div><p className="eyebrow">Casi, casi…</p><h2 id="gameover-title">¡Otra oportunidad!</h2>
              <p>Las tres vidas vuelven a estar listas. El camino ya te lo sabes.</p>
              <button className="pixel-button primary" type="button" onClick={() => beginLevel(activeIndex)}>Reintentar</button>
              <button className="pixel-button" type="button" data-gamepad-back onClick={() => setScreen("map")}>Volver al mapa</button>
            </Dialog>
          )}

          {screen === "finished" && (
            <Dialog labelledBy="finished-title" className="game-modal finale" backdropClassName="celebration" onClose={() => setScreen("map")}>
              <div className="cat-party" aria-hidden="true">
                <img src="./assets/sprites/world-cat-1-v1.png" alt="" />
                <GameAssetIcon kind="apple" />
                <img src="./assets/sprites/world-cat-2-v1.png" alt="" />
                <img className="party-yarn" src="./assets/sprites/yarn-ball-v1.png" alt="" />
                <img src="./assets/sprites/world-cat-6-v1.png" alt="" />
              </div><p className="eyebrow">Aventura completada</p>
              <h2 id="finished-title">¡Bravo, Super Noa!</h2><p>Los guardianes son ahora amigos de Noa. Los gatitos y la tripulación celebran una fiesta en el castillo. Fin… por ahora.</p>
              <button className="pixel-button primary" type="button" onClick={() => setScreen("map")}>Ver el mapa</button>
              <button className="pixel-button" type="button" data-gamepad-back onClick={() => setScreen("home")}>Ir al inicio</button>
            </Dialog>
          )}
        </section>
      )}

      {paused && (screen === "game" || screen === "boss" || screen === "secret-transition") && (
        <Dialog labelledBy="pause-title" className="game-modal compact" onClose={() => setPaused(false)}>
          <p className="eyebrow">Descanso</p><h2 id="pause-title">Juego en pausa</h2>
          <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => setPaused(false)}>Seguir jugando</button>
          <button className="pixel-button" type="button" data-gamepad-back onClick={() => { setPaused(false); setScreen("map"); }}>Volver al mapa</button>
        </Dialog>
      )}

      {showSettings && (
        <Dialog labelledBy="settings-title" className="game-modal settings-modal" onClose={() => setShowSettings(false)}>
          <button className="modal-close" type="button" data-gamepad-back onClick={() => setShowSettings(false)} aria-label="Cerrar">×</button>
          <p className="eyebrow">A tu manera</p><h2 id="settings-title">Ajustes de juego</h2>
          <p>Estos ajustes se guardan en este dispositivo.</p>
          <div className="settings-group">
            <label htmlFor="music-volume">Música <output>{Math.round(musicVolume)}%</output></label>
            <input id="music-volume" type="range" min="0" max="100" value={musicVolume} onChange={(event) => { writeStorage(`${MUSIC_VOLUME_KEY}-configured`, "true"); setMusicVolume(Number(event.target.value)); }} />
            <label htmlFor="effects-volume">Efectos <output>{Math.round(effectsVolume)}%</output></label>
            <input id="effects-volume" type="range" min="0" max="100" value={effectsVolume} onChange={(event) => { writeStorage(`${EFFECTS_VOLUME_KEY}-configured`, "true"); setEffectsVolume(Number(event.target.value)); }} />
          </div>
          <div className="settings-toggle"><input id="reduce-motion" type="checkbox" checked={reduceMotion} onChange={(event) => setReduceMotion(event.target.checked)} /><label htmlFor="reduce-motion"><strong>Movimiento tranquilo</strong><small>Reduce destellos y animaciones rápidas.</small></label></div>
          <fieldset className="settings-controls"><legend>Controles táctiles</legend>
            <label><input type="radio" name="touch-controls" checked={touchControls === "auto"} onChange={() => setTouchControls("auto")} /> Automáticos en móvil</label>
            <label><input type="radio" name="touch-controls" checked={touchControls === "always"} onChange={() => setTouchControls("always")} /> Siempre visibles</label>
          </fieldset>
          <p className="settings-help"><strong>Teclado:</strong> flechas o A/D para caminar, espacio para saltar y X/K para lanzar lana. <strong>Mando:</strong> cruceta o palanca para moverte y elegir opciones, A para saltar o confirmar, B para volver y Start para pausar.</p>
          <button className="pixel-button primary" type="button" onClick={() => setShowSettings(false)}>Listo</button>
        </Dialog>
      )}

      {showHelp && (
        <Dialog labelledBy="help-title" className="game-modal help-modal" onClose={() => setShowHelp(false)}>
          <button className="modal-close" type="button" data-gamepad-back onClick={() => setShowHelp(false)} aria-label="Cerrar">×</button>
          <p className="eyebrow">Ayuda a Noa</p><h2 id="help-title">¿Cómo se juega?</h2>
          <p className="help-intro">¡Camina, salta y busca caminos secretos!</p>
          <div className="help-first-steps">
            <div><b>1</b><span className="help-control-icon">◀ ▶</span><strong>Camina</strong><small>Mantén pulsada una flecha.</small></div>
            <div className="help-double-jump"><b>2</b><span className="help-control-icon">↑ + ↑</span><strong>Haz un doble salto</strong><small>Toca <em>SALTAR</em>. En el aire, ¡tócalo otra vez!</small></div>
            <div><b>3</b><span className="help-control-icon">▣</span><strong>Abre las cajas</strong><small>Salta y golpea la caja por debajo.</small></div>
          </div>
          <p className="help-mobile-tip"><strong>En móvil:</strong> puedes mantener una flecha con un dedo y tocar <b>SALTAR</b> con el otro.</p>
          <div className="help-grid">
            <div><span><PixelIcon kind="yarn" /></span><strong>Bola de lana</strong><small>Cuando Noa tenga orejas de gato, toca <b>LANA</b>.</small></div>
            <div><span><GameAssetIcon kind="apple" /></span><strong>Manzana escudo</strong><small>La manzana salva a Noa de un golpe.</small></div>
            <div><span className="help-rps"><PixelIcon kind="rock" /><PixelIcon kind="paper" /><PixelIcon kind="scissors" /></span><strong>Duelo final</strong><small>Gana dos rondas de piedra, papel o tijera.</small></div>
            <div><span><PixelIcon kind="sparkle" /></span><strong>Mira arriba</strong><small>Las pegatinas se esconden en caminos altos.</small></div>
          </div>
          <p className="help-note">Con teclado: A/D o flechas para caminar, espacio para saltar y X/K para lanzar lana. Con mando, usa la cruceta o palanca, A para saltar o elegir y B para volver. En el agua, SALTAR da una brazada hacia arriba; al soltarlo, Noa baja despacito y puede caminar por la arena. ¡Los erizos pinchan!</p>
          <button className="pixel-button primary" type="button" onClick={() => { setShowHelp(false); setScreen("map"); }}>¡Lista para jugar!</button>
        </Dialog>
      )}

      {showCredits && (
        <Dialog labelledBy="credits-title" className="game-modal credits-modal" onClose={() => setShowCredits(false)}>
          <button className="modal-close" type="button" data-gamepad-back onClick={() => setShowCredits(false)} aria-label="Cerrar">×</button>
          <p className="eyebrow">Hecho con cariño</p><h2 id="credits-title">Créditos</h2>
          <p><strong>Super Noa</strong> es un juego original inspirado en los plataformas familiares de 8 bits.</p>
          <p>Personaje creado para este proyecto a partir de referencias privadas. Las fotografías originales no forman parte de la web.</p>
          <p>Música reutilizada: <a href="https://opengameart.org/content/platformer-chiptunes" target="_blank" rel="noreferrer">Platformer Chiptunes</a>, de Guy G. Gamerson, publicada bajo licencia CC0. Las melodías del bosque de manzanos, el castillo, la laguna, la isla jurásica, el volcán, el valle de flores y la montaña de hielo son composiciones originales para Super Noa.</p>
          <p>Los guardianes finales y las miniaturas pixel art de los mundos son diseños originales generados para este proyecto. Efectos de sonido generados en el navegador; escenarios jugables, interfaz y código creados para Super Noa.</p>
          <button className="pixel-button primary" type="button" onClick={() => setShowCredits(false)}>Cerrar</button>
        </Dialog>
      )}

      {showAlbum && (
        <Dialog labelledBy="album-title" className="game-modal album-modal" onClose={() => setShowAlbum(false)}>
          <button className="modal-close" type="button" data-gamepad-back onClick={() => setShowAlbum(false)} aria-label="Cerrar">×</button>
          <p className="eyebrow">Colección de Noa</p><h2 id="album-title">{collectionTab === "stickers" ? "Álbum de pegatinas" : collectionTab === "bosses" ? "Jefes amigos" : "Postales de viaje"}</h2>
          <div className="collection-tabs" aria-label="Ver colección">
            <button className={collectionTab === "stickers" ? "is-active" : ""} type="button" aria-pressed={collectionTab === "stickers"} onClick={() => setCollectionTab("stickers")}>Pegatinas</button>
            <button className={collectionTab === "bosses" ? "is-active" : ""} type="button" aria-pressed={collectionTab === "bosses"} onClick={() => setCollectionTab("bosses")}>Jefes amigos</button>
            <button className={collectionTab === "memories" ? "is-active" : ""} type="button" aria-pressed={collectionTab === "memories"} onClick={() => setCollectionTab("memories")}>Recuerdos</button>
          </div>
          {collectionTab === "stickers" ? <>
            <p>{progress.secretUnlocked ? "Hay una pegatina por pantalla y tres insignias en el reino secreto." : "Hay una pegatina escondida en la ruta elevada de cada pantalla."}</p>
            <div className="sticker-grid">
              {albumStickers.map((sticker) => {
                const found = progress.stickers.includes(sticker.id);
                const sprite = getStickerSprite(sticker.id);
                const stickerLevel = levels.find((level) => level.items.some((item) => item.id === sticker.id));
                const available = stickerLevel && getLevelObjectives(stickerLevel, progress).available;
                const hintVisible = albumHints.includes(sticker.id);
                return (
                  <article className={`sticker-card ${found ? "is-found" : "is-locked"}`} key={sticker.id}>
                    <span className="sticker-frame" aria-hidden="true">{found && sprite ? <span className="sticker-sprite" style={{ backgroundImage: `url(${optimizedAssetSource(sprite.src)})`, backgroundPosition: `${sprite.column * 50}% center` }} /> : "?"}</span>
                    <strong>{found ? sticker.name : `Mundo ${sticker.world}`}</strong>
                    <small>{stickerLevel ? `Pantalla ${stickerLevel.id}` : ""} · {found ? "¡Encontrada!" : "Pegatina pendiente"}</small>
                    {!found && available && <><button className="level-hint-toggle" type="button" aria-expanded={hintVisible} aria-controls={`album-hint-${sticker.id}`} onClick={() => setAlbumHints((current) => hintVisible ? current.filter((id) => id !== sticker.id) : [...current, sticker.id])}>{hintVisible ? "Ocultar pista" : "Mostrar pista"}</button><p className="album-sticker-hint" id={`album-hint-${sticker.id}`} hidden={!hintVisible}>{sticker.hint}</p></>}
                    {!found && !available && <small>Abre esta pantalla para ver su pista.</small>}
                  </article>
                );
              })}
            </div>
            <p className="album-progress"><PixelIcon kind="sparkle" /> {progress.stickers.filter((id) => albumStickers.some((sticker) => sticker.id === id)).length} de {albumStickers.length}</p>
          </> : collectionTab === "bosses" ? <>
            <p>Gana un duelo para hacerte amiga de cada guardián. Después podréis jugar otra vez.</p>
            <div className="boss-friends-grid">
              {bossLevels.map(({ level, index, boss }) => {
                const known = Boolean(progress.levelStats[level.id]?.completed);
                const challengeDone = Boolean(progress.bossChallenges[level.boss ?? ""]);
                return (
                  <article className={`boss-friend-card ${known ? "is-friend" : "is-mystery"} ${challengeDone ? "has-challenge-frame" : ""}`} key={level.id}>
                    <span className="boss-friend-world">{level.world === 7 ? (progress.secretUnlocked ? "Mundo secreto" : "Mundo misterioso") : level.world === 8 ? "Mundo del agua" : `Mundo ${level.world}`}</span>
                    <div className="boss-friend-portrait" aria-hidden="true">
                      {known ? boss.assetAtlas
                        ? <span className="boss-friend-atlas" style={{ backgroundImage: `url("${boss.assetAtlas}")` }} />
                        : <img src={`${boss.assetPrefix}-0.png`} alt="" />
                        : <span className="boss-mystery-shape">?</span>}
                    </div>
                    <strong>{known ? boss.name : "Amigo por descubrir"}</strong>
                    {known ? <>{challengeDone ? <small className="challenge-frame-label">★ Marco especial conseguido</small> : <small>★ Reto pendiente: {boss.challenge.label}</small>}<button type="button" onClick={() => replayBoss(index)}>Jugar otra vez</button></> : <small>Gana su duelo para conocerlo.</small>}
                  </article>
                );
              })}
            </div>
            <p className="album-progress">★ {knownBosses} de {bossLevels.length} amigos</p>
          </> : <>
            <p>Termina todas las pantallas de un mundo para guardar una postal con el gatito que conociste allí.</p>
            <div className="memory-grid">
              {worldCatalog.map((world) => {
                const memory = worldProgress[world.id];
                return (
                  <article className={`memory-card world-${world.id} ${memory.remembered ? "is-remembered" : "is-locked"}`} key={world.id}>
                    <img className="memory-world-art" src={worldArtwork(world.id)} alt="" aria-hidden="true" />
                    <div className="memory-content">
                      <span>{world.id === 7 ? "Mundo secreto" : world.id === 8 ? "Mundo del agua" : `Mundo ${world.id}`}</span>
                      {memory.remembered ? <><img className="memory-cat" src={world.catAsset} alt={`${world.cat}, el gatito amigo de ${world.name}`} /><strong>{world.cat}</strong><small>{world.name}</small><em>★ {memory.complete + memory.stickers + memory.flawless} medallas de aventura</em></> : <><b className="memory-lock">?</b><strong>Postal por descubrir</strong><small>{memory.complete}/{memory.total} pantallas completadas</small></>}
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="album-progress">✉ {Object.values(worldProgress).filter((world) => world.remembered).length} de {worldCatalog.length} postales guardadas</p>
          </>}
          <button className="pixel-button primary" type="button" onClick={() => setShowAlbum(false)}>Seguir explorando</button>
        </Dialog>
      )}
      {showRanking && (
        <Dialog labelledBy="ranking-title" className="game-modal ranking-modal" onClose={() => setShowRanking(false)}>
          <button className="modal-close" type="button" data-gamepad-back onClick={() => setShowRanking(false)} aria-label="Cerrar">×</button>
          <div className="ranking-heading">
            <span className="ranking-trophy" aria-hidden="true">★</span>
            <div><p className="eyebrow">Aventureras y aventureros</p><h2 id="ranking-title">Tablón mundial</h2></div>
          </div>
          {!rankingDevice ? <div className="ranking-join"><label htmlFor="ranking-alias">Tu alias de aventura</label><input id="ranking-alias" value={rankingAlias} onChange={(event) => setRankingAlias(event.target.value)} maxLength={16} disabled={rankingJoining} placeholder="Por ejemplo, Moche" /><button className="pixel-button primary" type="button" disabled={rankingJoining} onClick={() => void joinRanking()}>{rankingJoining ? "Preparando tu tarjeta…" : "¡Salir al tablón!"}</button><small>Solo compartimos tu alias y tus logros. No pongas tu nombre real.</small></div> : <><p className="ranking-welcome">¡Hola, {rankingDevice.alias}!</p><p className="ranking-sync-status" role="status">{rankingSyncState === "saved" ? "Tus logros ya están en el tablón." : rankingSyncState === "pending" ? `Envío pendiente. ${rankingSyncMessage}` : "Enviando tus logros…"}</p></>}
          {rankingMessage && <p className="ranking-message" role="status">{rankingMessage}</p>}
          <ol className="ranking-list">{rankingPlayers.map((player, index) => {
            const position = index + 1;
            const isCurrentPlayer = rankingDevice?.alias.toLocaleLowerCase("es") === player.alias.toLocaleLowerCase("es");
            return <li className={`${position <= 3 ? `ranking-podium ranking-place-${position}` : ""} ${isCurrentPlayer ? "is-current-player" : ""}`} key={`${player.alias}-${index}`}>
              <span className="ranking-position" aria-label={`Puesto ${position}`}>{position}</span>
              <div className="ranking-player">
                <div className="ranking-player-name"><strong>{player.alias}</strong>{isCurrentPlayer && <em>Tú</em>}</div>
                <div className="ranking-stats">{player.campaignWorld != null && player.campaignWorld > 0 && <span>🌍 Etapa {player.campaignWorld}/10</span>}<span>🚩 {player.completedLevels}/{campaignLevelCount} pantallas</span><span>★ {player.stickers} pegatinas</span></div>
              </div>
            </li>;
          })}</ol>
          {rankingPlayers.length === 0 && !rankingMessage && <p className="ranking-empty">Aún no hay nadie. ¡Puedes ser la primera aventurera!</p>}
          <div className="ranking-footer"><button className="pixel-button ranking-refresh" type="button" disabled={rankingLoading} onClick={() => void refreshRanking()}><span aria-hidden="true">↻</span> {rankingLoading ? "Actualizando…" : "Actualizar tablón"}</button></div>
        </Dialog>
      )}
    </main>
  );
}
