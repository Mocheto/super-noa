"""Recorta las láminas de referencia de los modelos nuevos de los gatitos de la casa (docs/art/casa-modelos-v1.md).

Entrada: una carpeta con esmoquin-referencia, melena-referencia y nube-referencia (cualquier extensión), tal como salen
del generador, sobre verde plano.
Salida: public/assets/sprites/gato-casa-referencias-v1.webp, una fila de cuatro cuadros de 160 × 160 en colores clave:
el atigrado sentado (copiado de la hoja de la casa), esmoquin, melena y nube. Solo la usa la prueba de parecido.

Pasos: los mismos que la hoja del gato base (`casa-recorte.py`): quita el verde, toma la pose, la escala, la alinea
por los pies en la fila 152 y ajusta cada píxel al color clave más cercano, con las claves nuevas de puntas y manchas.
Las tres referencias se generaron a la misma escala, así que se usa un solo factor: el que deja al esmoquin, el de
silueta más parecida al atigrado, con 140 px de alto. La melena y la nube miden lo que les dé su pelo.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-modelos-recorte.py CARPETA_ORIGEN
"""
import importlib.util
import sys
from pathlib import Path

from PIL import Image

AQUI = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location("casa_recorte", AQUI / "casa-recorte.py")
base = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(base)

# Claves nuevas de los modelos: el juego las pinta con las marcas de cada gatito.
base.CLAVES.update({"puntas": (0xA2, 0x1C, 0xAF), "manchas": (0x00, 0xE5, 0xFF)})

MODELOS = ["esmoquin", "melena", "nube"]
CELDA, PIES, SENTADO = base.CELDA, base.PIES, base.SENTADO


def pose(folder, nombre):
    rgba = base.sin_rayas_de_suelo(base.key_out(base.load(folder, f"{nombre}-referencia")))
    return rgba, base.poses(rgba, 1)[0]


def celda_de(rgba, pieza, factor):
    img = base.escalar(base.recorte(rgba, pieza), factor)
    if img.width > CELDA or img.height > PIES:
        img = base.escalar(img, min(CELDA / img.width, PIES / img.height))
    x0 = pieza["box"][0]
    pie = (base.pies(pieza) - x0) * (img.width / (pieza["box"][2] - x0))
    celda = Image.new("RGBA", (CELDA, CELDA))
    left = max(0, min(CELDA - img.width, int(round(CELDA / 2 - pie))))
    celda.alpha_composite(img, (left, PIES - img.height))
    return base.sin_raya_bajo_los_pies(base.a_claves(celda)), img.size


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1])
    poses = {nombre: pose(folder, nombre) for nombre in MODELOS}
    cuerpo = poses["esmoquin"][1]["cuerpo"]
    factor = SENTADO / (cuerpo[3] - cuerpo[1])
    hoja = Image.new("RGBA", (CELDA * 4, CELDA))
    atigrado = Image.open(base.SPRITES / "gato-casa-v1.webp").convert("RGBA")
    hoja.alpha_composite(atigrado.crop((0, CELDA, CELDA, 2 * CELDA)), (0, 0))  # fila «sentado», primer cuadro
    for i, nombre in enumerate(MODELOS, start=1):
        celda, medida = celda_de(*poses[nombre], factor)
        hoja.alpha_composite(celda, (i * CELDA, 0))
        print(nombre, "×".join(map(str, medida)))
    destino = base.SPRITES / "gato-casa-referencias-v1.webp"
    hoja.save(destino, "WEBP", lossless=True, method=6)
    print(destino.relative_to(base.ROOT))


if __name__ == "__main__":
    main()
