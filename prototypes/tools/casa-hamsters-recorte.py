"""Recorta el arte generado de la jaula de hámsters (docs/art/casa-hamsters-v1.md) y lo deja como lo usa el juego.

Entrada (`--origen`, sobre verde plano): jaula.webp, objetos.webp, perla.webp, bolita.webp y bandeja.webp (con
`--solo-bandeja` basta la última). Salidas en
`public/assets/sprites/`:

- casa-jaula-v1.webp (772 × 748, al doble del dibujo del laberinto): la jaula vacía, adaptada a la reja del juego. El
  tejado se escala sin deformar, los barrotes se estiran a lo alto (son verticales) y la bandeja se encaja abajo.
- casa-jaula-objetos-v1.webp: ocho celdas de 96 × 96 (rueda: soporte y aro; columpio: marco y asiento; casita;
  comedero lleno y vacío; botella), cada pieza apoyada abajo y centrada.
- casa-hamster-perla-v1.webp y casa-hamster-bolita-v1.webp: ocho celdas de 96 × 72 a la misma escala, con los pies en
  la fila 70.
- casa-jaula-bandeja-v1.webp: dos celdas de 128 × 128 (saco de comida y jarrita de agua) para los botones de la bandeja.

Imprime la caja de cada objeto en su celda, para `src/game/JaulaHamsters.tsx`.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-hamsters-recorte.py --origen ../super-noa-arte-original/casa-hamsters-v1
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SALIDA = Path(__file__).resolve().parents[2] / "public" / "assets" / "sprites"


def quitar_verde(img):
    """RGBA sin el verde del fondo (claro o vivo), sin tocar el verde oscuro del soporte de la botella."""
    a = np.asarray(img.convert("RGB")).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    alfa = ~((g > 195) & (g - r > 45) & (g - b > 45))
    # El borde mezclado con el fondo: fuera si aún tira a verde, y al resto se le quita el reflejo.
    cerca = ndi.binary_dilation(~alfa, iterations=2) & alfa
    alfa &= ~(cerca & (g > 150) & (g - np.maximum(r, b) > 35))  # g > 150: el soporte verde oscuro se queda
    borde = ndi.binary_dilation(~alfa, iterations=3) & alfa
    tope = np.maximum(r, b)
    a[..., 1] = np.where(borde & (g > tope) & ((g > 150) | (g - tope < 30)), tope, g)
    # Motas sueltas.
    etiquetas, _ = ndi.label(alfa)
    tallas = np.bincount(etiquetas.ravel())
    alfa &= tallas[etiquetas] >= 40
    return Image.fromarray(np.dstack([a, alfa * 255]).astype(np.uint8), "RGBA")


def celdas(img):
    """Los tramos entre las líneas de separación (verde vivo) de una lámina de ocho celdas."""
    a = np.asarray(img.convert("RGB")).astype(int)
    vivo = ((a[..., 1] > 195) & (a[..., 0] < 105) & (a[..., 2] < 105)).mean(0) > 0.6
    marcas, n = ndi.label(vivo)
    cortes = [(s[0].start, s[0].stop) for s in ndi.find_objects(marcas) if s[0].stop - s[0].start >= 3]
    interiores = [c for c in cortes if c[0] > 20 and c[1] < img.width - 20]
    assert len(interiores) == 7, f"separadores: {cortes}"
    bordes = [0] + [x for c in interiores for x in c] + [img.width]
    return [(bordes[i], bordes[i + 1]) for i in range(0, len(bordes), 2)]


def piezas(ruta, borrar=()):
    img = Image.open(ruta)
    limpia = quitar_verde(img)
    for caja in borrar:
        limpia.paste((0, 0, 0, 0), caja)
    res = []
    for x0, x1 in celdas(img):
        p = limpia.crop((x0 + 3, 0, x1 - 3, img.height))
        res.append(p.crop(p.getchannel("A").getbbox()))
    return res


def reducir(p, k):
    return p.resize((max(1, round(p.width * k)), max(1, round(p.height * k))), Image.LANCZOS)


def endurecer(p):
    """Bordes nítidos de pixel art tras reducir."""
    a = np.asarray(p).copy()
    a[..., 3] = np.where(a[..., 3] > 127, 255, 0)
    return Image.fromarray(a, "RGBA")


def fila(frames, cw, ch, pie):
    hoja = Image.new("RGBA", (cw * len(frames), ch))
    cajas = []
    for i, f in enumerate(frames):
        f = endurecer(f)
        x, y = (cw - f.width) // 2, pie - f.height
        hoja.paste(f, (i * cw + x, y))
        cajas.append((x, y, f.width, f.height))
    return hoja, cajas


def guardar(img, nombre):
    img.save(SALIDA / nombre, "WEBP", lossless=True, quality=100, method=6)
    print(nombre, img.size)


def jaula(origen):
    limpia = quitar_verde(Image.open(origen / "jaula.webp"))
    x0, y0, x1, y1 = limpia.getchannel("A").getbbox()
    ancho = 772  # 386 px del dibujo: la reja del juego mide 370 y la bandeja sobresale
    k = ancho / (x1 - x0)
    tejado = limpia.crop((x0, y0, x1, 122))
    barrotes = limpia.crop((x0, 122, x1, 540))
    base = limpia.crop((x0, 540, x1, y1))
    alto_tejado = round(tejado.height * k)
    alto_base = 110  # 55 px del dibujo, con las virutas arriba
    total = 748  # de y = 146 a y = 520 del dibujo
    lienzo = Image.new("RGBA", (ancho, total))
    lienzo.paste(tejado.resize((ancho, alto_tejado), Image.LANCZOS), (0, 0))
    lienzo.paste(barrotes.resize((ancho, total - alto_tejado - alto_base), Image.LANCZOS), (0, alto_tejado))
    lienzo.paste(base.resize((ancho, alto_base), Image.LANCZOS), (0, total - alto_base))
    guardar(endurecer(lienzo), "casa-jaula-v1.webp")


def bandeja(origen):
    limpia = quitar_verde(Image.open(origen / "bandeja.webp"))
    medio = limpia.width // 2
    items = []
    for x0, x1 in [(0, medio), (medio, limpia.width)]:
        p = limpia.crop((x0, 0, x1, limpia.height))
        items.append(p.crop(p.getchannel("A").getbbox()))
    k = min(124 / max(p.width for p in items), 124 / max(p.height for p in items))
    hoja, _ = fila([reducir(p, k) for p in items], 128, 128, 126)
    guardar(hoja, "casa-jaula-bandeja-v1.webp")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--origen", type=Path, required=True)
    parser.add_argument("--solo-bandeja", action="store_true")
    args = parser.parse_args()
    origen = args.origen
    bandeja(origen)
    if args.solo_bandeja:
        return
    jaula(origen)

    objetos = [reducir(p, min(92 / p.width, 92 / p.height)) for p in piezas(origen / "objetos.webp")]
    hoja, cajas = fila(objetos, 96, 96, 94)
    guardar(hoja, "casa-jaula-objetos-v1.webp")
    for nombre, caja in zip(["soporte", "aro", "marco", "asiento", "casita", "lleno", "vacio", "botella"], cajas):
        print(f"  {nombre}: {caja}")

    # En la lámina de Perla, la pose de beber trae el pitorro dibujado: se borra (el bebedero ya está en la jaula).
    for nombre, borrar in [("perla", [(1195, 0, 1245, 27)]), ("bolita", [])]:
        poses = piezas(origen / f"{nombre}.webp", borrar)
        k = min(92 / max(p.width for p in poses), 68 / max(p.height for p in poses))
        hoja, _ = fila([reducir(p, k) for p in poses], 96, 72, 70)
        guardar(hoja, f"casa-hamster-{nombre}-v1.webp")


if __name__ == "__main__":
    main()
