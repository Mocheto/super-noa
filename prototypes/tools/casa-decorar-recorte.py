"""Recorta y exporta el arte de decorar la casa (docs/art/casa-decorar-v1.md).

Entrada: una carpeta con las láminas de muebles tal como salen del generador (cualquier extensión):
  casa-camas, casa-alfombras, casa-cuadros y casa-plantas (cuatro versiones nuevas cada una).
Además usa la habitación de ahora, public/assets/worlds/casa-habitacion-v1.webp.

Salida (WebP):
  public/assets/worlds/casa-habitacion-vacia-v1.webp  la habitación sin cama, alfombra, cuadro ni planta
  public/assets/sprites/casa-mueble-<mueble>-v1.webp  cinco celdas en fila: la de siempre y las cuatro nuevas
Imprime el tamaño de celda de cada mueble para copiarlo a src/game/casaDecoracion.ts.

- La habitación vacía no sale del generador (dibujó otra habitación): se vacía la de ahora. La pared son rayas
  verticales, así que cada columna se rellena con el color de la pared justo encima del mueble; el zócalo es una banda
  horizontal y se copia de una columna libre; el suelo son tablas horizontales y se copia de un trozo libre de la
  misma fila.
- La versión de siempre se recorta de la habitación de ahora: lo que cambia entre ella y la vacía.
- Cada versión se escala a lo ancho de su sitio (las alfombras se aplastan a su óvalo) y se apoya abajo y en el
  centro de su celda, como en la habitación.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-decorar-recorte.py CARPETA_ORIGEN
"""
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

_spec = importlib.util.spec_from_file_location("casa_recorte", Path(__file__).with_name("casa-recorte.py"))
casa = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(casa)
key_out, poses, recorte, escalar, load = casa.key_out, casa.poses, casa.recorte, casa.escalar, casa.load
SPRITES, WORLDS, QUALITY = casa.SPRITES, casa.WORLDS, casa.QUALITY

PARED_HASTA = 356  # empieza el zócalo
SUELO_DESDE = 384  # empieza la madera

# Dónde está cada mueble en la habitación de 1280 × 540 (x0, y0, x1, y1), con un poco de margen, y de dónde se
# copia el suelo (desplazamiento en x hacia una zona libre de la misma fila) y el zócalo (columna libre).
MUEBLES = {
    "cama": {"caja": (258, 312, 461, 436), "suelo": lambda x: x - 240, "zocalo": 250},
    "alfombra": {"caja": (506, 390, 958, 520), "suelo": lambda x: 15 + (x - 506) % 225, "zocalo": None},
    "cuadro": {"caja": (971, 78, 1045, 172), "suelo": None, "zocalo": None},
    "planta": {"caja": (880, 134, 966, 219), "suelo": None, "zocalo": None},
}
# Lo que no es mueble aunque caiga en su caja: la base del rascador.
NO_TOCAR = [(486, 270, 592, 406)]

# Franja de cada lámina donde están los muebles (el generador dejó restos borrosos de la habitación fuera).
FRANJAS = {"cama": (300, 730), "alfombra": (0, 1091), "cuadro": (260, 770), "planta": (300, 800)}
LAMINAS = {"cama": "casa-camas", "alfombra": "casa-alfombras", "cuadro": "casa-cuadros", "planta": "casa-plantas"}


def protegido(x, y):
    return any(x0 <= x < x1 and y0 <= y < y1 for x0, y0, x1, y1 in NO_TOCAR)


def vaciar(a):
    b = a.copy()
    for datos in MUEBLES.values():
        x0, y0, x1, y1 = datos["caja"]
        for y in range(y0, y1):
            for x in range(x0, x1):
                if protegido(x, y):
                    continue
                if y < PARED_HASTA:
                    b[y, x] = a[y0 - 3, x]
                elif y < SUELO_DESDE:
                    b[y, x] = a[y, datos["zocalo"]]
                else:
                    b[y, x] = a[y, datos["suelo"](x)]
    return b


def de_siempre(original, vacia, caja, en_el_suelo):
    """El mueble de siempre: lo que cambia entre la habitación de ahora y la vacía. En el suelo (cama y alfombra, que
    son óvalos) se toma la envolvente de su contorno oscuro, porque el suelo copiado alrededor también cambia un poco."""
    x0, y0, x1, y1 = caja
    trozo = original[y0:y1, x0:x1].astype(int)
    diferencia = np.abs(trozo - vacia[y0:y1, x0:x1].astype(int)).sum(-1)
    if en_el_suelo:
        ys, xs = np.nonzero((trozo.max(-1) < 100) & (diferencia > 40))
        puntos = np.stack([xs, ys], 1)
        from scipy.spatial import ConvexHull, Delaunay
        envolvente = Delaunay(puntos[ConvexHull(puntos).vertices])
        rejilla = np.stack(np.meshgrid(np.arange(trozo.shape[1]), np.arange(trozo.shape[0])), -1).reshape(-1, 2)
        mascara = (envolvente.find_simplex(rejilla) >= 0).reshape(trozo.shape[:2])
    else:
        mascara = ndimage.binary_fill_holes(ndimage.binary_closing(diferencia > 40, iterations=2))
        # Sin la pared que se cuela entre las hojas: la de color de las rayas que se toca con el exterior. (La de
        # dentro de un marco, como el papel del cuadro, se queda.)
        rayas = np.minimum(np.abs(trozo - [0xFB, 0xEA, 0xD2]).sum(-1), np.abs(trozo - [0xF8, 0xDA, 0xBB]).sum(-1)) < 40
        etiquetas, _ = ndimage.label(rayas | ~mascara)
        fuera = set(np.unique(np.concatenate([etiquetas[0], etiquetas[-1], etiquetas[:, 0], etiquetas[:, -1]]))) - {0}
        mascara &= ~(rayas & np.isin(etiquetas, list(fuera)))
    rgba = np.dstack([original[y0:y1, x0:x1], (mascara * 255).astype(np.uint8)])
    img = Image.fromarray(rgba, "RGBA")
    ys, xs = np.nonzero(mascara)
    return img.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)), (x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1)


def sin_verde_de_fondo(img):
    """Como key_out, pero solo quita el verde chillón del fondo: la cáscara de la sandía, verde oscuro, se queda."""
    hsv = np.array(img.convert("HSV")).astype(int)
    hue, sat, val = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    verde = (hue >= 90) & (hue <= 140) & (sat > 0.6) & (val > 0.72)
    etiquetas, _ = ndimage.label(verde)
    borde = set(np.unique(np.concatenate([etiquetas[0], etiquetas[-1], etiquetas[:, 0], etiquetas[:, -1]]))) - {0}
    alfa = ~np.isin(etiquetas, list(borde))
    alfa = ndimage.binary_erosion(alfa, structure=ndimage.generate_binary_structure(2, 1))
    alfa = ndimage.binary_opening(alfa, iterations=1)
    return np.dstack([np.array(img), (alfa * 255).astype(np.uint8)])


def nuevas(folder, mueble):
    img = load(folder, LAMINAS[mueble])
    arriba, abajo = FRANJAS[mueble]
    franja = img.crop((0, arriba, img.width, min(abajo, img.height)))
    rgba = sin_verde_de_fondo(franja) if mueble == "cama" else key_out(franja)
    if mueble == "cama":
        # Restos verdosos sueltos de la habitación borrosa: fuera todo lo que no sea una pieza grande.
        etiquetas, _ = ndimage.label(rgba[..., 3] > 0)
        tamanos = ndimage.sum(rgba[..., 3] > 0, etiquetas, range(1, etiquetas.max() + 1))
        rgba[..., 3][~np.isin(etiquetas, [i + 1 for i, t in enumerate(tamanos) if t >= 3000])] = 0
    piezas = poses(rgba, 4, min_area=8000)
    if mueble == "alfombra":
        piezas.sort(key=lambda p: (round(p["cuerpo"][1] / 300), p["cuerpo"][0]))
    else:
        piezas.sort(key=lambda p: p["cuerpo"][0])
    return [recorte(rgba, p) for p in piezas]


def a_su_sitio(img, mueble, ancho, alto):
    """Escala una versión nueva para su sitio: a lo ancho del de siempre (la alfombra, también a lo alto)."""
    if mueble == "alfombra":
        return img.convert("RGBa").resize((ancho, alto), Image.LANCZOS).convert("RGBA")
    if mueble == "planta":
        return escalar(img, min(ancho * 1.15 / img.width, alto * 1.2 / img.height))
    if mueble == "cuadro":
        return escalar(img, alto / img.height)
    return escalar(img, ancho / img.width)


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1])
    original = np.array(Image.open(WORLDS / "casa-habitacion-v1.webp").convert("RGB"))
    vacia = vaciar(original)
    Image.fromarray(vacia).save(WORLDS / "casa-habitacion-vacia-v1.webp", "WEBP", quality=QUALITY, method=6)
    medidas = {}
    for mueble, datos in MUEBLES.items():
        siempre, (sx0, sy0, sx1, sy1) = de_siempre(original, vacia, datos["caja"], mueble in ("cama", "alfombra"))
        versiones = [siempre] + [a_su_sitio(v, mueble, siempre.width, siempre.height) for v in nuevas(folder, mueble)]
        celda_ancho = max(v.width for v in versiones)
        celda_alto = max(v.height for v in versiones)
        hoja = Image.new("RGBA", (celda_ancho * len(versiones), celda_alto))
        for i, v in enumerate(versiones):
            # Apoyada abajo y en el centro, como el de siempre.
            hoja.alpha_composite(v, (i * celda_ancho + (celda_ancho - v.width) // 2, celda_alto - v.height))
        hoja.save(SPRITES / f"casa-mueble-{mueble}-v1.webp", "WEBP", quality=QUALITY, method=6)
        # La celda se pone con su borde de abajo en el del mueble de siempre y centrada en él.
        centro = (sx0 + sx1) / 2
        medidas[mueble] = {"x": round(centro - celda_ancho / 2), "y": sy1 - celda_alto, "ancho": celda_ancho, "alto": celda_alto,
                           "deSiempre": [int(sx0), int(sy0), int(sx1 - sx0), int(sy1 - sy0)]}
    print(json.dumps(medidas, indent=2, default=int))


if __name__ == "__main__":
    main()
