import { useEffect, type Dispatch, type SetStateAction } from "react";
import { firstConnectedGamepad } from "./gamepad";
import { menuDirection, readMenuPad } from "./menuGamepad";
import type { Volumen } from "./ajustes";

/**
 * En una pantalla con reloj (`activa`): Escape y el botón Start del mando alternan la pausa, y ocultar la pestaña o
 * perder el foco la ponen. `pantalla` vuelve a empezar la vigilancia al cambiar de pantalla, como hasta ahora.
 */
export function usePausaAutomatica(pantalla: string, activa: boolean, setPaused: Dispatch<SetStateAction<boolean>>) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.defaultPrevented && event.code === "Escape" && !event.repeat && activa) setPaused((value) => !value);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pantalla, activa, setPaused]);

  useEffect(() => {
    if (!activa) return;
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
  }, [pantalla, activa, setPaused]);

  useEffect(() => {
    if (!activa) return;
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
  }, [pantalla, activa, setPaused]);
}

/**
 * Con un menú delante (`activo`): el mando mueve el foco por los botones de la ventana de arriba (o de la pantalla),
 * A pulsa, B vuelve (`data-gamepad-back`) e izquierda y derecha sobre un deslizador de volumen lo cambian de 5 en 5.
 */
export function useMandoEnMenus(activo: boolean, pantalla: string, ajustarVolumen: (cual: Volumen, valor: number) => void) {
  useEffect(() => {
    if (!activo) return;
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
        const container = overlays.item(overlays.length - 1) ?? document.querySelector<HTMLElement>(pantalla === "home" ? ".home-screen" : pantalla === "cat-party" ? ".cat-party-screen" : ".map-screen");
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
            if (selected.id === "music-volume") ajustarVolumen("musica", value);
            else if (selected.id === "effects-volume") ajustarVolumen("efectos", value);
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
  }, [activo, pantalla, ajustarVolumen]);
}
