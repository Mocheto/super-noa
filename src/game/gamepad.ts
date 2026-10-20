type PadInput = { buttons: readonly { pressed: boolean }[]; axes: readonly number[] };

export function firstConnectedGamepad(): Gamepad | null {
  if (typeof navigator === "undefined") return null;
  try { return Array.from(navigator.getGamepads?.() ?? []).find((pad) => pad?.connected) ?? null; }
  catch { return null; }
}

export function readGameplayPad(pad: PadInput | null) {
  return {
    left: Boolean(pad && (pad.buttons[14]?.pressed || pad.axes[0] < -0.25)),
    right: Boolean(pad && (pad.buttons[15]?.pressed || pad.axes[0] > 0.25)),
    jump: Boolean(pad?.buttons[0]?.pressed),
    shoot: Boolean(pad?.buttons[2]?.pressed || pad?.buttons[1]?.pressed),
    up: Boolean(pad && (pad.buttons[12]?.pressed || pad.axes[1] < -0.55)),
  };
}
