import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cajaRedondeada, drawCartel, medirCartel, medirTexto, ponerEscalaLienzo, tamanoLegible } from "./cartelLienzo";
import { CARTEL_ARRIBA, colocarCarteles, pistaDeLaPartida, techoCarteles, type Caja } from "./carteles";
import { acentoMundo } from "./worldMapData";
import { Emblema } from "./Emblema";
import { SecretShop } from "./SecretShop";
import "./secretDoors.css";
import { TouchControls } from "./TouchControls";
import { cssAssetUrl, dibujarConMapas, fondoDeNivel, getImage, getLevelAssets, precargarPantalla } from "./assets";
import {
  drawAmbientForeground, drawApple, drawBackground, drawBloomBridge, drawBossGate, drawCannon,
  drawCannonball, drawCastleSprite, drawCatPower, drawCaveEntrance, drawChainGuardian, drawCheckpoint,
  drawDeadlyWater, drawEnemy, drawGoalCat, drawPlatform, drawRewardBlock, drawSecretBlock, drawSecretShopDoor, drawStarAura,
  drawAdventurePrecipices, drawLavaJet, drawSecretVine, drawSkyLift, drawSticker, drawTinySparkle, drawUpdraft, drawWaterEntrance, drawWaterJumper, drawWindZone,
} from "./rendering";
import { useGameInput } from "./input";
import { firstConnectedGamepad, readGameplayPad } from "./gamepad";
import { createGameLoop, type GameLoop } from "./gameLoop";
import { createPalabrasRecoger, type CapaPalabra } from "./palabrasRecoger";
import { capaTransicion, createLevelTransition, SALIDA_SEGUNDOS, type CapaTransicion } from "./levelTransition";
import { beatPlatformActive, getMechanicPlatforms, hasWorldMechanics, mechanicRespawn, skyLiftPlatform, updraftVelocity, visibleSkyRespawn, wolfSleepState } from "./worldMechanics";
import { getStickerSprite } from "./stickers";
import { createChainGuardian, guardianHitbox, updateChainGuardian } from "./chainGuardians";
import type { Level, GameSnapshot, ShopMatchCount } from "./types";
import { canEnterSecretShop, secretShopRewardSeconds } from "./secretShopRuntime";
import { starPowerLight } from "./starPowerVisuals";
import { detourLevel } from "./detours";
import { advanceDetourClock, createDetourClock, detourSupports } from "./detourMechanics";
import { drawDetourEntrance, drawDetourMechanisms, drawDetourScenery } from "./detourRendering";
import type { DetourId } from "./types";
import "./detours.css";
import "./puzzleRooms.css";
import { advanceRoom, createPuzzleState, pushCrates, puzzlePlatforms, resetRoom, restartHintActive, slideCrates, stepTriggers } from "./puzzleRooms";
import { drawPuzzleRooms, type SparkTrail } from "./puzzleRoomsRendering";
import { createChaseState, stepChase } from "./chase";
import { ARTE_PERSECUCION, drawChase, speech } from "./chaseRendering";
import { GREET_DISTANCE, guardianOf, restStopFor } from "./restStops";
import { bossCatalog } from "./bosses";
import { createExploreState, exploreCameraTarget, hintTarget, reachedGate, shortcutWalls, stepExplore } from "./explore";
import { drawExploreOverlay, drawExploreWorld, prepararExploracion } from "./exploreRendering";
import { VIEW_WIDTH, VIEW_HEIGHT } from "./constants";
import { ANCHO_VERTICAL, ponerVista, recorteObjetivo, vista } from "./vista";
import { drawHalo, drawVelo } from "./halo";
import {
  enemyY, lavaJetState, positiveModulo, waterJumperState, type Player, type LiveEnemy, type LiveItem, type LiveWaterJumper,
  type Projectile, type LiveCannon, type Cannonball, type PixelBurst,
} from "./gameState";
import { t, textoLienzo } from "../textos";
import { BotonControl, Texto } from "../textos/Texto";
import { conveyorSpeed, boarChargeVelocity, GRAVITY, hasReachedGoalFlag, JUMP_SPEED, keepInsidePatrol, landsOnSpring, platformSurfaceY, projectileHitsWaterWall, rectanglesOverlap, resolveHorizontalWallCollision, SKY_BOUNCE_SPEED, SPRING_SPEED, swimmingVelocity, walkAnimationFrame, waterAt, wrapHorizontalPosition } from "./gameplay";

const MOVE_SPEED = 250;

type SoundKind = "apple" | "block" | "cat" | "jump" | "hurt" | "stomp" | "yarn" | "checkpoint" | "goal" | "sticker" | "howl" | "snort" | "cannon" | "countdown";

type GameCanvasProps = {
  level: Level;
  /** HUD de esquinas que se pinta sobre el escenario (también en los caminos secretos). */
  hud?: ReactNode;
  running: boolean;
  onLoseLife: () => void;
  onComplete: (finalSnapshot: GameSnapshot) => void;
  onBossEncounter: (finalSnapshot: GameSnapshot) => void;
  onSecretExit: () => void;
  onWaterExit: () => void;
  onSnapshot: (snapshot: GameSnapshot) => void;
  onAppleCollected?: (count: number) => void;
  onShopVisit?: (id: string) => void;
  onShopWin?: (id: string) => void;
  onShopActiveChange?: (active: boolean) => void;
  onDetourVisit?: (id: DetourId) => void;
  onDetourComplete?: (id: DetourId) => void;
  onDetourActiveChange?: (id: DetourId | null) => void;
  onFriendGreeted?: (world: number, kind: string) => void;
  onReturn?: () => void;
  reduceMotion?: boolean;
  playSound: (kind: SoundKind) => void;
};

const intersects = rectanglesOverlap;

function createInitialPlayer(level: Level): Player {
  return {
    x: level.start.x,
    y: level.start.y,
    width: 42,
    height: 58,
    vx: 0,
    vy: 0,
    grounded: false,
    facing: 1,
    power: "normal",
    invincible: 0,
    coyote: 0,
    jumpBuffer: 0,
    jumpsUsed: 0,
    springLaunch: false,
    doubleJumpFx: 0,
    shootFx: 0,
  };
}


type Interaccion = "entrar" | "explorar" | "subir" | "activar";


const CLAVE_PALABRA = { apple: "partida.lienzo.recoger.manzana.rotulo", sticker: "partida.lienzo.recoger.pegatina.rotulo", cat: "partida.lienzo.recoger.gato.rotulo", flag: "partida.lienzo.recoger.bandera.rotulo" } as const;

/** Etiqueta crema con el dibujo y la palabra del objeto recogido, sobre la cabeza de Noa sin salirse de la pantalla. */
function drawPalabraRecogida(context: CanvasRenderingContext2D, capa: CapaPalabra, x: number, cabeza: number, techo = CARTEL_ARRIBA) {
  context.save();
  context.globalAlpha = capa.alfa;
  const letra = tamanoLegible(24) * capa.escala;
  context.font = `${Math.round(letra)}px "Press Start 2P", monospace`;
  const texto = textoLienzo(CLAVE_PALABRA[capa.objeto]);
  const ancho = medirTexto(context, texto, letra) + 32;
  const alto = letra * 2;
  const centro = Math.max(vista.izquierda + ancho / 2 + 8, Math.min(vista.derecha - ancho / 2 - 8, x));
  const y = Math.max(techo + alto / 2, cabeza - 64 - capa.subida) - alto / 2;
  context.fillStyle = "rgba(0, 0, 0, .3)";
  cajaRedondeada(context, centro - ancho / 2 + 4, y + 5, ancho, alto, 10); context.fill();
  context.fillStyle = "#fff8e9"; context.strokeStyle = "#3d1430"; context.lineWidth = 4;
  cajaRedondeada(context, centro - ancho / 2, y, ancho, alto, 10); context.fill(); context.stroke();
  context.fillStyle = "#3d1430"; context.textAlign = "center"; context.textBaseline = "middle";
  context.fillText(texto, centro, y + alto / 2 + 2);
  context.restore();
}

/** Círculo con borde dorado sobre el color noche, centrado en Noa; con movimiento tranquilo, un fundido. */
function drawTransitionLayer(context: CanvasRenderingContext2D, capa: CapaTransicion, x: number, y: number) {
  context.save();
  context.fillStyle = "#25183f";
  if (capa.tipo === "fundido") {
    context.globalAlpha = capa.alfa;
    context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    context.globalAlpha = 1;
  } else {
    context.beginPath();
    context.rect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    context.arc(x, y, capa.radio, 0, Math.PI * 2, true);
    context.fill("evenodd");
    if (capa.radio > 0) {
      context.strokeStyle = "#ffd45f";
      context.lineWidth = 8;
      context.beginPath();
      context.arc(x, y, capa.radio, 0, Math.PI * 2);
      context.stroke();
    }
  }
  if (capa.bien) {
    context.font = '24px "Press Start 2P", monospace';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = 6;
    context.strokeStyle = "#3d1430";
    context.strokeText(textoLienzo("partida.lienzo.bien.rotulo"), VIEW_WIDTH / 2, 70);
    context.fillStyle = "#ffd45f";
    context.fillText(textoLienzo("partida.lienzo.bien.rotulo"), VIEW_WIDTH / 2, 70);
  }
  context.restore();
}

/** Colores del marco caramelo del mundo (decisión «El marco exterior de la partida»). */
const marcoMundo = (level: Level) => {
  const { base, oscuro, claro } = acentoMundo(level.world);
  return { "--acento": base, "--acento-oscuro": oscuro, "--acento-claro": claro, "--fondo-mundo": cssAssetUrl(fondoDeNivel(level)) } as CSSProperties;
};

export function GameCanvas({ level, hud, running, onLoseLife, onComplete, onBossEncounter, onSecretExit, onWaterExit, onSnapshot, onAppleCollected, onShopVisit, onShopWin, onShopActiveChange, onDetourVisit, onDetourComplete, onDetourActiveChange, onFriendGreeted, onReturn, reduceMotion = false, playSound }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [doorAvailable, setDoorAvailable] = useState(false);
  const [excursion, setExcursion] = useState<DetourId | null>(null);
  const [interaction, setInteraction] = useState<Interaccion>("entrar");
  const [roomHint, setRoomHint] = useState(false);
  const restartRoomRef = useRef<(() => void) | null>(null);
  const interactionRef = useRef<Interaccion | "">("");
  const returnFromDetourRef = useRef<(() => void) | null>(null);
  const shopOpenRef = useRef(false);
  const doorAvailableRef = useRef(false);
  const returnFromShopRef = useRef<(() => void) | null>(null);
  const shopResultRef = useRef<ShopMatchCount | null>(null);
  const motionRef = useRef(reduceMotion);
  const activeRunning = running && !shopOpen && !excursion;
  const { inputRef, handleTouchStart, handleTouchEnd, handleTouchCancel } = useGameInput(activeRunning);
  const runningRef = useRef(running);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const callbacksRef = useRef({ onLoseLife, onComplete, onBossEncounter, onSecretExit, onWaterExit, onSnapshot, onAppleCollected, onShopVisit, onShopWin, onShopActiveChange, onDetourVisit, onDetourActiveChange, onFriendGreeted, playSound });

  useEffect(() => {
    callbacksRef.current = { onLoseLife, onComplete, onBossEncounter, onSecretExit, onWaterExit, onSnapshot, onAppleCollected, onShopVisit, onShopWin, onShopActiveChange, onDetourVisit, onDetourActiveChange, onFriendGreeted, playSound };
    motionRef.current = reduceMotion;
  }, [onLoseLife, onComplete, onBossEncounter, onSecretExit, onWaterExit, onSnapshot, onAppleCollected, onShopVisit, onShopWin, onShopActiveChange, onDetourVisit, onDetourActiveChange, onFriendGreeted, reduceMotion, playSound]);

  useEffect(() => {
    runningRef.current = activeRunning;
    gameLoopRef.current?.setRunning(activeRunning);
    if (activeRunning) canvasRef.current?.focus({ preventScroll: true });
  }, [activeRunning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;
    const soltarMapas = dibujarConMapas(context);

    const raster = getLevelAssets(level);
    const player = createInitialPlayer(level);
    let enemies: LiveEnemy[] = level.enemies.map((item, index) => ({ ...item, vx: item.speed, active: true, phase: index }));
    const items: LiveItem[] = level.items.map((item) => ({ ...item, age: 99, rise: 1, fromBlock: false }));
    const collected = new Set<string>();
    const collectedStickers = new Set<string>();
    const warnedEnemies = new Set<string>();
    const hitBlocks = new Set<string>();
    const projectiles: Projectile[] = [];
    const bursts: PixelBurst[] = [];
    const cannons: LiveCannon[] = (level.cannons ?? []).map((item, index) => ({ ...item, cooldown: 0.8 + index * 0.22 }));
    const cannonballs: Cannonball[] = [];
    const waterJumpers: LiveWaterJumper[] = (level.waterJumpers ?? []).map((jumper) => ({ ...jumper, age: 0 }));
    const chainGuardians = (level.chainGuardians ?? []).map(createChainGuardian);
    const puzzle = level.puzzleRooms ? createPuzzleState(level) : null;
    const sparks: SparkTrail[] = [];
    const chase = level.chase ? createChaseState(level.chase) : null;
    let chaseSay: { text: string; life: number } | null = level.chase ? { text: level.chase.stops[0].talk, life: 2.6 } : null;
    let chaseCaughtAge = 0;
    const explore = level.orientation === "explore" ? createExploreState() : null;
    const restStop = level.restStop ? restStopFor(level.restStop) : undefined;
    const greetedFriends = new Set<string>();
    const friendHops = new Map<string, number>();
    let friendSay: { text: string; life: number; id: string } | null = null;
    let roomHintShown = false;
    const goalPlatforms = level.platforms.filter((platform) => level.goalX >= platform.x && level.goalX <= platform.x + platform.width);
    const goalSurfaceY = level.world === 8 || level.orientation === "vertical"
      ? Math.min(...goalPlatforms.map((platform) => platform.y))
      : goalPlatforms[0]?.y ?? 456;
    let cameraX = 0;
    /** Segundos de simulación desde que empezó la pantalla, para el círculo de entrada. */
    let entradaSegundos = 0;
    /** Palabra con dibujo al recoger: la primera vez de cada objeto en esta pantalla. */
    const palabras = createPalabrasRecoger();
    let cameraY = level.orientation === "vertical" ? Math.max(0, (level.height ?? VIEW_HEIGHT) - VIEW_HEIGHT)
      : level.orientation === "explore" ? exploreCameraTarget(level, player, { width: VIEW_WIDTH, height: VIEW_HEIGHT }).y : 0;
    let apples = 0;
    let checkpointIndex = -1;
    let respawnX = level.start.x;
    let respawnY = level.start.y;
    let previousJump = false;
    let previousShoot = false;
    let previousUp = false;
    let shopUsed = false;
    let starRemaining = 0;
    let starDuration = 0;
    let shootCooldown = 0;
    let completed = false;
    let frame = 0;
    let levelAge = 0;
    const detourClock = createDetourClock();
    const activatedSkyLifts = new Map<string, number>();
    let standingOnMechanism: string | null = null;
    let standingOnSkyLift: string | null = null;
    let walkCycleTime = 0;
    let lastSnapshot = 0;
    let vineStartedFrame = -1;
    let goalCelebrationFrame = -1;
    let lastSpringX = -1;
    let lastSpringFrame = -100;
    let skyBounceUses = 0;
    let skyBounceSteerLock = 0;
    const transition = createLevelTransition((snapshot) => callbacksRef.current.onSnapshot(snapshot));
    const currentSnapshot = (): GameSnapshot => ({
      apples, stickers: [...collectedStickers], power: player.power,
      checkpoint: checkpointIndex + 1, paused: !runningRef.current,
      ...(starRemaining > 0 ? { starSeconds: starRemaining } : {}),
      ...(explore ? { kittens: { found: explore.found.length, total: level.lostKittens?.length ?? 0 } } : {}),
    });
    returnFromDetourRef.current = () => {
      setExcursion(null);
      callbacksRef.current.onDetourActiveChange?.(null);
      inputRef.current.jump = false;
      inputRef.current.jumpQueued = false;
      callbacksRef.current.onSnapshot(currentSnapshot());
    };
    returnFromShopRef.current = () => {
      starRemaining = secretShopRewardSeconds(shopResultRef.current ?? 0);
      starDuration = starRemaining;
      shopOpenRef.current = false;
      setShopOpen(false);
      callbacksRef.current.onShopActiveChange?.(false);
      callbacksRef.current.onSnapshot(currentSnapshot());
      if (statusRef.current) statusRef.current.textContent = t(starRemaining > 0 ? "partida.avisos.estelar.oculto" : "partida.avisos.adiosGatito.oculto");
    };
    const finishLevel = (delay: number, complete: (snapshot: GameSnapshot) => void) => {
      if (completed) return;
      transition.begin(currentSnapshot(), delay, complete);
      completed = true;
    };

    const enterSecretVine = () => {
      if (completed) return;
      player.vx = 0;
      player.vy = 0;
      callbacksRef.current.playSound("checkpoint");
      finishLevel(SALIDA_SEGUNDOS, () => callbacksRef.current.onSecretExit());
    };

    const restartRoom = (fromHazard: boolean) => {
      if (!puzzle || !level.puzzleRooms) return;
      const room = level.puzzleRooms[puzzle.room];
      resetRoom(level, puzzle, puzzle.room, levelAge);
      sparks.length = 0;
      player.x = room.entry.x;
      player.y = room.entry.y;
      player.vx = 0;
      player.vy = 0;
      player.jumpsUsed = 0;
      player.invincible = 1;
      callbacksRef.current.playSound(fromHazard ? "hurt" : "checkpoint");
      if (statusRef.current) statusRef.current.textContent = t(fromHazard ? "partida.avisos.salaPeligro.oculto" : "partida.avisos.salaReinicio.oculto");
    };
    restartRoomRef.current = () => restartRoom(false);

    const respawn = () => {
      // En las salas caer o tocar un peligro no cuesta vidas: se vuelve a la entrada.
      if (puzzle) {
        restartRoom(true);
        return;
      }
      const spawn = level.orientation === "vertical"
        ? visibleSkyRespawn(level, cameraY, VIEW_HEIGHT, player.width, player.height) ?? { x: respawnX, y: respawnY }
        : explore ? { x: respawnX, y: respawnY }
        : mechanicRespawn(level, respawnX, player.width, player.height);
      player.x = spawn.x;
      player.y = spawn.y;
      player.vx = 0;
      player.vy = 0;
      if (hasWorldMechanics(level)) {
        player.grounded = false;
        player.coyote = 0;
        player.jumpBuffer = 0;
      }
      player.power = "normal";
      starRemaining = 0;
      player.invincible = 1.4;
      player.jumpsUsed = 0;
      player.springLaunch = false;
      player.doubleJumpFx = 0;
      player.shootFx = 0;
      skyBounceSteerLock = 0;
      projectiles.length = 0;
      cannonballs.length = 0;
      callbacksRef.current.onLoseLife();
      if (level.world === 17 && statusRef.current) statusRef.current.textContent = t("partida.avisos.nubeRecoge.oculto");
    };

    const hurt = () => {
      if (player.invincible > 0 || starRemaining > 0) return;
      callbacksRef.current.playSound("hurt");
      bursts.push({ x: player.x + player.width / 2, y: player.y + 22, life: 0.45, color: "#ff8b9d", kind: "stars" });
      if (player.power === "cat") {
        player.power = "apple";
        player.invincible = 1.8;
        player.vy = -300;
      } else if (player.power === "apple") {
        player.power = "normal";
        player.invincible = 1.8;
        player.vy = -300;
      } else {
        respawn();
      }
    };

    const update = (delta: number, now: number) => {
      levelAge += delta;
      const previousSupports = detourSupports(level, detourClock);
      advanceDetourClock(detourClock, level, delta, standingOnMechanism);
      const supports = detourSupports(level, detourClock);
      if (player.grounded && standingOnMechanism) {
        const before = previousSupports.find((entry) => entry.id === standingOnMechanism);
        const after = supports.find((entry) => entry.id === standingOnMechanism);
        if (before && after) {
          player.x += after.x - before.x;
          player.y += after.y - before.y;
        }
      }
      const input = inputRef.current;
      const pad = readGameplayPad(firstConnectedGamepad());
      const available = canEnterSecretShop(level.secretShop, player, shopUsed);
      const detourAvailable = canEnterSecretShop(level.detourEntrance, player, false);
      const toggle = level.detourSwitches?.find((entry) => canEnterSecretShop(entry, player, false));
      const skyLift = level.skyLifts?.find((entry) => !activatedSkyLifts.has(entry.id) && canEnterSecretShop(entry.lever, player, false));
      const interaction: Interaccion | "" = detourAvailable ? "explorar" : skyLift ? "subir" : toggle ? "activar" : available ? "entrar" : "";
      if (interaction !== interactionRef.current) {
        interactionRef.current = interaction;
        if (interaction) setInteraction(interaction);
        doorAvailableRef.current = Boolean(interaction);
        setDoorAvailable(Boolean(interaction));
      }
      const enter = Boolean(input.enterQueued) || (pad.up && !previousUp);
      previousUp = pad.up;
      input.enterQueued = false;
      if (enter && detourAvailable && level.detourEntrance) {
        runningRef.current = false;
        gameLoopRef.current?.setRunning(false);
        input.jumpQueued = false;
        input.jump = false;
        player.vx = 0;
        callbacksRef.current.onDetourVisit?.(level.detourEntrance.id);
        callbacksRef.current.onDetourActiveChange?.(level.detourEntrance.id);
        callbacksRef.current.playSound("checkpoint");
        setExcursion(level.detourEntrance.id);
        return;
      }
      if (enter && toggle) {
        if (detourClock.switches.has(toggle.id)) detourClock.switches.delete(toggle.id);
        else detourClock.switches.add(toggle.id);
        input.jumpQueued = false;
        input.jump = false;
        callbacksRef.current.playSound("block");
        if (statusRef.current) statusRef.current.textContent = t(toggle.id === "bell" ? "partida.avisos.ruedaCambia.oculto" : toggle.id === "books" ? "partida.avisos.librosCambian.oculto" : "partida.avisos.aguaDespierta.oculto");
      }
      if (enter && skyLift) {
        activatedSkyLifts.set(skyLift.id, levelAge);
        input.jumpQueued = false;
        input.jump = false;
        callbacksRef.current.playSound("checkpoint");
        if (statusRef.current) statusRef.current.textContent = t("partida.avisos.ascensor.oculto");
      }
      if (available && enter && level.secretShop) {
        shopUsed = true;
        shopOpenRef.current = true;
        shopResultRef.current = null;
        doorAvailableRef.current = false;
        setDoorAvailable(false);
        runningRef.current = false;
        gameLoopRef.current?.setRunning(false);
        input.jumpQueued = false;
        input.jump = false;
        player.vx = 0;
        player.vy = 0;
        callbacksRef.current.onShopVisit?.(level.secretShop.id);
        callbacksRef.current.onShopActiveChange?.(true);
        setShopOpen(true);
        return;
      }
      const previousLiftPlatforms = (level.skyLifts ?? []).map((lift) => skyLiftPlatform(lift, activatedSkyLifts.get(lift.id), levelAge - delta));
      const liftPlatforms = (level.skyLifts ?? []).map((lift) => skyLiftPlatform(lift, activatedSkyLifts.get(lift.id), levelAge));
      if (player.grounded && standingOnSkyLift) {
        const index = level.skyLifts?.findIndex((lift) => lift.id === standingOnSkyLift) ?? -1;
        if (index >= 0) player.y += liftPlatforms[index].y - previousLiftPlatforms[index].y;
      }
      const platforms = [...getMechanicPlatforms(level, levelAge), ...supports, ...liftPlatforms];
      if (explore) platforms.push(...shortcutWalls(level, explore));
      if (puzzle) {
        if (slideCrates(puzzle, delta, player).length) callbacksRef.current.playSound("block");
        platforms.push(...puzzlePlatforms(level, puzzle, levelAge));
      }
      const previousStar = starRemaining;
      starRemaining = Math.max(0, starRemaining - delta);
      if (previousStar > 0 && starRemaining === 0) callbacksRef.current.onSnapshot(currentSnapshot());
      const left = input.left || pad.left;
      const right = input.right || pad.right;
      const jump = input.jump || pad.jump;
      const shoot = input.shoot || pad.shoot;
      const swimming = waterAt(player, level.waterZones);
      const liftZones = level.world === 7 ? level.updrafts : level.sandGeysers;
      const inUpdraft = !swimming && liftZones?.some((zone) => intersects(player, zone));
      const newStroke = input.jumpQueued || (jump && !previousJump);
      skyBounceSteerLock = Math.max(0, skyBounceSteerLock - delta);

      const standingOnIce = player.grounded && level.platforms.some((platform) =>
        (platform.kind === "ice-ground" || platform.kind === "ice-ledge" || platform.kind === "ice-wall") &&
        player.x + player.width > platform.x && player.x < platform.x + platform.width &&
        Math.abs(player.y + player.height - platformSurfaceY(platform)) < 6);
      if (skyBounceSteerLock > 0) {
        // La nube elige el primer tramo; enseguida se recupera el control para buscar dónde aterrizar.
      } else if (left === right) player.vx *= Math.pow(standingOnIce ? 0.32 : 0.0008, delta);
      else {
        const targetVelocity = (left ? -1 : 1) * (swimming ? 175 : MOVE_SPEED);
        player.vx = standingOnIce ? player.vx + Math.max(-520 * delta, Math.min(520 * delta, targetVelocity - player.vx)) : targetVelocity;
        player.facing = left ? -1 : 1;
      }
      const activeWind = level.windZones?.find((zone) => intersects(player, zone));
      if (activeWind && !swimming) player.vx = Math.max(-360, Math.min(360, player.vx + activeWind.direction * activeWind.strength * delta));

      if (input.jumpQueued || (jump && !previousJump)) player.jumpBuffer = 0.13;
      input.jumpQueued = false;
      previousJump = jump;
      player.jumpBuffer = Math.max(0, player.jumpBuffer - delta);
      player.coyote = player.grounded ? 0.12 : Math.max(0, player.coyote - delta);
      if (swimming) {
        player.vy = swimmingVelocity(player.vy, jump || newStroke, delta);
        if (newStroke) player.vy = -190;
        player.jumpsUsed = 0;
        player.springLaunch = false;
        player.jumpBuffer = 0;
      } else if (player.jumpBuffer > 0 && (player.coyote > 0 || inUpdraft) && player.jumpsUsed === 0) {
        player.vy = -JUMP_SPEED;
        player.grounded = false;
        player.coyote = 0;
        player.jumpBuffer = 0;
        player.jumpsUsed = 1;
        callbacksRef.current.playSound("jump");
      } else if (player.jumpBuffer > 0 && !player.grounded && player.jumpsUsed === 1) {
        player.vy = -JUMP_SPEED * 0.94;
        player.jumpBuffer = 0;
        player.jumpsUsed = 2;
        player.doubleJumpFx = 0.38;
        callbacksRef.current.playSound("jump");
      }
      if (!swimming && !jump && player.vy < -220 && !player.springLaunch) player.vy += GRAVITY * 1.4 * delta;

      shootCooldown = Math.max(0, shootCooldown - delta);
      if ((input.shootQueued || (shoot && !previousShoot)) && player.power === "cat" && shootCooldown === 0) {
        projectiles.push({
          x: player.x + player.width / 2 + player.facing * 20,
          y: player.y + 24,
          vx: player.facing * 430,
          vy: -45,
          life: 2.2,
        });
        shootCooldown = 0.35;
        player.shootFx = 0.24;
        callbacksRef.current.playSound("yarn");
      }
      input.shootQueued = false;
      previousShoot = shoot;

      const previousX = player.x;
      player.x += (player.vx + conveyorSpeed(player, level.platforms)) * delta;
      // Solo en el cielo los dos bordes están conectados; en las demás subidas son paredes.
      player.x = level.world === 17
        ? wrapHorizontalPosition(player.x, player.width, level.width)
        : Math.max(0, Math.min(level.width - player.width, player.x));
      if (puzzle && player.grounded) player.x = pushCrates(puzzle, player, previousX, player.x, delta, levelAge);
      for (const platform of puzzle ? [...level.platforms, ...puzzlePlatforms(level, puzzle, levelAge)] : explore ? [...level.platforms, ...shortcutWalls(level, explore)] : level.platforms) {
        const resolvedX = resolveHorizontalWallCollision(previousX, player.x, player.y, player.width, player.height, platform);
        if (resolvedX === player.x) continue;
        player.x = resolvedX;
        player.vx = 0;
      }
      const previousY = player.y;
      const previousBottom = previousY + player.height;
      const wasGrounded = player.grounded;
      if (!swimming) player.vy += GRAVITY * delta;
      if (!swimming && liftZones?.length) {
        player.vy = updraftVelocity(player.vy, liftZones.filter((zone) => intersects(player, zone)), delta);
      }
      player.y += player.vy * delta;
      // Al soltar el botón se hunde; una brazada nueva en la superficie permite salir del agua.
      if (swimming && player.y + player.height * 0.6 < swimming.y + 1 && !newStroke) {
        player.y = swimming.y + 1 - player.height * 0.6;
        player.vy = 0;
      }
      player.grounded = false;
      standingOnMechanism = null;
      standingOnSkyLift = null;
      for (const platform of platforms) {
        const horizontal = player.x + player.width > platform.x && player.x < platform.x + platform.width;
        const surfaceY = platformSurfaceY(platform);
        const isSpring = platform.kind === "spring" || platform.kind === "dew" || platform.kind === "gift-spring" || platform.kind === "sky-bounce";
        // El muelle solo responde al aterrizaje de un salto: al caminar se puede pasar de largo.
        const landed = isSpring
          ? landsOnSpring(wasGrounded, previousBottom, player.y + player.height, surfaceY, player.vy)
          : player.vy >= 0 && previousBottom <= surfaceY + 10 && player.y + player.height >= surfaceY;
        if (horizontal && landed) {
          player.y = surfaceY - player.height;
          if (isSpring) {
            const skyBounce = platform.kind === "sky-bounce";
            player.vy = -(skyBounce ? platform.bounceSpeed ?? SKY_BOUNCE_SPEED : SPRING_SPEED);
            if (skyBounce) {
              const direction = (skyBounceUses + Math.round(platform.x)) % 2 === 0 ? -1 : 1;
              player.vx = direction * (platform.bounceDrift ?? 330);
              player.facing = direction;
              skyBounceSteerLock = .42;
              skyBounceUses += 1;
              if (statusRef.current) statusRef.current.textContent = t("partida.avisos.nubeEsponjosa.oculto");
            }
            player.grounded = false;
            player.jumpsUsed = 2;
            player.springLaunch = true;
            player.doubleJumpFx = 0.32;
            lastSpringX = platform.x;
            lastSpringFrame = frame;
            callbacksRef.current.playSound("jump");
          } else {
            player.vy = 0;
            player.grounded = true;
            player.jumpsUsed = 0;
            player.springLaunch = false;
            standingOnMechanism = supports.find((entry) => entry === platform)?.id ?? null;
            const liftIndex = liftPlatforms.indexOf(platform);
            standingOnSkyLift = liftIndex >= 0 ? level.skyLifts?.[liftIndex]?.id ?? null : null;
          }
        } else if ((platform.kind === "cave-wall" || platform.kind === "castle-wall" || platform.kind === "sea-wall" || platform.kind === "dino-wall" || platform.kind === "volcano-wall" || platform.kind === "ice-wall" || platform.kind === "puzzle-block") && horizontal && player.vy < 0) {
          const platformBottom = platform.y + platform.height;
          if (previousY >= platformBottom - 10 && player.y <= platformBottom) {
            player.y = platformBottom;
            player.vy = 0;
          }
        }
      }

      if (puzzle) {
        for (const event of stepTriggers(level, puzzle, player, player.grounded && !wasGrounded, levelAge)) {
          bursts.push({ x: event.from.x, y: event.from.y, life: 0.45, color: event.kind === "color" ? "#ffc4e1" : "#ffe477", kind: "stars" });
          if (event.to) sparks.push({ from: event.from, to: event.to, life: 1 });
          callbacksRef.current.playSound(event.kind === "door" ? "checkpoint" : "block");
          if (statusRef.current) statusRef.current.textContent = t(event.kind === "door" ? "partida.avisos.puertaAbre.oculto" : event.kind === "color" ? "partida.avisos.plataformasColor.oculto" : "partida.avisos.botonHuella.oculto");
        }
        if (advanceRoom(level, puzzle, player.x, levelAge)) {
          checkpointIndex = puzzle.room - 1;
          callbacksRef.current.playSound("checkpoint");
          if (statusRef.current) statusRef.current.textContent = t("partida.avisos.salaNueva.oculto", { n: puzzle.room + 1 });
        }
        for (let index = sparks.length - 1; index >= 0; index -= 1) {
          sparks[index].life -= delta;
          if (sparks[index].life <= 0) sparks.splice(index, 1);
        }
        const hint = restartHintActive(puzzle, levelAge);
        if (hint !== roomHintShown) {
          roomHintShown = hint;
          setRoomHint(hint);
        }
      }

      for (const block of level.rewardBlocks) {
        const horizontal = player.x + player.width > block.x && player.x < block.x + 48;
        if (!horizontal) continue;
        if (player.vy >= 0 && previousBottom <= block.y + 10 && player.y + player.height >= block.y) {
          player.y = block.y - player.height;
          player.vy = 0;
          player.grounded = true;
          player.jumpsUsed = 0;
        } else if (player.vy < 0 && previousY >= block.y + 40 && player.y <= block.y + 48) {
          player.y = block.y + 48;
          player.vy = 95;
          if (!hitBlocks.has(block.id)) {
            hitBlocks.add(block.id);
            callbacksRef.current.playSound("block");
            if (block.reward === "secret-vine") {
              vineStartedFrame = frame;
            } else {
              items.push({ id: `${block.id}-reward`, kind: block.reward, x: block.x + 4, y: block.y - 42, age: 0, rise: 0, fromBlock: true });
            }
          }
        }
      }

      if (level.spikePits?.some((pit) => intersects(player, { x: pit.x + 8, y: pit.y + 16, width: pit.width - 16, height: pit.height }))) {
        callbacksRef.current.playSound("hurt");
        respawn();
        return;
      }
      if (level.deadlyWater?.some((zone) => intersects(player, { x: zone.x + 5, y: zone.y + 8, width: zone.width - 10, height: zone.height }))) {
        callbacksRef.current.playSound("hurt");
        respawn();
        return;
      }
      if (level.lavaJets?.some((jet) => {
        const state = lavaJetState(jet, levelAge);
        return state.extension > .12 && intersects(player, state.rect);
      })) {
        hurt();
      }
      if (player.y > (level.orientation === "vertical" ? cameraY + VIEW_HEIGHT + 100 : explore ? (level.height ?? VIEW_HEIGHT) + 80 : VIEW_HEIGHT + 120)) {
        callbacksRef.current.playSound("hurt");
        respawn();
      }

      for (const item of items) {
        if (collected.has(item.id)) continue;
        item.age += delta;
        item.rise = Math.min(1, item.rise + delta * 2.8);
        if (item.fromBlock && item.age > 0.9 && item.rise === 1 && item.y < 410) {
          item.x += delta * 42;
          item.y = Math.min(410, item.y + delta * 115);
        }
        if (item.rise < 0.72) continue;
        const itemY = item.y + (1 - item.rise) * 48;
        const box = { x: item.x, y: itemY, width: 40, height: 40 };
        if (!intersects(player, box)) continue;
        collected.add(item.id);
        if (item.kind === "apple") {
          apples += 1;
          callbacksRef.current.onAppleCollected?.(1);
          if (player.power === "normal") player.power = "apple";
          callbacksRef.current.playSound("apple");
          if (statusRef.current) statusRef.current.textContent = t("partida.avisos.manzana.oculto");
          palabras.recoger("apple");
        } else if (item.kind === "cat") {
          player.power = "cat";
          callbacksRef.current.playSound("cat");
          if (statusRef.current) statusRef.current.textContent = t("partida.avisos.gata.oculto");
          palabras.recoger("cat");
        } else {
          collectedStickers.add(item.id);
          callbacksRef.current.playSound("sticker");
          if (statusRef.current) statusRef.current.textContent = t("partida.avisos.insignia.oculto");
          palabras.recoger("sticker");
        }
      }

      if (restStop) {
        // Paseo de los amigos: nadie hace daño. Miran a Noa, saludan una vez al acercarse y saltan con ella.
        const jumpedNow = player.vy < -500 && player.jumpsUsed > 0;
        enemies.forEach((enemy, index) => {
          enemy.vx = player.x + player.width / 2 >= enemy.x + enemy.width / 2 ? 1 : -1;
          enemy.phase += delta * 2.4;
          friendHops.set(enemy.id, Math.max(0, (friendHops.get(enemy.id) ?? 0) - delta));
          const close = Math.abs(player.x + player.width / 2 - enemy.x - enemy.width / 2) < GREET_DISTANCE;
          if (jumpedNow && Math.abs(player.x - enemy.x) < 320 && (friendHops.get(enemy.id) ?? 0) === 0) friendHops.set(enemy.id, .5);
          if (!close || greetedFriends.has(enemy.id)) return;
          greetedFriends.add(enemy.id);
          friendHops.set(enemy.id, .5);
          const friend = restStop.friends[index];
          friendSay = { text: `${textoLienzo("partida.lienzo.noMuerde.rotulo")} ${friend?.line ?? ""}`.trim(), life: 3.2, id: enemy.id };
          callbacksRef.current.playSound("cat");
          if (friend) callbacksRef.current.onFriendGreeted?.(restStop.world, friend.kind);
          if (statusRef.current) statusRef.current.textContent = t("partida.avisos.amigoSaludado.oculto", { linea: friend?.line ?? "" });
        });
      }
      if (friendSay) friendSay.life -= delta;
      enemies.forEach((enemy) => {
        if (!enemy.active || restStop) return;
        if (level.world === 3 && wolfSleepState(enemy, levelAge) !== "awake") return;
        enemy.phase += delta * 2.4;
        enemy.x += enemy.vx * delta;
        const enemyDistance = Math.abs(player.x - enemy.x);
        if ((enemy.kind === "wolf" || enemy.kind === "boar") && enemyDistance < 340 && !warnedEnemies.has(enemy.id)) {
          warnedEnemies.add(enemy.id);
          callbacksRef.current.playSound(enemy.kind === "boar" ? "snort" : "howl");
        }
        // Primero resolvemos el borde de la ruta. Hacerlo después de decidir
        // la carga hacía que el jabalí se invirtiera dos veces por frame.
        const patrol = keepInsidePatrol(enemy.x, enemy.vx, enemy.minX, enemy.maxX);
        enemy.x = patrol.x;
        enemy.vx = patrol.velocity;
        if (enemy.kind === "boar" && enemyDistance < 310 && player.x >= enemy.minX && player.x <= enemy.maxX) {
          enemy.vx = boarChargeVelocity(enemy.x, player.x, enemy.minX, enemy.maxX, enemy.vx);
        }
        const hitbox = {
          x: enemy.x,
          y: enemyY(enemy),
          width: enemy.width,
          height: enemy.height,
        };
        if (!intersects(player, hitbox)) return;
        if (enemy.kind !== "urchin" && enemy.kind !== "fish" && player.vy > 60 && previousBottom <= hitbox.y + 15) {
          enemy.active = false;
          player.vy = -390;
          player.jumpsUsed = 1;
          bursts.push({ x: enemy.x + enemy.width / 2, y: hitbox.y + 8, life: 0.5, color: "#ffe477", kind: "stars" });
          callbacksRef.current.playSound("stomp");
        } else {
          hurt();
        }
      });

      chainGuardians.forEach((guardian) => {
        const previousPhase = guardian.phase;
        updateChainGuardian(guardian, delta, player.x + player.width / 2);
        if (guardian.phase === "warning" && previousPhase !== "warning" && Math.abs(player.x - guardian.x) < 800) {
          callbacksRef.current.playSound("countdown");
          if (statusRef.current) statusRef.current.textContent = t("partida.avisos.perritoAvisa.oculto");
        }
        if (intersects(player, guardianHitbox(guardian))) hurt();
      });

      waterJumpers.forEach((jumper) => {
        jumper.age += delta;
        const state = waterJumperState(jumper);
        if (!state.active || !intersects(player, { x: jumper.x, y: state.y, width: jumper.width, height: jumper.height })) return;
        hurt();
      });

      cannons.forEach((cannon) => {
        cannon.cooldown -= delta;
        if (cannon.cooldown > 0 || Math.abs(player.x - cannon.x) > 900) return;
        cannonballs.push({
          x: cannon.x + (cannon.direction === -1 ? -24 : 38),
          y: cannon.y + 4,
          vx: cannon.direction * (205 + level.screen * 14),
          active: true,
        });
        cannon.cooldown = cannon.interval;
        callbacksRef.current.playSound("cannon");
      });

      cannonballs.forEach((ball) => {
        if (!ball.active) return;
        ball.x += ball.vx * delta;
        if (ball.x < -80 || ball.x > level.width + 80) {
          ball.active = false;
          return;
        }
        const hitbox = { x: ball.x, y: ball.y, width: 24, height: 24 };
        if (!intersects(player, hitbox)) return;
        ball.active = false;
        if (player.vy > 60 && previousBottom <= hitbox.y + 12) {
          player.vy = -360;
          player.jumpsUsed = 1;
          bursts.push({ x: ball.x + 12, y: ball.y + 12, life: 0.45, color: "#ffe477", kind: "puff" });
          callbacksRef.current.playSound("stomp");
        } else {
          hurt();
        }
      });

      projectiles.forEach((ball) => {
        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;
        ball.vy += 120 * delta;
        ball.life -= delta;
        const ballHitbox = { x: ball.x - 10, y: ball.y - 10, width: 20, height: 20 };
        // El ovillo se dibuja a 34 × 34: su borde visible, no solo el centro,
        // debe detenerse al tocar la roca del arrecife.
        const visibleBall = { x: ball.x - 17, y: ball.y - 17, width: 34, height: 34 };
        if (level.world === 8 && projectileHitsWaterWall(visibleBall, level.platforms)) {
          ball.life = 0;
          bursts.push({ x: ball.x, y: ball.y, life: 0.3, color: "#d8f5fb", kind: "puff" });
          callbacksRef.current.playSound("block");
          return;
        }
        enemies.forEach((enemy) => {
          if (!enemy.active) return;
          const enemyHitbox = { ...enemy, y: enemyY(enemy) };
          if (intersects(ballHitbox, enemyHitbox)) {
            enemy.active = false;
            ball.life = 0;
            bursts.push({ x: enemy.x + enemy.width / 2, y: enemyHitbox.y + 10, life: 0.5, color: "#dca0f1", kind: "stars" });
            callbacksRef.current.playSound("stomp");
          }
        });
        if (ball.life > 0 && chainGuardians.some((guardian) => intersects(ballHitbox, guardianHitbox(guardian)))) {
          ball.life = 0;
          bursts.push({ x: ball.x, y: ball.y, life: .3, color: "#b5e6e0", kind: "puff" });
          callbacksRef.current.playSound("block");
        }
        cannonballs.forEach((cannonball) => {
          if (!cannonball.active) return;
          if (intersects(ballHitbox, { x: cannonball.x, y: cannonball.y, width: 24, height: 24 })) {
            cannonball.active = false;
            ball.life = 0;
            bursts.push({ x: cannonball.x + 12, y: cannonball.y + 12, life: 0.45, color: "#eef1ff", kind: "puff" });
            callbacksRef.current.playSound("stomp");
          }
        });
      });
      for (let index = projectiles.length - 1; index >= 0; index -= 1) {
        if (projectiles[index].life <= 0) projectiles.splice(index, 1);
      }
      for (let index = cannonballs.length - 1; index >= 0; index -= 1) {
        if (!cannonballs[index].active) cannonballs.splice(index, 1);
      }
      for (let index = bursts.length - 1; index >= 0; index -= 1) {
        bursts[index].life -= delta;
        if (bursts[index].life <= 0) bursts.splice(index, 1);
      }

      level.checkpoints.forEach((checkpoint, index) => {
        if (index > checkpointIndex && player.x >= checkpoint) {
          checkpointIndex = index;
          respawnX = checkpoint + 22;
          callbacksRef.current.playSound("checkpoint");
          if (statusRef.current) statusRef.current.textContent = t("partida.avisos.bandera.oculto", { n: index + 1 });
          palabras.recoger("flag");
        }
      });
      level.verticalCheckpoints?.forEach((checkpoint, index) => {
        // En la exploración el punto seguro se toma al pasar por él; en las subidas, al llegar a su altura.
        const reached = explore
          ? player.grounded && Math.abs(player.x + player.width / 2 - checkpoint.x - 21) < 70 && Math.abs(player.y + player.height - checkpoint.y) < 8
          : player.y <= checkpoint.y;
        if (index > checkpointIndex && reached) {
          checkpointIndex = index;
          respawnX = checkpoint.x;
          respawnY = checkpoint.y - player.height;
          callbacksRef.current.playSound("checkpoint");
          if (statusRef.current) statusRef.current.textContent = t("partida.avisos.nubeSegura.oculto", { n: index + 1 });
          palabras.recoger("flag");
        }
      });

      const secretVine = level.rewardBlocks.find((block) => block.reward === "secret-vine");
      if (level.waterEntrance && intersects(player, level.waterEntrance)) {
        callbacksRef.current.playSound("checkpoint");
        finishLevel(SALIDA_SEGUNDOS, () => callbacksRef.current.onWaterExit());
        return;
      }
      if (secretVine && vineStartedFrame >= 0) {
        const growth = Math.min(1, (frame - vineStartedFrame) / 70);
        const vineHeight = Math.max(1, Math.round((secretVine.y + 80) * growth));
        const vineHitbox = { x: secretVine.x - 28, y: secretVine.y - vineHeight, width: 104, height: vineHeight + 120 };
        if (growth >= 0.65 && intersects(player, vineHitbox)) {
          if (statusRef.current) statusRef.current.textContent = t("partida.avisos.enredadera.oculto");
          enterSecretVine();
          return;
        }
      }

      if (chase && level.chase && !completed) {
        for (const event of stepChase(level.chase, chase, player, delta)) {
          if (event.kind === "run") callbacksRef.current.playSound("jump");
          if (event.text) chaseSay = { text: event.text, life: event.kind === "caught" ? 9 : 2.2 };
          if (event.kind === "caught") {
            callbacksRef.current.playSound("goal");
            if (statusRef.current) statusRef.current.textContent = t("partida.avisos.travieso.oculto");
            finishLevel(1.45, (snapshot) => callbacksRef.current.onComplete(snapshot));
          }
        }
      }
      if (chaseSay) chaseSay.life -= delta;
      if (chase?.caught) chaseCaughtAge += delta;

      if (explore && !completed) {
        for (const event of stepExplore(level, explore, player, delta)) {
          if (event.kind === "meow") callbacksRef.current.playSound("yarn");
          if (event.kind === "found") {
            callbacksRef.current.playSound("cat");
            bursts.push({ x: event.kitten!.x, y: event.kitten!.y - 30, life: .5, color: "#ffe477", kind: "stars" });
            if (statusRef.current) statusRef.current.textContent = t("partida.avisos.gatitoEncontrado.oculto", { n: explore.found.length, total: level.lostKittens?.length ?? 3 });
            callbacksRef.current.onSnapshot(currentSnapshot());
          }
          if (event.kind === "open") {
            callbacksRef.current.playSound("checkpoint");
            if (statusRef.current) statusRef.current.textContent = t("partida.avisos.tresGatitos.oculto");
          }
        }
        if (reachedGate(level, explore, player)) {
          callbacksRef.current.playSound("goal");
          if (statusRef.current) statusRef.current.textContent = t("partida.avisos.gatitosCasa.oculto");
          finishLevel(SALIDA_SEGUNDOS, (snapshot) => callbacksRef.current.onComplete(snapshot));
        }
      }

      const reachedGoal = !level.chase && !explore && (level.orientation === "vertical"
        ? player.y <= (level.goalY ?? goalSurfaceY) && Math.abs(player.x + player.width / 2 - level.goalX) < 130
        : hasReachedGoalFlag(player, level.goalX, goalSurfaceY));
      if (!completed && reachedGoal) {
        goalCelebrationFrame = frame;
        player.x = level.goalX - 48;
        player.y = goalSurfaceY - player.height;
        player.vx = 0;
        player.vy = 0;
        player.grounded = true;
        player.jumpsUsed = 0;
        player.facing = 1;
        callbacksRef.current.playSound("goal");
        if (statusRef.current) statusRef.current.textContent = t("partida.avisos.banderin.oculto");
        finishLevel(
          level.boss ? SALIDA_SEGUNDOS : 1.45,
          (snapshot) => level.boss ? callbacksRef.current.onBossEncounter(snapshot) : callbacksRef.current.onComplete(snapshot),
        );
      }

      player.invincible = Math.max(0, player.invincible - delta);
      player.doubleJumpFx = Math.max(0, player.doubleJumpFx - delta);
      player.shootFx = Math.max(0, player.shootFx - delta);
      walkCycleTime = player.grounded && Math.abs(player.vx) > 25 ? walkCycleTime + delta : 0;
      // En las salas la cámara queda fija en la sala y se desliza (~0,4 s) al pasar a la siguiente.
      const cameraTarget = puzzle && level.puzzleRooms ? level.puzzleRooms[puzzle.room].x : player.x - 330;
      if (explore) {
        // Exploración: la cámara sigue a Noa en los dos ejes, con adelanto hacia donde mira.
        const target = exploreCameraTarget(level, player, { width: VIEW_WIDTH, height: VIEW_HEIGHT });
        cameraX += (target.x - cameraX) * Math.min(1, delta * 9);
        cameraY += (target.y - cameraY) * Math.min(1, delta * 7);
      } else cameraX += (Math.max(0, Math.min(level.width - VIEW_WIDTH, cameraTarget)) - cameraX) * Math.min(1, delta * (puzzle ? 9 : 5));
      if (level.orientation === "vertical") {
        const targetY = Math.max(0, Math.min((level.height ?? VIEW_HEIGHT) - VIEW_HEIGHT, player.y - 250));
        cameraY = Math.min(cameraY, cameraY + (targetY - cameraY) * Math.min(1, delta * 5));
      }

      if (!completed && now - lastSnapshot > 130) {
        callbacksRef.current.onSnapshot(currentSnapshot());
        lastSnapshot = now;
      }
    };

    const drawPlayer = () => {
      const x = Math.round(player.x - cameraX);
      const protectedByApple = player.power === "apple" && starRemaining <= 0;
      if (waterAt(player, level.waterZones) && !player.grounded && raster.swim.complete && raster.swim.naturalWidth) {
        const row = player.power === "cat" ? 2 : protectedByApple ? 1 : 0;
        const column = Math.floor(frame / 14) % 2;
        const cellWidth = raster.swim.naturalWidth / 2;
        const cellHeight = raster.swim.naturalHeight / 3;
        context.save();
        context.globalAlpha = starRemaining <= 0 && player.invincible > 0 && Math.floor(player.invincible * 12) % 2 === 0 ? 0.45 : 1;
        context.translate(x + player.width / 2, player.y + player.height / 2);
        context.scale(player.facing, 1);
        context.drawImage(raster.swim, column * cellWidth, row * cellHeight, cellWidth, cellHeight, -53, -47, 106, 94);
        context.restore();
        return;
      }
      // Cuatro pasos por ciclo, a ritmo fijo también en pantallas de alta frecuencia.
      const runningFrame = walkAnimationFrame(walkCycleTime);
      let row = 0;
      let column = 0;
      if (player.power === "cat") {
        row = 3;
        column = player.grounded ? (Math.abs(player.vx) > 25 ? runningFrame % 2 : 0) : 2;
      } else if (!player.grounded) {
        row = 2;
        column = player.vy < 0 ? 0 : 1;
      } else if (Math.abs(player.vx) > 25) {
        row = 1;
        column = runningFrame;
      }
      const flashing = starRemaining <= 0 && player.invincible > 0 && Math.floor(player.invincible * 12) % 2 === 0;
      if (flashing) context.globalAlpha = 0.38;
      const usesCatThrowSprite = player.power === "cat" && player.shootFx > 0;
      const usesCatYarnSprite = player.power === "cat" && player.grounded && Math.abs(player.vx) <= 25;
      const usesCatRunSprite = player.power === "cat" && player.grounded && Math.abs(player.vx) > 25;
      const usesCleanCatJump = player.power === "cat" && !player.grounded;
      const usesCleanJump = player.power !== "cat" && !player.grounded;
      const activeSprite = getImage(usesCatThrowSprite ? "./assets/sprites/noa-cat-throw-v1.webp"
        : usesCatYarnSprite ? "./assets/sprites/noa-cat-yarn-v2.webp"
        : usesCatRunSprite ? "./assets/sprites/noa-cat-run-v2.webp"
        : usesCleanCatJump ? "./assets/sprites/noa-cat-jump-v2.webp"
        : usesCleanJump ? (protectedByApple ? "./assets/sprites/noa-jump-gold-armor-v1.webp" : "./assets/sprites/noa-jump-v2.webp")
        : protectedByApple ? "./assets/sprites/noa-sprite-sheet-gold-armor-v1.webp" : "./assets/sprites/noa-sprite-sheet.webp");
      if (activeSprite.complete && activeSprite.naturalWidth) {
        const cellWidth = activeSprite.naturalWidth / 4;
        context.save();
        if (player.facing === -1) {
          context.translate(x + player.width / 2, 0);
          context.scale(-1, 1);
          context.translate(-(x + player.width / 2), 0);
        }
        if (usesCatThrowSprite) {
          // Pose exclusiva de lanzamiento: deja claro que Noa ha disparado la lana.
          context.drawImage(activeSprite, x - 65, Math.round(player.y - 55), 175, 130);
        } else if (usesCatYarnSprite) {
          // Sprite independiente con transparencia: se conservan las orejas,
          // la bola de lana y la punta de la cola.
          context.drawImage(activeSprite, x - 64, Math.round(player.y - 61), 165, 130);
        } else if (usesCatRunSprite) {
          // Al correr, Noa gata usa una pose propia y un pequeño balanceo de
          // pasos, sin volver a la hoja de sprites que cortaba las orejas.
          const stepBob = runningFrame % 2 === 0 ? 0 : 2;
          context.drawImage(activeSprite, x - 65, Math.round(player.y - 54 + stepBob), 170, 125);
        } else if (usesCleanCatJump) {
          // El PNG de salto incluye margen transparente para que no se corten
          // orejas ni cola. Lo ampliamos para conservar el tamaño de Noa.
          context.drawImage(activeSprite, x - 48, Math.round(player.y - 45), 140, 140);
        } else if (usesCleanJump) {
          // La pose de salto normal también vive fuera de la hoja para que el
          // pelo no quede recortado al cruzar el borde de su celda.
          context.drawImage(activeSprite, x - 50, Math.round(player.y - 37), 145, 125);
        } else {
          // Estas filas no encajan exactamente en una cuadrícula: el recorte
          // anterior terminaba antes de las suelas. Tomamos la pose completa
          // y apoyamos su base visual en la misma superficie que la colisión.
          const sourceTop = row === 0 ? 0 : 360;
          const sourceHeight = row === 0 ? 342 : 300;
          const drawHeight = 110;
          context.drawImage(
            activeSprite,
            column * cellWidth + 14,
            sourceTop,
            cellWidth - 28,
            sourceHeight,
            x - 29,
            Math.round(player.y + player.height - drawHeight),
            100,
            drawHeight,
          );
        }
        context.restore();
      } else {
        context.fillStyle = "#aa6bd5";
        context.fillRect(x, player.y, player.width, player.height);
      }
      if (player.doubleJumpFx > 0) {
        const sparkle = Math.floor(player.doubleJumpFx * 40) % 2 === 0 ? "#fff3a5" : "#c987e8";
        context.fillStyle = sparkle;
        context.fillRect(x - 8, Math.round(player.y + 18), 7, 7);
        context.fillRect(x + player.width + 4, Math.round(player.y + 31), 6, 6);
        context.fillRect(x + 8, Math.round(player.y + player.height + 4), 5, 5);
      }
      if (player.grounded && Math.abs(player.vx) > 60 && frame % 8 < 3) {
        context.fillStyle = "rgba(255,244,214,.62)";
        const dustX = player.facing === 1 ? x - 7 : x + player.width + 2;
        context.fillRect(dustX, Math.round(player.y + player.height - 7), 8, 6);
        context.fillRect(dustX + (player.facing === 1 ? -5 : 5), Math.round(player.y + player.height - 13), 5, 5);
      }
      context.globalAlpha = 1;
    };

    // Techo de los carteles: bajo el HUD de esquinas, que no escala con el lienzo (en el móvil ocupa más del lienzo).
    const medirTechoCartel = () => {
      const hud = canvas.closest?.(".game-stage")?.querySelector(".hud-centro");
      const lienzo = canvas.getBoundingClientRect?.();
      if (lienzo?.width) ponerEscalaLienzo(lienzo.width / VIEW_WIDTH);
      if (!hud || !lienzo?.width) return CARTEL_ARRIBA;
      return techoCarteles(hud.getBoundingClientRect().bottom - lienzo.top, lienzo.width / VIEW_WIDTH);
    };
    let techoCartel = CARTEL_ARRIBA;
    const cartelesDeCaja: { lineas: string[]; centroX: number; arriba: number; color?: string; distancia: number }[] = [];

    // En vertical se ve una ventana 4:3 del lienzo que sigue a Noa (issue 323); el CSS la recorta.
    const enVertical = typeof matchMedia === "function" ? matchMedia("(orientation: portrait)") : null;
    let recorte = 0;
    let recorteAplicado = -1;
    const moverVista = () => {
      if (!enVertical?.matches) {
        if (recorteAplicado !== 0) {
          if (canvas.style) canvas.style.transform = "";
          ponerVista(0, VIEW_WIDTH);
          recorte = 0;
          recorteAplicado = 0;
        }
        return;
      }
      const objetivo = recorteObjetivo(player.x + player.width / 2 - cameraX);
      recorte = recorteAplicado < 0 ? objetivo : recorte + (objetivo - recorte) * .15;
      const redondo = Math.round(recorte);
      if (redondo !== recorteAplicado) {
        if (canvas.style) canvas.style.transform = `translateX(${(-redondo / VIEW_WIDTH * 100).toFixed(3)}%)`;
        recorteAplicado = redondo;
      }
      ponerVista(redondo, ANCHO_VERTICAL);
    };

    const render = () => {
      moverVista();
      const desplazaY = level.orientation === "vertical" || explore ? cameraY : 0;
      drawBackground(context, level, cameraX, frame, raster, cameraY);
      drawDetourScenery(context, level, cameraX);
      // Velo del color oscuro del mundo entre el fondo y el juego: el decorado baja y lo que se pisa destaca (issue 325).
      drawVelo(context, acentoMundo(level.world).oscuro, VIEW_WIDTH, VIEW_HEIGHT);
      context.save();
      if (level.orientation === "vertical" || explore) context.translate(0, -cameraY);
      // Ráfagas y géiseres van con el mundo: en subidas y exploraciones se mueven con la cámara vertical.
      level.windZones?.forEach((zone) => drawWindZone(context, zone, cameraX, levelAge, raster));
      if (level.world === 7) level.updrafts?.forEach((zone) => drawUpdraft(context, zone, cameraX, levelAge, raster));
      if (level.world === 14) level.sandGeysers?.forEach((zone) => drawUpdraft(context, zone, cameraX, levelAge, raster));
      level.deadlyWater?.forEach((zone) => drawDeadlyWater(context, zone, cameraX, frame, raster, level.theme));
      level.lavaJets?.forEach((jet) => drawLavaJet(context, jet, cameraX, levelAge, raster, level.world === 15));
      drawAdventurePrecipices(context, level, cameraX, raster.adventurePrecipices);
      level.platforms.forEach((platform) => drawPlatform(context, platform, cameraX, level.world, player.x, frame, raster, platform.x === lastSpringX && frame - lastSpringFrame < 9));
      if (puzzle) drawPuzzleRooms(context, level, puzzle, cameraX, sparks, frame, levelAge);
      if (explore) drawExploreWorld(context, level, explore, cameraX, frame);
      level.beatPlatforms?.forEach((platform) => {
        const active = beatPlatformActive(platform, levelAge);
        context.save(); context.globalAlpha = active ? 1 : .24;
        drawPlatform(context, platform, cameraX, level.world, player.x, frame, raster);
        context.restore();
        const x = platform.x - cameraX;
        context.fillStyle = active ? "#fff19a" : "#9d83b9";
        context.fillRect(x + 8, platform.y + 5, Math.max(8, platform.width - 16), 5);
      });
      level.skyLifts?.forEach((lift) => drawSkyLift(context, lift, skyLiftPlatform(lift, activatedSkyLifts.get(lift.id), levelAge).y,
        cameraX, activatedSkyLifts.has(lift.id), canEnterSecretShop(lift.lever, player, false), raster.skyLift));
      drawDetourMechanisms(context, level, detourClock, cameraX, motionRef.current);
      if (level.detourEntrance) drawDetourEntrance(context, level.detourEntrance, cameraX, canEnterSecretShop(level.detourEntrance, player, false), levelAge, motionRef.current);
      if (level.secretShop) drawSecretShopDoor(context, level.secretShop, cameraX, shopUsed, doorAvailableRef.current, raster);
      if (level.world === 11) level.bloomBridges?.forEach((bridge) => drawBloomBridge(context, bridge, cameraX, levelAge, raster));
      level.spikePits?.forEach((pit) => {
        const x = pit.x - cameraX;
        context.fillStyle = "#09091b";
        context.fillRect(x, pit.y, pit.width, pit.height);
        for (let tileX = x; tileX < x + pit.width; tileX += 105) {
          drawCastleSprite(context, raster.castle, "spikes", tileX, pit.y + 7, Math.min(110, x + pit.width - tileX), 90);
        }
      });
      if (level.id === "2-1") drawCaveEntrance(context, level.goalX - 125, cameraX, raster.cave);
      if (level.id === "2-2") drawCaveEntrance(context, -18, cameraX, raster.cave);
      if (level.waterEntrance) drawWaterEntrance(context, level.waterEntrance, cameraX, frame, raster);
      level.checkpoints.forEach((checkpoint, index) => {
        if (checkpoint - cameraX < -90 || checkpoint - cameraX > VIEW_WIDTH + 30) return;
        context.save();
        if (level.world === 8) context.translate(0, 34);
        drawCheckpoint(context, checkpoint, cameraX, index <= checkpointIndex, raster.checkpoint);
        context.restore();
      });
      level.rewardBlocks.forEach((block) => {
        const x = Math.round(block.x - cameraX);
        if (block.reward === "secret-vine") {
          drawSecretBlock(context, x, block.y, hitBlocks.has(block.id), raster.secret);
          if (hitBlocks.has(block.id)) drawSecretVine(context, x, block.y, Math.min(1, (frame - vineStartedFrame) / 70), raster.secret);
        } else {
          drawRewardBlock(context, x, block.y, hitBlocks.has(block.id), raster.collectibles);
        }
        // Los carteles de las cajas se dibujan al final, encima de objetos y decorado (issue 317).
        if (!hitBlocks.has(block.id) && Math.abs(player.x - block.x) < 230) {
          cartelesDeCaja.push({ lineas: [textoLienzo(block.reward === "secret-vine" ? "partida.lienzo.bloque.queHay.rotulo" : "partida.lienzo.bloque.debajo.rotulo")], centroX: x + 24, arriba: block.y - 50 - desplazaY, distancia: Math.abs(player.x - block.x) });
        } else if (block.reward === "secret-vine" && vineStartedFrame >= 0 && !completed && Math.abs(player.x - block.x) < 250) {
          cartelesDeCaja.push({ lineas: [textoLienzo("partida.lienzo.enredadera.rotulo")], centroX: x + 24, arriba: block.y - 54 - desplazaY, color: "#3f7651", distancia: Math.abs(player.x - block.x) });
        }
      });
      cannons.forEach((cannon) => drawCannon(context, cannon, cameraX, raster.cannon));
      items.forEach((item) => {
        if (collected.has(item.id)) return;
        const x = Math.round(item.x - cameraX);
        if (x < -60 || x > VIEW_WIDTH + 20) return;
        const y = item.y + (1 - item.rise) * 48;
        const bob = Math.round(Math.sin(frame * 0.08 + item.x) * 4);
        if (item.kind === "apple") drawApple(context, x + 4, y + bob, raster.collectibles);
        else if (item.kind === "cat") drawCatPower(context, x, y + bob, raster.collectibles);
        else {
          const sticker = getStickerSprite(item.id);
          drawSticker(context, x, y + bob, Math.floor(frame / 12) % 2, raster.collectibles, sticker ? raster.stickerSheets[level.world] : undefined, sticker?.column);
        }
      });
      enemies.forEach((enemy) => {
        const hop = restStop ? Math.sin(Math.min(1, (friendHops.get(enemy.id) ?? 0) / .5) * Math.PI) * 26 : 0;
        // Halo rojizo en lo que hace daño (issue 325); en el paseo de los amigos nadie muerde.
        const pantallaX = enemy.x - cameraX;
        if (!restStop && enemy.active && pantallaX > -120 && pantallaX < VIEW_WIDTH + 120) drawHalo(context, pantallaX, enemy.y, enemy.width, enemy.height);
        drawEnemy(context, hop ? { ...enemy, y: enemy.y - hop } : enemy, cameraX, !restStop && (enemy.kind === "wolf" || enemy.kind === "boar") && Math.abs(player.x - enemy.x) < 360, raster, level.world === 3 && !restStop ? wolfSleepState(enemy, levelAge) : "awake", levelAge);
      });
      chainGuardians.forEach((guardian) => {
        drawHalo(context, guardian.x - cameraX, guardian.y, guardian.width, guardian.height);
        drawChainGuardian(context, guardian, cameraX, raster);
      });
      waterJumpers.forEach((jumper) => drawWaterJumper(context, jumper, cameraX, raster.jumpingFish));
      cannonballs.forEach((ball) => drawCannonball(context, ball, cameraX, raster.cannonball));
      projectiles.forEach((ball) => {
        const x = Math.round(ball.x - cameraX);
        const y = Math.round(ball.y);
        const yarnBallSprite = getImage("./assets/sprites/yarn-ball-v1.webp");
        if (yarnBallSprite.complete && yarnBallSprite.naturalWidth) {
          // El ovillo es un recurso independiente para conservar su silueta redonda.
          const pulse = frame % 8 < 4 ? 0 : 1;
          context.drawImage(yarnBallSprite, x - 17, y - 17 - pulse, 34, 34);
        } else {
          // Solo se usa durante la carga inicial del sprite.
          context.fillStyle = "#4b295f";
          context.fillRect(x - 11, y - 11, 22, 22);
          context.fillStyle = "#c78bea";
          context.fillRect(x - 8, y - 8, 16, 16);
          context.fillStyle = "#eee0ff";
          context.fillRect(x - 5, y - 4, 10, 3);
        }
      });
      bursts.forEach((burst) => {
        const x = Math.round(burst.x - cameraX);
        const spread = Math.round((0.5 - burst.life) * 46);
        context.save();
        context.globalAlpha = Math.min(1, burst.life * 3);
        if (burst.kind === "stars") {
          drawTinySparkle(context, x - spread, burst.y - spread * 0.6, burst.color);
          drawTinySparkle(context, x + spread, burst.y - spread * 0.25, burst.color);
          drawTinySparkle(context, x - spread * 0.35, burst.y + spread * 0.45, "#fff7d1");
        } else {
          context.fillStyle = burst.color;
          context.fillRect(x - spread, burst.y - 6, 12, 10);
          context.fillRect(x + spread - 10, burst.y - spread * 0.4, 10, 10);
        }
        context.restore();
      });
      if (restStop && level.goalX - cameraX > -280 && level.goalX - cameraX < VIEW_WIDTH + 100) {
        // Al final del paseo espera el guardián del mundo para despedirse.
        const boss = guardianOf(restStop.world);
        const definition = boss ? bossCatalog[boss] : undefined;
        // Retrato suelto (-0.webp) o, en los guardianes nuevos, la primera pose de su atlas (fila de abajo de una
        // cuadrícula de 5 × 2) o de su hoja de poses (cinco en fila).
        const image = definition ? getImage(definition.assetPrefix ? `${definition.assetPrefix}-0.webp` : definition.assetAtlas ?? "") : null;
        if (definition && image?.complete && image.naturalWidth) {
          const atlas = !definition.assetPrefix;
          const grid = atlas && (definition.assetAtlas ?? "").includes("characters");
          const sw = atlas ? image.naturalWidth / 5 : image.naturalWidth;
          const sh = grid ? image.naturalHeight / 2 : image.naturalHeight;
          const sy = grid ? image.naturalHeight / 2 : 0;
          const height = 150;
          const width = height * sw / sh;
          context.drawImage(image, 0, sy, sw, sh, Math.round(level.goalX - cameraX), 456 - height, Math.round(width), height);
        }
      } else if (!level.chase && !explore && level.goalX - cameraX > -280 && level.goalX - cameraX < VIEW_WIDTH + 100) {
        if (level.world === 8 && level.boss) {
          const image = raster.waterTerrain;
          if (image.complete && image.naturalWidth) context.drawImage(image, 845, 500, 680, 500, level.goalX - cameraX - 10, goalSurfaceY - 200, 185, 200);
        } else if (level.world === 8) {
          if (raster.goalFlag.complete && raster.goalFlag.naturalWidth) context.drawImage(raster.goalFlag, level.goalX - cameraX, goalSurfaceY - 200, 130, 200);
          if (raster.waterCat.complete && raster.waterCat.naturalWidth) context.drawImage(raster.waterCat, level.goalX - cameraX + 30, goalSurfaceY - 85, 85, 85);
        } else if (level.boss) drawBossGate(context, level.goalX, cameraX, goalSurfaceY, raster.bossGate);
        else if (level.id !== "2-1") drawGoalCat(context, level.goalX, cameraX, false, raster.collectibles, goalCelebrationFrame < 0 ? 0 : Math.min(1, (frame - goalCelebrationFrame) / 22), goalSurfaceY, raster.goalFlag, raster.goalRescue);
      }
      context.save();
      if (starRemaining > 0) {
        const light = starPowerLight(levelAge, motionRef.current);
        context.filter = `brightness(${light.brightness}) saturate(${light.saturation})`;
        context.shadowColor = "#fff1a1";
        context.shadowBlur = light.glow;
      }
      drawPlayer();
      context.restore();
      if (starRemaining > 0) drawStarAura(context, player, cameraX, starRemaining, starDuration, levelAge, motionRef.current, raster);
      for (const zone of level.waterZones ?? []) {
        const left = Math.max(0, zone.x - cameraX);
        const right = Math.min(VIEW_WIDTH, zone.x + zone.width - cameraX);
        context.fillStyle = "rgba(70,213,240,.08)";
        context.fillRect(left, zone.y, right - left, zone.height);
        context.fillStyle = "#a2f6ef";
        for (let wave = left; wave < right; wave += 30) context.fillRect(wave, zone.y + Math.sin(frame / 16 + wave / 30) * 2, 19, 3);
        context.strokeStyle = "rgba(196,250,255,.5)";
        for (let bubble = 0; bubble < 14; bubble += 1) {
          const bubbleX = positiveModulo(bubble * 89 - cameraX * 0.4, VIEW_WIDTH);
          const bubbleY = zone.y + positiveModulo(bubble * 67 - frame * 0.35, 360);
          context.strokeRect(bubbleX, bubbleY, 4, 4);
        }
      }
      drawAmbientForeground(context, level, cameraX, frame);
      if (restStop) {
        const talking = friendSay;
        if (talking && talking.life > 0) {
          const friend = enemies.find((enemy) => enemy.id === talking.id);
          if (friend) speech(context, talking.text, Math.round(friend.x + friend.width / 2 - cameraX), friend.y - 8);
        }
        if (level.goalX - player.x < 420) speech(context, restStop.farewell, Math.round(level.goalX + 60 - cameraX), 300);
      }
      // La persecución va por encima del primer plano para que el rastro y la frase se vean siempre.
      if (chase && level.chase) drawChase(context, level.chase, chase, cameraX, frame, raster, chaseSay, chaseCaughtAge);
      context.restore();
      if (explore) {
        // Más abajo, la cueva se oscurece un poco.
        const depth = Math.max(0, Math.min(.35, (cameraY - ((level.height ?? VIEW_HEIGHT) - VIEW_HEIGHT) * .6) / 600));
        if (depth > 0) { context.fillStyle = `rgba(40,24,18,${depth})`; context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT); }
        drawExploreOverlay(context, player, hintTarget(level, explore, player), { x: cameraX, y: cameraY }, frame);
      }
      // Carteles encima de todo: una sola pista bajo el HUD y, debajo, los de las cajas sin pisarse (issue 317).
      if (frame % 30 === 0) techoCartel = medirTechoCartel();
      const ocupadas: Caja[] = [];
      const pista = pistaDeLaPartida({
        levelId: level.id, world: level.world, screen: level.screen, vertical: level.orientation === "vertical", detour: Boolean(level.detour),
        bloomBridges: Boolean(level.bloomBridges?.length), mecanicas: hasWorldMechanics(level), cameraX, levelAge, playerX: player.x, playerY: player.y, completed,
      });
      if (pista) {
        const lineas = pista.claves.map((clave) => textoLienzo(clave));
        const { ancho, alto } = medirCartel(context, lineas);
        drawCartel(context, lineas, pista.centroX, techoCartel);
        ocupadas.push({ x: pista.centroX - ancho / 2, y: techoCartel, ancho, alto });
      }
      if (cartelesDeCaja.length) {
        // Solo el de la caja más cercana a Noa: como mucho dos carteles a la vez con la pista (guía de estilo visual),
        // y dentro de la parte visible del lienzo (en vertical, la ventana 4:3).
        const cercano = cartelesDeCaja.reduce((mejor, cartel) => cartel.distancia < mejor.distancia ? cartel : mejor);
        const medidas = [cercano].map((cartel) => {
          const medida = medirCartel(context, cartel.lineas);
          const centroX = Math.max(vista.izquierda + medida.ancho / 2 + 8, Math.min(vista.derecha - medida.ancho / 2 - 8, cartel.centroX));
          return { ...cartel, ...medida, centroX };
        });
        const arribas = colocarCarteles(medidas, techoCartel, ocupadas);
        const alfa = palabras.capa(false) ? 0.35 : 1;
        medidas.forEach((cartel, indice) => drawCartel(context, cartel.lineas, cartel.centroX, arribas[indice], { alfa, color: cartel.color }));
        cartelesDeCaja.length = 0;
      }

      const palabra = palabras.capa(motionRef.current);
      if (palabra) drawPalabraRecogida(context, palabra, player.x + player.width / 2 - cameraX, player.y - cameraY, techoCartel);
      const radioMaximo = Math.hypot(VIEW_WIDTH, VIEW_HEIGHT);
      const salida = transition.remaining();
      const capa = salida !== undefined ? capaTransicion("salida", salida, radioMaximo, motionRef.current)
        : capaTransicion("entrada", entradaSegundos, radioMaximo, motionRef.current);
      if (capa) drawTransitionLayer(context, capa, player.x + player.width / 2 - cameraX, player.y + player.height / 2 - cameraY);

      if (!runningRef.current) {
        context.fillStyle = "rgba(34, 24, 57, 0.42)";
        context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      }
    };

    enemies = enemies.map((enemy) => ({ ...enemy }));
    const restartKey = (event: KeyboardEvent) => {
      if (puzzle && runningRef.current && !completed && event.code === "KeyR" && !event.repeat) restartRoom(false);
    };
    if (puzzle) window.addEventListener("keydown", restartKey);
    const gameLoop = createGameLoop((delta, now) => {
      if (!runningRef.current || shopOpenRef.current) return;
      entradaSegundos += delta;
      palabras.avanzar(delta);
      if (completed) transition.advance(delta, runningRef.current);
      else update(delta, now);
    }, render, () => { frame += 1; });
    gameLoopRef.current = gameLoop;
    gameLoop.setRunning(runningRef.current);
    // Tras el primer cuadro, el resto del arte de la pantalla se pide y se descodifica ya (issue 322).
    const precarga = typeof setTimeout === "function" ? setTimeout(() => precargarPantalla(raster, [...(level.orientation === "explore" ? prepararExploracion(level) : []), ...(level.chase ? ARTE_PERSECUCION : [])]), 400) : undefined;
    return () => {
      if (precarga !== undefined) clearTimeout(precarga);
      soltarMapas();
      if (puzzle) window.removeEventListener("keydown", restartKey);
      gameLoop.stop();
      gameLoopRef.current = null;
      transition.cancel();
      returnFromShopRef.current = null;
      returnFromDetourRef.current = null;
      restartRoomRef.current = null;
      shopOpenRef.current = false;
      callbacksRef.current.onShopActiveChange?.(false);
      callbacksRef.current.onDetourActiveChange?.(null);
    };
  }, [level, inputRef]);

  return (
    <>
    <div className="game-frame" hidden={Boolean(excursion)} style={marcoMundo(level)}>
      <span className="marco-emblema" aria-hidden="true"><Emblema world={level.world} /></span>
      <div className="game-stage">
        <div className="game-vista">
          <canvas ref={canvasRef} tabIndex={0} width={VIEW_WIDTH} height={VIEW_HEIGHT} aria-label={t("partida.lienzo.pantalla.oculto", { id: level.id, titulo: level.title })} />
        </div>
        <p className="sr-only" ref={statusRef} aria-live="polite" aria-atomic="true" />
        {hud}
        {doorAvailable && running && !shopOpen && <button className="secret-door-enter" type="button" aria-label={t(`partida.lienzo.interaccion.${interaction}.oculto`)} onClick={() => { inputRef.current.enterQueued = true; }}>↑ <Texto clave={`partida.lienzo.interaccion.${interaction}.rotulo`} /></button>}
        {level.puzzleRooms && <BotonControl className={`hud-pausa room-restart${roomHint ? " is-hinting" : ""}`} pictograma="otra-vez" etiqueta="partida.lienzo.empezarSala.oculto" disabled={!running} onClick={(event) => { event.currentTarget.blur(); restartRoomRef.current?.(); }} />}
        {level.detour && onReturn && <button className="detour-return" type="button" disabled={!running} onClick={onReturn}><Texto clave="partida.lienzo.volverCamino.rotulo" /></button>}
      </div>
      {shopOpen && <SecretShop world={level.world} paused={!running} reduceMotion={reduceMotion} playSound={playSound} onResult={(matches) => {
        if (shopResultRef.current !== null) return;
        shopResultRef.current = matches;
        if (matches === 3 && level.secretShop) callbacksRef.current.onShopWin?.(level.secretShop.id);
      }} onLeave={() => {
        // También se puede salir desde la pantalla previa, sin jugar: entonces no hay estrellas.
        returnFromShopRef.current?.();
      }} />}
      <TouchControls onPress={handleTouchStart} onRelease={handleTouchEnd} onCancel={handleTouchCancel} />
    </div>
    {excursion && <GameCanvas level={detourLevel(excursion)} hud={hud} running={running} reduceMotion={reduceMotion}
      onLoseLife={onLoseLife} onSnapshot={onSnapshot} onAppleCollected={onAppleCollected} playSound={playSound}
      onBossEncounter={onBossEncounter} onSecretExit={onSecretExit} onWaterExit={onWaterExit}
      onComplete={() => { onDetourComplete?.(excursion); returnFromDetourRef.current?.(); }}
      onReturn={() => returnFromDetourRef.current?.()} />}
    </>
  );
}

export type { SoundKind };
