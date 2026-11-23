/**
 * Dibujo de la caña de pluma (issues 342 y 343) con su lámina `casa-pluma-v1.webp`: tres celdas de 128 × 128 (la caña
 * entera para la bandeja, el palo solo y la pluma sola), recortadas con `prototypes/tools/casa-pluma-recorte.py`. El
 * icono va en la bandeja; la capa va sobre la escena, y en cada cuadro `pintarPluma` mueve sus piezas sin volver a
 * pintar el componente. El hilo lo traza el juego, para que la pluma se balancee.
 */
import type { Ref } from "react";
import type { Punto } from "./casaDeambular";

export const HOJA_PLUMA = "./assets/sprites/casa-pluma-v1.webp";
export const CELDA_PLUMA = 128;

/** Anclas en px de su celda, medidas por el recorte: el mango y la punta del palo, y dónde se ata el hilo a la pluma. */
export const MANGO = { x: 19, y: 106 } as const;
export const PUNTA = { x: 107, y: 19 } as const;
export const ATADURA = { x: 64, y: 24 } as const;
/** Escala de la pluma en la escena (unos 80 px de alto, algo más pequeña que un gatito). */
export const ESCALA_PLUMA = 0.8;
/** Largo del palo en su celda; la escena lo estira hasta la punta de la caña. */
export const LARGO_PALO = Math.hypot(PUNTA.x - MANGO.x, PUNTA.y - MANGO.y);

const TRAZO = "#2f1d33";

/** Una celda de la lámina, con su esquina arriba a la izquierda en (0, 0). */
function Celda({ celda }: { celda: number }) {
  return <svg width={CELDA_PLUMA} height={CELDA_PLUMA} viewBox={`${celda * CELDA_PLUMA} 0 ${CELDA_PLUMA} ${CELDA_PLUMA}`} overflow="hidden">
    <image href={HOJA_PLUMA} width={CELDA_PLUMA * 3} height={CELDA_PLUMA} style={{ imageRendering: "pixelated" }} />
  </svg>;
}

/** Icono de la bandeja: la caña entera. */
export function IconoCanaPluma() {
  return <i className="casa-objeto is-pluma" aria-hidden="true" />;
}

/** Capa de la escena (1280 × 540) con el palo en la mano, el hilo y la pluma; se ve solo mientras se arrastra la caña. */
export function CapaPluma({ capaRef, ancho, alto }: { capaRef: Ref<SVGSVGElement>; ancho: number; alto: number }) {
  return <svg ref={capaRef} className="casa-pluma-capa" viewBox={`0 0 ${ancho} ${alto}`} width={ancho} height={alto} aria-hidden="true">
    <g data-parte="palo"><Celda celda={1} /></g>
    <line data-parte="hilo" stroke={TRAZO} strokeWidth={2} />
    <g data-parte="pluma"><Celda celda={2} /></g>
  </svg>;
}

/** Coloca las piezas: el palo del dedo (mango) a la punta, el hilo hasta la pluma y la pluma inclinada según se mueve. */
export function pintarPluma(capa: SVGSVGElement | null, dedo: Punto, punta: Punto, pluma: Punto) {
  if (!capa) return;
  const escalaPalo = Math.hypot(punta.x - dedo.x, punta.y - dedo.y) / LARGO_PALO;
  capa.querySelector('[data-parte="palo"]')?.setAttribute("transform", `translate(${dedo.x} ${dedo.y}) scale(${escalaPalo}) translate(${-MANGO.x} ${-MANGO.y})`);
  const hilo = capa.querySelector('[data-parte="hilo"]');
  hilo?.setAttribute("x1", String(punta.x)); hilo?.setAttribute("y1", String(punta.y));
  hilo?.setAttribute("x2", String(pluma.x)); hilo?.setAttribute("y2", String(pluma.y));
  const inclinacion = Math.max(-35, Math.min(35, Math.atan2(punta.x - pluma.x, pluma.y - punta.y) * 180 / Math.PI));
  capa.querySelector('[data-parte="pluma"]')?.setAttribute("transform",
    `translate(${pluma.x} ${pluma.y}) rotate(${-inclinacion}) scale(${ESCALA_PLUMA}) translate(${-ATADURA.x} ${-ATADURA.y})`);
}
