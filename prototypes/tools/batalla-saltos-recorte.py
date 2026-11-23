"""Recorta y exporta el terreno de las batallas de saltos de Siroco y Don Silbato (docs/art/batalla-saltos-v1.md).

Entrada: una carpeta con las láminas tal como salen del generador, `siroco-terreno` y `don-silbato-terreno` (cualquier
extensión): sobre verde plano, el suelo arriba, la repisa abajo a la izquierda y el proyectil abajo a la derecha.
Salida: public/assets/atlases/<guardián>-boss-terrain-v1.webp, con las tres piezas apiladas: el suelo a 1152 px de
ancho, la repisa a 768 y el proyectil en un cuadrado de 128 × 128.

Imprime los recortes `[x, y, ancho, alto]` de cada pieza para `bossTerrainSources` de `src/game/santaBattleAssets.ts`.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/batalla-saltos-recorte.py CARPETA_ORIGEN
"""
import importlib.util
import json
import sys
from pathlib import Path

from PIL import Image

_spec = importlib.util.spec_from_file_location("casa_recorte", Path(__file__).with_name("casa-recorte.py"))
casa = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(casa)

ATLASES = casa.ROOT / "public/assets/atlases"
ANCHO_SUELO = 1152
ANCHO_REPISA = 768
PROYECTIL = 128
HUECO = 8


def a_ancho(img, ancho):
    return img.resize((ancho, max(1, round(img.height * ancho / img.width))), Image.NEAREST)


def guardian(folder, nombre):
    rgba = casa.key_out(casa.load(folder, f"{nombre}-terreno"))
    piezas = casa.poses(rgba, 3, min_area=3000)
    # El suelo es la más ancha; de las otras dos, la repisa es la de la izquierda.
    piezas.sort(key=lambda p: -(p["box"][2] - p["box"][0]))
    suelo = piezas[0]
    repisa, proyectil = sorted(piezas[1:], key=lambda p: p["box"][0])
    suelo = a_ancho(casa.recorte(rgba, suelo), ANCHO_SUELO)
    repisa = a_ancho(casa.recorte(rgba, repisa), ANCHO_REPISA)
    bala = casa.recorte(rgba, proyectil)
    lado = PROYECTIL - 8
    factor = lado / max(bala.width, bala.height)
    bala = bala.resize((max(1, round(bala.width * factor)), max(1, round(bala.height * factor))), Image.NEAREST)

    alto = suelo.height + HUECO + repisa.height + HUECO + PROYECTIL
    hoja = Image.new("RGBA", (ANCHO_SUELO, alto))
    y = 0
    hoja.alpha_composite(suelo, (0, y))
    fuentes = {"ground": [0, y, suelo.width, suelo.height]}
    y += suelo.height + HUECO
    hoja.alpha_composite(repisa, (0, y))
    fuentes["ledge"] = [0, y, repisa.width, repisa.height]
    y += repisa.height + HUECO
    hoja.alpha_composite(bala, ((PROYECTIL - bala.width) // 2, y + (PROYECTIL - bala.height) // 2))
    fuentes["projectile"] = [(PROYECTIL - bala.width) // 2, y + (PROYECTIL - bala.height) // 2, bala.width, bala.height]

    salida = ATLASES / f"{nombre}-boss-terrain-v1.webp"
    hoja.save(salida, "WEBP", lossless=True, method=6)
    print(f"escrita {salida.relative_to(casa.ROOT)} {hoja.size}")
    print(f'  "{nombre}": {json.dumps(fuentes)},')


def main():
    folder = Path(sys.argv[1])
    for nombre in ("siroco", "don-silbato"):
        guardian(folder, nombre)


if __name__ == "__main__":
    main()
