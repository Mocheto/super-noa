"""
Anclas de los accesorios en la hoja del gato base (mapa «Ropa y accesorios para los gatitos», ticket «Tabla de cabeza y
cuello del gato base»). Lee `public/assets/sprites/gato-casa-v1.webp` y, en cada cuadro de 160 × 160, busca:

- la cabeza: el centro del lazo clave (#FFD700), entre las orejas, donde se apoya el sombrero;
- el cuello: el centro de la mitad de arriba del pañuelo (la mancha azul grande), donde va la bufanda;
- los ojos, donde van las gafas: el punto medio entre los dos ojos abiertos; cerrados, donde irían, en el camino del
  lazo al cuello; de espaldas, no hay.

Escribe `src/game/casaGatoAnclas.ts`. Con `--ver <carpeta>` guarda además la hoja con las anclas pintadas.

    uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-gato-anclas.py [--ver carpeta]
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

RAIZ = Path(__file__).resolve().parents[2]
HOJA = RAIZ / "public/assets/sprites/gato-casa-v1.webp"
SALIDA = RAIZ / "src/game/casaGatoAnclas.ts"
CELDA = 160
FILAS = [("andar", 4), ("sentado", 2), ("cola", 1), ("dormir", 2), ("jugarSolo", 3), ("cantar", 2), ("pedir", 2),
         ("comer", 3), ("ronronear", 2), ("bano", 2), ("sacudirse", 3), ("pelota", 4), ("ahoraNo", 2)]
LAZO = (0xFF, 0xD7, 0x00)
# Los ojos van a esta parte del camino del lazo al cuello (los azules de los ojos y del pañuelo no se separan bien).
PARTE_OJOS = 0.55
# Cuadros de espaldas: sin gafas.
ESPALDA = {("jugarSolo", 0)}
OJOS = (0x1D, 0x4E, 0xD8)
AZULES = [(0x1D, 0x4E, 0xD8), (0x25, 0x63, 0xEB), (0x1E, 0x3A, 0x8A)]


def mascara(celda, colores):
    m = np.zeros(celda.shape[:2], bool)
    for r, g, b in colores:
        m |= (celda[:, :, 0] == r) & (celda[:, :, 1] == g) & (celda[:, :, 2] == b) & (celda[:, :, 3] > 0)
    return m


def ojos_vistos(celda, cabeza, cuello):
    """Los ojos abiertos: trozos del azul de los ojos entre el lazo y el pañuelo, cerca del lazo; el punto medio de los extremos."""
    m = mascara(celda, [OJOS])
    etiquetas, n = ndimage.label(m)
    xs = []
    for i in range(1, n + 1):
        if ndimage.sum(m, etiquetas, i) < 3:
            continue
        y, x = ndimage.center_of_mass(m, etiquetas, i)
        if cabeza["y"] + 12 <= y <= cuello["y"] - 12 and abs(x - cabeza["x"]) <= 32:
            xs.append((x, y))
    if len(xs) < 2:
        return None
    izquierda, derecha = min(xs), max(xs)
    if derecha[0] - izquierda[0] < 12:
        return None
    return {"x": int(round((izquierda[0] + derecha[0]) / 2)), "y": int(round((izquierda[1] + derecha[1]) / 2))}


def anclas(celda):
    ys, xs = np.nonzero(mascara(celda, [LAZO]))
    cabeza = {"x": int(round(xs.mean())), "y": int(round(ys.mean()))} if len(xs) >= 20 else None
    azul, n = ndimage.label(mascara(celda, AZULES))
    cuello = None
    if n:
        tamaños = ndimage.sum(np.ones_like(azul), azul, range(1, n + 1))
        ys, xs = np.nonzero(azul == 1 + int(np.argmax(tamaños)))
        if len(xs) >= 60:
            arriba = ys <= np.median(ys)
            cuello = {"x": int(round(xs[arriba].mean())), "y": int(round(ys[arriba].mean()))}
    ojos = ojos_vistos(celda, cabeza, cuello) if cabeza and cuello else None
    return {"cabeza": cabeza, "ojos": ojos, "cuello": cuello}


def en_el_camino(a):
    """Punto de los ojos estimado en el camino del lazo al cuello (para ojos cerrados)."""
    c, k = a["cabeza"], a["cuello"]
    return (c["x"] + PARTE_OJOS * (k["x"] - c["x"]), c["y"] + PARTE_OJOS * (k["y"] - c["y"]))


def completar(tabla):
    """Los ojos cerrados van donde irían abiertos: en el camino del lazo al cuello, corrido lo que se corren los vistos."""
    vistos = [a for cuadros in tabla.values() for a in cuadros if a["ojos"]]
    dx = float(np.median([a["ojos"]["x"] - en_el_camino(a)[0] for a in vistos]))
    dy = float(np.median([a["ojos"]["y"] - en_el_camino(a)[1] for a in vistos]))
    for nombre, cuadros in tabla.items():
        for c, a in enumerate(cuadros):
            if a["ojos"] or not (a["cabeza"] and a["cuello"]) or (nombre, c) in ESPALDA:
                continue
            x, y = en_el_camino(a)
            a["ojos"] = {"x": int(round(x + dx)), "y": int(round(y + dy))}


def main():
    hoja = np.array(Image.open(HOJA).convert("RGBA")).astype(int)
    tabla = {}
    for fila, (nombre, cuadros) in enumerate(FILAS):
        tabla[nombre] = [anclas(hoja[fila * CELDA:(fila + 1) * CELDA, c * CELDA:(c + 1) * CELDA]) for c in range(cuadros)]
    completar(tabla)
    lineas = [
        "/**",
        " * Anclas de los accesorios en cada cuadro de la hoja del gato base (mapa «Ropa y accesorios para los gatitos»), en",
        " * px dentro del cuadro de 160 × 160: la cabeza (el lazo, donde se apoya el sombrero), los ojos (las gafas) y el",
        " * cuello (el pañuelo, la bufanda).",
        " * `null` cuando no se ve: ese accesorio no se pinta en ese cuadro.",
        " *",
        " * GENERADO por `prototypes/tools/casa-gato-anclas.py`: no editar a mano.",
        " */",
        'import type { AnimacionGato } from "./casaGatoArte.ts";',
        "",
        "export type Punto = { x: number; y: number };",
        "export type Anclas = { cabeza: Punto | null; ojos: Punto | null; cuello: Punto | null };",
        "",
        "export const ANCLAS_GATO: Readonly<Record<AnimacionGato, readonly Anclas[]>> = {",
    ]
    for nombre, cuadros in tabla.items():
        lineas.append(f"  {nombre}: [")
        for a in cuadros:
            lineas.append("    " + json.dumps(a).replace('"cabeza"', "cabeza").replace('"ojos"', "ojos").replace('"cuello"', "cuello").replace('"x"', "x").replace('"y"', "y") + ",")
        lineas.append("  ],")
    lineas.append("};")
    SALIDA.write_text("\n".join(lineas) + "\n")
    print(f"escrito {SALIDA.relative_to(RAIZ)}")
    if "--ver" in sys.argv:
        carpeta = Path(sys.argv[sys.argv.index("--ver") + 1])
        carpeta.mkdir(parents=True, exist_ok=True)
        imagen = Image.new("RGBA", (hoja.shape[1], hoja.shape[0]), (225, 225, 225, 255))
        imagen.alpha_composite(Image.open(HOJA).convert("RGBA"))
        dibujo = ImageDraw.Draw(imagen)
        for fila, (nombre, cuadros) in enumerate(FILAS):
            for c, a in enumerate(tabla[nombre]):
                for clave, color in (("cabeza", "magenta"), ("ojos", "lime"), ("cuello", "red")):
                    p = a[clave]
                    if p:
                        x, y = c * CELDA + p["x"], fila * CELDA + p["y"]
                        dibujo.ellipse([x - 4, y - 4, x + 4, y + 4], outline=color, width=2)
        imagen.crop((0, 0, 640, 1040)).convert("RGB").save(carpeta / "anclas-a.png")
        imagen.crop((0, 1040, 640, 2080)).convert("RGB").save(carpeta / "anclas-b.png")


if __name__ == "__main__":
    main()
