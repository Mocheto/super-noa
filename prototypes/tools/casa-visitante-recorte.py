"""Recorta y exporta la lámina de las comidas de los visitantes de la casa (docs/art/casa-visitante-v1.md).

Entrada: una carpeta con la lámina tal como sale del generador, llamada `casa-comidas-amigos` (cualquier extensión):
tres platos en fila con manzana, bellotas y flor, sobre magenta.
Salida: public/assets/sprites/casa-comidas-amigos-v1.webp, tres celdas de 128 × 128 en el orden de `COMIDAS_AMIGOS`
(manzana, bellota, flor), a la misma escala (el más grande cabe en 120 px), centradas y apoyadas en la misma fila.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-visitante-recorte.py CARPETA_ORIGEN
"""
import importlib.util
import sys
from pathlib import Path

from PIL import Image


def _cargar(nombre, archivo):
    spec = importlib.util.spec_from_file_location(nombre, Path(__file__).with_name(archivo))
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


casa = _cargar("casa_recorte", "casa-recorte.py")
jardin = _cargar("casa_jardin_recorte", "casa-jardin-recorte.py")

CELDA = 128
CABE = 120
APOYO = 120


def main():
    folder = Path(sys.argv[1])
    rgba = jardin.magenta_fuera(casa.load(folder, "casa-comidas-amigos"))
    piezas = sorted(casa.poses(rgba, 3, min_area=8000), key=lambda p: p["cuerpo"][0])
    imagenes = [casa.recorte(rgba, p) for p in piezas]
    factor = CABE / max(max(i.width, i.height) for i in imagenes)
    hoja = Image.new("RGBA", (CELDA * 3, CELDA))
    for n, img in enumerate(imagenes):
        img = casa.escalar(img, factor)
        hoja.alpha_composite(img, (n * CELDA + (CELDA - img.width) // 2, APOYO - img.height))
    salida = casa.SPRITES / "casa-comidas-amigos-v1.webp"
    hoja.save(salida, "WEBP", quality=casa.QUALITY, method=6)
    print(f"escrita {salida.relative_to(casa.ROOT)} (factor {factor:.3f})")


if __name__ == "__main__":
    main()
