"""Recorta el arte del escondite del mueble de la pecera (docs/art/casa-escondite-v1.md).

Entrada: las tres láminas tal como salen del generador (2000 × 496, sobre verde): dentro, puerta y colas.
Salidas (WebP sin pérdida) en public/assets/sprites/:

- casa-escondite-dentro-v1.webp: el interior del mueble, 320 × 84 (el hueco de `PECERA.puertas`).
- casa-escondite-puertas-v1.webp: una capa de 412 × 354 (la del mueble) con las dos puertas abiertas en su sitio, para
  que se recolore con la misma regla que el mueble. La derecha es la izquierda en espejo.
- casa-escondite-colas-v1.webp: las cuatro colas (atigrado, esmoquin, melena, nube) en celdas de 60 × 48, en colores
  clave, con el corte de arriba centrado en x = 17.

Los recortes de `dentro` y `puerta` son medidas de las láminas generadas: si se regeneran, hay que revisarlas.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-escondite-recorte.py --origen ../super-noa-arte-original/casa-escondite-v1
"""
import argparse
import importlib.util
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps
from scipy import ndimage

AQUI = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("casa_recorte", AQUI / "casa-recorte.py")
casa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(casa)

# El hueco y las puertas en el dibujo de la pecera (`PECERA.puertas`).
ANCHO, ALTO = 412, 354
IZQUIERDA, DERECHA, ARRIBA, ABAJO = 46, 366, 240, 324

# Lámina «dentro»: el rectángulo del interior, sin las puertas oscuras que el generador añadió a los lados.
DENTRO = (250, 62, 1792, 428)
# Lámina «puerta»: las esquinas de la hoja (arriba izq., arriba dcha., abajo dcha., abajo izq.), con el borde de las
# bisagras a la derecha; a su derecha sobra un trozo de mueble.
PUERTA = [(697, 52), (1215, 110), (1215, 388), (697, 455)]
FIN_BISAGRAS = 1219
# Cómo queda en el dibujo: ancho de la hoja abierta, alto del borde libre y margen para el pomo.
HOJA_ANCHO, LIBRE_ALTO, POMO = 44, 100, 4

# Los colores clave del gato base y las dos marcas de los modelos nuevos (docs/art/casa-modelos-v1.md).
CLAVES = {**casa.CLAVES, "puntas": (0xA2, 0x1C, 0xAF), "manchas": (0x00, 0xE5, 0xFF)}
CELDA_COLA = (60, 48)
RAIZ_X = 17


def guardar(img, nombre):
    img.save(casa.SPRITES / nombre, "WEBP", lossless=True, quality=100, method=6)
    print(nombre, img.size)


def dentro(folder):
    img = casa.load(folder, "dentro").crop(DENTRO)
    guardar(img.resize((DERECHA - IZQUIERDA, ABAJO - ARRIBA), Image.LANCZOS).convert("RGBA"), "casa-escondite-dentro-v1.webp")


def homografia(salida, entrada):
    """Coeficientes de `Image.transform` (PERSPECTIVE): de cada punto de la salida al de la entrada."""
    a, b = [], []
    for (x, y), (u, v) in zip(salida, entrada):
        a.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        a.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        b += [u, v]
    return np.linalg.solve(np.array(a, float), np.array(b, float))


def puertas(folder):
    rgba = np.array(casa.key_out(casa.load(folder, "puerta")))
    rgba[:, FIN_BISAGRAS:, 3] = 0
    k = 8  # se dibuja grande y se reduce, para que no salga con dientes
    ancho, alto = POMO + HOJA_ANCHO, LIBRE_ALTO
    margen = (LIBRE_ALTO - (ABAJO - ARRIBA)) / 2
    destino = [(POMO, 0), (ancho, margen), (ancho, alto - margen), (POMO, alto)]
    coef = homografia([(x * k, y * k) for x, y in destino], PUERTA)
    grande = Image.fromarray(rgba, "RGBA").transform((ancho * k, alto * k), Image.PERSPECTIVE, tuple(coef), Image.BICUBIC)
    hoja = np.array(grande.resize((ancho, alto), Image.LANCZOS))
    hoja[..., 3] = np.where(hoja[..., 3] > 127, 255, 0)
    hoja = Image.fromarray(hoja, "RGBA")
    capa = Image.new("RGBA", (ANCHO, ALTO))
    arriba = ARRIBA - round(margen)
    # La bisagra de la izquierda cae sobre el borde izquierdo del hueco; la derecha, en espejo.
    izquierda = IZQUIERDA - ancho
    capa.paste(hoja.crop((max(0, -izquierda), 0, ancho, alto)), (max(0, izquierda), arriba))
    espejo = ImageOps.mirror(hoja)
    capa.paste(espejo.crop((0, 0, min(ancho, ANCHO - DERECHA), alto)), (DERECHA, arriba))
    guardar(capa, "casa-escondite-puertas-v1.webp")


def a_indices(rgba):
    """Cada píxel, el índice de su color clave más cercano (0: transparente)."""
    claves = np.array(list(CLAVES.values()))
    dist = ((rgba[..., None, :3].astype(int) - claves[None, None]) ** 2).sum(-1)
    return np.where(rgba[..., 3] > 127, dist.argmin(-1) + 1, 0)


def reducir_indices(indices, ancho, alto):
    """Reduce eligiendo en cada píxel el color que más hay en su bloque (así no salen colores intermedios)."""
    colores = len(CLAVES) + 1
    votos = np.stack([np.array(Image.fromarray(((indices == i) * 255).astype(np.uint8)).resize((ancho, alto), Image.BOX), float)
                      for i in range(colores)])
    contorno = list(CLAVES).index("contorno") + 1
    votos[contorno] *= 2  # el contorno es fino: que no se pierda
    return votos.argmax(0)


def colas(folder):
    img = casa.key_out(casa.load(folder, "colas"))
    a = np.array(img)
    etiquetas, n = ndimage.label(a[..., 3] > 127)
    cajas = [(sl[1].start, sl[0].start, sl[1].stop, sl[0].stop) for i, sl in enumerate(ndimage.find_objects(etiquetas), 1)
             if (etiquetas[sl] == i).sum() > 2000]
    cajas.sort()
    if len(cajas) != 4:
        raise SystemExit(f"Salen {len(cajas)} colas y son 4")
    nombres = list(CLAVES)
    indice = {nombre: i + 1 for i, nombre in enumerate(nombres)}
    paleta = np.array([(0, 0, 0, 0)] + [(*c, 255) for c in CLAVES.values()], np.uint8)
    # Todas a la misma escala: la más alta llena la celda.
    escala = CELDA_COLA[1] / max(y1 - y0 for _, y0, _, y1 in cajas)
    hoja = Image.new("RGBA", (CELDA_COLA[0] * 4, CELDA_COLA[1]))
    for celda, (x0, y0, x1, y1) in enumerate(cajas):
        indices = a_indices(a[y0:y1, x0:x1])
        # El barro es solo la manchita redonda: los píxeles marrones de los bordes de las rayas son rayas.
        marron, cuantas = ndimage.label(indices == indice["barro"])
        if cuantas:
            tallas = ndimage.sum(marron > 0, marron, range(1, cuantas + 1))
            indices[(marron > 0) & (marron != 1 + int(np.argmax(tallas)))] = indice["rayas"]
        # Como en las hojas de la melena, su cuerpo salió con el pelo claro: pasa a ser el pelo.
        if celda == 2:
            indices[indices == indice["pelo-claro"]] = indice["pelo"]
        # En la nube la manchita cae sobre una bola de barriga: sin barro se vería un lunar del color del pelo. Se quita.
        if celda == 3:
            indices[indices == indice["barro"]] = indice["barriga"]
        pequeno = reducir_indices(indices, max(1, round((x1 - x0) * escala)), max(1, round((y1 - y0) * escala)))
        # El contorno, cerrado: todo píxel del borde (salvo el corte de arriba) va en su color.
        opaco = pequeno > 0
        rodeado = np.pad(opaco, 1)
        rodeado[0] = rodeado[1]
        borde = opaco & ~ndimage.binary_erosion(rodeado, border_value=0)[1:-1, 1:-1]
        pequeno[borde] = indice["contorno"]
        pieza = Image.fromarray(paleta[pequeno], "RGBA")
        # El corte plano de arriba, centrado en RAIZ_X.
        corte = np.nonzero(np.array(pieza)[1, :, 3])[0]
        izquierda = RAIZ_X - round((corte.min() + corte.max()) / 2)
        if izquierda < 0 or izquierda + pieza.width > CELDA_COLA[0]:
            raise SystemExit(f"La cola {celda + 1} no cabe en su celda ({izquierda}, {pieza.width})")
        hoja.alpha_composite(pieza, (celda * CELDA_COLA[0] + izquierda, 0))
    guardar(hoja, "casa-escondite-colas-v1.webp")


if __name__ == "__main__":
    args = argparse.ArgumentParser()
    args.add_argument("--origen", type=Path, required=True)
    folder = args.parse_args().origen
    dentro(folder)
    puertas(folder)
    colas(folder)
