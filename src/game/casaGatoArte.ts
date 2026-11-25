/**
 * Arte del gato base de la casa (decisión «La hoja del gato base»): una hoja de 4 × 13 cuadros de 160 × 160 pintada
 * con colores clave (`public/assets/sprites/gato-casa-v1.webp`, de `prototypes/tools/casa-recorte.py`), que se
 * vuelve a pintar con la paleta de cada gatito. El barro toma el color del pelo cuando está limpio y el lazo de mejor
 * amigo es transparente hasta tener cinco corazones.
 */
export const HOJA_GATO = "./assets/sprites/gato-casa-v1.webp";
export const CUADRO_GATO = 160;
export const COLUMNAS_GATO = 4;

// Las poses viven en `casaProgreso.ts` porque las fotos las guardan.
import { ANIMACIONES_GATO, type AnimacionGato } from "./casaProgreso.ts";

export { ANIMACIONES_GATO };
export type { AnimacionGato };
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
  // Claves de las marcas de los modelos nuevos (docs/art/casa-modelos-v1.md): no están en la hoja del atigrado.
  puntas: hex("#A21CAF"), manchas: hex("#00E5FF"),
} as const;
type ClaveColor = keyof typeof CLAVES_GATO;
export type ClaveMarca = "puntas" | "manchas";
export type PaletaGatito = Record<Exclude<ClaveColor, "barro" | "lazo" | ClaveMarca>, Rgb>;
/** Color de las marcas que lleva un gatito; la que falta se pinta del color del pelo (no se ve). */
export type MarcasGatito = Partial<Record<ClaveMarca, Rgb>>;

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
  5: paleta({ pelo: "#2B2B33", peloClaro: "#4A4A55", peloOscuro: "#17171C", rayas: "#2B2B33", barriga: "#FFFFFF", orejas: "#F7A1B5", ojos: "#3B82F6", collar: "#E2463F", collarSombra: "#A82A25" }),
  6: paleta({ pelo: "#A8A4B8", peloClaro: "#C8C4D6", peloOscuro: "#7E7A92", rayas: "#94909F", barriga: "#EDEBF3", orejas: "#F2A9C4", ojos: "#7C5CC4", collar: "#8B3A62", collarSombra: "#5E2442" }),
  7: paleta({ pelo: "#8EC8F0", peloClaro: "#C2E3FA", peloOscuro: "#5C9ED0", rayas: "#7AB6E6", barriga: "#EAF6FF", orejas: "#F7B6CC", ojos: "#2563EB", collar: "#F2C14E", collarSombra: "#C99A2E" }),
  8: paleta({ pelo: "#F3E6D2", peloClaro: "#FFF6E8", peloOscuro: "#D9C6AA", rayas: "#7FCFC2", barriga: "#FFFFFF", orejas: "#F7A9C0", ojos: "#2BB3A6", collar: "#F28CA0", collarSombra: "#C25E74" }),
  9: paleta({ pelo: "#EE7A30", peloClaro: "#FFAD6E", peloOscuro: "#BF5418", rayas: "#9E4012", barriga: "#FFE2C0", orejas: "#F7A1B5", ojos: "#2FA38A", collar: "#4CA64C", collarSombra: "#2F7A2F" }),
  10: paleta({ pelo: "#C9622A", peloClaro: "#E48A50", peloOscuro: "#94431A", rayas: "#6E2E10", barriga: "#FFD9B0", orejas: "#F2A0A8", ojos: "#22C5C5", collar: "#B07A3A", collarSombra: "#7A5226" }),
  11: paleta({ pelo: "#A0673A", peloClaro: "#C98E5C", peloOscuro: "#6E4224", rayas: "#5A3418", barriga: "#FFFFFF", orejas: "#F7A1B5", ojos: "#7A4A22", collar: "#F28CB8", collarSombra: "#C25E8A" }),
  12: paleta({ pelo: "#FBF9FF", peloClaro: "#FFFFFF", peloOscuro: "#D6D2E4", rayas: "#E4E0EE", barriga: "#FFFFFF", orejas: "#F7A9C8", ojos: "#3B82F6", collar: "#A88BE0", collarSombra: "#7A5CB8" }),
  13: paleta({ pelo: "#D9453A", peloClaro: "#F07A6E", peloOscuro: "#A82A22", rayas: "#D9453A", barriga: "#FFFFFF", orejas: "#F7A1B5", ojos: "#2FA34A", collar: "#3F8F4A", collarSombra: "#2A6634" }),
  14: paleta({ pelo: "#E9A85A", peloClaro: "#F7CC8C", peloOscuro: "#C2803A", rayas: "#A8692A", barriga: "#FFEFD6", orejas: "#F2A6A6", ojos: "#1E8078", collar: "#2BB3A6", collarSombra: "#1E8078" }),
  15: paleta({ pelo: "#262630", peloClaro: "#44444F", peloOscuro: "#121218", rayas: "#262630", barriga: "#F2F2F2", orejas: "#E89AB0", ojos: "#E0A030", collar: "#E8B93C", collarSombra: "#B5891E" }),
  16: paleta({ pelo: "#F6E6CC", peloClaro: "#FFF4E2", peloOscuro: "#DCC4A2", rayas: "#B9A0E0", barriga: "#FFFFFF", orejas: "#F7A1B5", ojos: "#5B5BD6", collar: "#4AA8E0", collarSombra: "#2C7AB0" }),
  17: paleta({ pelo: "#FAF7FF", peloClaro: "#FFFFFF", peloOscuro: "#D8D2EC", rayas: "#FAF7FF", barriga: "#FFFFFF", orejas: "#F7A9D4", ojos: "#2A3F9E", collar: "#F2C14E", collarSombra: "#C99A2E" }),
};

/**
 * Modelo de cada gatito por número de mundo (decisión «Cuántos modelos de gatito y quién va con cada uno»): la forma
 * de su cuerpo y su cabeza. Hoy todos se dibujan con la hoja del atigrado; los otros tres llegan con sus láminas
 * (docs/art/casa-modelos-v1.md).
 */
export const MODELOS_GATITO = ["atigrado", "esmoquin", "melena", "nube"] as const;
export type ModeloGatito = (typeof MODELOS_GATITO)[number];
export const MODELO_DE_GATITO: Readonly<Record<number, ModeloGatito>> = {
  1: "atigrado", 3: "atigrado", 4: "atigrado", 10: "atigrado", 14: "atigrado",
  5: "esmoquin", 11: "esmoquin", 13: "esmoquin", 15: "esmoquin",
  2: "melena", 6: "melena", 8: "melena", 9: "melena", 12: "melena",
  7: "nube", 16: "nube", 17: "nube",
};

/**
 * Marcas de color de cada gatito (decisión «Marcas del pelo de cada gatito y cómo se pintan»): solo las de puntas y
 * manchas, que dibujan los modelos melena y nube. Las rayas y la barriga van en la paleta.
 */
export const MARCAS_GATITOS: Readonly<Record<number, MarcasGatito>> = {
  7: { manchas: hex("#FFFFFF") },
  8: { puntas: hex("#7FCFC2") },
  16: { puntas: hex("#B9A0E0") },
  17: { puntas: hex("#B79BE8") },
};

export const LAZO_DORADO: Rgb = hex("#F5C542");
export type VarianteGatito = { sucio: boolean; mejorAmigo: boolean };

const claveRgb = (rgb: Rgb) => (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];

/** Tabla de cambio de color clave → color del gatito (o `null` para transparente). */
export function tablaDeColores(colores: PaletaGatito, variante: VarianteGatito, marcas: MarcasGatito = {}): Map<number, Rgb | null> {
  const tabla = new Map<number, Rgb | null>();
  for (const marca of ["puntas", "manchas"] as const) tabla.set(claveRgb(CLAVES_GATO[marca]), marcas[marca] ?? colores.pelo);
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

const bases = new Map<string, Promise<HTMLImageElement>>();
const hojas = new Map<string, Promise<string>>();

/**
 * URL de una hoja en los colores clave del gato base (la de la casa, la del vestidor…) pintada para un gatito y una
 * variante (se calcula una vez y se guarda). Si algo falla, la hoja tal cual.
 */
export function hojaPintada(src: string, mundo: number, variante: VarianteGatito): Promise<string> {
  const clave = `${src}#${mundo}-${variante.sucio}-${variante.mejorAmigo}`;
  const guardada = hojas.get(clave);
  if (guardada) return guardada;
  let base = bases.get(src);
  if (!base) {
    base = new Promise((resolver, fallar) => {
      const imagen = new Image();
      imagen.onload = () => resolver(imagen);
      imagen.onerror = fallar;
      imagen.src = src;
    });
    bases.set(src, base);
  }
  const promesa = base.then((imagen) => {
    const lienzo = document.createElement("canvas");
    lienzo.width = imagen.naturalWidth;
    lienzo.height = imagen.naturalHeight;
    const contexto = lienzo.getContext("2d", { willReadFrequently: true });
    if (!contexto) return src;
    contexto.drawImage(imagen, 0, 0);
    const datos = contexto.getImageData(0, 0, lienzo.width, lienzo.height);
    const paleta = PALETAS_GATITOS[mundo] ?? PALETAS_GATITOS[1];
    const tabla = tablaDeColores(paleta, variante, MARCAS_GATITOS[mundo]);
    // El pañuelo del atigrado se borra: en su sitio va el complemento de cada gatito (los modelos nuevos llevan solo
    // un collar fino, que se queda). Debajo del pañuelo está el pecho, así que toma el color de la barriga.
    if (src === HOJA_GATO) for (const clave of [CLAVES_GATO.collar, CLAVES_GATO.collarSombra]) tabla.set(claveRgb(clave), paleta.barriga);
    recolorear(datos.data, tabla);
    contexto.putImageData(datos, 0, 0);
    return new Promise<string>((resolver) => lienzo.toBlob((blob) => resolver(blob ? URL.createObjectURL(blob) : lienzo.toDataURL())));
  }).catch(() => src);
  hojas.set(clave, promesa);
  return promesa;
}

/** Lámina de la prueba de parecido: el atigrado sentado y las referencias de esmoquin, melena y nube, en fila. */
export const HOJA_REFERENCIAS = "./assets/sprites/gato-casa-referencias-v1.webp";

/**
 * Hoja de la casa de cada modelo que ya tiene arte (docs/art/casa-modelos-v1.md, de
 * `prototypes/tools/casa-modelo-recorte.py`). Un modelo sin hoja se dibuja con la del atigrado mientras llega la suya.
 */
export const HOJAS_MODELO: Readonly<{ atigrado: string } & Partial<Record<ModeloGatito, string>>> = {
  atigrado: HOJA_GATO,
  esmoquin: "./assets/sprites/gato-casa-esmoquin-v1.webp",
  melena: "./assets/sprites/gato-casa-melena-v1.webp",
  nube: "./assets/sprites/gato-casa-nube-v1.webp",
};

/** Modelo con que se dibuja el gatito del mundo dado: el suyo si ya tiene hoja; si no, el atigrado. */
export function modeloDibujado(mundo: number): ModeloGatito {
  const modelo = MODELO_DE_GATITO[mundo] ?? "atigrado";
  return HOJAS_MODELO[modelo] ? modelo : "atigrado";
}

/** URL de la hoja del gato de la casa, la de su modelo, pintada para un gatito y una variante. */
export const hojaDeGatito = (mundo: number, variante: VarianteGatito): Promise<string> =>
  hojaPintada(HOJAS_MODELO[modeloDibujado(mundo)] ?? HOJA_GATO, mundo, variante);
