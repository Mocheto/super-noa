"""Recorta, alinea y exporta el arte nuevo del plan de variedad (dossier docs/art/variedad-v1.md).

Entrada: las láminas tal como salen del generador (fondo verde, a menudo JPEG), en una carpeta con estos
nombres (cualquier extensión): puzzle-pieces-v1 (activadores), puzzle-pieces3-v1 (puertas y emblemas),
puzzle-pieces4-v1 (cajón y plataformas), kitten-gate-v1, avioneta-v1, pompa-v1, nubarron-v1,
arcoiris-final-v1, bocadillo-v1 y cielo-avioneta-v1.
Salida: WebP con transparencia en public/assets/ y docs/art/variedad-v1-recortes.json con los recortes del
atlas y las medidas (en píxeles del archivo; el juego dibuja a la mitad, 2 × para pantallas nítidas).

Pasos: quita el verde del fondo (conectado con el borde y el verde puro encerrado), «desmezcla» los
píxeles semitransparentes que cogieron el verde (la hélice, los destellos y el halo del JPEG), separa las
piezas por celdas o componentes conexas y reescala con alfa premultiplicado.

Uso: python3 prototypes/tools/variedad-recorte.py CARPETA_ORIGEN   (requiere Pillow, numpy y scipy)
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

ROOT, SPRITES, WORLDS = base.ROOT, base.SPRITES, base.WORLDS
ATLASES = ROOT / "public/assets/atlases"
load, save, scaled, trim = base.load, base.save, base.scaled, base.trim
PAD = 4


def unmix(rgba, bg):
    """Devuelve la parte de cada píxel opaco que no es fondo verde. El «verdor» (G − máx(R, B)) mide cuánto
    fondo se ha mezclado: el fondo ronda 200, la hélice translúcida unos 80 y el contorno ciruela 0."""
    rgb = rgba[..., :3].astype(float)
    alpha = rgba[..., 3].astype(float) / 255
    green = rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2])
    bg_green = bg[1] - max(bg[0], bg[2])
    mixed = (alpha > 0) & (green > 20)
    a = np.clip(1 - green / bg_green, 0.05, 1)
    color = (rgb - (1 - a[..., None]) * bg) / a[..., None]
    rgb = np.where(mixed[..., None], np.clip(color, 0, 255), rgb)
    alpha = np.where(mixed, alpha * a, alpha)
    alpha = np.where(alpha < 0.08, 0, alpha)
    return np.dstack([rgb.astype(np.uint8), (alpha * 255).astype(np.uint8)])


def border_color(img):
    rgb = np.array(img).astype(int)
    edge = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    return np.median(edge, axis=0)


def cut_green(img):
    """Fondo verde vivo (#00FF00 aproximado): clave HSV de los gatitos y después desmezcla del halo."""
    return unmix(base.key_out(img, hue_min=85), border_color(img))  # 85: los destellos amarillos se quedan


def cut_flat(img, tolerance=38):
    """Fondo plano de un color cualquiera (el arcoíris salió sobre verde claro, parecido a su banda verde):
    solo se quita lo parecido al fondo y conectado con el borde, así la banda, con su contorno, se queda."""
    rgb = np.array(img).astype(int)
    bg = border_color(img)
    near = np.linalg.norm(rgb - bg, axis=2) < tolerance
    labels, _ = ndimage.label(near)
    edge = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    alpha = ~np.isin(labels, list(edge))
    alpha = ndimage.binary_erosion(alpha, structure=ndimage.generate_binary_structure(2, 1))
    return np.dstack([rgb.astype(np.uint8), (alpha * 255).astype(np.uint8)])


def cells(rgba, cols, rows, inset=0.035):
    """Recorta una rejilla de celdas iguales, metiéndose hacia dentro para dejar fuera las líneas que a veces
    dibuja el generador entre celdas. Devuelve cada celda recortada a su contenido (orden de lectura)."""
    h, w = rgba.shape[:2]
    out = []
    for r in range(rows):
        for c in range(cols):
            x0, x1 = round(w * c / cols), round(w * (c + 1) / cols)
            y0, y1 = round(h * r / rows), round(h * (r + 1) / rows)
            dx, dy = round((x1 - x0) * inset), round((y1 - y0) * inset)
            sub = rgba[y0 + dy:y1 - dy, x0 + dx:x1 - dx].copy()
            labels, count = ndimage.label(sub[..., 3] > 0)
            sizes = ndimage.sum(np.ones_like(labels), labels, range(1, count + 1))
            boxes = ndimage.find_objects(labels)
            thin = [i + 1 for i, b in enumerate(boxes)  # restos de las líneas de la rejilla: largos y finos
                    if min(b[0].stop - b[0].start, b[1].stop - b[1].start) <= 20 and max(b[0].stop - b[0].start, b[1].stop - b[1].start) > 60]
            dust = np.isin(labels, [i + 1 for i, s in enumerate(sizes) if s < 30] + thin)
            sub[..., 3] = np.where(dust, 0, sub[..., 3])
            out.append(trim(sub))
    return out


def pieces(rgba, min_area=4000):
    """Componentes grandes con su caja, ordenadas por filas (y) y después por x."""
    labels, big, _ = base.components(rgba, min_area)
    for it in big:
        it["cy"] = (it["box"][1] + it["box"][3]) / 2
    big.sort(key=lambda it: (round(it["cy"] / 150), it["box"][0]))
    out = []
    for it in big:
        x0, y0, x1, y1 = it["box"]
        sub = rgba[y0:y1, x0:x1].copy()
        sub[..., 3] = np.where(labels[y0:y1, x0:x1] == it["id"], sub[..., 3], 0)
        out.append({"img": sub, "cy": it["cy"], "x": x0})
    return out


def img(a):
    return Image.fromarray(a, "RGBA")


def fit(a, width=None, height=None):
    im = img(a)
    factor = width / im.width if width else height / im.height
    return scaled(im, factor)


def uniform(arrays, factor):
    return [scaled(img(a), factor) for a in arrays]


def cell_strip(images, align="bottom"):
    """Tira de celdas iguales (la mayor de las piezas), cada pieza centrada en x y apoyada abajo o centrada."""
    cw = max(i.width for i in images) + 2 * PAD
    ch = max(i.height for i in images) + 2 * PAD
    sheet = Image.new("RGBA", (cw * len(images), ch), (0, 0, 0, 0))
    for k, i in enumerate(images):
        y = ch - PAD - i.height if align == "bottom" else (ch - i.height) // 2
        sheet.alpha_composite(i, (k * cw + (cw - i.width) // 2, y))
    return sheet, {"cell": [cw, ch], "frames": len(images)}


def pack(named, width=1024):
    """Atlas por estantes: devuelve la imagen y {nombre: [x, y, ancho, alto]}."""
    x = y = shelf = 0
    rects = {}
    for name, im in named:
        if x + im.width + PAD > width:
            x, y, shelf = 0, y + shelf + PAD, 0
        rects[name] = [x + PAD, y + PAD, im.width, im.height]
        x += im.width + PAD
        shelf = max(shelf, im.height + PAD)
    atlas = Image.new("RGBA", (width, y + shelf + PAD), (0, 0, 0, 0))
    for name, im in named:
        atlas.alpha_composite(im, tuple(rects[name][:2]))
    return atlas, rects


def platform_parts(row, color):
    """Extremo izquierdo, centro repetible y extremo derecho de una plataforma de color. El generador dibujó
    cada trozo con su propio contorno; se cortan los bordes interiores para que casen sin costuras."""
    h = max(p["img"].shape[0] for p in row)
    cut = round(h * 0.17)
    caps = [p for p in row if p["img"].shape[1] < 1.2 * p["img"].shape[0]]
    mids = [p for p in row if all(p is not c for c in caps)]
    left = caps[0]["img"][:, :-cut]
    right = caps[1]["img"][:, cut:] if len(caps) > 1 else left[:, ::-1]
    plain = min(mids, key=lambda p: np.std(p["img"][: h // 3, cut:-cut, :3]))  # el trozo sin brillos sueltos
    middle = plain["img"][:, cut * 2:-cut * 2]
    target = 48
    return [(f"platform-{color}-left", fit(left, height=target)),
            (f"platform-{color}-middle", fit(middle, height=target)),
            (f"platform-{color}-right", fit(np.ascontiguousarray(right), height=target))]


def main(folder):
    folder = Path(folder)
    report = {}

    # --- Sala-rompecabezas: atlas común
    act = cells(cut_green(load(folder, "puzzle-pieces-v1")), 4, 2)
    factor = 144 / act[0].shape[1]  # el pedestal del botón de huella: 144 px (72 en pantalla)
    act = uniform(act, factor)
    names = ["paw-button", "plate", "pink-button", "blue-button"]
    named = [(f"{n}-up", im) for n, im in zip(names, act[:4])] + [(f"{n}-down", im) for n, im in zip(names, act[4:])]

    doors = cells(cut_green(load(folder, "puzzle-pieces3-v1")), 5, 1)
    door_factor = 280 / doors[0].shape[0]  # puerta: 280 px de alto (140 en pantalla)
    named += [("door-closed", scaled(img(doors[0]), door_factor)), ("door-open", scaled(img(doors[1]), door_factor))]
    named += [(f"emblem-{n}", fit(a, width=64)) for n, a in zip(["paw", "star", "moon"], doors[2:])]

    parts = pieces(cut_green(load(folder, "puzzle-pieces4-v1")))
    crate = max(parts, key=lambda p: p["img"].shape[0] * (p["cy"] < 600))
    named.append(("crate", fit(crate["img"], width=192)))
    rows = sorted({round(p["cy"] / 150) for p in parts if p is not crate})
    pink = [p for p in parts if p is not crate and round(p["cy"] / 150) == rows[0]]
    blue = [p for p in parts if p is not crate and round(p["cy"] / 150) == rows[1]]
    named += platform_parts(pink, "pink") + platform_parts(blue, "blue")  # la fila «fantasma» no se usa

    atlas, rects = pack(named)
    save(atlas, ATLASES / "puzzle-pieces-v1.webp")
    report["puzzle-pieces-v1"] = rects

    # --- Exploración: puerta de los gatitos
    gate = cut_green(load(folder, "kitten-gate-v1"))
    sheet, info = cell_strip(uniform(cells(gate, 2, 1, inset=0.01), 400 / cells(gate, 2, 1, inset=0.01)[0].shape[0]))
    save(sheet, SPRITES / "kitten-gate-v1.webp")
    report["kitten-gate-v1"] = info

    # --- Avioneta
    plane = trim(cut_green(load(folder, "avioneta-v1")))
    im = fit(plane, height=360)
    save(im, SPRITES / "avioneta-v1.webp")
    report["avioneta-v1"] = {"size": [im.width, im.height]}

    bubble = cells(cut_green(load(folder, "pompa-v1")), 3, 1, inset=0.01)
    sheet, info = cell_strip(uniform(bubble, 80 / bubble[0].shape[1]), align="center")
    save(sheet, SPRITES / "pompa-v1.webp")
    report["pompa-v1"] = info

    cloud = cells(cut_green(load(folder, "nubarron-v1")), 2, 1, inset=0.01)
    sheet, info = cell_strip(uniform(cloud, 256 / cloud[1].shape[1]))
    save(sheet, SPRITES / "nubarron-v1.webp")
    report["nubarron-v1"] = info

    rainbow = trim(cut_flat(load(folder, "arcoiris-final-v1")))
    im = fit(rainbow, width=2080)
    save(im, SPRITES / "arcoiris-final-v1.webp")
    report["arcoiris-final-v1"] = {"size": [im.width, im.height]}

    # --- Paseo y pestaña Amigos: bocadillo 9-slice
    talk = cells(cut_green(load(folder, "bocadillo-v1")), 2, 1, inset=0.01)
    factor = 240 / talk[0].shape[1]
    sheet, info = cell_strip(uniform(talk, factor), align="top")
    save(sheet, SPRITES / "bocadillo-v1.webp")
    body = talk[0][..., 3] > 0
    tail_top = int(np.nonzero(body.sum(axis=1) > body.shape[1] * 0.6)[0].max()) + 1  # fin del cuerpo, empieza la cola
    info["slice"] = {"corner": round(0.12 * talk[0].shape[0] * factor), "bodyBottom": round(tail_top * factor) + PAD}
    report["bocadillo-v1"] = info

    # --- Cielo vertical: el degradado lo pinta el juego y aquí queda solo la capa de nubes, transparente y
    # cortada entre dos filas sin nubes que casan, para que se repita sin costura.
    sky = load(folder, "cielo-avioneta-v1")
    sky = sky.resize((960, round(sky.height * 960 / sky.width)), Image.LANCZOS)
    a = np.array(sky).astype(int)
    h = a.shape[0]
    row_sky = np.median(a[:, 380:580], axis=1)  # el centro es casi todo cielo
    clouds = np.linalg.norm(a - row_sky[:, None, :], axis=2) > 26
    y1, y2 = min(((y1, y2) for y1 in range(h // 4) for y2 in range(h * 3 // 4, h - 8)),
                 key=lambda pair: (clouds[pair[0]:pair[0] + 8] ^ clouds[pair[1]:pair[1] + 8]).sum())
    soft = np.clip((np.linalg.norm(a - row_sky[:, None, :], axis=2) - 14) / 24, 0, 1)
    layer = np.dstack([a.astype(np.uint8), (soft * 255).astype(np.uint8)])[y1:y2]
    save(Image.fromarray(layer, "RGBA"), WORLDS / "cielo-avioneta-v1.webp")
    report["cielo-avioneta-v1"] = {"size": [960, int(y2 - y1)], "repeat": "vertical", "layer": "nubes sobre degradado",
                                   "skyTop": [int(v) for v in row_sky[y1]], "skyBottom": [int(v) for v in row_sky[y2 - 1]]}

    target = ROOT / "docs/art/variedad-v1-recortes.json"
    target.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    print(f"  {target.relative_to(ROOT)}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
