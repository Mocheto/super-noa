"""Recorta y exporta las capas, las alas y las piezas nuevas del armario (docs/art/casa-vestidor-v2.md).

Entrada: una carpeta con las láminas tal como salen del generador (cualquier extensión):
  casa-piezas-nuevas  seis piezas en tres filas de dos: dos sombreros, dos gafas y dos bufandas;
  casa-capas          seis capas en dos filas de tres;
  casa-alas           arriba, seis pares de alas en dos filas de tres (lo de abajo no se usa: el aleteo va por código);
  casa-bufandas-nuevas  (opcional) dos bufandas en fila que sustituyen a las de casa-piezas-nuevas.
Además usa la lámina de piezas de ahora, public/assets/sprites/casa-accesorios-v1.webp.

Salida (WebP sin pérdida, a la escala del gatito grande del vestidor):
  public/assets/sprites/casa-accesorios-v2.webp  seis columnas por tres filas de 200 × 170 (sombreros, gafas, bufandas):
                                                 las cuatro de antes y las dos nuevas, colocadas como antes
  public/assets/sprites/casa-capas-v1.webp       seis celdas de 260 × 240 en fila, cada capa colgando de arriba
  public/assets/sprites/casa-alas-v1.webp        seis celdas de 320 × 240 en fila, cada par centrado

Las piezas nuevas se escalan al ancho que tienen las de su tipo en la lámina de antes, para que casen.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-vestidor-v2-recorte.py CARPETA_ORIGEN
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

TIPOS = ["sombrero", "gafas", "bufanda"]
CELDA = (200, 170)
CELDA_CAPA = (260, 240)
CELDA_ALAS = (320, 240)
# Ancho en el vestidor: la capa, algo más ancha que el cuerpo del gatito; las alas, casi el doble.
ANCHO_CAPA = 230
ANCHO_ALAS = 300


def sin_fondo(img):
    """El fondo es solo el verde chillón: varias piezas son verdes (la bufanda de dinosaurio, las hojas de la capa)."""
    hsv = np.array(img.convert("HSV")).astype(int)
    hue, sat, val = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    chillon = (hue >= 95) & (hue <= 135) & (sat > 0.65) & (val > 0.6)
    etiquetas, _ = ndimage.label(chillon)
    borde = set(np.unique(np.concatenate([etiquetas[0], etiquetas[-1], etiquetas[:, 0], etiquetas[:, -1]]))) - {0}
    tamanos = ndimage.sum(chillon, etiquetas, range(1, etiquetas.max() + 1))
    encerrado = [i + 1 for i, t in enumerate(tamanos) if t >= 20]
    alfa = ~(np.isin(etiquetas, list(borde)) | np.isin(etiquetas, encerrado))
    alfa = ndimage.binary_erosion(alfa, structure=ndimage.generate_binary_structure(2, 1))
    alfa = ndimage.binary_opening(alfa, iterations=1)
    return np.dstack([np.array(img), (alfa * 255).astype(np.uint8)])


def visible(img):
    ys, xs = np.nonzero(np.array(img)[..., 3])
    return img.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def guardar(img, nombre):
    img.save(casa.SPRITES / nombre, "WEBP", lossless=True, quality=100, method=6)
    print(f"{nombre}: {img.width} × {img.height}")


def anchos_de_antes(antes):
    """Ancho medio de las piezas de cada tipo en la lámina de antes."""
    a = np.array(antes)
    anchos = {}
    for f, tipo in enumerate(TIPOS):
        medidas = []
        for c in range(4):
            celda = a[f * CELDA[1]:(f + 1) * CELDA[1], c * CELDA[0]:(c + 1) * CELDA[0], 3]
            xs = np.nonzero(celda.any(axis=0))[0]
            medidas.append(xs.max() - xs.min() + 1)
        anchos[tipo] = float(np.median(medidas))
    return anchos


CONTORNO = (0x2F, 0x1D, 0x33, 255)


def abrir_aro(img):
    """Las bufandas nuevas salieron como un aro grueso (con agujero y borde de atrás), no como la banda curva de las de
    antes. Se quita la parte de atrás: todo lo que queda por encima de la mitad del agujero, y la parte de arriba nueva
    se cierra con el contorno ciruela de dos píxeles. Queda la banda de delante con su punta colgando."""
    a = np.array(img)
    opaco = a[..., 3] > 0
    huecos, cuantos = ndimage.label(~opaco)
    borde = set(np.unique(np.concatenate([huecos[0], huecos[-1], huecos[:, 0], huecos[:, -1]]))) - {0}
    dentro = [i for i in range(1, cuantos + 1) if i not in borde]
    if not dentro:
        return img
    agujero = max(dentro, key=lambda i: (huecos == i).sum())
    ys = np.nonzero((huecos == agujero).any(axis=1))[0]
    corte = (ys.min() + ys.max()) // 2
    a[:corte, :, 3] = 0
    # Contorno arriba: los dos primeros píxeles opacos de cada columna.
    for x in range(a.shape[1]):
        filas = np.nonzero(a[:, x, 3] > 0)[0]
        if len(filas):
            a[filas[0]:filas[0] + 2, x] = CONTORNO
    return visible(Image.fromarray(a, "RGBA"))


def piezas_nuevas(folder):
    antes = Image.open(casa.SPRITES / "casa-accesorios-v1.webp").convert("RGBA")
    anchos = anchos_de_antes(antes)
    rgba = sin_fondo(casa.load(folder, "casa-piezas-nuevas"))
    encontradas = casa.poses(rgba, 6, min_area=4000)
    filas = casa.por_filas(encontradas, [2, 2, 2])
    ancho, alto = CELDA
    hoja = Image.new("RGBA", (ancho * 6, alto * 3))
    # Las cuatro de antes, en las cuatro primeras columnas.
    hoja.alpha_composite(antes, (0, 0))
    for f, tipo in enumerate(TIPOS):
        for c, pieza in enumerate(filas[f]):
            img = visible(casa.recorte(rgba, pieza))
            if tipo == "bufanda":
                img = abrir_aro(img)
            img = casa.escalar(img, min(anchos[tipo] / img.width, alto / img.height))
            x = (4 + c) * ancho + (ancho - img.width) // 2
            y = f * alto + {"sombrero": alto - img.height, "gafas": (alto - img.height) // 2, "bufanda": 0}[tipo]
            hoja.alpha_composite(img, (x, y))
    guardar(hoja, "casa-accesorios-v2.webp")


def bufandas_otra_vez(folder):
    """Si existe la lámina casa-bufandas-nuevas (dos bufandas en fila), sustituye las dos bufandas nuevas de la lámina de
    piezas: las primeras salieron como un aro grueso."""
    if not any(p.stem == "casa-bufandas-nuevas" for p in folder.iterdir()):
        return
    antes = Image.open(casa.SPRITES / "casa-accesorios-v1.webp").convert("RGBA")
    ancho_bufanda = anchos_de_antes(antes)["bufanda"]
    rgba = sin_fondo(casa.load(folder, "casa-bufandas-nuevas"))
    encontradas = sorted(casa.poses(rgba, 2, min_area=4000), key=lambda p: p["box"][0])
    ruta = casa.SPRITES / "casa-accesorios-v2.webp"
    hoja = Image.open(ruta).convert("RGBA")
    ancho, alto = CELDA
    for c, pieza in enumerate(encontradas):
        x0, y0 = (4 + c) * ancho, 2 * alto
        hoja.paste((0, 0, 0, 0), (x0, y0, x0 + ancho, y0 + alto))
        img = visible(casa.recorte(rgba, pieza))
        img = casa.escalar(img, min(ancho_bufanda / img.width, alto / img.height))
        hoja.alpha_composite(img, (x0 + (ancho - img.width) // 2, y0))
    guardar(hoja, "casa-accesorios-v2.webp")


def capas(folder):
    rgba = sin_fondo(casa.load(folder, "casa-capas"))
    encontradas = casa.poses(rgba, 6, min_area=8000)
    ancho, alto = CELDA_CAPA
    hoja = Image.new("RGBA", (ancho * 6, alto))
    for i, pieza in enumerate(p for fila in casa.por_filas(encontradas, [3, 3]) for p in fila):
        img = visible(casa.recorte(rgba, pieza))
        img = casa.escalar(img, min(ANCHO_CAPA / img.width, alto / img.height))
        hoja.alpha_composite(img, (i * ancho + (ancho - img.width) // 2, 0))
    guardar(hoja, "casa-capas-v1.webp")


def alas(folder):
    """Los seis pares de arriba (dos filas de tres): cada par son dos alas sueltas, así que se cortan por su sitio en la
    lámina en vez de buscar piezas. Orden del juego: mariposa, murciélago, búho, pez, mariquita y unicornio."""
    img = casa.load(folder, "casa-alas")
    w, h = img.size
    columnas = [(0, w // 3), (w // 3, 2 * w // 3), (2 * w // 3, w)]
    # Dónde acaba la fila de arriba en cada columna (las puntas de las alas de abajo suben más en unas que en otras).
    corte = [int(h * 0.313), int(h * 0.26), int(h * 0.26)]
    final = int(h * 0.51)
    # En la lámina: arriba mariposa, murciélago y búho; abajo mariquita, pez y unicornio.
    orden = [(0, 0), (0, 1), (0, 2), (1, 1), (1, 0), (1, 2)]
    ancho, alto = CELDA_ALAS
    hoja = Image.new("RGBA", (ancho * 6, alto))
    for i, (f, c) in enumerate(orden):
        x0, x1 = columnas[c]
        y0, y1 = (0, corte[c]) if f == 0 else (corte[c], final)
        rgba = sin_fondo(img.crop((x0, y0, x1, y1)))
        par = visible(Image.fromarray(rgba, "RGBA"))
        par = casa.escalar(par, min(ANCHO_ALAS / par.width, alto / par.height))
        hoja.alpha_composite(par, (i * ancho + (ancho - par.width) // 2, (alto - par.height) // 2))
    guardar(hoja, "casa-alas-v1.webp")


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1])
    piezas_nuevas(folder)
    bufandas_otra_vez(folder)
    capas(folder)
    alas(folder)


if __name__ == "__main__":
    main()
