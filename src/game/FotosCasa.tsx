import { useEffect, useRef, useState } from "react";
import type { FotoCasa } from "./casaFoto";
import { dibujarFoto } from "./casaFotoArte";
import { t } from "../textos/index.ts";
import { BotonControl } from "../textos/Texto";

/** Una foto dibujada en su lienzo, al ancho dado. */
function Lienzo({ foto, ancho, className }: { foto: FotoCasa; ancho: number; className: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const lienzo = ref.current;
    if (!lienzo) return;
    lienzo.width = ancho;
    void dibujarFoto(lienzo, foto);
  }, [foto, ancho]);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

/**
 * Pestaña «FOTOS» del álbum (mapa «Cámara de fotos de la casa»): las fotos de la casa en rejilla, la más nueva primero;
 * tocar una la enseña en grande. Sin fotos, cuenta cómo hacerlas.
 */
export function FotosCasa({ fotos }: { fotos: readonly FotoCasa[] }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  if (!fotos.length) return <p className="juntos fotos-casa-vacio">{t("coleccion.fotos.vacio.juntos")}</p>;
  if (abierta !== null && fotos[abierta]) {
    return <div className="fotos-casa-grande">
      <BotonControl className="fotos-casa-volver" pictograma="vuelve" etiqueta="coleccion.fotos.volver.oculto" onClick={() => setAbierta(null)} />
      <div role="img" aria-label={t("coleccion.fotos.foto.oculto", { numero: abierta + 1 })}>
        <Lienzo foto={fotos[abierta]} ancho={960} className="fotos-casa-lienzo" />
      </div>
    </div>;
  }
  return <>
    <p className="juntos">{t("coleccion.fotos.intro.juntos")}</p>
    <div className="fotos-casa-rejilla">
      {fotos.map((foto, indice) => <button key={foto.hecha} type="button" className="fotos-casa-foto"
        aria-label={t("coleccion.fotos.foto.oculto", { numero: indice + 1 })} onClick={() => setAbierta(indice)}>
        <Lienzo foto={foto} ancho={320} className="fotos-casa-lienzo" />
      </button>)}
    </div>
  </>;
}
