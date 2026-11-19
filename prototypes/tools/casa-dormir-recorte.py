"""Recorta y exporta la mantita de la hora de dormir (docs/art/casa-dormir-v1.md).

Entrada: una carpeta con la lámina tal como sale del generador: casa-mantita (cualquier extensión).
Salida: public/assets/sprites/casa-mantita-v1.webp, dos celdas en fila (doblada y extendida) a la misma escala, con el
violeta clave que el juego cambia por el color del collar de cada gatito.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-dormir-recorte.py CARPETA_ORIGEN
"""
import importlib.util
import json
import sys
from pathlib import Path

from PIL import Image

_spec = importlib.util.spec_from_file_location("casa_recorte", Path(__file__).with_name("casa-recorte.py"))
casa = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(casa)

ANCHO_EXTENDIDA = 128  # la mantita extendida mide esto de ancho; la doblada, a la misma escala


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
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
