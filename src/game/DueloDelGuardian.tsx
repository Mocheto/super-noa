import { lazy, Suspense } from "react";
import type { SoundKind } from "./GameCanvas";
import { isGuardianGameId } from "./guardianGameIds";
import type { BossId, Power } from "./types";
import type { TrajeId } from "./trajes";
import { Texto } from "../textos/Texto";

// Cada duelo va en su propio bloque, con sus textos (zonas `duelos`, `juegos` y la de cada minijuego).
const BossBattle = lazy(() => import("./BossBattle").then((module) => ({ default: module.BossBattle })));
const GuardianMiniGame = lazy(() => import("./GuardianMiniGame").then((module) => ({ default: module.GuardianMiniGame })));
const NidoReinaGame = lazy(() => import("./NidoReinaGame").then((module) => ({ default: module.NidoReinaGame })));
const VueloAuroraGame = lazy(() => import("./VueloAuroraGame").then((module) => ({ default: module.VueloAuroraGame })));
const ArmoniaDrumGame = lazy(() => import("./ArmoniaDrumGame").then((module) => ({ default: module.ArmoniaDrumGame })));
const MeriendaJabatosGame = lazy(() => import("./MeriendaJabatosGame").then((module) => ({ default: module.MeriendaJabatosGame })));
const BeeNinjaGame = lazy(() => import("./BeeNinjaGame").then((module) => ({ default: module.BeeNinjaGame })));
const SantaBossBattle = lazy(() => import("./SantaBossBattle").then((module) => ({ default: module.SantaBossBattle })));

type Props = {
  level: { id: string; boss: BossId };
  /** Cambia al reintentar la pantalla: vuelve a montar el duelo. */
  levelRun: number;
  paused: boolean;
  muted: boolean;
  musicVolume: number;
  effectsVolume: number;
  reduceMotion: boolean;
  levelCompleted: boolean;
  apples: number;
  power: Power;
  /** Traje de Noa en los duelos que usan sus hojas normales. */
  traje: TrajeId;
  /** Revancha desde el álbum: sin manzanas ni castigo, y al terminar se vuelve al álbum. */
  bossReplay: boolean;
  onSpendApple: () => void;
  onRestartLevel: () => void;
  onAbandon: () => void;
  onFinishReplay: () => void;
  onWin: () => void;
  playSound: (sound: SoundKind) => void;
};

/** El duelo del guardián de la pantalla: la batalla de saltos, un minijuego rítmico o de memoria, un juego de guardián o piedra, papel o tijera. */
export function DueloDelGuardian({ level, levelRun, paused, muted, musicVolume, effectsVolume, reduceMotion, levelCompleted, apples, power, traje, bossReplay,
  onSpendApple, onRestartLevel, onAbandon, onFinishReplay, onWin, playSound }: Props) {
  return <Suspense fallback={<p className="lazy-loading lazy-loading-game" role="status"><Texto clave="partida.hud.cargando.rotulo" /></p>}>
      {
      (level.boss === "santa-claus" || level.boss === "siroco" || level.boss === "don-silbato") ? <SantaBossBattle
        key={`santa-boss-${level.id}-${levelRun}`}
        traje={traje}
        bossId={level.boss}
        paused={paused} apples={apples} onSpendApple={onSpendApple} onRestartLevel={onRestartLevel}
        onAbandon={onAbandon} onWin={onWin} playSound={playSound}
      /> : level.boss === "queen-bee" ? <BeeNinjaGame
        key={`bee-ninja-${level.id}-${levelRun}`}
        paused={paused}
        muted={muted}
        musicVolume={musicVolume}
        effectsVolume={effectsVolume}
        reduceMotion={reduceMotion}
        levelCompleted={levelCompleted}
        onAbandon={bossReplay ? onFinishReplay : onAbandon}
        onWin={bossReplay ? onFinishReplay : onWin}
        playSound={playSound}
        friendlyReplay={bossReplay}
      /> : level.boss === "maestra-armonia" ? <ArmoniaDrumGame
        key={`armonia-drum-${level.id}-${levelRun}`}
        paused={paused}
        muted={muted}
        musicVolume={musicVolume}
        effectsVolume={effectsVolume}
        reduceMotion={reduceMotion}
        levelCompleted={levelCompleted}
        onAbandon={bossReplay ? onFinishReplay : onAbandon}
        onWin={bossReplay ? onFinishReplay : onWin}
        playSound={playSound}
        friendlyReplay={bossReplay}
      /> : level.boss === "great-boar" ? <MeriendaJabatosGame
        key={`merienda-jabatos-${level.id}-${levelRun}`}
        paused={paused}
        muted={muted}
        musicVolume={musicVolume}
        effectsVolume={effectsVolume}
        reduceMotion={reduceMotion}
        levelCompleted={levelCompleted}
        onAbandon={bossReplay ? onFinishReplay : onAbandon}
        onWin={bossReplay ? onFinishReplay : onWin}
        playSound={playSound}
        friendlyReplay={bossReplay}
      /> : level.boss === "aurora-celeste" ? <VueloAuroraGame
        key={`vuelo-aurora-${level.id}-${levelRun}`}
        paused={paused}
        muted={muted}
        musicVolume={musicVolume}
        effectsVolume={effectsVolume}
        reduceMotion={reduceMotion}
        levelCompleted={levelCompleted}
        onAbandon={bossReplay ? onFinishReplay : onAbandon}
        onWin={bossReplay ? onFinishReplay : onWin}
        playSound={playSound}
        friendlyReplay={bossReplay}
      /> : level.boss === "triceratops-queen" ? <NidoReinaGame
        key={`nido-reina-${level.id}-${levelRun}`}
        paused={paused}
        muted={muted}
        musicVolume={musicVolume}
        effectsVolume={effectsVolume}
        reduceMotion={reduceMotion}
        levelCompleted={levelCompleted}
        onAbandon={bossReplay ? onFinishReplay : onAbandon}
        onWin={bossReplay ? onFinishReplay : onWin}
        playSound={playSound}
        friendlyReplay={bossReplay}
      /> : isGuardianGameId(level.boss) ? <GuardianMiniGame
        key={`guardian-game-${level.id}-${levelRun}`}
        bossId={level.boss}
        paused={paused}
        apples={bossReplay ? 0 : apples}
        protectedByApple={!bossReplay && power === "apple"}
        onSpendApple={onSpendApple}
        onRestartLevel={onRestartLevel}
        onAbandon={bossReplay ? onFinishReplay : onAbandon}
        onWin={bossReplay ? onFinishReplay : onWin}
        playSound={playSound}
        friendlyReplay={bossReplay}
      /> : <BossBattle
        traje={traje}
        key={`boss-${level.id}-${levelRun}`}
        bossId={level.boss}
        paused={paused}
        apples={bossReplay ? 0 : apples}
        protectedByApple={!bossReplay && power === "apple"}
        onSpendApple={onSpendApple}
        onRestartLevel={onRestartLevel}
        onAbandon={bossReplay ? onFinishReplay : onAbandon}
        onWin={bossReplay ? onFinishReplay : onWin}
        playSound={playSound}
        friendlyReplay={bossReplay}
      />}
    </Suspense>;
}
