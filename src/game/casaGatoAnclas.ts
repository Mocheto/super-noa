/**
 * Anclas de los accesorios en cada cuadro de la hoja de cada modelo de gatito (mapa «Ropa y accesorios para los
 * gatitos»), en px dentro del cuadro de 160 × 160: la cabeza (el lazo, donde se apoya el sombrero), los ojos (las
 * gafas) y el cuello (el pañuelo o el collar, la bufanda). Solo los modelos que ya tienen hoja.
 * `null` cuando no se ve: ese accesorio no se pinta en ese cuadro.
 *
 * GENERADO por `prototypes/tools/casa-gato-anclas.py`: no editar a mano.
 */
import type { AnimacionGato, ModeloGatito } from "./casaGatoArte.ts";

export type Punto = { x: number; y: number };
export type Anclas = { cabeza: Punto | null; ojos: Punto | null; cuello: Punto | null };
export type TablaAnclas = Readonly<Record<AnimacionGato, readonly Anclas[]>>;

export const ANCLAS_POR_MODELO: Readonly<{ atigrado: TablaAnclas } & Partial<Record<ModeloGatito, TablaAnclas>>> = {
  atigrado: {
    andar: [
      {cabeza: {x: 119, y: 40}, ojos: {x: 129, y: 74}, cuello: {x: 106, y: 98}},
      {cabeza: {x: 116, y: 42}, ojos: {x: 125, y: 79}, cuello: {x: 103, y: 100}},
      {cabeza: {x: 112, y: 40}, ojos: {x: 116, y: 75}, cuello: {x: 98, y: 98}},
      {cabeza: {x: 121, y: 40}, ojos: {x: 124, y: 74}, cuello: {x: 105, y: 97}},
    ],
    sentado: [
      {cabeza: {x: 117, y: 25}, ojos: {x: 126, y: 63}, cuello: {x: 115, y: 89}},
      {cabeza: {x: 117, y: 25}, ojos: {x: 128, y: 63}, cuello: {x: 115, y: 89}},
    ],
    cola: [
      {cabeza: {x: 94, y: 36}, ojos: {x: 106, y: 73}, cuello: {x: 93, y: 98}},
    ],
    dormir: [
      {cabeza: {x: 55, y: 83}, ojos: null, cuello: null},
      {cabeza: {x: 56, y: 82}, ojos: null, cuello: null},
    ],
    jugarSolo: [
      {cabeza: {x: 55, y: 44}, ojos: null, cuello: {x: 56, y: 98}},
      {cabeza: {x: 95, y: 34}, ojos: {x: 114, y: 66}, cuello: {x: 107, y: 87}},
      {cabeza: {x: 102, y: 40}, ojos: {x: 110, y: 75}, cuello: {x: 89, y: 96}},
    ],
    cantar: [
      {cabeza: {x: 102, y: 25}, ojos: {x: 114, y: 64}, cuello: {x: 101, y: 90}},
      {cabeza: {x: 95, y: 24}, ojos: {x: 110, y: 63}, cuello: {x: 101, y: 90}},
    ],
    pedir: [
      {cabeza: {x: 93, y: 30}, ojos: {x: 97, y: 67}, cuello: {x: 91, y: 95}},
      {cabeza: {x: 96, y: 30}, ojos: {x: 104, y: 68}, cuello: {x: 95, y: 95}},
    ],
    comer: [
      {cabeza: {x: 112, y: 68}, ojos: {x: 108, y: 103}, cuello: {x: 83, y: 126}},
      {cabeza: {x: 109, y: 71}, ojos: {x: 110, y: 108}, cuello: {x: 88, y: 132}},
      {cabeza: {x: 120, y: 52}, ojos: {x: 126, y: 94}, cuello: {x: 109, y: 122}},
    ],
    ronronear: [
      {cabeza: {x: 110, y: 25}, ojos: {x: 121, y: 63}, cuello: {x: 108, y: 89}},
      {cabeza: {x: 89, y: 24}, ojos: {x: 103, y: 62}, cuello: {x: 93, y: 88}},
    ],
    bano: [
      {cabeza: null, ojos: null, cuello: {x: 100, y: 96}},
      {cabeza: null, ojos: null, cuello: {x: 90, y: 94}},
    ],
    sacudirse: [
      {cabeza: {x: 117, y: 66}, ojos: {x: 116, y: 104}, cuello: {x: 93, y: 129}},
      {cabeza: {x: 101, y: 75}, ojos: {x: 105, y: 110}, cuello: {x: 86, y: 134}},
      {cabeza: {x: 120, y: 51}, ojos: {x: 128, y: 93}, cuello: {x: 109, y: 122}},
    ],
    pelota: [
      {cabeza: {x: 128, y: 64}, ojos: {x: 136, y: 97}, cuello: {x: 121, y: 120}},
      {cabeza: {x: 115, y: 72}, ojos: {x: 119, y: 104}, cuello: {x: 100, y: 124}},
      {cabeza: {x: 117, y: 29}, ojos: {x: 127, y: 61}, cuello: {x: 87, y: 75}},
      {cabeza: {x: 115, y: 38}, ojos: {x: 124, y: 72}, cuello: {x: 110, y: 94}},
    ],
    ahoraNo: [
      {cabeza: {x: 103, y: 26}, ojos: {x: 122, y: 64}, cuello: {x: 115, y: 90}},
      {cabeza: {x: 93, y: 27}, ojos: {x: 111, y: 65}, cuello: {x: 103, y: 91}},
    ],
  },
  melena: {
    andar: [
      {cabeza: {x: 127, y: 48}, ojos: {x: 132, y: 78}, cuello: {x: 123, y: 98}},
      {cabeza: {x: 115, y: 40}, ojos: {x: 121, y: 73}, cuello: {x: 118, y: 95}},
      {cabeza: {x: 119, y: 40}, ojos: {x: 128, y: 73}, cuello: {x: 123, y: 96}},
      {cabeza: {x: 121, y: 56}, ojos: {x: 128, y: 89}, cuello: {x: 121, y: 112}},
    ],
    sentado: [
      {cabeza: {x: 113, y: 25}, ojos: {x: 121, y: 57}, cuello: {x: 115, y: 83}},
      {cabeza: {x: 117, y: 25}, ojos: {x: 121, y: 58}, cuello: {x: 112, y: 82}},
    ],
    cola: [
      {cabeza: {x: 112, y: 33}, ojos: {x: 118, y: 64}, cuello: {x: 111, y: 86}},
    ],
    dormir: [
      {cabeza: {x: 116, y: 86}, ojos: null, cuello: null},
      {cabeza: {x: 128, y: 79}, ojos: null, cuello: null},
    ],
    jugarSolo: [
      {cabeza: {x: 107, y: 33}, ojos: {x: 124, y: 59}, cuello: {x: 125, y: 77}},
      {cabeza: {x: 118, y: 48}, ojos: {x: 125, y: 81}, cuello: {x: 118, y: 104}},
      {cabeza: {x: 102, y: 40}, ojos: {x: 109, y: 71}, cuello: {x: 102, y: 93}},
    ],
    cantar: [
      {cabeza: {x: 115, y: 24}, ojos: {x: 121, y: 57}, cuello: {x: 114, y: 81}},
      {cabeza: {x: 115, y: 24}, ojos: {x: 123, y: 58}, cuello: {x: 117, y: 82}},
    ],
    pedir: [
      {cabeza: {x: 111, y: 30}, ojos: {x: 117, y: 63}, cuello: {x: 107, y: 87}},
      {cabeza: {x: 116, y: 30}, ojos: {x: 122, y: 63}, cuello: {x: 119, y: 88}},
    ],
    comer: [
      {cabeza: {x: 118, y: 85}, ojos: null, cuello: null},
      {cabeza: {x: 119, y: 83}, ojos: null, cuello: null},
      {cabeza: {x: 120, y: 59}, ojos: {x: 129, y: 95}, cuello: {x: 124, y: 121}},
    ],
    ronronear: [
      {cabeza: {x: 112, y: 25}, ojos: {x: 121, y: 59}, cuello: {x: 116, y: 83}},
      {cabeza: {x: 96, y: 24}, ojos: {x: 102, y: 57}, cuello: {x: 95, y: 81}},
    ],
    bano: [
      {cabeza: {x: 111, y: 24}, ojos: {x: 118, y: 57}, cuello: {x: 111, y: 81}},
      {cabeza: {x: 114, y: 24}, ojos: {x: 121, y: 57}, cuello: {x: 114, y: 81}},
    ],
    sacudirse: [
      {cabeza: {x: 119, y: 40}, ojos: {x: 126, y: 73}, cuello: {x: 119, y: 96}},
      {cabeza: {x: 114, y: 41}, ojos: {x: 123, y: 68}, cuello: {x: 114, y: 92}},
      {cabeza: {x: 107, y: 34}, ojos: {x: 114, y: 67}, cuello: {x: 107, y: 91}},
    ],
    pelota: [
      {cabeza: null, ojos: null, cuello: null},
      {cabeza: {x: 106, y: 89}, ojos: {x: 109, y: 118}, cuello: {x: 93, y: 138}},
      {cabeza: {x: 122, y: 48}, ojos: {x: 129, y: 81}, cuello: {x: 122, y: 105}},
      {cabeza: {x: 118, y: 31}, ojos: {x: 123, y: 64}, cuello: {x: 118, y: 85}},
    ],
    ahoraNo: [
      {cabeza: {x: 115, y: 25}, ojos: {x: 120, y: 58}, cuello: {x: 111, y: 81}},
      {cabeza: {x: 108, y: 24}, ojos: {x: 121, y: 58}, cuello: {x: 119, y: 82}},
    ],
  },
};

/** Las del atigrado, el gato base. */
export const ANCLAS_GATO = ANCLAS_POR_MODELO.atigrado;
