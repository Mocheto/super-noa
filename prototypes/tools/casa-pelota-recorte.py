"""Recorta el arte de jugar con la pelota en la casa (docs/art/casa-pelota-v1.md).

Entrada: la carpeta con `pelota` y, por modelo, `<modelo>-carrera` y `<modelo>-juego` (cualquier extensión).
Salida (WebP sin pérdida):
  public/assets/sprites/casa-pelota-v1.webp              la pelota, 128 × 128
  public/assets/sprites/gato-casa-pelota-<modelo>-v1.webp  4 × 2 cuadros de 160 × 160 en colores clave: la carrera
      (recogido, impulso, estirado, caída) y el juego (zarpa arriba, zarpa abajo, abrazo y abrazo riendo)

En las láminas de juego el generador dibuja a veces el hueco de la pelota como un círculo de trazo fino (y rayitas de
movimiento): se borra todo lo más fino que un trazo del gato. En el abrazo, el centro del hueco (`HUECOS`, medido a
ojo en cada lámina) va siempre al mismo punto del cuadro, que es donde el juego pone la pelota.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-pelota-recorte.py CARPETA
Después, `casa-gato-anclas.py` para las anclas de los accesorios.
"""
import importlib.util
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


modelos = cargar("casa_modelo_recorte", "casa-modelo-recorte.py")
casa = modelos.casa
CELDA, PIES = casa.CELDA, casa.PIES
MODELOS = ["atigrado", "esmoquin", "melena", "nube"]
# Columna del cuadro donde cae el centro del hueco del abrazo (`ABRAZO` en `casaPelota.ts`).
ABRAZO_X = 96
# Centro del hueco de la pelota en los dos abrazos de cada lámina de juego (px de la lámina de 1408 × 768).
HUECOS = {
    "atigrado": [(882, 372), (1222, 372)],
    "esmoquin": [(903, 357), (1245, 357)],
    "melena": [(900, 318), (1242, 318)],
    "nube": [(868, 390), (1190, 390)],
}
# El abrazo riendo de la nube sale con la cabeza a la derecha: se le da la vuelta (el hueco ya va medido de la lámina).
ESPEJO = {("nube", 3)}
# En la lámina de juego, las piezas más pequeñas que esto (px) son motas, no parte del gato.
MOTA = 1500
# Un ojo no pasa de esto en el cuadro (px); lo azul mayor es el pañuelo o el collar.
OJO_MAXIMO = 21


def sin_trazos_finos(rgba):
    """Quita el círculo del hueco, las rayitas y los puntos sueltos: lo que no aguanta una apertura."""
    alfa = rgba[..., 3] > 0
    gruesa = ndimage.binary_opening(alfa, iterations=4)
    rgba[..., 3] = np.where(ndimage.binary_dilation(gruesa, iterations=3, mask=alfa), rgba[..., 3], 0)
    return rgba


def laminas(folder, nombre):
    rgba = sin_trazos_finos(casa.sin_rayas_de_suelo(casa.key_out(casa.load(folder, nombre))))
    if nombre.endswith("juego"):
        etiquetas, n = ndimage.label(rgba[..., 3] > 0)
        areas = ndimage.sum(np.ones_like(etiquetas), etiquetas, range(1, n + 1))
        rgba[..., 3][np.isin(etiquetas, 1 + np.nonzero(areas < MOTA)[0])] = 0
    # En fila o, si la lámina salió alta, en columna.
    eje = 0 if rgba.shape[1] >= rgba.shape[0] else 1
    piezas = sorted(casa.poses(rgba, 4), key=lambda p: p["cuerpo"][eje])
    return rgba, piezas


def alto(pieza):
    return pieza["cuerpo"][3] - pieza["cuerpo"][1]


def celda(rgba, pieza, factor, hueco=None, espejo=False):
    img = casa.escalar(casa.recorte(rgba, pieza), factor)
    x0, y0, x1, _ = pieza["box"]
    if espejo:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
        hueco = (x0 + x1 - hueco[0], hueco[1])
    if hueco:
        izquierda = int(round(ABRAZO_X - (hueco[0] - x0) * factor))
    else:
        izquierda = int(round(CELDA / 2 - (casa.pies(pieza) - x0) * factor))
    izquierda = max(0, min(CELDA - img.width, izquierda))
    out = Image.new("RGBA", (CELDA, CELDA))
    out.alpha_composite(img, (izquierda, PIES - img.height))
    medida = None
    if hueco:
        medida = (izquierda + (hueco[0] - x0) * factor, PIES - img.height + (hueco[1] - y0) * factor)
    return casa.a_claves(out), medida


def azules(destino):
    """El generador mezcla el azul de los ojos y el del collar. En cada cuadro, lo azul grande (el pañuelo o el collar, y
    lo que lo toca) pasa a las claves del collar y las manchas pequeñas sueltas, los ojos, a la suya."""
    ruta = casa.SPRITES / destino
    a = np.array(Image.open(ruta).convert("RGBA"))
    ojos, collar, sombra = (casa.CLAVES[c] for c in ("ojos", "collar", "collar-sombra"))
    for y0 in range(0, a.shape[0], CELDA):
        for x0 in range(0, a.shape[1], CELDA):
            c = a[y0:y0 + CELDA, x0:x0 + CELDA]
            es = lambda clave: (c[..., :3] == clave).all(-1) & (c[..., 3] > 0)
            azul = es(ojos) | es(collar) | es(sombra)
            etiquetas, n = ndimage.label(azul, structure=np.ones((3, 3)))
            if not n:
                continue
            cajas = ndimage.find_objects(etiquetas)
            grandes = []
            for i, (v, h) in enumerate(cajas):
                menor, mayor = sorted((v.stop - v.start, h.stop - h.start))
                # Una banda alargada también es collar, aunque sea corta (motas de pocos píxeles, no).
                if mayor > OJO_MAXIMO or (mayor >= 9 and menor / mayor < 0.45):
                    grandes.append(i)
            cerca = ndimage.binary_dilation(np.isin(etiquetas, [i + 1 for i in grandes]), iterations=3)
            es_ojos = es(ojos)
            # Panza arriba el tamaño no distingue: los ojos abiertos son las dos manchas más altas; riendo, no hay.
            if y0 == CELDA and x0 >= 2 * CELDA:
                validas = [i for i in range(n) if (etiquetas == i + 1).sum() >= 8]
                altas = sorted(validas, key=lambda i: cajas[i][0].start + cajas[i][0].stop)[:2 if x0 == 2 * CELDA else 0]
                for i in range(n):
                    c[etiquetas == i + 1, :3] = ojos if i in altas else collar
                continue
            for i in range(n):
                blob = etiquetas == i + 1
                if (blob & cerca).any():
                    c[blob & es_ojos, :3] = collar
                else:
                    c[blob, :3] = ojos
    Image.fromarray(a, "RGBA").save(ruta, "WEBP", lossless=True, method=6)


def alto_de(ruta, fila, columna):
    a = np.array(Image.open(ruta).convert("RGBA"))[fila * CELDA:(fila + 1) * CELDA, columna * CELDA:(columna + 1) * CELDA, 3]
    ys = np.nonzero(a.any(axis=1))[0]
    return int(ys.max() - ys.min() + 1)


def hoja(modelo, folder):
    base = casa.SPRITES / ("gato-casa-v1.webp" if modelo == "atigrado" else f"gato-casa-{modelo}-v1.webp")
    # La carrera mide como el andar de su hoja y el juego como el sentado; ninguna pose se sale del cuadro.
    out = Image.new("RGBA", (CELDA * 4, CELDA * 2))
    huecos = []
    for fila, (tipo, referencia, guia) in enumerate([("carrera", alto_de(base, 0, 0), 3), ("juego", alto_de(base, 1, 0), 0)]):
        rgba, piezas = laminas(folder, f"{modelo}-{tipo}")
        factor = referencia / alto(piezas[guia])
        factor = min([factor] + [min(CELDA / (p["box"][2] - p["box"][0]), PIES / (p["box"][3] - p["box"][1])) for p in piezas])
        for columna, pieza in enumerate(piezas):
            hueco = HUECOS[modelo][columna - 2] if tipo == "juego" and columna >= 2 else None
            img, medida = celda(rgba, pieza, factor, hueco, (modelo, columna) in ESPEJO and tipo == "juego")
            if medida:
                huecos.append(medida)
            out.alpha_composite(img, (columna * CELDA, fila * CELDA))
    destino = f"gato-casa-pelota-{modelo}-v1.webp"
    out.save(casa.SPRITES / destino, "WEBP", lossless=True, method=6)
    modelos.cambiar_claves(destino, modelos.MODELOS.get(modelo, {}).get("cambios", {}))
    azules(destino)
    return [(round(x), round(PIES - y)) for x, y in huecos]


def pelota(folder):
    rgba = casa.key_out(casa.load(folder, "pelota"))
    pieza = casa.poses(rgba, 1)[0]
    img = casa.recorte(rgba, pieza)
    img = casa.escalar(img, 120 / max(img.size))
    out = Image.new("RGBA", (128, 128))
    out.alpha_composite(img, ((128 - img.width) // 2, (128 - img.height) // 2))
    out.save(casa.SPRITES / "casa-pelota-v1.webp", "WEBP", lossless=True, method=6)


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1])
    casa.CLAVES.update(modelos.MARCAS)
    pelota(folder)
    for modelo in MODELOS:
        print(modelo, "hueco (columna, alto sobre los pies):", hoja(modelo, folder))


if __name__ == "__main__":
    main()
