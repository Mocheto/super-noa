"""Recorta los complementos de los gatitos de la casa (docs/art/casa-complementos-v1.md).

Entrada: una carpeta con las tres láminas tal como salen del generador (cualquier extensión):
  casa-complementos-cabeza   cinco piezas en fila: bellota, pañuelo pirata, tulipán, gorra de revisor y gorro de aviador;
  casa-complementos-cuello   diez piezas en dos filas de cinco (Miel, Bruma, Pino, Iris, Perla; Ámbar, Copito, Estrella,
                             Duna, Tempo);
  casa-complementos-espalda  dos capas en fila (Luna y Celeste).
Salida (WebP sin pérdida, a la escala del gatito grande del vestidor, con las celdas del armario):
  public/assets/sprites/casa-complementos-v1.webp        quince celdas de 200 × 170 en fila, en el orden de arriba; cada
                                                         pieza colocada según su tipo, como en el armario
  public/assets/sprites/casa-complementos-capas-v1.webp  dos celdas de 260 × 240, cada capa colgando de arriba

Los collares y bufandas salieron como un aro visto desde arriba: se abren por código como las bufandas del armario
(`abrir_aro`). Encima de las capas el generador dejó dos manchas borrosas: de esa lámina solo se toman las dos piezas
más grandes, sin pegarles nada.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-complementos-recorte.py CARPETA_ORIGEN
"""
import importlib.util
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

_spec = importlib.util.spec_from_file_location("casa_vestidor_v2", Path(__file__).with_name("casa-vestidor-v2-recorte.py"))
v2 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(v2)
casa = v2.casa

# Tipo de cada pieza, en el orden de la salida. El gorro de aviador de Chispa salió como gorro con las gafas en la
# frente, así que va en la cabeza, como un sombrero.
CABEZA = ["sombrero"] * 5
CUELLO = ["bufanda"] * 10

# Lo de cuello, en el orden de la lámina (Miel, Bruma, Pino, Iris, Perla, Ámbar, Copito, Estrella, Duna y Tempo):
# - CORTE: qué parte de arriba es la de atrás del aro o del tubo (en fracción del alto de la pieza). El generador pintó
#   el interior en lugar de dejarlo hueco, así que `abrir_aro` no lo ve; se corta en recto y se cierra con contorno,
#   como las bufandas del armario, y queda solo la banda de delante.
# - ANCHO: ancho final frente al de las bufandas del armario. Pañuelos, collares y lazos son más pequeños que una
#   bufanda gorda: a su ancho entero tapaban medio gatito.
CORTE = [0, 0, 0.12, 0, 0.30, 0, 0.23, 0.22, 0.29, 0]
ANCHO = [0.8, 0.75, 1, 0.7, 0.8, 0.85, 1, 1, 0.8, 0.65]


def cortar_arriba(img, fraccion):
    if not fraccion:
        return img
    a = np.array(img)
    a[: round(a.shape[0] * fraccion), :, 3] = 0
    for x in range(a.shape[1]):
        filas = np.nonzero(a[:, x, 3] > 0)[0]
        if len(filas):
            a[filas[0]:filas[0] + 2, x] = v2.CONTORNO
    return v2.visible(Image.fromarray(a, "RGBA"))


def colocar(hoja, img, tipo, columna):
    ancho, alto = v2.CELDA
    x = columna * ancho + (ancho - img.width) // 2
    y = {"sombrero": alto - img.height, "gafas": (alto - img.height) // 2, "bufanda": 0}[tipo]
    hoja.alpha_composite(img, (x, y))


def piezas(folder, nombre, filas, tipos, anchos):
    rgba = v2.sin_fondo(casa.load(folder, nombre))
    encontradas = [p for fila in casa.por_filas(casa.poses(rgba, sum(filas), min_area=4000), filas) for p in fila]
    resultado = []
    for i, (pieza, tipo) in enumerate(zip(encontradas, tipos)):
        img = v2.visible(casa.recorte(rgba, pieza))
        ancho = anchos[tipo]
        if tipo == "bufanda":
            img = cortar_arriba(v2.abrir_aro(img), CORTE[i])
            ancho *= ANCHO[i]
        resultado.append(casa.escalar(img, min(ancho / img.width, v2.CELDA[1] / img.height)))
    return resultado


def capas(folder):
    rgba = v2.sin_fondo(casa.load(folder, "casa-complementos-espalda"))
    etiquetas, n = ndimage.label(rgba[..., 3] > 0)
    tamanos = ndimage.sum(rgba[..., 3] > 0, etiquetas, range(1, n + 1))
    dos = sorted(np.argsort(tamanos)[-2:] + 1, key=lambda i: np.nonzero(etiquetas == i)[1].min())
    ancho, alto = v2.CELDA_CAPA
    hoja = Image.new("RGBA", (ancho * 2, alto))
    for i, etiqueta in enumerate(dos):
        sola = rgba.copy()
        sola[..., 3] = np.where(etiquetas == etiqueta, sola[..., 3], 0)
        img = v2.visible(Image.fromarray(sola, "RGBA"))
        img = casa.escalar(img, min(v2.ANCHO_CAPA / img.width, alto / img.height))
        hoja.alpha_composite(img, (i * ancho + (ancho - img.width) // 2, 0))
    v2.guardar(hoja, "casa-complementos-capas-v1.webp")


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1])
    anchos = v2.anchos_de_antes(Image.open(casa.SPRITES / "casa-accesorios-v1.webp").convert("RGBA"))
    todas = piezas(folder, "casa-complementos-cabeza", [5], CABEZA, anchos) + piezas(folder, "casa-complementos-cuello", [5, 5], CUELLO, anchos)
    hoja = Image.new("RGBA", (v2.CELDA[0] * len(todas), v2.CELDA[1]))
    for columna, (img, tipo) in enumerate(zip(todas, CABEZA + CUELLO)):
        colocar(hoja, img, tipo, columna)
    v2.guardar(hoja, "casa-complementos-v1.webp")
    capas(folder)


if __name__ == "__main__":
    main()
