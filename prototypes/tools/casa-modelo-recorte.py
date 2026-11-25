"""Recorta el arte de un modelo nuevo de los gatitos de la casa (esmoquin, melena o nube; docs/art/casa-modelos-v1.md).

Entrada: la carpeta del modelo con sus siete láminas tal como salen del generador (cualquier extensión):
  gato-andar-sentado, gato-dormir-jugar, gato-cantar-pedir-comer, gato-mimos-bano-sacudirse, gato-pelota-ahora-no,
  gato-arropado y gato-vestidor.
Salida (WebP sin pérdida, en colores clave):
  public/assets/sprites/gato-casa-<modelo>-v1.webp            hoja de 4 × 13 cuadros de 160 × 160, como la del atigrado
  public/assets/sprites/gato-casa-arropado-<modelo>-v1.webp   dos cuadros de la pose arropado
  public/assets/sprites/gato-casa-vestidor-<modelo>-v1.webp   el gatito grande del vestidor en dos cuadros
Imprime las anclas del gatito grande para copiarlas a `casaVestidorArte.ts`.

Hace lo mismo que `casa-recorte.py`, `casa-dormir-recorte.py` y `casa-vestidor-recorte.py` con el atigrado, con las
claves nuevas de puntas y manchas. Como el generador no siempre da los cuadros pedidos, `MODELOS` dice, por lámina,
cuántas piezas trae cada fila y cuáles se quedan.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-modelo-recorte.py MODELO CARPETA
"""
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

AQUI = Path(__file__).resolve().parent


def cargar(nombre, archivo):
    spec = importlib.util.spec_from_file_location(nombre, AQUI / archivo)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


casa = cargar("casa_recorte", "casa-recorte.py")
dormir = cargar("casa_dormir_recorte", "casa-dormir-recorte.py")
vestidor = cargar("casa_vestidor_recorte", "casa-vestidor-recorte.py")
CELDA, PIES = casa.CELDA, casa.PIES
MARCAS = {"puntas": (0xA2, 0x1C, 0xAF), "manchas": (0x00, 0xE5, 0xFF)}

# Por modelo: el alto del gato sentado (el de su referencia, a la escala del atigrado) y, por lámina, las piezas que
# trae cada fila, cuáles se quedan (por índice dentro de la fila) y qué pieza (contando todas en orden) es la sentada
# con que se calibra la escala; sin ella, la última pieza que se queda mide como el andar de la primera lámina.
MODELOS = {
    "melena": {
        "sentado": 138,
        # El generador pintó el cuerpo con el pelo claro: pasa a ser el pelo, para que la paleta le dé su color.
        "cambios": {"pelo-claro": "pelo"},
        "laminas": [
            ("gato-andar-sentado", [4, 3, 1], [[0, 1, 2, 3], [0, 1], [0]], 4),
            ("gato-dormir-jugar", [3, 4], [[0, 2], [1, 2, 3]], None),
            ("gato-cantar-pedir-comer", [2, 2, 3], [[0, 1], [0, 1], [0, 1, 2]], 0),
            ("gato-mimos-bano-sacudirse", [2, 3, 3], [[0, 1], [0, 1], [0, 1, 2]], 0),
            ("gato-pelota-ahora-no", [4, 2], [[0, 1, 2, 3], [0, 1]], 4),
        ],
    },
}


def celda(rgba, pieza, factor):
    img = casa.escalar(casa.recorte(rgba, pieza), factor)
    if img.width > CELDA or img.height > PIES:
        img = casa.escalar(img, min(CELDA / img.width, PIES / img.height))
    x0 = pieza["box"][0]
    pie = (casa.pies(pieza) - x0) * (img.width / (pieza["box"][2] - x0))
    out = Image.new("RGBA", (CELDA, CELDA))
    left = max(0, min(CELDA - img.width, int(round(CELDA / 2 - pie))))
    out.alpha_composite(img, (left, PIES - img.height))
    return casa.sin_raya_bajo_los_pies(casa.a_claves(out))


def hoja(modelo, folder, datos):
    filas_finales = []
    calibre_andar = None
    for nombre, trae, quedan, calibre in datos["laminas"]:
        rgba = casa.sin_rayas_de_suelo(casa.key_out(casa.load(folder, nombre)))
        ordenadas = casa.por_filas(casa.poses(rgba, sum(trae)), trae)
        planas = [p for fila in ordenadas for p in fila]
        if calibre is not None:
            factor = datos["sentado"] / (planas[calibre]["cuerpo"][3] - planas[calibre]["cuerpo"][1])
        else:
            ultima = ordenadas[-1][quedan[-1][-1]]
            factor = calibre_andar / (ultima["cuerpo"][3] - ultima["cuerpo"][1])
        if nombre == "gato-andar-sentado":
            calibre_andar = (planas[0]["cuerpo"][3] - planas[0]["cuerpo"][1]) * factor
        for fila, indices in zip(ordenadas, quedan):
            filas_finales.append([celda(rgba, fila[i], factor) for i in indices])
    if len(filas_finales) != 13:
        raise SystemExit(f"Salen {len(filas_finales)} filas y la hoja tiene 13")
    out = Image.new("RGBA", (CELDA * 4, CELDA * 13))
    for y, fila in enumerate(filas_finales):
        for x, img in enumerate(fila):
            out.alpha_composite(img, (x * CELDA, y * CELDA))
    out.save(casa.SPRITES / f"gato-casa-{modelo}-v1.webp", "WEBP", lossless=True, method=6)
    return [len(f) for f in filas_finales]


def anclas_vestidor(destino):
    """Lazo (sombrero), ojos (gafas) y collar (bufanda) del gatito grande de cada cuadro. El collar de los modelos nuevos
    es una franja fina: se busca solo en sus claves, sin el azul de los ojos."""
    a = np.array(Image.open(casa.SPRITES / destino).convert("RGBA")).astype(int)
    ancho = vestidor.CELDA_GATO[0]

    def es(c, colores):
        m = np.zeros(c.shape[:2], bool)
        for r, g, b in colores:
            m |= (c[..., 0] == r) & (c[..., 1] == g) & (c[..., 2] == b) & (c[..., 3] > 0)
        return m

    resultado = []
    for i in range(2):
        c = a[:, i * ancho:(i + 1) * ancho]
        ys, xs = np.nonzero(es(c, [casa.CLAVES["lazo"]]))
        cabeza = {"x": int(round(xs.mean())), "y": int(round(ys.mean()))}
        collar = es(c, [casa.CLAVES["collar"], casa.CLAVES["collar-sombra"]])
        etiquetas, n = ndimage.label(collar)
        tamaños = ndimage.sum(collar, etiquetas, range(1, n + 1))
        ys, xs = np.nonzero(etiquetas == 1 + int(np.argmax(tamaños)))
        cuello = {"x": int(round(xs.mean())), "y": int(round(ys.mean()))}
        ojos_m = es(c, [casa.CLAVES["ojos"]])
        ojos_m[cuello["y"] - 6:] = False
        etiquetas, n = ndimage.label(ojos_m)
        manchas = sorted(((ndimage.sum(ojos_m, etiquetas, k), *ndimage.center_of_mass(ojos_m, etiquetas, k)) for k in range(1, n + 1)), reverse=True)[:2]
        ojos = None
        if len(manchas) == 2 and min(m[0] for m in manchas) >= 20:
            ojos = {"x": int(round((manchas[0][2] + manchas[1][2]) / 2)), "y": int(round((manchas[0][1] + manchas[1][1]) / 2))}
        resultado.append({"cabeza": cabeza, "ojos": ojos, "cuello": cuello})
    return resultado


def cambiar_claves(destino, cambios):
    """Cambia en la hoja ya guardada cada color clave por otro (por ejemplo, el pelo claro por el pelo)."""
    ruta = casa.SPRITES / destino
    a = np.array(Image.open(ruta).convert("RGBA"))
    for de, a_clave in cambios.items():
        m = (a[..., :3] == casa.CLAVES[de]).all(-1) & (a[..., 3] > 0)
        a[m, :3] = casa.CLAVES[a_clave]
    Image.fromarray(a, "RGBA").save(ruta, "WEBP", lossless=True, method=6)


def ojos_azules(destino, ancho, alto):
    """El generador pinta los ojos de azul marino, que se ajusta a la sombra del collar. En cada cuadro, el collar es la
    mancha más ancha en las claves del collar; las manchas que quedan por encima de él son los ojos y pasan a su clave."""
    ruta = casa.SPRITES / destino
    a = np.array(Image.open(ruta).convert("RGBA"))
    claves = [casa.CLAVES["collar"], casa.CLAVES["collar-sombra"], casa.CLAVES["ojos"]]
    for y0 in range(0, a.shape[0], alto):
        for x0 in range(0, a.shape[1], ancho):
            c = a[y0:y0 + alto, x0:x0 + ancho]
            m = np.zeros(c.shape[:2], bool)
            for clave in claves:
                m |= (c[..., :3] == clave).all(-1) & (c[..., 3] > 0)
            etiquetas, n = ndimage.label(m)
            if n < 2:
                continue
            cajas = ndimage.find_objects(etiquetas)
            collar = max(range(n), key=lambda i: cajas[i][1].stop - cajas[i][1].start)
            arriba = cajas[collar][0].start
            for i, caja in enumerate(cajas):
                if i != collar and caja[0].stop <= arriba + 2:
                    c[etiquetas == i + 1, :3] = casa.CLAVES["ojos"]
    Image.fromarray(a, "RGBA").save(ruta, "WEBP", lossless=True, method=6)


def alto_visible(ruta, ancho):
    a = np.array(Image.open(ruta).convert("RGBA"))[..., :ancho, 3]
    ys = np.nonzero(a.any(axis=1))[0]
    return int(ys.max() - ys.min() + 1)


def main():
    if len(sys.argv) != 3 or sys.argv[1] not in MODELOS:
        raise SystemExit(__doc__)
    modelo, folder = sys.argv[1], Path(sys.argv[2])
    # Cada script cargado tiene su copia de `casa-recorte.py`: las claves de marca van a la de la hoja y a la del vestidor.
    casa.CLAVES.update(MARCAS)
    vestidor.casa.CLAVES.update(MARCAS)
    filas = hoja(modelo, folder, MODELOS[modelo])
    # El arropado, sin las claves de marca (la copia de `dormir` no las tiene): en esa pose no hay puntas y el violeta es
    # de la mantita.
    arropado = dormir.arropado(folder, f"gato-casa-arropado-{modelo}-v1.webp")
    # El gatito grande, al alto del atigrado (sin contar el pelo de más, que sale por los lados).
    alto = alto_visible(casa.SPRITES / "gato-casa-vestidor-v1.webp", vestidor.CELDA_GATO[0])
    destino = f"gato-casa-vestidor-{modelo}-v1.webp"
    vestidor.gatito(folder, destino, alto)
    for hoja_guardada in (f"gato-casa-{modelo}-v1.webp", f"gato-casa-arropado-{modelo}-v1.webp", destino):
        cambiar_claves(hoja_guardada, MODELOS[modelo].get("cambios", {}))
    ojos_azules(f"gato-casa-{modelo}-v1.webp", CELDA, CELDA)
    ojos_azules(destino, *vestidor.CELDA_GATO)
    print(json.dumps({"filas": filas, "arropado": arropado, "vestidor": anclas_vestidor(destino)}, default=float))


if __name__ == "__main__":
    main()
