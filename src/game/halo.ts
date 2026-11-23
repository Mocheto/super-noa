/**
 * Lo que se pisa y lo que hace daño (issue 325; guía de estilo visual). Un velo del color oscuro del mundo baja el
 * contraste del fondo pintado, y un halo rojizo suave rodea a lo que hace daño para que se reconozca por la forma y no
 * solo por el color. El halo se pinta una vez en un lienzo aparte y se copia como sprite: nada de `shadowBlur` por cuadro.
 */
export const VELO_ALFA = 0.22;
const HALO_ALFA = 1;
let haloSprite: HTMLCanvasElement | null | undefined;

function sprite(): HTMLCanvasElement | null {
  if (haloSprite !== undefined) return haloSprite;
  if (typeof document === "undefined") return (haloSprite = null);
  const lienzo = document.createElement("canvas");
  lienzo.width = lienzo.height = 128;
  const context = lienzo.getContext("2d");
  if (!context) return (haloSprite = null);
  const degradado = context.createRadialGradient(64, 64, 10, 64, 64, 64);
  degradado.addColorStop(0, "rgba(255, 96, 96, .85)");
  degradado.addColorStop(.55, "rgba(255, 72, 92, .6)");
  degradado.addColorStop(1, "rgba(255, 60, 90, 0)");
  context.fillStyle = degradado;
  context.fillRect(0, 0, 128, 128);
  return (haloSprite = lienzo);
}

/** Velo semitransparente sobre todo el lienzo; va justo después del fondo y antes del terreno. */
export function drawVelo(context: CanvasRenderingContext2D, color: string, ancho: number, alto: number) {
  context.save();
  context.globalAlpha = VELO_ALFA;
  context.fillStyle = color;
  context.fillRect(0, 0, ancho, alto);
  context.restore();
}

/** Halo rojizo alrededor de la caja de algo que hace daño (en coordenadas de pantalla). */
export function drawHalo(context: CanvasRenderingContext2D, x: number, y: number, ancho: number, alto: number) {
  const imagen = sprite();
  if (!imagen) return;
  const lado = Math.max(ancho, alto) * 2;
  context.save();
  context.globalAlpha = HALO_ALFA;
  context.drawImage(imagen, x + ancho / 2 - lado / 2, y + alto / 2 - lado / 2, lado, lado);
  context.restore();
}
