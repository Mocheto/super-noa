"""Recorta y exporta las cortinas, la estantería y el cojín de la casa (docs/art/casa-decorar-v2.md).

Entrada: una carpeta con las láminas tal como salen del generador (cualquier extensión): casa-cortinas,
casa-estanterias y casa-cojines, cada una con cinco piezas sobre verde en dos filas (tres arriba y dos abajo):
la de siempre y las cuatro de las habitaciones con tema, en ese orden.

Salida (WebP): public/assets/sprites/casa-mueble-<mueble>-v1.webp, cinco celdas en fila del tamaño exacto de su caja en
la habitación (la de src/game/casaDecoracion.ts). Cada pieza se escala para caber en su caja sin deformarse y se
coloca centrada: las cortinas colgando de arriba (la barra en el borde de arriba) y la estantería y el cojín apoyados
abajo.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-decorar-v2-recorte.py CARPETA_ORIGEN
"""
import importlib.util
import sys
from pathlib import Path

from PIL import Image

_spec = importlib.util.spec_from_file_location("casa_recorte", Path(__file__).with_name("casa-recorte.py"))
casa = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(casa)

# Caja de cada mueble en la escena de 1280 × 540 (ancho, alto) y cómo se apoya en ella.
MUEBLES = {
    "cortinas": {"lamina": "casa-cortinas", "caja": (286, 262), "apoyo": "arriba"},
    "estanteria": {"lamina": "casa-estanterias", "caja": (160, 82), "apoyo": "abajo"},
    "cojin": {"lamina": "casa-cojines", "caja": (150, 72), "apoyo": "abajo"},
}


def piezas(folder, lamina):
    rgba = casa.key_out(casa.load(folder, lamina))
    encontradas = casa.poses(rgba, 5, min_area=4000)
    if len(encontradas) != 5:
        raise SystemExit(f"{lamina}: hay {len(encontradas)} piezas, no 5")
    filas = casa.por_filas(encontradas, [3, 2])
    return [casa.recorte(rgba, p) for fila in filas for p in fila]


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1])
    for mueble, datos in MUEBLES.items():
        ancho, alto = datos["caja"]
        hoja = Image.new("RGBA", (ancho * 5, alto))
        for i, pieza in enumerate(piezas(folder, datos["lamina"])):
            pieza = casa.escalar(pieza, min(ancho / pieza.width, alto / pieza.height))
            y = 0 if datos["apoyo"] == "arriba" else alto - pieza.height
            hoja.alpha_composite(pieza, (i * ancho + (ancho - pieza.width) // 2, y))
        destino = casa.SPRITES / f"casa-mueble-{mueble}-v1.webp"
        hoja.save(destino, "WEBP", quality=casa.QUALITY, method=6)
        print(f"{mueble}: {destino.name} ({hoja.width} × {hoja.height})")


if __name__ == "__main__":
    main()
