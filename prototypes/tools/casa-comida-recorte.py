"""Recorta y exporta la lámina de las comidas de la casa de los gatitos (docs/art/casa-comida-v1.md).

Entrada: una carpeta con la lámina tal como sale del generador, llamada `casa-comidas` (cualquier extensión): cuatro
cuencos en fila con pescado, leche, galletas y pollo.
Salida: public/assets/sprites/casa-comidas-v1.webp, cuatro celdas de 128 × 128 en el orden de `COMIDAS`.

Las cuatro piezas se escalan con el mismo factor (la más grande cabe en 120 px) para que los cuencos midan lo mismo,
se centran en su celda y se apoyan todas en la misma fila. La gota de la leche se pega a su cuenco.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-comida-recorte.py CARPETA_ORIGEN
"""
import importlib.util
import sys
from pathlib import Path

from PIL import Image

_spec = importlib.util.spec_from_file_location("casa_recorte", Path(__file__).with_name("casa-recorte.py"))
casa = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(casa)

CELDA = 128
CABE = 120
APOYO = 124  # fila donde se apoya el cuenco dentro de la celda


def main():
    folder = Path(sys.argv[1])
    rgba = casa.key_out(casa.load(folder, "casa-comidas"))
    piezas = sorted(casa.poses(rgba, 4, min_area=4000), key=lambda p: p["cuerpo"][0])
    imagenes = [casa.recorte(rgba, pieza) for pieza in piezas]
    factor = CABE / max(max(img.width, img.height) for img in imagenes)
    hoja = Image.new("RGBA", (CELDA * 4, CELDA))
    for i, img in enumerate(imagenes):
        img = casa.escalar(img, factor)
        hoja.alpha_composite(img, (i * CELDA + (CELDA - img.width) // 2, APOYO - img.height))
    salida = casa.SPRITES / "casa-comidas-v1.webp"
    hoja.save(salida, "WEBP", quality=casa.QUALITY, method=6)
    print(f"escrita {salida.relative_to(casa.ROOT)} (factor {factor:.3f})")


if __name__ == "__main__":
    main()
