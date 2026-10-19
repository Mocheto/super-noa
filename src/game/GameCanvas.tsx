import { useEffect, useRef } from "react";
import { PixelIcon } from "./PixelIcon";
import { getImage, getLevelAssets } from "./assets";
import {
  drawAmbientForeground, drawApple, drawBackground, drawBossGate, drawCannon,
  drawCannonball, drawCastleSprite, drawCatPower, drawCaveEntrance, drawCheckpoint,
  drawDeadlyWater, drawEnemy, drawGoalCat, drawPlatform, drawRewardBlock, drawSecretBlock,
  drawSecretVine, drawSticker, drawTinySparkle,
} from "./rendering";
import { useGameInput } from "./input";
import { firstConnectedGamepad, readGameplayPad } from "./gamepad";
import { createGameLoop, type GameLoop } from "./gameLoop";
import { getStickerSprite } from "./stickers";
import type { Level, GameSnapshot } from "./types";
import { VIEW_WIDTH, VIEW_HEIGHT } from "./constants";
import {
  enemyY, positiveModulo, type Player, type LiveEnemy, type LiveItem,
  type Projectile, type LiveCannon, type Cannonball, type PixelBurst,
} from "./gameState";
import { boarChargeVelocity, GRAVITY, hasReachedGoalFlag, JUMP_SPEED, keepInsidePatrol, landsOnSpring, platformSurfaceY, projectileHitsWaterWall, rectanglesOverlap, SPRING_SPEED, swimmingVelocity, walkAnimationFrame, waterAt } from "./gameplay";

const MOVE_SPEED = 250;

type SoundKind = "apple" | "block" | "cat" | "jump" | "hurt" | "stomp" | "yarn" | "checkpoint" | "goal" | "sticker" | "howl" | "snort" | "cannon" | "countdown";

type GameCanvasProps = {
  level: Level;
  running: boolean;
  onLoseLife: () => void;
  onComplete: () => void;
  onBossEncounter: () => void;
  onSecretExit: () => void;
  onWaterExit: () => void;
  onSnapshot: (snapshot: GameSnapshot) => void;
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

function drawDoubleJumpTip(context: CanvasRenderingContext2D) {
  const x = 238;
  const y = 48;
  const width = 484;
  const height = 82;
  context.fillStyle = "#352044";
  context.fillRect(x - 5, y - 5, width + 10, height + 10);
  context.fillStyle = "#fff8e9";
  context.fillRect(x, y, width, height);
  context.fillStyle = "#f0ddf7";
  context.fillRect(x + 7, y + 7, width - 14, height - 14);
  context.fillStyle = "#6f3c86";
  context.font = "bold 17px monospace";
  context.textAlign = "center";
  context.fillText("¡PRUEBA EL DOBLE SALTO!", x + width / 2, y + 29);
  context.fillStyle = "#352044";
  context.font = "bold 14px monospace";
  context.fillText("TOCA SALTAR  ↑   Y EN EL AIRE  ↑  OTRA VEZ", x + width / 2, y + 58);
  context.textAlign = "start";
}

export function GameCanvas({ level, running, onLoseLife, onComplete, onBossEncounter, onSecretExit, onWaterExit, onSnapshot, playSound }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const { inputRef, handleTouchStart, handleTouchEnd, handleTouchCancel, preventTouchMenu } = useGameInput(running);
  const runningRef = useRef(running);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const callbacksRef = useRef({ onLoseLife, onComplete, onBossEncounter, onSecretExit, onWaterExit, onSnapshot, playSound });

  useEffect(() => {
    callbacksRef.current = { onLoseLife, onComplete, onBossEncounter, onSecretExit, onWaterExit, onSnapshot, playSound };
  }, [onLoseLife, onComplete, onBossEncounter, onSecretExit, onWaterExit, onSnapshot, playSound]);

  useEffect(() => {
    runningRef.current = running;
    gameLoopRef.current?.setRunning(running);
  }, [running]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;

    const sprite = getImage("./assets/sprites/noa-sprite-sheet.png");
    const goldSprite = getImage("./assets/sprites/noa-sprite-sheet-gold-armor-v1.png");
    const catJumpSprite = getImage("./assets/sprites/noa-cat-jump-v2.png");
    const goldCatJumpSprite = getImage("./assets/sprites/noa-cat-jump-gold-armor-v1.png");
    const catYarnSprite = getImage("./assets/sprites/noa-cat-yarn-v2.png");
    const goldCatYarnSprite = getImage("./assets/sprites/noa-cat-yarn-gold-armor-v1.png");
    const catThrowSprite = getImage("./assets/sprites/noa-cat-throw-v1.png");
    const goldCatThrowSprite = getImage("./assets/sprites/noa-cat-throw-gold-armor-v1.png");
    const yarnBallSprite = getImage("./assets/sprites/yarn-ball-v1.png");
    const catRunSprite = getImage("./assets/sprites/noa-cat-run-v2.png");
    const goldCatRunSprite = getImage("./assets/sprites/noa-cat-run-gold-armor-v1.png");
    const jumpSprite = getImage("./assets/sprites/noa-jump-v2.png");
    const goldJumpSprite = getImage("./assets/sprites/noa-jump-gold-armor-v1.png");
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
    const goalPlatforms = level.platforms.filter((platform) => level.goalX >= platform.x && level.goalX <= platform.x + platform.width);
    const goalSurfaceY = level.world === 8 ? Math.min(...goalPlatforms.map((platform) => platform.y)) : goalPlatforms[0]?.y ?? 456;
    let cameraX = 0;
    let apples = 0;
    let checkpointIndex = -1;
    let respawnX = level.start.x;
    let previousJump = false;
    let previousShoot = false;
    let shootCooldown = 0;
    let completed = false;
    let frame = 0;
    let walkCycleTime = 0;
    let lastSnapshot = 0;
    let completeTimer = 0;
    let vineStartedFrame = -1;
    let goalCelebrationFrame = -1;
    let lastSpringX = -1;
    let lastSpringFrame = -100;

    const enterSecretVine = () => {
      if (completed) return;
      completed = true;
      player.vx = 0;
      player.vy = 0;
      callbacksRef.current.playSound("checkpoint");
      completeTimer = window.setTimeout(() => callbacksRef.current.onSecretExit(), 700);
    };

    const respawn = () => {
      player.x = respawnX;
      player.y = level.start.y;
      player.vx = 0;
      player.vy = 0;
      player.power = "normal";
      player.invincible = 1.4;
      player.jumpsUsed = 0;
      player.springLaunch = false;
      player.doubleJumpFx = 0;
      player.shootFx = 0;
      projectiles.length = 0;
      cannonballs.length = 0;
      callbacksRef.current.onLoseLife();
    };

    const hurt = () => {
      if (player.invincible > 0) return;
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
      const input = inputRef.current;
      const pad = readGameplayPad(firstConnectedGamepad());
      const left = input.left || pad.left;
      const right = input.right || pad.right;
      const jump = input.jump || pad.jump;
      const shoot = input.shoot || pad.shoot;
      const swimming = waterAt(player, level.waterZones);
      const newStroke = input.jumpQueued || (jump && !previousJump);

      if (left === right) player.vx *= Math.pow(0.0008, delta);
      else {
        player.vx = (left ? -1 : 1) * (swimming ? 175 : MOVE_SPEED);
        player.facing = left ? -1 : 1;
      }

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
      } else if (player.jumpBuffer > 0 && player.coyote > 0 && player.jumpsUsed === 0) {
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
      player.x += player.vx * delta;
      player.x = Math.max(0, Math.min(level.width - player.width, player.x));
      for (const platform of level.platforms) {
        if (platform.kind !== "cave-wall" && platform.kind !== "castle-wall" && platform.kind !== "sea-wall") continue;
        const vertical = player.y + player.height > platformSurfaceY(platform) && player.y < platform.y + platform.height;
        if (!vertical) continue;
        if (player.vx > 0 && previousX + player.width <= platform.x && player.x + player.width > platform.x) {
          player.x = platform.x - player.width;
          player.vx = 0;
        } else if (player.vx < 0 && previousX >= platform.x + platform.width && player.x < platform.x + platform.width) {
          player.x = platform.x + platform.width;
          player.vx = 0;
        }
      }
      const previousY = player.y;
      const previousBottom = previousY + player.height;
      const wasGrounded = player.grounded;
      if (!swimming) player.vy += GRAVITY * delta;
      player.y += player.vy * delta;
      // Al soltar el botón se hunde; una brazada nueva en la superficie permite salir del agua.
      if (swimming && player.y + player.height * 0.6 < swimming.y + 1 && !newStroke) {
        player.y = swimming.y + 1 - player.height * 0.6;
        player.vy = 0;
      }
      player.grounded = false;

      for (const platform of level.platforms) {
        const horizontal = player.x + player.width > platform.x && player.x < platform.x + platform.width;
        const surfaceY = platformSurfaceY(platform);
        // El muelle solo responde al aterrizaje de un salto: al caminar se puede pasar de largo.
        const landed = platform.kind === "spring"
          ? landsOnSpring(wasGrounded, previousBottom, player.y + player.height, surfaceY, player.vy)
          : player.vy >= 0 && previousBottom <= surfaceY + 10 && player.y + player.height >= surfaceY;
        if (horizontal && landed) {
          player.y = surfaceY - player.height;
          if (platform.kind === "spring") {
            player.vy = -SPRING_SPEED;
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
          }
        } else if ((platform.kind === "cave-wall" || platform.kind === "castle-wall" || platform.kind === "sea-wall" || platform.kind === "dino-wall") && horizontal && player.vy < 0) {
          const platformBottom = platform.y + platform.height;
          if (previousY >= platformBottom - 10 && player.y <= platformBottom) {
            player.y = platformBottom;
            player.vy = 0;
          }
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

      const secretVine = level.rewardBlocks.find((block) => block.reward === "secret-vine");
      if (level.waterEntrance && intersects(player, level.waterEntrance) && !completed) {
        completed = true;
        callbacksRef.current.onSnapshot({ apples, stickers: [...collectedStickers], power: player.power, checkpoint: checkpointIndex + 1, paused: false });
        callbacksRef.current.playSound("checkpoint");
        completeTimer = window.setTimeout(() => callbacksRef.current.onWaterExit(), 450);
      }
      if (secretVine && vineStartedFrame >= 0) {
        const growth = Math.min(1, (frame - vineStartedFrame) / 70);
        const vineHeight = Math.max(1, Math.round((secretVine.y + 80) * growth));
        const vineHitbox = { x: secretVine.x - 28, y: secretVine.y - vineHeight, width: 104, height: vineHeight + 120 };
        if (growth >= 0.65 && intersects(player, vineHitbox)) {
          if (statusRef.current) statusRef.current.textContent = "Noa trepa por la enredadera al Reino Secreto de las Nubes.";
          enterSecretVine();
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
      if (player.y > VIEW_HEIGHT + 120) {
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
          if (player.power === "normal") player.power = "apple";
          callbacksRef.current.playSound("apple");
          if (statusRef.current) statusRef.current.textContent = "Manzana conseguida.";
        } else if (item.kind === "cat") {
          player.power = "cat";
          callbacksRef.current.playSound("cat");
          if (statusRef.current) statusRef.current.textContent = "¡Noa se ha convertido en gata! Ya puede lanzar lana.";
        } else {
          collectedStickers.add(item.id);
          callbacksRef.current.playSound("sticker");
          if (statusRef.current) statusRef.current.textContent = "Insignia encontrada.";
        }
      }

      enemies.forEach((enemy) => {
        if (!enemy.active) return;
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
          if (statusRef.current) statusRef.current.textContent = `Bandera ${index + 1} conseguida.`;
        }
      });

      if (!completed && hasReachedGoalFlag(player, level.goalX, goalSurfaceY)) {
        completed = true;
        goalCelebrationFrame = frame;
        player.x = level.goalX - 48;
        player.y = goalSurfaceY - player.height;
        player.vx = 0;
        player.vy = 0;
        player.grounded = true;
        player.jumpsUsed = 0;
        player.facing = 1;
        callbacksRef.current.playSound("goal");
        if (statusRef.current) statusRef.current.textContent = "¡Banderín tocado! Pantalla superada.";
        completeTimer = window.setTimeout(
          () => level.boss ? callbacksRef.current.onBossEncounter() : callbacksRef.current.onComplete(),
          level.boss ? 850 : 1450,
        );
      }

      player.invincible = Math.max(0, player.invincible - delta);
      player.doubleJumpFx = Math.max(0, player.doubleJumpFx - delta);
      player.shootFx = Math.max(0, player.shootFx - delta);
      walkCycleTime = player.grounded && Math.abs(player.vx) > 25 ? walkCycleTime + delta : 0;
      cameraX += (Math.max(0, Math.min(level.width - VIEW_WIDTH, player.x - 330)) - cameraX) * Math.min(1, delta * 5);

      if (now - lastSnapshot > 130) {
        callbacksRef.current.onSnapshot({ apples, stickers: [...collectedStickers], power: player.power, checkpoint: checkpointIndex + 1, paused: !runningRef.current });
        lastSnapshot = now;
      }
    };

    const drawPlayer = () => {
      const x = Math.round(player.x - cameraX);
      const protectedByApple = player.power === "apple";
      if (waterAt(player, level.waterZones) && !player.grounded && raster.swim.complete && raster.swim.naturalWidth) {
        const row = player.power === "cat" ? 2 : protectedByApple ? 1 : 0;
        const column = Math.floor(frame / 14) % 2;
        const cellWidth = raster.swim.naturalWidth / 2;
        const cellHeight = raster.swim.naturalHeight / 3;
        context.save();
        context.globalAlpha = player.invincible > 0 && Math.floor(player.invincible * 12) % 2 === 0 ? 0.45 : 1;
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
      const flashing = player.invincible > 0 && Math.floor(player.invincible * 12) % 2 === 0;
      if (flashing) context.globalAlpha = 0.38;
      const usesCatThrowSprite = player.power === "cat" && player.shootFx > 0;
      const usesCatYarnSprite = player.power === "cat" && player.grounded && Math.abs(player.vx) <= 25;
      const usesCatRunSprite = player.power === "cat" && player.grounded && Math.abs(player.vx) > 25;
      const usesCleanCatJump = player.power === "cat" && !player.grounded;
      const usesCleanJump = player.power !== "cat" && !player.grounded;
      const activeSprite = usesCatThrowSprite ? (protectedByApple ? goldCatThrowSprite : catThrowSprite)
        : usesCatYarnSprite ? (protectedByApple ? goldCatYarnSprite : catYarnSprite)
        : usesCatRunSprite ? (protectedByApple ? goldCatRunSprite : catRunSprite)
        : usesCleanCatJump ? (protectedByApple ? goldCatJumpSprite : catJumpSprite)
        : usesCleanJump ? (protectedByApple ? goldJumpSprite : jumpSprite)
        : protectedByApple ? goldSprite : sprite;
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

    const render = () => {
      drawBackground(context, level, cameraX, frame, raster);
      level.deadlyWater?.forEach((zone) => drawDeadlyWater(context, zone, cameraX, frame, raster));
      level.platforms.forEach((platform) => drawPlatform(context, platform, cameraX, level.world, player.x, frame, raster, platform.x === lastSpringX && frame - lastSpringFrame < 9));
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
      if (level.waterEntrance) {
        const entrance = level.waterEntrance;
        const pondX = entrance.x - cameraX;
        const pondY = entrance.y - 12;
        context.save();
        context.globalAlpha = 0.84;
        const pondColor = context.createLinearGradient(0, pondY, 0, pondY + entrance.height);
        pondColor.addColorStop(0, "#72e8e2");
        pondColor.addColorStop(0.35, "#209fbd");
        pondColor.addColorStop(1, "#194f8f");
        context.fillStyle = pondColor;
        context.fillRect(pondX, pondY, entrance.width, entrance.height);
        context.restore();
        context.fillStyle = "#ddffef";
        for (let wave = 0; wave < entrance.width; wave += 24) context.fillRect(pondX + wave, pondY + Math.sin(frame / 14 + wave) * 3, 16, 4);
        context.fillStyle = "#e7fff8";
        context.font = "bold 13px monospace";
        context.textAlign = "center";
        context.fillText("↓ ¡AGUA! ↓", pondX + entrance.width / 2, entrance.y - 28);
        context.textAlign = "start";
      }
      level.checkpoints.forEach((checkpoint, index) => {
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
        if (!hitBlocks.has(block.id) && Math.abs(player.x - block.x) < 230) {
          context.fillStyle = "#fff8d6";
          context.fillRect(x - 66, block.y - 35, 180, 24);
          context.fillStyle = "#4b295f";
          context.font = "bold 12px monospace";
          context.textAlign = "center";
          context.fillText(block.reward === "secret-vine" ? "¿QUÉ ESCONDE ESTE BLOQUE?" : "¡SALTA BAJO EL GATITO!", x + 24, block.y - 19);
          context.textAlign = "start";
        } else if (block.reward === "secret-vine" && vineStartedFrame >= 0 && !completed && Math.abs(player.x - block.x) < 250) {
          context.fillStyle = "#fff8d6";
          context.fillRect(x - 65, block.y - 40, 180, 24);
          context.fillStyle = "#3f7651";
          context.font = "bold 12px monospace";
          context.textAlign = "center";
          context.fillText("¡TOCA LA ENREDADERA!", x + 24, block.y - 24);
          context.textAlign = "start";
        }
      });
      cannons.forEach((cannon) => drawCannon(context, cannon, cameraX, raster.cannon));
      items.forEach((item) => {
        if (collected.has(item.id)) return;
        const x = Math.round(item.x - cameraX);
        const y = item.y + (1 - item.rise) * 48;
        const bob = Math.round(Math.sin(frame * 0.08 + item.x) * 4);
        if (item.kind === "apple") drawApple(context, x + 4, y + bob, raster.collectibles);
        else if (item.kind === "cat") drawCatPower(context, x, y + bob, raster.collectibles);
        else {
          const sticker = getStickerSprite(item.id);
          drawSticker(context, x, y + bob, Math.floor(frame / 12) % 2, raster.collectibles, sticker ? raster.stickerSheets[level.world] : undefined, sticker?.column);
        }
      });
      enemies.forEach((enemy) => drawEnemy(context, enemy, cameraX, (enemy.kind === "wolf" || enemy.kind === "boar") && Math.abs(player.x - enemy.x) < 360, raster));
      cannonballs.forEach((ball) => drawCannonball(context, ball, cameraX, raster.cannonball));
      projectiles.forEach((ball) => {
        const x = Math.round(ball.x - cameraX);
        const y = Math.round(ball.y);
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
      if (level.world === 8 && level.boss) {
        const image = raster.waterTerrain;
        if (image.complete && image.naturalWidth) context.drawImage(image, 845, 500, 680, 500, level.goalX - cameraX - 10, goalSurfaceY - 200, 185, 200);
      } else if (level.world === 8) {
        if (raster.goalFlag.complete && raster.goalFlag.naturalWidth) context.drawImage(raster.goalFlag, level.goalX - cameraX, goalSurfaceY - 200, 130, 200);
        if (raster.waterCat.complete && raster.waterCat.naturalWidth) context.drawImage(raster.waterCat, level.goalX - cameraX + 30, goalSurfaceY - 85, 85, 85);
      } else if (level.boss) drawBossGate(context, level.goalX, cameraX, goalSurfaceY, raster.bossGate);
      else if (level.id !== "2-1") drawGoalCat(context, level.goalX, cameraX, false, raster.collectibles, goalCelebrationFrame < 0 ? 0 : Math.min(1, (frame - goalCelebrationFrame) / 22), goalSurfaceY, raster.goalFlag, raster.goalRescue);
      drawPlayer();
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
      if (level.id === "1-1" && player.x >= 130 && player.x < 1120) drawDoubleJumpTip(context);
      if (level.world === 8 && player.x < 650) {
        context.fillStyle = "#fff8e9";
        context.fillRect(205, 18, 550, 56);
        context.fillStyle = "#352044";
        context.textAlign = "center";
        context.font = "bold 14px monospace";
        context.fillText("SALTAR: NADA ARRIBA · SUELTA: BAJA", 480, 42);
        context.fillText("Puedes caminar por la arena. ¡Evita los erizos!", 480, 62);
        context.textAlign = "start";
      }

      if (!runningRef.current) {
        context.fillStyle = "rgba(34, 24, 57, 0.42)";
        context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      }
    };

    enemies = enemies.map((enemy) => ({ ...enemy }));
    const gameLoop = createGameLoop((delta, now) => {
      if (!completed) update(delta, now);
    }, render, () => { frame += 1; });
    gameLoopRef.current = gameLoop;
    gameLoop.setRunning(runningRef.current);
    return () => {
      gameLoop.stop();
      gameLoopRef.current = null;
      window.clearTimeout(completeTimer);
    };
  }, [level, inputRef]);

  return (
    <div className="game-frame">
      <div className="game-stage">
        <canvas ref={canvasRef} width={VIEW_WIDTH} height={VIEW_HEIGHT} aria-label={`Pantalla ${level.id}: ${level.title}`} />
        <p className="sr-only" ref={statusRef} aria-live="polite" aria-atomic="true" />
      </div>
      <div className="touch-controls" aria-label="Controles táctiles">
        <div className="touch-group touch-move">
          <button type="button" className="touch-button touch-direction" aria-label="Mover a la izquierda" onPointerDown={(event) => handleTouchStart("left", event)} onPointerUp={(event) => handleTouchEnd("left", event)} onPointerCancel={(event) => handleTouchCancel("left", event)} onLostPointerCapture={(event) => handleTouchCancel("left", event)} onContextMenu={preventTouchMenu}><span>◀</span><small>IZQ.</small></button>
          <button type="button" className="touch-button touch-direction" aria-label="Mover a la derecha" onPointerDown={(event) => handleTouchStart("right", event)} onPointerUp={(event) => handleTouchEnd("right", event)} onPointerCancel={(event) => handleTouchCancel("right", event)} onLostPointerCapture={(event) => handleTouchCancel("right", event)} onContextMenu={preventTouchMenu}><span>▶</span><small>DER.</small></button>
        </div>
        <div className="touch-group touch-actions">
          <button type="button" className="touch-button touch-yarn" aria-label="Lanzar bola de lana" onPointerDown={(event) => handleTouchStart("shoot", event)} onPointerUp={(event) => handleTouchEnd("shoot", event)} onPointerCancel={(event) => handleTouchCancel("shoot", event)} onLostPointerCapture={(event) => handleTouchCancel("shoot", event)} onContextMenu={preventTouchMenu}><PixelIcon kind="yarn" /><small>LANA</small></button>
          <button type="button" className="touch-button touch-jump" aria-label="Saltar; vuelve a tocar para hacer doble salto" onPointerDown={(event) => handleTouchStart("jump", event)} onPointerUp={(event) => handleTouchEnd("jump", event)} onPointerCancel={(event) => handleTouchCancel("jump", event)} onLostPointerCapture={(event) => handleTouchCancel("jump", event)} onContextMenu={preventTouchMenu}><span className="touch-jump-arrows">↑<i>↑</i></span><small>SALTAR</small></button>
        </div>
      </div>
    </div>
  );
}

export type { SoundKind };
