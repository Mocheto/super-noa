"""Monta el arte de decorar la pecera y la jaula (docs/art/casa-decorar-pecera-jaula-v1.md).

Separa el adorno de siempre del fondo publicado de la pecera y recorta las láminas generadas. Salidas en
public/assets/sprites/:

- casa-pecera-fondo-v2.webp: el mueble con la pecera, solo con agua y arena.
- casa-pecera-adorno-<tema>-v1.webp: cinco capas de 412 × 354 (castillo, el de siempre, y los cuatro temas).
- casa-jaula-casitas-v1.webp: las cuatro casitas nuevas, en celdas de 96 × 96.

Imprime la puerta de cada casita para `src/game/casaHamstersArte.ts` y comprueba que el hueco de la quinta pieza de cada
adorno cae sobre el punto donde se esconde el pez payaso.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-decorar-pecera-recorte.py --origen ../super-noa-arte-original/casa-decorar-pecera-v1
"""
import argparse
import importlib.util
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

AQUI = Path(__file__).resolve().parent
SALIDA = AQUI.parents[1] / "public" / "assets" / "sprites"
spec = importlib.util.spec_from_file_location("pecera", AQUI / "casa-pecera-recorte.py")
pecera = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pecera)

ANCHO, ALTO = 412, 354
# Donde estaba cada grupo de la decoración de siempre (x0, y0, x1, y1), y un tramo de arena sin nada para repetirlo.
CAJAS = [(26, 114, 104, 193), (110, 136, 188, 193), (202, 156, 264, 193), (286, 98, 372, 193)]
ARENA_DESDE = 168
ARENA_LIMPIA = (266, 285)
# Pez payaso: PECERA.castillo.
ESCONDITE = (328, 178)
# Dónde va cada pieza de un tema: centro x, base y, alto máximo y ancho máximo. La 2 va a la derecha del cofre.
SITIOS = [(48, 188, 70, 52), (126, 189, 50, 42), (174, 188, 50, 52), (233, 190, 40, 56), (ESCONDITE[0], 189, 87, 86)]
TEMAS = ["dinosaurios", "hielo", "barcos", "celeste"]


def endurecer(p):
    a = np.asarray(p).copy()
    a[..., 3] = np.where(a[..., 3] > 127, 255, 0)
    return Image.fromarray(a, "RGBA")


def reducir(p, k):
    return endurecer(p.resize((max(1, round(p.width * k)), max(1, round(p.height * k))), Image.LANCZOS))


def guardar(img, nombre):
    img.save(SALIDA / nombre, "WEBP", lossless=True, quality=100, method=6)
    print(nombre, img.size)


def separar():
    """El fondo publicado -> (fondo sin adorno, adorno de siempre)."""
    original = np.asarray(Image.open(SALIDA / "casa-pecera-fondo-v1.webp").convert("RGBA")).astype(int)
    relleno = original.copy()
    for x0, y0, x1, y1 in CAJAS:
        for y in range(y0, y1):
            if y < ARENA_DESDE:  # el agua: de lado a lado de la caja
                a, b = original[y, x0 - 2], original[y, x1 + 2]
                t = np.linspace(0, 1, x1 - x0 + 1)[:-1, None]
                relleno[y, x0:x1] = np.round(a + (b - a) * t)
            else:  # la arena: se repite un tramo limpio
                desde, hasta = ARENA_LIMPIA
                relleno[y, x0:x1] = original[y, desde + (np.arange(x1 - x0) % (hasta - desde))]
    zona = np.zeros(original.shape[:2], bool)
    for x0, y0, x1, y1 in CAJAS:
        zona[y0:y1, x0:x1] = True
    distinto = (np.abs(relleno - original)[..., :3].max(-1) > 28) & zona
    # Las piezas: las manchas grandes que difieren y tienen contorno oscuro; los brillos y el borde de la arena no lo tienen.
    oscuro = original[..., :3].max(-1) < 150
    etiquetas, n = ndi.label(distinto, structure=np.ones((3, 3)))
    tallas = np.bincount(etiquetas.ravel(), minlength=n + 1)
    contorno = np.bincount(etiquetas.ravel(), weights=oscuro.ravel(), minlength=n + 1)
    piezas = (etiquetas > 0) & (tallas[etiquetas] >= 60) & (contorno[etiquetas] >= 20)
    piezas = ndi.binary_fill_holes(piezas)
    quitar = ndi.binary_dilation(piezas, iterations=2) & zona
    limpio = np.where(quitar[..., None], relleno, original)
    adorno = original.copy()
    adorno[..., 3] = np.where(quitar, 255, 0)
    adorno[~quitar] = 0
    return Image.fromarray(limpio.astype(np.uint8), "RGBA"), Image.fromarray(adorno.astype(np.uint8), "RGBA")


def lamina(origen, nombre, cuantas):
    im = pecera.quitar_verde(Image.open(origen / f"{nombre}.webp").convert("RGB"))
    cajas = pecera.grupos(im, hueco=12)
    assert len(cajas) == cuantas, (nombre, cajas)
    return [pecera.pieza(im, c) for c in cajas]


def hueco(p):
    """El hueco oscuro grande de una pieza: (máscara)."""
    a = np.asarray(p).astype(int)
    oscuro = (a[..., 3] > 0) & (a[..., :3].max(-1) < 75)
    # Sin los contornos, que son líneas finas.
    gordo = ndi.binary_opening(oscuro, iterations=3)
    etiquetas, n = ndi.label(gordo)
    assert n, "sin hueco"
    tallas = np.bincount(etiquetas.ravel())
    tallas[0] = 0
    return etiquetas == tallas.argmax()


def adorno(origen, tema):
    capa = Image.new("RGBA", (ANCHO, ALTO))
    for i, (p, (cx, base, alto, ancho)) in enumerate(zip(lamina(origen, tema, 5), SITIOS)):
        e = reducir(p, min(alto / p.height, ancho / p.width))
        x, y = round(cx - e.width / 2), base - e.height
        if i == 4:  # el escondite: el centro del hueco, en la x donde se esconde el payaso
            ys, xs = np.nonzero(hueco(e))
            x = round(ESCONDITE[0] - xs.mean())
            x = min(x, 386 - e.width)
            dentro = (ys.min() + y, ys.max() + y, xs.min() + x, xs.max() + x)
            print(f"  {tema}: hueco y {dentro[0]}..{dentro[1]}, x {dentro[2]}..{dentro[3]}")
            assert dentro[0] <= ESCONDITE[1] <= dentro[1] and dentro[2] <= ESCONDITE[0] <= dentro[3], (tema, dentro)
        capa.alpha_composite(e, (x, y))
    return capa


def casitas(origen):
    hoja = Image.new("RGBA", (4 * 96, 96))
    for i, p in enumerate(lamina(origen, "casitas", 4)):
        e = reducir(p, min(90 / p.width, 92 / p.height))
        x, y = (96 - e.width) // 2, 94 - e.height
        hoja.alpha_composite(e, (i * 96 + x, y))
        ys, xs = np.nonzero(hueco(e))
        print(f"  casita {i + 1}: puerta x {x + (xs.min() + xs.max() + 1) / 2:.0f}, suelo {y + ys.max() + 1 - 0}, ancho {xs.max() - xs.min() + 1}, alto {ys.max() - ys.min() + 1}")
    return hoja


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--origen", type=Path, required=True)
    origen = parser.parse_args().origen
    fondo, castillo = separar()
    guardar(fondo, "casa-pecera-fondo-v2.webp")
    guardar(castillo, "casa-pecera-adorno-castillo-v1.webp")
    for tema in TEMAS:
        guardar(adorno(origen, tema), f"casa-pecera-adorno-{tema}-v1.webp")
    guardar(casitas(origen), "casa-jaula-casitas-v1.webp")


if __name__ == "__main__":
    main()
