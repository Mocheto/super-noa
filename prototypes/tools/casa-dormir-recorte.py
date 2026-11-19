"""Recorta y exporta la mantita de la hora de dormir (docs/art/casa-dormir-v1.md).

Entrada: una carpeta con las láminas tal como salen del generador (cualquier extensión): casa-mantita y gato-arropado.
Salida:
  public/assets/sprites/casa-mantita-v1.webp       dos celdas en fila (doblada y extendida) a la misma escala, con el
                                                   violeta clave que el juego cambia por el color del collar
  public/assets/sprites/gato-casa-arropado-v1.webp dos cuadros de 160 × 160 del gatito arropado (respira), con los pies
                                                   en la fila 152 como la hoja del gato base; el gatito en sus colores
                                                   clave y la mantita en el violeta clave

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-dormir-recorte.py CARPETA_ORIGEN
"""
import importlib.util
import colorsys
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

_spec = importlib.util.spec_from_file_location("casa_recorte", Path(__file__).with_name("casa-recorte.py"))
casa = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(casa)

ANCHO_EXTENDIDA = 128  # la mantita extendida mide esto de ancho; la doblada, a la misma escala


ANCHO_ARROPADO = 144  # el gatito tumbado mide esto de ancho en su cuadro de 160


def es_violeta(rgb):
    h, s, v = colorsys.rgb_to_hsv(*(c / 255 for c in rgb))
    return 255 <= h * 360 <= 315 and s >= 0.25 and v >= 0.4


def arropado(folder):
    """La pose «arropado»: dos cuadros alineados por abajo, el gatito ajustado a sus colores clave y la mantita sin tocar."""
    rgba = casa.key_out(casa.load(folder, "gato-arropado"))
    cuadros = sorted(casa.poses(rgba, 2, min_area=20000), key=lambda p: p["cuerpo"][0])
    piezas = [casa.recorte(rgba, p) for p in cuadros]
    factor = ANCHO_ARROPADO / max(p.width for p in piezas)
    hoja = Image.new("RGBA", (casa.CELDA * 2, casa.CELDA))
    for i, pieza in enumerate(piezas):
        pieza = casa.escalar(pieza, factor)
        # Los colores del gatito, a sus claves; el violeta de la mantita y su ribete blanco se quedan como están.
        a = np.array(pieza)
        violeta = np.zeros(a.shape[:2], bool)
        for y, x in zip(*np.nonzero(a[..., 3])):
            violeta[y, x] = es_violeta(a[y, x, :3])
        # Solo cuenta como mantita el violeta en manchas grandes: las motas sueltas del borde son del contorno.
        etiquetas, _ = casa.ndimage.label(violeta)
        tamanos = casa.ndimage.sum(violeta, etiquetas, range(1, etiquetas.max() + 1))
        violeta = np.isin(etiquetas, [i + 1 for i, t in enumerate(tamanos) if t >= 30])
        claves = np.array(casa.a_claves(pieza))
        # Las motas sueltas, al contorno.
        sueltas = np.array([[es_violeta(a[y, x, :3]) for x in range(a.shape[1])] for y in range(a.shape[0])]) & ~violeta & (a[..., 3] > 0)
        claves[sueltas] = [0x2F, 0x1D, 0x33, 255]
        claves[violeta] = np.dstack([a[..., :3], np.full(a.shape[:2], 255, np.uint8)])[violeta]
        pieza = Image.fromarray(claves, "RGBA")
        hoja.alpha_composite(pieza, (i * casa.CELDA + (casa.CELDA - pieza.width) // 2, casa.PIES - pieza.height))
    hoja.save(casa.SPRITES / "gato-casa-arropado-v1.webp", "WEBP", lossless=True)
    return {"factor": factor, "cuadros": [p.size for p in piezas]}


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    if any(Path(sys.argv[1]).glob("gato-arropado.*")):
        print(json.dumps({"arropado": arropado(Path(sys.argv[1]))}))
    if not any(Path(sys.argv[1]).glob("casa-mantita.*")):
        return
    rgba = casa.key_out(casa.load(Path(sys.argv[1]), "casa-mantita"))
    doblada, extendida = sorted(casa.poses(rgba, 2, min_area=20000), key=lambda p: p["cuerpo"][0])
    piezas = [casa.recorte(rgba, doblada), casa.recorte(rgba, extendida)]
    factor = ANCHO_EXTENDIDA / piezas[1].width
    piezas = [casa.escalar(p, factor) for p in piezas]
    celda = (max(p.width for p in piezas), max(p.height for p in piezas))
    hoja = Image.new("RGBA", (celda[0] * 2, celda[1]))
    for i, pieza in enumerate(piezas):
        # Apoyadas abajo y centradas en su celda.
        hoja.alpha_composite(pieza, (i * celda[0] + (celda[0] - pieza.width) // 2, celda[1] - pieza.height))
    hoja.save(casa.SPRITES / "casa-mantita-v1.webp", "WEBP", quality=casa.QUALITY, method=6)
    print(json.dumps({"celda": celda, "doblada": piezas[0].size, "extendida": piezas[1].size}))


if __name__ == "__main__":
    main()
