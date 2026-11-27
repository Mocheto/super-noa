"""Recorta las láminas de un traje de Noa y las coloca con las medidas de las hojas del peto (docs/art/trajes-v1.md).

Cada dibujo nuevo ocupa el sitio del dibujo del peto al que sustituye (misma altura, mismo centro y mismos pies), así
el juego usa los mismos recortes con cualquier traje.

Entrada: la carpeta con `<traje>-quieta`, `-correr`, `-salto`, `-gata`, `-nadar` y `-gestos` (y `-tijera` si las tijeras se repitieron aparte).
Salida (WebP sin pérdida): public/assets/sprites/noa-<traje>-*-v1.webp.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/trajes-recorte.py CARPETA TRAJE
Las cajas de `CAJAS` (dónde está cada dibujo en las láminas de varios) se miden a ojo en cada traje.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

SPRITES = Path(__file__).resolve().parents[2] / "public" / "assets" / "sprites"

# (izquierda, arriba, derecha, abajo) en píxeles de cada lámina.
CAJAS = {
    "caballera": {
        "correr": [(0, 350, 236, 750), (236, 350, 446, 750), (446, 350, 667, 750), (667, 350, 896, 750)],
        # La lámina de gata trajo cinco: ovillo, correr, saltar, (sobra) y lanzar.
        "gata": [(0, 130, 285, 590), (285, 130, 605, 590), (605, 130, 896, 590), (340, 620, 896, 1060)],
        "nadar": [(0, 0, 660, 440), (660, 0, 1200, 440), (0, 440, 620, 896), (620, 440, 1200, 896)],
        # Las tijeras de la lámina (la tercera) salieron al revés: van aparte.
        "gestos": [(0, 0, 500, 496), (500, 0, 1000, 496), (1500, 0, 2000, 496)],
    },
    "exploradora": {
        "correr": [(0, 0, 560, 496), (560, 0, 1060, 496), (1060, 0, 1580, 496), (1580, 0, 2000, 496)],
        "gata": [(0, 0, 330, 768), (330, 0, 685, 768), (685, 0, 995, 768), (995, 0, 1376, 768)],
        "nadar": [(0, 0, 610, 440), (610, 0, 1200, 440), (0, 440, 610, 896), (610, 440, 1200, 896)],
        "gestos": [(0, 0, 360, 768), (360, 0, 685, 768), (685, 0, 1005, 768), (1005, 0, 1376, 768)],
    },
    "pirata": {
        # La tercera de correr salió abierta de piernas en el aire: se repite la primera zancada.
        "correr": [(0, 0, 385, 768), (385, 0, 660, 768), (0, 0, 385, 768), (1050, 0, 1376, 768)],
        "gata": [(0, 0, 352, 768), (352, 0, 685, 768), (685, 0, 968, 768), (968, 0, 1376, 768)],
        "nadar": [(0, 0, 690, 370), (690, 0, 1376, 370), (0, 370, 690, 768), (690, 370, 1376, 768)],
        "gestos": [(0, 0, 370, 768), (370, 0, 712, 768), (712, 0, 1015, 768), (1015, 0, 1376, 768)],
    },
}


# Columnas por las que separar dibujos que se tocan en la lámina.
CORTES = {("pirata", "gestos"): [698]}


def lamina(carpeta, nombre):
    ruta = next(p for p in sorted(carpeta.glob(f"{nombre}.*")))
    return Image.open(ruta).convert("RGB")


def dibujo(imagen, caja=None, cortes=()):
    """El dibujo de una lámina sin su fondo verde, recortado a su tamaño.

    Con varios en la lámina, son suyas las piezas sueltas (cuerpo, estrellas, ovillo) cuyo centro cae en `caja`: así una
    cola o un mechón que se asoma a la caja del vecino no se corta ni se cuela.
    """
    rgb = np.array(imagen).astype(int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    # Solo el verde vivo del fondo: el pañuelo verde de la exploradora (#3E9B52) se queda.
    solido = ~((g > 180) & (r < 130) & (b < 120))
    for x in cortes:
        solido[:, x - 1:x + 2] = False
    marcas, n = ndimage.label(solido)
    indices = np.arange(1, n + 1)
    tamanos = ndimage.sum(solido, marcas, indices)
    # Fuera las motas sueltas.
    suyas = indices[tamanos > 60]
    if caja:
        x0, y0, x1, y1 = caja
        centros = ndimage.center_of_mass(solido, marcas, suyas)
        suyas = [marca for marca, (y, x) in zip(suyas, centros) if x0 <= x < x1 and y0 <= y < y1]
    solido = np.isin(marcas, suyas)
    # El borde mezclado con el verde se queda sin él.
    borde = solido & ~ndimage.binary_erosion(solido, iterations=2)
    rgb[..., 1] = np.where(borde, np.minimum(g, np.maximum(r, b)), g)
    salida = Image.fromarray(np.dstack([rgb, solido * 255]).astype(np.uint8), "RGBA")
    return salida.crop(salida.getbbox())


def sitio(peto, region=None):
    """Caja de lo dibujado en el peto (entero o en una región de su hoja)."""
    alfa = peto.getchannel("A").crop(region) if region else peto.getchannel("A")
    x0, y0, x1, y1 = alfa.point(lambda v: 255 if v > 160 else 0).getbbox()
    dx, dy = (region[0], region[1]) if region else (0, 0)
    return (x0 + dx, y0 + dy, x1 + dx, y1 + dy)


def colocar(lienzo, figura, hueco, escala=None):
    """Pone la figura con los pies donde los tiene el peto, centrada, a su altura (o a la escala dada)."""
    x0, y0, x1, y1 = hueco
    escala = escala or (y1 - y0) / figura.height
    escala = min(escala, lienzo.width / figura.width, y1 / figura.height)
    figura = figura.resize((round(figura.width * escala), round(figura.height * escala)), Image.NEAREST)
    x = min(max(0, round((x0 + x1 - figura.width) / 2)), lienzo.width - figura.width)
    lienzo.alpha_composite(figura, (x, y1 - figura.height))
    return escala


def peto(nombre):
    return Image.open(SPRITES / f"{nombre}.webp").convert("RGBA")


def guardar(imagen, nombre):
    ruta = SPRITES / f"{nombre}.webp"
    imagen.save(ruta, "WEBP", lossless=True, quality=100, method=6)
    print(ruta.name, imagen.size, f"{ruta.stat().st_size // 1024} KB")


def main():
    carpeta, traje = Path(sys.argv[1]), sys.argv[2]
    cajas = CAJAS[traje]
    nueva = lambda nombre: lamina(carpeta, f"{traje}-{nombre}")
    vacio = lambda como: Image.new("RGBA", como.size)

    # Hoja: quieta (fila 1) y las cuatro de correr (fila 2, a una misma escala). El resto de la hoja no se dibuja.
    hoja = peto("noa-sprite-sheet")
    celda = hoja.width / 4
    region = lambda columna, arriba, abajo: (round(columna * celda) + 8, arriba, round((columna + 1) * celda) - 8, abajo)
    salida = vacio(hoja)
    colocar(salida, dibujo(nueva("quieta")), sitio(hoja, region(0, 0, 345)))
    correr = [dibujo(nueva("correr"), caja) for caja in cajas["correr"]]
    huecos = [sitio(hoja, region(i, 358, 665)) for i in range(4)]
    escala = np.mean([(h[3] - h[1]) / f.height for h, f in zip(huecos, correr)])
    for figura, hueco in zip(correr, huecos):
        colocar(salida, figura, hueco, escala)
    guardar(salida, f"noa-{traje}-sheet-v1")

    sueltas = [("jump", "noa-jump-v2", dibujo(nueva("salto")))]
    gata = [dibujo(nueva("gata"), caja) for caja in cajas["gata"]]
    sueltas += list(zip(["cat-yarn", "cat-run", "cat-jump", "cat-throw"], ["noa-cat-yarn-v2", "noa-cat-run-v2", "noa-cat-jump-v2", "noa-cat-throw-v1"], gata))
    gestos = [dibujo(nueva("gestos"), caja, CORTES.get((traje, "gestos"), ())) for caja in cajas["gestos"]]
    if len(gestos) == 3:
        gestos.insert(2, dibujo(nueva("tijera")))
    sueltas += [(f"rps-{i}", f"noa-rps-{i}", figura) for i, figura in enumerate(gestos)]
    for nombre, referencia, figura in sueltas:
        base = peto(referencia)
        salida = vacio(base)
        colocar(salida, figura, sitio(base))
        guardar(salida, f"noa-{traje}-{nombre}-v1")

    # Nadar: dos brazadas por fila (normal, protegida y gata). La protegida repite la normal: el juego pone el brillo.
    base = peto("noa-swim-v1")
    lado, alto = base.width // 2, base.height // 3
    nado = [dibujo(nueva("nadar"), caja) for caja in cajas["nadar"]]
    salida = vacio(base)
    huecos = [sitio(base, (i * lado, 0, (i + 1) * lado, alto)) for i in range(2)]
    escala = np.mean([(h[2] - h[0]) / f.width for h, f in zip(huecos, nado[:2])])
    for fila, figuras in [(0, nado[:2]), (1, nado[:2]), (2, nado[2:])]:
        for columna, figura in enumerate(figuras):
            e = min(escala, lado / figura.width)
            f = figura.resize((round(figura.width * e), round(figura.height * e)), Image.NEAREST)
            h = huecos[columna]
            # El cuerpo en el mismo sitio con y sin cola: se alinea por la cabeza (el borde derecho y el centro de alto).
            x = min(max(0, h[2] - f.width), lado - f.width)
            y = round((h[1] + h[3] - f.height) / 2)
            salida.alpha_composite(f, (columna * lado + x, fila * alto + max(0, y)))
    guardar(salida, f"noa-{traje}-swim-v1")


main()
