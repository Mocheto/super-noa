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
# La hoja de jugar con la pelota de cada modelo (`casa-pelota-recorte.py`).
FILAS_PELOTA = [("carrera", 4), ("juego", 4)]
# Tumbado panza arriba, los accesorios quedarían derechos sobre un gato girado: ninguno.
SIN_ANCLAS = [("juego", 2), ("juego", 3)]
CELDA = 160
FILAS = [("andar", 4), ("sentado", 2), ("cola", 1), ("dormir", 2), ("jugarSolo", 3), ("cantar", 2), ("pedir", 2),
         ("comer", 3), ("ronronear", 2), ("bano", 2), ("sacudirse", 3), ("pelota", 4), ("ahoraNo", 2)]
LAZO = (0xFF, 0xD7, 0x00)
# Los ojos van a esta parte del camino del lazo al cuello (los azules de los ojos y del pañuelo no se separan bien).
PARTE_OJOS = 0.55
# Cuadros de espaldas, por modelo: sin gafas.
ESPALDA = {"atigrado": {("jugarSolo", 0)}}
OJOS = (0x1D, 0x4E, 0xD8)
# Cuadros que la detección no ve bien, con sus anclas puestas a mano (mirando la hoja). El esmoquin, al pedir, no
# enseña ni lazo ni collar y sus lágrimas tienen el azul del collar: el sombrero salía flotando encima de la cabeza.
A_MANO = {
    "esmoquin": {
        ("pedir", 0): {"cabeza": {"x": 117, "y": 46}, "ojos": {"x": 117, "y": 66}, "cuello": {"x": 112, "y": 96}},
        ("pedir", 1): {"cabeza": {"x": 116, "y": 46}, "ojos": {"x": 116, "y": 66}, "cuello": {"x": 111, "y": 96}},
    },
    # La nube, en el salto de la pelota y con la cabeza en el cuenco, casi no enseña lazo ni collar: sin anclas, lo que
    # lleva desaparecía en ese cuadro y parpadeaba al jugar y al comer.
    "nube": {
        ("pelota", 2): {"cabeza": {"x": 126, "y": 56}, "ojos": {"x": 128, "y": 74}, "cuello": {"x": 124, "y": 92}},
        ("comer", 1): {"cabeza": {"x": 118, "y": 84}, "ojos": {"x": 120, "y": 104}, "cuello": {"x": 112, "y": 128}},
    },
}
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
    # El lazo de la nube es muy pequeño: en los modelos nuevos basta con unos pocos píxeles.
    cabeza = {"x": int(round(xs.mean())), "y": int(round(ys.mean()))} if len(xs) >= (20 if modelo == "atigrado" else 6) else None
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


def cabeza_centrada(tabla):
    """En los modelos nuevos el lazo no siempre va en medio de la cabeza (al esmoquin le cae sobre una oreja): la cabeza
    se corre de lado lo que suele separarse el lazo de los ojos abiertos, para que el sombrero quede centrado."""
    pares = [a for cuadros in tabla.values() for a in cuadros if a["cabeza"] and a["ojos"]]
    if not pares:
        return
    dx = float(np.median([a["ojos"]["x"] - a["cabeza"]["x"] for a in pares]))
    for cuadros in tabla.values():
        for a in cuadros:
            if a["cabeza"]:
                a["cabeza"]["x"] = int(round(a["cabeza"]["x"] + dx))


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


def huecos_de_la_animacion(tabla, modelo):
    """En los modelos nuevos el collar se esconde en algún cuadro suelto de una animación (con la cabeza a la vista):
    sin cuello, la bufanda desaparecía en ese cuadro y parpadeaba. Se pone donde va respecto a la cabeza en el cuadro
    más cercano de la misma animación que sí lo enseña."""
    for nombre, cuadros in tabla.items():
        for c, a in enumerate(cuadros):
            if a["cuello"] or not a["cabeza"] or (nombre, c) in ESPALDA.get(modelo, set()):
                continue
            otros = sorted((abs(o - c), o) for o, b in enumerate(cuadros) if b["cuello"] and b["cabeza"])
            if not otros:
                continue
            b = cuadros[otros[0][1]]
            a["cuello"] = {k: a["cabeza"][k] + b["cuello"][k] - b["cabeza"][k] for k in ("x", "y")}


def completar(tabla, modelo, referencia=None):
    """Los ojos cerrados van donde irían abiertos: en el camino del lazo al cuello, corrido lo que se corren los vistos."""
    vistos = [a for cuadros in (referencia or tabla).values() for a in cuadros if a["ojos"] and a["cabeza"] and a["cuello"]]
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
        cabeza_centrada(tabla)
        cabezas_tapadas(tabla)
        huecos_de_la_animacion(tabla, modelo)
    completar(tabla, modelo)
    for (nombre, c), a in A_MANO.get(modelo, {}).items():
        tabla[nombre][c] = a
    return tabla


def tabla_pelota(modelo):
    hoja = np.array(Image.open(SPRITES / f"gato-casa-pelota-{modelo}-v1.webp").convert("RGBA")).astype(int)
    tabla = {}
    for fila, (nombre, cuadros) in enumerate(FILAS_PELOTA):
        tabla[nombre] = [anclas(hoja[fila * CELDA:(fila + 1) * CELDA, c * CELDA:(c + 1) * CELDA], modelo) for c in range(cuadros)]
    for nombre, c in SIN_ANCLAS:
        tabla[nombre][c] = {"cabeza": None, "ojos": None, "cuello": None}
    if modelo != "atigrado":
        cabeza_centrada(tabla)
        cabezas_tapadas(tabla)
        huecos_de_la_animacion(tabla, modelo)
        for nombre, c in SIN_ANCLAS:
            tabla[nombre][c] = {"cabeza": None, "ojos": None, "cuello": None}
    # En estas hojas la clave de los ojos solo está en los ojos: las gafas van en el centro de lo que ocupan.
    for fila, (nombre, cuadros) in enumerate(FILAS_PELOTA):
        for c in range(cuadros):
            a = tabla[nombre][c]
            a["ojos"] = None
            if not a["cabeza"]:
                continue
            ys, xs = np.nonzero(mascara(hoja[fila * CELDA:(fila + 1) * CELDA, c * CELDA:(c + 1) * CELDA], [OJOS]))
            # Solo lo que cae en la cara; fuera quedan las motas del contorno.
            cara = (ys >= a["cabeza"]["y"] + 15) & (ys <= a["cabeza"]["y"] + 55) & (np.abs(xs - a["cabeza"]["x"]) <= 35)
            if cara.any():
                a["ojos"] = {"x": int(round((int(xs[cara].min()) + int(xs[cara].max())) / 2)), "y": int(round((int(ys[cara].min()) + int(ys[cara].max())) / 2))}
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
    lineas += ["};", "", "/** Las de la hoja de jugar con la pelota: la carrera y el juego (en el abrazo, ninguna). */",
               'export type PosePelota = "carrera" | "juego";',
               "export const ANCLAS_PELOTA: Readonly<Record<ModeloGatito, Readonly<Record<PosePelota, readonly Anclas[]>>>> = {"]
    pelotas = {modelo: tabla_pelota(modelo) for modelo in MODELOS}
    for modelo, tabla in pelotas.items():
        lineas.append(f"  {modelo}: {{")
        for nombre, cuadros in tabla.items():
            lineas.append(f"    {nombre}: [")
            lineas += ["      " + literal(a) + "," for a in cuadros]
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
            juego = Image.new("RGBA", (CELDA * 4, CELDA * 2), (225, 225, 225, 255))
            juego.alpha_composite(Image.open(SPRITES / f"gato-casa-pelota-{modelo}-v1.webp").convert("RGBA"))
            dibujo = ImageDraw.Draw(juego)
            for fila, (nombre, _) in enumerate(FILAS_PELOTA):
                for c, a in enumerate(pelotas[modelo][nombre]):
                    for clave, color in (("cabeza", "magenta"), ("ojos", "lime"), ("cuello", "red")):
                        p = a[clave]
                        if p:
                            x, y = c * CELDA + p["x"], fila * CELDA + p["y"]
                            dibujo.ellipse([x - 4, y - 4, x + 4, y + 4], outline=color, width=2)
            juego.convert("RGB").save(carpeta / f"anclas-pelota-{modelo}.png")


if __name__ == "__main__":
    main()
