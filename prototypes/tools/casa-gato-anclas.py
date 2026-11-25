"""
Anclas de los accesorios en la hoja de cada modelo de gatito (mapa «Ropa y accesorios para los gatitos», ticket «Tabla de
cabeza y cuello del gato base»; los modelos, del mapa «Gatitos de la casa distintos»). Lee la hoja del atigrado
(`public/assets/sprites/gato-casa-v1.webp`) y la de cada modelo que ya tenga (`gato-casa-<modelo>-v1.webp`) y, en cada
cuadro de 160 × 160, busca:

- la cabeza: el centro del lazo clave (#FFD700), entre las orejas, donde se apoya el sombrero;
- el cuello: el centro de la mitad de arriba del pañuelo (la mancha azul grande), donde va la bufanda; en los modelos
  nuevos, que llevan un collar fino, el centro del collar, buscado solo en sus claves (sin el azul de los ojos);
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
SPRITES = RAIZ / "public/assets/sprites"
MODELOS = ["atigrado", "esmoquin", "melena", "nube"]


def hoja_de(modelo):
    return SPRITES / ("gato-casa-v1.webp" if modelo == "atigrado" else f"gato-casa-{modelo}-v1.webp")


SALIDA = RAIZ / "src/game/casaGatoAnclas.ts"
CELDA = 160
FILAS = [("andar", 4), ("sentado", 2), ("cola", 1), ("dormir", 2), ("jugarSolo", 3), ("cantar", 2), ("pedir", 2),
         ("comer", 3), ("ronronear", 2), ("bano", 2), ("sacudirse", 3), ("pelota", 4), ("ahoraNo", 2)]
LAZO = (0xFF, 0xD7, 0x00)
# Los ojos van a esta parte del camino del lazo al cuello (los azules de los ojos y del pañuelo no se separan bien).
PARTE_OJOS = 0.55
# Cuadros de espaldas, por modelo: sin gafas.
ESPALDA = {"atigrado": {("jugarSolo", 0)}}
OJOS = (0x1D, 0x4E, 0xD8)
AZULES = [(0x1D, 0x4E, 0xD8), (0x25, 0x63, 0xEB), (0x1E, 0x3A, 0x8A)]
COLLAR = [(0x25, 0x63, 0xEB), (0x1E, 0x3A, 0x8A)]


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


def anclas(celda, modelo):
    ys, xs = np.nonzero(mascara(celda, [LAZO]))
    cabeza = {"x": int(round(xs.mean())), "y": int(round(ys.mean()))} if len(xs) >= 20 else None
    azul, n = ndimage.label(mascara(celda, AZULES if modelo == "atigrado" else COLLAR))
    cuello = None
    if n:
        tamaños = ndimage.sum(np.ones_like(azul), azul, range(1, n + 1))
        ys, xs = np.nonzero(azul == 1 + int(np.argmax(tamaños)))
        if len(xs) >= (60 if modelo == "atigrado" else 12):
            arriba = ys <= np.median(ys)
            cuello = {"x": int(round(xs[arriba].mean())), "y": int(round(ys[arriba].mean()))}
    ojos = ojos_vistos(celda, cabeza, cuello) if cabeza and cuello else None
    return {"cabeza": cabeza, "ojos": ojos, "cuello": cuello}


def en_el_camino(a):
    """Punto de los ojos estimado en el camino del lazo al cuello (para ojos cerrados)."""
    c, k = a["cabeza"], a["cuello"]
    return (c["x"] + PARTE_OJOS * (k["x"] - c["x"]), c["y"] + PARTE_OJOS * (k["y"] - c["y"]))


def cabezas_tapadas(tabla):
    """En los modelos nuevos el lazo es pequeño y a veces lo tapa el pelo: con el collar a la vista, la cabeza va donde
    suele ir respecto al collar en ese modelo (así el sombrero no parpadea al andar)."""
    pares = [a for cuadros in tabla.values() for a in cuadros if a["cabeza"] and a["cuello"]]
    dx = float(np.median([a["cabeza"]["x"] - a["cuello"]["x"] for a in pares]))
    dy = float(np.median([a["cabeza"]["y"] - a["cuello"]["y"] for a in pares]))
    for cuadros in tabla.values():
        for a in cuadros:
            if a["cuello"] and not a["cabeza"]:
                a["cabeza"] = {"x": int(round(a["cuello"]["x"] + dx)), "y": int(round(a["cuello"]["y"] + dy))}


def completar(tabla, modelo):
    """Los ojos cerrados van donde irían abiertos: en el camino del lazo al cuello, corrido lo que se corren los vistos."""
    vistos = [a for cuadros in tabla.values() for a in cuadros if a["ojos"]]
    dx = float(np.median([a["ojos"]["x"] - en_el_camino(a)[0] for a in vistos]))
    dy = float(np.median([a["ojos"]["y"] - en_el_camino(a)[1] for a in vistos]))
    for nombre, cuadros in tabla.items():
        for c, a in enumerate(cuadros):
            if a["ojos"] or not (a["cabeza"] and a["cuello"]) or (nombre, c) in ESPALDA.get(modelo, set()):
                continue
            x, y = en_el_camino(a)
            a["ojos"] = {"x": int(round(x + dx)), "y": int(round(y + dy))}


def tabla_de(modelo):
    hoja = np.array(Image.open(hoja_de(modelo)).convert("RGBA")).astype(int)
    tabla = {}
    for fila, (nombre, cuadros) in enumerate(FILAS):
        tabla[nombre] = [anclas(hoja[fila * CELDA:(fila + 1) * CELDA, c * CELDA:(c + 1) * CELDA], modelo) for c in range(cuadros)]
    if modelo != "atigrado":
        cabezas_tapadas(tabla)
    completar(tabla, modelo)
    return tabla


def literal(a):
    return json.dumps(a).replace('"cabeza"', "cabeza").replace('"ojos"', "ojos").replace('"cuello"', "cuello").replace('"x"', "x").replace('"y"', "y")


def main():
    tablas = {modelo: tabla_de(modelo) for modelo in MODELOS if hoja_de(modelo).exists()}
    lineas = [
        "/**",
        " * Anclas de los accesorios en cada cuadro de la hoja de cada modelo de gatito (mapa «Ropa y accesorios para los",
        " * gatitos»), en px dentro del cuadro de 160 × 160: la cabeza (el lazo, donde se apoya el sombrero), los ojos (las",
        " * gafas) y el cuello (el pañuelo o el collar, la bufanda). Solo los modelos que ya tienen hoja.",
        " * `null` cuando no se ve: ese accesorio no se pinta en ese cuadro.",
        " *",
        " * GENERADO por `prototypes/tools/casa-gato-anclas.py`: no editar a mano.",
        " */",
        'import type { AnimacionGato, ModeloGatito } from "./casaGatoArte.ts";',
        "",
        "export type Punto = { x: number; y: number };",
        "export type Anclas = { cabeza: Punto | null; ojos: Punto | null; cuello: Punto | null };",
        "export type TablaAnclas = Readonly<Record<AnimacionGato, readonly Anclas[]>>;",
        "",
        "export const ANCLAS_POR_MODELO: Readonly<{ atigrado: TablaAnclas } & Partial<Record<ModeloGatito, TablaAnclas>>> = {",
    ]
    for modelo, tabla in tablas.items():
        lineas.append(f"  {modelo}: {{")
        for nombre, cuadros in tabla.items():
            lineas.append(f"    {nombre}: [")
            for a in cuadros:
                lineas.append("      " + literal(a) + ",")
            lineas.append("    ],")
        lineas.append("  },")
    lineas += ["};", "", "/** Las del atigrado, el gato base. */", "export const ANCLAS_GATO = ANCLAS_POR_MODELO.atigrado;"]
    SALIDA.write_text("\n".join(lineas) + "\n")
    print(f"escrito {SALIDA.relative_to(RAIZ)}: {', '.join(tablas)}")
    if "--ver" in sys.argv:
        carpeta = Path(sys.argv[sys.argv.index("--ver") + 1])
        carpeta.mkdir(parents=True, exist_ok=True)
        for modelo, tabla in tablas.items():
            original = Image.open(hoja_de(modelo)).convert("RGBA")
            imagen = Image.new("RGBA", original.size, (225, 225, 225, 255))
            imagen.alpha_composite(original)
            dibujo = ImageDraw.Draw(imagen)
            for fila, (nombre, cuadros) in enumerate(FILAS):
                for c, a in enumerate(tabla[nombre]):
                    for clave, color in (("cabeza", "magenta"), ("ojos", "lime"), ("cuello", "red")):
                        p = a[clave]
                        if p:
                            x, y = c * CELDA + p["x"], fila * CELDA + p["y"]
                            dibujo.ellipse([x - 4, y - 4, x + 4, y + 4], outline=color, width=2)
            imagen.crop((0, 0, 640, 1040)).convert("RGB").save(carpeta / f"anclas-{modelo}-a.png")
            imagen.crop((0, 1040, 640, 2080)).convert("RGB").save(carpeta / f"anclas-{modelo}-b.png")


if __name__ == "__main__":
    main()
