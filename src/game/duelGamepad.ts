type PadInput = { buttons: readonly { pressed: boolean }[]; axes: readonly number[] };
export type DuelPadButtons = readonly [confirm: boolean, up: boolean, down: boolean, left: boolean, right: boolean];

export const readDuelPad = (pad: PadInput): DuelPadButtons => [
  Boolean(pad.buttons[0]?.pressed),
  Boolean(pad.buttons[12]?.pressed || pad.axes[1] < -0.55),
  Boolean(pad.buttons[13]?.pressed || pad.axes[1] > 0.55),
  Boolean(pad.buttons[14]?.pressed || pad.axes[0] < -0.55),
  Boolean(pad.buttons[15]?.pressed || pad.axes[0] > 0.55),
];

export const justPressed = (current: DuelPadButtons, previous: DuelPadButtons, index: number) =>
  current[index] && !previous[index];
