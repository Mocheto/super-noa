import "../textos/zonas/casa";
import { t } from "../textos/index.ts";
import { Boton } from "../textos/Texto";

type Props = {
  nombre: string;
  /** Pies del gatito y su alto, en px del visor. */
  x: number;
  y: number;
  alto: number;
  anchoVisor: number;
  onAcariciar: () => void;
};

/** Alto del menú, en px de pantalla. */
const ALTO_MENU = 72;

/** El menú que sale junto a un gatito al tocarlo: de momento, solo ACARICIA. Va sobre el visor, a tamaño de pantalla. */
export function MenuGatito({ nombre, x, y, alto, anchoVisor, onAcariciar }: Props) {
  // En el borde izquierdo el menú empieza en el gatito, en el derecho acaba en él y entre medias se reparte: nunca se
  // sale del visor, mida lo que mida su letra.
  const parte = Math.max(0, Math.min(1, x / anchoVisor)) * 100;
  const arriba = Math.max(4, y - alto - ALTO_MENU);
  return <div className="casa-menu" role="group" aria-label={t("casa.menu.oculto", { nombre })} style={{ left: `${parte}%`, top: arriba, transform: `translateX(-${parte}%)` }}>
    <Boton clave="casa.menu.acaricia.rotulo" tipo="seguir" onClick={onAcariciar} />
  </div>;
}
