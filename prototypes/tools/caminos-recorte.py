"""Monta el arte de los caminos secretos a partir de las imágenes del generador (issue 157).

Fondos: cada lámina se recorta entre las dos columnas que más se parecen (al menos 900 px de ancho), así que el fondo
se repite sin costura; se guarda en public/assets/worlds/camino-<id>-v2.webp. El juego lo dibuja a 540 px de alto.

Atlas: cada lámina tiene una fila de dibujos sobre fondo blanco, en orden. El blanco unido al borde pasa a
transparente y cada dibujo se encaja en su celda sin deformarlo:
  - entradas → fila 1 de secret-detours-v2.png (5 × 2 celdas de 256 px), apoyadas abajo;
  - piezas → fila 2: la luciérnaga centrada y las plataformas (vagoneta, tablón, libro, hoja) a todo el ancho y
    pegadas arriba, de modo que la superficie que se pisa es el borde superior de la celda;
  - interruptores → detour-switches-v2.png (3 celdas de 256 × 192), apoyados abajo.

Uso:
  uv run --with pillow --with numpy --with scipy python3 prototypes/tools/caminos-recorte.py \\
    --molino M.jpg --biblioteca B.jpg --jardin J.jpg --entradas E.jpg --piezas P.jpg --interruptores I.jpg
"""
import argparse
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage

RAIZ = pathlib.Path(__file__).resolve().parents[2]
FONDOS = RAIZ / "public/assets/worlds"
ATLAS = RAIZ / "public/assets/atlases/secret-detours-v2.png"
INTERRUPTORES = RAIZ / "public/assets/atlases/detour-switches-v2.png"
VENTANA = 12  # columnas a cada lado del corte que deben parecerse


def corte_sin_costura(lamina: Image.Image) -> tuple[int, int]:
    """Las dos columnas (a, b), con b - a ≥ 900, cuyo entorno más se parece: [a, b) se repite sin costura."""
    ancho, alto = lamina.size
    columnas = np.asarray(lamina.crop((0, 0, ancho, int(alto * .78))).resize((ancho, 96), Image.Resampling.BOX), dtype=np.float32)
    rasgos = columnas.transpose(1, 0, 2).reshape(ancho, -1)
    cuadrados = (rasgos * rasgos).sum(1)
    distancia = np.sqrt(np.maximum(cuadrados[:, None] + cuadrados[None, :] - 2 * rasgos @ rasgos.T, 0))
    suma = sum(np.roll(np.roll(distancia, paso, 0), paso, 1) for paso in range(-VENTANA, VENTANA + 1))
    a, b = np.meshgrid(np.arange(ancho), np.arange(ancho), indexing="ij")
    suma[~((b - a >= 900) & (a >= VENTANA) & (b < ancho - VENTANA))] = np.inf
    inicio, fin = np.unravel_index(np.argmin(suma), suma.shape)
    return int(inicio), int(fin)


def fondo(ruta: str, nombre: str) -> None:
    lamina = Image.open(ruta).convert("RGB")
    inicio, fin = corte_sin_costura(lamina)
    destino = FONDOS / f"camino-{nombre}-v2.webp"
    lamina.crop((inicio, 0, fin, lamina.height)).save(destino, quality=88, method=6)
    print(f"{destino.name}: columnas {inicio}–{fin} de {lamina.width}")


def dibujos(ruta: str, cuantos: int) -> list[Image.Image]:
    """Cada dibujo de la lámina, de izquierda a derecha, recortado y con el fondo blanco transparente."""
    rgb = np.asarray(Image.open(ruta).convert("RGB")).astype(int)
    claro = (255 - rgb.min(axis=2)) <= 60
    etiquetas, _ = ndimage.label(claro)
    borde = set(np.unique(np.concatenate([etiquetas[0], etiquetas[-1], etiquetas[:, 0], etiquetas[:, -1]]))) - {0}
    # También es fondo el blanco puro encerrado (dentro del marco de la campana, entre las ramas del arco); los rellenos
    # claros pero no blancos (páginas, brillo de la luciérnaga) se quedan.
    blanco, _ = ndimage.label(rgb.min(axis=2) >= 240)
    encerrado = np.isin(blanco, [i for i, n in enumerate(np.bincount(blanco.ravel())) if i and n >= 30])
    opaco = ~(np.isin(etiquetas, list(borde)) | ndimage.binary_dilation(encerrado, iterations=2) & claro)
    piezas, _ = ndimage.label(opaco, structure=np.ones((3, 3)))
    alto, ancho = opaco.shape
    cajas: list[list[int] | None] = [None] * cuantos
    for indice, recuadro in enumerate(ndimage.find_objects(piezas), start=1):
        if recuadro is None or (piezas[recuadro] == indice).sum() < 40:
            continue
        x0, x1, y0, y1 = recuadro[1].start, recuadro[1].stop, recuadro[0].start, recuadro[0].stop
        columna = min(cuantos - 1, int((x0 + x1) / 2 / ancho * cuantos))
        caja = cajas[columna]
        cajas[columna] = [x0, y0, x1, y1] if caja is None else [min(caja[0], x0), min(caja[1], y0), max(caja[2], x1), max(caja[3], y1)]
    rgba = np.dstack([rgb.astype(np.uint8), np.where(opaco, 255, 0).astype(np.uint8)])
    imagen = Image.fromarray(rgba, "RGBA")
    if any(caja is None for caja in cajas):
        raise SystemExit(f"{ruta}: falta algún dibujo; revisa cuántos hay")
    return [imagen.crop(tuple(caja)) for caja in cajas]  # type: ignore[arg-type]


def encajar(dibujo: Image.Image, ancho: int, alto: int, ancla: str, margen: int = 6) -> Image.Image:
    """Encaja el dibujo en una celda sin deformarlo; `ancla` es abajo, arriba (a todo el ancho) o centro."""
    escala = (ancho if ancla == "arriba" else ancho - 2 * margen) / dibujo.width
    if ancla != "arriba":
        escala = min(escala, (alto - 2 * margen) / dibujo.height)
    tamano = (max(1, round(dibujo.width * escala)), max(1, round(dibujo.height * escala)))
    reducido = dibujo.convert("RGBa").resize(tamano, Image.Resampling.LANCZOS).convert("RGBA")
    celda = Image.new("RGBA", (ancho, alto), (0, 0, 0, 0))
    x = (ancho - tamano[0]) // 2
    y = 0 if ancla == "arriba" else alto - margen - tamano[1] if ancla == "abajo" else (alto - tamano[1]) // 2
    celda.alpha_composite(reducido, (x, y))
    return celda


def main() -> None:
    parser = argparse.ArgumentParser()
    for nombre in ("molino", "biblioteca", "jardin", "entradas", "piezas", "interruptores"):
        parser.add_argument(f"--{nombre}")
    args = parser.parse_args()
    for nombre in ("molino", "biblioteca", "jardin"):
        if getattr(args, nombre):
            fondo(getattr(args, nombre), nombre)
    if args.entradas or args.piezas:
        atlas = Image.open(ATLAS).convert("RGBA") if ATLAS.exists() else Image.new("RGBA", (1280, 512), (0, 0, 0, 0))
        if args.entradas:
            for columna, dibujo in enumerate(dibujos(args.entradas, 5)):
                atlas.paste((0, 0, 0, 0), (columna * 256, 0, columna * 256 + 256, 256))
                atlas.alpha_composite(encajar(dibujo, 256, 256, "abajo"), (columna * 256, 0))
        if args.piezas:
            for columna, dibujo in enumerate(dibujos(args.piezas, 5)):
                atlas.paste((0, 0, 0, 0), (columna * 256, 256, columna * 256 + 256, 512))
                atlas.alpha_composite(encajar(dibujo, 256, 256, "centro" if columna == 0 else "arriba"), (columna * 256, 256))
        atlas.save(ATLAS, optimize=True)
        print(ATLAS.name, "listo")
    if args.interruptores:
        atlas = Image.new("RGBA", (768, 192), (0, 0, 0, 0))
        for columna, dibujo in enumerate(dibujos(args.interruptores, 3)):
            atlas.alpha_composite(encajar(dibujo, 256, 192, "abajo"), (columna * 256, 0))
        atlas.save(INTERRUPTORES, optimize=True)
        print(INTERRUPTORES.name, "listo")


if __name__ == "__main__":
    main()
