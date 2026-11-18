"""Monta los atlas de pictogramas a partir de las láminas que salen del generador de imágenes.

Entrada: una o varias láminas, cada una con una fila de dibujos en orden de izquierda a derecha, y el nombre del
pictograma de cada dibujo (o «-» para saltarlo). Las láminas a color tienen fondo blanco (con o sin marcos finos
alrededor de cada dibujo); las de controles, fondo negro y dibujos en blanco.
Salida: public/assets/sprites/pictogramas-v1.png (6 × 6 celdas de 96 px) y pictogramas-controles-v1.png
(5 × 3 celdas), y src/textos/pictogramasDibujados.ts con los nombres que ya tienen dibujo. Si los atlas existen,
solo se sustituyen las celdas indicadas: el atlas se completa poco a poco.

Cada dibujo se recorta, se reduce a la rejilla de 24 × 24 (22 de dibujo y 1 de margen) y se amplía × 4 con el
vecino más próximo, así que queda nítido. El fondo pasa a transparente.

Uso:
  uv run --with pillow --with numpy --with scipy python3 prototypes/tools/pictogramas-recorte.py \\
    --color LAMINA.jpg vidas,estrella,reto,flor,-,- \\
    --controles LAMINA.jpg salta,-,-,-,pausa
"""
import argparse
import pathlib
import re

import numpy as np
from PIL import Image
from scipy import ndimage

RAIZ = pathlib.Path(__file__).resolve().parents[2]
ATLAS_COLOR = RAIZ / "public/assets/sprites/pictogramas-v1.png"
ATLAS_CONTROLES = RAIZ / "public/assets/sprites/pictogramas-controles-v1.png"
DIBUJADOS = RAIZ / "src/textos/pictogramasDibujados.ts"

# El orden es estable: coincide con docs/interfaz/pictogramas.md y con ATLAS_PICTOGRAMAS en src/textos/pictogramas.ts.
COLOR = [
    "vidas", "manzana", "pegatina", "estrella", "gato", "lana",
    "caja", "bandera", "meta", "sala", "reto", "bravo",
    "marco", "noa", "agua", "lava", "hielo", "aire",
    "flor", "nube", "erizo", "perrito", "musica", "regalo",
    "enredadera", "tren", "mapa", "inicio", "album", "amigos",
    "postal", "fiesta", "secreto", "no-muerde", "pista", "cerrado",
]
CONTROLES = [
    "jugar", "pausa", "sonido", "sin-sonido", "otra-vez",
    "vuelve", "si", "por-descubrir", "ayuda", "espera",
    "pantalla-grande", "cerrar", "salta", "camina", "busca",
]
CELDA, REJILLA, DIBUJO = 96, 24, 22


def piezas(mascara: np.ndarray) -> list[tuple[slice, slice, int]]:
    """Componentes conexas del dibujo, con su recuadro y su número de píxeles."""
    etiquetas, _ = ndimage.label(mascara, structure=np.ones((3, 3)))
    resultado = []
    for indice, recuadro in enumerate(ndimage.find_objects(etiquetas), start=1):
        if recuadro is None:
            continue
        resultado.append((recuadro[0], recuadro[1], int((etiquetas[recuadro] == indice).sum())))
    return resultado


def dibujos(lamina: Image.Image, controles: bool, cuantos: int) -> list[tuple[int, int, int, int]]:
    """Recuadro de cada dibujo, de izquierda a derecha, uniendo las piezas que caen en la misma columna."""
    rgb = np.asarray(lamina.convert("RGB")).astype(int)
    if controles:
        mascara = rgb.min(axis=2) > 200  # blanco puro; la rejilla gris del fondo no cuenta
    else:
        mascara = (255 - rgb.min(axis=2)) > 40  # todo lo que no es casi blanco
    alto, ancho = mascara.shape
    columnas: list[list[tuple[int, int, int, int]]] = [[] for _ in range(cuantos)]
    for filas, cols, pixeles in piezas(mascara):
        caja = (cols.start, filas.start, cols.stop, filas.stop)
        w, h = caja[2] - caja[0], caja[3] - caja[1]
        if pixeles < 12:
            continue  # motas de la compresión
        if not controles and pixeles < 0.12 * w * h and min(w, h) > 0.15 * alto:
            continue  # marco hueco alrededor del dibujo
        centro = (caja[0] + caja[2]) / 2
        columnas[min(cuantos - 1, int(centro / ancho * cuantos))].append(caja)
    resultado = []
    for cajas in columnas:
        if not cajas:
            raise SystemExit("Una columna de la lámina está vacía: revisa el número de nombres")
        resultado.append((min(c[0] for c in cajas), min(c[1] for c in cajas), max(c[2] for c in cajas), max(c[3] for c in cajas)))
    return resultado


def celda(lamina: Image.Image, caja: tuple[int, int, int, int], controles: bool) -> Image.Image:
    """Recorta un dibujo, lo cuadra, lo reduce a la rejilla de 24 y lo amplía × 4 sin suavizar."""
    x0, y0, x1, y1 = caja
    lado = max(x1 - x0, y1 - y0)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    cuadro = lamina.convert("RGB").crop((int(cx - lado / 2), int(cy - lado / 2), int(cx + lado / 2), int(cy + lado / 2)))
    pequeno = np.asarray(cuadro.resize((DIBUJO, DIBUJO), Image.Resampling.BOX)).astype(int)
    rgba = np.zeros((REJILLA, REJILLA, 4), dtype=np.uint8)
    if controles:
        opaco = pequeno.mean(axis=2) > 110
        rgba[1:-1, 1:-1, :3] = 255
    else:
        # Solo es fondo el blanco unido al borde (con el halo claro que deja la reducción junto a él): los rellenos
        # claros dentro del contorno (nube, hielo, sobre, bombilla) se quedan.
        claro = (255 - pequeno.min(axis=2)) <= 80
        etiquetas, _ = ndimage.label(claro)
        borde = set(np.unique(np.concatenate([etiquetas[0], etiquetas[-1], etiquetas[:, 0], etiquetas[:, -1]]))) - {0}
        opaco = ~np.isin(etiquetas, list(borde))
        rgba[1:-1, 1:-1, :3] = pequeno
    rgba[1:-1, 1:-1, 3] = np.where(opaco, 255, 0)
    return Image.fromarray(rgba, "RGBA").resize((CELDA, CELDA), Image.Resampling.NEAREST)


def montar(destino: pathlib.Path, orden: list[str], columnas: int, filas: int, entradas: list[tuple[str, str]], controles: bool) -> list[str]:
    atlas = Image.open(destino).convert("RGBA") if destino.exists() else Image.new("RGBA", (columnas * CELDA, filas * CELDA), (0, 0, 0, 0))
    montados = []
    for ruta, nombres in entradas:
        lista = nombres.split(",")
        lamina = Image.open(ruta)
        for nombre, caja in zip(lista, dibujos(lamina, controles, len(lista))):
            if nombre == "-":
                continue
            if nombre not in orden:
                raise SystemExit(f"«{nombre}» no es un pictograma de este atlas")
            indice = orden.index(nombre)
            x, y = indice % columnas * CELDA, indice // columnas * CELDA
            atlas.paste((0, 0, 0, 0), (x, y, x + CELDA, y + CELDA))
            atlas.alpha_composite(celda(lamina, caja, controles), (x, y))
            montados.append(nombre)
    destino.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(destino, optimize=True)
    return montados


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--color", nargs=2, action="append", default=[], metavar=("LAMINA", "NOMBRES"))
    parser.add_argument("--controles", nargs=2, action="append", default=[], metavar=("LAMINA", "NOMBRES"))
    args = parser.parse_args()
    nuevos = []
    if args.color:
        nuevos += montar(ATLAS_COLOR, COLOR, 6, 6, args.color, False)
    if args.controles:
        nuevos += montar(ATLAS_CONTROLES, CONTROLES, 5, 3, args.controles, True)
    previos = re.findall(r'"([\w-]+)"', DIBUJADOS.read_text()) if DIBUJADOS.exists() else []
    todos = [nombre for nombre in COLOR + CONTROLES if nombre in set(previos) | set(nuevos)]
    DIBUJADOS.write_text(
        "/** Pictogramas que ya tienen dibujo en los atlas (lo escribe prototypes/tools/pictogramas-recorte.py). Los demás usan su emoji. */\n"
        f"export const pictogramasDibujados = [{', '.join(f'\"{n}\"' for n in todos)}] as const;\n"
    )
    print("Montados:", ", ".join(nuevos))
    print("Con dibujo:", len(todos), "de", len(COLOR + CONTROLES))


if __name__ == "__main__":
    main()
