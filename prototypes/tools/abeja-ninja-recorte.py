"""Recorta, alinea y exporta el arte final de «La abeja ninja».

Entrada: las láminas tal como salen del generador (fondo verde plano, a menudo JPEG), en una carpeta con estos
nombres: noa-abeja-v1, flores-abeja-v1, mariquita-v1 y tarro-miel-v1 (con cualquier extensión de imagen).
Salida: WebP con transparencia real en public/assets/sprites/. Imprime las medidas que necesita
src/game/beeNinja.ts (en píxeles del archivo; el juego los muestra a la mitad, 2 × para pantallas nítidas).

- noa-abeja-v1: tira de 4 celdas (espera, alza, corta, celebra) mirando a la derecha, alineadas por los pies.
  Calcula la punta del aguijón en la pose «corta»: el punto de corte del juego.
- flores-abeja-v1: rejilla de 4 × 4 celdas de 128 × 128. Columnas: rosa, amarillo, azul, lila. Filas: flor
  entera, mitad izquierda, mitad derecha y pétalo. Las mitades se colocan para que, juntas, formen la flor
  (el corte cae en el centro de la celda).
- mariquita-v1: tira de 2 celdas (volando, saludando) mirando a la derecha.
- tarro-miel-v1: tira de 5 niveles. Si la lámina trae dos filas, se usa la de abajo (la completa).

Uso: python3 prototypes/tools/abeja-ninja-recorte.py CARPETA_ORIGEN   (requiere Pillow, numpy y scipy)
"""
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location("gatitos_recorte", HERE / "gatitos-recorte.py")
base = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(base)

SPRITES = base.SPRITES
load, key_out, group, crop, scaled, strip, save, hsv_of = base.load, base.key_out, base.group, base.crop, base.scaled, base.strip, base.save, base.hsv_of

CELL = 128  # celda de flores: 64 × 64 en pantalla


def place(sheet, img, col, row, anchor="center", dy=0):
    x0, y0 = col * CELL, row * CELL
    if anchor == "right":   # mitad izquierda: el corte pegado al centro de la celda
        x = x0 + CELL // 2 - img.width
    elif anchor == "left":  # mitad derecha
        x = x0 + CELL // 2
    else:
        x = x0 + (CELL - img.width) // 2
    y = y0 + (CELL - img.height) // 2 + dy
    sheet.alpha_composite(img, (x, max(y0, y)))


def main(folder):
    folder = Path(folder)
    metrics = {}

    # --- Noa-abeja: 4 poses, mira a la derecha; destellos y estela van con su pose más cercana
    rgba = key_out(load(folder, "noa-abeja-v1"))
    pieces = group(rgba, 4, min_area=20000)
    ready_h = pieces[0]["box"][3] - pieces[0]["box"][1]
    factor = 2 * 160 / ready_h  # la pose de espera mide 160 píxeles en pantalla
    sheet, info = strip(rgba, pieces, factor)
    # Punta del aguijón en «corta»: el píxel dorado más a la derecha del cono (sin la estela blanca ni destellos).
    cut = pieces[2]
    hue, sat, val = hsv_of(rgba)
    gold = cut["mask"] & (hue >= 35) & (hue <= 60) & (sat >= 0.45) & (val >= 0.55)
    ys, xs = np.nonzero(gold)
    tip_x = xs.max()
    tip_y = float(np.median(ys[xs >= tip_x - 3]))
    top = min(p["box"][1] for p in pieces)
    left = base.feet(cut, rgba) - cut["box"][0]
    cell_left = info["feet_x"] / factor - left  # borde izquierdo de la celda, en píxeles de la lámina
    info["tip"] = [round((tip_x - cut["box"][0] + cell_left) * factor, 1), round((tip_y - top) * factor, 1)]
    save(sheet, SPRITES / "noa-abeja-v1.webp")
    metrics["noa-abeja"] = info

    # --- Flores: fila de enteras, fila de mitades (8 piezas) y fila de pétalos
    rgba = key_out(load(folder, "flores-abeja-v1"))
    pieces = group(rgba, 16, min_area=3000)
    ordered = sorted(pieces, key=lambda p: (p["box"][1] + p["box"][3]) / 2)
    whole = sorted(ordered[:4], key=lambda p: p["box"][0])
    halves = sorted(ordered[4:12], key=lambda p: p["box"][0])
    petals = sorted(ordered[12:], key=lambda p: p["box"][0])
    sheet = Image.new("RGBA", (CELL * 4, CELL * 4), (0, 0, 0, 0))
    for col in range(4):
        flower = crop(rgba, whole[col])
        factor = (CELL - 8) / max(flower.width, flower.height)
        small = scaled(flower, factor)
        place(sheet, small, col, 0)
        # La cabeza de la flor entera (sin el tallo) es casi cuadrada: su centro marca la altura de las mitades.
        head_dy = (small.width - small.height) // 2
        for row, piece, anchor in ((1, halves[col * 2], "right"), (2, halves[col * 2 + 1], "left")):
            place(sheet, scaled(crop(rgba, piece), factor), col, row, anchor, head_dy)
        petal = crop(rgba, petals[col])
        place(sheet, scaled(petal, (CELL * 0.5) / max(petal.width, petal.height)), col, 3)
    save(sheet, SPRITES / "flores-abeja-v1.webp")
    metrics["flores"] = {"cell": [CELL, CELL], "grid": [4, 4]}

    # --- Mariquita: 2 poses mirando a la derecha
    rgba = key_out(load(folder, "mariquita-v1"))
    pieces = group(rgba, 2, min_area=20000)
    sheet, info = strip(rgba, pieces, 2 * 72 / (pieces[0]["box"][2] - pieces[0]["box"][0]))  # 72 píxeles de ancho en pantalla
    save(sheet, SPRITES / "mariquita-v1.webp")
    metrics["mariquita"] = info

    # --- Tarro: 5 niveles; la fila de abajo, que es la completa
    rgba = key_out(load(folder, "tarro-miel-v1"))
    pieces = group(rgba, 10, min_area=20000) if len(base.components(rgba, 20000)[1]) >= 10 else group(rgba, 5, min_area=20000)
    if len(pieces) == 10:
        pieces = sorted(sorted(pieces, key=lambda p: p["box"][1])[5:], key=lambda p: p["box"][0])
    sheet, info = strip(rgba, pieces, 2 * 120 / max(p["box"][3] - p["box"][1] for p in pieces))
    save(sheet, SPRITES / "tarro-miel-v1.webp")
    metrics["tarro"] = info

    print(json.dumps(metrics, indent=1))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
