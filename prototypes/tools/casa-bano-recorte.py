"""Recorta y exporta el arte de la pantalla de baño de la casa de los gatitos (docs/art/casa-bano-v1.md).

Entrada: una carpeta con las cuatro láminas tal como salen del generador (cualquier extensión):
  casa-bano-fondo, casa-banera, casa-bano-utensilios y casa-bano-efectos.
Salida (WebP):
  public/assets/worlds/casa-bano-v1.webp            fondo de 960 × 720 (4:3)
  public/assets/sprites/casa-banera-atras-v1.webp   la bañera entera y...
  public/assets/sprites/casa-banera-delante-v1.webp ...su parte de delante (de dentro del agua para abajo), del mismo tamaño
  public/assets/sprites/casa-bano-utensilios-v1.webp cuatro celdas: alcachofa, jabón, secador y peine
  public/assets/sprites/casa-bano-efectos-v1.webp   cuatro filas de cuatro celdas: espuma (4), agua, aire y brillos (3)
Imprime las medidas que necesita el juego.

- El fondo salió apaisado (16:9): se pasa a 4:3 quitando cinco columnas de azulejos de la pared (dos entre la balda y
  la ventana y tres entre la ventana y el espejo), cortando por las juntas para que no se note.
- Los utensilios salieron dos veces y la fila de arriba cortada: se usa la de abajo.
- Los efectos salieron con sus nombres a la izquierda y un marco en cada celda: se usan los marcos para encontrar
  las celdas y se recorta lo de dentro.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-bano-recorte.py CARPETA_ORIGEN
"""
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

_spec = importlib.util.spec_from_file_location("casa_recorte", Path(__file__).with_name("casa-recorte.py"))
casa = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(casa)
key_out, poses, recorte, escalar, load = casa.key_out, casa.poses, casa.recorte, casa.escalar, casa.load
SPRITES, WORLDS, QUALITY = casa.SPRITES, casa.WORLDS, casa.QUALITY


def recortar_a_lo_visible(img):
    ys, xs = np.nonzero(np.array(img)[..., 3])
    return img.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def juntas_verticales(a, fila):
    """Columnas centrales de las juntas oscuras de los azulejos en una fila de la imagen."""
    brillo = a[fila].sum(1)
    oscuras = np.nonzero(brillo < brillo.max() - 90)[0]
    grupos = np.split(oscuras, np.nonzero(np.diff(oscuras) > 1)[0] + 1)
    return [int(g.mean()) for g in grupos if len(g) and len(g) < 12]


def fondo(folder):
    img = load(folder, "casa-bano-fondo")
    a = np.array(img).astype(int)
    # Marco oscuro alrededor: se quita.
    borde = 9
    juntas = [x for x in juntas_verticales(a, 580) if borde < x < img.width - borde]
    # Dos azulejos entre la balda (acaba hacia 0,28 del ancho) y la ventana, y tres entre la ventana y el espejo.
    def corte(desde, cuantos):
        i = next(i for i, x in enumerate(juntas) if x > desde * img.width)
        return juntas[i], juntas[i + cuantos]
    cortes = [corte(0.28, 2), corte(0.6, 3)]
    columnas = np.ones(img.width, bool)
    columnas[:borde] = columnas[img.width - borde:] = False
    for x0, x1 in cortes:
        columnas[x0:x1] = False
    b = np.array(img)[borde:img.height - borde][:, columnas]
    final = Image.fromarray(b).resize((960, 720), Image.LANCZOS)
    final.save(WORLDS / "casa-bano-v1.webp", "WEBP", quality=QUALITY, method=6)
    # Fila del suelo (empieza la madera) en el fondo final.
    suelo_fuente = int(np.nonzero(np.abs(a[:, img.width // 2] - [249, 201, 135]).sum(1) < 60)[0].min())
    return {"cortes": cortes, "suelo": round((suelo_fuente - borde) * 720 / (img.height - 2 * borde))}


def banera(folder):
    """Una sola bañera entera, cortada en dos capas del mismo tamaño: atrás, la bañera entera; delante, de la línea de
    corte para abajo. La línea va por dentro del agua (al 60 % de su alto en cada columna), así el gatito que se pone
    entre las dos capas queda metido en el agua y tapado por el borde delantero, que es uno solo."""
    rgba = key_out(load(folder, "casa-banera"))
    (pieza,) = poses(rgba, 1, min_area=40000)
    img = recortar_a_lo_visible(recorte(rgba, pieza))
    a = np.array(img).astype(int)
    agua = (a[..., 2] > a[..., 0] + 40) & (a[..., 3] > 0)
    columnas = np.nonzero(agua.sum(0) > 4)[0]
    corte = np.full(img.width, 0, int)
    for x in columnas:
        ys = np.nonzero(agua[:, x])[0]
        corte[x] = int(ys.min() + 0.6 * (ys.max() - ys.min()))
    # Fuera del agua (los lados del borde) la línea sigue la del agua más cercana: ahí nunca hay gatito detrás.
    for x in range(img.width):
        if x < columnas.min():
            corte[x] = corte[columnas.min()]
        elif x > columnas.max():
            corte[x] = corte[columnas.max()]
    filas = np.arange(img.height)[:, None]
    delante = a.copy()
    delante[..., 3] = np.where(filas >= corte[None, :], a[..., 3], 0)
    factor = 640 / img.width
    capa_a = escalar(img, factor)
    capa_d = escalar(Image.fromarray(delante.astype(np.uint8), "RGBA"), factor)
    capa_a.save(SPRITES / "casa-banera-atras-v1.webp", "WEBP", quality=QUALITY, method=6)
    capa_d.save(SPRITES / "casa-banera-delante-v1.webp", "WEBP", quality=QUALITY, method=6)
    centro = img.width // 2
    ys = np.nonzero(agua[:, centro])[0]
    return {"ancho": capa_a.width, "alto": capa_a.height, "aguaArriba": round(int(ys.min()) * factor),
            "aguaAbajo": round(int(ys.max()) * factor), "corteCentro": round(int(corte[centro]) * factor)}


def utensilios(folder):
    img = load(folder, "casa-bano-utensilios")
    # Solo la fila de abajo (la de arriba salió cortada).
    a = np.array(img.convert("HSV")).astype(int)
    verde = ((a[..., 0] * 360 / 255 > 70) & (a[..., 0] * 360 / 255 < 170) & (a[..., 1] > 90)).mean(1)
    franjas = np.nonzero(verde > 0.97)[0]
    # La franja verde entre las dos filas.
    medio = franjas[(franjas > img.height * 0.2) & (franjas < img.height * 0.4)]
    arriba = int(medio.max()) + 1 if len(medio) else int(img.height * 0.28)
    rgba = key_out(img.crop((0, arriba, img.width, img.height)))
    piezas = sorted(poses(rgba, 4, min_area=8000), key=lambda p: p["cuerpo"][0])
    lado = 128
    hoja = Image.new("RGBA", (lado * 4, lado))
    imagenes = [recorte(rgba, p) for p in piezas]
    factor = (lado - 8) / max(max(i.width, i.height) for i in imagenes)
    for i, pieza in enumerate(imagenes):
        p = escalar(pieza, factor)
        hoja.alpha_composite(p, (i * lado + (lado - p.width) // 2, (lado - p.height) // 2))
    hoja.save(SPRITES / "casa-bano-utensilios-v1.webp", "WEBP", quality=QUALITY, method=6)
    return {"celda": lado, "orden": ["alcachofa", "jabon", "secador", "peine"]}


def efectos(folder):
    img = load(folder, "casa-bano-efectos")
    a = np.array(img).astype(int)
    oscuro = a.max(-1) < 90
    labels, _ = ndimage.label(oscuro)
    celdas = []
    for index, box in enumerate(ndimage.find_objects(labels), start=1):
        alto, ancho = box[0].stop - box[0].start, box[1].stop - box[1].start
        relleno = (labels[box] == index).mean()
        # Los marcos: rectángulos grandes y huecos.
        if alto > 150 and ancho > 150 and relleno < 0.25:
            celdas.append((box[1].start, box[0].start, box[1].stop, box[0].stop))
    celdas.sort(key=lambda c: (round(c[1] / 100), c[0]))
    filas = {}
    for c in celdas:
        filas.setdefault(round(c[1] / 100), []).append(c)
    filas = [filas[k] for k in sorted(filas)]
    if [len(f) for f in filas] != [4, 3, 3, 3]:
        raise SystemExit(f"Celdas inesperadas: {[len(f) for f in filas]}")
    margen = 14
    recortes = []
    for fila in filas:
        piezas = []
        for x0, y0, x1, y1 in fila:
            dentro = img.crop((x0 + margen, y0 + margen, x1 - margen, y1 - margen))
            # Se pega a un marco verde para que el verde de la celda toque el borde.
            lienzo = Image.new("RGB", (dentro.width + 8, dentro.height + 8), (0, 255, 0))
            lienzo.paste(dentro, (4, 4))
            piezas.append(recortar_a_lo_visible(Image.fromarray(key_out(lienzo), "RGBA")))
        recortes.append(piezas)
    lado = 128
    # Una sola escala para todo: la espuma grande ocupa la celda.
    factor = (lado - 6) / max(max(p.width, p.height) for p in recortes[0])
    hoja = Image.new("RGBA", (lado * 4, lado * 4))
    for f, piezas in enumerate(recortes):
        for c, pieza in enumerate(piezas):
            p = escalar(pieza, factor)
            hoja.alpha_composite(p, (c * lado + (lado - p.width) // 2, f * lado + (lado - p.height) // 2))
    hoja.save(SPRITES / "casa-bano-efectos-v1.webp", "WEBP", quality=QUALITY, method=6)
    return {"celda": lado, "filas": ["espuma", "agua", "aire", "brillos"], "cuadros": [4, 3, 3, 3]}


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1])
    medidas = {"fondo": fondo(folder), "banera": banera(folder), "utensilios": utensilios(folder), "efectos": efectos(folder)}
    print(json.dumps(medidas, indent=2, default=int))


if __name__ == "__main__":
    main()
