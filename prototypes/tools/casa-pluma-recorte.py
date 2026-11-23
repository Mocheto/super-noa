"""Recorta y exporta la lámina de la caña de pluma de la casa de los gatitos (docs/art/casa-pluma-v1.md).

Entrada: una carpeta con la lámina tal como sale del generador, llamada `casa-pluma` (cualquier extensión): en fila,
la caña entera, el palo solo y la pluma sola, sobre verde plano.
Salida: public/assets/sprites/casa-pluma-v1.webp, tres celdas de 128 × 128 en ese orden.

Las tres piezas se escalan con el mismo factor (la más grande cabe en 120 px) y se centran en su celda. Cada pieza es
todo lo que hay en su tercio de la lámina, para que la caña entera no se parta en palo y pluma. El hilo de la caña
entera es tan fino que el recorte del verde se lo come: se vuelve a trazar de la punta del palo a la bolita.

Imprime las anclas que usa `src/game/casaPlumaArte.tsx` (en px de la celda): el mango y la punta del palo y la bolita
de la pluma.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-pluma-recorte.py CARPETA_ORIGEN
"""
import importlib.util
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

_spec = importlib.util.spec_from_file_location("casa_recorte", Path(__file__).with_name("casa-recorte.py"))
casa = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(casa)

CELDA = 128
CABE = 120
TRAZO = (0x2F, 0x1D, 0x33, 255)


def pieza_del_tercio(rgba, indice):
    """Todo lo opaco del tercio `indice` (sin motas sueltas), recortado a su caja."""
    ancho = rgba.shape[1]
    x0, x1 = ancho * indice // 3, ancho * (indice + 1) // 3
    sub = rgba[:, x0:x1].copy()
    labels, _ = ndimage.label(sub[..., 3] > 0)
    areas = ndimage.sum(np.ones(labels.shape), labels, index=range(1, labels.max() + 1))
    quedan = [i + 1 for i, area in enumerate(areas) if area >= 30]
    mascara = np.isin(labels, quedan)
    sub[..., 3] = np.where(mascara, sub[..., 3], 0)
    ys, xs = np.nonzero(mascara)
    return Image.fromarray(sub[ys.min():ys.max() + 1, xs.min():xs.max() + 1], "RGBA")


def extremos_del_palo(img):
    """Mango (abajo a la izquierda) y punta (arriba a la derecha) del palo diagonal."""
    a = np.array(img)[..., 3] > 0
    ys, xs = np.nonzero(a)
    mango = int(np.argmax(ys - xs))
    punta = int(np.argmax(xs - ys))
    return (int(xs[mango]), int(ys[mango])), (int(xs[punta]), int(ys[punta]))


def bolita(img):
    """Centro de la bolita roja de la pluma."""
    p = np.array(img).astype(int)
    roja = (p[..., 3] > 0) & (p[..., 0] > 170) & (p[..., 1] < 90) & (p[..., 2] < 100)
    ys, xs = np.nonzero(roja)
    return int(round(xs.mean())), int(round(ys.mean()))


def main():
    folder = Path(sys.argv[1])
    rgba = casa.key_out(casa.load(folder, "casa-pluma"))
    piezas = [pieza_del_tercio(rgba, i) for i in range(3)]
    factor = CABE / max(max(img.width, img.height) for img in piezas)
    hoja = Image.new("RGBA", (CELDA * 3, CELDA))
    sitios = []
    for i, img in enumerate(piezas):
        img = casa.escalar(img, factor)
        sitio = (i * CELDA + (CELDA - img.width) // 2, (CELDA - img.height) // 2)
        hoja.alpha_composite(img, sitio)
        sitios.append((sitio, img))

    # Anclas en px de su celda.
    (s1, entera) = sitios[0]
    (s2, palo) = sitios[1]
    (s3, pluma) = sitios[2]
    mango, punta = extremos_del_palo(palo)
    bead = bolita(pluma)
    en_celda = lambda sitio, punto, celda: (sitio[0] - celda * CELDA + punto[0], sitio[1] + punto[1])

    # El hilo de la caña entera, de la punta de su palo a su bolita.
    _, punta_entera = extremos_del_palo(entera.crop((0, 0, entera.width * 2 // 3, entera.height)))
    bead_entera = bolita(entera)
    dibujo = ImageDraw.Draw(hoja)
    dibujo.line([(s1[0] + punta_entera[0], s1[1] + punta_entera[1]), (s1[0] + bead_entera[0], s1[1] + bead_entera[1] - 3)], fill=TRAZO, width=2)

    salida = casa.SPRITES / "casa-pluma-v1.webp"
    hoja.save(salida, "WEBP", lossless=True, method=6)
    print(f"escrita {salida.relative_to(casa.ROOT)} (factor {factor:.3f})")
    print("MANGO", en_celda(s2, mango, 1), "PUNTA", en_celda(s2, punta, 1), "BOLITA", en_celda(s3, bead, 2))


if __name__ == "__main__":
    main()
