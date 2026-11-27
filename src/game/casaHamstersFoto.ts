/**
 * La jaula de hámsters en una foto de la casa: las mismas piezas que en la casa, con Perla y Bolita sentados siempre en
 * el mismo sitio. La foto no guarda nada de la jaula; sale si lo que se veía llegaba hasta ella.
 */
import { CAMINOS, CUBOS, DIBUJO, NODOS, PUERTA_JAULA, REPISA, SITIO_JAULA, type HamsterId, type Punto } from "./casaHamsters.ts";
import {
  AGUA_EN_BOTELLA, ARTE_JAULA, CAJA_JAULA, cajaDeHamster, casitaDe, CELDA_OBJETO, COLOCADOS, CUADRO_HAMSTER, FONDO_JAULA, POSES, type Colocado,
} from "./casaHamstersArte.ts";
import { JUEGOS_TUBOS } from "./casaDecoracion.ts";
import { dibujoDeColor } from "./casaDecoracionArte.ts";
import type { FotoCasa } from "./casaProgreso.ts";

/** Dónde posan en las fotos (centro, en px del dibujo). */
export const POSADO: Readonly<Record<HamsterId, Punto>> = { perla: { x: 480, y: NODOS.f1.y }, bolita: { x: 590, y: NODOS.p1.y } };

/** Salen en las fotos de la habitación que llegan a la jaula; las de antes de la jaula nunca llegaban. */
export const saleLaJaula = (foto: Pick<FotoCasa, "vista" | "jardin">) => !foto.jardin && foto.vista.x < SITIO_JAULA.zona.hasta;

/** Pinta la jaula en el lienzo de una foto de `escala` px por px de escena. */
export async function pintarJaulaEnFoto(contexto: CanvasRenderingContext2D, foto: Pick<FotoCasa, "vista" | "decoracion">, escala: number, cargar: (ruta: string) => Promise<HTMLImageElement>): Promise<void> {
  const tubos = JUEGOS_TUBOS[foto.decoracion.tubos];
  const casita = casitaDe(foto.decoracion.casita);
  const base = await dibujoDeColor(ARTE_JAULA.jaula, "baseJaula", foto.decoracion.baseJaula);
  const [jaula, objetos, perla, bolita] = await Promise.all([base, ARTE_JAULA.objetos, ARTE_JAULA.hamsters.perla, ARTE_JAULA.hamsters.bolita].map(cargar));
  const hojas: Readonly<Record<HamsterId, HTMLImageElement>> = { perla, bolita };
  const hojaCasita = await cargar(casita.hoja);
  contexto.save();
  contexto.setTransform(escala, 0, 0, escala, -foto.vista.x * escala, 0);
  // De aquí en adelante, en px del dibujo del laberinto.
  contexto.translate(SITIO_JAULA.left, SITIO_JAULA.top);
  contexto.scale(SITIO_JAULA.escala, SITIO_JAULA.escala);
  contexto.translate(-DIBUJO.x, -DIBUJO.y);

  const objeto = (de: Colocado) => contexto.drawImage(objetos, de.celda * CELDA_OBJETO, 0, CELDA_OBJETO, CELDA_OBJETO, de.x, de.y, de.lado, de.lado);
  const linea = (puntos: readonly Punto[], color: string, grosor: number, alfa = 1) => {
    contexto.globalAlpha = alfa;
    contexto.strokeStyle = color;
    contexto.lineWidth = grosor;
    contexto.beginPath();
    puntos.forEach((p, i) => (i ? contexto.lineTo(p.x, p.y) : contexto.moveTo(p.x, p.y)));
    contexto.stroke();
    contexto.globalAlpha = 1;
  };
  const posar = (id: HamsterId) => {
    const caja = cajaDeHamster(id);
    contexto.drawImage(hojas[id], POSES.indexOf("sentado") * CUADRO_HAMSTER.ancho, 0, CUADRO_HAMSTER.ancho, CUADRO_HAMSTER.alto,
      POSADO[id].x + caja.x, POSADO[id].y + caja.y, caja.ancho, caja.alto);
  };

  contexto.globalAlpha = 0.65;
  contexto.fillStyle = "#eaf6fc";
  contexto.fillRect(FONDO_JAULA.x, FONDO_JAULA.y, FONDO_JAULA.ancho, FONDO_JAULA.alto);
  contexto.globalAlpha = 1;
  contexto.drawImage(jaula, CAJA_JAULA.x, CAJA_JAULA.y, CAJA_JAULA.ancho, CAJA_JAULA.alto);
  contexto.fillStyle = "#f59ac0";
  contexto.fillRect(REPISA.x, REPISA.y, REPISA.ancho, 11);
  contexto.lineCap = "round";
  for (const camino of CAMINOS.filter((c) => c.tipo === "rampa")) {
    const rampa = [camino.a, camino.b].map((nodo) => ({ x: NODOS[nodo].x, y: NODOS[nodo].y + 17 }));
    linea(rampa, "#2f1d33", 11);
    linea(rampa, "#d99a55", 7);
  }
  contexto.lineCap = "butt";

  for (const de of [COLOCADOS.soporte, COLOCADOS.aro, COLOCADOS.marco, COLOCADOS.asiento, COLOCADOS.comidaLlena, COLOCADOS.botella]) objeto(de);
  const k = COLOCADOS.botella.lado / CELDA_OBJETO;
  const alto = AGUA_EN_BOTELLA.alto;
  contexto.globalAlpha = 0.65;
  contexto.fillStyle = "#4fb4e8";
  contexto.fillRect(COLOCADOS.botella.x + AGUA_EN_BOTELLA.x * k, COLOCADOS.botella.y + (AGUA_EN_BOTELLA.fondo - alto) * k, AGUA_EN_BOTELLA.ancho * k, alto * k);
  contexto.globalAlpha = 1;
  posar("perla");
  posar("bolita");

  contexto.lineJoin = "round";
  for (const camino of CAMINOS.filter((c) => c.tipo === "tubo")) {
    const color = tubos[camino.color ?? "rojo"];
    linea(camino.linea, color, 46, 0.22);
    linea(camino.linea, "#fff", 36, 0.1);
    contexto.setLineDash([9, 45]);
    contexto.lineDashOffset = -22;
    linea(camino.linea, color, 50, 0.8);
    contexto.setLineDash([]);
    for (const nodo of [camino.a, camino.b]) {
      contexto.strokeStyle = color;
      contexto.lineWidth = 6;
      contexto.beginPath();
      contexto.arc(NODOS[nodo].x, NODOS[nodo].y, 24, 0, Math.PI * 2);
      contexto.stroke();
    }
  }
  for (const id of CUBOS) {
    const { x, y } = NODOS[id];
    contexto.fillStyle = "rgba(255, 255, 255, 0.35)";
    contexto.strokeStyle = "#8d9aa8";
    contexto.lineWidth = 3;
    contexto.fillRect(x - 36, y - 36, 72, 72);
    contexto.strokeRect(x - 36, y - 36, 72, 72);
    for (const [dx, dy, w, h, color] of [[-16, -41, 32, 10, tubos.rojo], [-16, 31, 32, 10, tubos.azul], [-41, -16, 10, 32, tubos.amarillo], [31, -16, 10, 32, tubos.azul]] as const) {
      contexto.fillStyle = color;
      contexto.fillRect(x + dx, y + dy, w, h);
    }
  }
  const { colocado } = casita;
  contexto.drawImage(hojaCasita, colocado.celda * CELDA_OBJETO, 0, CELDA_OBJETO, CELDA_OBJETO, colocado.x, colocado.y, colocado.lado, colocado.lado);
  contexto.strokeStyle = "#ff8a3d";
  contexto.lineWidth = 6;
  contexto.strokeRect(PUERTA_JAULA.x, PUERTA_JAULA.y, PUERTA_JAULA.ancho, PUERTA_JAULA.alto);
  contexto.restore();
}
