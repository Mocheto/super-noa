"""Recorta y exporta el arte del jardín de la casa de los gatitos (docs/art/casa-jardin-v1.md).

Entrada: una carpeta con las cinco láminas tal como salen del generador (cualquier extensión):
  casa-jardin, casa-colchoneta, casa-maceteros, casa-regadera y casa-mariposa.
Salida (WebP):
  public/assets/worlds/casa-jardin-v1.webp      el jardín de 1280 × 540
  public/assets/sprites/casa-colchoneta-v1.webp la colchoneta, 200 de ancho
  public/assets/sprites/casa-maceteros-v1.webp  diez celdas de 100 × 128 en fila: semilla, brote y, por color (roja,
                                                amarilla, azul y rosa), capullo y flor; macetero apoyado abajo
  public/assets/sprites/casa-regadera-v1.webp   la regadera en una celda de 128 × 128, como los objetos de la bandeja
  public/assets/sprites/casa-mariposa-v1.webp   cuatro cuadros de 64 × 64 de aleteo
Imprime las medidas que necesita el juego (`JARDIN` de `casaJardin.ts`).

- El jardín salió en 16:9 con un marco oscuro: se le quita el marco, se escala a 1280 de ancho y se recorta una franja
  de 540 que empieza `ARRIBA` filas más abajo, para que se vean enteras las nubes y la hierba empiece hacia la fila 428.
- Los maceteros van sobre magenta (llevan hojas verdes): se quita el magenta conectado con el borde.
- En la mariposa, el generador dejó copias borrosas encima de la fila buena: solo se usa la fila de abajo.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-jardin-recorte.py CARPETA_ORIGEN
"""
import importlib.util
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

MARCO = 10
ARRIBA = 30


def magenta_fuera(img):
    """RGBA sin el magenta del fondo (el conectado con el borde y el magenta puro encerrado), menos un píxel de halo."""
    hsv = np.array(img.convert("HSV")).astype(int)
    hue, sat, val = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    # El rosa de las flores (tono 325–330, poco saturado) se queda: solo cuenta el magenta saturado.
    magenta = (hue >= 280) & (hue <= 318) & (sat > 0.7) & (val > 0.45)
    labels, _ = ndimage.label(magenta)
    borde = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    fondo = np.isin(labels, list(borde)) | ((hue >= 285) & (hue <= 320) & (sat > 0.75) & (val > 0.75))
    alpha = ndimage.binary_erosion(~fondo, structure=ndimage.generate_binary_structure(2, 1))
    return np.dstack([np.array(img), (alpha * 255).astype(np.uint8)])


def jardin(folder):
    img = load(folder, "casa-jardin")
    img = img.crop((MARCO, MARCO, img.width - MARCO, img.height - MARCO))
    factor = 1280 / img.width
    img = img.resize((1280, round(img.height * factor)), Image.LANCZOS)
    img.crop((0, ARRIBA, 1280, ARRIBA + 540)).save(WORLDS / "casa-jardin-v1.webp", "WEBP", quality=QUALITY, method=6)
    medida = lambda x, y: (round((x - MARCO) * factor), round((y - MARCO) * factor) - ARRIBA)
    return {"factor": round(factor, 4), "puerta (110,200)-(440,745)": [medida(110, 200), medida(440, 745)],
            "hierba en y=718": medida(0, 718)[1], "jardinera (1550,710)-(2000,810)": [medida(1550, 710), medida(2000, 810)]}


def colchoneta(folder):
    rgba = key_out(load(folder, "casa-colchoneta"))
    pieza = recorte(rgba, poses(rgba, 1, min_area=20000)[0])
    pieza = escalar(pieza, 200 / pieza.width)
    pieza.save(SPRITES / "casa-colchoneta-v1.webp", "WEBP", quality=QUALITY, method=6)
    return {"colchoneta": pieza.size}


def maceteros(folder):
    rgba = magenta_fuera(load(folder, "casa-maceteros"))
    filas = casa.por_filas(poses(rgba, 10, min_area=8000), [2] * 5)
    piezas = [recorte(rgba, p) for fila in filas for p in fila]
    ancho_macetero = piezas[0].width  # el de la semilla: solo el macetero
    factor = 92 / ancho_macetero
    celda = (100, 128)
    hoja = Image.new("RGBA", (celda[0] * len(piezas), celda[1]))
    altos = []
    for i, pieza in enumerate(piezas):
        pieza = escalar(pieza, factor)
        altos.append(pieza.height)
        hoja.alpha_composite(pieza, (i * celda[0] + (celda[0] - pieza.width) // 2, celda[1] - 2 - pieza.height))
    hoja.save(SPRITES / "casa-maceteros-v1.webp", "WEBP", quality=QUALITY, method=6)
    return {"maceteros factor": round(factor, 4), "altos": altos}


def regadera(folder):
    rgba = key_out(load(folder, "casa-regadera"))
    pieza = recorte(rgba, poses(rgba, 1, min_area=20000)[0])
    pieza = escalar(pieza, min(120 / pieza.width, 120 / pieza.height))
    hoja = Image.new("RGBA", (128, 128))
    hoja.alpha_composite(pieza, ((128 - pieza.width) // 2, (128 - pieza.height) // 2))
    hoja.save(SPRITES / "casa-regadera-v1.webp", "WEBP", quality=QUALITY, method=6)
    return {"regadera": pieza.size}


def mariposa(folder):
    img = load(folder, "casa-mariposa")
    img = img.crop((0, 360, img.width, img.height))
    rgba = key_out(img)
    piezas = sorted(poses(rgba, 4, min_area=8000), key=lambda p: p["cuerpo"][0])
    imagenes = [recorte(rgba, p) for p in piezas]
    factor = 60 / max(max(i.width, i.height) for i in imagenes)
    hoja = Image.new("RGBA", (64 * 4, 64))
    for n, pieza in enumerate(imagenes):
        pieza = escalar(pieza, factor)
        hoja.alpha_composite(pieza, (n * 64 + (64 - pieza.width) // 2, 62 - pieza.height))
    hoja.save(SPRITES / "casa-mariposa-v1.webp", "WEBP", quality=QUALITY, method=6)
    return {"mariposa factor": round(factor, 4)}


def main():
    folder = Path(sys.argv[1])
    for paso in (jardin, colchoneta, maceteros, regadera, mariposa):
        print(paso.__name__, paso(folder))


if __name__ == "__main__":
    main()
