"""Recorta, alinea y exporta el arte final de «La fiesta de los gatitos».

Entrada: las láminas tal como salen del generador (fondo verde plano, a veces JPEG con extensión .png),
en una carpeta con estos nombres: noa-lenadora-v1, gatito-gris-empuja-v1, gatito-naranja-empuja-v1,
troncos-v1, cinta-v1, tajo-v1, lena-v1, hoguera-v1 y claro-fiesta-v1 (con cualquier extensión de imagen).
Salida: WebP con transparencia real en public/assets/sprites/ y el fondo en public/assets/worlds/.
Imprime las medidas de cada pieza (en píxeles del archivo; el juego las muestra a la mitad, 2 × para
pantallas nítidas) para copiarlas a src/game/catPartyArt.ts.

Pasos: quita el verde conectado con el borde (así se conservan hojas y musgo del interior), erosiona
un píxel de borde para eliminar el halo, separa las poses por componentes conexas, las alinea por los pies
y reescala con alfa premultiplicado. El fondo se corrige además de una banda oscura que traía el original.

Uso: python3 prototypes/tools/gatitos-recorte.py CARPETA_ORIGEN   (requiere Pillow, numpy y scipy)
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
SPRITES = ROOT / "public/assets/sprites"
WORLDS = ROOT / "public/assets/worlds"
QUALITY = 90


def load(folder, stem):
    for path in sorted(folder.glob(f"{stem}.*")):
        if path.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"):
            return Image.open(path).convert("RGB")
    raise SystemExit(f"Falta {stem} en {folder}")


def key_out(img, hue_min=43):
    """RGBA sin el verde del fondo: se quita el verde conectado con el borde de la lámina y, en cualquier
    sitio, el verde puro del fondo que haya quedado encerrado (entre las piernas, por ejemplo)."""
    hsv = np.array(img.convert("HSV")).astype(int)
    hue, sat, val = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    green = (hue >= hue_min) & (hue <= 170) & (sat > 0.40) & (val > 0.2)  # incluye el polvo amarillento que a veces deja el generador
    labels, _ = ndimage.label(green)
    edge = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    background = np.isin(labels, list(edge))
    pure = (hue >= 90) & (hue <= 140) & (sat > 0.75) & (val > 0.8)  # el verde del fondo es mucho más vivo que el de las hojas
    alpha = ~(background | pure)
    alpha = ndimage.binary_erosion(alpha, structure=ndimage.generate_binary_structure(2, 1))  # un píxel menos: fuera el halo verdoso
    out = np.dstack([np.array(img), (alpha * 255).astype(np.uint8)])
    return out


def components(rgba, min_area=2500):
    """Componentes conexas del alfa: (grandes, pequeñas) con su caja (x0, y0, x1, y1) y su máscara."""
    mask = rgba[..., 3] > 0
    labels, count = ndimage.label(mask)
    boxes = ndimage.find_objects(labels)
    big, small = [], []
    for index, box in enumerate(boxes, start=1):
        area = int((labels[box] == index).sum())
        item = {"id": index, "box": (box[1].start, box[0].start, box[1].stop, box[0].stop), "area": area}
        (big if area >= min_area else small).append(item)
    return labels, big, small


def group(rgba, expected, min_area=2500):
    """Separa `expected` piezas y les pega las componentes pequeñas (destellos, notas) más cercanas."""
    labels, big, small = components(rgba, min_area)
    big = sorted(sorted(big, key=lambda it: -it["area"])[:expected], key=lambda it: it["box"][0])
    if len(big) != expected:
        raise SystemExit(f"Se esperaban {expected} piezas y hay {len(big)}")
    members = [[it["id"]] for it in big]
    for item in small:
        cx, cy = (item["box"][0] + item["box"][2]) / 2, (item["box"][1] + item["box"][3]) / 2
        nearest = min(range(len(big)), key=lambda k: np.hypot(cx - (big[k]["box"][0] + big[k]["box"][2]) / 2, cy - (big[k]["box"][1] + big[k]["box"][3]) / 2))
        members[nearest].append(item["id"])
    out = []
    for ids in members:
        mask = np.isin(labels, ids)
        ys, xs = np.nonzero(mask)
        out.append({"mask": mask, "box": (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)})
    return out


def hsv_of(rgba):
    hsv = np.array(Image.fromarray(rgba[..., :3]).convert("HSV")).astype(int)
    return hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255


def drop(rgba, piece, remove):
    """Quita de una pieza los píxeles de `remove` (máscara) y recalcula su caja."""
    piece["mask"] = piece["mask"] & ~remove
    ys, xs = np.nonzero(piece["mask"])
    piece["box"] = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)


def crop(rgba, piece):
    x0, y0, x1, y1 = piece["box"]
    sub = rgba[y0:y1, x0:x1].copy()
    sub[..., 3] = np.where(piece["mask"][y0:y1, x0:x1], sub[..., 3], 0)
    return Image.fromarray(sub, "RGBA")


def scaled(img, factor):
    size = (max(1, round(img.width * factor)), max(1, round(img.height * factor)))
    return img.convert("RGBa").resize(size, Image.LANCZOS).convert("RGBA")


def feet(piece, rgba):
    """x medio de los píxeles de la franja inferior de la pieza: el apoyo de los pies."""
    x0, y0, x1, y1 = piece["box"]
    band = piece["mask"][max(y0, y1 - max(8, (y1 - y0) // 8)):y1, x0:x1]
    xs = np.nonzero(band)[1]
    return x0 + float(xs.mean())


def strip(rgba, pieces, factor, flip=False, keep_height=True):
    """Tira horizontal de celdas iguales con los pies alineados. Devuelve (imagen, medidas)."""
    crops = [crop(rgba, p) for p in pieces]
    if flip:
        crops = [c.transpose(Image.FLIP_LEFT_RIGHT) for c in crops]
    top = min(p["box"][1] for p in pieces)
    bottom = max(p["box"][3] for p in pieces)
    anchors, lefts, rights = [], [], []
    for p, c in zip(pieces, crops):
        fx = feet(p, rgba) - p["box"][0]
        if flip:
            fx = c.width - fx
        anchors.append(fx)
        lefts.append(fx)
        rights.append(c.width - fx)
    left, right = max(lefts), max(rights)
    cell_w, cell_h = round((left + right) * factor), round((bottom - top) * factor)
    sheet = Image.new("RGBA", (cell_w * len(crops), cell_h), (0, 0, 0, 0))
    for index, (p, c, fx) in enumerate(zip(pieces, crops, anchors)):
        small = scaled(c, factor)
        x = index * cell_w + round((left - fx) * factor)
        y = round((p["box"][1] - top) * factor)
        sheet.alpha_composite(small, (x, y))
    return sheet, {"cell": [cell_w, cell_h], "feet_x": round(left * factor), "count": len(crops)}


def save(img, path, lossless=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=QUALITY, method=6, alpha_quality=100, lossless=lossless)
    print(f"  {path.relative_to(ROOT)}  {img.width}x{img.height}  {path.stat().st_size // 1024} KB")


def trim(rgba):
    ys, xs = np.nonzero(rgba[..., 3] > 0)
    return rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def main(folder):
    folder = Path(folder)
    metrics = {}

    # --- Noa leñadora: 4 poses, mira a la derecha (hacia el tajo)
    rgba = key_out(load(folder, "noa-lenadora-v1"))
    pieces = group(rgba, 4)
    ready_h = pieces[0]["box"][3] - pieces[0]["box"][1]
    sheet, info = strip(rgba, pieces, 2 * 170 / ready_h)  # la pose de espera mide 170 píxeles en pantalla
    save(sheet, SPRITES / "noa-lenadora-v1.webp")
    metrics["noa"] = info

    # --- Gatitos: 3 poses cada uno; el gris sale mirando a la derecha y se refleja para mirar a la izquierda
    for name, flip in (("gatito-gris-empuja-v1", True), ("gatito-naranja-empuja-v1", False)):
        rgba = key_out(load(folder, name))
        pieces = group(rgba, 3)
        sheet, info = strip(rgba, pieces, 2 * 104 / (pieces[0]["box"][3] - pieces[0]["box"][1]), flip=flip)
        save(sheet, SPRITES / f"{name}.webp")
        metrics[name] = info

    # --- Troncos: fila de arriba, pequeño (entero, mitad izquierda, mitad derecha); fila de abajo, mediano
    #     (entero, con grieta, mitad izquierda, mitad derecha). El corte de las filas es por la mitad de la lámina.
    #     Cada archivo es una tira de celdas iguales: entero y con grieta pegados a la izquierda; las mitades,
    #     a escala 0,6, la izquierda pegada al borde derecho de su celda y la derecha al borde izquierdo, para que
    #     se junten en el punto de corte.
    rgba = key_out(load(folder, "troncos-v1"), hue_min=36)
    half = rgba.shape[0] // 2
    for row, (name, count, width) in enumerate((("tronco-pequeno-v1", 3, 118), ("tronco-mediano-v1", 4, 200))):
        part = rgba[:half] if row == 0 else rgba[half:]
        pieces = group(part, count, min_area=4000)
        if row == 1:  # el generador dejó una mancha de polvo amarillento entre el tronco entero y el de la grieta
            hue, sat, val = hsv_of(part)
            dust = (hue >= 41) & (hue <= 75) & (sat >= 0.5) & (val >= 0.45)
            dust_right = (hue >= 33) & (hue <= 75) & (sat >= 0.45) & (val >= 0.45)  # a la derecha del entero no hay madera clara
            columns = np.arange(part.shape[1])[None, :]
            for index, side in ((0, "right"), (1, "left")):
                x0, _, x1, _ = pieces[index]["box"]
                zone = (columns >= x1 - 70) if side == "right" else (columns <= x0 + 70)
                drop(part, pieces[index], (dust_right if side == "right" else dust) & zone)
        crops = [crop(part, p) for p in pieces]
        factor = 2 * width / crops[0].width
        cell_w = round(crops[0].width * factor)
        sprites = []
        for index, c in enumerate(crops):
            f = factor * (crops[0].width / c.width if index < count - 2 else 0.6)  # la grieta se ajusta al ancho del entero
            sprites.append(scaled(c, f))
        cell_h = max(sp.height for sp in sprites)
        sheet = Image.new("RGBA", (cell_w * count, cell_h), (0, 0, 0, 0))
        for index, sp in enumerate(sprites):
            x = index * cell_w
            if index == count - 2:
                x += cell_w - sp.width      # mitad izquierda: pegada a la derecha de su celda
            sheet.alpha_composite(sp, (x, cell_h - sp.height))
        save(sheet, SPRITES / f"{name}.webp")
        metrics[name] = {"cell": [cell_w, cell_h], "halves": [sprites[-2].width, sprites[-1].width], "count": count}

    # --- Cinta: una tablilla repetible (de la mitad de una junta a la mitad de la siguiente)
    rgba = key_out(load(folder, "cinta-v1"))
    labels, big, _ = components(rgba, 20000)
    belt = max(big, key=lambda it: it["area"])
    x0, y0, x1, y1 = belt["box"]
    solid = rgba[y0:y1, x0:x1]
    gaps = np.nonzero((solid[..., 3][: (y1 - y0) // 3] > 0).sum(axis=0) < 0.4 * ((y1 - y0) // 3))[0]
    # las juntas oscuras entre tablillas se ven como columnas de píxeles muy oscuros en la franja superior
    dark = (solid[: (y1 - y0) // 3, :, :3].mean(axis=2) < 70).mean(axis=0)
    centres = [int(np.mean(run)) for run in np.split(np.nonzero(dark > 0.6)[0], np.nonzero(np.diff(np.nonzero(dark > 0.6)[0]) > 5)[0] + 1) if len(run)]
    centres = centres[1:-1]  # sin las juntas de los extremos
    period = (centres[-1] - centres[0]) / (len(centres) - 1)
    tile = solid[:, centres[1]:centres[2]] if len(centres) > 3 else solid[:, centres[0]:centres[0] + int(period)]
    factor = 2 * 64 / tile.shape[0]
    save(scaled(Image.fromarray(tile, "RGBA"), factor), SPRITES / "cinta-v1.webp")
    metrics["cinta"] = {"period": round((centres[2] - centres[1]) * factor) if len(centres) > 3 else round(period * factor), "height": round(tile.shape[0] * factor), "joints": len(centres), "gaps": int(len(gaps))}

    # --- Tajo
    rgba = trim(key_out(load(folder, "tajo-v1")))
    sprite = scaled(Image.fromarray(rgba, "RGBA"), 2 * 140 / rgba.shape[1])
    save(sprite, SPRITES / "tajo-v1.webp")
    metrics["tajo"] = {"size": [sprite.width, sprite.height]}

    # --- Leña suelta (izquierda) y montón completo (derecha)
    rgba = key_out(load(folder, "lena-v1"))
    stick, pile = group(rgba, 2, min_area=8000)
    for piece, name, width in ((stick, "lena-v1", 74), (pile, "monton-lena-v1", 220)):
        c = crop(rgba, piece)
        sprite = scaled(c, 2 * width / c.width)
        save(sprite, SPRITES / f"{name}.webp")
        metrics[name] = {"size": [sprite.width, sprite.height]}

    # --- Hoguera: apagada y tres llamas. El tramo de la derecha de la segunda imagen trae una piedra fantasma.
    rgba = key_out(load(folder, "hoguera-v1"))
    pieces = group(rgba, 4, min_area=6000)
    # La segunda imagen trae una piedra fantasma a la derecha y una mancha verdosa arriba a la izquierda.
    ghost = pieces[1]
    ring_w = pieces[2]["box"][2] - pieces[2]["box"][0]
    columns = np.arange(rgba.shape[1])[None, :]
    hue, sat, _ = hsv_of(rgba)
    drop(rgba, ghost, (hue >= 60) & (hue <= 150) & (sat > 0.12))
    drop(rgba, ghost, columns > ghost["box"][0] + ring_w)
    sheet, info = strip(rgba, pieces, 0.5)
    save(sheet, SPRITES / "hoguera-v1.webp")
    metrics["hoguera"] = info

    # --- Fondo del claro: se repara la banda oscura que traía el original y se exporta a 1920 de ancho
    rgb = np.array(load(folder, "claro-fiesta-v1")).astype(float)
    lum = rgb.mean(axis=2).mean(axis=1)
    jumps = np.nonzero(np.abs(np.diff(lum)) > 30)[0]
    if len(jumps) >= 2:
        top_edge = int(jumps[0]) + 2
        bottom_edge = int(jumps[-1]) + 1
        fit = lambda rows_in, rows_out: np.array([np.polyfit(rgb[rows_out, :, c].mean(axis=0), rgb[rows_in, :, c].mean(axis=0), 1)[0] for c in range(3)])
        g_top = fit([top_edge, top_edge + 1, top_edge + 2], [top_edge - 4, top_edge - 3, top_edge - 2])
        g_bottom = fit([bottom_edge - 3, bottom_edge - 2, bottom_edge - 1], [bottom_edge + 1, bottom_edge + 2, bottom_edge + 3])
        fixed = rgb.copy()
        for y in range(top_edge, bottom_edge):
            t = (y - top_edge) / (bottom_edge - top_edge - 1)
            fixed[y] = np.clip(rgb[y] / (g_top * (1 - t) + g_bottom * t), 0, 255)
        fixed[top_edge - 1] = (rgb[top_edge - 2] + fixed[top_edge]) / 2
        fixed[bottom_edge] = (fixed[bottom_edge - 1] + rgb[bottom_edge + 1]) / 2
        rgb = fixed
        print(f"  banda oscura corregida en las filas {top_edge}-{bottom_edge}")
    bg = Image.fromarray(rgb.round().astype(np.uint8))
    bg = bg.resize((1920, round(1920 * bg.height / bg.width)), Image.LANCZOS)
    save(bg, WORLDS / "claro-fiesta-v1.webp")

    print(json.dumps(metrics, indent=1))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
