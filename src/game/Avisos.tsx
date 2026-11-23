import { useEffect, type ReactNode } from "react";

/** Segundos que se ve un aviso antes de irse solo. */
export const AVISO_SEGUNDOS = 8;

export type Aviso = { id: string; clase: string; rol: "status" | "alert"; contenido: ReactNode };

/** Un aviso superpuesto: se va solo a los `AVISO_SEGUNDOS` o al tocarlo (salvo si se toca uno de sus botones). */
function AvisoSuperpuesto({ aviso, onCerrar }: { aviso: Aviso; onCerrar: (id: string) => void }) {
  useEffect(() => {
    const espera = window.setTimeout(() => onCerrar(aviso.id), AVISO_SEGUNDOS * 1000);
    return () => window.clearTimeout(espera);
  }, [aviso.id, onCerrar]);
  return (
    // Tocar el aviso lo cierra; el teclado no lo necesita porque se cierra solo y no tapa nada que se maneje.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <p className={aviso.clase} role={aviso.rol} onClick={(event) => { if (!(event.target as HTMLElement).closest("button")) onCerrar(aviso.id); }}>
      {aviso.contenido}
    </p>
  );
}

/**
 * Avisos para adultos (guardado, tablón, música) superpuestos arriba, sin empujar la página (issue 321). Durante la
 * partida esperan: con `esperar` no salen hasta que el juego deja de correr (pausa, mapa…), para no tapar el HUD ni los controles.
 */
export function Avisos({ avisos, cerrados, onCerrar, esperar }: { avisos: Aviso[]; cerrados: ReadonlySet<string>; onCerrar: (id: string) => void; esperar: boolean }) {
  const visibles = esperar ? [] : avisos.filter((aviso) => !cerrados.has(aviso.id));
  if (!visibles.length) return null;
  return <div className="avisos">{visibles.map((aviso) => <AvisoSuperpuesto key={aviso.id} aviso={aviso} onCerrar={onCerrar} />)}</div>;
}
