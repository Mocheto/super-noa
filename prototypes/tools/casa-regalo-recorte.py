"""Recorta la caja y el lazo de los regalos de la casa (docs/art/casa-regalo-v1.md).

Entrada: la carpeta con `caja` y `lazo` (cualquier extensión), sobre verde.
Salida (WebP sin pérdida): public/assets/sprites/casa-regalo-v1.webp (128 × 128) y casa-lazo-v1.webp (128 × alto del
lazo), cada pieza recortada y centrada.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-regalo-recorte.py CARPETA
"""
import importlib.util
import sys
from pathlib import Path

from PIL import Image

AQUI = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("casa_recorte", AQUI / "casa-recorte.py")
casa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(casa)


def pieza(folder, nombre):
    rgba = casa.key_out(casa.load(folder, nombre))
    img = casa.recorte(rgba, casa.poses(rgba, 1)[0])
    return casa.escalar(img, 128 / max(img.size))


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1])
    caja = pieza(folder, "caja")
    lienzo = Image.new("RGBA", (128, 128))
    # Apoyada abajo, como en la alfombra.
    lienzo.alpha_composite(caja, ((128 - caja.width) // 2, 128 - caja.height))
    lienzo.save(casa.SPRITES / "casa-regalo-v1.webp", "WEBP", lossless=True, method=6)
    lazo = pieza(folder, "lazo")
    lazo.save(casa.SPRITES / "casa-lazo-v1.webp", "WEBP", lossless=True, method=6)
    print("caja", caja.size, "lazo", lazo.size)


if __name__ == "__main__":
    main()
