/**
 * Efectos de respuesta al jugar (issue 338, elegidos en el prototipo de la #337): nubecitas de polvo al aterrizar,
 * estrellitas en abanico al recoger y una fuente de estrellas al ganar. Viven en coordenadas del mundo, se dibujan con
 * formas simples (sin `shadowBlur`; las estrellas, como sprite pintado una vez) y, con «movimiento tranquilo», se quedan quietos y solo se desvanecen.
 */
export type TipoEfecto = "polvo" | "recoger" | "fuente";
export type Efecto = { tipo: TipoEfecto; x: number; y: number; edad: number };

export const DURACION: Record<TipoEfecto, number> = { polvo: .35, recoger: .5, fuente: 1.2 };

export function crearEfectos() {
  const lista: Efecto[] = [];
  return {
    lista,
    lanzar(tipo: TipoEfecto, x: number, y: number) { lista.push({ tipo, x, y, edad: 0 }); },
    /** Avanza y suelta los que ya terminaron. */
    avanzar(delta: number) {
      for (let indice = lista.length - 1; indice >= 0; indice -= 1) {
        lista[indice].edad += delta;
        if (lista[indice].edad >= DURACION[lista[indice].tipo]) lista.splice(indice, 1);
      }
    },
    vaciar() { lista.length = 0; },
  };
}

const facil = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

function bola(context: CanvasRenderingContext2D, x: number, y: number, radio: number) {
  context.beginPath(); context.arc(x, y, radio, 0, Math.PI * 2); context.fill();
}

function trazarEstrella(context: CanvasRenderingContext2D, x: number, y: number, radio: number, color: string) {
  context.beginPath();
  for (let punta = 0; punta < 10; punta += 1) {
    const angulo = punta * Math.PI / 5 - Math.PI / 2;
    const r = punta % 2 ? radio * .45 : radio;
    context.lineTo(x + Math.cos(angulo) * r, y + Math.sin(angulo) * r);
  }
  context.closePath();
  context.fillStyle = color; context.fill();
  context.lineWidth = Math.max(1.5, radio * .18); context.strokeStyle = "#3d1430"; context.stroke();
}

// Las estrellas se pintan una vez por color en un lienzo de 32 px y se copian (más barato que trazarlas en cada cuadro).
const sprites = new Map<string, HTMLCanvasElement | null>();
function spriteEstrella(color: string): HTMLCanvasElement | null {
  if (sprites.has(color)) return sprites.get(color)!;
  let lienzo: HTMLCanvasElement | null = null;
  if (typeof document !== "undefined") {
    lienzo = document.createElement("canvas");
    lienzo.width = lienzo.height = 32;
    const context = lienzo.getContext("2d");
    if (context) trazarEstrella(context, 16, 16, 13, color);
    else lienzo = null;
  }
  sprites.set(color, lienzo);
  return lienzo;
}

function estrella(context: CanvasRenderingContext2D, x: number, y: number, radio: number, color: string) {
  const sprite = spriteEstrella(color);
  if (!sprite) { trazarEstrella(context, x, y, radio, color); return; }
  const lado = radio * 32 / 13;
  context.drawImage(sprite, x - lado / 2, y - lado / 2, lado, lado);
}

/** Dibuja todos los efectos vivos; `cameraX` resta la cámara horizontal (la vertical ya va en la traslación del lienzo). */
export function drawEfectos(context: CanvasRenderingContext2D, lista: readonly Efecto[], cameraX: number, calma: boolean) {
  for (const efecto of lista) {
    const p = efecto.edad / DURACION[efecto.tipo];
    const x = efecto.x - cameraX;
    const y = efecto.y;
    context.save();
    if (efecto.tipo === "polvo") {
      // A · Nubecitas: seis bolitas crema que se abren a los lados de los pies.
      context.fillStyle = "#fff3dc";
      context.globalAlpha = (1 - p) * .9;
      for (let i = 0; i < 6; i += 1) {
        const lado = i % 2 ? 1 : -1;
        const distancia = calma ? 10 + i * 4 : facil(p) * (18 + i * 7);
        bola(context, x + lado * distancia, y - 4 - (i % 3) * 3, 6 + (i % 3) * 2);
      }
    } else if (efecto.tipo === "recoger") {
      // A · Estrellas: cinco estrellitas doradas en abanico hacia arriba.
      context.globalAlpha = 1 - p * p;
      for (let i = 0; i < 5; i += 1) {
        const angulo = -Math.PI / 2 + (i - 2) * .55;
        const distancia = calma ? 26 : facil(p) * 52;
        estrella(context, x + Math.cos(angulo) * distancia, y + Math.sin(angulo) * distancia, 8, "#ffd45f");
      }
    } else {
      // B · Fuente: las estrellas salen de Noa hacia arriba y caen.
      const t = efecto.edad;
      context.globalAlpha = 1 - p * .6;
      for (let i = 0; i < 22; i += 1) {
        const angulo = -Math.PI / 2 + (i / 21 - .5) * 1.6;
        const velocidad = 320 + (i % 5) * 40;
        const ex = x + Math.cos(angulo) * velocidad * (calma ? .3 : t);
        const ey = y + (calma ? -120 : Math.sin(angulo) * velocidad * t + 420 * t * t);
        estrella(context, ex, ey, 8 + (i % 3) * 2, i % 4 ? "#ffd45f" : "#fff3dc");
      }
    }
    context.restore();
  }
}
