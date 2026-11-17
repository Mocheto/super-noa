"""Recorta, alinea y exporta el arte final de «La merienda de los jabatos».

Entrada: las láminas tal como salen del generador (fondo magenta plano, a menudo JPEG), en una carpeta con
estos nombres: noa-guarda-v1, jabato-pequeno-v1, jabato-grande-v1, merienda-objetos-v1 y merienda-escenario-v1
(con cualquier extensión de imagen).
Salida: WebP con transparencia real en public/assets/sprites/. Imprime las medidas de cada pieza (en píxeles
del archivo; el juego las muestra a la mitad, 2 × para pantallas nítidas).

Pasos: quita el magenta conectado con el borde y el magenta puro encerrado, erosiona un píxel de borde para
eliminar el halo rosado, separa las piezas por componentes conexas, alinea las poses por la base y reescala
con alfa premultiplicado. Reutiliza las funciones de gatitos-recorte.py.

Uso: python3 prototypes/tools/merienda-recorte.py CARPETA_ORIGEN   (requiere Pillow, numpy y scipy)
"""
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location("gatitos_recorte", HERE / "gatitos-recorte.py")
base = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(base)

ROOT, SPRITES = base.ROOT, base.SPRITES
load, crop, scaled, strip, save, components = base.load, base.crop, base.scaled, base.strip, base.save, base.components


def key_out(img):
    """RGBA sin el magenta del fondo. «Magentez» = min(R, B) − G: el fondo ronda 255, el contorno ciruela
    mezclado con el fondo unos 100 y el rosa de los hocicos casi 0, así que los hocicos se conservan."""
    rgb = np.array(img).astype(int)
    magenta = np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1]
    soft = magenta > 70
    labels, _ = ndimage.label(soft)
    edge = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    background = np.isin(labels, list(edge)) | (magenta > 170)
    alpha = ndimage.binary_erosion(~background, structure=ndimage.generate_binary_structure(2, 1))
    alpha = ndimage.binary_opening(alpha, iterations=1)  # fuera el polvo suelto de la compresión JPEG
    return np.dstack([rgb.astype(np.uint8), (alpha * 255).astype(np.uint8)])


def group(rgba, expected, min_area, small_to=None, min_small=40):
    """Como base.group, pero las piezas pequeñas (destellos, migas, bellotas al vuelo) pueden ir todas a una
    pieza concreta (`small_to`), y las motas de menos de `min_small` píxeles se descartan."""
    labels, big, small = components(rgba, min_area)
    big = sorted(sorted(big, key=lambda it: -it["area"])[:expected], key=lambda it: it["box"][0])
    if len(big) != expected:
        raise SystemExit(f"Se esperaban {expected} piezas y hay {len(big)}")
    members = [[it["id"]] for it in big]

    def gap(item, piece):
        x0, y0, x1, y1 = item["box"]
        bx0, by0, bx1, by1 = piece["box"]
        return np.hypot(max(bx0 - x1, x0 - bx1, 0), max(by0 - y1, y0 - by1, 0))

    for item in small:
        if item["area"] < min_small:
            continue
        target = small_to if small_to is not None else min(range(len(big)), key=lambda k: gap(item, big[k]))
        members[target].append(item["id"])
    out = []
    for ids in members:
        mask = np.isin(labels, ids)
        ys, xs = np.nonzero(mask)
        out.append({"mask": mask, "box": (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)})
    return out


def single(rgba, piece, width=None, height=None):
    c = crop(rgba, piece)
    factor = 2 * width / c.width if width else 2 * height / c.height
    return scaled(c, factor)


def main(folder):
    folder = Path(folder)
    metrics = {}

    # --- Noa guarda del bosque: 4 poses mirando a la derecha; los destellos y bellotas al vuelo son de la última
    rgba = key_out(load(folder, "noa-guarda-v1"))
    pieces = group(rgba, 4, 20000, small_to=3)
    ready_h = pieces[0]["box"][3] - pieces[0]["box"][1]
    sheet, info = strip(rgba, pieces, 2 * 257 / ready_h)  # la pose de espera mide 257 píxeles en pantalla
    save(sheet, SPRITES / "noa-guarda-v1.webp")
    metrics["noa-guarda"] = info

    # --- Jabatos: 5 poses (cerrada, entreabierta, abierta, masticando, triste); se alinean por la base cortada
    for name, height in (("jabato-pequeno-v1", 120), ("jabato-grande-v1", 160)):
        rgba = key_out(load(folder, name))
        pieces = group(rgba, 5, 8000)
        tallest = max(p["box"][3] - p["box"][1] for p in pieces)
        sheet, info = strip(rgba, pieces, 2 * height / tallest)
        save(sheet, SPRITES / f"{name}.webp")
        metrics[name] = info

    # --- Comida y cesta: bellota, castaña, cesta y bellota con brillo, cada una en su archivo
    rgba = key_out(load(folder, "merienda-objetos-v1"))
    pieces = group(rgba, 4, 20000)
    for piece, (name, kwargs) in zip(pieces, (("bellota-v1", {"height": 40}), ("castana-v1", {"height": 40}),
                                              ("cesta-v1", {"width": 96}), ("bellota-brillo-v1", None))):
        if kwargs is None:  # la de brillo, a la misma escala que la bellota normal
            c = crop(rgba, piece)
            acorn = pieces[0]["box"][3] - pieces[0]["box"][1]
            sprite = scaled(c, 2 * 40 / acorn)
        else:
            sprite = single(rgba, piece, **kwargs)
        save(sprite, SPRITES / f"{name}.webp")
        metrics[name] = {"size": [sprite.width, sprite.height]}

    # --- Escenario: arbusto, roca, rama vacía y rama llena
    rgba = key_out(load(folder, "merienda-escenario-v1"))
    pieces = group(rgba, 4, 4000)
    for piece, (name, width) in zip(pieces, (("arbusto-merienda-v1", 210), ("roca-merienda-v1", 175),
                                             ("rama-bellotas-vacia-v1", 230), ("rama-bellotas-llena-v1", 230))):
        sprite = single(rgba, piece, width=width)
        save(sprite, SPRITES / f"{name}.webp")
        metrics[name] = {"size": [sprite.width, sprite.height]}

    print(json.dumps(metrics, indent=1))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
