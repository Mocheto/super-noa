import { useLayoutEffect, useRef, type ReactNode } from "react";
import { firstConnectedGamepad } from "./gamepad";
import { menuDirection, readMenuPad } from "./menuGamepad";

type DialogProps = {
  children: ReactNode;
  labelledBy: string;
  className?: string;
  backdropClassName?: string;
  onClose?: () => void;
  gamepad?: boolean;
  /** Milisegundos al abrirse en los que la ventana no acepta toques, teclas ni mando, para no saltarla sin querer. */
  esperaMs?: number;
};

function focusableElements(dialog: HTMLDialogElement) {
  return Array.from(dialog.querySelectorAll<HTMLElement>(
    "button:not(:disabled), input:not(:disabled), a[href], [tabindex='0']",
  )).filter((element) => element.getClientRects().length > 0 && !element.closest("[inert]"));
}

export function Dialog({ children, labelledBy, className = "game-modal", backdropClassName = "", onClose, gamepad = false, esperaMs = 0 }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listaRef = useRef(esperaMs <= 0);
  useLayoutEffect(() => {
    if (esperaMs <= 0) return;
    const temporizador = window.setTimeout(() => { listaRef.current = true; }, esperaMs);
    return () => window.clearTimeout(temporizador);
  }, [esperaMs]);
  const bloquear = (event: { preventDefault: () => void; stopPropagation: () => void }) => {
    if (listaRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  };
  const closeRef = useRef(onClose);
  useLayoutEffect(() => { closeRef.current = onClose; }, [onClose]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement;
    dialog.showModal();
    (dialog.querySelector<HTMLElement>("[data-gamepad-default]") ?? focusableElements(dialog)[0])?.focus();
    return () => {
      dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  useLayoutEffect(() => {
    if (!gamepad) return;
    let animationId = 0;
    let previousPad = firstConnectedGamepad();
    let previous = readMenuPad(previousPad);
    const poll = () => {
      const pad = firstConnectedGamepad();
      const current = readMenuPad(pad);
      const dialog = dialogRef.current;
      const overlays = document.querySelectorAll(".modal-backdrop");
      if (pad && dialog && listaRef.current && pad.index === previousPad?.index && dialog === overlays.item(overlays.length - 1)) {
        const focusables = focusableElements(dialog);
        const selected = focusables.find((element) => element === document.activeElement) ?? focusables[0];
        const direction = menuDirection(current, previous);
        if (direction && selected) {
          const index = focusables.indexOf(selected);
          focusables[(index + direction + focusables.length) % focusables.length]?.focus();
        } else if (current[0] && !previous[0]) selected?.click();
        if (current[5] && !previous[5]) closeRef.current?.();
      }
      previous = current;
      previousPad = pad;
      animationId = requestAnimationFrame(poll);
    };
    animationId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animationId);
  }, [gamepad]);

  return (
    <dialog
      className={`modal-backdrop ${backdropClassName}`}
      aria-labelledby={labelledBy}
      aria-modal="true"
      data-gamepad-managed={gamepad || undefined}
      ref={dialogRef}
      onCancel={(event) => { event.preventDefault(); if (listaRef.current) closeRef.current?.(); }}
      onPointerDownCapture={bloquear}
      onClickCapture={bloquear}
      onKeyDownCapture={(event) => { if (event.key !== "Tab") bloquear(event); }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && closeRef.current) {
          event.preventDefault();
          event.stopPropagation();
          if (!event.repeat) closeRef.current();
        }
        if (event.key !== "Tab") return;
        const elements = focusableElements(event.currentTarget);
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <div className={className}>{children}</div>
    </dialog>
  );
}
