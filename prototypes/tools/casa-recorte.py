"""Recorta, alinea y exporta el arte de la casa de los gatitos y la roca que asoma de la laguna.

Entrada: una carpeta con las láminas tal como salen del generador, con estos nombres (cualquier extensión):
  gato-referencia, gato-andar-sentado, gato-dormir-jugar, gato-cantar-pedir-comer, gato-mimos-bano-sacudirse,
  gato-pelota-ahora-no, casa-habitacion, casa-ventana-noche, casa-objetos y roca-asoma.
Salida (WebP con transparencia real):
  public/assets/sprites/gato-casa-v1.webp      hoja de 4 × 13 cuadros de 160 × 160 con los colores clave
  public/assets/worlds/casa-habitacion-v1.webp habitación de 1280 × 540
  public/assets/sprites/casa-ventana-noche-v1.webp, casa-objetos-v1.webp y roca-asoma-v1.webp
Imprime las medidas que necesita el juego (ventana de noche, línea de espuma de la roca) para copiarlas al código.

Pasos: quita el verde conectado con el borde y un píxel de halo, quita las rayas de suelo que a veces dibuja el
generador, separa las poses por componentes conexas (pegando notas, corazones y gotas a la pose más cercana), las
ordena por filas, las escala por lámina para que el gato sentado mida 140 px, las alinea por los pies y ajusta cada
píxel al color clave más cercano (dejando la espuma, el blanco y los adornos que quedan lejos de cualquier clave).

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-recorte.py CARPETA_ORIGEN
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
SPRITES = ROOT / "public/assets/sprites"
WORLDS = ROOT / "public/assets/worlds"
QUALITY = 92

CELDA = 160
PIES = 152  # fila de los pies dentro de la celda
SENTADO = 140  # alto del gato sentado

# Colores clave del gato base (docs/art/casa-gato-base-v1.md). El juego los cambia por la paleta de cada gatito.
CLAVES = {
    "pelo": (0xFF, 0x8A, 0x00), "pelo-claro": (0xFF, 0xC2, 0x66), "pelo-oscuro": (0xC2, 0x41, 0x0C), "rayas": (0x7C, 0x2D, 0x12),
    "barriga": (0xFF, 0xF1, 0xD6), "orejas": (0xF9, 0xA8, 0xD4), "ojos": (0x1D, 0x4E, 0xD8), "collar": (0x25, 0x63, 0xEB),
    "collar-sombra": (0x1E, 0x3A, 0x8A), "barro": (0x8B, 0x5A, 0x2B), "lazo": (0xFF, 0xD7, 0x00), "contorno": (0x2F, 0x1D, 0x33),
}
DISTANCIA_CLAVE = 95  # más lejos que esto, el píxel se queda como está (espuma, blanco de los ojos, notas)

# Filas de cada lámina del gato: cuántos cuadros hay en la lámina y cuántos se quedan, y qué cuadro es el de calibrar.
# Cuadros que se descartan por salir mal (lámina, fila, índice): en «jugar solo», el de espaldas salió casi negro.
DESCARTES = {("gato-dormir-jugar", 1, 2)}
LAMINAS_GATO = [
    ("gato-andar-sentado", [(4, 4), (2, 2), (1, 1)], 4),
    ("gato-dormir-jugar", [(2, 2), (4, 3)], None),
    ("gato-cantar-pedir-comer", [(2, 2), (2, 2), (3, 3)], 0),
    ("gato-mimos-bano-sacudirse", [(2, 2), (3, 2), (3, 3)], 0),
    ("gato-pelota-ahora-no", [(4, 4), (3, 2)], 5),
]


def load(folder, stem):
    for path in sorted(folder.glob(f"{stem}.*")):
        if path.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"):
            return Image.open(path).convert("RGB")
    raise SystemExit(f"Falta {stem} en {folder}")


def key_out(img):
    """RGBA sin el verde del fondo: el verde conectado con el borde y el verde puro encerrado, menos un píxel de halo."""
    hsv = np.array(img.convert("HSV")).astype(int)
    hue, sat, val = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    green = (hue >= 70) & (hue <= 170) & (sat > 0.35) & (val > 0.25)
    labels, _ = ndimage.label(green)
    edge = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    background = np.isin(labels, list(edge))
    pure = (hue >= 90) & (hue <= 140) & (sat > 0.7) & (val > 0.7)
    alpha = ~(background | pure)
    alpha = ndimage.binary_erosion(alpha, structure=ndimage.generate_binary_structure(2, 1))
    alpha = ndimage.binary_opening(alpha, iterations=1)
    return np.dstack([np.array(img), (alpha * 255).astype(np.uint8)])


def sin_rayas_de_suelo(rgba):
    """Quita las líneas finas y largas que el generador dibuja como suelo bajo los gatos."""
    mask = rgba[..., 3] > 0
    labels, _ = ndimage.label(mask)
    for index, box in enumerate(ndimage.find_objects(labels), start=1):
        alto, ancho = box[0].stop - box[0].start, box[1].stop - box[1].start
        if alto <= 14 and ancho >= 60:
            rgba[..., 3][labels == index] = 0
    return rgba


def poses(rgba, total, min_area=6000):
    """Las `total` piezas grandes, con las pequeñas (notas, gotas, corazones, zetas) pegadas a la más cercana."""
    mask = rgba[..., 3] > 0
    labels, _ = ndimage.label(mask)
    items = []
    for index, box in enumerate(ndimage.find_objects(labels), start=1):
        area = int((labels[box] == index).sum())
        items.append({"id": index, "box": (box[1].start, box[0].start, box[1].stop, box[0].stop), "area": area})
    big = sorted([it for it in items if it["area"] >= min_area], key=lambda it: -it["area"])[:total]
    if len(big) != total:
        raise SystemExit(f"Se esperaban {total} poses y hay {len(big)}")
    small = [it for it in items if it not in big and it["area"] >= 30]
    members = {it["id"]: [it["id"]] for it in big}
    centro = lambda b: ((b[0] + b[2]) / 2, (b[1] + b[3]) / 2)
    for it in small:
        cx, cy = centro(it["box"])
        def distancia(b):
            x0, y0, x1, y1 = b["box"]
            return np.hypot(max(x0 - cx, 0, cx - x1), max(y0 - cy, 0, cy - y1))
        cercana = min(big, key=distancia)
        if distancia(cercana) < 120:
            members[cercana["id"]].append(it["id"])
    out = []
    for it in big:
        m = np.isin(labels, members[it["id"]])
        ys, xs = np.nonzero(m)
        out.append({"mask": m, "box": (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1), "cuerpo": it["box"]})
    return out


def por_filas(piezas, filas):
    """Ordena las piezas en filas (de arriba abajo) y cada fila de izquierda a derecha."""
    piezas = sorted(piezas, key=lambda p: (p["cuerpo"][1] + p["cuerpo"][3]) / 2)
    resultado, inicio = [], 0
    for cuantos in filas:
        fila = sorted(piezas[inicio:inicio + cuantos], key=lambda p: p["cuerpo"][0])
        resultado.append(fila)
        inicio += cuantos
    return resultado


def recorte(rgba, pieza):
    x0, y0, x1, y1 = pieza["box"]
    sub = rgba[y0:y1, x0:x1].copy()
    sub[..., 3] = np.where(pieza["mask"][y0:y1, x0:x1], sub[..., 3], 0)
    return Image.fromarray(sub, "RGBA")


def escalar(img, factor):
    size = (max(1, round(img.width * factor)), max(1, round(img.height * factor)))
    return img.convert("RGBa").resize(size, Image.LANCZOS).convert("RGBA")


def pies(pieza):
    x0, y0, x1, y1 = pieza["cuerpo"]
    banda = pieza["mask"][max(y0, y1 - max(8, (y1 - y0) // 8)):y1, x0:x1]
    xs = np.nonzero(banda)[1]
    return x0 + float(xs.mean()) if len(xs) else (x0 + x1) / 2


def a_claves(img):
    """Ajusta cada píxel opaco al color clave más cercano, si está cerca; el alfa queda en 0 o 255."""
    a = np.array(img).astype(int)
    rgb, alpha = a[..., :3], a[..., 3]
    claves = np.array(list(CLAVES.values()))
    dist = np.sqrt(((rgb[..., None, :] - claves[None, None]) ** 2).sum(-1))
    cerca = dist.argmin(-1)
    dmin = dist.min(-1)
    nuevo = np.where((dmin < DISTANCIA_CLAVE)[..., None], claves[cerca], rgb)
    opaco = alpha >= 128
    out = np.dstack([nuevo, np.where(opaco, 255, 0)]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def sin_raya_bajo_los_pies(img):
    """Borra la raya de «suelo» que cruza la celda bajo los pies: tramos de al menos 10 px, de 1 a 4 px de grueso,
    sin nada en los 4 px de encima (las patas sí tienen cuerpo encima)."""
    a = np.array(img)
    opaco = a[..., 3] > 0
    borrar = np.zeros_like(opaco)
    for y in range(PIES - 14, CELDA):
        aislado = opaco[y] & ~opaco[max(0, y - 4):y].any(axis=0)
        x = 0
        while x < CELDA:
            if not aislado[x]:
                x += 1
                continue
            inicio = x
            while x < CELDA and aislado[x]:
                x += 1
            if x - inicio >= 10:
                borrar[y:min(CELDA, y + 4), inicio:x] = True
    a[..., 3] = np.where(borrar, 0, a[..., 3])
    # Motas que quedan sueltas en la franja de los pies.
    labels, _ = ndimage.label(a[..., 3] > 0)
    for index, box in enumerate(ndimage.find_objects(labels), start=1):
        if box[0].start >= PIES - 14 and (labels[box] == index).sum() < 40:
            a[..., 3][labels == index] = 0
    return Image.fromarray(a, "RGBA")


def hoja_del_gato(folder):
    filas_finales = []
    calibre_andar = None
    for nombre, filas, calibre in LAMINAS_GATO:
        rgba = sin_rayas_de_suelo(key_out(load(folder, nombre)))
        total = sum(hay for hay, _ in filas)
        piezas = poses(rgba, total)
        ordenadas = por_filas(piezas, [hay for hay, _ in filas])
        planas = [p for fila in ordenadas for p in fila]
        if calibre is not None:
            alto = planas[calibre]["cuerpo"][3] - planas[calibre]["cuerpo"][1]
            factor = SENTADO / alto
        else:
            # Sin gato sentado: el último cuadro de jugar solo, de pie, mide como el andar de la primera lámina.
            alto = planas[-1]["cuerpo"][3] - planas[-1]["cuerpo"][1]
            factor = calibre_andar / alto
        if nombre == "gato-andar-sentado":
            andar = planas[0]["cuerpo"][3] - planas[0]["cuerpo"][1]
            calibre_andar = andar * factor
        for numero, (fila, (hay, quedan)) in enumerate(zip(ordenadas, filas)):
            fila = [p for i, p in enumerate(fila) if (nombre, numero, i) not in DESCARTES]
            elegidos = fila[:quedan] if nombre != "gato-pelota-ahora-no" else fila[len(fila) - quedan:]
            celdas = []
            for pieza in elegidos:
                img = escalar(recorte(rgba, pieza), factor)
                if img.width > CELDA or img.height > PIES:
                    img = escalar(img, min(CELDA / img.width, PIES / img.height))
                x0 = pieza["box"][0]
                pie = (pies(pieza) - x0) * (img.width / (pieza["box"][2] - x0))
                celda = Image.new("RGBA", (CELDA, CELDA))
                left = int(round(CELDA / 2 - pie))
                left = max(0, min(CELDA - img.width, left))
                celda.alpha_composite(img, (left, PIES - img.height))
                celdas.append(sin_raya_bajo_los_pies(a_claves(celda)))
            filas_finales.append(celdas)
    hoja = Image.new("RGBA", (CELDA * 4, CELDA * len(filas_finales)))
    for y, fila in enumerate(filas_finales):
        for x, celda in enumerate(fila):
            hoja.alpha_composite(celda, (x * CELDA, y * CELDA))
    hoja.save(SPRITES / "gato-casa-v1.webp", "WEBP", lossless=True, method=6)  # colores clave planos: sin pérdida, para que el cambio de paleta los encuentre
    return [len(f) for f in filas_finales]


def habitacion(folder):
    img = load(folder, "casa-habitacion")
    a = np.array(img).astype(int)
    # Abajo trae una banda oscura: se corta donde el suelo deja de ser madera clara.
    brillo = a.mean(axis=(1, 2))
    filas_claras = np.nonzero(brillo > 90)[0]
    abajo = int(filas_claras.max()) + 1
    alto = round(img.width * 540 / 1280)
    arriba = max(0, abajo - alto)
    recortada = img.crop((0, arriba, img.width, abajo)).resize((1280, 540), Image.LANCZOS)
    recortada.save(WORLDS / "casa-habitacion-v1.webp", "WEBP", quality=QUALITY, method=6)
    return {"recorte": [0, arriba, img.width, abajo], "factor": 1280 / img.width}


def ventana_noche(folder):
    rgba = key_out(load(folder, "casa-ventana-noche"))
    ys, xs = np.nonzero(rgba[..., 3])
    img = Image.fromarray(rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1], "RGBA")
    img.save(SPRITES / "casa-ventana-noche-v1.webp", "WEBP", quality=QUALITY, method=6)
    return {"ancho": img.width, "alto": img.height}


def objetos(folder):
    img = load(folder, "casa-objetos")
    a = np.array(img).astype(int)
    # Bajo la fila de objetos el generador dejó parte de la habitación: se usa solo la franja verde de arriba.
    hsv = np.array(img.convert("HSV")).astype(int)
    verde_fila = ((hsv[..., 0] * 360 / 255 > 70) & (hsv[..., 0] * 360 / 255 < 170) & (hsv[..., 1] > 90)).mean(axis=1)
    corte = int(np.nonzero(verde_fila < 0.5)[0][len(verde_fila) // 8:].min()) if (verde_fila < 0.5).any() else img.height
    # Busca la última fila «mayoritariamente verde» por debajo de los objetos.
    filas = np.nonzero(verde_fila > 0.6)[0]
    huecos = np.nonzero(np.diff(filas) > 1)[0]
    if len(huecos):
        corte = int(filas[huecos[0] + 1])  # primera franja verde por debajo de los objetos
    rgba = key_out(img.crop((0, 0, img.width, corte)))
    piezas = poses(rgba, 7, min_area=4000)
    piezas.sort(key=lambda p: p["cuerpo"][0])
    lado = 128
    hoja = Image.new("RGBA", (lado * 7, lado))
    for i, pieza in enumerate(piezas):
        pieza_img = recorte(rgba, pieza)
        pieza_img = escalar(pieza_img, min((lado - 8) / pieza_img.width, (lado - 8) / pieza_img.height))
        hoja.alpha_composite(pieza_img, (i * lado + (lado - pieza_img.width) // 2, (lado - pieza_img.height) // 2))
    hoja.save(SPRITES / "casa-objetos-v1.webp", "WEBP", quality=QUALITY, method=6)
    return {"celda": lado, "orden": ["cuenco", "cuenco-vacio", "pelota", "esponja", "escoba", "huella", "huella-2"], "corte": corte}


def roca(folder):
    rgba = key_out(load(folder, "roca-asoma"))
    piezas = sorted(poses(rgba, 2, min_area=20000), key=lambda p: p["cuerpo"][1])
    cima, cuerpo = [recorte(rgba, p) for p in piezas]
    ancho = 180
    cima = escalar(cima, ancho / cima.width)
    cuerpo = escalar(cuerpo, ancho / cuerpo.width)
    # La espuma es la fila con más blanco de la cima.
    c = np.array(cima).astype(int)
    blanco = ((c[..., :3].min(-1) > 200) & (c[..., 3] > 0)).sum(axis=1)
    espuma = int(blanco.argmax())
    hoja = Image.new("RGBA", (ancho, cima.height + cuerpo.height))
    hoja.alpha_composite(cima, (0, 0))
    hoja.alpha_composite(cuerpo, (0, cima.height))
    hoja.save(SPRITES / "roca-asoma-v1.webp", "WEBP", quality=QUALITY, method=6)
    return {"ancho": ancho, "altoCima": cima.height, "espuma": espuma, "altoCuerpo": cuerpo.height}


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1])
    medidas = {
        "gato": hoja_del_gato(folder),
        "habitacion": habitacion(folder),
        "ventanaNoche": ventana_noche(folder),
        "objetos": objetos(folder),
        "roca": roca(folder),
    }
    print(json.dumps(medidas, indent=2, default=int))


if __name__ == "__main__":
    main()
