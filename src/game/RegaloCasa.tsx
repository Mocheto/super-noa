/**
 * El regalo en la casa (mapa «Ganar decoraciones de la casa», boceto del regalo): la caja que salta en la alfombra, el
 * confeti al abrirla y la tarjeta grande con lo que ha tocado. El dibujo de la caja es provisional (`casa.css`).
 */
import "../textos/zonas/casa";
import type { CSSProperties, ReactNode } from "react";
import { Boton } from "../textos/Texto";
import { t } from "../textos";
import { Ventana } from "./Ventana";

/** La caja en la escena de la habitación: sobre la alfombra, apoyada en el suelo. */
export const CAJA_REGALO = { x: 585, y: 390, ancho: 110, alto: 110 };

export const enLaCajaDeRegalo = (punto: { x: number; y: number }) =>
  punto.x >= CAJA_REGALO.x && punto.x <= CAJA_REGALO.x + CAJA_REGALO.ancho && punto.y >= CAJA_REGALO.y && punto.y <= CAJA_REGALO.y + CAJA_REGALO.alto;

/** El toque con el dedo lo recoge la casa (`enLaCajaDeRegalo`); el botón es para el teclado y el mando. */
export function CajaRegalo({ onAbrir }: { onAbrir: () => void }) {
  return <button type="button" className="casa-regalo" aria-label={t("casa.regalo.caja.oculto")}
    style={{ left: CAJA_REGALO.x, top: CAJA_REGALO.y, width: CAJA_REGALO.ancho, height: CAJA_REGALO.alto }}
    onClick={(event) => { if (event.detail === 0) onAbrir(); }} />;
}

const COLORES = ["#e5484d", "#ffd76a", "#5aa9e6", "#7fcf6a", "#c79bf2"];

export function ConfetiRegalo() {
  return <span className="casa-confeti" aria-hidden="true" style={{ left: CAJA_REGALO.x + CAJA_REGALO.ancho / 2, top: CAJA_REGALO.y + CAJA_REGALO.alto / 2 }}>
    {Array.from({ length: 32 }, (_, i) => <i key={i} style={{ background: COLORES[i % COLORES.length], "--dx": `${Math.round(Math.cos(i) * (70 + i * 5))}px`, "--dy": `${Math.round(Math.sin(i * 1.7) * 150 - 30)}px` } as CSSProperties} />)}
  </span>;
}

/** La tarjeta con lo ganado (`children`: su muestra, que se ve en grande); al cerrarla va a su sitio. */
export function TarjetaRegalo({ nombre, children, onClose }: { nombre: string; children: ReactNode; onClose: () => void }) {
  return <Ventana id="casa-regalo" titulo="casa.regalo.titulo.rotulo" celebracion onClose={onClose}
    botones={<Boton tipo="seguir" clave="casa.regalo.sigue.rotulo" data-gamepad-default onClick={onClose} />}>
    <div className="casa-regalo-muestra" role="img" aria-label={nombre}>{children}</div>
  </Ventana>;
}
