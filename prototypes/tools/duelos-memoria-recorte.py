"""Recorta y exporta el arte de los duelos de memoria (docs/art/duelos-memoria-v1.md).

Entrada: una carpeta con las láminas tal como salen del generador, sobre verde plano (cualquier extensión):
`aurora-poses` (12 poses en 4 filas de 3), `nubecita-poses` (4 en fila), `aurora-piezas` (nube y luna),
`reina-poses` (4 de trote arriba y 3 abajo), `cria-poses` (6 en 2 filas de 3) y `selva-piezas` (arbusto y nido).

Salida en public/assets/sprites/:
- hojas de poses en casillas cuadradas de 256 px, en una fila, todas a la misma escala, centradas y con los pies (o
  el apoyo) a 248 px: `vuelo-aurora-v1.webp` (vuela 1-3, posada, canta, mira a la izquierda, mira a la derecha),
  `vuelo-nubecita-v1.webp` (dormida, un ojo, canta, bosteza), `nido-reina-v1.webp` (trota 1-4, topetazo, pisotón,
  estornudo) y `nido-cria-v1.webp` (huevo, se abre, trota 1-2, baila 1-2);
- las máscaras para teñir por código: `vuelo-nubecita-cuerpo-v1.webp` (el cuerpo blanco de cada nubecita, misma
  rejilla) y `nido-arbusto-flores-v1.webp` (las flores blancas del arbusto, mismo tamaño que el arbusto);
- piezas sueltas recortadas a su caja: `vuelo-nube-v1.webp`, `vuelo-luna-v1.webp`, `nido-arbusto-v1.webp` y
  `nido-nido-v1.webp`.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/duelos-memoria-recorte.py CARPETA_ORIGEN
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

CELDA = 256
PIES = 248
CABE = 236


def sin_motas(rgba, minimo=400):
    """Quita los trocitos sueltos (rayas de movimiento, motas del fondo) más pequeños que `minimo` píxeles."""
    labels, n = ndimage.label(rgba[..., 3] > 0)
    if n:
        areas = ndimage.sum(np.ones(labels.shape), labels, index=range(1, n + 1))
        for indice, area in enumerate(areas, start=1):
            if area < minimo:
                rgba[..., 3][labels == indice] = 0
    return rgba


def clave_fina(img, distancia=70):
    """Quita el fondo por cercanía a su color (la media del borde), solo lo unido al borde: para personajes con
    verdes propios (las hojas y la piel turquesa de la Reina), que el recorte común agujerea."""
    a = np.array(img.convert("RGB")).astype(int)
    borde = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    fondo = np.median(borde, axis=0)
    cerca = np.sqrt(((a - fondo) ** 2).sum(axis=2)) < distancia
    labels, _ = ndimage.label(cerca)
    tocan = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    alfa = ~np.isin(labels, list(tocan))
    alfa = ndimage.binary_erosion(alfa, structure=ndimage.generate_binary_structure(2, 1))
    return np.dstack([a.astype(np.uint8), (alfa * 255).astype(np.uint8)])


def piezas_de(folder, nombre, filas, minimo=400, min_area=6000, fina=False):
    imagen = casa.load(folder, nombre)
    rgba = sin_motas(clave_fina(imagen) if fina else casa.key_out(imagen), minimo)
    piezas = casa.poses(rgba, sum(filas), min_area=min_area)
    ordenadas = [p for fila in casa.por_filas(piezas, filas) for p in fila]
    return [casa.recorte(rgba, p) for p in ordenadas]


def hoja(imagenes, salida, abajo=True):
    """Una fila de casillas cuadradas, todas a la misma escala, centradas y con el apoyo a `PIES` (o al centro)."""
    factor = CABE / max(max(img.width, img.height) for img in imagenes)
    lienzo = Image.new("RGBA", (CELDA * len(imagenes), CELDA))
    for i, img in enumerate(imagenes):
        img = img.resize((max(1, round(img.width * factor)), max(1, round(img.height * factor))), Image.NEAREST)
        y = PIES - img.height if abajo else (CELDA - img.height) // 2
        lienzo.alpha_composite(img, (i * CELDA + (CELDA - img.width) // 2, y))
    lienzo.save(casa.SPRITES / salida, "WEBP", lossless=True, method=6)
    print(f"escrita sprites/{salida} {lienzo.size} (factor {factor:.3f})")
    return lienzo


def mascara_blanca(img, umbral_luz=200, umbral_color=40):
    """Solo los píxeles casi blancos (claros y sin color), para teñirlos por código."""
    a = np.array(img).astype(int)
    luz = a[..., :3].mean(axis=2)
    color = a[..., :3].max(axis=2) - a[..., :3].min(axis=2)
    blanco = (a[..., 3] > 0) & (luz >= umbral_luz) & (color <= umbral_color)
    salida = np.zeros_like(a)
    salida[..., :3] = 255
    salida[..., 3] = np.where(blanco, 255, 0)
    return Image.fromarray(salida.astype(np.uint8), "RGBA")


def suelta(img, salida, lado=512):
    factor = min(1, lado / max(img.width, img.height))
    img = img.resize((max(1, round(img.width * factor)), max(1, round(img.height * factor))), Image.NEAREST)
    img.save(casa.SPRITES / salida, "WEBP", lossless=True, method=6)
    print(f"escrita sprites/{salida} {img.size}")
    return img


def main():
    folder = Path(sys.argv[1])

    # Aurora: de las doce, las siete que usa el juego.
    aurora = piezas_de(folder, "aurora-poses", [3, 3, 3, 3])
    vuela = aurora[0:3]
    posada, canta, mira_izquierda, mira_derecha = aurora[11], aurora[9], aurora[10], aurora[8]
    hoja([*vuela, posada, canta, mira_izquierda, mira_derecha], "vuelo-aurora-v1.webp")

    nubecitas = piezas_de(folder, "nubecita-poses", [4])
    rejilla = hoja(nubecitas, "vuelo-nubecita-v1.webp")
    mascara_blanca(rejilla).save(casa.SPRITES / "vuelo-nubecita-cuerpo-v1.webp", "WEBP", lossless=True, method=6)
    print("escrita sprites/vuelo-nubecita-cuerpo-v1.webp")

    nube, luna = piezas_de(folder, "aurora-piezas", [2])
    suelta(nube, "vuelo-nube-v1.webp")
    suelta(luna, "vuelo-luna-v1.webp")

    hoja(piezas_de(folder, "reina-poses", [4, 3], fina=True), "nido-reina-v1.webp")
    hoja(piezas_de(folder, "cria-poses", [3, 3]), "nido-cria-v1.webp")

    arbusto, nido = piezas_de(folder, "selva-piezas", [2], fina=True)
    arbusto = suelta(arbusto, "nido-arbusto-v1.webp")
    mascara_blanca(arbusto, umbral_luz=170, umbral_color=60).save(casa.SPRITES / "nido-arbusto-flores-v1.webp", "WEBP", lossless=True, method=6)
    print("escrita sprites/nido-arbusto-flores-v1.webp")
    suelta(nido, "nido-nido-v1.webp")


if __name__ == "__main__":
    main()
