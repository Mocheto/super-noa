"""Recorta y exporta el terreno de las batallas de saltos de Siroco y Don Silbato (docs/art/batalla-saltos-v1.md).

Entrada: una carpeta con las láminas tal como salen del generador, `siroco-terreno` y `don-silbato-terreno` (cualquier
extensión): sobre verde plano, el suelo arriba, la repisa abajo a la izquierda y el proyectil abajo a la derecha.
Salida: public/assets/atlases/<guardián>-boss-terrain-v1.webp, con las tres piezas apiladas: el suelo a 1152 px de
ancho, la repisa a 768 y el proyectil en un cuadrado de 128 × 128.

Imprime los recortes `[x, y, ancho, alto]` de cada pieza para `bossTerrainSources` de `src/game/santaBattleAssets.ts`.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/batalla-saltos-recorte.py CARPETA_ORIGEN
"""
import importlib.util
import json
import sys
from pathlib import Path

from PIL import Image

_spec = importlib.util.spec_from_file_location("casa_recorte", Path(__file__).with_name("casa-recorte.py"))
casa = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(casa)

ATLASES = casa.ROOT / "public/assets/atlases"
ANCHO_SUELO = 1152
ANCHO_REPISA = 768
PROYECTIL = 128
HUECO = 8


def a_ancho(img, ancho):
    return img.resize((ancho, max(1, round(img.height * ancho / img.width))), Image.NEAREST)


def guardian(folder, nombre):
    rgba = casa.key_out(casa.load(folder, f"{nombre}-terreno"))
    piezas = casa.poses(rgba, 3, min_area=3000)
    # El suelo es la más ancha; de las otras dos, la repisa es la de la izquierda.
    piezas.sort(key=lambda p: -(p["box"][2] - p["box"][0]))
    suelo = piezas[0]
    repisa, proyectil = sorted(piezas[1:], key=lambda p: p["box"][0])
    suelo = a_ancho(casa.recorte(rgba, suelo), ANCHO_SUELO)
    repisa = a_ancho(casa.recorte(rgba, repisa), ANCHO_REPISA)
    bala = casa.recorte(rgba, proyectil)
    lado = PROYECTIL - 8
    factor = lado / max(bala.width, bala.height)
    bala = bala.resize((max(1, round(bala.width * factor)), max(1, round(bala.height * factor))), Image.NEAREST)

    alto = suelo.height + HUECO + repisa.height + HUECO + PROYECTIL
    hoja = Image.new("RGBA", (ANCHO_SUELO, alto))
    y = 0
    hoja.alpha_composite(suelo, (0, y))
    fuentes = {"ground": [0, y, suelo.width, suelo.height]}
    y += suelo.height + HUECO
    hoja.alpha_composite(repisa, (0, y))
    fuentes["ledge"] = [0, y, repisa.width, repisa.height]
    y += repisa.height + HUECO
    hoja.alpha_composite(bala, ((PROYECTIL - bala.width) // 2, y + (PROYECTIL - bala.height) // 2))
    fuentes["projectile"] = [(PROYECTIL - bala.width) // 2, y + (PROYECTIL - bala.height) // 2, bala.width, bala.height]

    salida = ATLASES / f"{nombre}-boss-terrain-v1.webp"
    hoja.save(salida, "WEBP", lossless=True, method=6)
    print(f"escrita {salida.relative_to(casa.ROOT)} {hoja.size}")
    print(f'  "{nombre}": {json.dumps(fuentes)},')


CELDA = 256
PIES = 248
CABE_ALTO = 236
CABE_MEDIO = 122


def sin_manchas(rgba):
    """Quita los grumos que son casi verde de fondo (manchas borrosas del generador)."""
    import numpy as np
    from scipy import ndimage
    labels, n = ndimage.label(rgba[..., 3] > 0)
    for indice in range(1, n + 1):
        zona = labels == indice
        r, g, b = (rgba[..., c][zona].astype(int).mean() for c in range(3))
        if g > r + 15 and g > b + 15:
            rgba[..., 3][zona] = 0
    return rgba


def pies_x(img):
    """Centro de los pies: la media de las columnas opacas en el 8 % de abajo."""
    import numpy as np
    a = np.array(img)[..., 3] > 0
    ys, xs = np.nonzero(a)
    abajo = ys >= ys.max() - max(2, int(img.height * .08))
    return float(xs[abajo].mean())


def morado_a_marron(img):
    """La cartera de Don Silbato salió morada en dos poses: los morados pasan al marrón de las otras, con su luz."""
    import numpy as np
    hsv = np.array(img.convert("RGB").convert("HSV")).astype(int)
    tono = hsv[..., 0] * 360 / 255
    morado = (tono >= 255) & (tono <= 315) & (hsv[..., 1] > 70) & (np.array(img)[..., 3] > 0)
    hsv[..., 0] = np.where(morado, round(28 * 255 / 360), hsv[..., 0])
    rgb = Image.fromarray(hsv.astype(np.uint8), "HSV").convert("RGB")
    salida = np.array(img).copy()
    salida[..., :3] = np.where(morado[..., None], np.array(rgb), salida[..., :3])
    return Image.fromarray(salida, "RGBA")


def poses_del_jefe(folder, nombre):
    rgba = sin_manchas(casa.key_out(casa.load(folder, f"{nombre}-poses")))
    piezas = sorted(casa.poses(rgba, 5, min_area=6000), key=lambda p: p["cuerpo"][0])
    imagenes = [casa.recorte(rgba, pieza) for pieza in piezas]
    if nombre == "don-silbato":
        imagenes = [morado_a_marron(img) for img in imagenes]
    # Misma escala para las cinco: la más alta cabe de alto y ninguna se sale de lado desde sus pies.
    factor = min(CABE_ALTO / max(img.height for img in imagenes),
                 min(CABE_MEDIO / max(pies_x(img), img.width - pies_x(img)) for img in imagenes))
    hoja = Image.new("RGBA", (CELDA * 5, CELDA * 2))
    for i, img in enumerate(imagenes):
        img = img.resize((max(1, round(img.width * factor)), max(1, round(img.height * factor))), Image.NEAREST)
        x = i * CELDA + round(CELDA / 2 - pies_x(img))
        hoja.alpha_composite(img, (x, CELDA + PIES - img.height))
    salida = casa.SPRITES / f"boss-{nombre}-sheet-v2.webp"
    hoja.save(salida, "WEBP", lossless=True, method=6)
    print(f"escrita {salida.relative_to(casa.ROOT)} {hoja.size} (factor {factor:.3f})")


def main():
    folder = Path(sys.argv[1])
    for nombre in ("siroco", "don-silbato"):
        guardian(folder, nombre)
        poses_del_jefe(folder, nombre)


if __name__ == "__main__":
    main()
