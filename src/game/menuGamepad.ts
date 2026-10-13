import { readDuelPad } from "./duelGamepad.ts";

type PadInput = { buttons: readonly { pressed: boolean }[]; axes: readonly number[] };
export type MenuPadButtons = readonly [confirm: boolean, up: boolean, down: boolean, left: boolean, right: boolean, back: boolean, start: boolean];

export function readMenuPad(pad: PadInput | null): MenuPadButtons {
  if (!pad) return [false, false, false, false, false, false, false];
  const [confirm, up, down, left, right] = readDuelPad(pad);
  return [confirm, up, down, left, right, Boolean(pad.buttons[1]?.pressed), Boolean(pad.buttons[9]?.pressed)];
}

export function menuDirection(current: MenuPadButtons, previous: MenuPadButtons): -1 | 0 | 1 {
  if ((current[1] && !previous[1]) || (current[3] && !previous[3])) return -1;
  if ((current[2] && !previous[2]) || (current[4] && !previous[4])) return 1;
  return 0;
}
