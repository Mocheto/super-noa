import { useEffect, useRef, type MouseEvent, type PointerEvent } from "react";

export type InputState = {
  left: boolean; right: boolean; jump: boolean; shoot: boolean;
  jumpQueued: boolean; shootQueued: boolean;
};

type TouchKey = "left" | "right" | "jump" | "shoot";

export function useGameInput(running: boolean) {
  const inputRef = useRef<InputState>({ left: false, right: false, jump: false, shoot: false, jumpQueued: false, shootQueued: false });
  const heldKeysRef = useRef(new Set<string>());
  const touchPointersRef = useRef<Partial<Record<TouchKey, number>>>({});

  useEffect(() => {
    const input = inputRef.current;
    const heldKeys = heldKeysRef.current;
    const syncDirections = () => {
      input.left = heldKeys.has("ArrowLeft") || heldKeys.has("KeyA") || touchPointersRef.current.left !== undefined;
      input.right = heldKeys.has("ArrowRight") || heldKeys.has("KeyD") || touchPointersRef.current.right !== undefined;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) event.preventDefault();
      heldKeys.add(event.code);
      syncDirections();
      if (["ArrowUp", "KeyW", "Space"].includes(event.code)) {
        if (!input.jump) input.jumpQueued = true;
        input.jump = true;
      }
      if (event.code === "KeyX" || event.code === "KeyK") {
        if (!input.shoot) input.shootQueued = true;
        input.shoot = true;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      heldKeys.delete(event.code);
      syncDirections();
      if (["ArrowUp", "KeyW", "Space"].includes(event.code))
        input.jump = heldKeys.has("ArrowUp") || heldKeys.has("KeyW") || heldKeys.has("Space") || touchPointersRef.current.jump !== undefined;
      if (event.code === "KeyX" || event.code === "KeyK")
        input.shoot = heldKeys.has("KeyX") || heldKeys.has("KeyK") || touchPointersRef.current.shoot !== undefined;
    };
    const clear = () => {
      heldKeys.clear();
      touchPointersRef.current = {};
      Object.assign(input, { left: false, right: false, jump: false, shoot: false, jumpQueued: false, shootQueued: false });
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clear);
    return () => {
      clear();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clear);
    };
  }, []);

  useEffect(() => {
    if (running) return;
    heldKeysRef.current.clear();
    touchPointersRef.current = {};
    Object.assign(inputRef.current, { left: false, right: false, jump: false, shoot: false, jumpQueued: false, shootQueued: false });
  }, [running]);

  const keyboardKeepsPressed = (key: TouchKey) => key === "left"
    ? heldKeysRef.current.has("ArrowLeft") || heldKeysRef.current.has("KeyA")
    : key === "right"
      ? heldKeysRef.current.has("ArrowRight") || heldKeysRef.current.has("KeyD")
      : key === "jump"
        ? heldKeysRef.current.has("ArrowUp") || heldKeysRef.current.has("KeyW") || heldKeysRef.current.has("Space")
        : heldKeysRef.current.has("KeyX") || heldKeysRef.current.has("KeyK");

  const handleTouchStart = (key: TouchKey, event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (touchPointersRef.current[key] !== undefined) return;
    touchPointersRef.current[key] = event.pointerId;
    try { event.currentTarget.setPointerCapture(event.pointerId); }
    catch { /* Algunos navegadores móviles no permiten capturar dos botones a la vez. */ }
    inputRef.current[key] = true;
    if (key === "jump") inputRef.current.jumpQueued = true;
    if (key === "shoot") inputRef.current.shootQueued = true;
  };
  const handleTouchEnd = (key: TouchKey, event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (touchPointersRef.current[key] !== event.pointerId) return;
    delete touchPointersRef.current[key];
    inputRef.current[key] = keyboardKeepsPressed(key);
  };
  const handleTouchCancel = (key: TouchKey, event: PointerEvent<HTMLButtonElement>) => {
    if (touchPointersRef.current[key] !== event.pointerId) return;
    delete touchPointersRef.current[key];
    inputRef.current[key] = keyboardKeepsPressed(key);
  };
  const preventTouchMenu = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault();
  return { inputRef, handleTouchStart, handleTouchEnd, handleTouchCancel, preventTouchMenu };
}
