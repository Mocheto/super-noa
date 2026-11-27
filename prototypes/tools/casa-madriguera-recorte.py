"""Recorta y compone el arte de la madriguera (docs/art/casa-madriguera-v1.md) y lo deja como lo usa el juego.

Entrada (`--origen`): pradera.webp y corte.webp (fondos) y, sobre verde plano, canela.webp, algodon.webp,
escondites.webp y zanahoria.webp. `--jardin` es el fondo del jardín publicado.

Salidas:

- worlds/casa-jardin-madriguera-v1.webp (480 × 540): la ampliación. El cielo, la tapia y la hierba salen del propio
  jardín para que continúen sin salto; del arte generado se toman el montículo (con su agujero en AGUJERO) y la bajante
  de la esquina.
- worlds/casa-madriguera-corte-v1.webp (1280 × 540, de x = -760 a 520): el corte. El generado no respeta la guía, así que
  de él salen la hierba, las piedras, las raíces y las tres cuevas, y se colocan donde andan los conejos
  (`casaConejos.ts`), con los túneles dibujados aquí.
- sprites/casa-conejo-canela-v1.webp y -algodon-v1.webp: 5 × 2 celdas de 180 × 200, con el suelo en la fila 196.
- sprites/casa-conejo-escondites-v1.webp: seis celdas de 200 × 140, apoyadas en la fila 136.
- sprites/casa-zanahoria-v1.webp: dos celdas de 128 × 128 (zanahoria y cabeza de conejo).

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-madriguera-recorte.py --origen ../super-noa-arte-original/casa-madriguera-v1
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ASSETS = Path(__file__).resolve().parents[2] / "public" / "assets"

# Las medidas de casaConejos.ts, en px de la escena del jardín.
AGUJERO = (-250, 470)
CORTE_X, CORTE_Y = -760, 540
NODOS = {
    "boca": (-250, 540), "alto": (-120, 660), "medio": (-120, 800), "bajo": (-120, 880),
    "dormitorio": (-320, 750), "despensa": (80, 800), "juegos": (-220, 970),
    "libre1": (100, 970), "libre2": (-380, 890),
}
TUNELES = [("boca", "alto"), ("alto", "medio"), ("medio", "bajo"), ("bajo", "juegos"), ("alto", "dormitorio"), ("medio", "despensa")]
# El borde del montículo en pradera.webp (976 × 1088), en sentido horario.
CONTORNO = [
    (146, 698), (175, 678), (246, 598), (300, 556), (345, 522), (398, 492), (452, 474), (520, 474), (556, 486), (596, 492),
    (660, 526), (704, 568), (748, 630), (800, 672), (832, 692), (832, 710), (794, 724), (748, 738), (664, 750), (620, 750),
    (596, 756), (556, 764), (520, 774), (450, 774), (392, 764), (356, 750), (296, 750), (244, 740), (240, 728), (160, 718),
    (146, 712),
]
# El interior de cada cueva en el arte generado (corte.webp, 1584 × 672).
CUEVAS = {"dormitorio": (228, 112, 610, 357), "despensa": (1012, 172, 1384, 410), "juegos": (612, 378, 972, 622)}


def quitar_verde(img):
    """RGBA sin el verde del fondo, sin tocar el verde oliva de las hojas."""
    a = np.asarray(img.convert("RGB")).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    alfa = ~((g > 175) & (g - r > 70) & (g - b > 70))
    cerca = ndi.binary_dilation(~alfa, iterations=2) & alfa
    alfa &= ~(cerca & (g > 140) & (g - np.maximum(r, b) > 35))
    borde = ndi.binary_dilation(~alfa, iterations=3) & alfa
    tope = np.maximum(r, b)
    a[..., 1] = np.where(borde & (g > tope), tope, g)
    etiquetas, _ = ndi.label(alfa)
    tallas = np.bincount(etiquetas.ravel())
    alfa &= tallas[etiquetas] >= 40
    return Image.fromarray(np.dstack([a, alfa * 255]).astype(np.uint8), "RGBA")


def reducir(pieza, k):
    """Reduce y deja los bordes nítidos."""
    p = pieza.resize((max(1, round(pieza.width * k)), max(1, round(pieza.height * k))), Image.LANCZOS)
    a = np.asarray(p).copy()
    a[..., 3] = np.where(a[..., 3] > 127, 255, 0)
    return Image.fromarray(a, "RGBA")


def piezas(img, centros_x, filas):
    """Las piezas de una lámina en rejilla: cada mancha va a la celda de su centro; devuelve (pieza, caja) por orden."""
    limpia = quitar_verde(img)
    a = np.asarray(limpia)
    etiquetas, n = ndi.label(ndi.binary_dilation(a[..., 3] > 0, iterations=4))
    celdas = [[] for _ in range(len(centros_x) * len(filas))]
    for i, (ys, xs) in enumerate(ndi.find_objects(etiquetas), 1):
        cx, cy = (xs.start + xs.stop) / 2, (ys.start + ys.stop) / 2
        fila = next(f for f, (desde, hasta) in enumerate(filas) if desde <= cy < hasta)
        columna = min(range(len(centros_x)), key=lambda c: abs(centros_x[c] - cx))
        celdas[fila * len(centros_x) + columna].append(i)
    res = []
    for indices in celdas:
        assert indices, "celda vacía"
        propia = a.copy()
        propia[..., 3] = np.where(np.isin(etiquetas, indices), propia[..., 3], 0)
        p = Image.fromarray(propia, "RGBA")
        caja = p.getchannel("A").getbbox()
        res.append((p.crop(caja), caja))
    return res


def guardar(img, ruta):
    img.save(ASSETS / ruta, "WEBP", lossless=True, method=6)
    print(ruta, img.size)


def conejos(origen):
    for nombre in ("canela", "algodon"):
        recortes = piezas(Image.open(origen / f"{nombre}.webp"), [190, 490, 800, 1090, 1385], [(0, 336), (336, 672)])
        hoja = Image.new("RGBA", (180 * 5, 200 * 2))
        suelos = [max(caja[3] for _, caja in recortes[f * 5:f * 5 + 5]) for f in range(2)]
        for i, (pieza, caja) in enumerate(recortes):
            p = reducir(pieza, 0.75)
            # Los saltos se quedan en el aire lo mismo que en la lámina.
            alza = round((suelos[i // 5] - caja[3]) * 0.75)
            assert p.width <= 180 and p.height + alza <= 196, (nombre, i, p.size, alza)
            hoja.alpha_composite(p, (180 * (i % 5) + (180 - p.width) // 2, 200 * (i // 5) + 196 - alza - p.height))
        guardar(hoja, f"sprites/casa-conejo-{nombre}-v1.webp")


def fila_de_piezas(ruta, centros, ancho, alto, suelo, k, salida, centrado=False):
    recortes = piezas(Image.open(ruta), centros, [(0, 10_000)])
    hoja = Image.new("RGBA", (ancho * len(recortes), alto))
    for i, (pieza, _) in enumerate(recortes):
        p = reducir(pieza, k)
        assert p.width <= ancho and p.height <= alto, (salida, i, p.size)
        y = (alto - p.height) // 2 if centrado else suelo - p.height
        hoja.alpha_composite(p, (ancho * i + (ancho - p.width) // 2, y))
    guardar(hoja, salida)


def pradera(origen, jardin):
    fondo = Image.open(jardin).convert("RGBA")
    nueva = Image.new("RGBA", (480, 540))
    # Una franja limpia del jardín (cielo, tapia y hierba, sin nubes ni árbol), repetida en espejo.
    franja = fondo.crop((660, 0, 720, 540))
    for i in range(8):
        nueva.paste(franja if i % 2 == 0 else franja.transpose(Image.FLIP_LEFT_RIGHT), (60 * i, 0))
    nube = fondo.crop((476, 20, 642, 94))
    for x, y in ((40, 28), (262, 78)):
        nueva.paste(nube, (x, y))

    arte = Image.open(origen / "pradera.webp").convert("RGBA")
    # El montículo, por su contorno trazado sobre la lámina (su hierba se confunde con la del fondo).
    caja = (130, 455, 850, 790)
    recorte = arte.crop(caja)
    mascara = Image.new("L", recorte.size, 0)
    ImageDraw.Draw(mascara).polygon([(x - caja[0], y - caja[1]) for x, y in CONTORNO], fill=255)
    recorte.putalpha(mascara)
    monticulo = recorte
    k = 0.44
    monticulo = reducir(monticulo, k)
    # El centro del agujero en la lámina es (488, 665).
    hueco = ((488 - caja[0]) * k, (665 - caja[1]) * k)
    nueva.alpha_composite(monticulo, (round(AGUJERO[0] + 480 - hueco[0]), round(AGUJERO[1] - hueco[1])))
    # La bajante de la esquina de la casa, pegada al borde derecho y apoyada en la hierba.
    nueva.alpha_composite(arte.crop((884, 0, 918, 610)).resize((17, 442), Image.LANCZOS), (463, 0))
    guardar(nueva.convert("RGB"), "worlds/casa-jardin-madriguera-v1.webp")


def corte(origen):
    arte = Image.open(origen / "corte.webp").convert("RGBA")
    k = 2  # Se dibuja al doble y se reduce, para que las curvas queden suaves.
    ancho, alto = 1280, 540
    tierra = arte.getpixel((760, 650))
    lienzo = Image.new("RGBA", (ancho, alto), tierra)
    # Piedras y raíces del arte, repartidas por los huecos que dejan los túneles.
    adornos = {
        "piedras": (28, 92, 222, 182), "raiz": (970, 70, 1100, 170), "raizGrande": (1368, 68, 1530, 218),
        "raizAbajo": (445, 578, 640, 662), "piedrecitas": (960, 175, 1020, 218), "guijarros": (30, 578, 150, 634),
        "chinas": (1228, 598, 1300, 642),
    }
    sitios = [
        ("piedras", 40, 90), ("raiz", 230, 46), ("raizGrande", 1100, 46), ("raizAbajo", 60, 440), ("piedrecitas", 760, 80),
        ("guijarros", 1060, 300), ("chinas", 190, 280), ("raiz", 990, 160), ("raizAbajo", 900, 462), ("piedras", 1080, 420),
        ("guijarros", 120, 190), ("chinas", 800, 520), ("piedrecitas", 300, 380),
    ]
    for nombre, x, y in sitios:
        trozo = arte.crop(adornos[nombre])
        trozo = trozo.resize((round(trozo.width * 0.808), round(trozo.height * 0.808)), Image.LANCZOS)
        # Solo lo que se distingue de la tierra, para que no se vea el recuadro.
        color = np.asarray(trozo.convert("RGB")).astype(int)
        lejos = np.abs(color - np.median(color.reshape(-1, 3), axis=0)).sum(axis=2) > 24
        lienzo.paste(trozo, (x, y), Image.fromarray((lejos * 255).astype(np.uint8), "L"))
    lienzo.paste(arte.crop((0, 0, 1584, 76)).resize((ancho, 48), Image.LANCZOS), (0, 0))

    grande = lienzo.resize((ancho * k, alto * k), Image.NEAREST)
    pincel = ImageDraw.Draw(grande)
    punto = lambda nodo: ((NODOS[nodo][0] - CORTE_X) * k, (NODOS[nodo][1] - CORTE_Y) * k)
    borde, canto, hueco = "#2f1d2c", "#9a6a50", "#4b2f35"

    def tubos(radio, color):
        for a, b in TUNELES:
            pincel.line([punto(a), punto(b)], fill=color, width=radio * 2 * k)
            for x, y in (punto(a), punto(b)):
                pincel.ellipse([x - radio * k, y - radio * k, x + radio * k, y + radio * k], fill=color)

    def ovalo(cueva, mas, color):
        x, y = punto(cueva)
        y += 10 * k
        pincel.ellipse([x - (108 + mas) * k, y - (68 + mas) * k, x + (108 + mas) * k, y + (68 + mas) * k], fill=color)

    for radio, mas, color in ((38, 9, borde), (35, 6, canto), (31, 2, borde), (28, 0, hueco)):
        tubos(radio, color)
        for cueva in CUEVAS:
            ovalo(cueva, mas, color)
    # Los dos sitios sin excavar: óvalos de puntos.
    for libre in ("libre1", "libre2"):
        x, y = punto(libre)
        for angulo in range(0, 360, 18):
            pincel.arc([x - 54 * k, y - 36 * k, x + 54 * k, y + 36 * k], angulo, angulo + 9, fill="#b58579", width=3 * k)
    lienzo = grande.resize((ancho, alto), Image.LANCZOS)

    # Dentro de cada cueva, su interior del arte.
    for cueva, caja in CUEVAS.items():
        interior = arte.crop(caja).resize((216, 136), Image.LANCZOS)
        mascara = Image.new("L", (216 * 4, 136 * 4), 0)
        ImageDraw.Draw(mascara).ellipse([2, 2, 216 * 4 - 3, 136 * 4 - 3], fill=255)
        x, y = NODOS[cueva]
        lienzo.paste(interior, (x - CORTE_X - 108, y + 10 - CORTE_Y - 68), mascara.resize((216, 136), Image.LANCZOS))
    guardar(lienzo.convert("RGB"), "worlds/casa-madriguera-corte-v1.webp")


if __name__ == "__main__":
    args = argparse.ArgumentParser()
    args.add_argument("--origen", type=Path, required=True)
    args.add_argument("--jardin", type=Path, default=ASSETS / "worlds" / "casa-jardin-v1.webp")
    op = args.parse_args()
    conejos(op.origen)
    fila_de_piezas(op.origen / "escondites.webp", [165, 430, 690, 938, 1192, 1442], 200, 140, 136, 0.66, "sprites/casa-conejo-escondites-v1.webp")
    fila_de_piezas(op.origen / "zanahoria.webp", [255, 733], 128, 128, 124, 0.35, "sprites/casa-zanahoria-v1.webp", centrado=True)
    pradera(op.origen, op.jardin)
    corte(op.origen)
