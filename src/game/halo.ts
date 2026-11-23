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

type Bloque = { x: number; y: number; width: number; height: number; kind?: string };

/** Tipos que ya se distinguen por su dibujo o que no se pisan como suelo firme: no llevan contorno. */
const SIN_CONTORNO = new Set(["spring", "gift-spring", "dew", "mist", "sky-lift-station", "sky-bounce", "puzzle-block", "puzzle-color"]);
const esSuelo = (kind?: string) => !kind || kind === "ground" || kind.endsWith("-ground");

/**
 * Contorno oscuro de lo que se pisa (issue 326): todas las aristas de las plataformas visibles en un solo trazo. Los
 * suelos llevan su borde de arriba y los lados que dan a un hueco; las plataformas flotantes, el contorno entero.
 */
export function drawContornos(context: CanvasRenderingContext2D, plataformas: readonly Bloque[], cameraX: number, ancho: number) {
  const visibles = plataformas.filter((p) => !SIN_CONTORNO.has(p.kind ?? "") && p.x - cameraX < ancho + 4 && p.x + p.width - cameraX > -4);
  if (!visibles.length) return;
  const tocaPorLado = (p: Bloque, lado: number) => visibles.some((otra) => otra !== p && Math.abs(lado - (lado === p.x ? otra.x + otra.width : otra.x)) < 3 && otra.y <= p.y + 4 && otra.y + otra.height >= p.y);
  context.save();
  context.strokeStyle = "rgba(34, 18, 44, .85)";
  context.lineWidth = 3;
  context.lineJoin = "round";
  context.beginPath();
  for (const p of visibles) {
    const x = Math.round(p.x - cameraX) + 1.5;
    const y = Math.round(p.y) + 1.5;
    const w = Math.round(p.width) - 3;
    // Las nubes son blandas: solo la línea de arriba, que es lo que se pisa.
    // Su dibujo empieza unas 5 unidades por debajo del borde de colisión.
    if (p.kind?.startsWith("sky-") || p.kind?.startsWith("cloud")) { context.moveTo(x + 10, y + 5); context.lineTo(x + w - 10, y + 5); continue; }
    if (!esSuelo(p.kind)) {
      const alto = Math.max(4, Math.round(p.height) - 3);
      if (typeof context.roundRect === "function") context.roundRect(x, y, w, alto, Math.min(8, alto / 2));
      else context.rect(x, y, w, alto);
      continue;
    }
    context.moveTo(x, y); context.lineTo(x + w, y);
    if (!tocaPorLado(p, p.x)) { context.moveTo(x, y); context.lineTo(x, y + Math.min(p.height, 60)); }
    if (!tocaPorLado(p, p.x + p.width)) { context.moveTo(x + w, y); context.lineTo(x + w, y + Math.min(p.height, 60)); }
  }
  context.stroke();
  context.restore();
}
