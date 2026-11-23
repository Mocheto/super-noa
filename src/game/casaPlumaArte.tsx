/**
 * Dibujo de la caña de pluma (issue 342): por código mientras no llega el arte de la #340. El icono va en la bandeja; la
 * capa va sobre la escena, y en cada cuadro `pintarPluma` mueve sus piezas sin volver a pintar el componente.
 */
import type { Ref } from "react";
import type { Punto } from "./casaDeambular";

const TRAZO = "#2f1d33";

/** Pluma colgando, con la bolita roja arriba en (0, 0). */
function Pluma() {
  return <>
    <path d="M0 4 C 15 14, 17 40, 4 62 C 1 66, -1 66, -4 62 C -17 40, -15 14, 0 4 Z" fill="#f59ac0" stroke={TRAZO} strokeWidth={3} strokeLinejoin="round" />
    <path d="M-6 48 C -3 58, 3 58, 6 48 C 5 56, 3 64, 0 65 C -3 64, -5 56, -6 48 Z" fill="#ffd45f" />
    <path d="M0 8 L0 58" stroke="#c9567f" strokeWidth={2} />
    <circle cx={0} cy={3} r={5} fill="#e0453a" stroke={TRAZO} strokeWidth={2} />
  </>;
}

/** Icono de la bandeja: la caña entera. */
export function IconoCanaPluma() {
  return <svg className="casa-objeto is-pluma" viewBox="0 0 64 64" aria-hidden="true">
    <path d="M50 58 L20 10" stroke={TRAZO} strokeWidth={7} strokeLinecap="round" />
    <path d="M50 58 L20 10" stroke="#c98a4b" strokeWidth={3.5} strokeLinecap="round" />
    <path d="M20 10 Q 16 22 18 30" stroke={TRAZO} strokeWidth={1.5} fill="none" />
    <g transform="translate(18 30) scale(.45)"><Pluma /></g>
  </svg>;
}

/** Capa de la escena (1280 × 540) con el palo en la mano, el hilo y la pluma; se ve solo mientras se arrastra la caña. */
export function CapaPluma({ capaRef, ancho, alto }: { capaRef: Ref<SVGSVGElement>; ancho: number; alto: number }) {
  return <svg ref={capaRef} className="casa-pluma-capa" viewBox={`0 0 ${ancho} ${alto}`} width={ancho} height={alto} aria-hidden="true">
    <line data-parte="palo-borde" stroke={TRAZO} strokeWidth={11} strokeLinecap="round" />
    <line data-parte="palo" stroke="#c98a4b" strokeWidth={6} strokeLinecap="round" />
    <line data-parte="hilo" stroke={TRAZO} strokeWidth={2} />
    <g data-parte="pluma"><Pluma /></g>
  </svg>;
}

/** Coloca las piezas: el palo del dedo a la punta, el hilo hasta la pluma y la pluma inclinada según se mueve. */
export function pintarPluma(capa: SVGSVGElement | null, dedo: Punto, punta: Punto, pluma: Punto) {
  if (!capa) return;
  for (const parte of ["palo-borde", "palo"]) {
    const linea = capa.querySelector(`[data-parte="${parte}"]`);
    linea?.setAttribute("x1", String(dedo.x)); linea?.setAttribute("y1", String(dedo.y));
    linea?.setAttribute("x2", String(punta.x)); linea?.setAttribute("y2", String(punta.y));
  }
  const hilo = capa.querySelector('[data-parte="hilo"]');
  hilo?.setAttribute("x1", String(punta.x)); hilo?.setAttribute("y1", String(punta.y));
  hilo?.setAttribute("x2", String(pluma.x)); hilo?.setAttribute("y2", String(pluma.y));
  const inclinacion = Math.max(-35, Math.min(35, Math.atan2(punta.x - pluma.x, pluma.y - punta.y) * 180 / Math.PI));
  capa.querySelector('[data-parte="pluma"]')?.setAttribute("transform", `translate(${pluma.x} ${pluma.y}) rotate(${-inclinacion})`);
}
