export function starPowerLight(elapsed: number, reduceMotion: boolean) {
  const pulse = reduceMotion ? .35 : Math.max(0, Math.sin(elapsed * Math.PI * 3)) ** 2;
  return { pulse, brightness: 1 + pulse * .8, saturation: 1 + pulse * .2, glow: pulse * 9 };
}
