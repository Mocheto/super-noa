"""Recorta y exporta el arte del armario y el vestidor de la casa de los gatitos (docs/art/casa-vestidor-v1.md).

Entrada: una carpeta con las cinco láminas tal como salen del generador (cualquier extensión):
  casa-armario, casa-vestidor-fondo, casa-armario-abierto, gato-vestidor y casa-accesorios.
Salida (WebP):
  public/assets/sprites/casa-armario-v1.webp          el armario cerrado de la habitación, a la escala de la habitación
  public/assets/worlds/casa-vestidor-v1.webp          fondo del vestidor (1280 de ancho, apaisado como salió)
  public/assets/sprites/casa-armario-abierto-v1.webp  el armario abierto con sus tres baldas vacías
  public/assets/sprites/gato-casa-vestidor-v1.webp    el gatito grande en dos cuadros (quieto y contento), en colores clave
  public/assets/sprites/casa-accesorios-v1.webp       cuatro columnas por tres filas (sombreros, gafas, bufandas)
Imprime las medidas que necesita el juego (anclas del gatito grande, celdas y baldas).

- El armario cerrado salió con la habitación borrosa detrás, sin verde limpio: se recorta por el color de la madera
  dentro de su caja y se le pone un contorno nuevo de un píxel.
- En la lámina de accesorios, cada pieza se pone en su celda según su tipo: el sombrero con el ala abajo del todo (se
  apoya en la cabeza), las gafas en el centro y la bufanda arriba del todo (cuelga del cuello).

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-vestidor-recorte.py CARPETA_ORIGEN
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
key_out, poses, recorte, escalar, load, a_claves = casa.key_out, casa.poses, casa.recorte, casa.escalar, casa.load, casa.a_claves
SPRITES, WORLDS, QUALITY = casa.SPRITES, casa.WORLDS, casa.QUALITY

# Alto del armario cerrado en la habitación de 1280 × 540 (cabe bajo la balda de la planta).
ALTO_ARMARIO = 150
# Escala de la lámina para el vestidor (el armario abierto, el gatito y las piezas, a la misma escala entre sí).
ESCALA_VESTIDOR = 0.5
CELDA_GATO = (240, 340)
CELDA_ACCESORIO = (200, 170)
TIPOS = ["sombrero", "gafas", "bufanda"]


def visible(img):
    ys, xs = np.nonzero(np.array(img)[..., 3])
    return img.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def guardar(img, ruta, sin_perdida=False):
    img.save(ruta, "WEBP", lossless=sin_perdida, quality=100 if sin_perdida else QUALITY, method=6)


def armario(folder):
    """La madera (y su contorno oscuro) dentro de la caja del armario, con los huecos rellenos; al final, un contorno
    nuevo de un píxel, porque arriba el del dibujo se perdió en el fondo borroso."""
    img = load(folder, "casa-armario")
    a = np.array(img).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    madera = (r - g > 45) & (g - b > 15) & (r > 120)
    oscuro = (r < 120) & (g < 100) & (b < 120) & (g < r + 25)
    caja = np.zeros(madera.shape, bool)
    caja[int(img.height * 0.13):int(img.height * 0.82), int(img.width * 0.38):int(img.width * 0.62)] = True
    m = ndimage.binary_opening((madera | oscuro) & caja, iterations=1)
    etiquetas, n = ndimage.label(m)
    tamaños = ndimage.sum(m, etiquetas, range(1, n + 1))
    grandes = np.isin(etiquetas, [i + 1 for i, t in enumerate(tamaños) if t > 1500])
    silueta = ndimage.binary_opening(ndimage.binary_fill_holes(ndimage.binary_closing(grandes, iterations=6)), iterations=2)
    rgba = np.dstack([a.astype(np.uint8), (silueta * 255).astype(np.uint8)])
    pieza = visible(Image.fromarray(rgba))
    final = escalar(pieza, (ALTO_ARMARIO - 2) / pieza.height)
    f = np.array(final)
    lleno = f[..., 3] > 127
    f[..., 3] = np.where(lleno, 255, 0)
    lienzo = np.zeros((f.shape[0] + 2, f.shape[1] + 2, 4), np.uint8)
    lienzo[1:-1, 1:-1] = f
    lleno = lienzo[..., 3] > 0
    borde = ndimage.binary_dilation(lleno) & ~lleno
    lienzo[borde] = [*casa.CLAVES["contorno"], 255]
    final = Image.fromarray(lienzo)
    guardar(final, SPRITES / "casa-armario-v1.webp", sin_perdida=True)
    return {"ancho": final.width, "alto": final.height}


def fondo(folder):
    img = load(folder, "casa-vestidor-fondo")
    borde = 10
    b = img.crop((borde, borde, img.width - borde, img.height - borde))
    final = b.resize((1280, round(1280 * b.height / b.width)), Image.LANCZOS)
    guardar(final, WORLDS / "casa-vestidor-v1.webp")
    a = np.array(final).astype(int)
    columna = a[:, final.width // 4]
    # Empieza la madera: la primera fila de la mitad de abajo que deja de ser lila.
    suelo = next(y for y in range(final.height // 2, final.height) if columna[y][0] > columna[y][2] + 40)
    return {"ancho": final.width, "alto": final.height, "suelo": suelo}


def armario_abierto(folder):
    rgba = key_out(load(folder, "casa-armario-abierto"))
    (pieza,) = poses(rgba, 1, min_area=40000)
    img = visible(recorte(rgba, pieza))
    final = escalar(img, ESCALA_VESTIDOR)
    guardar(final, SPRITES / "casa-armario-abierto-v1.webp")
    # Baldas: filas claras de madera que cruzan casi todo el hueco del centro.
    a = np.array(final).astype(int)
    centro = a[:, final.width * 2 // 5:final.width * 3 // 5]
    brillo = centro[..., :3].sum(-1).mean(1)
    return {"ancho": final.width, "alto": final.height, "brillo-filas": [int(v) for v in brillo[::10]]}


def anclas_grande(a, dx, dy):
    """Lazo (sombrero), ojos (gafas) y pañuelo (bufanda) del gatito grande, en px de su celda. Los azules de los ojos y del
    pañuelo se separan por manchas: el pañuelo es la grande; los ojos, las dos de encima (cerrados, no hay)."""
    def es(colores):
        m = np.zeros(a.shape[:2], bool)
        for c in colores:
            m |= (a[..., 0] == c[0]) & (a[..., 1] == c[1]) & (a[..., 2] == c[2]) & (a[..., 3] > 0)
        return m
    ys, xs = np.nonzero(es([casa.CLAVES["lazo"]]))
    lazo = {"x": int(round(xs.mean())) + dx, "y": int(round(ys.mean())) + dy}
    azul = es([casa.CLAVES["ojos"], casa.CLAVES["collar"], casa.CLAVES["collar-sombra"]])
    etiquetas, n = ndimage.label(azul)
    tamaños = ndimage.sum(azul, etiquetas, range(1, n + 1))
    panuelo = 1 + int(np.argmax(tamaños))
    ys, xs = np.nonzero(etiquetas == panuelo)
    cuello = {"x": int(round(xs.mean())) + dx, "y": int(round(ys.mean())) + dy}
    manchas = []
    for i in range(1, n + 1):
        if i == panuelo or tamaños[i - 1] < 20:
            continue
        cy, cx = ndimage.center_of_mass(azul, etiquetas, i)
        if cy < ys.min():
            manchas.append((tamaños[i - 1], cx, cy))
    manchas = sorted(manchas, reverse=True)[:2]
    ojos = None
    if len(manchas) == 2:
        ojos = {"x": int(round((manchas[0][1] + manchas[1][1]) / 2)) + dx, "y": int(round((manchas[0][2] + manchas[1][2]) / 2)) + dy}
    return {"cabeza": lazo, "ojos": ojos, "cuello": cuello}


def gatito(folder, destino="gato-casa-vestidor-v1.webp", alto=None):
    """El gatito grande en dos cuadros. Con `alto`, se escala a ese alto visible en lugar de a ESCALA_VESTIDOR."""
    rgba = key_out(load(folder, "gato-vestidor"))
    piezas = sorted(poses(rgba, 2, min_area=40000), key=lambda p: p["box"][0])
    hoja = Image.new("RGBA", (CELDA_GATO[0] * 2, CELDA_GATO[1]), (0, 0, 0, 0))
    anclas = []
    for i, pieza in enumerate(piezas):
        pieza_visible = visible(recorte(rgba, pieza))
        # Con `alto`, también cabe de ancho en su celda (el pelo largo abulta más que el atigrado).
        escala = min(alto / pieza_visible.height, (CELDA_GATO[0] - 4) / pieza_visible.width) if alto else ESCALA_VESTIDOR
        img = a_claves(escalar(pieza_visible, escala))
        x = i * CELDA_GATO[0] + (CELDA_GATO[0] - img.width) // 2
        y = CELDA_GATO[1] - 6 - img.height
        hoja.alpha_composite(img, (x, y))
        a = np.array(img).astype(int)
        anclas.append(anclas_grande(a, x - i * CELDA_GATO[0], y))
    guardar(hoja, SPRITES / destino, sin_perdida=True)
    return {"celda": CELDA_GATO, "anclas": anclas}


def accesorios(folder):
    rgba = key_out(load(folder, "casa-accesorios"))
    piezas = poses(rgba, 12, min_area=8000)
    filas = sorted(piezas, key=lambda p: p["box"][1])
    ancho, alto = CELDA_ACCESORIO
    hoja = Image.new("RGBA", (ancho * 4, alto * 3), (0, 0, 0, 0))
    medidas = {}
    for f, tipo in enumerate(TIPOS):
        fila = sorted(filas[f * 4:(f + 1) * 4], key=lambda p: p["box"][0])
        for c, pieza in enumerate(fila):
            img = escalar(visible(recorte(rgba, pieza)), ESCALA_VESTIDOR)
            if img.width > ancho or img.height > alto:
                raise SystemExit(f"{tipo} {c} no cabe en su celda: {img.size}")
            x = c * ancho + (ancho - img.width) // 2
            y = f * alto + {"sombrero": alto - img.height, "gafas": (alto - img.height) // 2, "bufanda": 0}[tipo]
            hoja.alpha_composite(img, (x, y))
            medidas.setdefault(tipo, []).append(img.size)
    guardar(hoja, SPRITES / "casa-accesorios-v1.webp")
    return {"celda": CELDA_ACCESORIO, "piezas": medidas}


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1])
    resultado = {
        "armario": armario(folder),
        "fondo": fondo(folder),
        "armario-abierto": armario_abierto(folder),
        "gatito": gatito(folder),
        "accesorios": accesorios(folder),
    }
    print(json.dumps(resultado, indent=1))


if __name__ == "__main__":
    main()
