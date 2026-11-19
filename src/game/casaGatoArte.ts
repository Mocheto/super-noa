/**
 * Arte del gato base de la casa (decisión «La hoja del gato base»): una hoja de 4 × 13 cuadros de 160 × 160 pintada
 * con colores clave (`public/assets/sprites/gato-casa-v1.webp`, de `prototypes/tools/casa-recorte.py`), que se
 * vuelve a pintar con la paleta de cada gatito. El barro toma el color del pelo cuando está limpio y el lazo de mejor
 * amigo es transparente hasta tener cinco corazones.
 */
export const HOJA_GATO = "./assets/sprites/gato-casa-v1.webp";
export const CUADRO_GATO = 160;
export const COLUMNAS_GATO = 4;

/** Filas de la hoja, en orden, con sus cuadros y su velocidad en cuadros por segundo. */
export const ANIMACIONES_GATO = {
  andar: { fila: 0, cuadros: 4, fps: 8 },
  sentado: { fila: 1, cuadros: 2, fps: 1.5 },
  cola: { fila: 2, cuadros: 1, fps: 1 },
  dormir: { fila: 3, cuadros: 2, fps: 1 },
  jugarSolo: { fila: 4, cuadros: 3, fps: 5 },
  cantar: { fila: 5, cuadros: 2, fps: 3 },
  pedir: { fila: 6, cuadros: 2, fps: 3 },
  comer: { fila: 7, cuadros: 3, fps: 4 },
  ronronear: { fila: 8, cuadros: 2, fps: 3 },
  bano: { fila: 9, cuadros: 2, fps: 3 },
  sacudirse: { fila: 10, cuadros: 3, fps: 6 },
  pelota: { fila: 11, cuadros: 4, fps: 8 },
  ahoraNo: { fila: 12, cuadros: 2, fps: 3 },
} as const;
export type AnimacionGato = keyof typeof ANIMACIONES_GATO;
export const FILAS_GATO = Object.keys(ANIMACIONES_GATO).length;

/** Cuadro que toca a los `segundos` de empezar la animación (en bucle). */
export const cuadroDe = (animacion: AnimacionGato, segundos: number) => {
  const { cuadros, fps } = ANIMACIONES_GATO[animacion];
  return Math.floor(Math.max(0, segundos) * fps) % cuadros;
};

export type Rgb = readonly [number, number, number];
const hex = (valor: string): Rgb => [parseInt(valor.slice(1, 3), 16), parseInt(valor.slice(3, 5), 16), parseInt(valor.slice(5, 7), 16)];

/** Colores clave con que está pintada la hoja (docs/art/casa-gato-base-v1.md). */
export const CLAVES_GATO = {
  pelo: hex("#FF8A00"), peloClaro: hex("#FFC266"), peloOscuro: hex("#C2410C"), rayas: hex("#7C2D12"),
  barriga: hex("#FFF1D6"), orejas: hex("#F9A8D4"), ojos: hex("#1D4ED8"), collar: hex("#2563EB"), collarSombra: hex("#1E3A8A"),
  barro: hex("#8B5A2B"), lazo: hex("#FFD700"),
} as const;
type ClaveColor = keyof typeof CLAVES_GATO;
export type PaletaGatito = Record<Exclude<ClaveColor, "barro" | "lazo">, Rgb>;

const paleta = (colores: Record<keyof PaletaGatito, string>): PaletaGatito =>
  Object.fromEntries(Object.entries(colores).map(([clave, valor]) => [clave, hex(valor)])) as PaletaGatito;

/** Paleta de cada gatito de la v1, por número de mundo. */
export const PALETAS_GATITOS: Readonly<Record<number, PaletaGatito>> = {
  1: paleta({ pelo: "#F2973A", peloClaro: "#FFC27A", peloOscuro: "#C76A1E", rayas: "#B4561A", barriga: "#FFE6C2", orejas: "#F7A1B5", ojos: "#3B82F6", collar: "#3D8BE0", collarSombra: "#2563A8" }),
  2: paleta({ pelo: "#4A4A5C", peloClaro: "#6B6B80", peloOscuro: "#2E2E3D", rayas: "#4A4A5C", barriga: "#8A8AA0", orejas: "#D99AC8", ojos: "#22C5C5", collar: "#8B5CF6", collarSombra: "#5B3BA8" }),
  3: paleta({ pelo: "#F4F1EC", peloClaro: "#FFFFFF", peloOscuro: "#C9C4BC", rayas: "#8C8C96", barriga: "#FFFFFF", orejas: "#F7A9C0", ojos: "#3FA34D", collar: "#2F7A3B", collarSombra: "#1E5428" }),
  // Mapa «Más gatitos en la casa»: sacadas del dibujo de cada mundo (`world-cat-N`) y ajustadas para que no se parezcan
  // entre sí (los naranjas van de dorado a óxido, y cada uno lleva otro collar y otros ojos).
  4: paleta({ pelo: "#F2B544", peloClaro: "#FFD58A", peloOscuro: "#CC8A22", rayas: "#A8661A", barriga: "#FFF1D6", orejas: "#F7A1B5", ojos: "#7A4E2A", collar: "#8B5A2B", collarSombra: "#5E3C1C" }),
  5: paleta({ pelo: "#2B2B33", peloClaro: "#4A4A55", peloOscuro: "#17171C", rayas: "#2B2B33", barriga: "#FFFFFF", orejas: "#F7A1B5", ojos: "#3FA34D", collar: "#E2463F", collarSombra: "#A82A25" }),
  6: paleta({ pelo: "#A8A4B8", peloClaro: "#C8C4D6", peloOscuro: "#7E7A92", rayas: "#94909F", barriga: "#EDEBF3", orejas: "#F2A9C4", ojos: "#7C5CC4", collar: "#8B3A62", collarSombra: "#5E2442" }),
  7: paleta({ pelo: "#8EC8F0", peloClaro: "#C2E3FA", peloOscuro: "#5C9ED0", rayas: "#7AB6E6", barriga: "#EAF6FF", orejas: "#F7B6CC", ojos: "#2563EB", collar: "#F2C14E", collarSombra: "#C99A2E" }),
  8: paleta({ pelo: "#F3E6D2", peloClaro: "#FFF6E8", peloOscuro: "#D9C6AA", rayas: "#7FCFC2", barriga: "#FFFFFF", orejas: "#F7A9C0", ojos: "#2BB3A6", collar: "#F28CA0", collarSombra: "#C25E74" }),
  9: paleta({ pelo: "#EE7A30", peloClaro: "#FFAD6E", peloOscuro: "#BF5418", rayas: "#9E4012", barriga: "#FFE2C0", orejas: "#F7A1B5", ojos: "#2FA38A", collar: "#4CA64C", collarSombra: "#2F7A2F" }),
  10: paleta({ pelo: "#C9622A", peloClaro: "#E48A50", peloOscuro: "#94431A", rayas: "#6E2E10", barriga: "#FFD9B0", orejas: "#F2A0A8", ojos: "#22C5C5", collar: "#B07A3A", collarSombra: "#7A5226" }),
  11: paleta({ pelo: "#A0673A", peloClaro: "#C98E5C", peloOscuro: "#6E4224", rayas: "#5A3418", barriga: "#FFFFFF", orejas: "#F7A1B5", ojos: "#4A8A3A", collar: "#F28CB8", collarSombra: "#C25E8A" }),
  12: paleta({ pelo: "#FBF9FF", peloClaro: "#FFFFFF", peloOscuro: "#D6D2E4", rayas: "#E4E0EE", barriga: "#FFFFFF", orejas: "#F7A9C8", ojos: "#3B82F6", collar: "#A88BE0", collarSombra: "#7A5CB8" }),
  13: paleta({ pelo: "#D9453A", peloClaro: "#F07A6E", peloOscuro: "#A82A22", rayas: "#8F2019", barriga: "#FFFFFF", orejas: "#F7A1B5", ojos: "#2FA34A", collar: "#3F8F4A", collarSombra: "#2A6634" }),
  14: paleta({ pelo: "#E9A85A", peloClaro: "#F7CC8C", peloOscuro: "#C2803A", rayas: "#A8692A", barriga: "#FFEFD6", orejas: "#F2A6A6", ojos: "#1E8078", collar: "#2BB3A6", collarSombra: "#1E8078" }),
  15: paleta({ pelo: "#262630", peloClaro: "#44444F", peloOscuro: "#121218", rayas: "#262630", barriga: "#F2F2F2", orejas: "#E89AB0", ojos: "#E0A030", collar: "#E8B93C", collarSombra: "#B5891E" }),
  16: paleta({ pelo: "#F6DCC8", peloClaro: "#FFF0E4", peloOscuro: "#DDB8A0", rayas: "#E8C4AE", barriga: "#FFFFFF", orejas: "#F7A1B5", ojos: "#4A6FD8", collar: "#4AA8E0", collarSombra: "#2C7AB0" }),
  17: paleta({ pelo: "#D4C6F2", peloClaro: "#ECE4FF", peloOscuro: "#A898D6", rayas: "#BFAEE8", barriga: "#F8F4FF", orejas: "#F7A9D4", ojos: "#8B5CF6", collar: "#F2C14E", collarSombra: "#C99A2E" }),
};

export const LAZO_DORADO: Rgb = hex("#F5C542");
export type VarianteGatito = { sucio: boolean; mejorAmigo: boolean };

const claveRgb = (rgb: Rgb) => (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];

/** Tabla de cambio de color clave → color del gatito (o `null` para transparente). */
export function tablaDeColores(colores: PaletaGatito, variante: VarianteGatito): Map<number, Rgb | null> {
  const tabla = new Map<number, Rgb | null>();
  for (const clave of Object.keys(colores) as (keyof PaletaGatito)[]) tabla.set(claveRgb(CLAVES_GATO[clave]), colores[clave]);
  tabla.set(claveRgb(CLAVES_GATO.barro), variante.sucio ? CLAVES_GATO.barro : colores.pelo);
  tabla.set(claveRgb(CLAVES_GATO.lazo), variante.mejorAmigo ? LAZO_DORADO : null);
  return tabla;
}

/** Vuelve a pintar, en el sitio, los píxeles RGBA de la hoja con la tabla. Los colores que no son clave no cambian. */
export function recolorear(pixeles: Uint8ClampedArray, tabla: Map<number, Rgb | null>) {
  for (let i = 0; i < pixeles.length; i += 4) {
    if (pixeles[i + 3] === 0) continue;
    const color = tabla.get((pixeles[i] << 16) | (pixeles[i + 1] << 8) | pixeles[i + 2]);
    if (color === undefined) continue;
    if (color === null) { pixeles[i + 3] = 0; continue; }
    pixeles[i] = color[0];
    pixeles[i + 1] = color[1];
    pixeles[i + 2] = color[2];
  }
  return pixeles;
}

let hojaBase: Promise<HTMLImageElement> | null = null;
const hojas = new Map<string, Promise<string>>();

/** URL de la hoja pintada para un gatito y una variante (se calcula una vez y se guarda). */
export function hojaDeGatito(mundo: number, variante: VarianteGatito): Promise<string> {
  const clave = `${mundo}-${variante.sucio}-${variante.mejorAmigo}`;
  const guardada = hojas.get(clave);
  if (guardada) return guardada;
  hojaBase ??= new Promise((resolver, fallar) => {
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = fallar;
    imagen.src = HOJA_GATO;
  });
  const promesa = hojaBase.then((imagen) => {
    const lienzo = document.createElement("canvas");
    lienzo.width = imagen.naturalWidth;
    lienzo.height = imagen.naturalHeight;
    const contexto = lienzo.getContext("2d", { willReadFrequently: true });
    if (!contexto) return HOJA_GATO;
    contexto.drawImage(imagen, 0, 0);
    const datos = contexto.getImageData(0, 0, lienzo.width, lienzo.height);
    recolorear(datos.data, tablaDeColores(PALETAS_GATITOS[mundo] ?? PALETAS_GATITOS[1], variante));
    contexto.putImageData(datos, 0, 0);
    return new Promise<string>((resolver) => lienzo.toBlob((blob) => resolver(blob ? URL.createObjectURL(blob) : lienzo.toDataURL())));
  }).catch(() => HOJA_GATO);
  hojas.set(clave, promesa);
  return promesa;
}
