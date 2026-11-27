import { useEffect, useState } from "react";
import type { ParteDeColor, Version } from "./casaDecoracion.ts";
import { dibujoDeColor } from "./casaDecoracionArte.ts";

/** La dirección del dibujo en el color de la versión; mientras se pinta, la que hubiera. */
export function useDibujoDeColor(ruta: string, parte: ParteDeColor, version: Version): string {
  const [pintado, setPintado] = useState(ruta);
  useEffect(() => {
    let vivo = true;
    void dibujoDeColor(ruta, parte, version).then((url) => { if (vivo) setPintado(url); });
    return () => { vivo = false; };
  }, [ruta, parte, version]);
  return version === 0 ? ruta : pintado;
}
